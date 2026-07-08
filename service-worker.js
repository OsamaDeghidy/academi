const VERSION='jeza-offline-v5-13-install';
const CORE_CACHE=VERSION+'-core';
const ASSET_CACHE=VERSION+'-assets';
const CORE=['./','index.html','manifest.json','asset-manifest.json','service-worker.js','icons/icon-192.png','icons/icon-512.png','assets/images/brand/baba-logo-full.png','shared/browsersupport.js','shared/player.js'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys
        .filter(k=>k.startsWith('jeza-offline-v') && k !== CORE_CACHE && k !== ASSET_CACHE)
        .map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  const url=new URL(req.url);
  if(url.origin!==location.origin) return;

  event.respondWith((async()=>{
    const cached=await caches.match(req,{ignoreSearch:true});
    if(cached) return cached;

    try{
      const res=await fetch(req);
      if(res&&res.ok){
        const cache=await caches.open(ASSET_CACHE);
        cache.put(req,res.clone()).catch(()=>{});
      }
      return res;
    }catch(err){
      if(req.mode==='navigate'){
        return caches.match('index.html',{ignoreSearch:true});
      }
      throw err;
    }
  })());
});
