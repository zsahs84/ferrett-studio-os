(function(){
  const $ = (id)=>document.getElementById(id);
  const NOTES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const MAJ=[0,2,4,5,7,9,11], MIN_NAT=[0,2,3,5,7,8,10];
  const FLAT={Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#',Cb:'B',Fb:'E'};
  let AC=null; const ac=()=>{ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; } } if(AC.state==='suspended') AC.resume(); return AC; };
  const mf=(m)=>440*Math.pow(2,(m-69)/12);
  function voice(freq,t,dur,wave,gainv){ const a=ac(); if(!a) return; const o=a.createOscillator(),g=a.createGain(),f=a.createBiquadFilter(); o.type=wave||'triangle'; o.frequency.value=freq; f.type='lowpass'; f.frequency.setValueAtTime(4500,t); f.frequency.exponentialRampToValueAtTime(1000,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(gainv||0.16,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); o.stop(t+dur+0.05); }
  function parseCh(tok){ if(!tok) return null; const m=tok.match(/^([A-Ga-g])([#b]?)(.*)$/); if(!m) return null; let root=m[1].toUpperCase()+(m[2]||''); if(FLAT[root]) root=FLAT[root]; const pc=NOTES.indexOf(root); if(pc<0) return null; const suf=(m[3]||''); const dim=/dim|°|º/i.test(suf); const min=(/^m/i.test(suf)&&!/^maj/i.test(suf))||/min/i.test(suf); return {pc, min:min&&!dim, dim, suf}; }
  const splitChords=(s)=>s.trim().split(/[\s,|]+/).filter(Boolean);

  // ---------- KEY DETECTOR ----------
  function keyProfile(tonic, major){ const iv=major?MAJ:MIN_NAT; const q=major?['maj','min','min','maj','maj','min','dim']:['min','dim','maj','min','min','maj','maj']; const map={}; iv.forEach((off,i)=>{ map[(tonic+off)%12]=q[i]; }); return map; }
  function detectKey(){
    const chords=splitChords($('kd-in').value).map(parseCh).filter(Boolean); const out=$('kd-out'); if(!out) return;
    if(!chords.length){ out.innerHTML='<span class="text-white/30 italic">Enter some chords…</span>'; return; }
    const scored=[];
    for(let t=0;t<12;t++){ [true,false].forEach(maj=>{ const prof=keyProfile(t,maj); let score=0; chords.forEach(c=>{ const q=prof[c.pc]; if(q!==undefined){ const cq=c.dim?'dim':c.min?'min':'maj'; score+= (q===cq)?1 : 0.4; } }); if(t===chords[chords.length-1].pc) score+=0.3; scored.push({name:NOTES[t]+(maj?' major':' minor'), score}); }); }
    scored.sort((a,b)=>b.score-a.score); const max=scored[0].score;
    out.innerHTML=scored.slice(0,3).map((s,i)=>`<div class="flex items-center gap-2"><span class="${i===0?'text-[#00E5FF] font-bold':'text-white/60'} w-24">${s.name}</span><div class="flex-1 h-2 rounded bg-black/40 overflow-hidden"><div class="h-full" style="width:${(s.score/max*100)}%;background:${i===0?'#00E5FF':'#00E5FF60'}"></div></div></div>`).join('');
  }

  // ---------- NASHVILLE ----------
  function nashville(){
    const key=NOTES.indexOf($('nn-key').value); const chords=splitChords($('nn-in').value).map(parseCh).filter(Boolean); const out=$('nn-out'); if(!out) return;
    const deg=(pc)=>{ const rel=((pc-key)%12+12)%12; const idx=MAJ.indexOf(rel); if(idx>=0) return {n:idx+1,acc:''}; const belowIdx=MAJ.indexOf(((rel+1)%12)); if(belowIdx>=0) return {n:belowIdx+1,acc:'b'}; return {n:'?',acc:''}; };
    out.innerHTML=chords.map(c=>{ const d=deg(c.pc); return `<span class="inline-block mr-2">${d.acc}${d.n}${c.dim?'°':c.min?'m':''}</span>`; }).join('')||'<span class="text-white/30 italic">—</span>';
  }

  // ---------- CAMELOT ----------
  const CAM_MAJ={}, CAM_MIN={}; (function(){ const majOrder=[['C',8],['G',9],['D',10],['A',11],['E',12],['B',1],['F#',2],['C#',3],['G#',4],['D#',5],['A#',6],['F',7]]; majOrder.forEach(([n,num])=>CAM_MAJ[NOTES.indexOf(n)]=num); const minOrder=[['A',8],['E',9],['B',10],['F#',11],['C#',12],['G#',1],['D#',2],['A#',3],['F',4],['C',5],['G',6],['D',7]]; minOrder.forEach(([n,num])=>CAM_MIN[NOTES.indexOf(n)]=num); })();
  function camName(num,letter){ const src=letter==='B'?CAM_MAJ:CAM_MIN; const pc=Object.keys(src).find(k=>src[k]===num); return pc!==undefined? NOTES[pc]+(letter==='B'?' maj':' min'):''; }
  function camelot(){
    const pc=NOTES.indexOf($('cm-root').value); const isMaj=$('cm-mode').value==='maj'; const num=isMaj?CAM_MAJ[pc]:CAM_MIN[pc]; const letter=isMaj?'B':'A'; const out=$('cm-out'); if(!out) return;
    const wrap=(n)=>((n-1+12)%12)+1;
    const rows=[ ['Your key', `${num}${letter} — ${NOTES[pc]} ${isMaj?'maj':'min'}`, '#B18CFF'],
      ['Energy up (+1)', `${wrap(num+1)}${letter} — ${camName(wrap(num+1),letter)}`, '#00FF88'],
      ['Energy down (−1)', `${wrap(num-1)}${letter} — ${camName(wrap(num-1),letter)}`, '#00E5FF'],
      ['Mood switch', `${num}${letter==='B'?'A':'B'} — ${camName(num,letter==='B'?'A':'B')}`, '#FFD60A'] ];
    out.innerHTML=rows.map(r=>`<div class="flex justify-between"><span class="text-white/40">${r[0]}</span><span class="font-bold" style="color:${r[2]}">${r[1]}</span></div>`).join('');
  }

  // ---------- INTERVAL EAR TRAINER ----------
  const IVL=['Unison','m2','M2','m3','M3','P4','Tritone','P5','m6','M6','m7','M7','Octave'];
  let earRoot=60, earIv=7, earScore=0, earTotal=0;
  function earPlay(){ const a=ac(); if(!a) return; const t=a.currentTime+0.05; voice(mf(earRoot),t,0.6,'triangle'); voice(mf(earRoot+earIv),t+0.65,0.6,'triangle'); }
  function earNew(){ earRoot=52+Math.floor(Math.random()*12); earIv=1+Math.floor(Math.random()*12); const fb=$('ear-feedback'); if(fb) fb.textContent=''; earPlay(); renderEarChoices(); }
  function renderEarChoices(){ const box=$('ear-choices'); if(!box) return; box.innerHTML=IVL.slice(1).map((n,i)=>`<button class="ear-choice btn-euterpe px-1 py-1.5 text-[9px]" data-iv="${i+1}">${n}</button>`).join(''); box.querySelectorAll('.ear-choice').forEach(b=>b.addEventListener('click',()=>{ const g=+b.dataset.iv; earTotal++; const fb=$('ear-feedback'); if(g===earIv){ earScore++; if(fb){ fb.textContent='✓ '+IVL[earIv]; fb.style.color='#00FF88'; } } else if(fb){ fb.textContent='✗ it was '+IVL[earIv]; fb.style.color='#FF5A5A'; } const sc=$('ear-score'); if(sc) sc.textContent=earScore+' / '+earTotal; })); }

  // ---------- PROGRESSION PLAYER ----------
  let ppTimer=null, ppPlaying=false, ppStep=0, ppNext=0, ppChords=[];
  function triadMidiFromChord(c){ const base=60+c.pc; if(c.dim) return [base,base+3,base+6]; if(c.min) return [base,base+3,base+7]; return [base,base+4,base+7]; }
  function ppSchedule(){ const a=ac(); const bpm=Math.max(40,Math.min(200,+$('pp-bpm').value||90)); const barDur=4*(60/bpm);
    while(ppNext < a.currentTime+0.15){ const c=ppChords[ppStep%ppChords.length]; const t=ppNext; triadMidiFromChord(c).forEach(m=>voice(mf(m),t,barDur*0.9,'triangle',0.12)); if($('pp-bass').checked) voice(mf(c.pc+36),t,barDur*0.95,'sine',0.22); ppNext+=barDur; ppStep++; }
    ppTimer=setTimeout(ppSchedule,30);
  }
  function ppStop(){ ppPlaying=false; if(ppTimer){ clearTimeout(ppTimer); ppTimer=null; } const b=$('btn-pp-play'); if(b) b.textContent='▶ PLAY'; }
  function ppToggle(){ if(ppPlaying){ ppStop(); return; } ppChords=splitChords($('pp-in').value).map(parseCh).filter(Boolean); if(!ppChords.length) return; const a=ac(); if(!a) return; ppPlaying=true; ppStep=0; ppNext=a.currentTime+0.06; const b=$('btn-pp-play'); if(b) b.textContent='■ STOP'; ppSchedule(); }

  // ---------- NOTE <-> FREQ ----------
  function noteFreqTable(){ const a4=+$('nf-a4').value||440; const oct=+$('nf-oct').value; const box=$('nf-table'); if(!box) return;
    box.innerHTML=NOTES.map((n,pc)=>{ const midi=(oct+1)*12+pc; const hz=a4*Math.pow(2,(midi-69)/12); return `<button class="nf-cell text-[10px] font-mono px-1 py-1 rounded border border-[#FFD60A20] bg-black/25 text-white/80 hover:border-[#FFD60A]" data-midi="${midi}">${n}${oct}<br><span class="text-[#FFD60A]">${hz.toFixed(1)}</span></button>`; }).join('');
    box.querySelectorAll('.nf-cell').forEach(b=>b.addEventListener('click',()=>{ const a=ac(); if(a) voice(mf(+b.dataset.midi),a.currentTime,0.6,'triangle'); }));
  }
  function hzLookup(){ const a4=+$('nf-a4').value||440; const hz=+$('nf-hz').value; const out=$('nf-lookup'); if(!out) return; if(!hz){ out.textContent=''; return; } const midi=69+12*Math.log2(hz/a4); const near=Math.round(midi); const cents=Math.round((midi-near)*100); out.textContent=`${NOTES[((near%12)+12)%12]}${Math.floor(near/12)-1} ${cents>=0?'+':''}${cents}¢`; }

  // ---------- SPECTRUM ANALYZER ----------
  let rtaStream=null, rtaRaf=null, rtaAnalyser=null;
  function rtaStop(){ if(rtaRaf) cancelAnimationFrame(rtaRaf); rtaRaf=null; if(rtaStream){ rtaStream.getTracks().forEach(t=>t.stop()); rtaStream=null; } rtaAnalyser=null; const b=$('btn-rta-toggle'); if(b) b.textContent='🎙️ START'; const s=$('rta-status'); if(s) s.textContent=''; }
  async function rtaToggle(){ if(rtaAnalyser){ rtaStop(); return; } const a=ac(); if(!a){ return; } if(!navigator.mediaDevices?.getUserMedia){ $('rta-status').textContent='no mic api'; return; }
    try{ rtaStream=await navigator.mediaDevices.getUserMedia({audio:true}); }catch(e){ $('rta-status').textContent='mic denied'; return; }
    const src=a.createMediaStreamSource(rtaStream); rtaAnalyser=a.createAnalyser(); rtaAnalyser.fftSize=1024; src.connect(rtaAnalyser);
    const cv=$('rta-canvas'); cv.width=cv.clientWidth||400; const ctx=cv.getContext('2d'); const bins=rtaAnalyser.frequencyBinCount; const data=new Uint8Array(bins);
    const b=$('btn-rta-toggle'); if(b) b.textContent='■ STOP'; $('rta-status').textContent='live';
    const draw=()=>{ rtaRaf=requestAnimationFrame(draw); rtaAnalyser.getByteFrequencyData(data); ctx.fillStyle='rgba(5,8,7,0.35)'; ctx.fillRect(0,0,cv.width,cv.height); const bars=64; const step=Math.floor(bins/bars); for(let i=0;i<bars;i++){ let v=0; for(let j=0;j<step;j++) v=Math.max(v,data[i*step+j]); const h=(v/255)*cv.height; const x=i*(cv.width/bars); const hue=180+ (i/bars)*120; ctx.fillStyle=`hsl(${hue},90%,${30+v/255*35}%)`; ctx.fillRect(x, cv.height-h, cv.width/bars-1, h); } };
    draw();
  }

  // ---------- LEVEL CONVERTERS ----------
  function levelConv(){
    const db=+$('lc-dbfs').value; const lin=Math.pow(10,db/20); const o1=$('lc-dbfs-out'); if(o1) o1.textContent=`= ${lin.toFixed(3)} lin · ${(lin*100).toFixed(1)}%`;
    const g=+$('lc-gain').value; const o2=$('lc-gain-out'); if(o2) o2.textContent=`= ×${Math.pow(10,g/20).toFixed(3)} amplitude`;
    const r=Math.max(1,+$('lc-ratio').value); const o3=$('lc-ratio-out'); if(o3) o3.textContent=`= 10 dB over → +${(10/r).toFixed(1)} dB out`;
    const s=+$('lc-semi').value; const o4=$('lc-semi-out'); if(o4) o4.textContent=`= ×${Math.pow(2,s/12).toFixed(4)} freq · ${s*100} cents`;
  }

  // ---------- generic persisted mini-lists ----------
  const lsGet=(k,d)=>{ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):d; }catch(e){ return d; } };
  const lsSet=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };
  const daysSince=(ts)=>Math.floor((Date.now()-ts)/86400000);

  // GEAR LOG
  const GEAR_KEY='ferrett_os_gearlog_v1';
  function renderGear(){ const list=$('gm-list'); if(!list) return; const items=lsGet(GEAR_KEY,[]); list.innerHTML=items.map((g,i)=>{ const d=daysSince(g.ts); return `<div class="flex items-center gap-2 text-[11px]"><span class="flex-1 text-white/80 truncate">${window.escapeHtml(g.what)}</span><span class="font-mono ${d>90?'text-[#FF5A5A]':'text-[#00FF88]/70'}">${d}d ago</span><button class="gm-reset text-[#00FF88]/50 hover:text-[#00FF88] text-[10px]" data-i="${i}" title="Log again today">↻</button><button class="gm-del text-white/25 hover:text-[#FF5A5A] text-[12px]" data-i="${i}">×</button></div>`; }).join('')||'<div class="text-[10px] text-white/25 italic">Nothing logged yet.</div>';
    list.querySelectorAll('.gm-reset').forEach(b=>b.addEventListener('click',()=>{ const it=lsGet(GEAR_KEY,[]); it[+b.dataset.i].ts=Date.now(); lsSet(GEAR_KEY,it); renderGear(); }));
    list.querySelectorAll('.gm-del').forEach(b=>b.addEventListener('click',()=>{ const it=lsGet(GEAR_KEY,[]); it.splice(+b.dataset.i,1); lsSet(GEAR_KEY,it); renderGear(); }));
  }
  // SAMPLE INDEX
  const SAMP_KEY='ferrett_os_samples_v1';
  function renderSamples(){ const list=$('sl-list'); if(!list) return; const f=($('sl-filter').value||'').toLowerCase(); const items=lsGet(SAMP_KEY,[]).filter(s=>!f||[s.name,s.bpm,s.key].join(' ').toLowerCase().includes(f)); list.innerHTML=items.map(s=>`<div class="flex items-center gap-2 text-[11px] p-1 rounded bg-black/25"><span class="flex-1 text-white/80 truncate">${window.escapeHtml(s.name)}</span>${s.bpm?`<span class="font-mono text-[#00E5FF]/70">${window.escapeHtml(s.bpm)}</span>`:''}${s.key?`<span class="font-mono text-[#FFD60A]/70">${window.escapeHtml(s.key)}</span>`:''}<button class="sl-del text-white/25 hover:text-[#FF5A5A] text-[12px]" data-id="${s.id}">×</button></div>`).join('')||'<div class="text-[10px] text-white/25 italic">No samples.</div>';
    list.querySelectorAll('.sl-del').forEach(b=>b.addEventListener('click',()=>{ lsSet(SAMP_KEY, lsGet(SAMP_KEY,[]).filter(x=>x.id!=b.dataset.id)); renderSamples(); }));
  }
  // COLLABORATORS
  const COLLAB_KEY='ferrett_os_collab_v1';
  function renderCollab(){ const list=$('co-list'); if(!list) return; const items=lsGet(COLLAB_KEY,[]); list.innerHTML=items.map((c,i)=>`<div class="flex items-center gap-2 text-[11px] p-1 rounded bg-black/25"><span class="text-white/85 font-bold">${window.escapeHtml(c.name)}</span><span class="text-white/45 flex-1 truncate">${window.escapeHtml(c.role||'')}</span><button class="co-del text-white/25 hover:text-[#FF5A5A] text-[12px]" data-i="${i}">×</button></div>`).join('')||'<div class="text-[10px] text-white/25 italic">No collaborators yet.</div>';
    list.querySelectorAll('.co-del').forEach(b=>b.addEventListener('click',()=>{ const it=lsGet(COLLAB_KEY,[]); it.splice(+b.dataset.i,1); lsSet(COLLAB_KEY,it); renderCollab(); }));
  }
  // RELEASE CHECKLIST
  const REL_KEY='ferrett_os_release_v1';
  const REL_STEPS=['Final mix approved','Reference A/B checked','Mastered / limiter set','True-peak ≤ −1 dB','Metadata & ISRC','Artwork ready','Distributor upload','Release date set','Socials teased'];
  function relTracks(){ const tr=(window.db&&window.db.tracks)||[]; return ['General'].concat(tr.map(t=>t.inst||'Track')); }
  function renderRelease(){ const sel=$('rc-track'); if(!sel) return; if(!sel.options.length){ sel.innerHTML=relTracks().map(t=>`<option>${t}</option>`).join(''); } const key=sel.value||'General'; const all=lsGet(REL_KEY,{}); const st=all[key]||{}; const list=$('rc-list');
    list.innerHTML=REL_STEPS.map((s,i)=>`<label class="flex items-center gap-2 text-[11px] cursor-pointer py-0.5"><input type="checkbox" class="rc-chk accent-[#FFD60A]" data-i="${i}" ${st[i]?'checked':''}><span class="${st[i]?'line-through text-white/35':'text-white/80'}">${s}</span></label>`).join('');
    const done=REL_STEPS.filter((_,i)=>st[i]).length; const p=$('rc-progress'); if(p) p.textContent=`${done}/${REL_STEPS.length} done`;
    list.querySelectorAll('.rc-chk').forEach(c=>c.addEventListener('change',()=>{ const a=lsGet(REL_KEY,{}); a[key]=a[key]||{}; a[key][+c.dataset.i]=c.checked; lsSet(REL_KEY,a); renderRelease(); }));
  }
  // PRACTICE TIMER
  const PRAC_KEY='ferrett_os_practice_v1';
  let prSec=0, prTimer=null;
  function prPaint(){ const c=$('pr-clock'); if(c){ const m=Math.floor(prSec/60),s=prSec%60; c.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); } }
  function prToggle(){ const b=$('btn-pr-toggle'); if(prTimer){ clearInterval(prTimer); prTimer=null; if(prSec>=10){ const log=lsGet(PRAC_KEY,[]); log.unshift({what:$('pr-what').value.trim()||'Practice', sec:prSec, ts:Date.now()}); lsSet(PRAC_KEY,log.slice(0,50)); renderPractice(); } prSec=0; prPaint(); if(b) b.textContent='▶ START'; }
    else { prTimer=setInterval(()=>{ prSec++; prPaint(); },1000); if(b) b.textContent='■ STOP & LOG'; } }
  function renderPractice(){ const box=$('pr-log'); if(!box) return; const log=lsGet(PRAC_KEY,[]); box.innerHTML=log.slice(0,10).map(e=>{ const m=Math.round(e.sec/60); return `<div class="flex items-center gap-2 text-[10px]"><span class="flex-1 text-white/70 truncate">${window.escapeHtml(e.what)}</span><span class="font-mono text-[#00FF88]/70">${m}m</span><span class="text-white/30">${new Date(e.ts).toLocaleDateString()}</span></div>`; }).join('')||'<div class="text-[10px] text-white/25 italic">No sessions logged.</div>'; }

  // ---------- AI STUDIO BRAIN ----------
  let lastBrainArgs=null;
  // Same fabricated-settings guard as the AI Kit (see window.PLUGIN_CONTROLS): naming only owned
  // plugins isn't enough on its own, because the model will still invent knobs those plugins don't
  // have. aiMix in particular asks for a frequency/dB on every item, which is exactly the pressure
  // that produces an LA-2A "attack time".
  function gearContext(){
    const p=(window.db&&window.db.ownedPlugins)||[]; if(!p.length) return '';
    const controls = (window.pluginControlsBrief && window.pluginControlsBrief(p)) || '';
    return ` You only own these plugins/VSTs — when you name a specific tool, pick one from this list, or suggest a free/stock alternative if nothing here fits. Never recommend a paid plugin that isn't on this list: ${p.join(', ')}.`
      + ` Only ever name a control the plugin actually has, and a value it can actually reach — many of these are hardware emulations with just a couple of knobs, often stepped to fixed frequencies rather than sweeping. If you're not certain of a control's name or range, describe the move using what the plugin does expose instead of inventing a Hz/ms/dB figure; a plausible-looking setting that doesn't exist wastes the user's time at the screen.`
      + (controls ? `\n\n${controls}` : '');
  }
  function brainBusy(on){ const s=$('ai-brain-spinner'); if(s) s.classList.toggle('hidden',!on); }
  function brainShow(txt){ const o=$('ai-brain-out'); if(o){ o.textContent=txt; o.classList.remove('hidden'); } const c=$('ai-brain-out-controls'); if(c && txt){ c.classList.remove('hidden'); c.classList.add('flex'); } }
  async function brainCall(sys,user,creative){ lastBrainArgs=[sys,user,creative]; if(!window.ferrettAI){ brainShow('AI not available.'); return; } /* same pre-Gemini gate as the Lyria one — see the note there; this one silently disabled every Toolbox AI tool in gemini mode */ if(!(window.__aiIsConfigured?.())){ if(window.__openAiModal) window.__openAiModal(); brainShow('Set up the AI connection first (⚙ setup).'); return; } brainBusy(true); brainShow(''); try{ window.__aiUsage?.begin('Toolbox'); const r=await window.ferrettAI(sys,user,{creative}); window.__aiUsage?.end(); brainShow(r); }catch(e){ brainShow('⚠ '+e.message); } finally{ brainBusy(false); } }
  function brainRedo(){ if(lastBrainArgs) brainCall(...lastBrainArgs); }
  function brainHide(){ const o=$('ai-brain-out'), c=$('ai-brain-out-controls'), h=$('btn-ai-brain-hide'); if(!o) return; const nowHidden=o.classList.toggle('hidden'); if(h) h.textContent=nowHidden?'SHOW':'HIDE'; }
  function brainSaveNote(){
    const out=$('ai-brain-out'); const text=out?out.textContent:''; if(!text||!text.trim()) return;
    const q=(lastBrainArgs&&lastBrainArgs[1])?lastBrainArgs[1]:'AI suggestion';
    const title=('🧠 '+q).replace(/\s+/g,' ').trim().slice(0,40);
    window.db.multiNotes=window.db.multiNotes||[];
    const note={ id:Date.now(), title, content:text };
    window.db.multiNotes.push(note);
    window.currentNoteId=note.id;
    window.saveData();
    window.renderNoteTabs&&window.renderNoteTabs();
    window.setNotesFooterOpen&&window.setNotesFooterOpen(true);
    const b=$('btn-ai-brain-save-note'); if(b){ const o2=b.textContent; b.textContent='✓ SAVED'; setTimeout(()=>{ b.textContent=o2; },1400); }
  }
  function aiAsk(){ const q=$('ai-ask-in').value.trim(); if(!q) return; brainCall('You are a veteran recording/mixing engineer and producer. Answer concisely and practically — a few sentences or tight bullets, real moves not fluff.'+gearContext(), q, false); }
  function aiMood(){ const q=$('ai-mood-in').value.trim(); if(!q) return; brainCall('You suggest chord progressions for songwriters. Give 2-3 progressions as chord symbols (e.g. Am–F–C–G), each with a short why. No preamble.', 'Mood: '+q, true); }
  function aiRecipe(){ const sel=$('ai-recipe-sel'); const id=+sel.value; const r=((window.db&&window.db.cookbook)||[]).find(x=>x.id===id); if(!r){ brainShow('Pick a recipe.'); return; } const genre=$('ai-recipe-genre').value.trim()||'a different genre'; brainCall('You are a music production expert. Reimagine the given production recipe for a new genre. Be practical and specific: key sonic moves, plugin/gear analogs, arrangement notes. Keep it tight.'+gearContext(), `Original (${r.genre} — ${r.inst}): ${r.desc||''} ${r.reaper||''}\n\nReimagine for: ${genre}.`, true); }
  function aiMix(){ const q=$('ai-mix-in').value.trim(); if(!q) return; brainCall('You are a mixing engineer. Given described mix problems, return a short prioritized fix list — each item a concrete move with frequency/dB/tool. No preamble.'+gearContext(), q, false); }

  window.stopToolsAudio=()=>{ ppStop(); rtaStop(); };
  window.refreshTools=()=>{
    // recipe select + release track list stay current
    const rs=$('ai-recipe-sel'); if(rs){ const cur=rs.value; rs.innerHTML=((window.db&&window.db.cookbook)||[]).map(r=>`<option value="${r.id}">${(r.inst||r.genre||'Recipe').slice(0,32)}</option>`).join(''); if(cur) rs.value=cur; }
    const rc=$('rc-track'); if(rc){ const cur=rc.value; rc.innerHTML=relTracks().map(t=>`<option>${t}</option>`).join(''); if(cur) rc.value=cur; renderRelease(); }
    renderGear(); renderSamples(); renderCollab(); renderPractice();
    if(window.__updateAiStatus) window.__updateAiStatus();
  };

  function fillSel(sel,opts,def){ if(sel) sel.innerHTML=opts.map(o=>`<option${o===def?' selected':''}>${o}</option>`).join(''); }
  function init(){
    if(!$('tab-toolbox')) return;
    // theory
    detectKey(); $('kd-in')?.addEventListener('input',detectKey);
    $('btn-reset-kd')?.addEventListener('click',()=>{ $('kd-in').value='Am F C G'; detectKey(); });
    fillSel($('nn-key'),NOTES,'C'); nashville(); ['nn-in','nn-key'].forEach(id=>$(id)?.addEventListener('input',nashville));
    $('btn-reset-nn')?.addEventListener('click',()=>{ $('nn-in').value='C G Am F'; $('nn-key').value='C'; nashville(); });
    fillSel($('cm-root'),NOTES,'C'); camelot(); ['cm-root','cm-mode'].forEach(id=>$(id)?.addEventListener('change',camelot));
    $('btn-reset-cm')?.addEventListener('click',()=>{ $('cm-root').value='C'; $('cm-mode').value='maj'; camelot(); });
    // ear
    $('btn-ear-new')?.addEventListener('click',earNew); $('btn-ear-replay')?.addEventListener('click',earPlay); renderEarChoices();
    // progression
    $('btn-pp-play')?.addEventListener('click',ppToggle);
    $('btn-reset-pp')?.addEventListener('click',()=>{ ppStop(); $('pp-in').value='C G Am F'; $('pp-bpm').value='90'; $('pp-bass').checked=true; });
    // note/freq
    fillSel($('nf-oct'),['0','1','2','3','4','5','6','7','8'],'4'); noteFreqTable(); ['nf-a4','nf-oct'].forEach(id=>$(id)?.addEventListener('input',noteFreqTable)); $('nf-hz')?.addEventListener('input',hzLookup);
    $('btn-reset-nf')?.addEventListener('click',()=>{ $('nf-a4').value='440'; $('nf-oct').value='4'; $('nf-hz').value=''; noteFreqTable(); hzLookup(); });
    // rta
    $('btn-rta-toggle')?.addEventListener('click',rtaToggle);
    // level
    levelConv(); ['lc-dbfs','lc-gain','lc-ratio','lc-semi'].forEach(id=>$(id)?.addEventListener('input',levelConv));
    $('btn-reset-lc')?.addEventListener('click',()=>{ $('lc-dbfs').value='-6'; $('lc-gain').value='6'; $('lc-ratio').value='4'; $('lc-semi').value='12'; levelConv(); });
    // gear
    $('btn-gm-add')?.addEventListener('click',()=>{ const w=$('gm-what').value.trim(); if(!w) return; const it=lsGet(GEAR_KEY,[]); it.unshift({what:w,ts:Date.now()}); lsSet(GEAR_KEY,it); $('gm-what').value=''; renderGear(); });
    $('gm-what')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') $('btn-gm-add').click(); });
    // samples
    $('btn-sl-add')?.addEventListener('click',()=>{ const n=$('sl-name').value.trim(); if(!n) return; const it=lsGet(SAMP_KEY,[]); it.unshift({id:Date.now(),name:n,bpm:$('sl-bpm').value.trim(),key:$('sl-key').value.trim()}); lsSet(SAMP_KEY,it); $('sl-name').value='';$('sl-bpm').value='';$('sl-key').value=''; renderSamples(); });
    $('sl-filter')?.addEventListener('input',renderSamples);
    // collab
    $('btn-co-add')?.addEventListener('click',()=>{ const n=$('co-name').value.trim(); if(!n) return; const it=lsGet(COLLAB_KEY,[]); it.unshift({name:n,role:$('co-role').value.trim()}); lsSet(COLLAB_KEY,it); $('co-name').value='';$('co-role').value=''; renderCollab(); });
    // release
    $('rc-track')?.addEventListener('change',renderRelease);
    // practice
    $('btn-pr-toggle')?.addEventListener('click',prToggle); prPaint();
    // ai brain
    $('btn-ai-ask')?.addEventListener('click',aiAsk); $('ai-ask-in')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') aiAsk(); });
    $('btn-ai-mood')?.addEventListener('click',aiMood);
    $('btn-ai-recipe')?.addEventListener('click',aiRecipe);
    $('btn-ai-mix')?.addEventListener('click',aiMix); $('ai-mix-in')?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') aiMix(); });
    $('btn-ai-settings-tools')?.addEventListener('click',()=>window.__openAiModal&&window.__openAiModal());
    $('btn-ai-brain-redo')?.addEventListener('click',brainRedo);
    $('btn-ai-brain-save-note')?.addEventListener('click',brainSaveNote);
    $('btn-ai-brain-hide')?.addEventListener('click',brainHide);
    // initial persisted renders
    renderGear(); renderSamples(); renderCollab(); renderPractice(); renderRelease();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
