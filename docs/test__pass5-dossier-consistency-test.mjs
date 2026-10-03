import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {topTargets} from '../js/voting.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));

const dossierName='Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3_3_Pass5.txt';
const dossier=read(`docs/${dossierName}`);
assert.match(dossier,/PART X — REVISION 3\.3 RESOLUTION-ORDER, RESULT-PROVENANCE, AND AUTHORITY-COHERENCE PASS/);
assert.match(dossier,/PROTECT -> LOCK VOTES -> PAW POINT CATCHES -> LOYAL HUNT MARK CATCH -> BOND REVEAL -> RAIDER WIN CHECK/);

const readme=read('docs/README.md');
assert.match(readme,/Revision 3\.3 Frontend/);
const round8=readme.match(/8\. Resolve[^\n]+/)?.[0]||'';
assert.ok(round8.indexOf('Hunt Mark')>=0 && round8.indexOf('Snuggle Bond')>round8.indexOf('Hunt Mark'),'README must put Hunt Mark before Snuggle Bond reveal');

const lobby=read('lobby.html');
const results=lobby.match(/<section><h3>Paw Point and the results<\/h3>([\s\S]*?)<\/section>/)?.[1]||'';
assert.ok(results.indexOf('Paw Point catch set resolves')>=0 && results.indexOf('valid loyal Hunter Hunt Mark')>results.indexOf('Paw Point catch set resolves') && results.indexOf('Snuggle Bond result reveals')>results.indexOf('valid loyal Hunter Hunt Mark') && results.indexOf('historical Raider was caught')>results.indexOf('Snuggle Bond result reveals'),'Lobby guide must preserve Paw Point → Hunt Mark → Bond-Reveal → Raider win order');
assert.match(lobby,/Welcome to Ferret Frenzy: the game where the Minnow Treats have vanished/);
for(const role of ['Bandit','Dooker','Itchy','Trouble','Business','Snuggler','Hunter','Guardian']) assert.match(lobby,new RegExp(`<b>${role}<\\/b>`));
assert.match(lobby,/Players<\/th>[\s\S]*?<td>10<\/td>/);
assert.match(lobby,/Revision 3\.3/);

const hud=read('assets/code/frenzy.html');
assert.match(hud,/Quick How to Play · Revision 3\.3/);
assert.match(hud,/Paw Point catches → valid loyal-Hunter Hunt Mark catch → Snuggle Bond result reveal → historical Raider win check/);

const events=json('json/protocol-events.json');
assert.equal(events.version,'dossier-r3.3-pass5-2026-10-03');
assert.ok(events.dossierEventVocabulary.indexOf('HUNT_MARK_CHECKED')<events.dossierEventVocabulary.indexOf('BOND_EXTRA_REVEAL'),'protocol vocabulary must check Hunt Mark before Bond reveal');
assert.match(events.resultSemantics.bondRevealed,/never itself capture/i);

const base=json('json/ferret-frenzy-base-game.json');
assert.equal(base.authority,`${dossierName} — Revision 3.3`);
assert.deepEqual(base.secondaryResolution.order,[
  'Paw Point catch set',
  'loyal Hunter Hunt Mark',
  'Snuggle Bond result reveal',
  'historical Raider primary-win check'
]);
assert.match(base.secondaryResolution.resultSemantics,/bondRevealed.*never capture/i);

const manifest=json('json/package-manifest.json');
assert.equal(manifest.packageVersion,'3.11.0');
assert.equal(manifest.dossierAlignment.source,`${dossierName} — Revision 3.3`);
assert.match(manifest.dossierAlignment.resultProvenance,/BOND-REVEALED.*never itself a catch/i);

const cards=read('js/cards.js');
assert.match(cards,/BOND-REVEALED · NOT CAUGHT/);
const dossierPass=read('js/dossier-pass.js');
assert.match(dossierPass,/p\.bondRevealed/);
assert.match(dossierPass,/p\.catchSource,p\.caughtBy,p\.captureSource/);

const sw=read('service-worker.js');
assert.match(sw,/ferret-frenzy-v25-how-to-play-menu-20261003/);

// Revision 3.2 zero-capture semantics remain intact under the new authority pass.
const zero=topTargets([{actorId:'a',targetId:'b'},{actorId:'c',targetId:'b'}],{protectedIds:['b'],eligibleActorIds:['a','c'],eligibleTargetIds:['a','b','c']});
assert.deepEqual(zero,[]);

console.log(JSON.stringify({
  ok:true,
  test:'pass5-dossier-consistency-test',
  authority:'Revision 3.3',
  secondaryOrder:true,
  resultProvenance:true,
  lateBondRefresh:true,
  zeroCapturePreserved:true
},null,2));
