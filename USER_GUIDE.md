# Euterpe Creativity Workbench — User Guide

A local-first songwriting and production workbench that runs entirely in your browser.
Song management, lyric writing, mix recipes, gear documentation, and an AI co-pilot that
runs on **your** API key — one page, no backend, no build step, works offline.

Named after the Greek muse of lyric poetry. The version number is in the browser tab title
and the header (`Euterpe Creativity Workbench (vNNN)`).

---

## Contents

1. [What this is, and who it's for](#1-what-this-is-and-who-its-for)
2. [Quick start — 5 minutes](#2-quick-start--5-minutes)
3. [Setting up the AI co-pilot](#3-setting-up-the-ai-co-pilot)
4. [Setting up Google Drive sync](#4-setting-up-google-drive-sync)
5. [Moving your setup to another device](#5-moving-your-setup-to-another-device)
6. [The workspace](#6-the-workspace)
7. [Home](#7-home)
8. [Song Board](#8-song-board)
9. [Lyrics Lab](#9-lyrics-lab)
10. [Cook Book](#10-cook-book)
11. [Tools menu](#11-tools-menu)
12. [Toolbox](#12-toolbox)
13. [Settings](#13-settings)
14. [Your data — storage, backup, privacy](#14-your-data--storage-backup-privacy)
15. [Troubleshooting](#15-troubleshooting)
16. [Running your own copy](#16-running-your-own-copy)
17. [The honest bit](#17-the-honest-bit)

---

## 1. What this is, and who it's for

Euterpe is for the person who writes, records, and mixes their own music — and keeps losing
track of the details. The plugin chain that made the drums hit right. The knob positions on
a hardware synth. Which verse belonged to which demo. What key that idea was in.

It is **one HTML page**. There is no account, no server, no subscription. Everything you
create is stored in your own browser and, if you choose, synced to your own Google Drive.

**What it does:**

| Area | What it's for |
|---|---|
| **Song Board** | Kanban tracking for every song, from idea to mastered |
| **Lyrics Lab** | Writing, rhyme lookup, and the Bowie/Burroughs cut-up technique |
| **Cook Book** | Mix recipes per genre — full signal chains, built from plugins you actually own |
| **Channel Settings / Tone DB** | The chains and patches you actually used, with photos |
| **Toolbox** | ~50 calculators, theory helpers, ear trainers, players, and analyzers |
| **AI co-pilot** | Optional. Lyrics, chord progressions, mix feedback, full genre kits |

**What it is not:** a DAW. It doesn't record or play back your music. It's the notebook,
reference library, and assistant that sits *beside* your DAW.

### Why this exists

Euterpe sits at the intersection of two people who happen to be the same man: a
mad-scientist web developer seeing how far a single-page PWA can actually be pushed, and
someone who's been listening to music since he was in the womb, can jam on a few things,
and knows his way around a recording desk.

It's the accumulation of every *"huh, that would be useful"* thought collected over years of
making music — from the first spark of an idea, through tracking, mixing, and producing.
Each of those thoughts got approached from several directions at once: as a programmer, a
songwriter, a musician, a studio engineer, and as someone who just wants a good Swiss Army
knife of inspiration and tools sitting next to the desk.

**Treat everything it gives you as a starting point, not gospel.** The recipes, the
suggestions, the AI output — they're ideas and jumping-off points. If something it says
doesn't match your ears, your ears are right. Click around, break things, take what's
useful, ignore the rest.

---

## 2. Quick start — 5 minutes

1. **Open the page.** That's the install. It works immediately.
2. **Install it as an app (optional but recommended).** Use your browser's install prompt,
   or *Add to Home Screen* on phone. You get an icon and full offline use.
3. **Write something.** Go to **🎤 Lyrics Lab**, type a few lines. It saves as you type.
4. **Start a song.** Go to **🗂️ Song Board**, add a song, give it a BPM.
5. **Back it up.** Header → **VAULT** downloads a complete JSON of everything.

Everything above works with **no setup at all** — no keys, no account, no internet after
the first load.

Two things are worth setting up once, and both are optional:

- **AI co-pilot** — needs an API key from a provider you choose ([section 3](#3-setting-up-the-ai-co-pilot))
- **Drive sync** — needs a free Google Cloud OAuth client ([section 4](#4-setting-up-google-drive-sync))

---

## 3. Setting up the AI co-pilot

Every AI feature is optional and runs on **your own** account with whichever provider you
already pay for. No API key ships with this app. Your browser talks straight to the
provider — nothing is proxied through anyone else's server.

Go to **⚙️ Settings** in the sidebar. Under **CONNECTION**, pick one:

| Provider | Good for | Where to get a key |
|---|---|---|
| **Home Assistant** | You already run HA; the key stays in HA secrets | — |
| **Direct Groq** | Free tier, very fast | [console.groq.com/keys](https://console.groq.com/keys) |
| **Google Gemini** | Free tier, big responses, thinking control | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Claude** | Strongest writing and reasoning | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenAI** | Familiar, widely compatible | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **DeepSeek** | Very cheap | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenRouter** | One key, hundreds of models | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Local / Custom** | Ollama, LM Studio, vLLM — free, private, offline | — |

Then:

1. Paste your API key.
2. Adjust the **MODEL** field if you want something other than the default.
3. Hit **TEST CONNECTION** — it prints back what the model actually replied.
4. Hit **SAVE**.

**Each provider keeps its own key and model.** You can store keys for several and switch
between them freely without re-entering anything.

**A saved key is masked.** Once saved, the field shows `[ API KEY SAVED — LEAVE BLANK TO
KEEP ]`. Leaving it blank keeps the stored key; you only type in it to *change* the key.

### What it actually costs

Less than you'd think, but you should understand what you're spending.

Every AI feature bills to **your** account at **your** provider's rates. Nothing here is a
subscription and nobody takes a cut — the app just hands your request to the provider you
picked.

In the author's own use, running Gemini Flash, individual calls have landed anywhere from a
fraction of a cent up to around twenty-something cents for the big ones — and building out a
substantial FX chain has never run up a bill bigger than about twenty-odd cents. **Your
numbers will differ**, sometimes a lot: different model, different provider, different
prices, different length of request.

The thing that drives cost is simply how much text moves. A Producer Notes write-up runs to
roughly a thousand characters; a full FX chain is in the same ballpark. Longer request in,
longer answer out, more tokens, higher cost. Reasoning-heavy models charge their thinking as
output, which is why Gemini's **THINKING LEVEL** setting is the single biggest cost lever
available to you.

**Don't guess — read the meter.** The **ACCOUNTING LEDGER** at the bottom of Settings shows
real token usage as each provider reports it, with spend for the week, month, and lifetime.
Those are actual figures, not estimates, and they're specific to you.

**Save what you like.** Most AI cards have a save option, and it's there for a reason:
regenerating the same idea five times because you didn't keep the good one is the easiest
way to spend money for nothing. Keep the take you liked, then move on.

Several providers have genuinely usable free tiers (Groq and Gemini especially), and the
**Local / Custom** option runs a model on your own machine for nothing at all. If cost is a
concern, start there.

### Getting good results

**Sometimes AI is just whacko.** You'll occasionally get something that makes no sense.
That's normal — regenerate and you're usually fixed. It isn't broken and you didn't do
anything wrong.

**If you're using it to generate prompts for another AI, read the prompt properly before you
use it.** Make sure it actually says what you meant. A prompt that's subtly off will
confidently produce something subtly wrong, and you'll spend more fixing that than you would
have spent reading it.

**A trick for describing a sound you can hear but can't put into words:** find a song on
YouTube that has the sound you're chasing, ask YouTube's AI to describe it, and paste that
description in here. It's a surprisingly good way to get from *"I want it to sound like
that"* to language a model can actually work with.

### Two things that trip people up in a browser

- **CORS.** Some endpoints refuse browser requests outright. Claude is handled for you (the
  app sends the opt-in header Anthropic requires). For a **local** server, you must allow
  this page's origin in that server's CORS settings.
- **Mixed content.** A page served over `https://` can only reach `https://` endpoints. If
  you're pointing at Home Assistant or a local model, either use an HTTPS URL (Nabu Casa, a
  reverse proxy) or run this app locally over `http://`.

For the Home Assistant route, allow the app's origin in `configuration.yaml` and restart HA:

```yaml
http:
  cors_allowed_origins:
    - https://<your-username>.github.io
```

### Local models, free and offline

Pick **LOCAL / CUSTOM** and point it at any OpenAI-compatible server:

| Server | Endpoint |
|---|---|
| Ollama | `http://localhost:11434/v1` |
| LM Studio | `http://localhost:1234/v1` |
| vLLM | `http://localhost:8000/v1` |

Leave the API key blank — local servers usually don't want one. Set **MODEL** to whatever
you have pulled (e.g. `llama3.1`). This costs nothing and never leaves your machine.

---

## 4. Setting up Google Drive sync

Drive sync is optional. Without it the app is fully functional — this only adds
cross-device sync and off-machine backup.

It syncs to **your own** Drive using **your own** OAuth client. Nothing is shared with the
app's author or anyone else. A Google OAuth client only works from the origins listed on
it, so this genuinely has to be yours.

In **⚙️ Settings → ☁ GOOGLE DRIVE SYNC**:

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/projectcreate).
2. **APIs & Services → Library** → enable the **Google Drive API**.
3. **OAuth consent screen** → choose **External** → fill in an app name and your email →
   add your own Google account under **Test users**.
4. **Credentials → Create credentials → OAuth client ID** → **Web application**. Under
   **Authorized JavaScript origins**, add the exact origin the settings panel prints for
   you (it shows the URL you're currently on).
5. Copy the **Client ID** into the panel and hit **SAVE**.
6. Click the Drive icon in the header to connect. It turns green when synced.

Once connected, your vault debounce-saves to a single file in your Drive a couple of
seconds after each change, and pulls on load.

**Scope:** the app requests only `drive.file`, which means it can see **only the files it
created itself** — never the rest of your Drive. This is enforced by Google, not by us.

> The **API KEY** field is optional and can be left blank. Drive calls are authorized by
> the OAuth token; the key would only cover the discovery document.

---

## 5. Moving your setup to another device

Your keys live in *this browser*. A new phone, a second machine, or a cleared cache would
normally mean typing everything again.

In **⚙️ Settings**, under **🔑 MOVE THIS SETUP TO ANOTHER DEVICE**:

- **↓ EXPORT** downloads a small file (`ferrett_os_settings_YYYY-MM-DD.json`) containing
  your provider keys and Drive Client ID.
- **↑ IMPORT** loads that file back and configures the app in one step.

**Keep the export file private — it contains real API keys in plain text.** A password
manager or an encrypted folder is the right home for it.

**It deliberately does *not* contain your songs, lyrics, or notes.** Those have their own
backup (header → **VAULT**), which means you can hand a collaborator a vault backup without
also handing them your API keys.

---

## 6. The workspace

The sidebar is the main navigation:

| Nav item | What lives there |
|---|---|
| 🚀 **Home** | Session starter, stats, idea catcher, voice memos, activity heatmap |
| 🗂️ **Song Board** | Kanban board, arrangement timeline, song structures, setlists |
| 🎤 **Lyrics Lab** | The full lyric writing environment |
| 📖 **Cook Book** | Genre mix recipes and the AI Kit generator |
| 🧰 **Tools ▾** | Dropdown — seven reference and utility tabs ([section 11](#11-tools-menu)) |
| ⚙️ **Settings** | AI, Drive, backup, theme, calibration ([section 13](#13-settings)) |

The header bar stays visible everywhere and carries global controls: universal search
(**⌘/Ctrl + K**), the **FOCUS** now-playing log, a gear index, quiet-mode (turns off the
HUD animations for low-power devices), theme cycling, the Drive status light, **VAULT**
export, backup/restore, and a session timer.

---

## 7. Home

Your landing pad and dashboard.

- **🚀 Session Starter** — one tap to begin a logged studio session.
- **Session stats** — what you've done recently.
- **⚡ Idea Catcher** — tap the tempo of an idea, name it, and it spawns a song stub so
  the idea doesn't evaporate.
- **🎙️ Voice-Memo Scratchpad** — record a hum or a beatbox straight into the vault
  (stored in IndexedDB), play it back, delete it.
- **🗓️ Activity heatmap** — a calendar view of when you actually worked.

---

## 8. Song Board

The project manager, and the hub that ties everything else together.

- **Kanban tracking** — move songs across columns (Ideas → Demo → Tracking → Mixing →
  Mastered, customizable).
- **Arrangement Timeline** — block a song out section by section and get each part's
  length plus total runtime at your BPM. Exports DAW markers as CSV.
- **Automatic arrangement from lyrics** — if a song is linked to a lyrics sheet, Euterpe
  reads the `[Section]` tags out of the lyrics and builds the timeline and timestamps for
  you.
- **Song Structure Templates** — common arrangements to start from.
- **Setlist Builder** — add songs by title and `m:ss`, reorder, get total set runtime.
- **Deep links** — jump straight from a song card to its lyrics sheet, its Channel
  Settings, or its Tone DB entries.

---

## 9. Lyrics Lab

A full writing environment built around the Bowie/Burroughs **cut-up** technique.

**Writing**
- **Sheets** — keep multiple songs; each auto-saves.
- **Section tags** — write `[Verse 1]`, `[Chorus]`, `[Bridge]` on their own lines. These
  drive the Song Board's arrangement builder, so they're worth using.
- **Line editor** — drag the `⠿` handle to reorder any line. Live syllable counts per line.
- **Per-line checkboxes** — select specific lines to punch up or delete.

**The cut-up engine**
- **✂️ Cut-Up Shuffle** randomizes all lines for happy accidents.
- **Shuffle-in-Section** keeps your structure intact while scrambling within it.
- Everything is **undoable** — 25 levels.

**Analysis** (EDIT / ANALYZE toggle)
- **Rhyme-scheme highlighter** — auto-labels lines A/B/C and colors the rhyming end-words.
- **Internal-rhyme highlighter** — color-matches rhymes *inside* lines.
- **Syllable contour** sparkline, to see whether your flow is even.
- **🔊 Read Aloud** — the browser speaks the lyric, with a rate slider.

**Lookup**
- **🔤 Rhyme & Word Finder** — double-click any word in a line to look it up without leaving
  the page. Results are split into **strong** and **slant** rhymes, and there's a toggle for
  **synonyms**.
  The corpus is a built-in word bank **plus every word you've written across your own
  sheets** — so it gets more useful the more you write, and it works completely offline
  (no API, no lookup latency, nothing sent anywhere).
- **📈 Word Frequency & Hook Detector** — ranks repeated words and flags your likely hook.

**AI** (needs [setup](#3-setting-up-the-ai-co-pilot))
- **Generate** from a theme and style, **Continue** the current sheet, **Punch Up** selected
  lines, or get **🏷 Title** ideas. Results drop straight into the sheet.
- **Chord progressions** matched to the genre, mood, and the actual words — positioned over
  the word they land on, and draggable to reposition.

**Export** — `↓ .TXT`, **🖨 Print** (clean sheet, or Save-as-PDF), or **→ Track** to attach
the lyric to a song.

---

## 10. Cook Book

A structured recipe book for mixing: **Genre → Instrument → full signal chain**, with
plugin order, settings, notes, and reference links.

- **Recipe editor** — a dense editor covering Gate, EQ, Comp, Saturation, FX, and Limit,
  with room to document *why* a chain works, not just what it is.
- **🤖 AI Kit generator** — generates a full multi-instrument mixing kit for a genre.

**The important part:** the generator only names plugins from your **owned-plugins list**,
so it builds chains with specific knob values for gear you can actually load — not a
wishlist. That only works if the list is *yours*, which is a one-time setup step:

> ⚠️ **The app ships with a starter list of ~191 plugins that belong to the original
> author, not to you.** Until you replace it, the AI will confidently recommend plugins you
> don't own. Settings shows a warning banner until you do. See
> [Setting your plugin list](#setting-your-plugin-list).

- **Export** — share a genre as a JSON pack, or as a Markdown chapter for offline reading.
- **📦 Import pack** — merge someone else's recipe pack into your cookbook.

---

## 11. Tools menu

Seven reference tabs live behind **🧰 Tools ▾**:

| Tab | What it holds |
|---|---|
| 🎸 **Top Guitar/Bass Presets** | Curated amp/pedal starting points |
| 🔌 **Hardware, Routing & Logic** | Patchbay layout, interface routing, DAW scripts |
| 🔗 **Web Tools & Intel** | Your link database of external tools, tagged and searchable |
| 🎚️ **Channel Settings** | The chains you *actually deployed* on a specific song |
| 🎛️ **Tone DB** | Tagged tone/patch combos with photos and audio references |
| 🧰 **Toolbox** | The utility collection — see below |
| 📝 **Notes Vault** | Context-aware scratchpad with `[TODO]` checklist support |

> **Cook Book vs Channel Settings** is the distinction worth internalizing: the Cook Book
> holds the *theoretical ideal* chain for a genre; Channel Settings records what you
> *actually used* on a particular song. One is the recipe, the other is the receipt.

**Tone DB** is where hardware lives — synth patches, pedalboard states, amp settings. Snap
a photo of the knob positions and attach it, so a sound is never lost to "I'll remember."

---

## 12. Toolbox

Grouped into categories. Pick a category to expand it.

**🎵 Theory & Ear** — Circle of Fifths, scale & mode helper, key detector (from chords),
Nashville number chart, harmonic mixing (Camelot wheel), interval ear trainer, progression
player, note ↔ frequency, chord progression book, chord diagram library (tap to hear it
strummed), fretboard scale explorer, transpose & capo.

**🧮 Calculators** — BPM/delay/LFO times, loudness (LUFS) targets, frequency collision map,
reverb & pre-delay recommender, mic 3:1 & SPL falloff, file-size/record-time, level and dB
converters.

**🥁 Players & Practice** — metronome, tuner, beat sketch (16-step drum sequencer with
swing, accents, presets, and MIDI export), melody sketchpad (playable keyboard, record a
lick, export MIDI), practice routine and timer.

**🎙️ Monitoring & Room** — test-tone and noise lab (sine/white/pink/sweep), ear-fatigue
break timer.

**🔬 Mix Analyzer** — spectrum analyzer (RTA) for spotting room resonances and tuning
monitors.

**✨ Creative Sparks** — shuffle a challenge (random recipe + tempo + key + constraint),
vibe roulette (Oblique-Strategies-style prompt cards).

**🤖 AI Assistant** — AI Studio Brain (ask anything about production, theory, or gear;
chords from a mood; reimagine a recipe in a new genre; mix feedback from a description),
and the AI Music-Prompt Generator with a link to Google Flow.

**📊 Studio Analytics** — activity heatmap, achievements, studio graph (tracks ↔ tones ↔
recipes), cold-storage report of things you haven't touched in 90+ days.

**🗂️ Studio Ops** — gear maintenance log (strings, tubes, batteries, with days-since),
sample/loop index, release checklist, collaborators & credits, REAPER track template
export.

---

## 13. Settings

- **SPL gauge + test tone** — play pink noise and calibrate against a real SPL meter, both
  on the same screen so the tone doesn't stop when you navigate away.
- **AI co-pilot setup** — [section 3](#3-setting-up-the-ai-co-pilot).
- **Google Drive sync** — [section 4](#4-setting-up-google-drive-sync).
- **Portable settings** — [section 5](#5-moving-your-setup-to-another-device).
- **Accounting ledger** — real API spend, weekly / monthly / lifetime.
- **Owned plugins** — per-device plugin lists, folder scanning, coverage check. See below.
- **Data vault & theme** — full export, and UI accent cycling.

### Setting your plugin list

This is the single most valuable five minutes you can spend in Settings, because the AI Kit
generator is only allowed to name plugins from this list.

**The app ships with a starter list of ~191 plugins belonging to the original author.** It's
there so the feature does something out of the box, not because it describes your rig. A
warning banner sits above the list until you replace it.

Go to **⚙️ Settings → Owned Plugins → ✎ EDIT LIST**. You can type names one per line, but the
fast way is to let your computer list them for you. Open **🔍 SCAN MY PLUGIN FOLDERS**, copy
the command for your OS, run it in a terminal, and paste the output straight in:

**macOS** (VST3, AU, VST)
```bash
ls -1 /Library/Audio/Plug-Ins/VST3 ~/Library/Audio/Plug-Ins/VST3 \
      /Library/Audio/Plug-Ins/Components ~/Library/Audio/Plug-Ins/Components \
      /Library/Audio/Plug-Ins/VST ~/Library/Audio/Plug-Ins/VST 2>/dev/null \
  | sed 's/\.[^.]*$//' | sort -u
```

**Windows** (PowerShell)
```powershell
Get-ChildItem "C:\Program Files\Common Files\VST3","C:\Program Files\VSTPlugins","C:\Program Files\Steinberg\VSTPlugins" -Recurse -Include *.vst3,*.dll -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty BaseName | Sort-Object -Unique
```

**Linux**
```bash
ls -1 ~/.vst3 /usr/lib/vst3 /usr/local/lib/vst3 ~/.vst /usr/lib/vst /usr/local/lib/vst 2>/dev/null \
  | sed 's/\.[^.]*$//' | sort -u
```

**You don't need to tidy the output first.** Paste it raw — full paths, `.vst3` /
`.component` / `.dll` extensions, and the folder-header lines `ls` prints are all stripped
automatically, and a plugin that appears as both a VST3 and an AU is merged into one entry.
A live count under the box shows how many it detected.

Then:

| Button | What it does |
|---|---|
| **SAVE LIST** | Replaces your list with exactly what's in the box |
| **+ MERGE** | Adds what's in the box to your existing list (for a second plugin folder, or a new purchase) |
| **EMPTY BOX** | Clears the box so you can paste a fresh list from scratch |

Once you save, your list is marked as your own and **no future update will ever add the
bundled plugins back into it**. Adjust it by hand any time — the scan is a shortcut, not a
requirement.

> The scan commands only *list filenames*. Nothing is uploaded, and the app never runs them
> for you — you run them yourself and paste the result.

#### More than one machine? Each keeps its own list

A studio desktop and a travel laptop don't have the same plugins installed, so Euterpe keeps
**a separate list per device**. Every list travels in your vault, so all your machines can
see all of them — but each device *uses* its own.

That means there is nothing to be careful about. Scan each machine once, and from then on
the AI Kit generator only ever names plugins that are installed on the machine you're
actually sitting at.

| Device | What happens |
|---|---|
| **Studio Mac** | Scan → **SAVE LIST**. Writes to the Mac's list only. |
| **Travel laptop** | Scan → **SAVE LIST**. Writes to the laptop's list only — your Mac's is untouched. |
| **Phone / tablet** | Nothing to do. Nothing to scan, so it automatically borrows your biggest list (usually your main rig). |

In **⚙️ Settings → Owned Plugins** you'll find:

- **💻 THIS DEVICE** — name this machine ("Studio Mac", "Travel Laptop") so you can tell the
  lists apart. The name is stored on this device only and never syncs.
- **USE THE PLUGIN LIST FROM** — normally your own. Point a phone at your main rig here, or
  temporarily plan a session against the laptop's smaller set.
- A list of every device you've scanned, with plugin counts and dates. You can **DEL** any
  machine's list except the one you're on — handy when you retire a computer.

**To re-scan a machine**, just run the command again and **SAVE LIST** — it replaces that
device's list. Use **+ MERGE** when you've installed something new and want to add to what's
already there rather than start over.

> Upgrading from an earlier version? Your existing list becomes this device's list
> automatically. Nothing to redo.

**🔍 CHECK** compares your list against everything you've written in recipes, tones and
tracks, and shows which owned plugins you've never actually referenced — useful for
spotting gear you forgot you had.

---

## 14. Your data — storage, backup, privacy

**Where it lives**
- Everything you create — songs, lyrics, recipes, tones, notes, logs, settings — is in your
  browser's **localStorage**.
- Audio (voice memos, tone references) is in **IndexedDB**.
- None of it is in the app's repository, and none of it passes through any server of ours.

**Backups — use more than one**
- **VAULT** (header) — full JSON export of everything. Do this regularly.
- **BACKUP / RESTORE** (header) — manual file backup, independent of Drive.
- **Encrypted backup** — passphrase-encrypt the whole vault (AES-GCM) to a `.fenc` file.
- **Google Drive sync** — automatic, if configured.

> **Clearing your browser data will delete everything.** localStorage is not permanent
> storage. Export a vault backup, or set up Drive sync, or both. Do it before you need it.

**Credentials**
- API keys, HA tokens, and your Google Client ID are stored **only** in this browser's
  localStorage and are **never committed** to the repository.
- They are stored unencrypted, as browser app settings normally are — so don't set them up
  on a shared or public computer.
- The only data that leaves your device is the request text you send, to the provider you
  configured.

---

## 15. Troubleshooting

**"I updated the app but don't see the changes."**
It's a PWA with an aggressive cache. Hard-refresh (Ctrl/Cmd + Shift + R). The version
number in the tab title tells you which build you're on.

**AI says "Network/CORS blocked."**
The endpoint refused a browser request. If it's a local server, allow this page's origin in
that server's CORS settings. If it's Home Assistant, add your origin to
`cors_allowed_origins` and restart HA. If the page is on `https://` and the endpoint is
`http://`, the browser blocks it — that's mixed content, not a bug.

**AI says "bad key" (401).**
The key is wrong, expired, or from the wrong provider. Remember: blank means *keep the
stored key*, so if you meant to replace it, make sure you actually typed the new one.

**AI says "rate limited" (429).**
Free tiers run out. The message includes the provider's own detail, including whether it's
a per-minute limit (wait a moment) or a daily one (wait hours).

**Drive won't connect.**
Check that the origin you're on is listed in your OAuth client's **Authorized JavaScript
origins** — it must match exactly, including `https://` and any subpath. Also confirm your
Google account is added under **Test users** on the consent screen.

**Drive says disconnected after an update.**
Paste your Client ID into **⚙️ Settings → GOOGLE DRIVE SYNC** again and save.

**Everything vanished.**
Browser data was cleared. Restore from your most recent VAULT export, `.fenc` backup, or
Drive. If you have none of those, it's gone — this is why section 14 is emphatic.

---

## 16. Running your own copy

Everything is per-user by design, so a fork needs **no code edits**.

1. Fork the repository.
2. Enable GitHub Pages: **Settings → Pages → Source: `main` / `/ (root)`**.
3. Open `https://<your-username>.github.io/<repo>/`.
4. Fill in **⚙️ Settings** — an AI provider key, and optionally a Google OAuth client ID.

That's it. Your keys, your Drive, your vault.

**Running locally** — service workers need a secure context, so serve it rather than opening
the file directly:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Running on `http://localhost` is also the easiest way to use a **local** AI model, since
there's no https→http mixed-content restriction to work around.

**If you're modifying the code:** bump `window.APP_VERSION` in `js/00-bootstrap.js` **and**
`CACHE_VERSION` in `service-worker.js` together — keep the two numbers identical, or
installed clients will keep serving a stale copy.

---

## 17. The honest bit

This is a personal project shared because it might be useful to someone else, not a product
with a support desk behind it. A few things worth being straight about:

**It's provided as-is.** No warranty, no guarantees, express or implied. It's built and
tested against one man's setup, on his machines, with his gear, his plugins, and his
providers. Yours are different. Things that behave perfectly here may behave oddly there,
and the app changes whenever there's a good reason to change it.

**You're responsible for your own API usage.** Your keys, your account, your bill. The app
shows you what it's spending in the Accounting Ledger, but nobody is standing between you
and your provider — understand your provider's pricing before you turn something loose, keep
an eye on the meter, and set spending limits at the provider if they offer them. If you
manage to spend a fortune on tokens, that's between you and your credit card.

**Don't follow it to a T.** Every recipe, chain, suggestion and generated idea is a starting
point. This is a box of ideas and tools, not a rulebook. Your ears, your room, your song.

**Your data is your problem too.** Everything lives in your browser. Clearing browser data
deletes it. Export a backup, set up Drive sync, and read
[section 14](#14-your-data--storage-backup-privacy) — that's the whole safety net and it
only works if you actually use it.

**It's open source.** Read it, fork it, change it, take the parts you like. That's the
point.

---

*Made by some guy who thinks seven dollars a week is ridiculous for a simple lyric-writing
app.*

*Open source. Free. Yours.*
