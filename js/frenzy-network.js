import {smartBotManager} from './bot-manager.js';

const ENDPOINT=window.FF_BACKEND_URL||'https://script.google.com/macros/s/AKfycbyAShO3c_FLVqp-fisabNx_DMuLD0UYMPygU22_jQfpLjIs796fgsJPo3viZq5FGeYd1A/exec';
const TOKEN_KEY='ff:guest-token:v2',GAME_PREFIX='ff:game-id:';
const params=new URLSearchParams(location.search),room=(params.get('room')||params.get('code')||'').replace(/\D/g,'').slice(0,6);
let gameId=params.get('gameId')||localStorage.getItem(GAME_PREFIX+room)||'',token=localStorage.getItem(TOKEN_KEY)||localStorage.getItem('ff:guest-token:v1')||'';
let state=null,afterSeq=0,pollTimer=0,polling=false,voteChoice='',voteAutoOpened=false,actionSelections=[],hourStartAt=0,hourStartHour=0,advanceRetry=0,lastPromptKey='',resultsOpened=false,chatSending=false,banditCueUntil=0;
const $=id=>document.getElementById(id);
const upper=v=>String(v||'').trim().toUpperCase();
const gameRef=()=>gameId?{gameId}:{code:room};

async function call(action,data={}, {requiresToken=true}={}){
  if(!ENDPOINT)throw new Error('Backend endpoint is not configured.');
  if(requiresToken&&!token)throw new Error('Guest session is missing. Return to the lobby and rejoin the burrow.');
  const payload={action,data:{...data}};if(requiresToken)payload.data.guestToken=token;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload),cache:'no-store',redirect:'follow',signal:controller.signal});
    if(!res.ok)throw new Error(`Backend HTTP ${res.status}`);
    const env=await res.json();if(env?.ok===false){const e=env.error||{};throw Object.assign(new Error(e.message||'Backend error'),{code:e.code||'API_ERROR',details:e.details,status:e.status})}
    return Object.prototype.hasOwnProperty.call(env||{},'data')?env.data:env;
  }catch(err){if(err?.name==='AbortError')throw new Error('Ferret Frenzy backend timed out.');throw err}finally{clearTimeout(timeout)}
}
function seatLabel(p){return `Player ${p?.seat||'?'}${p?.displayName?' · '+p.displayName:''}`}
function prettyRole(role){return window.FFCards?.prettyRole?.(role)||String(role||'').replaceAll('_',' ')}
function factText(f){
  if(typeof f==='string')return f;if(!f)return '—';const t=upper(f.type);
  if(t==='BANDIT_ROSTER')return `Starting Bandits: ${(f.participants||[]).map(x=>x.displayName||x.participantId).join(', ')}`;
  if(t==='RAIDER_IDENTITY')return `Raider: ${f.displayName||f.participantId}`;
  if(t==='ITCHY_CHECK')return `Itchy d6: ${f.roll} · ${f.activated?'EARS UP (extra wake)':'TOO ITCHY'}`;
  if(t==='HUNTER_CONVERSION')return `Hunter d6: ${f.roll} · ${f.converted?'converted to Bandit side':'remained Business side'}`;
  if(t==='DOOKER_GLIMPSE')return `Glimpse: ${f.displayName||f.participantId} · ${String(f.result||'').replaceAll('_',' ')}`;
  if(t==='DOOKER_HAMMOCK_PEEK')return `Hammock ${Number(f.hammockIndex)+1}: ${prettyRole(f.role)}`;
  if(t==='DOOKER_TRIP')return `Trip: Hammock ${Number(f.hammockIndex)+1} card moved to ${f.displayName||f.targetId}`;
  if(t==='TROUBLE_SWAP')return `Blind swap locked: ${seatLabel((state?.participants||[]).find(p=>p.id===f.targetAId))} ↔ ${seatLabel((state?.participants||[]).find(p=>p.id===f.targetBId))}`;
  if(t==='BUSINESS_WAKE_INSPECTION')return `${f.displayName||f.participantId} wakes at ${(f.wakeHours||[]).map(h=>'Hour '+h).join(', ')}`;
  if(t==='SNUGGLE_BOND')return `Snuggle-Bonded with ${f.displayName||f.participantId}`;
  if(t==='SNUGGLER_BOND_SET')return 'Your Snuggle Bond pair is locked.';
  if(t==='HUNTER_RECOGNITION')return `Starting Hunter: ${f.displayName||f.participantId}`;
  if(t==='GUARDIAN_RECOGNITION')return `Starting Guardian: ${f.displayName||f.participantId}`;
  if(t==='HUNT_MARK')return `Hunt Mark: ${f.displayName||f.participantId}`;
  if(t==='GUARDIAN_PROTECTION')return `Protected: ${f.displayName||f.participantId}`;
  if(t==='TROUBLE_CONVERTED')return `In On It · converted during Hour ${f.hour}`;
  if(t==='ITCHY_PARTIAL_CLUE')return `Exactly one is the Raider: ${(f.candidates||[]).map(x=>x.displayName||x.participantId).join(' / ')}`;
  if(t==='ITCHY_TIMING_CLUE')return `Raider timing clue: ${f.range==='HOURS_1_6'?'Hours 1–6':'Hours 7–12'}`;
  return `${String(f.type||'FACT').replaceAll('_',' ')}${f.displayName?': '+f.displayName:''}${f.hour?': Hour '+f.hour:''}`;
}
function promptText(prompt,stateNow=state){
  const kind=upper(prompt?.kind),type=upper(prompt?.type),purpose=upper(prompt?.purpose);
  if(kind==='ROLL'){
    if(purpose==='ITCHY_CHECK')return 'Pre-Game Setup · Itchy: select /1/ d6 and flick the joystick. 5–6 activates Ears Up.';
    if(purpose==='WAKE')return 'Pre-Game Setup · wake roll: select /2/ d12 and flick the joystick. Duplicate wake hours reroll automatically.';
    if(purpose==='RAIDER_TIE')return 'Pre-Game Setup · Bandit Raider tiebreak: select /1/ d6 and flick. Lowest unique tied-Bandit result becomes Raider.';
    if(purpose==='HUNTER_CONVERSION')return 'Hunter overlap: select /1/ d6 and flick. 1–2 converts; 3–6 remains loyal.';
    return `Private ${String(prompt?.die||'die').toUpperCase()} roll required.`;
  }
  if(kind==='ACTION'){
    const map={SNUGGLER_BOND:'Snuggler: choose two other players to become Snuggle-Bonded before Hour 1.',DOOKER_GLIMPSE:'Dooker Glimpse: choose one other player to learn BANDIT-ALIGNED or NOT BANDIT-ALIGNED.',DOOKER_PEEK_HAMMOCK:'Dooker Trip setup: inspect one of the three face-down Hammock cards.',DOOKER_TRIP:'Dooker Trip: optionally place the inspected Hammock card onto one player.',TROUBLE_SWAP:'Trouble: choose two other players. Their current cards swap blindly.',BUSINESS_INSPECT:'Business woke alone: optionally inspect one other player’s wake schedule.',HUNTER_MARK:'Hunter: secretly place one Hunt Mark on another player.',GUARDIAN_PROTECT:'Guardian: protect one other player before Paw Point resolution.'};
    return map[type]||'A private role action is waiting. Press X.';
  }
  if(kind==='SLEEP')return `Night Lock · Hour ${stateNow?.game?.currentHour||'?'} · you are asleep.`;
  if(kind==='CHAT')return 'Morning Business: discuss claims, wake times, co-wakers, and Treat State.';
  if(kind==='VOTE')return 'Paw Point: select exactly one player and lock your vote.';
  if(kind==='WAIT')return prompt?.label||'Waiting for the other ferrets.';
  return '';
}
function applyPrivate(s){const me=s?.me||{},obs=me.observations||[];FerretFrenzyGame.setPrivateInfo({role:me.role?.name||prettyRole(me.startingRole)||'—',wakeSchedule:(me.wakeHours||[]).map(h=>`Hour ${h}`),treatStates:obs.map(o=>`Hour ${o.hour}: ${o.treatChangedDuringWindow?'PRESENT → MISSING':o.treatStateBefore||'—'}`),coWakers:obs.map(o=>`Hour ${o.hour}: ${(o.coWakers||[]).map(x=>x.displayName||x.participantId).join(', ')||'alone'}`),facts:(me.privateFacts||[]).map(factText)});const prompt=me.actionPrompt||{};FerretFrenzyGame.setRoleActionAvailable(prompt.kind==='ACTION',prompt.type||prompt.label||'Role action')}
function applyScene(){if(window.FFMinnowHitbox){window.FFMinnowHitbox.update(state);return}const phase=upper(state?.game?.phase),scene=$('gameScene'),hud=$('treatHud'),text=$('treatHudText'),missing=['MORNING','VOTE','RESULTS'].includes(phase);if(scene){scene.src=missing?'../images/Minnow Treats crime scene-2.png':'../images/Aurora-lit ferret treats bookshelf-1.png';scene.alt=missing?'Aurora-lit ferret shelf after the Minnow Treats were stolen, marked as a crime scene':'Aurora-lit ferret shelf with the Minnow Treats present'}hud?.classList.toggle('missing',missing);if(text)text.textContent=missing?'TREATS MISSING':'TREATS PRESENT'}
function phaseAudio(phase){if(phase==='VOTE')window.FFAudio?.setContext('vote');else if(phase==='MORNING')window.FFAudio?.setContext('discussion');else if(phase==='PREP'||phase==='NIGHT')window.FFAudio?.setContext('night');else window.FFAudio?.setContext('silent')}
function socialStep(phase){
  const order=['MORNING','VOTE','RESULTS'],idx=order.indexOf(phase);
  document.querySelectorAll('[data-social-step]').forEach((el,i)=>{el.classList.toggle('active',i===idx);el.classList.toggle('complete',idx>i)});
}
function messageTime(m){const raw=m.createdAt||m.sentAt||m.timestamp||m.at;if(!raw)return'';const d=new Date(raw);if(Number.isNaN(d.getTime()))return'';return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});}
function renderDiscussion(messages=[]){
  const box=$('discussionMessages');if(!box)return;box.innerHTML='';
  const count=$('discussionCount');if(count)count.textContent=`${messages.length} message${messages.length===1?'':'s'}`;
  if(!messages.length){box.innerHTML='<div class="discussion-empty">No claims yet. Compare wake times, co-wakers, Treat State, and role claims.</div>';return}
  for(const m of messages){
    const row=document.createElement('article'),isBot=upper(m.senderKind||m.kind)==='BOT'||/^Ferret Bot\b/i.test(String(m.senderName||'')),isSelf=!!state?.me?.id&&String(m.senderId||m.participantId||'')===String(state.me.id);
    row.className='discussion-message'+(isBot?' bot':'')+(isSelf?' self':'');
    const head=document.createElement('div');head.className='discussion-message-head';const name=document.createElement('strong');name.textContent=m.senderName||'Ferret Frenzy';const stamp=document.createElement('time');stamp.textContent=messageTime(m);head.append(name,stamp);
    const body=document.createElement('p');body.textContent=m.text||'';row.append(head,body);box.append(row)
  }
  box.scrollTop=box.scrollHeight;
}
async function refreshChat(){if(!state||!['MORNING','VOTE','RESULTS','LOBBY'].includes(upper(state.game?.phase)))return;try{const r=await call('chat.list',{...gameRef(),limit:200});renderDiscussion(r?.messages||[])}catch{}}
function isHost(){const me=state?.me;if(me?.isHost===true)return true;return !!(state?.participants||[]).find(p=>p.id===me?.id)?.isHost}
function publicLockedVoteCount(){const g=state?.game||{},candidates=[g.lockedVoteCount,g.votesLocked,g.voteProgress?.locked,g.voteStatus?.lockedCount];for(const n of candidates){const x=Number(n);if(Number.isFinite(x)&&x>=0)return x}return null}
function renderVote(){
 const phase=upper(state?.game?.phase),vote=$('pawVote');if(!vote)return;socialStep(phase);vote.hidden=phase!=='VOTE';$('openVotingButton').hidden=!(phase==='MORNING'&&isHost());$('discussionForm').hidden=!['MORNING','VOTE'].includes(phase);$('discussionPhaseNote').textContent=phase==='MORNING'?'Morning Business: compare evidence and claims before the host opens Paw Point voting. Claims are not automatically verified.':phase==='VOTE'?'Paw Point is open. Discussion stays visible while everyone privately selects one player and locks once.':phase==='RESULTS'?'Paw Point is resolved. The discussion remains available for review.':'Discussion opens after Hour 12.';if(phase!=='VOTE')return;
 const me=state.me||{},prompt=me.actionPrompt||{},box=$('voteCandidates');box.innerHTML='';const guardianPending=prompt.kind==='ACTION'&&upper(prompt.type)==='GUARDIAN_PROTECT';
 for(const p of (state.participants||[]).filter(x=>x.id!==me.id)){const b=document.createElement('button');b.type='button';b.className='vote-candidate';b.dataset.targetId=p.id;b.setAttribute('role','radio');b.setAttribute('aria-checked',String(voteChoice===p.id));const card=window.FFCards?.playerBack?.(p,{selected:voteChoice===p.id})||document.createTextNode(seatLabel(p));b.append(card);const check=document.createElement('span');check.className='vote-check';check.setAttribute('aria-hidden','true');check.textContent='✓';b.append(check);if(voteChoice===p.id)b.classList.add('selected');b.disabled=guardianPending||!!me.voteLocked;b.addEventListener('click',()=>selectVote(p.id));box.append(b)}
 const selected=(state.participants||[]).find(p=>p.id===voteChoice);$('lockVoteButton').disabled=guardianPending||!voteChoice||!!me.voteLocked;$('lockVoteButton').textContent=me.voteLocked?'Paw Point Locked':voteChoice?`Lock ${seatLabel(selected||{})}`:'Lock Paw Point';$('clearVoteButton').disabled=guardianPending||!!me.voteLocked;$('voteStatus').textContent=guardianPending?'Guardian protection must be locked before your Paw Point. Press X.':me.voteLocked?'Your Paw Point is locked. You cannot change it; discussion remains visible while the others finish.':voteChoice?`Selected ${seatLabel(selected||{})}. Locking is final for this vote.`:'Choose exactly one player. Your selection stays private until the server resolves the Paw Point.';const locked=publicLockedVoteCount();$('voteProgress').textContent=me.voteLocked?(locked==null?'YOUR VOTE LOCKED':`${locked} LOCKED`):(locked==null?'PRIVATE SELECTION':`${locked} LOCKED`);if(!voteAutoOpened){voteAutoOpened=true;window.FerretFrenzyShell?.openPanel('chat')}
}
function selectVote(id){if(state?.me?.voteLocked)return;voteChoice=id;renderVote()}
async function lockVote(){if(!voteChoice||state?.me?.voteLocked)return;try{$('lockVoteButton').disabled=true;const next=await call('vote.cast',{...gameRef(),targetId:voteChoice});applyState(next)}catch(e){$('voteStatus').textContent=e.message;renderVote()}}
function confirmFocusedVote(){if(upper(state?.game?.phase)!=='VOTE'||state?.me?.voteLocked)return false;const active=document.activeElement;if(active?.classList?.contains('vote-candidate')){selectVote(active.dataset.targetId);return true}if(voteChoice){lockVote();return true}return false}
async function beginVoting(){try{const next=await call('vote.begin',gameRef());applyState(next)}catch(e){$('discussionPhaseNote').textContent=e.message}}
function makeRoleChoice(p,label){const b=document.createElement('button');b.type='button';b.className='role-target ff-role-target-card';b.dataset.id=p.id;const card=window.FFCards?.playerBack?.(p)||null;if(card)b.append(card);else b.textContent=label;return b}
function buildRoleAction(){const prompt=state?.me?.actionPrompt||{},panel=$('roleActionTargets'),confirm=$('roleActionConfirm'),pass=$('roleActionPass');if(!panel)return false;panel.innerHTML='';actionSelections=[];$('roleActionTitle').textContent=prompt.type?prompt.type.replaceAll('_',' '):'Role Action';$('roleActionPrompt').textContent=promptText(prompt);$('roleActionStatus').textContent='This choice is private and sent only to the authoritative game state.';pass.hidden=!prompt.optional;confirm.disabled=true;if(prompt.kind!=='ACTION')return false;
 const addButton=(b,id,choose)=>{b.onclick=()=>{if(choose>1){if(actionSelections.includes(id))actionSelections=actionSelections.filter(x=>x!==id);else if(actionSelections.length<choose)actionSelections.push(id)}else actionSelections=[id];[...panel.children].forEach(x=>x.classList.toggle('selected',actionSelections.includes(x.dataset.id)));confirm.disabled=actionSelections.length!==choose};panel.append(b)};
 const choose=Math.max(1,Number(prompt.choose||1));if(upper(prompt.type)==='DOOKER_PEEK_HAMMOCK'){for(let i=0;i<Number(prompt.hammockSlots||3);i++){const b=document.createElement('button');b.type='button';b.className='role-target ff-role-target-card';b.dataset.id=String(i);b.append(window.FFCards?.cardBack?.(`Hammock ${i+1}`,'FACE DOWN')||document.createTextNode(`Hammock ${i+1}`));addButton(b,String(i),1)}}else for(const p of (state.participants||[]).filter(x=>!prompt.excludeSelf||x.id!==state.me.id))addButton(makeRoleChoice(p,seatLabel(p)),p.id,choose);return true}
