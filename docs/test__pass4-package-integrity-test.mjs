import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'..');
const req=[
 'lobby.html','assets/code/frenzy.html','assets/images/frenzy_logo.png','assets/images/minnow treats.png',
 'assets/images/Aurora-lit ferret treats bookshelf-1.png','assets/images/Minnow Treats crime scene-2.png',
 'assets/audio/dice-roll.mp3','assets/audio/ferret.mp3','assets/audio/ferret_dancing.mp3','assets/audio/ferret_sound.mp3'
];
for(let i=1;i<=24;i++){const prefix=String(i).padStart(2,'0')+'_';const found=fs.readdirSync(path.join(root,'assets/images/cards')).some(n=>n.startsWith(prefix));assert.equal(found,true,`missing card image ${prefix}`)}
for(const f of req)assert.equal(fs.existsSync(path.join(root,f)),true,`missing preserved game file: ${f}`);
for(const role of ['bandit','dooker','itchy','trouble','business','snuggler','hunter','guardian']){const j=JSON.parse(fs.readFileSync(path.join(root,`json/${role}-bot.json`),'utf8'));assert.equal(j.responses.length,250,`${role} bot response library must stay intact`)}
const vote=fs.readFileSync(path.join(root,'js/voting.js'),'utf8');assert.match(vote,/actorId===targetId|actor===target/);
const network=fs.readFileSync(path.join(root,'js/frenzy-network.js'),'utf8');assert.match(network,/Self-votes are not legal/);assert.match(network,/otherPlayerOnly/);
console.log(JSON.stringify({ok:true,test:'pass4-package-integrity-test',cards:24,botResponses:2000,preservedAssets:req.length,selfVoteGuard:true},null,2));
