# Changelog

All notable changes to Euterpe / FERRETT_STUDIO_OS are logged here, newest first.
Version numbers match `window.APP_VERSION` (js/00-bootstrap.js) and `CACHE_VERSION`
(service-worker.js) — the two are always bumped together so the PWA's service worker
actually picks up the new files instead of serving a stale cache.

## v158 — 2026-08-14
- **Syllable counting rewritten.** It wasn't randomly off — it was wrong in whole predictable
  categories, and every category is now handled:
  - `-es` after a sibilant is its own beat. **boxes, wishes, faces, kisses, changes, judges,
    places, voices** were all counted 1 instead of 2. This was the single biggest source of
    undercounting in ordinary lyrics.
  - `-ed` is only silent after most consonants — after **t** or **d** it's a beat of its own.
    **wanted, needed, started, faded, painted, decided** were all short by one.
  - Vowel runs were being chopped into arbitrary pairs by a `[aeiouy]{1,2}` match, so
    **beautiful** and **everything** counted 4 instead of 3.
  - Silent `e` is handled properly: **make** and **smile** lose it, **table**, **little** and
    **purple** keep their beat, and **lonely / lovely / movement / careful** drop the one buried
    before the suffix.
  - Vowel pairs that genuinely split are counted — **radio, liar, obvious, material, video,
    usual** — while the ones that don't are left alone: **nation, million, opinion, special,
    delicious, gorgeous**.
  - `qu` no longer counts its `u` as a vowel, and a leading `y` is treated as the consonant it is.
  - A small exceptions list covers irregulars no rule reaches (**idea, science, quiet, people,
    every, rhythm, choir, evening**). It's a patch list, not a dictionary.
- Measured against 383 words: **74% → 100%**. On a held-out set written afterwards and never used
  for tuning, **91% → 98%**. It will still miss occasionally — English syllable counting has no
  exact rule-based answer without a pronunciation dictionary — but it is no longer wrong in
  categories you can predict.
- **The two counters now share one implementation.** The Lyrics Lab's per-line count and the
  Toolbox bar counter each carried their own copy of the same heuristic and could disagree with
  each other. Both call `window.countSyllables` in `js/01-core-utils.js` now.
- **Fixed: typing in a line with a chord on it overwrote the chord.** The live syllable update
  looked for `span.font-mono` inside the row — which also matches a chord chip, and chips come
  first in the DOM. So editing a chorded line replaced the chord name with the syllable count.
  The badge has its own `.lyr-syl` class now. This one predated the chord feature and had been
  silently eating chords since v148.

## v157 — 2026-08-14
- **The Hardware tab describes your rig now, not the one this app was built on.** The signal-flow
  panel used to be hand-written markup naming one specific interface, receiver, speakers and four
  sets of headphones — nobody else's gear could ever appear there. It is now **derived from the
  patchbay graph**, which was already yours to edit. Draw your rig, and the paths, the path-recall
  presets, the input list, the safety rules and the monitor modes all follow.
  - One model, not two. The patchbay was already a devices-and-connections description of a rig;
    the panel underneath was a second, hardcoded description of the same thing, with no way to keep
    the two in step. That duplication is gone.
  - Devices gained **what it is** (source / interface / outboard / amp / monitors / speakers),
    **settings to keep**, **notes** and a **warning**; connections gained a **cable**, a **port
    label**, notes and their own warning. All optional — a patchbay drawn before this still renders.
  - Signal paths are traced automatically: every route from a device nothing feeds into, down to one
    that feeds nothing. Cable labels are drawn on the diagram, warnings turn a cable red, and each
    device box is tinted by what it is.
- **The A/B monitor rotation and the pre-export checklist name your monitors.** Both were fixed
  lists of the original owner's gear. They now read whichever devices the rig actually monitors
  through, and a monitor's own notes become its "what am I listening for" line on the checklist.
- Everything on the tab is editable in place — ✎ on a device or cable, and + INPUT / + RULE / + MODE
  for the lists — through one shared editor rather than a modal per thing.
- Tapping a cable used to delete it instantly with no confirmation; one stray tap and the connection
  was gone. It opens the editor now, with DELETE one click inside.
- Existing rigs are migrated, not reset: devices are matched to the shipped rig by name to recover
  their kind and notes, and the inputs / safety rules / monitor modes are restored to anyone still
  substantially on that rig — so nobody who drew their own gear gets handed safety rules about an
  amp they have never owned.
- The tab ships seeded with the original rig as a **clearly-labelled example** rather than a blank
  slate, with a banner saying so that disappears once you make the rig your own.

## v156 — 2026-08-14
- **Fixed: ✎ EDIT LIST in Vault Storage appeared to do nothing.** The button was firing the whole
  time. `#vault-modal` was the one modal in the app without `overflow-y-auto`, so opening the
  owned-plugins editor grew the card well past the bottom of the viewport with no way to scroll to
  it — the textarea, the scan-command panel and the SAVE / MERGE / EMPTY BOX / CANCEL row all lived
  off-screen. The modal now scrolls like every other one, and the card has bottom padding so it
  isn't flush against the edge.
