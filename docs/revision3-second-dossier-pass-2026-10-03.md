# Ferret Frenzy — Revision 3.0 Second Dossier Pass (2026-10-03)

Authority: `Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3.txt`.

This pass re-audits social-deduction correctness after the first Revision 3 implementation pass.

## Corrections

- Quick Role Claim wording and bot-volunteered role-claim wording are recognized by the same bot claim parser.
- Starting Role and Current Card public claims are stored independently; Current Card claims never impose Starting-Role wake-count/action rules or overwrite a valid Starting Role claim.
- Claim memory stores Treat State by Burrow Hour, including a witnessed PRESENT→MISSING same-window transition, when timestamped, so a legal PRESENT-then-MISSING timeline is not mislabeled as a contradiction.
- Legal multi-wake roles may disclose additional distinct wake hours up to their role maximum without false contradiction flags. One-wake role changes remain contradiction evidence.
- Loyal Itchy bot voting is constrained to a valid two-name historical-Raider clue pair.
- Guardian bot protection no longer auto-protects the starting Hunter; stale trust is treated as historical evidence only.
- Converted Hunter bot logic refuses Hunt Mark.
- Hostile bot Paw Point logic absolutely excludes a known historical Raider, while allowing non-Raider Bandit sacrifice when public pressure makes distancing strategically useful.
- Local lobby fallback role reservations were removed; joining a seat never assigns/previews a role.
- Quick Role Claim now supports optional role-claim scope, wake hour(s), Treat State, co-waker, Dooker Glimpse hour/result, Itchy activation, and the existing role-specific player target selectors.
- Itchy no-decoy wording now follows Revision 3: mark the clue degraded rather than silently treating one name as a normal pair.
- Lobby How to Play, HUD Quick How to Play, README, package manifest, and bot integration notes were updated to match these semantics.

Backend endpoint and backend source remain unchanged. No `.gs` file is included.
