# Ferret Frenzy Narrator

A static Ferret Frenzy narration companion adapted from the uploaded voice-studio package. It is focused on gameplay narration and one consistent narrator voice.

## Included

- One responsive narrator screen and one consistent, feminine, high-register browser speech voice with a light, quick cadence.
- Read-only polling of the existing Ferret Frenzy backend for each connected human player's own game state.
- Private prompts for setup rolls and role actions, including card interference, plus a headphones confirmation gate for private speech.
- Shared narration for phase changes and public results. Hidden roles, turns, facts, votes, and action outcomes are never included in shared narration.
- Explicit manual pause, repeat, refresh, and disconnect controls.

## Run

Open `index.html` from a static web host, or serve this folder locally. Connect with the same game code/ID and signed `guestToken` used by that player's Ferret Frenzy session. Each human seat needs its own connection to receive that seat's private prompts. In a group, enable shared audio on one device only. Confirm headphones before enabling private speech.

The narrator calls only `events.poll` and `game.state` on the supplied existing backend. It never calls game mutation actions and does not modify or deploy backend code. If browser CORS policy prevents the read, host the page alongside the existing frontend/API access setup; no backend change is included here.

## Privacy behavior

Private prompts and private facts are read only from the backend response for the connected guest token. The app does not save the token in browser storage. Shared announcements are phase-level and use only public round state. Private lines are displayed locally and spoken only after the headphones box is checked. A browser cannot verify the connected output device, so shared speaker use during private turns remains a physical privacy decision.
