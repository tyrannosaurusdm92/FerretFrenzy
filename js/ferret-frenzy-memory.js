import {FF_BRAIN_VERSION} from './ferret-frenzy-constants.js';
const arr=v=>Array.isArray(v)?v:[];
export class FerretFrenzyMemory {
  constructor({storage=globalThis.localStorage,namespace='ff-bot-v3'}={}){this.storage=storage;this.namespace=namespace;this.key='';this.data=this.fresh();}
  fresh(){return {version:3,brainVersion:FF_BRAIN_VERSION,roundKey:'',role:'',coverStory:null,publicRoleClaim:'',roleClaimVolunteeredAt:0,claims:{},conversation:[],seenMessageIds:[],actions:[],usedResponseIds:[],questionsAsked:{},lastChatAt:0,sentMorning:0,sentVote:0,lastSeq:0,lastVote:null,diceHistory:[]};}
  bind({code,participantId,role}){this.key=[this.namespace,String(code||''),String(participantId||''),String(role||'')].join(':');this.load();this.data.role=String(role||this.data.role||'').toUpperCase();return this;}
  load(){if(!this.key||!this.storage)return this.data;try{const raw=this.storage.getItem(this.key);const parsed=raw?JSON.parse(raw):null;if(parsed&&typeof parsed==='object')this.data={...this.fresh(),...parsed};}catch{}return this.data;}
  save(){if(this.key&&this.storage){try{this.data.brainVersion=FF_BRAIN_VERSION;this.data.conversation=arr(this.data.conversation).slice(-220);this.data.seenMessageIds=arr(this.data.seenMessageIds).slice(-450);this.data.actions=arr(this.data.actions).slice(-160);this.data.diceHistory=arr(this.data.diceHistory).slice(-80);this.storage.setItem(this.key,JSON.stringify(this.data));}catch{}}return this.data;}
  beginRound(roundKey){if(this.data.roundKey===roundKey)return;const role=this.data.role;this.data=this.fresh();this.data.role=role;this.data.roundKey=roundKey;this.save();}
  rememberMessage(m){if(!m?.id||this.data.seenMessageIds.includes(m.id))return false;this.data.seenMessageIds.push(m.id);this.data.conversation.push({id:m.id,senderParticipantId:m.senderParticipantId,senderName:m.senderName||'',senderKind:m.senderKind||'',text:String(m.text||''),createdAt:m.createdAt||''});return true;}
  rememberAction(type,targetIds=[]){this.data.actions.push({type:String(type||''),targetIds:[...targetIds].filter(Boolean),at:Date.now()});this.save();}
  rememberDice(entry){this.data.diceHistory.push({...entry,at:Date.now()});this.save();}
}
