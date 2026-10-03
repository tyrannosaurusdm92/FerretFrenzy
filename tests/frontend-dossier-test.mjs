import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(root);
assert.equal(files.filter(f=>f.toLowerCase().endsWith('.gs')).length,0,'frontend package must contain no Apps Script backend file');

const lobby=read('lobby.html');
assert.match(lobby,/id="howToPlayButton"/);assert.match(lobby,/id="howToPlayDialog"/);assert.match(lobby,/FILL EMPTY SEATS WITH BOTS/);assert.match(lobby,/RANDOM DEAL/);
const game=read('assets/code/frenzy.html');
assert.match(game,/data-panel="quickHelp"/);assert.match(game,/id="sleepLock"/);assert.match(game,/SLEEPING · BURROW CLOCK CONTINUES ABOVE/);assert.match(game,/id="crimeActionHint"/);assert.match(game,/id="privateTampering"/);assert.match(game,/id="privateTeamwork"/);assert.match(game,/tied eligible top vote-getters are caught together/i);assert.match(game,/data-die="d6" data-system="1"/);assert.match(game,/data-die="d12" data-system="2"/);
const css=read('css/frenzy-game.css');assert.match(css,/\.sleep-lock\{[^}]*z-index:29/);assert.match(css,/\.ff-sleeping \.game-hud\{z-index:31/);
const hitbox=read('js/minnow-hitbox.js');assert.match(hitbox,/GEOJSON_URL='\.\.\/\.\.\/json\/minnow-hitbox\.geojson'/);assert.match(hitbox,/fetch\(GEOJSON_URL/);assert.match(hitbox,/source:'geojson-overlay'/);
const network=read('js/frenzy-network.js');assert.match(network,/fillEmpty=state\.game\.allowBots!==false&&state\.game\.autoFillBots!==false/);assert.match(network,/backend shuffling and randomly dealing private role cards/);assert.match(network,/TROUBLE_SWAP/);assert.match(network,/DOOKER_TRIP/);assert.match(network,/GUARDIAN_PROTECT/);assert.match(network,/vote\.cast/);
const shell=read('js/frenzy-shell.js');assert.match(shell,/ratio>=\.72&&duration<=850\)rollSelected\('joystick-flick'\)/);assert.match(shell,/e\.key==='1'/);assert.match(shell,/e\.key==='2'/);
const cards=read('js/cards.js');for(const role of ['BANDIT','DOOKER','ITCHY','TROUBLE','BUSINESS','SNUGGLER','HUNTER','GUARDIAN'])assert.match(cards,new RegExp(`${role}:\\{`));assert.match(cards,/ff-card-statline/);assert.match(cards,/Full role rules/);
const assignment=JSON.parse(read('json/role-assignment.json'));assert.equal(assignment.liveDeal,'backend-random-and-authoritative');assert.equal('controllerSeatPlan' in assignment,false);for(const [n,recipe] of Object.entries(assignment.activeSetRecipes)){assert.equal(Object.values(recipe).reduce((a,b)=>a+b,0),Number(n)+3,`recipe ${n} must be player count + 3 Hammock cards`)}
const base=JSON.parse(read('json/ferret-frenzy-base-game.json'));assert.equal(base.roundSetup.hammockCards,3);assert.equal(base.roundSetup.startingRoleImmutable,true);assert.equal(base.pawPoint.simultaneousLock,true);assert.match(base.pawPoint.ties,/all eligible tied top/i);assert.equal(base.bots.roleReservation,false);
const botManager=read('js/bot-manager.js');assert.match(botManager,/lobbyReady\(guest\.guestToken,k,true\)/);assert.match(botManager,/startingRole/);assert.match(botManager,/Roles are NEVER reserved or assigned in the browser/);
const dossier=read('js/dossier-pass.js');assert.match(dossier,/historical Raider/);assert.match(dossier,/privateTampering/);assert.match(dossier,/privateTeamwork/);
const sw=read('service-worker.js');assert.match(sw,/\.\/js\/dossier-pass\.js/);
console.log(JSON.stringify({ok:true,checks:32,roles:8,recipes:Object.keys(assignment.activeSetRecipes).length,backendFiles:0},null,2));