- Opening the editor now scrolls itself into view instead of relying on `.focus()`, which only
  scrolls the nearest scrollable ancestor and therefore did nothing while the modal had none. The
  focus call is `preventScroll` so it doesn't fight that animation.

(v151–v155 shipped without changelog entries.)

## v150 — 2026-08-03
- Chords are now **positioned over the word the change lands on**, not listed above the line. Each
  chord is a draggable chip anchored to a character in the lyric, stored as `line.marks` = `[{c,p}]`.
  - **Manual workflow:** click anywhere in a line's chord lane to drop a chord on that word, drag a
    chip to slide it along the line, click a chip to rename it, rename it to blank to delete it.
    Every one of those is a single ↶ UNDO step.
  - v148's plain chord strings migrate automatically the first time a line renders — the old chords
    spread across that line's word starts, ready to be dragged into exact position. The original
    string is kept untouched so REVERT can restore it.
  - `.TXT` export and PRINT space-pad the chord row to the same columns as the words underneath, so
    the alignment you dragged into place is what a printed chord sheet shows.
- **🎹 CHORDS** now returns per-line placements instead of one progression per section. The model
  returns each lyric line with inline `[Chord]` markers before the word the change happens on, which
  are parsed into positions. If it reworded a line, the offsets would be stale — so its copy is
  compared against the real line and, when they differ, each chord is re-anchored to the nearest word
  start in *your* text (the panel reports how many lines were re-anchored). The real lyric is always
  kept; the model's version is only ever used to work out where the chords go.
- Applying is reversible three ways: one ↶ UNDO covers the whole application, **↺ REVERT** restores the
  exact chords the sheet had before, and **＋ AS NEW VERSION** copies the sheet first and chords the
  copy, leaving a finished song untouched.
- Fixed two bugs found while building this. Canvas text measurement was silently falling back to
  `10px sans-serif`, because `getComputedStyle().font` is empty in Chrome and rebuilding the shorthand
  from longhands includes `font-variant: none`, which is invalid there — every chord offset was
  measured in the wrong font. And chip layout ran inside `requestAnimationFrame`, which never fires
  while a tab is backgrounded, leaving chords stacked at x=0 until something forced a re-render;
  layout is canvas-based and needs no paint, so it now runs synchronously with follow-ups for late
  web-font swaps.

## v149 — 2026-08-03
- **🎹 CHORDS** in the AI Co-Pilot suggests a progression matched to the song rather than pulled out of
  the air. It reads the lyrics already on the sheet **section by section** — the actual words — plus the
  chosen genre (its character description and typical tempo), the mood, the topic, and an optional
  **KEY** field. The model is told to give sections different harmonic jobs (a verse that cycles, a
  pre-chorus that builds, a chorus that lifts and resolves, a bridge that leaves the tonic), to reuse a
  progression when a section repeats the way a real song does, and to let the words drive the colour.
  Each suggestion comes back with a one-line reason naming what in the mood or lyrics led there.
- Suggestions are reviewed before anything is written: a per-section list with the chosen key, then
  APPLY TO SHEET / COPY / DISCARD. Applying writes each progression onto the first line of its section
  and switches the chord row on; if any line already has chords it asks first. Sections are matched
  back by id, so an out-of-order or partial reply can never write a chorus progression onto a verse.
- The lyric/chord separation from v148 still holds in the direction that matters: this is the only
  action that writes chords, and the lyric-writing paths (generation, CONTINUE, PUNCH UP) still never
  see or emit them.

## v148 — 2026-08-03
- Chord annotations in the Lyrics Lab. Each line can carry a plain hand-typed chord string above it
  (`Bb  C#m  Am  E7`) — nothing is parsed or validated, whatever you type is what shows. A **CHORDS**
  checkbox next to SYLLABLES toggles the chord row on and off and remembers the setting between
  sessions. Chords live on the line itself, so they ride along through cut-up shuffles and
  drag-reorders; a line whose chords are hidden shows a small ♪ so it never looks empty when it isn't.
  `.TXT` export and PRINT always include chords when a line has them, regardless of the toggle —
  print puts them on their own monospace line above the lyric, the usual chord-sheet layout.
- The AI is deliberately unaware of chords: `lyrGetActiveText` / `lyrGetActiveTextPlain` (the only
  lyric text the co-pilot ever receives) omit the field entirely, so generation, CONTINUE and PUNCH UP
  stay strictly about words and can never rewrite or invent a chord.

