# Ferret Frenzy — Chat / Voting / Role Claim Pass

- Morning Business and Paw Point use an idempotent chat-open path; polling no longer toggles the discussion panel closed.
- Social-phase private role actions no longer auto-open over a player while they are typing. Press X when ready; after the private action, the client returns to the active discussion.
- Added a Quick Role Claim builder with all eight roles and role-appropriate player dropdowns populated from current human/bot display names. Claims are public statements and intentionally are not validated against the hidden role, preserving bluffing.
- Bot role-specific chat is gated until the bot deliberately volunteers a public role claim (or the role is publicly revealed). A direct question cannot force a hidden-role disclosure.
- Backend contract and Apps Script endpoint are unchanged.
