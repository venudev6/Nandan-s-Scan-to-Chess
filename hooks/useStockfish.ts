/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useRef, useCallback } from 'react';

// The URL for the Stockfish.js engine script.
// We use a CDN version of the ASM.js build, which is compatible with being loaded inside a Blob worker via `importScripts`.
const STOCKFISH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

/**
 * Defines the shape of the state object that this hook exposes.
 * This object contains all the reactive information about the engine that a UI component might need.
 */
export type StockfishState = {
  isReady: boolean;      // Is the engine initialized and ready for commands?
  isThinking: boolean;   // Is the engine currently calculating a move?
  evaluation: number | null; // The position's evaluation in centipawns (from white's perspective).
  isMate: boolean;       // Is the evaluation a forced checkmate?
  bestMove: string | null; // The best move found by the engine in UCI format (e.g., "e2e4").
  depth: number;         // The current search depth of the engine.
  pv: string;            // The "principal variation" - the sequence of moves the engine considers best.
  debugLog: string[];    // A log of messages for debugging purposes.
};

/**
 * A custom React hook to manage an instance of the Stockfish chess engine running in a Web Worker.
 *
 * What is a "Hook"?
 * In React, a hook is a special function that lets you "hook into" React features. For example, `useState`
 * is a hook that lets you add state to a functional component. Custom hooks, like this one, let us
 * bundle up complex logic (like managing an engine) into a reusable, easy-to-use function.
 *
 * What is "Stockfish" and "Web Worker"?
 * Stockfish is a powerful open-source chess engine. To prevent it from freezing the user interface
 * while it's "thinking," we run it in a separate background thread using a "Web Worker." This hook
 * acts as the bridge between our React application and that background worker.
 *
 * What is "UCI"?
 * UCI stands for Universal Chess Interface. It's a standard text-based protocol that allows a GUI
 * (our app) to communicate with a chess engine (Stockfish). We send commands like "position fen ..."
 * and the engine sends back information like "info depth ..." and "bestmove e2e4".
 */
