import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = (await readFile(new URL('../scripts/service-worker.template.js', import.meta.url), 'utf8')).replace('__VERSION__','test').replace('__ASSETS__',JSON.stringify(['/','/manifest.webmanifest','/_astro/app.hash.js']));
function worker() {
  const handlers={}, entries=new Map(), calls=[];
  let online=true, status=200, skip=false, claimed=false;
  const cache={match:async key=>entries.get(key)?.clone(),put:async(key,response)=>entries.set(key,response),addAll:async requests=>{for(const r of requests) entries.set(new URL(r.url).pathname,new Response('precache'));}};
  class WorkerRequest extends Request { constructor(input, init) {super(typeof input==='string'?new URL(input,'https://example.test/'):input.url,init);} }
  vm.runInNewContext(source,{
    self:{location:{origin:'https://example.test'},addEventListener:(name,handler)=>handlers[name]=handler,skipWaiting:async()=>{skip=true;},clients:{claim:async()=>{claimed=true;}}},
    caches:{open:async()=>cache,keys:async()=>['guitar-workout-old','unrelated'],delete:async key=>{calls.push(['delete',key]);}},
    URL,Request:WorkerRequest,Response,
    fetch:async request=>{calls.push(['fetch',request.url,request.cache]);if(!online)throw Error('offline');return new Response('fresh',{status});},
  });
  return {entries,calls,setOnline:value=>online=value,setStatus:value=>status=value,
    fetch:async(path,mode='navigate')=>{let promise;handlers.fetch({request:{url:'https://example.test'+path,method:'GET',mode},respondWith:value=>promise=value});return promise;},
    lifecycle:async name=>{await new Promise((resolve,reject)=>handlers[name]({waitUntil:promise=>promise.then(resolve,reject)}));return {skip,claimed};},
  };
}
test('online navigation revalidates and replaces stale HTML without a hard refresh',async()=>{
 const w=worker();w.entries.set('/',new Response('stale'));
 assert.equal(await(await w.fetch('/')).text(),'fresh');assert.equal(await w.entries.get('/').clone().text(),'fresh');
 assert.equal(w.calls[0][2],'no-cache');
});
test('offline navigation uses the most recently cached page, including query URLs',async()=>{
 const w=worker();w.entries.set('/exercises/know-your-chords/',new Response('offline exercise'));w.setOnline(false);
 assert.equal(await(await w.fetch('/exercises/know-your-chords?from=home')).text(),'offline exercise');
 assert.equal((await w.fetch('/unknown/')).status,503);
});
test('only hashed assets are cache-first; named assets revalidate',async()=>{
 const w=worker();w.entries.set('/_astro/app.hash.js',new Response('hashed'));w.entries.set('/manifest.webmanifest',new Response('old manifest'));
 assert.equal(await(await w.fetch('/_astro/app.hash.js','cors')).text(),'hashed');assert.equal(w.calls.length,0);
 assert.equal(await(await w.fetch('/manifest.webmanifest','cors')).text(),'fresh');
});
test('new hashed assets are cached for offline use with refreshed pages',async()=>{
 const w=worker();await w.fetch('/_astro/new.hash.js','cors');w.setOnline(false);
 assert.equal(await(await w.fetch('/_astro/new.hash.js','cors')).text(),'fresh');
});
test('server errors fall back to cache; missing routes keep their 404',async()=>{
 const w=worker();w.entries.set('/',new Response('fallback'));w.setStatus(503);assert.equal(await(await w.fetch('/')).text(),'fallback');
 w.setStatus(404);assert.equal((await w.fetch('/')).status,404);
});
test('new workers activate promptly and clean only app caches',async()=>{
 const w=worker();assert.equal((await w.lifecycle('install')).skip,true);assert.equal((await w.lifecycle('activate')).claimed,true);
 assert.deepEqual(w.calls.filter(c=>c[0]==='delete'),[['delete','guitar-workout-old']]);
});
