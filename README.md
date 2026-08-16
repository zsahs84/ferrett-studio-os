# Euterpe Creativity Workbench

**One HTML page that ate an entire studio.**

Song board, lyrics lab with a cut-up engine, mix-recipe cookbook, tone and
pedalboard rig book, a routing diagram of your actual gear, ~50 utilities, and an
optional AI co-pilot that runs on *your* key. No account. No server. No
subscription. No "upgrade to Pro to unlock the metronome."

Works offline. Installs like an app. Everything you make stays in your browser,
where it belongs.

> ### 🎹 [**Open it →**](https://zsahs84.github.io/ferrett-studio-os/)
> No signup. No download. No "start your free trial." It just opens.

---

> **⚠️ Public beta.** It's in daily use by its author, who would be genuinely
> upset to lose his own data, which is the strongest QA guarantee software can
> have. But it's `0.x`. **Take backups** (header → **VAULT**). If you don't take
> backups and something goes wrong, we're going to have a very awkward
> conversation about whose fault that was.

---

## Why does this exist

Because I kept losing things.

The plugin chain that made the drums finally hit. The knob positions on the synth
sitting three feet behind me. Which verse belonged to which demo. What key that
2am voice memo was in. Every one of those has evaporated on me, usually about
four days after I promised myself *I'll remember that one.*

I did not remember. I never remember. Nobody remembers.

There's a lot of great music software out there and plenty of it does *one* of
these jobs beautifully. What there isn't is a single place that does **all** of
it — where the lyric you're writing, the chain you built last week, the patch on
the synth behind you, and the tempo of the thing you hummed this morning all live
in the same place and know about each other.

So I built it. In one HTML file. Which I'm told is not how you're supposed to do
this.

Euterpe sits at the intersection of two people who happen to be the same man: a
mad-scientist web developer finding out exactly how far a single-page PWA can be
pushed before it files a complaint, and someone who's been listening to music
since the womb, can jam on a few things, and knows his way around a recording
desk. It is every *"huh, that would be useful"* thought collected over years of
making music — from first spark through tracking, mixing and producing — crammed
into one page like a clown car.

### The sincere part

I grew up a poor kid who wanted an instrument. I spent my twenties and thirties
as a poor musician with gear held together by tape, learning to save money every
way I could. I've been one of you for decades.

I'm finally in a position to give something back to the thing I've loved most my
whole life. If this is useful to one person, or knocks something loose for
somebody staring at a blank page at 2am, that's the whole point. That's it.
That's the business model.

**Made with love by a producer, writer, engineer, musician and programmer — for
producers, writers, engineers, musicians and programmers.**

And treat everything it hands you as a **starting point, not gospel**. The
recipes, the suggestions, the AI output — all of it is a jumping-off point. If it
disagrees with your ears, **your ears win.** Your ears have always won. This is a
web page.

---

### 📖 [**Read the User Guide →**](USER_GUIDE.md)

That's the real documentation — every screen, every setting, what the AI actually
costs, and how to not shoot yourself in the foot. This README is the trailer.

---

## Contents

