(function(){
  const $ = (id) => document.getElementById(id);
  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const jump = (scope, id) => { if (window.cmdkJumpToItem) window.cmdkJumpToItem(scope, id); else window.switchTab?.(scope === 'cookbook' ? 'cookbook' : scope); };

  // ---------- 1. SHUFFLE A CHALLENGE ----------
  const CHALLENGE_CONSTRAINTS = [
    'No reverb allowed — depth from delay + volume only.',
    'Mono. Everything center. Earn your width later.',
    'One synth, one drum bus, nothing else.',
    'Finish the loop in 25 minutes or it ships as-is.',
    'Sample the first sound you make in the room.',
    'Sidechain everything to the kick — even the vocal.',
    'Write the hook before the beat.',
    'No presets. Dial every sound from init.',
    'Cut the arrangement in half, then again.',
    'Pitch the whole thing down a 4th when you\'re done.',
    'Only use gear that\'s already in your patchbay.',
    'Swing it +15% and commit.',
    'End on a chord that isn\'t the root.'
  ];
  function rollChallenge(){
    const out = $('lab-challenge-out'); if (!out) return;
    const cb = window.db.cookbook || [];
    const recipe = cb.length ? cb[Math.floor(Math.random()*cb.length)] : null;
    const bpm = 70 + Math.floor(Math.random()*90);
    const key = NOTES[Math.floor(Math.random()*12)] + (Math.random()<0.55 ? ' minor' : ' major');
    const con = CHALLENGE_CONSTRAINTS[Math.floor(Math.random()*CHALLENGE_CONSTRAINTS.length)];
    out.classList.remove('hidden');
    out.innerHTML =
      `<div class="flex items-center justify-between"><span class="text-[9px] text-[#FFD60A]/60 tracking-widest">RECIPE</span>${recipe?`<button class="text-[11px] text-[#00FF88] font-bold hover:underline cursor-pointer text-right" data-jc="${recipe.id}">${recipe.inst||recipe.genre}</button>`:'<span class="text-[11px] text-white/40">— add recipes first —</span>'}</div>`+
      `<div class="flex items-center justify-between"><span class="text-[9px] text-[#FFD60A]/60 tracking-widest">TEMPO</span><span class="text-[13px] font-mono font-bold text-[#00E5FF]">${bpm} BPM</span></div>`+
      `<div class="flex items-center justify-between"><span class="text-[9px] text-[#FFD60A]/60 tracking-widest">KEY</span><span class="text-[13px] font-mono font-bold text-[#B18CFF]">${key}</span></div>`+
      `<div class="pt-2 border-t border-[#FFD60A15]"><span class="text-[9px] text-[#FFD60A]/60 tracking-widest block mb-1">CONSTRAINT</span><span class="text-[12px] text-[#E2E8F0]/85 italic">${con}</span></div>`;
    out.querySelector('[data-jc]')?.addEventListener('click', (e)=> jump('cookbook', parseInt(e.currentTarget.dataset.jc,10)));
  }

  // ---------- 2. VIBE ROULETTE ----------
  const VIBE_DECK = [
    'Mute your best element. Rebuild around the hole.',
    'What would the demo version do? Do that.',
    'Add a mistake and keep it.',
    'Halve the tempo in your head — re-vibe it.',
    'Record the room, not the instrument.',
    'The intro is 8 bars too long.',
    'Make the quietest thing the loudest.',
    'Steal the groove, not the sound.',
    'One take. No editing. Whatever happens, happens.',
    'Turn it off and hum what you remember. That\'s the song.',
    'Reverse something.',
    'Play it wrong on purpose.',
    'Less notes. Way less.',
    'What\'s the drum doing? Make it do less.',
    'Bring the vocal up 3 dB past comfortable.',
    'Resample the master back into the beat.',
    'Change one instrument to a completely wrong one.',
    'The bridge is the chorus pitched down.',
    'Commit the effect. Print it. No undo.',
    'End the session on the loop you like least — fix it tomorrow.'
  ];
  function pullVibe(){
    const el = $('lab-vibe-card'); if (!el) return;
    el.style.opacity = '0.2';
    setTimeout(()=>{ el.textContent = '“' + VIBE_DECK[Math.floor(Math.random()*VIBE_DECK.length)] + '”'; el.style.opacity = '1'; }, 140);
  }

  // ---------- 3. TEST-TONE & NOISE LAB ----------
  let labAC=null, labNode=null, labGain=null, labType='sine', labPlaying=false;
  const ensureAC = () => { if(!labAC){ try{ labAC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(labAC.state==='suspended') labAC.resume(); return labAC; };
  const volFrac = () => { const v = $('lab-tone-vol'); return v ? (+v.value/100)*0.5 : 0.09; };
  const setToneBtn = (on) => { const b=$('btn-lab-tone-toggle'); if(b){ b.textContent = on ? '■ STOP' : '▶ PLAY'; b.classList.toggle('btn-euterpe', !on); b.classList.toggle('btn-euterpe-green', on); } };
  window.stopTestTone = () => {
    labPlaying = false;
    if(labNode){ try{labNode.onended=null;}catch(e){} try{labNode.stop&&labNode.stop();}catch(e){} try{labNode.disconnect();}catch(e){} labNode=null; }
    if(labGain){ try{labGain.disconnect();}catch(e){} labGain=null; }
    setToneBtn(false);
  };
  function makeNoiseBuffer(ac, pink){
    const len = ac.sampleRate*2, buf = ac.createBuffer(1,len,ac.sampleRate), d = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for(let i=0;i<len;i++){ const w=Math.random()*2-1;
      if(pink){ b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980; d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11; b6=w*0.115926; }
      else d[i]=w;
    }
    return buf;
  }
  function startTone(){
    const ac=ensureAC(); if(!ac) return;
    window.stopTestTone(); labPlaying=true;
    labGain=ac.createGain(); labGain.gain.value=volFrac(); labGain.connect(ac.destination);
    if(labType==='sine'){ const o=ac.createOscillator(); o.type='sine'; o.frequency.value=+($('lab-tone-freq').value); o.connect(labGain); o.start(); labNode=o; }
    else if(labType==='sweep'){ const o=ac.createOscillator(); o.type='sine'; const t=ac.currentTime; o.frequency.setValueAtTime(20,t); o.frequency.exponentialRampToValueAtTime(20000,t+8); o.connect(labGain); o.start(); o.stop(t+8.05); o.onended=()=>{ if(labPlaying && labType==='sweep') startTone(); }; labNode=o; }
    else { const src=ac.createBufferSource(); src.buffer=makeNoiseBuffer(ac, labType==='pink'); src.loop=true; src.connect(labGain); src.start(); labNode=src; }
    setToneBtn(true);
  }

  // fmtClock is also used by the Idea Catcher memo recorder below (section 5) — kept even though the
  // break timer that originally lived in this section no longer needs it.
  const fmtClock = (s)=>{ const m=Math.floor(s/60), r=s%60; return String(m).padStart(2,'0')+':'+String(r).padStart(2,'0'); };

  // ---------- 4. EAR-FATIGUE / BREAK TIMER ----------
  // State/countdown/wiring now lives in js/02-app-core.js (window.breakState, toggleBreakTimer,
  // paintBreakUI, the global 1s tick) so it's one persisted timer that keeps counting down and can
  // interrupt regardless of which tab is open, instead of a bare in-memory counter tied to this panel
  // being mounted. This file just keeps the audio chime, exposed as window.playBreakChime, since it
  // already owns the shared AudioContext helpers used by the tone generator above.
  function chime(){ const ac=ensureAC(); if(!ac) return; [880,660,880].forEach((f,i)=>{ const o=ac.createOscillator(), g=ac.createGain(); o.frequency.value=f; o.connect(g); g.connect(ac.destination); const t=ac.currentTime+i*0.28; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.25,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.26); o.start(t); o.stop(t+0.28); }); }
  window.playBreakChime = chime;

  // ---------- 5. IDEA CATCHER (tap → track) ----------
  let ideaTaps=[];
  function ideaTap(){
    const now=performance.now();
    if(ideaTaps.length && now-ideaTaps[ideaTaps.length-1]>2000) ideaTaps=[];
    ideaTaps.push(now); if(ideaTaps.length>6) ideaTaps.shift();
    if(ideaTaps.length>=2){ let sum=0; for(let i=1;i<ideaTaps.length;i++) sum+=ideaTaps[i]-ideaTaps[i-1]; const bpm=Math.round(60000/(sum/(ideaTaps.length-1))); const el=$('lab-idea-bpm'); if(el) el.textContent=Math.max(30,Math.min(300,bpm)); }
  }
  function spawnTrackStub(){
    const bpmEl=$('lab-idea-bpm'); const bpm=bpmEl?bpmEl.textContent:'—';
    const name=($('lab-idea-name')?.value||'').trim()||'Untitled idea';
    const key=$('lab-idea-key')?.value||'';
    const track={ id:Date.now(), inst:name, daw:'reaper', plugins:'', toneRef:null, recipeRef:null, reflink:'', notes:`Caught in Idea Catcher — ${bpm} BPM${key?' · '+key:''}. [TODO] flesh this out.`, images:[] };
    window.db.tracks = window.db.tracks || []; window.db.tracks.unshift(track);
    window.saveData?.(); window.renderTracks?.();
    const bmEl=$('lab-idea-name'); if(bmEl) bmEl.value='';
    const s=$('btn-lab-idea-save'); if(s){ const o=s.textContent; s.textContent='✓ SAVED TO CHANNEL SETTINGS'; setTimeout(()=>{ s.textContent=o; }, 1400); }
  }

  // ---------- 6. VOICE-MEMO SCRATCHPAD ----------
  const MEMO_KEY='ferrett_os_memos_v1';
  const loadMemos=()=>{ try{ const r=localStorage.getItem(MEMO_KEY); if(r) return JSON.parse(r); }catch(e){} return []; };
  const saveMemos=(m)=>{ try{ localStorage.setItem(MEMO_KEY, JSON.stringify(m)); }catch(e){} };
  let memoRec=null, memoChunks=[], memoStart=0, memoTick=null;
  async function toggleMemoRec(){
    const btn=$('btn-lab-memo-rec'), stat=$('lab-memo-status');
    if(memoRec && memoRec.state==='recording'){ memoRec.stop(); return; }
    if(!navigator.mediaDevices?.getUserMedia){ if(stat) stat.textContent='no mic api'; return; }
    let stream; try{ stream=await navigator.mediaDevices.getUserMedia({audio:true}); }catch(e){ if(stat) stat.textContent='mic denied'; return; }
    memoChunks=[]; try{ memoRec=new MediaRecorder(stream); }catch(e){ if(stat) stat.textContent='rec unsupported'; stream.getTracks().forEach(t=>t.stop()); return; }
    memoRec.ondataavailable=(e)=>{ if(e.data.size) memoChunks.push(e.data); };
    memoRec.onstop=async()=>{
      stream.getTracks().forEach(t=>t.stop()); clearInterval(memoTick);
      const blob=new Blob(memoChunks,{type:memoRec.mimeType||'audio/webm'});
      const dur=Math.round((performance.now()-memoStart)/1000);
      const reader=new FileReader();
      reader.onload=async()=>{ const id='memo_'+Date.now(); await window.audioDbSet?.(id, reader.result); const memos=loadMemos(); memos.unshift({id, name:'Memo '+new Date().toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}), dur}); saveMemos(memos); renderMemos(); };
      reader.readAsDataURL(blob);
      if(btn){ btn.textContent='● RECORD'; btn.classList.remove('animate-pulse'); } if(stat) stat.textContent='';
    };
    memoStart=performance.now(); memoRec.start();
    if(btn){ btn.textContent='■ STOP'; btn.classList.add('animate-pulse'); }
    memoTick=setInterval(()=>{ if(stat) stat.textContent='● '+fmtClock(Math.round((performance.now()-memoStart)/1000)); }, 250);
  }
  async function renderMemos(){
    const wrap=$('lab-memo-list'); if(!wrap) return; const memos=loadMemos();
    if(!memos.length){ wrap.innerHTML='<div class="text-[10px] text-white/25 italic text-center py-3">No memos yet.</div>'; return; }
    wrap.innerHTML=memos.map(m=>`<div class="flex items-center gap-2 p-2 rounded border border-[#FF88FF20] bg-black/30"><button class="lab-memo-play text-[#FF88FF] text-[14px] shrink-0" data-id="${m.id}" title="Play">▶</button><div class="flex-1 min-w-0"><div class="text-[10px] text-[#E2E8F0]/80 truncate">${window.escapeHtml(m.name)}</div><div class="text-[8px] text-[#FF88FF]/40 font-mono">${fmtClock(m.dur||0)}</div></div><button class="lab-memo-del text-white/30 hover:text-[#FF5A5A] text-[13px] shrink-0" data-id="${m.id}" title="Delete">🗑</button></div>`).join('');
    wrap.querySelectorAll('.lab-memo-play').forEach(b=>b.addEventListener('click', async()=>{ const b64=await window.audioDbGet?.(b.dataset.id); if(b64){ const a=new Audio(b64); a.play(); } }));
    wrap.querySelectorAll('.lab-memo-del').forEach(b=>b.addEventListener('click', async()=>{ if(!confirm('Delete this memo?')) return; await window.audioDbDelete?.(b.dataset.id); saveMemos(loadMemos().filter(x=>x.id!==b.dataset.id)); renderMemos(); }));
  }

  // ---------- 7. CIRCLE OF FIFTHS ----------
  const COF=['C','G','D','A','E','B','F#','C#','G#','D#','A#','F']; // clockwise fifths
  const COF_ACC=['0','1♯','2♯','3♯','4♯','5♯','6♯','5♭','4♭','3♭','2♭','1♭'];
  const REL_MINOR=['Am','Em','Bm','F#m','C#m','G#m','D#m','A#m','Fm','Cm','Gm','Dm'];
  function buildCOF(){
    const svg=$('lab-cof-svg'); if(!svg) return; const cx=130, cy=130, rO=118, rI=74;
    let html='';
    for(let i=0;i<12;i++){
      const a=(i/12)*Math.PI*2 - Math.PI/2;
      const x=cx+Math.cos(a)*96, y=cy+Math.sin(a)*96;
      html+=`<g class="lab-cof-seg" data-i="${i}" style="cursor:pointer">`+
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="18" fill="rgba(0,229,255,0.06)" stroke="#00E5FF40" stroke-width="1"/>`+
        `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle" fill="#00E5FF" font-size="13" font-weight="bold">${COF[i]}</text></g>`;
    }
    svg.innerHTML=`<circle cx="${cx}" cy="${cy}" r="${rO}" fill="none" stroke="#00E5FF18"/><circle cx="${cx}" cy="${cy}" r="${rI}" fill="none" stroke="#00E5FF12"/>`+html;
    svg.querySelectorAll('.lab-cof-seg').forEach(g=>g.addEventListener('click',()=>selectCOF(parseInt(g.dataset.i,10))));
    selectCOF(0);
  }
  function selectCOF(i){
    const svg=$('lab-cof-svg'); if(svg) svg.querySelectorAll('.lab-cof-seg circle').forEach((c,idx)=>{ c.setAttribute('fill', idx===i?'#00E5FF':'rgba(0,229,255,0.06)'); }); if(svg) svg.querySelectorAll('.lab-cof-seg text').forEach((t,idx)=> t.setAttribute('fill', idx===i?'#050807':'#00E5FF'));
    const info=$('lab-cof-info'); if(info) info.innerHTML=`<span class="text-[#00E5FF] font-bold text-[15px]">${COF[i]} major</span> · rel. minor <span class="text-[#B18CFF] font-bold">${REL_MINOR[i]}</span><br><span class="text-white/50">key sig ${COF_ACC[i]} · IV ${COF[(i+11)%12]} · V ${COF[(i+1)%12]}</span>`;
  }

  // ---------- 8. SCALE & MODE HELPER ----------
  const SCALES={ 'Major (Ionian)':[0,2,4,5,7,9,11],'Natural Minor':[0,2,3,5,7,8,10],'Dorian':[0,2,3,5,7,9,10],'Phrygian':[0,1,3,5,7,8,10],'Mixolydian':[0,2,4,5,7,9,10],'Harmonic Minor':[0,2,3,5,7,8,11],'Minor Pentatonic':[0,3,5,7,10],'Major Pentatonic':[0,2,4,7,9],'Blues':[0,3,5,6,7,10] };
  const MAJ_Q=['','m','m','','','m','°'], MIN_Q=['m','°','','m','m','',''];
  function buildScale(){
    const root=$('lab-scale-root'), type=$('lab-scale-type'); if(!root||!type) return;
    const r=NOTES.indexOf(root.value), ivs=SCALES[type.value]||SCALES['Major (Ionian)'];
    const notes=ivs.map(iv=>NOTES[(r+iv)%12]);
    const nEl=$('lab-scale-notes'); if(nEl) nEl.innerHTML=notes.map((n,i)=>`<span class="px-2.5 py-1 rounded border border-[#00FF8840] bg-[#00FF88]/10 text-[#00FF88] text-[12px] font-bold font-mono">${n}<sub class="text-[8px] text-[#00FF88]/50 ml-0.5">${i+1}</sub></span>`).join('');
    const cEl=$('lab-scale-chords');
    if(cEl){
      if(ivs.length===7){ const q = type.value.toLowerCase().includes('minor')||['Dorian','Phrygian'].includes(type.value) ? MIN_Q : MAJ_Q; cEl.innerHTML='<span class="text-[#00FF88]/50">Diatonic triads:</span> '+notes.map((n,i)=>n+q[i]).join(' · '); }
      else cEl.innerHTML='<span class="text-[#00FF88]/50">'+ivs.length+'-note scale — great for melodies & solos over the root.</span>';
    }
  }

  // ---------- 9. REVERB & PRE-DELAY RECOMMENDER ----------
  function buildReverb(){
    const bpmEl=$('lab-rev-bpm'), tEl=$('lab-rev-type'), out=$('lab-rev-out'); if(!out) return;
    const bpm=Math.max(40,Math.min(220,+bpmEl.value||90)), q=60000/bpm, type=tEl.value;
    const rows=[];
    const pre18=Math.round(q/2), pre116=Math.round(q/4), pre132=Math.round(q/8);
    let decay, predelay, note;
    if(type==='vocal'){ decay=(q*2/1000).toFixed(2); predelay=pre18; note='Plate 1.6–2.2s. Pre-delay to the 1/8 keeps words intelligible.'; }
    else if(type==='room'){ decay=(q/1000).toFixed(2); predelay=pre132; note='Tight room ≈ 1 beat decay. Short pre-delay glues to the kit.'; }
    else if(type==='hall'){ decay=(q*4/1000).toFixed(2); predelay=pre116; note='Long tail (2 bars). Duck it under the vocal with sidechain.'; }
    else { decay='0.00'; predelay=pre116; note='Slapback = single 1/16-dotted echo, ~15% mix, no tail.'; }
    out.innerHTML=`<div class="flex justify-between"><span class="text-white/40">Pre-delay (1/8)</span><span class="text-[#FF88FF] font-bold">${predelay} ms</span></div>`+
      `<div class="flex justify-between"><span class="text-white/40">Decay / RT60</span><span class="text-[#FF88FF] font-bold">${decay==='0.00'?'—':decay+' s'}</span></div>`+
      `<div class="flex justify-between"><span class="text-white/40">Tail = 1 bar</span><span class="text-[#00E5FF] font-bold">${(q*4/1000).toFixed(2)} s</span></div>`+
      `<div class="text-[10px] text-[#E2E8F0]/50 pt-2 border-t border-[#FF88FF15] italic">${note}</div>`;
  }

  // ---------- 10. MIC 3:1 & SPL FALLOFF ----------
  function buildMic(){
    const d=Math.max(0.1,+$('lab-mic-dist').value||6), spl=+$('lab-mic-spl').value||94, out=$('lab-mic-out'); if(!out) return;
    const second=(d*3).toFixed(1);
    const at2x=(spl-6).toFixed(1), at4x=(spl-12).toFixed(1);
    out.innerHTML=`<div class="flex justify-between"><span class="text-white/40">3:1 — 2nd mic ≥</span><span class="text-[#FFD60A] font-bold">${second} in away</span></div>`+
      `<div class="flex justify-between"><span class="text-white/40">Double the distance</span><span class="text-[#00E5FF] font-bold">${at2x} dB SPL</span></div>`+
      `<div class="flex justify-between"><span class="text-white/40">4× the distance</span><span class="text-[#00E5FF] font-bold">${at4x} dB SPL</span></div>`+
      `<div class="text-[10px] text-[#E2E8F0]/50 pt-2 border-t border-[#FFD60A15] italic">Inverse-square law: −6 dB per doubling. 3:1 rule keeps bleed ≥9 dB down so phase stays clean.</div>`;
  }

  // ---------- 11. FILE-SIZE & RECORD-TIME ----------
  function buildFileSize(){
    const rate=+$('lab-fs-rate').value, bits=+$('lab-fs-bits').value, ch=+$('lab-fs-ch').value, mins=Math.max(1,+$('lab-fs-mins').value||4), out=$('lab-fs-out'); if(!out) return;
    const bytesPerSec=rate*(bits/8)*ch;
    const mb=(bytesPerSec*mins*60)/1048576;
    const perMinMB=(bytesPerSec*60)/1048576;
    const fitIn1GB=Math.floor(1073741824/(bytesPerSec*60));
    out.innerHTML=`<div class="flex justify-between"><span class="text-white/40">This take (${mins} min)</span><span class="text-[#00E5FF] font-bold">${mb>1024?(mb/1024).toFixed(2)+' GB':mb.toFixed(1)+' MB'}</span></div>`+
      `<div class="flex justify-between"><span class="text-white/40">Per minute</span><span class="text-[#00FF88] font-bold">${perMinMB.toFixed(1)} MB</span></div>`+
      `<div class="flex justify-between"><span class="text-white/40">Fits in 1 GB</span><span class="text-[#FFD60A] font-bold">${fitIn1GB} min</span></div>`;
  }

  // ---------- 12. SYLLABLE / BAR COUNTER ----------
  function syllables(word){
    word=word.toLowerCase().replace(/[^a-z]/g,''); if(!word) return 0;
    if(word.length<=3) return 1;
    word=word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/,'').replace(/^y/,'');
    const m=word.match(/[aeiouy]{1,2}/g);
    return m?m.length:1;
  }
  function buildSyllables(){
    const ta=$('lab-syl-in'), out=$('lab-syl-out'); if(!out) return;
    const lines=(ta.value||'').split('\n');
    let total=0, rows='';
    lines.forEach((ln)=>{ const words=ln.trim().split(/\s+/).filter(Boolean); const c=words.reduce((s,w)=>s+syllables(w),0); total+=c; if(ln.trim()){ const bar=Math.min(c,20); rows+=`<div class="flex items-center gap-2"><span class="text-[#B18CFF] font-bold w-6 text-right">${c}</span><span class="inline-block h-1.5 rounded-full bg-[#B18CFF]/60" style="width:${bar*6}px"></span><span class="text-white/40 truncate flex-1">${ln.trim().slice(0,42)}</span></div>`; } });
    out.innerHTML=(rows||'<span class="text-white/25 italic">Type some bars…</span>')+(total?`<div class="pt-2 mt-1 border-t border-[#B18CFF15] text-[#B18CFF]">Total: <b>${total}</b> syllables · ${lines.filter(l=>l.trim()).length} bars</div>`:'');
  }

  // ---------- 13. LOUDNESS TARGETS ----------
  const LUFS=[['Spotify','−14','−1 dBTP','loud tracks get turned down'],['Apple Music','−16','−1 dBTP','the quietest target — mix with headroom'],['YouTube','−14','−1 dBTP','matches Spotify'],['Amazon Music','−14','−2 dBTP',''],['Tidal','−14','−1 dBTP',''],['SoundCloud','−9 to −8','−1 dBTP','no normalization — go hot'],['Club / DJ','−6 peak','0 dBFS','loud & punchy for PA'],['CD Master','−9','−0.3 dBTP','no target, taste-driven']];
  function buildLUFS(){ const g=$('lab-lufs-grid'); if(!g) return; g.innerHTML=LUFS.map(r=>`<div class="p-3 rounded border border-[#00FF8820] bg-black/30"><div class="text-[10px] text-[#00FF88] font-bold tracking-widest">${r[0]}</div><div class="text-[24px] font-bold text-white leading-tight">${r[1]}<span class="text-[10px] text-white/40 ml-1">LUFS</span></div><div class="text-[9px] text-[#00E5FF]/60 font-mono">TP ${r[2]}</div>${r[3]?`<div class="text-[8px] text-white/30 mt-1">${r[3]}</div>`:''}</div>`).join(''); }

  // ---------- 14. FREQUENCY COLLISION MAP ----------
  const EQ=[['Sub Bass',20,90,'#B18CFF'],['808 / Kick',30,120,'#00FF88'],['Bass Gtr',60,700,'#00E5FF'],['Snare',150,4000,'#FFD60A'],['Vocal',120,8000,'#FF88FF'],['Piano/Keys',60,6000,'#00E5FF'],['Guitar',80,5000,'#00FF88'],['Hi-hats',300,16000,'#FFD60A'],['Air/Cymbals',6000,20000,'#FF88FF']];
  const logPos=(hz)=>{ const min=Math.log10(20), max=Math.log10(20000); return ((Math.log10(hz)-min)/(max-min))*100; };
  function buildEQ(){ const g=$('lab-eq-grid'); if(!g) return; g.innerHTML='<div class="flex text-[8px] text-white/30 font-mono pl-[92px] justify-between"><span>20</span><span>100</span><span>1k</span><span>10k</span><span>20k</span></div>'+EQ.map(r=>{ const l=logPos(r[1]), w=logPos(r[2])-l; return `<div class="flex items-center gap-2"><span class="text-[9px] text-white/60 font-bold w-[84px] text-right shrink-0">${r[0]}</span><div class="relative flex-1 h-4 rounded bg-black/40 border border-white/5"><div class="absolute h-full rounded" style="left:${l}%;width:${w}%;background:${r[3]}55;border:1px solid ${r[3]}"></div></div></div>`; }).join(''); }

  // ---------- 15. ACTIVITY HEATMAP ----------
  function buildHeatmap(){
    const wrap=$('lab-heatmap'); if(!wrap) return; const log=window.sessionLog||{}; const days=182; const cells=[];
    let max=1; for(const k in log) max=Math.max(max, log[k]);
    const today=new Date(); today.setHours(0,0,0,0);
    for(let i=days-1;i>=0;i--){ const d=new Date(today); d.setDate(d.getDate()-i); const key=window.fmtDateKey?window.fmtDateKey(d):d.toISOString().slice(0,10); const ms=log[key]||0; cells.push({d, ms}); }
    // arrange into weeks (columns)
    const cols=[]; let col=[]; cells.forEach((c)=>{ col.push(c); if(c.d.getDay()===6){ cols.push(col); col=[]; } }); if(col.length) cols.push(col);
    const lvl=(ms)=> ms<=0?0 : ms<max*0.25?1 : ms<max*0.5?2 : ms<max*0.75?3 : 4;
    const shades=['rgba(0,229,255,0.06)','rgba(0,229,255,0.25)','rgba(0,229,255,0.45)','rgba(0,229,255,0.7)','rgba(0,229,255,1)'];
    let svg=`<div style="display:flex;gap:3px">`;
    cols.forEach(cl=>{ svg+='<div style="display:flex;flex-direction:column;gap:3px">'; for(let r=0;r<7;r++){ const cell=cl.find(x=>x.d.getDay()===r); if(!cell){ svg+='<div style="width:11px;height:11px"></div>'; continue; } const mins=Math.round(cell.ms/60000); svg+=`<div title="${cell.d.toDateString()} — ${mins} min" style="width:11px;height:11px;border-radius:2px;background:${shades[lvl(cell.ms)]}"></div>`; } svg+='</div>'; });
    svg+='</div><div class="flex items-center gap-1 mt-2 text-[8px] text-white/30"><span>less</span>'+shades.map(s=>`<span style="width:11px;height:11px;border-radius:2px;background:${s};display:inline-block"></span>`).join('')+'<span>more</span></div>';
    wrap.innerHTML=svg;
  }

  // ---------- 16. ACHIEVEMENTS ----------
  function buildAchievements(){
    const wrap=$('lab-achievements'); if(!wrap) return;
    const cb=(window.db.cookbook||[]).length, tn=(window.db.tones||[]).length, tk=(window.db.tracks||[]).length;
    const stats=window.getSessionStats?window.getSessionStats():{streak:0,weekMs:0}; const streak=stats.streak||0;
    let totalMs=0; const log=window.sessionLog||{}; for(const k in log) totalMs+=log[k]; const hrs=totalMs/3600000;
    const memos=(function(){ try{ return JSON.parse(localStorage.getItem(MEMO_KEY)||'[]').length; }catch(e){ return 0; } })();
    const A=[
      ['📖','Recipe Chef', cb>=10, `${cb}/10 recipes`],
      ['🎸','Tone Hoarder', tn>=10, `${tn}/10 tones`],
      ['🎚️','Channel Machine', tk>=5, `${tk}/5 channels`],
      ['🔥','On Fire', streak>=3, `${streak}/3 day streak`],
      ['⏱️','Studio Rat', hrs>=10, `${hrs.toFixed(1)}/10 hrs`],
      ['🎙️','Idea Vault', memos>=3, `${memos}/3 memos`],
      ['💯','Century Club', cb>=100, `${cb}/100 recipes`],
      ['🏴‍☠️','Marathon', streak>=7, `${streak}/7 day streak`]
    ];
    wrap.innerHTML=A.map(a=>`<div class="p-3 rounded border ${a[2]?'border-[#FFD60A50] bg-[#FFD60A]/8':'border-white/8 bg-black/20'} text-center"><div class="text-[24px] ${a[2]?'':'grayscale opacity-30'}">${a[0]}</div><div class="text-[9px] font-bold tracking-widest mt-1 ${a[2]?'text-[#FFD60A]':'text-white/30'}">${a[1]}</div><div class="text-[8px] mt-0.5 ${a[2]?'text-[#FFD60A]/60':'text-white/25'} font-mono">${a[2]?'✓ UNLOCKED':a[3]}</div></div>`).join('');
  }

  // ---------- 17. STUDIO GRAPH ----------
  function buildGraph(){
    const svg=$('lab-graph-svg'); if(!svg) return;
    const tracks=(window.db.tracks||[]).filter(t=>t.toneRef||t.recipeRef);
    if(!tracks.length){ svg.innerHTML=`<text x="310" y="210" text-anchor="middle" fill="#B18CFF80" font-size="12">Link tracks to tones/recipes in Channel Settings to see the graph.</text>`; return; }
    const tones={}, recipes={};
    tracks.forEach(t=>{ if(t.toneRef){ const o=(window.db.tones||[]).find(x=>x.id===t.toneRef); if(o) tones[o.id]=o.name; } if(t.recipeRef){ const r=(window.db.cookbook||[]).find(x=>x.id===t.recipeRef); if(r) recipes[r.id]=r.inst||r.genre; } });
    const H=420, pad=40; const place=(arr,x)=>arr.map((v,i)=>({ ...v, x, y: pad + (arr.length===1? (H-2*pad)/2 : i*(H-2*pad)/(arr.length-1)) }));
    const tN=place(tracks.map(t=>({id:t.id,label:t.inst,scope:'tracks'})),310);
    const oN=place(Object.keys(tones).map(id=>({id:+id,label:tones[id],scope:'tones'})),110);
    const rN=place(Object.keys(recipes).map(id=>({id:+id,label:recipes[id],scope:'cookbook'})),510);
    const find=(a,id)=>a.find(n=>n.id===id);
    let edges='';
    tracks.forEach(t=>{ const from=find(tN,t.id); if(t.toneRef){ const to=find(oN,t.toneRef); if(to) edges+=`<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#00E5FF35" stroke-width="1.5"/>`; } if(t.recipeRef){ const to=find(rN,t.recipeRef); if(to) edges+=`<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#00FF8835" stroke-width="1.5"/>`; } });
    const nodeSVG=(n,color)=>`<g class="lab-gnode" data-scope="${n.scope}" data-id="${n.id}" style="cursor:pointer"><circle cx="${n.x}" cy="${n.y}" r="7" fill="${color}" stroke="#050807" stroke-width="2"/><text x="${n.x + (n.x<200?-12:n.x>420?12:0)}" y="${n.y+3}" text-anchor="${n.x<200?'end':n.x>420?'start':'middle'}" fill="${color}" font-size="9">${(n.label||'').slice(0,16)}</text></g>`;
    svg.innerHTML=edges + oN.map(n=>nodeSVG(n,'#00E5FF')).join('') + rN.map(n=>nodeSVG(n,'#FFD60A')).join('') + tN.map(n=>nodeSVG(n,'#00FF88')).join('');
    svg.querySelectorAll('.lab-gnode').forEach(g=>g.addEventListener('click',()=>jump(g.dataset.scope, parseInt(g.dataset.id,10))));
  }

  // ---------- 18. COLD STORAGE ----------
  function buildCold(){
    const out=$('lab-cold-out'); if(!out) return; const now=Date.now(); const cutoff=90*86400000; const items=[];
    const scan=(arr,scope,label,color)=>{ (arr||[]).forEach(x=>{ if(typeof x.id==='number' && x.id>1e12 && (now-x.id)>cutoff){ items.push({scope,id:x.id,label:label(x),days:Math.floor((now-x.id)/86400000),color}); } }); };
    scan(window.db.cookbook,'cookbook',x=>x.inst||x.genre,'#00FF88');
    scan(window.db.tones,'tones',x=>x.name,'#00E5FF');
    scan(window.db.tracks,'tracks',x=>x.inst,'#FFD60A');
    items.sort((a,b)=>b.days-a.days);
    if(!items.length){ out.innerHTML='<div class="text-[10px] text-white/25 italic text-center py-3">Nothing stale — everything\'s under 90 days old. 🧊</div>'; return; }
    out.innerHTML=items.map(i=>`<button class="w-full flex items-center justify-between gap-2 p-2 rounded border border-white/8 bg-black/25 hover:border-[#00E5FF40] text-left cursor-pointer lab-cold-jump" data-scope="${i.scope}" data-id="${i.id}"><span class="text-[11px] truncate" style="color:${i.color}">${window.escapeHtml(i.label)}</span><span class="text-[9px] text-white/35 font-mono shrink-0">${i.days}d cold</span></button>`).join('');
    out.querySelectorAll('.lab-cold-jump').forEach(b=>b.addEventListener('click',()=>jump(b.dataset.scope, parseInt(b.dataset.id,10))));
  }

  // ---------- 19. REAPER TRACK TEMPLATE ----------
  const guid=()=>{ const h='0123456789ABCDEF'; let s='{'; for(let i=0;i<32;i++){ s+=h[Math.floor(Math.random()*16)]; if([8,12,16,20].includes(i+1)) s+='-'; } return s+'}'; };
  function fillRttSelect(){ const s=$('lab-rtt-tone'); if(!s) return; const tones=window.db.tones||[]; s.innerHTML=tones.length?tones.map(t=>`<option value="${t.id}">${window.escapeHtml(t.name)}</option>`).join(''):'<option value="">— no tones saved —</option>'; }
  function exportRtt(){
    const id=parseInt($('lab-rtt-tone').value,10); const t=(window.db.tones||[]).find(x=>x.id===id); if(!t){ alert('Add a tone first.'); return; }
    const nm=(t.name||'Tone').replace(/"/g,"'");
    const meta=[t.nam?('NAM:'+t.nam):'', t.ir?('IR:'+t.ir):''].filter(Boolean).join(' | ');
    const chunk=`<TRACK\nNAME "EUTERPE · ${nm}${meta?' · '+meta:''}"\nPEAKCOL 33575679\nBEAT -1\nAUTOMODE 0\nVOLPAN 1 0 -1 -1 1\nMUTESOLO 0 0 0\nIPHASE 0\nPLAYOFFS 0 1\nISBUS 0 0\nBUSCOMP 0 0 0 0 0\nSHOWINMIX 1 0.6667 0.5 1 0.5 0 -1 0\nFREEMODE 0\nREC 0 0 1 0 0 0 0 0\nVU 2\nTRACKHEIGHT 0 0 0 0 0 0\nINQ 0 0 0 0.5 100 0 0 100\nNCHAN 2\nFX 1\nTRACKID ${guid()}\nPERF 0\n>\n`;
    const blob=new Blob([chunk],{type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(t.name||'tone').replace(/[^a-z0-9]+/gi,'_')+'.RTrackTemplate'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  // ---------- 20. GIG-BAG BUNDLE ----------
  const gbSel={ cookbook:new Set(), tones:new Set(), links:new Set() };
  function openGigbag(){
    gbSel.cookbook.clear(); gbSel.tones.clear(); gbSel.links.clear();
    const body=$('gigbag-body'); if(!body) return;
    const sect=(title,arr,scope,label,color)=>`<div><div class="text-[10px] font-bold tracking-widest mb-2" style="color:${color}">${title}</div><div class="space-y-1">${(arr||[]).map(x=>`<label class="flex items-center gap-2 text-[11px] text-white/70 cursor-pointer p-1.5 rounded hover:bg-white/5"><input type="checkbox" class="gb-check accent-[${color}]" data-scope="${scope}" data-id="${x.id}"> ${window.escapeHtml(label(x))}</label>`).join('')||'<div class="text-[10px] text-white/25 italic">none</div>'}</div></div>`;
    body.innerHTML=sect('RECIPES',window.db.cookbook,'cookbook',x=>x.inst||x.genre,'#00FF88')+sect('TONES',window.db.tones,'tones',x=>x.name,'#00E5FF')+sect('LINKS',window.db.links,'links',x=>x.title,'#FFD60A');
    body.querySelectorAll('.gb-check').forEach(c=>c.addEventListener('change',()=>{ const set=gbSel[c.dataset.scope]; const id=parseInt(c.dataset.id,10); if(c.checked) set.add(id); else set.delete(id); const n=gbSel.cookbook.size+gbSel.tones.size+gbSel.links.size; const cnt=$('gigbag-count'); if(cnt) cnt.textContent=n+' item'+(n===1?'':'s')+' selected'; }));
    const m=$('gigbag-modal'); m.classList.remove('hidden'); m.classList.add('flex');
  }
  function exportGigbag(){
    const pack={ ferrett_pack:true, kind:'gig-bag', created:new Date().toISOString(),
      cookbook:(window.db.cookbook||[]).filter(x=>gbSel.cookbook.has(x.id)),
      tones:(window.db.tones||[]).filter(x=>gbSel.tones.has(x.id)),
      links:(window.db.links||[]).filter(x=>gbSel.links.has(x.id)) };
    if(!pack.cookbook.length && !pack.tones.length && !pack.links.length){ alert('Select at least one item.'); return; }
    const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ferrett-gigbag-'+Date.now()+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    $('gigbag-modal').classList.add('hidden'); $('gigbag-modal').classList.remove('flex');
  }

  // ---------- 21. ENCRYPTED BACKUP ----------
  const b64enc=(buf)=>btoa(String.fromCharCode(...new Uint8Array(buf)));
  const b64dec=(str)=>Uint8Array.from(atob(str),c=>c.charCodeAt(0));
  async function deriveKey(pass,salt){ const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveKey']); return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt']); }
  async function encExport(){
    if(!crypto?.subtle){ alert('WebCrypto unavailable (needs HTTPS or localhost).'); return; }
    const pass=prompt('Set a passphrase for this encrypted backup:'); if(!pass) return;
    const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
    const key=await deriveKey(pass,salt);
    const data=new TextEncoder().encode(JSON.stringify(window.db));
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,data);
    const out={ fenc:1, salt:b64enc(salt), iv:b64enc(iv), data:b64enc(ct) };
    const blob=new Blob([JSON.stringify(out)],{type:'application/octet-stream'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='ferrett-vault-'+new Date().toISOString().slice(0,10)+'.fenc'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function encImport(){ $('lab-enc-file').click(); }
  async function encImportFile(ev){
    const file=ev.target.files[0]; ev.target.value=''; if(!file) return;
    let parsed; try{ parsed=JSON.parse(await file.text()); }catch(e){ alert('Not a valid backup file.'); return; }
    if(!parsed.fenc){ alert('That is not a EUTERPE encrypted (.fenc) file.'); return; }
    const pass=prompt('Passphrase to decrypt:'); if(!pass) return;
    try{
      const key=await deriveKey(pass,b64dec(parsed.salt));
      const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64dec(parsed.iv)},key,b64dec(parsed.data));
      const restored=JSON.parse(new TextDecoder().decode(pt));
      if(!confirm('Decrypted OK. Replace your current vault with this backup?')) return;
      ['cookbook','tones','tracks','links','patchbay','patchbayUserDefault','patchbaySaved','scripts','refShelf','songBoard','ownedPlugins','genreKits','lyrics','multiNotes'].forEach(k=>{ if(restored[k]!==undefined) window.db[k]=restored[k]; });
      window.saveData?.(); alert('Vault restored. Reloading…'); location.reload();
    }catch(e){ alert('Wrong passphrase or corrupted file.'); }
  }

  // ---------- init selects ----------
  function fillNoteSelects(){
    const keySel=$('lab-idea-key'), rootSel=$('lab-scale-root');
    const keyOpts=['— key —'].concat(NOTES.flatMap(n=>[n+' major', n+' minor']));
    if(keySel) keySel.innerHTML=keyOpts.map(o=>`<option>${o}</option>`).join('');
    if(rootSel) rootSel.innerHTML=NOTES.map(n=>`<option${n==='C'?' selected':''}>${n}</option>`).join('');
    const typeSel=$('lab-scale-type'); if(typeSel) typeSel.innerHTML=Object.keys(SCALES).map(s=>`<option>${s}</option>`).join('');
  }

  // ---------- refresh dynamic panels when tab opens ----------
  window.refreshLab = () => { fillRttSelect(); renderMemos(); buildHeatmap(); buildAchievements(); buildGraph(); buildCold(); };

  function init(){
    if(!$('tab-toolbox')) return;
    fillNoteSelects();
    // static builders
    buildCOF(); buildScale(); buildReverb(); buildMic(); buildFileSize(); buildSyllables(); buildLUFS(); buildEQ();
    // creative
    $('btn-lab-challenge')?.addEventListener('click', rollChallenge);
    $('btn-lab-vibe')?.addEventListener('click', pullVibe);
    // tone
    document.querySelectorAll('.lab-tone-src').forEach(b=>b.addEventListener('click',()=>{ labType=b.dataset.tone; document.querySelectorAll('.lab-tone-src').forEach(x=>x.classList.remove('btn-euterpe-green')); document.querySelectorAll('.lab-tone-src').forEach(x=>x.classList.add('btn-euterpe')); b.classList.remove('btn-euterpe'); b.classList.add('btn-euterpe-green'); if(labPlaying) startTone(); }));
    document.querySelectorAll('.lab-ref-pitch').forEach(b=>b.addEventListener('click',()=>{ labType='sine'; const f=$('lab-tone-freq'); f.value=b.dataset.ref; $('lab-tone-freq-val').textContent=Math.round(+b.dataset.ref)+' Hz'; if(!labPlaying) startTone(); else if(labNode&&labNode.frequency) labNode.frequency.value=+b.dataset.ref; }));
    $('lab-tone-freq')?.addEventListener('input',(e)=>{ $('lab-tone-freq-val').textContent=e.target.value+' Hz'; if(labPlaying && labType==='sine' && labNode?.frequency) labNode.frequency.value=+e.target.value; });
    $('lab-tone-vol')?.addEventListener('input',(e)=>{ $('lab-tone-vol-val').textContent=e.target.value+'%'; if(labGain) labGain.gain.value=volFrac(); });
    $('btn-lab-tone-toggle')?.addEventListener('click',()=>{ if(labPlaying) window.stopTestTone(); else startTone(); });
    // break timer wiring lives in js/02-app-core.js now (window.setBreakPreset / toggleBreakTimer / resetBreakTimer)
    // idea catcher
    $('btn-lab-idea-tap')?.addEventListener('click', ideaTap);
    $('btn-lab-idea-save')?.addEventListener('click', spawnTrackStub);
    // memos
    $('btn-lab-memo-rec')?.addEventListener('click', toggleMemoRec);
    // scale/reverb/mic/filesize/syllables live inputs
    ['lab-scale-root','lab-scale-type'].forEach(id=>$(id)?.addEventListener('change', buildScale));
    ['lab-rev-bpm','lab-rev-type'].forEach(id=>$(id)?.addEventListener('input', buildReverb));
    ['lab-mic-dist','lab-mic-spl'].forEach(id=>$(id)?.addEventListener('input', buildMic));
    ['lab-fs-rate','lab-fs-bits','lab-fs-ch','lab-fs-mins'].forEach(id=>$(id)?.addEventListener('input', buildFileSize));
    // reset buttons
    $('btn-reset-scale')?.addEventListener('click',()=>{ $('lab-scale-root').value='C'; $('lab-scale-type').value='Major (Ionian)'; buildScale(); });
    $('btn-reset-rev')?.addEventListener('click',()=>{ $('lab-rev-bpm').value='90'; $('lab-rev-type').value='vocal'; buildReverb(); });
    $('btn-reset-mic')?.addEventListener('click',()=>{ $('lab-mic-dist').value='6'; $('lab-mic-spl').value='94'; buildMic(); });
    $('btn-reset-fs')?.addEventListener('click',()=>{ $('lab-fs-rate').value='48000'; $('lab-fs-bits').value='24'; $('lab-fs-ch').value='2'; $('lab-fs-mins').value='4'; buildFileSize(); });
    // shuffle-a-challenge show/hide
    $('btn-lab-challenge')?.addEventListener('click',()=>{ $('btn-lab-challenge-hide')?.classList.remove('hidden'); });
    $('btn-lab-challenge-hide')?.addEventListener('click',()=>{ $('lab-challenge-out')?.classList.add('hidden'); $('btn-lab-challenge-hide')?.classList.add('hidden'); });
    $('lab-syl-in')?.addEventListener('input', buildSyllables);
    // graph
    $('btn-lab-graph-refresh')?.addEventListener('click', buildGraph);
    // exporters
    $('btn-lab-rtt')?.addEventListener('click', exportRtt);
    $('btn-lab-gigbag')?.addEventListener('click', openGigbag);
    $('gigbag-close')?.addEventListener('click',()=>{ $('gigbag-modal').classList.add('hidden'); $('gigbag-modal').classList.remove('flex'); });
    $('gigbag-export')?.addEventListener('click', exportGigbag);
    $('btn-lab-enc-export')?.addEventListener('click', encExport);
    $('btn-lab-enc-import')?.addEventListener('click', encImport);
    $('lab-enc-file')?.addEventListener('change', encImportFile);
    document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && $('gigbag-modal') && !$('gigbag-modal').classList.contains('hidden')){ $('gigbag-modal').classList.add('hidden'); $('gigbag-modal').classList.remove('flex'); } });
    // first paint of dynamic panels
    window.refreshLab();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
