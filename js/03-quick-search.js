// =========================================================================
// ⌘K QUICK-SEARCH COMMAND PALETTE
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {

    window.buildSearchIndex = () => {
        const idx = [];
        (window.db.tones || []).forEach(t => idx.push({ scope: 'tones', id: t.id, title: t.name, tag: t.brand || t.category, sub: [t.nam, t.ir].filter(Boolean).join(' · '), text: `${t.name} ${t.category} ${t.brand || ''} ${t.nam || ''} ${t.ir || ''} ${t.notes || ''}`.toLowerCase(), color: t.brand ? window.toneBrandColor(t.brand) : window.toneCategoryColor(t.category) }));
        (window.db.links || []).forEach(l => idx.push({ scope: 'links', id: l.id, title: l.title, tag: l.category, sub: l.url, text: `${l.title} ${l.category} ${l.notes || ''} ${l.url || ''}`.toLowerCase(), color: window.linkCategoryColor(l.category) }));
        (window.db.scripts || []).forEach(s => idx.push({ scope: 'scripts', id: s.id, title: s.title, tag: s.category, sub: s.shortcut, text: `${s.title} ${s.category} ${s.func || ''}`.toLowerCase(), color: window.scriptCategoryColor(s.category) }));
        (window.db.cookbook || []).forEach(r => idx.push({ scope: 'cookbook', id: r.id, title: r.inst, tag: r.genre, sub: r.genre, text: `${r.inst} ${r.genre} ${r.desc || ''} ${r.notes || ''}`.toLowerCase(), color: window.genreColor(r.genre) }));
        return idx;
    };

    const scopeLabel = { tones: 'TONE', links: 'LINK', scripts: 'SCRIPT', cookbook: 'RECIPE' };

    window.renderCmdkResults = (query) => {
        const results = document.getElementById('cmdk-results'); if (!results) return;
        const idx = window.buildSearchIndex(); const q = (query || '').trim().toLowerCase();
        let matches = q ? idx.filter(it => it.text.includes(q) || it.tag.toLowerCase().includes(q)) : idx;
        matches = matches.slice(0, 50);
        results.innerHTML = '';
        if (matches.length === 0) { results.innerHTML = `<div class="text-center text-[10px] text-white/30 italic p-6 tracking-widest uppercase">No matches // adjust query</div>`; return; }
        matches.forEach(m => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-3 px-3 py-2.5 rounded hover:bg-white/5 cursor-pointer group transition-colors';
            row.innerHTML = `<span class="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded border shrink-0" style="color:${m.color}; border-color:${m.color}40;">${scopeLabel[m.scope]}</span><div class="flex-1 min-w-0"><div class="text-[12px] text-white truncate">${window.escapeHtml(m.title)}</div>${m.sub ? `<div class="text-[10px] text-white/35 truncate">${window.escapeHtml(m.sub)}</div>` : ''}</div><button class="cmdk-tag-pill text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border shrink-0 opacity-70 group-hover:opacity-100 transition-all hover:brightness-125 cursor-pointer" data-scope="${m.scope}" data-tag="${window.escapeHtml(m.tag)}" style="color:${m.color}; border-color:${m.color}40; background:${m.color}0A;" title="Filter ${scopeLabel[m.scope]}s by ${window.escapeHtml(m.tag)}">${window.escapeHtml(m.tag)}</button>`;
            row.addEventListener('click', (e) => { if (e.target.closest('.cmdk-tag-pill')) return; window.cmdkJumpToItem(m.scope, m.id); });
            results.appendChild(row);
        });
        results.querySelectorAll('.cmdk-tag-pill').forEach(p => p.addEventListener('click', (e) => { e.stopPropagation(); window.jumpToTag(p.dataset.scope, p.dataset.tag); }));
    };

    window.renderCmdkTagBar = () => {
        const bar = document.getElementById('cmdk-tagbar'); if (!bar) return; bar.innerHTML = '';
        const groups = [
            { scope: 'cookbook', label: 'RECIPE', items: [...new Set((window.db.cookbook || []).map(r => r.genre))], color: window.genreColor },
            { scope: 'tones', label: 'TONE', items: [...new Set((window.db.tones || []).map(t => t.brand).filter(Boolean))], color: window.toneBrandColor },
            { scope: 'links', label: 'LINK', items: [...new Set((window.db.links || []).map(l => l.category))], color: window.linkCategoryColor },
            { scope: 'scripts', label: 'SCRIPT', items: [...new Set((window.db.scripts || []).map(s => s.category))], color: window.scriptCategoryColor }
        ];
        groups.forEach(g => { g.items.sort().forEach(tag => { const c = g.color(tag); const btn = document.createElement('button'); btn.className = 'px-2 py-1 rounded text-[8px] font-bold tracking-widest uppercase border cursor-pointer transition-all hover:brightness-125'; btn.style.color = c; btn.style.borderColor = c + '40'; btn.style.background = c + '0A'; btn.title = `${g.label}: ${tag}`; btn.innerText = tag; btn.addEventListener('click', () => window.jumpToTag(g.scope, tag)); bar.appendChild(btn); }); });
    };

    window.cmdkJumpToItem = (scope, id) => {
        if (scope === 'tones') {
            window.switchTab('tones'); window.currentToneTag = 'ALL'; window.renderTones();
            setTimeout(() => { const el = [...document.querySelectorAll('#tone-list .btn-edit-tone')].find(b => parseInt(b.dataset.id, 10) === id)?.closest('.card'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('glitching-ui'); setTimeout(() => el.classList.remove('glitching-ui'), 350); } }, 100);
        } else if (scope === 'links') {
            window.switchTab('links'); window.currentLinkTag = 'ALL'; window.renderLinks();
            setTimeout(() => { const el = [...document.querySelectorAll('#link-list .btn-edit-link')].find(b => parseInt(b.dataset.id, 10) === id)?.closest('.card'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('glitching-ui'); setTimeout(() => el.classList.remove('glitching-ui'), 350); } }, 100);
        } else if (scope === 'scripts') {
            window.switchTab('hardware'); window.currentScriptTag = 'ALL'; window.renderScripts();
            setTimeout(() => { const el = [...document.querySelectorAll('#script-list .btn-edit-script')].find(b => parseInt(b.dataset.id, 10) === id)?.closest('.card'); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('glitching-ui'); setTimeout(() => el.classList.remove('glitching-ui'), 350); } }, 100);
        } else if (scope === 'cookbook') {
            const recipe = window.db.cookbook.find(r => r.id === id);
            if (recipe) { window.switchTab('cookbook'); window.selectGenre(recipe.genre); setTimeout(() => window.selectInst(recipe.id), 120); }
        }
        window.closeCmdk();
    };

    window.openCmdk = () => {
        const modal = document.getElementById('cmdk-modal'); if (!modal) return;
        modal.classList.remove('hidden'); modal.classList.add('flex');
        const input = document.getElementById('cmdk-input'); if (input) { input.value = ''; setTimeout(() => input.focus(), 50); }
        window.renderCmdkResults(''); window.renderCmdkTagBar();
    };
    window.closeCmdk = () => { const modal = document.getElementById('cmdk-modal'); if (!modal) return; modal.classList.add('hidden'); modal.classList.remove('flex'); };

    document.getElementById('btn-open-cmdk')?.addEventListener('click', () => window.openCmdk());
    document.getElementById('cmdk-close')?.addEventListener('click', () => window.closeCmdk());
    document.getElementById('cmdk-modal')?.addEventListener('click', (e) => { if (e.target.id === 'cmdk-modal') window.closeCmdk(); });
    document.getElementById('cmdk-input')?.addEventListener('input', (e) => window.renderCmdkResults(e.target.value));
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); const modal = document.getElementById('cmdk-modal'); if (modal && !modal.classList.contains('hidden')) window.closeCmdk(); else window.openCmdk(); }
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
        if (e.key === '?' && !isTyping) { e.preventDefault(); const m = document.getElementById('shortcuts-modal'); if (m) { m.classList.remove('hidden'); m.classList.add('flex'); } }
        if (e.key === ' ' && !isTyping && document.getElementById('tab-toolbox')?.classList.contains('active')) { e.preventDefault(); window.metro?.running ? window.stopMetronome() : window.startMetronome(); }
        if (e.key === 'Escape') {
            const modal = document.getElementById('cmdk-modal'); if (modal && !modal.classList.contains('hidden')) window.closeCmdk();
            document.querySelectorAll('.fixed.flex[id$="-modal"]').forEach((m) => { m.classList.add('hidden'); m.classList.remove('flex'); });
        }
    });
    document.getElementById('close-shortcuts-modal')?.addEventListener('click', () => { const m = document.getElementById('shortcuts-modal'); if (m) { m.classList.add('hidden'); m.classList.remove('flex'); } });
    document.getElementById('btn-open-shortcuts')?.addEventListener('click', () => { const m = document.getElementById('shortcuts-modal'); if (m) { m.classList.remove('hidden'); m.classList.add('flex'); } });
    document.getElementById('shortcuts-modal')?.addEventListener('click', (e) => { if (e.target.id === 'shortcuts-modal') { e.currentTarget.classList.add('hidden'); e.currentTarget.classList.remove('flex'); } });
});
