# FERRETT_STUDIO_OS

A personal, single-file studio HUD for producers, engineers, guitarists,
bassists, drummers and lyricists. Recipe cookbook, tone/pedalboard rig book,
track log, hardware routing, a deep toolbox of theory/ear/utility tools, a
full lyrics workspace, DAW-export, and an optional AI co-pilot that runs on
**your own** Groq — all in one `index.html`.

Installable as a PWA and **fully offline** after first load. Everything you
create lives in your browser (localStorage / IndexedDB); nothing is committed
to this repo.

---

## Contents

- [Install & run](#install--run)
- [The tabs](#the-tabs)
- [Studio Lab — X-Tools](#studio-lab--x-tools)
- [Lyrics Lab — the cut-up engine](#lyrics-lab--the-cut-up-engine)
- [Studio+ — theory · ear · utilities](#studio--theory--ear--utilities)
- [Getting ideas into your DAW](#getting-ideas-into-your-daw)
- [AI Co-Pilot (Groq via Home Assistant)](#ai-co-pilot-groq-via-home-assistant)
- [Google Music Bridge](#google-music-bridge)
- [Data, privacy & backups](#data-privacy--backups)

---

## Install & run

**Install (recommended):** open the GitHub Pages URL and use your browser's
install prompt (or *Add to Home Screen* on iOS/Android). It runs offline after
the first load.

**Local development** — service workers need a secure context, so serve it
rather than opening the file directly:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

**Deploy to GitHub Pages:** Settings → Pages → Source: `main` / `/ (root)`,
then visit `https://<username>.github.io/<repo>/`.

> After any change to `index.html`, bump `CACHE_VERSION` in
> `service-worker.js` so installed clients pick up the new copy.

---

## The tabs

| Tab | What it's for |
|-----|---------------|
| **Beat & Vox Cookbook** | Genre/instrument recipes with signal-chain screenshots |
| **Top Guitar/Bass Presets** | Tone DB (NAM/IR, tags, BPM/key, audio refs) |
| **Hardware, Routing & Logic** | Patchbay + REAPER/LUNA routing, scripts |
| **Web Tools & Intel** | Link database of external tools |
| **Track DB** | Per-track settings, plugins, references, images |
| **Tone DB** | Tagged tone combos |
| **Studio Calculator & Tools** | BPM/delay/LFO calc, metronome, tuner, practice ramp |
| **Studio Lab // X-Tools** | 22 experimental creative + utility tools |
| **Lyrics Lab // Cut-Up** | Full lyrics workspace with the cut-up engine |
| **Studio+ // Theory · Ear · AI** | Theory, ear training, studio utilities, AI |
| **Notes Vault** | Context-aware scratchpad with `[TODO]` checklist |

Header extras: **⌘ search everything** (command palette), **FOCUS** now-playing
log, session **REC timecode** (click to pause), color-key, gear index, import,
quiet-mode, theme cycle, Google Drive sync, and vault backup/restore.

---

## Studio Lab — X-Tools

A grab-bag of 22 creative and utility tools. Highlights and how to use them:

**Creative catalysts**
- **🎲 Shuffle a Challenge** — one tap gives a random recipe + tempo + key + a
  creative constraint to break a blank page.
- **🃏 Vibe Roulette** — Oblique-Strategies-style prompt cards for producers.
- **⚡ Idea Catcher** — tap the tempo of an idea, name it, and it spawns a
  Track-DB stub so the idea doesn't escape.
- **🎙️ Voice-Memo Scratchpad** — record a hum/beatbox straight into the vault
  (IndexedDB), play it back or delete it. Never texted to your phone again.

**Drums / guitar / keys**
- **🥁 Beat Sketch** — a 16-step drum sequencer, fully synthesized. Click a
  cell once for a hit, again for an **accent** (louder). Set **swing**, save
  named **snapshots**, load **presets** (Boom-Bap/Trap/Four-Floor/Half-Time),
  and **↓ MIDI** to export the groove.
- **🎹 Chord Progression Book** — pick a key + major/minor to get named
  progressions (Axis, ii–V–I, doo-wop, Andalusian…) as real chords; each has a
  **↓MIDI** button.
- **🎸 Chord Diagram Library** — SVG fret diagrams for common guitar & bass
  chords. **Tap any chord to hear it strummed.**
- **🎹 Melody Sketchpad** — a playable 2-octave keyboard (mouse/touch or keys
  `A S D F G H J K` / `W E T Y U`). Scale tones glow; **record** a lick, play
  it back, or **↓ MIDI** it.
- **🎸 Fretboard Scale Explorer** — light up any root+scale across a guitar or
  bass neck; tap a note to hear it.

**Arrange / plan / reference**
- **🎬 Arrangement Timeline** — block a song out section by section; get each
  part's length + total runtime at your BPM, and **↓ export DAW markers (CSV)**.
- **🎫 Setlist Builder** — add songs by title + `m:ss` (or pull from the Track
  DB), reorder, get total set runtime.
- **🔧 Transpose & Capo** — type chords, slide to transpose; the capo helper
  tells you which fret to capo to play easier open shapes in the same key.
- **🎭 Name Generator**, **🧱 Song Structure Templates**.

**Analysis & housekeeping**
- **🎯 Loudness (LUFS) targets**, **📊 frequency-collision map**,
  **🌫️ reverb/pre-delay recommender**, **🎤 mic 3:1 & SPL**,
  **💾 file-size/record-time**, **🔊 test-tone & noise lab** (sine/white/pink/
  sweep + reference pitches), **👂 ear-fatigue break timer**.
- **🗓️ Activity heatmap** and **🏆 achievements** from your session log.
- **🕸️ Studio graph** (tracks ↔ tones ↔ recipes) and **🧊 cold-storage**
  report of items you haven't touched in 90+ days.

**Export / backup**
- **🎚️ REAPER track template** from a saved tone (`.RTrackTemplate`).
- **🎒 Gig-bag bundle** — export a curated subset (recipes/tones/links) as a
  shareable pack.
- **🔐 Encrypted backup** — passphrase-encrypt your whole vault (AES-GCM) to a
  `.fenc` file, and restore it.

---

## Lyrics Lab — the cut-up engine

A full lyric-writing workspace built around the Bowie/Cobain **cut-up**
technique.

- **Sheets** — keep multiple songs; each auto-saves.
- **Line editor** — drag the `⠿` handle to reorder any line; tag lines
  `[Verse]`, `[Hook]`, `[Bridge]`, etc.; live syllable counts per line.
- **✂️ Cut-Up Shuffle** — randomize all lines for happy accidents.
  **Shuffle-in-Section** keeps your structure. Everything is **undoable**
  (25 levels).
- **EDIT / ANALYZE toggle** — Analyze view shows:
  - **Rhyme-scheme highlighter** — auto-labels lines A/B/C and colors the
    rhyming end-words (prints the detected scheme).
  - **Internal-rhyme highlighter** — color-matches rhymes *inside* lines.
  - **Syllable contour** sparkline to see flow evenness.
  - **🔊 Read Aloud** — the browser speaks your lyric (with a rate slider).
- **🔤 Rhyme & Word Finder** — near-rhymes from a built-in bank + your own
  sheets, or **synonyms** (toggle). Double-click a word in a line to look it up.
- **📈 Word Frequency & Hook Detector** — ranks repeated words and flags your
  likely hook 🎣.
- **Export** — `↓ .TXT`, **🖨 Print** (clean sheet for print / Save-as-PDF), or
  **→ Track** to attach the lyric to the Track DB.
- **✨ AI Co-Pilot** (needs setup, see below) — **Generate** from a theme +
  style, **Continue** the current sheet, **Punch Up** the last line, or get
  **🏷 Title** ideas. Results drop straight into the sheet.

---

## Studio+ — theory · ear · utilities

**Theory & ear**
- **🔑 Key Detector** — type a song's chords, get the most likely key(s).
- **🔢 Nashville Number Chart** — portable, key-relative chord numbers.
- **🎧 Harmonic Mixing (Camelot)** — pick a key, see what mixes smoothly (±1
  energy, relative major/minor).
- **👂 Interval Ear Trainer** — hear two notes, name the interval; scored.
- **🔁 Progression Player** — type chords, hear them loop with a bass line.
- **🎵 Note ↔ Frequency** — adjustable A4, click a note to hear it, or type a
  frequency to get the nearest note + cents.

**Studio utilities**
- **📊 Spectrum Analyzer (RTA)** — live mic spectrum for spotting room
  resonances and tuning monitors.
- **🧮 Level / dB Converters** — dBFS↔linear/%, gain dB→multiplier, comp
  ratio, semitone→frequency ratio.
- **🔧 Gear Maintenance Log** — log strings/tubes/batteries, see days-since,
  re-log with one tap.
- **🗂️ Sample / Loop Index** — tag samples by BPM + key and filter them.
- **✅ Release Checklist** — per-track mix→master→distribution checklist,
  progress saved.
- **👥 Collaborators & Credits** — a simple rolodex of who played what.
- **⏱️ Practice Timer & Log** — time a session, auto-log it.

**🧠 AI Studio Brain** (needs setup) — ask-anything (production/theory/gear),
**chords from a mood**, **reimagine a recipe in a new genre**, and **mix
feedback** from a description of what you hear.

---

## Getting ideas into your DAW

- **MIDI export** — the Beat Sketch, each Chord Progression, and a recorded
  Melody all export as standard `.mid` files (type-0, 480 PPQ) you can drag
  onto any DAW track (REAPER, LUNA, etc.).
- **Arrangement → markers** — export your arrangement as a REAPER-compatible
  region CSV (`#,Name,Start,End,Length`) and import it in the Region/Marker
  Manager.
- **REAPER track template** — turn a saved tone into a `.RTrackTemplate`.

---

## AI Co-Pilot (Groq via Home Assistant)

The AI features are **optional** and route through **your own** Groq setup, so
no API key is ever shipped in this public app. Everything else works without it.

Open **⚙ setup** on any AI card. Two connection modes:

### Home Assistant mode (recommended)

Calls your HA `rest_command.groq_creative_request` / `groq_speed_request`
services (the key stays in HA secrets). You need:

1. **CORS** — in your HA `configuration.yaml`, allow this app's origin:
   ```yaml
   http:
     cors_allowed_origins:
       - https://<your-username>.github.io
   ```
   Restart Home Assistant after adding it.
2. **An HTTPS URL to HA** — this app is served over HTTPS, so it must reach HA
   over **https** too (browsers block https→http "mixed content"). Use your
   remote-access HTTPS URL (Nabu Casa, Homeway, or a reverse proxy) — **not** a
   `http://<local-ip>:8123` address.
3. **A long-lived token** — HA → Profile → Security → create token, and paste
   it into ⚙ setup. It's stored only in your browser.

Hit **Test Connection** — it echoes what the model replies.

### Direct Groq mode

Paste a Groq API key at runtime (localStorage only). Simpler, but browser→Groq
can be blocked by CORS; the HA route is more reliable.

The co-pilot uses the **creative** model for lyrics and the **fast** model for
prompts/utility calls.

---

## Google Music Bridge

In **Studio+**, the **🅶 Google Music Bridge** uses the co-pilot to craft a
prompt tuned for Google's music models (Lyria / MusicFX like short,
comma-separated descriptors — genre, instruments, mood, BPM — and no lyrics),
then gives you **copy** + one-tap **launch links** to MusicFX, MusicFX DJ, AI
Test Kitchen, and Gemini.

> There is no free public "prompt → audio" API to pull generated audio back
> into the app; this bridge optimizes the prompt and hands you off to the tool.

---

## Data, privacy & backups

- All content (cookbook, tones, tracks, notes, lyrics, beats, logs, settings)
  lives in this browser's **localStorage**; audio (tone refs, voice memos)
  lives in **IndexedDB**. None of it is in this repo.
- **Google Drive sync** (if connected) is a personal backup/sync channel
  between your own devices, not tied to this repository.
- **Backups** — download a JSON backup any time from the header, or make an
  **encrypted** `.fenc` backup from Studio Lab.
- **AI credentials** — your HA URL/token or Groq key are stored only in your
  browser's localStorage and are **never committed**. The only data that leaves
  your device is the AI request text you send, to the endpoint you configure.
