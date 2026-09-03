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
  var SVC = 'script/zen_dojotools_filecabinet';
  var CAB_LIMIT = 131072;                 // hard cap per cabinet, enforced by the sensor itself

  var DEFAULTS = {
    enabled: false,
    cabinet: 'sensor.zenos_expansion_cabinet_1',
    wiki: true,
    wikiRoot: '/music',
    autoSync: false,
    lastSync: 0,
    hashes: {},        // drawer path -> content hash, so a re-sync only writes what changed
    wikiHashes: {}
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
  function call(params, timeoutMs) {
    var a = auth();
    if (!a) return Promise.reject(new Error(
      localStorage.getItem('hassTokens')
        ? 'Your Home Assistant session has expired — reload this page from HA and try again.'
        : 'No Home Assistant session on this origin. Open this build from Home Assistant (/local/euterpe/), or set an HA URL + token in \u2699 setup.'));
    var base = a.base;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 45000);

    return fetch(base + '/api/services/' + SVC + '?return_response', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + a.token },
      body: JSON.stringify(params)
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('HA ' + res.status + (
          res.status === 401 ? ' — token rejected (reload this page from HA to refresh the session)' :
          res.status === 400 ? ' — script.zen_dojotools_filecabinet rejected the call' :
          res.status === 404 ? ' — script.zen_dojotools_filecabinet not found' : ''));
      }
      return res.json();
    }).then(function (data) {
      var r = (data && data.service_response) || data || {};
      // FileCabinet reports its own failures inside a 200. not_found is a legitimate
      // answer to a read, so it is passed through rather than thrown.
      var st = r.status;
      if (st && st !== 'success' && st !== 'ok' && st !== 'not_found') {
        throw new Error(r.message || ('FileCabinet: ' + st));
      }
      return r;
    })['catch'](function (e) {
      if (e && e.name === 'AbortError') throw new Error('Home Assistant timed out');
      throw e;
    }).then(function (v) { clearTimeout(timer); return v; }, function (e) { clearTimeout(timer); throw e; });
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
      var tags = ['song'];
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
        tags: ['recipe', 'genre_' + haSlug(r.genre)].concat(fam ? ['inst_' + haSlug(fam)] : []),
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
        tags: ['tone'].concat(t.category ? ['cat_' + haSlug(t.category)] : []).concat(truthy(t.starred) ? ['starred'] : []),
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
      out.push({ path: 'rigs/default', title: 'Patchbay — current rig', tags: ['rig'], value: d.patchbay });
    }
    if (d.patchbayUserDefault && Object.keys(d.patchbayUserDefault).length) {
      out.push({ path: 'rigs/user_default', title: 'Patchbay — user default', tags: ['rig'], value: d.patchbayUserDefault });
    }
    var saved = d.patchbaySaved || [];
    for (i = 0; i < saved.length; i++) {
      if (!saved[i] || !saved[i].name) continue;
      out.push({
        path: 'rigs/saved/' + haSlug(saved[i].name), title: saved[i].name,
        tags: ['rig'], value: saved[i]
      });
    }

    // --- scripts: metadata only, .lua lives in ferrett-audio-tools ----------
    var scripts = d.scripts || [];
    for (i = 0; i < scripts.length; i++) {
      var sc = scripts[i];
      if (!sc || !sc.title) continue;
      out.push({
        path: 'scripts/' + haSlug(sc.title), title: sc.title,
        tags: ['script'].concat(sc.category ? ['cat_' + haSlug(sc.category)] : []),
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
        tags: ['link'].concat(l.category ? ['cat_' + haSlug(l.category)] : []),
        value: tidy({ euterpe_id: l.id, title: l.title, url: l.url, category: l.category, daw: l.daw, notes: l.notes })
      });
    }

    // --- plugins -----------------------------------------------------------
    if ((d.ownedPlugins || []).length) {
      out.push({
        path: 'plugins/owned', title: 'Owned plugins', tags: ['plugins'],
        value: { count: d.ownedPlugins.length, names: d.ownedPlugins }
      });
    }
    if (d.pluginProfiles && Object.keys(d.pluginProfiles).length) {
      out.push({ path: 'plugins/profiles', title: 'Plugin profiles by device', tags: ['plugins'], value: d.pluginProfiles });
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
        tags: ['ledger'],
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
          tags: ['prompt', 'genre_' + haSlug(gname)],
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
        tags: ['producer_notes', 'genre_' + haSlug(xg)],
        value: { genre: xg, text: xtext }
      });
    }

    return out;
  }

  /* --------------------------------------------------------- wiki builders */

  function lyricsMarkdown(sheet) {
    var lines = sheet.lines || [], out = [], lastTag = null, i;
    for (i = 0; i < lines.length; i++) {
      var ln = lines[i] || {};
      if (ln.tag && ln.tag !== lastTag) { out.push(''); out.push('## ' + ln.tag); lastTag = ln.tag; }
      out.push(String(ln.text == null ? '' : ln.text));
    }
    var takes = sheet.takes || [];
    if (takes.length) {
      out.push(''); out.push('## Takes');
      for (i = 0; i < takes.length; i++) {
        var tk = takes[i] || {};
        out.push('');
        out.push('### ' + (tk.name || tk.title || ('Take ' + (i + 1))));
        out.push(String(tk.text || tk.notes || ''));
      }
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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

  function preview() {
    var d = db();
    var drawers = buildCabinet(d), pages = cfg().wiki ? buildWiki(d) : [];
    var groups = {}, total = 0, i;
    for (i = 0; i < drawers.length; i++) {
      var top = drawers[i].path.split('/')[0];
      // What the cabinet actually stores is { value, timestamp }, so the drawer key
      // and the envelope count against the 128 KB too. Roughly +40 bytes each.
      var b = bytes(drawers[i].value) + drawers[i].path.length + 40;
      groups[top] = groups[top] || { n: 0, bytes: 0 };
      groups[top].n++; groups[top].bytes += b; total += b;
    }
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
      // Relabel runs after every write, not just after a tag change. The tempting
      // optimisation — "a drawer we've never written can't have stale labels" — is
      // wrong the moment the local hash cache and the cabinet disagree: a cleared
      // browser, a second device, or a drawer someone else wrote all look brand new
      // here while the cabinet still holds the old labels. Two round-trips per
      // CHANGED drawer is the price of the query layer telling the truth.
      return upsertDrawer(dr).then(function () {
        return (dr.tags && dr.tags.length) ? relabelDrawer(dr) : null;
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

  /* ------------------------------------------------------------------- ui */

  function $(id) { return document.getElementById(id); }

  function wireUI() {
    var elCab = $('zenos-cabinet'), elRoot = $('zenos-wikiroot'), elWiki = $('zenos-wiki'),
        elAuto = $('zenos-auto'), elLog = $('zenos-log'), elStatus = $('zenos-status');
    if (!elCab) return;   // markup not present (e.g. main branch) — stay silent

    var c = cfg();
    elCab.value = c.cabinet; elRoot.value = c.wikiRoot;
    elWiki.checked = !!c.wiki; elAuto.checked = !!c.autoSync;

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
      ['zenos-preview-btn', 'zenos-sync-btn', 'zenos-full-btn', 'zenos-check-btn'].forEach(function (id) {
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

    $('zenos-check-btn').addEventListener('click', function () {
      reset(); busy(true); say('Asking the cabinet…');
      fleet().then(function (r) {
        say(JSON.stringify(r, null, 1).slice(0, 4000));
        busy(false);
      }, function (e) { say('✗ ' + e.message); busy(false); });
    });

    status();
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
    CAB_LIMIT: CAB_LIMIT
  };
})();
