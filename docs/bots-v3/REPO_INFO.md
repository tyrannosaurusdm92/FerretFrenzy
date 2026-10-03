# Repository Research and Provenance

The finished runtime is purpose-built for Ferret Frenzy. The supplied repositories were reviewed for architecture and behavior patterns; this package does not vendor their complete runtimes.

## Dice Witch (`dice-witch-master (3).zip`)

Supplied snapshot: Dice Witch, MIT license, copyright 2026 Dice Witch contributors.

Useful patterns carried forward:

- authoritative dice result separated from 3D presentation motion;
- validated roll-response boundaries;
- roll lifecycle/idempotency thinking;
- graceful renderer/network fallback concepts.

Ferret Frenzy adaptation: `ferret-frenzy-dice-brain.js` never decides a face itself. It validates d6/d12 prompts, submits the roll to Ferret Frenzy, and resynchronizes state before retrying an ambiguous network failure.

## Dice Maiden (`DiceMaiden-master (1).zip`)

Repository identified by the supplied README as `Humblemonk/DiceMaiden`. Supplied license: Apache License 2.0.

Useful patterns carried forward:

- strict dice request validation;
- bounded reroll/retry processing;
- keeping roll parsing/mechanics separate from response/chat logic.

Ferret Frenzy adaptation: no free-form notation is accepted. The game brain accepts only the backend-required d6 or d12.

## Python/Pygame Among Us clone (`Among-Us-clone-main(1).zip`)

The supplied snapshot includes an Unlicense/public-domain dedication.

Useful patterns carried forward:

- meeting/discussion and voting as distinct states;
- per-player vote state;
- a vote becomes locked rather than changing repeatedly;
- multiplayer player state is synchronized through the server.

Ferret Frenzy adaptation: Morning Business remains separate from simultaneous Paw Point resolution, and each bot submits only one locked `vote.cast`.

## Scalable Unity Among Us clone (`among_us_clone-master.zip`)

The README identifies `NikitaShkaruba/among_us_clone`. The supplied snapshot does not contain a populated top-level license file, so it was used as **reference only**.

Useful patterns carried forward:

- server-authoritative state;
- client snapshots and resynchronization;
- hidden-state ownership kept out of arbitrary client logic.

No source from this snapshot was copied into the Ferret Frenzy runtime.

## LifeHelpers GameBots (`GameBots.zip`)

User-supplied framework with 26 bot modules and a local runtime.

Useful patterns carried forward:

- persistent per-bot session state;
- observation -> utility/strategy -> action separation;
- cooldown-driven local loops;
- local brains continue without an unrelated generic strategy service;
- reusable targeting helpers while keeping game-specific adapters strict.

Ferret Frenzy does **not** import the generic LifeHelpers runtime at run time. These bots are intentionally locked to one game.

## Ferret Frenzy sources

- `Ferret_Frenzy_8_Role_d6_d12_Revised_Dossier.txt` is the authoritative game-design reference.
- `FerretFrenzy_v2 (1).gs` is the validated backend contract used for integration review. It is not included as a replacement backend in this bot package.
- `FerretFrenzy_Solidified_Role_Bots_NoBackend.zip` supplied the previous eight role response libraries and earlier frontend bot pass, which v3 expands.
