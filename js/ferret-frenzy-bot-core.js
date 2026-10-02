/* Ferret Frenzy role-bot core. ES module. */
export const FERRET_FRENZY_BACKEND = 'https://script.google.com/macros/s/AKfycbyAShO3c_FLVqp-fisabNx_DMuLD0UYMPygU22_jQfpLjIs796fgsJPo3viZq5FGeYd1A/exec';
export const FERRET_FRENZY_BACKEND_ID = 'ferretfrenzy';
export const FERRET_FRENZY_ROLE_IDS = Object.freeze(['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN']);
export const FERRET_FRENZY_PHASES = Object.freeze(['LOBBY','PREP','NIGHT','MORNING','VOTE','RESULTS']);

const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
const now=()=>Date.now();
const upper=v=>String(v||'').trim().toUpperCase();
const arr=v=>Array.isArray(v)?v:[];
const choice=(xs,rng=Math.random)=>xs.length?xs[Math.floor(rng()*xs.length)]:null;
const shuffled=(xs,rng=Math.random)=>xs.slice().sort(()=>rng()-.5);
const byId=(state,id)=>arr(state?.participants).find(p=>p.id===id)||null;
const nameOf=(state,id)=>byId(state,id)?.displayName||'that ferret';

export class FerretFrenzyApiError extends Error {
  constructor(code,message,status=0,details=null){super(message||code||'Ferret Frenzy API error');this.name='FerretFrenzyApiError';this.code=code||'API_ERROR';this.status=status||0;this.details=details;}
}

export class FerretFrenzyApi {
  constructor(baseUrl=FERRET_FRENZY_BACKEND){this.baseUrl=String(baseUrl||FERRET_FRENZY_BACKEND).trim();}
  async post(action,data={}){
    if(!action) throw new FerretFrenzyApiError('MISSING_ACTION','Ferret Frenzy action is required.');
    const res=await fetch(this.baseUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action,data})});
    if(!res.ok) throw new FerretFrenzyApiError('HTTP_'+res.status,await res.text(),res.status);
    const body=await res.json();
    if(body?.backendId && body.backendId!==FERRET_FRENZY_BACKEND_ID) throw new FerretFrenzyApiError('WRONG_BACKEND','This bot only connects to the Ferret Frenzy backend.');
    if(body?.ok===false){const e=body.error||{};throw new FerretFrenzyApiError(e.code,e.message,e.status,e.details);}
    return body?.data ?? body;
  }
  health(){return this.post('health',{});}
  guestCreate(displayName,avatarKey){return this.post('guest.create',{displayName,avatarKey});}
  lobbyJoin(guestToken,code){return this.post('lobby.join',{guestToken,code});}
  lobbyReady(guestToken,code,ready=true){return this.post('lobby.ready',{guestToken,code,ready});}
  lobbyGet(guestToken,code){return this.post('lobby.get',{guestToken,code});}
  gameState(guestToken,code){return this.post('game.state',{guestToken,code});}
  gameRoll(guestToken,code,die){return this.post('game.roll',{guestToken,code,die});}
  gameAction(guestToken,code,payload){return this.post('game.action',{guestToken,code,...payload});}
  chatList(guestToken,code,limit=100){return this.post('chat.list',{guestToken,code,limit});}
  chatSend(guestToken,code,text){return this.post('chat.send',{guestToken,code,text});}
  voteCast(guestToken,code,targetId){return this.post('vote.cast',{guestToken,code,targetId});}
  eventsPoll(guestToken,code,afterSeq=0,limit=100){return this.post('events.poll',{guestToken,code,afterSeq,limit});}
}

