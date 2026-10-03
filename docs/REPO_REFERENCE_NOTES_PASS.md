# Repository reference notes — channels and turn controls

The uploaded Discord clone repositories were inspected for channel-list interaction patterns: category headings, hash-prefixed text channels, selected-channel state, and a channel-specific message view. The implementation in this Ferret Frenzy pass is original vanilla JavaScript/CSS and does not import React, Next.js, Firebase, Prisma, Socket.IO, LiveKit, or other repo dependencies.

One especially direct UI reference was the `diaslilian/discord-clone` study project contained in the supplied archive, whose ChannelList/ChannelButton components demonstrate a compact text-channel category and selected channel button. Other supplied Discord clones were reviewed for channel routing and message-list concepts.

The uploaded Zoom clone repositories were inspected for meeting-control state changes. The supplied Zeus project contains a simple mute toggle that flips an enabled state and changes the control label/icon. Ferret Frenzy adapts that state-machine idea, not its WebRTC stack: Turn Mode acts as discussion mute, Raise Paw acts as raise-hand/request-to-speak, Next Turn grants the floor, and End Turn yields it.

No Zoom or Discord backend/service dependencies are added. The existing tested Ferret Frenzy Apps Script endpoint remains the only multiplayer backend.
