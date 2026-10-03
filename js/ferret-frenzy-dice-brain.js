import {FF_DICE} from './ferret-frenzy-constants.js';
const upper=v=>String(v??'').trim().toUpperCase();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
export class FerretFrenzyDiceBrain {
  constructor({api,guestToken='',code='',memory=null,maxNetworkRetries=1}={}){this.api=api;this.guestToken=guestToken;this.code=String(code||'');this.memory=memory;this.maxNetworkRetries=maxNetworkRetries;this.inFlight=false;}
  bind({guestToken,code}){this.guestToken=guestToken||this.guestToken;this.code=String(code||this.code||'');return this;}
  parsePrompt(prompt){if(upper(prompt?.kind)!=='ROLL')return null;const die=Number(String(prompt?.die||'').replace(/\D/g,''));if(!FF_DICE.includes(die))throw new Error('Ferret Frenzy permits only d6 and d12.');return {die,purpose:String(prompt?.purpose||''),signature:[die,String(prompt?.purpose||'')].join(':')};}
  async rollPrompt(state){const parsed=this.parsePrompt(state?.me?.actionPrompt);if(!parsed)return null;if(this.inFlight)return {kind:'ROLL_BUSY'};this.inFlight=true;
    try{
      let attempt=0;
      while(true){
        try{const out=await this.api.gameRoll(this.guestToken,this.code,parsed.die);this.memory?.rememberDice({die:parsed.die,purpose:parsed.purpose,result:out?.roll?.result,duplicate:Boolean(out?.roll?.duplicate)});return out;}
        catch(error){
          const ambiguous=['NETWORK_ERROR','HTTP_502','HTTP_503','HTTP_504'].includes(error?.code);
          if(!ambiguous||attempt>=this.maxNetworkRetries)throw error;
          attempt++;await wait(180*attempt);
          const synced=await this.api.gameState(this.guestToken,this.code);const next=this.parsePrompt(synced?.me?.actionPrompt);
          if(!next||next.signature!==parsed.signature)return {state:synced,resynced:true};
        }
      }
    } finally {this.inFlight=false;}
  }
}
