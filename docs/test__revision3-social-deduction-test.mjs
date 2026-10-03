import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FerretFrenzyClaimParser} from '../js/ferret-frenzy-claim-parser.js';
import {FerretFrenzyDeductionEngine} from '../js/ferret-frenzy-deduction-engine.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const participants=[
  {id:'me',displayName:'Me'},
  {id:'a',displayName:'Ash'},
  {id:'b',displayName:'Bramble'},
  {id:'c',displayName:'Clover'}
];

// Quick Role Claim wording must be parsed as a public claim.
const parser=new FerretFrenzyClaimParser();
const memory={claims:{}};
parser.update(memory,'a','Ash','I am claiming Dooker as my Starting Role. My wake claim is Hour 2. At Hour 2, the Minnow Treats were PRESENT.',participants);
assert.equal(memory.claims.a.role,'DOOKER');
assert.deepEqual(memory.claims.a.wakeHours,[2]);
assert.equal(memory.claims.a.treatStatesByHour['2'],'PRESENT');

assert.equal(memory.claims.a.roleScope,'STARTING');

// Current Card testimony is tracked separately from Starting Role and must not rewrite role capability.
parser.update(memory,'a','Ash','I am claiming Business as my Current Card.',participants);
assert.equal(memory.claims.a.role,'DOOKER');
assert.equal(memory.claims.a.currentCard,'BUSINESS');
assert.equal(memory.claims.a.contradictionCount,0);

// Bot volunteer wording must be understandable to other bots as a public Starting Role claim.
const volunteer={claims:{}};
parser.update(volunteer,'c','Clover','I am volunteering my role claim: Guardian. Starting role, current card, and allegiance can still be different after card movement.',participants);
assert.equal(volunteer.claims.c.role,'GUARDIAN');
assert.equal(volunteer.claims.c.currentCard,'');

// A witnessed PRESENT→MISSING transition is richer same-hour chronology, not a self-contradiction.
const changed={claims:{}};
parser.update(changed,'a','Ash','I am claiming Business as my Starting Role. At Hour 6, the Minnow Treats changed from PRESENT to MISSING during my window.',participants);
parser.update(changed,'a','Ash','At Hour 6, the Minnow Treats were PRESENT at the start of my wake.',participants);
assert.equal(changed.claims.a.contradictionCount,0);
assert.equal(changed.claims.a.treatStatesByHour['6'],'PRESENT_TO_MISSING');

// Multi-wake roles can disclose another distinct wake with another Treat State without a false contradiction.
parser.update(memory,'a','Ash','My wake claim also includes Hour 7. At Hour 7, the Minnow Treats were MISSING.',participants);
assert.deepEqual(memory.claims.a.wakeHours,[2,7]);
assert.equal(memory.claims.a.treatStatesByHour['7'],'MISSING');
assert.equal(memory.claims.a.contradictionCount,0);

// Same-hour Treat State changes are contradictions; different-hour changes are not.
parser.update(memory,'a','Ash','At Hour 2, the Minnow Treats were MISSING.',participants);
assert.equal(memory.claims.a.contradictionCount,1);
assert.match(memory.claims.a.contradictionReasons.at(-1),/Hour 2/i);

// One-wake role changing to a different hour is a contradiction.
const businessMem={claims:{}};
parser.update(businessMem,'b','Bramble','I am claiming Business. I woke at Hour 3. At Hour 3, the Minnow Treats were PRESENT.',participants);
parser.update(businessMem,'b','Bramble','I woke at Hour 9. At Hour 9, the Minnow Treats were MISSING.',participants);
assert.ok(businessMem.claims.b.contradictionCount>=1);

const engine=new FerretFrenzyDeductionEngine({rng:()=>0});

