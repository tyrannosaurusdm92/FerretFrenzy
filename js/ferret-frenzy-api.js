import {FF_BACKEND_URL,FF_BACKEND_ID,FF_SAFE_BOT_ACTIONS,FF_HOST_ACTIONS} from './ferret-frenzy-constants.js';

export class FerretFrenzyApiError extends Error {
  constructor(code,message,status=0,details=null){super(message||code||'Ferret Frenzy API error');this.name='FerretFrenzyApiError';this.code=code||'API_ERROR';this.status=Number(status)||0;this.details=details;}
}

export class FerretFrenzyApi {
  constructor(baseUrl=FF_BACKEND_URL,{allowHostActions=false,fetchImpl=globalThis.fetch}={}){
    this.baseUrl=String(baseUrl||'').trim();
    if(this.baseUrl!==FF_BACKEND_URL) throw new Error('Ferret Frenzy bot API is locked to the tested Ferret Frenzy backend.');
    if(typeof fetchImpl!=='function') throw new Error('A fetch implementation is required.');
    this.fetchImpl=fetchImpl;this.allowHostActions=Boolean(allowHostActions);
  }
  _allowed(action){return FF_SAFE_BOT_ACTIONS.has(action)||(this.allowHostActions&&FF_HOST_ACTIONS.has(action));}
  async post(action,data={}){
    if(!this._allowed(action)) throw new FerretFrenzyApiError('ACTION_BLOCKED','Frontend bot attempted an action outside the Ferret Frenzy contract.');
    let res;
    try{res=await this.fetchImpl(this.baseUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({action,data})});}
    catch(error){throw new FerretFrenzyApiError('NETWORK_ERROR',error?.message||String(error));}
    if(!res.ok) throw new FerretFrenzyApiError('HTTP_'+res.status,await res.text(),res.status);
    let body; try{body=await res.json();}catch{throw new FerretFrenzyApiError('INVALID_JSON','Ferret Frenzy backend returned invalid JSON.',res.status);}
    if(body?.backendId && body.backendId!==FF_BACKEND_ID) throw new FerretFrenzyApiError('WRONG_BACKEND','Response was not from Ferret Frenzy.');
    if(body?.ok===false){const e=body.error||{};throw new FerretFrenzyApiError(e.code,e.message,e.status,e.details);}
    return body?.data ?? body;
  }
  health(){return this.post('health',{});} guestCreate(displayName,avatarKey=''){return this.post('guest.create',{displayName,avatarKey});}
  guestResume(guestToken){return this.post('guest.resume',{guestToken});} lobbyJoin(guestToken,code){return this.post('lobby.join',{guestToken,code});}
  lobbyReady(guestToken,code,ready=true){return this.post('lobby.ready',{guestToken,code,ready});} lobbyGet(guestToken,code){return this.post('lobby.get',{guestToken,code});}
  gameState(guestToken,code){return this.post('game.state',{guestToken,code});} gameRoll(guestToken,code,die){return this.post('game.roll',{guestToken,code,die});}
  gameAction(guestToken,code,payload){return this.post('game.action',{guestToken,code,...payload});} chatList(guestToken,code,limit=150){return this.post('chat.list',{guestToken,code,limit});}
  chatSend(guestToken,code,text){return this.post('chat.send',{guestToken,code,text});} voteCast(guestToken,code,targetId){return this.post('vote.cast',{guestToken,code,targetId});}
  eventsPoll(guestToken,code,afterSeq=0,limit=150){return this.post('events.poll',{guestToken,code,afterSeq,limit});}
  fillBots(guestToken,code,targetPlayers){return this.post('lobby.fillBots',{guestToken,code,targetPlayers});}
  gameStart(guestToken,code){return this.post('game.start',{guestToken,code});}
}
