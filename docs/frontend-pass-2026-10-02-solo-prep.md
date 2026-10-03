# Ferret Frenzy frontend pass — solo bots, pre-game card/setup, simplified controls

This pass is frontend-only. The supplied Apps Script `.gs` file was inspected only as the existing API/rules contract and was not modified or packaged. The configured backend endpoint is unchanged.

## Changes

- Added **SOLO + BOTS** to the lobby. It creates a private four-seat target with bots and auto-fill enabled, so one human can play against three role bots.
- Renamed the frontend PREP presentation to **PRE-GAME SETUP**. `game.start` remains the existing backend call that deals the authoritative cards and enters PREP; the frontend now clearly treats Night/Hour 1 as the actual timed-game start.
- The human's actual dealt starting-role card is shown first and must be acknowledged before setup roll/action controls are enabled.
- Required PREP rolls remain backend-authoritative: Itchy d6 first when applicable, then the required d12 wake rolls; Dooker gets three unique d12s, Hunter two, activated Itchy two, others one; Bandit Raider d6 ties remain conditional. Night-only Hunter conversion d6 remains during the appropriate Burrow Hour.
- Removed unused physical controller buttons **/3/**, **/4/**, **Y**, **Z**, and **R**. Remaining physical controls are **/1/** d6, **/2/** d12, **A** confirm/select, **B** back/cancel, **X** role action, plus joystick navigation/flick-to-roll. Private Info and Notebook remain accessible from HUD/menu controls.
- Re-arranged A/B/X into a compact three-button triangle and enlarged/centered the two numbered die buttons.
- Card art remains visible wherever rules allow it: private role reveal/dock, private role/final-card panels, Dooker Hammock reveal, results; hidden player/Hammock choices and Paw Point targets use card backs so hidden roles are not leaked.
- Preserved all four audio tracks, the 12 x 60-second Night (12 minutes total), six-digit friend codes, install/PWA wiring, reconnect/polling, bot chat/voting/actions, and existing backend URL.
