const TOKEN_KEY='ff:guest-token:v2';
const GUEST_KEY='ff:guest-profile:v2';
const GAME_PREFIX='ff:game-id:';
function readJSON(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
function writeJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
async function post(baseUrl,action,data={}){
  const res=await fetch(baseUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,data}),cache:'no-store',redirect:'follow'});
  if(!res.ok) throw new Error(`Backend HTTP ${res.status}`);
  const env=await res.json();
  if(env&&env.ok===false){const e=new Error(env.error?.message||'Ferret Frenzy backend error');e.code=env.error?.code;e.status=env.error?.status;e.details=env.error?.details;throw e}
  return env&&Object.prototype.hasOwnProperty.call(env,'data')?env.data:env;
}
function gameIdFor(code){return localStorage.getItem(GAME_PREFIX+String(code||''))||''}
function rememberGame(view){const g=view?.game;if(g?.code&&g?.id){try{localStorage.setItem(GAME_PREFIX+g.code,g.id)}catch{}}}
function normalizeMessages(raw){return (raw?.messages||raw||[]).map(m=>({id:m.id,displayName:m.senderName||m.displayName||'Ferret Frenzy',text:m.text||'',createdAt:m.createdAt||new Date().toISOString(),kind:m.kind||m.senderKind||'player'}))}
function normalizeView(view,messages=[]){
  const g=view?.game||view||{}, me=view?.me||{}; const ps=view?.participants||[];
  rememberGame(view);
  const players=ps.map(p=>({deviceId:p.id,participantId:p.id,displayName:p.displayName||`Player ${p.seat||''}`,avatarSeed:p.avatarKey||p.displayName||String(p.seat||''),ready:p.ready!==false,isHost:!!p.isHost,isSelf:p.id===me.id,kind:String(p.kind||'human').toLowerCase(),seat:Number(p.seat||0),connected:p.connected!==false}));
  const host=players.find(p=>p.isHost);
  const phase=String(g.phase||'LOBBY').toUpperCase();
  return {
    id:g.id,code:String(g.code||''),name:g.name||'Ferret Frenzy',isPublic:String(g.visibility||'PRIVATE').toUpperCase()==='PUBLIC',requireReady:true,maxPlayers:Number(g.maxPlayers||12),targetPlayers:Number(g.targetPlayers||g.maxPlayers||8),status:phase==='LOBBY'?'lobby':'starting',phase,
    hostId:host?.participantId||'',selfParticipantId:me.id||'',players,messages:normalizeMessages(messages),revision:Number(g.seq||0),raw:view
  };
}
export class BackendTransport{
  constructor(baseUrl=''){this.mode='backend';this.baseUrl=String(baseUrl||'').trim();this.handlers=new Set();this.pollTimer=null;this.currentCode='';this.currentGameId='';this.currentDevice=null;this.capabilities={kick:false,regenerateCode:false};}
  onEvent(fn){this.handlers.add(fn);return()=>this.handlers.delete(fn)}
  _emit(e){for(const h of this.handlers)try{h(e)}catch{}}
  async _ensureGuest(device){
    this.currentDevice=device||this.currentDevice||readJSON('ff:device:v1')||{displayName:'Ferret',avatarSeed:'ferret'};
    let token=localStorage.getItem(TOKEN_KEY)||'';
    if(token){
      try{const r=await post(this.baseUrl,'guest.resume',{guestToken:token});if(r?.guestToken)token=r.guestToken;writeJSON(GUEST_KEY,r?.guest||{});localStorage.setItem(TOKEN_KEY,token);return {token,guest:r?.guest||readJSON(GUEST_KEY)}}catch{localStorage.removeItem(TOKEN_KEY)}
    }
    const r=await post(this.baseUrl,'guest.create',{displayName:this.currentDevice.displayName,avatarKey:this.currentDevice.avatarSeed});
    token=r.guestToken;localStorage.setItem(TOKEN_KEY,token);writeJSON(GUEST_KEY,r.guest||{});return {token,guest:r.guest};
  }
  async _call(action,data={},device){const s=await this._ensureGuest(device);return post(this.baseUrl,action,{...data,guestToken:s.token})}
  async publicRooms(){const r=await post(this.baseUrl,'lobby.public',{limit:100});return (r?.games||[]).map(g=>({id:g.id,code:String(g.code||''),name:g.name||'Ferret Frenzy',playerCount:Number(g.playerCount||0),maxPlayers:Number(g.maxPlayers||12),hostName:g.hostName||'Host',isPublic:true,status:'lobby'}))}
  async preview(code){return {code:String(code),name:'Private Ferret Frenzy room',playerCount:0,maxPlayers:12,hostName:'Host'}}
  async createRoom({device,name,maxPlayers=8,isPublic=false}){const v=await this._call('lobby.create',{name,visibility:isPublic?'PUBLIC':'PRIVATE',maxPlayers:Number(maxPlayers),targetPlayers:Number(maxPlayers),allowBots:true,autoFillBots:false},device);this.currentGameId=v.game?.id||'';this.currentCode=v.game?.code||'';rememberGame(v);return normalizeView(v)}
  async joinRoom({code,device}){const v=await this._call('lobby.join',{code:String(code)},device);this.currentGameId=v.game?.id||'';this.currentCode=v.game?.code||String(code);rememberGame(v);let messages=[];try{messages=await this._call('chat.list',{gameId:this.currentGameId},device)}catch{}return normalizeView(v,messages)}
  async getRoom(code){const gameId=this.currentGameId||gameIdFor(code);if(!gameId)throw new Error('No backend game id is stored for this room.');const v=await this._call('lobby.get',{gameId});this.currentGameId=v.game?.id||gameId;this.currentCode=v.game?.code||String(code);let messages=[];try{messages=await this._call('chat.list',{gameId:this.currentGameId})}catch{}return normalizeView(v,messages)}
  async leaveRoom({code}){const gameId=this.currentGameId||gameIdFor(code);if(!gameId)return null;const r=await this._call('lobby.leave',{gameId});this.disconnect();return r}
  async setReady({code,ready}){const gameId=this.currentGameId||gameIdFor(code);const v=await this._call('lobby.ready',{gameId,ready:!!ready});return normalizeView(v)}
  async setPublic({code,isPublic}){const gameId=this.currentGameId||gameIdFor(code);const v=await this._call('lobby.update',{gameId,visibility:isPublic?'PUBLIC':'PRIVATE'});return normalizeView(v)}
  async chat({code,device,message}){const gameId=this.currentGameId||gameIdFor(code);await this._call('chat.send',{gameId,text:String(message||'')},device);return this.getRoom(code)}
  async start({code}){const gameId=this.currentGameId||gameIdFor(code);const v=await this._call('game.start',{gameId});rememberGame(v);return normalizeView(v)}
  connectRoom(code,deviceId){
    this.currentCode=code;this.currentGameId=this.currentGameId||gameIdFor(code);this.disconnect();
    const poll=async()=>{if(!this.currentCode)return;try{const gameId=this.currentGameId||gameIdFor(this.currentCode);if(!gameId)return;const s=await this._call('events.poll',{gameId,afterSeq:0,limit:1});const phase=String(s?.state?.game?.phase||'').toUpperCase();this._emit({type:'room.updated',code:this.currentCode,phase});}catch(e){this._emit({type:'transport.error',code:this.currentCode,error:e.message})}};
    this.pollTimer=setInterval(poll,2000);poll();return this;
  }
  disconnect(){if(this.pollTimer){clearInterval(this.pollTimer);this.pollTimer=null}}
}
export {TOKEN_KEY,GUEST_KEY,GAME_PREFIX,post as ffBackendPost};
