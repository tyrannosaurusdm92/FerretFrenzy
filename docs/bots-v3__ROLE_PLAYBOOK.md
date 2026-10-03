# Ferret Frenzy Role Playbook

The runtime is locked to exactly eight named roles.

| Role | Core bot objective |
| --- | --- |
| Bandit | Keep the historical Raider uncaught; coordinate only from privately known Bandit information; maintain a stable cover story. |
| Dooker | Use three wake windows, one timestamped binary current-allegiance Glimpse, and one Hammock peek/optional Trip; treat the Glimpse as potentially stale after later card movement. |
| Itchy | Use normal wake evidence plus the optional partial clue; never claim the clue proves which of the two candidates is Raider. |
| Trouble | Blind-swap two other positions; remember the positions; if converted during theft, protect the Raider without inventing card knowledge. |
| Business | Build the public timeline; when genuinely alone, inspect exactly one randomly selected wake result belonging to one chosen player and compare that single result to public claims. |
| Snuggler | Track the player-bound bond and its reveal consequence; do not treat the bond as a team scan. |
| Hunter | Track two wakes and conversion; loyal Hunter marks a suspect, converted Hunter does not use loyal Hunt logic. |
| Guardian | Track starting Hunter recognition and one vote protection; never receive or infer a hidden Hunter conversion flag as a fact. |

All role actions are selected through `ferret-frenzy-role-brain.js`, which rejects actions outside the starting role's legal action set.
