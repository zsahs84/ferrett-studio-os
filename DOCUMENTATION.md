# Euterpe Creativity Workbench

Euterpe is a local-first, AI-assisted creativity workbench designed for musicians, producers, and songwriters. Named after the Greek muse of lyrical poetry, it consolidates song management, lyric writing, and technical studio documentation (like plugin chains and hardware patches) into a single, cohesive environment. 

Euterpe runs entirely in your browser using local storage, meaning it works offline, requires no backend server, and keeps your creative data private. It features built-in Google Drive synchronization to seamlessly keep your vault updated across multiple devices.

---

## 1. Song Board
The Song Board is your high-level project manager. It acts as the central hub for your tracks, tying together arrangements, lyrics, and mix data.

- **Kanban-Style Tracking:** Organize your songs across customizable columns (e.g., Ideas, Demo, Tracking, Mixing, Mastered).
- **Arrangement Sync:** Define song structures (e.g., `Verse 1`, `Chorus`) and BPM. When you link a song to a lyrics sheet, the Song Board automatically reads `[Section]` tags from the lyrics and builds the arrangement timeline and timestamps for you.
- **Deep Linking:** From a song card, you can jump directly into its dedicated Lyrics Sheet, its Channel Settings (plugin chains), or its Tone DB (hardware patches).
- **Lyria Prompts:** Generate detailed Google Lyria AI music prompts directly from a song card, passing the arrangement and lyrics verbatim to guide the AI's vocal generation.

## 2. Lyrics Lab // Cut-Up Engine
A dedicated environment for writing, brainstorming, and structuring vocals.

