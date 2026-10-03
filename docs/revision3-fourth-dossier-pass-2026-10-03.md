# Ferret Frenzy — Revision 3.2 Fourth Dossier Pass Audit

## Scope

This pass restores the **complete Revision 3 second-dossier-pass game package** as the preservation baseline, then applies the new dossier-driven changes in place. It is intentionally additive. No backend source was supplied, generated, or modified.

The authoritative gameplay document for this package is `Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3_2_Pass4.txt`. The original Revision 3.0 dossier and Revision 3.1 Pass 3 dossier/audit are retained in `docs/` rather than removed.

## Package preservation result

- Baseline ZIP: `FerretFrenzy_Revision3_Dossier_Pass2_2026-10-03.zip`
- Baseline ZIP size: **25,250,179 bytes**
- Baseline game files: **152**
- Baseline uncompressed file bytes: **27,602,487**
- Baseline files missing from Pass 4: **0**
- Baseline files kept byte-for-byte unchanged: **142**
- Baseline files intentionally modified in place: **10**
- New additive files currently present: **6**

- Pass 4 game files: **158**
- Pass 4 uncompressed file bytes: **29,049,752**
- Uncompressed byte delta vs baseline: **+1,447,265**



**No baseline game file is missing.** The preservation manifest is `revision3-pass4-preservation-manifest.tsv` and includes baseline/current sizes and SHA-256 hashes for every baseline file.

## Intentional in-place changes

- `js/frenzy-network.js`
- `js/voting.js`
- `json/mechanics-catalog.json`
- `json/protocol-events.json`
- `json/package-manifest.json`
- `json/ferret-frenzy-base-game.json`
- `package.json`
- `tests/revision3-gameplay-test.mjs`
- `service-worker.js`
- `README.md`

## Additive files

- `docs/Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3_1_Pass3.txt`
- `docs/Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3_2_Pass4.txt`
- `docs/revision3-fourth-dossier-pass-2026-10-03.md`
- `docs/revision3-pass3-audit-2026-10-03.md`
- `docs/revision3-pass4-preservation-manifest.tsv`
- `tests/pass4-package-integrity-test.mjs`

## Gameplay/implementation changes

1. `js/voting.js` now rejects self-votes by default, deduplicates repeated actor records during helper tallies, preserves protected-target vote records while excluding those targets from capture, and returns no catch when no positive eligible total remains.
2. `js/frenzy-network.js` now revalidates Paw Point targets before submission and refuses self-votes even if stale/malformed UI state somehow supplies one.
3. The role-action panel now independently excludes self for every current base action whose dossier rule says “another player,” rather than relying only on `prompt.excludeSelf`.
4. Guardian's all-votes-protected edge case is covered: if protection removes every positive eligible vote total, Paw Point catches nobody.
5. Revision metadata in `mechanics-catalog.json` and `protocol-events.json` is updated from stale Revision 2 labels to Revision 3.2.
6. PWA cache version was bumped so changed JS/JSON is not stranded behind the previous dossier-pass cache.
7. The new package-integrity test checks all 24 role-card images, the critical scene/logo/audio files, all eight 250-response bot libraries (2,000 responses total), and the new target-legality safeguards.

## Dossier preservation

The Revision 3.1 dossier contained about **102,804 words**. Revision 3.2 contains about **105,890 words**, keeping the entire prior dossier and adding the new package-preservation/target-legality section rather than shrinking the rule analysis.

The eight roles remain Bandit, Dooker, Itchy, Trouble, Business, Snuggler, Hunter, and Guardian. The d6+d12 structure, historical Raider objective, fixed card pool, three Hammock cards, Morning Business, simultaneous Paw Point, role deep dives, and all 28 pair-interaction chapters remain intact.

## Test result

`npm test` passes with the accumulated suite:

- bot self-test
- simulation test
- frontend dossier test
- solo-bots browser-fetch test
- solo-bots manager-flow test
- chat/vote/claim/privacy test
- Revision 3 gameplay regression test
- Revision 3 social-deduction regression test
- **Revision 3.2 Pass 4 package-integrity test**

## Backend boundary

The existing tested Google Apps Script endpoint remains referenced by the frontend. No `.gs` file is included in this package, and this pass does not claim to have altered server behavior. The new frontend guards are defense-in-depth; authoritative legality and hidden-state resolution still belong to the backend.
