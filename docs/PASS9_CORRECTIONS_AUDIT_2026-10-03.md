# Ferret Frenzy — Pass 9 Corrections Audit

## Rules authority

The uploaded Revision 3.0 dossier is retained in the game package. Pass 8 also contains the later Revision 3.3 dossier and its clarifications; live game help and gameplay tests continue to follow Revision 3.3. This pass did not replace that authority or discard earlier game content.

## Corrections

- Turn Floor replay now identifies the host when the backend provides `game.hostParticipantId`, a host participant flag, or only the connected player's private `me.isHost` flag. The host controls and replay rules now agree on the same identity.
- Paw Point candidates, private role-action targets, and Quick Role Claim target lists compare participant IDs by their string form. A numeric ID and the same ID serialized as a string no longer cause a player's own seat to appear as a target or make a selected target lose its selected state.
- Overlapping `chat.list` requests are ordered by request sequence. A slower old response can no longer replace newer chat.
- Failed or ignored chat sends restore the submitted text when the composer is still empty, so the player does not lose their message draft.
- The package version advances to 3.10.0 and the service-worker cache key advances for the client changes.

## Preserved boundaries

- The existing tested Apps Script backend is unchanged and no backend source is included.
- Turn Floor remains a shared client-side courtesy control because the existing chat API has no server-side authorization for it.
- The eight roles, d6/d12 mechanics, card art, audio, bots, narrator, mobile layout, lobby, dossiers, and existing tests are retained.

## Validation

- The complete package test command passes all 13 tests, including added checks for host fallback, mixed-type player IDs, and stale chat refresh handling.
- JavaScript/JSON syntax and package references are checked before delivery.
- The attached Pass 8 ZIP is the preservation baseline; the manifest records every baseline path as unchanged or intentionally modified and includes no missing files.
