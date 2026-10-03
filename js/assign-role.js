/* Ferret Frenzy legacy/offline random-deal helper.
   LIVE ONLINE PLAY DOES NOT USE THIS FILE TO ASSIGN ROLES. The tested Apps Script
   backend builds the active set, shuffles it, deals Starting Cards, and remains
   authoritative. This module exists only for older local-transport utilities. */

export const FF_ROLE_IDS=Object.freeze(['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN']);
export const FF_SINGLE_COPY_ROLES=Object.freeze(['DOOKER','ITCHY','TROUBLE','SNUGGLER','HUNTER','GUARDIAN']);
export const FF_REPEATABLE_ROLES=Object.freeze(['BANDIT','BUSINESS']);
export const FF_ROLE_CAPACITY=Object.freeze({BANDIT:4,BUSINESS:14,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1});
/* Kept for old imports only. It is NOT a seat plan. */
export const FF_CONTROLLER_ORDER=Object.freeze([...FF_ROLE_IDS]);
export const FF_ACTIVE_SET_RECIPES=Object.freeze({
  4:Object.freeze({BANDIT:1,BUSINESS:3,DOOKER:1,HUNTER:1,GUARDIAN:1}),
  5:Object.freeze({BANDIT:1,BUSINESS:3,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1}),
  6:Object.freeze({BANDIT:1,BUSINESS:3,DOOKER:1,ITCHY:1,TROUBLE:1,HUNTER:1,GUARDIAN:1}),
  7:Object.freeze({BANDIT:2,BUSINESS:3,DOOKER:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1}),
  8:Object.freeze({BANDIT:2,BUSINESS:4,DOOKER:1,ITCHY:1,TROUBLE:1,HUNTER:1,GUARDIAN:1}),
  9:Object.freeze({BANDIT:2,BUSINESS:4,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1}),
 10:Object.freeze({BANDIT:2,BUSINESS:5,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1})
});
const STORE='ff:role-reservations:v4-legacy-random';
const norm=v=>String(v||'').trim().toUpperCase();
const keyFor=code=>String(code||'local').replace(/\D/g,'').slice(0,6)||String(code||'local');
function read(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
function write(x){try{localStorage.setItem(STORE,JSON.stringify(x))}catch{}}
function ensureRoom(all,code){const k=keyFor(code);if(!all[k]||typeof all[k]!=='object')all[k]={};return[k,all[k]]}
function randomFloat(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}catch{return Math.random()}}
function shuffle(list){const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(randomFloat()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function expandedPool(counts=FF_ROLE_CAPACITY){const out=[];for(const role of FF_ROLE_IDS)for(let i=0;i<Number(counts[role]||0);i++)out.push(role);return out}
export function activeSetRecipe(playerCount=6){const n=Math.max(4,Math.min(10,Number(playerCount)||6));return {...(FF_ACTIVE_SET_RECIPES[n]||FF_ACTIVE_SET_RECIPES[10])}}
export function buildRandomActiveSet(playerCount=6){const recipe=activeSetRecipe(playerCount),cards=[];for(const [role,count] of Object.entries(recipe))for(let i=0;i<count;i++)cards.push(role);return shuffle(cards)}
export function roleCounts(assignments){const counts={};for(const value of Object.values(assignments||{})){const role=norm(typeof value==='string'?value:value?.role);if(role)counts[role]=(counts[role]||0)+1}return counts}
export function getRoleReservations(roomCode){const all=read(),room=all[keyFor(roomCode)]||{},out={};for(const[id,value]of Object.entries(room))out[id]=typeof value==='string'?{role:norm(value)}:{...value,role:norm(value?.role)};return out}
export function pickAvailableRole({takenRoles=[]}={}){const counts={};for(const raw of takenRoles){const role=norm(typeof raw==='string'?raw:raw?.role);if(role)counts[role]=(counts[role]||0)+1}const remaining=expandedPool().filter(role=>(counts[role]||0)<FF_ROLE_CAPACITY[role]);if(!remaining.length)return{role:'',duplicate:false};const role=remaining[Math.floor(randomFloat()*remaining.length)];return{role,duplicate:(counts[role]||0)>0}}
export function roleForSeat(){return expandedPool()[Math.floor(randomFloat()*24)]||'BUSINESS'}
export function controllerPlan(targetPlayers=8){const n=Math.max(4,Math.min(10,Number(targetPlayers)||8));const set=buildRandomActiveSet(n);return set.slice(0,n).map((role,i)=>({seat:i+1,role}))}
export function setRoleReservation(roomCode,participantKey,role,{authoritative=false,seat=null,source='legacy-local'}={}){if(!participantKey)throw new Error('participantKey is required.');role=norm(role);if(!FF_ROLE_IDS.includes(role))throw new Error('Unknown Ferret Frenzy role: '+role);const all=read(),[key,room]=ensureRoom(all,roomCode);room[participantKey]={role,seat:seat==null?null:Number(seat)||null,source,at:Date.now(),authoritative:!!authoritative};all[key]=room;write(all);return role}
export function reserveAvailableRole(roomCode,participantKey,{seat=null,source='legacy-local'}={}){const all=read(),[key,room]=ensureRoom(all,roomCode);if(room[participantKey])return{role:norm(room[participantKey].role||room[participantKey]),duplicate:false,reused:true};const picked=pickAvailableRole({takenRoles:Object.values(room)});if(!picked.role)return picked;room[participantKey]={role:picked.role,seat:seat==null?null:Number(seat)||null,source,at:Date.now(),authoritative:false};all[key]=room;write(all);return{...picked,reused:false}}
export function reserveRoleForSeat(roomCode,participantKey,{seat=1,source='legacy-local-random'}={}){return{...reserveAvailableRole(roomCode,participantKey,{seat,source}),seat:Number(seat)||1}}
export function reserveLobbyView(view,{source='legacy-local-random'}={}){const code=view?.game?.code||view?.code||'',me=view?.me||{},id=me.id||me.participantId||'';if(!code||!id)return null;return reserveRoleForSeat(code,id,{seat:me.seat||1,source})}
export function ensureParticipantReservations(roomCode,participants=[]){const result=[];for(const p of [...participants].sort((a,b)=>Number(a.seat||0)-Number(b.seat||0))){const id=p.id||p.participantId||p.deviceId;if(!id)continue;const picked=reserveAvailableRole(roomCode,id,{seat:p.seat,source:'legacy-local-reconcile'});result.push({participantKey:id,seat:Number(p.seat)||result.length+1,role:picked.role})}return result}
export function missingRoleSlots(roomCode,{participants=[],targetPlayers=8}={}){const occupied=new Set(participants.map(p=>Number(p.seat)).filter(Number.isFinite)),n=Math.max(4,Math.min(10,Number(targetPlayers)||8)),out=[];for(let seat=1;seat<=n;seat++)if(!occupied.has(seat))out.push({seat,role:null});return out}
export function releaseRoleReservation(roomCode,participantKey){const all=read(),key=keyFor(roomCode),room=all[key]||{};delete room[participantKey];if(Object.keys(room).length)all[key]=room;else delete all[key];write(all)}
export function clearRoleReservations(roomCode){const all=read();delete all[keyFor(roomCode)];write(all)}
const api={FF_ROLE_IDS,FF_SINGLE_COPY_ROLES,FF_REPEATABLE_ROLES,FF_ROLE_CAPACITY,FF_ACTIVE_SET_RECIPES,activeSetRecipe,buildRandomActiveSet,controllerPlan,roleForSeat,reserveRoleForSeat,reserveLobbyView,ensureParticipantReservations,missingRoleSlots,reserveAvailableRole,setRoleReservation,releaseRoleReservation,clearRoleReservations,getRoleReservations,pickAvailableRole};if(typeof window!=='undefined')window.FFAssignRole=api;export default api;
