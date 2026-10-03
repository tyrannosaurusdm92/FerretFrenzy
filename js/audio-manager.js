(()=>{
  'use strict';
  const script=document.currentScript;
  const root=new URL('../',script.src);
  const urls={
    dance:new URL('assets/audio/ferret_dancing.mp3',root).href,
    night:new URL('assets/audio/ferret.mp3',root).href,
    discussion:new URL('assets/audio/ferret_sound.mp3',root).href,
    chitter:new URL('assets/audio/ferret_sound.mp3',root).href
  };
  const tracks={};
  const BASE_KEYS=new Set(['dance','night','discussion']);
  let master=.45, context='silent', unlocked=false, chitterActive=false;
  function make(key){
    if(tracks[key]) return tracks[key];
    const a=new Audio(urls[key]);
    a.loop=true; a.preload='auto'; a.playsInline=true;
    tracks[key]=a; return a;
  }
  function volumeFor(key){
    const base=key==='dance'?.42:key==='night'?.20:key==='chitter'?.26:.23;
    return Math.max(0,Math.min(1,base*master));
  }
  function stopTrack(key,reset=true){
    const a=tracks[key]; if(!a)return;
    a.pause(); if(reset){try{a.currentTime=0}catch{}}
  }
  function stopBase(except=''){
    Object.entries(tracks).forEach(([k,a])=>{if(BASE_KEYS.has(k)&&k!==except){a.pause();try{a.currentTime=0}catch{}}});
  }
  function stopAll(){Object.keys(tracks).forEach(k=>stopTrack(k));}
  async function playBase(key){
    const a=make(key); a.volume=volumeFor(key); stopBase(key);
    if(!unlocked||master===0) return false;
    try{await a.play();return true}catch{return false}
  }
  async function playChitter(){
    const a=make('chitter');a.volume=volumeFor('chitter');
    if(!unlocked||master===0||!chitterActive)return false;
    try{await a.play();return true}catch{return false}
  }
  function setContext(next){
    context=next||'silent';
    if(context==='lobby'||context==='vote') playBase('dance');
    else if(context==='night'||context==='prep') playBase('night');
    else if(context==='discussion'||context==='morning') playBase('discussion');
    else stopBase();
    document.documentElement.dataset.audioContext=context;
  }
  function setChitterActive(next){
    chitterActive=!!next;
    document.documentElement.dataset.chitter=chitterActive?'active':'silent';
    if(chitterActive)playChitter();else stopTrack('chitter');
  }
  function setMaster(v){
    master=Math.max(0,Math.min(1,Number(v)||0));
    Object.entries(tracks).forEach(([k,a])=>a.volume=volumeFor(k));
    if(master===0)stopAll();else if(unlocked){setContext(context);if(chitterActive)playChitter()}
  }
  function unlock(){
    if(unlocked) return; unlocked=true;
    setContext(context);if(chitterActive)playChitter();
    removeEventListener('pointerdown',unlock,true);removeEventListener('keydown',unlock,true);removeEventListener('touchstart',unlock,true);
  }
  addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);addEventListener('touchstart',unlock,true);
  window.FFAudio={setContext,setMaster,setChitterActive,unlock,getContext:()=>context,isChitterActive:()=>chitterActive,urls};
})();
