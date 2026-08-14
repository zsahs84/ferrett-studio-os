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
- **Integrated Rhyming Dictionary:** Double-click any word (or type it in the search box) to pull up strong rhymes, slant rhymes, and synonyms without leaving the page. It runs against a built-in word bank plus every word across your own lyric sheets, so it needs no network and works offline.
- **AI Co-Pilot:** An integrated AI assistant that can brainstorm 8 lines based on a theme and style, or read your existing lyrics and suggest the next 4 lines to help you get unstuck.

## 3. The Cookbook (AI Kit Generator)
The Cookbook is an intelligent recipe manager for mixing and sound design. 

- **Genre Kits:** Store and organize mix recipes by genre (e.g., Synthwave, 90s Grunge, Lo-Fi Hip Hop). 
- **Palette-Aware AI Generation:** Euterpe generates full, 12-instrument mixing kits tailored to a genre using an AI Co-Pilot (Groq, Gemini, or Home Assistant). Crucially, **the AI only uses plugins you actually own**. You feed it your gear list, and it builds realistic signal chains with precise knob values tailored strictly to your VST library.
- **Recipe Editor:** A dense, professional editor for detailing plugin chains (Gate, EQ, Comp, Saturation, FX, Limit). It catches impossible settings and ensures you document *why* a chain works.
- **Exporting:** Export genres as shareable JSON packs or Markdown chapters for sharing with collaborators or reading offline.

## 4. Hardware & Tones (Tone DB)
A visual patchbay and preset manager for your analog gear and hardware synthesizers.

- **Patch Sheets:** Document complex synthesizer routings or pedalboard settings.
- **Visual References:** Upload or paste photos of hardware settings directly into the tone entries so you never lose a knob position.

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
