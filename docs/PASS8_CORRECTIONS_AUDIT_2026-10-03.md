# Ferret Frenzy — Pass 8 Corrections Audit

## Preservation baseline

The attached full-game ZIP is the baseline. It contains 185 files and 29,956,107 uncompressed file bytes. Pass 8 contains 190 files and 30,006,823 uncompressed file bytes, a net increase of 50,716 bytes. The hash comparison records 162 unchanged files, 23 intentionally modified files, 5 additions, and 0 missing baseline files. The manifest marks its own checksum as self-referential. Prior roles, card art, audio, bots, dossiers, tests, narrator behavior, and public channels are retained.

## Corrections made

- **Lobby play:** the game HUD now opens public chat in the lobby and accepts messages before roles are dealt. Quick Role Claim remains limited to Morning Business and Paw Point.
- **Turn Floor:** the queue is phase-scoped, duplicate paw requests are ignored, non-host mode/grant commands are ignored, and the host can grant only a player who raised a paw. These rules live in `js/chat-turn-rules.js` and have direct tests.
- **Narrator/game sound:** mute, low/full volume buttons, and the volume slider share one update path. The selected level is remembered per device, and the narrator follows that same master level.
- **Phone usability:** the discussion panel uses the available phone height and safe areas; channel navigation scrolls on its own; chat text and touch targets are larger.
- **Package tests:** the previous ZIP had no root test command, while several packaged tests pointed to deleted `tests/`, `README.md`, and nested card-image paths. A root `package.json` now runs the flattened `docs/test__*.mjs` suite; the stale test paths are repaired.
- **PWA refresh:** the service-worker cache version is advanced and precaches the new turn-rules module.

## Rules and backend

The Revision 3.3 role dossier remains authoritative. The eight roles, d6/d12 system, card counts, role privacy, Paw Point behavior, and resolution order are unchanged. The existing Apps Script backend is neither included nor modified.

The supplied backend contract has no turn-floor authorization action. Turn Floor therefore disables the message composer in the supplied updated clients and coordinates its queue through the existing public chat stream; it is not a server-enforced permission boundary.

## Validation

- `npm test` passes the complete inherited suite and the new lobby/chat/turn/mobile regression test.
- Every JavaScript file parses.
- Local HTML/CSS/module references, service-worker precache entries, and PWA icons resolve.
- Package folders remain `css`, `js`, `json`, `docs`, and `assets`; only `assets` nests `images`, `audio`, and `code`. `assets/code` contains only `frenzy.html`.
- No backend `.gs` file or nested ZIP is present.
- `PASS8_PRESERVATION_MANIFEST.tsv` compares all baseline file hashes with this package; it records added, modified, and missing files.
