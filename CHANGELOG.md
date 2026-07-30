# Changelog

All notable changes to Euterpe / FERRETT_STUDIO_OS are logged here, newest first.
Version numbers match `window.APP_VERSION` (js/00-bootstrap.js) and `CACHE_VERSION`
(service-worker.js) — the two are always bumped together so the PWA's service worker
actually picks up the new files instead of serving a stale cache.

## v138 — 2026-07-30
- Lyria Prompt Generator: saving a prompt no longer requires a song attached. With no
  song picked, saved takes now fall back to a per-genre bucket (`window.db.lyriaPrompts[genre]`),
  same pattern as Producer Notes and Kit history — so instrumental ideas with no lyrics
  yet have somewhere to save, and are browsable/scrollable the same way. The genre card's
  🎼 LYRIA PROMPT button now shows a saved-count badge, and the saved-list panel label
  switches between "FOR THIS SONG" and "FOR THIS GENRE" depending on what's attached.

## v137
- Cache version bump.
