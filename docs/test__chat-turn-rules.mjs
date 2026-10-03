import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canPlayerChat, hostIdForState, isOtherPlayer, replayTurnState} from '../js/chat-turn-rules.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

assert.equal(canPlayerChat({phase:'LOBBY',channel:'burrow',playerId:'p1'}), true);
assert.equal(canPlayerChat({phase:'LOBBY',channel:'narrator',playerId:'p1'}), false);
assert.equal(canPlayerChat({phase:'PREP',channel:'burrow',playerId:'p1'}), false);
assert.equal(canPlayerChat({phase:'MORNING',channel:'claims',playerId:'p1'}), true);
assert.equal(canPlayerChat({phase:'VOTE',channel:'paw-point',playerId:'p1'}), true);
assert.equal(canPlayerChat({phase:'MORNING',channel:'burrow',turnState:{mode:true,floorId:'p1'},playerId:'p1'}), true);
assert.equal(canPlayerChat({phase:'VOTE',channel:'burrow',turnState:{mode:true,floorId:'p1'},playerId:'p2'}), false);
assert.equal(canPlayerChat({phase:'RESULTS',channel:'burrow',playerId:'p1'}), false);

assert.equal(hostIdForState({game:{},me:{id:7,isHost:true},participants:[{id:7}]}),'7');
assert.equal(hostIdForState({game:{hostParticipantId:'host'},me:{id:'p1'},participants:[{id:'host',isHost:true}]}),'host');
assert.equal(hostIdForState({game:{},me:{id:'p1'},participants:[{id:9,isHost:true}]}),'9');
assert.equal(isOtherPlayer({id:7},'7'),false,'numeric and string IDs must identify the same player');
assert.equal(isOtherPlayer({id:8},'7'),true);

const ids = ['host','p1','p2','p3'];
const events = [
  {senderId:'p1',system:'TURN:MODE:ON'},              // non-host cannot enable mode
  {senderId:'host',system:'TURN:MODE:ON'},
  {senderId:'p1',system:'TURN:REQUEST'},
  {senderId:'p1',system:'TURN:REQUEST'},              // repeated paw is deduplicated
  {senderId:'p2',system:'TURN:REQUEST'},
  {senderId:'host',system:'TURN:GRANT:p3'},           // host cannot grant a non-queued player
  {senderId:'host',system:'TURN:GRANT:p1'},
  {senderId:'p2',system:'TURN:REQUEST'},              // repeated queued paw is deduplicated
  {senderId:'p2',system:'TURN:YIELD'},                // non-floor holder cannot yield p1's turn
  {senderId:'p1',system:'TURN:YIELD'},
  {senderId:'host',system:'TURN:GRANT:p2'},
  {senderId:'p2',system:'TURN:YIELD'},
  {senderId:'host',system:'TURN:MODE:OFF'}
];
assert.deepEqual(replayTurnState(events, 'host', ids, 'MORNING'), {mode:false,floorId:'',queue:[]});
assert.deepEqual(replayTurnState(events.slice(1, 5), 'host', ids, 'VOTE'), {mode:true,floorId:'',queue:['p1','p2']});
assert.deepEqual(replayTurnState(events, 'host', ids, 'LOBBY'), {mode:false,floorId:'',queue:[]});

const network = read('js/frenzy-network.js');
assert.match(network,/canPlayerChatForState/);
assert.match(network,/writablePhase=\['LOBBY','MORNING','VOTE'\]/);
assert.match(network,/claimPhase=\['MORNING','VOTE'\]/);
assert.match(network,/\['LOBBY','MORNING','VOTE'\]\.includes\(phase\)/);
assert.match(network,/hostIdForState\(state\)/);
assert.match(network,/isOtherPlayer\(x,me\.id\)/);
assert.match(network,/chatRequestSeq/,'late chat responses must not overwrite a newer refresh');
const shell = read('js/frenzy-shell.js');
assert.match(shell,/ff:sound-level:v1/);
assert.match(shell,/vol\?\.addEventListener\('input',e=>setSound/);
assert.match(shell,/setSound\(storedSoundLevel\(\)\)/);
const channelCss = read('css/chat-channels.css');
assert.match(channelCss,/max-height:none!important/);
assert.match(channelCss,/min-height:46px/);
assert.match(channelCss,/\.discussion-message p\{font-size:14px/);

console.log(JSON.stringify({
  ok:true,
  test:'chat-turn-rules',
  lobbyChat:true,
  narratorReadOnly:true,
  floorQueueValidated:true,
  phaseScopedFloor:true,
  hostIdentityFallback:true,
  numericStringIds:true,
  staleChatRefreshBlocked:true,
  soundPreferencePersists:true,
  mobileChatUsable:true
}, null, 2));
