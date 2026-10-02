import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';

export const BanditBot=createFerretFrenzyRoleBotClass(Object.freeze({
  role:'BANDIT',
  roleName:'Bandit',
  coat:'Sable / Black Sable',
  team:'BANDIT',
  wakeDice:1,
  responseUrl:new URL('../json/bandit-bot.json',import.meta.url).href
}));

export default BanditBot;
