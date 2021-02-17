const VERSION=1,rootPath=self.location.pathname.replace(/\/service-worker.js$/,""),resourceRoot=rootPath+"/vscode-resource",resolveTimeout=3e4;class RequestStore{constructor(){this.map=new Map}get(e,n){const s=this.map.get(this._key(e,n));return s&&s.promise}create(e,n){const s=this.get(e,n);if(s)return s;let o;const i=new Promise(u=>o=u),a={resolve:o,promise:i},r=this._key(e,n);this.map.set(r,a);const c=()=>{if(clearTimeout(l),this.map.get(r)===a)return this.map.delete(r)},l=setTimeout(c,resolveTimeout);return i}resolve(e,n,s){const o=this.map.get(this._key(e,n));return o?(o.resolve(s),!0):!1}_key(e,n){return`${e}@@@${n}`}}const resourceRequestStore=new RequestStore,localhostRequestStore=new RequestStore,notFound=()=>new Response("Not Found",{status:404});self.addEventListener("message",async t=>{switch(t.data.channel){case"version":{self.clients.get(t.source.id).then(e=>{e&&e.postMessage({channel:"version",version:VERSION})});return}case"did-load-resource":{const e=getWebviewIdForClient(t.source),n=t.data.data,s=n.status===200?{body:n.data,mime:n.mime}:void 0;resourceRequestStore.resolve(e,n.path,s)||console.log("Could not resolve unknown resource",n.path);return}case"did-load-localhost":{const e=getWebviewIdForClient(t.source),n=t.data.data;localhostRequestStore.resolve(e,n.origin,n.location)||console.log("Could not resolve unknown localhost",n.origin);return}}console.log("Unknown message")}),self.addEventListener("fetch",t=>{const e=new URL(t.request.url);if(e.origin===self.origin&&e.pathname.startsWith(resourceRoot+"/"))return t.respondWith(processResourceRequest(t,e));if(e.origin!==self.origin&&e.host.match(/^localhost:(\d+)$/))return t.respondWith(processLocalhostRequest(t,e))}),self.addEventListener("install",t=>{t.waitUntil(self.skipWaiting())}),self.addEventListener("activate",t=>{t.waitUntil(self.clients.claim())});async function processResourceRequest(t,e){const n=await self.clients.get(t.clientId);if(!n)return console.log("Could not find inner client for request"),notFound();const s=getWebviewIdForClient(n),o=e.pathname.startsWith(resourceRoot+"/")?e.pathname.slice(resourceRoot.length):e.pathname;function i(c){return c?new Response(c.body,{status:200,headers:{"Content-Type":c.mime}}):notFound()}const a=await getOuterIframeClient(s);if(!a)return console.log("Could not find parent client for request"),notFound();const r=resourceRequestStore.get(s,o);return r?r.then(i):(a.postMessage({channel:"load-resource",path:o}),resourceRequestStore.create(s,o).then(i))}async function processLocalhostRequest(t,e){const n=await self.clients.get(t.clientId);if(!!n){const s=getWebviewIdForClient(n),o=e.origin,i=c=>{if(!c)return fetch(t.request);const l=t.request.url.replace(new RegExp(`^${e.origin}(/|$)`),`${c}$1`);return new Response(null,{status:302,headers:{Location:l}})},a=await getOuterIframeClient(s);if(!a)return console.log("Could not find parent client for request"),notFound();const r=localhostRequestStore.get(s,o);return r?r.then(i):(a.postMessage({channel:"load-localhost",origin:o}),localhostRequestStore.create(s,o).then(i))}}function getWebviewIdForClient(t){return new URL(t.url).search.match(/\bid=([a-z0-9-]+)/i)[1]}async function getOuterIframeClient(t){return(await self.clients.matchAll({includeUncontrolled:!0})).find(n=>{const s=new URL(n.url);return(s.pathname===`${rootPath}/`||s.pathname===`${rootPath}/index.html`)&&s.search.match(new RegExp("\\bid="+t))})}

//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/622cb03f7e070a9670c94bae1a45d78d7181fbd4/core/vs/workbench/contrib/webview/browser/pre/service-worker.js.map