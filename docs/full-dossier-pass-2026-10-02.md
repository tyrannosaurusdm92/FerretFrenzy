# Ferret Frenzy — Full Dossier Frontend Pass

This package is a frontend-only alignment pass against the October 2026 eight-role d6/d12 dossier. The tested Apps Script backend is not included and was not changed.

## What is aligned

- Exactly eight displayed role types: Bandit, Dooker, Itchy, Trouble, Business, Snuggler, Hunter, Guardian.
- Phone-readable role cards include role name, ferret variety, icon, one-line power summary, wake-dice count, team/status context, action-die note, and expandable full rules.
- Live role dealing is backend-authoritative and random. The browser does not reserve a role for a human or bot seat.
- The active-set model uses one card per occupied seat plus three Hammock cards. Starting Role and Current Card are treated as different facts.
- Bots v3 fill empty target seats when enabled and support solo play. A bot loads its specialist brain only after the backend returns that bot's starting role.
- During sleep, the black/logo Night Lock is contained inside the game viewport. The outer shell/HUD and Burrow Clock remain visible. Ferret chitter can layer during hostile-side activity without identifying who is active.
- The Minnow Treats click target is loaded from `json/minnow-hitbox.geojson`. An eligible Raider can click that overlay to trigger the immediate pre-crime → post-crime visual transition.
- `/1/` selects d6, `/2/` selects d12, and a deliberate joystick flick commits the required roll. The visual die follows the backend-approved result.
- Private teamwork and card-tampering facts are separated from guesses. Dooker/ Trouble card movement does not overwrite Starting Role history or player-bound Raider/conversion/bond statuses.
- Morning Business leads to a single locked Paw Point vote. The UI explains that tied eligible top vote-getters are caught together; the backend remains authoritative for Guardian protection and secondary resolution.
- The lobby contains a full How to Play dialog. The game HUD/menu contains a shorter Quick How to Play guide.
- Result UI can show a client-authorized Trail of Trouble summary of visible card movement/status history without inventing hidden facts.

## Backend boundary

The package references the existing tested Google Apps Script endpoint through the existing frontend config. No `.gs` file is included, generated, or modified.
