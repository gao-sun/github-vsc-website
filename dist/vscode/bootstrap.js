"use strict";(function(c,s){typeof exports=="object"?module.exports=s():c.MonacoBootstrap=s()})(this,function(){const c=typeof require=="function"?require("module"):void 0,s=typeof require=="function"?require("path"):void 0,u=typeof require=="function"?require("fs"):void 0;Error.stackTraceLimit=100,typeof process!="undefined"&&process.on("SIGPIPE",()=>{console.error(new Error("Unexpected SIGPIPE"))});function _(n){if(!s||!c||typeof process=="undefined"){console.warn("enableASARSupport() is only available in node.js environments");return}let e=n?s.join(n,"node_modules"):void 0;e?process.platform==="win32"&&(e=__dirname.substr(0,1)+e.substr(1)):e=s.join(__dirname,"../node_modules");const o=`${e}.asar`,r=c._resolveLookupPaths;c._resolveLookupPaths=function(p,a){const t=r(p,a);if(Array.isArray(t)){for(let i=0,l=t.length;i<l;i++)if(t[i]===e){t.splice(i,0,o);break}}return t}}function h(n,e){let o=n.replace(/\\/g,"/");o.length>0&&o.charAt(0)!=="/"&&(o=`/${o}`);let r;return e.isWindows&&o.startsWith("//")?r=encodeURI(`${e.scheme||"file"}:${o}`):r=encodeURI(`${e.scheme||"file"}://${e.fallbackAuthority||""}${o}`),r.replace(/#/g,"%23")}function g(){const n=N();let e={availableLanguages:{}};if(n&&n.env.VSCODE_NLS_CONFIG)try{e=JSON.parse(n.env.VSCODE_NLS_CONFIG)}catch(o){}if(e._resolvedLanguagePackCoreLocation){const o=Object.create(null);e.loadBundle=function(r,p,a){const t=o[r];if(t){a(void 0,t);return}S(e._resolvedLanguagePackCoreLocation,`${r.replace(/\//g,"!")}.nls.json`).then(function(i){const l=JSON.parse(i);o[r]=l,a(void 0,l)}).catch(i=>{try{e._corruptedFile&&v(e._corruptedFile,"corrupted").catch(function(l){console.error(l)})}finally{a(i,void 0)}})}}return e}function f(){return(typeof self=="object"?self:typeof global=="object"?global:{}).vscode}function N(){if(typeof process!="undefined")return process;const n=f();if(n)return n.process}function d(){const n=f();if(n)return n.ipcRenderer}async function S(...n){const e=d();if(e)return e.invoke("vscode:readNlsFile",...n);if(u&&s)return(await u.promises.readFile(s.join(...n))).toString();throw new Error("Unsupported operation (read NLS files)")}function v(n,e){const o=d();if(o)return o.invoke("vscode:writeNlsFile",n,e);if(u)return u.promises.writeFile(n,e);throw new Error("Unsupported operation (write NLS files)")}function y(){if(typeof process=="undefined"){console.warn("avoidMonkeyPatchFromAppInsights() is only available in node.js environments");return}process.env.APPLICATION_INSIGHTS_NO_DIAGNOSTIC_CHANNEL=!0,global.diagnosticsSource={}}return{enableASARSupport:_,avoidMonkeyPatchFromAppInsights:y,setupNLS:g,fileUriFromPath:h}});

//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/622cb03f7e070a9670c94bae1a45d78d7181fbd4/core/bootstrap.js.map