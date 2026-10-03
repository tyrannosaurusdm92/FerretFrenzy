import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';
export const DookerBot=createFerretFrenzyRoleBotClass(Object.freeze({role:'DOOKER',roleName:'Dooker',coat:'Silver Mitt',responseUrl:new URL('../json/dooker-bot.json',import.meta.url).href}));
export default DookerBot;
