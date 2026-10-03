import {FerretFrenzyApi} from './ferret-frenzy-api.js';
import {createRoleBot} from './ferret-frenzy-bot-roster.js';
/**
 * Two explicit modes:
 *  - server: calls lobby.fillBots; FerretFrenzy_v2.gs owns those bots and their FF_BOT_MEMORY.
 *  - guest: creates ordinary guest seats and runs the frontend brains in this package.
 * Never run both controllers for the same seat.
 */
export class FerretFrenzyBotManager {
  constructor({mode='guest',code='',hostGuestToken='',api=null,tickMs=1250}={}){this.mode=mode;this.code=String(code||'');this.hostGuestToken=hostGuestToken;this.api=api||new FerretFrenzyApi(undefined,{allowHostActions:mode==='server'});this.tickMs=tickMs;this.seats=[];this.running=false;this.timer=null;}
  async fillServerBots(targetPlayers){if(this.mode!=='server')throw new Error('fillServerBots requires server mode.');if(!this.hostGuestToken||!this.code)throw new Error('Host guest token and room code required.');return this.api.fillBots(this.hostGuestToken,this.code,targetPlayers);}
  async addGuestBot({displayName,avatarKey='',ready=true}={}){if(this.mode!=='guest')throw new Error('addGuestBot requires guest mode.');const g=await this.api.guestCreate(displayName||`Ferret Bot ${this.seats.length+1}`,avatarKey);await this.api.lobbyJoin(g.guestToken,this.code);if(ready)await this.api.lobbyReady(g.guestToken,this.code,true);const seat={displayName:displayName||`Ferret Bot ${this.seats.length+1}`,guestToken:g.guestToken,brain:null,lastError:null};this.seats.push(seat);return seat;}
  async _brain(seat){if(seat.brain)return seat.brain;const state=await this.api.gameState(seat.guestToken,this.code);const role=state?.me?.startingRole;if(!role)return null;seat.brain=createRoleBot(role,{api:this.api,guestToken:seat.guestToken,code:this.code,tickMs:this.tickMs});return seat.brain;}
  async tick(){if(this.mode!=='guest')return;for(const seat of this.seats){try{const b=await this._brain(seat);if(b)await b.tick();seat.lastError=null;}catch(e){seat.lastError=e;}}}
  start(){if(this.mode!=='guest')throw new Error('Server bots are already driven by FerretFrenzy_v2.gs; do not double-drive them.');if(this.running)return this;this.running=true;const loop=async()=>{if(!this.running)return;await this.tick();if(this.running)this.timer=setTimeout(loop,this.tickMs);};void loop();return this;}
  stop(){this.running=false;if(this.timer)clearTimeout(this.timer);for(const s of this.seats)s.brain?.stop();this.timer=null;return this;}
  status(){return {mode:this.mode,code:this.code,running:this.running,seats:this.seats.map(s=>({displayName:s.displayName,role:s.brain?.role||'',hasBrain:Boolean(s.brain),lastError:s.lastError?.message||''}))};}
}
