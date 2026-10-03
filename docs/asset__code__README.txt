FERRET FRENZY — REVISION 3.0 FRONTEND PACKAGE

Authority
- Gameplay authority: ../../docs/Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3_3_Pass5.txt (Revision 3.3).
- Revision 3.3 is the current authority; earlier Revision 3.x dossiers are retained as historical baselines.
- This package does not replace or include the tested Apps Script backend.

Entry points
- lobby.html — lobby, Solo + Bots, room/join flow, full How to Play guide.
- assets/code/frenzy.html — game shell/HUD, quick How to Play, Morning Business, Paw Point, private tools.

Base game
- Exactly 8 roles: Bandit, Dooker, Itchy, Trouble, Business, Snuggler, Hunter, Guardian.
- Exactly 24 base cards: 4 Bandit, 14 Business, one of each other role.
- Each round uses one Starting Card per occupied seat plus 3 hidden Hammock cards.
- Starting Role never changes and determines scheduled role actions. Current Card can move. Current Allegiance is separate.
- Historical Raider is the starting Bandit who actually steals the Minnow Treats; Raider history never moves with a card.

Round flow
1. Build/shuffle Active Set and deal one Starting Card per seat + 3 Hammock cards.
2. Resolve pre-night relationships: Snuggler bond; Hunter/Guardian recognition when applicable.
3. Roll private d12 wake schedules and defined d6 checks.
4. Resolve Hours 1–12 in order: wake -> Treat State -> Raider theft -> conversion/witness triggers -> Starting-Role actions -> commit -> sleep.
5. Morning Business shared discussion. The app does not verify public claims or publish guilt scores.
6. Guardian may protect one other player immediately before Paw Point lock.
7. Each active player locks one private Paw Point simultaneously. Protected target is ineligible for vote capture; all eligible tied top totals are caught.
8. Resolve Bond-Reveal and loyal Hunter Hunt Mark, then determine whether the historical Raider is in the final valid catch set.

Role clarifications added by Revision 3.0
- Dooker: second wake Glimpse reads current allegiance at that exact timestamp; later movement can make it stale. Third wake views one Hammock card and may Trip it onto one player without seeing the displaced card.
- Itchy: d6 5–6 activates a second distinct wake and later gives a two-player clue containing the historical Raider plus one legal non-Raider decoy when possible.
- Trouble: blind-swaps two distinct other Current Cards. If present in the theft window, converts In On It before the swap and learns the historical Raider identity.
- Business: if genuinely alone at the beginning of its wake, chooses one other player and receives exactly one randomly selected wake result from that player, not the whole schedule.
- Snuggler: bond is player-bound and alignment-neutral. If one partner is caught, the other may be Bond-Revealed in results; Bond-Reveal is not itself a Paw Point capture.
- Hunter: first overlap with a starting Bandit triggers one private d6; 1–2 converts permanently. A still-loyal Hunter later sets one conditional Hunt Mark.
- Guardian: protection removes one other player from Paw Point capture eligibility for that resolution. Votes on the protected player remain relevant to replay but do not determine the top eligible capture total.

Evidence and chat
- Hard personal facts are only facts delivered to that player by the game or chosen by that player.
- Public statements are CLAIMS, not server-verified truth. Quick Role Claim is a statement builder and supports bluffing.
- A true fact may become STALE after later card movement/conversion. Timestamp role information when discussing it.
- Chat remains open through Morning Business and Paw Point so typing is not interrupted by polling or vote state changes.
- Bots obey the same information boundary as humans. They may voluntarily make a role claim, but direct questions cannot force hidden-role disclosure.

Solo + Bots
- Solo + Bots creates ordinary guest seats and readies them before game start.
- Bots never reserve roles. The tested backend performs the same random deal for every occupied seat.
- Each bot loads the role-specific v3 brain only after its own Starting Role is returned.

Controls
- Joystick: navigate; deliberate flick commits a die roll.
- /1/: select d6.
- /2/: select d12.
- A: confirm/select.
- B: back/close/cancel before lock.
- X: context-sensitive role action.
- Private Info, Notebook, Discussion/Vote, Controls, Settings and Quick How to Play are HUD panels.

Sleep / crime scene
- During sleep, only the game viewport blacks out with the Ferret Frenzy logo; HUD/Burrow Clock stays visible and continues ticking.
- Non-identifying ferret chitter may occur during hostile-side activity without revealing who is active.
- Raider theft uses json/minnow-hitbox.geojson as the clickable Minnow Treat hotspot and transitions authorized views from pre-crime to post-crime imagery.

Local testing
Serve the package from a local static HTTP server. ES modules and service workers are not reliable under file://.

Backend boundary
The frontend references the tested backend endpoint configured in js/backend-config.js / json/backend-config.json. No .gs backend source is included or generated by this package.
