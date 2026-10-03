# Ferret Frenzy Solidified Bots v3.1 — Revision 3.0 gameplay alignment

This package is a **Ferret Frenzy-only** frontend bot brain for the existing tested backend. Gameplay reasoning follows `Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3.txt` Revision 3.0; no backend source file is included in this frontend package.

## What is included

- Eight strict role bots: Bandit, Dooker, Itchy, Trouble, Business, Snuggler, Hunter, Guardian.
- 250 Ferret Frenzy chat responses per role (2,000 total).
- d6/d12-only roll coordinator with resync-before-retry behavior.
- Persistent frontend memory per game/seat/role.
- Public-claim parser and contradiction tracking.
- Private-information-safe timeline deduction.
- Role-aware action targeting.
- Conversation replies, questioning, defense, suspicion, and Paw Point discussion.
- Hostile-side cover stories that remain stable instead of changing every message.
- Paw Point target selection that absolutely protects a known historical Raider while still permitting strategic distancing from non-Raider starting Bandits when public pressure warrants it.
- Server-bot and frontend-guest-bot integration modes.
- Repository provenance, license notes, backend contract, integration guide, and tests under `docs/` and `tests/`.

## Revision 3.0 evidence rules

- Dooker Glimpse is timestamped current-allegiance evidence and may become stale after later card movement.
- Business solo inspection is exactly one randomly selected wake result from one chosen player, never the target's full schedule.
- Trouble theft-window conversion occurs before its blind swap and includes historical Raider identity in Trouble's authorized private knowledge.
- Snuggle Bond can produce Bond-Reveal in final results; Bond-Reveal is not itself a Paw Point capture.
- Guardian protection removes one other player from vote-capture eligibility; protection is not an innocence scan.
- Public role claims are testimony, not authentication. Starting Role and Current Card claims are kept separate, and bots do not expose hidden roles merely because another player asks.
- Multi-wake testimony is timestamp-aware, so legal later wake/Treat-State disclosures are not mislabeled as contradictions.

## Backend

The package is hard-locked to:

`https://script.google.com/macros/s/AKfycbyAShO3c_FLVqp-fisabNx_DMuLD0UYMPygU22_jQfpLjIs796fgsJPo3viZq5FGeYd1A/exec`

It is designed for the validated v2 backend whose bot memory is stored in `FF_BOT_MEMORY`.

## Important: two bot modes

### 1. Native server bots (recommended for ordinary lobbies)
Use `lobby.fillBots`. `FerretFrenzy_v2.gs` owns these seats, their private information, deduction, memory, actions, chat, and voting. The browser must **not** try to drive the same seats.

### 2. Frontend guest bots
`FerretFrenzyBotManager` can create ordinary guest seats and run the frontend brains in this package. This is useful for frontend testing, bot-vs-bot harnesses, or a client-controlled bot mode. Each guest bot receives only the same `game.state`, chat, events, and private facts that an ordinary client is entitled to receive.

Never run both controllers for the same seat.

## Minimal frontend guest-bot example

```js
import {FerretFrenzyBotManager} from './js/ferret-frenzy-bot-manager.js';

const bots = new FerretFrenzyBotManager({
  mode: 'guest',
  code: '064073'
});

await bots.addGuestBot({displayName: 'Crumb'});
await bots.addGuestBot({displayName: 'Sock'});
bots.start();
```

## Native server-bot example

```js
import {FerretFrenzyBotManager} from './js/ferret-frenzy-bot-manager.js';

const bots = new FerretFrenzyBotManager({
  mode: 'server',
  code: '064073',
  hostGuestToken
});

await bots.fillServerBots(6);
```

## Tests

From the package root:

```bash
npm test
```

The test suite verifies the eight-role lock, 2,000 role lines, strict d6/d12 handling, claim contradictions, deduction, hostile voting, role actions, and runtime contamination checks.