// A valid Itchy two-player clue contains the historical Raider; a loyal Itchy bot must keep its vote inside the pair.
const itchyState={game:{phase:'VOTE'},participants,me:{id:'me',startingRole:'ITCHY',allegiance:'BUSINESS',privateFacts:[{type:'ITCHY_PARTIAL_CLUE',candidates:[{participantId:'a'},{participantId:'b'}]}],observations:[]}};
const itchyMem={claims:{c:{role:'BUSINESS',wakeHours:[3],treatState:'MISSING',treatStatesByHour:{3:'MISSING'},coWakerIds:[],contradictionCount:5,contradictionReasons:['changed story'],relation:{}}}};
assert.ok(['a','b'].includes(engine.voteTarget(itchyState,itchyMem).id),'valid Itchy clue should constrain loyal vote to the two candidates');

// Guardian recognition is historical, not a command to auto-protect Hunter.
const guardianState={game:{phase:'VOTE'},participants,me:{id:'me',startingRole:'GUARDIAN',allegiance:'BUSINESS',privateFacts:[{type:'HUNTER_RECOGNITION',participantId:'a'}],observations:[]}};
const guardianMem={claims:{a:{role:'HUNTER',wakeHours:[2,8],treatState:'',treatStatesByHour:{2:'PRESENT'},coWakerIds:[],contradictionCount:5,contradictionReasons:['changed story'],relation:{}},b:{role:'BUSINESS',wakeHours:[4],treatState:'PRESENT',treatStatesByHour:{4:'PRESENT'},coWakerIds:['c'],contradictionCount:0,contradictionReasons:[],relation:{}}}};
const protect=engine.action(guardianState,guardianMem,{kind:'ACTION',type:'GUARDIAN_PROTECT'});
assert.equal(protect.targetId,'b','Guardian should protect the useful low-suspicion player rather than automatically the starting Hunter');

// Converted Hunter must not use loyal Hunt Mark logic even if a stale prompt appears.
const hunterState={game:{phase:'NIGHT'},participants,me:{id:'me',startingRole:'HUNTER',allegiance:'BANDIT',hunterConverted:true,privateFacts:[],observations:[]}};
const mark=engine.action(hunterState,{claims:{}},{kind:'ACTION',type:'HUNTER_MARK'});
assert.equal(mark.pass,true);

// Known historical Raider is never selected by a hostile bot's own Paw Point.
const banditState={game:{phase:'VOTE'},participants,me:{id:'me',startingRole:'BANDIT',allegiance:'BANDIT',privateFacts:[{type:'BANDIT_ROSTER',participants:[{participantId:'me'},{participantId:'a'},{participantId:'b'}]},{type:'RAIDER_IDENTITY',participantId:'b'}],observations:[]}};
const banditMem={claims:{a:{role:'BUSINESS',wakeHours:[4],treatState:'MISSING',treatStatesByHour:{4:'MISSING'},coWakerIds:[],contradictionCount:5,contradictionReasons:['changed story'],relation:{}},b:{role:'BUSINESS',wakeHours:[4],treatState:'MISSING',treatStatesByHour:{4:'MISSING'},coWakerIds:[],contradictionCount:7,contradictionReasons:['changed story'],relation:{}},c:{role:'BUSINESS',wakeHours:[5],treatState:'PRESENT',treatStatesByHour:{5:'PRESENT'},coWakerIds:[],contradictionCount:0,contradictionReasons:[],relation:{}}}};
assert.notEqual(engine.voteTarget(banditState,banditMem)?.id,'b');

const local=fs.readFileSync(path.join(root,'js/local-transport.js'),'utf8');
assert.doesNotMatch(local,/reserveAvailableRole|releaseRoleReservation|from '\.\/assign-role\.js'/);
assert.match(local,/roleReservation:null/);
const network=fs.readFileSync(path.join(root,'js/frenzy-network.js'),'utf8');
assert.match(network,/HOUR_CHOICES/);
assert.match(network,/Claimed wake/);
assert.match(network,/Role claim describes/);
assert.match(network,/Glimpse hour \(optional\)/);

console.log(JSON.stringify({ok:true,test:'revision3-social-deduction-test',quickClaimParsing:true,multiWakeChronology:true,itchyCandidateVote:true,guardianStaleTrust:true,convertedHunterMarkBlocked:true,startingVsCurrentClaims:true,botVolunteerParsing:true,sameHourTransition:true,localRoleReservationsDisabled:true},null,2));
