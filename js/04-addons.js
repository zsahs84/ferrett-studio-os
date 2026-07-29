// =========================================================================
// EUTERPE ADD-ONS: Now Playing, Color Map + health, Recipe→Checklist,
// Chain export (clipboard / download / QR). Self-contained; hooks the
// existing window.* API and uses event delegation so it survives re-renders.
// =========================================================================
(function () {
    const boot = () => {
        // ---- shared modal helpers (match existing .hidden/.flex convention) ----
        const openModal = (id) => { const m = document.getElementById(id); if (!m) return; m.classList.remove('hidden'); m.classList.add('flex'); };
        const closeModal = (id) => { const m = document.getElementById(id); if (!m) return; m.classList.add('hidden'); m.classList.remove('flex'); };
        const wireModalDismiss = (id, closeBtnId) => {
            document.getElementById(closeBtnId)?.addEventListener('click', () => closeModal(id));
            document.getElementById(id)?.addEventListener('click', (e) => { if (e.target.id === id) closeModal(id); });
        };
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal('colormap-modal'); closeModal('export-modal'); } });

        // =====================================================================
        // 1. NOW PLAYING scratch bar
        // =====================================================================
        const NP_TEXT_KEY = 'ferrett_now_playing_text_v1';
        const NP_OPEN_KEY = 'ferrett_now_playing_open_v1';
        const npBar = document.getElementById('now-playing-bar');
        const npInput = document.getElementById('now-playing-input');
        const setNpOpen = (open) => {
            if (!npBar) return;
            npBar.classList.toggle('hidden', !open);
            npBar.classList.toggle('flex', open);
            try { localStorage.setItem(NP_OPEN_KEY, open ? '1' : '0'); } catch (e) {}
        };
        if (npInput) {
            try { npInput.value = localStorage.getItem(NP_TEXT_KEY) || ''; } catch (e) {}
            npInput.addEventListener('input', () => { try { localStorage.setItem(NP_TEXT_KEY, npInput.value); } catch (e) {} });
            npInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('btn-now-playing-log')?.click(); });
        }
        document.getElementById('btn-toggle-focus')?.addEventListener('click', () => {
            const willOpen = npBar?.classList.contains('hidden');
            setNpOpen(willOpen); if (willOpen) npInput?.focus();
        });
        document.getElementById('btn-now-playing-close')?.addEventListener('click', () => setNpOpen(false));
        document.getElementById('btn-now-playing-log')?.addEventListener('click', () => {
            const txt = (npInput?.value || '').trim(); if (!txt) { npInput?.focus(); return; }
            const note = (window.db.multiNotes || []).find(n => n.id === window.currentNoteId) || (window.db.multiNotes || [])[0];
            if (!note) { alert('No active note to log into.'); return; }
            const now = new Date();
            const stamp = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
            note.content = (note.content ? note.content.replace(/\s*$/, '') + '\n' : '') + `> [${stamp}] ${txt}`;
            window.currentNoteId = note.id;
            window.saveData();
            if (window.renderNoteTabs) window.renderNoteTabs();
            if (window.setNotesFooterOpen) window.setNotesFooterOpen(true);
            const btn = document.getElementById('btn-now-playing-log');
            if (btn) { const o = btn.textContent; btn.textContent = '✓ LOGGED'; setTimeout(() => btn.textContent = o, 1400); }
        });
        try { if (localStorage.getItem(NP_OPEN_KEY) === '1') setNpOpen(true); } catch (e) {}

        // =====================================================================
        // 2. COLOR MAP + tag-health
        // =====================================================================
        const hexToRgb = (h) => { h = (h || '').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
        const colorDist = (a, b) => { const x = hexToRgb(a), y = hexToRgb(b); return Math.round(Math.sqrt((x[0]-y[0])**2 + (x[1]-y[1])**2 + (x[2]-y[2])**2)); };
        const uniq = (arr) => [...new Set(arr)];
        const NEAR = 42; // RGB distance under which two chips read as "the same color"

        const buildColorMap = () => {
            const body = document.getElementById('colormap-body'); if (!body) return;
            const panels = [
                { label: 'Cookbook genres', scope: 'cookbook', cats: uniq((window.db.cookbook || []).map(r => r.genre)), fn: window.genreColor },
                { label: 'Tone DB (gain stage)', scope: 'tones', cats: uniq(['CLEAN','CRUNCH','DISTORTION','BASS'].concat((window.db.tones || []).map(t => t.category))), fn: window.toneCategoryColor },
                { label: 'Tone DB (brand)', scope: 'tones_brand', cats: uniq((window.db.tones || []).map(t => t.brand).filter(Boolean)), fn: window.toneBrandColor },
                { label: 'Web Tools & Intel', scope: 'links', cats: uniq((window.db.links || []).map(l => l.category)), fn: window.linkCategoryColor },
                { label: 'Script Arsenal', scope: 'scripts', cats: uniq((window.db.scripts || []).map(s => s.category)), fn: window.scriptCategoryColor },
            ];
            let html = '';
            panels.forEach(p => {
                const pairs = p.cats.map(c => ({ cat: c, color: p.fn ? p.fn(c) : '#888' }));
                const distinct = uniq(pairs.map(x => x.color)).length;
                // find near/exact collisions
                const clashes = [];
                for (let i = 0; i < pairs.length; i++) for (let j = i + 1; j < pairs.length; j++) {
                    const d = colorDist(pairs[i].color, pairs[j].color);
                    if (d < NEAR) clashes.push(`${pairs[i].cat} ≈ ${pairs[j].cat}${d === 0 ? ' (identical)' : ' (Δ' + d + ')'}`);
                }
                const healthy = clashes.length === 0;
                const countMap = { cookbook: ['cookbook', 'genre'], tones: ['tones', 'category'], tones_brand: ['tones', 'brand'], links: ['links', 'category'], scripts: ['scripts', 'category'] }[p.scope];
                const countFor = (cat) => { if (!countMap) return 0; const [ak, f] = countMap; return (window.db[ak] || []).filter(it => it[f] === cat).length; };
                const chips = pairs.map(x => { const n = countFor(x.cat); return `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${n === 0 ? 'opacity-45' : ''}" style="color:${x.color};border-color:${x.color}55;background:${x.color}12;">${x.cat}<span class="opacity-50 normal-case">×${n}</span><button class="cm-rename opacity-50 hover:opacity-100 cursor-pointer" data-scope="${p.scope}" data-cat="${encodeURIComponent(x.cat)}" title="Rename / merge this tag everywhere">✎</button></span>`; }).join(' ');
                html += `<div>
                    <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span class="text-[10px] font-bold tracking-widest text-white/80 uppercase">${p.label} <span class="text-white/35">· ${pairs.length} tags</span></span>
                        <span class="text-[9px] font-bold px-2 py-0.5 rounded border ${healthy ? 'text-[#00FF88] border-[#00FF8840] bg-[#00FF8810]' : 'text-[#FFD60A] border-[#FFD60A40] bg-[#FFD60A10]'}">${healthy ? '✓ ALL DISTINCT' : '⚠ ' + clashes.length + ' SIMILAR'}</span>
                    </div>
                    <div class="flex flex-wrap gap-1.5">${chips || '<span class="text-white/30 text-[10px] italic">no tags yet</span>'}</div>
                    ${clashes.length ? `<div class="mt-2 text-[9px] text-[#FFD60A]/80 font-mono">${clashes.join(' · ')}</div>` : ''}
                    <div class="mt-1 text-[9px] text-white/30">${distinct}/${pairs.length} unique colors</div>
                </div>`;
            });
            html += `<div class="pt-4 border-t border-white/10 text-[9px] text-white/45 leading-relaxed">
                <span class="text-white/70 font-bold tracking-widest uppercase">Color language</span><br>
                <span style="color:#00E5FF">cyan</span> = AI / tech ·
                <span style="color:#FFD60A">gold</span> = tone / amps ·
                <span style="color:#FF6FCB">pink</span> = vocals / human ·
                <span style="color:#B18CFF">violet</span> = rhythm / polish ·
                <span style="color:#00FF88">green</span> = build / foundation ·
                <span style="color:#7FA8D9">steel</span> = utility / export ·
                <span style="color:#FF5C5C">red</span> = distortion / heat
            </div>`;
            body.innerHTML = html;
        };
        document.getElementById('btn-open-colormap')?.addEventListener('click', () => { buildColorMap(); openModal('colormap-modal'); });
        wireModalDismiss('colormap-modal', 'colormap-close');

        // =====================================================================
        // 3. RECIPE -> session checklist
        // =====================================================================
        const chainSteps = (text) => {
            if (!text) return [];
            let segs = text.split('->').map(s => s.trim()).filter(Boolean);
            if (segs.length < 2) segs = text.split(/(?<=[.;])\s+/).map(s => s.trim()).filter(Boolean);
            return segs.map(s => s.replace(/\.$/, '').trim()).filter(Boolean);
        };
        const recipeToChecklist = (data) => {
            const parts = [['REAPER', data.reaper]];
            let lines = [`// Checklist — ${data.inst} (${data.genre})`, ''];
            parts.forEach(([tag, txt]) => {
                const steps = chainSteps(txt);
                if (steps.length) { lines.push(`// ${tag} chain`); steps.forEach(s => lines.push(`[TODO] ${s}`)); lines.push(''); }
            });
            if (data.notes) { lines.push('// Workflow notes'); lines.push(data.notes); }
            const note = { id: Date.now(), title: `✓ ${data.inst}`.slice(0, 40), content: lines.join('\n') };
            window.db.multiNotes.push(note);
            window.currentNoteId = note.id;
            window.saveData();
            if (window.renderNoteTabs) window.renderNoteTabs();
            if (window.setNotesFooterOpen) window.setNotesFooterOpen(true);
        };

        // =====================================================================
        // 4. CHAIN EXPORT — portable text / download / QR
        // =====================================================================
        let lastExport = { title: 'export', text: '' };
        const renderQR = (text) => {
            const box = document.getElementById('export-qr'); const note = document.getElementById('export-qr-note');
            if (!box) return; box.innerHTML = '';
            if (typeof window.qrcode !== 'function') { box.innerHTML = '<span style="color:#900;font-size:10px;">QR unavailable</span>'; return; }
            try {
                const q = window.qrcode(0, 'L'); q.addData(text); q.make();
                box.innerHTML = q.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
                const svg = box.querySelector('svg'); if (svg) { svg.setAttribute('width', '160'); svg.setAttribute('height', '160'); }
                if (note) note.textContent = 'Point your phone camera here to read the chain.';
            } catch (err) {
                box.innerHTML = '<span style="color:#333;font-size:24px;">⌗</span>';
                if (note) note.textContent = 'Too long for a QR code — use Copy or Download instead.';
            }
        };
        const openExport = (title, text) => {
            lastExport = { title, text };
            const t = document.getElementById('export-title'); if (t) t.textContent = '📤 ' + title;
            const ta = document.getElementById('export-text'); if (ta) ta.value = text;
            renderQR(text);
            openModal('export-modal');
        };
        const toneToText = (t) => [
            `EUTERPE TONE — ${t.name}`,
            `Gain stage: ${t.category || '—'}${t.brand ? '   Brand: ' + t.brand : ''}`,
            `NAM (amp): ${t.nam || 'None'}`,
            `IR (cab): ${t.ir || 'None'}`,
            '', 'Notes:', (t.notes || '(none)'),
            '', '— via EUTERPE_OS'
        ].filter(x => x !== null).join('\n');
        const recipeToText = (r) => [
            `EUTERPE RECIPE — ${r.inst}`,
            `Genre: ${r.genre}`,
            r.desc ? `"${r.desc}"` : null,
            '', 'CHAIN: ' + (r.reaper || '—'),
            '', 'Notes: ' + (r.notes || '(none)'),
            '', '— via EUTERPE_OS'
        ].filter(x => x !== null).join('\n');

        document.getElementById('export-copy')?.addEventListener('click', () => {
            const ta = document.getElementById('export-text'); if (!ta) return; ta.select();
            const done = () => { const b = document.getElementById('export-copy'); if (b) { const o = b.textContent; b.textContent = '✓ COPIED'; setTimeout(() => b.textContent = o, 1400); } };
            if (navigator.clipboard?.writeText) navigator.clipboard.writeText(ta.value).then(done).catch(() => { document.execCommand('copy'); done(); });
            else { document.execCommand('copy'); done(); }
        });
        document.getElementById('export-download')?.addEventListener('click', () => {
            const safe = (lastExport.title || 'export').replace(/[^a-z0-9]/gi, '_');
            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${lastExport.title}</title>
<style>body{background:#0a0f0d;color:#e2e8f0;font-family:'Courier New',monospace;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.6;}
h1{color:#00FF88;font-size:18px;letter-spacing:.05em;}pre{white-space:pre-wrap;font-size:13px;background:#000;padding:16px;border-radius:6px;border:1px solid #222;}</style></head>
<body><h1>${lastExport.title}</h1><pre>${lastExport.text.replace(/</g, '&lt;')}</pre></body></html>`;
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = url; a.download = safe + '_handoff.html';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        });
        wireModalDismiss('export-modal', 'export-close');

        // =====================================================================
        // 5. COOK MODE — full-screen, one chain step at a time
        // =====================================================================
        let cook = { steps: [], i: 0 };
        const renderCook = () => {
            document.getElementById('cookmode-step').textContent = cook.steps[cook.i] || '';
            document.getElementById('cookmode-step-num').textContent = `Step ${cook.i + 1} of ${cook.steps.length}`;
            document.getElementById('cookmode-progress-bar').style.width = ((cook.i + 1) / cook.steps.length * 100) + '%';
            document.getElementById('cookmode-next').textContent = cook.i >= cook.steps.length - 1 ? 'DONE ✓' : 'NEXT ►';
            document.getElementById('cookmode-prev').style.visibility = cook.i === 0 ? 'hidden' : 'visible';
        };
        const openCook = (data) => {
            const steps = chainSteps(data.reaper);
            if (!steps.length) { alert('No chain steps to cook for this recipe.'); return; }
            cook = { steps, i: 0, recipeId: data.id };
            document.getElementById('cookmode-capture-status').textContent = '';
            document.getElementById('cookmode-tag').textContent = `${data.genre} · REAPER chain`;
            document.getElementById('cookmode-title').textContent = data.inst;
            renderCook(); openModal('cookmode-modal');
        };
        document.getElementById('cookmode-next')?.addEventListener('click', () => { if (cook.i >= cook.steps.length - 1) closeModal('cookmode-modal'); else { cook.i++; renderCook(); } });
        document.getElementById('cookmode-prev')?.addEventListener('click', () => { if (cook.i > 0) { cook.i--; renderCook(); } });
        wireModalDismiss('cookmode-modal', 'cookmode-close');
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('cookmode-modal')?.classList.contains('flex')) return;
            if (e.key === 'ArrowRight') document.getElementById('cookmode-next')?.click();
            else if (e.key === 'ArrowLeft') document.getElementById('cookmode-prev')?.click();
        });

        // =====================================================================
        // 6. SESSION RECAP — today's studio time + everything you logged
        // =====================================================================
        const fmtMin = (ms) => { const m = Math.round((ms || 0) / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
        const dayKey = (d) => (window.fmtDateKey ? window.fmtDateKey(d) : d.toISOString().slice(0, 10));
        const buildRecap = () => {
            const now = new Date();
            const log = window.sessionLog || {};
            const todayMs = log[dayKey(now)] || 0;
            // week total + streak of consecutive days with any logged time
            let weekMs = 0, streak = 0, streakBroken = false;
            for (let i = 0; i < 7; i++) { const d = new Date(now); d.setDate(now.getDate() - i); weekMs += (log[dayKey(d)] || 0); }
            for (let i = 0; i < 400 && !streakBroken; i++) { const d = new Date(now); d.setDate(now.getDate() - i); if ((log[dayKey(d)] || 0) > 0) streak++; else if (i > 0) streakBroken = true; else streakBroken = false; }
            // focus logs
            const logs = [];
            (window.db.multiNotes || []).forEach(n => (n.content || '').split('\n').forEach(l => { const m = l.match(/^>\s*\[(\d{1,2}:\d{2})\]\s*(.+)$/); if (m) logs.push(`  ${m[1]}  ${m[2]}`); }));
            // flashbacks — items created ~1/3/6/12 months ago (id is a ms timestamp)
            const flash = [];
            const scan = (arr, label, nameKey) => (arr || []).forEach(it => { if (typeof it.id !== 'number' || it.id < 1e12) return; const days = Math.round((now - it.id) / 86400000); [[30, '~1 month'], [90, '~3 months'], [180, '~6 months'], [365, '~1 year']].forEach(([n, w]) => { if (Math.abs(days - n) <= 1) flash.push(`  ${w} ago — ${label}: ${it[nameKey] || 'Untitled'}`); }); });
            scan(window.db.cookbook, 'Recipe', 'inst'); scan(window.db.tones, 'Tone', 'name'); scan(window.db.tracks, 'Track', 'inst'); scan(window.db.multiNotes, 'Note', 'title');
            return `SESSION RECAP — ${now.toLocaleDateString()}\n` +
                `Today: ${fmtMin(todayMs)}   ·   This week: ${fmtMin(weekMs)}   ·   Streak: ${streak} day${streak === 1 ? '' : 's'} 🔥\n` +
                `Vault: ${(window.db.cookbook || []).length} recipes · ${(window.db.tones || []).length} tones · ${(window.db.tracks || []).length} tracks\n\n` +
                `Logged focus (${logs.length}):\n` + (logs.length ? logs.join('\n') : '  (nothing logged yet — use the ▶ FOCUS bar)') +
                (flash.length ? `\n\nFlashbacks:\n${flash.join('\n')}` : '');
        };
        document.getElementById('btn-open-recap')?.addEventListener('click', () => { document.getElementById('recap-body').textContent = buildRecap(); openModal('recap-modal'); });
        document.getElementById('recap-copy')?.addEventListener('click', () => {
            const t = document.getElementById('recap-body').textContent;
            const done = () => { const b = document.getElementById('recap-copy'); if (b) { const o = b.textContent; b.textContent = '✓ COPIED'; setTimeout(() => b.textContent = o, 1400); } };
            if (navigator.clipboard?.writeText) navigator.clipboard.writeText(t).then(done).catch(done); else done();
        });
        document.getElementById('recap-tonote')?.addEventListener('click', () => {
            const note = (window.db.multiNotes || []).find(n => n.id === window.currentNoteId) || (window.db.multiNotes || [])[0]; if (!note) return;
            note.content = (note.content ? note.content.replace(/\s*$/, '') + '\n\n' : '') + document.getElementById('recap-body').textContent;
            window.currentNoteId = note.id; window.saveData();
            if (window.renderNoteTabs) window.renderNoteTabs(); if (window.setNotesFooterOpen) window.setNotesFooterOpen(true);
            closeModal('recap-modal');
        });
        wireModalDismiss('recap-modal', 'recap-close');

        // =====================================================================
        // 7. IMPORT — paste a EUTERPE TONE / RECIPE payload back into the vault
        // =====================================================================
        const parseImport = (text) => {
            text = (text || '').trim();
            const g = (re) => { const m = text.match(re); return m ? m[1].trim() : ''; };
            if (/^EUTERPE TONE/i.test(text)) {
                const category = (g(/Category:\s*([^\n]+?)(?:\s{2,}DAW:|\n)/) || 'CLEAN').toUpperCase();
                const key = g(/Key\s+([^\n]+?)\s*$/m);
                let notes = ''; const nm = text.match(/Notes:\s*\n?([\s\S]*?)\n\n[—-] via/); if (nm) notes = nm[1].trim();
                const tone = {
                    id: Date.now(), name: g(/EUTERPE TONE\s*[—-]\s*(.+)/) || 'Imported Tone',
                    category: ['CLEAN','CRUNCH','DISTORTION','BASS'].includes(category) ? category : 'CLEAN',
                    daw: 'reaper',
                    nam: g(/NAM \(amp\):\s*([^\n]+)/), ir: g(/IR \(cab\):\s*([^\n]+)/),
                    bpm: g(/(\d+)\s*BPM/), key: (key && !/None/i.test(key)) ? key : '',
                    notes, starred: false, images: [], hasAudio: false
                };
                if (/None/i.test(tone.nam)) tone.nam = ''; if (/None/i.test(tone.ir)) tone.ir = '';
                window.db.tones.unshift(tone); window.saveData();
                if (window.renderTones) window.renderTones(); if (window.renderStarredTones) window.renderStarredTones();
                return { ok: true, kind: 'tone', label: tone.name };
            }
            if (/^EUTERPE RECIPE/i.test(text)) {
                const descM = text.match(/\n"([\s\S]*?)"\n/);
                const r = {
                    id: Date.now(), genre: g(/Genre:\s*([^\n]+)/) || 'Imported',
                    inst: g(/EUTERPE RECIPE\s*[—-]\s*(.+)/) || 'Imported Recipe',
                    desc: descM ? descM[1].trim() : '',
                    reaper: (g(/CHAIN:\s*([\s\S]*?)\n\nNotes:/) || g(/CHAIN:\s*([^\n]+)/) || g(/REAPER \(VST\):\s*([\s\S]*?)\n\nNotes:/) || g(/REAPER \(VST\):\s*([^\n]+)/)),
                    notes: (g(/Notes:\s*([\s\S]*?)\n\n[—-] via/) || ''), images: []
                };
                window.db.cookbook.push(r); window.saveData();
                if (window.buildGenreColorMap) window.buildGenreColorMap();
                if (window.renderCookbookMenu) window.renderCookbookMenu();
                return { ok: true, kind: 'recipe', label: r.inst };
            }
            return { ok: false };
        };
        document.getElementById('btn-open-import')?.addEventListener('click', () => { const ta = document.getElementById('import-text'); if (ta) ta.value = ''; document.getElementById('import-status').textContent = ''; openModal('import-modal'); });
        document.getElementById('import-go')?.addEventListener('click', () => {
            const st = document.getElementById('import-status');
            const res = parseImport(document.getElementById('import-text').value);
            if (res.ok) { st.style.color = '#00FF88'; st.textContent = `✓ Added ${res.kind}: ${res.label}`; setTimeout(() => closeModal('import-modal'), 900); }
            else { st.style.color = '#FF8888'; st.textContent = '✗ Not a recognized EUTERPE TONE / RECIPE payload.'; }
        });
        wireModalDismiss('import-modal', 'import-close');

        // =====================================================================
        // 8. TAG RENAME / MERGE — from the color-map ✎ chips
        // =====================================================================
        const renameTag = (scope, oldVal, newVal) => {
            const map = { cookbook: ['cookbook', 'genre'], tones: ['tones', 'category'], tones_brand: ['tones', 'brand'], links: ['links', 'category'], scripts: ['scripts', 'category'] }[scope];
            if (!map) return 0;
            const [arrKey, field] = map; let n = 0;
            (window.db[arrKey] || []).forEach(it => { if (it[field] === oldVal) { it[field] = newVal; n++; } });
            if (n) {
                window.saveData();
                if (window.buildGenreColorMap) window.buildGenreColorMap();
                ['renderTones', 'renderStarredTones', 'renderLinks', 'renderScripts', 'renderCookbookMenu'].forEach(fn => { if (window[fn]) try { window[fn](); } catch (e) {} });
            }
            return n;
        };
        document.getElementById('colormap-body')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.cm-rename'); if (!btn) return;
            const scope = btn.dataset.scope; const oldVal = decodeURIComponent(btn.dataset.cat);
            const nv = window.prompt(`Rename "${oldVal}" to…  (type an existing name to MERGE them)`, oldVal);
            if (nv == null) return; const newVal = nv.trim(); if (!newVal || newVal === oldVal) return;
            const n = renameTag(scope, oldVal, newVal);
            buildColorMap();
            if (n === 0) { const b = document.getElementById('colormap-body'); if (b) b.insertAdjacentHTML('afterbegin', '<div class="text-[9px] text-[#FFD60A] mb-2">No items used that tag.</div>'); }
        });

        // =====================================================================
        // 9. A/B TONE COMPARE
        // =====================================================================
        const toneOpts = () => (window.db.tones || []).map(t => `<option value="${t.id}">${(t.name || 'Unnamed').replace(/</g, '')}</option>`).join('');
        const abRow = (label, a, b) => {
            const diff = (a || '') !== (b || '');
            return `<tr class="border-t border-white/5">
                <td class="py-1.5 pr-3 text-[9px] uppercase tracking-widest text-white/40 align-top whitespace-nowrap">${label}</td>
                <td class="py-1.5 pr-3 align-top ${diff ? 'text-[#00E5FF]' : 'text-white/60'}">${(a || '—')}</td>
                <td class="py-1.5 align-top ${diff ? 'text-[#FFD60A]' : 'text-white/60'}">${(b || '—')}</td>
            </tr>`;
        };
        const renderAB = () => {
            const wrap = document.getElementById('ab-diff'); if (!wrap) return;
            const a = (window.db.tones || []).find(t => t.id === parseInt(document.getElementById('ab-a').value, 10));
            const b = (window.db.tones || []).find(t => t.id === parseInt(document.getElementById('ab-b').value, 10));
            if (!a || !b) { wrap.innerHTML = '<div class="text-white/40 text-[11px] italic p-2">Pick two tones.</div>'; return; }
            wrap.innerHTML = `<table class="w-full text-[11px] font-mono border-collapse">
                <thead><tr><th class="text-left"></th><th class="text-left text-[#00E5FF] text-[10px] pb-2 pr-3">${a.name}</th><th class="text-left text-[#FFD60A] text-[10px] pb-2">${b.name}</th></tr></thead>
                <tbody>${abRow('Category', a.category, b.category)}${abRow('BPM', a.bpm, b.bpm)}${abRow('Key', a.key, b.key)}${abRow('NAM', a.nam, b.nam)}${abRow('IR / Cab', a.ir, b.ir)}${abRow('Notes', a.notes, b.notes)}</tbody></table>`;
        };
        const openAB = (preA) => {
            const tones = window.db.tones || [];
            if (tones.length < 2) { alert('Add at least two tones to compare.'); return; }
            const selA = document.getElementById('ab-a'), selB = document.getElementById('ab-b');
            selA.innerHTML = toneOpts(); selB.innerHTML = toneOpts();
            selA.value = (preA != null ? preA : tones[0].id);
            selB.value = (tones.find(t => t.id !== parseInt(selA.value, 10)) || tones[0]).id;
            renderAB(); openModal('abcompare-modal');
        };
        document.getElementById('ab-a')?.addEventListener('change', renderAB);
        document.getElementById('ab-b')?.addEventListener('change', renderAB);
        wireModalDismiss('abcompare-modal', 'ab-close');

        // =====================================================================
        // 10. FRANKENSTEIN — fuse components from multiple recipes into one
        // =====================================================================
        const recipeOpts = () => (window.db.cookbook || []).slice().sort((a, b) => (a.genre + a.inst).localeCompare(b.genre + b.inst)).map(r => `<option value="${r.id}">${r.genre} — ${r.inst}</option>`).join('');
        const openFrank = () => {
            const slots = document.getElementById('frank-slots'); const opts = recipeOpts();
            slots.innerHTML = [0, 1, 2, 3].map(i => `<div class="flex items-center gap-2"><span class="text-[9px] text-white/40 w-4">${i + 1}</span><select class="frank-slot flex-1 input-euterpe text-[11px]"><option value="">— none —</option>${opts}</select></div>`).join('');
            document.getElementById('frank-name').value = '';
            document.getElementById('frank-genre').value = 'Frankenstein Lab';
            document.getElementById('frank-status').textContent = '';
            openModal('frank-modal');
        };
        document.getElementById('btn-frankenstein')?.addEventListener('click', openFrank);
        document.getElementById('frank-build')?.addEventListener('click', () => {
            const st = document.getElementById('frank-status');
            const picks = [...document.querySelectorAll('.frank-slot')].map(s => s.value).filter(Boolean).map(id => (window.db.cookbook || []).find(r => r.id === parseInt(id, 10))).filter(Boolean);
            if (picks.length < 2) { st.style.color = '#FF8888'; st.textContent = 'Pick at least two components.'; return; }
            const name = (document.getElementById('frank-name').value || '').trim() || 'Frankenstein Beat';
            const genre = (document.getElementById('frank-genre').value || '').trim() || 'Frankenstein Lab';
            const sec = (field) => picks.map(r => `### ${r.inst}  [${r.genre}]\n${r[field] || '—'}`).join('\n\n');
            const recipe = { id: Date.now(), genre, inst: name, desc: 'Composite of: ' + picks.map(r => r.inst).join(' + '), reaper: sec('reaper'), notes: sec('notes'), images: [] };
            window.db.cookbook.push(recipe); window.saveData();
            if (window.buildGenreColorMap) window.buildGenreColorMap();
            if (window.renderCookbookMenu) window.renderCookbookMenu();
            if (window.switchTab) window.switchTab('cookbook');
            if (window.selectGenre) window.selectGenre(genre);
            st.style.color = '#00FF88'; st.textContent = `✓ Built "${name}" under ${genre}`;
            setTimeout(() => closeModal('frank-modal'), 900);
        });
        wireModalDismiss('frank-modal', 'frank-close');

        // =====================================================================
        // 11. WAVEFORM THUMBNAILS for tones with a reference clip
        // =====================================================================
        const wfCache = {}; let wfCtx = null;
        const getPeaks = async (id) => {
            if (wfCache[id]) return wfCache[id];
            try {
                const b64 = await window.audioDbGet(id); if (!b64) return null;
                const buf = await (await fetch(b64)).arrayBuffer();
                wfCtx = wfCtx || new (window.AudioContext || window.webkitAudioContext)();
                const audio = await wfCtx.decodeAudioData(buf.slice(0));
                const ch = audio.getChannelData(0); const N = 100; const block = Math.max(1, Math.floor(ch.length / N)); const peaks = [];
                for (let i = 0; i < N; i++) { let m = 0; for (let j = 0; j < block; j++) { const v = Math.abs(ch[i * block + j] || 0); if (v > m) m = v; } peaks.push(m); }
                const max = Math.max(...peaks, 0.0001); const norm = peaks.map(p => p / max);
                wfCache[id] = norm; return norm;
            } catch (e) { return null; }
        };
        const drawWave = (canvas, peaks, color) => {
            const ctx = canvas.getContext('2d'); const W = canvas.width, H = canvas.height; ctx.clearRect(0, 0, W, H);
            const bw = W / peaks.length; ctx.fillStyle = color;
            peaks.forEach((p, i) => { const h = Math.max(1, p * (H - 2)); ctx.fillRect(i * bw, (H - h) / 2, Math.max(1, bw - 1), h); });
        };
        window.__drawToneWaveforms = () => {
            document.querySelectorAll('#tone-list .card[data-tone-id]').forEach(card => {
                const id = parseInt(card.dataset.toneId, 10); const t = (window.db.tones || []).find(x => x.id === id);
                if (!t || !t.hasAudio) return;
                const slot = document.getElementById('tone-audio-slot-' + id); if (!slot || slot.querySelector('canvas.wf')) return;
                const cv = document.createElement('canvas'); cv.className = 'wf'; cv.width = 300; cv.height = 34; cv.style.width = '100%'; cv.style.height = '26px'; cv.style.opacity = '0.85'; cv.style.marginBottom = '4px';
                slot.prepend(cv);
                const color = '#00FF88';
                getPeaks(id).then(p => { if (p) drawWave(cv, p, color); else cv.remove(); });
            });
        };

        // =====================================================================
        // 12. TONE A/B COMPARE
        //   Filtering itself lives in the tag-bar chips (by brand) + the
        //   search box (free text) above — no separate filter bar needed.
        // =====================================================================
        const toneListEl = document.getElementById('tone-list');
        if (toneListEl && !document.getElementById('tone-smartfilter')) {
            const bar = document.createElement('div');
            bar.id = 'tone-smartfilter';
            bar.className = 'flex justify-end mb-3 text-[10px]';
            bar.innerHTML = `<button id="tf-ab" class="px-2 py-1 rounded border border-[#00E5FF40] text-[#00E5FF]/80 hover:text-[#00E5FF] hover:border-[#00E5FF80] cursor-pointer font-bold tracking-widest" title="Compare two tones side by side">⚖ A/B</button>`;
            toneListEl.parentNode.insertBefore(bar, toneListEl);
            document.getElementById('tf-ab').addEventListener('click', () => openAB());
        }
        // renderTones rebuilds the card list, so re-draw waveforms after each render
        const _renderTones = window.renderTones;
        if (typeof _renderTones === 'function' && !_renderTones.__filterWrapped) {
            window.renderTones = function () { const r = _renderTones.apply(this, arguments); if (window.__drawToneWaveforms) window.__drawToneWaveforms(); return r; };
            window.renderTones.__filterWrapped = true;
        }

        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal('import-modal'); closeModal('recap-modal'); closeModal('cookmode-modal'); closeModal('abcompare-modal'); closeModal('frank-modal'); closeModal('preexport-modal'); } });

        // =====================================================================
        // 13. RIG RECALL PRESETS — highlight the active monitor path (+ latency guard)
        // =====================================================================
        const RIG_KEY = 'ferrett_active_rig_v1';
        const rigMeta = {
            sansui: { el: 'sf-path-sansui', color: '#00FF88', note: 'Creating / mixing — Volt back TS → Sansui Tape 1 (master on the Volt knob).' },
            phones: { el: 'sf-path-phones', color: '#7FA8D9', note: 'Tracking — front headphone jack (Gammas / Xiberias). ⚠ Bluetooth is latency-unsafe for tracking.' },
            bt: { el: 'bt', color: '#B18CFF', note: 'Bluetooth mix — Skullcandy JIB via REAPER AutoEQ. Mixing only (~150 ms).' }
        };
        const applyRig = (rig) => {
            ['sf-path-sansui', 'sf-path-phones', 'sf-path-bt'].forEach(id => { const el = document.getElementById(id); if (el) { el.style.boxShadow = ''; el.style.opacity = '0.45'; } });
            const m = rigMeta[rig]; if (!m) return;
            const activeEl = document.getElementById(rig === 'bt' ? 'sf-path-bt' : m.el);
            if (activeEl) { activeEl.style.opacity = '1'; activeEl.style.boxShadow = `inset 0 0 0 1px ${m.color}55, 0 0 16px ${m.color}22`; }
            document.querySelectorAll('.rig-preset').forEach(b => { const on = b.dataset.rig === rig; b.style.color = on ? m.color : 'rgba(255,255,255,0.45)'; b.style.borderColor = on ? m.color : 'rgba(255,255,255,0.15)'; b.style.background = on ? m.color + '18' : 'transparent'; });
            const note = document.getElementById('rig-preset-note'); if (note) { note.textContent = m.note; note.style.color = m.color; }
        };
        document.querySelectorAll('.rig-preset').forEach(b => b.addEventListener('click', () => { const r = b.dataset.rig; try { localStorage.setItem(RIG_KEY, r); } catch (e) {} applyRig(r); }));
        try { const saved = localStorage.getItem(RIG_KEY); if (saved && rigMeta[saved]) applyRig(saved); } catch (e) {}

        // =====================================================================
        // 14. PRE-EXPORT MONITOR CHECKLIST (ephemeral)
        // =====================================================================
        const PRECHECK_ITEMS = [
            'Mono-summed check — no phase cancellation',
            'The Gammas — balance & low end',
            'The Xiberias — detail / harshness pass',
            'Sansui + room (Tape 1, flat @7) — tonal reference',
            'Samsung Sound Bar — "commercial" translation',
            'Skullcandy JIB (AutoEQ, true flat) — final mixing pass',
            'Loudness / true-peak within target'
        ];
        const buildPrecheck = () => {
            const list = document.getElementById('preexport-list'); if (!list) return;
            list.innerHTML = PRECHECK_ITEMS.map((t, i) => `<label class="flex items-start gap-2 cursor-pointer text-[11px] text-white/80 hover:text-white"><input type="checkbox" class="pre-chk mt-0.5 accent-[#00E5FF]" data-i="${i}"><span>${t}</span></label>`).join('');
            updatePrecheck();
        };
        const updatePrecheck = () => {
            const boxes = [...document.querySelectorAll('.pre-chk')]; const done = boxes.filter(b => b.checked).length;
            const p = document.getElementById('preexport-progress'); if (p) { p.textContent = `${done} / ${boxes.length} checked`; p.style.color = done === boxes.length && boxes.length ? '#00FF88' : 'rgba(255,255,255,0.5)'; }
        };
        document.getElementById('btn-preexport-check')?.addEventListener('click', () => { buildPrecheck(); openModal('preexport-modal'); });
        document.getElementById('preexport-list')?.addEventListener('change', updatePrecheck);
        document.getElementById('preexport-reset')?.addEventListener('click', () => { document.querySelectorAll('.pre-chk').forEach(b => b.checked = false); updatePrecheck(); });
        wireModalDismiss('preexport-modal', 'preexport-close');

        // =====================================================================
        // 15. QUICK-CAPTURE from Cook mode — attach a photo to the recipe
        // =====================================================================
        document.getElementById('cookmode-capture-input')?.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0]; e.target.value = '';
            const status = document.getElementById('cookmode-capture-status');
            if (!file || cook.recipeId == null) return;
            const recipe = (window.db.cookbook || []).find(r => r.id === cook.recipeId); if (!recipe) return;
            try {
                const b64 = await window.compressImage(file);
                if (!recipe.images) recipe.images = [];
                recipe.images.push(b64); window.saveData();
                if (window.currentCookbookId === recipe.id && window.selectInst) window.selectInst(recipe.id);
                if (status) { status.textContent = `✓ Photo attached (${recipe.images.length})`; setTimeout(() => { status.textContent = ''; }, 2000); }
            } catch (err) { if (status) { status.style.color = '#FF8888'; status.textContent = '✗ Capture failed'; } }
        });

        // =====================================================================
        // 16. CABLE / IMPEDANCE CHEAT-SHEET
        // =====================================================================
        document.getElementById('btn-cable-sheet')?.addEventListener('click', () => openModal('cable-modal'));
        wireModalDismiss('cable-modal', 'cable-close');
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal('cable-modal'); });

        // =====================================================================
        // 17. SMART BACKUP REMINDER — nudge after N changes since last backup
        // =====================================================================
        const BK_KEY = 'ferrett_changes_since_backup_v1'; const BK_THRESHOLD = 30;
        const bkBtn = document.getElementById('btn-backup-vault');
        const updateBkNudge = () => {
            if (!bkBtn) return; let n = 0; try { n = parseInt(localStorage.getItem(BK_KEY) || '0', 10); } catch (e) {}
            let dot = bkBtn.querySelector('.bk-dot');
            if (n >= BK_THRESHOLD) { if (!dot) { dot = document.createElement('span'); dot.className = 'bk-dot absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FFD60A] animate-pulse'; bkBtn.style.position = 'relative'; bkBtn.appendChild(dot); } bkBtn.title = `${n} changes since your last backup — worth downloading one.`; }
            else if (dot) { dot.remove(); bkBtn.title = 'Download a local JSON backup of your entire vault'; }
        };
        const _saveDataBk = window.saveData;
        if (typeof _saveDataBk === 'function' && !_saveDataBk.__bkWrapped) {
            window.saveData = function () { const r = _saveDataBk.apply(this, arguments); try { const n = (parseInt(localStorage.getItem(BK_KEY) || '0', 10) || 0) + 1; localStorage.setItem(BK_KEY, String(n)); updateBkNudge(); } catch (e) {} return r; };
            window.saveData.__bkWrapped = true;
        }
        bkBtn?.addEventListener('click', () => { try { localStorage.setItem(BK_KEY, '0'); } catch (e) {} updateBkNudge(); });
        updateBkNudge();

        // =====================================================================
        // 18. TONE SIGNAL-CHAIN DIAGRAM
        // =====================================================================
        const openToneChain = (t) => {
            const chainText = [t.nam, t.ir].filter(Boolean).join(' -> ') + (t.notes ? ' -> ' + t.notes : '');
            const color = '#00FF88';
            document.getElementById('tonechain-title').textContent = '🔗 ' + t.name;
            document.getElementById('tonechain-flow').innerHTML = (window.renderChainFlow ? window.renderChainFlow(chainText, color) : `<div class="text-white/50 text-[11px]">${chainText || 'Nothing to visualize.'}</div>`);
            openModal('tonechain-modal');
        };
        wireModalDismiss('tonechain-modal', 'tonechain-close');
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal('tonechain-modal'); });

        // =====================================================================
        // 19. SESSION -> TRACK auto-stub from the Now Playing focus
        // =====================================================================
        document.getElementById('btn-now-playing-track')?.addEventListener('click', () => {
            const txt = (document.getElementById('now-playing-input')?.value || '').trim();
            if (!txt) { document.getElementById('now-playing-input')?.focus(); return; }
            const track = { id: Date.now(), inst: txt.slice(0, 60), daw: 'reaper', plugins: '', reflink: '', notes: `Started ${new Date().toLocaleString()} — from Now Playing focus.`, images: [] };
            (window.db.tracks = window.db.tracks || []).unshift(track);
            window.saveData();
            if (window.renderTracks) window.renderTracks();
            const btn = document.getElementById('btn-now-playing-track');
            if (btn) { const o = btn.textContent; btn.textContent = '✓ TRACK ADDED'; setTimeout(() => btn.textContent = o, 1500); }
        });

        // =====================================================================
        // 20. AUTO-THEME BY TAB — disabled; theme now stays fixed across tabs
        // =====================================================================
        window.__activeTab = window.__activeTab || 'cookbook';
        try { if ((localStorage.getItem(window.HUD_THEME_KEY) || '') === 'auto') { window.applyHudTheme('default'); } } catch (e) {}

        // =====================================================================
        // 21. GEAR CROSS-LINKER — find every recipe/tone/track that uses a gear term
        // =====================================================================
        const gearCorpus = () => {
            const items = [];
            (window.db.cookbook || []).forEach(r => items.push({ scope: 'cookbook', id: r.id, title: r.inst, sub: r.genre, text: `${r.reaper || ''} ${r.notes || ''}` }));
            (window.db.tones || []).forEach(t => items.push({ scope: 'tones', id: t.id, title: t.name, sub: [t.brand, t.category].filter(Boolean).join(' · '), text: `${t.nam || ''} ${t.ir || ''} ${t.notes || ''}` }));
            (window.db.tracks || []).forEach(t => items.push({ scope: 'tracks', id: t.id, title: t.inst, sub: t.daw, text: `${t.plugins || ''} ${t.notes || ''}` }));
            return items;
        };
        const gearJump = (scope, id) => {
            closeModal('gearindex-modal');
            if (scope === 'tones') window.switchTab('tones');
            else if (scope === 'tracks') window.switchTab('tracks');
            else if (scope === 'cookbook') { const r = (window.db.cookbook || []).find(x => x.id === id); if (r) { window.switchTab('cookbook'); window.selectGenre(r.genre); setTimeout(() => window.selectInst(id), 120); } }
        };
        window.__gearJump = gearJump;
        const scopeColor = { cookbook: '#00FF88', tones: '#00E5FF', tracks: '#FFD60A' };
        const renderGearResults = (q) => {
            q = (q || '').trim().toLowerCase(); const res = document.getElementById('gearindex-results'); if (!res) return;
            if (!q) { res.innerHTML = '<div class="text-white/30 text-[11px] italic p-2">Type or tap a gear name to see everywhere it\'s used.</div>'; return; }
            const items = gearCorpus().filter(it => it.text.toLowerCase().includes(q));
            if (!items.length) { res.innerHTML = `<div class="text-white/40 text-[11px] italic p-2">Nothing mentions "${q}".</div>`; return; }
            res.innerHTML = items.map(it => `<button class="gx-jump w-full text-left flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 cursor-pointer" data-scope="${it.scope}" data-id="${it.id}"><span class="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" style="color:${scopeColor[it.scope]};border:1px solid ${scopeColor[it.scope]}40;">${it.scope === 'cookbook' ? 'RECIPE' : it.scope.toUpperCase()}</span><span class="text-[11px] text-white font-bold truncate">${window.escapeHtml(it.title)}</span><span class="text-[9px] text-white/40 truncate">${window.escapeHtml(it.sub || '')}</span></button>`).join('');
        };
        const renderGearChips = () => {
            const corpus = gearCorpus().map(i => i.text).join(' ').toLowerCase();
            const present = (window.PLUGIN_TOOLTIPS || []).map(([k]) => k).filter(k => corpus.includes(k.toLowerCase()));
            const chips = document.getElementById('gearindex-chips'); if (!chips) return;
            chips.innerHTML = present.slice(0, 24).map(k => `<button class="gx-chip text-[9px] font-bold px-2 py-0.5 rounded border border-[#7AFFBF40] text-[#7AFFBF] hover:bg-[#7AFFBF]/10 cursor-pointer" data-term="${k.replace(/"/g, '')}">${k}</button>`).join('') || '<span class="text-white/30 text-[10px] italic">No known gear detected in your vault yet.</span>';
        };
        document.getElementById('btn-open-gearindex')?.addEventListener('click', () => { const i = document.getElementById('gearindex-input'); if (i) i.value = ''; renderGearChips(); renderGearResults(''); openModal('gearindex-modal'); });
        document.getElementById('gearindex-input')?.addEventListener('input', (e) => renderGearResults(e.target.value));
        document.getElementById('gearindex-chips')?.addEventListener('click', (e) => { const c = e.target.closest('.gx-chip'); if (!c) return; document.getElementById('gearindex-input').value = c.dataset.term; renderGearResults(c.dataset.term); });
        wireModalDismiss('gearindex-modal', 'gearindex-close');
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal('gearindex-modal'); });

        // =====================================================================
        // 22. REAMP PAIRING + "USED IN" BACKLINKS (tone/recipe <-> track)
        // =====================================================================
        const toneNm = (id) => (window.db.tones || []).find(t => t.id === id)?.name;
        const recipeNm = (id) => (window.db.cookbook || []).find(r => r.id === id)?.inst;
        const tracksUsingTone = (id) => (window.db.tracks || []).filter(t => t.toneRef === id);
        const tracksUsingRecipe = (id) => (window.db.tracks || []).filter(t => t.recipeRef === id);
        window.populateTrackRefs = () => {
            const ts = document.getElementById('track-tone-ref'), rs = document.getElementById('track-recipe-ref');
            if (ts) ts.innerHTML = '<option value="">— none —</option>' + (window.db.tones || []).map(t => `<option value="${t.id}">${window.escapeHtml(t.name || 'Unnamed')}</option>`).join('');
            if (rs) rs.innerHTML = '<option value="">— none —</option>' + (window.db.cookbook || []).map(r => `<option value="${r.id}">${window.escapeHtml(r.genre + ' — ' + r.inst)}</option>`).join('');
        };
        document.getElementById('btn-add-track')?.addEventListener('click', () => window.populateTrackRefs());
        window.__injectTrackRefs = () => {
            document.querySelectorAll('#track-list .card').forEach(card => {
                if (card.querySelector('.track-refs')) return;
                const eb = card.querySelector('.btn-edit-track'); if (!eb) return;
                const t = (window.db.tracks || []).find(x => x.id === parseInt(eb.dataset.id, 10)); if (!t) return;
                const chips = [];
                if (t.toneRef && toneNm(t.toneRef)) chips.push(`<button class="gx-jump text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#00E5FF40] text-[#00E5FF] cursor-pointer" data-scope="tones" data-id="${t.toneRef}">🎸 ${toneNm(t.toneRef)}</button>`);
                if (t.recipeRef && recipeNm(t.recipeRef)) chips.push(`<button class="gx-jump text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#00FF8840] text-[#00FF88] cursor-pointer" data-scope="cookbook" data-id="${t.recipeRef}">📖 ${recipeNm(t.recipeRef)}</button>`);
                if (chips.length) { const d = document.createElement('div'); d.className = 'track-refs flex flex-wrap gap-1.5 mt-2'; d.innerHTML = chips.join(''); card.appendChild(d); }
            });
        };
        window.__injectToneBacklinks = () => {
            document.querySelectorAll('#tone-list .card[data-tone-id]').forEach(card => {
                if (card.querySelector('.tone-backlink')) return;
                const used = tracksUsingTone(parseInt(card.dataset.toneId, 10)); if (!used.length) return;
                const d = document.createElement('div'); d.className = 'tone-backlink mt-2 text-[9px] text-[#7FA8D9]';
                d.innerHTML = '↳ used in ' + used.map(t => `<button class="gx-jump underline cursor-pointer" data-scope="tracks" data-id="${t.id}">${window.escapeHtml(t.inst || 'track')}</button>`).join(', ');
                card.appendChild(d);
            });
        };
        ['renderTracks', 'renderTones'].forEach(fn => {
            const orig = window[fn];
            if (typeof orig === 'function' && !orig.__blWrapped) {
                window[fn] = function () { const r = orig.apply(this, arguments); if (fn === 'renderTracks') window.__injectTrackRefs(); else window.__injectToneBacklinks(); return r; };
                window[fn].__blWrapped = true;
            }
        });
        const _selectInstBl = window.selectInst;
        if (typeof _selectInstBl === 'function' && !_selectInstBl.__blWrapped) {
            window.selectInst = function (id) {
                const r = _selectInstBl.apply(this, arguments);
                try {
                    const used = tracksUsingRecipe(id); const disp = document.getElementById('recipe-display');
                    if (used.length && disp && !disp.querySelector('.recipe-backlink')) {
                        const d = document.createElement('div'); d.className = 'recipe-backlink mt-4 text-[10px] text-[#7FA8D9] border-t border-[#7FA8D920] pt-3';
                        d.innerHTML = '↳ used in tracks: ' + used.map(t => `<button class="gx-jump underline cursor-pointer" data-scope="tracks" data-id="${t.id}">${window.escapeHtml(t.inst || 'track')}</button>`).join(', ');
                        (disp.querySelector('.animate-fade-in') || disp).appendChild(d);
                    }
                } catch (e) {}
                return r;
            };
            window.selectInst.__blWrapped = true;
        }

        // =====================================================================
        // 24. RECIPE VERSIONING + DIFF (richer history modal)
        // =====================================================================
        window.openHistoryModal = (recipe) => {
            const content = document.getElementById('history-modal-content');
            if (!content) return;
            const history = recipe.history || [];
            if (history.length === 0) { content.innerHTML = `<div class="text-[10px] text-[#E2E8F0]/30 italic">No previous versions saved yet.</div>`; }
            else {
                const cur = { desc: recipe.desc, reaper: recipe.reaper, notes: recipe.notes };
                const esc = (s) => (s || '').replace(/</g, '&lt;');
                const row = (label, oldV, newV) => { const changed = (oldV || '') !== (newV || ''); if (!changed) return `<div class="text-[9px] text-white/25 mb-1">${label}: unchanged</div>`; return `<div class="mb-2"><div class="text-[8px] uppercase tracking-widest text-[#FFD60A] mb-0.5">${label} • changed</div><div class="text-[9px] font-mono text-[#FF8888]/80 whitespace-pre-wrap bg-[#FF444408] rounded px-1.5 py-1">− ${esc(oldV) || '(empty)'}</div><div class="text-[9px] font-mono text-[#00FF88]/90 whitespace-pre-wrap bg-[#00FF8808] rounded px-1.5 py-1 mt-0.5">+ ${esc(newV) || '(empty)'}</div></div>`; };
                content.innerHTML = history.map((h, i) => {
                    const same = (h.reaper || '') === (cur.reaper || '') && (h.notes || '') === (cur.notes || '') && (h.desc || '') === (cur.desc || '');
                    return `<div class="p-3 rounded border border-[#FF88FF20] bg-black/40 mb-3">
                        <div class="flex items-center justify-between mb-2"><span class="text-[9px] font-bold tracking-widest text-[#FF88FF]/70">${new Date(h.savedAt).toLocaleString()} → now</span><button data-recipe-id="${recipe.id}" data-history-idx="${i}" class="btn-restore-history text-[9px] font-bold px-2 py-1 rounded border border-[#00FF8850] text-[#00FF88] hover:bg-[#00FF88]/10 cursor-pointer">↺ RESTORE</button></div>
                        ${same ? '<div class="text-[9px] text-white/30 italic">Identical to current version.</div>' : row('CHAIN', h.reaper, cur.reaper) + row('Notes', h.notes, cur.notes) + row('Desc', h.desc, cur.desc)}
                    </div>`;
                }).join('');
            }
            const modal = document.getElementById('history-modal'); if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
        };

        // =====================================================================
        // 25. COMMAND-BAR ACTIONS (⌘K)
        // =====================================================================
        const cmdkActions = [
            { icon: '🍳', label: 'New recipe', keys: 'new recipe add cookbook', run: () => { window.switchTab('cookbook'); window.toggleForm('form-cookbook'); } },
            { icon: '🎸', label: 'New tone', keys: 'new tone add guitar preset', run: () => { window.switchTab('tones'); window.toggleForm('form-tone'); } },
            { icon: '🎚️', label: 'New channel setting', keys: 'new track channel add config', run: () => { window.switchTab('tracks'); window.toggleForm('form-track'); } },
            { icon: '🗂️', label: 'Song board', keys: 'board kanban status songs tracks', run: () => { window.switchTab('toolbox'); window.setToolboxSub && window.setToolboxSub('arrange'); } },
            { icon: '🔬', label: 'Mix analyzer', keys: 'lufs loudness true peak spectrum phase dynamic range analyze', run: () => { window.switchTab('toolbox'); window.setToolboxSub && window.setToolboxSub('analyzer'); } },
            { icon: '✅', label: 'Pre-export check', keys: 'export check reference mix', run: () => { window.switchTab('hardware'); document.getElementById('btn-preexport-check')?.click(); } },
            { icon: '🔌', label: 'Cable cheat-sheet', keys: 'cable connector impedance', run: () => openModal('cable-modal') },
            { icon: '⟳', label: 'Load default rig', keys: 'rig patchbay default load', run: () => { window.switchTab('hardware'); window.loadDefaultPatchbay && window.loadDefaultPatchbay(true); } },
            { icon: '🧩', label: 'Gear index', keys: 'gear index find plugin', run: () => document.getElementById('btn-open-gearindex')?.click() },
            { icon: '🧟', label: 'Frankenstein builder', keys: 'frankenstein composite fuse', run: () => { window.switchTab('cookbook'); document.getElementById('btn-frankenstein')?.click(); } },
            { icon: '🔑', label: 'Color map', keys: 'color map key tag health', run: () => document.getElementById('btn-open-colormap')?.click() },
            { icon: '📋', label: 'Session recap', keys: 'recap session stats streak', run: () => document.getElementById('btn-open-recap')?.click() },
            { icon: '⬇', label: 'Backup vault', keys: 'backup download vault', run: () => document.getElementById('btn-backup-vault')?.click() },
        ];
        const _renderCmdk = window.renderCmdkResults;
        if (typeof _renderCmdk === 'function' && !_renderCmdk.__actionsWrapped) {
            window.renderCmdkResults = function (query) {
                _renderCmdk.apply(this, arguments);
                const results = document.getElementById('cmdk-results'); if (!results) return;
                const q = (query || '').trim().toLowerCase();
                const acts = q ? cmdkActions.filter(a => (a.label + ' ' + a.keys).toLowerCase().includes(q)) : cmdkActions.slice(0, 5);
                if (!acts.length) return;
                if (q) { const ph = results.querySelector('div.text-center.italic'); if (ph) ph.remove(); }
                const frag = document.createElement('div'); frag.className = 'mb-1 border-b border-white/5 pb-1';
                frag.innerHTML = '<div class="text-[8px] font-bold tracking-widest text-[#B18CFF]/60 uppercase px-3 pt-1 pb-1">Actions</div>';
                acts.forEach(a => { const row = document.createElement('div'); row.className = 'flex items-center gap-3 px-3 py-2 rounded hover:bg-white/5 cursor-pointer'; row.innerHTML = `<span class="text-[13px] shrink-0">${a.icon}</span><span class="text-[12px] text-white">${a.label}</span>`; row.addEventListener('click', () => { if (window.closeCmdk) window.closeCmdk(); a.run(); }); frag.appendChild(row); });
                results.insertBefore(frag, results.firstChild);
            };
            window.renderCmdkResults.__actionsWrapped = true;
        }

        // =====================================================================
        // 26. GENRE EXPORT — recipe pack (.json) + cookbook chapter (.md)
        // =====================================================================
        const downloadFile = (filename, text, mime) => { const blob = new Blob([text], { type: mime || 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 2000); };
        const safeName = (s) => (s || 'genre').replace(/[^a-z0-9]/gi, '_');
        const currentGenreRecipes = () => (window.db.cookbook || []).filter(r => r.genre === window.currentCookbookGenre);
        document.getElementById('btn-genre-pack')?.addEventListener('click', () => {
            const recs = currentGenreRecipes(); if (!recs.length) { alert('No recipes in this genre.'); return; }
            const pack = recs.map(r => ({ genre: r.genre, inst: r.inst, effort: r.effort || '', desc: r.desc, reaper: r.reaper, notes: r.notes, why: r.why || '' }));
            downloadFile(safeName(window.currentCookbookGenre) + '_pack.json', JSON.stringify(pack, null, 2), 'application/json');
        });
        document.getElementById('btn-genre-chapter')?.addEventListener('click', () => {
            const g = window.currentCookbookGenre; const recs = currentGenreRecipes(); if (!recs.length) { alert('No recipes in this genre.'); return; }
            let md = `# ${g}\n\n`;
            recs.forEach(r => { md += `## ${r.inst}${r.effort ? `  _(${r.effort})_` : ''}\n\n`; if (r.desc) md += `> ${r.desc}\n\n`; md += `**CHAIN:** ${r.reaper || '—'}\n\n`; if (r.notes) md += `**Notes:** ${r.notes}\n\n`; if (r.why) md += `**Why it works:** ${r.why}\n\n`; md += `---\n\n`; });
            md += `_Exported from EUTERPE_OS_\n`;
            downloadFile(safeName(g) + '_chapter.md', md, 'text/markdown');
        });

        // =====================================================================
        // 27. SELECTIVE IMPORT MERGE — preview + tick which pack recipes to merge
        // =====================================================================
        let pendingPack = [];
        const keyOf = (r) => `${(r.genre || '').trim().toLowerCase()}|${(r.inst || '').trim().toLowerCase()}`;
        window.importRecipePack = (file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                let incoming; try { incoming = JSON.parse(ev.target.result); } catch (e) { alert('That file is not valid JSON.'); return; }
                const list = Array.isArray(incoming) ? incoming : (Array.isArray(incoming.cookbook) ? incoming.cookbook : null);
                if (!list) { alert('Expected a JSON array of recipes (or a {"cookbook":[...]} object).'); return; }
                const valid = list.filter(r => r.genre && r.inst);
                if (!valid.length) { alert('No valid recipes found in that file.'); return; }
                const existingKeys = new Set((window.db.cookbook || []).map(keyOf));
                pendingPack = valid.map(r => ({ r, dup: existingKeys.has(keyOf(r)) }));
                renderSelImport(); openModal('selimport-modal');
            };
            reader.readAsText(file);
        };
        const updateSelCount = () => { const n = document.querySelectorAll('.sel-chk:checked').length; const el = document.getElementById('selimport-count'); if (el) el.textContent = `${n} of ${pendingPack.length} selected`; };
        const renderSelImport = () => {
            const list = document.getElementById('selimport-list'); if (!list) return;
            list.innerHTML = pendingPack.map((p, i) => `<label class="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer"><input type="checkbox" class="sel-chk mt-0.5 accent-[#00E5FF]" data-i="${i}" ${p.dup ? '' : 'checked'}><div class="min-w-0"><div class="text-[11px] text-white truncate">${window.escapeHtml(p.r.inst || '')} ${p.dup ? '<span class="text-[#FFD60A] text-[9px]">• already exists</span>' : '<span class="text-[#00FF88] text-[9px]">• new</span>'}</div><div class="text-[9px] text-white/40 truncate">${window.escapeHtml(p.r.genre || '')}</div></div></label>`).join('');
            updateSelCount();
        };
        document.getElementById('selimport-list')?.addEventListener('change', updateSelCount);
        document.getElementById('selimport-all')?.addEventListener('click', () => { document.querySelectorAll('.sel-chk').forEach(c => c.checked = true); updateSelCount(); });
        document.getElementById('selimport-none')?.addEventListener('click', () => { document.querySelectorAll('.sel-chk').forEach(c => c.checked = false); updateSelCount(); });
        document.getElementById('selimport-new')?.addEventListener('click', () => { document.querySelectorAll('.sel-chk').forEach(c => { c.checked = !pendingPack[parseInt(c.dataset.i, 10)].dup; }); updateSelCount(); });
        document.getElementById('selimport-go')?.addEventListener('click', () => {
            const chosen = [...document.querySelectorAll('.sel-chk:checked')].map(c => pendingPack[parseInt(c.dataset.i, 10)].r);
            if (!chosen.length) { closeModal('selimport-modal'); return; }
            const existing = window.db.cookbook || []; const byKey = new Map(existing.map(r => [keyOf(r), r]));
            let nextId = existing.reduce((m, r) => Math.max(m, r.id || 0), 200) + 1; let added = 0, updated = 0;
            chosen.forEach(r => { const chain = [r.reaper, r.luna].filter(Boolean).join('\n\n'); const m = byKey.get(keyOf(r)); if (m) { m.desc = r.desc || m.desc; m.reaper = chain || m.reaper; m.notes = r.notes || m.notes; if (r.why) m.why = r.why; if (r.effort) m.effort = r.effort; updated++; } else { window.db.cookbook.push({ id: nextId++, genre: r.genre, inst: r.inst, effort: r.effort || '', desc: r.desc || '', reaper: chain, notes: r.notes || '', why: r.why || '', images: [] }); added++; } });
            window.saveData(); if (window.buildGenreColorMap) window.buildGenreColorMap(); if (window.renderCookbookMenu) window.renderCookbookMenu();
            closeModal('selimport-modal'); alert(`Merged: ${added} added, ${updated} updated.`);
        });
        wireModalDismiss('selimport-modal', 'selimport-close');

        // =====================================================================
        // 28. REFERENCE-TRACK SHELF
        // =====================================================================
        window.db.refShelf = window.db.refShelf || [];
        const renderRefShelf = () => {
            const list = document.getElementById('refshelf-list'); if (!list) return;
            const items = window.db.refShelf || [];
            list.innerHTML = items.length ? items.map(r => `<div class="p-2.5 rounded border border-[#B18CFF20] bg-black/40 flex items-start justify-between gap-2"><div class="min-w-0"><div class="text-[11px] font-bold text-white truncate">${window.escapeHtml(r.title || 'Untitled')}</div>${r.lufs ? `<div class="text-[9px] text-[#FFD60A]/80">${window.escapeHtml(r.lufs)}</div>` : ''}${r.note ? `<div class="text-[9px] text-white/50">${window.escapeHtml(r.note)}</div>` : ''}${r.link ? `<a href="${window.escapeHtml(r.link)}" target="_blank" rel="noopener" class="text-[9px] text-[#00E5FF] underline">open ↗</a>` : ''}</div><button class="ref-del text-[#FF8888] text-[13px] shrink-0" data-id="${r.id}">×</button></div>`).join('') : '<div class="text-white/30 text-[10px] italic">No references yet.</div>';
        };
        document.getElementById('btn-ref-shelf')?.addEventListener('click', () => { renderRefShelf(); openModal('refshelf-modal'); });
        document.getElementById('refshelf-add')?.addEventListener('click', () => {
            const title = (document.getElementById('refshelf-title').value || '').trim(); if (!title) { document.getElementById('refshelf-title').focus(); return; }
            window.db.refShelf.unshift({ id: Date.now(), title, link: (document.getElementById('refshelf-link').value || '').trim(), lufs: (document.getElementById('refshelf-lufs').value || '').trim(), note: (document.getElementById('refshelf-note').value || '').trim() });
            ['refshelf-title', 'refshelf-link', 'refshelf-lufs', 'refshelf-note'].forEach(id => document.getElementById(id).value = '');
            window.saveData(); renderRefShelf();
        });
        document.getElementById('refshelf-list')?.addEventListener('click', (e) => { const d = e.target.closest('.ref-del'); if (!d) return; window.db.refShelf = (window.db.refShelf || []).filter(x => x.id !== parseInt(d.dataset.id, 10)); window.saveData(); renderRefShelf(); });
        wireModalDismiss('refshelf-modal', 'refshelf-close');

        // =====================================================================
        // 29. GAIN-STAGE VIEW (tones as clean -> crunch -> distortion ladder)
        // =====================================================================
        let stageViewOn = false;
        const STAGE_ORDER = [['CLEAN', '#00E5FF'], ['CRUNCH', '#FFA05C'], ['DISTORTION', '#FF5C5C'], ['BASS', '#FFD60A']];
        const renderStageView = () => {
            const wrap = document.getElementById('tone-stage-view'); if (!wrap) return;
            const tones = window.db.tones || [];
            wrap.innerHTML = STAGE_ORDER.map(([cat, color]) => {
                const items = tones.filter(t => (t.category || 'CLEAN') === cat);
                return `<div class="rounded border p-3 bg-black/30" style="border-color:${color}30;"><div class="text-[10px] font-bold tracking-widest uppercase mb-2 flex items-center gap-2" style="color:${color};"><span class="w-2 h-2 rounded-full" style="background:${color};"></span>${cat} <span class="opacity-50">· ${items.length}</span></div><div class="flex flex-wrap gap-2">${items.length ? items.map(t => `<span class="text-[10px] px-2 py-1 rounded border" style="color:${color};border-color:${color}40;background:${color}0A;" title="${window.escapeHtml(t.nam || '')}${t.ir ? ' / ' + window.escapeHtml(t.ir) : ''}">${window.escapeHtml(t.name || 'Unnamed')}${t.brand ? ` · ${window.escapeHtml(t.brand)}` : ''}</span>`).join('') : '<span class="text-white/25 text-[10px] italic">none</span>'}</div></div>`;
            }).join('');
        };
        const setStageView = (on) => {
            stageViewOn = on;
            document.getElementById('tone-stage-view')?.classList.toggle('hidden', !on);
            document.getElementById('tone-list')?.classList.toggle('hidden', on);
            document.getElementById('tone-tag-bar')?.classList.toggle('hidden', on);
            document.getElementById('tone-smartfilter')?.classList.toggle('hidden', on);
            const btn = document.getElementById('btn-tone-stages'); if (btn) btn.style.background = on ? 'rgba(255,160,92,0.22)' : 'rgba(255,160,92,0.08)';
            if (on) renderStageView();
        };
        document.getElementById('btn-tone-stages')?.addEventListener('click', () => setStageView(!stageViewOn));
        const _rtStage = window.renderTones;
        if (typeof _rtStage === 'function' && !_rtStage.__stageWrapped) { window.renderTones = function () { const r = _rtStage.apply(this, arguments); if (stageViewOn) renderStageView(); return r; }; window.renderTones.__stageWrapped = true; }

        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal('refshelf-modal'); closeModal('selimport-modal'); } });

        // =====================================================================
        // 30. REFERENCE-LEVEL CALIBRATION — live-mic drift warning + estimated absolute SPL (piggybacks vuLive)
        // =====================================================================
        window.SPL_CAL_KEY = 'ferrett_os_spl_cal_v1';
        window.__splCal = { ref: null, cur: null, offset: null, calibratedAt: null };
        try {
            const saved = JSON.parse(localStorage.getItem(window.SPL_CAL_KEY) || 'null');
            if (saved && typeof saved.ref === 'number') {
                window.__splCal.ref = saved.ref; window.__splCal.offset = (typeof saved.offset === 'number') ? saved.offset : null; window.__splCal.calibratedAt = saved.calibratedAt || null;
                const badge = document.getElementById('spl-live-badge');
                if (badge) { badge.textContent = window.__splCal.offset != null ? 'SPL SAVED' : 'DRIFT SAVED'; badge.className = 'text-[8px] px-1.5 py-0.5 rounded bg-[#00E5FF12] border border-[#00E5FF18] text-[#00E5FF]/60'; }
            }
        } catch (e) {}
        window.saveSplCal = () => { try { localStorage.setItem(window.SPL_CAL_KEY, JSON.stringify({ ref: window.__splCal.ref, offset: window.__splCal.offset, calibratedAt: window.__splCal.calibratedAt })); } catch (e) {} };
        const CAL_TOL = 3; // dB
        const splDbNow = () => {
            const vl = window.vuLive; if (!vl || !vl.active || !vl.analyser || !vl.buf) return null;
            vl.analyser.getByteTimeDomainData(vl.buf);
            let sum = 0; for (let i = 0; i < vl.buf.length; i++) { const v = (vl.buf[i] - 128) / 128; sum += v * v; }
            const rms = Math.sqrt(sum / vl.buf.length);
            return rms > 0.0001 ? 20 * Math.log10(rms) : -80;
        };
        let splSmooth = null;
        const splCalTick = () => {
            const db = splDbNow();
            if (db != null) { splSmooth = splSmooth == null ? db : splSmooth * 0.85 + db * 0.15; window.__splCal.cur = splSmooth; }
            else { splSmooth = null; window.__splCal.cur = null; }
            const el = document.getElementById('spl-drift');
            if (el) {
                if (window.__splCal.ref == null) { el.textContent = window.vuLive?.active ? 'ready' : '—'; el.style.color = 'rgba(255,255,255,0.3)'; }
                else if (splSmooth != null) { const drift = splSmooth - window.__splCal.ref; const over = Math.abs(drift) > CAL_TOL; el.textContent = `${drift >= 0 ? '+' : ''}${drift.toFixed(1)} dB`; el.style.color = over ? '#FF5C5C' : '#00FF88'; }
            }
            requestAnimationFrame(splCalTick);
        };
        document.getElementById('btn-spl-cal')?.addEventListener('click', async () => {
            if (!window.vuLive?.active && window.startVuLive) { await window.startVuLive(); }
            setTimeout(() => {
                if (window.__splCal.cur != null && window.vuLive?.active) {
                    const raw = prompt('Playing steady pink noise, matched to a real SPL meter/app reading?\n\nEnter that dB SPL number now to calibrate an absolute readout (e.g. 75).\nLeave blank for relative drift-tracking only (no external meter needed).');
                    if (raw === null) return; // cancelled — leave existing calibration untouched
                    window.__splCal.ref = window.__splCal.cur;
                    window.__splCal.calibratedAt = Date.now();
                    const knownSpl = parseFloat(raw);
                    window.__splCal.offset = (raw.trim() !== '' && !isNaN(knownSpl)) ? (knownSpl - window.__splCal.ref) : null;
                    window.saveSplCal();
                    const el = document.getElementById('spl-drift'); if (el) { el.textContent = '0.0 dB'; el.style.color = '#00FF88'; }
                    const badge = document.getElementById('spl-live-badge'); if (badge) { badge.textContent = window.__splCal.offset != null ? 'SPL LIVE' : 'DRIFT ONLY'; badge.className = 'text-[8px] px-1.5 py-0.5 rounded bg-[#00FF8812] border border-[#00FF8818] text-[#00FF88]/60'; }
                } else alert('Enable the mic and play steady pink noise at mix level, then calibrate.');
            }, 700);
        });
        splCalTick();

        // =====================================================================
        // 31. PATCHBAY <-> RIG MISMATCH HIGHLIGHTER
        // =====================================================================
        const pbSignature = (pb) => {
            const idToName = {}; (pb.devices || []).forEach(d => idToName[d.id] = (d.name || '').trim().toLowerCase());
            const devs = Object.values(idToName).sort().join('|');
            const conns = (pb.connections || []).map(c => `${idToName[c.from.deviceId] || '?'}>${idToName[c.to.deviceId] || '?'}`).sort().join(',');
            return devs + '::' + conns;
        };
        const checkPatchbayMatch = () => {
            const badge = document.getElementById('patchbay-match-badge'); if (!badge || !window.getEffectiveDefaultPatchbay) return;
            const pb = window.db.patchbay || { devices: [], connections: [] };
            if ((pb.devices || []).length === 0) { badge.classList.add('hidden'); return; }
            badge.classList.remove('hidden');
            const match = pbSignature(pb) === pbSignature(window.getEffectiveDefaultPatchbay());
            if (match) { badge.textContent = '✓ matches rig'; badge.style.color = '#00FF88'; badge.style.borderColor = '#00FF8840'; badge.dataset.match = '1'; badge.title = 'Your patchbay matches your default rig.'; }
            else { badge.textContent = '⚠ differs from rig — realign'; badge.style.color = '#FFD60A'; badge.style.borderColor = '#FFD60A40'; badge.dataset.match = '0'; badge.title = 'Click to re-load your default rig.'; }
        };
        document.getElementById('patchbay-match-badge')?.addEventListener('click', () => { if (document.getElementById('patchbay-match-badge').dataset.match === '0' && window.loadDefaultPatchbay) window.loadDefaultPatchbay(true); });
        const _rpMatch = window.renderPatchbay;
        if (typeof _rpMatch === 'function' && !_rpMatch.__matchWrapped) { window.renderPatchbay = function () { const r = _rpMatch.apply(this, arguments); checkPatchbayMatch(); return r; }; window.renderPatchbay.__matchWrapped = true; }
        checkPatchbayMatch();

        // =====================================================================
        // 32. MONITOR ROUND-ROBIN TIMER — interval prompts to A/B across monitors
        // =====================================================================
        const MONITORS = ['Sansui / Bose 301', 'The Gammas', 'The Xiberias', 'Samsung Sound Bar', 'Skullcandy JIB (AutoEQ)'];
        const RR_INTERVAL = 120000; // 2 minutes
        let rrTimer = null, rrIdx = 0;
        const showRRToast = (text) => {
            let t = document.getElementById('rr-toast');
            if (!t) { t = document.createElement('div'); t.id = 'rr-toast'; t.className = 'fixed left-1/2 bottom-8 -translate-x-1/2 z-[99998] px-4 py-2.5 rounded-lg border border-[#00E5FF50] bg-[#0a0f0d]/95 text-[#00E5FF] text-[12px] font-bold tracking-widest shadow-[0_0_30px_rgba(0,229,255,0.25)] transition-opacity duration-300'; document.body.appendChild(t); }
            t.textContent = text; t.style.opacity = '1';
            clearTimeout(t._hide); t._hide = setTimeout(() => { t.style.opacity = '0'; }, 6000);
        };
        const rrTick = () => { showRRToast(`🔁 A/B — now check on ${MONITORS[rrIdx % MONITORS.length]}`); rrIdx++; };
        const setRR = (on) => {
            const btn = document.getElementById('btn-monitor-rr');
            if (on) { rrIdx = 0; rrTick(); rrTimer = setInterval(rrTick, RR_INTERVAL); if (btn) { btn.style.background = 'rgba(0,229,255,0.22)'; btn.textContent = '🔁 A/B ON'; } }
            else { clearInterval(rrTimer); rrTimer = null; if (btn) { btn.style.background = ''; btn.textContent = '🔁 A/B Timer'; } const t = document.getElementById('rr-toast'); if (t) t.style.opacity = '0'; }
        };
        document.getElementById('btn-monitor-rr')?.addEventListener('click', () => setRR(!rrTimer));

        // ---- delegated clicks for dynamically-rendered card buttons ----
        document.addEventListener('click', (e) => {
            const gj = e.target.closest('.gx-jump');
            if (gj) { window.__gearJump(gj.dataset.scope, parseInt(gj.dataset.id, 10)); return; }
            const tc = e.target.closest('.btn-tone-chain');
            if (tc) { const t = (window.db.tones || []).find(x => x.id === parseInt(tc.dataset.id, 10)); if (t) openToneChain(t); return; }
            const ck = e.target.closest('.btn-recipe-cook');
            if (ck) { const r = (window.db.cookbook || []).find(x => x.id === parseInt(ck.dataset.id, 10)); if (r) openCook(r); return; }
            const cl = e.target.closest('.btn-recipe-checklist');
            if (cl) { const r = (window.db.cookbook || []).find(x => x.id === parseInt(cl.dataset.id, 10)); if (r) recipeToChecklist(r); return; }
            const er = e.target.closest('.btn-export-recipe');
            if (er) { const r = (window.db.cookbook || []).find(x => x.id === parseInt(er.dataset.id, 10)); if (r) openExport(r.inst, recipeToText(r)); return; }
            const et = e.target.closest('.btn-export-tone');
            if (et) { const t = (window.db.tones || []).find(x => x.id === parseInt(et.dataset.id, 10)); if (t) openExport(t.name, toneToText(t)); return; }
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
