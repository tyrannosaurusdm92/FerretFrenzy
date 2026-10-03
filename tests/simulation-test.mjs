import assert from 'node:assert/strict';
import {FerretFrenzyDeductionEngine} from '../js/ferret-frenzy-deduction-engine.js';

function state(role='BUSINESS',hostile=false){return {
  game:{id:'sim',phase:'VOTE'},
  me:{id:'me',displayName:'Bot',startingRole:role,currentCard:role,allegiance:hostile?'BANDIT':'BUSINESS',wakeHours:[3],observations:[{hour:3,treatStateBefore:'PRESENT',coWakers:[]}],privateFacts:hostile?[{type:'BANDIT_ROSTER',participants:[{participantId:'me',displayName:'Bot'},{participantId:'ally',displayName:'Ally'}]},{type:'RAIDER_IDENTITY',participantId:'ally',displayName:'Ally'}]:[]},
  participants:[{id:'me',displayName:'Bot'},{id:'ally',displayName:'Ally'},{id:'a',displayName:'Noodle'},{id:'b',displayName:'Slink'},{id:'c',displayName:'Mochi'}]
};}

let seed=7;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
const d=new FerretFrenzyDeductionEngine({rng});
for(let i=0;i<250;i++){
  const s=state('BANDIT',true);const target=['a','b','c'][i%3];
  const memory={claims:{
    a:{wakeHours:[i%12+1],treatState:i%2?'MISSING':'PRESENT',contradictionCount:i%3,relation:{suspectIds:[],trustIds:[],voteIds:[]}},
    b:{wakeHours:[5],treatState:'PRESENT',contradictionCount:(i+1)%2,relation:{suspectIds:[],trustIds:[],voteIds:[]}},
    c:{wakeHours:[9],treatState:'MISSING',contradictionCount:(i+2)%4,relation:{suspectIds:[],trustIds:[],voteIds:[]}}
  }};
  const vote=d.voteTarget(s,memory);assert(vote);assert.notEqual(vote.id,'ally');assert.notEqual(vote.id,'me');
}

// A direct Dooker hard fact must dominate soft/noisy evidence.
const ds=state('DOOKER',false);ds.me.privateFacts=[{type:'DOOKER_GLIMPSE',participantId:'b',displayName:'Slink',result:'BANDIT_ALIGNED'}];
const ranked=d.rankedTargets(ds,{claims:{a:{wakeHours:[3],treatState:'PRESENT',contradictionCount:2,relation:{}}}});
assert.equal(ranked[0].participant.id,'b');
assert(ranked[0].score>90);

// Guardian recognition is trust, not omniscience: another target can still be preferred.
const gs=state('GUARDIAN',false);gs.me.privateFacts=[{type:'HUNTER_RECOGNITION',participantId:'a',displayName:'Noodle'}];
const gm={claims:{b:{wakeHours:[3],treatState:'MISSING',contradictionCount:3,relation:{}}}};
const gvote=d.voteTarget(gs,gm);assert.equal(gvote.id,'b');

console.log(JSON.stringify({ok:true,test:'simulation-test',randomizedHostileVotes:250,dookerHardEvidence:true,guardianNoOmniscience:true},null,2));
