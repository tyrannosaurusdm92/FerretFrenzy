FERRET FRENZY LOBBY / MECHANICS PACKAGE

Purpose
- lobby.html is the lobby entry.
- assets/code/frenzy.html is the Ferret Frenzy Northern Lights game shell launched by the lobby.
- Game shell code is split into js/frenzy-shell.js, js/dice.js, js/frenzy-game.js and matching CSS files.
- The single dice sound is assets/audio/dice-roll.mp3.
- No account system is required. Device identity is stored locally by the lobby.
- No Windows batch files, executables, or app-packager files are included.

Game controls follow the October 2026 eight-role d6/d12 dossier:
- joystick: navigate; deliberate flick rolls the selected die
- /1/: d6 action/chance die
- /2/: d12 wake-hour die
- /3/: quick confirm/lock latest roll
- /4/: private role/wake/Treat State/co-waker/facts panel
- A: confirm/select
- B: back/close/cancel before lock
- X: context-sensitive role action
- Y: private notebook/reminders
- Z/R: reserved

Local testing
Serve the package from a local static web server. lobby.html uses ES modules, and many browsers block those under file://.

Backend integration
Set window.FF_BACKEND_URL before js/app.js loads, or save ff:backend:url in localStorage. The BackendTransport expects the routes in BACKEND_CONTRACT.json. Cross-device room codes/public matchmaking require the backend.
