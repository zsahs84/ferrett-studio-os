# FERRETT_STUDIO_OS

Personal single-file studio HUD — recipe cookbook, tone/pedalboard rig book,
track log, hardware links, and notes. Installable as a PWA, works offline
after first load.

## Live install

Once this repo is on GitHub Pages (see below), visit the Pages URL and use
your browser's install prompt (or Add to Home Screen on iOS/Android).

## Local development

Service workers require a secure context, so opening `index.html` directly
via `file://` won't register the service worker. Serve it locally instead:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploying to GitHub Pages

1. Settings → Pages → Source: `main` branch, `/ (root)`.
2. Visit the generated `https://<username>.github.io/<repo>/` URL.
3. Install it from there.

## Notes on data

All your data (cookbook, tones, tracks, notes) lives in this browser's
localStorage, and audio reference clips live in this browser's IndexedDB —
none of it is in this repo or committed to git. Google Drive sync (if
connected) is a personal backup/sync channel between your own devices, not
tied to this repository.
