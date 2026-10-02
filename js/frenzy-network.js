import {smartBotManager} from './bot-manager.js';
import {ensureParticipantReservations,reserveRoleForSeat,getRoleReservations} from './assign-role.js';
const ENDPOINT=window.FF_BACKEND_URL||'';
const TOKEN_KEY='ff:guest-token:v2';
const GAME_PREFIX='ff:game-id:';
const params=new URLSearchParams(location.search);const room=params.get('room')||'';
let gameId=localStorage.getItem(GAME_PREFIX+room)||'';let token=localStorage.getItem(TOKEN_KEY)||'';let state=null;let pollTimer=0;let busy=false;let afterSeq=0;let voteChoice='';let voteAutoOpened=false;let actionSelections=[];
const $=id=>document.getElementById(id);
async function call(action,data={}){
 if(!ENDPOINT)throw new Error('Backend endpoint is not configured');if(!token)throw new Error('Guest session is missing; return to the lobby');
 const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,data:{...data,guestToken:token}}),cache:'no-store',redirect:'follow'});if(!res.ok)throw new Error(`Backend HTTP ${res.status}`);const env=await res.json();if(env?.ok===false)throw Object.assign(new Error(env.error?.message||'Backend error'),{code:env.error?.code,details:env.error?.details});return Object.prototype.hasOwnProperty.call(env||{},'data')?env.data:env;
}
function seatLabel(p){return `Player ${p.seat||'?'}${p.displayName?' · '+p.displayName:''}`}
function normalFact(f){if(typeof f==='string')return f;if(!f)return '—';const type=String(f.type||'FACT').replaceAll('_',' ');if(f.displayName)return `${type}: ${f.displayName}`;if(f.hour)return `${type}: Hour ${f.hour}`;if(f.candidates)return `${type}: ${f.candidates.map(x=>x.displayName||x.participantId).join(' / ')}`;return type}
function applyPrivate(s){const me=s?.me||{};const obs=me.observations||[];FerretFrenzyGame.setPrivateInfo({role:me.role?.name||me.startingRole||'—',wakeSchedule:(me.wakeHours||[]).map(h=>`Hour ${h}`),treatStates:obs.map(o=>`Hour ${o.hour}: ${o.treatChangedDuringWindow?'PRESENT → MISSING':o.treatStateBefore||'—'}`),coWakers:obs.map(o=>`Hour ${o.hour}: ${(o.coWakers||[]).map(x=>x.displayName||x.participantId).join(', ')||'alone'}`),facts:(me.privateFacts||[]).map(normalFact)});const prompt=me.actionPrompt||{};FerretFrenzyGame.setRoleActionAvailable(prompt.kind==='ACTION',prompt.type||prompt.label||'Role action')}
function applyScene(){if(window.FFMinnowHitbox){window.FFMinnowHitbox.update(state);return}const phase=String(state?.game?.phase||'').toUpperCase(),scene=$('gameScene'),hud=$('treatHud'),text=$('treatHudText'),missing=['MORNING','VOTE','RESULTS'].includes(phase);if(scene){scene.src=missing?'../images/Minnow Treats crime scene-2.png':'../images/Aurora-lit ferret treats bookshelf-1.png';scene.alt=missing?'Aurora-lit ferret shelf after the Minnow Treats were stolen, marked as a crime scene':'Aurora-lit ferret shelf with the Minnow Treats present'}if(hud)hud.classList.toggle('missing',missing);if(text)text.textContent=missing?'TREATS MISSING':'TREATS PRESENT'}
function phaseAudio(phase){if(phase==='VOTE')window.FFAudio?.setContext('vote');else if(phase==='MORNING')window.FFAudio?.setContext('discussion');else if(phase==='PREP'||phase==='NIGHT')window.FFAudio?.setContext('night');else window.FFAudio?.setContext('silent')}
function renderDiscussion(messages=[]){const box=$('discussionMessages');if(!box)return;box.innerHTML='';if(!messages.length){box.innerHTML='<div class="discussion-empty">No claims yet.</div>';return}for(const m of messages){const row=document.createElement('article');row.className='discussion-message '+(String(m.senderKind||m.kind||'').toLowerCase()==='bot'?'bot':'');const head=document.createElement('strong');head.textContent=m.senderName||'Ferret Frenzy';const body=document.createElement('p');body.textContent=m.text||'';row.append(head,body);box.append(row)}box.scrollTop=box.scrollHeight}
async function refreshChat(){if(!state||!['MORNING','VOTE','RESULTS','LOBBY'].includes(state.game?.phase))return;try{const r=await call('chat.list',{gameId});renderDiscussion(r?.messages||[])}catch{}}
function renderVote(){const phase=state?.game?.phase||'';const vote=$('pawVote');if(!vote)return;vote.hidden=phase!=='VOTE';$('openVotingButton').hidden=!(phase==='MORNING'&&isHost());$('discussionForm').hidden=!['MORNING','VOTE'].includes(phase);$('discussionPhaseNote').textContent=phase==='MORNING'?'Discuss the missing Minnow Treats. Claims are not automatically verified.':phase==='VOTE'?'Paw Point voting is open. Discussion remains one shared room, with no channels.':phase==='RESULTS'?'Voting is resolved.':'Discussion opens after Hour 12.';if(phase!=='VOTE')return;const me=state.me||{},box=$('voteCandidates');box.innerHTML='';for(const p of (state.participants||[]).filter(x=>x.id!==me.id)){const b=document.createElement('button');b.type='button';b.className='vote-candidate';b.dataset.targetId=p.id;b.setAttribute('role','radio');b.setAttribute('aria-checked',String(voteChoice===p.id));b.innerHTML=`<span class="vote-avatar">🐾</span><span><strong>${seatLabel(p)}</strong><small>${p.kind==='BOT'?'Bot ferret':'Active player'}</small></span>`;if(voteChoice===p.id)b.classList.add('selected');b.addEventListener('click',()=>selectVote(p.id));box.append(b)}$('lockVoteButton').disabled=!voteChoice||!!me.voteLocked;$('clearVoteButton').disabled=!!me.voteLocked;$('voteStatus').textContent=me.voteLocked?'Your Paw Point is locked. Waiting for the others.':voteChoice?`Selected ${seatLabel((state.participants||[]).find(p=>p.id===voteChoice)||{})}. Press Lock Paw Point.`:'Choose one player, then lock your vote.';if(!voteAutoOpened){voteAutoOpened=true;window.FerretFrenzyShell?.openPanel('chat')}}
function selectVote(id){if(state?.me?.voteLocked)return;voteChoice=id;renderVote()}
async function lockVote(){if(!voteChoice||state?.me?.voteLocked)return;try{$('lockVoteButton').disabled=true;const next=await call('vote.cast',{gameId,targetId:voteChoice});applyState(next)}catch(e){$('voteStatus').textContent=e.message;renderVote()}}
function confirmFocusedVote(){if(state?.game?.phase!=='VOTE'||state?.me?.voteLocked)return false;const active=document.activeElement;if(active?.classList?.contains('vote-candidate')){selectVote(active.dataset.targetId);return true}if(voteChoice){lockVote();return true}return false}
function isHost(){const me=state?.me;return !!(state?.participants||[]).find(p=>p.id===me?.id)?.isHost}
async function beginVoting(){try{const next=await call('vote.begin',{gameId});applyState(next)}catch(e){$('discussionPhaseNote').textContent=e.message}}
function buildRoleAction(){const prompt=state?.me?.actionPrompt||{};const panel=$('roleActionTargets'),confirm=$('roleActionConfirm'),pass=$('roleActionPass');if(!panel)return false;panel.innerHTML='';actionSelections=[];$('roleActionTitle').textContent=prompt.type?prompt.type.replaceAll('_',' '):'Role Action';$('roleActionPrompt').textContent=prompt.kind==='ACTION'?'Choose the legal target(s) for your private role action.':'No role action is waiting.';pass.hidden=!prompt.optional;confirm.disabled=true;if(prompt.kind!=='ACTION')return false;
 const addChoice=(id,label)=>{const b=document.createElement('button');b.type='button';b.className='role-target';b.dataset.id=id;b.textContent=label;b.onclick=()=>{const choose=Number(prompt.choose||1);if(choose>1){if(actionSelections.includes(id))actionSelections=actionSelections.filter(x=>x!==id);else if(actionSelections.length<choose)actionSelections.push(id)}else actionSelections=[id];[...panel.children].forEach(x=>x.classList.toggle('selected',actionSelections.includes(x.dataset.id)));confirm.disabled=actionSelections.length!==(choose||1)};panel.append(b)};
 if(prompt.type==='DOOKER_PEEK_HAMMOCK'){for(let i=0;i<Number(prompt.hammockSlots||3);i++)addChoice(String(i),`Hammock ${i+1}`)}else for(const p of (state.participants||[]).filter(x=>!prompt.excludeSelf||x.id!==state.me.id))addChoice(p.id,seatLabel(p));return true}
