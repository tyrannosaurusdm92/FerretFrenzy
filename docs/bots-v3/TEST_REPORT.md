# Test Report — Ferret Frenzy Bots v3

## Source audit completed

Reviewed the supplied:

- `FerretFrenzy_v2 (1).gs`
- `FerretFrenzy_Solidified_Role_Bots_NoBackend.zip`
- `Ferret_Frenzy_8_Role_d6_d12_Revised_Dossier.txt`
- `dice-witch-master (3).zip`
- `DiceMaiden-master (1).zip`
- `Among-Us-clone-main(1).zip`
- `among_us_clone-master.zip`
- `GameBots.zip`

## Runtime checks

`node --check` passed for every `js/*.js` file and both test files.

`npm test` passed:

- exactly 8 Ferret Frenzy roles;
- exactly 250 response lines per role;
- 2,000 role response lines total;
- exact tested backend URL lock;
- only d6 and d12 accepted;
- three deliberate public-claim contradiction types detected;
- evidence ranking selected the expected suspect;
- Bandit-side vote avoided a privately known Raider/ally;
- role brain rejected an action belonging to another role;
- 250 randomized hostile-side vote simulations never targeted the known ally/own seat;
- Dooker hard Glimpse evidence outranked softer evidence;
- Guardian recognition stayed a starting-trust fact rather than omniscient conversion knowledge.

## Contamination check

Runtime `js/` and `json/` were scanned for names/mechanics from unrelated games and the supplied research implementations. No runtime references to those other games remained. Repository names appear only in `docs/` where provenance belongs.

## Backend compatibility

The frontend contract was checked against the supplied validated `FerretFrenzy_v2 (1).gs` action dispatcher and public/private state shapes. The user's Apps Script test run in this conversation already passed all eight v2 backend tests, including bot memory, claim contradiction parsing, deduction, role brain, action targeting, and Paw Point voting.
