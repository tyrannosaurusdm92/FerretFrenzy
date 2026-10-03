# Pass 10 — How to Play menu update

Date: 2026-10-03
Rules authority: Ferret Frenzy Revision 3.3

## Changes

- Replaced the lobby How to Play content with the supplied intro and complete player-facing rules: objective, player-count card recipes, state distinctions, all eight roles, dice, twelve Burrow Hours, evidence, Morning Business, Paw Point, result order, and controls.
- Rewrote the in-game Quick How to Play panel as a shorter companion guide with the same role facts and win-resolution order.
- Improved help text sizing for readability and made the recipe table horizontally scrollable on narrow screens.
- Advanced the package version to 3.11.0 and the service-worker cache to v25 so installed clients receive the new guide.

## Preservation and verification

- The complete Pass 9 package was used as the baseline; no existing files were removed, and no backend source was added or changed.
- The 13 existing automated test suites pass, including the role, card movement, privacy, bot, voting, and result-order checks.
- The final ZIP is checked with a clean extraction and archive integrity check.
