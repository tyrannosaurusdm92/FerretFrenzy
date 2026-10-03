# Ferret Frenzy — Revision 3.3 Frontend + Integrated Narrator

Authority
- Gameplay authority: docs/Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3_3_Pass5.txt (Revision 3.3). Revision 3.0, Revision 3.1 Pass 3, and Revision 3.2 Pass 4 dossiers are retained in docs/ as historical baselines.
- Revision 3.0 supersedes Revision 2.0 only where gameplay wording conflicts.
- This package does not replace or include the tested Apps Script backend.

Entry points
- lobby.html — lobby, Solo + Bots, room/join flow, full How to Play guide.
- assets/code/frenzy.html — game shell/HUD, quick How to Play, Morning Business, Paw Point, private tools, and the integrated Narrator panel.

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
8. Resolve any valid loyal Hunter Hunt Mark after the Paw Point catch set, then resolve Snuggle Bond result reveals, then determine whether the historical Raider is in the final valid catch set.

Role clarifications added by Revision 3.0
- Dooker: second wake Glimpse reads current allegiance at that exact timestamp; later movement can make it stale. Third wake views one Hammock card and may Trip it onto one player without seeing the displaced card.
- Itchy: d6 5–6 activates a second distinct wake and later gives a two-player clue containing the historical Raider plus one legal non-Raider decoy when possible. If a legal pair cannot be formed, the clue must be explicitly marked degraded.
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
- Each bot loads the role-specific v3.1 reasoning brain only after its own Starting Role is returned.

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


## Second Revision 3 dossier pass

This package includes an additional consistency pass over the same Revision 3.0 authority. The focus is social-deduction correctness rather than new roles or presentation changes.

- Quick Role Claim testimony can optionally specify whether the role claim refers to Starting Role or Current Card, claimed wake hour(s), first-wake Treat State, first co-waker, and role-specific targets/results. These controls remain bluff-safe and are never checked against hidden truth.
- Public claim parsing is timestamp-aware. A Dooker, Hunter, or activated Itchy may reveal multiple legal wake hours without being falsely marked contradictory, and PRESENT at an earlier hour plus MISSING at a later hour is stored as two chronological claims rather than one flattened contradiction.
- The parser recognizes the exact `I am claiming <role>` wording produced by Quick Role Claim and the bots' `I am volunteering my role claim: <role>` wording, so human and bot testimony enters the same public claim model.
- Starting Role claims and Current Card claims are tracked separately. A legal story such as `I started Guardian; my Current Card is Business` is not treated as a role contradiction, and Current Card never grants Starting-Role wake/action capabilities.
- A valid Itchy two-player clue constrains a loyal Itchy bot's vote to those two candidates. A no-decoy edge case must be marked degraded instead of silently becoming a one-name pair.
- Guardian bot protection treats Hunter recognition as historical information, not an automatic protection command. Protection and the Guardian's own Paw Point remain separate decisions.
- Converted Hunter bots refuse Hunt Mark behavior even if a stale or unexpected mark prompt appears.
- Hostile bots absolutely protect a known historical Raider, while non-Raider starting Bandits are not treated as untouchable forever; sacrificial distancing can be considered when public pressure makes it useful.
- The local lobby fallback no longer reserves roles at seat creation or join time. Lobby membership is role-neutral everywhere in the package.

Local testing
Serve the package from a local static HTTP server. ES modules and service workers are not reliable under file://.

Backend boundary
The frontend references the tested backend endpoint configured in js/backend-config.js / json/backend-config.json. No .gs backend source is included or generated by this package.


## Fourth Revision 3 dossier pass — full-package preservation

This package is an additive pass over the complete Revision 3 second-dossier-pass game, not a documentation-only replacement. All existing game assets, card art, audio, bot response libraries, code, tests and prior docs are carried forward unless modified in place.

- Paw Point client helpers now reject self-votes and deduplicate repeated actor records; the authoritative backend remains responsible for final validation.
- Guardian protection semantics explicitly allow a zero-capture Paw Point when every positive vote total belongs to protected targets.
- The visible vote submission path rechecks that the target is another active participant.
- Every current base-role action whose dossier text requires “another player” filters self even if a malformed prompt omits `excludeSelf`; two-target actions still require distinct choices.
- `tests/pass4-package-integrity-test.mjs` verifies all 24 card images, critical scene/logo/audio resources, eight 250-response bot libraries, and the new client target-legality guards.
- The original Revision 3.0 dossier, Revision 3.1 Pass 3 dossier/audit, and new Revision 3.2 dossier/audit remain in `docs/`.
- No Apps Script backend source is included or modified.

## Fifth Revision 3 dossier pass — resolution order and result provenance

Revision 3.3 is additive over the complete Revision 3.2 / Pass 4 package.

- Exact secondary resolution is **Paw Point catches → valid loyal Hunter Hunt Mark catch → Snuggle Bond result reveal → historical Raider primary-win check**.
- Bond-Reveal is never a catch. Result UI now identifies a reveal-only bonded player separately from a caught player whenever the backend exposes `bondRevealed`.
- The dossier result-note refresh signature includes `bondRevealed` and optional catch-source fields so a later authorized Results snapshot cannot be ignored by the UI.
- `json/protocol-events.json` now places `HUNT_MARK_CHECKED` before `BOND_EXTRA_REVEAL`, matching the causal rule.
- Live lobby/HUD help is labeled Revision 3.3 and uses the current resolution order.
- `tests/pass5-dossier-consistency-test.mjs` guards the order, result distinction, current authority metadata, and Pass 5 cache/version wiring.
- The complete Pass 4 package remains the preservation baseline; no existing game file, asset, audio file, card image, bot library, prior dossier, or earlier test is removed.
- The tested Apps Script backend remains unchanged.


## Integrated narrator pass

The uploaded Ferret Frenzy Narrator is now part of the live game rather than a separate token/login page.

- The **Narrator** toolbar panel reads the already-authorized current player state through `window.FFNetwork.getState()`.
- Shared phase announcements can be spoken automatically with the browser speech engine.
- Private role prompts and newly delivered private facts remain local to that player; private speech is gated behind an explicit headphones confirmation.
- The narrator never rolls dice, chooses role targets, swaps cards, protects, marks, votes, or otherwise takes gameplay actions.
- The host seat owns shared narrator chat to avoid duplicate narrator messages from every connected client.
- During shared-chat phases, new narrator announcements can be posted automatically and the host can also type a manual narrator line.
- Public narrator chat uses the existing tested `chat.send` endpoint with a reserved frontend marker, and updated clients render those messages as **Ferret Frenzy Narrator**.
- Private narrator instructions and facts never enter shared chat.
- No Apps Script backend source was changed or added.

See `docs/narrator/NARRATOR_INTEGRATION_2026-10-03.md` and `json/narrator-config.json`.


## Narrator + channels + turn-floor pass

- Narrator speech now follows the same HUD sound master as the rest of Ferret Frenzy. 🔇 cancels/suppresses speech; 🔉/🔊 set narrator speech volume.
- Narrator text chat remains readable while muted and may post to #narrator or another public gameplay channel.
- Public channels: #burrow, #evidence, #claims, #paw-point, #narrator. These are organizational views over the same public chat stream, not hidden faction rooms.
- Turn Mode adapts Zoom-style mute + raise-hand interaction to text gameplay: host enables Turn Mode, players Raise Paw, host grants Next Turn, and the floor-holder ends/yields the turn.
- No new backend dependency was added.
