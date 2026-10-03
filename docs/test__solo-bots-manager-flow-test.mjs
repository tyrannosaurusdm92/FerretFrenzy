import assert from 'node:assert/strict';

class MemoryStorage {
  constructor(){this.map=new Map();}
  getItem(k){return this.map.has(k)?this.map.get(k):null;}
  setItem(k,v){this.map.set(String(k),String(v));}
  removeItem(k){this.map.delete(String(k));}
  clear(){this.map.clear();}
}

const originalFetch=globalThis.fetch;
const originalStorage=globalThis.localStorage;
globalThis.localStorage=new MemoryStorage();

const game={id:'game_test',code:'123456',phase:'LOBBY',targetPlayers:4,maxPlayers:10,allowBots:true,autoFillBots:true};
const participants=[{id:'p_host',seat:1,kind:'HUMAN',displayName:'Host',ready:true,isHost:true}];
let guestNo=0;
const tokenToParticipant=new Map();
let calls=[];

function response(data){return Promise.resolve({ok:true,status:200,async json(){return {ok:true,backendId:'ferretfrenzy',data};},async text(){return '';}});}
function viewFor(token){
  const me=tokenToParticipant.get(token);
  return {game,me,participants:participants.map(p=>({...p})),share:{code:game.code}};
}

globalThis.fetch=function(input,init={}){
  if(this!==globalThis) throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal Invocation");
  const payload=JSON.parse(init.body||'{}'), action=payload.action, data=payload.data||{};calls.push(action);
  if(action==='guest.create'){
    const n=++guestNo,token=`guest-token-${n}`;
    return response({guestToken:token,guest:{id:`guest_${n}`,displayName:data.displayName,avatarKey:data.avatarKey}});
  }
  if(action==='lobby.join'){
    let me=tokenToParticipant.get(data.guestToken);
    if(!me){me={id:`p_bot_${tokenToParticipant.size+1}`,seat:participants.length+1,kind:'HUMAN',displayName:`Ferret Bot ${tokenToParticipant.size+1}`,ready:false,isHost:false};tokenToParticipant.set(data.guestToken,me);participants.push(me);}
    return response(viewFor(data.guestToken));
  }
  if(action==='lobby.ready'){
    const me=tokenToParticipant.get(data.guestToken);assert(me);me.ready=data.ready!==false;return response(viewFor(data.guestToken));
  }
  throw new Error(`Unexpected fake backend action ${action}`);
};

try{
  const {FerretFrenzySmartBotManager}=await import('../js/bot-manager.js?solo-flow-test=1');
  const manager=new FerretFrenzySmartBotManager();
  const added=await manager.fillToTarget({code:'123456',target:4,currentPlayers:1});
  assert.equal(added.length,3,'solo should add three browser-owned v3 bot seats');
  assert.equal(participants.length,4);
  assert(participants.slice(1).every(p=>p.ready===true),'every added bot seat must ready itself');
  assert.equal(manager.sessions('123456').length,3,'all bot guest sessions must persist for post-deal role brains');
  assert.deepEqual(calls,[
    'guest.create','lobby.join','lobby.ready',
    'guest.create','lobby.join','lobby.ready',
    'guest.create','lobby.join','lobby.ready'
  ]);
  console.log(JSON.stringify({ok:true,test:'solo-bots-manager-flow-test',botsAdded:3,allReady:true,sessionPersistence:true},null,2));
} finally {
  globalThis.fetch=originalFetch;
  if(originalStorage===undefined) delete globalThis.localStorage; else globalThis.localStorage=originalStorage;
}