function openRoleAction(){if(!buildRoleAction())return false;window.FerretFrenzyShell?.openPanel('roleAction');return true}
async function submitRoleAction(pass=false){const prompt=state?.me?.actionPrompt||{};if(prompt.kind!=='ACTION')return;let data={gameId,type:prompt.type};if(pass)data.pass=true;else if(prompt.type==='TROUBLE_SWAP'){data.targetAId=actionSelections[0];data.targetBId=actionSelections[1]}else if(prompt.type==='SNUGGLER_BOND'){data.targetAId=actionSelections[0];data.targetBId=actionSelections[1];data.targetIds=actionSelections.slice()}else if(prompt.type==='DOOKER_PEEK_HAMMOCK')data.hammockIndex=Number(actionSelections[0]);else data.targetId=actionSelections[0];try{const r=await call('game.action',data);if(r?.game)applyState(r);else await poll();window.FerretFrenzyShell?.closePanels()}catch(e){$('roleActionStatus').textContent=e.message}}
function applySleepLock(s){
 const phase=String(s?.game?.phase||'').toUpperCase(),prompt=s?.me?.actionPrompt||{};
 const sleeping=phase==='NIGHT'&&prompt.kind==='SLEEP';
 const lock=$('sleepLock');if(lock)lock.hidden=!sleeping;
 document.documentElement.classList.toggle('ff-sleeping',sleeping);document.body.classList.toggle('ff-sleeping',sleeping);
}
function syncStartControls(){
 const phase=String(state?.game?.phase||'').toUpperCase(),host=isHost();
 document.querySelectorAll('[data-start-game]').forEach(b=>{const show=phase==='LOBBY'&&host;b.hidden=!show;if(show)b.disabled=false});
 const menuReset=document.querySelector('[data-reset-game]');if(menuReset)menuReset.hidden=phase!=='LOBBY';
}
async function ensureMyLobbyReservation(){
 const me=state?.me;if(!room||!me?.id)return null;const existing=getRoleReservations(room)[me.id];if(existing?.role)return existing;
 return reserveRoleForSeat(room,me.id,{seat:me.seat||1,targetPlayers:state?.game?.targetPlayers||8,source:'frenzy-entry'});
}
async function startGame(){
 if(!state?.game)throw new Error('Game state is not connected yet.');
 const phase=String(state.game.phase||'').toUpperCase();if(phase!=='LOBBY'){if(['PREP','NIGHT','MORNING','VOTE','RESULTS'].includes(phase))return state;throw new Error('The room is not ready to start.');}
 if(!isHost())throw new Error('Only the host can start this Ferret Frenzy round.');
 await ensureMyLobbyReservation();
 const target=Math.max(4,Math.min(12,Number(state.game.targetPlayers||state.game.maxPlayers||8)));
 let participants=(state.participants||[]).slice();ensureParticipantReservations(room,participants,target);
 if(state.game.allowBots!==false&&participants.length<target){
   $('networkStatus').textContent='LOBBY · HOST · filling missing role slots with smart bots…';
   await smartBotManager.fillMissingRoles({code:room,target,currentParticipants:participants});
   const refreshed=await call('game.state',{gameId});if(refreshed?.game){state=refreshed;participants=(state.participants||[]).slice();applyState(refreshed)}
 }
 $('networkStatus').textContent='LOBBY · HOST · starting authoritative round…';
 const next=await call('game.start',{gameId,force:true});applyState(next);
 await smartBotManager.resumeRoom(room).catch(err=>console.warn('Ferret Frenzy bot start:',err));
 return next;
}
function applyState(s){if(!s?.game)return;state=s;gameId=s.game.id||gameId;if(room&&gameId)localStorage.setItem(GAME_PREFIX+room,gameId);const phase=String(s.game.phase||'').toUpperCase();document.getElementById('ferretFrenzyShell').dataset.phase=phase.toLowerCase();$('networkStatus').textContent=`${phase} · ${isHost()?'HOST':'PLAYER'} · backend live`;$('chatToolLabel').textContent=phase==='VOTE'?'VOTE':phase==='MORNING'?'DISCUSSION':'Discussion';applyPrivate(s);applyScene();phaseAudio(phase);applySleepLock(s);syncStartControls();renderVote();if(phase==='RESULTS'){$('rollResult').textContent=(s.results?.winner?String(s.results.winner).toUpperCase()+' SIDE WINS':'ROUND COMPLETE')}refreshChat()}
async function poll(){if(busy||!gameId)return;busy=true;try{const r=await call('events.poll',{gameId,afterSeq,limit:100});afterSeq=Number(r?.latestSeq||afterSeq);applyState(r?.state||r)}catch(e){$('networkStatus').textContent='Offline · local presentation mode';}finally{busy=false}}
async function requestRoll(die){if(!gameId)throw new Error('Game state is not connected');const sides=die==='d12'?12:6;const r=await call('game.roll',{gameId,die:sides});const roll=r?.roll||r;const value=Number(roll?.result??roll?.value);if(r?.state)applyState(r.state);if(roll?.rerollRequired){$('rollResult').textContent=`${die.toUpperCase()} → ${value} duplicate · reroll required`}return {result:value,duplicate:!!roll?.duplicate,rerollRequired:!!roll?.rerollRequired,purpose:roll?.purpose}}
async function sendChat(text){if(!text.trim())return;await call('chat.send',{gameId,text:text.trim()});await refreshChat()}
$('discussionForm')?.addEventListener('submit',async e=>{e.preventDefault();const input=$('discussionInput'),text=input.value;input.value='';try{await sendChat(text)}catch(err){$('discussionPhaseNote').textContent=err.message}});$('lockVoteButton')?.addEventListener('click',lockVote);$('clearVoteButton')?.addEventListener('click',()=>{voteChoice='';renderVote()});$('openVotingButton')?.addEventListener('click',beginVoting);$('roleActionConfirm')?.addEventListener('click',()=>submitRoleAction(false));$('roleActionPass')?.addEventListener('click',()=>submitRoleAction(true));
window.FFNetwork={requestRoll,openRoleAction,confirmFocusedVote,getState:()=>state,poll,beginVoting,sendChat,startGame};
if(!gameId){$('networkStatus').textContent='No game id · return to lobby'}else{poll();pollTimer=setInterval(poll,1600)}
addEventListener('pagehide',()=>{if(pollTimer)clearInterval(pollTimer)});
