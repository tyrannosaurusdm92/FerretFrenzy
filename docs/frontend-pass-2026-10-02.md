# Ferret Frenzy Frontend Pass — 2026-10-02

This package is a frontend-only pass. The Google Apps Script backend endpoint and backend contract were not changed.

## Fixed / verified

- Repaired a fatal JavaScript parse error in `js/frenzy-network.js` that prevented the main gameplay/network module from loading.
- Preserved the existing Apps Script endpoint exactly as supplied.
- Verified the 24 role-card image files are present and wired into `js/cards.js`: 4 Bandit, 14 Business, and one each Dooker, Itchy, Trouble, Snuggler, Hunter, and Guardian.
- Verified all four bundled audio files have active frontend uses: lobby/vote music, night ambience, Morning Business ambience, and dice-roll sound.
- Preserved the two-die control model: `/1/` selects d6, `/2/` selects d12, and the joystick flick rolls the currently required die.
- Preserved twelve 60-second Burrow Hours, giving a 12-minute base Night for game Hours 1–12.
- Hardened host detection for reconnect/state variants.
- Hardened Snuggler two-player action payloads by sending `targetAId`, `targetBId`, and `targetIds` from the frontend/bots.
- Kept all eight role bots and their 250-response JSON libraries. Smart bots are now labeled as bots in frontend card/chat presentation even when they joined through a guest-controlled session.
- Lobby friend-code join remains six-digit numeric; the game menu exposes the room code and Copy Code control.
- PWA install remains driven by `manifest.webmanifest`, `service-worker.js`, and `beforeinstallprompt`, with iOS Add to Home Screen fallback guidance.
- Bumped the service-worker cache version so deployed clients do not stay stuck on the broken frontend module.

## Backend

No Apps Script source, deployment, endpoint, data model, or backend behavior was edited by this pass.

## Validation performed

- JavaScript syntax audit: all files pass after the `frenzy-network.js` repair.
- JSON parse audit: all JSON files pass.
- CSS parse audit: all CSS files pass.
- Runtime asset audit: every HTML/script/service-worker local path resolves to a packaged file.
- Bot library audit: eight role JSON libraries, exactly 250 responses each.
- Bot logic smoke test: all eight role bot classes perform required private d12 rolls; Business, Dooker, Trouble, Snuggler, Hunter, and Guardian action payloads execute through a mocked API object.
- Media audit: PWA icons are valid 192x192 and 512x512 PNGs; all four MP3 files decode; all 24 card JPEGs decode.

A full local browser navigation harness could not be run in the build sandbox because localhost/file navigation is blocked by the environment. The frontend was therefore validated through parser, asset, media, DOM-reference, and bot-module tests without making calls to the live Apps Script backend.


## Sleep HUD + social deduction follow-up
- Night sleep blackout moved from a page-wide fixed overlay into `#viewerScreen`, keeping the HUD/Burrow Clock visible while the scene stays black.
- Sleeping interaction remains locked; dice, role-card overlays, controller layer and number rail cannot be used during Sleep.
- Added conditional ferret chitter overlay audio for Bandit/Raider/accomplice activity cues exposed by sanitized state/events, without backend changes.
- Morning Business now uses a staged Discuss → Paw Point → Result presentation inspired by the supplied Among Us clone meeting flows.
- Chat now shows message count/timestamps when supplied, a character counter, self/bot distinctions, and double-submit protection.
- Paw Point keeps one private selected card, displays a check mark, and makes the final lock state clearer.
