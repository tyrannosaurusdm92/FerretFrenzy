(()=>{
'use strict';
const shell=document.getElementById('ferretFrenzyShell'), viewer=document.getElementById('viewerScreen'), roller=document.getElementById('diceRoller');
const result=document.getElementById('rollResult'),behavior=document.getElementById('behaviorHud'),dieChip=document.getElementById('dieChip');
const joy=document.getElementById('rollJoystick'),handle=document.getElementById('rollJoyHandle'),controlLayer=document.getElementById('controlLayer'),numberRail=document.getElementById('numberRail');
let selected='d6',dragging=false,pointerId=null,startX=0,startY=0,startAt=0,lastDX=0,lastDY=0,peakRatio=0;
const panels={};document.querySelectorAll('[data-panel]').forEach(p=>panels[p.dataset.panel]=p);
function emit(type,detail={}){window.dispatchEvent(new CustomEvent('ferret-frenzy-action',{detail:{type,...detail}}))}
function visibleFocusable(){return [...document.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(el=>el!==joy&&el.offsetParent!==null&&!el.closest('.paused-mask'))}
function clearFocusRing(){document.querySelectorAll('.focus-ring').forEach(x=>x.classList.remove('focus-ring'))}
function focusEl(el){if(!el)return;clearFocusRing();el.focus({preventScroll:true});el.classList.add('focus-ring');setTimeout(()=>el.classList.remove('focus-ring'),850)}
function navigate(dx,dy){const els=visibleFocusable();if(!els.length)return;let cur=document.activeElement;if(!els.includes(cur)){focusEl(document.getElementById('menuButton')||els[0]);return}const r=cur.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let best=null,bestScore=Infinity;for(const el of els){if(el===cur)continue;const q=el.getBoundingClientRect(),x=q.left+q.width/2-cx,y=q.top+q.height/2-cy;if(dx>0&&x<=4||dx<0&&x>=-4||dy>0&&y<=4||dy<0&&y>=-4)continue;const primary=Math.abs(dx)>Math.abs(dy)?Math.abs(x):Math.abs(y),secondary=Math.abs(dx)>Math.abs(dy)?Math.abs(y):Math.abs(x);const score=primary+secondary*1.8;if(score<bestScore){bestScore=score;best=el}}focusEl(best||cur)}
function closePanels(force=false){Object.values(panels).forEach(p=>{if(force||!p.classList.contains('pinned'))p.classList.remove('open')});document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed','false'))}
function togglePanel(name){const p=panels[name];if(!p)return;const was=p.classList.contains('open');if(!p.classList.contains('pinned'))closePanels();if(!was){p.classList.add('open');document.querySelector(`[data-tool="${name}"]`)?.setAttribute('aria-pressed','true')}else if(!p.classList.contains('pinned'))p.classList.remove('open')}
function backOrCancel(){const open=[...document.querySelectorAll('.panel.open')].reverse().find(p=>!p.classList.contains('pinned'));if(open){open.classList.remove('open');emit('back',{closedPanel:open.dataset.panel});return}emit('cancel',{source:'B'})}
function setSelected(type){if(type!=='d6'&&type!=='d12')return;selected=type;FerretDice.select(type);document.querySelectorAll('[data-die]').forEach(b=>{const on=b.dataset.die===type;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});document.querySelectorAll('.num-btn[data-system="3"],.num-btn[data-system="4"]').forEach(b=>b.classList.remove('system-active'));const label=type.toUpperCase();behavior.textContent=label+' SELECTED · STORM GALAXY GOLD';if(dieChip)dieChip.textContent=type;result.dataset.state='ready';result.textContent=label+' selected · flick joystick to roll';emit('systemButton',{system:type==='d6'?1:2,die:type})}
async function rollSelected(source='joystick'){
  if(FerretFrenzyGame.isPaused()||FerretDice.isRolling())return false;
  result.dataset.state='rolling';result.textContent=selected.toUpperCase()+' requesting private roll…';
  try{
    let forcedValue=null;
    if(window.FFNetwork?.requestRoll){const auth=await window.FFNetwork.requestRoll(selected);forcedValue=Number(auth?.result??auth?.value);if(!Number.isFinite(forcedValue))throw new Error('Backend returned no die result')}
    const ok=FerretDice.roll(Number.isFinite(forcedValue)?forcedValue:undefined);if(ok)emit('privateRollStarted',{die:selected,source,serverAuthoritative:Number.isFinite(forcedValue)});return ok;
  }catch(err){result.dataset.state='ready';result.textContent='Roll unavailable · '+err.message;emit('rollError',{die:selected,message:err.message});return false}
}
function confirmResult(){const r=FerretFrenzyGame.confirmLatestDice();if(r.ok){result.dataset.state='locked';result.textContent=r.die.toUpperCase()+' → '+r.value+' · RESULT LOCKED'}else{result.textContent='No dice result to confirm yet'}document.querySelector('.num-btn[data-system="3"]')?.classList.add('system-active')}
function primaryConfirm(){const active=document.activeElement;if(active&&active!==document.body&&active!==joy&&typeof active.click==='function'&&!active.classList.contains('action')){active.click();emit('confirm',{target:active.id||active.dataset?.tool||active.textContent?.trim()});return}if(window.FFNetwork?.confirmFocusedVote?.()){return}const r=FerretFrenzyGame.confirmLatestDice();if(r.ok){result.textContent=r.die.toUpperCase()+' → '+r.value+' · CONFIRMED'}else emit('confirm',{target:null})}
function roleAction(){if(window.FFNetwork?.openRoleAction){const ok=window.FFNetwork.openRoleAction();result.textContent=ok?'Role action opened':'No context-sensitive role action is available right now';return}const ok=FerretFrenzyGame.triggerRoleAction();result.textContent=ok?'Role action selected':'No context-sensitive role action is available right now'}
function notebook(){const area=document.getElementById('notebookText');if(area&&!area.dataset.loaded){area.value=FerretFrenzyGame.loadNotebook();area.dataset.loaded='1'}togglePanel('notebook');setTimeout(()=>area?.focus(),0)}
function privateInfo(){FerretFrenzyGame.renderPrivateInfo();togglePanel('privateInfo');document.querySelector('.num-btn[data-system="4"]')?.classList.add('system-active')}
function reserved(key){result.textContent=key+' is reserved for a future Ferret Frenzy function';emit('reservedButton',{key})}
function semanticAction(key){if(key==='A')primaryConfirm();else if(key==='B')backOrCancel();else if(key==='X')roleAction();else if(key==='Y')notebook();else reserved(key)}
function setHeld(key,on,source='pointer'){const b=document.querySelector(`.action[data-key="${key}"]`);b?.classList.toggle('is-held',on);emit('button',{key,pressed:on,source})}
function centerHandle(){handle.style.transform='translate(-50%,-50%)';joy.classList.remove('is-active','is-flick');joy.dataset.mode='navigate';lastDX=lastDY=0;peakRatio=0}
function moveHandle(x,y){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.29;let dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1;if(d>max){dx=dx/d*max;dy=dy/d*max;d=max}lastDX=dx;lastDY=dy;peakRatio=Math.max(peakRatio,d/max);handle.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;const flick=peakRatio>=.72;joy.classList.toggle('is-flick',flick);joy.dataset.mode=flick?'flick':'navigate'}
joy.addEventListener('pointerdown',e=>{if(FerretFrenzyGame.isPaused())return;dragging=true;pointerId=e.pointerId;startX=e.clientX;startY=e.clientY;startAt=performance.now();peakRatio=0;joy.setPointerCapture?.(e.pointerId);joy.classList.add('is-active');moveHandle(e.clientX,e.clientY);e.preventDefault()});
joy.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==pointerId)return;moveHandle(e.clientX,e.clientY);e.preventDefault()});
function releaseJoy(e){if(!dragging||e.pointerId!==pointerId)return;const duration=performance.now()-startAt,dx=lastDX,dy=lastDY,ratio=peakRatio;dragging=false;pointerId=null;centerHandle();if(ratio>=.72&&duration<=850){rollSelected('joystick-flick')}else if(Math.hypot(dx,dy)>=8){navigate(dx,dy);emit('joystickNavigate',{dx,dy})}e.preventDefault()}
joy.addEventListener('pointerup',releaseJoy);joy.addEventListener('pointercancel',e=>{if(e.pointerId!==pointerId)return;dragging=false;pointerId=null;centerHandle()});

FerretDice.init(roller);
addEventListener('ferret-frenzy-action',e=>{if(e.detail?.type==='diceResult'){result.dataset.state='locked';result.textContent=e.detail.die.toUpperCase()+' → '+e.detail.value+' · PRIVATE · LOCKED';document.getElementById('latestPrivateRoll')&&(document.getElementById('latestPrivateRoll').textContent=e.detail.die.toUpperCase()+' → '+e.detail.value)}});

document.querySelectorAll('[data-die]').forEach(b=>b.addEventListener('click',()=>setSelected(b.dataset.die)));
document.querySelector('.num-btn[data-system="3"]')?.addEventListener('click',confirmResult);
document.querySelector('.num-btn[data-system="4"]')?.addEventListener('click',privateInfo);
document.querySelectorAll('.action[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{setHeld(b.dataset.key,true);b.setPointerCapture?.(e.pointerId)});const release=e=>{setHeld(b.dataset.key,false);semanticAction(b.dataset.key)};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',()=>setHeld(b.dataset.key,false))});

