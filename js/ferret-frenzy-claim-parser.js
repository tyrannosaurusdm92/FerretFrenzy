import {FF_ROLES} from './ferret-frenzy-constants.js';
const arr=v=>Array.isArray(v)?v:[];
const upper=v=>String(v??'').trim().toUpperCase();
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const uniq=xs=>[...new Set(xs.filter(x=>x!==''&&x!==null&&x!==undefined))];
const ROLE_WAKE_CAPS=Object.freeze({BANDIT:1,DOOKER:3,ITCHY:2,TROUBLE:1,BUSINESS:1,SNUGGLER:1,HUNTER:2,GUARDIAN:1});
function esc(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function hourPairs(text){
  const out={};
  for(const m of text.matchAll(/\bhour\s*#?\s*(1[0-2]|[1-9])\b[^.!?\n]{0,110}?\bchanged\s+from\s+present\s+to\s+missing\b/ig))out[Number(m[1])]='PRESENT_TO_MISSING';
  const patterns=[
    /\bhour\s*#?\s*(1[0-2]|[1-9])\b[^.!?\n]{0,72}?\b(?:treats?|minnow\s+treats?)?\s*(?:were|was|=|:)?\s*(present|missing)\b/ig,
    /\b(present|missing)\b[^.!?\n]{0,72}?\bhour\s*#?\s*(1[0-2]|[1-9])\b/ig
  ];
  for(const re of patterns){
    for(const m of text.matchAll(re)){
      const first=String(m[1]||'');
      const isHour=/^\d+$/.test(first);
      const h=Number(isHour?m[1]:m[2]);
      const state=upper(isHour?m[2]:m[1]);
      if(h>=1&&h<=12&&['PRESENT','MISSING'].includes(state)&&!out[h])out[h]=state;
    }
  }
  return out;
}
function wakeCap(role){return ROLE_WAKE_CAPS[upper(role)]||3;}
function contradiction(c,reason){c.contradictionCount++;c.contradictionReasons.push(reason);}
function roleClaim(text){
  const roleNames='Bandit|Dooker|Itchy|Trouble|Business|Snuggler|Hunter|Guardian';
  const patterns=[
    new RegExp(`\\b(?:my\\s+(?:claim|role)\\s+(?:is|was)|i\\s*(?:am|'m)\\s+claiming|i\\s*(?:am|'m)|claiming)\\s*(${roleNames})\\b`,'i'),
    new RegExp(`\\b(?:my\\s+)?role\\s+claim\\s*(?:is|was|[:=])\\s*(${roleNames})\\b`,'i'),
    new RegExp(`\\bvolunteering\\s+my\\s+role\\s+claim\\s*[:=]?\\s*(${roleNames})\\b`,'i'),
    new RegExp(`\\brole\\s*[:=]\\s*(${roleNames})\\b`,'i')
  ];
  let role='';for(const re of patterns){const m=re.exec(text);if(m){role=upper(m[1]);break;}}
  if(!role||!FF_ROLES.includes(role))return {role:'',roleScope:''};
  let roleScope='STARTING';
  if(/\bas\s+(?:both\s+)?my\s+starting\s+role\s+and\s+current\s+card(?:\s+are\s+the\s+same)?\b/i.test(text))roleScope='BOTH';
  else if(/\bas\s+my\s+current\s+card\b/i.test(text))roleScope='CURRENT';
  else if(/\bas\s+my\s+starting\s+role\b/i.test(text))roleScope='STARTING';
  return {role,roleScope};
}
export class FerretFrenzyClaimParser {
  extract(text,participants=[]){
    const s=clean(text),rc=roleClaim(s),role=rc.role,roleScope=rc.roleScope;
    const wakeHours=[];
    for(const m of s.matchAll(/\b(?:hour|wake(?:d)?(?:\s+at)?|woke(?:\s+at)?)\s*#?\s*(1[0-2]|[1-9])\b/ig))wakeHours.push(Number(m[1]));
    for(const m of s.matchAll(/\bhour\s+(1[0-2]|[1-9])\b/ig))wakeHours.push(Number(m[1]));
    const treatStatesByHour=hourPairs(s);
    let treatState='';const tm=/\b(?:treats?|minnow\s+treats?)\b[^.!?\n]{0,55}\b(present|missing)\b/i.exec(s);if(tm)treatState=upper(tm[1]);
    const coWakerIds=[],suspectIds=[],trustIds=[],voteIds=[];
    for(const p of arr(participants)){
      if(!p?.displayName)continue;const n=esc(p.displayName);
      if(new RegExp('\\b(?:saw|with|awake\\s+with|woke\\s+with)\\b[^.!?\\n]{0,70}\\b'+n+'\\b','i').test(s))coWakerIds.push(p.id);
      if(new RegExp('\\b(?:suspect|watching|watch|think|lying|liar|bandit|raider|suspicious)\\b[^.!?\\n]{0,70}\\b'+n+'\\b','i').test(s)||new RegExp('\\b'+n+'\\b[^.!?\\n]{0,45}\\b(?:suspect|lying|bandit|raider|suspicious)\\b','i').test(s))suspectIds.push(p.id);
      if(new RegExp('\\b(?:trust|trusted|clean|believe)\\b[^.!?\\n]{0,70}\\b'+n+'\\b','i').test(s))trustIds.push(p.id);
      if(new RegExp('\\b(?:vote|paw\\s*point|point(?:ing)?)\\b[^.!?\\n]{0,70}\\b'+n+'\\b','i').test(s))voteIds.push(p.id);
    }
    const glimpse=/\bglimpse\b[^.!?\n]{0,100}\b(bandit[- ]aligned|not bandit[- ]aligned)\b/i.exec(s);
    const relation={suspectIds:uniq(suspectIds),trustIds:uniq(trustIds),voteIds:uniq(voteIds)};
    return {role,roleScope,wakeHours:uniq(wakeHours).sort((a,b)=>a-b),treatState,treatStatesByHour,coWakerIds:uniq(coWakerIds),glimpseResult:glimpse?upper(glimpse[1]).replace(/ /g,'_').replace('-','_'):'',relation};
  }
  update(memory,senderId,senderName,text,participants=[]){
    const x=this.extract(text,participants);if(!senderId)return x;
    memory.claims=memory.claims||{};
    let c=memory.claims[senderId]||{senderId,senderName:senderName||'',role:'',currentCard:'',roleScope:'',wakeHours:[],treatState:'',treatStatesByHour:{},coWakerIds:[],contradictionCount:0,contradictionReasons:[],statements:[],relation:{suspectIds:[],trustIds:[],voteIds:[]}};
    c.treatStatesByHour=c.treatStatesByHour||{};c.currentCard=c.currentCard||'';
    if(x.role){
      if(x.roleScope==='CURRENT'){
        if(c.currentCard&&c.currentCard!==x.role)contradiction(c,`Current Card claim changed from ${c.currentCard} to ${x.role}`);
        c.currentCard=x.role;
      }else if(x.roleScope==='BOTH'){
        if(c.role&&c.role!==x.role)contradiction(c,`Starting Role claim changed from ${c.role} to ${x.role}`);
        if(c.currentCard&&c.currentCard!==x.role)contradiction(c,`Current Card claim changed from ${c.currentCard} to ${x.role}`);
        c.role=x.role;c.currentCard=x.role;
      }else{
        if(c.role&&c.role!==x.role)contradiction(c,`Starting Role claim changed from ${c.role} to ${x.role}`);
        c.role=x.role;
      }
      c.roleScope=x.roleScope||c.roleScope;
      if((x.roleScope==='STARTING'||x.roleScope==='BOTH')&&c.role&&c.wakeHours.length>wakeCap(c.role))contradiction(c,`${c.role} Starting Role claim permits fewer wake hours than already claimed`);
    }
    if(x.wakeHours.length){
      const before=uniq(c.wakeHours).sort((a,b)=>a-b),combined=uniq([...before,...x.wakeHours]).sort((a,b)=>a-b),cap=c.role?wakeCap(c.role):3;
      if(c.role&&cap===1&&before.length&&x.wakeHours.some(h=>!before.includes(h)))contradiction(c,`one-wake Starting Role claim changed from Hour ${before[0]} to Hour ${x.wakeHours.find(h=>!before.includes(h))}`);
      else if(c.role&&combined.length>cap&&before.length<=cap)contradiction(c,`wake claim now contains ${combined.length} distinct hours but Starting Role ${c.role} allows at most ${cap}`);
      c.wakeHours=combined;
    }
    const mapped={...x.treatStatesByHour};
    if(x.treatState&&Object.keys(mapped).length===0){
      const hours=x.wakeHours.length===1?x.wakeHours:(c.wakeHours.length===1?c.wakeHours:[]);
      if(hours.length===1)mapped[hours[0]]=x.treatState;
      else c.treatState=x.treatState;
    }
    for(const [hour,stateValue] of Object.entries(mapped)){
      const prior=upper(c.treatStatesByHour[hour]);const next=upper(stateValue);
      const transition=v=>v==='PRESENT_TO_MISSING';
      if(prior&&next&&prior!==next&&!transition(prior)&&!transition(next))contradiction(c,`Treat State claim for Hour ${hour} changed from ${prior} to ${next}`);
      if(next)c.treatStatesByHour[hour]=transition(prior)?prior:next;
    }
    if(x.treatState)c.treatState=x.treatState;
    c.coWakerIds=uniq([...c.coWakerIds,...x.coWakerIds]);
    c.relation={suspectIds:uniq([...(c.relation?.suspectIds||[]),...x.relation.suspectIds]),trustIds:uniq([...(c.relation?.trustIds||[]),...x.relation.trustIds]),voteIds:uniq([...(c.relation?.voteIds||[]),...x.relation.voteIds])};
    c.statements.push({text:clean(text).slice(0,900),at:Date.now()});c.statements=c.statements.slice(-30);c.contradictionReasons=c.contradictionReasons.slice(-24);memory.claims[senderId]=c;return x;
  }
}