## v147 — 2026-08-03
- Lyrics Lab AI Co-Pilot rebuilt around **whole songs** instead of 8 lines at a time.
  - New **🎵 WRITE FULL SONG** writes every section of a real structure in one pass, with `[Section]`
    headers. Ten song forms (Modern Pop, Hip-Hop/Rap, Verse-Chorus Rock, Ballad, AABA, EDM/Dance,
    Simple V/C, plus Auto, Match-the-linked-song, and Custom). "Auto" picks the form from the genre's
    own Cookbook category; "Match this sheet's linked song" writes to that song's real arrangement and
    bar counts; "Custom" takes a `Name Bars` list. A live preview shows the resolved sections and total
    line count before you spend a call. Repeated sections are told to reuse their first version's words
    verbatim, the way an actual chorus does.
  - The generator now reads the **genre Cookbook** like every other AI tool in the app — its `mood`,
    its `vox` (vocal style) and its description. Previously this was the *only* AI feature writing from
    a hardcoded 6-item style list with no access to any of that. **Topic** and **Mood** are now separate
    fields (mood defaults to the genre's own), plus a **Perspective** picker.
  - The old ✨ GENERATE is now **✨ ONE SECTION**, with its own section-tag and line-count controls.
- Full CRUD on generated lyrics. AI output no longer drops straight into your sheet — it lands in an
  editable **draft box** with INSERT INTO SHEET / ＋ AS NEW SHEET / COPY / SAVE TAKE / DISCARD. Inserting
  converts `[Section]` headers into per-line tags, so the arrangement rebuilds itself. **Saved takes**
  live per sheet with LOAD / COPY / DELETE and autosave-on-edit into the loaded take — same pattern as
  Lyria Prompts and Producer Notes. CONTINUE routes through the draft box too, so a continuation you
  don't like costs one DISCARD instead of hunting down pasted lines.

## v146 — 2026-08-01
- Replaced the placeholder "F" app icon/favicon (a leftover generic letter mark, never updated after
  the app was renamed to Euterpe) with a real mark pulled from the actual splash artwork: the "E" from
  the neon EUTERPE wordmark, isolated and re-composited onto a clean black field. Tried the full
  wordmark first, but at realistic home-screen icon sizes (40-60px) seven thin neon letters packed
  into one icon just blur into mush — a single bold letterform reads correctly at every size while
  staying authentically pulled from the same artwork (same font, glow, and color). Regenerated
  `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, and `apple-touch-icon.png` — same
  filenames, so no manifest.json or index.html changes needed. Also fixed a real pre-existing bug in
  `icon-maskable-512.png`: it had a transparent margin around a pre-rounded shape, which is wrong for
  a maskable icon (the OS applies its own mask/rounding to a full-bleed image) and would have shown
  odd gaps once actually installed as a PWA. All four icons are now full-bleed, opaque, no transparency.

## v145 — 2026-07-31
- Ear-Fatigue / Break Timer is now a persisted, global timer instead of a bare in-memory countdown
  owned by the Toolbox panel. It used to reset on every reload and give no signal outside that one
  panel when it hit zero; now it's time-based (survives reloads, backgrounding, and tab switches)
  and, when it fires, interrupts regardless of which app tab is open: an audible chime, a full-screen
  "TIME FOR AN EAR BREAK" overlay with SNOOZE 5 / GOT IT, a flashing browser-tab title, and — only
  when the tab isn't even focused — a real OS notification.
- Added a live "BREAK mm:ss" countdown to the header, next to a widened SEARCH bar, so the time
  remaining is visible from anywhere in the app; clicking it jumps straight to the Toolbox panel.
- Every AI-generation surface now shows the same "still working" progress bar Producer Notes got in
  v144 — the Lyria Prompt Generator, all four Lyrics Lab AI Co-Pilot actions (Generate/Continue/Punch
  Up/Titles, replacing the old plain "thinking…" spinner), and all four Toolbox AI Studio Brain tools
  (Ask/Chords/Reimagine Recipe/Mix Fixes). Pulled the bar/label logic out into one shared
  `window.startAiProgress()` helper (also used to rebuild Producer Notes' own bar) instead of
  duplicating the same setInterval/paint code at every call site — each surface just supplies its own
  verb ("Writing the Lyria prompt", "Punching up 2 lines", "Reimagining the recipe", etc.) so two
  different AI features never read as the same thing.

## v144 — 2026-07-31
- Producer Notes generation was silently falling back to the offline draft on every single
  Gemini call after the v143 length target increase. Not a model capability limit — the
  `ferrettAI` client aborts any call after a flat 45s by default, and a ~3,000-word document
  routinely takes longer than that to finish writing, so the fetch got cut off mid-stream and
  read as a failure every time. Same problem the AI Kit's chain-sheet generation already hit and
  fixed; Producer Notes now gets the same 90s timeout.
- Producer Notes generation now shows a progress bar + elapsed-time label while it writes. The
  call isn't streamed, so it's a time-based estimate against the 90s budget above rather than
  real token progress, but it's enough to tell "still working on a big document" apart from
  "frozen" during the 60-70s a fully-detailed write-up can take. Wording deliberately calls it
  a "document", never a "recipe" — the AI Kit's chain-sheet build already has its own real,
  step-counted progress bar ("Building the {genre} kit… N / M instrument roles") for the actual
  per-instrument recipes; these are two different things producing two different outputs.

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
