import {FF_ROLE_RULES} from './ferret-frenzy-constants.js';
const upper=v=>String(v??'').trim().toUpperCase();
export class FerretFrenzyRoleBrain {
  constructor({deduction,rng=Math.random}={}){this.deduction=deduction;this.rng=rng;}
  validateRole(state,expectedRole){const dealt=upper(state?.me?.startingRole),expected=upper(expectedRole);if(dealt&&dealt!==expected)throw new Error(`${expected} bot refuses dealt role ${dealt}.`);if(!FF_ROLE_RULES[expected])throw new Error('Unknown Ferret Frenzy role.');}
  choose(state,memory,prompt){const action=this.deduction.action(state,memory,prompt);if(!action)return null;const role=upper(state?.me?.startingRole),allowed=new Set(FF_ROLE_RULES[role]?.actions||[]);if(!allowed.has(upper(action.type)))throw new Error(`${role} bot attempted role action ${action.type}.`);return action;}
}
