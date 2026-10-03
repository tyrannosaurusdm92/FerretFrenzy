/* Revision 3.2 voting helpers. These mirror the dossier's client-side legality rules;
   the authoritative backend must still validate every vote and resolution. */
const arr=v=>Array.isArray(v)?v:[];
const setOf=v=>v==null?null:new Set(arr(v).map(String));
export function tallyVotes(votes,{eligibleActorIds=null,eligibleTargetIds=null,allowSelf=false}={}){
  const actors=setOf(eligibleActorIds),targets=setOf(eligibleTargetIds),seenActors=new Set(),m=new Map();
  for(const v of arr(votes)){
    const actor=String(v?.actorId??''),target=String(v?.targetId??'');
    if(!actor||!target)continue;
    if(!allowSelf&&actor===target)continue;
    if(actors&&!actors.has(actor))continue;
    if(targets&&!targets.has(target))continue;
    if(seenActors.has(actor))continue;
    seenActors.add(actor);
    m.set(target,(m.get(target)||0)+1);
  }
  return Object.fromEntries(m);
}
export function topTargets(votes,{protectedIds=[],eligibleActorIds=null,eligibleTargetIds=null,allowSelf=false}={}){
  const tally=tallyVotes(votes,{eligibleActorIds,eligibleTargetIds,allowSelf});
  for(const id of arr(protectedIds))delete tally[String(id)];
  const vals=Object.values(tally).filter(n=>Number(n)>0);
  if(!vals.length)return [];
  const max=Math.max(...vals);
  return Object.entries(tally).filter(([,n])=>n===max&&n>0).map(([id])=>id);
}
export function simultaneousLock(drafts,eligibleIds,{allowSelf=false}={}){
  const eligible=new Set(arr(eligibleIds).map(String)),locks=[];
  for(const [actorRaw,targetRaw] of Object.entries(drafts||{})){
    const actorId=String(actorRaw),targetId=String(targetRaw??'');
    if(!eligible.has(actorId)||!eligible.has(targetId))continue;
    if(!allowSelf&&actorId===targetId)continue;
    locks.push({actorId,targetId,lockedAt:Date.now()});
  }
  return locks;
}
