(function(){
  const $ = (id) => document.getElementById(id);
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  function syllables(word){
    word=word.toLowerCase().replace(/[^a-z]/g,''); if(!word) return 0; if(word.length<=3) return 1;
    word=word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');
    const m=word.match(/[aeiouy]{1,2}/g); return m?m.length:1;
  }

  // ==================== LYRICS LAB ====================
  const LYR_KEY='ferrett_os_lyrics_v1';
  // Chord-line visibility is a view preference, not sheet data, so it lives in localStorage next to
  // the other UI toggles rather than in the vault.
  const LYR_CHORDS_KEY='ferrett_os_lyr_show_chords_v1';
  // one color per section type, shared with ARR_TYPES in the Arrangement Timeline so a Chorus/Hook/etc
  // looks the same everywhere: per-line tag glyphs, the structure strip chips, arrangement rows, and the bar graph
  // Google publishes no closed list of section tags — the guides say "section tags LIKE [Verse],
  // [Chorus], and [Bridge]", and their own worked example uses [Build], which is not in that list.
  // The vocabulary is open, so this table is a convenience (glyph + colour + a name the arranger
  // knows), NOT a whitelist: parseTagHeader passes anything it doesn't recognise straight through as
  // a custom tag rather than dropping it. Keys are the canonical uppercase form; DISPLAY overrides
  // the title-cased default where the real section name isn't just the key capitalised.
  const TAGS={ '':['·','#E2E8F0'],
    'INTRO':['◇','#7AFFBF'], 'VERSE':['V','#00E5FF'], 'PRE':['P','#FFD60A'], 'CHORUS':['C','#FF88FF'],
    'POST':['c','#FF6FD8'], 'HOOK':['H','#FFA05C'], 'REFRAIN':['R','#FFB37A'], 'BRIDGE':['B','#B18CFF'],
    'BUILD':['↗','#FFD60A'], 'DROP':['D','#00FF88'], 'BREAKDOWN':['↘','#4DFFDF'], 'BREAK':['—','#68E5D0'],
    'SOLO':['S','#4DFFDF'], 'INSTRUMENTAL':['♪','#7AFFBF'], 'INTERLUDE':['~','#9BE8C8'],
    'ADLIB':['a','#FFA05C'], 'SPOKEN':['"','#D8D8E8'], 'CHANT':['!','#FF9E6F'],
    'VAMP':['∞','#C9A8FF'], 'CODA':['§','#FF7A7A'], 'REPRISE':['↻','#C9A8FF'], 'SKIT':['✂','#C8C8D8'],
    'TAG':['t','#FF8E8E'], 'OUTRO':['◆','#FF5A5A'],
    'CUSTOM':['★','#B18CFF'] };
  // Section names that aren't just the key title-cased.
  const TAG_DISPLAY={ 'PRE':'Pre-Chorus', 'POST':'Post-Chorus', 'ADLIB':'Ad-Lib' };
  // Longest / most specific first — "PRECHORUS" has to beat "CHORUS", "BREAKDOWN" has to beat "BREAK".
  // Matched against the header squashed to letters only, so "Pre-Chorus", "Pre Chorus" and
  // "prechorus" all land on the same tag.
  const TAG_MATCH=[['PRECHORUS','PRE'],['POSTCHORUS','POST'],['BREAKDOWN','BREAKDOWN'],['BUILDUP','BUILD'],
    ['INSTRUMENTAL','INSTRUMENTAL'],['INTERLUDE','INTERLUDE'],['REFRAIN','REFRAIN'],['REPRISE','REPRISE'],
    ['ADLIB','ADLIB'],['ADLIBS','ADLIB'],['INTRO','INTRO'],['OUTRO','OUTRO'],['BRIDGE','BRIDGE'],
    ['CHORUS','CHORUS'],['VERSE','VERSE'],['HOOK','HOOK'],['SOLO','SOLO'],['DROP','DROP'],['BUILD','BUILD'],
    ['BREAK','BREAK'],['SPOKEN','SPOKEN'],['CHANT','CHANT'],['VAMP','VAMP'],['CODA','CODA'],['SKIT','SKIT'],
    ['PRE','PRE'],['POST','POST'],['TAG','TAG']];
  const titleCase=(s)=>String(s||'').toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase());
  // Canonical tag key for ANY spelling of a section — a raw tag ("PRE"), a display name
  // ("Pre-Chorus"), a numbered arrangement name ("Chorus 2"), a half-time one. This is the single
  // comparison key used whenever a lyric block has to be matched to an arrangement section; matching
  // on the display names instead silently failed the moment a section's name stopped being one word
  // ("PRE" vs "Pre-Chorus"), which cost the lyric header its proper name and its timestamp.
  window.lyrTagKeyFor=(name)=>{
    const clean=String(name||'').replace(/\s*\(Half Time\)/i,'').replace(/[\s-]+\d+[A-Za-z]?$/,'').trim();
    if(!clean) return '';
    const squashed=clean.toUpperCase().replace(/[^A-Z]/g,'');
    const hit=TAG_MATCH.find(([pat])=>squashed.includes(pat));
    return hit?hit[1]:clean.toUpperCase().replace(/\s+/g,' ');
  };
  // Display name for a tag: known ones get their proper name, custom ones keep the user's words.
  window.lyrTagDisplay=(tag)=>TAG_DISPLAY[tag] || titleCase(tag);
  // Style lookup that never falls through to the untagged style for a real custom tag — otherwise a
  // [Guitar Solo] line would render identically to a line with no tag at all.
  const tagStyle=(tag)=>TAGS[tag] || (tag ? TAGS['CUSTOM'] : TAGS['']);
  // Derives an ordered arrangement section list straight from the CURRENT lyric lines — this is the
  // single source of truth for lyrics->arrangement sync, called both at initial paste and live on
  // every subsequent edit (see saveLyr below). A maximal run of consecutive lines sharing the same
  // tag AND half-time flag becomes one section (bars = lines in that run, one bar per line — the
  // standard hip-hop convention — or two bars per line for a Half Time section, since a half-time
  // feel stretches every line across twice the underlying bar grid); an untagged line breaks a run
  // without creating a section of its own. Repeated tags get auto-numbered in order ("Verse 1",
  // "Verse 2", ...); a tag used only once stays unnumbered.
  function sectionsFromLines(lines){
    const sections=[]; let current=null; let currentTag=null; let currentHalf=null;
    lines.forEach(ln=>{
      const tag=ln.tag||''; const half=!!ln.halfTime;
      if(tag && tag===currentTag && half===currentHalf){ current.bars+=half?2:1; }
      // lyrTagDisplay gives "Pre-Chorus" rather than "Pre", and title-cases a custom tag properly
      // ("GUITAR SOLO" -> "Guitar Solo") instead of the old first-letter-only capitalisation.
      else if(tag){ current={ name: window.lyrTagDisplay(tag)+(half?' (Half Time)':''), bars: half?2:1, _tag:tag }; sections.push(current); currentTag=tag; currentHalf=half; }
      else { currentTag=null; currentHalf=null; current=null; }
    });
    const countByTag={}; sections.forEach(s=>{ countByTag[s._tag]=(countByTag[s._tag]||0)+1; });
    const seen={};
    sections.forEach(s=>{ if(countByTag[s._tag]>1){ seen[s._tag]=(seen[s._tag]||0)+1; s.name+=' '+seen[s._tag]; } delete s._tag; });
    return sections;
  }
  // Single shared reading of a [bracket] tag header — strips a trailing numeral ("Verse 1" -> VERSE)
  // and an optional "Half Time"/"(Half Time)" marker, so "Verse 1", "Verse 2", and "Chorus (Half
  // Time)" all resolve to their base tag instead of missing the tag lookup entirely. Used by both the
  // paste parser and lyrAddLines (the "insert as headers" bridge) so the two never drift apart again —
  // that drift is exactly what let numbered/half-time headers silently land as untagged plain text.
  function parseTagHeader(inner){
    inner=(inner||'').trim();
    const halfTime=/half\s*time/i.test(inner);
    inner=inner.replace(/\(?\s*half\s*time\s*\)?/i,'').trim();
    // Strip a trailing number/letter ("Verse 1", "Chorus 2", "Verse 2B") — sectionsFromLines renumbers
    // repeated tags from the actual line order, so the one written in the header is not kept.
    inner=inner.replace(/[\s-]+\d+[A-Za-z]?$/,'').replace(/\s*[x×]\s*\d+$/i,'').trim();
    if(!inner) return { tag:'', halfTime };
    // Recognise a known tag from the letters-only form, most specific first. The original version
    // demanded the whole header be one bare word, which quietly failed on every compound a songwriter
    // actually types — [Pre-Chorus], [Post Chorus], [Guitar Solo], [Hook / Chorus].
    const squashed=inner.toUpperCase().replace(/[^A-Z]/g,'');
    const hit=TAG_MATCH.find(([pat])=>squashed.includes(pat));
    if(hit) return { tag: hit[1], halfTime };
    // Unknown -> keep it as a CUSTOM tag rather than discarding it. Lyria's tag vocabulary is open,
    // so there is no such thing as a section name we should refuse. Dropping one was never cosmetic:
    // an untagged line breaks the run in sectionsFromLines WITHOUT starting a section, so the whole
    // part vanished from the arrangement, every timestamp after it shifted, and the Lyria prompt got
    // a bare "[Section]" header where [Breakdown] should have been.
    return { tag: inner.toUpperCase().replace(/\s+/g,' ').slice(0,40), halfTime, custom:true };
  }
  // Parses a whole pasted song written with [Section] headers on their own line (e.g. "[Verse 1]",
  // "[Chorus Half Time]") into per-line {text,tag,halfTime} triples — every non-blank line under a
  // header inherits that header's tag, including parenthetical ad-libs and a lone "-" (an
  // instrumental/rest bar with no words — it still counts toward the section's bar total since bars
  // are counted per line regardless of text, but has no letters for Analyze mode to rhyme against).
  // The numeral in the header itself is not kept (sectionsFromLines renumbers repeated tags from the
  // actual line order), so structure stays correct even after later edits reshuffle things.
  function parseTaggedSongText(raw){
    const rawLines=(raw||'').split(/\r?\n/);
    const lines=[]; let currentTag=''; let currentHalfTime=false;
    for(const rl of rawLines){
      const trimmed=rl.trim();
      if(!trimmed) continue;
      const m=trimmed.match(/^\[(.+)\]$/);
      if(m){
        const parsed=parseTagHeader(m[1]);
        currentTag=parsed.tag; currentHalfTime=parsed.halfTime;
        continue;
      }
      lines.push({ text:trimmed, tag:currentTag, halfTime:currentHalfTime });
    }
    return { lines, sections: sectionsFromLines(lines) };
  }
  window.parseTaggedSongText = parseTaggedSongText;
  // Re-derives and re-attaches a song's arrangement from its linked sheet's current lines — called
  // after every lyric edit (see saveLyr) so "cross editable" holds: retag a line, delete/add lines,
  // or reorder them, and the arrangement updates live to match. No-ops when nothing changed (cheap
  // guard so typing plain lyric text, which doesn't affect tags/line-count, doesn't churn re-renders).
  function rebuildArrangementFromLyrics(sheet){
    if(!sheet || sheet.songId==null) return;
    const sections=sectionsFromLines(sheet.lines);
    if(sections.length) window.applyParsedSectionsToSong?.(sheet.songId, sections);
  }
  let lyrState=null, lyrUndo=[];
  let lyrSelected=new Set(); // holds line object references, not indices — survives reorder/insert
  // A bare, never-typed-in default counts as "no real content" — must not be treated as data worth
  // migrating/pushing (a device that only ever glanced at an empty Lyrics tab shouldn't be able to
  // stomp a different device's real lyrics on next sync).
  function lyrStateHasContent(state){
    if (!state || !Array.isArray(state.sheets) || !state.sheets.length) return false;
    if (state.sheets.length > 1) return true;
    const s = state.sheets[0];
    if (s.title && s.title.trim() && s.title.trim().toLowerCase() !== 'untitled') return true;
    return (s.lines||[]).some(l => (l.text||'').trim());
  }
  function loadLyr(){
    if (window.db && lyrStateHasContent(window.db.lyrics)) return window.db.lyrics;
    // One-time migration: earlier builds saved lyrics to this device-local-only key, never synced to Drive/backup.
    try{
      const legacy = localStorage.getItem(LYR_KEY);
      if (legacy){
        const parsed = JSON.parse(legacy);
        if (lyrStateHasContent(parsed) && window.db){
          window.db.lyrics = parsed;
          window.saveData && window.saveData();
          return parsed;
        }
      }
    }catch(e){}
    return (window.db && window.db.lyrics) || null;
  }
  function saveLyr(){
    if (!window.db) return;
    window.db.lyrics = lyrState;
    window.saveData && window.saveData();
    const s = lyrState && lyrState.sheets.find(sh=>sh.id===lyrState.activeId);
    if(s) rebuildArrangementFromLyrics(s);
  }
  function initLyrState(){
    lyrState=loadLyr();
    if(!lyrState || !lyrState.sheets || !lyrState.sheets.length){
      lyrState={ activeId:1, sheets:[{ id:1, title:'Untitled', lines:[{text:'',tag:''}] }] };
      saveLyr();
    }
  }
  const activeSheet=()=> lyrState.sheets.find(s=>s.id===lyrState.activeId) || lyrState.sheets[0];
  function pushUndo(){ try{ lyrUndo.push(JSON.stringify(activeSheet().lines)); if(lyrUndo.length>25) lyrUndo.shift(); }catch(e){} }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  // Only up to 3 sheets show as quick-switch tabs at once — everything else lives in the "+ SONG"
  // dropdown next to them. Picking a sheet from that dropdown pushes it into the tab row and bumps
  // out whichever of the 3 was added longest ago (plain sequential/FIFO, not recency-based) — clicking
  // between the 3 visible tabs never reorders or evicts anything, only bringing in a 4th does.
  let visibleTabIds=null;
  function ensureVisibleTabs(){
    if(!visibleTabIds) visibleTabIds=[];
    visibleTabIds=visibleTabIds.filter(id=>lyrState.sheets.some(s=>s.id===id));
    if(!visibleTabIds.includes(lyrState.activeId)){
      if(visibleTabIds.length>=3) visibleTabIds.shift();
      visibleTabIds.push(lyrState.activeId);
    }
    for(const s of lyrState.sheets){
      if(visibleTabIds.length>=3) break;
      if(!visibleTabIds.includes(s.id)) visibleTabIds.push(s.id);
    }
  }
  function renderSheetTabs(){
    const wrap=$('lyr-sheet-tabs'); if(!wrap) return;
    ensureVisibleTabs();
    const visible=visibleTabIds.map(id=>lyrState.sheets.find(s=>s.id===id)).filter(Boolean);
    wrap.innerHTML=visible.map(s=>{ const on=s.id===lyrState.activeId; return `<button class="lyr-tab shrink-0 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded border transition-colors ${on?'bg-[#FF88FF]/15 border-[#FF88FF60] text-[#FF88FF]':'border-[#FF88FF20] text-[#FF88FF]/50 hover:text-[#FF88FF]'}" data-id="${s.id}">${window.escapeHtml((s.title||'Untitled').slice(0,18))}${lyrState.sheets.length>1?` <span class="lyr-tab-x text-white/30 hover:text-[#FF5A5A] ml-1" data-del="${s.id}">×</span>`:''}</button>`; }).join('');
    wrap.querySelectorAll('.lyr-tab').forEach(b=>b.addEventListener('click',(e)=>{ if(e.target.classList.contains('lyr-tab-x')) return; lyrState.activeId=parseInt(b.dataset.id,10); lyrUndo=[]; lyrSelected.clear(); saveLyr(); renderLyr(); }));
    wrap.querySelectorAll('.lyr-tab-x').forEach(x=>x.addEventListener('click',(e)=>{ e.stopPropagation(); const id=parseInt(x.dataset.del,10); if(!confirm('Delete this sheet?')) return; lyrState.sheets=lyrState.sheets.filter(s=>s.id!==id); if(lyrState.activeId===id) lyrState.activeId=lyrState.sheets[0].id; visibleTabIds=visibleTabIds.filter(x=>x!==id); const orphan=(window.db&&window.db.songBoard||[]).find(s=>s.lyricsSheetId===id); if(orphan) orphan.lyricsSheetId=null; saveLyr(); renderLyr(); }));
    const moreSel=$('lyr-sheet-more');
    if(moreSel){
      const others=lyrState.sheets.filter(s=>!visibleTabIds.includes(s.id));
      moreSel.classList.toggle('hidden', !others.length);
      moreSel.innerHTML='<option value="">+ SONG ▾</option>'+others.map(s=>`<option value="${s.id}">${window.escapeHtml((s.title||'Untitled').slice(0,30))}</option>`).join('');
    }
  }
  function renderLines(){
    const box=$('lyr-lines'); if(!box) return; const sheet=activeSheet(); const showSyl=$('lyr-show-syl')?.checked;
    // Chords are hand-typed annotations (Bb, C#m, Am, E7) that live on the line itself, so they ride
    // along with it through cut-up shuffles and drag-reorders — the chord belongs to that line, not to
    // a position on the page. Nothing parses or validates them; whatever you type is what shows.
    // The AI never sees this field: lyrGetActiveText/lyrGetActiveTextPlain deliberately omit it, so
    // punch-ups and continuations stay strictly about words.
    const showChords=$('lyr-show-chords')?.checked;
    box.innerHTML=sheet.lines.map((ln,i)=>{
      const tc=tagStyle(ln.tag)[1];
      const syl=showSyl? ln.text.trim().split(/\s+/).filter(Boolean).reduce((s,w)=>s+syllables(w),0):0;
      return `<div class="lyr-row flex items-center gap-1.5 group${ln.alt?' lyr-row-alt':''}" data-i="${i}" title="${ln.alt?'Punch-up alternative — pick your favorite, delete the rest':''}">`+
        `<input type="checkbox" class="lyr-select accent-[#FFD60A] shrink-0 cursor-pointer" data-i="${i}"${lyrSelected.has(ln)?' checked':''} title="Select for Punch Up / Delete">`+
        `<span class="lyr-handle cursor-grab text-white/20 hover:text-[#FF88FF] text-[13px] select-none shrink-0" draggable="true" title="Drag to reorder">⠿</span>`+
        (ln.alt?`<span class="lyr-alt-badge text-[8px] font-bold tracking-widest px-1 py-0.5 rounded border border-[#FFD60A50] text-[#FFD60A] shrink-0">ALT</span>`:'')+
        `<select class="lyr-tag bg-black/40 border rounded text-[9px] font-bold px-1 py-1.5 focus:outline-none shrink-0" style="color:${tc};border-color:${tc}40" data-i="${i}">${Object.keys(TAGS).map(t=>`<option value="${t}"${t===ln.tag?' selected':''}>${t||'—'}</option>`).join('')}</select>`+
        `<div class="flex-1 min-w-0 flex flex-col">`+
          (showChords?`<input type="text" class="lyr-chords bg-transparent border-0 text-[11px] font-mono font-bold text-[#FFD60A]/90 px-1 pt-0.5 pb-0 focus:outline-none placeholder-[#FFD60A]/20" value="${(ln.chords||'').replace(/"/g,'&quot;')}" data-i="${i}" placeholder="Bb   C#m   Am   E7" spellcheck="false" autocomplete="off" draggable="false" aria-label="Chords for this line">`:'')+
          `<input type="text" class="lyr-text w-full bg-transparent border-b ${ln.alt?'border-[#FFD60A40]':'border-white/10'} focus:border-[#FF88FF] text-[13px] text-[#E2E8F0]/90 px-1 py-1.5 focus:outline-none" value="${(ln.text||'').replace(/"/g,'&quot;')}" data-i="${i}" placeholder="…" draggable="false">`+
        `</div>`+
        (showSyl?`<span class="text-[9px] font-mono text-[#FF88FF]/60 w-6 text-right shrink-0">${syl||''}</span>`:'')+
        // Chords hidden but present: say so, rather than letting a line look empty when it isn't.
        (!showChords && (ln.chords||'').trim()?`<span class="text-[10px] text-[#FFD60A]/50 shrink-0" title="This line has chords — tick CHORDS to see or edit them">♪</span>`:'')+
        `<button class="lyr-del text-white/20 hover:text-[#FF5A5A] text-[13px] shrink-0 opacity-0 group-hover:opacity-100" data-i="${i}" title="Delete line">×</button>`+
        `</div>`;
    }).join('');
    // text edit
    box.querySelectorAll('.lyr-text').forEach(inp=>{
      inp.addEventListener('input',()=>{ const ln=activeSheet().lines[+inp.dataset.i]; ln.text=inp.value; if(ln.alt){ ln.alt=false; const row=inp.closest('.lyr-row'); row?.classList.remove('lyr-row-alt'); row?.removeAttribute('title'); row?.querySelector('.lyr-alt-badge')?.remove(); inp.classList.remove('border-[#FFD60A40]'); inp.classList.add('border-white/10'); } saveLyr(); updateLyrMeta(); if($('lyr-show-syl')?.checked){ const b=inp.closest('.lyr-row')?.querySelector('span.font-mono'); if(b){ const c=inp.value.trim().split(/\s+/).filter(Boolean).reduce((s,w)=>s+syllables(w),0); b.textContent=c||''; } } });
      inp.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ e.preventDefault(); const i=+inp.dataset.i; activeSheet().lines.splice(i+1,0,{text:'',tag:activeSheet().lines[i].tag}); saveLyr(); renderLines(); const nx=box.querySelector(`.lyr-text[data-i="${i+1}"]`); nx&&nx.focus(); } });
      inp.addEventListener('dblclick',()=>{ const w=(window.getSelection().toString()||'').trim(); if(w){ $('lyr-rhyme-in').value=w; findRhymes(); } });
    });
    // Chord edits save straight to the line and never re-render (a re-render would steal focus
    // mid-typing). Enter drops down into that line's lyric box, which is the natural next keystroke.
    box.querySelectorAll('.lyr-chords').forEach(inp=>{
      inp.addEventListener('input',()=>{ activeSheet().lines[+inp.dataset.i].chords=inp.value; saveLyr(); });
      inp.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){ e.preventDefault(); box.querySelector(`.lyr-text[data-i="${inp.dataset.i}"]`)?.focus(); } });
    });
    box.querySelectorAll('.lyr-tag').forEach(sel=> sel.addEventListener('change',()=>{ activeSheet().lines[+sel.dataset.i].tag=sel.value; saveLyr(); renderLines(); }));
    box.querySelectorAll('.lyr-del').forEach(b=> b.addEventListener('click',()=>{ pushUndo(); const s=activeSheet(); const ln=s.lines[+b.dataset.i]; lyrSelected.delete(ln); s.lines.splice(+b.dataset.i,1); if(!s.lines.length) s.lines.push({text:'',tag:''}); saveLyr(); renderLines(); updateLyrMeta(); }));
    box.querySelectorAll('.lyr-select').forEach(cb=> cb.addEventListener('change',()=>{ const ln=activeSheet().lines[+cb.dataset.i]; if(cb.checked) lyrSelected.add(ln); else lyrSelected.delete(ln); updateLyrSelectBar(); }));
    wireDnD();
    updateLyrMeta();
    updateLyrSelectBar();
  }
  function updateLyrSelectBar(){
    const bar=$('lyr-select-bar'); const count=$('lyr-select-count'); if(!bar||!count) return;
    const n=lyrSelected.size;
    bar.classList.toggle('hidden', n===0);
    bar.classList.toggle('flex', n>0);
    count.textContent=`${n} SELECTED`;
  }
  function wireDnD(){
    const box=$('lyr-lines'); let dragI=null;
    box.querySelectorAll('.lyr-handle').forEach(h=>{
      h.addEventListener('dragstart',(e)=>{ dragI=+h.closest('.lyr-row').dataset.i; e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',String(dragI));}catch(err){} });
    });
    box.querySelectorAll('.lyr-row').forEach(row=>{
      row.addEventListener('dragover',(e)=>{ e.preventDefault(); row.style.borderTop='2px solid #FF88FF'; });
      row.addEventListener('dragleave',()=>{ row.style.borderTop=''; });
      row.addEventListener('drop',(e)=>{ e.preventDefault(); row.style.borderTop=''; const to=+row.dataset.i; if(dragI===null||dragI===to) return; pushUndo(); const lines=activeSheet().lines; const [m]=lines.splice(dragI,1); lines.splice(to,0,m); saveLyr(); renderLines(); dragI=null; });
    });
  }
  function updateLyrMeta(){
    const s=activeSheet(); const nonEmpty=s.lines.filter(l=>l.text.trim());
    const totSyl=nonEmpty.reduce((sum,l)=>sum+l.text.trim().split(/\s+/).filter(Boolean).reduce((a,w)=>a+syllables(w),0),0);
    const avg=nonEmpty.length?(totSyl/nonEmpty.length).toFixed(1):'0';
    const m=$('lyr-meta'); if(m) m.textContent=`${nonEmpty.length} LINES · ${totSyl} SYLLABLES · ${avg} AVG/LINE`;
  }
  // looks up a section's color the same way sectionsFromLines derives its tag — strip a trailing
  // numeral ("Verse 1" -> VERSE) and match against TAGS, so chips use the same palette as the
  // per-line tag glyphs/dropdown and (via the identical mapping in ARR_TYPES) the Arrangement Timeline
  // Section names are display names ("Pre-Chorus", "Guitar Solo"), so resolve them back through the
  // same matcher the parser uses instead of assuming the name IS the tag key.
  function colorForSection(name){
    const clean=(name||'').replace(/\s*\(Half Time\)/i,'').replace(/\s+\d+$/,'').trim();
    if(!clean) return TAGS[''][1];
    const squashed=clean.toUpperCase().replace(/[^A-Z]/g,'');
    const hit=TAG_MATCH.find(([pat])=>squashed.includes(pat));
    return tagStyle(hit?hit[1]:clean.toUpperCase())[1];
  }
  function renderStructureStrip(){
    const el=$('lyr-structure-strip'); if(!el) return;
    const sheet=activeSheet();
    const songId=sheet.songId;
    const song=songId!=null ? (window.db&&window.db.songBoard||[]).find(x=>x.id===songId) : null;
    const sections=song&&song.arrangement&&song.arrangement.sections;
    if(!song || ((!sections||!sections.length) && !song.bpm)){ el.classList.add('hidden'); el.classList.remove('flex'); el.innerHTML=''; return; }
    el.classList.remove('hidden'); el.classList.add('flex');
    const bpmChip = song.bpm ? `<span class="text-[9px] font-bold px-2 py-0.5 rounded border border-[#00E5FF40] text-[#00E5FF] font-mono">${song.bpm} BPM</span>` : '';
    el.innerHTML = `<span class="text-[9px] text-white/30 tracking-widest mr-1">🎬 STRUCTURE:</span>` + bpmChip
      + (sections||[]).map(s=>{ const c=colorForSection(s.name); return `<span class="text-[9px] font-bold px-2 py-0.5 rounded border" style="border-color:${c}40;color:${c}">${s.name}</span>`; }).join('')
      + ((sections&&sections.length) ? `<button id="btn-lyr-insert-structure" type="button" class="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border border-[#B18CFF60] text-[#B18CFF] hover:bg-[#B18CFF20] ml-1">+ INSERT AS HEADERS</button>` : '');
    $('btn-lyr-insert-structure')?.addEventListener('click',()=>{ window.lyrAddLines(sections.map(s=>`[${s.name}]`)); });
  }
  // renderLyrTakes lives in the AI Co-Pilot closure (js/08-ai-settings.js) but the saved-takes list is
  // per-sheet, so it has to repaint whenever the active sheet changes — which is exactly here.
  function renderLyr(){ const t=$('lyr-title'); if(t) t.value=activeSheet().title||''; renderSheetTabs(); renderLines(); renderStructureStrip(); if(typeof lyrMode!=='undefined' && lyrMode==='analyze') buildAnalyze(); window.renderLyrTakes?.(); }

  // ---- built-in rhyme bank ----
  const RHYME_BANK='time rhyme climb prime mind find grind line shine sign design fire desire higher wire light night fight right sight tight bright flight sky high fly try eye cry die lie why day way say play stay away pray grey fade made way pain rain chain brain gain train plane game name flame fame blame shame ground sound found around down town crown clown gold cold bold soul road load code mode flow low grow show know glow slow snow soul roll control goal whole heart start apart part smart dark spark heavy ready steady heart hard guard hold gold fold told sold cold night alright tonight world word heard bird hurt work dirt love above enough tough rough stuff stay pay away today gun run fun done son one gone alone zone throne home roam dome smoke broke woke hope dope rope scope real feel deal steel steal wheel money honey funny sunny run done street beat heat sweet complete defeat repeat mine fine wine divine live give real deal fear tear near clear year hear dream team scheme cream king ring thing bring sing wing swing sting'.split(' ');
  function rkey(w){ w=w.toLowerCase().replace(/[^a-z]/g,''); w=w.replace(/([^aeiou])e$/,'$1'); return { s2:w.slice(-2), s3:w.slice(-3), w }; }
  // crude vowel-sound stand-in for slant/near-rhyme matching: strip a silent trailing e, then
  // take the last vowel letter (treating y as one) as the rhyme's stressed nucleus. Loose on
  // purpose — s2/s3 above only match when the spelling lines up (night/light), so real pairs
  // that sound alike but are spelled differently (money/funny, time/kite) fall through the
  // strict suffix check entirely. This catches those at the cost of some false positives, which
  // is the trade slant rhyme is supposed to make.
  function slantKey(w){ w=w.toLowerCase().replace(/[^a-z]/g,''); w=w.replace(/([^aeiou])e$/,'$1'); const m=w.match(/[aeiouy](?=[^aeiouy]*$)/); return m?m[0]:''; }
  // compact songwriter thesaurus
  const THESAURUS={ love:['adore','cherish','crave','worship','desire'], hate:['loathe','despise','resent','detest'], happy:['elated','bright','alive','golden','high'], sad:['hollow','broken','heavy','blue','low'], run:['bolt','sprint','flee','race','dash'], fast:['quick','swift','rapid','breakneck'], slow:['lazy','heavy','crawling','dragging'], night:['dark','midnight','shadow','dusk','black'], light:['glow','shine','flame','spark','beam'], fire:['flame','blaze','burn','ember','spark'], dream:['vision','fantasy','trance','mirage'], fall:['crash','tumble','plummet','sink','drop'], rise:['climb','soar','ascend','lift','swell'], fight:['battle','clash','struggle','war','brawl'], home:['haven','shelter','roots','refuge'], road:['path','highway','route','trail','way'], cold:['frozen','icy','bitter','numb'], strong:['fierce','mighty','solid','iron','tough'], lost:['gone','adrift','stranded','missing'], real:['true','honest','raw','genuine'], pain:['ache','hurt','sting','sorrow','wound'], free:['loose','unchained','wild','open'], time:['moment','hour','era','forever','season'], heart:['soul','chest','core','pulse'], king:['ruler','lord','boss','champion'], gold:['riches','treasure','shine','fortune'] };
  let lyrFindMode='rhyme';
  function findRhymes(){
    const inp=$('lyr-rhyme-in'), out=$('lyr-rhyme-out'); if(!out) return;
    const target=(inp.value||'').trim(); if(!target){ out.innerHTML='<span class="text-[10px] text-white/25 italic">Type a word…</span>'; return; }
    const wire=()=>out.querySelectorAll('.lyr-rchip').forEach(c=>c.addEventListener('click',()=>{ inp.value=c.dataset.w; findRhymes(); }));
    if(lyrFindMode==='syn'){
      const syns=THESAURUS[target.toLowerCase().replace(/[^a-z]/g,'')];
      if(!syns){ out.innerHTML='<span class="text-[10px] text-white/25 italic">Not in the songwriter thesaurus — try love, fire, night, run, sad, strong…</span>'; return; }
      out.innerHTML=`<div class="w-full text-[8px] text-[#B18CFF]/50 tracking-widest mb-1">SYNONYMS</div>`+syns.map(w=>`<button class="lyr-rchip text-[10px] font-mono px-2 py-1 rounded border cursor-pointer" style="color:#00E5FF;border-color:#00E5FF40;background:#00E5FF0A" data-w="${w}">${w}</button>`).join(''); wire(); return;
    }
    const tk=rkey(target);
    const corpus=new Set(RHYME_BANK);
    lyrState.sheets.forEach(s=>s.lines.forEach(l=>l.text.toLowerCase().split(/[^a-z']+/).forEach(w=>{ w=w.replace(/[^a-z]/g,''); if(w.length>2) corpus.add(w); })));
    const strong=[], slant=[];
    corpus.forEach(w=>{ if(w===tk.w) return; const k=rkey(w); if(k.s3===tk.s3 && tk.s3.length===3) strong.push(w); else if(k.s2===tk.s2) slant.push(w); });
    const uniq=(a)=>[...new Set(a)].sort((x,y)=>x.length-y.length).slice(0,24);
    const chips=(arr,col)=>uniq(arr).map(w=>`<button class="lyr-rchip text-[10px] font-mono px-2 py-1 rounded border cursor-pointer" style="color:${col};border-color:${col}40;background:${col}0A" data-w="${w}">${w}</button>`).join('');
    let html='';
    if(strong.length) html+=`<div class="w-full text-[8px] text-[#B18CFF]/50 tracking-widest mb-1">RHYMES</div>`+chips(strong,'#FF88FF');
    if(slant.length) html+=`<div class="w-full text-[8px] text-[#B18CFF]/50 tracking-widest mt-2 mb-1">SLANT / NEAR</div>`+chips(slant,'#B18CFF');
    out.innerHTML=html||'<span class="text-[10px] text-white/25 italic">No matches in the bank — try a shorter or more common word.</span>';
    wire();
  }

  function lyrCutup(sectionOnly){
    pushUndo(); const s=activeSheet();
    if(sectionOnly){
      const groups={}; s.lines.forEach((l,i)=>{ (groups[l.tag]=groups[l.tag]||[]).push(l); });
      Object.keys(groups).forEach(k=>shuffle(groups[k]));
      const order=[...new Set(s.lines.map(l=>l.tag))]; const rebuilt=[]; order.forEach(t=>{ groups[t].forEach(l=>rebuilt.push(l)); });
      s.lines=rebuilt;
    } else { shuffle(s.lines); }
    saveLyr(); renderLines();
    const b=$('lyr-lines'); if(b){ b.style.transition='none'; b.style.opacity='0.3'; requestAnimationFrame(()=>{ b.style.transition='opacity .3s'; b.style.opacity='1'; }); }
  }
  function lyrExport(){
    // Chords go out as their own line above the lyric, the way a chord sheet is normally written —
    // and they're included whether or not the CHORDS toggle happens to be on, since a .txt is the
    // copy you keep. Lines with no chords are unchanged, so a lyrics-only sheet exports as before.
    const s=activeSheet(); const txt=s.lines.map(l=>((l.chords||'').trim()?(l.chords.trim()+'\n'):'')+(l.tag?`[${l.tag}] `:'')+l.text).join('\n');
    const blob=new Blob([`${s.title||'Untitled'}\n\n${txt}`],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(s.title||'lyrics').replace(/[^a-z0-9]+/gi,'_')+'.txt'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),800);
  }
  window.refreshLyrics=()=>{ if(!lyrState) initLyrState(); renderLyr(); };
  // Opens (or creates) the lyric sheet linked to a Song Board song, so "Open in Lyrics" on a
  // song card can jump straight to that song's own sheet instead of whatever was last active.
  window.lyrOpenSheetForSong=(songId,songTitle)=>{
    if(!lyrState) initLyrState();
    const song=(window.db&&window.db.songBoard||[]).find(s=>s.id===songId);
    let sheet = song && song.lyricsSheetId!=null ? lyrState.sheets.find(sh=>sh.id===song.lyricsSheetId) : null;
    if(!sheet){
      sheet={ id:Date.now(), title:(songTitle||'Untitled'), lines:[{text:'',tag:''}] };
      lyrState.sheets.push(sheet);
      if(song) song.lyricsSheetId=sheet.id;
    }
    sheet.songId=songId;
    lyrState.activeId=sheet.id;
    lyrUndo=[]; lyrSelected.clear();
    saveLyr(); renderLyr();
  };
  // Opens/creates the sheet linked to a song (same as above) then replaces its lines with an
  // already-parsed {text,tag} array — used by the "paste a tagged song" flow on the Song Board
  // and Arrangement Timeline, which parse lyrics+structure in one shot from pasted text.
  window.lyrLoadParsedLines=(songId,songTitle,lines)=>{
    window.lyrOpenSheetForSong(songId,songTitle);
    const sheet=activeSheet();
    sheet.lines = (lines&&lines.length) ? lines : [{text:'',tag:''}];
    saveLyr(); renderLyr();
  };
  // Drops the in-memory cache so the next refreshLyrics() re-reads window.db.lyrics from scratch —
  // needed after a Drive pull lands newer lyrics than whatever's already cached in this tab session.
  window.lyrForceReload=()=>{ lyrState=null; };
  window.lyrStateHasContent=lyrStateHasContent; // lets a Drive pull refuse to let an empty cloud copy stomp real local lyrics
  // exposed for the AI co-pilot (keeps lyrState the single source of truth) — tagged, because the
  // AI needs section context to rewrite/analyze sensibly.
  window.lyrGetActiveText=()=>{ if(!lyrState) initLyrState(); return activeSheet().lines.map(l=>(l.tag?`[${l.tag}] `:'')+l.text).filter(x=>x.trim()).join('\n'); };
  // Plain words only, no [Verse]-style tags — for the COPY button. Tagged output has its own home in
  // the Lyria Prompt Generator (attach the song there for the tagged/timed version); this one is for
  // pasting lyrics somewhere that doesn't want the tags at all.
  window.lyrGetActiveTextPlain=()=>{ if(!lyrState) initLyrState(); return activeSheet().lines.map(l=>l.text).filter(x=>x.trim()).join('\n'); };
  window.lyrGetTitle=()=>{ if(!lyrState) initLyrState(); return activeSheet().title||''; };
  window.lyrAddLines=(arr,opts)=>{ if(!lyrState) initLyrState(); if(!Array.isArray(arr)||!arr.length) return; pushUndo(); const s=activeSheet(); if(s.lines.length===1 && !s.lines[0].text.trim()) s.lines=[]; const alt=!!(opts&&opts.alt); arr.forEach(item=>{ if(typeof item==='string'){ const m=item.match(/^\[(.+?)\]\s*(.*)$/); const parsed=m?parseTagHeader(m[1]):null; if(parsed&&parsed.tag) s.lines.push({text:m[2],tag:parsed.tag,halfTime:parsed.halfTime,alt}); else s.lines.push({text:item,tag:'',alt}); } }); saveLyr(); renderLyr(); };
  // ---- bridge for the AI Co-Pilot script (separate closure) to reach the selection/line state above ----
  window.lyrGetSelectedLines=()=>{ if(!lyrState) initLyrState(); const s=activeSheet(); return Array.from(lyrSelected).filter(ln=>s.lines.includes(ln)); };
  window.lyrGetLastNonEmptyLine=()=>{ if(!lyrState) initLyrState(); const ne=activeSheet().lines.filter(l=>l.text.trim()); return ne.length?ne[ne.length-1]:null; };
  window.lyrBeginBatchEdit=()=>{ if(!lyrState) initLyrState(); pushUndo(); };
  window.lyrInsertAltsAfterLine=(ln,alts)=>{ if(!lyrState||!alts||!alts.length) return false; const s=activeSheet(); const idx=s.lines.indexOf(ln); if(idx<0) return false; s.lines.splice(idx+1,0,...alts.map(a=>({text:a,tag:'',alt:true}))); return true; };
  window.lyrFinishBatchEdit=()=>{ lyrSelected.clear(); saveLyr(); renderLyr(); };

  // The arrangement of the Song Board song this sheet is linked to, as [[name, bars], ...] — lets the
  // AI song builder write to the shape a song ALREADY has (its real section order and bar counts)
  // instead of a generic template. Null when the sheet isn't linked or that song has no arrangement.
  window.lyrLinkedArrangement=()=>{
    if(!lyrState) initLyrState();
    const sheet=activeSheet(); if(sheet.songId==null) return null;
    const song=(window.db&&window.db.songBoard||[]).find(s=>String(s.id)===String(sheet.songId));
    const secs=song && song.arrangement && Array.isArray(song.arrangement.sections) ? song.arrangement.sections : null;
    if(!secs || !secs.length) return null;
    return { title: song.title||'', sections: secs.map(s=>[String(s.name||'Section'), Math.max(1, parseInt(s.bars,10)||8)]) };
  };
  // Creates a brand-new sheet from a block of text and switches to it, leaving the current sheet
  // untouched — the "＋ AS NEW SHEET" path out of the AI draft box.
  window.lyrNewSheetFromLines=(title, arr)=>{
    if(!lyrState) initLyrState();
    const sheet={ id:Date.now(), title:title||'Untitled', lines:[{text:'',tag:''}] };
    lyrState.sheets.push(sheet); lyrState.activeId=sheet.id;
    lyrUndo=[]; lyrSelected.clear();
    saveLyr(); renderLyr();
    if(Array.isArray(arr) && arr.length) window.lyrAddLines(arr);
    return sheet.id;
  };

  // ---- saved lyric takes (per sheet) ----
  // A take is a whole block of lyric text kept BESIDE the sheet instead of merged into it, so several
  // drafts of the same verse can sit side by side without any of them touching your actual lines
  // until you pick one. Stored on the sheet itself (sheet.takes), so takes travel through
  // export / import / Drive sync exactly like the lines do — same shape and same LOAD/COPY/DELETE
  // pattern as the Lyria Prompt and Producer Notes take lists.
  window.lyrTakes = {
    list: () => { if(!lyrState) initLyrState(); const s=activeSheet(); s.takes=s.takes||[]; return s.takes; },
    get: (id) => window.lyrTakes.list().find(t=>String(t.id)===String(id)) || null,
    sheetTitle: () => { if(!lyrState) initLyrState(); return activeSheet().title||'Untitled'; },
    add: (name, text, params) => {
      const list=window.lyrTakes.list();
      const take={ id:Date.now()*1000+Math.floor(Math.random()*1000), name:name||`Take ${list.length+1}`, createdAt:Date.now(), text:text||'', params:params||{} };
      list.push(take); saveLyr(); return take;
    },
    // Text-only update — this is what the debounced autosave calls while you type in a loaded take,
    // so editing a saved take never needs SAVE pressed again (same behaviour as the other two lists).
    update: (id, text) => { const t=window.lyrTakes.get(id); if(!t) return null; t.text=text; saveLyr(); return t; },
    rename: (id, name) => { const t=window.lyrTakes.get(id); if(!t||!name) return null; t.name=name; saveLyr(); return t; },
    remove: (id) => { if(!lyrState) initLyrState(); const s=activeSheet(); s.takes=(s.takes||[]).filter(t=>String(t.id)!==String(id)); saveLyr(); }
  };

  // ---- ANALYZE MODE: rhyme scheme, internal rhymes, contour ----
  let lyrMode='edit';
  const SCHEME_COLORS=['#FF88FF','#00E5FF','#FFD60A','#00FF88','#B18CFF','#FF5A5A','#7AFFBF','#FF9F45'];
  const sylOfLine=(t)=> t.trim().split(/\s+/).filter(Boolean).reduce((s,w)=>s+syllables(w),0);
  const lastWord=(t)=>{ const m=t.trim().toLowerCase().match(/[a-z']+(?=[^a-z']*$)/); return m?m[0].replace(/[^a-z]/g,''):''; };
  function buildAnalyze(){
    const box=$('lyr-analyze'); if(!box) return; const sheet=activeSheet();
    const lines=sheet.lines.filter(l=>l.text.trim());
    if(!lines.length){ box.innerHTML='<div class="text-[11px] text-white/30 italic py-4">Write some lines, then analyze.</div>'; return; }
    // end-rhyme scheme: group end words by rhyme key
    const endKeys=lines.map(l=>{ const lw=lastWord(l.text); return lw? rkey(lw).s2 : null; });
    const letterFor={}; let next=0; const schemeLetters=endKeys.map(k=>{ if(!k) return '·'; if(!(k in letterFor)){ letterFor[k]=next++; } return String.fromCharCode(65+ (letterFor[k]%26)); });
    // count only rhyme groups with 2+ members for coloring
    const keyCount={}; endKeys.forEach(k=>{ if(k) keyCount[k]=(keyCount[k]||0)+1; });
    const colorForKey={}; let ci=0; Object.keys(keyCount).forEach(k=>{ if(keyCount[k]>=2){ colorForKey[k]=SCHEME_COLORS[ci++ % SCHEME_COLORS.length]; } });
    // slant end-rhymes: same idea as above but on the vowel-sound key, for end words the strict
    // s2 suffix match misses entirely (only used as a fallback when a line has no strong match)
    const endSlantKeys=lines.map(l=>{ const lw=lastWord(l.text); return lw? slantKey(lw) : null; });
    const slantKeyCount={}; endSlantKeys.forEach(k=>{ if(k) slantKeyCount[k]=(slantKeyCount[k]||0)+1; });
    const slantColorForKey={}; let sci=0; Object.keys(slantKeyCount).forEach(k=>{ if(slantKeyCount[k]>=2){ slantColorForKey[k]=SCHEME_COLORS[(SCHEME_COLORS.length-1-(sci++)) % SCHEME_COLORS.length]; } });
    // internal rhymes: rhyme keys appearing 2+ times among all words (exclude single)
    const wordKeyCount={}; lines.forEach(l=>l.text.toLowerCase().split(/[^a-z']+/).forEach(w=>{ w=w.replace(/[^a-z]/g,''); if(w.length>2){ const k=rkey(w).s3; if(k.length===3) wordKeyCount[k]=(wordKeyCount[k]||0)+1; } }));
    const intColor={}; let ii=0; Object.keys(wordKeyCount).forEach(k=>{ if(wordKeyCount[k]>=3){ intColor[k]=SCHEME_COLORS[(SCHEME_COLORS.length-1- (ii++)) % SCHEME_COLORS.length]; } });
    // slant internal rhymes: same vowel-sound key as above, over individual words this time
    const wordSlantCount={}; lines.forEach(l=>l.text.toLowerCase().split(/[^a-z']+/).forEach(w=>{ w=w.replace(/[^a-z]/g,''); if(w.length>2){ const k=slantKey(w); if(k) wordSlantCount[k]=(wordSlantCount[k]||0)+1; } }));
    const slantWordColor={}; let swi=0; Object.keys(wordSlantCount).forEach(k=>{ if(wordSlantCount[k]>=2){ slantWordColor[k]=SCHEME_COLORS[swi++ % SCHEME_COLORS.length]; } });
    const showInternal=$('lyr-show-internal')?.checked;
    const showSlant=$('lyr-show-slant')?.checked;
    const rows=lines.map((l,idx)=>{
      const key=endKeys[idx]; const endCol=key&&colorForKey[key]?colorForKey[key]:null;
      const sKey=endSlantKeys[idx]; const endSlantCol=(showSlant && !endCol && sKey && slantColorForKey[sKey])?slantColorForKey[sKey]:null;
      const words=l.text.split(/(\s+)/);
      let lastRealIdx=-1; words.forEach((w,wi)=>{ if(w.trim()) lastRealIdx=wi; });
      const rendered=words.map((w,wi)=>{
        if(!w.trim()) return w;
        const clean=w.toLowerCase().replace(/[^a-z]/g,'');
        const isEnd=wi===lastRealIdx;
        if(isEnd && endCol) return `<span style="color:${endCol};font-weight:700;border-bottom:2px solid ${endCol}">${w}</span>`;
        if(isEnd && endSlantCol) return `<span style="color:${endSlantCol};font-weight:700;border-bottom:2px dotted ${endSlantCol}">${w}</span>`;
        if(showInternal){ const k=clean.length>2?rkey(clean).s3:''; if(k.length===3 && intColor[k] && !isEnd) return `<span style="color:${intColor[k]}">${w}</span>`; }
        if(showSlant){ const sk=clean.length>2?slantKey(clean):''; if(sk && slantWordColor[sk] && !isEnd) return `<span style="color:${slantWordColor[sk]};text-decoration:underline dotted;text-decoration-color:${slantWordColor[sk]}90">${w}</span>`; }
        return w;
      }).join('');
      const tagc=tagStyle(l.tag)[1];
      return `<div class="flex items-baseline gap-2 py-0.5">`+
        `<span class="text-[10px] font-bold font-mono w-4 text-center shrink-0" style="color:${endCol||endSlantCol||'rgba(255,255,255,0.25)'}">${schemeLetters[idx]}</span>`+
        (l.tag?`<span class="text-[8px] font-bold shrink-0" style="color:${tagc}">${l.tag[0]}</span>`:'<span class="w-2 shrink-0"></span>')+
        `<span class="text-[13px] text-[#E2E8F0]/90 flex-1 leading-relaxed">${rendered}</span>`+
        `<span class="text-[9px] font-mono text-[#FF88FF]/50 w-6 text-right shrink-0">${sylOfLine(l.text)}</span>`+
        `</div>`;
    }).join('');
    // scheme label (collapse consecutive, cap)
    const schemeStr=schemeLetters.join(' ');
    // contour sparkline
    const sylArr=lines.map(l=>sylOfLine(l.text)); const mx=Math.max(...sylArr,1);
    const spark=`<svg viewBox="0 0 ${sylArr.length*10} 30" preserveAspectRatio="none" class="w-full h-8">`+
      sylArr.map((s,i)=>`<rect x="${i*10+1}" y="${30-(s/mx)*28}" width="8" height="${(s/mx)*28}" fill="#FF88FF${s===mx?'':'80'}" rx="1"/>`).join('')+`</svg>`;
    box.innerHTML=`<div class="p-4 rounded border border-[#FF88FF25] bg-black/30">`+
      `<div class="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[#FF88FF15]">`+
        `<div class="text-[9px] tracking-widest text-[#FF88FF]/70">RHYME SCHEME &nbsp;<span class="text-white/90 font-mono">${schemeStr.slice(0,80)}</span></div>`+
        `<div class="flex items-center gap-3">`+
        `<label class="flex items-center gap-1.5 text-[9px] text-[#B18CFF]/70 tracking-widest cursor-pointer"><input type="checkbox" id="lyr-show-internal" class="accent-[#B18CFF]" ${showInternal?'checked':''}> INTERNAL RHYMES</label>`+
        `<label class="flex items-center gap-1.5 text-[9px] text-[#FFD60A]/70 tracking-widest cursor-pointer" title="Looser vowel-sound match — catches near-rhymes the strict check misses (money/funny, time/kite)"><input type="checkbox" id="lyr-show-slant" class="accent-[#FFD60A]" ${showSlant?'checked':''}> SLANT RHYMES</label>`+
        `</div>`+
      `</div>`+
      rows+
      `<div class="mt-3 pt-2 border-t border-[#FF88FF15]"><div class="text-[8px] tracking-widest text-[#FF88FF]/50 mb-1">SYLLABLE CONTOUR (flow evenness)</div>${spark}</div>`+
    `</div>`;
    $('lyr-show-internal')?.addEventListener('change', buildAnalyze);
    $('lyr-show-slant')?.addEventListener('change', buildAnalyze);
  }
  function setLyrMode(m){
    lyrMode=m; const edit=m==='edit';
    $('lyr-lines')?.classList.toggle('hidden',!edit);
    $('lyr-analyze')?.classList.toggle('hidden',edit);
    $('lyr-analyze-tools')?.classList.toggle('hidden',edit);
    $('lyr-analyze-tools')?.classList.toggle('flex',!edit);
    const be=$('btn-lyr-mode-edit'), ba=$('btn-lyr-mode-analyze');
    if(be&&ba){ be.classList.toggle('bg-[#FF88FF]/20',edit); be.classList.toggle('text-[#FF88FF]',edit); be.classList.toggle('text-[#FF88FF]/50',!edit); ba.classList.toggle('bg-[#FF88FF]/20',!edit); ba.classList.toggle('text-[#FF88FF]',!edit); ba.classList.toggle('text-[#FF88FF]/50',edit); }
    if(!edit) buildAnalyze(); else stopRead();
  }
  // ---- READ ALOUD (TTS) ----
  let reading=false;
  function stopRead(){ reading=false; try{ window.speechSynthesis?.cancel(); }catch(e){} const b=$('btn-lyr-read'); if(b) b.textContent='🔊 READ ALOUD'; }
  function toggleRead(){
    if(!window.speechSynthesis){ alert('Speech synthesis not available in this browser.'); return; }
    if(reading){ stopRead(); return; }
    const lines=activeSheet().lines.filter(l=>l.text.trim()); if(!lines.length) return;
    reading=true; const b=$('btn-lyr-read'); if(b) b.textContent='■ STOP';
    const rate=(+($('lyr-read-rate')?.value||95))/100;
    const u=new SpeechSynthesisUtterance(lines.map(l=>l.text).join('. \n'));
    u.rate=rate; u.pitch=1;
    u.onend=()=>{ reading=false; if(b) b.textContent='🔊 READ ALOUD'; };
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  }
  // ---- SPARK: random evocative word ----
  const SPARK_WORDS='neon velvet static ghost concrete gasoline halo rust midnight chrome ember thunder marble smoke violet iron paper glass ash comet fever gold ocean fracture pulse mirror echo vapor crimson hollow drift signal wildfire feather shadow diamond'.split(' ');
  function spark(){ const el=$('lyr-spark-out'); if(!el) return; const w=SPARK_WORDS[Math.floor(Math.random()*SPARK_WORDS.length)]; const w2=SPARK_WORDS[Math.floor(Math.random()*SPARK_WORDS.length)]; el.textContent='“'+w+(Math.random()<0.5?' + '+w2:'')+'”'; }

  // ==================== BEAT SKETCH — step sequencer ====================
  const BEAT_KEY='ferrett_os_beat_v1';
  const KITS=['KICK','SNARE','HAT','OHAT','CLAP','TOM'];
  const BEAT_PRESETS={
    'Boom Bap':{KICK:[0,10],SNARE:[4,12],HAT:'x8',OHAT:[],CLAP:[],TOM:[]},
    'Trap':{KICK:[0,6,10],SNARE:[8],HAT:'x16',OHAT:[],CLAP:[8],TOM:[]},
    'Four-Floor':{KICK:[0,4,8,12],SNARE:[],HAT:[2,6,10,14],OHAT:[],CLAP:[4,12],TOM:[]},
    'Half-Time':{KICK:[0,10],SNARE:[8],HAT:'x8',OHAT:[14],CLAP:[],TOM:[]}
  };
  let beatPattern=null, beatAC=null, beatPlaying=false, beatStep=0, beatNextTime=0, beatTimer=null, beatBpm=90, beatSwing=0;
  const BEAT_SNAP_KEY='ferrett_os_beat_snaps_v1';
  function blankPattern(){ const p={}; KITS.forEach(k=>p[k]=new Array(16).fill(0)); return p; }
  function normalizePattern(p){ const np=blankPattern(); if(p) KITS.forEach(k=>{ if(Array.isArray(p[k])) p[k].forEach((v,i)=>{ if(i<16) np[k][i]= v===true?1 : (typeof v==='number'?v:0); }); }); return np; }
  function loadBeat(){ try{ const r=localStorage.getItem(BEAT_KEY); if(r) return normalizePattern(JSON.parse(r)); }catch(e){} return null; }
  function saveBeat(){ try{ localStorage.setItem(BEAT_KEY, JSON.stringify(beatPattern)); }catch(e){} }
  function applyPreset(name){ const pr=BEAT_PRESETS[name]; beatPattern=blankPattern(); KITS.forEach(k=>{ let v=pr[k]; if(v==='x8') v=[0,2,4,6,8,10,12,14]; else if(v==='x16') v=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]; (v||[]).forEach(i=>{ if(i>=0&&i<16) beatPattern[k][i]=1; }); }); saveBeat(); renderBeatGrid(); }
  function renderBeatPresets(){ const w=$('beat-presets'); if(!w) return; w.innerHTML=Object.keys(BEAT_PRESETS).map(n=>`<button class="beat-preset btn-euterpe px-3 py-1 text-[10px]" data-p="${n}">${n}</button>`).join(''); w.querySelectorAll('.beat-preset').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.p))); }
  function cellStyle(v){ return v===2?'bg-[#FFD60A] border-[#FFD60A]' : v===1?'bg-[#00FF88] border-[#00FF88]' : 'bg-black/40 border-white/10 hover:border-[#00FF88]/50'; }
  function renderBeatGrid(){
    const g=$('beat-grid'); if(!g) return; if(!beatPattern) beatPattern=loadBeat()||blankPattern();
    g.innerHTML=KITS.map(k=>`<div class="flex items-center gap-1"><span class="text-[8px] font-bold tracking-widest text-[#00FF88]/70 w-9 shrink-0">${k}</span><div class="flex gap-1">${beatPattern[k].map((v,i)=>`<button class="beat-cell w-5 h-5 md:w-6 md:h-6 rounded-sm border transition-colors ${cellStyle(v)} ${i%4===0?'ml-1':''}" data-k="${k}" data-i="${i}"></button>`).join('')}</div></div>`).join('');
    g.querySelectorAll('.beat-cell').forEach(c=>c.addEventListener('click',()=>{ const k=c.dataset.k,i=+c.dataset.i; beatPattern[k][i]=(beatPattern[k][i]+1)%3; saveBeat(); renderBeatGrid(); }));
  }
  // snapshots
  function loadSnaps(){ try{ return JSON.parse(localStorage.getItem(BEAT_SNAP_KEY)||'{}'); }catch(e){ return {}; } }
  function saveSnaps(s){ try{ localStorage.setItem(BEAT_SNAP_KEY, JSON.stringify(s)); }catch(e){} }
  function renderSnapSlots(){ const sel=$('beat-snap-slot'); if(!sel) return; const snaps=loadSnaps(); const cur=sel.value; sel.innerHTML='<option value="">— snapshots —</option>'+Object.keys(snaps).map(n=>`<option value="${n}">${n}</option>`).join(''); if(snaps[cur]) sel.value=cur; }
  function saveSnapshot(){ const name=prompt('Name this beat snapshot:'); if(!name) return; const snaps=loadSnaps(); snaps[name.slice(0,24)]={pattern:beatPattern, bpm:beatBpm, swing:beatSwing}; saveSnaps(snaps); renderSnapSlots(); $('beat-snap-slot').value=name.slice(0,24); }
  function loadSnapshot(name){ const snaps=loadSnaps(); const s=snaps[name]; if(!s) return; beatPattern=normalizePattern(s.pattern); if(s.bpm){ beatBpm=s.bpm; const bi=$('beat-bpm'); if(bi) bi.value=s.bpm; } if(typeof s.swing==='number'){ beatSwing=s.swing; const sw=$('beat-swing'); if(sw) sw.value=s.swing; const sv=$('beat-swing-val'); if(sv) sv.textContent=s.swing+'%'; } saveBeat(); renderBeatGrid(); }
  function delSnapshot(){ const sel=$('beat-snap-slot'); const name=sel.value; if(!name) return; if(!confirm('Delete snapshot "'+name+'"?')) return; const snaps=loadSnaps(); delete snaps[name]; saveSnaps(snaps); renderSnapSlots(); }
  function beatEnsureAC(){ if(!beatAC){ try{ beatAC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(beatAC.state==='suspended') beatAC.resume(); return beatAC; }
  function noiseBurst(ac,t,dur,hp,gainv){ const len=ac.sampleRate*dur, buf=ac.createBuffer(1,len,ac.sampleRate), d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1; const src=ac.createBufferSource(); src.buffer=buf; const f=ac.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; const g=ac.createGain(); g.gain.setValueAtTime(gainv,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t); src.stop(t+dur); }
  function playDrum(k,t,vel){ const ac=beatAC; if(!ac) return; const V=vel===2?1.35:1;
    if(k==='KICK'){ const o=ac.createOscillator(),g=ac.createGain(); o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(50,t+0.12); g.gain.setValueAtTime(0.9*V,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.32); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.34); }
    else if(k==='SNARE'){ noiseBurst(ac,t,0.18,1200,0.5*V); const o=ac.createOscillator(),g=ac.createGain(); o.type='triangle'; o.frequency.value=190; g.gain.setValueAtTime(0.5*V,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.14); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.16); }
    else if(k==='HAT'){ noiseBurst(ac,t,0.045,7000,0.35*V); }
    else if(k==='OHAT'){ noiseBurst(ac,t,0.28,6500,0.3*V); }
    else if(k==='CLAP'){ [0,0.012,0.024].forEach(o=>noiseBurst(ac,t+o,0.12,1500,0.35*V)); }
    else if(k==='TOM'){ const o=ac.createOscillator(),g=ac.createGain(); o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(90,t+0.2); g.gain.setValueAtTime(0.6*V,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.3); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+0.32); }
  }
  function beatSchedule(){
    const ac=beatAC; const stepDur=(60/beatBpm)/4;
    while(beatNextTime < ac.currentTime+0.1){
      const step=beatStep;
      // swing: push odd 16ths later, up to ~2/3 of a step
      const swingOffset=(step%2===1)? (beatSwing/100)*stepDur : 0;
      const t=beatNextTime+swingOffset;
      KITS.forEach(k=>{ const v=beatPattern[k][step]; if(v) playDrum(k,t,v); });
      const delay=(t-ac.currentTime)*1000;
      setTimeout(()=>{ document.querySelectorAll('#beat-grid .beat-cell').forEach(c=>{ if(+c.dataset.i===step) c.classList.add('ring-2','ring-[#FF88FF]'); else c.classList.remove('ring-2','ring-[#FF88FF]'); }); }, Math.max(0,delay));
      beatNextTime+=stepDur; beatStep=(beatStep+1)%16;
    }
    beatTimer=setTimeout(beatSchedule,25);
  }
  window.stopBeatSketch=()=>{ beatPlaying=false; if(beatTimer){ clearTimeout(beatTimer); beatTimer=null; } document.querySelectorAll('#beat-grid .beat-cell').forEach(c=>c.classList.remove('ring-2','ring-[#FF88FF]')); const b=$('btn-beat-play'); if(b){ b.textContent='▶ PLAY'; b.classList.add('btn-euterpe-green'); } };
  function toggleBeat(){ if(beatPlaying){ window.stopBeatSketch(); return; } const ac=beatEnsureAC(); if(!ac) return; beatPlaying=true; beatStep=0; beatNextTime=ac.currentTime+0.05; const b=$('btn-beat-play'); if(b) b.textContent='■ STOP'; beatSchedule(); }

  // ---- shared MIDI encoder (type-0) ----
  // notes: [{pitch,start,dur,vel,ch}] in ticks. Exposed for the melody/chord tools too.
  window.buildMidiFile = function(notes, opts){
    opts=opts||{}; const division=opts.division||480, bpm=opts.bpm||120;
    const vlq=(v)=>{ const b=[v&0x7f]; v=Math.floor(v/128); while(v>0){ b.unshift((v&0x7f)|0x80); v=Math.floor(v/128); } return b; };
    const evts=[];
    notes.forEach(n=>{ const ch=(n.ch||0)&0x0f; evts.push({t:Math.max(0,Math.round(n.start)), s:[0x90|ch, n.pitch&0x7f, (n.vel||100)&0x7f]}); evts.push({t:Math.max(0,Math.round(n.start+n.dur)), s:[0x80|ch, n.pitch&0x7f, 0]}); });
    evts.sort((a,b)=> a.t-b.t || ((a.s[0]&0xf0)-(b.s[0]&0xf0)) );
    const trk=[]; const mpq=Math.round(60000000/bpm);
    trk.push(0x00,0xFF,0x51,0x03,(mpq>>16)&0xff,(mpq>>8)&0xff,mpq&0xff);
    let last=0; evts.forEach(e=>{ vlq(e.t-last).forEach(x=>trk.push(x)); last=e.t; e.s.forEach(x=>trk.push(x&0xff)); });
    trk.push(0x00,0xFF,0x2F,0x00);
    const len=trk.length;
    const bytes=[0x4D,0x54,0x68,0x64,0,0,0,6,0,0,0,1,(division>>8)&0xff,division&0xff, 0x4D,0x54,0x72,0x6B,(len>>24)&0xff,(len>>16)&0xff,(len>>8)&0xff,len&0xff].concat(trk);
    return new Uint8Array(bytes);
  };
  window.downloadMidi = function(notes, opts, filename){
    const data=window.buildMidiFile(notes, opts); const blob=new Blob([data],{type:'audio/midi'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(filename||'feuterpe')+'.mid'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),800);
  };
  const GM_DRUM={ KICK:36, SNARE:38, HAT:42, OHAT:46, CLAP:39, TOM:45 };
  function beatToMidi(){
    if(!beatPattern){ beatPattern=loadBeat()||blankPattern(); }
    const div=480, sixteenth=div/4; const notes=[];
    KITS.forEach(k=>{ beatPattern[k].forEach((v,i)=>{ if(v) notes.push({pitch:GM_DRUM[k], start:i*sixteenth, dur:sixteenth*0.9, vel: v===2?115:80, ch:9}); }); });
    if(!notes.length){ alert('Add some hits first.'); return; }
    window.downloadMidi(notes, {division:div, bpm:beatBpm||90}, 'euterpe-beat-'+(beatBpm||90)+'bpm');
  }

  // ==================== CHORD PROGRESSION BOOK ====================
  const SC_MAJ=[0,2,4,5,7,9,11], SC_MIN=[0,2,3,5,7,8,10];
  const Q_MAJ=['','m','m','','','m','dim'], Q_MIN=['m','dim','','m','m','',''];
  const PROG_MAJ=[['I–V–vi–IV','the "Axis" — half of all pop',[1,5,6,4]],['I–IV–V','blues / rock backbone',[1,4,5]],['ii–V–I','jazz cadence',[2,5,1]],['I–vi–IV–V','50s doo-wop',[1,6,4,5]],['vi–IV–I–V','emo / anthemic',[6,4,1,5]],['I–V–vi–iii–IV–I–IV–V','Pachelbel / Canon',[1,5,6,3,4,1,4,5]]];
  const PROG_MIN=[['i–VI–III–VII','Andalusian-flavored',[1,6,3,7]],['i–iv–v','natural minor blues',[1,4,5]],['i–VII–VI–VII','driving rock loop',[1,7,6,7]],['i–VI–VII','epic / cinematic',[1,6,7]],['ii°–v–i','minor jazz cadence',[2,5,1]],['i–iv–VII–III','melancholy pop',[1,4,7,3]]];
  function chordAt(rootIdx,tonality,deg){ const sc=tonality==='major'?SC_MAJ:SC_MIN, q=tonality==='major'?Q_MAJ:Q_MIN; const i=(deg-1)%7; return NOTES[(rootIdx+sc[i])%12]+q[i]; }
  // triad MIDI pitches for a scale degree, voiced around C4
  function triadMidi(rootIdx,tonality,deg){ const sc=tonality==='major'?SC_MAJ:SC_MIN; const base=60+rootIdx; const idx=(deg-1)%7; const off=(n)=>{ const oct=Math.floor(n/7); return sc[((n%7)+7)%7]+12*oct; }; return [off(idx), off(idx+2), off(idx+4)].map(s=>base+s); }
  function progToMidi(degs){
    const ri=NOTES.indexOf($('prog-key').value), tonality=$('prog-tonality').value, div=480, bar=div*4;
    const notes=[]; degs.forEach((d,i)=>{ triadMidi(ri,tonality,d).forEach(p=>notes.push({pitch:p, start:i*bar, dur:bar*0.95, vel:88, ch:0})); });
    window.downloadMidi(notes, {division:div, bpm:90}, 'euterpe-chords-'+$('prog-key').value+tonality);
  }
  function buildProg(){
    const key=$('prog-key'), ton=$('prog-tonality'), list=$('prog-list'); if(!list) return;
    const ri=NOTES.indexOf(key.value), tonality=ton.value, progs=tonality==='major'?PROG_MAJ:PROG_MIN;
    list.innerHTML=progs.map((p,pi)=>{ const chords=p[2].map(d=>chordAt(ri,tonality,d)); return `<div class="p-3 rounded border border-[#00E5FF20] bg-black/25"><div class="flex items-center justify-between mb-1 gap-2"><span class="text-[11px] font-bold text-[#00E5FF]">${p[0]}</span><div class="flex items-center gap-2"><span class="text-[8px] text-white/35 italic">${p[1]}</span><button class="prog-midi text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#00E5FF40] text-[#00E5FF] hover:bg-[#00E5FF]/10 cursor-pointer" data-p="${pi}" title="Export as MIDI">↓MIDI</button></div></div><div class="flex flex-wrap gap-1.5">${chords.map(c=>`<span class="text-[13px] font-bold font-mono text-white bg-[#00E5FF]/10 border border-[#00E5FF]/25 rounded px-2 py-0.5">${c}</span>`).join('<span class="text-[#00E5FF]/30 self-center">→</span>')}</div></div>`; }).join('');
    list.querySelectorAll('.prog-midi').forEach(b=>b.addEventListener('click',()=>progToMidi(progs[+b.dataset.p][2])));
  }

  // ==================== GUITAR / BASS CHORD DIAGRAMS ====================
  // frets low→high string; -1=mute, 0=open, n=fret
  const CHORDS_GTR={ 'C':[-1,3,2,0,1,0],'A':[-1,0,2,2,2,0],'G':[3,2,0,0,0,3],'E':[0,2,2,1,0,0],'D':[-1,-1,0,2,3,2],'Am':[-1,0,2,2,1,0],'Em':[0,2,2,0,0,0],'Dm':[-1,-1,0,2,3,1],'F':[1,3,3,2,1,1],'Bm':[-1,2,4,4,3,2],'E7':[0,2,0,1,0,0],'A7':[-1,0,2,0,2,0],'D7':[-1,-1,0,2,1,2],'G7':[3,2,0,0,0,1],'Cadd9':[-1,3,2,0,3,0],'Bb':[-1,1,3,3,3,1] };
  const CHORDS_BASS={ 'E':[0,2,2,-1],'A':[-1,0,2,2],'D':[-1,-1,0,2],'G':[3,2,0,0],'C':[-1,3,2,0],'F':[1,3,3,-1],'B':[-1,2,4,4],'Am':[-1,0,2,2],'Em':[0,2,2,-1] };
  function fretSVG(name,frets){
    const S=frets.length, cols=S-1, W=64, H=78, padX=8, padY=16, fretRows=4;
    const gw=(W-2*padX)/cols, gh=(H-padY-8)/fretRows;
    let els='';
    for(let r=0;r<=fretRows;r++){ const y=padY+r*gh; els+=`<line x1="${padX}" y1="${y}" x2="${W-padX}" y2="${y}" stroke="#FFD60A${r===0?'':'30'}" stroke-width="${r===0?2:1}"/>`; }
    for(let c=0;c<S;c++){ const x=padX+c*gw; els+=`<line x1="${x}" y1="${padY}" x2="${x}" y2="${padY+fretRows*gh}" stroke="#FFD60A30" stroke-width="1"/>`; }
    frets.forEach((f,c)=>{ const x=padX+c*gw; if(f===-1) els+=`<text x="${x}" y="${padY-4}" text-anchor="middle" fill="#FF5A5A" font-size="8">✕</text>`; else if(f===0) els+=`<circle cx="${x}" cy="${padY-6}" r="3" fill="none" stroke="#00FF88" stroke-width="1.2"/>`; else { const y=padY+(f-0.5)*gh; els+=`<circle cx="${x}" cy="${y}" r="4.5" fill="#FFD60A"/>`; } });
    return `<svg viewBox="0 0 ${W} ${H}" class="w-full"><text x="${W/2}" y="${H-1}" text-anchor="middle" fill="#FFD60A" font-size="10" font-weight="bold">${name}</text>${els}</svg>`;
  }
  // open-string MIDI: guitar E2 A2 D3 G3 B3 E4 ; bass E1 A1 D2 G2
  const TUNE_GTR=[40,45,50,55,59,64], TUNE_BASS=[28,33,38,43];
  let chordAC=null;
  function chordEnsureAC(){ if(!chordAC){ try{ chordAC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(chordAC.state==='suspended') chordAC.resume(); return chordAC; }
  function pluck(ac,freq,t,dur){ const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter(); o.type='triangle'; o2.type='sawtooth'; o.frequency.value=freq; o2.frequency.value=freq; o2.detune.value=6; f.type='lowpass'; f.frequency.setValueAtTime(4200,t); f.frequency.exponentialRampToValueAtTime(900,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.16,t+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(f); o2.connect(f); f.connect(g); g.connect(ac.destination); o.start(t); o2.start(t); o.stop(t+dur+0.05); o2.stop(t+dur+0.05); }
  function strum(frets){ const ac=chordEnsureAC(); if(!ac) return; const tune=chordInst==='guitar'?TUNE_GTR:TUNE_BASS; const t0=ac.currentTime+0.02; let n=0; frets.forEach((f,i)=>{ if(f<0) return; const midi=tune[i]+f; const freq=440*Math.pow(2,(midi-69)/12); pluck(ac,freq,t0+n*0.035,1.1); n++; }); }
  let chordInst='guitar';
  function buildChords(){
    const wrap=$('chord-diagrams'); if(!wrap) return; const lib=chordInst==='guitar'?CHORDS_GTR:CHORDS_BASS;
    wrap.innerHTML=Object.keys(lib).map(n=>`<button class="chord-card w-full p-1.5 rounded border border-[#FFD60A15] bg-black/25 hover:border-[#FFD60A70] hover:bg-[#FFD60A]/5 transition-colors cursor-pointer" data-n="${n}">${fretSVG(n,lib[n])}</button>`).join('');
    wrap.querySelectorAll('.chord-card').forEach(b=>b.addEventListener('click',()=>{ strum(lib[b.dataset.n]); b.classList.add('ring-2','ring-[#FFD60A]'); setTimeout(()=>b.classList.remove('ring-2','ring-[#FFD60A]'),300); }));
  }

  // ==================== SONG STRUCTURE TEMPLATES ====================
  const STRUCTS=[
    ['Modern Pop','Intro 4 · Verse 8 · Pre-Chorus 4 · Chorus 8 · Verse 8 · Pre 4 · Chorus 8 · Bridge 8 · Chorus ×2','#FF88FF'],
    ['Hip-Hop / Rap','Intro 4 · Hook 8 · Verse 16 · Hook 8 · Verse 16 · Hook 8 · Verse 12 · Outro 4','#00FF88'],
    ['12-Bar Blues','I (4) · IV (2) · I (2) · V (1) · IV (1) · I (2) — repeat','#FFD60A'],
    ['EDM / Dance','Intro · Build · DROP · Breakdown · Build · DROP · Outro','#00E5FF'],
    ['AABA (Standard)','A (8) · A (8) · B/Bridge (8) · A (8) = 32-bar form','#B18CFF'],
    ['Verse-Chorus Rock','Intro · Verse · Chorus · Verse · Chorus · Solo · Chorus · Outro','#FF5A5A']
  ];
  function buildStructs(){ const w=$('struct-list'); if(!w) return; w.innerHTML=STRUCTS.map(s=>`<div class="p-3 rounded border bg-black/25" style="border-color:${s[2]}25"><div class="text-[11px] font-bold tracking-widest mb-1" style="color:${s[2]}">${s[0]}</div><div class="text-[10px] text-[#E2E8F0]/60 font-mono leading-relaxed">${s[1]}</div></div>`).join(''); }

  // ==================== INIT ====================
  function init(){
    // lyrics
    if($('tab-lyrics')){
      initLyrState();
      $('btn-lyr-new-sheet')?.addEventListener('click',()=>{ const id=Date.now(); lyrState.sheets.push({id,title:'Untitled',lines:[{text:'',tag:''}]}); lyrState.activeId=id; lyrUndo=[]; saveLyr(); renderLyr(); $('lyr-title')?.focus(); });
      $('lyr-sheet-more')?.addEventListener('change',(e)=>{ const id=e.target.value?parseInt(e.target.value,10):null; if(id==null) return; lyrState.activeId=id; lyrUndo=[]; lyrSelected.clear(); saveLyr(); renderLyr(); e.target.value=''; });
      $('lyr-title')?.addEventListener('input',()=>{ activeSheet().title=$('lyr-title').value; saveLyr(); renderSheetTabs(); });
      $('btn-lyr-cutup')?.addEventListener('click',()=>lyrCutup(false));
      $('btn-lyr-cutup-sec')?.addEventListener('click',()=>lyrCutup(true));
      $('btn-lyr-undo')?.addEventListener('click',()=>{ if(!lyrUndo.length) return; activeSheet().lines=JSON.parse(lyrUndo.pop()); saveLyr(); renderLines(); });
      $('btn-lyr-add-line')?.addEventListener('click',()=>{ activeSheet().lines.push({text:'',tag:''}); saveLyr(); renderLines(); const box=$('lyr-lines'); const last=box.querySelector('.lyr-text:last-of-type'); last&&last.focus(); });
      $('btn-lyr-paste-tagged')?.addEventListener('click',()=>{ $('lyr-paste-panel')?.classList.toggle('hidden'); $('lyr-paste-text')?.focus(); });
      $('btn-lyr-paste-cancel')?.addEventListener('click',()=>{ $('lyr-paste-panel')?.classList.add('hidden'); $('lyr-paste-text').value=''; });
      $('btn-lyr-paste-apply')?.addEventListener('click',()=>{
        const raw=$('lyr-paste-text').value; if(!raw.trim()) return;
        const parsed=parseTaggedSongText(raw);
        if(!parsed.lines.length) return;
        pushUndo();
        const s=activeSheet();
        s.lines = ($('lyr-paste-replace').checked || (s.lines.length===1 && !s.lines[0].text.trim())) ? parsed.lines : s.lines.concat(parsed.lines);
        saveLyr(); renderLyr(); // saveLyr rebuilds the linked song's arrangement from these lines automatically
        $('lyr-paste-panel').classList.add('hidden'); $('lyr-paste-text').value='';
      });
      $('btn-lyr-delete-selected')?.addEventListener('click',()=>{ const s=activeSheet(); if(!lyrSelected.size) return; if(!confirm(`Delete ${lyrSelected.size} selected line(s)?`)) return; pushUndo(); s.lines=s.lines.filter(ln=>!lyrSelected.has(ln)); if(!s.lines.length) s.lines.push({text:'',tag:''}); lyrSelected.clear(); saveLyr(); renderLyr(); });
      $('btn-lyr-clear-selected')?.addEventListener('click',()=>{ lyrSelected.clear(); renderLines(); });
      $('lyr-show-syl')?.addEventListener('change',renderLines);
      // Remembered across sessions — a chord chart isn't something you want to re-enable every visit.
      $('lyr-show-chords')?.addEventListener('change',(e)=>{ try{ localStorage.setItem(LYR_CHORDS_KEY, e.target.checked?'1':'0'); }catch(err){} renderLines(); });
      $('btn-lyr-export')?.addEventListener('click',lyrExport);
      $('btn-lyr-rhyme')?.addEventListener('click',findRhymes);
      $('lyr-rhyme-in')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') findRhymes(); });
      // view mode toggle
      $('btn-lyr-mode-edit')?.addEventListener('click',()=>setLyrMode('edit'));
      $('btn-lyr-mode-analyze')?.addEventListener('click',()=>setLyrMode('analyze'));
      // rhyme/synonym mode toggle
      const setFind=(m)=>{ lyrFindMode=m; const r=$('btn-lyr-mode-rhyme'), s=$('btn-lyr-mode-syn'); const rOn=m==='rhyme'; r.classList.toggle('bg-[#B18CFF]/20',rOn); r.classList.toggle('text-[#B18CFF]',rOn); r.classList.toggle('text-[#B18CFF]/50',!rOn); s.classList.toggle('bg-[#B18CFF]/20',!rOn); s.classList.toggle('text-[#B18CFF]',!rOn); s.classList.toggle('text-[#B18CFF]/50',rOn); if($('lyr-rhyme-in').value.trim()) findRhymes(); };
      $('btn-lyr-mode-rhyme')?.addEventListener('click',()=>setFind('rhyme'));
      $('btn-lyr-mode-syn')?.addEventListener('click',()=>setFind('syn'));
      // analyze tools
      $('btn-lyr-read')?.addEventListener('click',toggleRead);
      $('btn-lyr-spark')?.addEventListener('click',spark);
      $('btn-lyr-copy')?.addEventListener('click',()=>{
        const text=window.lyrGetActiveTextPlain?window.lyrGetActiveTextPlain():''; if(!text.trim()) return;
        const done=()=>{ const b=$('btn-lyr-copy'); if(b){ const o=b.textContent; b.textContent='✓ COPIED'; setTimeout(()=>b.textContent=o,1200); } };
        const fallback=()=>{ const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} ta.remove(); done(); };
        if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
        else fallback();
      });
      try{ const cb=$('lyr-show-chords'); if(cb) cb.checked = localStorage.getItem(LYR_CHORDS_KEY)==='1'; }catch(e){}
      renderLyr();
    }
    // beat
    if($('beat-grid')){
      renderBeatPresets(); renderBeatGrid(); renderSnapSlots();
      $('btn-beat-play')?.addEventListener('click',toggleBeat);
      $('btn-beat-midi')?.addEventListener('click',beatToMidi);
      $('btn-beat-clear')?.addEventListener('click',()=>{ window.stopBeatSketch(); beatPattern=blankPattern(); saveBeat(); renderBeatGrid(); });
      $('beat-bpm')?.addEventListener('input',(e)=>{ beatBpm=Math.max(40,Math.min(220,+e.target.value||90)); });
      $('beat-swing')?.addEventListener('input',(e)=>{ beatSwing=+e.target.value; const v=$('beat-swing-val'); if(v) v.textContent=beatSwing+'%'; });
      $('btn-beat-snap-save')?.addEventListener('click',saveSnapshot);
      $('btn-beat-snap-del')?.addEventListener('click',delSnapshot);
      $('beat-snap-slot')?.addEventListener('change',(e)=>{ if(e.target.value) loadSnapshot(e.target.value); });
      beatBpm=+($('beat-bpm')?.value||90);
    }
    // chord book
    if($('prog-key')){
      $('prog-key').innerHTML=NOTES.map(n=>`<option${n==='C'?' selected':''}>${n}</option>`).join('');
      ['prog-key','prog-tonality'].forEach(id=>$(id)?.addEventListener('change',buildProg));
      buildProg();
      $('btn-reset-prog')?.addEventListener('click',()=>{ $('prog-key').value='C'; $('prog-tonality').value='major'; buildProg(); });
    }
    // chord diagrams
    if($('chord-diagrams')){
      document.querySelectorAll('.chord-inst').forEach(b=>b.addEventListener('click',()=>{ chordInst=b.dataset.inst; document.querySelectorAll('.chord-inst').forEach(x=>x.style.background=''); b.style.background='rgba(255,214,10,0.12)'; buildChords(); }));
      buildChords();
    }
    // structures
    buildStructs();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
