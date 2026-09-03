/* ============================================================================
   ZenOS Bridge — pushes Euterpe's truth into Home Assistant so Donita can read it.

   PRIVATE EXPERIMENTAL BUILD. This file lives on the `ha-bridge` branch and must
   never be merged to main: the public README promises "no server / everything
   stays in your browser", which is true of the shipped app and has to stay true.

   Two destinations behind one Home Assistant script:
     stack=cabinet → script.zen_dojotools_filecabinet → a ZenOS cabinet (128 KB cap)
     stack=wiki    → the same script routes on to zen_sutra_wikijs

   Everything below was verified against the LIVE system (FileCabinet v6.13.0) on
   2026-09-02, not against the design doc. Where the two disagree, the live system
   won — see the FIELD NAMES and SLUGS notes.

   FIELD NAMES. The design doc used mode/cabinet/drawer_key/labels. The script does
   not have those fields. The real ones are action_type / volume_entity_id / path /
   tags. `mode` IS still read, but only as the merge strategy (merge|replace) —
   passing mode:'upsert' would work by accident and then silently stop working the
   day someone passes mode:'replace' too. We pass action_type for the verb and mode
   for the strategy, which is what the dispatcher actually expects.

   SLUGS. The cabinet slugifies every path segment with Home Assistant's own
   slugify(), whose separator is an UNDERSCORE, not a hyphen. So a song lands at
   songs/combustible_confessions. haSlug() below mirrors that exactly, so the key
   we think we wrote is the key that exists. Wiki paths are NOT slugified by the
   script, so those keep hyphens (wikiSlug) — WikiJS convention, and it keeps the
   two namespaces visually distinct.

   MERGE. upsert deep-merges by default. Every write here passes mode:'replace' so
   a drawer is exactly what we sent — otherwise deleting a field in Euterpe would
   leave it behind in the cabinet forever.
   ========================================================================== */
