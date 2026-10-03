# Ferret Frenzy — Revision 3.1 Dossier Pass 3 Audit

## Scope

This pass reviewed the uploaded Revision 3 dossier and the current `FerretFrenzy_Revision3_Dossier_Pass2_2026-10-03.zip` game package. No backend source was supplied or changed, and this pass does not modify the game code. The package's existing automated test suite was run as-is and passed.

## Preserved non-negotiables

- Eight roles only: Bandit, Dooker, Itchy, Trouble, Business, Snuggler, Hunter, Guardian.
- d12 remains Burrow Hour; d6 remains limited to the defined activation/conversion/tiebreak mechanics.
- Fixed 24-card pool and three Hammock cards remain intact.
- Starting Role remains immutable and separate from Current Card, Current Allegiance, and player-bound history.
- Historical Raider remains the primary mystery and primary win target.
- Morning Business remains unverified shared testimony.
- Paw Point remains simultaneous and private, with tied eligible leaders all caught.
- No Sheriff/Mayor/leader/ninth role was added.
- The existing 6,000+ words per role and 20,000+ interaction requirement remain satisfied.

## Main Revision 3.1 additions

1. Added the previously missing **Part IV**, now titled `SYSTEM CONTRACTS, EDGE CASES, AND IMPLEMENTATION RECONCILIATION`.
2. Defined the **earliest-Bandit d6 tie procedure**: only tied earliest Bandits roll; a shared minimum rerolls only the still-tied minimum candidates until one unique lowest result exists.
3. Defined a **target-legality contract**: role targets and Paw Point exclude self, two-target actions require distinct players, and the backend must validate legality even if the UI already filters choices.
4. Defined **Current Card information visibility**: moved cards are not automatically re-revealed before Results; server-computed current-card-derived allegiance is not automatically player-known either.
5. Defined **Itchy clue delivery** when both Itchy wakes occur before the theft: generate after theft, deliver at Morning Business rather than creating an unauthorized extra wake.
6. Defined **Hunter second-wake conversion/mark timing**, including a conversion check on the second wake resolving before a possible loyal Hunt Mark in that same hour.
7. Defined **Guardian's zero-capture edge**: if protection removes the only positively voted target(s), Paw Point catches nobody rather than promoting a zero-vote player.
8. Defined exact **secondary resolution order**: Paw Point catch set → loyal Hunter Hunt Mark → Snuggle Bond result reveal → primary historical-Raider win check.
9. Strengthened **bot information parity**, including an explicit rule against using server-only Current Card/allegiance data that the equivalent human seat was never authorized to know.
10. Expanded reconnect, Results terminology, compatibility-normalizer, and deterministic QA expectations.

## Package observations

The current package already aligns strongly with Revision 3 behavior: role-neutral pre-deal seats, backend-authoritative deal, timestamp-aware Quick Role Claim parsing, Business single-result inspection normalization, stale Dooker Glimpse reasoning, Trouble conversion before swap, Snuggle Bond as result reveal rather than catch, Guardian protection as capture-eligibility removal, chat staying open through voting, and specialized role bots.

The full `npm test` suite passed, including bot self-test, simulation, frontend dossier checks, solo-bot flow, chat/vote/privacy, Revision 3 gameplay regression, and Revision 3 social-deduction regression.

## Follow-up implementation checks suggested by the new dossier

These are not proven backend defects because backend source was not part of this pass; they are places the next code pass should verify against Revision 3.1:

- Bot reasoning currently treats a raw `me.allegiance` field as actionable. If the backend supplies current-card-derived allegiance before Results when the human UI does not reveal it, the bot view should be filtered so bots do not gain extra hidden knowledge.
- The generic `js/voting.js` helper can accept any actor/target pair present in `eligibleIds`; the visible voting UI excludes self, but the authoritative backend should explicitly reject self-votes rather than relying on frontend filtering.
- `json/mechanics-catalog.json` and `json/protocol-events.json` still contain `dossier-r2-aligned` metadata strings. Behavior appears Revision 3-aligned, so these look like metadata drift rather than rules drift.

## Output

The revised full dossier is `Ferret_Frenzy_8_Role_Gameplay_Solidification_Dossier_v3_1_Pass3.txt`. It preserves the prior role deep dives and 28-pair interaction material and adds roughly 6,100 words of system-contract clarification, bringing the full dossier to roughly 103,000 words.
