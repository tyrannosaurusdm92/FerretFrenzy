import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';
export const SnugglerBot=createFerretFrenzyRoleBotClass(Object.freeze({role:'SNUGGLER',roleName:'Snuggler',coat:'Chocolate',responseUrl:new URL('../json/snuggler-bot.json',import.meta.url).href}));
export default SnugglerBot;
