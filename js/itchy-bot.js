import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';

export const ItchyBot=createFerretFrenzyRoleBotClass(Object.freeze({
  role:'ITCHY',
  roleName:'Itchy',
  coat:'Cinnamon',
  team:'BUSINESS',
  wakeDice:1,
  responseUrl:new URL('../json/itchy-bot.json',import.meta.url).href
}));

export default ItchyBot;
