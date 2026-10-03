# Ferret Frenzy — Resizable Menu Accessibility Pass — 2026-10-03

This pass preserves the supplied Pass 10 game and borrows the Savanski Art Studio menu accessibility pattern for Ferret Frenzy.

## Implemented

- Added eight resize zones to every in-game `.panel`: north, south, east, west, and four corners.
- Added the same resizing behavior to the lobby **How to Play** dialog.
- Resizing automatically scales menu text, buttons, form controls, spacing, cards, and common content geometry within readability limits.
- Narrow user-sized panels reflow multi-column content to one column, including Discussion, Narrator, Quick Help, Private Info, and other menu grids.
- Discussion channels switch to a horizontal scroll strip when the Discussion window is narrowed.
- Resize handles are keyboard-focusable: Arrow keys resize, Shift+Arrow uses larger steps, and Home restores the default size.
- Double-clicking any resize handle restores the default size.
- Dragging a menu header repositions a manually sized menu while keeping it inside the viewport.
- The Accessibility panel now explains the resizable-menu controls.
- No gameplay rules, narrator/chat semantics, role logic, backend endpoint, or transport code were changed.

## Files

- `css/menu-resize-accessibility.css`
- `js/menu-resize-accessibility.js`
- `assets/code/frenzy.html`
- `lobby.html`
- `service-worker.js`
- `json/package-manifest.json`