export class FerretFrenzyRoleBot {
  constructor(config={}){
    this.role=upper(config.role);
    if(!FERRET_FRENZY_ROLE_IDS.includes(this.role)) throw new Error('Unknown Ferret Frenzy role: '+this.role);
    this.roleName=config.roleName||this.role;
    this.responseUrl=config.responseUrl||'';
    this.api=config.api||new FerretFrenzyApi(config.apiUrl||FERRET_FRENZY_BACKEND);
    this.guestToken=config.guestToken||'';
    this.code=String(config.code||'').trim();
    this.rng=config.rng||Math.random;
    this.responseLibrary=Array.isArray(config.responses)?config.responses.slice():[];
    this.tickMs=clamp(config.tickMs||1500,500,10000);
    this.chatCooldownMs=clamp(config.chatCooldownMs||6500,2500,60000);
    this.maxMorningMessages=clamp(config.maxMorningMessages||4,1,8);
    this.maxVoteMessages=clamp(config.maxVoteMessages||2,0,5);
    this.running=false;this.timer=null;this.lastState=null;this.lastError=null;
    this.memory={usedResponseIds:[],seenMessageIds:[],sentMorning:0,sentVote:0,lastChatAt:0,actions:{},lastSeq:0};
    this.storageKey='';
  }

  bindSession({guestToken,code}){this.guestToken=guestToken||this.guestToken;this.code=String(code||this.code||'').trim();this._setStorageKey();this._loadMemory();return this;}
  async createAndJoin({displayName='Ferret Bot',avatarKey='',code=this.code,ready=true}={}){
    const g=await this.api.guestCreate(displayName,avatarKey);
    this.guestToken=g.guestToken;this.code=String(code||'').trim();
    if(!this.code) throw new Error('A Ferret Frenzy room code is required.');
    await this.api.lobbyJoin(this.guestToken,this.code);
    if(ready) await this.api.lobbyReady(this.guestToken,this.code,true);
    this._setStorageKey();this._saveMemory();return g;
  }
  async loadResponses(){
    if(this.responseLibrary.length) return this.responseLibrary;
    if(!this.responseUrl) return [];
    const res=await fetch(this.responseUrl,{cache:'no-store'});if(!res.ok) throw new Error('Could not load '+this.responseUrl);
    const body=await res.json();const list=Array.isArray(body)?body:body.responses;
    if(!Array.isArray(list)||list.length!==250) throw new Error(this.roleName+' response JSON must contain exactly 250 responses.');
    this.responseLibrary=list;return list;
  }
  _setStorageKey(){if(this.code&&this.role)this.storageKey='ff-role-bot:'+this.code+':'+this.role;}
  _loadMemory(){try{if(this.storageKey&&globalThis.localStorage){const x=JSON.parse(localStorage.getItem(this.storageKey)||'null');if(x&&typeof x==='object')this.memory={...this.memory,...x,actions:{...this.memory.actions,...(x.actions||{})}};}}catch{} }
  _saveMemory(){try{if(this.storageKey&&globalThis.localStorage)localStorage.setItem(this.storageKey,JSON.stringify(this.memory));}catch{} }
  _needSession(){if(!this.guestToken||!this.code)throw new Error(this.roleName+' bot needs guestToken and room code.');}
  _assertStrictRole(state){const dealt=upper(state?.me?.startingRole);if(dealt&&dealt!==this.role)throw new Error(this.roleName+' bot refuses to play dealt role '+dealt+'. Load the matching role bot instead.');}
  _participants(state){return arr(state?.participants).filter(p=>p.id!==state?.me?.id);}
  _facts(state,type){return arr(state?.me?.privateFacts).filter(f=>!type||f.type===type);}
  _observations(state){return arr(state?.me?.observations);}
  _banditKnownIds(state){
    const fact=this._facts(state,'BANDIT_ROSTER')[0];const ids=arr(fact?.participants).map(x=>x.participantId);
    if(state?.me?.id&&upper(state?.me?.startingRole)==='BANDIT')ids.push(state.me.id);
    return [...new Set(ids.filter(Boolean))];
  }
  _recognizedTrustedIds(state){
    const ids=[];
    for(const f of this._facts(state)) if(['HUNTER_RECOGNITION','GUARDIAN_RECOGNITION'].includes(f.type)&&f.participantId) ids.push(f.participantId);
    return [...new Set(ids)];
  }
  _isBanditSide(state){return upper(state?.me?.allegiance)==='BANDIT'||state?.me?.troubleAccomplice===true||state?.me?.hunterConverted===true;}

