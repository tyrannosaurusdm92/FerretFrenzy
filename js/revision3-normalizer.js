/* Ferret Frenzy Revision 3.0 privacy/semantics normalizer.
   This is a frontend compatibility layer only. It never creates hidden facts.
   It narrows legacy Business inspection payloads to one stable wake result so
   UI/bot reasoning follows the v3 dossier even when an older response shape
   contains a wakeHours array. */
const upper=v=>String(v??'').trim().toUpperCase();
const arr=v=>Array.isArray(v)?v:[];
function hash(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function validHour(v){const n=Number(v);return Number.isInteger(n)&&n>=1&&n<=12?n:null;}
function inspectionHour(f,state){
  for(const v of [f?.wakeHour,f?.inspectedWakeHour,f?.resultHour,f?.result]){const n=validHour(v);if(n)return n;}
  const vals=arr(f?.wakeHours).map(validHour).filter(Boolean);
  if(!vals.length)return null;
  const key=[state?.game?.id,state?.me?.id,f?.participantId,f?.targetId,vals.join(',')].join('|');
  return vals[hash(key)%vals.length];
}
function normalizeFact(f,state){
  if(!f||typeof f!=='object')return f;
  const out={...f},type=upper(out.type);
  if(type==='BUSINESS_WAKE_INSPECTION'){
    const h=inspectionHour(out,state);
    delete out.wakeHours;
    if(h){out.wakeHour=h;out.inspectedWakeHour=h;}
    out.revision3SingleResult=true;
  }
  if(type==='DOOKER_GLIMPSE'&&out.hour&&!out.observedAtHour)out.observedAtHour=Number(out.hour)||out.hour;
  if(type==='TROUBLE_CONVERTED'&&out.raiderParticipantId&&!out.raiderId)out.raiderId=out.raiderParticipantId;
  if(type==='ITCHY_PARTIAL_CLUE'){
    const candidates=arr(out.candidates).filter(Boolean);
    if(candidates.length!==2)out.degraded=true;
  }
  if(type==='ITCHY_TIMING_CLUE')out.degraded=true;
  return out;
}
export function normalizeRevision3State(input){
  if(!input||typeof input!=='object')return input;
  const state=input;
  if(state.me&&Array.isArray(state.me.privateFacts))state.me.privateFacts=state.me.privateFacts.map(f=>normalizeFact(f,state));
  return state;
}
export function normalizeRevision3Envelope(value){
  if(!value||typeof value!=='object')return value;
  if(value.game&&value.me)return normalizeRevision3State(value);
  if(value.state?.game&&value.state?.me)value.state=normalizeRevision3State(value.state);
  return value;
}
