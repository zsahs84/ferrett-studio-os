window.escapeHtml = (str) => String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

window.openTbxPanel = (id) => {
    document.getElementById('tbx-dashboard').classList.add('hidden');
    const panel = document.getElementById('tbx-panel-' + id);
    panel.classList.remove('hidden');
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            panel.classList.remove('scale-50', 'opacity-0');
            panel.classList.add('scale-100', 'opacity-100');
        });
    });
};

window.closeTbxPanel = () => {
    const panels = document.querySelectorAll('.tbx-full-panel:not(.hidden)');
    panels.forEach(panel => {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-50', 'opacity-0');
        
        setTimeout(() => {
            panel.classList.add('hidden');
            document.getElementById('tbx-dashboard').classList.remove('hidden');
        }, 300);
    });
};