  _suspicionScores(state){
    const scores=new Map(this._participants(state).map(p=>[p.id,0]));
    const add=(id,n)=>{if(scores.has(id))scores.set(id,(scores.get(id)||0)+n)};
    for(const o of this._observations(state)){
      for(const c of arr(o.coWakers)){
        if(o.treatChangedDuringWindow) add(c.participantId,8);
        else if(upper(o.treatStateBefore)==='MISSING') add(c.participantId,1.5);
        else add(c.participantId,.25);
      }
    }
    for(const f of this._facts(state)){
      if(f.type==='DOOKER_GLIMPSE'&&f.participantId) add(f.participantId,f.result==='BANDIT_ALIGNED'?100:-60);
      if(f.type==='ITCHY_PARTIAL_CLUE') for(const c of arr(f.candidates)) add(c.participantId,9);
      if(f.type==='BUSINESS_WAKE_INSPECTION'&&f.participantId){
        const win=this._inferTheftWindow(state);if(win){for(const h of arr(f.wakeHours))if(h>=win.low&&h<=win.high)add(f.participantId,4);}
      }
      if(['HUNTER_RECOGNITION','GUARDIAN_RECOGNITION'].includes(f.type)&&f.participantId)add(f.participantId,-18);
    }
    for(const [id,v] of scores)scores.set(id,v+this.rng());
    return scores;
  }
  _inferTheftWindow(state){
    const obs=this._observations(state);const present=obs.filter(o=>upper(o.treatStateBefore)==='PRESENT').map(o=>Number(o.hour)).filter(Number.isFinite);
    const missing=obs.filter(o=>upper(o.treatStateBefore)==='MISSING').map(o=>Number(o.hour)).filter(Number.isFinite);
    if(!present.length&&!missing.length)return null;
    return {low:present.length?Math.max(...present):1,high:missing.length?Math.min(...missing):12};
  }
  _rankedTargets(state,{excludeIds=[]}={}){
    const ex=new Set([state?.me?.id,...excludeIds].filter(Boolean));const scores=this._suspicionScores(state);
    return this._participants(state).filter(p=>!ex.has(p.id)).sort((a,b)=>(scores.get(b.id)||0)-(scores.get(a.id)||0));
  }
  _pickVoteTarget(state){
    let candidates=this._participants(state);if(!candidates.length)return null;
    if(this._isBanditSide(state)){
      const known=new Set(this._banditKnownIds(state));const nonTeam=candidates.filter(p=>!known.has(p.id));if(nonTeam.length)candidates=nonTeam;
      const scores=this._suspicionScores(state);candidates.sort((a,b)=>(scores.get(b.id)||0)-(scores.get(a.id)||0));
      return candidates[0]||choice(candidates,this.rng);
    }
    return this._rankedTargets(state)[0]||choice(candidates,this.rng);
  }
  _pickTrustedTarget(state){
    const trusted=this._recognizedTrustedIds(state).map(id=>byId(state,id)).filter(Boolean);if(trusted.length)return trusted[0];
    const scores=this._suspicionScores(state);return this._participants(state).sort((a,b)=>(scores.get(a.id)||0)-(scores.get(b.id)||0))[0]||null;
  }