document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>togglePanel(b.dataset.tool)));
document.querySelectorAll('[data-open-panel]').forEach(b=>b.addEventListener('click',()=>togglePanel(b.dataset.openPanel)));
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{const p=b.closest('[data-panel]');p?.classList.remove('open','pinned')}));
document.querySelectorAll('[data-pin]').forEach(b=>b.addEventListener('click',()=>{const p=b.closest('[data-panel]');if(!p)return;p.classList.toggle('pinned');p.classList.add('open');b.setAttribute('aria-pressed',String(p.classList.contains('pinned')))}));
document.getElementById('menuButton')?.addEventListener('click',()=>togglePanel('game'));

document.querySelectorAll('[data-confirm-result]').forEach(b=>b.addEventListener('click',()=>{confirmResult();b.closest('[data-panel]')?.classList.remove('open')}));
document.querySelectorAll('[data-start-game]').forEach(b=>b.addEventListener('click',async()=>{closePanels();b.disabled=true;try{if(window.FFNetwork?.startGame)await window.FFNetwork.startGame();FerretFrenzyGame.start()}catch(err){result.dataset.state='ready';result.textContent='Start unavailable · '+err.message;b.disabled=false}}));
document.querySelectorAll('[data-reset-game]').forEach(b=>b.addEventListener('click',()=>FerretFrenzyGame.reset()));
document.getElementById('pauseButton')?.addEventListener('click',e=>{FerretFrenzyGame.togglePause();e.currentTarget.textContent=FerretFrenzyGame.isPaused()?'▶':'Ⅱ';e.currentTarget.setAttribute('aria-label',FerretFrenzyGame.isPaused()?'Resume':'Pause')});
document.getElementById('rollButton')?.addEventListener('click',()=>{closePanels();rollSelected('menu')});
document.getElementById('fullscreenButton')?.addEventListener('click',()=>{const p=document.fullscreenElement?document.exitFullscreen():shell.requestFullscreen?.();p?.catch?.(()=>{})});
document.getElementById('privateInfoQuick')?.addEventListener('click',privateInfo);
document.getElementById('notebookQuick')?.addEventListener('click',notebook);
document.getElementById('controlsOnButton')?.addEventListener('click',()=>{controlLayer.classList.remove('controls-hidden');numberRail.classList.remove('controls-hidden')});
document.getElementById('controlsOffButton')?.addEventListener('click',()=>{controlLayer.classList.add('controls-hidden');numberRail.classList.add('controls-hidden')});
function setSound(level){const input=document.getElementById('diceVolume');if(input){input.value=String(Math.round(level*100));input.nextElementSibling.value=Math.round(level*100)+'%'}FerretDice.setVolume(level);window.FFAudio?.setMaster(level);document.querySelectorAll('[data-sound-level]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.soundLevel)===level)));emit('soundLevel',{level})}
document.querySelectorAll('[data-sound-level]').forEach(b=>b.addEventListener('click',()=>setSound(Number(b.dataset.soundLevel))));
const joySize=document.getElementById('joySize'),joyOpacity=document.getElementById('joyOpacity'),vol=document.getElementById('diceVolume');
joySize?.addEventListener('input',e=>{document.documentElement.style.setProperty('--joy-size',e.target.value+'px');e.target.nextElementSibling.value=e.target.value+' px'});
joyOpacity?.addEventListener('input',e=>{document.documentElement.style.setProperty('--joy-opacity',Number(e.target.value)/100);e.target.nextElementSibling.value=e.target.value+'%'});
vol?.addEventListener('input',e=>{e.target.nextElementSibling.value=e.target.value+'%';FerretDice.setVolume(Number(e.target.value)/100);window.FFAudio?.setMaster(Number(e.target.value)/100)});
document.getElementById('reduceAurora')?.addEventListener('change',e=>document.body.classList.toggle('reduce-aurora',e.target.checked));
const notes=document.getElementById('notebookText');if(notes){notes.value=FerretFrenzyGame.loadNotebook();notes.dataset.loaded='1'}notes?.addEventListener('input',e=>FerretFrenzyGame.saveNotebook(e.target.value));

addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select'))return;const key=e.key.toUpperCase();if(e.key==='1'){setSelected('d6');e.preventDefault()}else if(e.key==='2'){setSelected('d12');e.preventDefault()}else if(e.key==='3'){confirmResult();e.preventDefault()}else if(e.key==='4'){privateInfo();e.preventDefault()}else if(['A','B','X','Y','Z','R'].includes(key)){if(!e.repeat){setHeld(key,true,'keyboard');semanticAction(key)}e.preventDefault()}else if(e.key===' '){rollSelected('keyboard-accessibility');e.preventDefault()}});
addEventListener('keyup',e=>{const key=e.key.toUpperCase();if(['A','B','X','Y','Z','R'].includes(key))setHeld(key,false,'keyboard')});
setSound(.45);setSelected('d6');FerretFrenzyGame.renderTimer();
window.FerretFrenzyShell={togglePanel,closePanels,setSelected,rollSelected,navigate,openPanel:(name)=>{togglePanel(name);return true}};
})();
