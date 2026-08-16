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

> **Status: public beta.** It's in daily use by its author and stable enough to
> trust with your work — but back up (header → **VAULT**) like you would with
> anything at `0.x`.

### Two version numbers, on purpose

| Where | Looks like | What it means |
|---|---|---|
| Git tags / releases | `v0.1.0-beta.1` | The **release**. Standard SemVer — the leading `0` says the shape of things can still change. |
| Tab title & header | `v164` | The **build**. A monotonic counter shared with the service-worker cache name, bumped on every shipped change so returning browsers pick up new files instead of a stale cache. |

They answer different questions — *which release am I on* versus *is my browser
running the newest files* — so both are kept. Quote the release number when
reporting a bug, and the build number if something looks stale.

There's a lot of great music software out there, and plenty of it does one of
these jobs very well. What there isn't is a single place that does *all* of it —
where the lyric you're writing, the chain you built last week, the patch on the
synth behind you, and the tempo of the idea you hummed this morning all live
together.

Euterpe sits at the intersection of two people who happen to be the same man: a
mad-scientist web developer seeing how far a single-page PWA can be pushed, and
someone who's been listening to music since the womb, can jam on a few things,
and knows his way around a recording desk. It's every *"huh, that would be
useful"* thought collected over years of making music, from first spark through
tracking, mixing and producing — built into one page.

**Made with love by a producer, writer, engineer, musician and programmer — for
producers, writers, engineers, musicians and programmers.**

I grew up a poor kid who wanted an instrument. I spent my twenties and thirties
as a poor musician with gear held together by tape, learning to save money every
way I could. I've been one of you for decades.

I'm finally in a position to give something back to the thing I've loved most my
whole life. If it's useful to even one person, or knocks something loose
creatively for somebody staring at a blank page, that's the whole point.

Treat what it gives you as **starting points, not gospel**. Your ears win.

### 📖 [**Read the User Guide →**](USER_GUIDE.md)

The guide is the real documentation: what everything does, how to set up AI and
Drive sync, per-device plugin lists, what the AI actually costs, and a
walkthrough of every screen. This README is just the short version.

---

## Contents

