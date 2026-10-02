(()=>{
  'use strict';
  const script=document.currentScript;
  const root=new URL('../',script.src);
  const urls={
    dance:new URL('assets/audio/ferret_dancing.mp3',root).href,
    night:new URL('assets/audio/ferret.mp3',root).href,
    discussion:new URL('assets/audio/ferret_sound.mp3',root).href
  };
  const tracks={};
  let master=.45, context='silent', unlocked=false;
  function make(key){
    if(tracks[key]) return tracks[key];
    const a=new Audio(urls[key]);
    a.loop=true; a.preload='auto'; a.playsInline=true;
    tracks[key]=a; return a;
  }
  function volumeFor(key){
    const base=key==='dance'?.42:key==='night'?.20:.23;
    return Math.max(0,Math.min(1,base*master));
  }
  function stopAll(except=''){
    Object.entries(tracks).forEach(([k,a])=>{if(k!==except){a.pause();try{a.currentTime=0}catch{}}});
  }
  async function play(key){
    const a=make(key); a.volume=volumeFor(key); stopAll(key);
    if(!unlocked) return false;
    try{await a.play();return true}catch{return false}
  }
  function setContext(next){
    context=next||'silent';
    if(context==='lobby'||context==='vote') play('dance');
    else if(context==='night'||context==='prep') play('night');
    else if(context==='discussion'||context==='morning') play('discussion');
    else stopAll();
    document.documentElement.dataset.audioContext=context;
  }
  function setMaster(v){master=Math.max(0,Math.min(1,Number(v)||0));Object.entries(tracks).forEach(([k,a])=>a.volume=volumeFor(k));if(master===0)stopAll();else if(unlocked)setContext(context)}
  function unlock(){
    if(unlocked) return; unlocked=true;
    setContext(context);
    removeEventListener('pointerdown',unlock,true);removeEventListener('keydown',unlock,true);removeEventListener('touchstart',unlock,true);
  }
  addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);addEventListener('touchstart',unlock,true);
  window.FFAudio={setContext,setMaster,unlock,getContext:()=>context,urls};
})();
