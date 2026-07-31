# Changelog

All notable changes to Euterpe / FERRETT_STUDIO_OS are logged here, newest first.
Version numbers match `window.APP_VERSION` (js/00-bootstrap.js) and `CACHE_VERSION`
(service-worker.js) — the two are always bumped together so the PWA's service worker
actually picks up the new files instead of serving a stale cache.

## v143 — 2026-07-31
- Added a new METAL genre, "Industrial Dream State" (female-fronted post-hardcore / alt-metal /
  screamo with industrial rock production) — built from a producer-supplied breakdown of the
  sound's vocal dynamics, guitar/bass/drum character, and thematic core.
- Producer Notes generation: the system prompt was telling the model to target "800-2,000 words"
  right next to a "don't pad" warning, which anchored output low — it was landing around 6k
  characters despite the 10k ceiling raised in v140. Reframed the target as a floor
  to write toward (2,200-3,200 words / 9,000-10,000+ characters) with explicit permission to run
  past 10k when the genre's recipe book supports it. Also raised the generation's max_tokens
  headroom while staying under Groq's free-tier 8000 TPM cap (prompt + completion together).

## v142 — 2026-07-30
- Moved the Test-Tone & Noise Lab (SINE/WHITE/PINK/SWEEP) from the Toolbox's Monitoring & Room panel
  onto the Settings tab, right under the SPL gauge and CAL button. Fixes a real regression: since the
  SPL gauge moved out of the always-visible sidebar into its own Settings tab, calibrating meant
  playing pink noise in the Toolbox, then switching to Settings to read the gauge — but `leaveTab()`
  stops the test tone on every tab switch that isn't 'toolbox', so the noise cut out the instant you
  left to go check the meter. Now both live on one screen; no tab switch needed to calibrate. The
  Monitoring & Room panel's remaining Ear-Fatigue Timer card drops to a single column so it doesn't
  leave an empty gap where the Noise Lab used to sit.
- Lyria Prompt Generator and Producer Notes AI system prompts: fixed a real word-association bleed
  where a "warm" TEXTURE (audio warmth — tape/tube saturation, EQ tilt) pulled sunny/daylight
  imagery like "sun-soaked skies" into a song whose actual MOOD was night/dark/wintry, contradicting
  the intended vibe. Added an explicit rule distinguishing the two: tonal words in MOOD ("warm
  summer night, top down") describe a real scene and should be taken literally, while the same
  words in TEXTURE ("warm acoustic guitar") describe sound color only and must never invent or
  override the scene MOOD actually calls for.

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
