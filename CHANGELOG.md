# Changelog

All notable changes to Euterpe / FERRETT_STUDIO_OS are logged here, newest first.
Version numbers match `window.APP_VERSION` (js/00-bootstrap.js) and `CACHE_VERSION`
(service-worker.js) — the two are always bumped together so the PWA's service worker
actually picks up the new files instead of serving a stale cache.

## v167 — 2026-08-16
- **Swept the whole app for overclaims, not just the docs.** Same pattern as the AI-kit one: the
  code behaves honestly, the copy kept upgrading "checks and flags" into "guarantees".
- **Fixed a false privacy claim.** The device-name field said *"stored on this device only — it
  never syncs."* It does sync: renaming a device writes the name into `db.pluginProfiles`, which
  rides in your vault and therefore to Drive. It has to, or your other machines couldn't show the
  list picker by name — the guide's own description of that picker contradicted the claim. Now
  says what actually happens: the name travels in your own vault and goes nowhere else.
- **True peak is now described as approximate.** The metering panel advertised "true peak" flatly;
  the implementation's own comment says *"approximate: 4× oversample via the browser's native
  resampler… don't treat it as certified-exact."* The UI now matches the code. Loudness was
  checked and its claim stands — it's a genuine ITU-R BS.1770-4 implementation with K-weighting
  and 400 ms gated blocks, so that's stated explicitly rather than left vague.
- The plugin-coverage panel said the owned list is what the AI "is allowed to suggest". Same
  correction as the Cook Book: the AI is told to stick to it and the result is checked, with
  anything off it flagged as "not your gear".
- Verified as already honest and left alone: the SPL gauge ("estimated absolute SPL"), the
  "keys never committed" notices, and the `drive.file` scope wording.

## v166 — 2026-08-16
- **✍ AI MARKS in the Lyrics Lab.** A toggle that marks lines which came from the co-pilot and
  **haven't been edited since**. Editing a line clears its mark — a line you rewrote is your
  writing, which is both how the app treats it and how authorship actually works. FINALIZE shows
  the running count ("3 of 40 lines came from the AI co-pilot").
- Deliberately small. It's a personal record so you can answer "how much of this did I write?"
  months later, not a legal instrument — it's self-reported and proves nothing on its own. The
  panel says so, notes that the US Copyright Office asks for AI material to be disclosed and
  disclaimed *in general terms* rather than line-by-line, and states plainly that it isn't legal
  advice. No timestamps, no per-word attribution, no exportable "report" implying a rigour it
  doesn't have. Exports are untouched: no provenance markup reaches the `.LRC` or plain lyrics.
- **Audited sections 4–17 of the guide.** Verified as accurate: `drive.file`-only Drive scope,
  AES-GCM + PBKDF2 backups, ⌘/Ctrl+K search, 25 undo levels, seven Tools tabs, CSV marker export.
- Fixed the plugin starter-list count — the guide said "~191" in two places, it's **190**.
- **Corrected the biggest overclaim in the docs:** both the README and the guide said the AI Kit
  generator "only names plugins from your owned-plugins list". It doesn't *enforce* that — it
  constrains the prompt and then **checks the result**, flagging anything off-palette as "not your
  gear" with the offending names. That's a constraint plus a check, not a guarantee, and models do
  occasionally wander. Reworded in three places to describe what the code actually does.

## v165 — 2026-08-15
- **Audited section 3 of the guide for overclaims and found seven.** Two were mine, added earlier
  the same day: an invented "roughly 85% of the app still works" statistic with no basis behind
  it, and "entirely knowable" describing costs — two paragraphs above a warning that the cost
  figures are an unverified estimate. Both gone.
- Removed a stale cost paragraph that survived the earlier rewrite and contradicted its
  replacement: it named the wrong model ("Gemini Flash") and put a full FX chain at "twenty-odd
  cents", which no longer squared with the corrected ranking directly beneath it.
- Softened unsupported superlatives in the provider table. "Claude — strongest writing and
  reasoning" was an opinion presented as fact in a comparison table, and is now attributed as the
  author's preference. "Very fast" and "very cheap" became plain descriptions.
- Fixed a quoted UI string that didn't match the app: the masked-key placeholder uses a hyphen,
  not an em dash.
- **Corrected a 10× error in the cost guidance.** The guide said a Producer Notes write-up ran to
  "roughly a thousand characters" and that a full FX chain was "in the same ballpark". Both wrong:
  Producer Notes runs to around **ten thousand** characters and is the single most expensive call
  in the app (budgeted at 5,000 output tokens with a 90-second timeout), while an FX chain is
  roughly half that. Someone budgeting from the old figure would have been out by an order of
  magnitude on the one feature that costs the most.
