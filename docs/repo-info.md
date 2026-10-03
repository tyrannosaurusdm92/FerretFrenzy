# Ferret Frenzy Lobby — Repository / Source Notes

## Drop-in package

This folder contains the lobby-only replacement files requested for Ferret Frenzy. `lobby.html` is intended to live in the project root. Its only lobby code dependencies in this package are `css/lobby.css` and `js/lobby.js`.

The lobby expects these already-existing Ferret Frenzy parent-project assets and game file:

- `assets/images/frenzy_logo.png`
- `assets/images/icon-192.png`
- `assets/images/icon-512.png`
- `assets/images/apple-touch-icon.png`
- `assets/audio/ferret_dancing.mp3`
- `assets/code/frenzy.html`

Backend endpoint used by the lobby:

`https://script.google.com/macros/s/AKfycbyAShO3c_FLVqp-fisabNx_DMuLD0UYMPygU22_jQfpLjIs796fgsJPo3viZq5FGeYd1A/exec`

The lobby uses the backend actions already represented in the supplied Ferret Frenzy JavaScript: `guest.create`, `guest.resume`, `lobby.public`, `lobby.create`, and `lobby.join`.

## Among Us-style lobby references

Two supplied source archives were reviewed as interaction/layout references:

- `among_us_clone-master(1).zip` — "Among Us Clone"; its README describes a scalable Among Us clone and links to `NikitaShkaruba/among_us_clone`.
- `Among-Us-clone-main(1).zip` — unofficial Python/Pygame Among Us clone; its supplied LICENSE is the Unlicense / public-domain dedication.

This Ferret Frenzy lobby does **not** ship Among Us art, sprites, maps, or ripped assets. The reference use is limited to broad multiplayer-lobby ideas such as prominent Host / Public / Private choices, room-code entry, public-room browsing, and a compact game-console presentation. The visual identity in this package is Ferret Frenzy + northern lights.

## Dice Maiden repository information

Supplied archive: `DiceMaiden-master (1).zip`

- Project: **Dice Maiden**
- Repository: https://github.com/Humblemonk/DiceMaiden
- Description in supplied README: Discord dice bot for TTRPG sessions.
- License in supplied archive: **Apache License 2.0** (`LICENSE`).
- Supplied README notes that the Ruby version is in maintenance mode and points future feature development to the Rust rewrite: https://github.com/Humblemonk/dicemaiden-rs
- The supplied repository includes Ruby source under `src/`, tests, Docker/self-hosting material, docs, and the main `dice_maiden.rb` entry point.

Dice Maiden code is not imported by this lobby runtime. This information is retained in the Ferret Frenzy package documentation because Dice Maiden was one of the source repositories used elsewhere in the Ferret Frenzy dice/game work.

## Dice Witch repository information

Supplied archive: `dice-witch-master (3).zip`

- Project: **Dice Witch**
- Repository: https://github.com/cnharrison/dice-witch
- Description in supplied README: visual Discord dice roller intended to simulate the experience of rolling physical dice and display the dice visually.
- License in supplied archive: **MIT License**, copyright 2026 Dice Witch contributors.
- The supplied repository is a modern monorepo containing Cloudflare Worker/Durable Object code, a frontend application, shared packages, deterministic roll-domain/render-model code, tests, and deployment tooling.

Dice Witch code is not imported by this lobby runtime. This information is retained in the Ferret Frenzy package documentation because Dice Witch was one of the source repositories used elsewhere in the Ferret Frenzy dice/game work.

## PWA behavior in this pass

`manifest.webmanifest` was revised for the Ferret Frenzy lobby and the new Download App control. `service-worker.js` now precaches only lobby-critical known paths and uses resilient per-file caching so a missing optional file does not fail service-worker installation. Other same-origin assets are cached opportunistically as the rest of Ferret Frenzy is used.

## Bots v3 / locked Minnow hitbox / Night Lock pass

- No Google Apps Script backend file is included or changed. The tested deployment remains authoritative for the real hidden Starting Card deal and theft state.
- The live backend path no longer reserves roles in the browser. Empty seats are created as ready anonymous guest bots, the tested backend performs the real hidden role deal, and each managed seat then loads the matching Ferret Frenzy Bots v3 specialist from its own private `game.state.startingRole`.
- `json/minnow-hitbox.geojson` is the locked, user-approved polygon around the Minnow Treats on the 1672×941 pre-theft image. `js/minnow-hitbox.js` places it over the exact contained image area at any viewport size.
- The hotspot is armed only for the starting Bandit who is the authoritative Raider, during that Raider's Night wake hour. Clicking the Minnow Treats switches that client immediately to `Minnow Treats crime scene-2.png`. Later awake players whose private observation begins with Treat State MISSING also see the post-theft scene.
- During Night, a client whose private backend action prompt is `SLEEP` receives a black Night Lock **inside the game viewport**. The surrounding shell and HUD stay visible, including the live Burrow Hour countdown. Gameplay controls are inert while asleep.
- Sleep audio can layer `ferret_sound.mp3` as a quiet chitter cue when the authoritative/sanitized frontend state or event stream exposes Bandit/Raider/accomplice activity. In Solo + Bots, the host can also derive the cue from the private state of locally managed bots it already controls; no identities or hidden cards are shown to the sleeping player.

## Full frontend gameplay pass (2026-10-02)

- Backend remains the tested Google Apps Script deployment; no `.gs` replacement is bundled.
- GitHub Pages POST requests use `text/plain;charset=UTF-8` so Apps Script receives the JSON body without requiring a CORS preflight.
- The backend `actionPrompt` is now the source of truth for required dice and private actions.
- PREP uses private role-card reveal plus the exact d6/d12 sequence required by the backend.
- NIGHT uses 12 backend Burrow Hours, each 60 seconds. The host frontend calls `game.advance` when the current hour expires and waits if actions are pending.
- Card art is now used for role reveal, private card view, lobby/player backs, Hammock choices, action targets, Paw Point targets, and final results.
- Sleeping clients have the scene covered by Night Lock (black + Ferret Frenzy logo), but the Ferret Frenzy shell/HUD and Burrow Clock remain visible.


## Social deduction / chat / voting reference pass (2026-10-02)

The two supplied Among Us clone repositories were reviewed again specifically for social-deduction flow. No Among Us art or ripped assets were copied into Ferret Frenzy.

- `NikitaShkaruba/among_us_clone`: used as a reference for clearly separated lobby / role reveal / play phases and host-gated phase transitions.
- Supplied Python/Pygame `Among-Us-clone-main`: used as a reference for its meeting progression (meeting alert → chat → vote), one checked vote choice, and keeping discussion/vote as a focused temporary game state. Its supplied code is Unlicense/public-domain, but Ferret Frenzy uses its own HTML/CSS/JS implementation and existing backend API.
- Ferret Frenzy now presents Morning Business as a visible three-step strip: Discuss → Paw Point → Result. Chat stays visible when voting opens, message metadata is clearer, duplicate sends are guarded, the input has a live 500-character counter, and Paw Point choices show a selected check with a final lock action.
- Vote authority is unchanged: the existing backend `vote.begin` / `vote.cast` actions still decide and resolve votes. No backend code was changed.
