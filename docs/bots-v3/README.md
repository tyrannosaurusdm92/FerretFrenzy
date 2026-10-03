# Ferret Frenzy Solidified Bots v3

This package is a **Ferret Frenzy-only** frontend bot brain for the validated `FerretFrenzy_v2.gs` backend.

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
- Paw Point target selection that protects known Bandit-side allies and prefers a publicly plausible frame target.
- Server-bot and frontend-guest-bot integration modes.
- Repository provenance, license notes, backend contract, integration guide, and tests under `docs/` and `tests/`.

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
