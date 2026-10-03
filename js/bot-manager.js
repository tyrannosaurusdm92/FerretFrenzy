import {FerretFrenzyApi} from './ferret-frenzy-api.js';
import {createRoleBot} from './ferret-frenzy-bot-roster.js';
import {FF_BRAIN_VERSION} from './ferret-frenzy-constants.js';

const STORE='ff:smart-role-bots:v3';
const LEGACY_STORE='ff:smart-role-bots:v2';
const LEASE_PREFIX='ff:smart-role-bot-lease:v3:';
const codeKey=value=>String(value||'').replace(/\D/g,'').slice(0,6);
const uid=()=>globalThis.crypto?.randomUUID?.()||('b'+Date.now()+Math.random().toString(16).slice(2));

function parseStore(key){
  try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}
}
function normalizeSession(s={}){
  return {
    botKey:String(s.botKey||('smartbot-'+uid())),
    guestToken:String(s.guestToken||''),
    participantId:String(s.participantId||''),
    seat:Number(s.seat||0),
    displayName:String(s.displayName||'Ferret Bot'),
    avatarKey:String(s.avatarKey||''),
    createdAt:Number(s.createdAt||Date.now())
  };
}
function readAll(){
  const current=parseStore(STORE);
  if(Object.keys(current).length)return current;
  const legacy=parseStore(LEGACY_STORE), migrated={};
  for(const [code,list] of Object.entries(legacy))if(Array.isArray(list))migrated[code]=list.map(normalizeSession).filter(s=>s.guestToken);
  if(Object.keys(migrated).length){try{localStorage.setItem(STORE,JSON.stringify(migrated))}catch{}}
  return migrated;
}
function writeAll(value){try{localStorage.setItem(STORE,JSON.stringify(value))}catch{}}

/**
 * Browser-owned Ferret Frenzy v3 bot seats.
 * Roles are NEVER reserved or assigned in the browser. Each bot receives its
 * authoritative startingRole from game.state after the tested backend deals.
 */
export class FerretFrenzySmartBotManager{
  constructor({apiUrl=globalThis.FF_BACKEND_URL||undefined}={}){
    this.api=new FerretFrenzyApi(apiUrl);
    this.instances=new Map();
    this.owner=uid();
    this.leaseTimers=new Map();
  }
  sessions(code){return (readAll()[codeKey(code)]||[]).map(normalizeSession)}
  _save(code,list){const all=readAll(),k=codeKey(code);if(list.length)all[k]=list.map(normalizeSession);else delete all[k];writeAll(all)}
  managedParticipantIds(code){return new Set(this.sessions(code).map(s=>s.participantId).filter(Boolean))}
  isManagedParticipant(code,id){return this.managedParticipantIds(code).has(String(id||''))}

  async addBot(code,index=1){
    const k=codeKey(code);if(!k)throw new Error('A six-digit Ferret Frenzy room code is required.');
    const botKey='smartbot-'+uid(),displayName=`Ferret Bot ${index}`,avatarKey=`bot-ferret-${index}`;
    const guest=await this.api.guestCreate(displayName,avatarKey);
    const joined=await this.api.lobbyJoin(guest.guestToken,k);
    const ready=await this.api.lobbyReady(guest.guestToken,k,true);
    const view=ready?.game?ready:joined;
    const session=normalizeSession({
      botKey,guestToken:guest.guestToken,
      participantId:view?.me?.id||joined?.me?.id||'',
      seat:view?.me?.seat||joined?.me?.seat||index,
      displayName:view?.me?.displayName||displayName,
      avatarKey:view?.me?.avatarKey||avatarKey,
      createdAt:Date.now()
    });
    const list=this.sessions(k);list.push(session);this._save(k,list);return session;
  }

