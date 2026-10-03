/** Ferret Frenzy frontend bot constants. No generic-game fallback. */
export const FF_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbyAShO3c_FLVqp-fisabNx_DMuLD0UYMPygU22_jQfpLjIs796fgsJPo3viZq5FGeYd1A/exec';
export const FF_BACKEND_ID = 'ferretfrenzy';
export const FF_BRAIN_VERSION = '3.0.0';
export const FF_GAME = 'Ferret Frenzy';
export const FF_ROLES = Object.freeze(['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN']);
export const FF_PHASES = Object.freeze(['LOBBY','PREP','NIGHT','MORNING','VOTE','RESULTS']);
export const FF_DICE = Object.freeze([6,12]);
export const FF_ROLE_RULES = Object.freeze({
  BANDIT:{name:'Bandit',coat:'Sable / Black Sable',wakeDice:1,team:'BANDIT',actions:[]},
  DOOKER:{name:'Dooker',coat:'Silver Mitt',wakeDice:3,team:'BUSINESS',actions:['DOOKER_GLIMPSE','DOOKER_PEEK_HAMMOCK','DOOKER_TRIP']},
  ITCHY:{name:'Itchy',coat:'Cinnamon',wakeDice:1,team:'BUSINESS',actions:[]},
  TROUBLE:{name:'Trouble',coat:'Champagne',wakeDice:1,team:'BUSINESS',actions:['TROUBLE_SWAP']},
  BUSINESS:{name:'Business',coat:'Warm Sable Roan',wakeDice:1,team:'BUSINESS',actions:['BUSINESS_INSPECT']},
  SNUGGLER:{name:'Snuggler',coat:'Chocolate',wakeDice:1,team:'BUSINESS',actions:['SNUGGLER_BOND']},
  HUNTER:{name:'Hunter',coat:'Blaze',wakeDice:2,team:'BUSINESS',actions:['HUNTER_MARK']},
  GUARDIAN:{name:'Guardian',coat:'Dark-Eyed White',wakeDice:1,team:'BUSINESS',actions:['GUARDIAN_PROTECT']}
});
export const FF_SAFE_BOT_ACTIONS = Object.freeze(new Set([
  'health','guest.create','guest.resume','lobby.join','lobby.ready','lobby.get',
  'game.state','game.roll','game.action','chat.list','chat.send','vote.cast','events.poll'
]));
export const FF_HOST_ACTIONS = Object.freeze(new Set(['lobby.fillBots','game.start','vote.begin','game.advance']));
export const FF_CHAT_LIMIT = 900;
