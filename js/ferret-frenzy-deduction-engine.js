import {FF_ROLES} from './ferret-frenzy-constants.js';
import {FerretFrenzyClaimParser} from './ferret-frenzy-claim-parser.js';
const arr=v=>Array.isArray(v)?v:[];const upper=v=>String(v??'').trim().toUpperCase();const uniq=xs=>[...new Set(xs.filter(Boolean))];
export class FerretFrenzyDeductionEngine {
  constructor({rng=Math.random,parser=new FerretFrenzyClaimParser()}={}){this.rng=rng;this.parser=parser;}
  facts(state,type){return arr(state?.me?.privateFacts).filter(f=>!type||f.type===type);} observations(state){return arr(state?.me?.observations);}
  hostile(state){return upper(state?.me?.allegiance)==='BANDIT'||state?.me?.isRaider===true||state?.me?.troubleAccomplice===true||state?.me?.hunterConverted===true;}
  knownAllies(state){const ids=[];for(const f of this.facts(state)){if(f.type==='BANDIT_ROSTER')for(const p of arr(f.participants))ids.push(p.participantId);if(f.type==='RAIDER_IDENTITY'&&f.participantId)ids.push(f.participantId);}if(this.hostile(state))ids.push(state?.me?.id);return uniq(ids);}
  recognized(state){return uniq(this.facts(state).filter(f=>['HUNTER_RECOGNITION','GUARDIAN_RECOGNITION'].includes(f.type)).map(f=>f.participantId));}
  theftWindow(state){const obs=this.observations(state);const changed=obs.filter(o=>o.treatChangedDuringWindow).map(o=>Number(o.hour));if(changed.length)return {earliest:Math.min(...changed),latest:Math.max(...changed),exact:changed[0]};const present=obs.filter(o=>upper(o.treatStateBefore)==='PRESENT').map(o=>Number(o.hour));const missing=obs.filter(o=>upper(o.treatStateBefore)==='MISSING').map(o=>Number(o.hour));return {earliest:present.length?Math.max(...present):1,latest:missing.length?Math.min(...missing):12,exact:null};}
  ingestMessages(messages,state,memory){const seen=new Set(arr(memory.seenMessageIds));for(const m of arr(messages)){if(!m?.id||seen.has(m.id))continue;seen.add(m.id);memory.seenMessageIds.push(m.id);memory.conversation.push({id:m.id,senderParticipantId:m.senderParticipantId,senderName:m.senderName||'',senderKind:m.senderKind||'',text:String(m.text||''),createdAt:m.createdAt||''});if(m.senderParticipantId&&m.senderParticipantId!==state?.me?.id)this.parser.update(memory,m.senderParticipantId,m.senderName,m.text,state?.participants);}memory.seenMessageIds=memory.seenMessageIds.slice(-450);memory.conversation=memory.conversation.slice(-220);}
  scoreTargets(state,memory){
    const participants=arr(state?.participants).filter(p=>p.id!==state?.me?.id),rows=new Map(participants.map(p=>[p.id,{participant:p,score:0,frameability:0,reasons:[]}]));
    const add=(id,w,reason,frame=0)=>{const r=rows.get(id);if(!r)return;r.score+=w;r.frameability+=frame;if(reason)r.reasons.push({weight:w,reason});};
    for(const f of this.facts(state)){
      if(f.type==='DOOKER_GLIMPSE'&&f.participantId)add(f.participantId,f.result==='BANDIT_ALIGNED'?110:-90,f.result==='BANDIT_ALIGNED'?'my Dooker Glimpse marked them Bandit-aligned':'my Dooker Glimpse marked them not Bandit-aligned',35);
      if(f.type==='ITCHY_PARTIAL_CLUE')for(const c of arr(f.candidates))add(c.participantId,28,'they are one of my two Raider-clue candidates',20);
      if(f.type==='HUNTER_RECOGNITION'&&f.participantId)add(f.participantId,-22,'I know they started as Hunter');
      if(f.type==='GUARDIAN_RECOGNITION'&&f.participantId)add(f.participantId,-25,'I know they started as Guardian');
      if(f.type==='SNUGGLE_BOND'&&f.participantId)add(f.participantId,-3,'bond is relationship evidence, not alignment proof');
      if(f.type==='BANDIT_ROSTER')for(const p of arr(f.participants))if(p.participantId!==state?.me?.id)add(p.participantId,-180,'I privately know this starting Bandit ally');
      if(f.type==='RAIDER_IDENTITY'&&f.participantId&&f.participantId!==state?.me?.id)add(f.participantId,-250,'I privately know the historical Raider');
    }
    const obs=this.observations(state);
    for(const o of obs){const co=arr(o.coWakers).map(x=>x.participantId);for(const c of arr(o.coWakers)){if(o.treatChangedDuringWindow)add(c.participantId,72,'they shared my theft-change window',45);else if(upper(o.treatStateBefore)==='PRESENT')add(c.participantId,1,'I saw them before the theft was complete');else add(c.participantId,3,'I saw them after the treats were missing');}
      for(const [pid,c] of Object.entries(memory.claims||{})){
        if(arr(c.wakeHours).includes(Number(o.hour))&&!co.includes(pid))add(pid,48,'they claimed my exact wake hour but I did not see them',35);
        for(const h of arr(c.wakeHours).map(Number)){if(c.treatState==='MISSING'&&upper(o.treatStateBefore)==='PRESENT'&&h<=Number(o.hour))add(pid,40,'their missing-treat timing conflicts with my later present observation',30);if(c.treatState==='PRESENT'&&upper(o.treatStateBefore)==='MISSING'&&h>=Number(o.hour))add(pid,40,'their present-treat timing conflicts with my earlier missing observation',30);}
      }
    }
    for(const [pid,c] of Object.entries(memory.claims||{})){
      if(c.contradictionCount)add(pid,Math.min(72,20*c.contradictionCount),'their public story changed',22*c.contradictionCount);
      const role=upper(c.role);if(role&&FF_ROLES.includes(role)){
        const seen=obs.filter(o=>arr(o.coWakers).some(x=>x.participantId===pid)).length;const oneWake=['BANDIT','TROUBLE','BUSINESS','SNUGGLER','GUARDIAN'].includes(role);if(oneWake&&seen>=2)add(pid,26,'their one-wake role claim conflicts with multiple windows where I saw them',22);
      }
      const rel=c.relation||{};for(const id of arr(rel.voteIds))add(id,0,'another player publicly leaned their Paw Point here',6);for(const id of arr(rel.suspectIds))add(id,0,'another player publicly suspected them',4);
    }
    for(const f of this.facts(state,'BUSINESS_WAKE_INSPECTION')){const c=memory.claims?.[f.participantId];if(!c?.wakeHours?.length)continue;const actual=arr(f.wakeHours).map(Number);const overlap=c.wakeHours.some(h=>actual.includes(Number(h)));add(f.participantId,overlap?-10:62,overlap?'their wake claim matches my Business inspection':'their wake claim conflicts with my Business inspection',overlap?0:40);}
    for(const r of rows.values()){r.score=Math.round((r.score+this.rng()*1.6)*10)/10;r.frameability=Math.round(r.frameability*10)/10;}
    return [...rows.values()].sort((a,b)=>b.score-a.score);
  }
  rankedTargets(state,memory,{excludeIds=[]}={}){const ex=new Set([state?.me?.id,...excludeIds].filter(Boolean));return this.scoreTargets(state,memory).filter(r=>!ex.has(r.participant.id));}
  bestReason(state,memory,id){const r=this.rankedTargets(state,memory).find(x=>x.participant.id===id);return r?.reasons?.slice().sort((a,b)=>Math.abs(b.weight)-Math.abs(a.weight))[0]?.reason||'';}
  voteTarget(state,memory){let rows=this.rankedTargets(state,memory);if(!rows.length)return null;const allies=new Set(this.knownAllies(state));rows=rows.filter(r=>!allies.has(r.participant.id));if(!rows.length)return null;if(!this.hostile(state))return rows[0].participant;
    // Hostile bots protect known allies and choose an innocent whose public story is easiest to sell as suspicious.
    rows.sort((a,b)=>(b.frameability+b.score*.35)-(a.frameability+a.score*.35));return rows[0].participant;
  }
  trustedTarget(state,memory){const rows=this.rankedTargets(state,memory),recognized=new Set(this.recognized(state));const rr=rows.filter(r=>recognized.has(r.participant.id)).sort((a,b)=>a.score-b.score);if(rr[0]&&rr[0].score<45)return rr[0].participant;return rows.slice().sort((a,b)=>a.score-b.score)[0]?.participant||null;}
  action(state,memory,prompt){const type=upper(prompt?.type),rows=this.rankedTargets(state,memory),others=arr(state?.participants).filter(p=>p.id!==state?.me?.id);if(!others.length)return null;
    if(type==='DOOKER_GLIMPSE')return {type,targetId:(rows[0]?.participant||others[0]).id};
    if(type==='DOOKER_PEEK_HAMMOCK')return {type,hammockIndex:Math.floor(this.rng()*Math.max(1,Number(prompt?.hammockSlots||3)))};
    if(type==='DOOKER_TRIP'){const peek=this.facts(state,'DOOKER_HAMMOCK_PEEK').slice(-1)[0];if(!this.hostile(state)&&upper(peek?.role)==='BANDIT')return {type,pass:true};if(this.rng()<.12)return {type,pass:true};const target=this.hostile(state)?this.trustedTarget(state,memory):rows[0]?.participant;return target?{type,pass:false,targetId:target.id}:{type,pass:true};}
    if(type==='TROUBLE_SWAP'){let pool=(this.hostile(state)?rows.slice().sort((a,b)=>a.score-b.score):rows).map(r=>r.participant);if(pool.length<2)pool=others;if(pool.length<2)return null;return {type,targetAId:pool[0].id,targetBId:pool[1].id};}
    if(type==='BUSINESS_INSPECT')return {type,targetId:(rows[0]?.participant||others[0]).id};
    if(type==='HUNTER_MARK'){const recognized=new Set(this.recognized(state));const t=rows.find(r=>!recognized.has(r.participant.id))?.participant||rows[0]?.participant||others[0];return {type,targetId:t.id};}
    if(type==='GUARDIAN_PROTECT'){const t=this.trustedTarget(state,memory)||others[0];return {type,targetId:t.id};}
    if(type==='SNUGGLER_BOND'){const pool=others.slice().sort(()=>this.rng()-.5);if(pool.length<2)return null;return {type,targetAId:pool[0].id,targetBId:pool[1].id};}
    return null;}
}
