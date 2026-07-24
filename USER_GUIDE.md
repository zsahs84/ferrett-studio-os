# FERRETT_STUDIO_OS — User Guide

A single-file studio companion for bedroom hip-hop/music production — a HUD-styled reference book, gear log, songwriting workbench, and DAW cheat sheet in one page. It runs entirely in the browser (no backend, no build step), installs as a PWA for offline use, and syncs across devices via Google Drive.

This guide covers every tab and feature as of the current build. The version number is shown top-left in the header (`DUAL DAW WORKSPACE vNN`) and bumps automatically whenever the app changes.

---

## Contents

1. [Getting started](#getting-started)
2. [The header bar (global controls)](#the-header-bar-global-controls)
3. [Beat & Vox Cookbook](#beat--vox-cookbook)
4. [Top Guitar/Bass Presets](#top-guitarbass-presets)
5. [Hardware, Routing & Logic](#hardware-routing--logic)
6. [Web Tools & Intel](#web-tools--intel)
7. [Channel Settings (Track DB)](#channel-settings-track-db)
8. [Tone DB](#tone-db)
9. [Toolbox](#toolbox)
10. [The Song Board system](#the-song-board-system-the-hub) — Song Board, Arrangement Timeline, Lyrics, Tracks & Tones, all tied together
11. [Lyrics Lab // Cut-Up Engine](#lyrics-lab--cut-up-engine)
12. [Notes Vault](#notes-vault)
13. [AI features & setup](#ai-features--setup)
14. [Data, sync & backup](#data-sync--backup)
15. [Keyboard shortcuts](#keyboard-shortcuts)

---

## Getting started

- **No install required** — it's a static page. Open it in a browser and it works. Install it as a PWA (browser's "Add to Home Screen" / install-app prompt) to get offline access and an app icon.
- **Everything saves locally first.** Every edit writes to the browser's local storage instantly. Nothing is lost if you're offline.
- **Google Drive sync is optional but recommended** if you use the app on more than one device (e.g. Mac in the studio + phone on the go). Click the red comms icon top-right to authenticate; once connected it debounce-saves to a single JSON file in your Drive (`FERRETT_OS_VAULT.json`) a couple of seconds after each change.
- **REAPER / BOTH / LUNA toggle** (top right) — if you switch between DAWs, this filters gear notes, chains, and templates written for one DAW vs. the other. "BOTH" shows everything.

---

## The header bar (global controls)

Always visible at the top, regardless of which tab you're on:

| Control | What it does |
|---|---|
| **SEARCH** (⌘/Ctrl K) | Universal search across recipes, tones, tracks, links, scripts — jumps straight to a result. |
| **?** | Opens the keyboard shortcuts list. |
| **FOCUS** | "Now Playing" — log what you're currently working on; shows as a small persistent banner. |
| **🔑 Color key** | Shows what each HUD color means across the app (tags, statuses, DAW badges). |
| **⇩ Import** | Import a shared tone/recipe payload (a JSON blob someone sent you, or an exported pack). |
| **🧩 Gear index** | Reverse-lookup: type a piece of gear and see every recipe, tone, and track config that references it. |
| **LIVE / quiet toggle** | Turns the ambient HUD animations (scanlines, pulsing dots) on or off. Doesn't affect functionality — purely visual, useful on low-power devices. |
| **🎨 Theme cycle** | Cycles the HUD's accent color scheme. |
| **Drive icon** (red = disconnected, green = synced) | Click to authenticate Google Drive. Shows sync status; click again any time to force a sync. |
| **VAULT** | Full JSON export of everything — your complete local backup file. |
| **BACKUP / RESTORE** | Manual backup-to-file and restore-from-file, independent of Drive. |
| **REAPER / BOTH / LUNA** | Filters DAW-specific content throughout the app. |
| **REC / timecode** | Session timer — click the dot to pause/resume, click ⟲ to reset. Feeds Session Starter and Studio Analytics. |

---

## Beat & Vox Cookbook

The home tab. A structured recipe book: **Genre/Vibe → Instrument → a full signal-chain "recipe"** (plugin order, settings, notes, reference links). 11 genres ship built-in with ~37 recipes.

- **Pick a vibe, then an instrument** from the two-column selector to read that recipe.
- **+ ADD RECIPE** — write your own signal chain for any genre/instrument pairing.
- **🧬 BLEND GENRES** — fuses two genres' recipes into a hybrid suggestion for inspiration.
- **🎲 SURPRISE ME** — random genre + instrument combo, good for breaking writer's block.
- **🧟 FRANKENSTEIN** — stitches components from *different* recipes into one composite chain.
- **📦 IMPORT PACK** — merges a recipe-pack JSON file (someone else's exported recipes) into your cookbook.
- Each recipe keeps **version history** (last 3 edits) — restore an older version without losing your current one (it just becomes the newest history entry).
- **Top Starred Tones** section at the bottom mirrors whatever you've pinned in Tone DB.

## Top Guitar/Bass Presets

Quick-reference presets for guitar and bass tones, separate from the full Tone DB — the "grab and go" shortlist.

## Hardware, Routing & Logic

Your physical rig, documented once so you stop re-deriving it:

- **Patchbay / Routing Diagram** — a visual signal-routing map of your actual hardware (built around a Volt 176 interface by default, but freely editable). Save a **default rig** so the app can flag when your current patchbay drawing drifts from your normal setup.
- Signal chain documentation, gain-staging notes, and routing logic for your interface, preamps, and outboard gear.

## Web Tools & Intel

A curated links shelf — plugin manuals, sample packs, tutorials, forums — organized and taggable, so you're not re-Googling the same resources every session.

## Channel Settings (Track DB)

**This is for saving FX chains/plugin configurations per instrument — not for songs.** (Song Board, covered below, is where actual songs live — this distinction matters and the two are intentionally kept separate.)

- **+ ADD CONFIG** — save a channel's plugin chain, settings, and notes, tagged to an instrument and DAW.
- Supports images (screenshot your plugin chain for reference).
- **★ REFS** — a reference-track shelf: commercial songs you mix against, so you can A/B your channel settings against a target sound.
- Every config can carry an image, notes, and links back to a tone or recipe it's based on.

## Tone DB

Your library of amp/pedal/plugin tone combos — NAM/IR pairings, gain-stage settings, brand/category tags, and optional recorded audio previews.

- **+ ADD TONE** — name, category, DAW, NAM model, IR, brand, notes, and an optional audio recording of the tone itself.
- **Star up to 10** tones to pin them to the Cookbook's home screen.
- **⚡ STAGES** — view your tones laid out as a gain-stage ladder instead of a flat list.

---

## Toolbox

A multi-panel workbench, switched via the pill buttons at the top of the tab. Your last-used panel is remembered between visits.

### 🎵 Theory & Ear
Circle of Fifths reference, Scale & Mode helper, Key Detector (paste chords, get the likely key), Nashville Number Chart, Harmonic Mixing (Camelot wheel for DJ-style key-compatible transitions), and an Interval Ear Trainer.

### 🧮 Calculators
Delay-time calculators (straight/dotted/triplet, synced to your BPM), LFO frequency, Loudness Targets (LUFS targets per platform — streaming, CD, etc.), a Frequency Collision Map (who "owns" what frequency range between instruments), Reverb & Pre-Delay recommender, Mic 3:1 & SPL falloff, File-size & record-time estimator, and Level/dB converters.

### 🥁 Players & Practice
Metronome, a tempo-ramping Practice Routine builder, a chromatic Tuner, the **Beat Sketch** 16-step drum sequencer, the **Melody Sketchpad** (play/record ideas on an on-screen keyboard, export to MIDI), and a Practice Timer & session log.

### 🎬 Arrangement & Setlists
This is the big one — see **[The Song Board system](#the-song-board-system-the-hub)** below for the full writeup. Also includes **Song Structure Templates** (common arrangement skeletons to start from) and the standalone **Setlist Builder** (for planning live sets or listening sequences, separate from any one song's own arrangement).

### 🎙️ Monitoring & Room
**Test-Tone & Noise Lab** — pink/white noise generator and test tones, used together with the **SPL gauge** (left sidebar) to check whether your monitoring volume has drifted while your ears fatigue during a long session — it's an ear-fatigue check, not a mix-analysis tool. Also: an Ear-Fatigue/Break Timer, and a live Spectrum Analyzer (RTA) for room/monitor checks.

### 🔬 Mix Analyzer
Upload an audio file for real analysis (not a live meter — this reads a bounced file):
- **Integrated LUFS** and **true peak** (ITU-R BS.1770-4 K-weighted loudness).
- **Dynamic range (DR)** and **phase correlation**.
- **Spectral balance** across finer frequency bands, with transparent flags when a band looks imbalanced.
- **Reference-track A/B compare** — load a commercial reference alongside your mix.

### ✨ Creative Sparks
Idea-generation tools for when you're stuck: Shuffle a Challenge, Vibe Roulette (random creative constraint), an Idea Catcher (quick-capture that can promote an idea straight into a Channel Settings stub), and a Voice-Memo Scratchpad.

### 🤖 AI Assistant
AI Music-Prompt Generator (for tools like Lyria — builds a prompt from a genre's real recipe data) and the **AI Studio Brain** — a general Q&A/brainstorm assistant grounded in your own gear and recipes. Requires AI setup — see [AI features & setup](#ai-features--setup).

### 📊 Studio Analytics
Session Stats, a 26-week Studio Activity Heatmap, Achievements, a **Studio Graph** (visualizes what feeds what — which tones/recipes/tracks are connected), and **Cold Storage** (surfaces stuff that's gone stale and might be worth revisiting or cleaning up).

### 🗂️ Studio Ops
Gear Maintenance Log, Sample/Loop Index, Release Checklist, Collaborators & Credits, a REAPER Track Template reference, a **Gig-Bag Bundle** export, and **Encrypted Backup** (password-protected export/import, separate from the plain Vault export).

---

## The Song Board system (the hub)

Everything below lives in **Toolbox → 🎬 Arrangement & Setlists**, but it's really the app's connective tissue: a song on the Song Board can link out to its own arrangement, its own lyrics, and any number of tracks and tones — and edits to any one of those keep the others in sync.

### Song Board
A kanban board of your actual songs, with five stages: **Just Lyrics → Just a Beat → Tracking → Mixing → Done**.

- **+ ADD SONG** — title, optional note, optional length (m:ss).
- **Drag the ⠿ handle** on a card to move it to the next stage.
- **Click a card's title, length, or note** to edit it inline — no separate edit screen for quick changes.
- **🎼 Attach/Edit arrangement** — jumps into that song's own Arrangement Timeline (below).
- **📝 New/Open lyrics** — opens (or creates) that song's own linked Lyrics Lab sheet.
- **⤢ expand icon** (top-left of a card) or the **"N tracks · N tones" row** — opens the **Song Details modal**: full title/note/length editor, arrangement and lyrics jump buttons, and pickers to link any number of **Channel Settings tracks** and **Tone DB tones** to the song (no limit on how many — link every track and tone the song actually uses).
- **📋 PASTE TAGGED SONG** — see [pasting a whole tagged song](#pasting-a-whole-tagged-song) below. This single action can create the song, its arrangement, and its lyrics all at once.

### Arrangement Timeline
Block out a song section-by-section and get real bar counts and total runtime.

- Set **BPM**, then click **+Intro / +Verse / +Pre / +Chorus / +Hook / +Bridge / +Solo / +Drop / +Outro** to add sections with sensible default bar lengths.
- **Drag to reorder** sections; edit bar counts inline; the total runtime updates live.
- A color-coded **bar graph** shows the whole song's proportions at a glance — each section type has its own consistent color (Verse is always the same color, Chorus another, etc.), and that same color is used everywhere the section type appears: this graph, the row list, the Lyrics Lab structure chips, and the per-line tag dropdown.
- **🔗 Attach to Song** — pick a song from the dropdown and bind the current workspace arrangement to it (its total length gets pushed onto the song). Once attached, the app shows *"Editing arrangement for [song] — edits auto-save to this song"*; click **close** to stop editing without touching what's saved.
- **↓ DAW MARKERS (.CSV)** — exports the arrangement as a region/marker CSV you can import straight into REAPER's Region/Marker Manager.
- **📋 PASTE TAGGED** — parse pasted tagged lyrics against whichever song is selected in the dropdown, rebuilding that song's arrangement and lyrics from the paste.

### Cross-editing (lyrics ↔ arrangement)
Once a song's lyrics are linked, **editing the lyrics live-updates the arrangement automatically** — no re-parsing needed:

- Retagging a line (e.g. changing a line's Organize/Generate dropdown from Verse to Chorus), adding or deleting lines, or reordering them recomputes that song's arrangement sections and bar counts immediately.
- **Bars = lines**, one bar per lyric line (the standard hip-hop convention) — shorten a chorus by deleting a couple of its lines and the arrangement's Chorus bars drop to match; lengthen a verse by adding lines and its bars grow.
- The song's BPM is preserved through all of this — only the section list and bar counts change.
- This is intentionally **one-directional** (lyrics → arrangement). Editing a bar-count number directly in the Arrangement Timeline does not retag or delete lyric lines — there's no safe, non-destructive way to decide which lines a bar-count change should affect, so that direction is left alone rather than risk eating something you wrote.

### Pasting a whole tagged song
Paste an entire song written with `[Section]` headers on their own line, and it parses into fully tagged lyrics *and* a matching arrangement in one action. Example format:

```
[Intro]
(Check)
(Yeah)

[Verse 1]
line one of the verse
line two of the verse

[Chorus]
hook line one
hook line two

[Verse 2]
another line

[Outro]
outro line
```

- Every line under a header inherits that header's tag — including parenthetical ad-libs like `(Check)`.
- The header's own numeral isn't stored — repeated tags ("Verse 1", "Verse 2") are auto-renumbered from actual line order, so structure stays correct even after later edits reshuffle things.
- **A lone `-` on its own line** counts as one bar with no words — an instrumental/rest beat. It still adds to the section's bar total but Analyze mode won't try to rhyme it (no letters to key off of).
- **`[Chorus Half Time]`** (or any tag + "Half Time") doubles the bar count for every line under it — a half-time feel stretches each line across twice the underlying bar grid. Works with or without a numeral: `[Chorus 2 Half Time]` is also valid.
- This paste action is available from **three places**, and all three do the same full sync:
  - **Song Board** — creates a brand-new song, its arrangement, and its lyrics sheet, all at once.
  - **Lyrics Lab** — pastes into whichever sheet is open; if that sheet is linked to a song, its arrangement rebuilds to match.
  - **Arrangement Timeline** — pastes against whichever song is selected in the dropdown.

### Setlist Builder
A separate, lighter tool for planning a *set* (a sequence of songs for a live show or a listening session) — not a single song's internal structure.

- **+ ADD** a song manually with a title and length, or **pull from Song Board** via the dropdown — this pulls the song's real length (from its linked arrangement if it has one) instead of a placeholder.
- Reorder with the ▲/▼ buttons; running total length updates as you go.

---

## Lyrics Lab // Cut-Up Engine

Each tab across the top of Lyrics Lab is a **sheet** — one song's lyrics. A sheet can be linked to a Song Board song (via "New/Open lyrics" on that song's card, or by pasting a tagged song), which is what powers the arrangement cross-sync described above.

### Two modes
- **ORGANIZE/GENERATE** — the editing view: each line has a **tag dropdown** (Intro, Verse, Pre, Chorus, Hook, Bridge, Solo, Drop, Outro, or blank), a syllable count, drag-to-reorder, and a checkbox for multi-select (used by the AI co-pilot's alt-line insertion).
- **EDIT/ANALYZE** — a read-only view for editing/analyzing what you've written: rhyme scheme (color-coded end-rhymes, lettered A/B/C...), optional internal-rhyme highlighting, and a syllable count per line. Tag brackets are never shown here — Analyze mode only ever looks at the actual words.

### Structure strip
When the open sheet is linked to a song that has an arrangement, a row of colored chips shows that song's structure (Intro → Verse → Chorus → ...) right above the toolbar — each chip matches its section's color everywhere else in the app. **+ INSERT AS HEADERS** drops blank tagged marker lines into the sheet in that order, ready to fill in.

### Pasting tagged lyrics
The **📋 PASTE TAGGED** button opens a paste panel — same `[Section]` header parsing described above, scoped to whichever sheet/song is currently open. Check "replace existing lines" to overwrite instead of append.

### Other tools on this tab
- **✂️ CUT-UP SHUFFLE** / **SHUFFLE IN SECTION** — Bowie/Cobain-style randomized line reordering, either across the whole sheet or only within one tagged section.
- **↶ UNDO** — steps back through recent shuffles/edits.
- **↓ .TXT** / **🖨 PRINT** — export or print a clean lyric sheet.
- **→ TRACK** — sends the current sheet to Channel Settings as a new stub (useful for parking a lyric idea against a track config).
- **🔤 Rhyme & Word Finder** — look up rhymes/synonyms for any word.
- **📈 Word Frequency & Hook Detector** — surfaces your most-repeated words/phrases across a sheet.
- **🅰️ Bar/Syllable Counter** and **🎭 Band/Song Name Generator**.
- **✨ AI Co-Pilot** — generates lines, alternates for selected lines, or continues from your last line, grounded in your own gear/recipe context. Requires AI setup.

---

## Notes Vault

A general-purpose scratchpad with **multiple tabs** (like a browser) — create as many named notes as you want, each with its own checklist support. This is the app's catch-all note space, separate from the per-song notes on Song Board cards.

---

## AI features & setup

AI features (AI Studio Brain, AI Music-Prompt Generator, Lyrics AI Co-Pilot) need one of two backends configured via the **⚙ setup** button next to any AI panel:

1. **Direct Groq API key** — fastest to set up; paste a Groq API key and pick a model.
2. **Home Assistant bridge** — routes requests through a self-hosted Home Assistant instance with a `rest_command` service that calls Groq server-side. Useful if you already run HA and want to keep the key off the client, or want to reuse an existing HA automation setup. Requires an HTTPS HA URL (mixed-content restrictions block plain HTTP) and a long-lived access token.

Nothing AI-related is required for the rest of the app to work — every other feature functions fully offline with no AI configured.

---

## Data, sync & backup

- **Local-first**: every change saves to browser local storage immediately (look for the save-status flash near the top).
- **Google Drive sync**: once authenticated, changes debounce-save to `FERRETT_OS_VAULT.json` in your Drive a couple of seconds after you stop typing/editing. A conflict banner appears if the Drive copy changed elsewhere since your last sync here.
- **VAULT** (header) — full plain-JSON export of everything, for your own backup or to move data manually.
- **BACKUP / RESTORE** (header) — file-based backup/restore, independent of Drive.
- **🔐 Encrypted Backup** (Toolbox → Studio Ops) — password-protected export/import, if you want a backup you can store somewhere less trusted than your own Drive.
- **Offline/PWA**: a service worker caches the app shell so it opens and works with no connection; it checks for a fresh copy on each load when online and falls back to the cached version offline.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘/Ctrl K` | Search everything |
| `Space` | Start/stop the metronome (only while on the Toolbox tab and not typing in a field) |
| `Esc` | Close any open modal or drawer |
| `?` | Show the shortcuts list |

---

*This guide reflects the app as built. Section names, colors, and exact wording may shift slightly as features evolve — the header's version number is the source of truth for "what build am I on."*
