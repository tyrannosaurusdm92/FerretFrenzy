import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';

export const DookerBot=createFerretFrenzyRoleBotClass(Object.freeze({
  role:'DOOKER',
  roleName:'Dooker',
  coat:'Silver Mitt',
  team:'BUSINESS',
  wakeDice:3,
  responseUrl:new URL('../json/dooker-bot.json',import.meta.url).href
}));

export default DookerBot;
