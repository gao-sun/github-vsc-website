!function(t,n){"object"==typeof exports&&"object"==typeof module?module.exports=n():"function"==typeof define&&define.amd?define([],n):"object"==typeof exports?exports.onig=n():t.onig=n()}(this,(function(){return function(t){var n={};function e(r){if(n[r])return n[r].exports;var i=n[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,e),i.l=!0,i.exports}return e.m=t,e.c=n,e.d=function(t,n,r){e.o(t,n)||Object.defineProperty(t,n,{enumerable:!0,get:r})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,n){if(1&n&&(t=e(t)),8&n)return t;if(4&n&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(e.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&n&&"string"!=typeof t)for(var i in t)e.d(r,i,function(n){return t[n]}.bind(null,i));return r},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},e.p="",e(e.s=0)}([function(t,n,e){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(n,"__esModule",{value:!0}),n.setDefaultDebugCall=n.createOnigScanner=n.createOnigString=n.loadWASM=n.OnigScanner=n.OnigString=void 0;const i=r(e(1));let o=null,a=!1;class f{constructor(t){const n=t.length,e=f._utf8ByteLength(t),r=e!==n,i=r?new Uint32Array(n+1):null;r&&(i[n]=e);const o=r?new Uint32Array(e+1):null;r&&(o[e]=n);const a=new Uint8Array(e);let u=0;for(let e=0;e<n;e++){const f=t.charCodeAt(e);let s=f,c=!1;if(f>=55296&&f<=56319&&e+1<n){const n=t.charCodeAt(e+1);n>=56320&&n<=57343&&(s=65536+(f-55296<<10)|n-56320,c=!0)}r&&(i[e]=u,c&&(i[e+1]=u),s<=127?o[u+0]=e:s<=2047?(o[u+0]=e,o[u+1]=e):s<=65535?(o[u+0]=e,o[u+1]=e,o[u+2]=e):(o[u+0]=e,o[u+1]=e,o[u+2]=e,o[u+3]=e)),s<=127?a[u++]=s:s<=2047?(a[u++]=192|(1984&s)>>>6,a[u++]=128|(63&s)>>>0):s<=65535?(a[u++]=224|(61440&s)>>>12,a[u++]=128|(4032&s)>>>6,a[u++]=128|(63&s)>>>0):(a[u++]=240|(1835008&s)>>>18,a[u++]=128|(258048&s)>>>12,a[u++]=128|(4032&s)>>>6,a[u++]=128|(63&s)>>>0),c&&e++}this.utf16Length=n,this.utf8Length=e,this.utf16Value=t,this.utf8Value=a,this.utf16OffsetToUtf8=i,this.utf8OffsetToUtf16=o}static _utf8ByteLength(t){let n=0;for(let e=0,r=t.length;e<r;e++){const i=t.charCodeAt(e);let o=i,a=!1;if(i>=55296&&i<=56319&&e+1<r){const n=t.charCodeAt(e+1);n>=56320&&n<=57343&&(o=65536+(i-55296<<10)|n-56320,a=!0)}n+=o<=127?1:o<=2047?2:o<=65535?3:4,a&&e++}return n}createString(t){const n=t._malloc(this.utf8Length);return t.HEAPU8.set(this.utf8Value,n),n}}class u{constructor(t){if(this.id=++u.LAST_ID,!o)throw new Error("Must invoke loadWASM first.");this._onigBinding=o,this.content=t;const n=new f(t);this.utf16Length=n.utf16Length,this.utf8Length=n.utf8Length,this.utf16OffsetToUtf8=n.utf16OffsetToUtf8,this.utf8OffsetToUtf16=n.utf8OffsetToUtf16,this.utf8Length<1e4&&!u._sharedPtrInUse?(u._sharedPtr||(u._sharedPtr=o._malloc(1e4)),u._sharedPtrInUse=!0,o.HEAPU8.set(n.utf8Value,u._sharedPtr),this.ptr=u._sharedPtr):this.ptr=n.createString(o)}convertUtf8OffsetToUtf16(t){return this.utf8OffsetToUtf16?t<0?0:t>this.utf8Length?this.utf16Length:this.utf8OffsetToUtf16[t]:t}convertUtf16OffsetToUtf8(t){return this.utf16OffsetToUtf8?t<0?0:t>this.utf16Length?this.utf8Length:this.utf16OffsetToUtf8[t]:t}dispose(){this.ptr===u._sharedPtr?u._sharedPtrInUse=!1:this._onigBinding._free(this.ptr)}}n.OnigString=u,u.LAST_ID=0,u._sharedPtr=0,u._sharedPtrInUse=!1;class s{constructor(t){if(!o)throw new Error("Must invoke loadWASM first.");const n=[],e=[];for(let r=0,i=t.length;r<i;r++){const i=new f(t[r]);n[r]=i.createString(o),e[r]=i.utf8Length}const r=o._malloc(4*t.length);o.HEAPU32.set(n,r/4);const i=o._malloc(4*t.length);o.HEAPU32.set(e,i/4);const a=o._createOnigScanner(r,i,t.length);for(let e=0,r=t.length;e<r;e++)o._free(n[e]);o._free(i),o._free(r),0===a&&function(t){throw new Error(t.UTF8ToString(t._getLastOnigError()))}(o),this._onigBinding=o,this._ptr=a}dispose(){this._onigBinding._freeOnigScanner(this._ptr)}findNextMatchSync(t,n,e){let r=!1,i=0;if("number"==typeof e?(8&e&&(r=!0),i=e):"boolean"==typeof e&&(r=e),"string"==typeof t){t=new u(t);const e=this._findNextMatchSync(t,n,r,i);return t.dispose(),e}return this._findNextMatchSync(t,n,r,i)}_findNextMatchSync(t,n,e,r){const i=this._onigBinding;let o;if(o=e?i._findNextOnigScannerMatchDbg(this._ptr,t.id,t.ptr,t.utf8Length,t.convertUtf16OffsetToUtf8(n),r):i._findNextOnigScannerMatch(this._ptr,t.id,t.ptr,t.utf8Length,t.convertUtf16OffsetToUtf8(n),r),0===o)return null;const a=i.HEAPU32;let f=o/4;const u=a[f++],s=a[f++];let c=[];for(let n=0;n<s;n++){const e=t.convertUtf8OffsetToUtf16(a[f++]),r=t.convertUtf8OffsetToUtf16(a[f++]);c[n]={start:e,end:r,length:r-e}}return{index:u,captureIndices:c}}}n.OnigScanner=s;let c=!1;n.loadWASM=function(t){if(c)throw new Error("Cannot invoke loadWASM more than once.");let n,e,r,a;c=!0,t instanceof ArrayBuffer||t instanceof Response?n=t:(n=t.data,e=t.print);const f=new Promise((t,n)=>{r=t,a=n});let u;return u=n instanceof ArrayBuffer?function(t){return n=>WebAssembly.instantiate(t,n)}(n):n instanceof Response&&"function"==typeof WebAssembly.instantiateStreaming?function(t){return n=>WebAssembly.instantiateStreaming(t,n)}(n):function(t){return async n=>{const e=await t.arrayBuffer();return WebAssembly.instantiate(e,n)}}(n),function(t,n,e,r){i.default({print:n,instantiateWasm:(n,e)=>{if("undefined"==typeof performance){const t=()=>Date.now();n.env.emscripten_get_now=t,n.wasi_snapshot_preview1.emscripten_get_now=t}return t(n).then(t=>e(t.instance),r),{}}}).then(t=>{o=t,e()})}(u,e,r,a),f},n.createOnigString=function(t){return new u(t)},n.createOnigScanner=function(t){return new s(t)},n.setDefaultDebugCall=function(t){a=t}},function(t,n,e){var r=function(){"undefined"!=typeof document&&document.currentScript&&document.currentScript.src;return function(t){var n,e,r=void 0!==(t=t||{})?t:{};r.ready=new Promise((function(t,r){n=t,e=r}));var i,o={};for(i in r)r.hasOwnProperty(i)&&(o[i]=r[i]);var a,f=[],u=!1,s=!1,c=!0,l="";function p(t){return r.locateFile?r.locateFile(t,l):l+t}c&&("undefined"!=typeof read&&function(t){return read(t)},a=function(t){var n;return"function"==typeof readbuffer?new Uint8Array(readbuffer(t)):(b("object"==typeof(n=read(t,"binary"))),n)},"undefined"!=typeof scriptArgs?f=scriptArgs:void 0!==arguments&&(f=arguments),"function"==typeof quit&&function(t){quit(t)},"undefined"!=typeof onig_print&&("undefined"==typeof console&&(console={}),console.log=onig_print,console.warn=console.error="undefined"!=typeof printErr?printErr:onig_print));var d=r.print||console.log.bind(console),h=r.printErr||console.warn.bind(console);for(i in o)o.hasOwnProperty(i)&&(r[i]=o[i]);o=null,r.arguments&&(f=r.arguments),r.thisProgram&&r.thisProgram,r.quit&&r.quit;var g,m,y,_=function(t){t};r.wasmBinary&&(g=r.wasmBinary),r.noExitRuntime&&r.noExitRuntime,"object"!=typeof WebAssembly&&Y("no native wasm support detected");var v=!1;function b(t,n){t||Y("Assertion failed: "+n)}var w="undefined"!=typeof TextDecoder?new TextDecoder("utf8"):void 0;function S(t,n,e){for(var r=n+e,i=n;t[i]&&!(i>=r);)++i;if(i-n>16&&t.subarray&&w)return w.decode(t.subarray(n,i));for(var o="";n<i;){var a=t[n++];if(128&a){var f=63&t[n++];if(192!=(224&a)){var u=63&t[n++];if((a=224==(240&a)?(15&a)<<12|f<<6|u:(7&a)<<18|f<<12|u<<6|63&t[n++])<65536)o+=String.fromCharCode(a);else{var s=a-65536;o+=String.fromCharCode(55296|s>>10,56320|1023&s)}}else o+=String.fromCharCode((31&a)<<6|f)}else o+=String.fromCharCode(a)}return o}function A(t,n){return t?S(U,t,n):""}"undefined"!=typeof TextDecoder&&new TextDecoder("utf-16le");var O,U,P,M=65536;function x(t,n){return t%n>0&&(t+=n-t%n),t}function T(t){O=t,r.HEAP8=new Int8Array(t),r.HEAP16=new Int16Array(t),r.HEAP32=P=new Int32Array(t),r.HEAPU8=U=new Uint8Array(t),r.HEAPU16=new Uint16Array(t),r.HEAPU32=new Uint32Array(t),r.HEAPF32=new Float32Array(t),r.HEAPF64=new Float64Array(t)}var R=r.INITIAL_MEMORY||16777216;(m=r.wasmMemory?r.wasmMemory:new WebAssembly.Memory({initial:R/M,maximum:2147483648/M}))&&(O=m.buffer),R=O.byteLength,T(O);var E=[],L=[],I=[],W=[];function C(){if(r.preRun)for("function"==typeof r.preRun&&(r.preRun=[r.preRun]);r.preRun.length;)k(r.preRun.shift());nt(E)}function D(){!0,nt(L)}function j(){nt(I)}function N(){if(r.postRun)for("function"==typeof r.postRun&&(r.postRun=[r.postRun]);r.postRun.length;)B(r.postRun.shift());nt(W)}function k(t){E.unshift(t)}function B(t){W.unshift(t)}var H=0,F=null,q=null;function V(t){H++,r.monitorRunDependencies&&r.monitorRunDependencies(H)}function z(t){if(H--,r.monitorRunDependencies&&r.monitorRunDependencies(H),0==H&&(null!==F&&(clearInterval(F),F=null),q)){var n=q;q=null,n()}}function Y(t){r.onAbort&&r.onAbort(t),h(t+=""),v=!0,1,t="abort("+t+"). Build with -s ASSERTIONS=1 for more info.";var n=new WebAssembly.RuntimeError(t);throw e(n),n}function G(t,n){return String.prototype.startsWith?t.startsWith(n):0===t.indexOf(n)}r.preloadedImages={},r.preloadedAudios={};var J="data:application/octet-stream;base64,";function K(t){return G(t,J)}var Q,X="onig.wasm";function Z(){try{if(g)return new Uint8Array(g);if(a)return a(X);throw"both async and sync fetching of the wasm failed"}catch(t){Y(t)}}function $(){return g||!u&&!s||"function"!=typeof fetch?Promise.resolve().then(Z):fetch(X,{credentials:"same-origin"}).then((function(t){if(!t.ok)throw"failed to load wasm binary file at '"+X+"'";return t.arrayBuffer()})).catch((function(){return Z()}))}function tt(){var t={env:ct,wasi_snapshot_preview1:ct};function n(t,n){var e=t.exports;r.asm=e,y=r.asm.__indirect_function_table,z()}function e(t){n(t.instance)}function i(n){return $().then((function(n){return WebAssembly.instantiate(n,t)})).then(n,(function(t){h("failed to asynchronously prepare wasm: "+t),Y(t)}))}if(V(),r.instantiateWasm)try{return r.instantiateWasm(t,n)}catch(t){return h("Module.instantiateWasm callback failed with error: "+t),!1}return function(){if(g||"function"!=typeof WebAssembly.instantiateStreaming||K(X)||"function"!=typeof fetch)return i(e);fetch(X,{credentials:"same-origin"}).then((function(n){return WebAssembly.instantiateStreaming(n,t).then(e,(function(t){return h("wasm streaming compile failed: "+t),h("falling back to ArrayBuffer instantiation"),i(e)}))}))}(),{}}function nt(t){for(;t.length>0;){var n=t.shift();if("function"!=typeof n){var e=n.func;"number"==typeof e?void 0===n.arg?y.get(e)():y.get(e)(n.arg):e(void 0===n.arg?null:n.arg)}else n(r)}}function et(t,n,e){U.copyWithin(t,n,n+e)}function rt(){return U.length}function it(t){try{return m.grow(t-O.byteLength+65535>>>16),T(m.buffer),1}catch(t){}}function ot(t){t>>>=0;var n=rt();if(t>2147483648)return!1;for(var e=1;e<=4;e*=2){var r=n*(1+.2/e);if(r=Math.min(r,t+100663296),it(Math.min(2147483648,x(Math.max(16777216,t,r),65536))))return!0}return!1}K(X)||(X=p(X)),Q="undefined"!=typeof dateNow?dateNow:function(){return performance.now()};var at={mappings:{},buffers:[null,[],[]],printChar:function(t,n){var e=at.buffers[t];0===n||10===n?((1===t?d:h)(S(e,0)),e.length=0):e.push(n)},varargs:void 0,get:function(){return at.varargs+=4,P[at.varargs-4>>2]},getStr:function(t){return A(t)},get64:function(t,n){return t}};function ft(t,n,e,r){for(var i=0,o=0;o<e;o++){for(var a=P[n+8*o>>2],f=P[n+(8*o+4)>>2],u=0;u<f;u++)at.printChar(t,U[a+u]);i+=f}return P[r>>2]=i,0}function ut(t){_(0|t)}L.push({func:function(){lt()}});var st,ct={emscripten_get_now:Q,emscripten_memcpy_big:et,emscripten_resize_heap:ot,fd_write:ft,memory:m,setTempRet0:ut},lt=(tt(),r.___wasm_call_ctors=function(){return(lt=r.___wasm_call_ctors=r.asm.__wasm_call_ctors).apply(null,arguments)});r._malloc=function(){return(r._malloc=r.asm.malloc).apply(null,arguments)},r._free=function(){return(r._free=r.asm.free).apply(null,arguments)},r.___errno_location=function(){return(r.___errno_location=r.asm.__errno_location).apply(null,arguments)},r._getLastOnigError=function(){return(r._getLastOnigError=r.asm.getLastOnigError).apply(null,arguments)},r._createOnigScanner=function(){return(r._createOnigScanner=r.asm.createOnigScanner).apply(null,arguments)},r._freeOnigScanner=function(){return(r._freeOnigScanner=r.asm.freeOnigScanner).apply(null,arguments)},r._findNextOnigScannerMatch=function(){return(r._findNextOnigScannerMatch=r.asm.findNextOnigScannerMatch).apply(null,arguments)},r._findNextOnigScannerMatchDbg=function(){return(r._findNextOnigScannerMatchDbg=r.asm.findNextOnigScannerMatchDbg).apply(null,arguments)},r.stackSave=function(){return(r.stackSave=r.asm.stackSave).apply(null,arguments)},r.stackRestore=function(){return(r.stackRestore=r.asm.stackRestore).apply(null,arguments)},r.stackAlloc=function(){return(r.stackAlloc=r.asm.stackAlloc).apply(null,arguments)},r.dynCall_jiji=function(){return(r.dynCall_jiji=r.asm.dynCall_jiji).apply(null,arguments)};function pt(t){function e(){st||(st=!0,r.calledRun=!0,v||(D(),j(),n(r),r.onRuntimeInitialized&&r.onRuntimeInitialized(),N()))}t=t||f,H>0||(C(),H>0||(r.setStatus?(r.setStatus("Running..."),setTimeout((function(){setTimeout((function(){r.setStatus("")}),1),e()}),1)):e()))}if(r.UTF8ToString=A,q=function t(){st||pt(),st||(q=t)},r.run=pt,r.preInit)for("function"==typeof r.preInit&&(r.preInit=[r.preInit]);r.preInit.length>0;)r.preInit.pop()();return!0,pt(),t.ready}}();t.exports=r}])}));