  async _roleAction(state,prompt){
    const others=this._participants(state);if(!others.length)return null;
    if(this.role==='SNUGGLER'&&prompt.type==='SNUGGLER_BOND'){
      const picks=shuffled(others,this.rng).slice(0,2);if(picks.length<2)return null;
      this.memory.actions.bond=[picks[0].id,picks[1].id];return {type:'SNUGGLER_BOND',targetAId:picks[0].id,targetBId:picks[1].id};
    }
    if(this.role==='DOOKER'&&prompt.type==='DOOKER_GLIMPSE'){
      const t=this._rankedTargets(state)[0]||choice(others,this.rng);return {type:'DOOKER_GLIMPSE',targetId:t.id};
    }
    if(this.role==='DOOKER'&&prompt.type==='DOOKER_PEEK_HAMMOCK'){
      const idx=Math.floor(this.rng()*Math.max(1,Number(prompt.hammockSlots||3)));this.memory.actions.hammockIndex=idx;return {type:'DOOKER_PEEK_HAMMOCK',hammockIndex:idx};
    }
    if(this.role==='DOOKER'&&prompt.type==='DOOKER_TRIP'){
      const peek=this._facts(state,'DOOKER_HAMMOCK_PEEK').slice(-1)[0];
      if(peek?.role==='BANDIT'&&this.rng()<.88)return {type:'DOOKER_TRIP',pass:true};
      if(this.rng()<.28)return {type:'DOOKER_TRIP',pass:true};
      const t=this._rankedTargets(state)[0]||choice(others,this.rng);this.memory.actions.tripTarget=t.id;return {type:'DOOKER_TRIP',targetId:t.id};
    }
    if(this.role==='TROUBLE'&&prompt.type==='TROUBLE_SWAP'){
      const picks=shuffled(others,this.rng).slice(0,2);if(picks.length<2)return null;
      this.memory.actions.swap=[picks[0].id,picks[1].id];return {type:'TROUBLE_SWAP',targetAId:picks[0].id,targetBId:picks[1].id};
    }
    if(this.role==='BUSINESS'&&prompt.type==='BUSINESS_INSPECT'){
      const t=this._rankedTargets(state)[0]||choice(others,this.rng);this.memory.actions.inspect=t.id;return {type:'BUSINESS_INSPECT',targetId:t.id};
    }
    if(this.role==='HUNTER'&&prompt.type==='HUNTER_MARK'){
      const trusted=new Set(this._recognizedTrustedIds(state));const ranked=this._rankedTargets(state,{excludeIds:[...trusted]});const t=ranked[0]||choice(others.filter(p=>!trusted.has(p.id)),this.rng)||choice(others,this.rng);
      this.memory.actions.huntMark=t.id;return {type:'HUNTER_MARK',targetId:t.id};
    }
    if(this.role==='GUARDIAN'&&prompt.type==='GUARDIAN_PROTECT'){
      let t=null;const recognized=this._recognizedTrustedIds(state).map(id=>byId(state,id)).filter(Boolean);
      if(recognized.length&&this.rng()<.72)t=recognized[0];else t=this._pickTrustedTarget(state);
      if(!t)return null;this.memory.actions.protected=t.id;return {type:'GUARDIAN_PROTECT',targetId:t.id};
    }
    return null;
  }

