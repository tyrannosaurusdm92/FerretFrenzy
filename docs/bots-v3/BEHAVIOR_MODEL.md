# Bot Behavior Model

## Decision layers

1. **Authoritative state** — accepts backend state as truth.
2. **Dice coordinator** — accepts only a required d6 or d12 prompt, commits one authoritative roll, then resynchronizes before any retry.
3. **Memory** — stores this bot's own observations/actions plus public conversation and claims.
4. **Claim parser** — extracts claimed role, wake hours, Treat State, co-wakers, suspicion, trust, and Paw Point intent.
5. **Deduction** — scores contradictions and evidence without converting a deduction into a fact.
6. **Role brain** — chooses only actions legal for the bot's actual starting role.
7. **Conversation** — answers direct questions, states facts/claims, asks for useful information, and explains suspicion in Ferret Frenzy terms.
8. **Vote** — locks one Paw Point target through the backend.

## Evidence discipline

Hard evidence is weighted above medium evidence, and medium evidence above social pressure. A Dooker Glimpse can strongly move a score. A public accusation only adds low-confidence frameability/pressure.

The frontend never treats silence, tone, or popularity as proof. Other players' suspicion can make someone easier to question or frame, but it does not become an authoritative role reveal.

## Hostile-side deception

A Bandit or converted ally keeps a persistent cover story for the round. The cover story prefers mostly true information and changes at most a limited detail such as a claimed hour, Treat State, or omitted co-waker. Starting Bandits claim a non-Bandit role; converted Trouble/Hunter can keep their truthful starting-role claim while hiding allegiance change.

The vote brain protects privately known Bandit-side allies. It then prefers a non-ally whose **public** contradictions or pressure make the accusation defensible, rather than selecting a random innocent.

## Role-aware behavior

- **Bandit**: protects Raider/known Bandits, maintains one cover story, frames with public evidence.
- **Dooker**: Glimpses the strongest unresolved suspect; avoids injecting a known Bandit Hammock card when Business-aligned; may Trip a safe Hammock card onto a suspect.
- **Itchy**: uses only partial/timing clues; never upgrades the two-name clue to an exact identity.
- **Trouble**: remembers exactly which positions were blind-swapped; converted Trouble conceals allegiance while retaining truthful swap knowledge.
- **Business**: uses solo inspection to verify or falsify public wake claims.
- **Snuggler**: treats the bond as relationship evidence rather than alignment proof.
- **Hunter**: recognizes Guardian as starting trust; loyal Hunter marks a suspect outside that anchor; converted Hunter protects the Bandit side.
- **Guardian**: recognizes starting Hunter but never assumes Hunter stayed loyal; protection prefers a trusted target without reading conversion state it was not granted.
