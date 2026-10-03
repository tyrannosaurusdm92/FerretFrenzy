import BanditBot from './bandit-bot.js';
import DookerBot from './dooker-bot.js';
import ItchyBot from './itchy-bot.js';
import TroubleBot from './trouble-bot.js';
import BusinessBot from './business-bot.js';
import SnugglerBot from './snuggler-bot.js';
import HunterBot from './hunter-bot.js';
import GuardianBot from './guardian-bot.js';
export const FERRET_FRENZY_BOT_CLASSES=Object.freeze({BANDIT:BanditBot,DOOKER:DookerBot,ITCHY:ItchyBot,TROUBLE:TroubleBot,BUSINESS:BusinessBot,SNUGGLER:SnugglerBot,HUNTER:HunterBot,GUARDIAN:GuardianBot});
export function createRoleBot(role,config={}){const C=FERRET_FRENZY_BOT_CLASSES[String(role||'').toUpperCase()];if(!C)throw new Error('Unknown Ferret Frenzy bot role: '+role);return new C(config);}
export default FERRET_FRENZY_BOT_CLASSES;
