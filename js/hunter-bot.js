import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';
export const HunterBot=createFerretFrenzyRoleBotClass(Object.freeze({role:'HUNTER',roleName:'Hunter',coat:'Blaze',responseUrl:new URL('../json/hunter-bot.json',import.meta.url).href}));
export default HunterBot;