- [What's inside](#whats-inside)
- [Install & run](#install--run)
- [AI Co-Pilot — bring your own key](#ai-co-pilot--bring-your-own-key)
- [Google Drive sync — bring your own Drive](#google-drive-sync--bring-your-own-drive)
- [Your plugin list](#your-plugin-list)
- [Data, privacy & backups](#data-privacy--backups)
- [Forking this for yourself](#forking-this-for-yourself)
- [The honest bit](#the-honest-bit)

---

## What's inside

| Area | What it's for |
|---|---|
| 🚀 **Home** | Session starter, stats, idea catcher, voice memos, activity heatmap |
| 🗂️ **Song Board** | Kanban tracking per song, arrangement timeline, structures, setlists |
| 🎤 **Lyrics Lab** | Writing, cut-up engine, rhyme/synonym finder, rhyme-scheme analysis, AI co-pilot, finalize + synced `.LRC` export |
| 📖 **Cook Book** | Genre mix recipes and the AI Kit generator, restricted to plugins you own |
| 🧰 **Tools** | Guitar/bass presets, your rig's routing diagram, link database + script arsenal, Channel Settings, Tone DB, Toolbox, Notes Vault |
| ⚙️ **Settings** | AI providers, Drive sync, plugin lists, spend ledger, backup, theme |

The **Toolbox** alone holds ~50 utilities across theory & ear training,
calculators, players & practice (metronome, tuner, 16-step drum sequencer,
melody sketchpad — all with MIDI export), monitoring & room, a spectrum
analyzer, creative sparks, studio analytics, and studio ops.

Two things worth knowing up front, because both used to be hardcoded to one person's setup
and are now yours:

- **The Hardware tab describes your rig.** Everything on it — signal paths, path-recall,
  the A/B monitor rotation, the pre-export checklist — is derived from the patchbay diagram
  you draw. It ships seeded with the author's rig as a clearly-labelled *example to replace*.
- **The plugin palette is per-device.** The AI only ever suggests plugins you told it you own,
  and each machine keeps its own list.

Full detail for every one of these is in the [User Guide](USER_GUIDE.md), and the
release-by-release history is in the [Changelog](CHANGELOG.md).

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

> After any change, bump `window.APP_VERSION` in `js/00-bootstrap.js` **and**
> `CACHE_VERSION` in `service-worker.js` together — keep the two identical, or
> installed clients keep serving a stale copy.

---

## AI Co-Pilot — bring your own key

Every AI feature is **optional** and runs on **your own** account with whichever
provider you already pay for. No API key ships with this app, and nothing is
proxied through anyone else's server — your browser talks straight to the
provider you pick. Everything that isn't AI works without any of this.

Open **⚙️ Settings** and pick a connection:

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

**Cost:** calls bill to your account at your provider's rates. In the author's
use on Gemini Flash they've run from a fraction of a cent up to around
twenty-something cents for the big ones. Yours will differ. The built-in
**Accounting Ledger** shows your real spend by week, month and lifetime — read
that rather than guessing, and see
[the guide](USER_GUIDE.md#what-it-actually-costs) for how to keep it low.

**Two browser gotchas:** some endpoints refuse browser requests (Claude is
handled for you; a local server needs this page's origin in its CORS settings),
and a page on `https://` can only reach `https://` endpoints.

### Moving your setup between devices

**⚙️ Settings → 🔑 EXPORT** writes your provider keys and Drive Client ID to one
small file; **IMPORT** restores them in a single step on a new phone or machine.
It contains real API keys in plain text, so keep it private. Your songs and
lyrics are *not* in it — the vault has its own backup.

---

## Google Drive sync — bring your own Drive

Drive sync is optional and points at **your** Drive, using **your** Google Cloud
OAuth client. No client ID is bundled — a Google OAuth client only works from
the origins listed on it, so a fork could never reuse someone else's. Without it
the app still works fully offline; you just don't get cross-device sync.

**⚙️ Settings → ☁ GOOGLE DRIVE SYNC** walks you through creating the OAuth
client and prints the exact origin to authorize. Full steps in
[the guide](USER_GUIDE.md#4-setting-up-google-drive-sync).

Only the **`drive.file`** scope is requested — the app sees only the files it
created, never the rest of your Drive.

---

## Your plugin list

The AI Kit generator only names plugins from your **owned-plugins list**, so
chains it builds are things you can actually load.

**The app ships with a starter list belonging to the original author** — replace
it with yours under **⚙️ Settings → Owned Plugins → ✎ EDIT LIST**. There are
copyable one-line scan commands for macOS, Windows and Linux; run one and paste
the raw output, and paths, file extensions and duplicates are cleaned up
automatically.

Each machine keeps **its own list** — a studio desktop and a travel laptop don't
have the same plugins installed, so scanning one never overwrites the other. A
phone borrows your main rig's list. Details in
[the guide](USER_GUIDE.md#setting-your-plugin-list).

---

## Data, privacy & backups

- All content (cookbook, tones, tracks, notes, lyrics, beats, logs, settings)
  lives in this browser's **localStorage**; audio (tone refs, voice memos) lives
  in **IndexedDB**. None of it is in this repo.
- **Google Drive sync** (if connected) uses your own OAuth client and your own
  Drive — a personal backup/sync channel between your devices, not tied to this
  repository or to whoever you forked it from.
- **Backups** — download a JSON backup any time from the header, or make a
  passphrase-**encrypted** `.fenc` backup (AES-GCM).
- **AI + Drive credentials** — your API keys, HA token, and Google Client ID are
  stored **only** in this browser's localStorage and are **never committed**.
  They are held unencrypted, as browser-local app settings normally are, so
  don't set them up on a shared or public computer. The only data that leaves
  your device is the request text you send, to the provider you configured.

> **Clearing your browser data deletes everything.** Export a backup, or turn on
> Drive sync, or both — before you need it.

---

## Forking this for yourself

Everything is per-user by design, so a fork needs no code edits:

1. Fork the repo and enable GitHub Pages (Settings → Pages → `main` / root).
2. Open your copy and fill in **⚙️ Settings** — an AI provider key, optionally a
   Google OAuth client ID for Drive sync, and your own plugin list.

That's it. Your keys, your Drive, your vault.

---

## The honest bit

Provided **as-is**, no warranty. Built and tested against one man's setup — your
machines, gear, plugins and providers are different, and results will vary.

AI features bill to **your** account at **your** provider's rates; the built-in
Accounting Ledger shows real spend, but understand your provider's pricing and
set limits there before turning anything loose. Your keys, your bill.

Everything lives in your browser, so clearing browser data deletes it — export a
backup or turn on Drive sync. Full details in
[the user guide](USER_GUIDE.md#17-the-honest-bit).

---

*Made by some guy who thinks seven dollars a week is ridiculous for a simple
lyric-writing app.*

**Open source. Free. Yours.**
