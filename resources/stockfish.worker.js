// This script sets up the environment for the Stockfish WebAssembly module
// and acts as the main entry point for the Stockfish worker.

// Queue for UCI commands received before the engine is ready.
const commandQueue = [];
let wasmReady = false;

// Define the Module object. Emscripten's stockfish.js will augment this object.
self.Module = {
    // Override the default print functions to route output back to the main thread.
    print: (text) => self.postMessage(text),
    printErr: (text) => self.postMessage(text),

    // This callback is executed by the Emscripten runtime when the WebAssembly
    // module is compiled, loaded, and ready to be called.
    onRuntimeInitialized: () => {
        // Set the number of threads for the engine, defaulting to 1 if hardwareConcurrency is not available.
        const threads = self.navigator.hardwareConcurrency || 1;
        self.Module.ccall('uci_command', 'number', ['string'], ["setoption name Threads value " + threads]);
        
        // Signal to the main thread that the engine is initialized and ready for the UCI handshake.
        self.postMessage('__init_finished__');

        // Mark the engine as ready and process any commands that were queued before initialization.
        wasmReady = true;
        while (commandQueue.length > 0) {
            const cmd = commandQueue.shift();
            self.Module.ccall('uci_command', 'number', ['string'], [cmd]);
        }
    }
};

// The primary message handler for the worker.
self.onmessage = (e) => {
    const command = e.data;
    // If the engine is ready, send the command immediately.
    // Otherwise, queue it for later processing in onRuntimeInitialized.
    if (wasmReady) {
        self.Module.ccall('uci_command', 'number', ['string'], [command]);
    } else {
        commandQueue.push(command);
    }
};

// Load the Emscripten-generated JavaScript glue code. This will start the
// WebAssembly module loading and initialization process. The Module object
// defined above will be used for configuration.
self.importScripts('stockfish.js');
