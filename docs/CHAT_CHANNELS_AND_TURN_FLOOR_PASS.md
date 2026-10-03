# Ferret Frenzy — Chat Channels + Turn Floor Pass

## Public channel model
This pass adds Discord-inspired channel navigation without changing the deduction rules or adding secret faction communication. `#burrow`, `#evidence`, `#claims`, and `#paw-point` are public views over the same authoritative `chat.send` / `chat.list` stream. `#narrator` is public and reserved for narrator-authored announcements.

Messages are tagged in-band with a small frontend marker so no backend deployment is required. Older untagged messages remain compatible and appear in `#burrow`.

## Turn-floor model
The Zoom clone material was used as an interaction reference for a clear binary mute/unmute control. Ferret Frenzy translates that meeting-control pattern into turn-based text discussion rather than audio/video: the host can enable Turn Mode, everyone is text-muted, players **Raise Paw**, the host grants **Next Turn**, and the current speaker **Ends Turn**.

The queue and floor state are represented through reserved system messages carried by the existing shared chat transport. This makes the state visible to all updated clients without adding a backend endpoint. Narrator messages may still post while Turn Mode is active so phase instructions are not blocked.

## Privacy
No new hidden channel exists. Private role prompts, dice, conversions, scans, marks, protection, votes, and other authorized facts remain outside public chat. The narrator can speak private information locally only when the user enables the headphone gate; private lines cannot use narrator chat.

## Pass 8 correction
Lobby chat is writable before roles are dealt. The turn queue now validates host grants against raised paws, rejects non-host state changes, and is only shown as active during Morning Business or Paw Point. It disables typing in the supplied clients; server-side chat permission enforcement would require a backend change.
