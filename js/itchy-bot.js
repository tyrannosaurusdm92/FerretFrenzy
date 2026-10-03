import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';
export const ItchyBot=createFerretFrenzyRoleBotClass(Object.freeze({role:'ITCHY',roleName:'Itchy',coat:'Cinnamon',responseUrl:new URL('../json/itchy-bot.json',import.meta.url).href}));
export default ItchyBot;
