import {FerretFrenzyApi} from './ferret-frenzy-bot-core.js';
import {BanditBot} from './bandit-bot.js';
import {BusinessBot} from './business-bot.js';
import {DookerBot} from './dooker-bot.js';
import {GuardianBot} from './guardian-bot.js';
import {HunterBot} from './hunter-bot.js';
import {ItchyBot} from './itchy-bot.js';
import {SnugglerBot} from './snuggler-bot.js';
import {TroubleBot} from './trouble-bot.js';
import {reserveAvailableRole,reserveRoleForSeat,setRoleReservation,releaseRoleReservation,getRoleReservations,missingRoleSlots,ensureParticipantReservations} from './assign-role.js';

const STORE='ff:smart-role-bots:v2';
const LEASE_PREFIX='ff:smart-role-bot-lease:';
const CLASS_BY_ROLE={BANDIT:BanditBot,BUSINESS:BusinessBot,DOOKER:DookerBot,GUARDIAN:GuardianBot,HUNTER:HunterBot,ITCHY:ItchyBot,SNUGGLER:SnugglerBot,TROUBLE:TroubleBot};
const read=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}};
const write=x=>{try{localStorage.setItem(STORE,JSON.stringify(x))}catch{}};
const codeKey=c=>String(c||'').replace(/\D/g,'').slice(0,6);
const uid=()=>globalThis.crypto?.randomUUID?.()||('b'+Date.now()+Math.random().toString(16).slice(2));

export class FerretFrenzySmartBotManager{
  constructor({apiUrl=globalThis.FF_BACKEND_URL||undefined}={}){this.api=new FerretFrenzyApi(apiUrl);this.instances=new Map();this.owner=uid();this.leaseTimers=new Map();}
  sessions(code){return (read()[codeKey(code)]||[]).slice()}
  _save(code,list){const all=read(),k=codeKey(code);if(list.length)all[k]=list;else delete all[k];write(all)}
  managedParticipantIds(code){return new Set(this.sessions(code).map(s=>s.participantId).filter(Boolean))}
  isManagedParticipant(code,id){return this.managedParticipantIds(code).has(id)}
  async addBot(code,index=1,{preferredRole='',expectedSeat=null,targetPlayers=8}={}){
    const k=codeKey(code);if(!k)throw new Error('A six-digit Ferret Frenzy room code is required.');
    const botKey='smartbot-'+uid();
    const reservation=preferredRole?reserveRoleForSeat(k,botKey,{seat:expectedSeat||index,targetPlayers,source:'start-fill'}):reserveAvailableRole(k,botKey);
    const displayName='Ferret Bot '+index,avatarKey='bot-ferret-'+index;
    try{
      const g=await this.api.guestCreate(displayName,avatarKey);
      const view=await this.api.lobbyJoin(g.guestToken,k);await this.api.lobbyReady(g.guestToken,k,true);
      const actualSeat=Number(view?.me?.seat||expectedSeat||index);
      const reservedRole=preferredRole||reservation.role;
      if(view?.me?.id)setRoleReservation(k,view.me.id,reservedRole,{authoritative:true,seat:actualSeat,source:'start-fill-participant'});
      const session={botKey,guestToken:g.guestToken,participantId:view?.me?.id||'',seat:actualSeat,displayName,avatarKey,roleReservation:reservedRole,createdAt:Date.now()};
      const list=this.sessions(k);list.push(session);this._save(k,list);return session;
    }catch(err){releaseRoleReservation(k,botKey);throw err}
  }
  async fillMissingRoles({code,target,currentParticipants=[]}={}){
    const k=codeKey(code),goal=Math.max(4,Math.min(12,Number(target)||8));
    ensureParticipantReservations(k,currentParticipants,goal);
    const slots=missingRoleSlots(k,{participants:currentParticipants,targetPlayers:goal});const added=[];let index=this.sessions(k).length+1;
    for(const slot of slots){
      try{const session=await this.addBot(k,index++,{preferredRole:slot.role,expectedSeat:slot.seat,targetPlayers:goal});added.push(session);currentParticipants=[...currentParticipants,{id:session.participantId,seat:session.seat,kind:'BOT'}]}
      catch(err){if(/full|started|join/i.test(String(err?.message||'')))break;throw err}
    }
    return added;
  }
  async fillToTarget({code,target,currentPlayers=0,maxBots=11}={}){
    const k=codeKey(code),goal=Math.max(0,Math.min(12,Number(target)||8));let count=Math.max(0,Number(currentPlayers)||0);const added=[];
    let nextIndex=this.sessions(k).length+1;
    while(count<goal&&added.length<maxBots){try{added.push(await this.addBot(k,nextIndex++,{expectedSeat:count+1,targetPlayers:goal}));count++;}catch(err){if(/full|started|join/i.test(String(err?.message||'')))break;throw err}}
    return added;
  }
  _acquireLease(code){
    const k=codeKey(code),key=LEASE_PREFIX+k;let old=null;try{old=JSON.parse(localStorage.getItem(key)||'null')}catch{}
    if(old&&old.owner!==this.owner&&Date.now()-Number(old.at||0)<9000)return false;
    const renew=()=>{try{localStorage.setItem(key,JSON.stringify({owner:this.owner,at:Date.now()}))}catch{}};renew();
    clearInterval(this.leaseTimers.get(k));this.leaseTimers.set(k,setInterval(renew,3500));return true;
  }
  _releaseLease(code){const k=codeKey(code),key=LEASE_PREFIX+k;clearInterval(this.leaseTimers.get(k));this.leaseTimers.delete(k);try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x?.owner===this.owner)localStorage.removeItem(key)}catch{}}
  async resumeRoom(code){
    const k=codeKey(code),sessions=this.sessions(k);if(!sessions.length)return {started:0,reason:'no-managed-bots'};
    if(!this._acquireLease(k))return {started:0,reason:'another-tab-running-bots'};
    let started=0;
    for(const s of sessions){
      try{
        const state=await this.api.gameState(s.guestToken,k);const role=String(state?.me?.startingRole||'').toUpperCase();if(!role||!CLASS_BY_ROLE[role])continue;
        // Actual backend deal is authoritative. The reservation is only a unique pre-game controller slot.
        setRoleReservation(k,s.botKey,role,{authoritative:true});
        const BotClass=CLASS_BY_ROLE[role];const bot=new BotClass({api:this.api,guestToken:s.guestToken,code:k,tickMs:1200,chatCooldownMs:5200});
        bot.bindSession({guestToken:s.guestToken,code:k});await bot.loadResponses();bot.run();this.instances.set(s.botKey,bot);started++;
      }catch(err){console.warn('Ferret Frenzy smart bot resume failed:',s.displayName,err)}
    }
    return {started};
  }
  stopRoom(code){for(const s of this.sessions(code)){const bot=this.instances.get(s.botKey);bot?.stop();this.instances.delete(s.botKey)}this._releaseLease(code)}
  async removeRoomBots(code){
    const k=codeKey(code),sessions=this.sessions(k);this.stopRoom(k);
    for(const s of sessions){try{await this.api.post('lobby.leave',{guestToken:s.guestToken,code:k})}catch{}releaseRoleReservation(k,s.botKey)}
    this._save(k,[]);return sessions.length;
  }
  describe(code){return {sessions:this.sessions(code),reservations:getRoleReservations(code)}}
}
export const smartBotManager=new FerretFrenzySmartBotManager();
export default smartBotManager;
