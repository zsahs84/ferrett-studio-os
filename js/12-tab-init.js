window.addEventListener('DOMContentLoaded', () => {
    const scrollArea = document.getElementById('tab-scroll-area');
    const sideNav = document.getElementById('side-nav');
    if (!scrollArea || !sideNav) return;

    // 1. CREATE THE NEW PRIMARY SECTIONS
    const createTab = (id, color) => {
        const t = document.createElement('section');
        t.id = id;
        t.className = 'middle-tab p-4 md:p-8 min-h-[600px] border-b border-[' + color + '14] bg-[rgba(5,8,7,0.4)]';
        scrollArea.appendChild(t);
        return t;
    };

    const tabSongLab = createTab('tab-songlab', '#00FF88');
    const tabSongBoard = createTab('tab-songboard', '#00E5FF');
    const tabSettings = createTab('tab-settings', '#FFD60A');

    // Add a cool opening OS dashboard header to Song Lab
    tabSongLab.innerHTML = `
        <div class="card border-[#00FF8840] mb-6 text-center py-8" style="background:linear-gradient(135deg,rgba(0,255,136,0.06),rgba(0,229,255,0.04));">
            <h2 class="text-[20px] md:text-[24px] font-bold tracking-[0.3em] text-[#00FF88] uppercase mb-2">Welcome to Euterpe</h2>
            <p class="text-[10px] md:text-[11px] text-[#E2E8F0]/50 max-w-lg mx-auto tracking-widest">CENTRAL COMMAND. START A SESSION, LOG AN IDEA, OR CHECK YOUR STATS.</p>
        </div>
    `;

    // 2. MOVE EXISTING CARDS INTO THE NEW LAYOUT
    const moveCard = (childId, targetTab) => {
        const el = document.getElementById(childId);
        if (el && el.closest('.card')) targetTab.appendChild(el.closest('.card'));
    };

    // To Song Lab (Dashboard)
    moveCard('btn-session-starter', tabSongLab);
    moveCard('session-stats-display', tabSongLab);
    moveCard('lab-idea-bpm', tabSongLab);
    moveCard('btn-lab-memo-rec', tabSongLab);
    moveCard('lab-heatmap', tabSongLab);

    // To Song Board
    tabSongBoard.innerHTML = '<div class="flex items-end justify-between border-b border-[#00E5FF20] pb-2 mb-6"><h2 class="text-[17px] font-bold tracking-[0.22em] text-[#00E5FF]">SONG BOARD & ARRANGEMENT</h2></div>';
    moveCard('songboard-board', tabSongBoard);
    moveCard('arr-list', tabSongBoard);
    moveCard('struct-list', tabSongBoard);
    moveCard('set-list', tabSongBoard);

    // To Settings
    tabSettings.innerHTML = '<div class="flex items-end justify-between border-b border-[#FFD60A20] pb-2 mb-6"><h2 class="text-[17px] font-bold tracking-[0.22em] text-[#FFD60A]">SYSTEM & CALIBRATION</h2></div>';
    
    // Move SPL Gauge into Settings
    const splCanvas = document.getElementById('spl-canvas');
    if (splCanvas && splCanvas.closest('div.flex-col')) {
        const splParent = splCanvas.closest('div.flex-col').parentElement;
        const splCard = document.createElement('div');
        splCard.className = 'card border-[#00FF8830] mb-6 flex flex-col items-center';
        splCard.appendChild(splParent);
        tabSettings.appendChild(splCard);
    }

    // Move AI Setup Modal into Settings
    const aiModal = document.getElementById('ai-modal');
    if (aiModal) {
        const aiContent = aiModal.querySelector('.w-full');
        if (aiContent) {
            const closeBtn = document.getElementById('ai-modal-close');
            if (closeBtn) closeBtn.remove(); // Not needed in a tab
            aiContent.className = 'card border-[#00E5FF40] mb-6 w-full';
            tabSettings.appendChild(aiContent);
        }
    }

    // Move Vault & UI Theme into Settings
    const vaultBtn = document.getElementById('btn-open-vault-modal');
    if (vaultBtn && vaultBtn.parentElement) {
        const sysCard = document.createElement('div');
        sysCard.className = 'card border-[#FFD60A40] mb-6';
        sysCard.innerHTML = '<h3 class="text-[11px] font-bold text-[#FFD60A] tracking-widest mb-4 border-b border-[#FFD60A20] pb-2">DATA VAULT & THEME</h3>';
        sysCard.appendChild(vaultBtn.parentElement);
        
        const themeBtn = document.getElementById('btn-cycle-theme');
        if (themeBtn) {
            themeBtn.className = 'btn-euterpe px-4 py-2 w-full mt-4';
            themeBtn.innerHTML = '🎨 CYCLE UI THEME';
            sysCard.appendChild(themeBtn);
        }
        tabSettings.appendChild(sysCard);
    }

    // 3. BUILD THE NEW NAV BAR
    const oldNavs = Array.from(sideNav.querySelectorAll('.nav-btn'));
    
    const newNavHtml = `
        <button id="nav-songlab-new" class="nav-btn text-[#00FF88] border-[#00FF8835] shrink-0 text-left px-3 py-2.5 rounded text-[11px] font-bold border transition-all uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,136,0.12)] mt-2">🚀 Home</button>
        <button id="nav-songboard-new" class="nav-btn text-[#7AFFBF]/60 border-transparent shrink-0 text-left px-3 py-2.5 rounded text-[11px] font-bold border transition-colors uppercase tracking-wider">🗂️ Song Board</button>
        <button id="nav-lyrics-new" class="nav-btn text-[#7AFFBF]/60 border-transparent shrink-0 text-left px-3 py-2.5 rounded text-[11px] font-bold border transition-colors uppercase tracking-wider">🎤 Lyrics Lab</button>
        <button id="nav-cookbook-new" class="nav-btn text-[#7AFFBF]/60 border-transparent shrink-0 text-left px-3 py-2.5 rounded text-[11px] font-bold border transition-colors uppercase tracking-wider">📖 Cook Book</button>
        
        <button id="toggle-tools-menu" class="nav-btn text-[#7AFFBF]/60 border-transparent shrink-0 text-left px-3 py-2.5 rounded text-[11px] font-bold border transition-colors uppercase tracking-wider">🧰 Tools ▾</button>
        <div id="tools-dropdown" class="hidden flex-col pl-3 border-l border-[#00FF8820] ml-2 gap-1 mt-1 mb-2"></div>
        
        <button id="nav-settings-new" class="nav-btn text-[#7AFFBF]/60 border-transparent shrink-0 text-left px-3 py-2.5 rounded text-[11px] font-bold border transition-colors uppercase tracking-wider mt-auto">⚙️ Settings</button>
    `;

    // Preserve the top branding/close button, overwrite the rest
    const topElements = Array.from(sideNav.children).slice(0, 3);
    sideNav.innerHTML = '';
    topElements.forEach(el => sideNav.appendChild(el));
    sideNav.insertAdjacentHTML('beforeend', newNavHtml);

    // Funnel existing tabs into the new Tools dropdown to preserve their native JS bindings
    const toolsDropdown = document.getElementById('tools-dropdown');
    oldNavs.forEach(btn => {
        if (btn.id === 'nav-cookbook' || btn.id === 'nav-lyrics') {
            btn.style.display = 'none'; // Hidden but kept in DOM to trigger native clicks
            sideNav.appendChild(btn);
        } else {
            btn.className = 'nav-btn text-[#7AFFBF]/60 border-transparent shrink-0 text-left px-3 py-2 rounded text-[10px] font-bold border transition-colors uppercase tracking-wider';
            toolsDropdown.appendChild(btn);
        }
    });

    // Toggle dropdown
    document.getElementById('toggle-tools-menu').addEventListener('click', function() {
        toolsDropdown.classList.toggle('hidden');
        toolsDropdown.classList.toggle('flex');
        this.innerHTML = toolsDropdown.classList.contains('hidden') ? '🧰 Tools ▾' : '🧰 Tools ▴';
    });

    // Logic to style and switch the new primary tabs
    const wireNav = (newId, targetTabId, oldProxyId) => {
        const btn = document.getElementById(newId);
        if (!btn) return;
        btn.addEventListener('click', () => {
            // Style resets
            document.querySelectorAll('#side-nav .nav-btn').forEach(el => el.classList.remove('active-nav-green', 'text-[#00FF88]', 'border-[#00FF8835]'));
            btn.classList.add('active-nav-green', 'text-[#00FF88]', 'border-[#00FF8835]');
            btn.style.boxShadow = '0 0 12px rgba(0,255,136,0.12)';
            
            if (oldProxyId) {
                // If it's an existing tab, let the original OS logic run, then force our active state to stick
                document.getElementById(oldProxyId).click();
                setTimeout(() => {
                    document.querySelectorAll('.middle-tab').forEach(el => el.classList.remove('active'));
                    document.getElementById(targetTabId).classList.add('active');
                    document.querySelectorAll('#side-nav .nav-btn').forEach(el => el.classList.remove('active-nav-green', 'text-[#00FF88]', 'border-[#00FF8835]', 'shadow-[0_0_12px_rgba(0,255,136,0.12)]'));
                    btn.classList.add('active-nav-green', 'text-[#00FF88]', 'border-[#00FF8835]');
                    btn.style.boxShadow = '0 0 12px rgba(0,255,136,0.12)';
                }, 10);
            } else {
                // Standard switch for new tabs
                document.querySelectorAll('.middle-tab').forEach(el => el.classList.remove('active'));
                document.getElementById(targetTabId).classList.add('active');
            }
        });
    };

    wireNav('nav-songlab-new', 'tab-songlab');
    wireNav('nav-songboard-new', 'tab-songboard');
    wireNav('nav-settings-new', 'tab-settings');
    wireNav('nav-cookbook-new', 'tab-cookbook', 'nav-cookbook');
    wireNav('nav-lyrics-new', 'tab-lyrics', 'nav-lyrics');

    // Force Settings buttons inside the app to jump to the new Settings tab
    document.querySelectorAll('[id^="btn-ai-settings"]').forEach(b => {
        const clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
        clone.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('nav-settings-new').click();
        });
    });

    // 4. THE MAGIC LINK: SONG BOARD -> ARRANGEMENT SELECT
    const sbContainer = document.getElementById('songboard-board');
    if (sbContainer) {
        sbContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.card, div[style*="border-color"]');
            if (card) {
                // Find the title element inside the clicked card
                const titleEl = card.querySelector('h4, div.font-bold, input[type="text"]');
                let titleText = titleEl?.tagName === 'INPUT' ? titleEl.value : titleEl?.textContent;
                
                if (titleText && titleText.trim()) {
                    const select = document.getElementById('arr-song-select');
                    if (select) {
                        Array.from(select.options).forEach(opt => {
                            if (opt.textContent.includes(titleText.trim())) {
                                // Match found! Change the select dropdown and fire the change event to update the arrangement UI
                                select.value = opt.value;
                                select.dispatchEvent(new Event('change'));
                                
                                // Reset all card highlights
                                document.querySelectorAll('#songboard-board > div').forEach(c => {
                                    c.style.boxShadow = 'none';
                                });
                                // Light up the active card
                                card.style.boxShadow = '0 0 15px #00E5FF';
                                
                                // Auto-scroll down to the arrangement builder
                                select.scrollIntoView({behavior: 'smooth', block: 'center'});
                            }
                        });
                    }
                }
            }
        });
    }

    // Set Song Lab as default on load
    setTimeout(() => { document.getElementById('nav-songlab-new').click(); }, 100);
});
