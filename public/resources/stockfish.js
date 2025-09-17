/**
 * @license
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
 * Copyright (c) 2017, 2021, Stockfish developers
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

var Module = typeof Module !== "undefined" ? Module : {};

if (!Module.expectedDataFile) {
  Module.expectedDataFile = 0;
  Module.expectedTotalDecompressDialogs = 0;
}

var stockfish = {};

var is_node = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';

if (is_node) {
  var fs = require('fs');
  var path = require('path');
  var nodeWorker = require('worker_threads');

  Module.locateFile = function(path) {
    if (Module["wasmBinaryFile"]) {
      path = Module["wasmBinaryFile"];
    }

    if (!path.startsWith("/") && !path.startsWith("./") && !path.startsWith("../") && !path.match(/^[a-zA-Z]:\\/)) {
        for (let p of require.main.paths) {
            try {
                fs.accessSync(p + '/' + path, fs.constants.R_OK);
                return p + '/' + path;
            } catch (e) { }
        }
    }
    return path;
  };

  Module.print = function (text) {
    nodeWorker.parentPort.postMessage(text);
  };
  Module.printErr = function (text) {
    nodeWorker.parentPort.postMessage(text);
  };

  nodeWorker.parentPort.on("message", (data) => {
    Module.ccall('uci_command', 'number', ['string'], [data]);
  });
} else {
  self.onmessage = function (e) {
    if (Module.calledRun) {
      Module.ccall('uci_command', 'number', ['string'], [e.data]);
    } else {
      Module.preRun = [];
      Module.preRun.push(function () {
        Module.ccall('uci_command', 'number', ['string'], [e.data]);
      });
    }
  };
  Module.print = function (text) {
    postMessage(text);
  };
  Module.printErr = function (text) {
    postMessage(text);
  };
}


var STACK_SIZE = 5242880;

Module["TOTAL_STACK"] = STACK_SIZE;
Module["TOTAL_MEMORY"] = 1073741824;

Module.onRuntimeInitialized = function() {
  var threads = navigator.hardwareConcurrency || 1;
  Module.ccall('uci_command', 'number', ['string'], ["setoption name Threads value " + threads]);
};

(function() {
  var d;
  if (typeof document !== "undefined" && (d = document.currentScript) && (d = d.src)) {
    Module["wasmBinaryFile"] = d.replace(/\.js$/, ".wasm");
  }
})();

/**
 * @license
 * Copyright 2010 The Emscripten Authors
 * SPDX-License-Identifier: MIT
 */
var Module;
Module || (Module = typeof Module !== "undefined" ? Module : {});
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
    throw toThrow;
  };
var ENVIRONMENT_IS_WEB = typeof window === "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var scriptDirectory = "";
function locateFile(path) {
  if (Module.locateFile) {
    return Module.locateFile(path, scriptDirectory);
  }
  return scriptDirectory + path;
}
var read_, readAsync, readBinary, setWindowTitle;
if (ENVIRONMENT_IS_NODE) {
  var fs = require("fs");
  var nodePath = require("path");
  scriptDirectory = __dirname + "/";
  read_ = (filename, binary) => {
    filename = nodePath.normalize(filename);
    return fs.readFileSync(filename, binary ? null : "utf8");
  };
  readBinary = (filename) => {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    return ret;
  };
  readAsync = (filename, onload, onerror) => {
    filename = nodePath.normalize(filename);
    fs.readFile(filename, function(err, data) {
      if (err) {
        onerror(err);
      } else {
        onload(data.buffer);
      }
    });
  };
  if (process["argv"].length > 1) {
    thisProgram = process["argv"][1].replace(/\\/g, "/");
  }
  arguments_ = process["argv"].slice(2);
  process["on"]("uncaughtException", function(ex) {
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  process["on"]("unhandledRejection", (reason) => {
    throw reason;
  });
  quit_ = (status, toThrow) => {
    if (keepRuntimeAlive()) {
      process["exit"](status);
    }
    throw toThrow;
  };
  Module["inspect"] = function() {
    return "[Emscripten Module object]";
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if (typeof read != "undefined") {
    read_ = (f) => read(f);
  }
  readBinary = (f) => {
    if (typeof readbuffer === "function") {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, "binary");
    return typeof data === "object" ? data : new Uint8Array(data.split("").map((x) => x.charCodeAt(0)));
  };
  readAsync = (f, onload, onerror) => {
    setTimeout(() => onload(readBinary(f)), 0);
  };
  if (typeof scriptArgs != "undefined") {
    arguments_ = scriptArgs;
  } else if (typeof arguments != "undefined") {
    arguments_ = arguments;
  }
  if (typeof quit === "function") {
    quit_ = (status, toThrow) => {
      quit(status);
    };
  }
  if (typeof print !== "undefined") {
    if (typeof console === "undefined") {
      console = {};
    }
    console.log = print;
    console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
  }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (typeof document !== "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }
  if (scriptDirectory.indexOf("blob:") !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
  } else {
    scriptDirectory = "";
  }
  read_ = (url) => {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, false);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
      return new Uint8Array(xhr.response);
    };
  }
  readAsync = (url, onload, onerror) => {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };
  setWindowTitle = (title) => document.title = title;
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module.arguments) {
  arguments_ = Module.arguments;
}
if (Module.thisProgram) {
  thisProgram = Module.thisProgram;
}
if (Module.quit) {
  quit_ = Module.quit;
}
var STACK_ALIGN = 16;
var POINTER_SIZE = 4;
function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - x % multiple;
  }
  return x;
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module["HEAP8"] = HEAP8 = new Int8Array(buf);
  Module["HEAP16"] = HEAP16 = new Int16Array(buf);
  Module["HEAP32"] = HEAP32 = new Int32Array(buf);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}