  _chatContext(state){
    const vars={role:this.roleName};const obs=this._observations(state);if(obs.length){const o=obs[0];vars.hour=o.hour;vars.treatState=upper(o.treatStateBefore)||'UNKNOWN';vars.cowakers=arr(o.coWakers).map(x=>x.displayName).join(' and ')||'nobody';}
    const top=this._rankedTargets(state)[0];if(top)vars.target=top.displayName;
    const second=this._rankedTargets(state)[1];if(second)vars.target2=second.displayName;
    const glimpse=this._facts(state,'DOOKER_GLIMPSE').slice(-1)[0];if(glimpse){vars.glimpseTarget=glimpse.displayName||nameOf(state,glimpse.participantId);vars.glimpseResult=glimpse.result;}
    const ham=this._facts(state,'DOOKER_HAMMOCK_PEEK').slice(-1)[0];if(ham){vars.hammockRole=ham.role;vars.hammockSlot=Number(ham.hammockIndex)+1;}
    const trip=this._facts(state,'DOOKER_TRIP').slice(-1)[0];if(trip)vars.tripTarget=trip.displayName||nameOf(state,trip.targetId);
    const ic=this._facts(state,'ITCHY_PARTIAL_CLUE').slice(-1)[0];if(ic){const cs=arr(ic.candidates);vars.clueA=cs[0]?.displayName||'one ferret';vars.clueB=cs[1]?.displayName||'another ferret';}
    const it=this._facts(state,'ITCHY_TIMING_CLUE').slice(-1)[0];if(it)vars.range=it.range==='HOURS_1_6'?'Hours 1-6':'Hours 7-12';
    const ins=this._facts(state,'BUSINESS_WAKE_INSPECTION').slice(-1)[0];if(ins){vars.inspectTarget=ins.displayName||nameOf(state,ins.participantId);vars.inspectHours=arr(ins.wakeHours).join(', ');}
    const rec=this._facts(state).find(f=>['HUNTER_RECOGNITION','GUARDIAN_RECOGNITION'].includes(f.type));if(rec)vars.partner=rec.displayName||nameOf(state,rec.participantId);
    const raid=this._facts(state,'RAIDER_IDENTITY').slice(-1)[0];if(raid)vars.raider=raid.displayName||nameOf(state,raid.participantId);
    const swap=this._facts(state,'TROUBLE_SWAP').slice(-1)[0];if(swap){vars.swapA=nameOf(state,swap.targetAId);vars.swapB=nameOf(state,swap.targetBId);}
    if(this.memory.actions.bond){vars.bondA=nameOf(state,this.memory.actions.bond[0]);vars.bondB=nameOf(state,this.memory.actions.bond[1]);}
    return vars;
  }
  _preferredCategories(state){
    const cats=[];
    if(this.role==='DOOKER'){
      const g=this._facts(state,'DOOKER_GLIMPSE').slice(-1)[0];if(g?.result==='BANDIT_ALIGNED')cats.push('glimpse_bandit');if(g?.result==='NOT_BANDIT_ALIGNED')cats.push('glimpse_clean');
      if(this._facts(state,'DOOKER_TRIP').length)cats.push('observation');if(this._facts(state,'DOOKER_HAMMOCK_PEEK').length)cats.push('timeline');
    }
    if(this.role==='ITCHY'){
      if(this._facts(state,'ITCHY_PARTIAL_CLUE').length)cats.push('partial_clue');else if(this._facts(state,'ITCHY_TIMING_CLUE').length)cats.push('timing_clue');else cats.push('no_clue');
    }
    if(this.role==='TROUBLE'&&this._facts(state,'TROUBLE_SWAP').length)cats.push('swap_claim');
    if(this.role==='BUSINESS'&&this._facts(state,'BUSINESS_WAKE_INSPECTION').length)cats.push('solo_inspect');
    if(this.role==='SNUGGLER'&&(this.memory.actions.bond||this._facts(state,'SNUGGLER_BOND_SET').length))cats.push('bond_claim');
    if(this.role==='HUNTER'&&this._facts(state,'GUARDIAN_RECOGNITION').length&&!state?.me?.hunterConverted)cats.push('guardian_trust');
    if(this.role==='GUARDIAN'&&this._facts(state,'HUNTER_RECOGNITION').length)cats.push('hunter_trust');
    if(this.role==='BANDIT')cats.push('cover');
    cats.push('observation','question','timeline','suspicion','defense','vote','reaction','uncertainty');
    return cats;
  }
  _maybeBluffVars(state,vars){
    if(!this._isBanditSide(state)||this.rng()>.36)return vars;
    const v={...vars};
    if(v.treatState&&['PRESENT','MISSING'].includes(v.treatState))v.treatState=v.treatState==='PRESENT'?'MISSING':'PRESENT';
    if(Number.isFinite(Number(v.hour))&&this.rng()<.55)v.hour=((Number(v.hour)+Math.floor(this.rng()*5)+1-1)%12)+1;
    if(this.rng()<.45)v.cowakers='nobody';
    return v;
  }
  _render(text,vars){return String(text||'').replace(/\{\{([A-Za-z0-9_]+)\}\}/g,(_,k)=>String(vars[k]??'' )).replace(/\s+/g,' ').trim();}
  _pickResponse(state){
    const vars=this._maybeBluffVars(state,this._chatContext(state));const cats=this._preferredCategories(state);
    const used=new Set(this.memory.usedResponseIds);let pool=this.responseLibrary.filter(r=>!used.has(r.id)&&arr(r.requires).every(k=>vars[k]!==undefined&&vars[k]!==''));
    if(!pool.length){this.memory.usedResponseIds=[];pool=this.responseLibrary.filter(r=>arr(r.requires).every(k=>vars[k]!==undefined&&vars[k]!==''));}
    for(const c of cats){const cp=pool.filter(r=>r.category===c);if(cp.length){const r=choice(cp,this.rng);this.memory.usedResponseIds.push(r.id);if(this.memory.usedResponseIds.length>200)this.memory.usedResponseIds=this.memory.usedResponseIds.slice(-160);return this._render(r.text,vars);}}
    const r=choice(pool,this.rng);if(r){this.memory.usedResponseIds.push(r.id);return this._render(r.text,vars);}
    return this._fallbackLine(state,vars);
  }
  _fallbackLine(state,vars){
    if(vars.hour)return `I woke at Hour ${vars.hour}; the treats were ${String(vars.treatState||'unknown').toLowerCase()}. I am comparing that with the rest of the timeline.`;
    return 'I am comparing confirmed wake evidence before I lock a Paw Point.';
  }
  async _maybeChat(state){
    const phase=upper(state?.game?.phase);if(!['MORNING','VOTE'].includes(phase))return null;
    const max=phase==='MORNING'?this.maxMorningMessages:this.maxVoteMessages;const sentKey=phase==='MORNING'?'sentMorning':'sentVote';
    if(this.memory[sentKey]>=max||now()-this.memory.lastChatAt<this.chatCooldownMs)return null;
    let shouldSpeak=this.memory[sentKey]===0;
    try{
      const list=await this.api.chatList(this.guestToken,this.code,100);const messages=arr(list?.messages);const unseen=messages.filter(m=>!this.memory.seenMessageIds.includes(m.id));
      for(const m of unseen)this.memory.seenMessageIds.push(m.id);if(this.memory.seenMessageIds.length>300)this.memory.seenMessageIds=this.memory.seenMessageIds.slice(-220);
      if(unseen.some(m=>m.senderParticipantId!==state?.me?.id))shouldSpeak=true;
    }catch{}
    if(!shouldSpeak)return null;
    const text=this._pickResponse(state);if(!text)return null;
    const out=await this.api.chatSend(this.guestToken,this.code,text);this.memory[sentKey]++;this.memory.lastChatAt=now();this._saveMemory();return out;
  }

