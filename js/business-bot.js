import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';

export const BusinessBot=createFerretFrenzyRoleBotClass(Object.freeze({
  role:'BUSINESS',
  roleName:'Business',
  coat:'Warm Sable Roan',
  team:'BUSINESS',
  wakeDice:1,
  responseUrl:new URL('../json/business-bot.json',import.meta.url).href
}));

export default BusinessBot;
