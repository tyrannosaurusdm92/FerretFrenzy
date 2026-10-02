/* Ferret Frenzy pre-game role reservation helper.
   IMPORTANT: the tested Apps Script backend remains authoritative for the real hidden
   Starting Card when the round starts. These lobby reservations exist so create/join
   immediately receives a non-duplicate role-controller slot and Start Game can add
   smart guest-bots for missing role-controller slots without changing the backend. */

export const FF_ROLE_IDS=Object.freeze(['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN']);
export const FF_SINGLE_COPY_ROLES=Object.freeze(['DOOKER','ITCHY','TROUBLE','SNUGGLER','HUNTER','GUARDIAN']);
export const FF_REPEATABLE_ROLES=Object.freeze(['BANDIT','BUSINESS']);
export const FF_ROLE_CAPACITY=Object.freeze({BANDIT:4,BUSINESS:14,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1});
export const FF_CONTROLLER_ORDER=Object.freeze(['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN','BUSINESS','BANDIT','BUSINESS','BANDIT']);

const STORE='ff:role-reservations:v3';
const norm=v=>String(v||'').trim().toUpperCase();
const keyFor=code=>String(code||'local').replace(/\D/g,'').slice(0,6)||String(code||'local');
const safeSeat=v=>Math.max(1,Math.min(12,Number(v)||1));
function read(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
function write(x){try{localStorage.setItem(STORE,JSON.stringify(x))}catch{}}
function ensureRoom(all,code){const k=keyFor(code);if(!all[k]||typeof all[k]!=='object')all[k]={};return [k,all[k]]}

export function roleCounts(assignments){const counts={};for(const value of Object.values(assignments||{})){const role=norm(typeof value==='string'?value:value?.role);if(role)counts[role]=(counts[role]||0)+1}return counts}
export function getRoleReservations(roomCode){const all=read();const room=all[keyFor(roomCode)]||{};const out={};for(const [id,value] of Object.entries(room))out[id]=typeof value==='string'?{role:norm(value)}:{...value,role:norm(value?.role)};return out}
export function roleForSeat(seat,targetPlayers=8){
  seat=safeSeat(seat);const target=Math.max(4,Math.min(12,Number(targetPlayers)||8));
  const plan=FF_CONTROLLER_ORDER.slice(0,target);
  return plan[(seat-1)%plan.length]||'BUSINESS';
}
export function controllerPlan(targetPlayers=8){const n=Math.max(4,Math.min(12,Number(targetPlayers)||8));return Array.from({length:n},(_,i)=>({seat:i+1,role:roleForSeat(i+1,n)}))}
export function pickAvailableRole({takenRoles=[],preferredRoles=FF_CONTROLLER_ORDER,allowRepeatableFallback=true}={}){
  const counts={};for(const raw of takenRoles){const role=norm(typeof raw==='string'?raw:raw?.role);if(role)counts[role]=(counts[role]||0)+1}
  const order=[...preferredRoles.map(norm).filter(r=>FF_ROLE_IDS.includes(r)),...FF_CONTROLLER_ORDER].filter((r,i,a)=>a.indexOf(r)===i);
  for(const role of order)if((counts[role]||0)<(FF_ROLE_CAPACITY[role]||0))return{role,duplicate:(counts[role]||0)>0};
  if(!allowRepeatableFallback)return{role:'',duplicate:false};
  const repeat=FF_REPEATABLE_ROLES.filter(r=>(counts[r]||0)<FF_ROLE_CAPACITY[r]).sort((a,b)=>(counts[a]||0)-(counts[b]||0));
  return{role:repeat[0]||'',duplicate:!!repeat.length&&(counts[repeat[0]]||0)>0};
}
export function setRoleReservation(roomCode,participantKey,role,{authoritative=false,seat=null,source='manual'}={}){
  if(!participantKey)throw new Error('participantKey is required for a Ferret Frenzy role reservation.');role=norm(role);if(!FF_ROLE_IDS.includes(role))throw new Error('Unknown Ferret Frenzy role: '+role);
  const all=read(),[key,room]=ensureRoom(all,roomCode),counts=roleCounts(Object.fromEntries(Object.entries(room).filter(([id])=>id!==participantKey)));
  if(!authoritative&&(counts[role]||0)>=(FF_ROLE_CAPACITY[role]||0))throw new Error(role+' has no unreserved card/controller slot in this room.');
  room[participantKey]={role,seat:seat==null?null:Number(seat)||null,source,at:Date.now(),authoritative:!!authoritative};all[key]=room;write(all);return role;
}
export function reserveRoleForSeat(roomCode,participantKey,{seat=1,targetPlayers=8,source='create/join'}={}){
  const role=roleForSeat(seat,targetPlayers);setRoleReservation(roomCode,participantKey,role,{seat,source});return{role,seat:safeSeat(seat),targetPlayers:Number(targetPlayers)||8,reused:false};
}
export function reserveLobbyView(view,{source='create/join'}={}){
  const code=view?.game?.code||view?.code||'';const me=view?.me||{};const id=me.id||me.participantId||'';if(!code||!id)return null;
  const current=getRoleReservations(code)[id];if(current?.role)return{...current,reused:true};
  return reserveRoleForSeat(code,id,{seat:me.seat||1,targetPlayers:view?.game?.targetPlayers||8,source});
}
export function ensureParticipantReservations(roomCode,participants=[],targetPlayers=8){
  const sorted=[...participants].sort((a,b)=>Number(a.seat||0)-Number(b.seat||0));const result=[];
  for(const p of sorted){const id=p.id||p.participantId||p.deviceId;if(!id)continue;const role=roleForSeat(p.seat||result.length+1,targetPlayers);setRoleReservation(roomCode,id,role,{authoritative:true,seat:p.seat,source:'host-reconcile'});result.push({participantKey:id,seat:Number(p.seat)||result.length+1,role});}
  return result;
}
export function missingRoleSlots(roomCode,{participants=[],targetPlayers=8}={}){
  const occupied=new Set(participants.map(p=>Number(p.seat)).filter(Number.isFinite));const n=Math.max(4,Math.min(12,Number(targetPlayers)||8));const out=[];
  for(let seat=1;seat<=n;seat++)if(!occupied.has(seat))out.push({seat,role:roleForSeat(seat,n)});
  // Backends normally allocate the next free seat, so sort by seat for deterministic bot joins.
  return out.sort((a,b)=>a.seat-b.seat);
}
export function reserveAvailableRole(roomCode,participantKey,{preferredRoles,allowRepeatableFallback=true,seat=null,source='available'}={}){
  const all=read(),[key,room]=ensureRoom(all,roomCode);if(room[participantKey]){const value=room[participantKey];return{role:norm(value.role||value),duplicate:false,reused:true}}
  const picked=pickAvailableRole({takenRoles:Object.values(room),preferredRoles,allowRepeatableFallback});if(!picked.role)return picked;
  room[participantKey]={role:picked.role,seat:seat==null?null:Number(seat)||null,source,at:Date.now(),authoritative:false};all[key]=room;write(all);return{...picked,reused:false};
}
export function releaseRoleReservation(roomCode,participantKey){const all=read(),key=keyFor(roomCode),room=all[key]||{};delete room[participantKey];if(Object.keys(room).length)all[key]=room;else delete all[key];write(all)}
export function clearRoleReservations(roomCode){const all=read();delete all[keyFor(roomCode)];write(all)}

const api={FF_ROLE_IDS,FF_SINGLE_COPY_ROLES,FF_REPEATABLE_ROLES,FF_ROLE_CAPACITY,controllerPlan,roleForSeat,reserveRoleForSeat,reserveLobbyView,ensureParticipantReservations,missingRoleSlots,reserveAvailableRole,setRoleReservation,releaseRoleReservation,clearRoleReservations,getRoleReservations,pickAvailableRole};
if(typeof window!=='undefined')window.FFAssignRole=api;
export default api;