  async tick(){
    this._needSession();if(!this.responseLibrary.length)await this.loadResponses();
    let state=await this.api.gameState(this.guestToken,this.code);this._assertStrictRole(state);this.lastState=state;
    const phase=upper(state?.game?.phase),prompt=state?.me?.actionPrompt||{kind:'WAIT'};
    if(!FERRET_FRENZY_PHASES.includes(phase))throw new Error('Unknown Ferret Frenzy phase: '+phase);
    if(prompt.kind==='ROLL'){
      const die=Number(String(prompt.die||'').replace(/\D/g,''));if(![6,12].includes(die))throw new Error('Ferret Frenzy only permits d6 or d12 here.');
      const out=await this.api.gameRoll(this.guestToken,this.code,die);state=out?.state||state;this.lastState=state;this._saveMemory();return {kind:'ROLL',out,state};
    }
    if(prompt.kind==='ACTION'){
      const action=await this._roleAction(state,prompt);if(action){const out=await this.api.gameAction(this.guestToken,this.code,action);this._saveMemory();this.lastState=out?.state||state;return {kind:'ACTION',action,out,state:this.lastState};}
    }
    if(prompt.kind==='VOTE'&&!state?.me?.voteLocked){
      const target=this._pickVoteTarget(state);if(target){await this._maybeChat(state);const out=await this.api.voteCast(this.guestToken,this.code,target.id);this._saveMemory();this.lastState=out||state;return {kind:'VOTE',target,out,state:this.lastState};}
    }
    if(['MORNING','VOTE'].includes(phase)){const out=await this._maybeChat(state);return {kind:out?'CHAT':'WAIT',out,state};}
    return {kind:prompt.kind||'WAIT',state};
  }
  async run(){
    if(this.running)return this;this.running=true;
    const loop=async()=>{if(!this.running)return;try{await this.tick();this.lastError=null;}catch(e){this.lastError=e;}finally{if(this.running)this.timer=setTimeout(loop,this.tickMs);}};
    await loop();return this;
  }
  stop(){this.running=false;if(this.timer)clearTimeout(this.timer);this.timer=null;return this;}
}

export function createFerretFrenzyRoleBotClass(roleConfig){
  const role=upper(roleConfig.role);if(!FERRET_FRENZY_ROLE_IDS.includes(role))throw new Error('Invalid role config.');
  return class extends FerretFrenzyRoleBot{
    static ROLE=role;static ROLE_NAME=roleConfig.roleName||role;static COAT=roleConfig.coat||'';
    constructor(config={}){super({...config,role,roleName:roleConfig.roleName||role,responseUrl:config.responseUrl||roleConfig.responseUrl});}
  };
}