var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
var wasmTable;
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
  if (Module.preRun) {
    if (typeof Module.preRun == "function") {
      Module.preRun = [Module.preRun];
    }
    while (Module.preRun.length) {
      addOnPreRun(Module.preRun.shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  runtimeExited = true;
}
function postRun() {
  if (Module.postRun) {
    if (typeof Module.postRun == "function") {
      Module.postRun = [Module.postRun];
    }
    while (Module.postRun.length) {
      addOnPostRun(Module.postRun.shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module.monitorRunDependencies) {
    Module.monitorRunDependencies(runDependencies);
  }
}
function removeRunDependency(id) {
  runDependencies--;
  if (Module.monitorRunDependencies) {
    Module.monitorRunDependencies(runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) {
    return 0;
  }
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | u1 & 1023;
    }
    if (u <= 127) {
      if (outIdx >= endIdx) {
        break;
      }
      outU8Array[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) {
        break;
      }
      outU8Array[outIdx++] = 192 | u >> 6;
      outU8Array[outIdx++] = 128 | u & 63;
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) {
        break;
      }
      outU8Array[outIdx++] = 224 | u >> 12;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63;
    } else {
      if (outIdx + 3 >= endIdx) {
        break;
      }
      outU8Array[outIdx++] = 240 | u >> 18;
      outU8Array[outIdx++] = 128 | u >> 12 & 63;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63;
    }
  }
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (heap[endPtr] && !(endPtr >= endIdx)) {
    ++endPtr;
  }
  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    var u0 = heap[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heap[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode((u0 & 31) << 6 | u1);
      continue;
    }
    var u2 = heap[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = (u0 & 15) << 12 | u1 << 6 | u2;
    } else {
      u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
    }
  }
  return str;
}
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}
var demangle, demangleAll;
var wasmInstance;
var wasmMemory;
addOnInit(() => {
  if (Module.wasmInstance) {
    wasmInstance = Module.wasmInstance;
    wasmMemory = wasmInstance.exports["memory"];
    updateGlobalBufferAndViews(wasmMemory.buffer);
    wasmTable = wasmInstance.exports["__indirect_function_table"];
  } else {
    err("Must load WebAssembly Module in to 'wasmInstance' before adding 'onInit' callbacks");
  }
});
function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == "function") {
      callback(Module);
      continue;
    }
    var func = callback.func;
    if (typeof func === "number") {
      if (callback.arg === undefined) {
        getWasmTableEntry(func)();
      } else {
        getWasmTableEntry(func)(callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var wasmjsFuncs = [function() {
  var ___wasm_call_ctors = Module["___wasm_call_ctors"];
  ___wasm_call_ctors();
}, (memory) => {
  wasmMemory = memory;
  updateGlobalBufferAndViews(wasmMemory.buffer);
}, (table) => {
  wasmTable = table;
}];
var functionPointers = [];
function addFunction(func, sig) {
  var base = 0;
  for (var i = 0; i < functionPointers.length; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return base + i;
    }
  }
  var newBase = functionPointers.length;
  functionPointers.push(func);
  return base + newBase;
}
function getWasmTableEntry(funcPtr) {
  return wasmTable.get(funcPtr);
}
var wasmImports = {
  "a": wasmjsFuncs[0],
  "b": wasmjsFuncs[1],
  "c": wasmjsFuncs[2]
};
var asm = {
  "f": () => {
    return 1073741824;
  },
  "g": () => {
    return 5242880;
  },
  "e": () => {
    out("uciok");
  },
  "d": (p) => {
    addOnPreMain(getWasmTableEntry(p));
  }
};
var info = {
  "a": wasmImports,
  "b": asm
};
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}
var calledRun;
dependenciesFulfilled = function runCaller() {
  if (!calledRun) {
    run();
  }
  if (!calledRun) {
    dependenciesFulfilled = runCaller;
  }
};
function run(args) {
  args = args || arguments_;
  if (runDependencies > 0) {
    return;
  }
  preRun();
  if (runDependencies > 0) {
    return;
  }
  function doRun() {
    if (calledRun) {
      return;
    }
    calledRun = true;
    Module["calledRun"] = true;
    if (runtimeExited) {
      return;
    }
    initRuntime();
    preMain();
    if (Module["onRuntimeInitialized"]) {
      Module["onRuntimeInitialized"]();
    }
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function() {
      setTimeout(function() {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module["run"] = run;
function checkIncomingModuleAPI() {
  if (Module.preRun || Module.postRun || Module.arguments || Module.thisProgram || Module.quit) {
    err("warning: Module properties preRun, postRun, arguments, thisProgram, quit will be removed in upcoming releases. It is recommended to use addOnPreRun, addOnPostRun, etc. instead. See the wiki for details.");
  }
}
checkIncomingModuleAPI();
if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function") {
    Module["preInit"] = [Module["preInit"]];
  }
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}
run();

(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports === "object") {
    module.exports = factory(stockfish);
  } else {
    root.Stockfish = factory(stockfish);
  }
})(this, function() {
  return Module;
});