# Ferret Frenzy Bots v3 Integration — 2026-10-02

This frontend package integrates the supplied **Ferret Frenzy Solidified Role Bots v3** without changing the tested Apps Script backend.

## Live behavior

- Browser autofill creates anonymous guest seats and marks them ready before `game.start`.
- No role is reserved or assigned in the browser.
- The tested backend remains authoritative for the actual role deal.
- After `game.state` exposes a managed bot seat's private `startingRole`, the frontend loads exactly that role's specialized v3 brain.
- Eight specialized brains are available: Bandit, Dooker, Itchy, Trouble, Business, Snuggler, Hunter, Guardian.
- Each role has 250 response records, for 2,000 total.
- Bots use the v3 memory, public-claim parser, contradiction tracking, deduction engine, role action brain, conversation engine, and Paw Point target selection.
- The v3 dice coordinator accepts only d6 and d12 and sends authoritative rolls through the existing backend.
- Bots persist across the lobby-to-game navigation through browser storage and are resumed by `js/bot-game-bootstrap.js`.
- A room lease prevents duplicate bot-driving loops across tabs.

## Sleep HUD integration

The v3 bot manager exposes current managed-bot state to the existing Night audio layer. That keeps the previous behavior where a sleeping human can hear ferret chittering when a locally managed Bandit-side bot is awake/active, while the blackout remains confined to the game viewport and the shell/HUD clock stays visible.

## Backend protection

The supplied `.gs` backend was used only as a read-only contract reference while integrating these frontend modules. It is not copied into this deliverable, and no replacement backend file is generated.