- [What's inside](#whats-inside)
- [Install & run](#install--run)
- [AI Co-Pilot — bring your own key](#ai-co-pilot--bring-your-own-key)
- [Google Drive sync — bring your own Drive](#google-drive-sync--bring-your-own-drive)
- [Your plugin list](#your-plugin-list)
- [Data, privacy & backups](#data-privacy--backups)
- [Forking this for yourself](#forking-this-for-yourself)
- [Two version numbers, on purpose](#two-version-numbers-on-purpose)
- [The honest bit](#the-honest-bit)

---

## What's inside

| Area | What it's for |
|---|---|
| 🚀 **Home** | Session starter, stats, idea catcher, voice memos, activity heatmap |
| 🗂️ **Song Board** | Kanban per song, arrangement timeline, structures, setlists |
| 🎤 **Lyrics Lab** | Writing, cut-up engine, rhyme + synonym finder, rhyme-scheme analysis, AI co-pilot, finalize, synced `.LRC` export |
| 📖 **Cook Book** | Genre mix recipes and the AI Kit generator — locked to plugins you actually own |
| 🧰 **Tools** | Guitar/bass presets, your rig's routing diagram, link database + script arsenal, Channel Settings, Tone DB, Toolbox, Notes Vault |
| ⚙️ **Settings** | AI providers, Drive sync, plugin lists, spend ledger, backup, theme |

The **Toolbox** alone holds ~50 utilities: theory and ear training, calculators,
a metronome, a tuner, a 16-step drum sequencer and a melody sketchpad (both
export MIDI), monitoring and room tools, a spectrum analyzer, creative sparks,
studio analytics, and studio ops.

Yes, that's a lot for one page. I'm aware. It got away from me.

**Two things that are genuinely yours, and used to be hardcoded to my setup:**

- **The Hardware tab describes *your* rig.** Draw your patchbay and everything
  follows from it — signal paths, path recall, the A/B monitor rotation, the
  pre-export checklist. It ships seeded with my rig as a clearly-labelled
  *example to replace*, not as a suggestion that you should own a Volt 176.
- **The plugin palette is per-device.** The AI only ever names plugins you've told
  it you own, and your studio desktop and your travel laptop keep separate lists,
  because they are different computers, which the app has grudgingly accepted.

Everything in detail: the [User Guide](USER_GUIDE.md). Every change, ever:
the [Changelog](CHANGELOG.md).

---

## Install & run

**Just use it:** open the [live app](https://zsahs84.github.io/ferrett-studio-os/)
and hit your browser's install prompt (or *Add to Home Screen* on a phone). It
runs fully offline after the first load. That's the install. That's the whole
install.

**Running it locally** — service workers need a secure context, so serve it
rather than double-clicking the file:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

**Your own GitHub Pages copy:** Settings → Pages → Source: `main` / `/ (root)`,
then visit `https://<username>.github.io/<repo>/`.

> **If you change the code:** bump `window.APP_VERSION` in `js/00-bootstrap.js`
> **and** `CACHE_VERSION` in `service-worker.js`, together, to the same number.
> Forget, and installed browsers will keep cheerfully serving the old version
> while you lose an afternoon wondering why your fix didn't work. Ask me how I
> know.

---

## AI Co-Pilot — bring your own key

Every AI feature is **optional** and runs on **your own** account with whichever
provider you already pay for. No key ships with this app. Nothing is proxied
through my server, because I don't have one. Your browser talks straight to the
provider you picked.

Everything that isn't AI works with none of this configured.

Open **⚙️ Settings** and pick your poison:

| Provider | What you need | Get a key |
|---|---|---|
| **Home Assistant → Groq** | HA URL + long-lived token (key stays in HA secrets) | — |
| **Groq** | API key — generous free tier, absurdly fast | [console.groq.com](https://console.groq.com/keys) |
| **Google Gemini** | API key — free tier, big responses | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **Claude** | API key — best writing of the bunch | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenAI** | API key | [platform.openai.com](https://platform.openai.com/api-keys) |
| **DeepSeek** | API key — very cheap | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **OpenRouter** | One key, hundreds of models behind it | [openrouter.ai](https://openrouter.ai/keys) |
| **Local / Custom** | Ollama, LM Studio, vLLM — free, private, works on a plane | — |

Each provider keeps its own key and model, so store several and switch freely.
Saved keys are masked — leave the field blank to keep the existing one. Hit
**TEST CONNECTION** and it prints back what the model actually said, so you know
it works rather than hoping.

**What it costs:** it bills to *your* account at *your* provider's rates. On
Gemini Flash mine have run from a fraction of a cent up to twenty-something cents
for the really big ones. Yours will differ — your provider, your model, your
prompt length. The built-in **Accounting Ledger** shows real spend by week, month
and lifetime, so read that instead of guessing and then being surprised. Keeping
it cheap: [the guide](USER_GUIDE.md#what-it-actually-costs).

**Two browser gotchas that will otherwise eat an hour of your life:** some
endpoints refuse browser requests outright (Claude is handled for you; a local
server needs this page's origin in its CORS settings), and a page served over
`https://` can only talk to `https://` endpoints. That's the browser's rule, not
mine, and it is not negotiable no matter how firmly you refresh.

### Moving your setup between devices

**⚙️ Settings → 🔑 EXPORT** writes your provider keys and Drive Client ID to one
small file; **IMPORT** restores them on a new phone or machine in one step.

That file contains **real API keys in plain text**. Treat it like a key, because
it is one. Your songs and lyrics aren't in it — the vault has its own backup.

---

## Google Drive sync — bring your own Drive

Optional, and it points at **your** Drive using **your** Google Cloud OAuth
client. No client ID is bundled — a Google OAuth client only works from the
origins listed on it, so a fork couldn't reuse someone else's even if it wanted
to. Skip it entirely and the app still works completely offline; you just don't
get cross-device sync.

**⚙️ Settings → ☁ GOOGLE DRIVE SYNC** walks you through creating the client and
prints the exact origin to authorize, so you can copy it rather than typo it.
Full steps in [the guide](USER_GUIDE.md#4-setting-up-google-drive-sync).

Only the **`drive.file`** scope is requested — the app can see the files it
created and nothing else in your Drive. It is not interested in your tax
documents.

---

## Your plugin list

The AI Kit generator only names plugins from your **owned-plugins list**, so the
chains it builds are things you can actually load — rather than a beautiful
signal chain built entirely from a $3,000 bundle you don't have.

**The app ships with a starter list belonging to me**, which is useless to you.
Replace it: **⚙️ Settings → Owned Plugins → ✎ EDIT LIST**. There are copyable
one-line scan commands for macOS, Windows and Linux — run one, paste the raw
output in, and paths, file extensions and duplicates all get cleaned up
automatically. You do not have to tidy it. That's the app's job.

Each machine keeps **its own list**, because your studio desktop and your travel
laptop don't have the same plugins installed, and scanning one should never
silently overwrite the other. A phone borrows your main rig's list, since nobody
is mixing on a phone. Details in
[the guide](USER_GUIDE.md#setting-your-plugin-list).

---

## Data, privacy & backups

The short version: **it's all yours, it's all local, and I can't see any of it.**

- Everything you create — cookbook, tones, tracks, notes, lyrics, beats, logs,
  settings — lives in **your browser's localStorage**. Audio (tone references,
  voice memos) lives in **IndexedDB**. None of it is in this repo and none of it
  reaches me.
- **Drive sync**, if you turn it on, uses your own OAuth client and your own
  Drive. It's a private channel between your own devices, not tied to this repo
  or to whoever you forked from.
- **Backups**: grab a JSON backup from the header any time, or make a
  passphrase-**encrypted** `.fenc` backup (AES-GCM) if you're feeling spicy.
- **Your credentials** — API keys, HA token, Google Client ID — are stored
  **only** in your browser's localStorage and are **never committed**. They're
  held unencrypted, the way browser-local app settings normally are, so don't set
  this up on a shared or public computer. The only thing that ever leaves your
  device is the request text you send, to the provider you chose.
- **No telemetry. No analytics. No tracking pixels. No "anonymous usage data."**
  I genuinely do not know you're using this, and I'm at peace with that.

> ### ⚠️ Clearing your browser data deletes everything.
> Not "resets some settings." **Everything.** Export a backup, or turn on Drive
> sync, or both — *before* you need it. This is the one warning in this document
> I'm not being funny about.

---

## Forking this for yourself

Everything is per-user by design, so a fork needs **zero code edits**:

1. Fork the repo, enable GitHub Pages (Settings → Pages → `main` / root).
2. Open your copy, fill in **⚙️ Settings** — an AI provider key, optionally a
   Google OAuth client ID, and your own plugin list.

That's it. Your keys, your Drive, your vault, your problem. (Affectionately.)

---

## Two version numbers, on purpose

Yes, there are two. No, it's not a mistake. They answer different questions.

| Where you see it | Looks like | What it's telling you |
|---|---|---|
| Git tags / releases | `v0.1.0-beta.1` | **Which release you're on.** Standard SemVer — the leading `0` is the universal signal for "this is young and things may move." |
| Tab title & header | `v164` | **Whether your browser has the newest files.** A build counter tied to the service-worker cache name, bumped every time anything ships. |

Quote the **release** number when reporting a bug. Quote the **build** number
when something looks stale and you suspect your browser is lying to you. It
usually is.

---

## The honest bit

Provided **as-is**, no warranty, built and tested against one man's setup. Your
machines, gear, plugins and providers are all different from mine, and results
will vary accordingly.

AI features bill to **your** account at **your** provider's rates. The Accounting
Ledger shows real spend, but understand your provider's pricing and set spending
limits *there* before turning anything loose. Your keys, your bill, your
overdraft.

Everything lives in your browser, so clearing browser data deletes it. I've now
said this three times. Please export a backup.

Full details in [the user guide](USER_GUIDE.md#17-the-honest-bit).

---

*Made by some guy who thinks seven dollars a week is ridiculous for a simple
lyric-writing app, and who has now spent vastly more than seven dollars a week
of his own time proving the point.*

**Open source. Free. Yours.**
