# Ferret Frenzy Narrator: narration design and research

## Product shape

The studio is now a game narrator. It chooses one feminine-sounding English system voice when the device exposes one, then uses a bright high register (speech pitch 1.48) and a light, quick cadence. It derives each line from the live Ferret Frenzy phase and the connected player's own `me.actionPrompt` / `me.privateFacts` response. It does not synthesize role personalities or let users design characters. It is deliberately a read-only companion: all rolls, role choices, card movements, voting, and phase advancement remain in the existing game.

## What the reference games contribute

- **One Night / Ultimate Werewolf and Ultimate Alien:** the companion app automates night narration from the selected roles and provides a day timer. The published Bezier product page links separate role narration and a complete wake-order list. We adopt phase-driven, role-aware prompts and an ordered round flow, but source actions from Ferret Frenzy's authoritative private prompt rather than inventing a second role schedule.
- **Werewolf Narrator:** its official how-to describes calling only relevant scenes in order and warns narrators against identifying who is waking or letting timing differences reveal which roles acted. Its app guide also recommends checking that everyone is ready before moving to a scene. We adopt neutral shared Burrow Hour calls, stable line timing per state change, and no public role/action disclosures.
- **Cheese Thief Moderator:** the official app is a voice moderator: select the active character set, continue through voice instructions, pause or return when needed, and follow the players' private dice-timed wake windows. The central design lesson for Ferret Frenzy is that the narrator should be a controllable sequence of short prompts, not a role-playing character. We adopt speech, pause, repeat, and game-state-driven timing.

## Privacy partition

Each connected human seat supplies its own signed guest token. The backend scopes `events.poll` and `game.state` to that guest and returns that guest's private prompt/facts. The narrator uses:

- **Shared audio:** phase names, Burrow Hour number, public Morning Business / Paw Point cues, and results returned for the RESULTS phase.
- **Private audio/display:** the connected player's action directions and only that player's private facts. Private speech is disabled until the user confirms headphones. The narrator never speaks private data through the shared-announcement path.
- **No narration:** another player's private role, roll, wake schedule, card choice, vote, hidden bot facts, or guilt inference. Bots act inside the backend; the narrator does not fabricate their hidden choices.

When multiple humans play, each uses their own guest token/session. One device should speak shared announcements; personal devices can speak only their own private instructions. Browser APIs do not confirm whether audio output is actually private.

## Ferret Frenzy rule mapping

Narration is driven by the uploaded 8-role dossier and backend action prompts:

| Backend condition | Narrator cue |
|---|---|
| PREP roll prompt | d6 Itchy activation, d12 Burrow Hour, or d6 Raider tie break, privately |
| PREP Snuggler action | Bond two different other players, privately |
| NIGHT Hunter conversion roll | d6 on a starting-Bandit overlap; 1–2 converts, privately |
| NIGHT Dooker Glimpse | choose one target or pass; keep result private |
| NIGHT Dooker Hammock peek / Trip | inspect one Hammock card, then optionally swap it, privately |
| NIGHT Trouble action | blind swap of two other players' Current Cards |
| NIGHT lone Business action | inspect exactly one player's wake result or pass |
| NIGHT Hunter mark | choose a target while loyal |
| VOTE Guardian action | protect one other player before vote capture |
| VOTE | private Paw Point; simultaneous lock and tied top eligible catches |
| MORNING / RESULTS | shared discussion cue / public winner and catches |

Starting Role prompts come from the backend. Current Card movement does not transfer role actions. Narration avoids translating a prompt into an action result until the relevant private fact exists for the connected player.

## Current backend contract used

The supplied backend exposes `game.state` and `events.poll`. `events.poll` returns a state for the guest token plus public/system events and only private events targeted to that guest. The companion uses these reads, and does not call `game.roll`, `game.action`, `game.advance`, `vote.cast`, or any other mutation action. The submitted backend source was not edited or deployed.

## Research sources

- Bezier Games, *One Night Ultimate Werewolf*: https://beziergames.com/collections/all-games/products/one-night-ultimate-werewolf?mobile-app=true
- Bezier Games, *One Night App*: https://apps.apple.com/us/app/one-night/id728175611
- Werewolf Narrator, *Description of the Game*: https://werewolf-app.com/description-of-the-game/
- Werewolf Narrator, *Playing with the App*: https://werewolf-app.com/playing-with-the-app/
- LaudoStudio, *Cheese Thief Moderator*: https://laudostudio.de/en/cheese-thief/
- Google Play, *Cheese Thief Moderator*: https://play.google.com/store/apps/details?id=de.LaudoStudio.CheeseThief
- Bezier Games, *One Night Ultimate Alien Rules* (secondary rules transcription consulted for its app-driven role sequence): https://www.ultraboardgames.com/one-night-ultimate-alien/game-rules.php

Research statements above are paraphrases of app descriptions, official game/product pages, and the supplied Ferret Frenzy source files; the narrator's specific role mapping follows Ferret Frenzy's own backend and dossier rather than copying another game's role scripts.