- **The Accounting Ledger is now described honestly as an estimate.** The docs previously said
  its figures were *"actual figures, not estimates"* — that was an overclaim. The ledger derives
  spend from token counts rather than reading a provider's billing API, and the accounting code
  is AI-written and unverified. It's a good gauge of the *shape* of your spending and which
  features cost more; it is not a receipt. Corrected in the README, the guide (twice), and the
  honest bit.
- **The disclaimer now appears in the app itself**, directly under the ACCOUNTING LEDGER heading
  where the dollar figures are — that's where someone actually reads a number and decides to
  believe it, so a caveat that only lived in the docs was in the wrong place.
- Real-world cost guidance replaces the vaguer old wording: testing on **Gemini 3.6 Flash (High
  Reasoning)**, single runs rarely top **~$0.20** — plus the point that prompts, recipes,
  producer notes and lyrics all save, so a run you liked is paid for once and kept.
- **New: "Da fuq is Home Assistant → Groq?"** It sits at the top of the provider list and makes
  no sense to anyone who doesn't run Home Assistant. It's now explained as what it is — the
  author's own experimental setup, the product of a "could I / should I" decision that never got
  as far as the second question — with a clear "if you don't run HA, ignore this" up front.

## v164 — 2026-08-15 · public beta `v0.1.0-beta.1`
- **First tagged release.** Git tags now carry a SemVer release number
  (`v0.1.0-beta.1`) alongside the existing `vNNN` build counter in the tab title. They answer
  different questions — which release you're on, versus whether your browser has the newest files
  — so both stay. The README explains the split.
