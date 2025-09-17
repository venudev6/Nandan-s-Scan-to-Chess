// public/workers/stockfish-bootstrap.js
self.Module = self.Module || {};

// ensure the wasm path resolves correctly
Module.locateFile = function(path) {
  if (path.endsWith('.wasm')) return '/resources/stockfish.wasm';
  return '/resources/' + path;
};

// load stockfish glue (served from /resources)
importScripts('/resources/stockfish.js');

// queue if messages arrive before module ready
let queue = [];
let ready = false;

function forwardToModule(msg){
  if (ready && typeof Module.ccall === 'function') {
    Module.ccall('uci_command', 'number', ['string'], [msg]);
  } else {
    queue.push(msg);
  }
}

self.onmessage = (e) => {
  if (e.data === '__check_ready__') {
    self.postMessage(ready ? '__engine_ready__' : '__engine_not_ready__');
    return;
  }
  forwardToModule(e.data);
};

// notify main thread when runtime initialised
Module.onRuntimeInitialized = function() {
  ready = true;
  // flush queue
  while(queue.length) {
    const m = queue.shift();
    Module.ccall('uci_command','number',['string'],[m]);
  }
  // inform main thread
  self.postMessage('__engine_ready__');
};

// forward Module print messages to main thread
Module.print = (text) => postMessage(text);
Module.printErr = (text) => postMessage(text);
