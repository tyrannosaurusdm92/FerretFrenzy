import {createFerretFrenzyRoleBotClass} from './ferret-frenzy-bot-core.js';

export const GuardianBot=createFerretFrenzyRoleBotClass(Object.freeze({
  role:'GUARDIAN',
  roleName:'Guardian',
  coat:'Dark-Eyed White',
  team:'BUSINESS',
  wakeDice:1,
  responseUrl:new URL('../json/guardian-bot.json',import.meta.url).href
}));

export default GuardianBot;
