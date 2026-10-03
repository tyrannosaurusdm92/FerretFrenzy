import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {FerretFrenzyConversationEngine} from '../js/ferret-frenzy-conversation-engine.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const network=fs.readFileSync(path.join(root,'js/frenzy-network.js'),'utf8');
const shell=fs.readFileSync(path.join(root,'js/frenzy-shell.js'),'utf8');
const html=fs.readFileSync(path.join(root,'assets/code/frenzy.html'),'utf8');

assert.match(shell,/function openPanel\(name\).*classList\.contains\('open'\)/s,'openPanel must be idempotent instead of toggling an already-open chat');
assert.match(network,/\['MORNING','VOTE'\]\.includes\(phase\).*lastSocialPhase!==phase.*openPanel\('chat'\)/s,'chat must open once at Morning and Vote phase entry without being toggled by every poll');
assert.match(network,/if\(\['MORNING','VOTE'\]\.includes\(phase\)\).*Private .* is ready; press X/s,'social role actions must not auto-close chat while typing');
assert.match(html,/id="quickClaimRole"/);
for(const role of ['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN'])assert.match(html,new RegExp(`value="${role}"`));
assert.match(network,/GUARDIAN:\[\['partner','Starting Hunter \(optional\)'\],\['protect','Protected player \(optional\)'\]\]/);
assert.match(network,/TROUBLE:\[\['swapA'.*\['swapB'/s);
assert.match(network,/SNUGGLER:\[\['bondA'.*\['bondB'/s);

const engine=new FerretFrenzyConversationEngine({rng:()=>0.99});
const state={game:{phase:'MORNING'},me:{id:'b1',displayName:'Bot Noodle',startingRole:'GUARDIAN',allegiance:'BUSINESS',wakeHours:[3],observations:[{hour:3,treatStateBefore:'PRESENT',coWakers:[]}],privateFacts:[{type:'HUNTER_RECOGNITION',participantId:'p2',displayName:'Slink'}]},participants:[{id:'b1',displayName:'Bot Noodle'},{id:'p2',displayName:'Slink'}]};
const memory={coverStory:null,publicRoleClaim:'',roleClaimVolunteeredAt:0,sentMorning:0,usedResponseIds:[],actions:[],claims:{},questionsAsked:{}};
const deduction={rankedTargets(){return[]},bestReason(){return''}};
const held=engine.directReply(state,memory,deduction,[{senderParticipantId:'p2',senderName:'Slink',text:'Bot Noodle, what role are you?'}]);
assert.doesNotMatch(held,/Guardian/i,'bot must not reveal its hidden role before it deliberately volunteers a claim');
assert.match(held,/not volunteering/i);
const genericCats=engine.categories(state,memory);
assert(!genericCats.includes('hunter_trust'),'Guardian-specific chat must be gated before a public role claim');
memory.publicRoleClaim='GUARDIAN';
assert(engine.categories(state,memory).includes('hunter_trust'),'role-specific chat may unlock after the bot intentionally claims its actual role');

const volunteerEngine=new FerretFrenzyConversationEngine({rng:()=>0});
const memory2={coverStory:null,publicRoleClaim:'',roleClaimVolunteeredAt:0,sentMorning:1,usedResponseIds:[],actions:[],claims:{},questionsAsked:{}};
const volunteered=volunteerEngine.maybeVolunteerRoleClaim(state,memory2,[]);
assert.match(volunteered,/volunteering my role claim/i);
assert.equal(memory2.publicRoleClaim,'GUARDIAN');

console.log(JSON.stringify({ok:true,test:'chat-vote-claim-privacy-test',roles:8,chatPersistent:true,quickClaims:true,botRolePrivacy:true},null,2));
