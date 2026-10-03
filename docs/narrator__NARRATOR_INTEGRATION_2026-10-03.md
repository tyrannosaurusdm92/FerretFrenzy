# Ferret Frenzy integrated narrator pass

The uploaded Ferret Frenzy Narrator companion has been integrated directly into the existing Pass 5 game shell. The separate narrator login/token form is intentionally not used inside the game. The narrator reuses the already authenticated Ferret Frenzy player session exposed by the existing frontend network layer.

## Integrated behavior

- A **Narrator** toolbar button opens the narrator panel inside `assets/code/frenzy.html`.
- Shared phase narration is available through the device speech engine.
- Private role prompts and newly delivered private facts are displayed locally and can be spoken only after the player confirms private headphones.
- The narrator never submits dice rolls, role actions, protection, marks, swaps, votes, or other gameplay decisions.
- The host seat owns shared narrator chat posting to prevent every connected player from producing duplicate narrator messages.
- New shared lobby, Morning Business, Paw Point, and Results announcements can post automatically to the existing shared chat.
- The host may also type a manual public narrator line in the narrator panel.
- Private instructions and private facts never use the narrator chat pathway.

## Chat representation

No backend narrator account was added. Shared narrator text uses the existing tested `chat.send` action from the current host session with the reserved frontend tag `[[FF_NARRATOR_V1]]`. Updated clients strip the reserved tag, display the sender as **Ferret Frenzy Narrator**, and render a dedicated narrator message style. Ordinary chat submission rejects the reserved tag.

This preserves the user's tested Apps Script backend unchanged while allowing the narrator to participate in public game chat.

## Files

- `js/narrator.js` — integrated narration, voice, privacy guard, host narrator chat, deduplication.
- `css/narrator.css` — narrator HUD/panel and narrator chat styling.
- `json/narrator-config.json` — integration contract and privacy settings.
- `docs/narrator/NARRATION_DESIGN_AND_RESEARCH.md` — research/design document carried forward from the uploaded narrator package.
- `docs/test__narrator-integration-test.mjs` — static integration/privacy regression coverage in the flattened package.

## Backend boundary

The existing Apps Script endpoint remains unchanged. Narrator state is read from the already-authorized `window.FFNetwork.getState()` view. Public narrator chat goes through the already-supported `chat.send` action. There is no new `.gs` file and no backend deployment requirement.