function openRoleAction(){if(upper(state?.game?.phase)==='PREP'&&state?.me?.startingRole&&!window.FFCards?.hasAcknowledged?.(state)){const banner=$('rollResult');if(banner)banner.textContent='Review your dealt role card before using a Pre-Game role action.';return false}if(!buildRoleAction())return false;window.FerretFrenzyShell?.openPanel('roleAction');return true}
async function submitRoleAction(pass=false){const prompt=state?.me?.actionPrompt||{};if(prompt.kind!=='ACTION')return;let data={...gameRef(),type:prompt.type};if(pass)data.pass=true;else if(upper(prompt.type)==='TROUBLE_SWAP'){data.targetAId=actionSelections[0];data.targetBId=actionSelections[1]}else if(upper(prompt.type)==='SNUGGLER_BOND'){data.targetAId=actionSelections[0];data.targetBId=actionSelections[1];data.targetIds=actionSelections.slice(0,2)}else if(upper(prompt.type)==='DOOKER_PEEK_HAMMOCK')data.hammockIndex=Number(actionSelections[0]);else data.targetId=actionSelections[0];try{const r=await call('game.action',data);if(r?.action?.role)window.FFCards?.transientReveal?.(r.action.role,{title:'DOOKER HAMMOCK PEEK',message:`Hammock ${Number(r.action.hammockIndex)+1}`});if(r?.state)applyState(r.state);else if(r?.game)applyState(r);else await poll();window.FerretFrenzyShell?.closePanels()}catch(e){$('roleActionStatus').textContent=e.message}}
function truthyActivity(v){if(v===true||v===1)return true;const t=upper(v);return ['TRUE','ACTIVE','BANDIT','BANDIT_SIDE','RAIDER','ACCOMPLICE','IN_ON_IT'].includes(t)}
function locallyManagedBanditSideActive(s){
  const hour=Number(s?.game?.currentHour||0);
  for(const bot of smartBotManager.instances?.values?.()||[]){const bs=bot?.lastState;if(upper(bs?.game?.phase)!=='NIGHT'||Number(bs?.game?.currentHour||0)!==hour||upper(bs?.me?.actionPrompt?.kind)==='SLEEP')continue;const me=bs?.me||{},role=upper(me.startingRole||me.role?.id),facts=Array.isArray(me.privateFacts)?me.privateFacts:[];if(role==='BANDIT'||/BANDIT/.test(upper(me.role?.team||me.role?.alignment||me.allegiance)))return true;if(facts.some(f=>upper(f?.type)==='TROUBLE_CONVERTED'||(upper(f?.type)==='HUNTER_CONVERSION'&&f?.converted===true)))return true;}
  return false;
}
function banditSideActivityHint(s){
  const g=s?.game||{},me=s?.me||{},hour=Number(g.currentHour||0);
  const direct=[g.banditOrAccompliceActive,g.banditSideActive,g.banditActivityActive,g.accompliceActive,g.raiderActive,g.threatActive,g.activity?.banditSide,g.activity?.banditOrAccomplice,g.nightActivity?.banditSide,me.audioCue,me.sleepCue?.banditSide,me.sleepCue?.banditOrAccomplice];
  if(direct.some(truthyActivity))return true;
  const roles=[];
  for(const list of [g.activeRoles,g.activeRoleIds,g.nightActivity?.activeRoles,g.activity?.activeRoles])if(Array.isArray(list))roles.push(...list);
  for(const a of [...(Array.isArray(g.activeActors)?g.activeActors:[]),...(Array.isArray(g.nightActivity?.activeActors)?g.nightActivity.activeActors:[])])roles.push(a?.role,a?.alignment,a?.allegiance,a?.status);
  if(roles.some(v=>/(BANDIT|RAIDER|ACCOMPLICE|IN[_ ]?ON[_ ]?IT)/i.test(String(v||''))))return true;
  const activeIds=[...(g.activeParticipantIds||[]),...(g.awakeParticipantIds||[]),...(g.pendingParticipantIds||[])].map(String);
  if(g.raiderId&&activeIds.includes(String(g.raiderId)))return true;
  const accompliceIds=[...(g.accompliceIds||[]),...(g.banditSideIds||[])].map(String);if(activeIds.some(id=>accompliceIds.includes(id)))return true;
  if(Date.now()<banditCueUntil)return true;
  if(locallyManagedBanditSideActive(s))return true;
  return false;
}
function applySleepLock(s){
  const phase=upper(s?.game?.phase),prompt=s?.me?.actionPrompt||{},sleeping=phase==='NIGHT'&&prompt.kind==='SLEEP',chitter=sleeping&&banditSideActivityHint(s);const lock=$('sleepLock');
  if(lock)lock.hidden=!sleeping;document.documentElement.classList.toggle('ff-sleeping',sleeping);document.body.classList.toggle('ff-sleeping',sleeping);window.FFAudio?.setChitterActive?.(chitter);
}
function syncStartControls(){const phase=upper(state?.game?.phase),host=isHost();document.querySelectorAll('[data-start-game]').forEach(b=>{const show=phase==='LOBBY'&&host;b.hidden=!show;b.disabled=!show});const reset=document.querySelector('[data-reset-game]');if(reset)reset.hidden=phase!=='LOBBY';const pause=$('pauseButton');if(pause){pause.hidden=!(phase==='NIGHT'&&host);pause.disabled=!(phase==='NIGHT'&&host)}}
async function fillBotsToTarget(target){let participants=(state.participants||[]).slice();if(state.game.allowBots===false||participants.length>=target)return participants;await smartBotManager.fillMissingRoles({code:room,target,currentParticipants:participants});const refreshed=await call('game.state',gameRef());if(refreshed?.game){applyState(refreshed);participants=refreshed.participants||participants}return participants}
async function startGame(){if(!state?.game)throw new Error('Game state is not connected yet.');const phase=upper(state.game.phase);if(phase!=='LOBBY')return state;if(!isHost())throw new Error('Only the host can start this Ferret Frenzy round.');const target=Math.max(4,Math.min(10,Number(state.game.targetPlayers||state.game.maxPlayers||6))),fillEmpty=state.game.allowBots!==false&&state.game.autoFillBots!==false;if(fillEmpty){$('networkStatus').textContent='LOBBY · HOST · filling empty seats with Ferret Frenzy v3 bots…';await fillBotsToTarget(target)}$('networkStatus').textContent='PRE-GAME · HOST · backend shuffling and randomly dealing private role cards…';const next=await call('game.start',{...gameRef(),force:true});applyState(next);smartBotManager.resumeRoom(room).catch(err=>console.warn('Ferret Frenzy v3 bot start:',err));return next}
function processEvents(events=[]){for(const ev of events){const type=upper(ev.type),h=Number(ev?.payload?.hour||0),at=Date.parse(ev.createdAt||'');if((type==='BURROW_HOUR'||type==='NIGHT_STARTED')&&Number.isFinite(at)){if(type==='BURROW_HOUR'){hourStartAt=at;hourStartHour=h||state?.game?.currentHour||1}else if(!hourStartAt){hourStartAt=at;hourStartHour=h||1}}if(/BANDIT_(?:ACTION|WAKE|ACTIVE)|RAIDER_(?:ACTION|WAKE|ACTIVE)|ACCOMPLICE_(?:ACTION|WAKE|ACTIVE)|IN_ON_IT|THEFT|MINNOW_STOLEN|TROUBLE_CONVERTED|HUNTER_CONVERSION/.test(type+' '+upper(ev?.payload?.cue||'')))banditCueUntil=Date.now()+6500;if(type==='MORNING_BUSINESS'){hourStartAt=0;hourStartHour=0;banditCueUntil=0}}}
function syncDicePrompt(s){const prompt=s?.me?.actionPrompt||{},phase=upper(s?.game?.phase);if(phase==='PREP'&&s?.me?.startingRole&&!window.FFCards?.hasAcknowledged?.(s)){FerretFrenzyGame.setRoleActionAvailable(false,'Review role card');window.FerretFrenzyShell?.setRequiredDie?.('','');const banner=$('rollResult');if(banner&&!window.FerretDice?.isRolling?.())banner.textContent='Pre-Game Step 1 · review your dealt role card, then continue.';lastPromptKey='ROLE_CARD';return;}FerretFrenzyGame.setRoleActionAvailable(prompt.kind==='ACTION',prompt.type||prompt.label||'Role action');const die=prompt.kind==='ROLL'?String(prompt.die||'').toLowerCase():'';window.FerretFrenzyShell?.setRequiredDie?.(die,prompt.purpose||'');const msg=promptText(prompt,s);if(msg&&prompt.kind!=='SLEEP'){const banner=$('rollResult');if(banner&&!window.FerretDice?.isRolling?.())banner.textContent=msg}
 const key=`${phase}:${s?.game?.currentHour||0}:${prompt.kind||''}:${prompt.type||prompt.purpose||''}`;if(prompt.kind==='ACTION'&&key!==lastPromptKey){lastPromptKey=key;setTimeout(()=>openRoleAction(),250)}else if(prompt.kind!=='ACTION')lastPromptKey=key}