- **Companion repo cleaned for publication.** The Lua/Python scripts the app links as downloads
  carried absolute `/Users/<name>/` paths in four files: that leaked a username and meant none of
  them ran for anyone who downloaded one. They derive from `$HOME` now (or, for `auto_uvr.py`, from
  the launcher's own directory), so they keep working unchanged where they were written while being
  portable elsewhere.
- **Scripts that need setup now say so before you download them.** The five UVR/Fadr entries carry
  a `⚠ SETUP:` note in the Script DB — UVR5 via the `audio-separator` package in a virtualenv, or
  a Fadr key in `~/.fadr_api_key` — plus the fact that paths must be pointed at your own machine.
- The `scriptsRev` migration now also refreshes those descriptions on existing vaults, but **only
  where the stored text is still exactly the old default** (a strict prefix of the new one). A
  description you reworded is left alone — the note is worth delivering, not worth clobbering an
  edit for.
- Corrected a stale warning in the companion repo's catalog that claimed a live Fadr API key sat on
  line 2 of a script. It was moved out to `~/.fadr_api_key` some time ago; left uncorrected, it was
  a public file pointing readers at a key that isn't there.

## v163 — 2026-08-15
- **Removed a personal hostname from the shipped code.** `DEFAULT_HA_URL` was hardcoded to the
  author's own Home Assistant address, so every install carried a stranger's home endpoint
  pre-filled and anyone reading the source learned it. It now defaults to blank, and the setup
  placeholder is the generic `homeassistant.local:8123`. **Note:** the old value remains in this
  repo's git history — removing it here stops it shipping, it does not un-publish it.
- The Home Assistant CORS hint now prints **your** origin via `location.origin` instead of a
  hardcoded one, so it's correct in a fork or a local copy rather than only on the canonical host.
- **Docs brought up to date** with everything from v156–v162: the rig-driven Hardware tab, the
  split Tools & Intel tab, per-device plugin lists, Finalize, rest bars, and the synced `.LRC`
  export — including the export distinction that `.TXT`/📋 COPY are raw dumps that keep punch-up
  alternatives and rest dashes, while `.LRC`/plain lyrics are the finished article and drop both.

## v162 — 2026-08-15
- **✅ FINALIZE in the Lyrics Lab** — the deliberate "this is the song now" step. The sheet is a
  working surface, and the arrangement, the Lyria prompt and the .LRC all read the same lines, so a
  half-tidied sheet produced a quietly *wrong* arrangement rather than an error. Finalize runs eight
  checks and shows what it can tidy versus what needs a decision from you.
- **Fixed a real corruption this exposed: a leftover punch-up alternative splits the section it sits
  in.** `lyrInsertAltsAfterLine` adds alts with no tag, and `sectionsFromLines` treats an untagged
  line as breaking a run — so one ALT inside a verse turned it into "Verse 1: 1 bar" + "Verse 2:
  4 bars" and added a phantom bar to the timeline. After finalize the same sheet reads "Verse:
  4 bars". Every downstream timing was off by that bar.
- The checks: lyrics present · no punch-up alternatives left · no stray blank lines · rest bars
  written as `-` · every line belongs to a part · linked to a song · tempo set · intensities set on
  every part.
- **It never invents anything.** Tidy only removes what is unambiguously not part of the song
  (alternatives, blank lines) and normalises rest markers (`–`, `—` → `-`), then re-derives the
  arrangement. It will not write a lyric or pick a section tag — those stay as warnings. Accepting
  the default intensities is a separate opt-in button, because silently writing them in would turn
  "I haven't chosen yet" into "I chose this", which is exactly what the dimmed default in the
  arrangement row exists to show. One ↶ UNDO reverses the whole thing.
- **A lone `-` is now honoured everywhere as a rest bar.** It was already the documented convention
  for pasted songs and already counted toward bar totals, but v161's LRC would have emitted it as
  the literal lyric "-". Now it holds its bar in the timing, contributes no lyric to the .LRC or the
  plain export, and shows a **REST** badge on the row — so what you see on screen is what gets
  exported.

## v161 — 2026-08-15
- **⏱ SYNCED / LRC export in the Lyrics Lab.** Copies your sheet as a `.LRC` — `[mm:ss.xx]` per
  line, the format Musixmatch and every karaoke player read, and the route Spotify's lyrics
  actually come through. Also copies **plain lyrics** (words only, no timestamps, no section tags,
  no chords) for an unsynced submission, and downloads a `.lrc` file.
- **The timings are derived, and the panel says so.** No timestamps are recorded anywhere in the
  app — nothing knows where a line lands in the audio. Times are computed from tempo using the
  same one-bar-per-line convention the arrangement sync already uses (two bars for a half-time
  line), from an adjustable start offset. BPM prefills from the linked song. Beats-per-bar is
  adjustable for non-4/4. It's a head start to nudge in a sync tool, not a finished sync, and the
  panel is explicit about that rather than implying the numbers are authoritative.
- Empty lines are treated as instrumental bars: they advance the clock but emit no lyric line.
  Punch-up alternatives (`.alt`) are left out entirely and don't consume a bar — in an LRC they'd
  read as duplicated lines. (The older .TXT and 📋 COPY paths still include them; unchanged here.)

## v160 — 2026-08-15
- **Fixed: the patchbay diagram couldn't be scrolled on a phone.** The canvas carried
  `touch-action: none` so that dragging a device worked — but that also switches off native
  panning, so on mobile you were stuck looking at the top-left corner of a 1200×800 diagram with
  no way to reach the rest of your gear. `touch-action` moved onto the device boxes themselves:
  the canvas pans, and only a box swallows the gesture. Dragging boxes still works.
- **Fixed: tapping 🧰 Tools on mobile closed the nav drawer.** The drawer closes on any `.nav-btn`
  click, and Tools carries that class — but it only expands a submenu, so the submenu opened
  behind the backdrop and you had to reopen the drawer to reach anything in it. It stays open now;
  buttons that actually navigate somewhere still close it as before.
- **The script arsenal moved out of Hardware and into Tools & Intel.** It was buried at the bottom
  of the routing tab, behind the whole signal-flow diagram — nowhere near where you'd look for a
  tool. The Intel tab is now split into **🔗 Web Links** and **📜 Scripts**, each with a live count,
  segmented rather than stacked because both lists run to dozens of cards. Your last-used half is
  remembered. The Scripts view links out to the `ferrett-audio-tools` repo the files actually
  live in.

## v159 — 2026-08-14
- **The Script DB heading counts itself.** It was hardcoded to "THE 28 FILE ARSENAL" and had
  drifted — there are 68 scripts. A number written into markup is a number that goes stale, so
  `renderScripts()` fills it in now and it can never disagree with the list under it again.
- **Scripts added to the defaults now actually reach an existing vault.** `db.scripts` is saved
  data, and the seed only applied when the key was completely missing — so any script added to
  `defaultScripts` after your first run would only ever show up on a fresh install. Same trap
  `paletteRev` already solves for the plugin palette, so this uses the same pattern: `scriptsRev`
  unions in anything whose URL isn't already present. Matched on URL rather than title or id,
  because that's the stable identity. Deletions still stick — the union only re-runs when the rev
  is bumped, so a script you deliberately removed stays removed.
- `scriptsRev` rides along through local load, Drive sync, JSON import and vault restore, like
  every other saved bucket.

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
