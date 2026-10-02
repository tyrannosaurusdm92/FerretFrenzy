import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';

export const TroubleBot=createFerretFrenzyRoleBotClass(Object.freeze({
  role:'TROUBLE',
  roleName:'Trouble',
  coat:'Champagne',
  team:'BUSINESS',
  wakeDice:1,
  responseUrl:new URL('../json/trouble-bot.json',import.meta.url).href
}));

export default TroubleBot;