  async fillMissingRoles({code,target,currentParticipants=[]}={}){
    return this.fillToTarget({code,target,currentPlayers:Array.isArray(currentParticipants)?currentParticipants.length:Number(currentParticipants)||0});
  }
  async fillToTarget({code,target,currentPlayers=0,maxBots=11}={}){
    const k=codeKey(code),goal=Math.max(0,Math.min(12,Number(target)||8));
    let count=Math.max(0,Number(currentPlayers)||0),nextIndex=this.sessions(k).length+1;const added=[];
    while(count<goal&&added.length<maxBots){
      try{added.push(await this.addBot(k,nextIndex++));count++;}
      catch(err){if(/full|started|join/i.test(String(err?.message||'')))break;throw err}
    }
    return added;
  }

  _acquireLease(code){
    const k=codeKey(code),key=LEASE_PREFIX+k;let old=null;try{old=JSON.parse(localStorage.getItem(key)||'null')}catch{}
    if(old&&old.owner!==this.owner&&Date.now()-Number(old.at||0)<9000)return false;
    const renew=()=>{try{localStorage.setItem(key,JSON.stringify({owner:this.owner,at:Date.now()}))}catch{}};renew();
    clearInterval(this.leaseTimers.get(k));this.leaseTimers.set(k,setInterval(renew,3500));return true;
  }
  _releaseLease(code){
    const k=codeKey(code),key=LEASE_PREFIX+k;clearInterval(this.leaseTimers.get(k));this.leaseTimers.delete(k);
    try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x?.owner===this.owner)localStorage.removeItem(key)}catch{}
  }

  async resumeRoom(code){
    const k=codeKey(code),sessions=this.sessions(k);if(!sessions.length)return {started:0,reason:'no-managed-bots',brainVersion:FF_BRAIN_VERSION};
    if(!this._acquireLease(k))return {started:0,reason:'another-tab-running-bots',brainVersion:FF_BRAIN_VERSION};
    let started=0;
    for(const s of sessions){
      try{
        const old=this.instances.get(s.botKey);old?.stop?.();
        const state=await this.api.gameState(s.guestToken,k),role=String(state?.me?.startingRole||'').toUpperCase();
        if(!role)continue;
        const bot=createRoleBot(role,{api:this.api,guestToken:s.guestToken,code:k,tickMs:1250,chatCooldownMs:6200});
        bot.bindSession({guestToken:s.guestToken,code:k});
        bot.lastState=state;
        await bot.loadResponses();
        void bot.run();
        this.instances.set(s.botKey,bot);started++;
      }catch(err){console.warn('Ferret Frenzy v3 bot resume failed:',s.displayName,err)}
    }
    return {started,brainVersion:FF_BRAIN_VERSION};
  }

  stopRoom(code){
    const keys=new Set(this.sessions(code).map(s=>s.botKey));
    for(const key of keys){const bot=this.instances.get(key);bot?.stop?.();this.instances.delete(key)}
    this._releaseLease(code);
  }

  async _leaveGuest(session,code){
    const res=await fetch(this.api.baseUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action:'lobby.leave',data:{guestToken:session.guestToken,code}}),cache:'no-store'});
    if(!res.ok)throw new Error(`Bot leave HTTP ${res.status}`);
    const body=await res.json();if(body?.ok===false)throw new Error(body?.error?.message||'Bot could not leave lobby.');
    return body?.data??body;
  }

  async removeRoomBots(code){
    const k=codeKey(code),sessions=this.sessions(k);this.stopRoom(k);
    for(const s of sessions){try{await this._leaveGuest(s,k)}catch{}}
    this._save(k,[]);return sessions.length;
  }

  describe(code){
    const sessions=this.sessions(code);
    return {brainVersion:FF_BRAIN_VERSION,sessions,running:sessions.map(s=>({botKey:s.botKey,role:this.instances.get(s.botKey)?.role||'',active:Boolean(this.instances.get(s.botKey)?.running)}))};
  }
}

export const smartBotManager=new FerretFrenzySmartBotManager();
export default smartBotManager;
