(function(){
  const $ = (id) => document.getElementById(id);

  // ============================================================
  // FILE DECODE
  // ============================================================
  let sharedDecodeCtx = null;
  const getDecodeCtx = () => { if (!sharedDecodeCtx) sharedDecodeCtx = new (window.AudioContext||window.webkitAudioContext)(); return sharedDecodeCtx; };
  async function decodeFile(file){
    const buf = await file.arrayBuffer();
    return await getDecodeCtx().decodeAudioData(buf);
  }

  // ============================================================
  // K-WEIGHTING (ITU-R BS.1770-4) + GATED INTEGRATED LOUDNESS
  // Coefficients verified against the reference libebur128 implementation.
  // ============================================================
  function kWeightCoeffs(sampleRate){
    const f0p = 1681.9744509555319, Gp = 3.999843853973347, Qp = 0.7071752369554196;
    const Kp = Math.tan(Math.PI * f0p / sampleRate);
    const Vh = Math.pow(10, Gp/20), Vb = Math.pow(Vh, 0.4996667741545416);
    const a0p = 1 + Kp/Qp + Kp*Kp;
    const stage1 = {
      b0: (Vh + Vb*Kp/Qp + Kp*Kp) / a0p,
      b1: 2*(Kp*Kp - Vh) / a0p,
      b2: (Vh - Vb*Kp/Qp + Kp*Kp) / a0p,
      a1: 2*(Kp*Kp - 1) / a0p,
      a2: (1 - Kp/Qp + Kp*Kp) / a0p
    };
    const f0r = 38.13547087602444, Qr = 0.5003270373238773;
    const Kr = Math.tan(Math.PI * f0r / sampleRate);
    const a0r = 1 + Kr/Qr + Kr*Kr;
    const stage2 = {
      b0: 1/a0r, b1: -2/a0r, b2: 1/a0r,
      a1: 2*(Kr*Kr - 1)/a0r,
      a2: (1 - Kr/Qr + Kr*Kr)/a0r
    };
    return { stage1, stage2 };
  }
  function applyBiquad(input, c){
    const out = new Float32Array(input.length);
    let x1=0,x2=0,y1=0,y2=0;
    for (let i=0;i<input.length;i++){
      const x0 = input[i];
      const y0 = c.b0*x0 + c.b1*x1 + c.b2*x2 - c.a1*y1 - c.a2*y2;
      out[i]=y0; x2=x1; x1=x0; y2=y1; y1=y0;
    }
    return out;
  }
  function kWeightChannel(samples, sampleRate, coeffs){
    return applyBiquad(applyBiquad(samples, coeffs.stage1), coeffs.stage2);
  }
  // 400ms gated blocks, 75% overlap, per BS.1770 — returns integrated + short-term/momentary max LUFS
  function computeLoudness(audioBuffer){
    const sr = audioBuffer.sampleRate, numCh = audioBuffer.numberOfChannels;
    const coeffs = kWeightCoeffs(sr);
    const filtered = [];
    for (let ch=0; ch<numCh; ch++) filtered.push(kWeightChannel(audioBuffer.getChannelData(ch), sr, coeffs));
    const len = filtered[0].length;
    const blockSize = Math.round(sr*0.4), hop = Math.round(sr*0.1);
    const blockEnergies = [];
    for (let start=0; start+blockSize<=len; start+=hop){
      let energy = 0;
      for (let ch=0; ch<numCh; ch++){
        const d = filtered[ch]; let sum=0;
        for (let i=start;i<start+blockSize;i++) sum += d[i]*d[i];
        energy += sum/blockSize;
      }
      blockEnergies.push(energy);
    }
    if (!blockEnergies.length) return { integratedLufs: null, shortTermMaxLufs: null, momentaryMaxLufs: null };
    const loudnessOf = (e) => e>0 ? (-0.691 + 10*Math.log10(e)) : -Infinity;
    let momentaryMaxLufs = -Infinity;
    for (const e of blockEnergies) momentaryMaxLufs = Math.max(momentaryMaxLufs, loudnessOf(e));
    let shortTermMaxLufs = -Infinity; const winBlocks = 30;
    for (let i=0;i+winBlocks<=blockEnergies.length;i++){
      let sum=0; for (let j=0;j<winBlocks;j++) sum+=blockEnergies[i+j];
      shortTermMaxLufs = Math.max(shortTermMaxLufs, loudnessOf(sum/winBlocks));
    }
    if (!isFinite(shortTermMaxLufs)) shortTermMaxLufs = momentaryMaxLufs;
    const absThresh = Math.pow(10, (-70+0.691)/10);
    const passedAbs = blockEnergies.filter(e=>e>absThresh);
    if (!passedAbs.length) return { integratedLufs: -Infinity, shortTermMaxLufs, momentaryMaxLufs };
    const meanAbs = passedAbs.reduce((a,b)=>a+b,0)/passedAbs.length;
    const relThresh = Math.pow(10, (loudnessOf(meanAbs)-10+0.691)/10);
    const passedRel = passedAbs.filter(e=>e>relThresh);
    const finalMean = passedRel.length ? passedRel.reduce((a,b)=>a+b,0)/passedRel.length : meanAbs;
    return { integratedLufs: loudnessOf(finalMean), shortTermMaxLufs, momentaryMaxLufs };
  }

  // ============================================================
  // TRUE PEAK — approximate: 4x oversample via the browser's native resampler,
  // NOT a hand-built ITU Annex-2 polyphase filter. Close enough to flag inter-sample
  // overs; don't treat it as certified-exact.
  // ============================================================
  async function computeTruePeak(audioBuffer){
    const targetRate = Math.min(192000, audioBuffer.sampleRate * 4);
    const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, Math.ceil(audioBuffer.duration*targetRate), targetRate);
    const src = offlineCtx.createBufferSource(); src.buffer = audioBuffer; src.connect(offlineCtx.destination); src.start();
    const rendered = await offlineCtx.startRendering();
    let peak = 0;
    for (let ch=0; ch<rendered.numberOfChannels; ch++){
      const d = rendered.getChannelData(ch);
      for (let i=0;i<d.length;i++){ const a=Math.abs(d[i]); if (a>peak) peak=a; }
    }
    return peak>0 ? 20*Math.log10(peak) : -Infinity;
  }

  // ============================================================
  // PHASE CORRELATION (stereo only) — -1 (fully out of phase) to +1 (fully correlated/mono-safe)
  // ============================================================
  function computePhaseCorrelation(audioBuffer){
    if (audioBuffer.numberOfChannels < 2) return null;
    const L = audioBuffer.getChannelData(0), R = audioBuffer.getChannelData(1);
    const step = Math.max(1, Math.floor(L.length/2000000)); // cap sample count on very long files
    let sumLR=0,sumLL=0,sumRR=0;
    for (let i=0;i<L.length;i+=step){ sumLR+=L[i]*R[i]; sumLL+=L[i]*L[i]; sumRR+=R[i]*R[i]; }
    const denom = Math.sqrt(sumLL*sumRR);
    return denom>1e-9 ? sumLR/denom : null; // near-silent signal — nothing meaningful to correlate
  }

  // ============================================================
  // DYNAMIC RANGE — crest-factor style approximation (peak vs. loudest-20%-of-3s-blocks RMS).
  // Inspired by the TT DR Meter concept, NOT a certified reproduction of that exact algorithm.
  // ============================================================
  function computeDR(audioBuffer){
    const sr = audioBuffer.sampleRate, numCh = audioBuffer.numberOfChannels, len = audioBuffer.length;
    const blockLen = Math.round(sr*3);
    const blocks = [];
    for (let start=0; start+blockLen<=len; start+=blockLen){
      let sumSq=0, peak=0;
      for (let ch=0; ch<numCh; ch++){
        const d = audioBuffer.getChannelData(ch);
        for (let i=start;i<start+blockLen;i++){ const v=d[i]; sumSq+=v*v; const a=Math.abs(v); if (a>peak) peak=a; }
      }
      blocks.push({ rms: Math.sqrt(sumSq/(blockLen*numCh)), peak });
    }
    if (blocks.length < 2) return null;
    const sorted = [...blocks].sort((a,b)=>b.rms-a.rms);
    const top = sorted.slice(0, Math.max(1, Math.round(sorted.length*0.2)));
    const avgRms = top.reduce((a,b)=>a+b.rms,0)/top.length;
    const overallPeak = Math.max(...blocks.map(b=>b.peak));
    if (avgRms<=0 || overallPeak<=0) return null;
    return 20*Math.log10(overallPeak/avgRms);
  }

  // ============================================================
  // SPECTRAL BALANCE — custom iterative radix-2 FFT run directly on the decoded buffer
  // (no need to "play" the file), Hann-windowed, averaged across the whole track.
  // ============================================================
  function fftInPlace(re, im){
    const n = re.length;
    for (let i=1,j=0;i<n;i++){
      let bit=n>>1;
      for (;j&bit;bit>>=1) j^=bit;
      j^=bit;
      if (i<j){ let t=re[i];re[i]=re[j];re[j]=t; t=im[i];im[i]=im[j];im[j]=t; }
    }
    for (let len=2; len<=n; len<<=1){
      const ang = -2*Math.PI/len, wlr = Math.cos(ang), wli = Math.sin(ang);
      for (let i=0;i<n;i+=len){
        let curWr=1, curWi=0;
        for (let j=0;j<len/2;j++){
          const ur=re[i+j], ui=im[i+j];
          const vr=re[i+j+len/2]*curWr - im[i+j+len/2]*curWi;
          const vi=re[i+j+len/2]*curWi + im[i+j+len/2]*curWr;
          re[i+j]=ur+vr; im[i+j]=ui+vi;
          re[i+j+len/2]=ur-vr; im[i+j+len/2]=ui-vi;
          const nwr = curWr*wlr - curWi*wli, nwi = curWr*wli + curWi*wlr;
          curWr=nwr; curWi=nwi;
        }
      }
    }
  }
  // [shortLabel (chart axis), fullLabel (used in flag text), lowHz, highHz]
  const SPECTRUM_BANDS = [
    ['Sub','Sub (20-60Hz)',20,60],
    ['Bass','Bass (60-100Hz)',60,100],
    ['U.Bass','Upper Bass (100-200Hz)',100,200],
    ['Boxy','Boxy (200-350Hz)',200,350],
    ['Mud','Mud (350-500Hz)',350,500],
    ['L.Mid','Low-Mid (500-800Hz)',500,800],
    ['Mid','Mid (800Hz-1.2kHz)',800,1200],
    ['U.Mid','Upper-Mid (1.2-2.5kHz)',1200,2500],
    ['Pres','Presence (2.5-4kHz)',2500,4000],
    ['Harsh','Harshness (4-6.5kHz)',4000,6500],
    ['Bril','Brilliance (6.5-10kHz)',6500,10000],
    ['Air','Air (10-20kHz)',10000,20000]
  ];
  function computeSpectrum(audioBuffer){
    const sr = audioBuffer.sampleRate, numCh = audioBuffer.numberOfChannels;
    const fftSize = 4096, hop = fftSize/2;
    const mono = new Float32Array(audioBuffer.length);
    for (let ch=0; ch<numCh; ch++){ const d = audioBuffer.getChannelData(ch); for (let i=0;i<d.length;i++) mono[i]+=d[i]/numCh; }
    const bandEnergy = new Array(SPECTRUM_BANDS.length).fill(0);
    const win = new Float32Array(fftSize);
    for (let i=0;i<fftSize;i++) win[i]=0.5-0.5*Math.cos(2*Math.PI*i/(fftSize-1));
    const re = new Float32Array(fftSize), im = new Float32Array(fftSize);
    let frames=0;
    for (let start=0; start+fftSize<=mono.length; start+=hop){
      for (let i=0;i<fftSize;i++){ re[i]=mono[start+i]*win[i]; im[i]=0; }
      fftInPlace(re, im);
      for (let bin=1; bin<fftSize/2; bin++){
        const freq = bin*sr/fftSize, mag = re[bin]*re[bin]+im[bin]*im[bin];
        for (let b=0;b<SPECTRUM_BANDS.length;b++){ if (freq>=SPECTRUM_BANDS[b][2] && freq<SPECTRUM_BANDS[b][3]){ bandEnergy[b]+=mag; break; } }
      }
      frames++;
    }
    if (!frames) return SPECTRUM_BANDS.map(b=>({ name:b[0], fullName:b[1], db:-100 }));
    const maxE = Math.max(...bandEnergy, 1e-12);
    return SPECTRUM_BANDS.map((b,i)=>({ name:b[0], fullName:b[1], db: 10*Math.log10(Math.max(bandEnergy[i],1e-12)/maxE) }));
  }

  // ============================================================
  // BAND-IMBALANCE FLAGS — plain threshold comparisons against common mixing terminology.
  // These are transparent rules of thumb, not a certified standard or a judgment on the mix —
  // every flag shows the actual dB delta that triggered it so it's auditable, not a black box.
  // ============================================================
  const FLAG_RULES = [
    { shorts:['Boxy'],        label:'Boxy buildup',       sev:'warn', dir:'over',  thresh:6,  tip:'can sound boxy/honky' },
    { shorts:['Mud'],         label:'Mud buildup',        sev:'warn', dir:'over',  thresh:6,  tip:'classic mud/muffled buildup' },
    { shorts:['Harsh'],       label:'Possible harshness', sev:'warn', dir:'over',  thresh:6,  tip:'can read as harsh or sibilant' },
    { shorts:['Bass','U.Bass'], label:'Bass-heavy',       sev:'info', dir:'over',  thresh:8,  tip:'can sound boomy, especially on smaller speakers' },
    { shorts:['Sub','Bass'],  label:'Light low end',      sev:'info', dir:'under', thresh:10, tip:'may sound thin on full-range systems' },
    { shorts:['Bril','Air'],  label:'Rolled-off highs',   sev:'info', dir:'under', thresh:10, tip:'mix may sound dark/dull' }
  ];
  function computeFlags(spectrum){
    const get = (short) => { const b = spectrum.find(x=>x.name===short); return b ? b.db : null; };
    const meanExcluding = (excl) => { const vals = spectrum.filter(b=>!excl.includes(b.name)).map(b=>b.db); return vals.length ? vals.reduce((a,c)=>a+c,0)/vals.length : null; };
    const flags = [];
    for (const r of FLAG_RULES){
      const bandVals = r.shorts.map(get).filter(v=>v!=null); if (!bandVals.length) continue;
      const bandAvg = bandVals.reduce((a,b)=>a+b,0)/bandVals.length;
      const rest = meanExcluding(r.shorts); if (rest==null) continue;
      const delta = bandAvg - rest;
      const desc = r.shorts.map(s=>{ const b=SPECTRUM_BANDS.find(x=>x[0]===s); return b?b[1]:s; }).join(' + ');
      if (r.dir==='over' && delta > r.thresh) flags.push({ label:r.label, sev:r.sev, detail:`${desc} is running ${delta.toFixed(1)}dB above the rest of the spectrum — ${r.tip}.` });
      if (r.dir==='under' && -delta > r.thresh) flags.push({ label:r.label, sev:r.sev, detail:`${desc} is running ${(-delta).toFixed(1)}dB below the rest of the spectrum — ${r.tip}.` });
    }
    if (!flags.length) flags.push({ label:'No obvious band imbalances', sev:'ok', detail:'No single region stands out from the rest by more than a rule-of-thumb threshold — not proof the mix is good, just that nothing here jumps out.' });
    return flags;
  }

  // ============================================================
  // ORCHESTRATION
  // ============================================================
  async function analyzeFile(file){
    const audioBuffer = await decodeFile(file);
    const loudness = computeLoudness(audioBuffer);
    const truePeak = await computeTruePeak(audioBuffer);
    const phase = computePhaseCorrelation(audioBuffer);
    const dr = computeDR(audioBuffer);
    const spectrum = computeSpectrum(audioBuffer);
    return {
      fileName: file.name, durationSec: audioBuffer.duration, sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels, loudness, truePeak, phase, dr, spectrum
    };
  }

  function fmtLufs(v){ return (v!=null && isFinite(v)) ? v.toFixed(1)+' LUFS' : '—'; }
  function fmtDb(v){ return (v!=null && isFinite(v)) ? v.toFixed(1)+' dBTP' : '—'; }
  function fmtDur(s){ const m=Math.floor(s/60), sec=Math.round(s%60); return `${m}:${String(sec).padStart(2,'0')}`; }

  const FLAG_SEV_STYLE = { warn:{color:'#FFD60A',icon:'⚠'}, info:{color:'#00E5FF',icon:'●'}, ok:{color:'#00FF88',icon:'✓'} };
  function renderReport(label, color, r){
    const phaseTxt = r.phase==null ? (r.channels<2 ? 'mono file' : 'n/a (silent)') : r.phase.toFixed(2);
    const phasePct = r.phase==null ? 50 : ((r.phase+1)/2*100);
    const phaseWarn = r.phase!=null && r.phase < 0.2;
    const drTxt = r.dr!=null ? 'DR'+Math.round(r.dr) : '—';
    const truePeakOver = isFinite(r.truePeak) && r.truePeak > -1;
    const flags = computeFlags(r.spectrum);
    const flagsHtml = flags.map(f => { const s = FLAG_SEV_STYLE[f.sev]; return `<div class="text-[9px] leading-relaxed mb-1"><span class="font-bold" style="color:${s.color}">${s.icon} ${f.label}:</span> <span class="text-[#E2E8F0]/45">${f.detail}</span></div>`; }).join('');
    return `<div class="card" style="border-color:${color}30;">
      <div class="flex items-center justify-between mb-2 border-b pb-2" style="border-color:${color}20;">
        <h4 class="text-[11px] font-bold tracking-widest truncate pr-2" style="color:${color}">${label}</h4>
        <span class="text-[9px] text-[#E2E8F0]/30 shrink-0">${fmtDur(r.durationSec)} · ${r.sampleRate/1000}kHz · ${r.channels===2?'stereo':'mono'}</span>
      </div>
      <div class="text-[9px] text-[#E2E8F0]/40 truncate mb-3" title="${r.fileName}">${r.fileName}</div>
      <div class="grid grid-cols-2 gap-3 text-center mb-3">
        <div><div class="text-[20px] font-bold" style="color:${color}">${fmtLufs(r.loudness.integratedLufs)}</div><div class="text-[8px] text-[#E2E8F0]/40 tracking-widest mt-0.5">INTEGRATED</div></div>
        <div><div class="text-[20px] font-bold" style="color:${truePeakOver?'#FF5C5C':color}">${fmtDb(r.truePeak)}</div><div class="text-[8px] text-[#E2E8F0]/40 tracking-widest mt-0.5">TRUE PEAK (approx)${truePeakOver?' ⚠':''}</div></div>
        <div><div class="text-[20px] font-bold" style="color:${color}">${fmtLufs(r.loudness.shortTermMaxLufs)}</div><div class="text-[8px] text-[#E2E8F0]/40 tracking-widest mt-0.5">SHORT-TERM MAX</div></div>
        <div><div class="text-[20px] font-bold" style="color:${color}">${drTxt}</div><div class="text-[8px] text-[#E2E8F0]/40 tracking-widest mt-0.5">DYNAMIC RANGE (approx)</div></div>
      </div>
      <div class="text-[9px] text-[#E2E8F0]/40 tracking-widest mb-1 flex justify-between"><span>PHASE CORRELATION</span><span style="color:${phaseWarn?'#FF5C5C':color}">${phaseTxt}${phaseWarn?' ⚠ check mono':''}</span></div>
      <div class="w-full h-2 rounded bg-black/50 relative overflow-hidden border border-white/10">
        <div class="absolute inset-y-0 left-1/2 w-px bg-white/20"></div>
        <div class="absolute top-0 bottom-0 w-1.5 rounded" style="left:calc(${phasePct}% - 3px);background:${phaseWarn?'#FF5C5C':color};"></div>
      </div>
      <div class="flex justify-between text-[7px] text-white/25 mt-0.5"><span>-1 out of phase</span><span>0</span><span>+1 mono-safe</span></div>
      <div class="mt-3 pt-3 border-t" style="border-color:${color}14;">${flagsHtml}</div>
    </div>`;
  }

  function drawSpectrum(datasets){
    const canvas = $('ma-spectrum-canvas'); if (!canvas) return;
    canvas.width = canvas.clientWidth || 400;
    const ctx = canvas.getContext('2d'); const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    const n = SPECTRUM_BANDS.length;
    const padL = 8, padR = 8, padT = 10, padB = 20;
    const plotW = w - padL - padR, plotH = h - padT - padB;
    const minDb = -60, maxDb = 0;
    const yFor = (db) => padT + plotH * (1 - (Math.max(minDb,db)-minDb)/(maxDb-minDb));
    // gridlines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    [0,-20,-40,-60].forEach(db => { const y=yFor(db); ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(w-padR,y); ctx.stroke(); });
    const groupW = plotW / n;
    if (datasets.length === 1){
      const d = datasets[0];
      for (let i=0;i<n;i++){
        const x = padL + i*groupW + groupW*0.15, bw = groupW*0.7;
        const y = yFor(d.bands[i].db);
        ctx.fillStyle = d.color; ctx.globalAlpha = 0.75;
        ctx.fillRect(x, y, bw, padT+plotH-y);
        ctx.globalAlpha = 1;
      }
    } else {
      datasets.forEach((d,di) => {
        ctx.beginPath(); ctx.strokeStyle = d.color; ctx.lineWidth = 2;
        for (let i=0;i<n;i++){
          const x = padL + i*groupW + groupW/2, y = yFor(d.bands[i].db);
          if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke();
        for (let i=0;i<n;i++){ const x = padL + i*groupW + groupW/2, y = yFor(d.bands[i].db); ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2); ctx.fillStyle=d.color; ctx.fill(); }
      });
    }
    ctx.fillStyle = 'rgba(226,232,240,0.4)'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    for (let i=0;i<n;i++){ const x = padL + i*groupW + groupW/2; ctx.fillText(SPECTRUM_BANDS[i][0], x, h-6); }
  }

  let lastFileA = null, lastFileB = null;
  function updateAnalyzeEnabled(){ const btn=$('btn-ma-analyze'); if (btn) btn.disabled = !lastFileA; }

  async function runAnalysis(){
    const btn = $('btn-ma-analyze'), status = $('ma-status'), results = $('ma-results'), reports = $('ma-reports'), legend = $('ma-spectrum-legend');
    if (!lastFileA) return;
    btn.disabled = true; status.textContent = 'analyzing… (a few seconds for longer files)';
    await new Promise(r=>setTimeout(r,0)); // let the status message paint before the heavy sync work
    try {
      const resA = await analyzeFile(lastFileA);
      const resB = lastFileB ? await analyzeFile(lastFileB) : null;
      const colorA = '#00FF88', colorB = '#B18CFF';
      reports.innerHTML = renderReport('YOUR MIX', colorA, resA) + (resB ? renderReport('REFERENCE', colorB, resB) : '');
      const datasets = [{ label:'Your Mix', color:colorA, bands:resA.spectrum }];
      if (resB) datasets.push({ label:'Reference', color:colorB, bands:resB.spectrum });
      legend.innerHTML = datasets.map(d=>`<span style="color:${d.color}">■ ${d.label}</span>`).join('');
      results.classList.remove('hidden');
      drawSpectrum(datasets);
      status.textContent = '✓ done';
    } catch (e) {
      status.textContent = '⚠ ' + (e.message || 'could not analyze that file — try a WAV or MP3 export');
    } finally {
      btn.disabled = !lastFileA;
    }
  }

  function init(){
    if (!$('ma-file-a')) return;
    $('ma-file-a')?.addEventListener('change', (e) => { lastFileA = e.target.files[0] || null; $('ma-file-a-name').textContent = lastFileA ? lastFileA.name : 'No file selected'; updateAnalyzeEnabled(); });
    $('ma-file-b')?.addEventListener('change', (e) => { lastFileB = e.target.files[0] || null; $('ma-file-b-name').textContent = lastFileB ? lastFileB.name : 'No file selected'; });
    $('btn-ma-analyze')?.addEventListener('click', runAnalysis);
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
