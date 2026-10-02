(()=>{
'use strict';
const TOTAL_HOURS=12, SECONDS_PER_HOUR=60, TOTAL_SECONDS=TOTAL_HOURS*SECONDS_PER_HOUR;
let gameStarted=false, gameComplete=false, paused=false, elapsedStored=0, runStartedAt=0, timerHandle=0;
let latestDice=null;
let privateInfo={role:'—',wakeSchedule:[],treatStates:[],coWakers:[],facts:[]};
let roleAction={available:false,label:'Role action'};
const params=new URLSearchParams(location.search);
const room=params.get('room')||'local'; const device=params.get('device')||'device';
const NOTE_KEY='ferret-frenzy:notebook:'+room+':'+device;
function emit(type,detail={}){window.dispatchEvent(new CustomEvent('ferret-frenzy-action',{detail:{type,...detail}}))}
function qs(id){return document.getElementById(id)}
function elapsedSeconds(){const live=(gameStarted&&!paused&&!gameComplete&&runStartedAt)?(performance.now()-runStartedAt)/1000:0;return Math.min(TOTAL_SECONDS,elapsedStored+live)}
function renderTimer(){
 const h=qs('timerHour'),c=qs('timerCountdown'),s=qs('timerState'),box=qs('gameTimer'); if(!h||!c||!s)return;
 const elapsed=elapsedSeconds();
 if(elapsed>=TOTAL_SECONDS){
   if(!gameComplete){elapsedStored=TOTAL_SECONDS;gameComplete=true;gameStarted=false;runStartedAt=0;emit('burrowClockComplete',{nextPhase:'morning_business',hours:12,minutes:12})}
   h.textContent='MORNING BUSINESS';c.textContent='00:00';s.textContent='DISCUSS · THEN PAW POINT';box?.setAttribute('data-phase','morning');
   document.querySelectorAll('[data-start-game]').forEach(b=>{b.textContent='RESTART GAME';b.disabled=false});
   return;
 }
 box?.setAttribute('data-phase','night');
 const hour=Math.floor(elapsed/SECONDS_PER_HOUR)+1, within=elapsed%SECONDS_PER_HOUR, remaining=Math.max(1,Math.ceil(SECONDS_PER_HOUR-within));
 h.textContent='HOUR '+hour+' / 12';c.textContent='00:'+String(remaining).padStart(2,'0');
 s.textContent=!gameStarted?'READY · PRESS START GAME':paused?'PAUSED':'NIGHT · 60 SEC = 1 HOUR';
}
function tick(){renderTimer();if(gameComplete&&timerHandle){clearInterval(timerHandle);timerHandle=0}}
function start(){elapsedStored=0;runStartedAt=performance.now();gameStarted=true;gameComplete=false;paused=false;document.getElementById('ferretFrenzyShell')?.setAttribute('data-game-state','playing');document.querySelectorAll('[data-start-game]').forEach(b=>{b.textContent='GAME RUNNING';b.disabled=true});if(!timerHandle)timerHandle=setInterval(tick,125);renderTimer();emit('startGame',{durationSeconds:TOTAL_SECONDS,intervalSeconds:60,intervalCount:12,phase:'night'})}
function reset(){elapsedStored=0;runStartedAt=0;gameStarted=false;gameComplete=false;paused=false;if(timerHandle){clearInterval(timerHandle);timerHandle=0}document.querySelectorAll('[data-start-game]').forEach(b=>{b.textContent='START GAME';b.disabled=false});document.getElementById('ferretFrenzyShell')?.setAttribute('data-game-state','playing');renderTimer();emit('resetGame')}
function setPaused(next){next=!!next;if(next===paused)return;if(next&&gameStarted&&!gameComplete&&runStartedAt){elapsedStored=elapsedSeconds();runStartedAt=0}paused=next;if(!paused&&gameStarted&&!gameComplete)runStartedAt=performance.now();document.getElementById('ferretFrenzyShell')?.setAttribute('data-game-state',paused?'paused':'playing');renderTimer();emit(paused?'pauseGame':'resumeGame',{elapsedSeconds:elapsedSeconds()})}
function confirmLatestDice(){if(!latestDice){emit('confirmResult',{ok:false,reason:'no-result'});return {ok:false,reason:'no-result'}};latestDice.locked=true;emit('confirmResult',{ok:true,die:latestDice.die,value:latestDice.value,private:true});return {ok:true,...latestDice}}
function setPrivateInfo(next={}){privateInfo={...privateInfo,...next};renderPrivateInfo();emit('privateInfoUpdated',{private:true})}
function renderList(id,items,empty='—'){const el=qs(id);if(!el)return;el.innerHTML='';const a=Array.isArray(items)?items:[];if(!a.length){const li=document.createElement('li');li.textContent=empty;el.append(li);return}a.forEach(v=>{const li=document.createElement('li');li.textContent=typeof v==='string'?v:JSON.stringify(v);el.append(li)})}
function renderPrivateInfo(){qs('privateRole')&&(qs('privateRole').textContent=privateInfo.role||'—');renderList('privateWakeSchedule',privateInfo.wakeSchedule);renderList('privateTreatStates',privateInfo.treatStates);renderList('privateCoWakers',privateInfo.coWakers);renderList('privateFacts',privateInfo.facts)}
function setRoleActionAvailable(available,label='Role action'){roleAction={available:!!available,label};const x=document.querySelector('.action[data-key="X"]');if(x){x.setAttribute('aria-disabled',String(!roleAction.available));x.querySelector('small').textContent=roleAction.available?'ROLE ACTION':'ROLE ACTION'}}
function triggerRoleAction(){if(!roleAction.available){emit('roleAction',{ok:false,reason:'unavailable'});return false}emit('roleAction',{ok:true,label:roleAction.label});return true}
function loadNotebook(){try{return localStorage.getItem(NOTE_KEY)||''}catch{return ''}}
function saveNotebook(value){try{localStorage.setItem(NOTE_KEY,String(value||''))}catch{}emit('notebookSaved',{private:true})}
function snapshot(){return {gameStarted,gameComplete,paused,elapsedSeconds:elapsedSeconds(),hour:Math.min(12,Math.floor(elapsedSeconds()/60)+1),privateInfo:{...privateInfo},roleAction:{...roleAction},latestDice:latestDice?{...latestDice}:null}}
addEventListener('ferret-frenzy-action',e=>{if(e.detail?.type==='diceResult'){latestDice={die:e.detail.die,value:e.detail.value,locked:true,at:e.detail.at||Date.now(),private:true}}});
const api={start,reset,setPaused,togglePause:()=>setPaused(!paused),isPaused:()=>paused,isStarted:()=>gameStarted,isComplete:()=>gameComplete,renderTimer,confirmLatestDice,setPrivateInfo,renderPrivateInfo,setRoleActionAvailable,triggerRoleAction,loadNotebook,saveNotebook,snapshot,TOTAL_HOURS,SECONDS_PER_HOUR};
window.FerretFrenzyGame=api;
renderTimer();renderPrivateInfo();
})();
