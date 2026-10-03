/* Ferret Frenzy Revision 3 active-set helper.
   IMPORTANT: lobby seats never reserve, preview, or pre-assign roles.
   Online play is backend-authoritative. Any future offline game must build the Active Set
   at round start, shuffle once, then deal Starting Cards; it must not assign roles on join. */

export const FF_ROLE_IDS=Object.freeze(['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN']);
export const FF_SINGLE_COPY_ROLES=Object.freeze(['DOOKER','ITCHY','TROUBLE','SNUGGLER','HUNTER','GUARDIAN']);
export const FF_REPEATABLE_ROLES=Object.freeze(['BANDIT','BUSINESS']);
export const FF_ROLE_CAPACITY=Object.freeze({BANDIT:4,BUSINESS:14,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1});
export const FF_ACTIVE_SET_RECIPES=Object.freeze({
  4:Object.freeze({BANDIT:1,BUSINESS:3,DOOKER:1,HUNTER:1,GUARDIAN:1}),
  5:Object.freeze({BANDIT:1,BUSINESS:3,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1}),
  6:Object.freeze({BANDIT:1,BUSINESS:3,DOOKER:1,ITCHY:1,TROUBLE:1,HUNTER:1,GUARDIAN:1}),
  7:Object.freeze({BANDIT:2,BUSINESS:3,DOOKER:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1}),
  8:Object.freeze({BANDIT:2,BUSINESS:4,DOOKER:1,ITCHY:1,TROUBLE:1,HUNTER:1,GUARDIAN:1}),
  9:Object.freeze({BANDIT:2,BUSINESS:4,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1}),
 10:Object.freeze({BANDIT:2,BUSINESS:5,DOOKER:1,ITCHY:1,TROUBLE:1,SNUGGLER:1,HUNTER:1,GUARDIAN:1})
});
const randomFloat=()=>{try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}catch{return Math.random()}};
function shuffle(list){const out=[...list];for(let i=out.length-1;i>0;i--){const j=Math.floor(randomFloat()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export function activeSetRecipe(playerCount=6){const n=Math.max(4,Math.min(10,Number(playerCount)||6));return {...(FF_ACTIVE_SET_RECIPES[n]||FF_ACTIVE_SET_RECIPES[10])}}
export function buildRandomActiveSet(playerCount=6){const recipe=activeSetRecipe(playerCount),cards=[];for(const [role,count] of Object.entries(recipe))for(let i=0;i<count;i++)cards.push(role);return shuffle(cards)}
export function roleCounts(assignments){const counts={};for(const value of Object.values(assignments||{})){const role=String(typeof value==='string'?value:value?.role||'').toUpperCase();if(role)counts[role]=(counts[role]||0)+1}return counts}
export function missingRoleSlots(roomCode,{participants=[],targetPlayers=8}={}){const occupied=new Set(participants.map(p=>Number(p.seat)).filter(Number.isFinite)),n=Math.max(4,Math.min(10,Number(targetPlayers)||8)),out=[];for(let seat=1;seat<=n;seat++)if(!occupied.has(seat))out.push({seat,role:null});return out}
const api={FF_ROLE_IDS,FF_SINGLE_COPY_ROLES,FF_REPEATABLE_ROLES,FF_ROLE_CAPACITY,FF_ACTIVE_SET_RECIPES,activeSetRecipe,buildRandomActiveSet,missingRoleSlots};
if(typeof window!=='undefined')window.FFAssignRole=api;
export default api;
