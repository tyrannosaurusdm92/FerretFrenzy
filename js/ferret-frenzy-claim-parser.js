import {FF_ROLES} from './ferret-frenzy-constants.js';
const arr=v=>Array.isArray(v)?v:[];const upper=v=>String(v??'').trim().toUpperCase();const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const uniq=xs=>[...new Set(xs.filter(x=>x!==''&&x!==null&&x!==undefined))];
function esc(s){return String(s||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
export class FerretFrenzyClaimParser {
  extract(text,participants=[]){
    const s=clean(text);let role='';
    const roleRe=/\b(?:my\s+(?:claim|role)\s+(?:is|was)|i\s*(?:am|'m)|role\s*[:=])\s*(Bandit|Dooker|Itchy|Trouble|Business|Snuggler|Hunter|Guardian)\b/i;
    const rm=roleRe.exec(s);if(rm&&FF_ROLES.includes(upper(rm[1])))role=upper(rm[1]);
    const wakeHours=[];for(const m of s.matchAll(/\b(?:hour|wake(?:d)?(?:\s+at)?|woke(?:\s+at)?)\s*#?\s*(1[0-2]|[1-9])\b/ig))wakeHours.push(Number(m[1]));
    for(const m of s.matchAll(/\bhour\s+(1[0-2]|[1-9])\b/ig))wakeHours.push(Number(m[1]));
    let treatState='';const tm=/\b(?:treats?|minnow\s+treats?)\b[^.!?\n]{0,55}\b(present|missing)\b/i.exec(s);if(tm)treatState=upper(tm[1]);
    const coWakerIds=[],suspectIds=[],trustIds=[],voteIds=[];
    for(const p of arr(participants)){
      if(!p?.displayName)continue;const n=esc(p.displayName);
      if(new RegExp('\\b(?:saw|with|awake\\s+with|woke\\s+with)\\b[^.!?\\n]{0,70}\\b'+n+'\\b','i').test(s))coWakerIds.push(p.id);
      if(new RegExp('\\b(?:suspect|watching|watch|think|lying|liar|bandit|raider|suspicious)\\b[^.!?\\n]{0,70}\\b'+n+'\\b','i').test(s)||new RegExp('\\b'+n+'\\b[^.!?\\n]{0,45}\\b(?:suspect|lying|bandit|raider|suspicious)\\b','i').test(s))suspectIds.push(p.id);
      if(new RegExp('\\b(?:trust|trusted|clean|believe)\\b[^.!?\\n]{0,70}\\b'+n+'\\b','i').test(s))trustIds.push(p.id);
      if(new RegExp('\\b(?:vote|paw\\s*point|point(?:ing)?)\\b[^.!?\\n]{0,70}\\b'+n+'\\b','i').test(s))voteIds.push(p.id);
    }
    const glimpse=/\bglimpse\b[^.!?\n]{0,80}\b(bandit[- ]aligned|not bandit[- ]aligned)\b/i.exec(s);
    const relation={suspectIds:uniq(suspectIds),trustIds:uniq(trustIds),voteIds:uniq(voteIds)};
    return {role,wakeHours:uniq(wakeHours).sort((a,b)=>a-b),treatState,coWakerIds:uniq(coWakerIds),glimpseResult:glimpse?upper(glimpse[1]).replace(/ /g,'_').replace('-','_'):'',relation};
  }
  update(memory,senderId,senderName,text,participants=[]){
    const x=this.extract(text,participants);if(!senderId)return x;
    memory.claims=memory.claims||{};let c=memory.claims[senderId]||{senderId,senderName:senderName||'',role:'',wakeHours:[],treatState:'',coWakerIds:[],contradictionCount:0,contradictionReasons:[],statements:[],relation:{suspectIds:[],trustIds:[],voteIds:[]}};
    if(x.role){if(c.role&&c.role!==x.role){c.contradictionCount++;c.contradictionReasons.push(`role claim changed from ${c.role} to ${x.role}`);}c.role=x.role;}
    if(x.wakeHours.length){if(c.wakeHours.length&&!c.wakeHours.some(h=>x.wakeHours.includes(h))){c.contradictionCount++;c.contradictionReasons.push(`wake claim changed from ${c.wakeHours.join(',')} to ${x.wakeHours.join(',')}`);}c.wakeHours=uniq([...c.wakeHours,...x.wakeHours]).sort((a,b)=>a-b);}
    if(x.treatState){if(c.treatState&&c.treatState!==x.treatState){c.contradictionCount++;c.contradictionReasons.push(`Treat State claim changed from ${c.treatState} to ${x.treatState}`);}c.treatState=x.treatState;}
    c.coWakerIds=uniq([...c.coWakerIds,...x.coWakerIds]);c.relation={suspectIds:uniq([...(c.relation?.suspectIds||[]),...x.relation.suspectIds]),trustIds:uniq([...(c.relation?.trustIds||[]),...x.relation.trustIds]),voteIds:uniq([...(c.relation?.voteIds||[]),...x.relation.voteIds])};
    c.statements.push({text:clean(text).slice(0,900),at:Date.now()});c.statements=c.statements.slice(-30);c.contradictionReasons=c.contradictionReasons.slice(-24);memory.claims[senderId]=c;return x;
  }
}
