# Changelog

All notable changes to Euterpe / FERRETT_STUDIO_OS are logged here, newest first.
Version numbers match `window.APP_VERSION` (js/00-bootstrap.js) and `CACHE_VERSION`
(service-worker.js) — the two are always bumped together so the PWA's service worker
actually picks up the new files instead of serving a stale cache.

## v140 — 2026-07-30
- Producer Notes generation: raised the target from a hard 300-500 words to up to ~2,000 words
  (~10,000 characters, confirmed as Flow's actual Instructions field ceiling) — the AI is told to
  write as much genuine, non-repetitive detail as the genre's recipe book supports rather than
  padding to hit a count. Also fixed a silent truncation risk on the Home Assistant AI path, which
  defaults to a 1500-token cap (~1100 words) when no ceiling is requested — now explicitly asks
  for 4000 tokens of headroom so a longer document doesn't get cut off mid-sentence.

## v139 — 2026-07-30
- Lyria Prompt Generator and Producer Notes: the output box in both is now editable, and edits
  autosave into the currently loaded saved take/version ~0.7s after you stop typing — no more
  needing to hit SAVE and type a name for every small tweak. SAVE still creates a brand-new named
  take when nothing is loaded (e.g. right after GENERATE); loading a take, or saving a fresh one,
  points further edits at it until you GENERATE again or open the modal fresh.

## v138 — 2026-07-30
- Lyria Prompt Generator: saving a prompt no longer requires a song attached. With no
  song picked, saved takes now fall back to a per-genre bucket (`window.db.lyriaPrompts[genre]`),
  same pattern as Producer Notes and Kit history — so instrumental ideas with no lyrics
  yet have somewhere to save, and are browsable/scrollable the same way. The genre card's
  🎼 LYRIA PROMPT button now shows a saved-count badge, and the saved-list panel label
  switches between "FOR THIS SONG" and "FOR THIS GENRE" depending on what's attached.

## v137
- Cache version bump.
