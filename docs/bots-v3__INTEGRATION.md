# Frontend Integration

## Load order

Use ES modules. The simplest entry point is `js/ferret-frenzy-bot-manager.js`.

For a single already-authenticated guest seat, import the role roster and construct the bot matching `state.me.startingRole`.

```js
import {createRoleBot} from './js/ferret-frenzy-bot-roster.js';
import {FerretFrenzyApi} from './js/ferret-frenzy-api.js';

const api = new FerretFrenzyApi();
const state = await api.gameState(guestToken, code);
const bot = createRoleBot(state.me.startingRole, {api, guestToken, code});
await bot.run();
```

## Do not assign a role client-side

Role identity comes from `game.state`. The frontend picks the matching specialized brain after the backend deals the role.

## Dice UI integration

The brain does not generate authoritative random faces locally. When `actionPrompt.kind === "ROLL"`, it validates that the prompt is exactly d6 or d12 and calls `game.roll`. A 3D dice renderer can animate the returned private result, but the final face comes from the backend.

This preserves the Dice Witch-style separation between authoritative outcome and presentation, while the strict prompt validation/reroll discipline reflects the supplied Dice Maiden reference.

## Chat integration

The bot reads `chat.list`, remembers unseen messages, parses claims, and speaks only in Morning Business/Vote. The response libraries contain 250 role lines each, but the engine can also generate direct answers from current state.

## Server bots vs frontend bots

If the lobby uses `lobby.fillBots`, let `FerretFrenzy_v2.gs` control them. Use frontend guest bots only when you intentionally create normal guest seats for the browser brain to drive.
