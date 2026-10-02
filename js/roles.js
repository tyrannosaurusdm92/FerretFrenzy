export const ROLE_POOL={bandit:4,business:14,dooker:1,itchy:1,trouble:1,snuggler:1,hunter:1,guardian:1};
export const ROLES={
 bandit:{name:'Bandit',coat:'Sable / Black Sable',wakeDice:1,team:'bandit'},
 dooker:{name:'Dooker',coat:'Silver Mitt',wakeDice:3,team:'business'},
 itchy:{name:'Itchy',coat:'Cinnamon',wakeDice:1,conditionalWakeDice:2,team:'business'},
 trouble:{name:'Trouble',coat:'Champagne',wakeDice:1,team:'business'},
 business:{name:'Business',coat:'Warm Sable Roan',wakeDice:1,team:'business'},
 snuggler:{name:'Snuggler',coat:'Chocolate',wakeDice:1,team:'business'},
 hunter:{name:'Hunter',coat:'Blaze',wakeDice:2,team:'business'},
 guardian:{name:'Guardian',coat:'Dark-Eyed White',wakeDice:1,team:'business'}
};
export function poolSize(){return Object.values(ROLE_POOL).reduce((a,b)=>a+b,0)}