(function () {
  'use strict';

  var AI_KEY = 'ferrett_os_ai_v1';        // HA url + token already live here — don't ask twice
  var KEY = 'ferrett_os_zenos_v1';
  var SVC = 'zen_dojotools_filecabinet';  // domain ('script') is now passed separately to callService
  var CAB_LIMIT = 131072;                 // hard cap per cabinet, enforced by the sensor itself

  var DEFAULTS = {
    enabled: false,
    cabinet: 'sensor.zenos_expansion_cabinet_1',
    wiki: true,
    wikiRoot: '/music',
    autoSync: false,
    lastSync: 0,
    hashes: {},        // drawer path -> content hash, so a re-sync only writes what changed
    wikiHashes: {},
    // Backup net: independent of the cabinet/wiki mirror above. autoBackup governs a
    // periodic Drive + local-HA snapshot of the raw vault, so a Drive outage or a bad
    // mirror sync is never the only copy of the data.
    autoBackup: true,
    lastBackupAt: 0,
    lastBackupRev: -1  // -1, not 0, so a vault whose driveSyncMeta.localRev is genuinely
                        // 0 (nothing ever saved this session) still gets one backup rather
                        // than looking identical to "already backed up".
  };

  /* ---------------------------------------------------------------- config */

  function aiCfg() {
    try { return JSON.parse(localStorage.getItem(AI_KEY) || '{}'); } catch (e) { return {}; }
  }
  function cfg() {
    var c;
    try { c = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { c = {}; }
    var out = {};
    for (var k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) out[k] = DEFAULTS[k];
    for (var j in c) if (Object.prototype.hasOwnProperty.call(c, j)) out[j] = c[j];
    return out;
  }
  function saveCfg(next) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {
      // Hash maps are a cache, never truth. Losing them means the next sync writes
      // everything again, which is correct-but-slow — not worth an alert().
      console.warn('[zenos] could not persist bridge config:', e && e.message);
    }
  }
  function patchCfg(patch) {
    var c = cfg();
    for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) c[k] = patch[k];
    saveCfg(c);
    return c;
  }
  function configured() { return !!auth(); }
  function authSource() { var a = auth(); return a ? a.source : null; }

  /* ----------------------------------------------------------------- slugs */

  // Mirror of Home Assistant's slugify() — lowercase, non-alphanumerics collapse to
  // a single underscore, no leading/trailing separator. Verified against the live
  // template engine for every genre, song and recipe name in the current vault.
  function haSlug(s) {
    var t = String(s == null ? '' : s);
    if (t.normalize) t = t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    t = t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return t || 'untitled';
  }
  // Wiki paths are passed through untouched, so they use the hyphen convention.
  function wikiSlug(s) {
    var t = String(s == null ? '' : s);
    if (t.normalize) t = t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    t = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return t || 'untitled';
  }

  /* ------------------------------------------------------------- transport */

  // When this build is served from Home Assistant's own /local/, the page is the
  // SAME ORIGIN as the API — which means the HA frontend's own credentials are
  // already sitting in localStorage on this very origin, under `hassTokens`.
  // localStorage is per-origin, so the mere presence of that key is proof we are
  // on an HA origin: borrow the session and there is no URL and no long-lived
  // token to enter at all. Same trick /local/retirement.html uses.
  //
  // The access token is short-lived. This deliberately does NOT try to refresh it
  // — if it is close to expiry we fall through to whatever is configured manually,
  // and if that is empty the caller gets told to reload the HA page, which mints
  // a fresh one. A sync is a foreground action a human just clicked; silently
  // half-authenticating through a token refresh dance is not worth the code.
  function hassAuth() {
    try {
      var raw = localStorage.getItem('hassTokens');
      if (!raw) return null;
      var t = JSON.parse(raw);
      if (!t || !t.access_token) return null;
      if (t.expires && Date.now() > (t.expires - 60000)) return null;
      return { base: '', token: t.access_token, source: 'ha-session' };
    } catch (e) { return null; }
  }

  // Borrowed HA session first, manually entered url+token second.
  function auth() {
    var h = hassAuth();
    if (h) return h;
    var a = aiCfg();
    if (a.url && a.token) return { base: String(a.url).replace(/\/+$/, ''), token: a.token, source: 'manual' };
    return null;
  }

  // A plain call_service cannot return a response variable; the REST endpoint with
  // ?return_response can. That is the only reason this whole design works from a
  // browser, and it's the same hop the AI relay in 08-ai-settings.js already proved.
  //
  // Generic underneath — any HA service, not just FileCabinet — because the local backup
  // write (pyscript.euterpe_write_backup) needs the exact same borrowed-session transport
  // but is a plain fire-and-log service with no response body to check.
  function callService(domain, service, params, timeoutMs, wantResponse) {
    var a = auth();
    if (!a) return Promise.reject(new Error(
      localStorage.getItem('hassTokens')
        ? 'Your Home Assistant session has expired — reload this page from HA and try again.'
        : 'No Home Assistant session on this origin. Open this build from Home Assistant (/local/euterpe/), or set an HA URL + token in \u2699 setup.'));
    var base = a.base;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 45000);
    var qs = wantResponse === false ? '' : '?return_response';

    return fetch(base + '/api/services/' + domain + '/' + service + qs, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + a.token },
      body: JSON.stringify(params || {})
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('HA ' + res.status + (
          res.status === 401 ? ' — token rejected (reload this page from HA to refresh the session)' :
          res.status === 400 ? ' — ' + domain + '.' + service + ' rejected the call' :
          res.status === 404 ? ' — ' + domain + '.' + service + ' not found' : ''));
      }
      // A service call made without ?return_response still gets a 200 with a body (the
      // list of changed states), but nothing here needs it — swallow a parse failure
      // rather than fail a write that HA already accepted. res.json() reads the response
      // stream, so it can only be called once here, not probed and then called again.
      return res.json()['catch'](function () { return {}; });
    })['catch'](function (e) {
      if (e && e.name === 'AbortError') throw new Error('Home Assistant timed out');
      throw e;
    }).then(function (v) { clearTimeout(timer); return v; }, function (e) { clearTimeout(timer); throw e; });
  }

  function call(params, timeoutMs) {
    return callService('script', SVC, params, timeoutMs).then(function (data) {
      var r = (data && data.service_response) || data || {};
      // FileCabinet reports its own failures inside a 200. not_found is a legitimate
      // answer to a read, so it is passed through rather than thrown.
      var st = r.status;
      if (st && st !== 'success' && st !== 'ok' && st !== 'not_found') {
        throw new Error(r.message || ('FileCabinet: ' + st));
      }
      return r;
    });
  }

  function upsertDrawer(d) {
    var body = {
      action_type: 'upsert',
      mode: 'replace',
      stack: 'cabinet',
      volume_entity_id: cfg().cabinet,
      path: d.path,
      title: d.title || d.path,
      value: d.value
    };
    if (d.tags && d.tags.length) { body.tags = d.tags.join(','); body.create_label = true; }
    return call(body);
  }

  // upsert's tag handling is ADDITIVE: it adds the drawer to each label you pass and
  // never removes it from the ones you didn't. Change a song from tracking to mixing
  // and it stays filed under status_tracking forever, so "what's in flight?" answers
  // with a song that shipped. relabel is the authoritative one — it strips the drawer
  // out of every label first, then re-files it under exactly the tags given.
  // It only files under labels that already exist in the registry, which is why the
  // upsert (with create_label) has to run first.
  function relabelDrawer(d) {
    return call({
      action_type: 'relabel', stack: 'cabinet',
      volume_entity_id: cfg().cabinet, path: d.path,
      tags: (d.tags || []).join(',')
    });
  }

  function upsertPage(p) {
    return call({
      action_type: 'upsert',
      mode: 'replace',
      stack: 'wiki',
      path: p.path,
      title: p.title,
      description: p.description || '',
      value: p.content,
      tags: (p.tags || []).join(',')
    }, 60000);
  }

  function getDrawer(path) {
    return call({ action_type: 'get', stack: 'cabinet', volume_entity_id: cfg().cabinet, path: path });
  }
  function listDrawers(prefix) {
    return call({
      action_type: 'list', stack: 'cabinet',
      volume_entity_id: cfg().cabinet, path_prefix: prefix || ''
    });
  }
  function fleet() { return call({ action_type: 'fleet', stack: 'cabinet', volume_entity_id: cfg().cabinet }, 60000); }

  /* --------------------------------------------------------------- helpers */

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function hash(o) {
    var s = JSON.stringify(o), h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h.toString(16);
  }
  function bytes(o) { return JSON.stringify(o).length; }
  // Drop empty strings, nulls and empty collections. The cabinet is a 128 KB budget,
  // and a missing key reads exactly like an empty one when Donita opens the drawer.
  function tidy(o) {
    var out = {};
    for (var k in o) {
      if (!Object.prototype.hasOwnProperty.call(o, k)) continue;
      var v = o[k];
      if (v === null || v === undefined || v === '') continue;
      if (Array.isArray(v) && !v.length) continue;
      if (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length) continue;
      out[k] = v;
    }
    return out;
  }
  function sameId(a, b) {
    // Euterpe's ids drifted between int and string across features — song.lyricsSheetId
    // is a number while the sheet's own id is a string. Compare as text or the link graph
    // silently resolves to nothing.
    return a != null && b != null && String(a) === String(b);
  }
  function truthy(v) {
    // tones[].starred is the STRING "True", not a boolean. Real value in the vault.
    return v === true || v === 1 || v === 'true' || v === 'True' || v === '1';
  }
  function db() { return (window.db && typeof window.db === 'object') ? window.db : {}; }

  /* ------------------------------------------------------- key derivation */

  function recipeKeyOf(genre, inst) {
    if (!genre || !inst) return null;
    return 'recipes/' + haSlug(genre) + '/' + haSlug(inst);
  }
  // A song's cookbookRecipes holds FROZEN COPIES of recipes — 14.5 KB of the song
  // board's 17.5 KB. We store a reference instead, resolved against the live cookbook
  // where possible so the song points at the current recipe rather than a stale snapshot.
  function recipeRefKey(ref, d) {
    if (ref == null) return null;
    var id = (typeof ref === 'object') ? ref.id : ref;
    var live = null, book = d.cookbook || [];
    for (var i = 0; i < book.length; i++) if (sameId(book[i].id, id)) { live = book[i]; break; }
    var src = live || (typeof ref === 'object' ? ref : null);
    return src ? recipeKeyOf(src.genre, src.inst) : null;
  }
  function toneRefKey(id, d) {
    var list = d.tones || [];
    for (var i = 0; i < list.length; i++) if (sameId(list[i].id, id)) return 'tones/' + haSlug(list[i].name);
    return null;
  }
  // kitId points at one VERSION inside genreKits[genre], and a genre can hold several.
  // The design doc's flat /music/kits/<genre> would have had V2 overwrite V1 on every
  // sync, so the version is part of the path and the song points at the one it uses.
  // Returns { page, resolved } — resolved is 'exact' when the song's own kitId still
  // exists, 'genre_latest' when it doesn't. Four songs in the current vault point at
  // kits that were regenerated out from under them; falling back to the genre's newest
  // kit is right, but pretending it was the exact one is not, so the drawer says which.
  function kitPage(kitId, genre, d) {
    var kits = d.genreKits || {}, g, vs, i;
    for (g in kits) {
      if (!Object.prototype.hasOwnProperty.call(kits, g)) continue;
      vs = kits[g] || [];
      for (i = 0; i < vs.length; i++) {
        if (sameId(vs[i].id, kitId)) return { page: cfg().wikiRoot + '/kits/' + wikiSlug(g) + '/v' + (i + 1), resolved: 'exact' };
      }
    }
    if (genre && kits[genre] && kits[genre].length) {
      return { page: cfg().wikiRoot + '/kits/' + wikiSlug(genre) + '/v' + kits[genre].length, resolved: 'genre_latest' };
    }
    return { page: null, resolved: null };
  }
  // A page belongs to the SHEET, not to the song. Now that one sheet can be linked to
  // several songs, deriving the path from the owning song gives a sheet as many paths
  // as it has songs while only one page actually gets written — so every song but one
  // points at nothing. Keyed on the sheet, the path is the same string no matter who
  // asks. The cheap "build it from the title" hop survives anyway: every sheet in the
  // vault is titled after its song, so this resolves to the same /lyrics/<song> path
  // it always did.
  // Two sheets CAN share a title, so the id breaks the tie — for the second one only,
  // to keep the first (and every single-sheet case) on the clean path.
  function lyricsPageFor(sheet, d) {
    var base = cfg().wikiRoot + '/lyrics/' + wikiSlug(sheet.title || 'untitled');
    var sheets = (d && d.lyrics && d.lyrics.sheets) || [];
    for (var i = 0; i < sheets.length; i++) {
      if (sameId(sheets[i].id, sheet.id)) break;
      if (wikiSlug(sheets[i].title || 'untitled') === wikiSlug(sheet.title || 'untitled')) {
        return base + '-' + String(sheet.id).slice(-6);
      }
    }
    return base;
  }

  // Sheets and songs are linked by id in BOTH directions, and the newest pair is
  // linked in neither: 'Haunted Trophies' has a song with no lyricsSheetId and a
  // sheet with no songId at all. Matching on the slugged title as a last resort
  // recovers those. It is the last resort on purpose — two songs can share a title,
  // so an explicit id always wins.
  function matchSheet(song, d) {
    var all = matchSheets(song, d);
    return all.length ? all[0] : null;
  }

  // A song can now carry MANY sheets: the original singular lyricsSheetId, plus the
  // lyricsSheetIds array the Song Board's link panel writes. Both are live at once —
  // the singular one is what older songs have and what "New lyrics" still sets — so
  // this unions them, in priority order, and de-duplicates. Reading only the singular
  // field would silently drop every sheet linked through the new panel.
  function matchSheets(song, d) {
    var sheets = (d.lyrics && d.lyrics.sheets) || [], out = [], seen = {}, i, j;
    function take(sh) {
      if (!sh || seen[sh.id]) return;
      seen[sh.id] = 1; out.push(sh);
    }
    for (i = 0; i < sheets.length; i++) if (sameId(sheets[i].id, song.lyricsSheetId)) take(sheets[i]);
    var ids = song.lyricsSheetIds || [];
    for (j = 0; j < ids.length; j++) {
      for (i = 0; i < sheets.length; i++) if (sameId(sheets[i].id, ids[j])) take(sheets[i]);
    }
    for (i = 0; i < sheets.length; i++) if (sameId(sheets[i].songId, song.id)) take(sheets[i]);
    // Title match only rescues a song that ended up with nothing at all.
    if (!out.length) {
      for (i = 0; i < sheets.length; i++) {
        if (sheets[i].title && wikiSlug(sheets[i].title) === wikiSlug(song.title)) { take(sheets[i]); break; }
      }
    }
    return out;
  }
  function matchSong(sheet, d) {
    var songs = d.songBoard || [], i, byTitle = null;
    for (i = 0; i < songs.length; i++) {
      if (sameId(songs[i].id, sheet.songId) || sameId(songs[i].lyricsSheetId, sheet.id)) return songs[i];
      if ((songs[i].lyricsSheetIds || []).length) {
        for (var j = 0; j < songs[i].lyricsSheetIds.length; j++) {
          if (sameId(songs[i].lyricsSheetIds[j], sheet.id)) return songs[i];
        }
      }
      if (byTitle === null && songs[i].title && wikiSlug(songs[i].title) === wikiSlug(sheet.title)) byTitle = songs[i];
    }
    return byTitle;
  }
  // Per-song Lyria takes are prose — one is already a 2,946-character paragraph —
  // and they grow a take at a time, so they live on the wiki, not in the 128 KB
  // cabinet. The genre-level ones stay in the cabinet: those are 400-odd characters
  // and flat. Same bucket name, two different shapes; see the note in buildCabinet.
  function promptPageFor(song, entry, i) {
    return cfg().wikiRoot + '/prompts/' + wikiSlug(song.title) + '/' + wikiSlug(entry.name || ('take-' + (i + 1)));
  }

  /* ------------------------------------------------- cabinet drawer builder */

  function buildCabinet(d) {
    var out = [], i, j;
    var now = Date.now();

    // --- songs: the hub every question routes through -----------------------
    var songs = d.songBoard || [];
    for (i = 0; i < songs.length; i++) {
      var s = songs[i];
      if (!s || !s.title) continue;
      var recipeKeys = [];
      var cr = s.cookbookRecipes || [];
      for (j = 0; j < cr.length; j++) {
        var rk = recipeRefKey(cr[j], d);
        if (rk && recipeKeys.indexOf(rk) < 0) recipeKeys.push(rk);
      }
      var toneKeys = [];
      var ti = s.toneIds || [];
      for (j = 0; j < ti.length; j++) {
        var tk = toneRefKey(ti[j], d);
        if (tk && toneKeys.indexOf(tk) < 0) toneKeys.push(tk);
      }
      var songSheets = matchSheets(s, d);
      var lyricsPages = [];
      for (j = 0; j < songSheets.length; j++) lyricsPages.push(lyricsPageFor(songSheets[j], d));
      var promptPages = [];
      for (j = 0; j < (s.lyriaPrompts || []).length; j++) promptPages.push(promptPageFor(s, s.lyriaPrompts[j], j));
      var tags = [];  // no type-flag label — path_prefix='songs/' already groups these
      if (s.status) tags.push('status_' + haSlug(s.status));
      if (s.kitGenre) tags.push('genre_' + haSlug(s.kitGenre));
      var kit = kitPage(s.kitId, s.kitGenre, d);

      out.push({
        path: 'songs/' + haSlug(s.title),
        title: s.title,
        tags: tags,
        value: tidy({
          title: s.title,
          euterpe_id: s.id,
          status: s.status,
          genre: s.kitGenre,
          bpm: s.bpm,
          length_sec: s.length,
          note: s.note,
          arrangement: s.arrangement,
          // lyrics_page is the primary sheet — the single cheap hop for "what are the
          // words". lyrics_pages only appears when a song genuinely has more than one.
          lyrics_page: lyricsPages.length ? lyricsPages[0] : null,
          lyrics_pages: lyricsPages.length > 1 ? lyricsPages : [],
          prompt_pages: promptPages,
          kit_page: kit.page,
          kit_page_resolved: kit.resolved === 'genre_latest' ? 'genre_latest' : null,
          recipe_keys: recipeKeys,
          tone_keys: toneKeys,
          track_ids: s.trackIds || [],
          updated: now
        })
      });
    }

    // --- cookbook ----------------------------------------------------------
    var book = d.cookbook || [];
    for (i = 0; i < book.length; i++) {
      var r = book[i];
      var key = recipeKeyOf(r.genre, r.inst);
      if (!key) continue;
      // "Beats: Synthetic Kick & Snare" -> inst_beats. The family is the useful
      // query axis; the full name is already in the drawer for whoever opens it.
      var fam = String(r.inst || '').split(':')[0];
      out.push({
        path: key, title: (r.genre || '') + ' — ' + (r.inst || ''),
        tags: ['genre_' + haSlug(r.genre)],  // 'recipe'/inst_ dropped — both already in the path
        // images[] is base64 in every bucket that has it. Stripped on write, kept locally.
        value: tidy({ euterpe_id: r.id, genre: r.genre, inst: r.inst, desc: r.desc, reaper: r.reaper, notes: r.notes })
      });
    }

    // --- tones -------------------------------------------------------------
    var tones = d.tones || [];
    for (i = 0; i < tones.length; i++) {
      var t = tones[i];
      if (!t || !t.name) continue;
      out.push({
        path: 'tones/' + haSlug(t.name), title: t.name,
        tags: truthy(t.starred) ? ['starred'] : [],  // 'tone'/cat_ dropped — path_prefix='tones/' covers listing
        // nam / ir are the Neural Amp Modeler profile and impulse response. Real
        // fields, searchable gold — not typos to be tidied away.
        value: tidy({
          euterpe_id: t.id, name: t.name, category: t.category, daw: t.daw,
          nam: t.nam, ir: t.ir, notes: t.notes, starred: truthy(t.starred) || undefined
        })
      });
    }

    // --- rigs: heterogeneous by design, stored whole ------------------------
    // devices, connections, annotations and monitor modes share one structure.
    // Normalising it would lose the thing that makes it a rig.
    if (d.patchbay && Object.keys(d.patchbay).length) {
      out.push({ path: 'rigs/default', title: 'Patchbay — current rig', tags: [], value: d.patchbay });
    }
    if (d.patchbayUserDefault && Object.keys(d.patchbayUserDefault).length) {
      out.push({ path: 'rigs/user_default', title: 'Patchbay — user default', tags: [], value: d.patchbayUserDefault });
    }
    var saved = d.patchbaySaved || [];
    for (i = 0; i < saved.length; i++) {
      if (!saved[i] || !saved[i].name) continue;
      out.push({
        path: 'rigs/saved/' + haSlug(saved[i].name), title: saved[i].name,
        tags: [], value: saved[i]
      });
    }

    // --- scripts: metadata only, .lua lives in ferrett-audio-tools ----------
    var scripts = d.scripts || [];
    for (i = 0; i < scripts.length; i++) {
      var sc = scripts[i];
      if (!sc || !sc.title) continue;
      out.push({
        path: 'scripts/' + haSlug(sc.title), title: sc.title,
        tags: [],  // 'script'/cat_ dropped — path_prefix='scripts/' covers listing
        value: tidy({ euterpe_id: sc.id, title: sc.title, category: sc.category, shortcut: sc.shortcut, func: sc.func, url: sc.url })
      });
    }

    // --- links -------------------------------------------------------------
    var links = d.links || [];
    for (i = 0; i < links.length; i++) {
      var l = links[i];
      if (!l || !l.title) continue;
      out.push({
        path: 'links/' + haSlug(l.title), title: l.title,
        tags: [],  // 'link'/cat_ dropped — path_prefix='links/' covers listing
        value: tidy({ euterpe_id: l.id, title: l.title, url: l.url, category: l.category, daw: l.daw, notes: l.notes })
      });
    }

    // --- plugins -----------------------------------------------------------
    if ((d.ownedPlugins || []).length) {
      out.push({
        path: 'plugins/owned', title: 'Owned plugins', tags: [],
        value: { count: d.ownedPlugins.length, names: d.ownedPlugins }
      });
    }
    if (d.pluginProfiles && Object.keys(d.pluginProfiles).length) {
      out.push({ path: 'plugins/profiles', title: 'Plugin profiles by device', tags: [], value: d.pluginProfiles });
    }

    // --- ledger, bucketed by month so it never becomes one fat drawer ------
    var acct = d.accounting || [], months = {};
    for (i = 0; i < acct.length; i++) {
      var row = acct[i];
      var dt = new Date(row.ts || 0);
      if (isNaN(dt.getTime())) continue;
      var mk = dt.getFullYear() + '_' + ('0' + (dt.getMonth() + 1)).slice(-2);
      if (!months[mk]) months[mk] = [];
      months[mk].push({ id: row.id, ts: row.ts, context: row.context, usd: row.usd });
    }
    for (var mkey in months) {
      if (!Object.prototype.hasOwnProperty.call(months, mkey)) continue;
      var rows = months[mkey], total = 0;
      for (i = 0; i < rows.length; i++) total += (Number(rows[i].usd) || 0);
      out.push({
        path: 'ledger/' + mkey, title: 'AI spend ' + mkey.replace('_', '-'),
        tags: [],  // 'ledger' flag dropped — path_prefix='ledger/' covers listing
        // Derived from token counts, not from a provider's billing API. An estimate,
        // and labelled as one here so nobody downstream reads it as a receipt.
        value: { month: mkey.replace('_', '-'), rows: rows, total_usd: Math.round(total * 1e6) / 1e6, basis: 'estimated from token counts' }
      });
    }

    // --- lyria prompts, GENRE level: a dict keyed by genre name, each holding
    // versions. There is a second, unrelated lyriaPrompts on each SONG — same
    // bucket name, different shape, an order of magnitude bigger per entry — so
    // the two are kept in separate namespaces and the song ones go to the wiki.
    var lp = d.lyriaPrompts || {};
    for (var gname in lp) {
      if (!Object.prototype.hasOwnProperty.call(lp, gname)) continue;
      var entries = lp[gname] || [];
      for (i = 0; i < entries.length; i++) {
        var e = entries[i];
        out.push({
          path: 'prompts/genre/' + haSlug(gname) + '/' + haSlug(e.name || ('take_' + (i + 1))),
          title: gname + ' — ' + (e.name || ('Take ' + (i + 1))),
          tags: ['genre_' + haSlug(gname)],  // 'prompt' flag dropped — path_prefix covers listing
          value: tidy({ euterpe_id: e.id, genre: gname, name: e.name, prompt: e.prompt, params: e.params, created_at: e.createdAt })
        });
      }
    }

    // --- producer notes ADDITIONAL box: { genre: string }, one per genre and not
    // versioned, so it can't ride along on the versioned wiki pages without being
    // duplicated across every version. Small and hand-written — it stays a drawer.
    var pne = d.producerNotesExtra || {};
    for (var xg in pne) {
      if (!Object.prototype.hasOwnProperty.call(pne, xg)) continue;
      var xtext = String(pne[xg] || '').trim();
      if (!xtext) continue;
      out.push({
        path: 'notes_extra/' + haSlug(xg),
        title: xg + ' — additional notes',
        tags: ['genre_' + haSlug(xg)],  // 'producer_notes' flag dropped — path_prefix covers listing
        value: { genre: xg, text: xtext }
      });
    }

    // --- the map, written last so it can describe what actually got built ------
    out.push(indexDrawer(out, d));

    return out;
  }

  // A self-describing index, so an agent reading this cabinet cold learns the layout
  // from one `get` instead of groping around with `list`. Generated from the drawer set
  // that was just built, never hand-maintained, so it cannot drift from the real tree.
  // Label values are the REAL ones present in the data — a vocabulary beats a pattern,
  // because "status_*" doesn't tell you that `beat` and `tracking` are the live values.
  function indexSummary(drawers) {
    var branches = {}, labels = {}, i, j, top;
    for (i = 0; i < drawers.length; i++) {
      top = drawers[i].path.split('/')[0];
      branches[top] = (branches[top] || 0) + 1;
      var tg = drawers[i].tags || [];
      for (j = 0; j < tg.length; j++) {
        var m = /^(status|genre|inst|cat)_(.+)$/.exec(tg[j]);
        var fam = m ? m[1] : tg[j];
        if (!labels[fam]) labels[fam] = [];
        if (m && labels[fam].indexOf(m[2]) < 0) labels[fam].push(m[2]);
      }
    }
    var vocab = { flags: [] };
    for (var k in labels) {
      if (!Object.prototype.hasOwnProperty.call(labels, k)) continue;
      if (!labels[k].length) { vocab.flags.push(k); continue; }
      if (k === 'cat') { vocab.cat = labels[k].length + ' values on scripts/links/tones — search, do not list'; continue; }
      vocab[k] = labels[k].sort();
    }
    vocab.flags.sort();
    return { branches: branches, vocab: vocab };
  }

  // The cabinet copy is deliberately LEAN — only what an agent needs to form a correct
  // query: where to start, which refs are cabinet keys versus wiki paths (getting that
  // wrong means trying to `get` a wiki path out of the cabinet), and the label vocabulary
  // to search on. The prose walkthrough goes to the wiki, which has no size pressure,
  // because the cabinet is the tier with 12% headroom left.
  // Cut down to a pointer, not a manual, on 2026-09-03: the full version (labels,
  // counts, the cabinet_keys/wiki_paths breakdown) cost ~1.2 KB, and the cabinet had
  // ~900 bytes free at the time — this drawer was the ONE thing that didn't fit on a
  // freshly-fixed sync. Everything that version explained is still written, just to
  // /music/index on the wiki (no size pressure there at all — see indexPage below).
  // This is deliberately small enough to never again be the reason something else
  // doesn't fit: an agent that reads it gets exactly two facts, either of which is
  // enough to get moving — the hub pattern, or where the real explanation lives.
  function indexDrawer(drawers, d) {
    var root = cfg().wikiRoot;
    return {
      path: 'index',
      title: 'Euterpe — start here',
      tags: [],
      value: {
        start_here: 'songs/<slugged-title> — the hub every song question routes through.',
        full_guide: root + '/index (stack: wiki) — tree, label vocabulary, cabinet-vs-wiki field map.'
      }
    };
  }

  // The long version. Same facts, room to explain them.
  function indexPage(drawers, d) {
    var sum = indexSummary(drawers), root = cfg().wikiRoot, lines = [];
    lines.push('# Euterpe — the music cabinet', '');
    lines.push('Everything here is written by **Euterpe Creativity Workbench**, the studio app. It is a', 'mirror: overwritten on every sync, so edits made here do not travel back.', '');
    lines.push('Cabinet: `' + cfg().cabinet + '`  ·  wiki root: `' + root + '`', '');
    lines.push('## Start at the song', '');
    lines.push('`songs/<slugged-title>` is the hub. One read gives you status, bpm, length_sec, the', 'arrangement, and references to everything else. Slugs use **underscores**: Combustible', 'Confessions is `songs/combustible_confessions`.', '');
    lines.push('## The references, and which side they live on', '');
    lines.push('| field | where |', '|---|---|');
    lines.push('| `recipe_keys` | drawer keys in this cabinet — get them directly |');
    lines.push('| `tone_keys` | drawer keys in this cabinet |');
    lines.push('| `lyrics_page` / `lyrics_pages` | **wiki** paths — the actual words |');
    lines.push('| `kit_page` | **wiki** path — the genre kit |');
    lines.push('| `prompt_pages` | **wiki** paths — Lyria takes for that song |');
    lines.push('| `track_ids` | stay in the browser; nothing here to fetch |');
    lines.push('', 'Read a wiki path with the same tool, `stack: wiki`. Wiki paths use hyphens; cabinet keys', 'use underscores. `kit_page_resolved: "genre_latest"` means the exact kit that song was', 'written against no longer exists and this is the genre\'s newest instead.', '');
    lines.push('## The tree', '');
    var tree = {
      'songs/': 'One drawer per song. The hub.',
      'recipes/<genre>/<instrument>': 'Mix recipes — description, the REAPER chain, notes.',
      'tones/': 'Guitar and bass tones. `nam` and `ir` are the Neural Amp Modeler profile and impulse response — real fields, and the searchable gold here.',
      'rigs/': 'The physical studio patchbay: devices, connections, monitor modes.',
      'scripts/': 'REAPER script metadata only. The .lua files live in the ferrett-audio-tools repo; `url` points there.',
      'links/': 'Bookmarked web tools.',
      'plugins/owned': 'Every plugin he owns. `plugins/profiles` is per-device palettes.',
      'ledger/<YYYY_MM>': 'AI spend by month. Estimated from token counts — not a billing receipt.',
      'prompts/genre/<g>/<name>': 'Lyria music-generation prompts, per genre.',
      'notes_extra/<genre>': 'Free-text extra producer instructions for a genre.'
    };
    for (var t in tree) if (Object.prototype.hasOwnProperty.call(tree, t)) lines.push('- **`' + t + '`** — ' + tree[t]);
    lines.push('', '## Labels are the query layer', '');
    lines.push('Use `action_type: search` against a label instead of listing drawers. Values in use:', '');
    for (var v in sum.vocab) {
      if (!Object.prototype.hasOwnProperty.call(sum.vocab, v)) continue;
      var val = sum.vocab[v];
      lines.push('- `' + v + '` — ' + (Array.isArray(val) ? val.join(', ') : val));
    }
    lines.push('', '## What is deliberately not here', '');
    lines.push('Images and audio never leave the browser — they are base64 and would blow the 128 KB', 'cabinet cap on their own. Lyrics, genre kits and producer notes live in the wiki rather', 'than the cabinet for the same reason: they grow per item, and they want revision history.');
    return { path: root + '/index', title: 'Euterpe — the music cabinet', description: 'How the music cabinet is laid out and how to read it', tags: ['euterpe', 'index'], content: lines.join('\n') };
  }

  /* --------------------------------------------------------- wiki builders */

  // Marks the end of the round-trippable region. Anything below it is commentary for a
  // human reading the page and is never parsed back into the sheet.
  var LYRIC_FENCE = '\n---\n';

  // The wiki copy is written in the app's OWN tagged-text format, not prettier markdown,
  // so a pull is parseTaggedSongText() on this exact string — one parser, already debugged,
  // instead of a second one that drifts. sheetToTaggedText is the matching writer.
  function lyricsMarkdown(sheet) {
    var body;
    if (typeof window.lyrSheetToText === 'function') {
      body = window.lyrSheetToText(sheet);
    } else {
      // Fallback for the (impossible in practice) case where 06-lyrics-lab didn't load.
      var lines = sheet.lines || [], out = [], lastTag = null, i;
      for (i = 0; i < lines.length; i++) {
        var ln = lines[i] || {};
        var tag = ln.tag || '';
        if (tag !== lastTag) { if (out.length) out.push(''); out.push('[' + (tag || '') + ']'); lastTag = tag; }
        out.push(String(ln.text == null ? '' : ln.text).trim() || '-');
      }
      body = out.join('\n');
    }
    // A leading blockquote so someone opening the page in WikiJS knows what it is. Pull
    // strips '>' lines before parsing; a lyric starting with '>' would be lost, which has
    // never happened and is worth the warning being visible where people actually edit.
    var head = '> Managed by Euterpe. Edit the lines below and use PULL LYRICS in the app to bring\n' +
               '> them back — the app is where they live. Section headers are [Verse 1] style; a\n' +
               '> lone - is an intentional empty bar and holds the arrangement together.\n';
    var tail = '';
    var takes = sheet.takes || [];
    if (takes.length) {
      var t = ['## Takes'];
      for (var j = 0; j < takes.length; j++) {
        var tk = takes[j] || {};
        t.push('', '### ' + (tk.name || tk.title || ('Take ' + (j + 1))), String(tk.text || tk.notes || ''));
      }
      tail = LYRIC_FENCE + '\n' + t.join('\n');
    }
    return (head + '\n' + body + tail).replace(/\n{3,}/g, '\n\n').trim();
  }

  // Inverse of the above: wiki page text -> the sheet's lines[].
  function lyricsFromPage(content) {
    var text = String(content == null ? '' : content);
    var cut = text.indexOf(LYRIC_FENCE);
    if (cut >= 0) text = text.slice(0, cut);
    text = text.split(/\r?\n/).filter(function (l) { return l.trim().charAt(0) !== '>'; }).join('\n');
    if (typeof window.parseTaggedSongText !== 'function') return null;
    var parsed = window.parseTaggedSongText(text);
    return (parsed && parsed.lines) || null;
  }

  function kitMarkdown(genre, kit) {
    var out = ['# ' + genre, ''];
    if (kit.overview) { out.push(kit.overview, ''); }
    var inst = kit.instruments;
    if (inst) {
      out.push('## Instruments', '');
      if (Array.isArray(inst)) {
        for (var i = 0; i < inst.length; i++) {
          var it = inst[i] || {};
          if (typeof it === 'string') { out.push('- ' + it); continue; }
          out.push('### ' + (it.name || it.inst || ('Instrument ' + (i + 1))));
          for (var f in it) {
            if (!Object.prototype.hasOwnProperty.call(it, f)) continue;
            if (f === 'name' || f === 'inst') continue;
            var v = it[f];
            if (v == null || v === '') continue;
            out.push('- **' + f + ':** ' + (typeof v === 'object' ? JSON.stringify(v) : v));
          }
          out.push('');
        }
      } else {
        out.push('```json', JSON.stringify(inst, null, 2), '```', '');
      }
    }
    if (kit.palette) {
      out.push('## Palette', '', '```json', JSON.stringify(kit.palette, null, 2), '```', '');
    }
    var meta = [];
    if (kit.model) meta.push('model: ' + kit.model);
    if (kit.generatedAt) meta.push('generated: ' + new Date(kit.generatedAt).toISOString());
    if (kit.moodOverride) meta.push('mood: ' + kit.moodOverride);
    if (kit.texOverride) meta.push('texture: ' + kit.texOverride);
    if (kit.partial) meta.push('PARTIAL — generation did not complete');
    if (meta.length) out.push('---', '', '_' + meta.join(' · ') + '_');
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function buildWiki(d) {
    var out = [], root = cfg().wikiRoot, i;

    // db.lyrics is { activeId, sheets } — NOT an array. Iterating it directly
    // yields the two top-level keys and silently migrates nothing.
    var sheets = (d.lyrics && d.lyrics.sheets) || [];
    var songs = d.songBoard || [];
    for (i = 0; i < sheets.length; i++) {
      var sh = sheets[i];
      if (!sh) continue;
      var song = matchSong(sh, d);
      // Page keyed by the SONG slug, so the drawer -> page hop is a string build
      // rather than a lookup. Orphan sheets fall back to their own title.
      // The song is only used for the human-facing label now; the path comes from the
      // sheet, so it cannot drift from what the song drawer points at.
      var name = sh.title || (song && song.title) || 'untitled';
      var body = lyricsMarkdown(sh);
      // A brand-new sheet is a tagged skeleton with no words in it yet. Pushing that
      // creates an empty wiki page that Donita will happily quote back as the lyrics.
      if (!body.replace(/^#+.*$/gm, '').trim()) continue;
      out.push({
        path: lyricsPageFor(sh, d),
        title: name,
        description: 'Lyrics — ' + name + (song && wikiSlug(song.title) !== wikiSlug(name) ? ' (' + song.title + ')' : ''),
        tags: ['euterpe', 'lyrics'],
        content: body
      });
    }

    // genreKits / producerNotes / lyriaPrompts are DICTS KEYED BY GENRE NAME, each
    // holding an array of versions. Object.entries, never array iteration.
    var kits = d.genreKits || {};
    for (var g in kits) {
      if (!Object.prototype.hasOwnProperty.call(kits, g)) continue;
      var vs = kits[g] || [];
      for (i = 0; i < vs.length; i++) {
        out.push({
          path: root + '/kits/' + wikiSlug(g) + '/v' + (i + 1),
          title: g + ' — Kit v' + (i + 1),
          description: 'Genre kit for ' + g,
          tags: ['euterpe', 'kit', 'genre-' + wikiSlug(g)],
          content: kitMarkdown(g, vs[i] || {})
        });
      }
    }

    var notes = d.producerNotes || {};
    for (var gn in notes) {
      if (!Object.prototype.hasOwnProperty.call(notes, gn)) continue;
      var ns = notes[gn] || [];
      for (i = 0; i < ns.length; i++) {
        var n = ns[i] || {};
        out.push({
          path: root + '/notes/' + wikiSlug(gn) + '/' + wikiSlug(n.name || ('v' + (i + 1))),
          title: gn + ' — ' + (n.name || ('V' + (i + 1))),
          // Written to fill Google Flow's Producer Instructions field, which takes
          // 10,000 characters and silently drops the rest. Length is meaningful here.
          description: 'Producer notes (' + String(n.text || '').length + ' chars of Flow\'s 10,000)',
          tags: ['euterpe', 'producer-notes', 'genre-' + wikiSlug(gn)],
          content: String(n.text || '')
        });
      }
    }

    out.push(indexPage(buildCabinet(d), d));

    // Per-song Lyria takes. Prose, ~3 KB each and one more every time he generates,
    // so the cabinet is the wrong home for them — the song drawer carries the paths.
    for (i = 0; i < songs.length; i++) {
      var sp = songs[i], takes = sp.lyriaPrompts || [];
      for (var t = 0; t < takes.length; t++) {
        var tk = takes[t] || {};
        var bodyLines = ['# ' + sp.title + ' — ' + (tk.name || ('Take ' + (t + 1))), '', String(tk.prompt || ''), ''];
        if (tk.params && Object.keys(tk.params).length) {
          bodyLines.push('## Parameters', '', '```json', JSON.stringify(tk.params, null, 2), '```');
        }
        out.push({
          path: promptPageFor(sp, tk, t),
          title: sp.title + ' — ' + (tk.name || ('Take ' + (t + 1))),
          description: 'Lyria prompt for ' + sp.title,
          tags: ['euterpe', 'lyria-prompt'],
          content: bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
        });
      }
    }

    return out;
  }

  /* ------------------------------------------------------------ dry run */

  // Mirrors exactly what the sutra's relabel step builds server-side: label -> [drawer
  // paths]. This is NOT a rounding error to skip — on the real vault it was 21.5 KB, 16%
  // of the entire cap, and a preview that doesn't count it isn't a preview. (First version
  // of this function didn't, and a sync ran the cabinet to 103% before anyone noticed.)
  function labelIndexObject(drawers) {
    var idx = {}, i, j;
    for (i = 0; i < drawers.length; i++) {
      var tags = drawers[i].tags || [];
      for (j = 0; j < tags.length; j++) {
        if (!idx[tags[j]]) idx[tags[j]] = [];
        if (idx[tags[j]].indexOf(drawers[i].path) < 0) idx[tags[j]].push(drawers[i].path);
      }
    }
    return idx;
  }
  function labelIndexBytes(drawers) { return JSON.stringify(labelIndexObject(drawers)).length; }

  // A real ISO timestamp with microsecond precision, exactly the shape the cabinet
  // stamps every write with ("2026-09-03T13:29:36.697180-07:00", 33 characters) — used
  // as a stand-in so the size estimate isn't thrown off by Date.now()'s much shorter
  // millisecond-precision default toISOString().
  var TS_PLACEHOLDER = '2026-01-01T00:00:00.000000-07:00';

  // Fixed cost of the three HA-managed system drawers (AI_Cabinet_VolumeInfo, meta,
  // _zen_relationships — _label_index is built and measured separately above, since it
  // grows with our own data). Measured directly off the live box, 2026-09-03:
  // 633 + 77 + 125 = 835 bytes. Re-measure if this ever looks off — it's read off the
  // real cabinet, not derived, because VolumeInfo's shape isn't ours to compute.
  var SYSTEM_DRAWER_BYTES = 835;

  // Builds the ACTUAL { path: { value, timestamp } } structure the cabinet stores and
  // measures its real JSON size — not a per-drawer formula with a fudge factor. The
  // previous version guessed a flat +40 bytes of envelope per drawer and missed
  // _label_index entirely; both were real gaps between "dry run says" and "what actually
  // happens" that only showed up once the vault was big enough to hit the 131,072 cap.
  function cabinetPayloadBytes(drawers) {
    var payload = {}, i;
    for (i = 0; i < drawers.length; i++) {
      payload[drawers[i].path] = { value: drawers[i].value, timestamp: TS_PLACEHOLDER };
    }
    payload._label_index = { value: labelIndexObject(drawers), timestamp: TS_PLACEHOLDER };
    return JSON.stringify(payload).length + SYSTEM_DRAWER_BYTES;
  }

  function preview() {
    var d = db();
    var drawers = buildCabinet(d), pages = cfg().wiki ? buildWiki(d) : [];
    var groups = {}, i;
    for (i = 0; i < drawers.length; i++) {
      var top = drawers[i].path.split('/')[0];
      // Per-group breakdown for the log is still an approximation (real per-drawer cost
      // depends on where it lands in the shared JSON object) — fine for "which bucket is
      // biggest", not used for the total any more.
      var b = bytes(drawers[i].value) + drawers[i].path.length + 64;
      groups[top] = groups[top] || { n: 0, bytes: 0 };
      groups[top].n++; groups[top].bytes += b;
    }
    var labelBytes = labelIndexBytes(drawers);
    groups['_label_index'] = { n: 1, bytes: labelBytes };
    var total = cabinetPayloadBytes(drawers);
    var wikiBytes = 0;
    for (i = 0; i < pages.length; i++) wikiBytes += pages[i].content.length;
    return {
      drawers: drawers.length, pages: pages.length,
      cabinetBytes: total, cabinetPct: Math.round(total / CAB_LIMIT * 1000) / 10,
      wikiBytes: wikiBytes, groups: groups,
      overCap: total > CAB_LIMIT
    };
  }

  /* --------------------------------------------------------------- sync */

  var running = false;

  function sync(opts) {
    opts = opts || {};
    var log = opts.onLog || function () {};
    if (running) return Promise.reject(new Error('A sync is already running.'));
    if (!configured()) return Promise.reject(new Error('Set your HA URL + token in ⚙ setup first.'));

    var d = db();
    var drawers = buildCabinet(d);
    var pages = (cfg().wiki && !opts.cabinetOnly) ? buildWiki(d) : [];
    var pre = preview();
    if (pre.overCap && !opts.force) {
      return Promise.reject(new Error(
        'Refusing to write: the cabinet payload is ' + pre.cabinetBytes + ' bytes, over the ' +
        CAB_LIMIT + ' cap. Move a bucket to the wiki tier first.'));
    }

    running = true;
    var c = cfg();
    var hashes = opts.full ? {} : (c.hashes || {});
    var wikiHashes = opts.full ? {} : (c.wikiHashes || {});
    var stats = { pushed: 0, skipped: 0, failed: 0, errors: [], total: drawers.length + pages.length };

    // Writes go one at a time on purpose. A cabinet drawer is an attribute on a
    // trigger-based template sensor: each write reads the current attribute, merges,
    // and writes it back, then the script waits for its own timestamp to land.
    // Firing those in parallel is how you lose a drawer.
    function step(i) {
      if (i >= drawers.length) return Promise.resolve();
      var dr = drawers[i], h = hash(dr);
      if (hashes[dr.path] === h) { stats.skipped++; return step(i + 1); }
      // Relabel runs after EVERY write, including one whose new tag list is empty —
      // that case is not a no-op. A drawer that used to carry ['script', 'cat_x'] and
      // now carries [] still has those two entries sitting in _label_index; skipping
      // relabel because "nothing to add" leaves them there forever, which is exactly
      // the bug that let the index balloon to 21.5 KB of stale membership no drawer
      // still claims. relabel with an empty tag list correctly strips-and-adds-nothing.
      // Two round-trips per CHANGED drawer is the price of the index telling the truth.
      return upsertDrawer(dr).then(function () {
        // relabel checks drawer existence via a FRESH read of the cabinet's own state,
        // separate from upsert's own write-verification wait. In three real runs this
        // has failed exactly once each time with "not found" — always on whichever
        // drawer landed LAST in a long sequential run (215 round trips), never on any
        // other drawer, and never twice. That is the signature of a rare tail-end
        // consistency lag between "upsert's poll saw the write" and "a brand new
        // service invocation's read sees it", not a real problem with the drawer.
        // One retry after a short pause is cheap insurance against exactly that.
        return relabelDrawer(dr)['catch'](function (e) {
          if (!/not found/i.test(e.message || '')) throw e;
          return sleep(1500).then(function () { return relabelDrawer(dr); });
        });
      }).then(function () {
        hashes[dr.path] = h; stats.pushed++;
        log('✓ ' + dr.path);
      }, function (e) {
        stats.failed++; stats.errors.push(dr.path + ': ' + e.message);
        log('✗ ' + dr.path + ' — ' + e.message);
      }).then(function () {
        if (opts.onProgress) opts.onProgress(i + 1, stats.total);
        return step(i + 1);
      });
    }

    function pageStep(i) {
      if (i >= pages.length) return Promise.resolve();
      var pg = pages[i], h = hash(pg);
      if (wikiHashes[pg.path] === h) { stats.skipped++; return pageStep(i + 1); }
      return upsertPage(pg).then(function () {
        wikiHashes[pg.path] = h; stats.pushed++;
        log('✓ wiki ' + pg.path);
      }, function (e) {
        stats.failed++; stats.errors.push('wiki ' + pg.path + ': ' + e.message);
        log('✗ wiki ' + pg.path + ' — ' + e.message);
      }).then(function () {
        if (opts.onProgress) opts.onProgress(drawers.length + i + 1, stats.total);
        return pageStep(i + 1);
      });
    }

    return step(0).then(function () { return pageStep(0); }).then(function () {
      patchCfg({ hashes: hashes, wikiHashes: wikiHashes, lastSync: Date.now() });
      running = false;
      return stats;
    }, function (e) {
      // Partial progress is still progress — keep what landed so a retry is cheap.
      patchCfg({ hashes: hashes, wikiHashes: wikiHashes });
      running = false;
      throw e;
    });
  }

  /* ------------------------------------------------------ pull (wiki -> app) */

  // The one inbound path. Deliberately NOT automatic: he edits lyrics in the app constantly,
  // so anything that pulls on its own would eventually overwrite his own work with a stale
  // wiki copy. This fetches, diffs, and hands back a change set — nothing is written to the
  // vault until applyLyricsPull() is called with what he accepted.
  //
  // Only lyrics. Everything else in the wiki (kits, producer notes, prompts) is generated
  // FROM the vault and has no meaningful inbound edit.
  function pullLyrics(opts) {
    opts = opts || {};
    var log = opts.onLog || function () {};
    if (!configured()) return Promise.reject(new Error('No Home Assistant session on this origin.'));
    var d = db();
    var sheets = (d.lyrics && d.lyrics.sheets) || [];
    if (!sheets.length) return Promise.resolve([]);
    if (typeof window.parseTaggedSongText !== 'function') {
      return Promise.reject(new Error('Lyrics Lab has not loaded — cannot parse a pull safely.'));
    }
    var changes = [];

    function step(i) {
      if (i >= sheets.length) return Promise.resolve(changes);
      var sh = sheets[i], path = lyricsPageFor(sh, d);
      return call({ action_type: 'get', stack: 'wiki', path: path }, 30000).then(function (r) {
        // A page that was never pushed is not a change, it's just absent.
        if (!r || r.status === 'not_found') { log('· ' + path + ' — not on the wiki yet'); return; }
        var page = (r.page && typeof r.page === 'object') ? r.page : r;
        var remote = lyricsFromPage(page.content);
        if (!remote) { log('· ' + path + ' — unreadable, skipped'); return; }
        var local = sh.lines || [];
        var diff = diffLines(local, remote);
        if (!diff.changed) { log('= ' + (sh.title || path) + ' — identical'); return; }
        // A wiki page that parses to nothing, against a sheet that has words, is far more
        // likely to be a broken page than a deliberate deletion. Refuse it rather than
        // offering to wipe the sheet.
        if (!remote.length && local.filter(function (l) { return String(l.text || '').trim(); }).length) {
          log('! ' + (sh.title || path) + ' — wiki copy is empty, refusing (would erase ' + local.length + ' lines)');
          return;
        }
        changes.push({ sheetId: sh.id, title: sh.title || path, path: path, lines: remote, diff: diff });
        log('~ ' + (sh.title || path) + ' — ' + diff.summary);
      }, function (e) {
        log('✗ ' + path + ' — ' + e.message);
      }).then(function () { return step(i + 1); });
    }
    return step(0);
  }

  // Line-level comparison on text + tag. Position-based, which is what a "change the third
  // line" edit actually looks like; a wholesale reorder reads as many changes, which is
  // honest rather than clever.
  function diffLines(local, remote) {
    // A lone '-' is the app's own rest-bar convention: an empty line still holds a bar of
    // time, and sheetToTaggedText writes it as '-' so the arrangement survives the trip.
    // Treating '' and '-' as different would make every sheet with an empty bar report
    // phantom edits on every single pull.
    function norm(t) { t = String(t == null ? '' : t).trim(); return t === '-' ? '' : t; }
    // Trailing empties are trimmed on write, so compare only up to the last real line on
    // each side — otherwise a sheet ending in blanks always looks shortened.
    function endOf(a) { var i = a.length; while (i > 0 && !norm((a[i - 1] || {}).text)) i--; return i; }
    local = local.slice(0, endOf(local));
    remote = remote.slice(0, endOf(remote));
    var n = Math.max(local.length, remote.length), edits = [], i;
    for (i = 0; i < n; i++) {
      var a = local[i] || {}, b = remote[i] || {};
      var at = norm(a.text), bt = norm(b.text);
      var ag = a.tag || '', bg = b.tag || '';
      if (at !== bt || ag !== bg) edits.push({ n: i + 1, from: at, to: bt, fromTag: ag, toTag: bg });
    }
    var parts = [];
    if (remote.length !== local.length) parts.push(local.length + ' → ' + remote.length + ' lines');
    if (edits.length) parts.push(edits.length + ' line' + (edits.length === 1 ? '' : 's') + ' differ');
    return { changed: edits.length > 0, edits: edits, summary: parts.join(', ') || 'no change' };
  }

  // Writes accepted changes into the vault. Preserves each line's per-line marks (ALT
  // punch-ups, the AI provenance badge) for any line whose text is unchanged — losing those
  // silently on a pull would be a nasty little data loss.
  function applyLyricsPull(changes) {
    var d = db(), sheets = (d.lyrics && d.lyrics.sheets) || [], applied = 0, i, j;
    for (i = 0; i < (changes || []).length; i++) {
      var c = changes[i], sh = null;
      for (j = 0; j < sheets.length; j++) if (sameId(sheets[j].id, c.sheetId)) { sh = sheets[j]; break; }
      if (!sh) continue;
      var marks = {};
      (sh.lines || []).forEach(function (l) {
        var k = String(l.text || '').trim();
        if (!k) return;
        if (!marks[k]) marks[k] = [];
        marks[k].push(l);
      });
      sh.lines = c.lines.map(function (l) {
        var k = String(l.text || '').trim();
        var prior = (marks[k] && marks[k].length) ? marks[k].shift() : null;
        if (!prior) return l;
        var out = { text: l.text, tag: l.tag, halfTime: l.halfTime };
        if (prior.alt) out.alt = prior.alt;
        if (prior.ai) out.ai = prior.ai;
        if (prior.marks) out.marks = prior.marks;
        if (prior.chords) out.chords = prior.chords;
        return out;
      });
      applied++;
    }
    if (!applied) return 0;
    // lyrState is a cached copy inside the Lyrics Lab; without the reload its next save
    // would write the stale copy straight back over what we just pulled in.
    window.saveData && window.saveData();
    window.lyrForceReload && window.lyrForceReload();
    window.refreshLyrics && window.refreshLyrics();
    return applied;
  }

  /* -------------------------------------------- write-through, fail silent */

  var pending = null;
  // Called from the app when something changed. Never blocks the UI and never
  // surfaces an error — the same fail-silent shape the AI relay already uses.
  // localStorage stays the working copy and the render source; the cabinet is a mirror.
  function touch() {
    if (!cfg().autoSync || !configured()) return;
    if (pending) clearTimeout(pending);
    pending = setTimeout(function () {
      pending = null;
      sync({}).then(function (s) {
        if (s.pushed) console.log('[zenos] synced ' + s.pushed + ' drawer(s)');
      }, function (e) { console.warn('[zenos] sync deferred:', e && e.message); });
    }, 4000);
  }

  /* ----------------------------------------------------------------- read */

  // Reading a song back the way Donita would: one get, everything in one drawer.
  function readSong(title) { return getDrawer('songs/' + haSlug(title)); }

  /* --------------------------------------------------------- backup net */
  // Two independent copies of the raw vault, refreshed periodically, so a bad mirror
  // sync or a Drive outage is never the only place the data lives. Deliberately separate
  // from the cabinet/wiki mirror above: that mirror is a reshaped, Donita-readable VIEW
  // of the vault and is allowed to have gaps (kit_page_resolved:"genre_latest" and the
  // like); a backup is a byte-for-byte copy of window.db, full stop.
  //
  // VAULT DATA carries no credentials, so it goes to both Drive and this box's own /www —
  // same shape downloadVaultBackup() already writes, so a file recovered from either
  // place opens with the app's own Restore Vault, no format to remember.
  //
  // AI/DRIVE SETTINGS carries real provider API keys. It goes to Drive (OAuth + drive.file
  // scope: only this app's own files are visible even to itself) and to a ZenOS cabinet
  // drawer — gated behind an HA session — but never to /www, which is public and
  // unauthenticated. A plaintext key sitting at a guessable URL is a standing leak, not a
  // one-time one; that trade was never made for the vault-only /www copy above.

  var BACKUP_DRIVE_IDS_KEY = 'ferrett_os_backup_drive_ids_v1';
  var BACKUP_VAULT_LOCAL_NAME = 'euterpe-vault-data-latest.json';
  var BACKUP_VAULT_DRIVE_NAME = 'Euterpe-Vault-Data.json';
  var BACKUP_SETTINGS_DRIVE_NAME = 'Euterpe-AI-Settings.json';
  var BACKUP_SETTINGS_CABINET = 'sensor.zenos_default_user_cabinet'; // NOT the music cabinet
  var BACKUP_SETTINGS_PATH = 'backups/euterpe_ai_settings';

  function driveDriveIds() {
    try { return JSON.parse(localStorage.getItem(BACKUP_DRIVE_IDS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveDriveIds(ids) {
    try { localStorage.setItem(BACKUP_DRIVE_IDS_KEY, JSON.stringify(ids)); } catch (e) {}
  }

  // Generalizes the app's own uploadToDriveRaw to an arbitrary filename, kept as a
  // SEPARATE Drive file from the live EUTERPE_OS_VAULT.json sync target and tracked under
  // its own key so a corrupt live-sync file can never take this backup down with it.
  // Uses gapi directly, exactly like uploadToDriveRaw — no new Drive plumbing.
  function driveUploadNamed(idKey, filename, dataObj) {
    if (!window.isDriveConnected || !window.gapi || !window.gapi.client || !window.gapi.client.drive) {
      return Promise.reject(new Error('Drive not connected'));
    }
    var ids = driveDriveIds();
    var body = JSON.stringify(dataObj);
    var find = ids[idKey]
      ? Promise.resolve(ids[idKey])
      : window.gapi.client.drive.files.list({
          q: "name='" + filename + "' and trashed=false", spaces: 'drive', fields: 'files(id)'
        }).then(function (res) {
          var f = res.result && res.result.files && res.result.files[0];
          return f ? f.id : null;
        });
    return find.then(function (fileId) {
      var file = new Blob([body], { type: 'application/json' });
      var form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({ name: filename, mimeType: 'application/json' })], { type: 'application/json' }));
      form.append('file', file);
      var token = window.gapi.client.getToken().access_token;
      var url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
      var method = 'POST';
      if (fileId) { url = 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=multipart&fields=id'; method = 'PATCH'; }
      return fetch(url, { method: method, headers: { 'Authorization': 'Bearer ' + token }, body: form })
        .then(function (res) { return res.json(); })
        .then(function (json) {
          if (json && json.id && json.id !== fileId) { ids[idKey] = json.id; saveDriveIds(ids); }
          if (!json || !json.id) throw new Error('Drive upload did not return a file id');
        });
    });
  }

  function writeVaultBackupLocal(dataObj) {
    return callService('pyscript', 'euterpe_write_backup', {
      filename: BACKUP_VAULT_LOCAL_NAME,
      content: JSON.stringify(dataObj)
    }, 30000, false);
  }

  // Settings backup on this box: a small cabinet drawer, NOT a /www file — see the file
  // header. mode:'replace' so a removed key (a revoked provider, say) actually disappears
  // from the backup rather than lingering under upsert's default deep-merge.
  function writeSettingsBackupLocal(dataObj) {
    return call({
      action_type: 'upsert', mode: 'replace', stack: 'cabinet',
      volume_entity_id: BACKUP_SETTINGS_CABINET,
      path: BACKUP_SETTINGS_PATH,
      title: 'Euterpe AI + Drive settings backup',
      value: dataObj,
      tags: 'euterpe,backup', create_label: true
    }, 15000);
  }

  function aiSettingsCfg() {
    try { return JSON.parse(localStorage.getItem('ferrett_os_ai_v1') || '{}'); } catch (e) { return {}; }
  }
  function driveSettingsCfg() {
    try { return JSON.parse(localStorage.getItem('ferrett_os_drive_cfg_v1') || '{}'); } catch (e) { return {}; }
  }

  // Runs all four writes independently — Drive being down must not block the local copy,
  // and vice versa — and reports each outcome rather than collapsing to one pass/fail.
  function backupNow(opts) {
    opts = opts || {};
    var log = opts.onLog || function () {};
    var vault = { exportedAt: new Date().toISOString(), source: 'EUTERPE_OS', db: db() };
    var settings = { ai: aiSettingsCfg(), drive: driveSettingsCfg() };
    var results = {};

    function attempt(key, label, fn) {
      return fn().then(function () {
        results[key] = { ok: true };
        log('✓ ' + label);
      }, function (e) {
        results[key] = { ok: false, error: e && e.message };
        log('✗ ' + label + ' — ' + (e && e.message));
      });
    }

    var jobs = [
      attempt('vaultLocal', 'vault → this box (/local/euterpe_backups/)', function () { return writeVaultBackupLocal(vault); }),
      attempt('settingsLocal', 'settings → this box (cabinet)', function () { return writeSettingsBackupLocal(settings); })
    ];
    // The two Drive uploads are chained, not run alongside each other. Both read-modify-
    // write the SAME localStorage id-cache key (driveUploadNamed's "find or create" step);
    // run concurrently, the second to finish clobbers the first's cached id, and every
    // other backup would needlessly recreate that file on Drive instead of updating it —
    // caught by testing two uploads back to back, not by inspection.
    var driveJob = window.isDriveConnected
      ? attempt('vaultDrive', 'vault → Drive (' + BACKUP_VAULT_DRIVE_NAME + ')', function () { return driveUploadNamed('vault', BACKUP_VAULT_DRIVE_NAME, vault); })
          .then(function () { return attempt('settingsDrive', 'settings → Drive (' + BACKUP_SETTINGS_DRIVE_NAME + ')', function () { return driveUploadNamed('settings', BACKUP_SETTINGS_DRIVE_NAME, settings); }); })
      : (log('· Drive not connected — vault + settings still went to this box'), Promise.resolve());
    jobs.push(driveJob);

    return Promise.all(jobs).then(function () {
      var anyOk = false;
      for (var k in results) if (results[k].ok) anyOk = true;
      if (anyOk) {
        patchCfg({ lastBackupAt: Date.now(), lastBackupRev: (window.driveSyncMeta && window.driveSyncMeta.localRev) || 0 });
      }
      return results;
    });
  }

  // Only backs up when something has actually changed since the last one (compares
  // against the SAME localRev counter Drive sync uses — it already bumps on every save)
  // and throttles regardless, so a burst of edits doesn't fire a backup per keystroke.
  var BACKUP_INTERVAL_MS = 30 * 60 * 1000;
  var BACKUP_MIN_GAP_MS = 20 * 60 * 1000;
  var backupInFlight = false;
  function maybeBackup(reason) {
    if (!cfg().autoBackup || !configured() || backupInFlight) return;
    var c = cfg();
    var rev = (window.driveSyncMeta && window.driveSyncMeta.localRev) || 0;
    if (rev === c.lastBackupRev) return;               // nothing changed since last backup
    if (Date.now() - c.lastBackupAt < BACKUP_MIN_GAP_MS) return;  // too soon regardless
    backupInFlight = true;
    backupNow({}).then(function (r) {
      backupInFlight = false;
      var n = 0; for (var k in r) if (r[k].ok) n++;
      console.log('[zenos] backup (' + (reason || 'timer') + '): ' + n + '/' + Object.keys(r).length + ' ok');
    }, function () { backupInFlight = false; });
  }
  setInterval(function () { maybeBackup('interval'); }, BACKUP_INTERVAL_MS);
  // Closing the tab after a productive session shouldn't mean waiting up to 30 minutes
  // for the next scheduled check — try once more on the way out. maybeBackup's own
  // throttle keeps this from doing anything if one already ran recently.
  window.addEventListener('pagehide', function () { maybeBackup('pagehide'); });

  /* ------------------------------------------------------------------- ui */

  function $(id) { return document.getElementById(id); }

  function wireUI() {
    var elCab = $('zenos-cabinet'), elRoot = $('zenos-wikiroot'), elWiki = $('zenos-wiki'),
        elAuto = $('zenos-auto'), elLog = $('zenos-log'), elStatus = $('zenos-status'),
        elBackupAuto = $('zenos-backup-auto'), elBackupStatus = $('zenos-backup-status');
    if (!elCab) return;   // markup not present (e.g. main branch) — stay silent

    var c = cfg();
    elCab.value = c.cabinet; elRoot.value = c.wikiRoot;
    elWiki.checked = !!c.wiki; elAuto.checked = !!c.autoSync;
    if (elBackupAuto) elBackupAuto.checked = c.autoBackup !== false;

    function status() {
      var src = authSource();
      if (!src) {
        elStatus.textContent = localStorage.getItem('hassTokens')
          ? '○ HA session expired — reload from HA'
          : '○ no HA session — needs url + token above';
        return;
      }
      var n = cfg().lastSync;
      elStatus.textContent = (src === 'ha-session' ? '● HA session' : '● url + token') +
        (n ? ' · last sync ' + new Date(n).toLocaleString() : ' · never synced');
    }
    function say(line) {
      elLog.classList.remove('hidden');
      elLog.textContent += (elLog.textContent ? '\n' : '') + line;
      elLog.scrollTop = elLog.scrollHeight;
    }
    function reset() { elLog.textContent = ''; elLog.classList.remove('hidden'); }
    function busy(on) {
      ['zenos-preview-btn', 'zenos-sync-btn', 'zenos-full-btn', 'zenos-check-btn', 'zenos-pull-btn'].forEach(function (id) {
        var b = $(id); if (b) b.disabled = on;
      });
    }
    function persist() {
      patchCfg({
        cabinet: elCab.value.trim() || DEFAULTS.cabinet,
        wikiRoot: (elRoot.value.trim() || DEFAULTS.wikiRoot).replace(/\/+$/, ''),
        wiki: !!elWiki.checked,
        autoSync: !!elAuto.checked
      });
    }
    [elCab, elRoot].forEach(function (e) { e.addEventListener('change', persist); });
    [elWiki, elAuto].forEach(function (e) { e.addEventListener('change', persist); });

    $('zenos-preview-btn').addEventListener('click', function () {
      persist(); reset();
      var p = preview();
      say('DRY RUN — nothing written.');
      say(p.drawers + ' drawers, ' + p.cabinetBytes.toLocaleString() + ' bytes = ' + p.cabinetPct + '% of the 131,072 cap');
      Object.keys(p.groups).sort(function (a, b) { return p.groups[b].bytes - p.groups[a].bytes; })
        .forEach(function (g) { say('   ' + g + '  ×' + p.groups[g].n + '  ' + p.groups[g].bytes.toLocaleString() + ' B'); });
      say(p.pages + ' wiki pages, ' + p.wikiBytes.toLocaleString() + ' bytes');
      if (p.overCap) say('⚠ OVER THE CAP — sync will refuse. Move a bucket to the wiki tier.');
    });

    function run(full) {
      persist(); reset();
      if (!configured()) {
        say(localStorage.getItem('hassTokens')
          ? '✗ Your Home Assistant session has expired. Reload this page from HA and try again.'
          : '✗ No Home Assistant session on this origin. Open this build at <your-ha>/local/euterpe/, or set an HA URL + token above.');
        return;
      }
      if (authSource() === 'ha-session') say('Using this page\'s Home Assistant session — no token needed.');
      busy(true);
      var t0 = Date.now();
      say((full ? 'Full resync' : 'Sync') + ' started…');
      sync({
        full: full,
        onLog: say,
        onProgress: function (i, n) { if (i % 25 === 0) say('   … ' + i + '/' + n); }
      }).then(function (s) {
        say('—');
        say('done in ' + Math.round((Date.now() - t0) / 1000) + 's — ' +
            s.pushed + ' written, ' + s.skipped + ' unchanged, ' + s.failed + ' failed');
        busy(false); status();
      }, function (e) {
        say('✗ ' + e.message); busy(false); status();
      });
    }
    $('zenos-sync-btn').addEventListener('click', function () { run(false); });
    $('zenos-full-btn').addEventListener('click', function () {
      if (confirm('Rewrite every drawer and wiki page, ignoring the change cache?')) run(true);
    });

    var pending = null;
    $('zenos-pull-btn').addEventListener('click', function () {
      persist(); reset(); busy(true);
      $('zenos-apply-btn').classList.add('hidden'); pending = null;
      say('Reading lyrics back from the wiki — nothing is written yet.');
      pullLyrics({ onLog: say }).then(function (changes) {
        busy(false);
        if (!changes.length) { say('—'); say('Nothing to bring back. Your sheets already match the wiki.'); return; }
        pending = changes;
        say('—');
        changes.forEach(function (c) {
          say(c.title + ':');
          c.diff.edits.slice(0, 12).forEach(function (e) {
            say('   line ' + e.n + (e.fromTag !== e.toTag ? '  [' + (e.fromTag || '-') + ' → ' + (e.toTag || '-') + ']' : ''));
            if (e.from) say('     - ' + e.from);
            if (e.to) say('     + ' + e.to);
          });
          if (c.diff.edits.length > 12) say('   … and ' + (c.diff.edits.length - 12) + ' more');
        });
        say('—');
        say('APPLY writes these into your sheets. Nothing else is touched.');
        $('zenos-apply-btn').classList.remove('hidden');
      }, function (e) { busy(false); say('✗ ' + e.message); });
    });

    $('zenos-apply-btn').addEventListener('click', function () {
      if (!pending || !pending.length) return;
      var n = applyLyricsPull(pending);
      say('—');
      say('✓ applied to ' + n + ' sheet' + (n === 1 ? '' : 's') + '. Open Lyrics Lab to see them.');
      // The vault has moved on, so the cached page hashes are stale — drop the ones we
      // just pulled so the next sync pushes the merged copy rather than skipping it.
      var c = cfg(), wh = c.wikiHashes || {};
      pending.forEach(function (x) { delete wh[x.path]; });
      patchCfg({ wikiHashes: wh });
      pending = null;
      $('zenos-apply-btn').classList.add('hidden');
    });

    $('zenos-check-btn').addEventListener('click', function () {
      reset(); busy(true); say('Asking the cabinet…');
      fleet().then(function (r) {
        say(JSON.stringify(r, null, 1).slice(0, 4000));
        busy(false);
      }, function (e) { say('✗ ' + e.message); busy(false); });
    });

    if (elBackupAuto) elBackupAuto.addEventListener('change', function () { patchCfg({ autoBackup: !!elBackupAuto.checked }); });

    function backupStatus() {
      if (!elBackupStatus) return;
      var n = cfg().lastBackupAt;
      elBackupStatus.textContent = n ? '· last backup ' + new Date(n).toLocaleString() : '· never backed up';
    }
    var elBackupNow = $('zenos-backup-now-btn');
    if (elBackupNow) elBackupNow.addEventListener('click', function () {
      reset(); busy(true); elBackupNow.disabled = true;
      say('Backing up — Drive and this box, vault and settings…');
      backupNow({ onLog: say }).then(function (r) {
        var n = 0; for (var k in r) if (r[k].ok) n++;
        say('—'); say('done: ' + n + '/' + Object.keys(r).length + ' ok');
        busy(false); elBackupNow.disabled = false; backupStatus();
      }, function (e) { say('✗ ' + e.message); busy(false); elBackupNow.disabled = false; });
    });

    status();
    backupStatus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireUI);
  else wireUI();

  window.ZenOS = {
    // Exposed so the AI relay in 08-ai-settings.js can borrow the same session instead of
    // asking for an HA url + token that this origin already has sitting in localStorage.
    haSession: hassAuth,
    cfg: cfg, saveCfg: saveCfg, patchCfg: patchCfg, configured: configured,
    haSlug: haSlug, wikiSlug: wikiSlug,
    call: call, get: getDrawer, list: listDrawers, fleet: fleet,
    buildCabinet: function () { return buildCabinet(db()); },
    buildWiki: function () { return buildWiki(db()); },
    preview: preview, sync: sync, touch: touch, readSong: readSong,
    pullLyrics: pullLyrics, applyLyricsPull: applyLyricsPull, lyricsFromPage: lyricsFromPage,
    backupNow: backupNow, maybeBackup: maybeBackup,
    CAB_LIMIT: CAB_LIMIT
  };
})();
