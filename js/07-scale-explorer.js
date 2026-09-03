(function(){
  const $ = (id)=>document.getElementById(id);
  const NOTES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const SCALES={ 'Major':[0,2,4,5,7,9,11],'Nat Minor':[0,2,3,5,7,8,10],'Dorian':[0,2,3,5,7,9,10],'Mixolydian':[0,2,4,5,7,9,10],'Harm Minor':[0,2,3,5,7,8,11],'Min Pent':[0,3,5,7,10],'Maj Pent':[0,2,4,7,9],'Blues':[0,3,5,6,7,10] };
  const midiFreq=(m)=>440*Math.pow(2,(m-69)/12);
  let AC=null; const ac=()=>{ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(AC.state==='suspended') AC.resume(); return AC; };
  function voice(freq,t,dur,wave){ const a=ac(); if(!a) return; const o=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter(); o.type=wave||'triangle'; o.frequency.value=freq; f.type='lowpass'; f.frequency.setValueAtTime(5000,t); f.frequency.exponentialRampToValueAtTime(1200,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.2,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); o.stop(t+dur+0.05); }

  // ==================== MELODY SKETCHPAD (keyboard) ====================
  const KB_LOW=48, KB_HIGH=72; // C3..C5
  const KEYMAP={a:60,w:61,s:62,e:63,d:64,f:65,t:66,g:67,y:68,h:69,u:70,j:71,k:72};
  let kbScale=new Set(), kbWave='triangle', kbRec=false, kbTake=[], kbStart=0, kbHeld={};
  function kbComputeScale(){ const r=NOTES.indexOf($('kb-scale-root').value); const ivs=SCALES[$('kb-scale-type').value]||SCALES['Major']; kbScale=new Set(ivs.map(i=>(r+i)%12)); }
  function renderKeyboard(){
    const wrap=$('kb-keys'); if(!wrap) return; kbComputeScale();
    const whites=[]; for(let m=KB_LOW;m<=KB_HIGH;m++){ if([0,2,4,5,7,9,11].includes(m%12)) whites.push(m); }
    const ww=100/whites.length; let html='';
    whites.forEach((m,i)=>{ const inScale=kbScale.has(m%12); const isRoot=kbScale.size&&(m%12)===NOTES.indexOf($('kb-scale-root').value); html+=`<div class="kb-key kb-white absolute bottom-0 border border-[#00E5FF20] rounded-b cursor-pointer" data-midi="${m}" style="left:${i*ww}%;width:${ww}%;height:100%;background:${isRoot?'rgba(0,229,255,0.35)':inScale?'rgba(0,229,255,0.14)':'rgba(255,255,255,0.9)'}"></div>`; });
    // black keys
    whites.forEach((m,i)=>{ const nm=m+1; if([1,3,6,8,10].includes(nm%12) && nm<=KB_HIGH){ const inScale=kbScale.has(nm%12); html+=`<div class="kb-key kb-black absolute top-0 cursor-pointer rounded-b z-10" data-midi="${nm}" style="left:${(i+1)*ww-ww*0.3}%;width:${ww*0.6}%;height:62%;background:${inScale?'#0891b2':'#0a0f0d'};border:1px solid #00E5FF30"></div>`; } });
    wrap.innerHTML=html;
    wrap.querySelectorAll('.kb-key').forEach(k=>{ k.addEventListener('mousedown',()=>kbTrigger(+k.dataset.midi,k)); k.addEventListener('mouseup',()=>{delete kbHeld[k.dataset.midi];}); k.addEventListener('touchstart',(e)=>{ e.preventDefault(); kbTrigger(+k.dataset.midi,k); },{passive:false}); });
  }
  function flashKey(el){ if(!el) return; const o=el.style.filter; el.style.filter='brightness(1.6)'; setTimeout(()=>el.style.filter=o,140); }
  function kbTrigger(midi,el){ const a=ac(); if(a) voice(midiFreq(midi),a.currentTime,0.5,kbWave); flashKey(el||document.querySelector(`.kb-key[data-midi="${midi}"]`)); if(kbRec) kbTake.push({midi, t: performance.now()-kbStart}); }
  function kbToggleRec(){ kbRec=!kbRec; const b=$('btn-kb-rec'); if(kbRec){ kbTake=[]; kbStart=performance.now(); if(b){b.textContent='■ STOP';b.style.background='rgba(255,90,90,0.2)';} $('kb-status').textContent='recording…'; } else { if(b){b.textContent='● REC';b.style.background='';} $('kb-status').textContent=kbTake.length+' notes captured'; } }
  function kbPlayback(){ if(!kbTake.length){ $('kb-status').textContent='nothing recorded yet'; return; } const a=ac(); if(!a) return; const t0=a.currentTime+0.05; kbTake.forEach(n=>{ voice(midiFreq(n.midi),t0+n.t/1000,0.45,kbWave); setTimeout(()=>flashKey(document.querySelector(`.kb-key[data-midi="${n.midi}"]`)), n.t); }); $('kb-status').textContent='playing…'; setTimeout(()=>{ $('kb-status').textContent=kbTake.length+' notes'; }, (kbTake[kbTake.length-1].t)+500); }
  function kbKeydown(e){ if(!$('tab-toolbox')?.classList.contains('active')) return; if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return; const m=KEYMAP[e.key.toLowerCase()]; if(m && !kbHeld[m]){ kbHeld[m]=1; kbTrigger(m); } }
  function kbKeyup(e){ const m=KEYMAP[e.key.toLowerCase()]; if(m) delete kbHeld[m]; }

  // ==================== FRETBOARD SCALE EXPLORER ====================
  const FB_GTR=[64,59,55,50,45,40], FB_BASS=[43,38,33,28]; // top->bottom (high->low)
  let fbInst='gtr';
  function buildFretboard(){
    const svg=$('fb-svg'); if(!svg) return; const tuning=fbInst==='gtr'?FB_GTR:FB_BASS; const frets=12;
    const rootPc=NOTES.indexOf($('fb-root').value); const ivs=SCALES[$('fb-scale').value]||SCALES['Major']; const set=new Set(ivs.map(i=>(rootPc+i)%12));
    const W=640,H=150,padL=30,padR=14,padT=14,padB=14; const fw=(W-padL-padR)/frets; const sh=(H-padT-padB)/(tuning.length-1);
    let els='';
    // fret lines + numbers
    for(let f=0;f<=frets;f++){ const x=padL+f*fw; els+=`<line x1="${x}" y1="${padT}" x2="${x}" y2="${H-padB}" stroke="#FFD60A${f===0?'':'25'}" stroke-width="${f===0?2.5:1}"/>`; if(f>0) els+=`<text x="${x-fw/2}" y="${H-2}" text-anchor="middle" fill="#FFD60A50" font-size="8">${f}</text>`; }
    for(let s=0;s<tuning.length;s++){ const y=padT+s*sh; els+=`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="#FFD60A25" stroke-width="1"/>`; }
    // markers 3,5,7,9,12
    [3,5,7,9,12].forEach(f=>{ const x=padL+(f-0.5)*fw; els+=`<circle cx="${x}" cy="${H/2}" r="2.5" fill="#FFD60A20"/>`; });
    // notes
    tuning.forEach((open,s)=>{ for(let f=0;f<=frets;f++){ const pc=(open+f)%12; if(!set.has(pc)) continue; const x=padL+(f===0?-11:(f-0.5)*fw); const y=padT+s*sh; const isRoot=pc===rootPc; els+=`<g class="fb-note" data-midi="${open+f}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="8.5" fill="${isRoot?'#FF5A5A':'#FFD60A'}" stroke="#050807" stroke-width="1"/><text x="${x}" y="${y+3}" text-anchor="middle" fill="#050807" font-size="8" font-weight="bold">${NOTES[pc]}</text></g>`; } });
    svg.innerHTML=els;
    svg.querySelectorAll('.fb-note').forEach(g=>g.addEventListener('click',()=>{ const a=ac(); if(a) voice(midiFreq(+g.dataset.midi),a.currentTime,0.7,'sawtooth'); g.style.opacity='0.5'; setTimeout(()=>g.style.opacity='1',150); }));
  }

  // ==================== SONG BOARD (kanban of song titles + a note — separate from Channel Settings) ====================
  const SONG_STATUSES=[['lyrics','Just Lyrics','#B18CFF'],['beat','Just a Beat','#FFA05C'],['tracking','Tracking','#FFD60A'],['mixing','Mixing','#00E5FF'],['done','Done','#00FF88']];
  let dragSongId=null;
  function escSongText(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function parseSongLen(str){ str=(str||'').trim(); if(!str) return null; if(/^\d+:\d{1,2}$/.test(str)){ const [m,se]=str.split(':'); return (+m)*60+(+se); } if(/^\d+$/.test(str)) return (+str)*60; return null; }
  function renderSongBoard(){
    const board=$('songboard-board'); if(!board) return;
    window.db.songBoard = window.db.songBoard || [];
    const songs=window.db.songBoard;
    board.innerHTML=SONG_STATUSES.map(([key,label,color])=>{
      const items=songs.filter(s=>(s.status||'lyrics')===key);
      return `<div class="song-col rounded border bg-black/30 p-2" data-status="${key}" style="border-color:${color}30;">
        <div class="text-[9px] font-bold tracking-widest uppercase mb-2 flex items-center justify-between" style="color:${color};">${label}<span class="opacity-50">${items.length}</span></div>
        <div class="space-y-2 min-h-[48px]">${items.map(s=>{
          const isActive = arrData && arrData.attachedSongId===s.id;
          return `
          <div class="song-card-mini rounded border px-2 py-1.5 bg-[rgba(5,8,7,0.9)] relative group" data-song-id="${s.id}" style="border-color:${isActive?'#B18CFF':color+'40'};${isActive?'box-shadow:0 0 0 1px #B18CFF80;':''}">
            <button data-song-id="${s.id}" class="btn-del-song absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF2A2A] text-white text-[9px] font-bold items-center justify-center cursor-pointer hidden group-hover:flex">×</button>
            <button data-song-id="${s.id}" class="song-detail-open absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-black border border-white/20 text-white/60 text-[9px] font-bold items-center justify-center cursor-pointer hidden group-hover:flex hover:text-[#00E5FF] hover:border-[#00E5FF60]" title="Song details">⤢</button>
            <div class="flex items-center gap-1 mb-1">
              <span class="song-drag-handle cursor-grab active:cursor-grabbing text-white/25 hover:text-white/60 text-[11px] select-none shrink-0" draggable="true" data-song-id="${s.id}" title="Drag to move stage">⠿</span>
              <input type="text" class="song-title-input flex-1 min-w-0 bg-transparent text-[10px] font-bold text-white focus:outline-none border-b border-transparent focus:border-white/20 truncate" value="${escSongText(s.title||'').replace(/"/g,'&quot;')}" placeholder="Untitled" data-song-id="${s.id}">
              <input type="number" class="song-bpm-input w-9 shrink-0 bg-transparent text-[8px] text-[#00E5FF]/70 font-mono text-right focus:outline-none border-b border-transparent focus:border-white/20" value="${s.bpm||''}" placeholder="bpm" min="40" max="300" data-song-id="${s.id}" title="Tempo — carries into this song's arrangement, lyrics, and AI prompt generation">
              <input type="text" class="song-len-input w-11 shrink-0 bg-transparent text-[8px] text-white/40 font-mono text-right focus:outline-none border-b border-transparent focus:border-white/20" value="${s.length?fmtT(s.length):''}" placeholder="m:ss" data-song-id="${s.id}" title="${s.arrangement?'Synced from Arrangement Timeline':'Song length (optional)'}"${s.arrangement?' readonly':''}>
            </div>
            <textarea class="song-note-input w-full bg-transparent text-[8px] text-white/40 focus:outline-none resize-none leading-tight" rows="2" placeholder="notes…" data-song-id="${s.id}">${escSongText(s.note||'')}</textarea>
            <div class="flex gap-1 mt-1">
              <button type="button" class="song-arr-btn flex-1 min-w-0 text-[8px] text-left truncate ${s.arrangement?'text-[#B18CFF]':'text-white/25'} hover:text-[#B18CFF]" data-song-id="${s.id}">🎼 ${s.arrangement?'Edit arrangement':'Attach arrangement'}</button>
              <button type="button" class="song-lyr-btn flex-1 min-w-0 text-[8px] text-left truncate ${s.lyricsSheetId!=null?'text-[#FF88FF]':'text-white/25'} hover:text-[#FF88FF]" data-song-id="${s.id}">📝 ${s.lyricsSheetId!=null?'Open lyrics':'New lyrics'}</button>
            </div>
            <button type="button" class="song-detail-open w-full mt-1 text-[8px] text-left truncate ${((s.trackIds||[]).length||(s.toneIds||[]).length||(s.lyricsSheetIds||[]).length||s.kitId||s.kit)?'text-[#00E5FF]':'text-white/25'} hover:text-[#00E5FF]" data-song-id="${s.id}">🎚️ ${(s.trackIds||[]).length||0} track${(s.trackIds||[]).length===1?'':'s'} · 🎛️ ${(s.toneIds||[]).length||0} tone${(s.toneIds||[]).length===1?'':'s'}${(s.lyricsSheetIds||[]).length?` · 📝 ${s.lyricsSheetIds.length} lyric${s.lyricsSheetIds.length===1?'':'s'}`:''}${(s.kitId||s.kit)?' · 🤖 kit':''}${(s.lyriaPrompts||[]).length?` · 💾 ${s.lyriaPrompts.length}`:''}</button>
          </div>`;
        }).join('')}</div>
      </div>`;
    }).join('');
    board.querySelectorAll('.song-title-input').forEach(inp=>inp.addEventListener('input',()=>{ const s=songs.find(x=>x.id===parseInt(inp.dataset.songId,10)); if(s){ s.title=inp.value; window.saveData(); } }));
    board.querySelectorAll('.song-note-input').forEach(ta=>ta.addEventListener('input',()=>{ const s=songs.find(x=>x.id===parseInt(ta.dataset.songId,10)); if(s){ s.note=ta.value; window.saveData(); } }));
    board.querySelectorAll('.song-len-input').forEach(inp=>inp.addEventListener('change',()=>{ const s=songs.find(x=>x.id===parseInt(inp.dataset.songId,10)); if(s){ s.length=parseSongLen(inp.value); inp.value=s.length?fmtT(s.length):''; window.saveData(); } }));
    board.querySelectorAll('.song-bpm-input').forEach(inp=>inp.addEventListener('change',()=>{ const id=parseInt(inp.dataset.songId,10); const bpm=inp.value?Math.max(40,Math.min(300,parseInt(inp.value,10)||0))||null:null; window.setSongBpm(id,bpm); }));
  }
  window.renderSongBoard = renderSongBoard;

  // ==================== SONG DETAILS MODAL (title/note/length, arrangement+lyrics jump, linked tracks) ====================
  let songDetailId=null;
  function openSongDetail(id){ songDetailId=id; const m=$('song-detail-modal'); m.classList.remove('hidden'); m.classList.add('flex'); renderSongDetail(); }
  window.openSongDetail = openSongDetail; // used by the song backlink chips on Channel Settings cards
  function closeSongDetail(){ const m=$('song-detail-modal'); m.classList.add('hidden'); m.classList.remove('flex'); songDetailId=null; }
  function populateSongDetailTrackSelect(song){
    const sel=$('song-detail-track-select'); if(!sel) return;
    const linked=new Set(song.trackIds||[]);
    const tracks=(window.db.tracks||[]).filter(t=>!linked.has(t.id));
    sel.innerHTML='<option value="">— choose a track —</option>'+tracks.map(t=>`<option value="${t.id}">${window.escapeHtml((t.inst||'Track').slice(0,40))}</option>`).join('');
  }
  function populateSongDetailToneSelect(song){
    const sel=$('song-detail-tone-select'); if(!sel) return;
    const linked=new Set(song.toneIds||[]);
    const tones=(window.db.tones||[]).filter(t=>!linked.has(t.id));
    sel.innerHTML='<option value="">— choose a tone —</option>'+tones.map(t=>`<option value="${t.id}">${window.escapeHtml((t.name||'Unnamed Combo').slice(0,40))}</option>`).join('');
  }
  function populateSongDetailLyricsSelect(song){
    const sel=$('song-detail-lyrics-select'); if(!sel) return;
    const linked=new Set(song.lyricsSheetIds||[]);
    const sheets=(window.lyrAllSheets?.()||[]).filter(sh=>!linked.has(sh.id));
    sel.innerHTML='<option value="">— choose a lyrics sheet —</option>'+sheets.map(sh=>`<option value="${sh.id}">${window.escapeHtml((sh.title||'Untitled').slice(0,40))}</option>`).join('');
  }
  function renderSongDetail(){
    const m=$('song-detail-modal'); if(!m || m.classList.contains('hidden')) return;
    const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId);
    if(!song){ closeSongDetail(); return; }
    $('song-detail-title').value=song.title||'';
    $('song-detail-note').value=song.note||'';
    const lenEl=$('song-detail-len'); lenEl.value=song.length?fmtT(song.length):''; lenEl.readOnly=!!song.arrangement; lenEl.title=song.arrangement?'Synced from Arrangement Timeline':'Song length (optional)';
    const bpmEl=$('song-detail-bpm'); if(bpmEl) bpmEl.value=song.bpm||'';
    $('song-detail-arr-btn').textContent = '🎼 '+(song.arrangement?'Edit arrangement':'Attach arrangement');
    $('song-detail-lyr-btn').textContent = '📝 '+(song.lyricsSheetId!=null?'Open lyrics':'New lyrics');
    const lyriaBtn=$('song-detail-lyria-btn');
    if(lyriaBtn) lyriaBtn.textContent = '🎼 LYRIA PROMPT'+((song.lyriaPrompts||[]).length?` (${song.lyriaPrompts.length} saved)`:' (uses this song\'s tempo)');
    document.querySelectorAll('.song-detail-matrix').forEach(cb=>{ cb.checked = !!(song.matrix && song.matrix[cb.dataset.stem]); });
    const list=$('song-detail-tracks-list');
    const linkedTracks=(song.trackIds||[]).map(id=>(window.db.tracks||[]).find(t=>t.id===id)).filter(Boolean);
    // A thumbnail of the FX chain screenshot (if any) so two same-instrument variants — e.g. two
    // different snare chains you like — are tellable apart at a glance instead of just by name.
    list.innerHTML = linkedTracks.length ? linkedTracks.map(t=>{
      const thumb = (t.images&&t.images[0]) ? `<img src="${t.images[0]}" class="w-7 h-7 object-cover rounded border border-[#00E5FF40] shrink-0 cursor-pointer" title="View FX chain screenshot(s)" onclick="window.openModalGallery('tracks', ${t.id})">` : `<div class="w-7 h-7 rounded border border-white/10 shrink-0 flex items-center justify-center text-white/15 text-[10px]">·</div>`;
      return `<div class="flex items-center gap-2 text-[10px] text-white/70 bg-black/30 rounded px-2 py-1">${thumb}<span class="truncate flex-1">${window.escapeHtml(t.inst||'Track')}</span><button type="button" class="song-detail-track-del text-white/30 hover:text-[#FF5A5A] text-[12px] shrink-0" data-id="${t.id}">×</button></div>`;
    }).join('') : '<div class="text-[9px] text-white/25 italic py-1">No tracks linked yet.</div>';
    populateSongDetailTrackSelect(song);
    const toneList=$('song-detail-tones-list');
    const linkedTones=(song.toneIds||[]).map(id=>(window.db.tones||[]).find(t=>t.id===id)).filter(Boolean);
    toneList.innerHTML = linkedTones.length ? linkedTones.map(t=>`<div class="flex items-center justify-between text-[10px] text-white/70 bg-black/30 rounded px-2 py-1"><span class="truncate pr-2">${window.escapeHtml(t.name||'Unnamed Combo')}</span><button type="button" class="song-detail-tone-del text-white/30 hover:text-[#FF5A5A] text-[12px]" data-id="${t.id}">×</button></div>`).join('') : '<div class="text-[9px] text-white/25 italic py-1">No tones linked yet.</div>';
    populateSongDetailToneSelect(song);
    const lyricsList=$('song-detail-lyrics-list');
    const linkedLyrics=(song.lyricsSheetIds||[]).map(id=>(window.lyrAllSheets?.()||[]).find(sh=>sh.id===id)).filter(Boolean);
    lyricsList.innerHTML = linkedLyrics.length ? linkedLyrics.map(sh=>`<div class="flex items-center justify-between text-[10px] text-white/70 bg-black/30 rounded px-2 py-1"><span class="song-detail-lyrics-open truncate pr-2 cursor-pointer hover:text-[#FF88FF]" data-id="${sh.id}" title="Open in Lyrics Lab">${window.escapeHtml(sh.title||'Untitled')}</span><button type="button" class="song-detail-lyrics-del text-white/30 hover:text-[#FF5A5A] text-[12px] shrink-0" data-id="${sh.id}">×</button></div>`).join('') : '<div class="text-[9px] text-white/25 italic py-1">No lyrics sheets linked yet.</div>';
    populateSongDetailLyricsSelect(song);
    const kitBox=$('song-detail-kit');
    if(kitBox){
      // New songs reference a specific saved kit by id (kits are kept forever, so a reference is as
      // safe as a snapshot). Older attaches before that model may still have the legacy song.kit
      // snapshot — fall back to it so nothing already saved goes blank.
      const refKit = (song.kitId!=null && song.kitGenre && window.findKit) ? window.findKit(song.kitGenre, song.kitId) : null;
      const legacyKit = !refKit ? song.kit : null;
      const kit = refKit || legacyKit;
      const kitGenre = refKit ? song.kitGenre : (legacyKit ? legacyKit.genre : null);
      const recipeCount = (song.cookbookRecipes||[]).length;
      if(kit){
        const slots=(kit.instruments||[]).length;
        const recipes=(kit.instruments||[]).reduce((a,i)=>a+((i.recipes||[]).length),0);
        kitBox.innerHTML=`<div class="bg-black/30 rounded px-2 py-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-[#FF88FF] truncate">${(kitGenre||'Kit').replace(/</g,'')}</div>
              <div class="text-[8px] text-white/35 font-mono mt-0.5">${slots} instruments · ${recipes} AI recipes${recipeCount?` · ${recipeCount} cookbook recipe${recipeCount===1?'':'s'}`:''} · ${refKit?'linked':'snapshot'} from ${new Date(kit.generatedAt).toLocaleDateString()}</div>
            </div>
            <button type="button" id="song-detail-kit-del" class="text-white/30 hover:text-[#FF5A5A] text-[12px] shrink-0">×</button>
          </div>
          <button type="button" id="song-detail-kit-open" class="text-[9px] font-bold tracking-widest text-[#FF88FF]/70 hover:text-[#FF88FF] mt-2">→ OPEN IN COOKBOOK</button>
        </div>`;
        $('song-detail-kit-del')?.addEventListener('click',()=>{ if(!confirm("Unlink this song's kit? Nothing in the Cookbook is deleted.")) return; delete song.kitId; delete song.kitGenre; delete song.kit; delete song.cookbookRecipes; window.saveData(); renderSongDetail(); renderSongBoard(); });
        $('song-detail-kit-open')?.addEventListener('click',()=>{
          const g=kitGenre; closeSongDetail(); window.switchTab('cookbook'); window.selectGenre(g);
          if(refKit){
            setTimeout(()=>window.renderGenreKit(g,{kitId:kit.id}),80);
          } else {
            // Legacy snapshot with no matching history entry — restore it as a real history entry
            // (and upgrade this song onto the reference model) instead of firing a fresh generation.
            window.db.genreKits = window.db.genreKits || {};
            const hist = window.kitHistory ? window.kitHistory(g) : (window.db.genreKits[g]=window.db.genreKits[g]||[]);
            const restored = JSON.parse(JSON.stringify(kit)); restored.id = restored.id || Date.now();
            hist.push(restored); window.db.genreKits[g]=hist;
            song.kitId=restored.id; song.kitGenre=g; delete song.kit;
            window.saveData();
            setTimeout(()=>window.renderGenreKit(g,{kitId:restored.id}),80);
          }
        });
      } else {
        kitBox.innerHTML='<div class="text-[9px] text-white/25 italic py-1">No kit attached. Generate one in the Cookbook (pick a genre → 🤖 AI KIT) and attach it there.</div>';
      }
    }
  }

  // ==================== ARRANGEMENT TIMELINE ====================
  const ARR_KEY='ferrett_os_arrange_v1';
  // colors match TAGS in the Lyrics Lab so a section type looks the same everywhere
  // name, default bars, colour, default intensity (1-10), common? (shown as a one-tap button).
  // The full list mirrors the lyric tag vocabulary in 06-lyrics-lab.js. It is not a whitelist —
  // "+ OTHER…" below adds any section name you like, because Lyria's tag vocabulary is open and a
  // name this table has never heard of is still a perfectly good section.
  // Intensity is a documented Lyria 3 per-segment parameter ("Intensity: 3/10 (Low)") — it belongs to
  // a SECTION, not to the song, which is why it lives here next to bars rather than in the genre
  // overrides. These are only the starting values a section type usually sits at; every row is
  // editable in the timeline and whatever is set there wins.
  const ARR_TYPES=[
    ['Intro',4,'#7AFFBF',2,1],        ['Verse',16,'#00E5FF',4,1],       ['Pre-Chorus',4,'#FFD60A',6,1],
    ['Chorus',8,'#FF88FF',8,1],       ['Post-Chorus',4,'#FF6FD8',6,1],  ['Hook',8,'#FFA05C',8,1],
    ['Bridge',8,'#B18CFF',3,1],       ['Build',4,'#FFD60A',7,1],        ['Drop',8,'#00FF88',10,1],
    ['Breakdown',8,'#4DFFDF',3,1],    ['Solo',8,'#4DFFDF',7,1],         ['Outro',4,'#FF5A5A',2,1],
    ['Refrain',4,'#FFB37A',7,0],      ['Break',2,'#68E5D0',3,0],        ['Instrumental',8,'#7AFFBF',5,0],
    ['Interlude',4,'#9BE8C8',3,0],    ['Ad-Lib',4,'#FFA05C',5,0],       ['Spoken',4,'#D8D8E8',2,0],
    ['Chant',4,'#FF9E6F',7,0],        ['Vamp',4,'#C9A8FF',4,0],         ['Coda',4,'#FF7A7A',3,0],
    ['Reprise',8,'#C9A8FF',6,0],      ['Skit',4,'#C8C8D8',1,0],         ['Tag',2,'#FF8E8E',3,0]];
  // Sections saved before the vocabulary grew used the short forms; keep resolving them.
  const ARR_ALIAS={ 'pre':'Pre-Chorus', 'post':'Post-Chorus', 'adlib':'Ad-Lib', 'ad lib':'Ad-Lib' };
  // The wording Google's examples use alongside the number, so the prompt reads the way the docs do.
  window.arrIntensityLabel=(n)=>{ n=Math.max(1,Math.min(10,Math.round(+n||0)));
    return n<=2?'Very Low':n===3?'Low':n===4?'Medium-Low':n<=6?'Medium':n===7?'Medium-High':n===8?'High':'Very High'; };
  // Base name -> ARR_TYPES row, so "Verse 1"/"Chorus 2"/"Chorus (Half Time)"/legacy "Pre" all resolve.
  // A custom section nobody has ever heard of resolves to nothing and gets neutral defaults, which is
  // the point — it still works, it just isn't styled.
  function arrTypeOf(name){
    const base=(name||'').replace(/\s*\(Half Time\)/i,'').replace(/\s+\d+$/,'').trim();
    if(!base) return null;
    const lower=base.toLowerCase();
    const canonical=ARR_ALIAS[lower]||base;
    return ARR_TYPES.find(x=>x[0].toLowerCase()===canonical.toLowerCase())
        || ARR_TYPES.find(x=>x[0].toLowerCase().replace(/[^a-z]/g,'')===lower.replace(/[^a-z]/g,''))
        || null;
  }
  window.arrDefaultIntensity=(name)=>{ const t=arrTypeOf(name); return t?t[3]:5; };
  window.arrIntensityOf=(s)=>(s && s.intensity!=null) ? s.intensity : window.arrDefaultIntensity(s&&s.name);
  let arrData=null;
  function loadArr(){ try{ const r=localStorage.getItem(ARR_KEY); if(r) return JSON.parse(r); }catch(e){} return {bpm:90,sections:[],attachedSongId:null}; }
  function saveArr(){
    try{ localStorage.setItem(ARR_KEY, JSON.stringify(arrData)); }catch(e){}
    const songId=arrData&&arrData.attachedSongId;
    if(songId!=null){
      const song=(window.db.songBoard||[]).find(s=>s.id===songId);
      if(song){
        song.arrangement={bpm:arrData.bpm,sections:arrData.sections};
        song.bpm=arrData.bpm; // arrangement tempo is the same master tempo shown everywhere else
        const bpm=arrData.bpm||90, secPerBar=4*(60/bpm);
        song.length=Math.round(arrData.sections.reduce((a,s)=>a+s.bars,0)*secPerBar);
        window.saveData();
      } else {
        arrData.attachedSongId=null;
      }
    }
  }
  // Single place that changes a song's tempo, so every surface that shows it — the Song Board card,
  // the song detail modal, the Arrangement workspace (if this song is loaded there), the Lyrics Lab
  // structure strip, and the Lyria AI prompt panel (if this song is selected there) — stays in sync
  // instead of drifting the moment BPM is edited from somewhere other than the arrangement.
  window.setSongBpm=function(songId,bpm){
    const song=(window.db.songBoard||[]).find(s=>s.id===songId); if(!song) return;
    song.bpm=bpm;
    if(song.arrangement) song.arrangement.bpm=bpm||song.arrangement.bpm||90;
    if(arrData && arrData.attachedSongId===songId){
      arrData.bpm=bpm||arrData.bpm||90;
      try{ localStorage.setItem(ARR_KEY, JSON.stringify(arrData)); }catch(e){}
      const bpmEl=$('arr-bpm'); if(bpmEl) bpmEl.value=arrData.bpm;
      renderArr();
    }
    window.saveData();
    renderSongBoard();
    if(typeof renderSongDetail==='function') renderSongDetail();
    if(typeof window.refreshLyrics==='function') window.refreshLyrics();
    const lyriaSel=document.getElementById('lyria-song-select');
    if(lyriaSel && lyriaSel.value===String(songId) && lyriaSel.onchange) lyriaSel.onchange();
  };
  function colorFor(name){ const t=arrTypeOf(name); return t?t[2]:'#B18CFF'; }
  function fmtT(sec){ const m=Math.floor(sec/60), s=Math.round(sec%60); return m+':'+String(s).padStart(2,'0'); }
  function populateArrSongSelect(){
    const sel=$('arr-song-select'); if(!sel) return;
    const songs=(window.db&&window.db.songBoard)||[];
    sel.innerHTML='<option value="">— choose a song —</option>'+songs.map(s=>`<option value="${s.id}">${window.escapeHtml((s.title||'Untitled').slice(0,40))}</option>`).join('');
    const attached=arrData&&arrData.attachedSongId;
    if(attached!=null && songs.some(s=>s.id===attached)) sel.value=String(attached);
  }
  function updateArrAttachedLabel(){
    const lbl=$('arr-attached-label'); if(!lbl) return;
    const songId=arrData&&arrData.attachedSongId;
    if(songId==null){ lbl.classList.add('hidden'); lbl.innerHTML=''; return; }
    const song=(window.db.songBoard||[]).find(s=>s.id===songId);
    if(!song){ arrData.attachedSongId=null; lbl.classList.add('hidden'); lbl.innerHTML=''; return; }
    lbl.classList.remove('hidden');
    lbl.innerHTML=`🔗 Editing arrangement for <b>${window.escapeHtml(song.title||'Untitled')}</b> — edits auto-save to this song. <button id="btn-arr-unlink" type="button" class="underline hover:text-white ml-1" title="Stop editing this song's arrangement — the saved arrangement stays on the song">close</button>`;
    $('btn-arr-unlink')?.addEventListener('click',()=>{ arrData.attachedSongId=null; saveArr(); populateArrSongSelect(); updateArrAttachedLabel(); renderSongBoard(); });
  }
  function loadSongIntoArrWorkspace(song){
    const bpm = song.bpm || (song.arrangement&&song.arrangement.bpm) || 90;
    arrData = song.arrangement
      ? { bpm, sections: JSON.parse(JSON.stringify(song.arrangement.sections||[])), attachedSongId: song.id }
      : { bpm, sections: [], attachedSongId: song.id };
    const bpmEl=$('arr-bpm'); if(bpmEl) bpmEl.value=arrData.bpm;
    saveArr();
    populateArrSongSelect();
    updateArrAttachedLabel();
    renderArr();
    renderSongBoard();
  }
  window.loadSongIntoArrWorkspace=function(id){ const song=(window.db.songBoard||[]).find(s=>s.id===id); if(song) loadSongIntoArrWorkspace(song); };
  // Builds and attaches an arrangement straight from a section list — used both by the paste-tagged
  // flows (initial build) and by the live lyrics->arrangement sync (rebuildArrangementFromLyrics,
  // called on every lyric edit) so a song's structure always tracks its lyric tags. Preserves the
  // song's existing bpm rather than resetting it, and no-ops when nothing actually changed so typing
  // plain lyric text — which doesn't affect line count or tags — doesn't churn a save/re-render.
  window.applyParsedSectionsToSong=function(songId, sections){
    if(!sections || !sections.length) return;
    const song=(window.db.songBoard||[]).find(s=>s.id===songId);
    if(!song) return;
    const bpm=song.bpm||(song.arrangement&&song.arrangement.bpm)||90, secPerBar=4*(60/bpm);
    // Carry any hand-set intensity across the rebuild. This function re-derives the arrangement from
    // the lyric lines on every edit, so without this, typing one more line into a verse would silently
    // reset every intensity in the song back to its section-type default.
    const prev=(song.arrangement&&song.arrangement.sections)||[];
    const carried={}; prev.forEach((p,i)=>{ if(p && p.intensity!=null) carried[p.name+'#'+i]=p.intensity; });
    const newSections=sections.map((s,i)=>{
      const keep = carried[s.name+'#'+i] != null ? carried[s.name+'#'+i]
                 : (prev.find(p=>p && p.name===s.name && p.intensity!=null)||{}).intensity;
      return keep!=null ? {name:s.name,bars:s.bars,intensity:keep} : {name:s.name,bars:s.bars};
    });
    if(song.arrangement && song.arrangement.bpm===bpm && JSON.stringify(song.arrangement.sections)===JSON.stringify(newSections)) return;
    song.arrangement={ bpm, sections: newSections };
    song.bpm=bpm;
    song.length=Math.round(newSections.reduce((a,s)=>a+s.bars,0)*secPerBar);
    window.saveData();
    if(arrData && arrData.attachedSongId===songId){
      arrData.bpm=bpm; arrData.sections=JSON.parse(JSON.stringify(newSections));
      const bpmEl=$('arr-bpm'); if(bpmEl) bpmEl.value=bpm;
      renderArr();
    }
    renderSongBoard(); populateArrSongSelect(); updateArrAttachedLabel(); populateSetlistTracks();
  };
  function renderArr(){
    if(!arrData) arrData=loadArr(); const bpmEl=$('arr-bpm'); if(bpmEl && !bpmEl.value) bpmEl.value=arrData.bpm;
    const bpm=Math.max(40,Math.min(220,+($('arr-bpm')?.value||arrData.bpm||90))); arrData.bpm=bpm;
    const secPerBar=4*(60/bpm);
    const list=$('arr-list'); if(!list) return;
    list.innerHTML=arrData.sections.map((s,i)=>{
      const inten=window.arrIntensityOf(s), isDefault=(s.intensity==null);
      return `<div class="arr-row flex items-center gap-2 p-1.5 rounded border" style="border-color:${colorFor(s.name)}30;background:${colorFor(s.name)}0A" data-i="${i}" draggable="true"><span class="cursor-grab text-white/25 text-[12px]">⠿</span><span class="text-[11px] font-bold w-28 shrink-0 leading-tight" style="color:${colorFor(s.name)}" title="${window.escapeHtml(s.name)}">${window.escapeHtml(s.name)}</span><input type="number" value="${s.bars}" min="1" max="128" class="arr-bars w-14 bg-black/40 border border-white/10 rounded text-center text-[11px] text-white px-1 py-0.5 focus:outline-none" data-i="${i}"><span class="text-[9px] text-white/40">bars</span><span class="text-[9px] text-white/40 ml-1">int</span><input type="number" value="${inten}" min="1" max="10" class="arr-int w-11 bg-black/40 border rounded text-center text-[11px] px-1 py-0.5 focus:outline-none ${isDefault?'text-white/40 border-white/10':'text-[#FFD60A] border-[#FFD60A]/40'}" data-i="${i}" title="Intensity 1-10 for this section — goes into the Lyria prompt as &quot;Intensity: ${inten}/10 (${window.arrIntensityLabel(inten)})&quot;.${isDefault?' Dimmed = the default for a '+window.escapeHtml(s.name)+'; type to override.':''}"><span class="text-[10px] font-mono text-white/60 flex-1 text-right">${fmtT(s.bars*secPerBar)}</span><button class="arr-del text-white/25 hover:text-[#FF5A5A] text-[13px]" data-i="${i}">×</button></div>`;
    }).join('')||'<div class="text-[10px] text-white/25 italic py-2">Add sections above to build your arrangement.</div>';
    const total=arrData.sections.reduce((a,s)=>a+s.bars,0)*secPerBar;
    const bar=$('arr-bar'); if(bar){ bar.innerHTML=arrData.sections.map(s=>`<div style="flex:${s.bars};background:${colorFor(s.name)}90" title="${window.escapeHtml(s.name)} ${s.bars} bars"></div>`).join(''); }
    const tot=$('arr-total'); if(tot) tot.textContent=`TOTAL: ${arrData.sections.reduce((a,s)=>a+s.bars,0)} bars · ${fmtT(total)}`;
    list.querySelectorAll('.arr-bars').forEach(inp=>inp.addEventListener('input',()=>{ arrData.sections[+inp.dataset.i].bars=Math.max(1,+inp.value||1); saveArr(); renderArr(); }));
    // Blank the box to go back to the section type's default rather than being stuck with a number.
    list.querySelectorAll('.arr-int').forEach(inp=>inp.addEventListener('change',()=>{
      const s=arrData.sections[+inp.dataset.i];
      if(inp.value==='') delete s.intensity; else s.intensity=Math.max(1,Math.min(10,+inp.value||window.arrDefaultIntensity(s.name)));
      saveArr(); renderArr(); // saveArr already mirrors sections onto the attached song
    }));
    list.querySelectorAll('.arr-del').forEach(b=>b.addEventListener('click',()=>{ arrData.sections.splice(+b.dataset.i,1); saveArr(); renderArr(); }));
    let dragI=null;
    list.querySelectorAll('.arr-row').forEach(row=>{ row.addEventListener('dragstart',()=>dragI=+row.dataset.i); row.addEventListener('dragover',(e)=>e.preventDefault()); row.addEventListener('drop',()=>{ const to=+row.dataset.i; if(dragI===null||dragI===to) return; const [m]=arrData.sections.splice(dragI,1); arrData.sections.splice(to,0,m); saveArr(); renderArr(); dragI=null; }); });
    saveArr();
  }

  // ==================== SETLIST BUILDER ====================
  const SET_KEY='ferrett_os_setlist_v1';
  let setData=null;
  function loadSet(){ try{ const r=localStorage.getItem(SET_KEY); if(r) return JSON.parse(r); }catch(e){} return []; }
  function saveSet(){ try{ localStorage.setItem(SET_KEY, JSON.stringify(setData)); }catch(e){} }
  function parseLen(s){ s=(s||'').trim(); if(/^\d+:\d{1,2}$/.test(s)){ const [m,se]=s.split(':'); return (+m)*60+(+se); } if(/^\d+$/.test(s)) return (+s)*60; return 210; }
  function renderSet(){
    if(!setData) setData=loadSet(); const list=$('set-list'); if(!list) return;
    list.innerHTML=setData.map((e,i)=>`<div class="flex items-center gap-2 p-1.5 rounded border border-[#00FF8820] bg-black/25"><span class="text-[10px] font-mono text-[#00FF88]/50 w-5">${i+1}.</span><span class="text-[11px] text-[#E2E8F0]/85 flex-1 truncate">${window.escapeHtml(e.title)}</span><span class="text-[10px] font-mono text-[#00FF88]/70">${fmtT(e.sec)}</span><button class="set-up text-white/25 hover:text-white text-[11px]" data-i="${i}">▲</button><button class="set-dn text-white/25 hover:text-white text-[11px]" data-i="${i}">▼</button><button class="set-del text-white/25 hover:text-[#FF5A5A] text-[12px]" data-i="${i}">×</button></div>`).join('')||'<div class="text-[10px] text-white/25 italic py-2">Empty setlist.</div>';
    const total=setData.reduce((a,e)=>a+e.sec,0);
    const tot=$('set-total'); if(tot) tot.textContent=`${setData.length} songs · ${fmtT(total)} total`;
    list.querySelectorAll('.set-del').forEach(b=>b.addEventListener('click',()=>{ setData.splice(+b.dataset.i,1); saveSet(); renderSet(); }));
    list.querySelectorAll('.set-up').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.i; if(i>0){ [setData[i-1],setData[i]]=[setData[i],setData[i-1]]; saveSet(); renderSet(); } }));
    list.querySelectorAll('.set-dn').forEach(b=>b.addEventListener('click',()=>{ const i=+b.dataset.i; if(i<setData.length-1){ [setData[i+1],setData[i]]=[setData[i],setData[i+1]]; saveSet(); renderSet(); } }));
    saveSet();
  }
  function populateSetlistTracks(){ const sel=$('set-from-track'); if(!sel) return; const songs=(window.db&&window.db.songBoard)||[]; sel.innerHTML='<option value="">…or pull from Song Board</option>'+songs.map(s=>`<option value="${s.id}">${window.escapeHtml((s.title||'Untitled').slice(0,40))}${s.length?' ('+fmtT(s.length)+')':''}</option>`).join(''); }

  // ==================== NAME GENERATOR ====================
  const N_ADJ='Neon Velvet Broken Golden Electric Midnight Silent Crimson Hollow Wild Frozen Sacred Lonely Savage Crooked Radiant Phantom Restless Feral Molten'.split(' ');
  const N_NOUN='Wolves Saints Echoes Ghosts Riot Anthem Mirage Cathedral Vultures Machine Tigers Kingdom Static Halo Embers Circus Reverie Undertow Serpents Chrome'.split(' ');
  const S_A='Bleeding Chasing Burning Waiting Falling Dancing Drowning Breaking Running Fading'.split(' ');
  const S_N='Neon Ghosts Fire Shadows Gold Thunder Silence Wildfire Heaven Static Midnight Glass'.split(' ');
  const pick=(a)=>a[Math.floor(Math.random()*a.length)];
  function genNames(kind){
    const out=$('name-out'); if(!out) return; const items=[];
    for(let i=0;i<4;i++){
      if(kind==='band'){ const r=Math.random(); items.push(r<0.4?`The ${pick(N_NOUN)}`:r<0.75?`${pick(N_ADJ)} ${pick(N_NOUN)}`:`${pick(N_NOUN)} & the ${pick(N_NOUN)}`); }
      else { const r=Math.random(); items.push(r<0.4?`${pick(S_A)} in the ${pick(S_N)}`:r<0.7?`${pick(S_A)} ${pick(S_N)}`:`${pick(S_N)} & ${pick(S_N)}`); }
    }
    out.innerHTML=items.map(n=>`<div class="p-2 rounded border border-[#FF88FF20] bg-black/25 text-[13px] text-[#E2E8F0]/90 font-bold">${n}</div>`).join('');
  }

  // ==================== LYRICS: word frequency + print (read from storage) ====================
  const STOP=new Set('the a an and or but of to in on at for with it its is am are was were be been i you he she we they me my your his her our their this that these those as so if then than too not no yeah oh ooh la na do dont cant im ive youre all up down out just got get gonna wanna like'.split(' '));
  function activeLyrSheet(){ try{ const st=window.db&&window.db.lyrics; if(!st||!st.sheets||!st.sheets.length) return null; return st.sheets.find(s=>s.id===st.activeId)||st.sheets[0]; }catch(e){ return null; } }
  function lyrFreq(){
    const out=$('lyr-freq-out'); if(!out) return; const sheet=activeLyrSheet();
    if(!sheet){ out.innerHTML='<div class="text-[10px] text-white/25 italic">No lyrics yet.</div>'; return; }
    const counts={}; sheet.lines.forEach(l=>l.text.toLowerCase().split(/[^a-z']+/).forEach(w=>{ w=w.replace(/[^a-z]/g,''); if(w.length>1 && !STOP.has(w)) counts[w]=(counts[w]||0)+1; }));
    const arr=Object.entries(counts).filter(([w,c])=>c>=2).sort((a,b)=>b[1]-a[1]).slice(0,12);
    if(!arr.length){ out.innerHTML='<div class="text-[10px] text-white/25 italic">No word repeats yet — add more lines.</div>'; return; }
    const mx=arr[0][1];
    out.innerHTML=arr.map(([w,c],i)=>`<div class="flex items-center gap-2"><span class="text-[11px] w-24 truncate ${i===0?'text-[#00FF88] font-bold':'text-white/70'}">${w}${i===0?' 🎣':''}</span><div class="flex-1 h-3 rounded bg-black/40 overflow-hidden"><div class="h-full rounded" style="width:${(c/mx)*100}%;background:${i===0?'#00FF88':'#00FF8860'}"></div></div><span class="text-[10px] font-mono text-white/50 w-5 text-right">${c}</span></div>`).join('');
  }
  function lyrPrint(){
    const sheet=activeLyrSheet(); if(!sheet){ alert('No lyrics to print.'); return; }
    // Chords print as a monospace line above their lyric — the standard chord-sheet layout, and the
    // reason a printout is worth making at all if you're playing from it. Always included when the
    // line has them, independent of the on-screen CHORDS toggle.
    const rows=sheet.lines.map(l=>{ if(!l.text.trim() && !l.tag && !(l.chords||'').trim()) return '<div class="sp">&nbsp;</div>'; const ch=(l.chords||'').trim()?`<div class="ch">${l.chords.replace(/</g,'&lt;')}</div>`:''; return ch+`<div class="ln">${l.tag?`<span class="tag">[${l.tag}]</span> `:''}${(l.text||'').replace(/</g,'&lt;')}</div>`; }).join('');
    const w=window.open('','_blank','width=640,height=800'); if(!w){ alert('Popup blocked — allow popups to print.'); return; }
    w.document.write(`<!doctype html><html><head><meta charset="utf8"><title>${(sheet.title||'Lyrics')}</title><style>body{font-family:Georgia,serif;max-width:600px;margin:40px auto;padding:0 20px;color:#111;line-height:1.7}h1{font-size:24px;border-bottom:2px solid #111;padding-bottom:8px}.ln{font-size:15px}.tag{color:#a21caf;font-weight:bold;font-size:11px;letter-spacing:1px}.sp{height:10px}.ch{font-family:"SFMono-Regular",Consolas,monospace;font-size:12px;font-weight:bold;color:#b45309;white-space:pre;line-height:1.3;margin-top:6px}.foot{margin-top:40px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:8px}@media print{.noprint{display:none}}</style></head><body><h1>${(sheet.title||'Untitled')}</h1>${rows}<div class="foot">EUTERPE_OS · ${new Date().toLocaleDateString()}</div><button class="noprint" onclick="window.print()" style="margin-top:20px;padding:8px 16px">Print / Save PDF</button></body></html>`);
    w.document.close(); setTimeout(()=>{ try{ w.print(); }catch(e){} }, 350);
  }

  // ==================== MELODY -> MIDI ====================
  function kbToMidi(){
    if(!kbTake.length){ $('kb-status').textContent='record a lick first'; return; }
    const bpm=120, div=480, tickPerMs=(bpm/60)*div/1000;
    const notes=kbTake.map(n=>({pitch:n.midi, start:n.t*tickPerMs, dur:0.4*(bpm/60)*div, vel:96, ch:0}));
    if(window.downloadMidi) window.downloadMidi(notes, {division:div, bpm}, 'euterpe-melody');
    $('kb-status').textContent='exported MIDI';
  }

  // ==================== ARRANGEMENT -> DAW MARKERS (CSV) ====================
  function arrToMarkers(){
    if(!arrData||!arrData.sections.length){ alert('Build an arrangement first.'); return; }
    const bpm=Math.max(40,Math.min(220,+($('arr-bpm')?.value||arrData.bpm||90))), secPerBar=4*(60/bpm);
    const tc=(s)=>{ const m=Math.floor(s/60), sec=(s%60); return m+':'+sec.toFixed(3).padStart(6,'0'); };
    let t=0; const rows=['#,Name,Start,End,Length'];
    arrData.sections.forEach((s,i)=>{ const dur=s.bars*secPerBar; rows.push(`R${i+1},${s.name},${tc(t)},${tc(t+dur)},${tc(dur)}`); t+=dur; });
    const blob=new Blob([rows.join('\n')],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='euterpe-arrangement-'+bpm+'bpm.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),800);
  }

  // ==================== TRANSPOSE & CAPO ====================
  const FLAT2SHARP={ 'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#' };
  function parseChord(tok){ const m=tok.match(/^([A-Ga-g])([#b]?)(.*)$/); if(!m) return null; let root=m[1].toUpperCase()+(m[2]||''); if(FLAT2SHARP[root]) root=FLAT2SHARP[root]; const pc=NOTES.indexOf(root); if(pc<0) return null; return {pc, suffix:m[3]||''}; }
  function transposeChords(str, amt){
    return str.trim().split(/\s+/).map(tok=>{ const c=parseChord(tok); if(!c) return tok; return NOTES[((c.pc+amt)%12+12)%12]+c.suffix; }).join(' ');
  }
  function buildTranspose(){
    const amt=+($('tr-amt')?.value||0); const av=$('tr-amt-val'); if(av) av.textContent=(amt>0?'+':'')+amt+' st';
    const out=$('tr-out'); if(out) out.textContent=transposeChords($('tr-chords').value, amt);
  }
  function buildCapo(){
    const shapeKey=$('tr-capo-shape')?.value; const first=parseChord(($('tr-chords').value.trim().split(/\s+/)[0])||''); const cout=$('tr-capo-out'); if(!cout) return;
    if(!first){ cout.textContent='—'; return; }
    const soundingPc=((first.pc + (+($('tr-amt')?.value||0)))%12+12)%12; // what the (transposed) progression sounds like, rooted on first chord
    const shapePc=NOTES.indexOf(shapeKey);
    const capo=((soundingPc-shapePc)%12+12)%12;
    cout.innerHTML = capo===0 ? `Play <b>${shapeKey}</b> shapes open — already matches.` : `Capo <b>fret ${capo}</b>, play <b>${shapeKey}</b> shapes → sounds in <b>${NOTES[soundingPc]}</b>.`;
  }

  // ==================== INIT ====================
  function fillSel(sel,opts,def){ if(!sel) return; sel.innerHTML=opts.map(o=>`<option${o===def?' selected':''}>${o}</option>`).join(''); }
  function init(){
    // keyboard
    if($('kb-keys')){
      fillSel($('kb-scale-root'),NOTES,'C'); fillSel($('kb-scale-type'),Object.keys(SCALES),'Major');
      renderKeyboard();
      ['kb-scale-root','kb-scale-type'].forEach(id=>$(id)?.addEventListener('change',renderKeyboard));
      $('kb-wave')?.addEventListener('change',(e)=>kbWave=e.target.value);
      $('btn-kb-rec')?.addEventListener('click',kbToggleRec);
      $('btn-kb-play')?.addEventListener('click',kbPlayback);
      $('btn-kb-midi')?.addEventListener('click',kbToMidi);
      $('btn-kb-clear')?.addEventListener('click',()=>{ kbTake=[]; $('kb-status').textContent='cleared'; });
      document.addEventListener('keydown',kbKeydown); document.addEventListener('keyup',kbKeyup);
    }
    // fretboard
    if($('fb-svg')){
      fillSel($('fb-root'),NOTES,'E'); fillSel($('fb-scale'),Object.keys(SCALES),'Min Pent');
      buildFretboard();
      ['fb-root','fb-scale'].forEach(id=>$(id)?.addEventListener('change',buildFretboard));
      $('fb-inst-gtr')?.addEventListener('click',()=>{ fbInst='gtr'; $('fb-inst-gtr').classList.add('bg-[#FFD60A]/20','text-[#FFD60A]'); $('fb-inst-gtr').classList.remove('text-[#FFD60A]/50'); $('fb-inst-bass').classList.remove('bg-[#FFD60A]/20','text-[#FFD60A]'); $('fb-inst-bass').classList.add('text-[#FFD60A]/50'); buildFretboard(); });
      $('fb-inst-bass')?.addEventListener('click',()=>{ fbInst='bass'; $('fb-inst-bass').classList.add('bg-[#FFD60A]/20','text-[#FFD60A]'); $('fb-inst-bass').classList.remove('text-[#FFD60A]/50'); $('fb-inst-gtr').classList.remove('bg-[#FFD60A]/20','text-[#FFD60A]'); $('fb-inst-gtr').classList.add('text-[#FFD60A]/50'); buildFretboard(); });
      $('btn-reset-fb')?.addEventListener('click',()=>{ $('fb-root').value='E'; $('fb-scale').value='Min Pent'; $('fb-inst-gtr').click(); buildFretboard(); });
    }
    // arrangement (loaded before song board so the board can reflect the attached song on first paint)
    if($('arr-list')){
      const add=$('arr-add-btns');
      if(add){
        const pushSection=(name,bars)=>{ if(!arrData) arrData=loadArr(); arrData.sections.push({name,bars:+bars||4}); saveArr(); renderArr(); };
        const common=ARR_TYPES.filter(t=>t[4]), rest=ARR_TYPES.filter(t=>!t[4]);
        add.innerHTML=common.map(t=>`<button class="arr-add btn-euterpe px-2 py-1 text-[9px]" style="border-color:${t[2]}60;color:${t[2]}" data-n="${t[0]}" data-b="${t[1]}">+ ${t[0]}</button>`).join('')
          + `<select id="arr-add-more" class="bg-black/50 border border-[#B18CFF]/40 rounded text-[#B18CFF] text-[9px] px-1.5 py-1 focus:outline-none" title="Every other section type, plus any name you want — Lyria accepts section tags it has never seen.">`
          + `<option value="">+ OTHER…</option>`
          + rest.map(t=>`<option value="${window.escapeHtml(t[0])}" data-b="${t[1]}">+ ${window.escapeHtml(t[0])}</option>`).join('')
          + `<option value="__custom__">+ CUSTOM NAME…</option></select>`;
        add.querySelectorAll('.arr-add').forEach(b=>b.addEventListener('click',()=>pushSection(b.dataset.n,b.dataset.b)));
        $('arr-add-more')?.addEventListener('change',(e)=>{
          const sel=e.target, v=sel.value; sel.value='';
          if(!v) return;
          if(v==='__custom__'){
            // Free text on purpose. There is no list of section names Lyria will refuse, so there is
            // no list this app should refuse either.
            const name=(prompt('Section name — anything you like ("Guitar Solo", "Breakdown", "Beat Switch"):')||'').trim();
            if(name) pushSection(name.slice(0,40),4);
            return;
          }
          const opt=sel.querySelector(`option[value="${CSS.escape(v)}"]`);
          pushSection(v, opt?opt.dataset.b:4);
        });
      }
      $('arr-bpm')?.addEventListener('input',()=>{ renderArr(); saveArr(); renderSongBoard(); if(typeof renderSongDetail==='function') renderSongDetail(); });
      $('btn-arr-markers')?.addEventListener('click',arrToMarkers);
      $('btn-arr-attach')?.addEventListener('click',()=>{
        const sel=$('arr-song-select'); const id=sel.value?parseInt(sel.value,10):null;
        if(!id){ sel.focus(); return; }
        if(!arrData) arrData=loadArr();
        if(!arrData.sections.length){ alert('Build an arrangement first.'); return; }
        arrData.attachedSongId=id;
        saveArr(); populateArrSongSelect(); updateArrAttachedLabel(); renderSongBoard();
      });
      $('btn-arr-paste-tagged')?.addEventListener('click',()=>{ $('arr-paste-panel')?.classList.toggle('hidden'); $('arr-paste-text')?.focus(); });
      $('btn-arr-paste-cancel')?.addEventListener('click',()=>{ $('arr-paste-panel')?.classList.add('hidden'); $('arr-paste-text').value=''; });
      $('btn-arr-paste-apply')?.addEventListener('click',()=>{
        const sel=$('arr-song-select'); const id=sel.value?parseInt(sel.value,10):null;
        if(!id){ sel.focus(); return; }
        const raw=$('arr-paste-text').value; if(!raw.trim()) return;
        const parsed=window.parseTaggedSongText?.(raw);
        if(!parsed || !parsed.lines.length) return;
        const song=(window.db.songBoard||[]).find(s=>s.id===id);
        window.lyrLoadParsedLines?.(id, song?song.title:'', parsed.lines); // this links the sheet and rebuilds the song's arrangement from the parsed lines
        $('arr-paste-panel').classList.add('hidden'); $('arr-paste-text').value='';
      });
      if(!arrData) arrData=loadArr();
      populateArrSongSelect();
      updateArrAttachedLabel();
      renderArr();
    }
    // song board
    if($('songboard-board')){
      renderSongBoard();
      $('btn-songboard-add')?.addEventListener('click',()=>{
        const t=$('songboard-title'), n=$('songboard-note'), l=$('songboard-len'), b=$('songboard-bpm'); const title=(t.value||'').trim(); if(!title){ t.focus(); return; }
        window.db.songBoard = window.db.songBoard || [];
        const bpm=Math.max(40,Math.min(300,parseInt(b.value,10)||0))||null;
        window.db.songBoard.push({ id:Date.now()*1000+Math.floor(Math.random()*1000), title, note:(n.value||'').trim(), length:parseSongLen(l.value), bpm, status:'lyrics' });
        t.value=''; n.value=''; l.value=''; b.value='';
        window.saveData(); renderSongBoard(); populateArrSongSelect(); populateSetlistTracks();
      });
      $('songboard-title')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') $('btn-songboard-add')?.click(); });
      $('btn-songboard-paste-tagged')?.addEventListener('click',()=>{ $('songboard-paste-panel')?.classList.toggle('hidden'); $('songboard-paste-text')?.focus(); });
      $('btn-songboard-paste-cancel')?.addEventListener('click',()=>{ $('songboard-paste-panel')?.classList.add('hidden'); $('songboard-paste-text').value=''; });
      $('btn-songboard-paste-apply')?.addEventListener('click',()=>{
        const raw=$('songboard-paste-text').value; if(!raw.trim()) return;
        const parsed=window.parseTaggedSongText?.(raw);
        if(!parsed || !parsed.lines.length) return;
        const t=$('songboard-title'); const title=(t.value||'').trim()||'Untitled';
        window.db.songBoard = window.db.songBoard || [];
        // Read the same three fields + ADD SONG reads. They sit in the row directly above this button,
        // so anything typed there is plainly meant for the song being created — and BPM especially is
        // not cosmetic: applyParsedSectionsToSong below derives every section's bar length from it, and
        // those lengths become the [0:00 - 0:32 Section] timings in the Lyria prompt. Dropping it here
        // silently fell through to that function's hardcoded 90.
        const bpm=Math.max(40,Math.min(300,parseInt($('songboard-bpm')?.value,10)||0))||null;
        const song={ id:Date.now()*1000+Math.floor(Math.random()*1000), title, note:($('songboard-note')?.value||'').trim(), length:null, bpm, status:'lyrics' };
        window.db.songBoard.push(song);
        window.saveData();
        window.lyrLoadParsedLines?.(song.id, title, parsed.lines); // links the sheet and builds the arrangement from the parsed lines
        t.value=''; $('songboard-note').value=''; $('songboard-len').value=''; if($('songboard-bpm')) $('songboard-bpm').value='';
        renderSongBoard(); populateArrSongSelect(); populateSetlistTracks();
        $('songboard-paste-panel').classList.add('hidden'); $('songboard-paste-text').value='';
      });
      const sboard=$('songboard-board');
      sboard.addEventListener('click',(e)=>{
        const del=e.target.closest('.btn-del-song');
        if(del){ const id=parseInt(del.dataset.songId,10); window.db.songBoard=(window.db.songBoard||[]).filter(s=>s.id!==id); window.saveData(); renderSongBoard(); populateArrSongSelect(); updateArrAttachedLabel(); populateSetlistTracks(); return; }
        const arrBtn=e.target.closest('.song-arr-btn');
        if(arrBtn){ window.loadSongIntoArrWorkspace(parseInt(arrBtn.dataset.songId,10)); return; }
        const lyrBtn=e.target.closest('.song-lyr-btn');
        if(lyrBtn){
          const id=parseInt(lyrBtn.dataset.songId,10);
          const song=(window.db.songBoard||[]).find(x=>x.id===id);
          window.lyrOpenSheetForSong?.(id, song?song.title:'');
          $('nav-lyrics')?.click();
          return;
        }
        const detailBtn=e.target.closest('.song-detail-open');
        if(detailBtn){ openSongDetail(parseInt(detailBtn.dataset.songId,10)); }
      });
      $('song-detail-close')?.addEventListener('click', closeSongDetail);
      document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && $('song-detail-modal') && !$('song-detail-modal').classList.contains('hidden')) closeSongDetail(); });
      $('song-detail-title')?.addEventListener('input',()=>{ const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(song){ song.title=$('song-detail-title').value; window.saveData(); renderSongBoard(); } });
      $('song-detail-note')?.addEventListener('input',()=>{ const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(song){ song.note=$('song-detail-note').value; window.saveData(); renderSongBoard(); } });
      $('song-detail-len')?.addEventListener('change',()=>{ const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(song){ song.length=parseSongLen($('song-detail-len').value); $('song-detail-len').value=song.length?fmtT(song.length):''; window.saveData(); renderSongBoard(); } });
      $('song-detail-bpm')?.addEventListener('change',()=>{ const el=$('song-detail-bpm'); const bpm=el.value?Math.max(40,Math.min(300,parseInt(el.value,10)||0))||null:null; window.setSongBpm(songDetailId,bpm); el.value=bpm||''; });
      $('song-detail-arr-btn')?.addEventListener('click',()=>{ if(songDetailId!=null){ const id=songDetailId; closeSongDetail(); window.loadSongIntoArrWorkspace(id); } });
      $('song-detail-lyr-btn')?.addEventListener('click',()=>{ const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(song){ closeSongDetail(); window.lyrOpenSheetForSong?.(song.id, song.title); $('nav-lyrics')?.click(); } });
      $('song-detail-lyria-btn')?.addEventListener('click',()=>{ const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(song){ closeSongDetail(); window.openLyriaModal?.(song.kitGenre || (song.kit && song.kit.genre), song.id); } });
      $('song-detail-export-rpp')?.addEventListener('click',(e)=>{ e.stopPropagation(); if(songDetailId!=null) window.exportToReaper?.(songDetailId); });
      document.querySelectorAll('.song-detail-matrix').forEach(cb=>cb.addEventListener('change',()=>{ if(songDetailId!=null) window.saveMatrix?.(cb, songDetailId, cb.dataset.stem); }));
      $('song-detail-track-add')?.addEventListener('click',()=>{
        const sel=$('song-detail-track-select'); const id=sel.value?parseInt(sel.value,10):null;
        if(!id) return;
        const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(!song) return;
        song.trackIds=song.trackIds||[];
        if(!song.trackIds.includes(id)) song.trackIds.push(id);
        window.saveData(); renderSongDetail(); renderSongBoard();
      });
      $('song-detail-tracks-list')?.addEventListener('click',(e)=>{
        const del=e.target.closest('.song-detail-track-del'); if(!del) return;
        const id=parseInt(del.dataset.id,10);
        const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(!song) return;
        song.trackIds=(song.trackIds||[]).filter(x=>x!==id);
        window.saveData(); renderSongDetail(); renderSongBoard();
      });
      $('song-detail-tone-add')?.addEventListener('click',()=>{
        const sel=$('song-detail-tone-select'); const id=sel.value?parseInt(sel.value,10):null;
        if(!id) return;
        const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(!song) return;
        song.toneIds=song.toneIds||[];
        if(!song.toneIds.includes(id)) song.toneIds.push(id);
        window.saveData(); renderSongDetail(); renderSongBoard();
      });
      $('song-detail-tones-list')?.addEventListener('click',(e)=>{
        const del=e.target.closest('.song-detail-tone-del'); if(!del) return;
        const id=parseInt(del.dataset.id,10);
        const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(!song) return;
        song.toneIds=(song.toneIds||[]).filter(x=>x!==id);
        window.saveData(); renderSongDetail(); renderSongBoard();
      });
      $('song-detail-lyrics-add')?.addEventListener('click',()=>{
        const sel=$('song-detail-lyrics-select'); const id=sel.value?parseInt(sel.value,10):null;
        if(!id) return;
        const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(!song) return;
        song.lyricsSheetIds=song.lyricsSheetIds||[];
        if(!song.lyricsSheetIds.includes(id)) song.lyricsSheetIds.push(id);
        window.saveData(); renderSongDetail(); renderSongBoard();
      });
      $('song-detail-lyrics-list')?.addEventListener('click',(e)=>{
        const del=e.target.closest('.song-detail-lyrics-del');
        if(del){
          const id=parseInt(del.dataset.id,10);
          const song=(window.db.songBoard||[]).find(s=>s.id===songDetailId); if(!song) return;
          song.lyricsSheetIds=(song.lyricsSheetIds||[]).filter(x=>x!==id);
          window.saveData(); renderSongDetail(); renderSongBoard();
          return;
        }
        const open=e.target.closest('.song-detail-lyrics-open');
        if(open){ const id=parseInt(open.dataset.id,10); closeSongDetail(); window.lyrOpenSheetById?.(id); $('nav-lyrics')?.click(); }
      });
      sboard.addEventListener('dragstart',(e)=>{ const c=e.target.closest('.song-card-mini'); if(c){ dragSongId=parseInt(c.dataset.songId,10); e.dataTransfer.effectAllowed='move'; c.style.opacity='0.4'; } });
      sboard.addEventListener('dragend',(e)=>{ const c=e.target.closest('.song-card-mini'); if(c) c.style.opacity=''; });
      sboard.addEventListener('dragover',(e)=>{ if(e.target.closest('.song-col')) e.preventDefault(); });
      sboard.addEventListener('drop',(e)=>{ const col=e.target.closest('.song-col'); if(!col||dragSongId==null) return; e.preventDefault(); const s=(window.db.songBoard||[]).find(x=>x.id===dragSongId); if(s){ s.status=col.dataset.status; window.saveData(); renderSongBoard(); } dragSongId=null; });
    }
    // transpose & capo
    if($('tr-chords')){
      fillSel($('tr-capo-shape'),['C','A','G','E','D'],'G');
      const upd=()=>{ buildTranspose(); buildCapo(); };
      $('tr-chords')?.addEventListener('input',upd);
      $('tr-amt')?.addEventListener('input',upd);
      $('tr-capo-shape')?.addEventListener('change',buildCapo);
      upd();
      $('btn-reset-tr')?.addEventListener('click',()=>{ $('tr-chords').value='C G Am F'; $('tr-amt').value='0'; $('tr-capo-shape').value='G'; upd(); });
    }
    // setlist
    if($('set-list')){
      renderSet(); populateSetlistTracks();
      $('btn-set-add')?.addEventListener('click',()=>{ const t=$('set-title').value.trim(); if(!t) return; if(!setData) setData=loadSet(); setData.push({title:t,sec:parseLen($('set-len').value)}); $('set-title').value=''; $('set-len').value=''; saveSet(); renderSet(); });
      $('set-title')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') $('btn-set-add').click(); });
      $('set-from-track')?.addEventListener('change',(e)=>{ if(e.target.value){ const song=(window.db.songBoard||[]).find(s=>String(s.id)===e.target.value); if(song){ if(!setData) setData=loadSet(); setData.push({title:song.title||'Untitled',sec:song.length||210}); saveSet(); renderSet(); } e.target.value=''; } });
    }
    // names
    if($('name-out')){ $('btn-name-band')?.addEventListener('click',()=>genNames('band')); $('btn-name-song')?.addEventListener('click',()=>genNames('song')); genNames('band'); }
    // lyrics extras
    $('btn-lyr-freq')?.addEventListener('click',lyrFreq);
    $('btn-lyr-print')?.addEventListener('click',lyrPrint);
    // chain into lab refresh so the setlist track list stays current
    const prev=window.refreshLab; window.refreshLab=function(){ try{ prev&&prev(); }catch(e){} populateSetlistTracks(); populateArrSongSelect(); updateArrAttachedLabel(); renderSongBoard(); };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
