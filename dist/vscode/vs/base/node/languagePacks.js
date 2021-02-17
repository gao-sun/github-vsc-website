"use strict";function factory(f,s,o,g){function w(t){return new Promise(n=>o.exists(t,n))}function I(t){return new Promise((n,r)=>{const e=new Date;o.utimes(t,e,e,i=>i?r(i):n())})}function J(t){return new Promise((n,r)=>o.lstat(t,(e,i)=>e?r(e):n(i)))}function M(t){return new Promise((n,r)=>o.readdir(t,(e,i)=>e?r(e):n(i)))}function T(t){return new Promise((n,r)=>o.mkdir(t,{recursive:!0},e=>e&&e.code!=="EEXIST"?r(e):n(t)))}function V(t){return new Promise((n,r)=>o.rmdir(t,e=>e?r(e):n(void 0)))}function U(t){return new Promise((n,r)=>o.unlink(t,e=>e?r(e):n(void 0)))}function N(t){return J(t).then(n=>n.isDirectory()&&!n.isSymbolicLink()?M(t).then(r=>Promise.all(r.map(e=>N(s.join(t,e))))).then(()=>V(t)):U(t),n=>{if(n.code!=="ENOENT")throw n})}function _(t){return new Promise(function(n,r){o.readFile(t,"utf8",function(e,i){if(e){r(e);return}n(i)})})}function F(t,n){return new Promise(function(r,e){o.writeFile(t,n,"utf8",function(i){if(i){e(i);return}r()})})}function X(t){const n=s.join(t,"languagepacks.json");try{return f(n)}catch(r){}}function $(t,n){try{for(;n;){if(t[n])return n;{const r=n.lastIndexOf("-");if(r>0)n=n.substring(0,r);else return}}}catch(r){console.error("Resolving language pack configuration failed.",r)}}function z(t,n,r,e){if(e==="pseudo")return Promise.resolve({locale:e,availableLanguages:{},pseudo:!0});if(process.env.VSCODE_DEV)return Promise.resolve({locale:e,availableLanguages:{}});if(e&&(e==="en"||e==="en-us"))return Promise.resolve({locale:e,availableLanguages:{}});const i=e;g.mark("code/willGenerateNls");const u=function(a){return g.mark("code/didGenerateNls"),Promise.resolve({locale:a,availableLanguages:{}})};try{if(!t)return u(i);const a=X(n);if(!a||(e=$(a,e),!e))return u(i);const c=a[e];let y;return!c||typeof c.hash!="string"||!c.translations||typeof(y=c.translations.vscode)!="string"?u(i):w(y).then(A=>{if(!A)return u(i);const O=c.hash+"."+e,d=s.join(n,"clp",O),l=s.join(d,t),S=s.join(d,"tcf.json"),x=s.join(d,"corrupted.info"),C={locale:i,availableLanguages:{"*":e},_languagePackId:O,_translationsConfigFile:S,_cacheRoot:d,_resolvedLanguagePackCoreLocation:l,_corruptedFile:x};return w(x).then(B=>{let b;return B?b=N(d):b=Promise.resolve(void 0),b.then(()=>w(l).then(H=>H?(I(l).catch(()=>{}),g.mark("code/didGenerateNls"),C):T(l).then(()=>Promise.all([_(r),_(y)])).then(m=>{const h=JSON.parse(m[0]),K=JSON.parse(m[1]).contents,Q=Object.keys(h.bundles),v=[];for(const E of Q){const W=h.bundles[E],q=Object.create(null);for(const k of W){const G=h.keys[k],D=h.messages[k],R=K[k];let p;if(R){p=[];for(let P=0;P<G.length;P++){const j=G[P],Y=typeof j=="string"?j:j.key;let L=R[Y];L===void 0&&(L=D[P]),p.push(L)}}else p=D;q[k]=p}v.push(F(s.join(l,E.replace(/\//g,"!")+".nls.json"),JSON.stringify(q)))}return v.push(F(S,JSON.stringify(c.translations))),Promise.all(v)}).then(()=>(g.mark("code/didGenerateNls"),C)).catch(m=>(console.error("Generating translation files failed.",m),u(e)))))})})}catch(a){return console.error("Generating translation files failed.",a),u(e)}}return{getNLSConfiguration:z}}if(typeof define=="function")define(["path","fs","vs/base/common/performance"],function(f,s,o){return factory(require.__$__nodeRequire,f,s,o)});else if(typeof module=="object"&&typeof module.exports=="object"){const f=require("path"),s=require("fs"),o=require("../common/performance");module.exports=factory(require,f,s,o)}else throw new Error("Unknown context");

//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/622cb03f7e070a9670c94bae1a45d78d7181fbd4/core/vs/base/node/languagePacks.js.map