export const useStockfish = () => {
  // A ref to hold the Web Worker instance. A ref is used because the worker is a mutable object
  // that should persist across re-renders without triggering them.
  const workerRef = useRef<Worker | null>(null);
  
  // A ref to store the URL of the Blob created for the worker, so it can be revoked on cleanup.
  const blobUrlRef = useRef<string | null>(null);

  // The main state object for the hook. This is what components will use to display engine info.
  // We use `useState` so that when these values change, any component using this hook will re-render
  // and display the new information (e.g., the latest evaluation).
  const [engineState, setEngineState] = useState<StockfishState>({
    isReady: false,
    isThinking: false,
    evaluation: null,
    isMate: false,
    bestMove: null,
    depth: 0,
    pv: '',
    debugLog: [],
  });

  // A ref to keep track of whose turn it is in the current position. This is used to correctly
  // interpret the engine's evaluation score (which is always from the current player's perspective).
  const turnRef = useRef<'w' | 'b'>('w');
  
  // A ref to hold a callback function. This is used by the "Play vs. Computer" feature.
  // When a best move is found, this callback is executed to make the move on the board.
  // Using a ref prevents stale closures and avoids adding the callback as a dependency to useEffect.
  const onBestMoveCallbackRef = useRef<((move: string) => void) | null>(null);

  // --- Promise-based Readiness System ---
  // A ref to manage the promise and its resolver that signals when the engine is initialized.
  const readyPromiseControlsRef = useRef<{
    promise: Promise<void>;
    resolve: () => void;
  } | null>(null);

  /**
   * A "getter" for the readiness promise. It ensures that only one promise is created
   * for the entire lifecycle of the hook instance. This is a robust pattern that avoids
   * issues with React's Strict Mode and component re-renders.
   */
  const getReadyPromise = () => {
    if (!readyPromiseControlsRef.current) {
        let resolveFn: () => void;
        const promise = new Promise<void>(resolve => {
            resolveFn = resolve;
        });
        readyPromiseControlsRef.current = { promise, resolve: resolveFn! };
    }
    return readyPromiseControlsRef.current.promise;
  };
  
  // A queue for functions that are waiting for a specific message from the engine.
  // This allows `evaluatePosition` to send a command and then synchronously wait for the
  // engine's confirmation ('readyok') before sending the next command. This is key to preventing race conditions.
  const messageWaiterQueueRef = useRef<Array<{ startsWith: string; resolve: (message: string) => void }>>([]);


  /**
   * A memoized function to add a timestamped message to the debug log state.
   * `useCallback` ensures this function is not recreated on every render, which is a performance optimization.
   * @param message The string message to log.
   */
  const logDebug = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    // We use the functional form of setState (`prev => ...`) to ensure we're always working
    // with the latest state, preventing race conditions. We cap the log at 50 entries
    // to avoid performance issues from having too much state.
    setEngineState(prev => ({
      ...prev,
      debugLog: [...prev.debugLog.slice(-50), `${timestamp}: ${message}`],
    }));
  }, []);

  /**
   * A memoized function to parse the 'info' messages sent by Stockfish during analysis.
   * It extracts data like depth, score, and the principal variation (pv).
   * @param message The raw 'info ...' string from the engine.
   */
  const parseInfoMessage = useCallback((message: string) => {
    // We update the state based on the previous state to avoid losing data.
    setEngineState(prev => {
      const parts = message.split(' ');
      // Initialize with previous values
      let depth = prev.depth;
      let scoreCp: number | null = null;
      let scoreMate: number | null = null;
      let pv = prev.pv;

      // Iterate through the message parts to find the data we need.
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'depth') {
          const val = parseInt(parts[i + 1], 10);
          if (!Number.isNaN(val)) depth = val;
        } else if (parts[i] === 'score' && parts[i + 1] === 'cp') { // 'cp' means centipawns
          const val = parseInt(parts[i + 2], 10);
          if (!Number.isNaN(val)) { scoreCp = val; scoreMate = null; }
        } else if (parts[i] === 'score' && parts[i + 1] === 'mate') { // 'mate' means forced checkmate in X moves
          const val = parseInt(parts[i + 2], 10);
          if (!Number.isNaN(val)) { scoreMate = val; scoreCp = null; }
        } else if (parts[i] === 'pv') { // 'pv' is the principal variation
          pv = parts.slice(i + 1).join(' '); // The rest of the message is the PV.
          break; // Nothing useful comes after the PV in an info line.
        }
      }

      // The engine's score is always from the perspective of the side to move.
      // For consistency in our UI, we convert it to always be from White's perspective.
      // A positive score is good for White, a negative score is good for Black.
      let finalScore = scoreMate !== null ? scoreMate : scoreCp;
      if (finalScore !== null && turnRef.current === 'b') {
        finalScore = -finalScore; // Flip the score if it's Black's turn.
      }
      
      logDebug(`[parseInfoMessage] Parsed: Depth=${depth}, Score=${finalScore}, Mate=${scoreMate !== null}, PV=${pv}`);

      // Return the new state object, which will trigger a UI update.
      return {
        ...prev,
        depth,
        evaluation: finalScore !== null ? finalScore : prev.evaluation,
        isMate: scoreMate !== null,
        pv,
      };
    });
  }, [logDebug]);

  /**
   * The main effect for initializing and managing the Web Worker.
   * The empty dependency array `[]` means this runs only once when the component using the hook is mounted.
   */
  useEffect(() => {
    logDebug('[useEffect] Hook mounted. Initializing Stockfish worker...');
    
    // The script that will run inside the Web Worker.
    // It simply loads the main Stockfish engine script from the CDN.
    const workerScript = `
      try {
        importScripts('${STOCKFISH_URL}');
      } catch (e) {
        postMessage('Error: Failed to load stockfish.js from ${STOCKFISH_URL}');
      }
    `;
    logDebug('[useEffect] Worker script created.');

    // Create a Blob from the script string. This allows us to create a worker
    // without needing a separate .js file, which is convenient for this setup.
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlRef.current = blobUrl;
    logDebug('[useEffect] Blob URL created for worker.');

    const worker = new Worker(blobUrl);
    workerRef.current = worker;
    logDebug('[useEffect] Web Worker instance created.');

    /**
     * A helper that creates a Promise which resolves when the engine sends a message
     * that starts with the given string.
     */
    const createMessageWaiter = (startsWith: string): Promise<string> => {
        logDebug(`[createMessageWaiter] Creating a waiter for messages starting with "${startsWith}"`);
        return new Promise(resolve => {
            messageWaiterQueueRef.current.push({ startsWith, resolve });
        });
    };
    
    /**
     * This is the single event handler for all messages received from the worker.
     * It acts as a router, deciding what to do based on the message content.
     */
    worker.onmessage = (event: MessageEvent) => {
      const message = event.data as string;
      logDebug(`[handleMessage] Received raw message: ${String(message)}`);

      // This part allows us to `await` specific messages from the engine.
      // It's crucial for synchronizing commands.
      const waiterIndex = messageWaiterQueueRef.current.findIndex(waiter => message.startsWith(waiter.startsWith));
      if (waiterIndex !== -1) {
        logDebug(`[handleMessage] Message matches a waiter for "${messageWaiterQueueRef.current[waiterIndex].startsWith}". Resolving promise.`);
        // A piece of code is waiting for this message.
        const waiter = messageWaiterQueueRef.current[waiterIndex];
        waiter.resolve(message); // Resolve the promise the code is waiting on.
        messageWaiterQueueRef.current.splice(waiterIndex, 1); // Remove the waiter from the queue.
        // We return here because this message's only purpose was to unblock a waiter.
        return; 
      }
      
      logDebug('[handleMessage] No active waiter found. Processing message normally.');
      // If no code was waiting, process the message normally with our standard handlers.
      if (typeof message === 'string' && message.startsWith('info')) {
        logDebug('[handleMessage] Message is an "info" line. Parsing...');
        parseInfoMessage(message);
      
      // --- THIS IS WHERE THE ENGINE'S FINAL OUTPUT IS HANDLED ---
      } else if (typeof message === 'string' && message.startsWith('bestmove')) {
        logDebug('[handleMessage] Message is a "bestmove" line.');
        const parts = message.split(' ');
        const bestMove = parts[1] || null;
        logDebug(`[handleMessage] Extracted best move: ${bestMove}`);
        setEngineState(prev => ({ ...prev, isThinking: false, bestMove }));

        // If a callback was provided (for "Play vs Computer"), execute it now.
        if (onBestMoveCallbackRef.current && bestMove) {
          logDebug('[handleMessage] Executing onBestMove callback.');
          onBestMoveCallbackRef.current(bestMove);
          onBestMoveCallbackRef.current = null; // Clear the callback, as it's for a single use.
        }
      } else if (typeof message === 'string' && message.startsWith('Error:')) {
        console.error('Error from Stockfish worker:', message);
      } else {
        logDebug(`[handleMessage] Message did not match any known handlers: "${message}"`);
      }
    };
    
    worker.onerror = (error) => {
      logDebug(`[WORKER ERROR]: ${error.message || 'unknown error'}`);
      console.error('Stockfish worker error:', error);
    };

    /**
     * An atomic, async function to handle the entire engine initialization handshake.
     */
    const initializeEngine = async () => {
        logDebug('[initializeEngine] Starting handshake...');
        worker.postMessage('uci');
        await createMessageWaiter('uciok');
        logDebug('[initializeEngine] Received "uciok".');
        
        worker.postMessage('isready');
        await createMessageWaiter('readyok');
        
        // This is the single point where the engine is declared ready for the application.
        logDebug('[initializeEngine] Received initial "readyok". Engine is fully ready.');
        setEngineState(prev => ({ ...prev, isReady: true }));
        // Resolve the readiness promise.
        readyPromiseControlsRef.current?.resolve();
    };
    
    // Ensure we have a promise to resolve before starting initialization.
    getReadyPromise();
    initializeEngine().catch(err => {
        logDebug(`[initializeEngine] FATAL: Handshake failed: ${err}`);
        console.error("Engine initialization failed:", err);
    });

    // This is the cleanup function for the useEffect hook.
    // It runs when the component unmounts to prevent memory leaks.
    return () => {
      logDebug('[useEffect] Cleanup: Terminating Stockfish worker.');
      if (workerRef.current) {
        workerRef.current.terminate(); // Stop the worker thread.
        workerRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current); // Release the memory used by the Blob URL.
        blobUrlRef.current = null;
      }
      // Also reset the promise so a new one is created if the hook is re-mounted.
      readyPromiseControlsRef.current = null;
      logDebug('[useEffect] Cleanup: Readiness promise reset.');
    };
  }, [logDebug, parseInfoMessage]); // These are stable functions from useCallback, so this effect runs only once.

  /**
   * A memoized function to send a command string to the engine worker.
   * This function does NOT wait for readiness itself; the calling function is responsible for that.
   */
  const sendCommand = useCallback((command: string) => {
    if (workerRef.current) {
      logDebug(`[sendCommand] Sending: "${command}"`);
      workerRef.current.postMessage(command);
    } else {
      logDebug(`[sendCommand] ERROR: Engine not available for command: ${command}`);
    }
  }, [logDebug]);

  /**
   * Starts evaluating a given chess position.
   * This is the main function exposed to components for starting analysis or getting a computer move.
   * @param fen The FEN string of the position to evaluate.
   * @param depth The search depth for the engine.
   * @param onComplete An optional callback that will be executed with the best move string when found.
   */
  const evaluatePosition = useCallback(async (fen: string, depth: number, onComplete?: (move: string) => void) => {
    logDebug(`[evaluatePosition] Called with FEN: ${fen}`);

    if (!workerRef.current) {
      logDebug("[evaluatePosition] Aborted: Worker not available.");
      return;
    }
    
    logDebug('[evaluatePosition] Awaiting initial engine readiness...');
    await getReadyPromise();
    logDebug('[evaluatePosition] Initial engine readiness confirmed.');

    /**
     * A helper that creates a Promise which resolves when the engine sends a message
     * that starts with the given string.
     */
    const createMessageWaiter = (startsWith: string): Promise<string> => {
        logDebug(`[createMessageWaiter] Creating a waiter for messages starting with "${startsWith}"`);
        return new Promise(resolve => {
            messageWaiterQueueRef.current.push({ startsWith, resolve });
        });
    };

    if (engineState.isThinking) {
        logDebug("[evaluatePosition] An evaluation is already in progress. Stopping it first.");
        sendCommand('stop');
        const stopWaiter = createMessageWaiter('bestmove');
        logDebug('[evaluatePosition] Awaiting "bestmove" to confirm stop...');
        await stopWaiter;
        logDebug("[evaluatePosition] Previous evaluation stopped successfully.");
    }
    
    onBestMoveCallbackRef.current = onComplete || null;
    logDebug(`[evaluatePosition] onComplete callback ${onComplete ? 'set' : 'not set'}.`);

    turnRef.current = (fen.split(' ')[1] as 'w' | 'b') || 'w';
    logDebug(`[evaluatePosition] Turn set to: ${turnRef.current}`);

    setEngineState(prev => ({ ...prev, isThinking: true, bestMove: null, pv: '', evaluation: null, isMate: false, depth: 0 }));
    logDebug('[evaluatePosition] State set to thinking.');

    try {
        logDebug('[evaluatePosition] Starting sequential command execution.');
        
        sendCommand('ucinewgame');
        
        const newGameReadyPromise = createMessageWaiter('readyok');
        sendCommand('isready');
        logDebug('[evaluatePosition] Awaiting "readyok" for ucinewgame...');
        await newGameReadyPromise;
        logDebug('[evaluatePosition] Received "readyok" for ucinewgame.');

        sendCommand(`position fen ${fen}`);
        
        const positionReadyPromise = createMessageWaiter('readyok');
        sendCommand('isready');
        logDebug('[evaluatePosition] Awaiting "readyok" for position...');
        await positionReadyPromise;
        logDebug('[evaluatePosition] Received "readyok" for position.');

        logDebug(`[evaluatePosition] Sending "go depth ${depth}".`);
        sendCommand(`go depth ${depth}`);
    } catch (error) {
        logDebug(`[evaluatePosition] Error during setup: ${error}`);
        console.error("Error in evaluatePosition:", error);
        setEngineState(prev => ({ ...prev, isThinking: false }));
    }
  }, [sendCommand, logDebug, engineState.isThinking]);

  /**
   * Tells the engine to stop thinking immediately.
   */
  const stopEvaluation = useCallback(() => {
    logDebug('[stopEvaluation] Called.');
    if (engineState.isThinking) {
        sendCommand('stop');
        setEngineState(prev => ({ ...prev, isThinking: false }));
    }
  }, [sendCommand, logDebug, engineState.isThinking]);

  // Expose the engine's state and control functions to the component using the hook.
  return {
    ...engineState,
    evaluatePosition,
    stopEvaluation,
    logDebug,
  };
};
