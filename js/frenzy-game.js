(()=>{
'use strict';
const SECONDS_PER_HOUR=60,TOTAL_HOURS=12;
let phase='LOADING',currentHour=0,hourStartedAt=0,isHost=false,paused=false,pauseStartedAt=0,waitingForActions=false,timerHandle=0,lastExpiredKey='';
let latestDice=null,privateInfo={role:'—',wakeSchedule:[],treatStates:[],coWakers:[],facts:[]},roleAction={available:false,label:'Role action'};
const params=new URLSearchParams(location.search),room=params.get('room')||'local',device=params.get('device')||'device',NOTE_KEY='ferret-frenzy:notebook:'+room+':'+device;
const qs=id=>document.getElementById(id);
function emit(type,detail={}){window.dispatchEvent(new CustomEvent('ferret-frenzy-action',{detail:{type,...detail}}))}
function phaseLabel(){if(phase==='LOBBY')return['LOBBY','--:--','WAITING FOR HOST'];if(phase==='PREP')return['PRIVATE SETUP','--:--','REVEAL CARD · COMPLETE PRIVATE ROLLS'];if(phase==='MORNING')return['MORNING BUSINESS','00:00','DISCUSS · THEN PAW POINT'];if(phase==='VOTE')return['PAW POINT','00:00','SELECT ONE PLAYER'];if(phase==='RESULTS')return['RESULTS','00:00','ROUND COMPLETE'];return null}
function remainingSeconds(){if(phase!=='NIGHT'||!hourStartedAt)return 60;if(paused)return Math.max(0,60-Math.floor((pauseStartedAt-hourStartedAt)/1000));return Math.max(0,60-Math.floor((Date.now()-hourStartedAt)/1000))}
function renderTimer(){const h=qs('timerHour'),c=qs('timerCountdown'),s=qs('timerState'),box=qs('gameTimer');if(!h||!c||!s)return;const fixed=phaseLabel();if(fixed){h.textContent=fixed[0];c.textContent=fixed[1];s.textContent=fixed[2];box?.setAttribute('data-phase',phase.toLowerCase());return}
 if(phase!=='NIGHT'){h.textContent='CONNECTING';c.textContent='--:--';s.textContent='SYNCING BACKEND STATE';return}
 const rem=remainingSeconds();h.textContent=`HOUR ${Math.max(1,currentHour)} / 12`;c.textContent=`00:${String(rem).padStart(2,'0')}`;s.textContent=waitingForActions?'WAITING FOR AWAKE FERRET ACTIONS':paused?'HOST TIMER PAUSED':isHost?'NIGHT · AUTO-ADVANCES AT 00:00':'NIGHT · HOST CLOCK';box?.setAttribute('data-phase','night');
 const key=`${currentHour}:${hourStartedAt}`;if(isHost&&!paused&&rem<=0&&!waitingForActions&&key!==lastExpiredKey){lastExpiredKey=key;emit('burrowHourExpired',{hour:currentHour,key})}}
function syncBackendState(state,{hourStartAt=0,host=false}={}){const nextPhase=String(state?.game?.phase||'LOADING').toUpperCase(),nextHour=Number(state?.game?.currentHour||0);const phaseChanged=nextPhase!==phase,hourChanged=nextHour!==currentHour;phase=nextPhase;currentHour=nextHour;isHost=!!host;
 if(phase!=='NIGHT'){hourStartedAt=0;paused=false;pauseStartedAt=0;waitingForActions=false;lastExpiredKey=''}else if(hourChanged||phaseChanged||!hourStartedAt){hourStartedAt=Number(hourStartAt)||Date.now();paused=false;pauseStartedAt=0;waitingForActions=false;lastExpiredKey=''}else if(hourStartAt&&Math.abs(Number(hourStartAt)-hourStartedAt)>1000){hourStartedAt=Number(hourStartAt)}
 document.getElementById('ferretFrenzyShell')?.setAttribute('data-game-state',paused?'paused':'playing');renderTimer();ensureTimer();}
function ensureTimer(){if(!timerHandle)timerHandle=setInterval(renderTimer,200)}
function setWaiting(next){waitingForActions=!!next;if(!next&&phase==='NIGHT'&&remainingSeconds()<=0)lastExpiredKey='';renderTimer()}
function setPaused(next){next=!!next;if(!isHost||phase!=='NIGHT')return false;if(next===paused)return true;if(next){paused=true;pauseStartedAt=Date.now()}else{const delta=Date.now()-pauseStartedAt;hourStartedAt+=delta;paused=false;pauseStartedAt=0;lastExpiredKey=''}document.getElementById('ferretFrenzyShell')?.setAttribute('data-game-state',paused?'paused':'playing');renderTimer();return true}
function togglePause(){return setPaused(!paused)}
function isPaused(){return paused}
function isStarted(){return ['PREP','NIGHT','MORNING','VOTE','RESULTS'].includes(phase)}
function isComplete(){return phase==='RESULTS'}
function confirmLatestDice(){if(!latestDice)return{ok:false,reason:'no-result'};latestDice.locked=true;emit('confirmResult',{ok:true,die:latestDice.die,value:latestDice.value,private:true});return{ok:true,...latestDice}}
function setPrivateInfo(next={}){privateInfo={...privateInfo,...next};renderPrivateInfo();emit('privateInfoUpdated',{private:true})}
function renderList(id,items,empty='—'){const el=qs(id);if(!el)return;el.innerHTML='';const a=Array.isArray(items)?items:[];if(!a.length){const li=document.createElement('li');li.textContent=empty;el.append(li);return}a.forEach(v=>{const li=document.createElement('li');li.textContent=typeof v==='string'?v:JSON.stringify(v);el.append(li)})}
function renderPrivateInfo(){if(qs('privateRole'))qs('privateRole').textContent=privateInfo.role||'—';renderList('privateWakeSchedule',privateInfo.wakeSchedule);renderList('privateTreatStates',privateInfo.treatStates);renderList('privateCoWakers',privateInfo.coWakers);renderList('privateFacts',privateInfo.facts)}
function setRoleActionAvailable(available,label='Role action'){roleAction={available:!!available,label};const x=document.querySelector('.action[data-key="X"]');if(x){x.setAttribute('aria-disabled',String(!roleAction.available));x.classList.toggle('action-ready',roleAction.available)}}
function triggerRoleAction(){if(!roleAction.available){emit('roleAction',{ok:false,reason:'unavailable'});return false}emit('roleAction',{ok:true,label:roleAction.label});return true}
function loadNotebook(){try{return localStorage.getItem(NOTE_KEY)||''}catch{return''}}
function saveNotebook(value){try{localStorage.setItem(NOTE_KEY,String(value||''))}catch{}emit('notebookSaved',{private:true})}
function snapshot(){return{phase,currentHour,hourStartedAt,isHost,paused,waitingForActions,remainingSeconds:remainingSeconds(),privateInfo:{...privateInfo},roleAction:{...roleAction},latestDice:latestDice?{...latestDice}:null}}
addEventListener('ferret-frenzy-action',e=>{if(e.detail?.type==='diceResult')latestDice={die:e.detail.die,value:e.detail.value,locked:true,at:e.detail.at||Date.now(),private:true}});
const api={syncBackendState,setWaiting,setPaused,togglePause,isPaused,isStarted,isComplete,renderTimer,confirmLatestDice,setPrivateInfo,renderPrivateInfo,setRoleActionAvailable,triggerRoleAction,loadNotebook,saveNotebook,snapshot,SECONDS_PER_HOUR,TOTAL_HOURS,getPhase:()=>phase,getHour:()=>currentHour,isHost:()=>isHost};window.FerretFrenzyGame=api;renderTimer();renderPrivateInfo();ensureTimer();
})();
