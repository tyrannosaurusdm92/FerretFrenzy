(()=>{
  'use strict';
  if(!('serviceWorker' in navigator)) return;
  const script=document.currentScript;
  const sw=new URL('../service-worker.js',script.src);
  addEventListener('load',()=>navigator.serviceWorker.register(sw.href,{scope:new URL('../',script.src).pathname}).catch(err=>console.warn('Ferret Frenzy service worker:',err)));
})();
