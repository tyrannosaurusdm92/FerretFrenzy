const CACHE = 'ferret-frenzy-v25-how-to-play-menu-20261003';
const CORE = [
  './assets/audio/dice-roll.mp3',
  './assets/audio/ferret.mp3',
  './assets/audio/ferret_dancing.mp3',
  './assets/audio/ferret_sound.mp3',
  './json/backend-contract.json',
  './assets/code/frenzy.html',
  './assets/images/Aurora-lit ferret treats bookshelf-1.png',
  './assets/images/Minnow Treats crime scene-2.png',
  './assets/images/apple-touch-icon.png',
  './assets/images/01_Bandit_Sable_Black_Sable_01.jpg',
  './assets/images/02_Bandit_Sable_Black_Sable_02.jpg',
  './assets/images/03_Bandit_Sable_Black_Sable_03.jpg',
  './assets/images/04_Bandit_Sable_Black_Sable_04.jpg',
  './assets/images/05_Dooker_Silver_Mitt_01.jpg',
  './assets/images/06_Itchy_Cinnamon_01.jpg',
  './assets/images/07_Trouble_Champagne_01.jpg',
  './assets/images/08_Business_Roan_01.jpg',
  './assets/images/09_Business_Roan_02.jpg',
  './assets/images/10_Business_Roan_03.jpg',
  './assets/images/11_Business_Roan_04.jpg',
  './assets/images/12_Business_Roan_05.jpg',
  './assets/images/13_Business_Roan_06.jpg',
  './assets/images/14_Business_Roan_07.jpg',
  './assets/images/15_Business_Roan_08.jpg',
  './assets/images/16_Business_Roan_09.jpg',
  './assets/images/17_Business_Roan_10.jpg',
  './assets/images/18_Business_Roan_11.jpg',
  './assets/images/19_Business_Roan_12.jpg',
  './assets/images/20_Business_Roan_13.jpg',
  './assets/images/21_Business_Roan_14.jpg',
  './assets/images/22_Snuggler_Chocolate_01.jpg',
  './assets/images/23_Hunter_Blaze_01.jpg',
  './assets/images/24_Guardian_Dark-Eyed_White_01.jpg',
  './assets/images/frenzy_logo.png',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
  './assets/images/minnow treats.png',
  './css/chat-channels.css',
  './css/components.css',
  './css/dice.css',
  './css/frenzy-game.css',
  './css/frenzy-shell.css',
  './css/lobby.css',
  './css/menu-resize-accessibility.css',
  './css/narrator.css',
  './js/action-queue.js',
  './js/app.js',
  './js/assign-role.js',
  './js/audio-manager.js',
  './js/backend-config.js',
  './js/backend-transport.js',
  './js/bandit-bot.js',
  './js/bot-game-bootstrap.js',
  './js/bot-manager.js',
  './js/cards.js',
  './js/chat-turn-rules.js',
  './js/business-bot.js',
  './js/device-store.js',
  './js/dice.js',
  './js/dooker-bot.js',
  './js/dossier-pass.js',
  './js/ferret-frenzy-api.js',
  './js/ferret-frenzy-bot-core.js',
  './js/ferret-frenzy-bot-manager.js',
  './js/ferret-frenzy-bot-roster.js',
  './js/ferret-frenzy-claim-parser.js',
  './js/ferret-frenzy-constants.js',
  './js/ferret-frenzy-conversation-engine.js',
  './js/ferret-frenzy-deduction-engine.js',
  './js/ferret-frenzy-dice-brain.js',
  './js/ferret-frenzy-memory.js',
  './js/ferret-frenzy-role-brain.js',
  './js/frenzy-game.js',
  './js/frenzy-network.js',
  './js/frenzy-shell.js',
  './js/game-state.js',
  './js/guardian-bot.js',
  './js/hunter-bot.js',
  './js/itchy-bot.js',
  './js/lobby.js',
  './js/menu-resize-accessibility.js',
  './js/local-transport.js',
  './js/mechanics-engine.js',
  './js/minnow-hitbox.js',
  './js/narrator.js',
  './js/protocol.js',
  './js/pwa-register.js',
  './js/reconnect.js',
  './js/revision3-normalizer.js',
  './js/roles.js',
  './js/snuggler-bot.js',
  './js/timers.js',
  './js/transport.js',
  './js/trouble-bot.js',
  './js/utils.js',
  './js/voting.js',
  './json/asset-map.json',
  './json/backend-config.json',
  './json/bandit-bot.json',
  './json/bot-manifest.json',
  './json/chat-channels.json',
  './json/business-bot.json',
  './json/dooker-bot.json',
  './json/ferret-frenzy-base-game.json',
  './json/frenzy-controls.json',
  './json/guardian-bot.json',
  './json/hunter-bot.json',
  './json/itchy-bot.json',
  './json/lobby-config.json',
  './json/mechanics-catalog.json',
  './json/minnow-hitbox.geojson',
  './json/narrator-config.json',
  './json/package-manifest.json',
  './json/protocol-events.json',
  './json/role-assignment.json',
  './json/snuggler-bot.json',
  './json/trouble-bot.json',
  './lobby.html',
  './manifest.webmanifest',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(async url => {
      try { const response = await fetch(url, {cache:'reload'}); if (response && response.ok) await cache.put(url, response.clone()); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE && key.startsWith('ferret-frenzy-')).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  const path=url.pathname.toLowerCase();
  const networkFirst=request.mode==='navigate'||/\.(?:html|js|css|json|geojson)$/.test(path);
  if(networkFirst){
    event.respondWith((async()=>{
      try{const response=await fetch(request,{cache:'no-store'});if(response&&response.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone()).catch(()=>{})}return response}
      catch(_){return(await caches.match(request))||(request.mode==='navigate'?(await caches.match('./lobby.html')):null)||Response.error()}
    })());return;
  }
  event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;try{const response=await fetch(request);if(response&&response.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone()).catch(()=>{})}return response}catch(_){return Response.error()}})());
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING')self.skipWaiting()});
