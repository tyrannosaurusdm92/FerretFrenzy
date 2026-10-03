# Ferret Frenzy Solo + Bots live-failure fix — 2026-10-02

## Reproduced live failure

The deployed GitHub Pages build was tested through Lobby -> Solo + Bots -> Start Game. The first hard failure occurred while the host client attempted to create the first browser-owned v3 bot seat:

`Failed to execute 'fetch' on 'Window': Illegal Invocation`

The game then showed `OFFLINE · RETRYING` and remained in LOBBY.

## Root cause

`FerretFrenzyApi` captured `globalThis.fetch` and later invoked it as `this.fetchImpl(...)`. In browsers where `Window.fetch` is brand-checked, that changes the receiver from `Window` to the `FerretFrenzyApi` instance and throws before `guest.create` can reach the tested backend.

## Fix

The native global fetch is now bound to `globalThis` when the API instance is created. Explicitly injected/custom fetch implementations remain unchanged.

No backend file or backend behavior was changed.

## Cache

The service-worker cache key was bumped to `ferret-frenzy-v15-solo-bots-fetch-fix-20261002` so clients do not remain stuck on the broken API module after deployment.

## Regression coverage

`docs/test__solo-bots-browser-fetch-test.mjs` installs a receiver-sensitive browser-style fetch stub that deliberately throws the same Illegal Invocation error unless called with the global receiver. The test verifies that `FerretFrenzyApi.health()` now succeeds and still targets the locked tested backend URL.
