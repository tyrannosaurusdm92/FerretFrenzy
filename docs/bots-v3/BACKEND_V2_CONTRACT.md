# Backend v2 Contract

The frontend brain does not replace or fork the Apps Script backend. It consumes the validated v2 API.

## Locked deployment

`https://script.google.com/macros/s/AKfycbyAShO3c_FLVqp-fisabNx_DMuLD0UYMPygU22_jQfpLjIs796fgsJPo3viZq5FGeYd1A/exec`

Expected backend identity: `ferretfrenzy`.

## Bot-facing actions

Frontend guest bots use only:

- `guest.create`
- `guest.resume`
- `lobby.join`
- `lobby.ready`
- `lobby.get`
- `game.state`
- `game.roll`
- `game.action`
- `chat.list`
- `chat.send`
- `vote.cast`
- `events.poll`

Host mode may additionally use `lobby.fillBots` and `game.start`.

## Privacy boundary

The frontend brain reasons from `state.me` private information plus public participant/chat data. It must never consume another participant's raw d6/d12, hidden role state, hidden conversion status, or private facts before Results.

The v2 backend keeps starting role, current card, allegiance, Raider status, Trouble accomplice status, Hunter conversion, bond, protection, and Hunt Mark as separate fields. The frontend does not collapse them into a single role variable.

## Server bot memory

Native `lobby.fillBots` seats are controlled by the v2 Apps Script brain and persist game-local reasoning in `FF_BOT_MEMORY`. The frontend package must not impersonate or double-drive those seats.
