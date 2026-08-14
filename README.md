# Euterpe Creativity Workbench

A local-first studio workbench for producers, engineers, guitarists, bassists,
drummers and lyricists. Song board, full lyrics workspace with a cut-up engine,
mix-recipe cookbook, tone/pedalboard rig book, hardware routing, a deep toolbox
of theory/ear/utility tools, DAW export, and an optional AI co-pilot that runs
on **your own** provider — Claude, GPT, Gemini, Groq, DeepSeek, OpenRouter, or a
local model, whichever you already pay for.

Installable as a PWA and **fully offline** after first load. Everything you
create lives in your browser (localStorage / IndexedDB); nothing is committed
to this repo.

### 📖 [**Read the User Guide →**](USER_GUIDE.md)

End-to-end: what it does, how to set up AI and Drive sync, and a walkthrough of
every tab. Start there if you're new — this README is the shorter reference.

---

## Contents

- [Install & run](#install--run)
- [The tabs](#the-tabs)
- [Studio Lab — X-Tools](#studio-lab--x-tools)
- [Lyrics Lab — the cut-up engine](#lyrics-lab--the-cut-up-engine)
- [Studio+ — theory · ear · utilities](#studio--theory--ear--utilities)
- [Getting ideas into your DAW](#getting-ideas-into-your-daw)
- [AI Co-Pilot — bring your own key](#ai-co-pilot--bring-your-own-key)
- [Google Drive sync — bring your own Drive](#google-drive-sync--bring-your-own-drive)
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
| **Hardware, Routing & Logic** | Patchbay + REAPER routing, scripts |
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
  onto any REAPER track.
- **Arrangement → markers** — export your arrangement as a REAPER-compatible
  region CSV (`#,Name,Start,End,Length`) and import it in the Region/Marker
  Manager.
- **REAPER track template** — turn a saved tone into a `.RTrackTemplate`.

---

## AI Co-Pilot — bring your own key

Every AI feature is **optional** and runs on **your own** account with whichever
provider you already pay for. No API key ships with this app, and nothing is
proxied through anyone else's server — your browser talks straight to the
provider you pick. Everything that isn't AI works without any of this.

Open **⚙ setup** and pick a connection:

| Provider | What you need | Get a key |
|---|---|---|
| **Home Assistant → Groq** | HA URL + long-lived token (key stays in HA secrets) | — |
| **Groq** | API key (generous free tier) | [console.groq.com](https://console.groq.com/keys) |
| **Google Gemini** | API key | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **Claude** | API key | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenAI** | API key | [platform.openai.com](https://platform.openai.com/api-keys) |
| **DeepSeek** | API key | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenRouter** | One key, hundreds of models behind it | [openrouter.ai](https://openrouter.ai/keys) |
| **Local / Custom** | Any OpenAI-compatible endpoint — Ollama, LM Studio, vLLM, Together, Mistral | — |

Each provider keeps its own key and model, so you can store several and switch
without re-entering anything. A saved key is masked — leave the field blank to
keep it. Hit **TEST CONNECTION** to confirm it works.

**Two things that trip people up in a browser:**

- **CORS.** Some endpoints refuse browser requests. Claude is handled for you
  (the app sends the opt-in header Anthropic requires for direct browser calls).
  For a *local* server, allow this page's origin in that server's CORS settings.
- **Mixed content.** A page served over `https://` can only reach `https://`
  endpoints. Pointing at Home Assistant or a local model means using an HTTPS
  URL, or running this app locally over `http://`.

For the Home Assistant route, allow this app's origin in `configuration.yaml`
and restart HA:

```yaml
http:
  cors_allowed_origins:
    - https://<your-username>.github.io
```

### Moving your setup to another device

Keys live in this browser, so a new phone or a cleared cache would normally mean
typing everything again. **⚙ setup → 🔑 EXPORT** writes your provider keys and
Drive Client ID to one small file; **IMPORT** restores them in a single step.
It holds real API keys in plain text, so keep it somewhere private. Your songs
and lyrics are *not* in it — the vault has its own backup in the header, so you
can share a vault backup without handing over your keys.

---

## Google Drive sync — bring your own Drive

Drive sync is optional and points at **your** Drive, using **your** Google Cloud
OAuth client. No client ID is bundled with the app — a Google OAuth client only
works from the origins listed on it, so a fork could never reuse someone else's.
Without it the app still works fully offline; you just don't get cross-device
sync.

Open **⚙ setup → ☁ GOOGLE DRIVE SYNC** and follow the steps there:

1. Create a project in the
   [Google Cloud Console](https://console.cloud.google.com/projectcreate).
2. **APIs & Services → Library** → enable the **Google Drive API**.
3. **OAuth consent screen** → *External* → add yourself under **Test users**.
4. **Credentials → Create credentials → OAuth client ID** → *Web application* →
   add your deployment's origin under **Authorized JavaScript origins**. The
   setup panel prints the exact origin to paste.
5. Paste the Client ID in and **SAVE**.

The app requests only the **`drive.file`** scope — it sees only the files it
created itself, never the rest of your Drive.

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
- **Google Drive sync** (if connected) uses your own OAuth client and your own
  Drive — a personal backup/sync channel between your devices, not tied to this
  repository or to whoever you forked it from.
- **Backups** — download a JSON backup any time from the header, or make an
  **encrypted** `.fenc` backup from Studio Lab.
- **AI + Drive credentials** — your API keys, HA token, and Google Client ID are
  stored **only** in this browser's localStorage and are **never committed**.
  They are held unencrypted, as browser-local app settings normally are, so
  don't set them up on a shared or public computer. The only data that leaves
  your device is the request text you send, to the provider you configured.

### Forking this for yourself

Everything above is per-user by design, so a fork needs no code edits:

1. Fork the repo and enable GitHub Pages (Settings → Pages → `main` / root).
2. Open your copy and fill in **⚙ setup** — an AI provider key, and optionally a
   Google OAuth client ID for Drive sync.

That's it. Your keys, your Drive, your vault.