function openPhasePanels(phase){if(phase==='MORNING')window.FerretFrenzyShell?.openPanel('chat');if(phase==='RESULTS'&&!resultsOpened){resultsOpened=true;window.FerretFrenzyShell?.openPanel('results')}}
function applyState(s){if(!s?.game)return;state=s;gameId=s.game.id||gameId;if(room&&gameId)localStorage.setItem(GAME_PREFIX+room,gameId);const phase=upper(s.game.phase),phaseLabel=phase==='PREP'?'PRE-GAME SETUP':phase;document.getElementById('ferretFrenzyShell').dataset.phase=phase.toLowerCase();if($('roomCodeValue'))$('roomCodeValue').textContent=String(s.game.code||room||'------');$('networkStatus').textContent=`${phaseLabel} · ${isHost()?'HOST':'PLAYER'} · BACKEND LIVE`;$('chatToolLabel').textContent=phase==='VOTE'?'VOTE':phase==='MORNING'?'DISCUSSION':'Discussion';applyPrivate(s);applyScene();phaseAudio(phase);applySleepLock(s);syncStartControls();window.FFCards?.sync?.(s);syncDicePrompt(s);renderVote();FerretFrenzyGame.syncBackendState(s,{hourStartAt:(phase==='NIGHT'&&hourStartHour===Number(s.game.currentHour))?hourStartAt:0,host:isHost()});if(phase==='RESULTS')$('rollResult').textContent=s.results?.primaryWinner?`${String(s.results.primaryWinner).toUpperCase()} SIDE · ROUND COMPLETE`:'ROUND COMPLETE';openPhasePanels(phase);refreshChat()}
async function poll(){if(polling)return;polling=true;try{const r=await call('events.poll',{...gameRef(),afterSeq,limit:200});processEvents(r?.events||[]);afterSeq=Number(r?.latestSeq||afterSeq);applyState(r?.state||r);$('networkStatus').classList.remove('offline')}catch(e){$('networkStatus').textContent='OFFLINE · RETRYING';$('networkStatus').classList.add('offline')}finally{polling=false}}
async function requestRoll(die){if(!state?.game)throw new Error('Game state is not connected.');const prompt=state?.me?.actionPrompt||{};if(prompt.kind!=='ROLL')throw new Error('No private die is required right now.');const required=String(prompt.die||'').toLowerCase();if(required&&die!==required)throw new Error(`${required.toUpperCase()} is required for ${String(prompt.purpose||'this roll').replaceAll('_',' ')}.`);const sides=die==='d12'?12:6;const r=await call('game.roll',{...gameRef(),die:sides});const roll=r?.roll||r,value=Number(roll?.result??roll?.value);if(r?.state)applyState(r.state);if(roll?.rerollRequired)$('rollResult').textContent=`${die.toUpperCase()} → ${value} duplicate · flick again`;return{result:value,duplicate:!!roll?.duplicate,rerollRequired:!!roll?.rerollRequired,purpose:roll?.purpose}}
async function advanceHour(){clearTimeout(advanceRetry);advanceRetry=0;if(!state||!isHost()||upper(state.game?.phase)!=='NIGHT'||FerretFrenzyGame.isPaused())return false;try{FerretFrenzyGame.setWaiting(false);const next=await call('game.advance',gameRef());hourStartAt=0;hourStartHour=0;applyState(next);return true}catch(e){if(e.code==='ACTIONS_PENDING'){FerretFrenzyGame.setWaiting(true);$('rollResult').textContent='Hour complete · waiting for awake ferret actions';advanceRetry=setTimeout(advanceHour,1500);return false}FerretFrenzyGame.setWaiting(false);$('rollResult').textContent='Clock advance error · '+e.message;advanceRetry=setTimeout(advanceHour,3000);return false}}
async function sendChat(text){const clean=String(text||'').trim();if(!clean||chatSending)return;chatSending=true;const send=$('discussionSendButton');if(send){send.disabled=true;send.textContent='Sending…'}try{await call('chat.send',{...gameRef(),text:clean});await refreshChat()}finally{chatSending=false;if(send){send.disabled=false;send.textContent='Send'}}}
const discussionInput=$('discussionInput');function updateChatCounter(){const n=discussionInput?.value?.length||0;const out=$('chatCharCount');if(out)out.textContent=`${n} / 500`}discussionInput?.addEventListener('input',updateChatCounter);updateChatCounter();
$('copyRoomCode')?.addEventListener('click',async()=>{const code=String(state?.game?.code||room||'');try{await navigator.clipboard.writeText(code);$('roomCodeStatus').textContent='Code copied.'}catch{$('roomCodeStatus').textContent='Room code: '+code}});$('discussionForm')?.addEventListener('submit',async e=>{e.preventDefault();const input=$('discussionInput'),text=input.value;if(!text.trim())return;input.value='';updateChatCounter();try{await sendChat(text)}catch(err){$('discussionPhaseNote').textContent=err.message}});$('lockVoteButton')?.addEventListener('click',lockVote);$('clearVoteButton')?.addEventListener('click',()=>{voteChoice='';renderVote()});$('openVotingButton')?.addEventListener('click',beginVoting);$('roleActionConfirm')?.addEventListener('click',()=>submitRoleAction(false));$('roleActionPass')?.addEventListener('click',()=>submitRoleAction(true));addEventListener('ferret-frenzy-action',e=>{if(e.detail?.type==='burrowHourExpired')advanceHour()});addEventListener('ff-role-card-acknowledged',()=>{if(state){syncDicePrompt(state);const prompt=state?.me?.actionPrompt||{};if(prompt.kind==='ACTION')setTimeout(()=>openRoleAction(),120)}});
window.FFNetwork={requestRoll,openRoleAction,confirmFocusedVote,getState:()=>state,poll,beginVoting,sendChat,startGame,advanceHour,getRequiredDie:()=>state?.me?.actionPrompt?.kind==='ROLL'?String(state.me.actionPrompt.die||'').toLowerCase():'',call};
if(!token){$('networkStatus').textContent='NO GUEST SESSION · RETURN TO LOBBY';$('rollResult').textContent='Return to lobby.html and join or create a burrow.'}else if(!gameId&&!room){$('networkStatus').textContent='NO ROOM · RETURN TO LOBBY'}else{poll();pollTimer=setInterval(()=>{if(document.visibilityState==='visible')poll()},1200)}
addEventListener('pagehide',()=>{window.FFAudio?.setChitterActive?.(false);if(pollTimer)clearInterval(pollTimer);if(advanceRetry)clearTimeout(advanceRetry)});
