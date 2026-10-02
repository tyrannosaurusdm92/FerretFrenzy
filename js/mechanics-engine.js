/* Backend-neutral reusable mechanics inspired by proven digital card-game patterns.
   These utilities do not implement UNO; they generalize safe state transformations. */
import {clone,uid} from './utils.js';
export class MechanicsEngine{
  constructor(initial={players:[],zones:{},meta:{}}){this.state=clone(initial);this.events=[];this.applied=new Set()}
  transact(kind,payload,mutator,{actionId=uid('act'),actorId=null}={}){if(this.applied.has(actionId))return {duplicate:true,state:this.snapshot()};const before=this.snapshot();try{mutator(this.state);const event={id:actionId,kind,payload:clone(payload),actorId,at:Date.now()};this.events.push(event);this.applied.add(actionId);return {event,state:this.snapshot()}}catch(err){this.state=before;throw err}}
  snapshot(){return clone(this.state)}
  player(id){const p=this.state.players.find(x=>x.id===id);if(!p)throw new Error(`Unknown player ${id}`);return p}
  swapOwnedState(aId,bId,keys=['hand']){return this.transact('state.swap',{aId,bId,keys},s=>{const a=s.players.find(x=>x.id===aId),b=s.players.find(x=>x.id===bId);if(!a||!b)throw new Error('Swap target missing');for(const k of keys){const t=a[k];a[k]=b[k];b[k]=t}})}
  rotateOwnedState(playerIds,keys=['hand'],direction=1){return this.transact('state.rotate',{playerIds,keys,direction},s=>{const ps=playerIds.map(id=>s.players.find(p=>p.id===id));if(ps.some(x=>!x))throw new Error('Rotate target missing');for(const k of keys){const vals=ps.map(p=>p[k]);ps.forEach((p,i)=>{p[k]=vals[(i-direction+ps.length)%ps.length]})}})}
  swapCardPositions(aId,bId,key='currentCard'){return this.swapOwnedState(aId,bId,[key])}
  enqueue(effect){this.state.effectQueue??=[];this.state.effectQueue.push({...effect,id:effect.id||uid('fx')});return this.state.effectQueue.at(-1)}
  stackEffect(type,amount,sourceId){this.state.effectStack??=[];this.state.effectStack.push({id:uid('stack'),type,amount,sourceId});return this.state.effectStack.reduce((n,x)=>x.type===type?n+x.amount:n,0)}
  resolveStack(type,targetId,resolver){const effects=(this.state.effectStack||[]).filter(x=>x.type===type);if(!effects.length)return null;const total=effects.reduce((n,x)=>n+x.amount,0);const out=resolver({target:this.player(targetId),total,effects:clone(effects),state:this.state});this.state.effectStack=this.state.effectStack.filter(x=>x.type!==type);this.events.push({id:uid('evt'),kind:'stack.resolve',payload:{type,targetId,total},at:Date.now()});return out}
  forceAction(playerId,legalActions,chooser=(xs)=>xs[0]){const legal=legalActions.filter(a=>a&&a.legal!==false);if(!legal.length)return null;const choice=chooser(legal);this.events.push({id:uid('evt'),kind:'action.forced',payload:{playerId,action:choice.type},at:Date.now()});return choice}
  challenge({challengerId,targetId,validator,onSuccess,onFail}){const valid=!!validator(this.state,this.player(targetId));const fn=valid?onFail:onSuccess;const result=fn?.(this.state,{challenger:this.player(challengerId),target:this.player(targetId)});this.events.push({id:uid('evt'),kind:'challenge.resolve',payload:{challengerId,targetId,challengeSucceeded:!valid},at:Date.now()});return result}
}
export function legalTargets(players,{actorId,allowSelf=false,predicate=()=>true}={}){return players.filter(p=>(allowSelf||p.id!==actorId)&&predicate(p))}
export function pickUnique(values){return [...new Set(values)]}