- **Semantic Tagging:** Write headers like `[Verse 1]` or `[Chorus]` on their own lines. Euterpe detects these and groups your lyrics logically.
- **Cut-Up Engine:** Inspired by David Bowie and William S. Burroughs, this tool lets you drag, shuffle, and splice individual lines to break writer's block and discover happy accidents.
- **Integrated Rhyming Dictionary:** Double-click any word (or type it in the search box) to pull up strong rhymes, slant rhymes and synonyms without leaving the page. Online it queries the free Datamuse API (no key, no account); offline it falls back to a built-in word bank and marks the results as such, so the panel answers either way. A separate row surfaces rhymes drawn from your own lyric sheets — words you've actually used, which no dictionary can supply.
- **AI Co-Pilot:** An integrated AI assistant that can brainstorm 8 lines based on a theme and style, or read your existing lyrics and suggest the next 4 lines to help you get unstuck.
- **Rest bars:** A line containing only a dash (`-`) is a rest — it holds its bar in the timing and the section's bar count, but carries no words. Rows show a `REST` badge, and the lyric exports leave them out.
- **AI provenance marks:** Lines inserted by the co-pilot carry an `ai` flag, surfaced by the **AI MARKS** toggle and cleared the moment a human edits the line — the same pattern the `alt` flag already uses, and the same principle the law applies (meaningfully rewriting generated text makes it the human's). FINALIZE reports the running proportion. Explicitly a personal record rather than a legal instrument: self-reported, unverifiable, and carried in no export.
- **Finalize:** The sheet is a working surface, but the arrangement, the Lyria prompt and the synced-lyrics export all read the same lines — so a half-tidied sheet yields a quietly wrong arrangement rather than an error. **✅ FINALIZE** runs eight completeness checks and separates what it can tidy (punch-up alternatives, stray blanks, non-standard rest markers) from what needs a human decision (a missing lyric, an untagged line, an unset intensity). It never writes a lyric or picks a section tag. This matters most for punch-up alternatives: they are inserted *without* a section tag, and an untagged line breaks a run of tagged ones, so one left inside a verse splits it in two and adds a phantom bar to every downstream timing.
- **Synced lyrics (`.LRC`):** Exports `[mm:ss.xx]` per line for Musixmatch (the route Spotify's lyrics come through) and karaoke players, plus a plain words-only export for unsynced submission. Timings are *derived* from tempo and the one-bar-per-line convention, not recorded — the app has no per-line timestamps — and the UI says so.

> **Export distinction:** `.TXT` and 📋 COPY are raw dumps of the sheet and deliberately include punch-up alternatives and rest dashes as typed. The `.LRC` and plain-lyric exports are the finished article and exclude both.

## 3. The Cookbook (AI Kit Generator)
The Cookbook is an intelligent recipe manager for mixing and sound design. 

- **Genre Kits:** Store and organize mix recipes by genre (e.g., Synthwave, 90s Grunge, Lo-Fi Hip Hop). 
- **Palette-Aware AI Generation:** Euterpe generates full, 12-instrument mixing kits tailored to a genre using an AI Co-Pilot (Claude, OpenAI, Gemini, Groq, DeepSeek, OpenRouter, a local model, or Home Assistant). Crucially, **the AI only names plugins from your owned-plugins list**, so it builds realistic signal chains with precise knob values drawn strictly from your own VST library.
  > The app ships with a starter palette belonging to the original author. Replace it under **Settings → Owned Plugins → ✎ EDIT LIST** — there are one-line scan commands for macOS, Windows and Linux that list your plugin folders so you can paste the output straight in. Until you do, generated kits will reference gear you don't have.
- **Recipe Editor:** A dense, professional editor for detailing plugin chains (Gate, EQ, Comp, Saturation, FX, Limit). It catches impossible settings and ensures you document *why* a chain works.
- **Exporting:** Export genres as shareable JSON packs or Markdown chapters for sharing with collaborators or reading offline.

## 4. Hardware & Tones (Tone DB)
A visual patchbay and preset manager for your analog gear and hardware synthesizers.

- **The patchbay graph is the rig.** Everything the Hardware tab shows below the diagram — the signal paths, the path-recall buttons, the input list, the safety rules, the A/B monitor rotation and the pre-export checklist — is *derived* from the devices and connections you draw. Devices carry a type (source / interface / outboard / amp / monitors / speakers), settings, notes and warnings; connections carry a cable, a port label and warnings. Nothing about the rig is hardcoded in markup, so the tab describes whatever gear its owner actually has.
  > It ships seeded with the original author's rig as a **labelled example to replace**. The banner disappears once the patchbay stops matching that seed.
- **Patch Sheets:** Document complex synthesizer routings or pedalboard settings.
- **Visual References:** Upload or paste photos of hardware settings directly into the tone entries so you never lose a knob position.

## 4b. Tools & Intel
Split into two halves with live counts: a tagged, searchable **web link** database, and the **script arsenal**. The app stores each script's metadata (name, category, keyboard shortcut, description) and links to its raw download — the Lua/Python files themselves live in the companion repo, [ferrett-audio-tools](https://github.com/zsahs84/ferrett-audio-tools), rather than being duplicated here.

## 5. Channel Settings
A tracking sheet for specific mixes. While the Cookbook holds theoretical "ideal" chains for a genre, the Channel Settings tab documents the actual, deployed chains used on a specific song on the Song Board.

## 6. Toolbox & Cloud Sync
The control center of the workbench.

- **AI Assistant Setup:** Configure your API keys for Gemini, Groq, or a custom Home Assistant endpoint. Euterpe includes an Accounting Ledger that tracks your API token usage and calculates your exact spend over the week, month, and lifetime.
- **Plugin Library:** Define your "Owned Plugins" palette. The AI uses this exact list to ensure it never recommends gear you don't have.
- **Google Drive Sync:** Connect your Google account to back up your entire vault to a hidden app-data folder in Google Drive. It automatically syncs changes across your devices (desktop, laptop, tablet).
- **Appearance:** Adjust UI scale and customize the accent colors (Vaporwave, Matrix, Amber, etc.) to fit your studio vibe.

---

## Technical Architecture
- **Single Page App (SPA):** Built with pure HTML, Vanilla JavaScript, and Tailwind CSS.
- **Zero Backend:** Uses `window.localStorage` as the primary database (`ferrett_os_db_v22.4`). 
- **Service Worker:** Includes a service worker (`service-worker.js`) with aggressive caching to ensure the app loads instantly and works completely offline (excluding AI generation and Drive sync).
- **AI Integration:** Direct, client-side API calls to Groq or Google Gemini. API keys are stored strictly in your browser's local storage and never leave your device (except when communicating directly with the AI provider).
