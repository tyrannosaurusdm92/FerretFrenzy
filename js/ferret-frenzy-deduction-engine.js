import {FF_ROLES} from './ferret-frenzy-constants.js';
import {FerretFrenzyClaimParser} from './ferret-frenzy-claim-parser.js';
const arr=v=>Array.isArray(v)?v:[];
const upper=v=>String(v??'').trim().toUpperCase();
const uniq=xs=>[...new Set(xs.filter(Boolean))];
export class FerretFrenzyDeductionEngine {
  constructor({rng=Math.random,parser=new FerretFrenzyClaimParser()}={}){this.rng=rng;this.parser=parser;}
  facts(state,type){return arr(state?.me?.privateFacts).filter(f=>!type||f.type===type);}
  observations(state){return arr(state?.me?.observations);}
  hostile(state){return upper(state?.me?.allegiance)==='BANDIT'||state?.me?.isRaider===true||state?.me?.troubleAccomplice===true||state?.me?.hunterConverted===true;}
  raiderIds(state){return uniq(this.facts(state,'RAIDER_IDENTITY').map(f=>f.participantId||f.raiderId).filter(Boolean));}
  startingBanditIds(state){const ids=[];for(const f of this.facts(state,'BANDIT_ROSTER'))for(const p of arr(f.participants))ids.push(p.participantId);return uniq(ids);}
  knownAllies(state){return uniq([...this.startingBanditIds(state),...this.raiderIds(state),...(this.hostile(state)?[state?.me?.id]:[])]);}
  recognized(state){return uniq(this.facts(state).filter(f=>['HUNTER_RECOGNITION','GUARDIAN_RECOGNITION'].includes(f.type)).map(f=>f.participantId));}
  theftWindow(state){const obs=this.observations(state);const changed=obs.filter(o=>o.treatChangedDuringWindow).map(o=>Number(o.hour));if(changed.length)return {earliest:Math.min(...changed),latest:Math.max(...changed),exact:changed[0]};const present=obs.filter(o=>upper(o.treatStateBefore)==='PRESENT').map(o=>Number(o.hour));const missing=obs.filter(o=>upper(o.treatStateBefore)==='MISSING').map(o=>Number(o.hour));return {earliest:present.length?Math.max(...present):1,latest:missing.length?Math.min(...missing):12,exact:null};}
  ingestMessages(messages,state,memory){const seen=new Set(arr(memory.seenMessageIds));for(const m of arr(messages)){if(!m?.id||seen.has(m.id))continue;seen.add(m.id);memory.seenMessageIds.push(m.id);memory.conversation.push({id:m.id,senderParticipantId:m.senderParticipantId,senderName:m.senderName||'',senderKind:m.senderKind||'',text:String(m.text||''),createdAt:m.createdAt||''});if(m.senderParticipantId&&m.senderParticipantId!==state?.me?.id)this.parser.update(memory,m.senderParticipantId,m.senderName,m.text,state?.participants);}memory.seenMessageIds=memory.seenMessageIds.slice(-450);memory.conversation=memory.conversation.slice(-220);}
  claimTreatRows(c){
    const rows=[];
    for(const [h,s] of Object.entries(c?.treatStatesByHour||{})){const hour=Number(h),state=upper(s);if(hour>=1&&hour<=12&&['PRESENT','MISSING','PRESENT_TO_MISSING'].includes(state))rows.push({hour,state});}
    if(rows.length)return rows;
    if(c?.treatState&&arr(c?.wakeHours).length===1)return [{hour:Number(c.wakeHours[0]),state:upper(c.treatState)}];
    return [];
  }
  scoreTargets(state,memory){
    const participants=arr(state?.participants).filter(p=>p.id!==state?.me?.id),rows=new Map(participants.map(p=>[p.id,{participant:p,score:0,frameability:0,reasons:[]}]))
      ,add=(id,w,reason,frame=0)=>{const r=rows.get(id);if(!r)return;r.score+=w;r.frameability+=frame;if(reason)r.reasons.push({weight:w,reason});};
    for(const f of this.facts(state)){
      if(f.type==='DOOKER_GLIMPSE'&&f.participantId){const gh=Number(f.observedAtHour||f.hour||0);const laterMove=this.facts(state).some(m=>{const mh=Number(m.hour||m.atHour||0);if(gh&&mh&&mh<=gh)return false;if(m.type==='DOOKER_TRIP')return String(m.participantId||m.targetId)===String(f.participantId);if(m.type==='TROUBLE_SWAP')return [m.targetAId,m.targetBId].map(String).includes(String(f.participantId));return false;});const bandit=f.result==='BANDIT_ALIGNED';add(f.participantId,laterMove?(bandit?38:-18):(bandit?76:-54),laterMove?`my Dooker Glimpse was ${bandit?'Bandit-aligned':'not Bandit-aligned'} at Hour ${gh||'?'} but later known card movement can make it stale`:(bandit?'my Dooker Glimpse marked them Bandit-aligned at that moment':'my Dooker Glimpse marked them not Bandit-aligned at that moment'),laterMove?14:24);}
      if(f.type==='ITCHY_PARTIAL_CLUE')for(const c of arr(f.candidates))add(c.participantId,34,'they are one of my two historical-Raider clue candidates',22);
      if(f.type==='HUNTER_RECOGNITION'&&f.participantId)add(f.participantId,-10,'I know they started as Hunter, but that trust can become stale after conversion');
      if(f.type==='GUARDIAN_RECOGNITION'&&f.participantId)add(f.participantId,-18,'I know they started as Guardian');
      if(f.type==='SNUGGLE_BOND'&&f.participantId)add(f.participantId,0,'bond is relationship evidence, not alignment proof');
      if(f.type==='BANDIT_ROSTER')for(const p of arr(f.participants))if(p.participantId!==state?.me?.id)add(p.participantId,-80,'I privately know this player started Bandit; card movement can still change dawn allegiance');
      if(f.type==='RAIDER_IDENTITY'&&(f.participantId||f.raiderId)&&String(f.participantId||f.raiderId)!==String(state?.me?.id))add(f.participantId||f.raiderId,-260,'I privately know the historical Raider');
    }
    const obs=this.observations(state);
    for(const o of obs){
      const co=arr(o.coWakers).map(x=>x.participantId);
      for(const c of arr(o.coWakers)){if(o.treatChangedDuringWindow)add(c.participantId,72,'they shared my theft-change window',45);else if(upper(o.treatStateBefore)==='PRESENT')add(c.participantId,1,'I saw them before the theft was complete');else add(c.participantId,3,'I saw them after the treats were missing');}
      for(const [pid,c] of Object.entries(memory.claims||{})){
        if(arr(c.wakeHours).includes(Number(o.hour))&&!co.includes(pid))add(pid,48,'they claimed my exact wake hour but I did not see them',35);
        for(const row of this.claimTreatRows(c)){const h=Number(row.hour);if(row.state==='MISSING'&&upper(o.treatStateBefore)==='PRESENT'&&h<=Number(o.hour))add(pid,40,`their Hour ${h} MISSING claim conflicts with my later Hour ${o.hour} PRESENT observation`,30);if(row.state==='PRESENT'&&upper(o.treatStateBefore)==='MISSING'&&h>=Number(o.hour))add(pid,40,`their Hour ${h} PRESENT claim conflicts with my earlier Hour ${o.hour} MISSING observation`,30);if(row.state==='PRESENT_TO_MISSING'&&upper(o.treatStateBefore)==='PRESENT'&&h<Number(o.hour))add(pid,44,`their Hour ${h} theft-window claim conflicts with my later Hour ${o.hour} PRESENT observation`,32);if(row.state==='PRESENT_TO_MISSING'&&upper(o.treatStateBefore)==='MISSING'&&h>Number(o.hour))add(pid,44,`their Hour ${h} theft-window claim conflicts with my earlier Hour ${o.hour} MISSING observation`,32);}
      }
    }
    for(const [pid,c] of Object.entries(memory.claims||{})){
      if(c.contradictionCount)add(pid,Math.min(72,20*c.contradictionCount),'their public story contains a mechanically relevant contradiction',22*c.contradictionCount);
      const role=upper(c.role);if(role&&FF_ROLES.includes(role)){
        const seen=obs.filter(o=>arr(o.coWakers).some(x=>x.participantId===pid)).length;const oneWake=['BANDIT','TROUBLE','BUSINESS','SNUGGLER','GUARDIAN'].includes(role);if(oneWake&&seen>=2)add(pid,26,'their one-wake role claim conflicts with multiple windows where I saw them',22);
      }
      const rel=c.relation||{};for(const id of arr(rel.voteIds))add(id,0,'another player publicly leaned their Paw Point here',6);for(const id of arr(rel.suspectIds))add(id,0,'another player publicly suspected them',4);
    }
    for(const f of this.facts(state,'BUSINESS_WAKE_INSPECTION')){const c=memory.claims?.[f.participantId];if(!c?.wakeHours?.length)continue;const actual=Number(f.inspectedWakeHour||f.wakeHour||f.resultHour||f.result||0);if(!actual)continue;const overlap=c.wakeHours.some(h=>Number(h)===actual);add(f.participantId,overlap?-8:48,overlap?'their public wake claim includes the one wake result I inspected':'their public wake claim does not include the one wake result I inspected',overlap?0:28);}
    for(const r of rows.values()){r.score=Math.round((r.score+this.rng()*1.6)*10)/10;r.frameability=Math.round(r.frameability*10)/10;}
    return [...rows.values()].sort((a,b)=>b.score-a.score);
  }
  rankedTargets(state,memory,{excludeIds=[]}={}){const ex=new Set([state?.me?.id,...excludeIds].filter(Boolean));return this.scoreTargets(state,memory).filter(r=>!ex.has(r.participant.id));}
  bestReason(state,memory,id){const r=this.rankedTargets(state,memory).find(x=>x.participant.id===id);return r?.reasons?.slice().sort((a,b)=>Math.abs(b.weight)-Math.abs(a.weight))[0]?.reason||'';}
  voteTarget(state,memory){
    let rows=this.rankedTargets(state,memory);if(!rows.length)return null;
    const hostile=this.hostile(state),role=upper(state?.me?.startingRole);
    if(!hostile&&role==='ITCHY'){
      const clue=this.facts(state,'ITCHY_PARTIAL_CLUE').slice(-1)[0],ids=arr(clue?.candidates).map(x=>x.participantId).filter(Boolean);
      if(ids.length===2&&clue?.degraded!==true){const set=new Set(ids);const inPair=rows.filter(r=>set.has(r.participant.id));if(inPair.length)rows=inPair;}
    }
    if(!hostile)return rows[0]?.participant||null;
    const raiders=new Set(this.raiderIds(state)),startingBandits=new Set(this.startingBanditIds(state));
    rows=rows.filter(r=>!raiders.has(r.participant.id));if(!rows.length)return null;
    // Hostile bots absolutely protect a known historical Raider. Other starting Bandits are normally
    // protected, but can be sacrificed if public pressure makes that materially more useful for Raider survival.
    rows.sort((a,b)=>{
      const utility=r=>r.frameability+r.score*.35-(startingBandits.has(r.participant.id)?90:0);
      return utility(b)-utility(a);
    });
    return rows[0].participant;
  }
  protectionTarget(state,memory){
    const rows=this.rankedTargets(state,memory);if(!rows.length)return null;
    const recognized=new Set(this.recognized(state));
    // Guardian recognition is historical, not a current-allegiance clear. Prefer a low-suspicion player
    // who has contributed a mechanically useful public story; give starting Hunter only a small trust nudge.
    const claims=memory.claims||{};
    const value=r=>{const c=claims[r.participant.id]||{},evidence=(arr(c.wakeHours).length?10:0)+(Object.keys(c.treatStatesByHour||{}).length||c.treatState?8:0)+(c.coWakerIds?.length?5:0);const recognition=recognized.has(r.participant.id)?4:0;return evidence+recognition-r.score;};
    return rows.slice().sort((a,b)=>value(b)-value(a))[0]?.participant||null;
  }
  trustedTarget(state,memory){const rows=this.rankedTargets(state,memory);return rows.slice().sort((a,b)=>a.score-b.score)[0]?.participant||null;}
  action(state,memory,prompt){const type=upper(prompt?.type),rows=this.rankedTargets(state,memory),others=arr(state?.participants).filter(p=>p.id!==state?.me?.id);if(!others.length)return null;
    if(type==='DOOKER_GLIMPSE')return {type,targetId:(rows[0]?.participant||others[0]).id};
    if(type==='DOOKER_PEEK_HAMMOCK')return {type,hammockIndex:Math.floor(this.rng()*Math.max(1,Number(prompt?.hammockSlots||3)))};
    if(type==='DOOKER_TRIP'){const peek=this.facts(state,'DOOKER_HAMMOCK_PEEK').slice(-1)[0];if(!this.hostile(state)&&upper(peek?.role)==='BANDIT')return {type,pass:true};if(this.rng()<.12)return {type,pass:true};const target=this.hostile(state)?this.trustedTarget(state,memory):rows[0]?.participant;return target?{type,pass:false,targetId:target.id}:{type,pass:true};}
    if(type==='TROUBLE_SWAP'){let pool=(this.hostile(state)?rows.slice().sort((a,b)=>a.score-b.score):rows).map(r=>r.participant);const raiders=new Set(this.raiderIds(state));if(this.hostile(state)&&raiders.size)pool=pool.filter(p=>!raiders.has(p.id));if(pool.length<2)pool=others.filter(p=>!raiders.has(p.id));if(pool.length<2)return {type,pass:true};return {type,targetAId:pool[0].id,targetBId:pool[1].id};}
    if(type==='BUSINESS_INSPECT')return {type,targetId:(rows[0]?.participant||others[0]).id};
    if(type==='HUNTER_MARK'){if(state?.me?.hunterConverted===true||upper(state?.me?.allegiance)==='BANDIT')return {type,pass:true};const recognized=new Set(this.recognized(state));const t=rows.find(r=>!recognized.has(r.participant.id))?.participant||rows[0]?.participant||others[0];return {type,targetId:t.id};}
    if(type==='GUARDIAN_PROTECT'){const t=this.protectionTarget(state,memory)||others[0];return {type,targetId:t.id};}
    if(type==='SNUGGLER_BOND'){const pool=others.slice().sort(()=>this.rng()-.5);if(pool.length<2)return null;return {type,targetAId:pool[0].id,targetBId:pool[1].id};}
    return null;}
}
