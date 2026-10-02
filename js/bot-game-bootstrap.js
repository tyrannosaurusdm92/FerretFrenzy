import {smartBotManager} from './bot-manager.js';
const code=new URLSearchParams(location.search).get('room')||'';
if(code){
  smartBotManager.resumeRoom(code).then(r=>{document.documentElement.dataset.smartBots=String(r.started||0)}).catch(err=>console.warn('Ferret Frenzy bot bootstrap:',err));
  addEventListener('pagehide',()=>smartBotManager.stopRoom(code),{once:true});
}
