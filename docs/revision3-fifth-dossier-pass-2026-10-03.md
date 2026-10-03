# Ferret Frenzy — Revision 3.3 Fifth Dossier Pass (2026-10-03)

## Scope

This pass is additive over the complete Revision 3.2 / Pass 4 game package. It does not replace the game with a documentation-only archive and does not remove any existing Pass 4 file.

## Dossier authority

Current gameplay authority:
`Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3_3_Pass5.txt`

Historical Revision 3.0, Revision 3.1 Pass 3, and Revision 3.2 Pass 4 dossiers remain in `docs/`.

## Main reconciliation findings

1. The authoritative secondary-resolution order was already defined as:
   **Paw Point catches → valid loyal Hunter Hunt Mark catch → Snuggle Bond result reveal → historical Raider primary-win check.**

2. The Pass 4 README and lobby How to Play still described Bond-Reveal before Hunt Mark. That wording was corrected because a Hunt Mark catch can itself trigger a Snuggle Bond reveal.

3. `json/protocol-events.json` also listed `BOND_EXTRA_REVEAL` before `HUNT_MARK_CHECKED`. The vocabulary is now reordered to match the causal rule.

4. The Results dossier-note refresh signature did not include `bondRevealed`. A later authorized Results snapshot could therefore add a bond reveal without forcing the notes to refresh. The signature now includes `bondRevealed` and optional catch-source fields.

5. Result-card text now distinguishes a reveal-only bonded player from a caught player with `BOND-REVEALED · NOT CAUGHT`. Bond-Reveal remains a result visibility effect, not a capture.

6. Catch-source wording is conservative. If the backend exposes a recognizable Paw Point/Hunt Mark source, the dossier notes may label it. If the backend only exposes `caught=true`, the UI keeps the generic `caught by Paw Point or a valid Hunt Mark` wording rather than inventing provenance.

7. Live lobby/HUD help now identifies the current Revision 3.3 authority, while historical documents keep their original revision labels.

## Preserved non-negotiables

- Exactly eight roles: Bandit, Dooker, Itchy, Trouble, Business, Snuggler, Hunter, Guardian.
- Exactly d6 and d12 as mechanical dice.
- Fixed 24-card pool.
- One Starting Card per occupied seat plus three Hammock cards.
- Starting Role remains immutable for scheduled actions.
- Current Card may move without moving historical Raider or player-bound statuses.
- Morning Business claims remain bluff-safe and unverified by hidden truth.
- Paw Point remains one simultaneous private vote per active player for another active player.
- Guardian protection changes Paw Point capture eligibility only.
- All eligible tied positive top Paw Point targets are caught.
- Historical Raider capture remains the primary Business win condition.
- Bots use the same authorized-information boundaries as humans.
- Tested Apps Script backend endpoint is unchanged.

## Regression coverage

All inherited tests remain in the package. Pass 5 adds:
`tests/pass5-dossier-consistency-test.mjs`

It checks current dossier authority, public secondary-resolution order, protocol order, Bond-Reveal-versus-caught result semantics, late bond-reveal refresh wiring, service-worker cache advancement, and preservation of the Revision 3.2 zero-capture Paw Point rule.

The existing Pass 4 package-integrity test remains active and continues checking the 24 card images, critical visual/audio assets, eight 250-response bot libraries, and target-legality guards.
