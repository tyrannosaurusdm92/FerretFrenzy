import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {FF_BACKEND_URL,FF_ROLES,FF_DICE,FF_ROLE_RULES} from '../js/ferret-frenzy-constants.js';
import {FerretFrenzyClaimParser} from '../js/ferret-frenzy-claim-parser.js';
import {FerretFrenzyDeductionEngine} from '../js/ferret-frenzy-deduction-engine.js';
import {FerretFrenzyDiceBrain} from '../js/ferret-frenzy-dice-brain.js';
import {FerretFrenzyRoleBrain} from '../js/ferret-frenzy-role-brain.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const expectedBackend='https://script.google.com/macros/s/AKfycbyAShO3c_FLVqp-fisabNx_DMuLD0UYMPygU22_jQfpLjIs796fgsJPo3viZq5FGeYd1A/exec';
assert.equal(FF_BACKEND_URL,expectedBackend,'backend URL lock changed');
assert.deepEqual(FF_DICE,[6,12]);
assert.deepEqual(FF_ROLES,['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN']);

const manifest=JSON.parse(fs.readFileSync(path.join(root,'json/bot-manifest.json'),'utf8'));
assert.equal(manifest.game,'Ferret Frenzy');
assert.equal(manifest.brainVersion,'3.1.0');
assert.equal(manifest.roles.length,8);
let totalResponses=0;
for(const entry of manifest.roles){
  const file=path.join(root,entry.responses);
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(data.game,'Ferret Frenzy');
  assert.equal(data.role,entry.id);
  assert.equal(data.responses.length,250,`${entry.id} must have 250 lines`);
  assert.equal(new Set(data.responses.map(x=>x.id)).size,250,`${entry.id} response ids must be unique`);
  assert(data.responses.every(x=>typeof x.text==='string'&&x.text.trim().length>0));
  totalResponses+=data.responses.length;
}
assert.equal(totalResponses,2000);

// Runtime contamination: docs may name research games, runtime may not drift into them.
const forbidden=[/among\s*us/i,/impost(?:or|er)/i,/werewolf/i,/minecraft/i,/chess/i,/dice\s*maiden/i,/dice\s*witch/i];
for(const file of fs.readdirSync(path.join(root,'js')).filter(x=>x.endsWith('.js'))){
  const text=fs.readFileSync(path.join(root,'js',file),'utf8');
  for(const re of forbidden) assert(!re.test(text),`${file} contains non-Ferret runtime contamination: ${re}`);
}

const parser=new FerretFrenzyClaimParser();
const memory={claims:{}};
const participants=[{id:'a',displayName:'Noodle'},{id:'b',displayName:'Slink'}];
parser.update(memory,'a','Noodle','My role is Business. I woke at Hour 3. The Minnow Treats were present.',participants);
parser.update(memory,'a','Noodle','My role is Guardian. I woke at Hour 9. The Minnow Treats were missing.',participants);
assert.equal(memory.claims.a.contradictionCount,2);
const parsed=parser.extract('My role is Dooker. I woke Hour 4 and Hour 8; the Minnow Treats were missing.',participants);
assert.equal(parsed.role,'DOOKER');
assert.deepEqual(parsed.wakeHours,[4,8]);
assert.equal(parsed.treatState,'MISSING');

const baseState={
  game:{id:'g1',phase:'MORNING'},
  me:{id:'me',displayName:'Crumb',startingRole:'BUSINESS',currentCard:'BUSINESS',allegiance:'BUSINESS',wakeHours:[4],observations:[{hour:4,treatStateBefore:'PRESENT',treatChangedDuringWindow:false,coWakers:[]}],privateFacts:[]},
  participants:[{id:'me',displayName:'Crumb'},{id:'a',displayName:'Noodle'},{id:'b',displayName:'Slink'}]
};
const dmem={claims:{a:{wakeHours:[4],treatState:'MISSING',contradictionCount:2,relation:{}},b:{wakeHours:[10],treatState:'MISSING',contradictionCount:0,relation:{}}},seenMessageIds:[],conversation:[]};
const deduction=new FerretFrenzyDeductionEngine({rng:()=>0});
const ranked=deduction.rankedTargets(baseState,dmem);
assert.equal(ranked[0].participant.id,'a');
assert(ranked[0].score>ranked[1].score);
assert.equal(deduction.voteTarget(baseState,dmem).id,'a');

const hostileState=structuredClone(baseState);
hostileState.me.startingRole='BANDIT';hostileState.me.currentCard='BANDIT';hostileState.me.allegiance='BANDIT';hostileState.me.privateFacts=[
  {type:'BANDIT_ROSTER',participants:[{participantId:'me',displayName:'Crumb'},{participantId:'b',displayName:'Slink'}]},
  {type:'RAIDER_IDENTITY',participantId:'b',displayName:'Slink'}
];
const hostileVote=deduction.voteTarget(hostileState,dmem);
assert.equal(hostileVote.id,'a','Bandit brain must not vote known historical Raider when another target exists');

const fakeApi={gameRoll:async(_token,_code,die)=>({roll:{result:die===6?5:11},state:{}})};
const dice=new FerretFrenzyDiceBrain({api:fakeApi,guestToken:'t',code:'123456',memory:{rememberDice(){}}});
assert.equal(dice.parsePrompt({kind:'ROLL',die:6}).die,6);
assert.equal(dice.parsePrompt({kind:'ROLL',die:'d12'}).die,12);
assert.throws(()=>dice.parsePrompt({kind:'ROLL',die:20}),/only d6 and d12/i);
await dice.rollPrompt({me:{actionPrompt:{kind:'ROLL',die:6,purpose:'ITCHY_CHECK'}}});

const rb=new FerretFrenzyRoleBrain({deduction,rng:()=>0});
const fixtures={
  DOOKER:{kind:'ACTION',type:'DOOKER_GLIMPSE'},
  TROUBLE:{kind:'ACTION',type:'TROUBLE_SWAP'},
  BUSINESS:{kind:'ACTION',type:'BUSINESS_INSPECT'},
  SNUGGLER:{kind:'ACTION',type:'SNUGGLER_BOND'},
  HUNTER:{kind:'ACTION',type:'HUNTER_MARK'},
  GUARDIAN:{kind:'ACTION',type:'GUARDIAN_PROTECT'}
};
for(const [role,prompt] of Object.entries(fixtures)){
  const s=structuredClone(baseState);s.me.startingRole=role;s.me.currentCard=role;s.me.allegiance='BUSINESS';
  rb.validateRole(s,role);const a=rb.choose(s,{claims:{}},prompt);assert(a,`${role} should choose ${prompt.type}`);assert(FF_ROLE_RULES[role].actions.includes(a.type));
}
const bandit=structuredClone(baseState);bandit.me.startingRole='BANDIT';assert.throws(()=>rb.choose(bandit,{claims:{}},{kind:'ACTION',type:'BUSINESS_INSPECT'}),/attempted role action/i);

console.log(JSON.stringify({ok:true,test:'bot-self-test',roles:8,responses:totalResponses,backendLocked:true,dice:[6,12],claimContradictions:memory.claims.a.contradictionCount,topDeduction:ranked[0].participant.id,hostileVote:hostileVote.id},null,2));
