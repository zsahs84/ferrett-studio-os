// =========================================================================
// DATA & LOGIC ENGINE
// =========================================================================
window.tokenClient = null; window.driveFileId = null; window.isDriveConnected = false; window.FERRETT_QUIET = false;
window.tempTrackImages = []; window.tempToneImages = []; window.tempCookbookImages = [];

const defaultDb = {
    patchbay: { devices: [], connections: [] },
    patchbayUserDefault: null,
    patchbaySaved: [],
    songBoard: [],
    lyrics: null,
    genreKits: {},
    // Bumped whenever defaultDb gains plugins that an existing saved palette should also receive.
    // The load path unions them in once when the saved rev is behind this one.
    paletteRev: 1,
    ownedPlugins: [
        'Anthem', 'Flow Mixing Suite', 'Splice INSTRUMENT', 'NadIR', 'Tube Delay', 'LA-6176', 'bx_rockrack',
        'SPL Free Ranger', 'Pultec MEQ-5', 'Gateway', 'Topline Key Finder', 'Brigade Chorus', 'OTT', 'bx_solo',
        'Hitsville EQ', 'CHANNEV', '1176 Rev A', 'bx_blackdist2', 'Dream Amp', '610-A', 'Fairchild 660',
        'Hemisphere', 'Waterfall Rotary Speaker', 'Neve 1073', 'SSDSampler5', 'Amplifiers', 'bx_distorange',
        'Ocean Way Studios Deluxe', 'Sitala', 'Ampex ATR-102', 'Electra', 'VD-DEEP', 'Diablo Lite', 'Stems 3',
        'Hitsville EQ Mastering', 'Kontakt 8', 'WaveLab', 'HALion Sonic', 'A-Type Multiband', 'Oxide Tape',
        'Teletronix LA-2', 'bx_tuner', 'Manley Massive Passive', 'bx_shredspread', 'Trigger_2', 'Saturation Knob',
        'Tape Cassette 2', 'LA-2A Gray', 'TDR Nova', 'SSL G-Bus Compressor', 'DrumGPT', 'elysia niveau filter',
        'Fairchild 670', 'API Vision Channel Strip', 'Manley Preamp', 'LA-2A Silver', 'Capitol Compressor',
        'bx_boom', 'ParametricOD', 'CHOWTapeModel', 'ValhallaSupermassive', 'KolinMB', 'IVGI2', 'Studer A800',
        'bx_subfilter', 'Massive Passive M', 'Emissary', 'Topline Vocal Suite', 'Neutone Morpho', 'bx_bluechorus2',
        'Filterjam', 'Distressor', '1176AE', 'VoiceAssist', 'Manley Variable Mu', 'Marshall Plexi Classic',
        'bx_megasingle', 'MT-PowerDrumKit', 'Vital', 'Hitsville Chambers', 'Pultec HLF-3C', 'bx_masterdesk Classic',
        'Ruby Amp', 'bx_cleansweep', 'Pultec EQP-1A', 'kHs Gate', 'kHs Distortion', 'kHs Delay', 'kHs Resonator',
        'kHs Formant Filter', 'kHs Compactor', 'kHs Dynamics', 'kHs Channel Mixer', 'kHs Nonlinear Filter',
        'kHs Phaser', 'kHs Dual Delay', 'kHs Clipper', 'kHs Compressor', 'kHs Pitch Shifter', 'kHs Shaper',
        'kHs Gain', 'kHs Comb Filter', 'kHs Phase Distortion', 'kHs Flanger', 'kHs Trance Gate',
        'kHs Transient Shaper', 'kHs Tape Stop', 'kHs 3-Band EQ', 'kHs Haas', 'kHs Ladder Filter', 'kHs Chorus',
        'kHs Ensemble', 'kHs Stereo', 'kHs Bitcrush', 'kHs Reverser', 'kHs Frequency Shifter', 'kHs Ring Mod',
        // UA renamed Verve to Vibe on 2026-04-14. The DAW now shows the new name, but every kit
        // written before then says "Verve", so the entry carries both — snapToOwned matches by
        // containment, which resolves either spelling to this one palette entry.
        'kHs Limiter', 'kHs Reverb', 'kHs Filter', 'NeuralAmpModeler', 'Woodrow Amp', 'Vibe Analog Machines (formerly Verve)', 'Ravel',
        'Surge XT Effects', 'Neutone FX', 'Surge XT', 'Melodyne', 'Studio D Chorus', 'SSL E-Channel Strip',
        'Lion Amp', 'bx_opto Pedal', 'ChordAXE Lite', '1176LN Rev E', 'Avalon VT-737SP', 'TDR Kotelnikov',
        'Siren', 'Manley VoxBox', 'Opal', 'Ampeg SVTVR Classic', 'bx_meter', 'Drawmer S73', 'dbx 160',
        'Minimoog', 'SpectraLayers', 'Vinyl', 'Waterfall B3', 'bx_yellowdrive', 'API 2500', 'DynAssist',
        'TSAR-1R Reverb', '176', 'FIN-MICRO', 'bx_greenscreamer', 'Paradise Guitar Studio', 'SINE Player',
        'NeuralNote', 'Helios Type 69', 'Graillon 3', '175-B', 'bx_metal2', 'Lexicon 224', 'LA-3A',
        // Added 2026-07-26 after diffing this list against what is actually installed on the Mac.
        // Everything below was already on disk but had never made it into the palette, so the AI
        // could not reach any of it. Names are the plugins' own (UA's product names, Ample Sound's
        // full names next to the four-letter bundle the DAW shows) — snapToOwned matches by
        // containment, so either spelling resolves.
        '1176 FET', '610-B', 'Capitol Chambers', 'Century Tube Channel Strip', 'Enigmatic 82 Amp',
        'Galaxy Tape Echo', 'LA-2A Tube', 'Little Labs VOG', 'PolyMAX', 'Pure Plate Reverb',
        'Showtime 64 Amp', 'Sound City Studios', 'Topline Vocal Tune', 'Vibe Analog Machines Essentials',
        'Ample Bass P Lite II (ABPL2)', 'Ample Guitar M Lite II (AGML2)',
        'Ample Percussion Cloudrum (APC)', 'VB-DANDY'
    ],
    multiNotes: [{ id: Date.now(), title: 'Main Scratchpad', content: '// --------------------------------\n// EUTERPE: SESSION NOTES\n// --------------------------------\n\n[TODO] Check phase on drum bus\n[TODO] Re-track vocal bridge' }],
    tracks: [],
    cookbook: [
        // Baked-in starter recipes removed — the cookbook now starts empty; genres populate as you add or AI-generate recipes.
    ],
    links: [
        { id: 1, title: 'Hookpad (Hooktheory)', url: 'https://hookpad.hooktheory.com/', category: 'AI & MIDI Extraction', daw: 'reaper', notes: 'Browser tool to map out complex jazz/neo-soul chord progressions. Analyzes scales and lets you export MIDI directly to Reaper.' },
        { id: 2, title: 'Fadr AI', url: 'https://fadr.com/', category: 'AI & MIDI Extraction', daw: 'reaper', notes: 'MIDI chord/stem extraction and mastering assistant. The MIDI extraction is the standout feature beyond simple vocal isolation.' },
        { id: 3, title: 'Spotify Basic Pitch', url: 'http://basicpitch.spotify.com/', category: 'AI & MIDI Extraction', daw: 'reaper', notes: 'Converts audio to MIDI via Machine Learning.' },
        { id: 6, title: 'RipX', url: 'https://hitnmix.com/', category: 'AI & MIDI Extraction', daw: 'reaper', notes: 'Deep Audio Manipulation. Turns full mixes into editable MIDI and audio stems, note-by-note — more than just vocal removal.' },
        { id: 7, title: 'Tunebat', url: 'https://tunebat.com/', category: 'Samples & Instruments', daw: 'reaper', notes: 'The ultimate database for crate digging. Look up exact BPM, Key, and Camelot wheel position of almost any commercial song.' },
        { id: 8, title: 'Splice', url: 'https://splice.com/', category: 'Samples & Instruments', daw: 'reaper', notes: 'The industry standard cloud sample, loop, and preset ecosystem.' },
        { id: 9, title: 'Pianobook', url: 'https://www.pianobook.co.uk/', category: 'Samples & Instruments', daw: 'reaper', notes: 'Community-sourced free sample instruments for DecentSampler & Kontakt.' },
        { id: 10, title: 'Spitfire LABS', url: 'https://labs.spitfireaudio.com/', category: 'Samples & Instruments', daw: 'reaper', notes: 'Free, professional-grade cinematic, orchestral, and organic VST instruments.' },
        { id: 11, title: 'Tracklib', url: 'https://www.tracklib.com/', category: 'Samples & Instruments', daw: 'reaper', notes: 'Clearable, legal crate-digging. Sample actual vintage records without fear of copyright strikes.' },
        { id: 12, title: 'Cymatics', url: 'https://cymatics.fm/', category: 'Samples & Instruments', daw: 'reaper', notes: 'Industry standard for modern Trap, Drill, and EDM drum kits.' },
        { id: 13, title: 'Freesound.org', url: 'https://freesound.org/', category: 'Samples & Instruments', daw: 'reaper', notes: 'The rawest database of field recordings, foley, and weird noises. Perfect for granular synthesis.' },
        { id: 14, title: 'Rhythm Roulette', url: 'https://www.youtube.com/playlist?list=PLB-XmXAB88c5r2U-H2HnZ1D_4Rj6E04Zg', category: 'Samples & Instruments', daw: 'reaper', notes: 'Video series. Watch legendary producers blindly pick 3 records and build a beat. Incredible workflow inspiration.' },
        { id: 15, title: 'Mixchecker', url: 'https://www.mixchecker.com/', category: 'Mixing & Mastering', daw: 'reaper', notes: 'Simulates consumer devices (phones, laptops, car stereos) to verify mix translation.' },
        { id: 16, title: 'Loudness Penalty', url: 'https://www.loudnesspenalty.com/', category: 'Mixing & Mastering', daw: 'reaper', notes: 'Check exactly how much streaming services (Spotify/Apple) will turn down your master due to LUFS limits.' },
        { id: 17, title: 'Youlean Loudness Meter', url: 'https://youlean.co/', category: 'Mixing & Mastering', daw: 'reaper', notes: 'The industry standard free LUFS meter. Essential to have on your master bus.' },
        { id: 18, title: 'Metric AB', url: 'https://www.plugin-alliance.com/en/products/adptr_metricab.html', category: 'Mixing & Mastering', daw: 'reaper', notes: 'The ultimate referencing tool. Instantly A/B your mix against commercial masters.' },
        { id: 19, title: 'ToneHunt', url: 'https://tonehunt.org/', category: 'Tones, Amps & IRs', daw: 'reaper', notes: 'The largest community database for Neural Amp Modeler (NAM) profiles.' },
        { id: 20, title: 'Tone3000', url: 'https://www.tone3000.com/', category: 'Tones, Amps & IRs', daw: 'reaper', notes: 'Aggregated search engine for specific JCM800 and high-gain NAM captures.' },
        { id: 21, title: 'Gods Cab IRs', url: 'https://wilkinsonaudio.com/products/gods-cab', category: 'Tones, Amps & IRs', daw: 'reaper', notes: 'The legendary free Mesa OS Impulse Responses (700+ IRs). Essential for heavy guitars. Original signalsaudio.com site is defunct — this is the current, verified free download.' },
        { id: 22, title: 'SoundGym', url: 'https://www.soundgym.co/', category: 'Audio Utilities', daw: 'reaper', notes: 'Daily ear training workouts for audio engineers. Improves frequency recognition and EQ skills.' },
        { id: 23, title: 'Equipboard', url: 'https://equipboard.com/', category: 'Audio Utilities', daw: 'reaper', notes: 'Look up exactly what analog gear, synths, and plugins famous producers use.' },
        { id: 24, title: 'KVR Audio', url: 'https://www.kvraudio.com/', category: 'Audio Utilities', daw: 'reaper', notes: 'The largest database of VST plugins, reviews, and audio developer forums.' },
        { id: 25, title: 'Plugin Boutique', url: 'https://www.pluginboutique.com/', category: 'Audio Utilities', daw: 'reaper', notes: 'The best hub for tracking down free utility VSTs and plugin sales.' },
        { id: 26, title: 'AutoEq Database', url: 'https://github.com/jaakkopasanen/AutoEq', category: 'Audio Utilities', daw: 'reaper', notes: 'Database of EQ curves to flatten consumer headphones (use with SoundSource).' },
        { id: 27, title: 'Glicol', url: 'https://glicol.org/', category: 'Audio Utilities', daw: 'reaper', notes: 'Weird Edge Case: Live-coding beat engine in the browser. Type syntax to generate chaotic, glitchy IDM rhythms.' },
        { id: 28, title: 'Pink Trombone', url: 'https://dood.al/pinktrombone/', category: 'Audio Utilities', daw: 'reaper', notes: 'Weird Edge Case: Interactive speech synthesizer. Manipulate a digital throat to create alien vocal formants.' },
        { id: 29, title: 'Gearspace', url: 'https://gearspace.com/', category: 'Audio Utilities', daw: 'reaper', notes: 'The largest professional audio engineering forum. Great for hardware troubleshooting.' }
    ],
    tones: [
        { id: 101, name: "Gods Cab Heavy Core", category: "DISTORTION", daw: "reaper", nam: "NAM JCM800 High Gain", ir: "Gods Cab 1960B TS9", notes: "The absolute standard. Push the input, HPF at 90Hz, wide scoop at 300Hz.", starred: true, images: [] },
        { id: 102, name: "Mesa V30 Chug", category: "DISTORTION", daw: "reaper", nam: "NAM Dual Recto", ir: "Mesa OS 4x12 SM57", notes: "Tight bottom end. LPF at 8kHz to remove fizz. Fast gate up front.", starred: true, images: [] },
        { id: 103, name: "Bogren Plexi Smash", category: "CRUNCH", daw: "reaper", nam: "NAM Marshall Plexi", ir: "Bogren BD-Heavy-01", notes: "Vintage rock tone. Roll guitar volume down to 7. Boost 2.5kHz.", starred: true, images: [] },
        { id: 104, name: "Orange 5150 Lead", category: "DISTORTION", daw: "reaper", nam: "NAM Peavey 5150", ir: "Orange 4x12 R121", notes: "Smooth, searing leads. Add short stereo delay (ping-pong) and plate reverb.", starred: true, images: [] },
        { id: 105, name: "Modern Djent G-Drop", category: "DISTORTION", daw: "reaper", nam: "NAM Fortin Nameless", ir: "Zilla Cab 4x12", notes: "For 7/8 strings. Pre-EQ: Pull out 200Hz massively before hitting the amp to tighten low end.", starred: true, images: [] },
        { id: 106, name: "Fender Twin Glass", category: "CLEAN", daw: "reaper", nam: "NAM Deluxe Reverb", ir: "Fender Twin Jensen", notes: "Crystal clean. Compress heavily with optical comp (LA-2A) for sustain.", starred: true, images: [] },
        { id: 107, name: "Roland JC-120 Chorus", category: "CLEAN", daw: "reaper", nam: "NAM Roland JC-120", ir: "JC-120 Direct", notes: "80s Pop / Mac DeMarco vibe. Add wide Brigade chorus and subtle tape flutter.", starred: true, images: [] },
        { id: 108, name: "Edge of Breakup Vox", category: "CRUNCH", daw: "reaper", nam: "NAM Vox AC30", ir: "Vox Alnico Blue", notes: "Dig in to distort. Mid-heavy. Perfect for indie rock rhythm tracking.", starred: true, images: [] },
        { id: 109, name: "Ampeg 8x10 Pocket", category: "BASS", daw: "reaper", nam: "NAM SVT", ir: "Ampeg 8x10 MD421", notes: "The ultimate rock bass. HPF at 28Hz, compress with 1176. Blend with DI.", starred: true, images: [] },
        { id: 110, name: "Fuzz Bass Monster", category: "BASS", daw: "reaper", nam: "NAM Rat Pedal + SVT", ir: "Ampeg 8x10 Mix", notes: "Aggressive grind. High-pass the distortion at 200Hz to protect the sub fundamentals.", starred: true, images: [] },
        { id: 111, name: "Neo-Soul DI Smooth", category: "BASS", daw: "reaper", nam: "None (Neve Preamp)", ir: "None", notes: "No amp. Direct through 610-B or 1073. Boost 60Hz, soft knee compression.", starred: false, images: [] },
        { id: 112, name: "G-Funk Clean Wah", category: "CLEAN", daw: "reaper", nam: "NAM Fender Twin", ir: "Fender 2x12", notes: "Route through an Auto-Wah or Envelope Filter pedal before the amp. Keep the high end tamed.", starred: false, images: [] },
        { id: 113, name: "Boom Bap Upright DI", category: "BASS", daw: "reaper", nam: "Neve 1073", ir: "None", notes: "Mute the strings with your palm. Compress heavily with an 1176. Roll off tone knob to zero.", starred: false, images: [] },
        { id: 114, name: "Aftermath Clean Strat", category: "CLEAN", daw: "reaper", nam: "NAM Roland JC-120", ir: "JC-120 Direct", notes: "Neck pickup. Completely dry. Pluck very hard with fingers for the percussive stab.", starred: false, images: [] }
    ]
};


window.db = JSON.parse(JSON.stringify(defaultDb)); 
window.storageAvailable = false;

try {
    const saved = window.localStorage.getItem('ferrett_os_db_v22.4'); 
    if (saved) {
        const parsed = JSON.parse(saved);
        window.db.tracks = parsed.tracks || [];
        if (parsed.tones && parsed.tones.length > 0) window.db.tones = parsed.tones;
        if (parsed.links && parsed.links.length > 0) { window.db.links = parsed.links; defaultDb.links.forEach(dLink => { if (!window.db.links.find(l => l.url === dLink.url)) window.db.links.push(dLink); }); } 
        else { window.db.links = defaultDb.links; }
        if (parsed.cookbook && parsed.cookbook.length > 0) { window.db.cookbook = parsed.cookbook; }
        else { window.db.cookbook = defaultDb.cookbook; }
        window.db.multiNotes = parsed.multiNotes || [{ id: Date.now(), title: 'Main Scratchpad', content: '' }];
        if (parsed.patchbay) window.db.patchbay = parsed.patchbay;
        if (parsed.patchbayUserDefault) window.db.patchbayUserDefault = parsed.patchbayUserDefault;
        if (parsed.patchbaySaved) window.db.patchbaySaved = parsed.patchbaySaved;
        if (parsed.scripts) window.db.scripts = parsed.scripts;
        if (parsed.refShelf) window.db.refShelf = parsed.refShelf;
        if (parsed.songBoard) window.db.songBoard = parsed.songBoard;
        if (parsed.ownedPlugins) window.db.ownedPlugins = parsed.ownedPlugins;
        // The palette is saved data, so a defaultDb edit never reaches an existing install. UA renamed
        // Verve to Vibe in April 2026 and the DAW now shows the new name, so a saved list still saying
        // "Verve" sends the model a name that is no longer on screen. Rewrite that one entry in place;
        // it keeps both spellings so kits written under either name still resolve.
        // (normPluginName is defined in a later script block, so this compares on a plain trim.)
        window.db.ownedPlugins = (window.db.ownedPlugins || []).map(p =>
            String(p).trim().toLowerCase() === 'verve' ? 'Vibe Analog Machines (formerly Verve)' : p);
        // Same problem for the plugins added to defaultDb on 2026-07-26: a saved palette shadows the
        // default entirely, so they would only ever appear on a fresh install. Union them in ONCE,
        // gated on a revision counter rather than run every load — otherwise a plugin deliberately
        // removed from the palette would silently come back on the next refresh.
        window.db.paletteRev = parsed.paletteRev || 0;
        if (window.db.paletteRev < 1) {
            const have = new Set((window.db.ownedPlugins || []).map(p => String(p).trim().toLowerCase()));
            defaultDb.ownedPlugins.forEach(p => { if (!have.has(String(p).trim().toLowerCase())) window.db.ownedPlugins.push(p); });
            window.db.paletteRev = 1;
        }
        if (parsed.genreKits) window.db.genreKits = parsed.genreKits;
        if (parsed.lyrics) window.db.lyrics = parsed.lyrics;
        if (parsed.accounting) window.db.accounting = parsed.accounting;
    }
    window.storageAvailable = true;
} catch(e) {}

// Reaper/Luna dual-DAW support has been retired — everything is Reaper now.
// Fold any legacy LUNA chain text into the REAPER field and normalize old daw values.
try {
    (window.db.cookbook || []).forEach(r => {
        if (r.luna) { r.reaper = [r.reaper, r.luna].filter(Boolean).join('\n\n'); delete r.luna; }
        (r.history || []).forEach(h => { if (h.luna) { h.reaper = [h.reaper, h.luna].filter(Boolean).join('\n\n'); delete h.luna; } });
    });
    (window.db.tracks || []).forEach(t => { t.daw = 'reaper'; });
    (window.db.tones || []).forEach(t => { t.daw = 'reaper'; });
    (window.db.links || []).forEach(l => { l.daw = 'reaper'; });
} catch(e) {}

window.currentNoteId = window.db.multiNotes[0].id;
window.dbTimeout = null;

// === DRIVE SYNC STATUS BADGE (local-vs-cloud indicator, since the actual upload is debounced/async) ===
window.driveSyncState = 'synced'; // 'synced' | 'unsynced' | 'syncing' | 'conflict' | 'error'
window.renderDriveSyncBadge = () => {
    const btn = document.getElementById('drive-sync-badge'); const dot = document.getElementById('drive-sync-dot'); const label = document.getElementById('drive-sync-label');
    if (!btn || !dot || !label) return;
    if (!window.isDriveConnected) { btn.classList.add('hidden'); btn.classList.remove('flex'); return; }
    btn.classList.remove('hidden'); btn.classList.add('flex');
    const styles = {
        synced:   { border: 'border-[#00FF8850]', bg: 'bg-[#00FF88]/10', text: 'text-[#00FF88]', dot: 'bg-[#00FF88]', pulse: false, label: '✓ SYNCED', title: 'Local matches cloud.' },
        unsynced: { border: 'border-[#FFD60A50]', bg: 'bg-[#FFD60A]/10', text: 'text-[#FFD60A]', dot: 'bg-[#FFD60A]', pulse: false, label: '⚠ NOT SYNCED', title: 'Local changes haven\'t reached Drive yet. Click to sync now.' },
        syncing:  { border: 'border-[#00E5FF50]', bg: 'bg-[#00E5FF]/10', text: 'text-[#00E5FF]', dot: 'bg-[#00E5FF]', pulse: true,  label: '⏳ SYNCING…', title: 'Uploading to Drive…' },
        conflict: { border: 'border-[#FF888850]', bg: 'bg-[#FF8888]/10', text: 'text-[#FF8888]', dot: 'bg-[#FF8888]', pulse: true,  label: '⚠ CONFLICT', title: 'Drive has newer changes than last known. Resolve in the banner above.' },
        error:    { border: 'border-[#FF888850]', bg: 'bg-[#FF8888]/10', text: 'text-[#FF8888]', dot: 'bg-[#FF8888]', pulse: false, label: '⚠ SYNC FAILED', title: 'Last sync attempt failed. Click to retry.' },
    };
    const s = styles[window.driveSyncState] || styles.synced;
    btn.className = `flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all cursor-pointer font-bold text-[9px] tracking-widest uppercase ${s.border} ${s.bg} ${s.text}`;
    dot.className = `w-1.5 h-1.5 rounded-full shrink-0 ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`;
    label.textContent = s.label;
    btn.title = s.title;
    window.renderRescueChip?.();
};

// A rescue copy only exists after the cloud has deliberately replaced local work, and it has to be
// visible for it to be worth anything — a recovery path nobody can find is the same as none.
window.renderRescueChip = () => {
    const host = document.getElementById('drive-sync-badge')?.parentElement; if (!host) return;
    const existing = document.getElementById('drive-rescue-chip');
    const r = window.readRescueCopy?.();
    if (!r) { existing?.remove(); return; }
    const when = new Date(r.savedAt).toLocaleString();
    if (existing) { existing.title = `Local version saved ${when}, replaced by the cloud copy. Click to restore it.`; return; }
    const chip = document.createElement('button');
    chip.id = 'drive-rescue-chip';
    chip.type = 'button';
    chip.className = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all cursor-pointer font-bold text-[9px] tracking-widest uppercase border-[#FF88FF50] bg-[#FF88FF]/10 text-[#FF88FF]';
    chip.textContent = '⤺ RESTORE LOCAL';
    chip.title = `Local version saved ${when}, replaced by the cloud copy. Click to restore it.`;
    chip.addEventListener('click', () => window.restoreRescueCopy());
    host.appendChild(chip);
};
window.setDriveSyncState = (state) => { window.driveSyncState = state; window.renderDriveSyncBadge(); };

// === SESSION STOPWATCH (persisted, pausable — drives the header REC timecode) ===
window.SESSION_KEY = 'ferrett_os_session_v1';
window.loadSessionState = () => {
    try { const raw = window.localStorage.getItem(window.SESSION_KEY); if (raw) { const parsed = JSON.parse(raw); if (typeof parsed.elapsedMs === 'number') return parsed; } } catch (e) {}
    return { elapsedMs: 0, running: true, startedAt: Date.now() };
};
window.sessionState = window.loadSessionState();
window.saveSessionState = () => { try { window.localStorage.setItem(window.SESSION_KEY, JSON.stringify(window.sessionState)); } catch (e) {} };
window.getSessionElapsedMs = () => window.sessionState.running ? window.sessionState.elapsedMs + (Date.now() - window.sessionState.startedAt) : window.sessionState.elapsedMs;
window.toggleSessionTimer = () => {
    if (window.sessionState.running) { window.sessionState.elapsedMs = window.getSessionElapsedMs(); window.sessionState.running = false; window.sessionState.startedAt = null; }
    else { window.sessionState.running = true; window.sessionState.startedAt = Date.now(); }
    window.saveSessionState(); window.updateSessionUI();
};
window.resetSessionTimer = () => {
    if (!confirm('Reset the session timer to 00:00:00:00?')) return;
    window.sessionState.elapsedMs = 0; window.sessionState.startedAt = window.sessionState.running ? Date.now() : null;
    window.saveSessionState();
};
window.updateSessionUI = () => {
    const dot = document.getElementById('hud-rec-dot'); const label = document.getElementById('hud-rec-label'); if (!dot || !label) return;
    if (window.sessionState.running) { dot.style.animation = ''; dot.style.opacity = ''; dot.style.boxShadow = ''; label.textContent = 'REC'; label.style.color = '#FF5A5A'; }
    else { dot.style.animation = 'none'; dot.style.opacity = '0.25'; dot.style.boxShadow = 'none'; label.textContent = 'PAUSED'; label.style.color = 'rgba(226,232,240,0.4)'; }
};

// === SESSION LOG (per-day totals for hours/streak stats — separate from the live elapsed-since-reset timecode) ===
window.SESSION_LOG_KEY = 'ferrett_os_session_log_v1';
window.sessionLog = (() => { try { const raw = window.localStorage.getItem(window.SESSION_LOG_KEY); if (raw) return JSON.parse(raw); } catch (e) {} return {}; })();
window.saveSessionLog = () => { try { window.localStorage.setItem(window.SESSION_LOG_KEY, JSON.stringify(window.sessionLog)); } catch (e) {} };
window.fmtDateKey = (d) => d.toISOString().slice(0, 10);
window.logSessionTime = (deltaMs) => { if (deltaMs <= 0) return; const key = window.fmtDateKey(new Date()); window.sessionLog[key] = (window.sessionLog[key] || 0) + deltaMs; window.saveSessionLog(); };
window.getSessionStats = () => {
    const today = window.fmtDateKey(new Date());
    const todayMs = window.sessionLog[today] || 0;
    let weekMs = 0;
    for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); weekMs += window.sessionLog[window.fmtDateKey(d)] || 0; }
    let streak = 0;
    for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const hasTime = (window.sessionLog[window.fmtDateKey(d)] || 0) > 0;
        if (hasTime) streak++; else if (i === 0) continue; else break;
    }
    return { todayMs, weekMs, streak };
};
window.fmtHoursMins = (ms) => { const totalMin = Math.round(ms / 60000); const h = Math.floor(totalMin / 60); const m = totalMin % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; };
window.renderSessionStats = () => {
    const stats = window.getSessionStats();
    const t = document.getElementById('stat-today'); if (t) t.textContent = window.fmtHoursMins(stats.todayMs);
    const w = document.getElementById('stat-week'); if (w) w.textContent = window.fmtHoursMins(stats.weekMs);
    const s = document.getElementById('stat-streak'); if (s) s.textContent = stats.streak;
    window.updateAppBadge?.(stats);
};

// App icon badge (installed PWA only) — shows today's session minutes as a live badge count.
window.updateAppBadge = (stats) => {
    if (!('setAppBadge' in navigator)) return;
    const mins = Math.round(stats.todayMs / 60000);
    try { if (mins > 0) navigator.setAppBadge(mins); else navigator.clearAppBadge?.(); } catch (e) {}
};

window.saveDataLocally = () => {
    if(!window.storageAvailable) return;
    try { window.localStorage.setItem('ferrett_os_db_v22.4', JSON.stringify(window.db)); const status = document.getElementById('save-status'); if(status) { status.classList.remove('opacity-0'); clearTimeout(window.saveTimeout); window.saveTimeout = setTimeout(() => status.classList.add('opacity-0'), 1500); } } catch(e) { }
};

// markLocalEdit runs whether or not Drive is connected: an edit made offline is exactly the kind
// that used to be lost, so it has to be recorded as pending regardless of the connection state.
//
// The debounce only exists to keep a burst of keystrokes from becoming a burst of uploads. Two
// seconds was long enough that "type a line, lock the phone" reliably lost the race; 500ms still
// collapses a burst but is short enough that a normal pause between edits already pushes.
window.DRIVE_PUSH_DEBOUNCE_MS = 500;
window.saveData = () => { window.saveDataLocally(); window.markLocalEdit?.(); if (window.isDriveConnected) { window.setDriveSyncState('unsynced'); clearTimeout(window.dbTimeout); window.dbTimeout = setTimeout(() => { window.uploadToDrive(window.db); }, window.DRIVE_PUSH_DEBOUNCE_MS); } };

// Even 500ms loses to a screen lock if the lock happens inside the window, and a backgrounded tab
// has its timers throttled or frozen outright, so the pending timer may simply never fire. Pushing
// the moment the page goes away removes the wait instead of shortening it. Nothing here is
// guaranteed to finish — the tab can be killed mid-request — but a dropped request costs nothing:
// syncedRev never advances, so localDirty is still true and the next open pushes it.
window.flushPendingDriveUpload = () => {
    if (!window.isDriveConnected) return;
    if (window.dbTimeout) { clearTimeout(window.dbTimeout); window.dbTimeout = null; }
    if (window.audioDbTimeout) { clearTimeout(window.audioDbTimeout); window.audioDbTimeout = null; window.uploadAudioToDrive?.(); }
    if (!window.hasUnsyncedLocalEdits?.()) return;
    if (window.driveSyncState === 'conflict' || window.driveSyncState === 'syncing') return;
    window.uploadToDrive(window.db);
};

window.setDriveStatus = function(connected) { 
    // Remember that this device has successfully granted the scope at least once, so the next
    // session can ask for a token silently instead of making you tap the button again.
    if (connected) { try { localStorage.setItem(window.DRIVE_AUTOCONNECT_KEY || 'ferrett_os_drive_autoconnect_v1', '1'); } catch (e) {} }
    window.isDriveConnected = connected; const btn = document.getElementById('drive-auth-btn'); const txt = document.getElementById('drive-status-text'); const iconDown = document.getElementById('drive-icon-down'); const iconUp = document.getElementById('drive-icon-up'); 
    if (connected) { btn?.classList.replace('border-[#FF2A2A]', 'border-[#00FF88]'); btn?.classList.replace('bg-[#FF2A2A]/10', 'bg-[#00FF88]/10'); btn?.classList.replace('text-[#FF2A2A]', 'text-[#00FF88]'); btn?.classList.replace('hover:bg-[#FF2A2A]/20', 'hover:bg-[#00FF88]/20'); if(txt) txt.innerText = 'INTEL COMM LINK EST'; iconDown?.classList.add('hidden'); iconUp?.classList.remove('hidden'); }
    else { btn?.classList.replace('border-[#00FF88]', 'border-[#FF2A2A]'); btn?.classList.replace('bg-[#00FF88]/10', 'bg-[#FF2A2A]/10'); btn?.classList.replace('text-[#00FF88]', 'text-[#FF2A2A]'); btn?.classList.replace('hover:bg-[#00FF88]/20', 'hover:bg-[#FF2A2A]/20'); if(txt) txt.innerText = 'INTEL COMMS DOWN'; iconUp?.classList.add('hidden'); iconDown?.classList.remove('hidden'); }
    window.renderDriveSyncBadge?.();
}

// === DRIVE SYNC CONFLICT CHECK ===
// Lightweight last-write-wins guard: before pushing, check the cloud file's modifiedTime
// against the last one we actually saw. A mismatch means it changed elsewhere (another
// device/tab) since we last synced here, so we pause the push and warn instead of overwriting.
window.DRIVE_SYNC_META_KEY = 'ferrett_os_drive_sync_meta_v1';
window.driveSyncMeta = (() => { try { const raw = window.localStorage.getItem(window.DRIVE_SYNC_META_KEY); if (raw) return JSON.parse(raw); } catch (e) {} return { lastKnownModifiedTime: null, localRev: 0, syncedRev: 0 }; })();
if (typeof window.driveSyncMeta.localRev !== 'number') window.driveSyncMeta.localRev = 0;
if (typeof window.driveSyncMeta.syncedRev !== 'number') window.driveSyncMeta.syncedRev = 0;
window.saveDriveSyncMeta = () => { try { window.localStorage.setItem(window.DRIVE_SYNC_META_KEY, JSON.stringify(window.driveSyncMeta)); } catch (e) {} };

// driveSyncState lives in memory, so a reload always came back believing it was 'synced' — even
// when the 2-second upload timer had been killed by the tab closing and local was genuinely ahead
// of the cloud. On a phone that is the normal way a session ends, not an edge case. These two
// counters survive the reload: every local write bumps localRev, every completed sync sets
// syncedRev to match. They disagree if and only if local holds something the cloud has not seen.
window.markLocalEdit = () => { window.driveSyncMeta.localRev = (window.driveSyncMeta.localRev || 0) + 1; window.saveDriveSyncMeta(); };
window.markSynced = () => { window.driveSyncMeta.syncedRev = window.driveSyncMeta.localRev || 0; window.saveDriveSyncMeta(); };
window.hasUnsyncedLocalEdits = () => (window.driveSyncMeta.localRev || 0) !== (window.driveSyncMeta.syncedRev || 0);

// A rescue copy of whatever local held right before the cloud replaced it. Written only on the one
// destructive path (choosing the cloud's side in a genuine both-changed conflict), so it costs a
// duplicate of the vault in localStorage only at the moment it is actually needed, never routinely.
window.DRIVE_RESCUE_KEY = 'ferrett_os_pre_sync_rescue_v1';
window.writeRescueCopy = () => {
    try {
        window.localStorage.setItem(window.DRIVE_RESCUE_KEY, JSON.stringify({ savedAt: Date.now(), db: window.db }));
        return true;
    } catch (e) { return false; } // quota — the caller decides whether to proceed without one
};
window.readRescueCopy = () => { try { const r = window.localStorage.getItem(window.DRIVE_RESCUE_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
window.discardRescueCopy = () => { try { window.localStorage.removeItem(window.DRIVE_RESCUE_KEY); } catch (e) {} };
window.restoreRescueCopy = () => {
    const r = window.readRescueCopy(); if (!r || !r.db) { alert('No rescue copy available.'); return; }
    if (!confirm(`Restore the local version saved ${new Date(r.savedAt).toLocaleString()}?\n\nThis replaces what is on screen now and then pushes it to Drive, so the cloud will match it too.`)) return;
    window.db = r.db;
    window.discardRescueCopy();
    window.saveDataLocally();
    window.markLocalEdit();
    if (window.isDriveConnected) window.uploadToDriveRaw(window.db);
    location.reload();
};
window.pendingSyncDbData = null;
window.showConflictBanner = () => { document.getElementById('drive-conflict-banner')?.classList.remove('hidden'); document.getElementById('drive-conflict-banner')?.classList.add('flex'); };
window.hideConflictBanner = () => { document.getElementById('drive-conflict-banner')?.classList.add('hidden'); document.getElementById('drive-conflict-banner')?.classList.remove('flex'); };

window.findOrPullDriveFile = async function() {
    window.setDriveSyncState('syncing');
    try {
        let res = await gapi.client.drive.files.list({ q: `name='${DRIVE_FILE_NAME}' and trashed=false`, spaces: 'drive', fields: 'files(id, modifiedTime)' });
        if (res.result.files && res.result.files.length > 0) { 
            window.driveFileId = res.result.files[0].id; 
            window.driveSyncMeta.lastKnownModifiedTime = res.result.files[0].modifiedTime; window.saveDriveSyncMeta();
            window.hideConflictBanner(); window.pendingSyncDbData = null;
            let fileRes = await gapi.client.drive.files.get({ fileId: window.driveFileId, alt: 'media' }); 
            let cloudDb = null; 
            if (typeof fileRes.result === 'object' && fileRes.result !== null) { cloudDb = fileRes.result; } else if (typeof fileRes.body === 'string') { cloudDb = JSON.parse(fileRes.body); } 
            if (cloudDb) { 
                window.db.tracks = cloudDb.tracks || []; window.db.tones = cloudDb.tones || defaultDb.tones; window.db.cookbook = cloudDb.cookbook || defaultDb.cookbook;
                if (cloudDb.links) { window.db.links = cloudDb.links; defaultDb.links.forEach(dLink => { if (!window.db.links.find(l => l.url === dLink.url)) window.db.links.push(dLink); }); } else { window.db.links = defaultDb.links; }
                window.db.multiNotes = cloudDb.multiNotes || [{ id: Date.now(), title: 'Main Scratchpad', content: '' }];
                if (cloudDb.patchbay) window.db.patchbay = cloudDb.patchbay;
                if (cloudDb.patchbayUserDefault) window.db.patchbayUserDefault = cloudDb.patchbayUserDefault;
                if (cloudDb.patchbaySaved) window.db.patchbaySaved = cloudDb.patchbaySaved;
                if (cloudDb.scripts) window.db.scripts = cloudDb.scripts;
                if (cloudDb.refShelf) window.db.refShelf = cloudDb.refShelf;
                if (cloudDb.songBoard) window.db.songBoard = cloudDb.songBoard;
                // paletteRev has to travel with the list it describes. Taking a pre-migration palette
                // from the cloud while keeping this device's rev would strand the additions here and
                // never re-run the union; carrying the cloud's rev lets the next load redo it.
                if (cloudDb.ownedPlugins) { window.db.ownedPlugins = cloudDb.ownedPlugins; window.db.paletteRev = cloudDb.paletteRev || 0; }
                if (cloudDb.genreKits) window.db.genreKits = cloudDb.genreKits;
                if (cloudDb.lyrics && (!window.lyrStateHasContent || window.lyrStateHasContent(cloudDb.lyrics) || !window.lyrStateHasContent(window.db.lyrics))) window.db.lyrics = cloudDb.lyrics;
                if (cloudDb.accounting) window.db.accounting = cloudDb.accounting;
                window.saveDataLocally();
                window.markSynced?.(); // local is now a copy of the cloud, so nothing is pending
                if(window.refreshAllUI) window.refreshAllUI();
            }
        }
        try {
            let audioRes = await gapi.client.drive.files.list({ q: `name='${DRIVE_AUDIO_FILE_NAME}' and trashed=false`, spaces: 'drive', fields: 'files(id, modifiedTime)' });
            if (audioRes.result.files && audioRes.result.files.length > 0) {
                window.driveAudioFileId = audioRes.result.files[0].id;
                let audioFileRes = await gapi.client.drive.files.get({ fileId: window.driveAudioFileId, alt: 'media' });
                let cloudClips = null;
                if (typeof audioFileRes.result === 'object' && audioFileRes.result !== null) cloudClips = audioFileRes.result; else if (typeof audioFileRes.body === 'string') cloudClips = JSON.parse(audioFileRes.body);
                if (cloudClips) { for (const [clipId, b64] of Object.entries(cloudClips)) { const numId = parseInt(clipId, 10); await window.audioDbSet(isNaN(numId) ? clipId : numId, b64); } }
            }
        } catch (err) {}
        window.setDriveSyncState('synced');
    } catch (err) { window.setDriveSyncState('error'); }
}

window.uploadToDriveRaw = async function(dbData) {
    if (!window.isDriveConnected) return;
    window.setDriveSyncState('syncing');
    try {
        const file = new Blob([JSON.stringify(dbData)], {type: 'application/json'}); const form = new FormData(); form.append('metadata', new Blob([JSON.stringify({ name: DRIVE_FILE_NAME, mimeType: 'application/json' })], { type: 'application/json' })); form.append('file', file); const token = gapi.client.getToken().access_token; let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime'; let method = 'POST'; if (window.driveFileId) { url = `https://www.googleapis.com/upload/drive/v3/files/${window.driveFileId}?uploadType=multipart&fields=id,modifiedTime`; method = 'PATCH'; } let res = await fetch(url, { method: method, headers: { 'Authorization': 'Bearer ' + token }, body: form }); let jsonRes = await res.json(); if (!window.driveFileId) window.driveFileId = jsonRes.id;
        if (jsonRes.modifiedTime) { window.driveSyncMeta.lastKnownModifiedTime = jsonRes.modifiedTime; window.saveDriveSyncMeta(); }
        window.pendingSyncDbData = null; window.hideConflictBanner();
        window.markSynced?.(); // cloud now holds everything local does
        window.setDriveSyncState('synced');
    } catch (err) { window.setDriveSyncState('error'); }
}

window.uploadToDrive = async function(dbData) {
    if (!window.isDriveConnected) return;
    window.setDriveSyncState('syncing');
    if (window.driveFileId && window.driveSyncMeta.lastKnownModifiedTime) {
        try {
            const meta = await gapi.client.drive.files.get({ fileId: window.driveFileId, fields: 'modifiedTime' });
            if (meta.result && meta.result.modifiedTime && meta.result.modifiedTime !== window.driveSyncMeta.lastKnownModifiedTime) {
                window.pendingSyncDbData = dbData;
                window.showConflictBanner();
                window.setDriveSyncState('conflict');
                return; // hold off overwriting until the person picks a side
            }
        } catch (err) {}
    }
    await window.uploadToDriveRaw(dbData);
}

window.resolveConflictKeepMine = async () => { const data = window.pendingSyncDbData || window.db; window.hideConflictBanner(); await window.uploadToDriveRaw(data); };
window.resolveConflictReloadTheirs = async () => {
    // The only path in the app that deliberately destroys local work, so it is the only one that
    // takes a rescue copy first. If localStorage cannot fit one, say so plainly and let the choice
    // be made with that known — silently overwriting with no way back is what we are fixing.
    const rescued = window.writeRescueCopy();
    const warn = rescued
        ? '\n\nA rescue copy of your local version is being kept — you can restore it afterwards from the sync badge.'
        : '\n\n⚠ There is NOT enough local storage room to keep a rescue copy, so this cannot be undone.';
    if (!confirm('This discards any local changes made since your last sync and reloads the version currently on Drive. Continue?' + warn)) { if (rescued) window.discardRescueCopy(); return; }
    window.hideConflictBanner();
    await window.findOrPullDriveFile();
};

// Ask Google for a token WITHOUT a consent popup. This only succeeds if the account has already
// granted the scope on this device, which is exactly the case we want to make effortless — the
// second and every subsequent session. A first run, a revoked grant or an expired session simply
// does nothing and leaves the Drive button to be tapped, so this can never block startup or throw
// a dialog at you unprompted.
window.DRIVE_AUTOCONNECT_KEY = 'ferrett_os_drive_autoconnect_v1';
window.trySilentDriveConnect = function() {
    try {
        if (window.isDriveConnected || !window.tokenClient) return;
        if (localStorage.getItem(window.DRIVE_AUTOCONNECT_KEY) !== '1') return; // never connected here before
        window.tokenClient.requestAccessToken({ prompt: '' });
    } catch (e) {}
};

// Coming back to a tab that has been sitting open on the MacBook while you worked on the iPad is
// the other half of "seamless" — without this the MacBook keeps showing yesterday's data until it
// is reloaded. Throttled so app-switching on a phone does not fire a request every few seconds.
window.DRIVE_REFOCUS_MIN_MS = 30000;
window.__lastFocusSync = 0;
window.syncOnRefocus = function() {
    if (document.visibilityState !== 'visible' || !window.isDriveConnected) return;
    const now = Date.now();
    if (now - window.__lastFocusSync < window.DRIVE_REFOCUS_MIN_MS) return;
    window.__lastFocusSync = now;
    window.syncWithDrive?.();
};
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { window.flushPendingDriveUpload?.(); return; }
    window.syncOnRefocus();
});
window.addEventListener('focus', () => window.syncOnRefocus());
// pagehide is the last event Android reliably fires before a tab is discarded, and unlike
// visibilitychange it also covers a straight close. Both can fire for one departure; the flush
// is idempotent (the first one clears the timer and marks 'syncing', the second returns early).
window.addEventListener('pagehide', () => window.flushPendingDriveUpload?.());

// === THE ACTUAL SYNC DECISION ===
// Cloud stays the source of truth, but only where that is safe. The old behaviour pulled and
// overwrote unconditionally the moment Drive connected, which is correct in three of the four
// possible states and silently destroys work in the fourth. Reading both sides first costs one
// cheap metadata request and turns that fourth case into a question instead of a loss.
//
//   local clean, cloud unchanged -> nothing to do
//   local clean, cloud moved     -> pull. This is the device-to-device handoff, and it stays silent.
//   local dirty, cloud unchanged -> push. The 2s upload timer that a closing tab killed.
//   local dirty, cloud moved     -> genuinely divergent. Ask, and keep a way back.
window.syncWithDrive = async function() {
    if (!window.isDriveConnected || !window.gapi?.client?.drive) return;
    if (window.driveSyncState === 'conflict') return; // already waiting on an answer
    window.setDriveSyncState('syncing');
    try {
        let cloudModified = null;
        if (!window.driveFileId) {
            const res = await gapi.client.drive.files.list({ q: `name='${DRIVE_FILE_NAME}' and trashed=false`, spaces: 'drive', fields: 'files(id, modifiedTime)' });
            if (res.result.files && res.result.files.length > 0) { window.driveFileId = res.result.files[0].id; cloudModified = res.result.files[0].modifiedTime; }
        } else {
            const meta = await gapi.client.drive.files.get({ fileId: window.driveFileId, fields: 'modifiedTime' });
            cloudModified = meta.result && meta.result.modifiedTime;
        }
        // Nothing on Drive yet — first run on this account. Local is all there is, so it becomes the
        // cloud copy rather than being wiped by an empty one.
        if (!window.driveFileId) { await window.uploadToDriveRaw(window.db); return; }

        const cloudMoved = !!cloudModified && cloudModified !== window.driveSyncMeta.lastKnownModifiedTime;
        const localDirty = window.hasUnsyncedLocalEdits();

        if (!cloudMoved && !localDirty) { window.setDriveSyncState('synced'); return; }
        if (!cloudMoved && localDirty)  { await window.uploadToDriveRaw(window.db); return; }
        if (cloudMoved && !localDirty)  { await window.findOrPullDriveFile(); return; }

        window.pendingSyncDbData = window.db;
        window.showConflictBanner();
        window.setDriveSyncState('conflict');
    } catch (err) { window.setDriveSyncState('error'); }
};

const DRIVE_AUDIO_FILE_NAME = 'FERRETT_OS_AUDIO_CLIPS.json';
window.uploadAudioToDrive = async function() {
    if (!window.isDriveConnected) return;
    try {
        const allClips = await window.audioDbGetAll();
        const file = new Blob([JSON.stringify(allClips)], { type: 'application/json' }); const form = new FormData(); form.append('metadata', new Blob([JSON.stringify({ name: DRIVE_AUDIO_FILE_NAME, mimeType: 'application/json' })], { type: 'application/json' })); form.append('file', file); const token = gapi.client.getToken().access_token; let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'; let method = 'POST'; if (window.driveAudioFileId) { url = `https://www.googleapis.com/upload/drive/v3/files/${window.driveAudioFileId}?uploadType=multipart`; method = 'PATCH'; } let res = await fetch(url, { method: method, headers: { 'Authorization': 'Bearer ' + token }, body: form }); let jsonRes = await res.json(); if (!window.driveAudioFileId) window.driveAudioFileId = jsonRes.id;
    } catch (err) {}
}
window.scheduleAudioDriveSync = () => { if (!window.isDriveConnected) return; clearTimeout(window.audioDbTimeout); window.audioDbTimeout = setTimeout(() => window.uploadAudioToDrive(), 2000); };


window.downloadVaultBackup = () => {
    try {
        const payload = { exportedAt: new Date().toISOString(), source: 'EUTERPE_OS', db: window.db };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url; a.download = `ferrett_vault_backup_${stamp}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
    } catch (e) { alert('Backup failed: ' + e.message); }
};

window.restoreVaultFromFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        let parsed;
        try { parsed = JSON.parse(e.target.result); } catch (err) { alert('That file is not valid JSON.'); return; }
        const incoming = (parsed && parsed.db) ? parsed.db : parsed;
        if (!incoming || typeof incoming !== 'object') { alert('That file does not look like a vault backup.'); return; }
        const looksValid = ['tracks', 'tones', 'links', 'cookbook', 'multiNotes'].some(k => Array.isArray(incoming[k]));
        if (!looksValid) { alert('That file does not look like a vault backup.'); return; }
        if (!confirm('This will REPLACE your current vault with the contents of this backup file. This cannot be undone. Continue?')) return;
        window.db.tracks = incoming.tracks || [];
        window.db.tones = incoming.tones || [];
        window.db.links = incoming.links || [];
        window.db.cookbook = incoming.cookbook || [];
        window.db.multiNotes = incoming.multiNotes || [{ id: Date.now(), title: 'Main Scratchpad', content: '' }];
        if (incoming.patchbay) window.db.patchbay = incoming.patchbay;
        if (incoming.patchbayUserDefault) window.db.patchbayUserDefault = incoming.patchbayUserDefault;
        if (incoming.patchbaySaved) window.db.patchbaySaved = incoming.patchbaySaved;
        if (incoming.scripts) window.db.scripts = incoming.scripts;
        if (incoming.refShelf) window.db.refShelf = incoming.refShelf;
        if (incoming.songBoard) window.db.songBoard = incoming.songBoard;
        if (incoming.ownedPlugins) { window.db.ownedPlugins = incoming.ownedPlugins; window.db.paletteRev = incoming.paletteRev || 0; }
        if (incoming.genreKits) window.db.genreKits = incoming.genreKits;
        if (incoming.lyrics) window.db.lyrics = incoming.lyrics;
        if (incoming.accounting) window.db.accounting = incoming.accounting;
        window.currentNoteId = window.db.multiNotes[0].id;
        window.saveData();
        if (window.refreshAllUI) window.refreshAllUI();
        alert('Vault restored from backup.');
    };
    reader.onerror = () => alert('Could not read that file.');
    reader.readAsText(file);
};

window.compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height; const MAX_WIDTH = 600;
                if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6)); 
            }; img.onerror = error => reject(error);
        };
    });
};

window.renderImagePreviews = (containerId, imgArray, targetArrayName) => {
    const container = document.getElementById(containerId); if(!container) return; container.innerHTML = '';
    imgArray.forEach((b64, index) => {
        const wrapper = document.createElement('div'); wrapper.className = 'flex items-center gap-2';
        wrapper.innerHTML = `<div class="relative inline-block"><img src="${b64}" class="w-16 h-16 object-cover border border-[#00FF8830] rounded cursor-pointer" onclick="window.openImageModalSingle('${b64}')"><button type="button" class="absolute -top-2 -right-2 bg-[#FF2A2A] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold cursor-pointer hover:scale-110 z-10" onclick="window.removeTempImage(${index}, '${targetArrayName}', '${containerId}')">×</button></div>${index < imgArray.length - 1 ? '<span class="text-[#00FF88]/40 font-bold text-[14px]">→</span>' : ''}`;
        container.appendChild(wrapper);
    });
};

// === TONE AUDIO REFERENCE CLIPS (IndexedDB, kept out of the localStorage-backed vault so a big clip can never break a save) ===
window.AUDIO_DB_NAME = 'ferrett_os_audio_v1'; window.AUDIO_STORE = 'clips'; window.AUDIO_MAX_BYTES = 15 * 1024 * 1024; window.AUDIO_MAX_RECORD_SECONDS = 60;

window.openAudioDB = () => new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error('IndexedDB unavailable')); return; }
    const req = indexedDB.open(window.AUDIO_DB_NAME, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(window.AUDIO_STORE)) req.result.createObjectStore(window.AUDIO_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});
window.audioDbGet = async (id) => { try { const db = await window.openAudioDB(); return await new Promise((resolve, reject) => { const tx = db.transaction(window.AUDIO_STORE, 'readonly'); const r = tx.objectStore(window.AUDIO_STORE).get(id); r.onsuccess = () => resolve(r.result || null); r.onerror = () => reject(r.error); }); } catch (e) { return null; } };
window.audioDbSet = async (id, base64) => { try { const db = await window.openAudioDB(); return await new Promise((resolve, reject) => { const tx = db.transaction(window.AUDIO_STORE, 'readwrite'); tx.objectStore(window.AUDIO_STORE).put(base64, id); tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error); }); } catch (e) { return false; } };
window.audioDbDelete = async (id) => { try { const db = await window.openAudioDB(); return await new Promise((resolve, reject) => { const tx = db.transaction(window.AUDIO_STORE, 'readwrite'); tx.objectStore(window.AUDIO_STORE).delete(id); tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error); }); } catch (e) { return false; } };
window.audioDbGetAll = async () => { try { const db = await window.openAudioDB(); return await new Promise((resolve, reject) => { const tx = db.transaction(window.AUDIO_STORE, 'readonly'); const store = tx.objectStore(window.AUDIO_STORE); const out = {}; const req = store.openCursor(); req.onsuccess = (e) => { const cur = e.target.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } else resolve(out); }; req.onerror = () => reject(req.error); }); } catch (e) { return {}; } };

window.tempToneAudio = null; // base64 data URL of the pending clip for the open tone form, or null

window.formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

window.LOCALSTORAGE_SOFT_CAP = 5 * 1024 * 1024; // typical per-origin localStorage ceiling browsers enforce (~5-10MB)

window.computeStorageStats = async () => {
    let vaultBytes = 0, imageBytes = 0, imageCount = 0;
    try {
        const vaultJson = JSON.stringify(window.db);
        vaultBytes = new Blob([vaultJson]).size;
        const collectImages = (arr) => { (arr || []).forEach((item) => { (item.images || []).forEach((b64) => { imageBytes += new Blob([b64]).size; imageCount++; }); }); };
        collectImages(window.db.tracks); collectImages(window.db.tones); collectImages(window.db.cookbook);
    } catch (e) {}
    const textBytes = Math.max(0, vaultBytes - imageBytes);

    let audioBytes = 0, audioCount = 0, orphanedAudioCount = 0;
    let audioClips = {};
    try {
        audioClips = await window.audioDbGetAll();
        const liveToneIds = new Set(window.db.tones.map((t) => t.id));
        Object.entries(audioClips).forEach(([key, b64]) => {
            audioBytes += new Blob([b64]).size; audioCount++;
            const numKey = parseInt(key, 10);
            if (!liveToneIds.has(numKey)) orphanedAudioCount++;
        });
    } catch (e) {}

    let quota = null, usage = null;
    try { if (navigator.storage && navigator.storage.estimate) { const est = await navigator.storage.estimate(); quota = est.quota; usage = est.usage; } } catch (e) {}

    return { vaultBytes, textBytes, imageBytes, imageCount, audioBytes, audioCount, orphanedAudioCount, quota, usage };
};

window.renderStorageBar = (label, usedBytes, capBytes, colorHex) => {
    const pct = capBytes ? Math.min(100, (usedBytes / capBytes) * 100) : 0;
    const barColor = pct > 90 ? '#FF4444' : (pct > 70 ? '#FFD60A' : colorHex);
    return `<div><div class="flex justify-between text-[10px] mb-1"><span class="text-[#E2E8F0]/60 font-bold uppercase tracking-widest">${label}</span><span style="color:${barColor}" class="font-bold">${window.formatBytes(usedBytes)}${capBytes ? ` / ${window.formatBytes(capBytes)}` : ''}</span></div><div class="w-full h-2 rounded bg-black/50 border border-[#E2E8F014] overflow-hidden"><div class="h-full rounded transition-all" style="width:${pct}%;background:${barColor};box-shadow:0 0 8px ${barColor}80;"></div></div></div>`;
};

window.renderVaultStorageMeter = async () => {
    const content = document.getElementById('vault-storage-content'); if (!content) return;
    content.innerHTML = `<div class="text-[#E2E8F0]/40 italic">Calculating...</div>`;
    const stats = await window.computeStorageStats();
    let html = '';
    html += window.renderStorageBar('Vault Data (localStorage — text + images)', stats.vaultBytes, window.LOCALSTORAGE_SOFT_CAP, '#00FF88');
    html += `<div class="text-[10px] text-[#E2E8F0]/40 -mt-3 pl-0.5">↳ ${window.formatBytes(stats.textBytes)} text/notes, ${window.formatBytes(stats.imageBytes)} across ${stats.imageCount} image${stats.imageCount === 1 ? '' : 's'}</div>`;
    html += window.renderStorageBar(`Audio Clips (IndexedDB, ${stats.audioCount} clip${stats.audioCount === 1 ? '' : 's'})`, stats.audioBytes, null, '#00E5FF');
    if (stats.orphanedAudioCount > 0) html += `<div class="text-[10px] text-[#FF8888]">⚠ ${stats.orphanedAudioCount} orphaned clip${stats.orphanedAudioCount === 1 ? '' : 's'} (no matching tone) — safe to clean up.</div>`;
    if (stats.quota) html += window.renderStorageBar('Total Device Storage (this app, browser-reported)', stats.usage || 0, stats.quota, '#FFD60A');
    else html += `<div class="text-[10px] text-[#E2E8F0]/30 italic">Browser doesn't expose total quota here — the two meters above are the numbers that matter.</div>`;
    content.innerHTML = html;
    const cleanupBtn = document.getElementById('btn-cleanup-orphaned-audio'); if (cleanupBtn) cleanupBtn.classList.toggle('hidden', stats.orphanedAudioCount === 0);
};

window.cleanupOrphanedAudio = async () => {
    const stats = await window.computeStorageStats();
    if (stats.orphanedAudioCount === 0) { alert('No orphaned clips found.'); return; }
    if (!confirm(`Delete ${stats.orphanedAudioCount} orphaned audio clip(s) with no matching tone? This can't be undone.`)) return;
    const audioClips = await window.audioDbGetAll();
    const liveToneIds = new Set(window.db.tones.map((t) => t.id));
    const deletions = Object.keys(audioClips).filter((key) => !liveToneIds.has(parseInt(key, 10)));
    for (const key of deletions) { await window.audioDbDelete(parseInt(key, 10) || key); }
    window.scheduleAudioDriveSync();
    window.renderVaultStorageMeter();
};

window.renderAudioPreview = (containerId, base64) => {
    const container = document.getElementById(containerId); if (!container) return;
    if (!base64) { container.innerHTML = `<div class="text-[10px] text-[#E2E8F0]/30 italic">No reference clip attached.</div>`; return; }
    container.innerHTML = `<div class="flex items-center gap-3 flex-wrap"><audio controls src="${base64}" class="h-8 max-w-full"></audio><button type="button" id="btn-remove-tone-audio" class="text-[10px] font-bold text-[#FF8888] hover:text-white">REMOVE CLIP</button></div>`;
    document.getElementById('btn-remove-tone-audio')?.addEventListener('click', () => { window.tempToneAudio = null; window.renderAudioPreview(containerId, null); });
};

window.handleToneAudioUpload = (e) => {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    if (file.size > window.AUDIO_MAX_BYTES) { alert('That clip is over 15MB. Trim it down first, or keep reference clips short (a few seconds is plenty).'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => { window.tempToneAudio = ev.target.result; window.renderAudioPreview('tone-audio-preview-container', window.tempToneAudio); };
    reader.onerror = () => alert('Could not read that audio file.');
    reader.readAsDataURL(file);
    e.target.value = '';
};

window.MEDIA_RECORDER_SUPPORTED = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
window.toneRecorder = null; window.toneRecorderChunks = []; window.toneRecordingStart = null; window.toneRecordingTimer = null;

window.setToneRecordingUI = (isRecording) => {
    document.getElementById('btn-record-tone-audio')?.classList.toggle('hidden', isRecording);
    document.getElementById('btn-stop-tone-audio')?.classList.toggle('hidden', !isRecording);
    const status = document.getElementById('tone-record-status'); if (status) { status.classList.toggle('hidden', !isRecording); if (!isRecording) status.textContent = ''; }
};

window.updateToneRecordingLabel = () => {
    const label = document.getElementById('tone-record-status'); if (!label || !window.toneRecordingStart) return;
    const secs = Math.floor((Date.now() - window.toneRecordingStart) / 1000);
    label.textContent = `● REC 00:${String(secs).padStart(2, '0')}`;
    if (secs >= window.AUDIO_MAX_RECORD_SECONDS) window.stopToneRecording();
};

window.startToneRecording = async () => {
    if (!window.MEDIA_RECORDER_SUPPORTED) { alert('This browser does not support in-browser audio recording. Use + Upload Clip instead.'); return; }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        window.toneRecorderChunks = [];
        const mimeType = (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported('audio/webm')) ? 'audio/webm' : '';
        window.toneRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        window.toneRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) window.toneRecorderChunks.push(e.data); };
        window.toneRecorder.onstop = () => {
            stream.getTracks().forEach((t) => t.stop());
            const blob = new Blob(window.toneRecorderChunks, { type: window.toneRecorder.mimeType || 'audio/webm' });
            const reader = new FileReader();
            reader.onload = () => { window.tempToneAudio = reader.result; window.renderAudioPreview('tone-audio-preview-container', window.tempToneAudio); };
            reader.readAsDataURL(blob);
        };
        window.toneRecorder.start();
        window.toneRecordingStart = Date.now();
        window.setToneRecordingUI(true);
        clearInterval(window.toneRecordingTimer); window.toneRecordingTimer = setInterval(window.updateToneRecordingLabel, 250);
        window.updateToneRecordingLabel();
    } catch (err) {
        alert('Could not access the microphone (permission denied or unavailable).');
    }
};

window.stopToneRecording = () => {
    if (window.toneRecorder && window.toneRecorder.state !== 'inactive') window.toneRecorder.stop();
    clearInterval(window.toneRecordingTimer); window.toneRecordingTimer = null; window.toneRecordingStart = null;
    window.setToneRecordingUI(false);
};

window.removeTempImage = (index, arrayName, containerId) => { 
    if(arrayName === 'track') { window.tempTrackImages.splice(index, 1); window.renderImagePreviews(containerId, window.tempTrackImages, 'track'); }
    else if(arrayName === 'tone') { window.tempToneImages.splice(index, 1); window.renderImagePreviews(containerId, window.tempToneImages, 'tone'); }
    else if(arrayName === 'cookbook') { window.tempCookbookImages.splice(index, 1); window.renderImagePreviews(containerId, window.tempCookbookImages, 'cookbook'); }
};

window.openImageModalSingle = (b64) => {
    const content = document.getElementById('chain-modal-content'); if(!content) return;
    content.innerHTML = `<img src="${b64}" class="max-h-[70vh] object-contain border border-[#00FF8850] rounded shadow-[0_0_20px_rgba(0,255,136,0.2)]">`;
    document.getElementById('chain-modal')?.classList.replace('hidden', 'flex');
};

window.openModalGallery = (type, id) => {
    const item = window.db[type].find(t => t.id === id);
    if (!item || !item.images) return;
    const content = document.getElementById('chain-modal-content'); if(!content) return; content.innerHTML = '';
    item.images.forEach((b64, i) => {
        content.innerHTML += `<img src="${b64}" class="max-h-[75vh] object-contain border border-[#00FF8850] rounded shadow-[0_0_20px_rgba(0,255,136,0.2)]">`;
        if (i < item.images.length - 1) content.innerHTML += `<span class="text-[#00FF88] font-bold text-[30px] md:text-[50px] shrink-0">→</span>`;
    });
    const title = document.getElementById('chain-modal-title');
    if(title) title.innerText = (type === 'cookbook' ? 'RECIPE CHAIN' : (type === 'tones' ? 'PEDALBOARD / RIG' : 'PLUGIN CHAIN'));
    document.getElementById('chain-modal')?.classList.replace('hidden', 'flex');
};

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('close-chain-modal')?.addEventListener('click', () => document.getElementById('chain-modal')?.classList.replace('flex', 'hidden'));
    document.getElementById('drive-auth-btn')?.addEventListener('click', () => { if (!window.isDriveConnected && window.tokenClient) { window.tokenClient.requestAccessToken({prompt: 'consent'}); } else if (!window.tokenClient) { alert("Google Auth script is blocked or still loading. Check your AdBlocker."); } });
    document.getElementById('drive-sync-badge')?.addEventListener('click', () => {
        // Route through the full decision rather than straight to a push: tapping the badge after
        // an edit on another device should be able to PULL, which the old upload-only path could not.
        if (window.driveSyncState === 'unsynced' || window.driveSyncState === 'error' || window.driveSyncState === 'synced') { clearTimeout(window.dbTimeout); window.syncWithDrive(); }
        else if (window.driveSyncState === 'conflict') { document.getElementById('drive-conflict-banner')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
    window.addEventListener('beforeunload', (e) => {
        if (window.isDriveConnected && (window.driveSyncState === 'unsynced' || window.driveSyncState === 'syncing' || window.driveSyncState === 'error')) { e.preventDefault(); e.returnValue = ''; }
    });
    document.getElementById('btn-backup-vault')?.addEventListener('click', () => window.downloadVaultBackup());
    document.getElementById('btn-restore-vault')?.addEventListener('click', () => document.getElementById('restore-vault-input')?.click());
    document.getElementById('restore-vault-input')?.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) window.restoreVaultFromFile(file); e.target.value = ''; });
    document.getElementById('btn-open-vault-modal')?.addEventListener('click', () => { document.getElementById('vault-modal')?.classList.replace('hidden', 'flex'); window.renderVaultStorageMeter(); });
    document.getElementById('close-vault-modal')?.addEventListener('click', () => document.getElementById('vault-modal')?.classList.replace('flex', 'hidden'));
    document.getElementById('vault-modal')?.addEventListener('click', (e) => { if (e.target.id === 'vault-modal') document.getElementById('vault-modal')?.classList.replace('flex', 'hidden'); });
    document.getElementById('btn-refresh-vault-stats')?.addEventListener('click', () => window.renderVaultStorageMeter());
    document.getElementById('btn-cleanup-orphaned-audio')?.addEventListener('click', () => window.cleanupOrphanedAudio());
    document.getElementById('btn-conflict-keep-mine')?.addEventListener('click', () => window.resolveConflictKeepMine());
    document.getElementById('btn-conflict-reload-theirs')?.addEventListener('click', () => window.resolveConflictReloadTheirs());
    document.getElementById('btn-conflict-dismiss')?.addEventListener('click', () => window.hideConflictBanner());

    window.openNavDrawer = () => { document.getElementById('side-nav')?.classList.remove('-translate-x-full'); document.getElementById('nav-backdrop')?.classList.remove('hidden'); document.getElementById('nav-backdrop')?.classList.add('block'); };
    window.closeNavDrawer = () => { document.getElementById('side-nav')?.classList.add('-translate-x-full'); document.getElementById('nav-backdrop')?.classList.add('hidden'); document.getElementById('nav-backdrop')?.classList.remove('block'); };
    window.toggleNavDrawer = () => { document.getElementById('side-nav')?.classList.contains('-translate-x-full') ? window.openNavDrawer() : window.closeNavDrawer(); };
    document.getElementById('btn-toggle-nav')?.addEventListener('click', () => window.toggleNavDrawer());
    document.getElementById('btn-close-nav')?.addEventListener('click', () => window.closeNavDrawer());
    document.getElementById('nav-backdrop')?.addEventListener('click', () => window.closeNavDrawer());
    document.getElementById('side-nav')?.addEventListener('click', (e) => { if (e.target.closest('.nav-btn')) window.closeNavDrawer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.closeNavDrawer(); });

    const quietBtn = document.getElementById('btn-toggle-quiet'); const quietText = document.getElementById('quiet-text'); const quietDot = document.getElementById('quiet-dot');
    quietBtn?.addEventListener('click', () => {
        window.FERRETT_QUIET = !window.FERRETT_QUIET;
        if (window.FERRETT_QUIET) { document.body.classList.add('quiet'); quietBtn.classList.replace('border-[#00FF88]', 'border-[#E2E8F0]/30'); quietBtn.classList.replace('bg-[#00FF88]/10', 'bg-transparent'); quietBtn.classList.replace('text-[#00FF88]', 'text-[#E2E8F0]/50'); quietDot?.classList.replace('bg-[#00FF88]', 'bg-[#E2E8F0]/30'); quietDot?.classList.remove('animate-pulse'); if(quietText) quietText.innerText = 'QUIET'; } 
        else { document.body.classList.remove('quiet'); quietBtn.classList.replace('border-[#E2E8F0]/30', 'border-[#00FF88]'); quietBtn.classList.replace('bg-transparent', 'bg-[#00FF88]/10'); quietBtn.classList.replace('text-[#E2E8F0]/50', 'text-[#00FF88]'); quietDot?.classList.replace('bg-[#E2E8F0]/30', 'bg-[#00FF88]'); quietDot?.classList.add('animate-pulse'); if(quietText) quietText.innerText = 'LIVE'; }
    });

    // Alternate HUD themes — cheap CSS-filter re-tint, cycles default -> amber -> stealth.
    window.HUD_THEMES = ['default', 'theme-amber', 'theme-infrared', 'theme-stealth'];
    window.HUD_THEME_KEY = 'ferrett_os_hud_theme_v1';
    // 'auto' follows the active tab (set by the switchTab wrapper in the add-ons block).
    window.TAB_THEME = { guitars: 'theme-amber', hardware: 'theme-amber', tracks: 'theme-infrared' };
    window.applyHudTheme = (theme) => {
        document.body.classList.remove('theme-amber', 'theme-infrared', 'theme-stealth');
        window.__hudAuto = (theme === 'auto');
        const effective = theme === 'auto' ? (window.TAB_THEME[window.__activeTab] || 'default') : theme;
        if (effective !== 'default') document.body.classList.add(effective);
        try { window.localStorage.setItem(window.HUD_THEME_KEY, theme); } catch (e) {}
    };
    document.getElementById('btn-cycle-theme')?.addEventListener('click', () => {
        let current = 'default'; try { current = window.localStorage.getItem(window.HUD_THEME_KEY) || 'default'; } catch (e) {}
        if (!window.HUD_THEMES.includes(current)) current = 'default';
        const next = window.HUD_THEMES[(window.HUD_THEMES.indexOf(current) + 1) % window.HUD_THEMES.length];
        window.applyHudTheme(next);
    });
    try { window.applyHudTheme(window.localStorage.getItem(window.HUD_THEME_KEY) || 'default'); } catch (e) {}

    // === CLICKABLE TAG PILL SYSTEM ===
    window.currentLinkTag = 'ALL'; window.currentToneTag = 'ALL'; window.currentScriptTag = 'ALL';
    // Generic fallback hash-color for open-ended/freeform tags (cookbook genres,
    // and any script category the user types that isn't in SCRIPT_CATEGORY_COLORS
    // below). Uses a djb2-xor mix instead of the old h*31+c - that old hash
    // clustered badly on the real category names in this app (4 of 11 genres and
    // 3 of 5 link categories all landed on the same pink slot). This one spreads
    // much more evenly across a richer 12-color palette.
    // 18 neon colors spread by hue-stepping plus alternating lightness/saturation
    // bands, tuned so the minimum pairwise RGB distance across the whole set is
    // ~45 (any subset stays >= that). This replaces the old 12-color list, which
    // packed 5 of 12 slots into the cyan/green family and made freeform chips
    // look same-y even without an outright hash collision. The 🔑 color-map
    // panel flags any two chips that land closer than ~42 apart.
    const FALLBACK_PALETTE = ['#EE694F','#82FB6A','#328AE2','#EE4FD3','#FBE36A','#32E28A','#694FEE','#FB6A82','#8AE232','#4FD3EE','#E36AFB','#E28A32','#4FEE69','#6A82FB','#E2328A','#D3EE4F','#6AFBE3','#8A32E2'];
    window.pillColor = (str) => { str = str || ''; let h = 5381; for (let i=0;i<str.length;i++) h = ((h*33) ^ str.charCodeAt(i)) >>> 0; return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length]; };

    // Cookbook genres are freeform, so a plain hash can still collide (with 17
    // genres it repeated some colors 3x and left others unused). Since the genre
    // menu shows every genre at once, assign colors by position in the genre
    // list instead: no two genres share a chip color until the 18-color palette
    // is exhausted. Built once from the full list and reused by the menu, global
    // search, and the command palette so a genre's color is identical everywhere.
    window._genreColorMap = {};
    window.buildGenreColorMap = () => {
        const genres = [...new Set((window.db && window.db.cookbook ? window.db.cookbook : []).map(r => r.genre))];
        const map = {};
        genres.forEach((g, i) => { map[g] = FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]; });
        window._genreColorMap = map;
        return map;
    };
    window.genreColor = (g) => {
        if (!window._genreColorMap || !(g in window._genreColorMap)) window.buildGenreColorMap();
        return window._genreColorMap[g] || window.pillColor(g);
    };

    // Fixed categories get hand-picked, semantically meaningful colors instead of
    // a hash, so the same color always means the same thing across the app:
    //   cyan = AI/tech, gold = tone/amps, pink = vocals/human, violet = rhythm/groove,
    //   green = foundation/build, steel-blue = utility/export, mint = raw material/samples,
    //   amber = mastering/polish, orange = crunch (midpoint warmth), red = distortion/heat.
    const SCRIPT_CATEGORY_COLORS = {
        'AI STEM & MIDI': '#00E5FF',        // AI/extraction -> cyan
        'PROJECT BUILDER': '#00FF88',        // foundation/build -> green
        'VOCAL CHAIN': '#FF6FCB',            // vocals/human -> pink
        'POCKET & MIDI': '#B18CFF',          // rhythm/groove -> violet
        'INTERFACE & TONES': '#FFD60A',      // tone/amps -> gold
        'WORKFLOW & EXPORT': '#7FA8D9',      // utility/export -> steel blue
        'SAMPLING & MIDI GEN': '#C9FF4B',    // generative/creative -> lime
        'TRASH & FX': '#FF5C5C',             // heat/distortion -> red
        'STEM WORKFLOW & QA': '#7AFFBF',     // checking/clean -> mint
        'REFERENCE & UTILITY': '#FFA05C',    // informational -> orange
    };
    window.scriptCategoryColor = (cat) => SCRIPT_CATEGORY_COLORS[cat] || window.pillColor(cat);

    const LINK_CATEGORY_COLORS = {
        'AI & MIDI Extraction': '#00E5FF', // AI/tech -> cyan (matches AI STEM & MIDI)
        'Tones, Amps & IRs': '#FFD60A',    // tone/amps -> gold (matches INTERFACE & TONES)
        'Mixing & Mastering': '#B18CFF',   // polish/final stage -> violet (was amber, too close to the gold above)
        'Samples & Instruments': '#7AFFBF',// raw material -> mint
        'Audio Utilities': '#7FA8D9',      // utility -> steel blue (matches WORKFLOW & EXPORT)
    };
    window.linkCategoryColor = (cat) => LINK_CATEGORY_COLORS[cat] || window.pillColor(cat);

    // Tone categories read as a gain-stage progression: cool/clean -> warm/crunch -> hot/distorted,
    // with bass on its own gold since it's an instrument axis, not a gain stage.
    const TONE_CATEGORY_COLORS = { 'CLEAN': '#00E5FF', 'CRUNCH': '#FFA05C', 'DISTORTION': '#FF5C5C', 'BASS': '#FFD60A' };
    window.toneCategoryColor = (cat) => TONE_CATEGORY_COLORS[cat] || '#00FF88';

    // Brand is free-text (Marshall, Fender, Mesa...) so there's no fixed palette —
    // hash the name to a stable color from the app's palette instead.
    const BRAND_PALETTE = ['#00E5FF', '#00FF88', '#FFD60A', '#FF88FF', '#B18CFF', '#FF5A5A', '#7AFFBF', '#FFA05C'];
    window.toneBrandColor = (name) => { if (!name) return '#7AFFBF'; let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return BRAND_PALETTE[h % BRAND_PALETTE.length]; };

    window.renderTagBarGeneric = (containerId, categories, activeVal, colorFn, onSelect) => {
        const bar = document.getElementById(containerId); if(!bar) return; bar.innerHTML = '';
        const allBtn = document.createElement('button'); const allActive = activeVal === 'ALL';
        allBtn.className = 'px-2.5 py-1 rounded text-[9px] font-bold tracking-widest uppercase border transition-all cursor-pointer';
        allBtn.style.color = allActive ? '#fff' : 'rgba(255,255,255,0.4)'; allBtn.style.borderColor = allActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'; allBtn.style.background = allActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.03)';
        allBtn.innerText = 'ALL TAGS'; allBtn.addEventListener('click', () => onSelect('ALL')); bar.appendChild(allBtn);
        categories.forEach(cat => {
            const c = colorFn(cat); const isActive = activeVal === cat; const btn = document.createElement('button');
            btn.className = 'px-2.5 py-1 rounded text-[9px] font-bold tracking-widest uppercase border transition-all cursor-pointer';
            btn.style.color = c; btn.style.borderColor = isActive ? c : c + '30'; btn.style.background = isActive ? c + '22' : c + '0A'; if (isActive) btn.style.boxShadow = `0 0 10px ${c}30`;
            btn.innerText = cat; btn.title = `Filter by ${cat}`; btn.addEventListener('click', () => onSelect(cat)); bar.appendChild(btn);
        });
    };
    window.setLinkTag = (cat) => { window.currentLinkTag = cat; window.renderLinks(); };
    window.setToneTag = (cat) => { window.currentToneTag = cat; window.renderTones(); };
    window.setScriptTag = (cat) => { window.currentScriptTag = cat; window.renderScripts(); };
    // Jump helper used by the command palette to land on a filtered, tag-scoped list
    window.jumpToTag = (scope, tag) => {
        if (scope === 'tones') { window.switchTab('tones'); window.setToneTag(tag); }
        else if (scope === 'links') { window.switchTab('links'); window.setLinkTag(tag); }
        else if (scope === 'scripts') { window.switchTab('hardware'); window.setScriptTag(tag); }
        else if (scope === 'cookbook') { window.switchTab('cookbook'); window.selectGenre(tag); }
        window.closeCmdk();
    };

    window.allCookbookGenres = () => {
        const known = Object.keys(window.LYRIA_GENRE_META || {}).filter(g => g !== '__default__');
        const fromRecipes = [...new Set((window.db.cookbook || []).map(r => r.genre))];
        return [...new Set([...known, ...fromRecipes])];
    };

    window.renderCookbookMenu = () => {
        const genreMenu = document.getElementById('genre-menu'); const datalist = document.getElementById('cookbook-genre-list');
        if(!genreMenu || !datalist || !window.db.cookbook) return;
        genreMenu.innerHTML = ''; datalist.innerHTML = '';
        const genres = window.allCookbookGenres();
        if (genres.length === 0) return;
        window.buildGenreColorMap();

        const grouped = {};
        genres.forEach(g => {
            const cat = (window.getGenreMeta(g).category || 'UNCATEGORIZED').toUpperCase();
            if(!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(g);
        });

        const sortedCats = Object.keys(grouped).sort();

        const catEmojis = { 'ROCK': '🎸', 'HIP HOP': '🎤', 'METAL': '🤘', 'BLUES': '🎷', 'EDM': '🎛️', 'POP': '🌟', 'COUNTRY': '🤠', 'GENERAL': '🎵' };

        sortedCats.forEach(cat => {
            const catId = cat.replace(/[^a-zA-Z0-9]/g, '-');
            const emoji = catEmojis[cat] || '🎵';
            const header = document.createElement('div');
            header.className = 'text-[11px] font-black tracking-[0.15em] text-[#E2E8F0] uppercase mt-4 mb-2 px-3 py-2.5 bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-between cursor-pointer hover:bg-[#00E5FF]/20 transition-all rounded shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00E5FF]';
            header.setAttribute('role', 'button');
            header.setAttribute('tabindex', '0');
            header.setAttribute('aria-expanded', 'false');
            header.setAttribute('aria-controls', `group-${catId}`);
            header.innerHTML = `<span><span class="mr-2">${emoji}</span>${cat}</span><span class="text-[9px] text-[#00E5FF] transform transition-transform duration-300 rotate-[-90deg]" id="icon-${catId}">▼</span>`;

            const groupContainer = document.createElement('div');
            groupContainer.id = `group-${catId}`;
            groupContainer.className = 'grid transition-all duration-300';
            groupContainer.style.gridTemplateRows = '0fr';
            groupContainer.style.opacity = '0';
            groupContainer.style.pointerEvents = 'none';

            const wrapper = document.createElement('div');
            wrapper.className = 'flex flex-col gap-1 overflow-hidden min-h-0';
            groupContainer.appendChild(wrapper);

            const toggleGroup = () => {
                const isCollapsed = groupContainer.style.gridTemplateRows === '0fr';
                const icon = document.getElementById(`icon-${catId}`);
                if (isCollapsed) {
                    groupContainer.style.gridTemplateRows = '1fr';
                    groupContainer.style.opacity = '1';
                    groupContainer.style.pointerEvents = 'auto';
                    if(icon) icon.style.transform = 'rotate(0deg)';
                    header.setAttribute('aria-expanded', 'true');
                } else {
                    groupContainer.style.gridTemplateRows = '0fr';
                    groupContainer.style.opacity = '0';
                    groupContainer.style.pointerEvents = 'none';
                    if(icon) icon.style.transform = 'rotate(-90deg)';
                    header.setAttribute('aria-expanded', 'false');
                }
            };
            header.addEventListener('click', toggleGroup);
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGroup(); }
            });

            genreMenu.appendChild(header);
            genreMenu.appendChild(groupContainer);

            grouped[cat].forEach(genre => {
                const gc = window.genreColor(genre);
                const btn = document.createElement('button'); btn.className = 'btn-menu shrink-0 w-full text-left pl-4 pr-3 py-2.5 text-[10px] rounded tracking-widest uppercase truncate font-bold border border-transparent transition-colors hover:bg-black/30'; btn.style.color = gc; btn.style.boxShadow = `inset 3px 0 0 ${gc}`; btn.innerText = genre; btn.addEventListener('click', () => window.selectGenre(genre)); wrapper.appendChild(btn);
                const option = document.createElement('option'); option.value = genre; option.innerText = `${cat} - ${genre}`; datalist.appendChild(option);
            });
        });

        if(genres.length > 0 && (!window.currentCookbookGenre || !genres.includes(window.currentCookbookGenre))) window.renderCookbookCover();
        else if(window.currentCookbookGenre) window.selectGenre(window.currentCookbookGenre);
    };

    window.renderCookbookCover = () => {
        const disp = document.getElementById('recipe-display'); if (!disp) return;
        document.getElementById('genre-info-bar')?.classList.add('hidden');
        const genres = window.allCookbookGenres();
        const kitsByGenre = window.db.genreKits || {};
        const total = Object.values(kitsByGenre).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : (arr ? 1 : 0)), 0);
        disp.innerHTML = `<div class="animate-fade-in flex flex-col items-center justify-center text-center py-16 px-4 min-h-[400px]">
            <div class="text-[9px] tracking-[0.35em] text-[#00FF88]/40 mb-4 uppercase">Euterpe Studio // Cookbook</div>
            <h1 class="text-[34px] md:text-[46px] font-black tracking-widest text-[#00FF88] leading-tight mb-3" style="text-shadow:0 0 24px rgba(0,255,136,0.45), 0 0 60px rgba(0,255,136,0.15);">THE ULTIMATE<br>RECIPE BOOK</h1>
            <div class="w-28 h-[2px] bg-gradient-to-r from-transparent via-[#00FF88]/70 to-transparent my-5"></div>
            <div class="text-[10px] tracking-widest text-[#A7DCC3]/60 font-mono mb-8">${genres.length} GENRES &nbsp;·&nbsp; ${total} AI KITS SAVED &nbsp;·&nbsp; YOUR SIGNAL CHAINS, YOUR RULES</div>
            <p class="text-[12px] text-[#E2E8F0]/45 max-w-sm leading-relaxed mb-8">Pick a vibe on the left to dive in — or let the book pick for you.</p>
            <div class="flex flex-wrap gap-3 justify-center">
                <button id="btn-cover-surprise" type="button" class="btn-euterpe px-5 py-2.5 text-[11px]">🎲 SURPRISE ME</button>
                <button id="btn-cover-start" type="button" class="btn-euterpe-green px-5 py-2.5 text-[11px]">📖 START READING</button>
            </div>
        </div>`;
        document.getElementById('btn-cover-surprise')?.addEventListener('click', () => document.getElementById('btn-surprise-cookbook')?.click());
        document.getElementById('btn-cover-start')?.addEventListener('click', () => document.getElementById('genre-menu')?.querySelector('button')?.click());
    };

    window.currentCookbookGenre = null; window.currentCookbookId = null;

    window.selectGenre = (genre) => {
        window.currentCookbookGenre = genre; window.currentCookbookId = null;
        const buttons = document.getElementById('genre-menu')?.querySelectorAll('button') || [];
        for(let btn of buttons) { 
            if(btn.innerText === genre.toUpperCase()) {
                btn.classList.add('active-genre'); 
                // Auto-expand the parent category if it's closed
                const groupContainer = btn.closest('div[id^="group-"]');
                if (groupContainer && groupContainer.style.gridTemplateRows === '0fr') {
                    groupContainer.style.gridTemplateRows = '1fr';
                    groupContainer.style.opacity = '1';
                    groupContainer.style.pointerEvents = 'auto';
                    const iconId = groupContainer.id.replace('group-', 'icon-');
                    const icon = document.getElementById(iconId);
                    if(icon) icon.style.transform = 'rotate(0deg)';
                }
            } else {
                btn.classList.remove('active-genre'); 
            }
        }
        const meta = window.getGenreMeta(genre);
        const bpmReadout = document.getElementById('genre-bpm-readout'); if (bpmReadout) bpmReadout.textContent = `~${meta.bpm[0]}-${meta.bpm[1]} BPM`;
        const obpm = document.getElementById('ai-override-bpm'); if(obpm) { obpm.value = ''; obpm.placeholder = `${meta.bpm[0]}-${meta.bpm[1]}`; }
        const omood = document.getElementById('ai-override-mood'); if(omood) { omood.value = ''; omood.placeholder = meta.mood; }
        const otex = document.getElementById('ai-override-texture'); if(otex) { otex.value = ''; otex.placeholder = meta.texture; }
        // Key and Keep-out have no per-genre default to fall back on, so they just clear.
        const okey = document.getElementById('ai-override-key'); if(okey) okey.value = '';
        const oneg = document.getElementById('ai-override-negative'); if(oneg) oneg.value = '';
        document.getElementById('genre-info-bar')?.classList.remove('hidden');
        const kitBtn = document.getElementById('btn-genre-kit');
        if (kitBtn) { const n = kitHistory(genre).length; kitBtn.textContent = n ? `🤖 KITS (${n})` : '🤖 AI KIT'; kitBtn.title = n ? `${n} saved kit${n===1?'':'s'} for this genre — browse or build another` : 'Build a full per-instrument chain sheet for this genre using only the plugins you own'; }
        // "2. Select Instrument" lists both the AI kit's roles and this genre's hand-written recipes —
        // see renderInstMenu. renderGenreKit refreshes it itself once a kit is on screen; the branches
        // below only cover the cases where there is no kit to render.
        const hist = kitHistory(genre);
        if (hist.length === 0) {
            renderInstMenu(genre, null, null);
            const written = (window.db.cookbook || []).filter(r => r.genre === genre);
            // A genre with typed recipes and no kit is not empty, and must not say it is. Open the
            // first recipe so the pane shows real content instead of an advert for a paid call.
            if (written.length) { window.selectInst(written[0].id); return; }
            const disp = document.getElementById('recipe-display');
            if (disp) disp.innerHTML = `<div class="h-full flex flex-col items-center justify-center gap-4 text-center px-8 border-2 border-dashed border-[#00FF8810] rounded-lg min-h-[400px]">
                <div class="text-[12px] text-[#E2E8F0]/40 tracking-widest uppercase">Nothing here yet.</div>
                <div class="flex gap-2 flex-wrap justify-center">
                    <button id="btn-empty-genre-kit" type="button" class="btn-euterpe" style="border-color:#FF88FF60;color:#FF88FF;background:rgba(255,136,255,0.08);">🤖 AI KIT</button>
                    <button id="btn-empty-genre-recipe" type="button" class="btn-euterpe-green">+ ADD RECIPE</button>
                </div>
            </div>`;
            document.getElementById('btn-empty-genre-kit')?.addEventListener('click', () => document.getElementById('btn-genre-kit')?.click());
            document.getElementById('btn-empty-genre-recipe')?.addEventListener('click', () => document.getElementById('btn-add-cookbook')?.click());
            return;
        }
        const newest = hist[hist.length - 1];
        window.renderGenreKit(genre, { kitId: newest.id });
    };

    window.selectInst = (id) => {
        window.currentCookbookId = id; const buttons = document.getElementById('inst-menu')?.children || [];
        for(let btn of buttons) { if(parseInt(btn.dataset.id, 10) === id) btn.classList.add('active-inst'); else btn.classList.remove('active-inst'); }
        // Kit roles carry their selected state in inline Tailwind classes rather than .active-inst, so
        // the loop above can't unselect them — without this, picking a hand-written recipe leaves the
        // previously-open kit role lit up too and the list shows two selections at once.
        document.querySelectorAll('#inst-menu .kit-inst-btn').forEach(b => b.className = b.className
            .replace('bg-[#FF88FF]/15', '').replace('border-[#FF88FF60]', 'border-transparent').replace(' text-[#FF88FF] ', ' text-[#FF88FF]/60 '));
        const data = window.db.cookbook.find(r => r.id === id); if(!data) return;

        let imagesHtml = '';
        if (data.images && data.images.length > 0) {
            imagesHtml = `<div class="mt-4 p-3 bg-black/40 rounded border border-[#00FF8820]"><div class="text-[9px] text-[#00FF88]/70 tracking-widest mb-3 font-bold uppercase flex items-center gap-2">Signal Chain / Settings</div><div class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide cursor-pointer group" onclick="window.openModalGallery('cookbook', ${data.id})">`;
            data.images.forEach((imgB64, i) => { imagesHtml += `<img src="${imgB64}" class="w-20 h-20 object-cover border border-[#00FF8840] rounded shadow-[0_0_10px_rgba(0,255,136,0.1)] group-hover:border-[#00FF88] transition-colors">`; if (i < data.images.length - 1) imagesHtml += `<span class="text-[#00FF88]/50 font-bold text-[18px] shrink-0">→</span>`; });
            imagesHtml += `</div></div>`;
        }

        const disp = document.getElementById('recipe-display');
        if(disp) disp.innerHTML = `
            <div class="animate-fade-in relative group">
                <div class="absolute top-0 right-0 flex opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 gap-3 z-20 bg-[rgba(10,15,13,0.9)] px-2 py-1 rounded">
                    <button data-id="${data.id}" class="btn-edit-cookbook text-[10px] font-bold text-[#00E5FF] hover:text-white">EDIT</button><button data-id="${data.id}" class="btn-clone-cookbook text-[10px] font-bold text-[#FFD60A] hover:text-white">CLONE</button><button data-id="${data.id}" class="btn-print-cookbook text-[10px] font-bold text-[#A7DCC3] hover:text-white">🖨️ SHEET</button><button data-id="${data.id}" class="btn-recipe-cook text-[10px] font-bold text-[#00E5FF] hover:text-white" title="Step through this chain full-screen">▶ COOK</button><button data-id="${data.id}" class="btn-recipe-checklist text-[10px] font-bold text-[#00FF88] hover:text-white" title="Turn this recipe's chain into a notes checklist">✓ CHECKLIST</button><button data-id="${data.id}" class="btn-export-recipe text-[10px] font-bold text-[#FF88FF] hover:text-white" title="Export / share this recipe">📤 SHARE</button>${data.history && data.history.length ? `<button data-id="${data.id}" class="btn-history-cookbook text-[10px] font-bold text-[#FF88FF] hover:text-white">🕐 HISTORY</button>` : ''}<button data-id="${data.id}" class="btn-del-cookbook text-[10px] font-bold text-[#FF8888] hover:text-white">DEL</button>
                </div>
                <div class="border-b border-[#00FF8820] pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-2 pr-20"><h2 class="text-[16px] md:text-[20px] font-bold tracking-widest text-[#00FF88] uppercase">${data.inst}</h2><div class="flex items-center gap-2 flex-wrap">${data.effort ? `<span class="text-[9px] md:text-[10px] tracking-widest uppercase px-3 py-1.5 rounded border border-[#FFD60A30] text-[#FFD60A] bg-[#FFD60A10]">${data.effort}</span>` : ''}<span class="text-[9px] md:text-[10px] tracking-widest text-[#00E5FF] uppercase bg-[#00E5FF10] px-3 py-1.5 rounded border border-[#00E5FF20]">${data.genre}</span></div></div>
                <p class="text-[11px] md:text-[12px] text-[#A7DCC3]/80 italic mb-8 border-l-2 border-[#00FF8840] pl-4 leading-relaxed font-mono">"${data.desc}"</p>
                <button id="btn-toggle-chain-view" type="button" class="mb-4 text-[9px] font-bold tracking-widest px-2.5 py-1.5 rounded border border-[#FF88FF40] text-[#FF88FF] hover:bg-[#FF88FF]/10 cursor-pointer">🔗 VISUALIZE CHAINS</button>
                <div class="space-y-6">
                    ${(() => {
                        // Same linter the AI kits get. Imported packs and hand-typed recipes both land
                        // here, and neither has ever been checked — a pack downloaded from anywhere is
                        // exactly as likely to have invented a knob as a model is.
                        if (!window.lintFreeText) return '';
                        const bad = [...new Set([...window.lintFreeText(data.reaper), ...window.lintFreeText(data.notes)])];
                        if (!bad.length) return '';
                        const e = (s) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                        return `<div class="p-4 rounded border border-[#FF9E9E40] bg-[#FF9E9E]/[0.07]">
                            <div class="text-[9px] tracking-widest font-bold text-[#FF9E9E] mb-2">🔬 ${bad.length} SETTING${bad.length===1?'':'S'} THAT CAN'T BE DIALLED IN</div>
                            <div class="text-[10px] leading-snug text-[#FFD6D6]/85 font-sans space-y-1">${bad.map(b=>`<div>⚠ ${e(b)}</div>`).join('')}</div>
                        </div>`;
                    })()}
                    <div class="bg-[rgba(5,8,7,0.9)] p-5 rounded border border-[#00FF8830]"><h4 class="text-[#00FF88] text-[10px] font-bold tracking-widest uppercase mb-3 border-b border-[#00FF8814] pb-2 flex items-center gap-2"><span class="bg-[#00FF88] w-1.5 h-1.5 rounded-full"></span> SIGNAL CHAIN</h4><p class="chain-text-view text-[11px] md:text-[12px] text-[#E2E8F0]/90 leading-relaxed font-mono whitespace-pre-wrap">${data.reaper}</p><div class="chain-flow-view hidden">${window.renderChainFlow(data.reaper, '#00FF88')}</div></div>
                    <div class="bg-[rgba(10,15,13,0.9)] p-5 rounded border border-[#E2E8F010]"><h4 class="text-[#E2E8F0]/50 text-[10px] font-bold tracking-widest uppercase mb-3">WORKFLOW & ROUTING NOTES</h4><p class="text-[11px] md:text-[12px] text-[#A7DCC3]/80 leading-relaxed font-mono whitespace-pre-wrap">${data.notes}</p></div>
                    ${data.why ? `<div class="bg-[rgba(255,214,10,0.05)] p-5 rounded border border-[#FFD60A25]"><h4 class="text-[#FFD60A] text-[10px] font-bold tracking-widest uppercase mb-3">💡 Why it works</h4><p class="text-[11px] md:text-[12px] text-[#FFE9A6]/85 leading-relaxed font-mono whitespace-pre-wrap">${data.why}</p></div>` : ''}
                    ${imagesHtml}
                </div>
            </div>
        `;
        document.getElementById('btn-toggle-chain-view')?.addEventListener('click', (e) => {
            const showingFlow = !document.querySelector('#recipe-display .chain-flow-view')?.classList.contains('hidden');
            document.querySelectorAll('#recipe-display .chain-text-view').forEach((el) => el.classList.toggle('hidden', !showingFlow));
            document.querySelectorAll('#recipe-display .chain-flow-view').forEach((el) => el.classList.toggle('hidden', showingFlow));
            e.target.textContent = showingFlow ? '🔗 VISUALIZE CHAINS' : '📝 SHOW TEXT';
        });
    };

    // Parses a chain description into discrete plugin/step "nodes" for the flow-diagram view.
    // Chains are written inconsistently (some use "->" arrows, some are just sentences), so this
    // falls back to sentence-splitting when no arrows are present, on a best-effort basis.
    window.parseChainToNodes = (text) => {
        if (!text) return [];
        let segments = text.split('->').map((s) => s.trim()).filter(Boolean);
        if (segments.length < 2) segments = text.split(/(?<=[.;])\s+/).map((s) => s.trim()).filter(Boolean);
        return segments.map((seg) => {
            const cleaned = seg.replace(/\.$/, '');
            const parenMatch = cleaned.match(/^([^(,.]+)[\s]*[\(,]?(.*)$/);
            const label = parenMatch ? parenMatch[1].trim() : cleaned;
            const detail = parenMatch && parenMatch[2] ? parenMatch[2].replace(/\)$/, '').trim() : '';
            return { label: label || cleaned, detail };
        });
    };

    window.PLUGIN_TOOLTIPS = [
        ['1176', 'FET compressor — fast, punchy, aggressive on transients.'],
        ['LA-2A', 'Optical compressor — slow, smooth, musical leveling.'],
        ['LA-3A', 'Optical compressor — faster/brighter sibling of the LA-2A.'],
        ['Fairchild', 'Vari-mu tube compressor — glue and warmth, vintage mastering staple.'],
        ['Distressor', 'Versatile FET/opto hybrid compressor.'],
        ['dbx 160', 'VCA compressor — punchy, aggressive drum bus classic.'],
        ['API 2500', 'VCA bus compressor — punch and glue, selectable knee/thrust.'],
        ['SSL G-Bus', 'The classic SSL bus compressor — glue for a whole mix or drum bus.'],
        ['SSL E-Channel', 'SSL channel strip — EQ + dynamics in one, punchy British console tone.'],
        ['Manley Variable Mu', 'Tube compressor/limiter with a built-in EQ, gentle and warm.'],
        ['Manley Massive Passive', 'Passive tube EQ — broad, musical, hard to make sound bad.'],
        ['Pultec EQP', 'Passive tube EQ — the classic boost-and-cut-same-frequency trick.'],
        ['Pultec MEQ', 'Passive tube midrange EQ, pairs with the EQP-1A.'],
        ['Pultec HLF', 'Passive tube low-pass/high-pass filter.'],
        ['Neve 1073', 'Classic British preamp/EQ — warm, musical low-end push.'],
        ['API Vision', 'API channel strip — fast, punchy, aggressive American console tone.'],
        ['CHANNEV', 'Hybrid Neve-preamp + 1176-style compressor channel strip.'],
        ['610-A', 'Tube preamp — warm coloration on the way in.'],
        ['Helios Type 69', 'Vintage British preamp/EQ, rock-and-roll character.'],
        ['Avalon', 'Clean, hi-fi tube/solid-state preamp and channel strip.'],
        ['Studer A800', 'Analog tape machine emulation — saturation, wow/flutter, glue.'],
        ['Oxide Tape', 'Tape saturation emulation.'],
        ['Ampex ATR-102', 'Mastering-grade tape machine emulation.'],
        ['Tape Cassette', 'Lo-fi cassette tape emulation — wobble, hiss, character.'],
        ['CHOWTapeModel', 'Free open-source tape saturation/wobble emulation.'],
        ['Vinyl', 'Vinyl record emulation — crackle, wear, warmth.'],
        ['TDR Nova', 'Free dynamic EQ — surgical or musical, extremely flexible.'],
        ['TDR Kotelnikov', 'Free mastering-grade transparent compressor/limiter.'],
        ['Ocean Way Studios Deluxe', 'Convolution reverb suite modeling a famous studio room.'],
        ['Hitsville Chambers', 'Motown-style echo chamber reverb.'],
        ['Capitol Chambers', 'Classic Capitol Studios chamber reverb.'],
        ['Lexicon 224', 'Iconic 80s digital reverb — lush plates and halls.'],
        ['ValhallaSupermassive', 'Huge ambient delay/reverb hybrid — free.'],
        ['NeuralAmpModeler', 'Free neural-network guitar amp/pedal profiler.'],
        ['NadIR', 'Cabinet impulse response (IR) loader.'],
        ['bx_boom', 'Sub-bass/808 generator plugin.'],
        ['bx_blackdist2', 'Aggressive black-box style distortion.'],
        ['bx_yellowdrive', 'Tube-style overdrive.'],
        ['bx_greenscreamer', 'Tube Screamer-style overdrive emulation.'],
        ['Graillon', 'Real-time pitch/formant shifter — robot vocals, T-Pain effect, correction.'],
        ['Melodyne', 'Pitch/time editing tool — vocal tuning and note-level editing.'],
        ['Kontakt', 'Sample-based virtual instrument workstation.'],
        ['HALion Sonic', 'Steinberg sample-based workstation/instrument.'],
        ['Vital', 'Free wavetable synthesizer.'],
        ['Surge XT', 'Free, powerful hybrid synthesizer.'],
        ['Minimoog', 'Classic analog synth emulation — thick monophonic bass/leads.'],
        ['kHs Ladder Filter', 'Resonant analog-style filter — Moog-esque sweeps.'],
        ['kHs Delay', 'Simple, clean delay module.'],
        ['kHs Chorus', 'Modulation chorus effect.'],
        ['kHs Bitcrush', 'Digital degradation/lo-fi crunch effect.'],
        ['kHs Ring Mod', 'Ring modulator — metallic, robotic textures.'],
        ['kHs Reverb', 'Simple algorithmic reverb.'],
        ['kHs', 'Kilohearts snap-in effect module.'],
        ['bx_subfilter', 'Sub-frequency filtering/enhancement tool.'],
        ['bx_cleansweep', 'Utility high/low-pass filter.'],
        ['ReaEQ', 'REAPER stock parametric EQ (free, built-in).'],
        ['ReaComp', 'REAPER stock compressor (free, built-in).'],
        ['ReaXcomp', 'REAPER stock multiband compressor (free, built-in).'],
        ['ReaGate', 'REAPER stock noise gate (free, built-in).'],
        ['ReaDelay', 'REAPER stock delay (free, built-in).'],
        ['ReaPitch', 'REAPER stock pitch shifter (free, built-in).'],
        ['ReaVerbate', 'REAPER stock reverb (free, built-in).'],
        ['JS Decimator', 'REAPER stock bit-crusher/sample-rate reducer script.'],
        ['JS Transient', 'REAPER stock transient shaper script.'],
        ['JS Distortion', 'REAPER stock distortion script.'],
        ['JS Saturation', 'REAPER stock saturation script.'],
        ['JS 1176', 'REAPER stock 1176-style compressor emulation script.']
    ];
    window.pluginTooltip = (label) => {
        const l = (label || '').toLowerCase();
        const hit = window.PLUGIN_TOOLTIPS.find(([key]) => l.includes(key.toLowerCase()));
        return hit ? hit[1] : 'Studio processing step.';
    };

    window.renderChainFlow = (text, color) => {
        const nodes = window.parseChainToNodes(text);
        if (nodes.length === 0) return `<div class="text-[10px] text-[#E2E8F0]/30 italic">Nothing to visualize.</div>`;
        return `<div class="flex items-stretch gap-2 overflow-x-auto pb-2 scrollbar-hide">` + nodes.map((n, i) => `
            <div class="shrink-0 flex items-center gap-2">
                <div class="min-w-[110px] max-w-[160px] rounded border px-3 py-2.5 text-center cursor-help" style="border-color:${color}50;background:${color}10;" title="${window.pluginTooltip(n.label)}">
                    <div class="text-[10px] font-bold tracking-wide leading-tight" style="color:${color};">${n.label}</div>
                    ${n.detail ? `<div class="text-[8px] text-[#E2E8F0]/50 mt-1 leading-snug">${n.detail}</div>` : ''}
                </div>
                ${i < nodes.length - 1 ? `<span style="color:${color}80;" class="text-[16px] font-bold shrink-0">→</span>` : ''}
            </div>`).join('') + `</div>`;
    };

    window.openHistoryModal = (recipe) => {
        const content = document.getElementById('history-modal-content'); if (!content) return;
        const history = recipe.history || [];
        if (history.length === 0) { content.innerHTML = `<div class="text-[10px] text-[#E2E8F0]/30 italic">No previous versions saved yet.</div>`; }
        else {
            content.innerHTML = history.map((h, i) => `
                <div class="p-3 rounded border border-[#FF88FF20] bg-black/40">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[9px] font-bold tracking-widest text-[#FF88FF]/70">${new Date(h.savedAt).toLocaleString()}</span>
                        <button data-recipe-id="${recipe.id}" data-history-idx="${i}" class="btn-restore-history text-[9px] font-bold px-2 py-1 rounded border border-[#00FF8850] text-[#00FF88] hover:bg-[#00FF88]/10 cursor-pointer">↺ RESTORE</button>
                    </div>
                    <div class="text-[10px] text-[#E2E8F0]/60 font-mono line-clamp-2">${(h.reaper || '').slice(0, 90)}${(h.reaper || '').length > 90 ? '…' : ''}</div>
                </div>`).join('');
        }
        const modal = document.getElementById('history-modal'); if (modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
    };
    window.closeHistoryModal = () => { const modal = document.getElementById('history-modal'); if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); } };
    window.restoreHistoryVersion = (recipeId, idx) => {
        const recipe = window.db.cookbook.find((r) => r.id === recipeId); if (!recipe || !recipe.history || !recipe.history[idx]) return;
        if (!confirm('Restore this version? Your current version will be saved into history first.')) return;
        const snapshot = { desc: recipe.desc, reaper: recipe.reaper, notes: recipe.notes, savedAt: Date.now() };
        const restored = recipe.history[idx];
        recipe.desc = restored.desc; recipe.reaper = restored.reaper; recipe.notes = restored.notes;
        recipe.history = [snapshot, ...recipe.history.filter((_, i) => i !== idx)].slice(0, 3);
        window.saveData();
        window.closeHistoryModal();
        window.selectInst(recipeId);
    };
    document.getElementById('close-history-modal')?.addEventListener('click', () => window.closeHistoryModal());
    document.getElementById('history-modal')?.addEventListener('click', (e) => { if (e.target.id === 'history-modal') window.closeHistoryModal(); });
    document.getElementById('history-modal-content')?.addEventListener('click', (e) => { const btn = e.target.closest('.btn-restore-history'); if (btn) window.restoreHistoryVersion(parseInt(btn.dataset.recipeId, 10), parseInt(btn.dataset.historyIdx, 10)); });

    window.printRecipeSheet = (recipe) => {
        const el = document.getElementById('print-sheet-content'); if (!el) return;
        el.innerHTML = `
            <h1>EUTERPE_OS — Session Sheet</h1>
            <div class="meta">${recipe.genre} — printed ${new Date().toLocaleDateString()}</div>
            <h2>${recipe.inst}</h2>
            <p>${recipe.desc || ''}</p>
            <h2>SIGNAL CHAIN</h2>
            <p>${recipe.reaper || ''}</p>
            <h2>WORKFLOW & ROUTING NOTES</h2>
            <p>${recipe.notes || ''}</p>
        `;
        window.print();
    };

    // Gesture: swipe left/right on the recipe display to move between instruments within the current genre.
    window.swipeCookbookInst = (dir) => {
        const buttons = [...document.querySelectorAll('#inst-menu button[data-id]')];
        if (buttons.length < 2) return;
        const idx = buttons.findIndex((b) => parseInt(b.dataset.id, 10) === window.currentCookbookId);
        if (idx === -1) return;
        const nextIdx = (idx + dir + buttons.length) % buttons.length;
        window.selectInst(parseInt(buttons[nextIdx].dataset.id, 10));
        const disp = document.getElementById('recipe-display');
        if (disp) { disp.style.transition = 'opacity 0.12s'; disp.style.opacity = '0.4'; setTimeout(() => { disp.style.opacity = '1'; }, 120); }
    };
    (() => {
        let touchStartX = 0, touchStartY = 0;
        const disp = document.getElementById('recipe-display');
        disp?.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }, { passive: true });
        disp?.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX; const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) window.swipeCookbookInst(dx < 0 ? 1 : -1);
        }, { passive: true });
    })();

    window.importLinksPack = (file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            let incoming;
            try { incoming = JSON.parse(ev.target.result); } catch (e) { alert('That file is not valid JSON.'); return; }
            const list = Array.isArray(incoming) ? incoming : (Array.isArray(incoming.links) ? incoming.links : null);
            if (!list) { alert('Expected a JSON array of links (or a {"links":[...]} object).'); return; }
            const doUpdate = confirm(`This pack has ${list.length} link(s).\n\nOK = UPDATE any that already exist (matched by title) with this new content, and add anything new.\nCancel = only ADD new ones, skip anything that already exists.`);
            const existing = window.db.links || [];
            const keyOf = (l) => (l.title || '').trim().toLowerCase();
            const existingByKey = new Map(existing.map((l) => [keyOf(l), l]));
            let nextId = existing.reduce((max, l) => Math.max(max, l.id || 0), 0) + 1;
            let added = 0, updated = 0, skipped = 0;
            list.forEach((l) => {
                if (!l.title || !l.url) { skipped++; return; }
                const key = keyOf(l);
                const match = existingByKey.get(key);
                if (match) {
                    if (doUpdate) { match.url = l.url || match.url; match.category = l.category || match.category; match.notes = l.notes || match.notes; match.daw = 'reaper'; updated++; }
                    else { skipped++; }
                    return;
                }
                const fresh = { id: nextId++, title: l.title, url: l.url, category: l.category || 'Audio Utilities', daw: 'reaper', notes: l.notes || '' };
                existing.push(fresh); existingByKey.set(key, fresh); added++;
            });
            window.db.links = existing;
            window.saveData();
            window.renderLinks();
            alert(`Added ${added} new link${added === 1 ? '' : 's'}.${updated ? ` Updated ${updated} existing.` : ''}${skipped ? ` Skipped ${skipped}.` : ''}`);
        };
        reader.onerror = () => alert('Could not read that file.');
        reader.readAsText(file);
    };

    document.getElementById('btn-import-links')?.addEventListener('click', () => document.getElementById('links-pack-input')?.click());
    document.getElementById('links-pack-input')?.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) window.importLinksPack(file); e.target.value = ''; });

    // === PATCHBAY / ROUTING DIAGRAM ===
    window.db.patchbay = window.db.patchbay || { devices: [], connections: [] };
    window.db.patchbayUserDefault = window.db.patchbayUserDefault || null;
    window.db.patchbaySaved = window.db.patchbaySaved || [];
    window.patchbayPending = null; // { deviceId, side }
    window.patchbayDrag = null; // { deviceId, offsetX, offsetY }

    window.PORT_OFFSET_Y = 30; window.DEVICE_W = 140; window.DEVICE_H = 60;

    window.renderPatchbay = () => {
        const devicesEl = document.getElementById('patchbay-devices'); const svg = document.getElementById('patchbay-svg');
        if (!devicesEl || !svg) return;
        const pb = window.db.patchbay;
        devicesEl.innerHTML = pb.devices.map((d) => `
            <div class="patchbay-device absolute select-none rounded border-2 border-[#00FF8850] bg-[rgba(5,8,7,0.95)] flex items-center justify-center text-center px-2 cursor-grab" data-device-id="${d.id}" style="left:${d.x}px; top:${d.y}px; width:${window.DEVICE_W}px; height:${window.DEVICE_H}px;">
                <button data-device-id="${d.id}" class="patchbay-del-device absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#FF2A2A] text-white text-[10px] font-bold flex items-center justify-center cursor-pointer z-10">×</button>
                <span class="text-[10px] font-bold text-[#00FF88] break-words pointer-events-none">${d.name}</span>
                <div class="patchbay-port absolute w-3.5 h-3.5 rounded-full bg-[#00E5FF] border-2 border-black cursor-pointer" data-device-id="${d.id}" data-side="left" style="left:-7px; top:${window.PORT_OFFSET_Y - 7}px;"></div>
                <div class="patchbay-port absolute w-3.5 h-3.5 rounded-full bg-[#00E5FF] border-2 border-black cursor-pointer" data-device-id="${d.id}" data-side="right" style="right:-7px; top:${window.PORT_OFFSET_Y - 7}px;"></div>
            </div>`).join('');

        const portPos = (deviceId, side) => {
            const d = pb.devices.find((x) => x.id === deviceId); if (!d) return { x: 0, y: 0 };
            return { x: d.x + (side === 'left' ? 0 : window.DEVICE_W), y: d.y + window.PORT_OFFSET_Y };
        };
        svg.innerHTML = pb.connections.map((c, i) => {
            const p1 = portPos(c.from.deviceId, c.from.side); const p2 = portPos(c.to.deviceId, c.to.side);
            return `<line data-conn-idx="${i}" class="patchbay-line" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#00E5FF" stroke-width="2" style="pointer-events:auto;cursor:pointer;" /><line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="transparent" stroke-width="14" style="pointer-events:auto;cursor:pointer;" data-conn-idx="${i}" class="patchbay-line-hit" />`;
        }).join('');
    };

    window.savePatchbay = () => { window.saveData(); };

    window.addPatchbayDevice = () => {
        const name = prompt('Device name (e.g. "Volt 176", "Sansui Amp", "Pedal 1"):'); if (!name) return;
        const id = Date.now();
        const canvas = document.getElementById('patchbay-canvas');
        const x = 20 + ((window.db.patchbay.devices.length * 60) % 900); const y = 20 + ((window.db.patchbay.devices.length * 45) % 600);
        window.db.patchbay.devices.push({ id, name, x, y });
        window.savePatchbay(); window.renderPatchbay();
    };

    window.deletePatchbayDevice = (id) => {
        window.db.patchbay.devices = window.db.patchbay.devices.filter((d) => d.id !== id);
        window.db.patchbay.connections = window.db.patchbay.connections.filter((c) => c.from.deviceId !== id && c.to.deviceId !== id);
        window.savePatchbay(); window.renderPatchbay();
    };

    window.deletePatchbayConnection = (idx) => {
        window.db.patchbay.connections.splice(idx, 1);
        window.savePatchbay(); window.renderPatchbay();
    };

    // Default studio rig — DAW -> Volt 176 -> Sansui (Tape 1) -> Bose 301, plus the
    // Volt headphone fan-out (Gamma / Xiberia / Samsung) and the wireless DAW -> JIB path.
    // Fresh objects each call so dragging never mutates the template.
    window.getDefaultPatchbay = () => ({
        devices: [
            { id: 90001, name: 'DAW (Reaper)', x: 30,  y: 60 },
            { id: 90002, name: 'Volt 176',          x: 250, y: 240 },
            { id: 90003, name: 'Sansui — Tape 1',   x: 500, y: 60 },
            { id: 90004, name: 'Bose 301 Speakers', x: 740, y: 60 },
            { id: 90005, name: 'The Gammas',         x: 500, y: 190 },
            { id: 90006, name: 'The Xiberias',       x: 500, y: 300 },
            { id: 90007, name: 'Samsung Sound Bar',  x: 500, y: 410 },
            { id: 90008, name: 'Skullcandy JIB (BT)',x: 500, y: 540 },
        ],
        connections: [
            { from: { deviceId: 90001, side: 'right' }, to: { deviceId: 90002, side: 'left' } }, // DAW out -> Volt in
            { from: { deviceId: 90002, side: 'right' }, to: { deviceId: 90003, side: 'left' } }, // Volt TS out -> Sansui Tape 1
            { from: { deviceId: 90003, side: 'right' }, to: { deviceId: 90004, side: 'left' } }, // Sansui -> Bose 301
            { from: { deviceId: 90002, side: 'right' }, to: { deviceId: 90005, side: 'left' } }, // Volt HP -> Gammas
            { from: { deviceId: 90002, side: 'right' }, to: { deviceId: 90006, side: 'left' } }, // Volt HP -> Xiberias
            { from: { deviceId: 90002, side: 'right' }, to: { deviceId: 90007, side: 'left' } }, // Volt HP -> Samsung
            { from: { deviceId: 90001, side: 'right' }, to: { deviceId: 90008, side: 'left' } }, // DAW monitor out -> wireless -> JIB
        ]
    });

    // If the user has saved their own default rig, that takes precedence over the built-in Volt 176 template.
    window.getEffectiveDefaultPatchbay = () => window.db.patchbayUserDefault ? JSON.parse(JSON.stringify(window.db.patchbayUserDefault)) : window.getDefaultPatchbay();

    window.loadDefaultPatchbay = (force) => {
        const hasData = (window.db.patchbay.devices || []).length > 0;
        if (hasData && !force) return false;
        if (hasData && force && !confirm('Replace the current patchbay with your default rig?')) return false;
        window.db.patchbay = window.getEffectiveDefaultPatchbay();
        window.savePatchbay(); window.renderPatchbay();
        return true;
    };

    window.setPatchbayAsDefault = () => {
        if ((window.db.patchbay.devices || []).length === 0) { alert('Nothing to save — add some devices first.'); return; }
        if (!confirm('Save the current patchbay as your default rig? "⟳ LOAD DEFAULT" will load this from now on.')) return;
        window.db.patchbayUserDefault = { devices: JSON.parse(JSON.stringify(window.db.patchbay.devices)), connections: JSON.parse(JSON.stringify(window.db.patchbay.connections)) };
        window.savePatchbay(); window.renderPatchbay();
        alert('Saved as your default rig.');
    };

    window.renderPatchbaySavedList = () => {
        const sel = document.getElementById('patchbay-saved-select'); if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '<option value="">— saved patchbays —</option>' + (window.db.patchbaySaved || []).map((p) => `<option value="${p.id}">${window.escapeHtml(p.name)}</option>`).join('');
        if (cur) sel.value = cur;
    };

    window.savePatchbayAs = () => {
        if ((window.db.patchbay.devices || []).length === 0) { alert('Nothing to save — add some devices first.'); return; }
        const name = prompt('Name this patchbay setup (e.g. "Live Room Rig", "Mobile Rig"):'); if (!name) return;
        const id = Date.now();
        window.db.patchbaySaved = window.db.patchbaySaved || [];
        window.db.patchbaySaved.push({ id, name, devices: JSON.parse(JSON.stringify(window.db.patchbay.devices)), connections: JSON.parse(JSON.stringify(window.db.patchbay.connections)) });
        window.savePatchbay(); window.renderPatchbaySavedList();
        const sel = document.getElementById('patchbay-saved-select'); if (sel) sel.value = id;
    };

    window.loadPatchbaySaved = (id) => {
        const item = (window.db.patchbaySaved || []).find((p) => p.id === id); if (!item) return;
        if (!confirm(`Replace the current patchbay with "${item.name}"?`)) return;
        window.db.patchbay = { devices: JSON.parse(JSON.stringify(item.devices)), connections: JSON.parse(JSON.stringify(item.connections)) };
        window.savePatchbay(); window.renderPatchbay();
    };

    window.deletePatchbaySaved = (id) => {
        const item = (window.db.patchbaySaved || []).find((p) => p.id === id); if (!item) return;
        if (!confirm(`Delete saved patchbay "${item.name}"?`)) return;
        window.db.patchbaySaved = window.db.patchbaySaved.filter((p) => p.id !== id);
        window.savePatchbay(); window.renderPatchbaySavedList();
    };

    (() => {
        const canvas = document.getElementById('patchbay-canvas');
        document.getElementById('btn-patchbay-add-device')?.addEventListener('click', () => window.addPatchbayDevice());
        document.getElementById('btn-patchbay-default')?.addEventListener('click', () => window.loadDefaultPatchbay(true));
        document.getElementById('btn-patchbay-set-default')?.addEventListener('click', () => window.setPatchbayAsDefault());
        document.getElementById('btn-patchbay-clear')?.addEventListener('click', () => { if (confirm('Clear the entire patchbay diagram?')) { window.db.patchbay = { devices: [], connections: [] }; window.savePatchbay(); window.renderPatchbay(); } });
        document.getElementById('btn-patchbay-save-as')?.addEventListener('click', () => window.savePatchbayAs());
        document.getElementById('btn-patchbay-load-saved')?.addEventListener('click', () => { const sel = document.getElementById('patchbay-saved-select'); const id = parseInt(sel?.value, 10); if (id) window.loadPatchbaySaved(id); });
        document.getElementById('btn-patchbay-delete-saved')?.addEventListener('click', () => { const sel = document.getElementById('patchbay-saved-select'); const id = parseInt(sel?.value, 10); if (id) window.deletePatchbaySaved(id); });
        window.renderPatchbaySavedList();
        // Seed the default rig once for an empty patchbay (first run / never populated).
        try { if ((window.db.patchbay.devices || []).length === 0 && !localStorage.getItem('ferrett_patchbay_seeded_v1')) { window.loadDefaultPatchbay(false); localStorage.setItem('ferrett_patchbay_seeded_v1', '1'); } } catch (e) {}

        canvas?.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.patchbay-del-device'); if (delBtn) { window.deletePatchbayDevice(parseInt(delBtn.dataset.deviceId, 10)); return; }
            const line = e.target.closest('.patchbay-line, .patchbay-line-hit'); if (line) { window.deletePatchbayConnection(parseInt(line.dataset.connIdx, 10)); return; }
            const port = e.target.closest('.patchbay-port');
            if (port) {
                const deviceId = parseInt(port.dataset.deviceId, 10); const side = port.dataset.side;
                if (window.patchbayPending && (window.patchbayPending.deviceId !== deviceId || window.patchbayPending.side !== side)) {
                    if (window.patchbayPending.deviceId !== deviceId) {
                        window.db.patchbay.connections.push({ from: window.patchbayPending, to: { deviceId, side } });
                        window.savePatchbay();
                    }
                    window.patchbayPending = null;
                } else {
                    window.patchbayPending = { deviceId, side };
                }
                window.renderPatchbay();
                if (window.patchbayPending) { const activePort = document.querySelector(`.patchbay-port[data-device-id="${window.patchbayPending.deviceId}"][data-side="${window.patchbayPending.side}"]`); activePort?.classList.add('ring-2', 'ring-[#FFD60A]'); activePort?.style.setProperty('background', '#FFD60A'); }
            }
        });

        let dragTarget = null, dragOffsetX = 0, dragOffsetY = 0;
        canvas?.addEventListener('pointerdown', (e) => {
            const deviceEl = e.target.closest('.patchbay-device'); if (!deviceEl || e.target.closest('.patchbay-port, .patchbay-del-device')) return;
            const id = parseInt(deviceEl.dataset.deviceId, 10);
            const d = window.db.patchbay.devices.find((x) => x.id === id); if (!d) return;
            const rect = canvas.getBoundingClientRect();
            dragTarget = d; dragOffsetX = (e.clientX + canvas.scrollLeft - rect.left) - d.x; dragOffsetY = (e.clientY + canvas.scrollTop - rect.top) - d.y;
        });
        canvas?.addEventListener('pointermove', (e) => {
            if (!dragTarget) return;
            const rect = canvas.getBoundingClientRect();
            dragTarget.x = Math.max(0, (e.clientX + canvas.scrollLeft - rect.left) - dragOffsetX);
            dragTarget.y = Math.max(0, (e.clientY + canvas.scrollTop - rect.top) - dragOffsetY);
            window.renderPatchbay();
        });
        const endDrag = () => { if (dragTarget) { window.savePatchbay(); dragTarget = null; } };
        canvas?.addEventListener('pointerup', endDrag);
        canvas?.addEventListener('pointerleave', endDrag);

        window.renderPatchbay();
    })();

    window.importRecipePack = (file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            let incoming;
            try { incoming = JSON.parse(ev.target.result); } catch (e) { alert('That file is not valid JSON.'); return; }
            const list = Array.isArray(incoming) ? incoming : (Array.isArray(incoming.cookbook) ? incoming.cookbook : null);
            if (!list) { alert('Expected a JSON array of recipes (or a {"cookbook":[...]} object).'); return; }
            const doUpdate = confirm(`This pack has ${list.length} recipe(s).\n\nOK = UPDATE any that already exist (matched by genre + instrument) with this new content, and add anything new.\nCancel = only ADD new ones, skip anything that already exists.`);
            const existing = window.db.cookbook || [];
            const keyOf = (r) => `${(r.genre || '').trim().toLowerCase()}|${(r.inst || '').trim().toLowerCase()}`;
            const existingByKey = new Map(existing.map((r) => [keyOf(r), r]));
            let nextId = existing.reduce((max, r) => Math.max(max, r.id || 0), 200) + 1;
            let added = 0, updated = 0, skipped = 0;
            list.forEach((r) => {
                if (!r.genre || !r.inst) { skipped++; return; }
                const key = keyOf(r);
                const match = existingByKey.get(key);
                const chain = [r.reaper, r.luna].filter(Boolean).join('\n\n');
                if (match) {
                    if (doUpdate) { match.desc = r.desc || match.desc; match.reaper = chain || match.reaper; match.notes = r.notes || match.notes; updated++; }
                    else { skipped++; }
                    return;
                }
                const fresh = { id: nextId++, genre: r.genre, inst: r.inst, desc: r.desc || '', reaper: chain, notes: r.notes || '', images: [] };
                existing.push(fresh); existingByKey.set(key, fresh); added++;
            });
            window.db.cookbook = existing;
            window.saveData();
            window.renderCookbookMenu();
            alert(`Added ${added} new recipe${added === 1 ? '' : 's'}.${updated ? ` Updated ${updated} existing.` : ''}${skipped ? ` Skipped ${skipped}.` : ''}`);
        };
        reader.onerror = () => alert('Could not read that file.');
        reader.readAsText(file);
    };

    window.LYRIA_GENRE_META = {
        'TheFerrett': { category: 'HIP HOP', bpm: [85, 95], mood: 'laid-back, truth-telling, self-master cadence', texture: '5-string bass, old drums, gritty underground synths, no strings', desc: 'Centered around electric 5-string bass and dusty basement drum grooves with laid-back truth-telling flows told with the cadence of a self-master. Strict and simple traditional "Verse / Chorus / Verse / Chorus" structure — do not overcomplicate or jumble sections. Verses sound as if Minnesota underground hip-hop (Aesop Rock / Rob Sonic) jammed with a live bass player and drummer in a basement on old gear. The choruses must switch dramatically to be highly melodic and kinda futuristic, backed by massive pop-rock synth walls (similar to Imagine Dragons). CRITICALLY IMPORTANT: Use gritty, abstract synthesizers. NO cinematic strings, NO orchestral elements, NO Disney-movie orchestra. Keep it strictly non-orchestral.' },
        'G-Funk / 90s West Coast': { category: 'HIP HOP', bpm: [92, 98], mood: 'laid-back, sunny, cruising West Coast swagger', texture: 'warm analog synths, funk-driven groove', desc: '1990s West Coast hip-hop characterized by high-pitched, portamento synthesizer melodies (often from a Moog or Prophet), deep slow grooves, female backing vocals, and heavy P-Funk sampling. The rhythm section relies on thick, live-sounding synth basslines and heavy, rolling drum breaks. It often prioritizes a smooth, cinematic, and polished aesthetic over raw underground grit.' },
        'Aftermath / Shady 2000s': { category: 'HIP HOP', bpm: [85, 95], mood: 'moody, cinematic, aggressive polish', texture: 'dry and hard-hitting with minor-key tension', desc: 'Early 2000s mainstream hip-hop defined by Dr. Dre\'s hyper-clean, punchy, and cinematic production style. It features staccato piano or pizzicato string loops, perfectly quantized and deeply equalized drums with massive impact, and a distinct lack of dusty vinyl samples. The mix is wide and commercial, emphasizing crystal-clear separation between the pounding low-end and the orchestral, minor-key tension in the highs.' },
        '80s Def Jam / Arena Rap': { category: 'HIP HOP', bpm: [98, 110], mood: 'loud, brash, rock-fused arena energy', texture: 'distorted, gated reverb, larger-than-life', desc: 'Late 1980s New York hip-hop combining the rebellious energy of heavy metal rock guitar riffs with aggressive, synthesized drum machine loops (typically the Roland TR-808 or DMX). It possesses a loud, brash, stadium-ready aesthetic designed to punch through massive PA systems. The sound heavily utilizes gated reverb on snares and a distinctly raw, DJ-centric scratching element.' },
        'Soul Assassins / Cypress Hill': { category: 'HIP HOP', bpm: [88, 95], mood: 'grimy, hazy, hypnotic', texture: 'muffled, dusty, dissonant', desc: '90s West Coast underground hip-hop known for its psychedelic, dusty, and deeply menacing atmosphere. It is built almost entirely on obscure, dissonant samples, heavy vinyl crackle, and muddy, subsonic bass tones. The grooves are often sluggish, hypnotic, and intentionally unpolished, creating a hazy, paranoid sonic landscape.' },
        'Detroit Horrorcore': { category: 'HIP HOP', bpm: [80, 90], mood: 'dark, sinister, carnival-macabre', texture: 'distorted, pitched-down, eerie', desc: 'Midwest horrorcore characterized by macabre gothic themes, unsettling carnival-esque melodies, and fast-paced, chaotic rhythms. The production utilizes highly distorted, pitched-down, and reversed audio samples to create an eerie, nightmare-inducing texture. Drums are often frantic, heavily compressed, and layered over cinematic string sections or creepy music box loops.' },
        'Early 2000s Southern Bounce': { category: 'HIP HOP', bpm: [138, 148], mood: 'sparse, hyper-punchy, club energy', texture: 'dry 808s, zero reverb, minimalist', desc: 'Southern club rap built on a foundation of minimalist, hyper-punchy TR-808 drum patterns and synthetic, staccato brass or string hits. The production is extremely sparse, leaving massive amounts of empty space in the mix to emphasize the driving, repetitive rhythmic bounce of the 808 sub-bass. It uses almost zero reverb, resulting in a distinctly dry, confrontational, and energetic club sound.' },
        'Southern Soul / Dungeon Family': { category: 'HIP HOP', bpm: [72, 95], mood: 'warm, soulful, gospel-tinged', texture: 'analog warmth, live/programmed hybrid', desc: 'Atlanta-based hip-hop (OutKast, Goodie Mob) that pioneers the blending of analog warmth and live instrumentation with drum machines. It leans heavily into Southern funk, incorporating live guitars, Hammond organs, live bass guitar licks, and soulful, gospel-tinged musicality. The resulting texture is incredibly organic, warm, and deeply musical, separating it from sample-heavy East Coast styles.' },
        'Boom-Bap Kings': { category: 'HIP HOP', bpm: [85, 95], mood: 'dusty, gritty, nostalgic head-nod groove', texture: 'sampled, bit-crushed, vinyl-warm', desc: 'Classic 90s East Coast hip-hop defined by gritty, dusty drum breaks (the \'boom-bap\' rhythm), heavily chopped and flipped jazz or soul vinyl samples, and a raw, unpolished underground feel. The kick drums are deeply filtered and the snares crack with analog saturation, often heavily compressed through an SP-1200 or MPC60. The overall vibe relies on a head-nodding swing and the distinct warmth of 12-bit sampling artifacts.' },
        'Groove Innovators': { category: 'HIP HOP', bpm: [85, 96], mood: 'loose, human, intoxicatingly off-kilter', texture: 'unquantized, wonky, warm', desc: 'Soulquarians-era neo-soul and alternative hip-hop (J Dilla, The Roots) defined by loose, unquantized, human-feeling drum grooves that intentionally push and pull the pocket (the \'Dilla feel\'). The musicality centers on warm, lush jazzy chord progressions played on Fender Rhodes or Moog synthesizers. It completely eschews rigid sequencing in favor of organic micro-timing and a highly emotive, laid-back bounce.' },
        'Underground Vanguards': { category: 'HIP HOP', bpm: [85, 100], mood: 'abrasive, industrial, cerebral, dense', texture: 'glitchy, aggressive, hyper-detailed', desc: 'Experimental, industrial, and highly cerebral alternative hip-hop focusing on abrasive textures, glitchy IDM (Intelligent Dance Music) elements, and dense, complex layering. The beats often subvert traditional 4/4 structures, incorporating distortion, extreme bit-crushing, and unpredictable metallic percussion. It demands a hyper-detailed, avant-garde mix that challenges traditional hip-hop aesthetics.' },
        'The Futurists': { category: 'HIP HOP', bpm: [70, 110], mood: 'futuristic, minimal, alien, bouncy', texture: 'clicky, plucky, synthetic', desc: 'Forward-thinking, minimalist production emphasizing alien synthesizer soundscapes, clicky, unconventional percussion, and unorthodox, bouncing rhythmic structures. It often utilizes heavy digital synthesis, FM basslines, and hyper-clean, spatial mixing techniques. The resulting sound is highly synthetic, futuristic, and sparse, prioritizing strange sonic textures over traditional melodies.' },
        'Wu-Tang Clan / Shaolin Grit': { category: 'HIP HOP', bpm: [85, 95], mood: 'grimy, cinematic, martial-arts mystique', texture: 'dusty, filtered, chopped', desc: 'Mid-90s Staten Island hip-hop defined by ultra-grimy, lo-fi drum loops, vintage soul vocal samples, and esoteric kung-fu movie dialogue snippets. The production (RZA) is famously unpolished, utilizing dissonant piano loops, off-kilter swing, and a dark, cinematic martial-arts mystique. The mix is typically muddy, heavily distorted, and aggressively raw, sounding as if recorded in a concrete basement.' },
        'Miami Bass / 2 Live Electro': { category: 'HIP HOP', bpm: [125, 135], mood: 'high-energy, bass-heavy party vibe', texture: 'booming 808s, bright synths', desc: 'Fast-paced, high-energy Florida party music (typically 125-135 BPM) driven by booming, sustained Roland TR-808 bass kicks and bright, syncopated electro-synth riffs. The drums are aggressively programmed with rapid-fire hi-hat trills and heavy snare hits designed to rattle car subwoofers. The texture is distinctly synthetic, upbeat, and engineered for maximum dancefloor impact.' },
        'Old School Electro-Funk (82-87)': { category: 'HIP HOP', bpm: [108, 118], mood: 'robotic, mechanical, retro-futuristic', texture: 'vocoded, cold, machine-groove', desc: 'Early 1980s hip-hop and dance music defined by robotic rhythms, heavy use of vocoders, and cold, mechanical drum machines (TR-808, Oberheim DMX). It heavily borrows from futuristic, Kraftwerk-inspired synthesizer lines and early synth-pop aesthetics. The sound is highly structured, quantized, and retro-futuristic, capturing the birth of electronic dance music intersecting with rap.' },
        'Memphis Horrorcore / Three 6 Mafia': { category: 'HIP HOP', bpm: [65, 75], mood: 'dark, druggy, menacing, horror-movie', texture: 'pitched-down, wobbly, VHS-grain', desc: '90s Tennessee underground hip-hop defined by its incredibly dark, druggy atmospheres and signature lo-fi cassette tape hiss. The rhythm is driven by heavily distorted TR-808 cowbells, rapid triplet-heavy hi-hats, and massive, sustained sub-bass. The melodies are typically sinister, pitched-down samples of classic soul or horror soundtracks, creating a menacing, hypnotic trance.' },
        'Bay Area Mob Music': { category: 'HIP HOP', bpm: [90, 100], mood: 'bouncy, rubbery, crew energy', texture: 'synth-bass driven, whistly hooks', desc: '90s Northern California hip-hop characterized by rubbery, funky Moog basslines, rolling mid-tempo drum grooves, and distinct, high-pitched synthesizer \'whistle\' hooks. The rhythm relies heavily on live-sounding drum programming mixed with analog synthesizer funk, prioritizing a bouncing, cruising aesthetic. The texture is smooth, synth-heavy, and heavily influenced by 1970s Parliament-Funkadelic.' },
        'Native Tongues / Jazz-Rap Loops': { category: 'HIP HOP', bpm: [85, 95], mood: 'warm, conversational, jazzy', texture: 'live-feel samples, mellow', desc: 'Late 80s and early 90s alternative hip-hop (A Tribe Called Quest, De La Soul) focusing on warm, jazzy chord samples featuring Fender Rhodes, upright acoustic bass, and horn sections. The grooves are laid-back and heavily rhythmic, often layering multiple drum breaks to create a complex but smooth swing. The overall texture is positive, earthy, and distinctly Afrocentric, lacking the aggressive distortion of other East Coast styles.' },
        '__default__': { category: 'GENERAL', bpm: [85, 95], mood: 'classic hip-hop energy', texture: 'boom-bap foundation', desc: 'Standard hip-hop production relying on a solid boom-bap rhythm foundation, fundamental sample chopping, and classic 4/4 rap structures. The drums provide a steady, head-nodding pocket while the melody is typically driven by a flipped soul, funk, or jazz sample. It represents the quintessential, foundational hip-hop sound without leaning into extreme sub-genre specifics.' },

        
        // ROCK
        'Alt Rock / 90s Grunge': { category: 'ROCK', bpm: [110, 130], mood: 'angsty, raw, distorted, dynamic', texture: 'heavy fuzz guitars, loud-quiet-loud dynamics, sludgy bass', desc: 'Inspired by early 90s Seattle grunge, this genre relies on extreme dynamic shifts—quiet, moody verses that explode into massive, distorted choruses. Guitars are thick with fuzz and chorus pedals, bass is gritty and grinding, and drums are recorded raw with heavy room sound and loose snare tuning. It eschews polish for emotional rawness.' },
        'Classic Arena Rock': { category: 'ROCK', bpm: [120, 140], mood: 'triumphant, massive, stadium-ready', texture: 'huge gated drums, screaming guitar solos, wide chorus', desc: 'Big, bold 70s and 80s rock designed to fill stadiums. Features massive, thunderous drum sounds (often using gated reverb), soaring clean vocal harmonies, and highly technical, saturated guitar solos. The mix is extremely wide, glossy, and compressed for maximum radio punch, heavily utilizing chorused guitars and driving eighth-note basslines.' },
        '70s Punk Rock': { category: 'ROCK', bpm: [160, 200], mood: 'rebellious, frantic, anti-establishment', texture: 'buzzsaw guitars, shouting vocals, frantic drums', desc: 'Raw, unpolished 1970s punk rock characterized by breakneck speeds, simple three-chord progressions, and a decidedly anti-commercial aesthetic. The guitars are bright, aggressive, and heavily distorted (often single-coil bridge pickups). Drums are played frantically with lots of crash cymbals, and vocals are shouted rather than sung. The mix should sound like it was recorded live in a dirty basement.' },
        'Post-Rock / Ambient Rock': { category: 'ROCK', bpm: [80, 120], mood: 'cinematic, sprawling, emotional, atmospheric', texture: 'delay-soaked guitars, crescendo dynamics, bowed strings', desc: 'Instrumental-heavy rock focusing on long, sprawling compositions and massive emotional crescendos rather than traditional verse-chorus structures. Guitars are heavily processed with massive hall reverbs and rhythmic delays, creating huge walls of atmospheric sound. The rhythm section is patient and hypnotic, building tension over minutes before exploding into triumphant, distorted climaxes.' },
        'Shoegaze / Dream Pop': { category: 'ROCK', bpm: [90, 120], mood: 'ethereal, swirling, detached, melancholic', texture: 'walls of fuzz, reversed reverb, buried vocals', desc: 'Late 80s and early 90s alternative rock famous for its overwhelming "wall of sound." Guitars are processed through chains of fuzz, chorus, and "reverse reverb" (famously the Yamaha SPX90), creating a swirling, oceanic texture. Vocals are intentionally mixed incredibly low and drenched in reverb, acting as just another textural instrument rather than the focal point. It is hazy, loud, and dreamlike.' },
        '2000s Pop-Punk': { category: 'ROCK', bpm: [150, 180], mood: 'energetic, angst-ridden, catchy, juvenile', texture: 'distorted power chords, pristine vocals, tight drums', desc: 'Hyper-energetic early 2000s pop-punk (Blink-182, Green Day) blending the speed of punk with the pristine, catchy melodies of pop. The guitars are incredibly tight, utilizing thick, scooped-mid distortion on power chords. Drums are relentlessly fast and heavily compressed for maximum punch. Vocals are nasal, perfectly tuned, and completely upfront in the mix.' },
        'Classic Psychedelic Rock': { category: 'ROCK', bpm: [90, 115], mood: 'trippy, swirling, expansive, vintage', texture: 'fuzz faces, tape echo, phasers, backwards tape', desc: 'Late 60s and early 70s rock music aiming to replicate mind-altering experiences. Heavily relies on studio experimentation: backwards guitar solos, extreme panning, tape flanging, and swirling Leslie rotary speakers. The guitar tone is built on vintage fuzz pedals (Fuzz Face) and analog tape echoes. The rhythm section is loose, jazzy, and heavily panned across the stereo field.' },
        'Math Rock / Midwest Emo': { category: 'ROCK', bpm: [120, 160], mood: 'introspective, complex, twinkling, frantic', texture: 'clean tapped guitars, odd time signatures', desc: 'A blend of complex, odd-time-signature rhythmic structures (Math Rock) with the emotional rawness of 90s Midwest Emo. The defining sound is the "twinkly" guitar: clean, compressed Telecasters playing complex, rapidly tapped arpeggios in alternate tunings. Drums are highly technical and syncopated, while the bass provides melodic counterpoint rather than just holding down the root.' },
        'Garage Rock Revival': { category: 'ROCK', bpm: [130, 170], mood: 'raw, energetic, stripped-down, retro', texture: 'lo-fi, room mics, tube overdrive', desc: 'Early 2000s return to the raw basics of 60s rock (The Strokes, The White Stripes). Production is intentionally lo-fi and stripped back, avoiding modern gloss. Guitars are driven through small, cranked tube combos (like Fender Princetons) for a boxy, biting overdrive. Drums are recorded with minimal microphones to capture the trashy sound of the room, and vocals are often distorted through megaphone or telephone filters.' },

        // METAL
        'Modern Djent / Prog Metal': { category: 'METAL', bpm: [130, 170], mood: 'complex, aggressive, mechanical, tight', texture: 'heavily gated, pitch-shifted, syncopated', desc: 'Modern progressive metal defined by hyper-syncopated, heavily palm-muted low-tuned guitar riffs (often 7 or 8 strings). The production is incredibly tight and mechanical, utilizing aggressive noise gates to create stuttering rhythms. Drums are hyper-quantized and sample-replaced for perfect consistency, and ambient, ethereal clean guitars often contrast the brutal low-end.' },
        'Classic Thrash': { category: 'METAL', bpm: [160, 200], mood: 'fast, aggressive, rebellious, relentless', texture: 'scooped mids, rapid alternate picking', desc: '1980s speed and thrash metal characterized by breakneck tempos, relentless double-bass drumming, and rapid alternate-picked guitar riffs. The guitar tone famously features "scooped mids" (high bass, high treble, low midrange) for a jagged, biting sound. The production is raw, aggressive, and highly kinetic, prioritizing speed and aggression over perfection.' },
        'Doom / Sludge Metal': { category: 'METAL', bpm: [40, 80], mood: 'crushing, bleak, monolithic, slow', texture: 'fuzz-drenched, down-tuned, subsonic', desc: 'Incredibly slow, heavy, and oppressive metal. Guitars and basses are tuned absurdly low (often down to A or G) and played through massive walls of vintage Orange and Matamp amplifiers drenched in thick, wooly fuzz. The tempo crawls, giving every single snare hit and cymbal crash massive, tectonic weight. The mix is muddy, subsonic, and completely overwhelming.' },
        'Black Metal': { category: 'METAL', bpm: [140, 220], mood: 'cold, grim, misanthropic, atmospheric', texture: 'tremolo picking, blast beats, lo-fi harshness', desc: 'Scandinavian-style extreme metal prioritizing a "cold" and grim atmosphere over clarity. Guitars use relentless tremolo picking with high-treble, "wasp-swarm" distortion. Drums rely heavily on continuous, exhausting blast beats. The production is historically (and intentionally) terrible—recorded in freezing cabins with cheap microphones to create a harsh, thin, and terrifyingly lo-fi sound.' },
        'Melodic Death Metal': { category: 'METAL', bpm: [150, 190], mood: 'epic, aggressive, triumphant, driving', texture: 'harmonized leads, galloping rhythms', desc: 'The "Gothenburg sound" combining the brutality of death metal with the melodic sensibilities of traditional heavy metal. It is defined by fast, harmonized dual-guitar leads (playing in thirds) soaring over galloping, palm-muted rhythms. Vocals are aggressive (growls or screams), but the instrumental core is highly melodic, driving, and deeply structured.' },
        'Nu-Metal / 2000s Alt Metal': { category: 'METAL', bpm: [90, 110], mood: 'angsty, bouncy, aggressive, rhythmic', texture: 'drop-tuned bounce, turntable scratches', desc: 'Late 90s/early 2000s metal that heavily incorporates hip-hop grooves and alternative rock angst. Built on massively down-tuned, rhythmic, bouncing guitar riffs (often 7-string guitars) rather than complex solos. The rhythm section grooves hard like a rap beat, and the mix frequently incorporates DJ turntable scratches, industrial samples, and highly compressed, punchy drums.' },
        'Symphonic Metal': { category: 'METAL', bpm: [110, 150], mood: 'bombastic, theatrical, epic, orchestral', texture: 'massive choirs, operatic vocals, heavy guitars', desc: 'A bombastic fusion of heavy metal and classical orchestration. The core metal band (distorted guitars, driving bass, double-kick drums) is enveloped by massive, cinematic string sections, brass, and sweeping choirs. Vocals are often operatic (especially female sopranos). The mix is a monumental balancing act, requiring immense width and clarity to fit a full orchestra alongside a heavy metal band.' },
        'Metalcore / 2010s Hardcore': { category: 'METAL', bpm: [130, 180], mood: 'brutal, emotional, breakdown-heavy', texture: 'stuttering chugs, pristine modern polish', desc: 'A fusion of extreme metal and hardcore punk, famous for its dramatic, half-time "breakdowns" designed for mosh pits. The production is pristine, modern, and hyper-polished. Guitars use Tube Screamers to tighten the low end for perfectly synchronized, staccato chugging. Drums are heavily sample-augmented for maximum attack, and vocals alternate between guttural screams and soaring, auto-tuned clean choruses.' },

        // BLUES
        'Texas Blues Rock': { category: 'BLUES', bpm: [90, 115], mood: 'swaggering, gritty, electrified', texture: 'cranked tube amps, biting Stratocaster tone', desc: 'High-energy electrified blues popularized in Texas, built around heavy, driving shuffle grooves and searing electric guitar solos. The tone is famously centered on single-coil guitars pushed through cranked, overdriven tube amplifiers (like a Fender Super Reverb or a Dumble) and Tube Screamer pedals. It balances the soul of traditional blues with the aggression of rock.' },
        'Delta Acoustic': { category: 'BLUES', bpm: [60, 85], mood: 'raw, intimate, swampy, acoustic', texture: 'slide guitar, acoustic resonance, foot-stomps', desc: 'Stripped-down, early 20th-century acoustic blues. Relies heavily on fingerpicking, aggressive acoustic slide guitar (often using a glass or metal bottleneck), and simple foot-stomping percussion. The texture is intimate, muddy, and intensely human, heavily colored by the natural room acoustics and the scraping of strings.' },
        'Chicago Electric Blues': { category: 'BLUES', bpm: [80, 110], mood: 'urban, rolling, amplified, expressive', texture: 'distorted harmonica, walking bass, piano', desc: 'The post-war sound of the blues moving to the city and getting plugged in. Built around a full band: drums, upright or electric bass playing walking lines, piano, and the iconic overdriven sound of a harmonica played through a bullet microphone and a small tube amp. Guitars are electric and cutting, playing call-and-response with the vocals over a rolling shuffle groove.' },
        'British Blues Explosion': { category: 'BLUES', bpm: [100, 130], mood: 'heavy, saturated, loud, virtuoso', texture: 'Marshall stacks, Les Pauls, heavy drumming', desc: '1960s British interpretation of American blues (Cream, early Led Zeppelin, John Mayall). It took the Chicago blues formula and made it exponentially louder and heavier. Defined by the massive, thick tone of humbucker guitars (Les Pauls) driven into cranked Marshall amplifier stacks. The drumming is jazz-influenced but played with rock aggression, creating a loud, saturated, virtuoso power-trio sound.' },
        'Swamp Blues': { category: 'BLUES', bpm: [70, 95], mood: 'lazy, humid, hypnotic, laid-back', texture: 'tremolo guitars, sluggish tempo, echo', desc: 'A laid-back, rhythmic variation of Louisiana blues characterized by a lazy, dragging tempo that feels thick and humid. The signature sound is heavily reliant on electric guitars drenched in pulsating tremolo and slapback echo effects. The grooves are hypnotic and sparse, with minimal percussion and a creeping, voodoo-esque atmosphere.' },
        'Soul Blues / R&B': { category: 'BLUES', bpm: [85, 110], mood: 'smooth, emotive, brassy, sophisticated', texture: 'horn sections, clean Stratocasters, Hammond B3', desc: 'A sophisticated blending of raw blues with the smooth, arranged instrumentation of 60s soul music (Stax/Volt). Features tight, punchy horn sections (trumpet, saxophone), swirling Hammond B3 organs, and pristine, clean rhythm guitars (often Steve Cropper-style Stratocaster playing). The vocals are smooth and deeply emotive, and the groove is incredibly tight and danceable.' },

        // EDM
        'Modern House': { category: 'EDM', bpm: [120, 128], mood: 'driving, euphoric, club-ready', texture: 'four-on-the-floor, sidechained, punchy', desc: 'Quintessential modern club music built on a relentless four-on-the-floor kick drum pattern. Production relies heavily on aggressive sidechain compression (ducking the bass and synths every time the kick hits) to create a pumping, hypnotic groove. Features bright, wide synthesizers, crisp hi-hats, and massive build-ups culminating in a driving bass drop.' },
        'Dubstep / Bass Music': { category: 'EDM', bpm: [140, 150], mood: 'aggressive, chaotic, overwhelming', texture: 'wobble bass, metallic FM synthesis, half-time', desc: 'Heavy, aggressive electronic music anchored by a massive half-time rhythm (snare on beat 3). The defining characteristic is the extreme manipulation of low-frequency oscillators (LFOs) to create aggressive, metallic, and mutating "wobble" basslines, often using complex FM synthesis (like Serum or Massive). The mix is incredibly dense, loud, and engineered to punish subwoofers.' },
        'Trance / Eurodance': { category: 'EDM', bpm: [135, 145], mood: 'euphoric, uplifting, hypnotic, driving', texture: 'supersaw arpeggios, rolling bass, massive reverb', desc: 'Uplifting, high-BPM electronic music designed to induce a hypnotic state on massive dancefloors. The core sonic signature is the "supersaw" synthesizer—multiple detuned sawtooth waves layered together with massive hall reverb to create a massive, sweeping wall of sound. Features rolling 16th-note basslines, huge snare rolls, and long, emotional, chord-driven breakdowns.' },
        'Drum & Bass / Jungle': { category: 'EDM', bpm: [160, 180], mood: 'frantic, rhythmic, futuristic, underground', texture: 'chopped breaks, deep sub-bass, fast tempo', desc: 'High-speed UK electronic music driven by incredibly fast, complex, and heavily chopped drum breaks (famously the "Amen break"). Underneath the frantic, rattling percussion sits a continuous, deep, and smooth sub-bass line. The contrast between the hyper-kinetic treble percussion and the slow, rolling low-end creates a distinct, futuristic groove.' },
        'Techno / Warehouse': { category: 'EDM', bpm: [130, 140], mood: 'dark, industrial, repetitive, driving', texture: 'distorted kicks, minimal, metallic, echoing', desc: 'Dark, minimalist, and highly repetitive electronic music designed for underground warehouses. The sound revolves around a heavy, distorted, and resonant 4/4 kick drum (the "rumble kick") created by heavily processing the kick with reverb and distortion. Melodies are sparse, replacing traditional chords with metallic, atonal synth stabs, industrial percussion, and sweeping white noise.' },
        'Synthwave / Retrowave': { category: 'EDM', bpm: [85, 115], mood: 'nostalgic, neon, cinematic, 80s', texture: 'analog warmth, gated snares, arpeggiators', desc: 'A modern, cinematic love letter to 1980s pop culture, action movies, and video games. Production exclusively mimics vintage analog gear: Roland Juno arpeggios, massive sweeping Moog basslines, and punchy, heavily gated snare drums (LinnDrum). The mix aims for the warmth and slight pitch-instability of VHS tapes and cassette decks.' },
        'Future Bass / Melodic Trap': { category: 'EDM', bpm: [140, 160], mood: 'emotional, huge, bouncing, colorful', texture: 'LFO chords, vocal chops, booming 808s', desc: 'A fusion of trap music rhythms with the lush, emotional chord progressions of pop and trance. The signature sound relies on massive, thick synthesizer chords that "pulse" or "flutter" using complex LFO automation on low-pass filters. The drums feature heavy, sustained 808 sub-kicks and rapid hi-hat rolls, and the melodies are often created by pitch-shifting and chopping human vocal samples.' },
        'Lo-Fi Hip Hop / Chillhop': { category: 'EDM', bpm: [70, 90], mood: 'relaxing, nostalgic, studious, sleepy', texture: 'vinyl crackle, muted highs, jazzy chords', desc: 'Instrumental background music focusing on deep relaxation and nostalgia. The production intentionally degrades the audio: extreme high-frequency roll-offs (muffled sound), heavy vinyl crackle, tape flutter, and background ambient noise (rain, coffee shops). The beats are incredibly laid-back and unquantized, playing simple jazzy piano or guitar loops over soft, dusty drums.' },

        // POP
        'Synth-Pop': { category: 'POP', bpm: [105, 125], mood: 'nostalgic, shimmering, romantic', texture: 'analog warmth, lush pads, tight electronic drums', desc: 'Modern pop music heavily influenced by 1980s aesthetics. Built around lush, sweeping analog synthesizer pads, bouncing arpeggiators, and tight, punchy electronic drum machines (like the LinnDrum or TR-808). The mix is wide, bright, and polished, featuring heavily chorused guitars, gated snares, and smooth, breathy vocal production dripping in reverb.' },
        'Modern Top 40': { category: 'POP', bpm: [95, 115], mood: 'pristine, catchy, radio-optimized', texture: 'crystal clear, heavily processed, punchy', desc: 'Current mainstream pop music characterized by absolute sonic perfection and maximum loudness. Features meticulously tuned and comped vocals (often utilizing creative auto-tune), hybrid acoustic/electronic drum kits, and massive, layered sub-bass. Every element is heavily EQed and compressed to carve out its own distinct frequency space, resulting in a hyper-clean, radio-optimized wall of sound.' },
        '80s City Pop / Vaporwave': { category: 'POP', bpm: [95, 115], mood: 'breezy, luxurious, nostalgic, coastal', texture: 'slap bass, brass hits, lush keys, tape wobble', desc: 'Inspired by 1980s Japanese economic boom music (City Pop) and its modern, slowed-down internet iteration (Vaporwave). Features incredibly slick, jazzy chord progressions, funky slap bass, sparkling Rhodes pianos, and bright brass sections. The mix is luxurious and breezy, often artificially slowed down or saturated with tape modulation to invoke intense nostalgia.' },
        'Indie Pop / Bedroom Pop': { category: 'POP', bpm: [90, 120], mood: 'intimate, quirky, lo-fi, sincere', texture: 'chorus pedals, cheap synths, dry vocals', desc: 'DIY pop music defined by its intimate, unpolished "bedroom" aesthetic. The production embraces limitations: cheap Casio synthesizers, guitars heavily modulated with chorus and vibrato pedals, and simple, dry drum machine loops. Vocals are typically recorded close to the mic with very little reverb, creating a highly personal, whispering, and sincere atmosphere.' },
        'K-Pop / Idol Pop': { category: 'POP', bpm: [115, 135], mood: 'maximalist, hyper-energetic, genre-blending', texture: 'EDM drops, rap verses, massive vocal stacks', desc: 'The absolute extreme of maximalist pop production. K-Pop famously blends multiple genres (hip-hop, EDM, R&B, rock) into a single, hyper-structured song. The production features massive, booming EDM bass drops, complex rap verses, and colossal vocal harmonies (often stacking dozens of voices). The mix is exhaustingly dense, bright, and engineered for high-impact visual performance.' },
        '60s Motown / Brill Building': { category: 'POP', bpm: [100, 130], mood: 'joyful, bouncing, classic, soulful', texture: 'tambourines, upright bass, echo chambers', desc: 'The iconic 1960s Wall of Sound and Motown aesthetic. Built on live, bouncing grooves featuring upright bass, piano, and the distinct, driving 2-and-4 crack of a tambourine and snare hit together. The production relies heavily on bleeding live microphones and massive physical reverb chambers. Vocals are rich, harmonized, and sit perfectly within a dense, mid-heavy mix.' },
        'Hyperpop / PC Music': { category: 'POP', bpm: [130, 180], mood: 'chaotic, metallic, overwhelming, futuristic', texture: 'extreme pitch-shift, clipping, bubblegum synths', desc: 'An extreme, avant-garde exaggeration of 2000s pop and EDM. The sound is highly abrasive, featuring ear-piercingly bright, metallic synthesizers, brutally distorted 808s, and intentional digital clipping. Vocals are pitch-shifted to absurd, chipmunk-like extremes and heavily auto-tuned. It is a chaotic, sensory-overload collision of bubblegum pop melodies and industrial noise.' },

        // COUNTRY
        'Modern Nashville': { category: 'COUNTRY', bpm: [80, 110], mood: 'polished, commercial, storytelling', texture: 'bright acoustics, subtle twang, massive drums', desc: 'Contemporary country music that heavily incorporates pop and arena-rock production techniques. While retaining traditional elements like acoustic guitar, pedal steel, and Telecaster twang, it features massive, rock-style drum programming, thick layered bass, and highly polished, compressed vocals. The mix is wide, bright, and commercially optimized for radio.' },
        'Outlaw Country': { category: 'COUNTRY', bpm: [75, 100], mood: 'gritty, rebellious, unpolished, traditional', texture: 'analog warmth, live band feel, tape saturation', desc: 'A rebellious rejection of polished Nashville sounds, favoring a raw, live-band aesthetic. Features heavy reliance on vintage acoustic instruments, raw electric guitar tones, and organic, unquantized drum performances. The production is decidedly lo-fi and analog, often utilizing tape saturation and natural room reverberation to capture a gritty, traditional, and authentic storytelling atmosphere.' },
        'Bluegrass / Appalachian': { category: 'COUNTRY', bpm: [120, 160], mood: 'fast, traditional, virtuosic, rustic', texture: 'banjo rolls, mandolin chops, upright bass', desc: 'Fast-paced, acoustic string-band music originating from Appalachia. It is entirely acoustic, featuring no drums or electric instruments. The driving rhythm is created by the "chop" of a mandolin and the slapping of an upright bass, while the banjo and fiddle play blindingly fast, syncopated 16th-note melodies. The sound is incredibly raw, bright, and purely acoustic.' },
        '90s Neotraditional Country': { category: 'COUNTRY', bpm: [90, 120], mood: 'boot-stomping, honky-tonk, sincere', texture: 'fiddles, pedal steel, scooped Telecasters', desc: 'The massive, radio-friendly country sound of the 1990s (Garth Brooks, Alan Jackson) that brought traditional honky-tonk instruments back into the mainstream. The mix is heavily defined by soaring, weeping pedal steel guitars, bright fiddles, and "chicken-picked" Fender Telecasters. The drums are punchy and acoustic, and the vocals are rich, deep, and soaked in smooth plate reverb.' },
        'Countrypolitan / Nashville Sound': { category: 'COUNTRY', bpm: [70, 95], mood: 'lush, romantic, sweeping, cinematic', texture: 'string sections, smooth backing vocals, crooning', desc: 'The highly polished 1960s "Nashville Sound" that replaced raw honky-tonk grit with lush pop orchestration. The defining characteristic is the total absence of traditional fiddles and banjos, replaced entirely by smooth, cinematic string sections, sweeping grand pianos, and "ooh/aah" vocal choirs. The lead vocal is delivered in a deep, smooth, crooning style reminiscent of traditional pop standards.' },
        'Alt-Country / Americana': { category: 'COUNTRY', bpm: [85, 115], mood: 'earthy, melancholic, rootsy, alternative', texture: 'tremolo guitars, dusty acoustics, brushes', desc: 'A modern blending of traditional roots music with alternative rock and indie sensibilities. The production is highly organic and earthy, utilizing vintage microphones, dusty acoustic guitars, and drums played softly with brushes rather than sticks. Electric guitars often use tremolo and spring reverb for a slightly twangy, cinematic atmosphere. It prioritizes emotional weight over commercial polish.' }
    };

    window.getGenreMeta = (genre) => window.LYRIA_GENRE_META[genre] || window.LYRIA_GENRE_META['__default__'];
    window.getGenreBpmMid = (genre) => { const m = window.getGenreMeta(genre); return Math.round((m.bpm[0] + m.bpm[1]) / 2); };

    // ==================== KNOWN PLUGIN CONTROL SETS ====================
    // ownedPlugins constrains WHICH plugins the AI may name. It says nothing about what knobs those
    // plugins have — so the AI would happily hand back an LA-2A attack time or a Pultec MEQ-5 dip at
    // 400Hz. Both read as authoritative and neither exists, which you only discover once you're sat
    // in front of the plugin trying to dial it in.
    //
    // Hardware emulations are the worst offenders, because their control set is the HARDWARE's — often
    // just two knobs, often stepped to a fixed list of frequencies rather than a continuous sweep.
    // Anything listed below gets stated to the model as fact so it can't guess; anything NOT listed
    // falls under the describe-the-move rule in kitSysPrompt. Deliberately kept to gear whose real
    // controls are certain — a wrong entry here would be the same bug with more authority behind it.
    window.PLUGIN_CONTROLS = [
        { match: /teletronix|\bLA-?2A?\b|6176/i, name: 'Teletronix LA-2A (all variants)',
          text: 'Peak Reduction, Gain, and a Compress/Limit switch. That is the ENTIRE control set. It has no attack, no release, no ratio, no threshold, no knee — the timing is fixed and program-dependent. Specify it as an amount of Peak Reduction and the resulting gain reduction in dB, nothing else.' },
        { match: /\bLA-?3A\b/i, name: 'UA LA-3A',
          text: 'Peak Reduction, Gain, Compress/Limit switch. Like the LA-2A it has no attack, release or ratio control.' },
        // No \b after the digits: "1176AE" and "1176LN Rev E" have a word character straight after
        // the number, so \b1176\b silently misses two of the three variants. 6176 is in here too
        // because the LA-6176's compressor section is an 1176 (its opto half hits the LA-2A entry).
        { match: /1176|6176/i, name: 'UA 1176 (Rev A, Rev E/LN, 1176AE)',
          text: 'Input, Output, Attack, Release, and ratio buttons at 4:1 / 8:1 / 12:1 / 20:1 (holding several in at once is "all-buttons" mode). There is NO threshold knob — you set how hard it works with Input. Attack and Release are numbered 1-7 dials, and they are REVERSED: 7 is fastest, 1 is slowest. Never give an 1176 attack or release in milliseconds; give the dial position or just "fastest"/"slowest".' },
        { match: /EQP-?1A/i, name: 'Pultec EQP-1A',
          text: 'Low Boost and Low Atten share one stepped frequency selector: 20, 30, 60 or 100 Hz — no other value exists. High Boost frequency is stepped 3, 4, 5, 8, 10, 12 or 16 kHz. High Atten frequency is stepped 5, 10 or 20 kHz. The Boost/Atten dials are 0-10, NOT calibrated in dB, so ask for "Low Boost to about 4" rather than "+3dB". Bandwidth is a continuous Sharp-to-Broad knob affecting the high boost only (NEVER call this Q, Pultecs do not have a Q control).' },
        { match: /MEQ-?5/i, name: 'Pultec MEQ-5',
          text: 'Three stepped bands and nothing else. Low Peak: 200, 300, 500, 700 or 1000 Hz. Dip: 200, 300, 500, 700, 1k, 1.5k, 2k, 3k, 4k, 5k or 7k Hz. High Peak: 1.5k, 2k, 3k, 4k or 5k Hz. The boost/atten dials are 0-10, not dB. Any frequency not on those lists is unreachable.' },
        { match: /HLF-?3C/i, name: 'Pultec HLF-3C',
          text: 'Filters only — it cannot boost or cut a band at all. High-pass stepped at 50, 80, 100, 150, 200, 300 or 500 Hz; low-pass stepped at 1.5k, 3k, 4k, 5k, 8k, 10k, 12k, 15k or 20 kHz, each with a slope switch. There is no gain control of any kind.' },
        { match: /fairchild/i, name: 'Fairchild 660 / 670',
          text: 'Input Gain, Threshold, and a six-position Time Constant selector (each position is a fixed attack/release pair — quote the position number, never a millisecond value). No ratio control, no attack or release knob. The 670 adds a Lat/Vert (mid-side) vs Left/Right mode switch.' },
        { match: /dbx.?160/i, name: 'UA dbx 160',
          text: 'Threshold, Compression (ratio) and Output Gain. Three knobs. Attack and release are fixed and program-dependent — it has no control for either.' },
        { match: /distressor/i, name: 'Empirical Labs Distressor',
          text: 'Input, Output, Attack, Release, ratio buttons at 1:1, 2, 3, 4, 6, 10, 20 and Nuke, a Detector HP/HP2 switch, and Dist 2 / Dist 3 / British Mode buttons. Attack and Release are 1-10 dials — do NOT state them in milliseconds.' },
        { match: /api.?2500/i, name: 'API 2500',
          text: 'Threshold and Make-Up are continuous. Ratio is stepped: 1.5:1, 2:1, 3:1, 4:1, 6:1, 10:1, and Infinity:1. Attack is a 7-position switch: 0.03, 0.1, 0.3, 1, 3, 10, or 30 ms. Release is a 7-position switch: 0.05, 0.1, 0.2, 0.5, 1, 2, or 3 sec, plus an Auto mode. Also Thrust (Norm/Med/Loud), Type (Old/New), Knee (Soft/Med/Hard) and Mix.' },
        { match: /ssl.?g.?bus|g.?bus.?comp/i, name: 'SSL G-Bus Compressor',
          text: 'Everything except Threshold and Make-Up is a stepped switch. Ratio: 2:1, 4:1 or 10:1 only. Attack: 0.1, 0.3, 1, 3, 10 or 30 ms only. Release: 0.1, 0.3, 0.6, 1.2 s or Auto only. Any other attack, release or ratio figure is unreachable.' },
        { match: /ssl.?e.?channel|e.?channel.?strip/i, name: 'SSL E Channel Strip',
          text: 'Compressor: Threshold, Ratio (continuous), Release (continuous). Attack is a Fast Attack BUTTON — there is no continuous attack knob, so specify "Fast Attack in" or "out". EQ section: High and Low bands can switch between bell and shelf; High Mid and Low Mid are fully parametric (Hz, Q, dB). Gate/Expander section: Threshold, Range, Release, Fast Attack switch.' },
        { match: /variable.?mu/i, name: 'Manley Variable Mu',
          text: 'Input, Output, Threshold, stepped Attack (7 positions: Fast to Slow), stepped Recovery (5 positions: Fast to Slow), a Limit/Compress mode switch, and a Sidechain HP filter. It has NO ratio control — the ratio varies with level, which is the whole point of the design. Quote Attack/Recovery as switch positions or "fast"/"slow", not milliseconds.' },
        { match: /massive.?passive/i, name: 'Manley Massive Passive',
          text: 'Four bands, each with exactly 11 stepped frequencies. Band 1: 22, 33, 47, 68, 100, 150, 220, 330, 470, 680, 1000 Hz. Band 2: 82, 120, 180, 270, 390, 560, 820, 1200, 1800, 2700, 3900 Hz. Band 3: 220, 330, 470, 680, 1000, 1500, 2200, 3300, 4700, 6800, 10000 Hz. Band 4: 560, 820, 1200, 1800, 2700, 3900, 5600, 8200, 12000, 16000, 27000 Hz. Per band: Gain, Bandwidth, Shelf/Bell switch. You MUST use one of the exact frequencies listed for that band.' },
        { match: /1073/i, name: 'Neve 1073',
          text: 'Every EQ frequency is a stepped switch. Low shelf: 35, 60, 110 or 220 Hz. Mid bell: 360 Hz, 700 Hz, 1.6k, 3.2k, 4.8k or 7.2 kHz. High shelf is fixed at 12 kHz. High-pass filter: 50, 80, 160 or 300 Hz. Gains are continuous to about ±16dB. No other centre frequency exists on this unit.' },
        { match: /helios|type.?69/i, name: 'UA Helios Type 69',
          text: 'Bass is a stepped selector (50 Hz boost/cut). Treble is a fixed 10 kHz shelf. The Mid band is a stepped Peak/Trough selector: 0.7, 1, 1.4, 2, 2.8, 3.5, 4.5, or 6 kHz. It is NOT a fully parametric EQ. Always specify the exact stepped frequency.' },
        { match: /studer|oxide|atr-?102|ampex/i, name: 'Tape machines (Studer A800, Oxide, Ampex ATR-102)',
          text: 'Controls are Tape Speed (7.5, 15, or 30 ips), Tape Formulation (e.g. 250, 456, 900, GP9), Record and Repro level calibration in dB, Bias trim, and an IEC/NAB EQ switch. Wow, flutter and hiss are toggled on or off — there is NO percentage or depth value for them, so never write "2% wow/flutter".' },
        { match: /\bvinyl\b/i, name: 'iZotope Vinyl',
          text: 'Year selector (1930-2000), RPM (33 / 45 / 78), and amount sliders for Mechanical Noise, Electrical Noise, Dust, Scratch and Warp. It has no frequency, dB or time parameters at all — specify a year, an RPM and which noise sliders to raise.' },
        { match: /lexicon.?224/i, name: 'UA Lexicon 224',
          text: 'Program selector (plates, halls, rooms, chorus), Decay time in real seconds, Pre-Delay in ms, and Bass/Treble decay multipliers. Decay in seconds IS a genuine setting on this one — quote it normally.' },
        { match: /minimoog/i, name: 'UA Minimoog',
          text: 'Three oscillators with range and waveform selectors, a mixer section, and a ladder filter whose Cutoff, Emphasis and Contour are 0-10 dials with NO frequency readout. Never give a Minimoog filter setting in Hz — give the dial position.' },
        { match: /rotary.?speaker/i, name: 'UA Waterfall Rotary Speaker',
          text: 'Rotor speed is a Slow / Fast / Brake switch, plus acceleration time and horn/drum balance. There is no rate in Hz — name the speed and let it ramp.' },
        { match: /\bOTT\b/, name: 'Xfer OTT',
          text: 'Depth, Time, In Gain and Out Gain, plus upper/lower band depth and gain. There is no "Amount" control — Depth is the one you mean.' },
        { match: /supermassive/i, name: 'Valhalla Supermassive',
          text: 'Mode is a list of NAMED algorithms (Gemini, Hydra, Centaurus, Sagittarius, Great Annihilator, Andromeda, Lyra, Capricorn, Cassiopeia, Orion, Aquarius, Pisces, Scorpio, Libra, Leo, Virgo) — there is no "Hall", "Plate" or "Room" mode. Tail length comes from Delay (ms) plus Feedback, NOT a decay time in seconds. Also Warp, Density, Mix and Width.' },
        { match: /saturation.?knob/i, name: 'Softube Saturation Knob',
          text: 'One knob, labelled Saturation, plus a three-way Keep High / Neutral / Keep Low switch. It has no Drive control and no mix.' },
        { match: /kotelnikov/i, name: 'TDR Kotelnikov',
          text: 'Threshold, Ratio, Soft Knee, Peak Crest, Attack, Release Peak, Release RMS, Low Frequency Relax (25-500Hz with a 0/3/6/12 dB/Oct slope), Stereo Sensitivity (0-100% DIFF), Makeup, Dry Mix and Output Gain. Ratio is continuous but STOPS AT 7:1 — it is a mastering bus compressor, not a limiter, so never ask it for 10:1 or 20:1. There is no single Release knob: peak and RMS recovery are separate controls, so say which one you mean. Attack and the two releases ARE in real milliseconds, unlike the vintage emulations above.' },

        // ---- Identified 2026-07-26 -------------------------------------------------------------
        // Everything below was read off the installed plugins rather than looked up: the control
        // names, ranges and every list of selector values came from the units' own published
        // parameters (auval on the AU builds, bundle strings for the amp names). That matters most
        // for the ones whose palette entry is a bare word — "Anthem", "Opal", "Siren" and "Verve"
        // name nothing on their own, and four of the twelve turned out to be a different category
        // of plugin than the name suggests. Vendors, for the record: Anthem, Hemisphere, Electra,
        // Opal, Ravel, Verve/Vibe and Paradise are Universal Audio; VD-DEEP and FIN-MICRO are UJAM;
        // Diablo Lite is Cymatics; Filterjam is AudioThing; Flow is Softube; Siren is Fadr.

        { match: /\banthem\b/i, name: 'UA Anthem Analog Synthesizer',
          text: 'Two oscillators, each with Octave, Coarse Tune, Fine Tune and a CONTINUOUS Shape knob that sweeps triangle -> saw -> pulse (to a very narrow PULSE99) — the waveform is a knob, not a set of buttons, so there is no "square wave" to select. Osc 1 adds Sub Level and a Sub Octave switch that is -1 or -2 only; Osc 2 adds Warp with a SYNC/RING mode switch. Noise is PINK or WHITE. One filter: Cutoff, Resonance, Env Amt, Drive, Growl, Key Follow, plus a separate HP Cutoff. Two ADSRs (Amp and Filter, each with a Velocity amount), one LFO (Rate, Sync, Tilt, Retrigger, Shape = TRIANGLE / SQUARE / STEPPED RAND / SMOOTH RAND). Voice Mode is PARA / MONO / UNISON — it is NOT a polysynth, so never write a chord pad part for it without saying paraphonic. 16-step sequencer with per-step semitone, octave, gate, velocity and on/off, Direction FORWARD / REVERSE / PING PONG 1 / PING PONG 2 / RANDOM. Effects are three fixed slots and nothing else: Chorus (MONO/STEREO), Mod FX (PHASER / FLANGE+ / FLANGE- / WARBLE) and Space FX (ECHO / SPRING / HALL) with an Amount and two generic params — there is no reverb decay time or delay time in ms.' },

        { match: /\bopal\b/i, name: 'UA Opal Morphing Synthesizer',
          text: 'The big one — three oscillators, each with Coarse/Fine Tune, Keytrack, Ensemble and a continuous Shape (sine -> saw -> PULSE99); Osc 1 has FM Amount, Osc 2 has AM Amount and Sync, Osc 3 has Sub Level and Sub Octave. Noise has a Color control. Each source has its own Volume and its own filter routing. TWO filters, each with Cutoff, Resonance, Env Amt, LFO2 Amt, Key Follow, Vel Amt, a morphing Mode (a continuous morph, not an LP/BP/HP switch) and a Slope that is continuous from 1 to 4 poles — so do NOT specify "24 dB/oct", give the pole count. Filter routing is SERIES or PARALLEL. One Insert FX inside the filter section: BYPASS / DISTORTION / OVERDRIVE / FOLD / SIGN / COMB+ / COMB-. Two Output FX slots chosen from one 29-entry list of NAMED algorithms (DLY FASTMOD, ALIENVERB, COMB-FLANGER, NOTCH-PHASER, OVERDRIVE, DISTORTION, EQ, ENSEMBLER M/ST, COMP76 BASIC/SLAM, HALL, AMBIENCE, CATHEDRAL, ROOM, DELAY M/ST/PING-PONG each with and without BPM sync, TAPE DLY in the same variants, SPRING SHORT/LONG), each with an Amount and three params, plus an Output FX Routing selector (SERIES-SERIES / SERIES-PARALLEL / PARALLEL-BACK / PARALLEL-SERIES / PARALLEL-PARALLEL). Modulation is three envelopes (Amp, Filter, Aux), two LFOs, two 32-step multi-segment envelopes, a 16-slot matrix with Source/Via/Dest, four Macros and a sample-and-hold. Polyphony is stepped: 12, 8, 6, 4 or MONO. Anthem is the two-oscillator analog one; Opal is the wavetable/morphing one — do not swap them.' },

        { match: /\bravel\b/i, name: 'UA Ravel Grand Piano',
          text: 'A Steinway B, and a deliberately short control set. Volume (-inf to +12 dB), Mics (0-100%, a single blend from close to room — there are NOT separate mic channels to balance), Tone (-10 to +10) and Dynamics (-10 to +10). Tone is one tilt control, not an EQ, so never give Ravel a frequency or a dB per band. The Reverse feature is Reverse Mix (0-100%) with a Rev Length stepped at 300, 500, 700, 900, 1100, 1300, 1500, 1800, 2000, 2500, 3000 or 3500 ms — no other length exists — plus a Res To Rev switch. Housekeeping controls: Tuning (410.0-470.0 Hz), Polyphony (Large / Medium / Eco), Highest Dynamic (OFF / LIMIT / FULL), Pedal Type, Pedal Sound Volume (FULL / MEDIUM / LOW / MIN / OFF), Key Noise Volume and Silent Note Velocity. There is no onboard EQ, compressor or reverb — anything like that is a separate plugin after it.' },

        { match: /\belectra\b/i, name: 'UA Electra 88 Vintage Keyboard Studio',
          text: 'A 1974 Rhodes Suitcase plus a whole studio, and almost every part of it is a named list rather than a free value. Amp Model is Direct / Suitcase / Rotary Speaker / Silver Double — four choices, not an amp collection. Suitcase gives Preamp Volume, Treble and Bass and a Vibrato with Speed and Intensity; Rotary gives Speed, Horn Angle, Drum Angle, Volume, Drive and separate horn and drum mic positions; Silver Double gives Volume, Treble, Middle, Bass, Reverb, Speed, Intensity, Bright and a Stock or JBF 120 speaker. Mic choices are CON 67 / DYN 57 / DYN 421 / RIB 121 (the rotary horn also offers CON 84 and RIB 4038), each with Axis, HP and Level. Three pedal slots, and they are not interchangeable: Pedal FX 1 is None / Fil-Tron / Wah ONLY, while Pedal FX 2 and 3 are None / Chorus / Compressor / Flanger / Phaser / Spring Verb / Tape Echo. The studio rack is five fixed processors: EQ (five fixed bands — Low, Low-Mid, Mid, High-Mid, High — gain only, with Low Cut and High Cut frequencies and a Post Comp switch, but NO per-band frequency and no Q), Comp (Compression amount, Style = Smooth / Punchy / Fast / Aggro, and Mix — there is no threshold, ratio, attack or release), Delay (Amount, Style = Digital / Tape (New) / Tape (Old), Time or Time Sync, Feedback, Low Pass, High Pass, To Reverb), Reverb (Amount, Type = Ambience / Cathedral / Hall / Plate / Room, Decay, Pre Delay, Bass, Treble) and Mod (Chorus / Flanger / Phaser / Wow + Flutter with Mix, Intensity and Rate). Playing feel comes from Tuning Condition (New / Vintage / Worn), Tuning Stretch, Dynamics (50-200%) and Velocity Shape / S-Curve / Sensitivity (each -50 to +50%).' },

        { match: /\bhemisphere\b/i, name: 'UA Hemisphere Mic Collection',
          text: 'Mic MODELLING, not a general tone shaper — it re-voices a signal recorded through a UA Standard-series mic, so Source Mic (NONE / SC-1 / SP-1 / SD-1 / SD-3 / SD-5 / SD-7) has to name the mic actually used or the model is being applied to the wrong starting point. Mic Type is the model, and there are eight: LD-47K, LD-67 NOS, LD-87 Vintage, LD-103, LD-12, LD-251, LD-414 US and LD-800. They are all large-diaphragm — there is no ribbon and no small-diaphragm model in the list. Mic Filter is Off / Low / Med / High: a stepped position per model, NOT a frequency, so never give it a Hz value. The rest is Proximity (a percentage), Mic Axis Shift (in degrees), Output and a Phase Normal/Invert. There is no polar pattern control, no pad and no EQ.' },

        // Same plugin, two names — see the ownedPlugins note. The regex has to catch both because
        // old recipes say Verve and the DAW now says Vibe.
        { match: /\bverve\b|\bvibe analog\b/i, name: 'UA Vibe Analog Machines (formerly Verve)',
          text: 'Renamed from Verve to Vibe by UA in April 2026 — same plugin, and it will show in the DAW as Vibe. Pick one of TEN machines: THICKEN, VINTAGIZE, OVERDRIVE, EDGE, SPUTTER, GLOW, DISTORT, SWEETEN, WARM or FIRE. Those are the only machines; there is no "tape" or "saturation" mode by name. Each machine then has exactly TWO knobs (0-100), whose labels change with the machine — drive and either tone or warble depending on which one is loaded — plus an Output Trim of ±12 dB and a Power switch. That is the whole plugin: no mix or blend control, no EQ, no tape speed, no frequency of any kind. Specify it as a machine name and two knob amounts. NOTE: the cut-down "Vibe Analog Machines Essentials" is also installed and is a DIFFERENT, smaller plugin — it has a drive control only, with no second knob and no Output Trim. Reach for the full one unless there is a reason not to.' },

        { match: /paradise/i, name: 'UA Paradise Guitar Studio',
          text: 'A whole guitar rig in one plugin, and it IS a tone source — an amp sim with stompboxes, not an effect to put after one. Six amps: Dream \'65, Ruby \'63, Lion \'68, Woodrow \'55, Showtime \'64 and Enigmatic \'82 (some have more than one channel, which is where the "11 amps" count comes from). Signal flow is five PreFX slots -> amp -> Cab and Mic -> five PostFX slots. Cab and Mic is ONE stepped selector of 35 entries — Direct plus 34 named cab-and-mic pairings such as 1x12 GB25, 2x12 Boutique D65, 4x12 UK V30, 4x10 Tweed B-Man and 2x12 Twin Vintage — you choose a pairing, never a cab and a mic separately, and there is no mic distance or angle control (Room, 0-100%, is the only ambience). Stompboxes include TS OD, Gold OD, Nashville OD, RAW Distortion, Big Fuzz, Vintage Fuzz, Brigade Chorus, Multi-Chorus, Orange Phaser, Blue Flanger, Vintage Vibrato, Trem 65, Micropitch and a Compressor. Utility controls are Input Trim (±24 dB), Amp Output and PreFX Output (±14 dB each), a Gate whose Threshold, Attack, Release, Hold and Attenuation are all 0-100 scales and NOT milliseconds, a Limiter and a Tuner (Reference A 430-450 Hz). Amp and pedal knobs are not individually named to automation, so name the amp, the channel and the pedal and give knob positions rather than dB or ms.' },

        { match: /vd-?deep|virtual drummer/i, name: 'UJAM Virtual Drummer DEEP',
          text: 'A drummer, not a drum machine, and it runs in one of two modes: Player mode, where MIDI keys trigger whole phrases and fills, or Instrument mode, where keys are individual drums. You pick a Style from a list of 30, a kit and a Mix preset — the Mix preset swaps an entire effect chain per channel, so it is a name to quote, not a set of values. Grit is the signature control and it is NOT a distortion or drive: it crossfades between modern close-miking and a vintage room technique. Swing delays the offbeats (8ths or 16ths depending on the style) up to a full triplet feel. The mixer is per-kit-piece volumes plus overheads, room and a reverb amount. There is no threshold, ratio, attack, release, tuning or ms value anywhere in it — specify a Style name, a Grit and Swing amount and a Mix preset.' },

        // Deliberately thinner than the VD-DEEP entry: DANDY is the same family and the same kind of
        // preset-driven instrument, but its knobs were not read off the plugin the way the others
        // here were, so this says what it IS and stops rather than naming controls on trust.
        { match: /vb-?dandy|virtual bassist/i, name: 'UJAM Virtual Bassist DANDY',
          text: 'A played bass instrument in the same family as Virtual Drummer DEEP — a Style list plus a Player mode where MIDI keys trigger phrases and an Instrument mode where they are individual notes and articulations, with an onboard amp/FX section. Treat it as a source, not a processor: it replaces a bass VSTi plus its amp, so do not put another amp sim after it. Specify a Style and a playing direction; if you are not certain of a specific knob on it, describe the move rather than naming one.' },

        { match: /fin-?micro|finisher/i, name: 'UJAM Finisher MICRO',
          text: 'Deliberately a two-control plugin: a Mode selector holding 20-plus named multi-effect algorithms (chorus, multiband distortion, convolution, grain pitch, multimode filters, multitap delays and so on, each a designed combination rather than a single effect) and one big Amount knob wired to many parameters at once inside whichever mode is loaded. It exposes NO individual effect parameters — there is no delay time, no filter frequency, no reverb decay, no feedback to set. Specify a Mode name and how far up the Amount knob goes, and nothing else.' },

        { match: /diablo/i, name: 'Cymatics Diablo Lite',
          text: 'A drum transient shaper and clipper — despite the name it is not an amp or a distortion pedal. Two stages in series, each with its own bypass: Punch (0-100, transient shaping) then Clip (0-100) with a Soft/Hard mode switch. Around them: Input and Output, each -20 to +20 dB, a Mix (0-100%, defaults to 100) and a Power switch. Punch and Clip are 0-100 AMOUNTS, not dB. There is no threshold, no ratio, no attack and no release anywhere in this plugin, and no drive or saturation control — those two amounts are the whole thing.' },

        { match: /filterjam/i, name: 'AudioThing Filterjam',
          text: 'Splits the input into four resonant bands which are then summed or multiplied according to a Mode selector. The controls are Frequency, Emphasis (its name for resonance — it is not called Q or Resonance), the Mode selector, and gain and mix. The four bands are NOT individually addressable: there is no per-band frequency, no per-band level, no Q, no filter slope and no envelope or LFO. Describe it as a frequency position, an emphasis amount and a mode.' },

        { match: /\bsiren\b/i, name: 'Fadr Siren',
          text: 'An AI instrument, not a synth: you type a text prompt describing a sound and it generates playable instruments from it. There is no oscillator, wavetable, sample or preset bank to specify — a "patch" for Siren is a PROMPT. What it does expose after the fact is an amplitude ADSR and a filter with four types (low-pass, high-pass, band-pass, notch) at 12 or 24 dB/oct. Two practical constraints: it needs a Fadr subscription and it generates in the cloud, so it is not an offline instrument and not the thing to lean on for a whole part. Specify it as a prompt plus any ADSR or filter move.' },

        { match: /flow mixing/i, name: 'Softube Flow Mixing Suite',
          text: 'A HOST, not a processor. It loads "Flows" — prebuilt Softube plugin chains organised by task (Drums, Vocals, Guitars, Keys, Creative, MixBus, Sends) — and the individual Softube plugins inside a Flow are unlocked by subscription credits rather than owned outright. So naming Flow alone says nothing about what is actually processing the signal, and naming a Softube module inside it is only safe if that module is genuinely available. The Softube plugins installed separately on this rig are Amplifiers, Drawmer S73, Marshall Plexi Classic, Saturation Knob, TSAR-1R Reverb and Tube Delay — treat anything outside that set as unavailable unless told otherwise, and name the module you mean rather than saying "a Flow chain".' },

        // ---- Added 2026-07-28: Priority 1 — high-impact plugins ----

        { match: /\bvital\b/i, name: 'Vital Spectral Wavetable Synth',
          text: 'Three oscillators (Osc 1/2/3), each with a Wavetable selector, Tune (semitones + cents), Level, Pan and a Frame position (0-127). Filter: Cutoff is a 0-127 MIDI value (do NOT write Hz — say a dial position or note name), Resonance (0-1), Drive, Filter Type (named list: Dirty/Ladder/Digital/Dual/Formant/Comb/Phaser and others), Blend (LP-BP-HP). Amp and Filter envelopes each have Attack, Decay, Sustain, Release in seconds. Two LFOs with Rate (Hz or tempo-sync). Effects row slots: Chorus, Flanger, Phaser, Delay (Time/Feedback/Mix), Reverb (Decay/Pre-Delay/Mix), Distortion (type selector), Compressor. Specify oscillator wavetable type, filter type, cutoff as a dial position or note name, and envelope values in seconds.' },

        { match: /tdr.?nova/i, name: 'TDR Nova Parallel Dynamic EQ',
          text: 'Four bands plus global HP and LP filters. Each band: Frequency (fully continuous Hz), Gain (±15 dB), Bandwidth (Q), Mode (Classic / Dynamic / Parallel Dynamic). In dynamic mode each band adds Threshold (dBFS), Ratio, Attack (ms) and Release (ms). Band types: Peak, Low Shelf, High Shelf, Band Pass. Global channel modes: Stereo / Mid-Side / Left / Right / Mid / Side. It IS a fully parametric digital EQ — exact Hz, dB and Q are all appropriate here.' },

        { match: /surge.?xt/i, name: 'Surge XT Synthesizer',
          text: 'Two scenes (A/B), each with three oscillators. Oscillator types include Classic, Sine, Wavetable, Window, FM2/FM3, SH Noise, String, Alias — quote the type by name. Filter: two filters each with Cutoff (continuous Hz or note name), Resonance, Type (named: LP12/LP24/LP Moog/BP/HP/Notch/Comb/etc.), Routing selector. Envelopes (Amp/Filter/three free): DAHDSR with values in seconds. LFOs: six per scene, rate in Hz or tempo-sync. FX chain: eight slots with a large named list (Chorus, Flanger, Phaser, Reverb1/2, Airwindows, Nimbus, Delay, Ring Modulator, Vocoder, etc.). Quote oscillator type, filter type and name, cutoff in Hz.' },

        { match: /drawmer.?s73/i, name: 'Drawmer S73 Intelligent Master Processor',
          text: 'Three single-knob stages in series: Warmth (0-10, harmonic saturation), Focus (0-10, dynamic clarity), Punch (0-10, low-end transient lift). Each stage has an individual bypass. Output Gain and a global bypass complete the plugin. There is NO threshold, ratio, attack or release anywhere in this plugin.' },

        { match: /tsar-?1r/i, name: 'Softube TSAR-1R Reverb',
          text: 'Six controls: Reverb Time (0.1-30 seconds), Pre-Delay (0-200ms), Treble (rolls off reverb tail highs), Bass (rolls off reverb tail lows), Diffusion (0-100%, attack density), Mix (Dry/Wet 0-100%). No room size selector or room type — those six knobs are everything.' },

        { match: /tube.?delay/i, name: 'Softube Tube Delay',
          text: 'Tape/tube echo: Time (0-1600ms or tempo-sync note division), Feedback (0-100%), Drive (0-10, tube harmonic saturation), Tone (LP filter on repeats — lower = darker), Echo Volume, Mix. Quote delay time in ms or note division; Drive as a 0-10 position.' },

        { match: /manley.?vox.?box/i, name: 'Manley VoxBox',
          text: 'Four-section channel strip: (1) Mic Preamp — Input Gain, HP filter stepped at Flat/80/120 Hz. (2) Opto Compressor — Threshold, Recovery (program-dependent like LA-2A — no attack knob), Compress/Limit switch, Gain. (3) EQ — 3-band Pultec MEQ-5 style passive EQ with 33 selectable frequencies across Low/Mid/High bands. (4) De-Esser — Threshold and Frequency stepped at 3/6/9/12 kHz. The EQ and De-Esser frequencies are stepped.' },

        { match: /avalon.?vt.?737|vt-?737/i, name: 'Avalon VT-737sp',
          text: 'Tube channel strip: Mic/Line Preamp (Gain, HP variable 30-140 Hz). Opto Compressor (Threshold, Gain, continuous Attack 2-200ms, continuous Release 100ms-5s, Comp/Limit switch). EQ (High shelf 16 or 32 kHz; High-Mid and Low-Mid are continuous with a 10x frequency multiplier; Low shelf 35 or 75 Hz). Output Gain.' },

        { match: /api.?vision|vision.?channel/i, name: 'UA API Vision Channel Strip',
          text: '550L EQ + 225L compressor. 550L EQ (4 bands): High (2.5k/5k/7k/10k/12.5k/15k/20k Hz); High-Mid (800/1.5k/3k/5k/8k/10k/12.5k Hz); Low-Mid (75/150/180/240/500/700/1k Hz); Low (30/40/50/100/200/300/400 Hz). ±12 dB in 2 dB steps. 225L compressor: Threshold, Ratio stepped (2/4/8/12:1 plus Limit), Attack stepped (0.1/0.3/1/3/10/30 ms), Release stepped (0.05/0.1/0.25/0.5/1/2 s + Auto), Makeup. All gains and timings are stepped.' },

        { match: /capitol.?comp/i, name: 'UA Capitol Compressor',
          text: 'Based on Spectra Sonics 610. Controls: Input Gain, Threshold, Ratio (stepped: 2:1, 3:1, 4:1, 6:1, 10:1), Attack (stepped), Release (stepped), Output Gain. A clean solid-state compressor — give those exact stepped ratio values.' },

        { match: /hitsville.?eq\b/i, name: 'UA Hitsville EQ',
          text: 'Motown RCA console EQ. Seven fixed-frequency bands: 50, 130, 320, 800, 2k, 5k, and 12.5k Hz. Each band offers ±8 dB of boost or cut in 1 dB stepped increments. The frequencies are fixed hardware presets, not swept. There is no Bandwidth or Q control.' },

        { match: /hitsville.?chamber/i, name: 'UA Hitsville Chambers',
          text: 'Live chamber reverb emulation. Controls: Chamber (North or South), Predelay (ms), Decay (seconds), Tone (LP filter), Mix. That is the whole plugin.' },

        { match: /ocean.?way/i, name: 'UA Ocean Way Studios',
          text: 'Room modelling plugin (not a traditional reverb). Controls: Room selector (named rooms), Microphone position (named list), Blend (0-100%), Low and High character controls. Give room name, mic position and Blend — the Low/High are broad character controls, not parametric bands.' },

        { match: /pure.?plate/i, name: 'UA Pure Plate Reverb',
          text: 'Plate reverb emulation. Controls: Decay (0.3-10 seconds), Pre-Delay (0-200ms), Modulation (0-10, chorus shimmer), Diffusion (0-10, attack density), Low Damping frequency, High Damping frequency, Mix. Always a plate — no type selector.' },

        { match: /galaxy.?tape.?echo/i, name: 'UA Galaxy Tape Echo',
          text: 'Based on Roland Space Echo RE-201. The delay time is set by Motor Speed (a continuous dial, not ms) plus Repeat Rate (fine trim). Mode selector: eleven fixed combinations of record heads 1/2/3 and spring reverb — always specify a mode by number. Other controls: Echo Volume (wet), Intensity (feedback), Bass, Treble, Spring Reverb Level. There is NO delay time in ms — specify Motor Speed position and Mode number.' },

        { match: /brigade.?chorus/i, name: 'UA Brigade Chorus Ensemble',
          text: 'Based on Roland CE-1. Controls: Mode (Chorus or Vibrato), Intensity (depth), Rate, Mix. Three controls and a mode switch.' },

        { match: /studio.?d.?chorus/i, name: 'UA Studio D Chorus',
          text: 'Based on Roland Dimension D. The original has only four numbered buttons (1-4) — no continuous rate, depth or mix. The UA version adds a Blend knob (0-100%). Describe it as a button selection (1, 2, 3 or 4) and a Blend amount. Never give it a rate in Hz.' },

        { match: /chow.?tape/i, name: 'CHOWTapeModel',
          text: 'Tape machine emulation. Record Level (0-100%, sets saturation — no separate Drive), Playback Level, Record Head (Mono/Stereo/Reversed), Tone, Wow (0-100%), Flutter (0-100%), Depth. Degradation: Dropouts, Noise, Chew. Quote Record Level and flutter/wow as percentages.' },

        { match: /tape.?cassette/i, name: 'Unfiltered Audio Tape Cassette 2',
          text: 'Cassette tape emulation. Saturation (0-100%, the main drive — there is no separate Drive knob), Bias (negative = brighter, positive = warmer), Wobble (0-100%, slow drift), Flutter (0-100%, fast), Noise (0-100%), HP filter (stepped positions), Mix. Quote Saturation and flutter/wobble as percentages.' },

        { match: /elysia.?niveau/i, name: 'elysia niveau filter',
          text: 'Tilt EQ with two controls: Frequency (stepped at 20/40/80/160/320/640 Hz/1.28k/2.56k/5.12k/10.24k/20.48k kHz — eleven positions only) and Amount (±15 dB tilt). Pick a frequency from that list and say which direction you are tilting. No separate high/low shelf, no Q.' },

        { match: /ampeg.?svt|svt.?vr/i, name: 'Ampeg SVT-VR Classic',
          text: 'Bass amp emulation of 1971 SVT. Controls: INPUT (gain), BASS (±12 dB ~100 Hz), MID FREQUENCY (stepped: 300 Hz / 1 kHz / 3 kHz — three options only), MID Level, TREBLE (±12 dB), ULTRA LO and ULTRA HI buttons (fixed tone switches), MASTER Volume. The mid frequency is stepped — give one of those three values.' },

        { match: /\bivgi2?\b/i, name: 'Klanghelm IVGI2',
          text: 'Saturation plugin. Drive (0-100%), Character (Asym for more second-harmonic / Sym for odd-order), Mix (0-100%), Output trim (±12 dB). No EQ, no compression. Quote Drive as a percentage.' },

        { match: /\bkolinmb\b/i, name: 'Kolin MB Multiband Compressor',
          text: 'Three-band multiband compressor. Per band: Threshold (dBFS), Ratio, Attack (ms), Release (ms), Makeup Gain, bypass. Adjustable crossover frequencies between bands. Global Output Gain. Quote threshold in dBFS and timing in ms.' },

        { match: /waterfall.?b3/i, name: 'UA Waterfall B3 Organ',
          text: 'Hammond B3 emulation. Drawbars: nine per manual (16\'/5⅓\'/8\'/4\'/2⅔\'/2\'/1⅗\'/1⅓\'/1\'), each 0-8 — always specify drawbar footages, never frequencies. Percussion: 2nd/3rd harmonic, Fast/Slow decay, Soft/Normal level. Vibrato/Chorus scanner: V1/C1/V2/C2/V3/C3. Leslie: Slow/Fast/Stop + Ramp time. Reverb Amount. Never give it a filter frequency or compressor setting.' },

        { match: /\bmelodyne\b/i, name: 'Celemony Melodyne',
          text: 'A pitch and time editor — it is not a real-time insert effect. In a kit it appears as a corrective step before the FX chain. Relevant parameters: Pitch Correction Speed (0-100%), Pitch Shift (semitones + cents), Formant Shift (semitones), Pitch Drift and Modulation reduction. Do not describe it as having a filter, compressor or saturation.' },

        { match: /\bkontakt\b/i, name: 'Native Instruments Kontakt 8',
          text: 'A sample library HOST. It does not have its own tone controls — it loads libraries with their own interfaces. When Kontakt appears in a chain it is as a SOURCE: name the library type and patch direction (e.g. "Kontakt 8 — orchestral strings, sustained legato") rather than Kontakt controls. Do not give Kontakt EQ or filter values.' },

        { match: /\bsitala\b/i, name: 'Decomposer Sitala',
          text: 'A drum sampler. Per pad: Pitch (±24 semitones), Volume, Pan, Start/End point, Reverse, one-knob Filter (sweeps LP to HP), Amp envelope (Attack, Decay, Sustain). It is a source — place it at the start of a chain. Specify sample type, tuning and filter position.' },

        { match: /trigger.?2/i, name: 'Steven Slate Trigger 2',
          text: 'Drum replacement plugin. Listens to a drum track and fires samples at each hit. Per pad: Sample selector, Volume, Bleed (0-100%), Accuracy and Velocity curves. It is a source — place it first, then process its output.' },

        { match: /neural.?amp.?modeler|NeuralAmpModeler/i, name: 'NeuralAmpModeler (NAM)',
          text: 'Loads a .nam neural amp model file. Controls: Input (dB trim), Output (dB), Noise Gate Threshold. The tone IS the model — there is no EQ, Gain or Bass/Mid/Treble on NAM itself. Specify "NAM — [model description]" and add EQ or saturation as separate plugins after it.' },

        { match: /\bemissary\b/i, name: 'Bogren Digital Emissary',
          text: 'High-gain amp sim. Controls: Gain (0-10), Bass (0-10), Mid (0-10), Treble (0-10), Presence (0-10), Master Volume (0-10), Clean/Lead channel switch. No built-in cabinet — always pair with NadIR. Quote all controls as 0-10 dial positions.' },

        { match: /\bnadir\b|NadIR/i, name: 'Ignite Amps NadIR',
          text: 'IR loader for guitar/bass cabinet simulation. Loads one or two .wav IR files. Controls: IR slot 1 and 2 (file selectors), Blend (0-100% between the two), Level, Delay (ms between IRs). No tone, gain or reverb control — cab sim only. Pair with a pre-amp or NAM before it.' },

        { match: /marshall.?plexi/i, name: 'UA Marshall Plexi Classic',
          text: '1968 Marshall Plexi Super Lead emulation. Controls: Volume 1 (bright channel), Volume 2 (normal channel), Treble, Middle, Bass (shared tone stack, all 0-10), Presence (0-10), Master. Specify whether one or both channels are used (bridged or single). No built-in cab — pair with a cab IR. Quote all as 0-10 positions.' },

        { match: /ruby.?amp/i, name: 'UA Ruby \'63 Amp',
          text: '1963 Vox AC30 Top Boost emulation. Controls: Volume (0-10), Treble (0-10), Bass (0-10), Cut (0-10 — HIGHER = DARKER, opposite of what you expect), Reverb (0-10), Tremolo Speed and Intensity. No built-in cab. Quote all as 0-10 positions.' },

        { match: /dream.?amp/i, name: 'UA Dream \'65 Amp',
          text: '1965 Fender Deluxe Reverb emulation. Controls: Volume (0-10), Treble/Middle/Bass (0-10), Reverb (0-10 spring), Tremolo Speed and Intensity, Normal/Vibrato channel. No built-in cab. Quote all as 0-10 positions.' },

        { match: /lion.?amp/i, name: 'UA Lion \'68 Amp',
          text: '1968 Marshall Super Bass emulation. Controls: Volume 1, Volume 2, Treble, Middle, Bass (0-10), Presence (0-10), Master Volume. No built-in cab. Quote as 0-10 positions.' },

        { match: /woodrow.?amp/i, name: 'UA Woodrow \'55 Amp',
          text: '1955 Fender Tweed Deluxe emulation. Controls: Volume (0-10), Tone (single knob — not separate Bass/Treble), Spring Reverb (0-10). No built-in cab. Quote as 0-10 positions.' },

        { match: /showtime.?64/i, name: 'UA Showtime \'64 Amp',
          text: '1964 Silvertone 1484 emulation. Controls: Volume (0-10), Treble, Bass (0-10), Reverb (0-10 spring), Tremolo Speed and Intensity. No built-in cab. Quote as 0-10 positions.' },

        { match: /enigmatic.?82/i, name: 'UA Enigmatic \'82 Amp',
          text: '1982 Mesa/Boogie Mark IIC+ emulation. Controls: Gain (0-10), Treble/Middle/Bass/Presence (0-10), Master Volume, Lead/Rhythm switch. High-gain channel. No built-in cab. Quote as 0-10 positions.' },

        { match: /sound.?city/i, name: 'UA Sound City Studios',
          text: 'Room modelling plugin capturing Sound City Studios. Controls: Room selector (named), Mic position selector (named), Blend (0-100%), Low and High character controls. Give room name, mic position and Blend amount.' },

        // ---- Kilohearts family ----
        { match: /\bkhs\b/i, name: 'Kilohearts kHs Suite',
          text: 'All kHs modules use plain-English labelled controls with real units — Hz, dB, ms, % and semitones are always appropriate. Key module controls: kHs Compressor — Threshold (dBFS), Ratio, Attack (ms), Release (ms), Knee (dB), Makeup. kHs Gate — Threshold (dBFS), Attack (ms), Hold (ms), Release (ms), Floor (dB). kHs 3-Band EQ — Low (Hz, dB), Mid (Hz, dB, Q), High (Hz, dB). kHs Delay — Time (ms or note division), Feedback (%), Wet (%). kHs Reverb — Decay (seconds), Size (meters), Dampening (Hz LP cutoff), Width (%), Wet (%). kHs Limiter — Threshold (dBFS), Lookahead (ms), Release (ms). kHs Distortion — Drive (dB), Type (Hard/Soft/Tube/Fuzz/Rectify). kHs Chorus — Rate (Hz), Depth (semitones), Voices (2-8). kHs Flanger — Rate (Hz), Depth (ms), Feedback (%), Wet (%). kHs Phaser — Stages (2/4/6/8/10), Rate (Hz), Depth (%), Feedback (%). kHs Filter — Frequency (Hz), Resonance, Type (LP/HP/BP/Notch). kHs Pitch Shifter — Pitch (semitones + cents). kHs Transient Shaper — Attack and Sustain (each dB). kHs Tape Stop — Time (ms). kHs Haas — Delay (1-40 ms). kHs Bitcrush — Bits (1-24), Sample Rate (Hz). kHs Clipper — Threshold (dBFS), Trim.' },

        // ---- Plugin Alliance bx_ effects ----
        { match: /bx_masterdesk/i, name: 'Plugin Alliance bx_masterdesk',
          text: 'One-page mastering processor. The classic version uses broad tone stack knobs (Volume, Foundation, Bass, Mid, Treble, Presence) and two Resonance Filter switches. It does NOT have adjustable Hz values. Plus Stereo Width (0-200%), Mono Maker frequency, Master Fader and a soft Limiter switch.' },

        { match: /bx_boom/i, name: 'Plugin Alliance bx_boom',
          text: 'Sub/mono-bass enhancement. Controls: Boom Frequency (stepped), Boom Amount (0-100%), Attack (ms), Release (ms), Mono Below (Hz). Use it to add sub resonance or tighten kick.' },

        { match: /bx_subfilter/i, name: 'Plugin Alliance bx_subfilter',
          text: 'Sub-bass HP + low shelf filter. HP Frequency (Hz), HP Slope (6/12/18/24 dB/oct), Low Shelf Gain and Frequency. Quote HP frequency and slope.' },

        { match: /bx_solo/i, name: 'Plugin Alliance bx_solo',
          text: 'Mid-side decode monitor utility: M/S, Mono, Stereo, Mid-only, Side-only. A monitoring tool only — do not put it in a processing chain.' },

        { match: /bx_cleansweep/i, name: 'Plugin Alliance bx_cleansweep',
          text: 'HP and LP filter. HP Frequency (Hz), LP Frequency (Hz), HP Slope (6/12 dB/oct), LP Slope (6/12 dB/oct). No resonance. Quote frequencies in Hz.' },

        { match: /bx_bluechorus/i, name: 'Plugin Alliance bx_bluechorus2',
          text: 'Chorus effect. Controls: Rate (Hz), Depth (0-100%), Mix (0-100%), Stereo Width. Quote Rate in Hz.' },

        { match: /bx_distorange|bx_blackdist/i, name: 'Plugin Alliance bx_distorange / bx_blackdist2',
          text: 'Distortion pedal emulations. Controls: Drive (0-10), Tone (LP/HP tilt — lower = darker), Level. Quote Drive as a 0-10 dial position.' },

        { match: /bx_opto/i, name: 'Plugin Alliance bx_opto Pedal',
          text: 'Opto-compressor pedal. Controls: Volume (input drive — also acts as threshold), Sustain (0-10, compression amount), Tone (bright/warm tilt). No threshold, ratio, attack or release — Sustain is the only compressor control. Quote as 0-10.' },

        { match: /bx_greenscreamer/i, name: 'Plugin Alliance bx_greenscreamer',
          text: 'Tube Screamer-style overdrive. Controls: Overdrive (0-10), Tone (0-10), Level. Quote as 0-10 positions.' },

        { match: /bx_yellowdrive/i, name: 'Plugin Alliance bx_yellowdrive',
          text: 'Transparent low-gain overdrive (SD-1 / OD-1 style). Controls: Drive (0-10), Tone (0-10), Level. Mid-forward character. Quote as 0-10.' },

        { match: /bx_metal2/i, name: 'Plugin Alliance bx_metal2',
          text: 'High-gain metal distortion (Boss Metal Zone style). Controls: Distortion (0-10), Low (±12 dB), Mid Frequency (200 Hz-5 kHz, continuous), Mid Level (±12 dB), High (±12 dB), Level. Quote Distortion as 0-10 and Mid Frequency in Hz.' },

        { match: /bx_shredspread/i, name: 'Plugin Alliance bx_shredspread',
          text: 'Stereo-widening high-gain distortion for rhythm guitars. Controls: Gain (0-10), Tone (LP), Width (0-200%), Level. Quote Gain as 0-10 and Width as a percentage.' },

        { match: /bx_rockrack/i, name: 'Plugin Alliance bx_rockrack',
          text: 'Amp and cabinet sim. Controls: Amp selector (named list), Gain (0-10), Bass/Mid/Treble/Presence (0-10), Master Volume, Cabinet selector (named IR list). Quote the amp name, all tone controls as 0-10, and the cabinet by name.' },

        { match: /spl.?free.?ranger/i, name: 'SPL Free Ranger',
          text: 'Four-band graphic EQ based on the SPL EQ Rangers. It has exactly four FIXED bands: 40 Hz, 150 Hz, 1.8 kHz, and 16 kHz. You can only adjust the Gain (±12 dB continuous) for these specific frequencies. No frequency selectors, no Q control.' },

        { match: /\b175[-_]?b\b/i, name: 'UA 175B Tube Compressor',
          text: 'UA 175B tube compressor emulation. Controls: Input Level, Output Level. It has a FIXED 12:1 compression ratio (there is no ratio knob). Attack/Release are continuous. No threshold — Input Level drives into the fixed threshold.' },

        { match: /\b176\b/i, name: 'UA 176 Tube Limiter',
          text: 'UA 176 tube limiter emulation. Controls: Input, Output, Ratio (stepped: 2:1/4:1/8:1/12:1), continuous Attack and Release. No threshold — Input level drives it.' },

        { match: /\b610[-_]?[ab]\b/i, name: 'UA 610-B Tube Preamp & EQ',
          text: 'Tube preamp with passive inductor EQ. Preamp: Input Gain, Pad, Phase. EQ: Low (stepped at 30/100 Hz shelf boost/cut), Mid (stepped at 200 Hz/1k/3k/7k Hz ±4-5 dB steps), High (fixed 12 kHz shelf). Output Gain. EQ frequencies are stepped switches — no arbitrary Hz.' },

        { match: /century.?tube/i, name: 'UA Century Tube Channel Strip',
          text: 'Tube channel strip: Compressor (Opto style with single Dynamics knob, no ratio or attack/release controls). EQ (Low shelf fixed at 110 Hz, Sweepable Mid peak 300 Hz-7.2 kHz without Q control, High shelf fixed at 10 kHz), Output Gain.' },

        { match: /little.?labs.?vog/i, name: 'Little Labs VOG',
          text: 'Resonant bass frequency controller. Controls: Frequency (30-600 Hz, continuous), Boost (0 to +18 dB, resonant lift), HP filter at the same frequency, Mix. Quote Frequency in Hz and Boost in dB.' },

        { match: /graillon/i, name: 'Auburn Sounds Graillon 3',
          text: 'Pitch correction and vocal manipulation. Pitch Correction: Speed (0-100%), Scale. Pitch Shift: ±24 semitones + cents, Formant Shift (±2 octaves in semitones). Spectral Gate: Sensitivity, Frequency (Hz). Glide (ms). Specify Pitch Shift in semitones/cents and Correction Speed as a percentage.' },

        { match: /a-type.?multi/i, name: 'Plugin Alliance A-Type Multiband',
          text: 'Three-band multiband compressor/expander with adjustable crossover frequencies. Per band: Threshold (dBFS), Ratio, Attack (ms), Release (ms), Knee, Makeup Gain, Bypass. Global Output Gain. Quote threshold in dBFS and timing in ms.' }
    ];

    // ==================== SETTINGS LINTER ====================
    // The prompt rules cut the fabrication rate down but can never make it zero, and they do nothing
    // at all for the kits already sitting in genreKits from before the rules existed. This runs
    // deterministically at render time over every chain line, old and new alike, so a setting that
    // can't physically be dialled in gets marked in the UI instead of quietly trusted.
    //
    // Deliberately conservative — it only fires on things that are certainly impossible, never on
    // things that merely look unusual. `freqs` is the UNION of every band's stepped values, so a
    // frequency that exists but is on the wrong band passes; only genuinely unreachable ones flag.
    // A false alarm here would train you to ignore the warnings, which is worse than missing one.
    // Keyed by the `name` above. Kept separate from the entries so the reference prose (which the AI
    // reads) stays legible next to the machine rules (which it never sees). `freqs` is a union across
    // bands; `skipIf` exists because a combo unit like the LA-6176 matches two entries and only one
    // half of it lacks the control being flagged.
    const MS = '[^.;,]*?\\d+(?:\\.\\d+)?\\s*ms';
    const PLUGIN_LINT = {
        'Teletronix LA-2A (all variants)': { skipIf: /6176/i, noControls: [[/\b(attack|release|ratio|threshold|knee)\b/i, 'an LA-2A has no attack, release, ratio or threshold — only Peak Reduction and Gain']] },
        'UA LA-3A': { noControls: [[/\b(attack|release|ratio|threshold)\b/i, 'an LA-3A has no attack, release or ratio — only Peak Reduction and Gain']] },
        'UA 1176 (Rev A, Rev E/LN, 1176AE)': { noControls: [
            [/threshold/i, 'the 1176 has no threshold knob — Input is what sets how hard it works'],
            [new RegExp('(attack|release)' + MS, 'i'), '1176 attack and release are 1-7 dial positions, not milliseconds (and 7 is the fast end)'] ] },
        'Pultec EQP-1A': { freqs: [20,30,60,100,3000,4000,5000,8000,10000,12000,16000,20000],
            noControls: [[/\bQ\b/, 'Pultecs have a Bandwidth knob, not a Q']] },
        'Pultec MEQ-5': { freqs: [200,300,500,700,1000,1500,2000,3000,4000,5000,7000],
            noControls: [[/shelf/i, 'the MEQ-5 is three peak/dip bands — it has no shelves'], [/\bQ\b/, 'Pultecs have a Bandwidth knob, not a Q']] },
        'Pultec HLF-3C': { freqs: [50,80,100,150,200,300,500,1500,3000,4000,5000,8000,10000,12000,15000,20000],
            noControls: [[/\d+\s*dB/i, 'the HLF-3C is filters only — it has no dB gain control']] },
        'Neve 1073': { freqs: [35,50,60,80,110,160,220,300,360,700,1600,3200,4800,7200,12000] },
        'Fairchild 660 / 670': { noControls: [
            [/\bratio\b/i, 'a Fairchild has no ratio control'],
            [new RegExp('(attack|release)' + MS, 'i'), 'Fairchild timing is a six-position Time Constant selector, not a millisecond value'] ] },
        'UA dbx 160': { noControls: [[/\b(attack|release)\b/i, 'the dbx 160 has no attack or release control — both are fixed']] },
        'Empirical Labs Distressor': { noControls: [[new RegExp('(attack|release)' + MS, 'i'), 'Distressor attack and release are 1-10 dials, not milliseconds']] },
        'API 2500': { noControls: [[new RegExp('(attack|release)' + MS, 'i'), 'API 2500 timing is a stepped switch position, not a freely typed ms value']] },
        'Manley Variable Mu': { noControls: [
            [/\bratio\b/i, 'the Variable Mu has no ratio control — the ratio moves with level'],
            [new RegExp('(attack|recovery|release)' + MS, 'i'), 'Variable Mu timing is a switch position, not milliseconds'] ] },
        'Manley Massive Passive': { freqs: [22,33,47,68,82,100,120,150,180,220,270,330,390,470,560,680,820,1000,1200,1500,1800,2200,2700,3300,3900,4700,5600,6800,8200,10000,12000,16000,27000],
            noControls: [[/\bQ\b/, 'the Massive Passive has a Bandwidth knob, not a Q']] },
        'SSL E Channel Strip': { noControls: [[new RegExp('attack' + MS, 'i'), "the E-Channel's attack is a Fast Attack button, not a time"]] },
        'Tape machines (Studer A800, Oxide, Ampex ATR-102)': { noControls: [[/(wow|flutter|hiss)[^.;,]*?\d+\s*%/i, 'tape wow/flutter/hiss has no percentage setting — speed and tape stock are the controls']] },
        'UA Helios Type 69': { freqs: [50, 700, 1000, 1400, 2000, 2800, 3500, 4500, 6000, 10000], noControls: [[/\bQ\b/, 'the Helios 69 has no Q or bandwidth control']] },
        'Xfer OTT': { noControls: [[/\bamount\b/i, "OTT's control is Depth — there is no Amount"]] },
        'Valhalla Supermassive': { noControls: [
            [/\b(hall|plate|room)\b/i, "Supermassive's modes are named (Gemini, Hydra, Cirrus…) — there is no Hall, Plate or Room"],
            [/decay[^.;,]*?\d/i, 'Supermassive has Delay plus Feedback, not a decay time'] ] },
        'Softube Saturation Knob': { noControls: [[/\bdrive\b/i, 'the control is called Saturation, not Drive']] },
        // Ratio is the only hard bound on this one worth checking. Its two releases are a real trap
        // ("Release 200ms" names neither), but "release" alone is ordinary shorthand a producer would
        // write themselves, so flagging it would be the false alarm the rest of this file avoids.
        'TDR Kotelnikov': { ratio: [1.1, 7] },

        // Rules for the units documented on 2026-07-26. Same restraint as everything above: each one
        // fires only on a control the plugin provably does not have. The four worth having are the
        // ones where the plugin's category invites the wrong vocabulary — a transient shaper that
        // sounds like a compressor, a mic model that sounds like an EQ, a gate whose knobs look like
        // they should be in ms, and two synths that are easy to mistake for each other.
        'Cymatics Diablo Lite': { noControls: [
            [/\b(threshold|ratio|attack|release)\b/i, 'Diablo Lite has no threshold, ratio, attack or release — Punch and Clip are 0-100 amounts'] ] },
        'UA Hemisphere Mic Collection': { noControls: [
            [/\d+\s*k?\s*hz/i, "Hemisphere's Mic Filter is Off / Low / Med / High — it has no frequency control"],
            [/\b(polar|cardioid|omni|omnidirectional|figure.?8)\b/i, 'Hemisphere has no polar pattern control — Mic Type, Mic Filter, Axis Shift and Proximity are the controls'] ] },
        'UA Vibe Analog Machines (formerly Verve)': { noControls: [
            [/\d+\s*k?\s*hz/i, 'Vibe/Verve has no frequency control of any kind — a machine name and two 0-100 knobs is the whole plugin'],
            [new RegExp(MS, 'i'), 'Vibe/Verve has no time control — nothing in it is set in milliseconds'] ] },
        'UA Paradise Guitar Studio': { noControls: [
            [new RegExp('(attack|release|hold)' + MS, 'i'), "Paradise's gate is set on 0-100 scales, not in milliseconds"],
            [/\bmic (distance|position|angle)\b/i, 'Paradise picks the cab and mic as one stepped pairing — there is no separate mic distance or angle'] ] },
        'AudioThing Filterjam': { noControls: [
            [/\bQ\b/, 'Filterjam calls its resonance Emphasis — there is no Q'],
            [/\bband\s*[1-4]\b/i, "Filterjam's four bands are not individually addressable — Frequency, Emphasis and Mode are the controls"] ] },
        'UJAM Finisher MICRO': { noControls: [
            [new RegExp(MS, 'i'), 'Finisher MICRO exposes no individual effect parameters — only a Mode and the Amount knob'],
            [/\bcutoff\b/i, 'Finisher MICRO has no cutoff control — the Amount knob moves whatever the Mode contains'] ] },
        'UJAM Virtual Drummer DEEP': { noControls: [
            [/\b(threshold|ratio)\b/i, 'Virtual Drummer DEEP has no threshold or ratio — the Mix preset is a named chain, not a set of values'] ] },
        'UA Electra 88 Vintage Keyboard Studio': { noControls: [
            [/\b(threshold|ratio)\b/i, "Electra 88's Studio Comp has only Compression, a Style (Smooth/Punchy/Fast/Aggro) and Mix"],
            [/\bQ\b/, "Electra 88's Studio EQ is five fixed bands with gain only — no frequency and no Q"] ] },
        'UA Anthem Analog Synthesizer': { noControls: [
            [/\bwavetable\b/i, 'Anthem is the two-oscillator analog model — Opal is the wavetable/morphing synth'] ] }
    };
    window.PLUGIN_CONTROLS.forEach(e => { if (PLUGIN_LINT[e.name]) e.lint = PLUGIN_LINT[e.name]; });

    // Models type like a word processor, not like a plugin list: "SSL G‑Bus Compressor" comes back
    // with U+2011 where the palette has a plain ASCII hyphen, and the two never compare equal. That
    // one character was enough to report a plugin sitting in the palette as invented gear — the
    // false alarm this whole file is built to avoid. Fold the typographic characters back to ASCII
    // before any name comparison or rule match. NFKC first so ligatures and full-width forms go too.
    window.normPluginName = (s) => String(s == null ? '' : s)
        .normalize('NFKC')
        .replace(/[\u2010-\u2015\u2212]/g, '-')
        .replace(/[\u2018\u2019\u02BC]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

    const HZ_RE = /(\d+(?:\.\d+)?)\s*(k)?\s*hz/gi;
    function parseHz(s){
        const out = []; let m; HZ_RE.lastIndex = 0;
        while ((m = HZ_RE.exec(s))) out.push(Math.round(parseFloat(m[1]) * (m[2] ? 1000 : 1)));
        return out;
    }
    const fmtHz = hz => hz >= 1000 ? `${hz/1000}kHz` : `${hz}Hz`;
    const RATIO_RE = /(\d+(?:\.\d+)?)\s*:\s*1\b/g;
    function parseRatios(s){
        const out = []; let m; RATIO_RE.lastIndex = 0;
        while ((m = RATIO_RE.exec(s))) out.push(parseFloat(m[1]));
        return out;
    }

    window.lintChainStep = (step) => {
        // Normalized before matching for the same reason as the name comparison: "Teletronix LA‑2A"
        // with a non-breaking hyphen does not match /LA-?2A/, so the unit would be silently skipped
        // rather than checked — a miss that looks identical to a pass on the scorecard.
        const s = window.normPluginName(step); if (!s.trim()) return [];
        const out = [];
        // Split on arrows AND sentence breaks first: a line like "Neve 1073 (80Hz) -> ReaEQ (HPF
        // 200Hz)" would otherwise blame the 1073 for ReaEQ's 200Hz, which isn't on its selector.
        // Each plugin only ever gets judged on the text that belongs to it.
        s.split(/->|→|;|\.\s+/).forEach(part => {
            if (!part.trim()) return;
            // A part explaining what a plugin CAN'T do ("it has no band below 200Hz", "400Hz isn't on
            // this unit") names frequencies as counterexamples, not as settings, so the freq check
            // has to stand down or it flags the note for being right. It gates ONLY that check:
            // gating the whole part would let "Attack 5 ms, Release 50 ms, ratio isn't important"
            // through, since one stray negation would excuse every other error on the line.
            const aside = /\b(isn't|aren't|has no|have no|there's no|there is no|can't reach|cannot reach|nearest (real )?step)\b/i.test(part);
            window.PLUGIN_CONTROLS.forEach(e => {
                if (!e.lint || !e.match.test(part)) return;
                if (e.lint.skipIf && e.lint.skipIf.test(part)) return;
                (e.lint.noControls || []).forEach(([re, msg]) => { if (re.test(part)) out.push(msg); });
                if (e.lint.freqs && !aside) parseHz(part).forEach(hz => {
                    if (!e.lint.freqs.includes(hz)) out.push(`${fmtHz(hz)} isn't on the ${e.name}'s frequency selector`);
                });
                // A continuous ratio knob that simply stops. Unlike `freqs` this is a range, not a
                // list, so an arbitrary 3.7:1 passes and only genuinely out-of-reach figures flag.
                if (e.lint.ratio && !aside) parseRatios(part).forEach(r => {
                    const [lo, hi] = e.lint.ratio;
                    if (r > hi || r < lo) out.push(`the ${e.name}'s ratio only goes from ${lo}:1 to ${hi}:1 — ${r}:1 is off the knob`);
                });
            });
        });
        return [...new Set(out)];
    };
    window.lintRecipe = (r) => (Array.isArray(r && r.chain) ? r.chain : []).reduce((n, s) => n + window.lintChainStep(s).length, 0);

    // ==================== ONE TONE SOURCE PER PATH ====================
    // An amp sim and a NAM capture are two SEPARATE ways of getting a recorded electric instrument's
    // sound, not two stages of one chain. Stacking them is two amps in series — nobody's target tone,
    // and unlike a wrong knob value it is invisible per-step: each plugin is real, owned, and sensibly
    // set. It only reads as wrong when you look at the whole chain, so it needs its own pass.
    //
    // Deliberately narrow, same as the step linter. A cab IR (NadIR) and a room (Ocean Way) are the
    // legitimate stages that FOLLOW either route, so they are not tone sources and never flag.
    // The space stages that may legitimately follow a tone source. Kept as DATA rather than baked into
    // the prompt prose, because this is the list most likely to be wrong or incomplete — add an entry
    // here and the kit prompt picks it up automatically. Nothing here is named to the model unless it
    // is actually in the palette for that kit, so an entry for gear that isn't owned costs nothing.
    // ==================== WHAT IS AN INSTRUMENT ====================
    // The palette is one flat list of names, which is fine for effects — "TDR Nova" tells the model
    // what it is. It is useless for the instruments: "APC", "Opal", "Siren" and "VD-DEEP" name
    // nothing, so a model asked to pick a sound source either skips them or guesses. Category was
    // read off the plugins themselves (AU type `aumu`, or the VST3 Instrument subcategory), so this
    // is a fact table, not a guess — but only the `kind` half is editorial, and it is deliberately
    // short: what it IS, not what it sounds like.
    //
    // The four hosts at the bottom are the trap this table mainly exists to close. Kontakt loads
    // whatever libraries happen to be installed, so "Kontakt 8 - Session Horns" is exactly the kind
    // of confident, unreachable suggestion the rest of this file is built to prevent.
    window.INSTRUMENT_PLUGINS = [
        { name: 'Vital',            kind: 'a wavetable synth' },
        { name: 'Surge XT',         kind: 'a hybrid synth' },
        { name: 'Anthem',           kind: 'a two-oscillator analog-model synth (para/mono/unison, NOT polyphonic)' },
        { name: 'Opal',             kind: 'a three-oscillator morphing/wavetable synth' },
        { name: 'PolyMAX',          kind: 'a polysynth' },
        { name: 'Minimoog',         kind: 'a monophonic Moog' },
        { name: 'Ravel',            kind: 'a Steinway B grand piano' },
        { name: 'Electra',          kind: 'a Rhodes Suitcase electric piano with its own amp and studio rack' },
        { name: 'Waterfall B3',     kind: 'a Hammond B3 organ' },
        { name: 'VD-DEEP',          kind: 'a played drummer — styles and phrases, not one-shots' },
        { name: 'VB-DANDY',         kind: 'a played bassist — styles and phrases, not one-shots' },
        { name: 'MT-PowerDrumKit',  kind: 'an acoustic drum kit' },
        { name: 'DrumGPT',          kind: 'a drum instrument' },
        { name: 'Sitala',           kind: 'a simple 16-pad drum sampler' },
        { name: 'SSDSampler5',      kind: 'the Steven Slate Drums sampler' },
        { name: 'Ample Bass P Lite II (ABPL2)',    kind: 'a sampled Fender Precision bass' },
        { name: 'Ample Guitar M Lite II (AGML2)',  kind: 'a sampled Martin D-41 acoustic guitar' },
        { name: 'Ample Percussion Cloudrum (APC)', kind: 'a sampled steel tongue drum' },
        { name: 'Siren',            kind: 'an AI instrument driven by a text prompt, not a patch' },
        // Hosts — these play whatever is installed in them, which this app cannot see.
        { name: 'Kontakt 8',        kind: 'a library HOST — never name a specific Kontakt library, say what kind of patch to load', host: true },
        { name: 'HALion Sonic',     kind: 'a workstation HOST — say what kind of patch to load, not a preset name', host: true },
        { name: 'SINE Player',      kind: 'the Orchestral Tools library HOST — say what kind of patch, not a library name', host: true },
        { name: 'Splice INSTRUMENT', kind: 'a sample HOST — say what kind of sound to load, not a specific pack', host: true }
    ];

    window.SPACE_PLUGINS = [
        { name: 'Ocean Way Studios Deluxe', kind: 'a tracking ROOM with real mic placement' },
        { name: 'Hitsville Chambers',       kind: 'the Motown ECHO CHAMBER — a send-style space, not a room capture' }
    ];

    // Gateway is the NAM route on this rig — it hosts the capture AND its own impulse responses, so a
    // separate IR loader after it is redundancy rather than a stage. That makes NadIR+Gateway its own
    // distinct mistake, separate from the two-amps one.
    window.TONE_SOURCES = [
        { cls: 'NAM',      name: 'Gateway/NAM', re: /\b(gateway|neural\s*amp\s*model\w*)\b/i, altRe: /\bNAM\b/ },
        { cls: 'amp',      name: 'an amp sim',  re: /\b(ampeg|svt-?vr|dream amp|ruby amp|woodrow amp|lion amp|marshall plexi|emissary|bx_rockrack|paradise guitar)\b/i }
    ];
    const IR_LOADER_RE = /\bnadir\b/i;
    window.lintChainStack = (chain) => {
        const steps = (Array.isArray(chain) ? chain : []).map(s => ({ raw: s, n: window.normPluginName(s) }));
        const head = (s) => String(s).split(/\s+[—–]\s+|\s+-\s+|:\s/)[0].trim();
        const found = new Map();
        steps.forEach(({ raw, n }) => window.TONE_SOURCES.forEach(t => {
            if ((t.re.test(n) || (t.altRe && t.altRe.test(n))) && !found.has(t.cls)) found.set(t.cls, head(raw));
        }));
        const out = [];
        if (found.size >= 2) {
            out.push(`${[...found.values()].join(' and ')} are in the same chain — an amp sim and a NAM capture are two different ways to get the sound, not two stages. Pick one route, or split them into two recipes.`);
        }
        if (found.has('NAM')) {
            const ir = steps.find(({ n }) => IR_LOADER_RE.test(n));
            if (ir) out.push(`${head(ir.raw)} after ${found.get('NAM')} is redundant — Gateway loads its own impulse responses, so a separate IR plugin is never needed on a NAM chain.`);
        }
        return out;
    };

    // Cookbook recipes are free prose in two fields rather than an array of steps, and both of them
    // carry settings — the imported packs put "Studer A800 (7.5 ips)" in the chain and "gate with a
    // 0ms release" in the notes, and until now neither was looked at. Feed it a line at a time so a
    // paragraph break acts as a divider the way an arrow does; without that, one plugin gets blamed
    // for a figure that belongs to another three lines down.
    window.lintFreeText = (txt) => {
        const out = [];
        String(txt || '').split(/\n+/).forEach(line => out.push(...window.lintChainStep(line)));
        return [...new Set(out)];
    };

    // ==================== IS IT REAL, OR JUST CONFIDENT? ====================
    // Scores a whole kit for whether its settings could actually be dialled in. Three independent
    // things go wrong when a model is out of its depth on this task, and they fail differently:
    //
    //   invented CONTROLS  — a knob that unit doesn't have, or a value off its stepped range. This is
    //                        the lint pass, and it's the sharpest signal: getting it wrong requires
    //                        confidently describing hardware you don't know.
    //   invented GEAR      — a plugin name that isn't in the palette it was handed and isn't Reaper
    //                        stock. Pure fabrication, and free to detect exactly.
    //   no CONTENT         — "to taste", or a plugin named with no move attached. Not wrong, just
    //                        empty; the prompt explicitly forbids it, so it also measures instruction
    //                        adherence.
    //
    // `checked` is reported alongside all of it and matters as much as the counts do. Only 24 units
    // have documented control sets, so a model can score zero impossible settings by simply never
    // naming one of them. A low impossible-count over a low checked-count says nothing; the rate is
    // only meaningful against the coverage it was measured over, so both always travel together.
    const REAPER_STOCK_RE = /^(rea[a-z]*|js[:\s]|video processor)/i;
    // Not every line in a chain is a plugin. A chain legitimately starts with where the sound came
    // from — "Clean DI Electric Guitar — played live with laid-back timing", a sample, a vocal take —
    // and those steps have no plugin to own and no knob to set. Judged as plugins they fail twice
    // over: "not your gear" (it isn't in the palette, because it was never a plugin) and "no setting"
    // (there's no knob value in "played live"). Across 640 real chain steps the DI line was the ONLY
    // off-palette hit in the whole book, i.e. the counter's entire output was this false alarm — and a
    // linter you learn to disbelieve is worse than no linter, which is the rule the rest of this file
    // is built on. Recognised sources are skipped by both counters and by nothing else.
    const NON_PLUGIN_SOURCE_RE = /^(?:(?:clean|dirty|live|acoustic|electric|upright|real|raw|mono|stereo)\s+)*(?:di\b|d\.i\.|direct[- ]in|direct[- ]injec\w*|line[- ]in|sample[ds]?\b|loop\b|one[- ]shot|vocal take|lead vocal|backing vocal|ad-?libs?\b|guitar|bass|drum kit|drums|piano|keys|vinyl|field recording|foley|midi\b)/i;
    const NON_PLUGIN_HINT_RE = /\b(d\.?i\.?\b|direct[- ]in|played live|live take|tracked live|no amp|amp-?less|dry signal|straight in|sampled?\b|re-?amp\w*)\b/i;
    const isNonPluginSource = (name, whole) => NON_PLUGIN_SOURCE_RE.test(name) && NON_PLUGIN_HINT_RE.test(whole);
    // "Plugin Name — settings" is the format the prompt asks for; take the head as the unit, and treat
    // an en/em dash, a colon or a hyphen-with-spaces as the divider. Anything before a divider that's
    // longer than a plugin name is probably prose, so cap it.
    const stepPlugin = (s) => {
        const head = String(s || '').split(/\s+[—–]\s+|\s+-\s+|:\s/)[0].trim();
        return head.length > 0 && head.length <= 48 ? head : '';
    };
    const stepSettings = (s) => {
        const str = String(s || '');
        const i = str.search(/\s+[—–]\s+|\s+-\s+|:\s/);
        return i < 0 ? '' : str.slice(i).replace(/^\s*[—–:-]\s*/, '').trim();
    };
    window.scoreKit = (kit) => {
        const palette = Array.isArray(kit && kit.palette) ? kit.palette : [];
        const owned = (window.db && window.db.ownedPlugins) || [];
        // With no palette recorded (older kits, or a build that fell back to the whole owned list) the
        // owned list is the honest reference — flagging everything as invented would be a lie.
        const known = palette.length ? palette : owned;
        const out = { recipes: 0, steps: 0, checked: 0, checkedSpecific: 0, impossible: 0, offPalette: 0,
                      empty: 0, specific: 0, stacked: 0, sources: 0, offPaletteNames: [], impossibleNotes: [], stackedNotes: [] };
        (kit && kit.instruments || []).forEach(inst => (inst.recipes || []).forEach(r => {
            out.recipes++;
            const stackNotes = window.lintChainStack(r.chain);
            if (stackNotes.length) { out.stacked += stackNotes.length; out.stackedNotes.push(...stackNotes); }
            (Array.isArray(r.chain) ? r.chain : []).forEach(step => {
                out.steps++;
                const notes = window.lintChainStep(step);
                if (notes.length) { out.impossible += notes.length; out.impossibleNotes.push(...notes); }
                // "Checked" means a unit we hold documented controls for actually appeared in this
                // step — the only steps where a clean result is evidence rather than absence of it.
                // But naming the unit is not the same as committing to a setting on it: "Neve 1073 —
                // just the preamp colour" is checked, clean, and says nothing a linter could have
                // caught. So track the subset that actually put a number next to the documented unit.
                // checkedSpecific/checked is the one ratio a model can't improve by staying vague.
                const nstep = window.normPluginName(step);
                if (window.PLUGIN_CONTROLS.some(e => e.lint && e.match.test(nstep))) {
                    out.checked++;
                    if (/\d/.test(stepSettings(step))) out.checkedSpecific++;
                }
                const name = stepPlugin(step);
                const source = name && isNonPluginSource(name, step);
                if (source) out.sources++;
                if (name && !source && !REAPER_STOCK_RE.test(name) && !snapToOwned(name, known)) {
                    out.offPalette++;
                    if (!out.offPaletteNames.includes(name)) out.offPaletteNames.push(name);
                }
                const set = stepSettings(step);
                if (source) { /* a performance/source line has no knob to leave unset */ }
                else if (!set || set.length < 8 || /\bto taste\b/i.test(set)) out.empty++;
                else if (/\d/.test(set)) out.specific++;
            });
        }));
        out.impossibleNotes = [...new Set(out.impossibleNotes)];
        out.stackedNotes = [...new Set(out.stackedNotes)];
        return out;
    };

    // Only the entries matching gear the producer actually owns get sent, so this stays small next to
    // the owned-plugins list that already gets resent on every batch call (see KIT_BATCH).
    window.pluginControlsBrief = (owned) => {
        const hay = (owned || []).join(' | ');
        const hits = window.PLUGIN_CONTROLS.filter(e => e.match.test(hay));
        if (!hits.length) return '';
        return `KNOWN CONTROL SETS — the real controls on gear in this list. These are facts; never contradict them and never name a control not mentioned here for these units:\n${hits.map(e => `- ${e.name}: ${e.text}`).join('\n')}`;
    };

    // ==================== AI GENRE KIT ====================
    // Builds a full per-instrument chain sheet for a genre, constrained to the plugins the user
    // actually owns (window.db.ownedPlugins). Stored per-genre in window.db.genreKits so it survives
    // reloads and syncs; a snapshot can be attached to a Song Board song (see attachKitToSong).
    window.KIT_SLOTS = ['Vocals','Overdubs','Ad-Libs','Bass','Sub Bass','Keys / Synths','Guitars','Kick','Snare','Hats','Cymbals','Toms'];

    // The kit is built in small batches of instrument slots rather than one giant request. A single
    // call covering all 12 slots asks for thousands of tokens, which routinely outlives the Home
    // Assistant rest_command timeout — HA then returns an error page with no CORS headers and the
    // browser reports it as a CORS failure. Batching keeps every call the same size/duration as the
    // lyrics tools' calls, which are known to work on both backends.
    // Whatever gear context a batch carries gets resent on EVERY batch call, not just once, so more and
    // smaller batches means MORE total tokens burned per kit, not less — the opposite of what you want
    // against a free-tier tokens-per-minute cap. Phase 1 (selectPalette) is what actually fixed the
    // size of that context: batches now carry ~24 chosen plugins and only the control docs for those,
    // instead of the full 100+ owned list plus every control doc that matched it.
    // 3 stays the right batch size regardless, because the constraint it was chosen for hasn't moved:
    // it's the RESPONSE that has to stay small enough to come back before the HA rest_command times out,
    // and response length depends on slots-per-call, not on how much context went in.
    const KIT_BATCH = 3;
    const KIT_RETRIES = 2; // extra attempts per batch within a single sweep, on top of the first try
    const KIT_TIME_BUDGET_MS = 6 * 60 * 1000; // hard ceiling on a whole build — see the deadline note in generateGenreKit
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // ---------- THE ACTUAL CEILING: TOKENS PER MINUTE ----------
    // Groq's free tier meters tokens per MINUTE (8000 for gpt-oss-120b), and it costs a request at
    // prompt + max_completion_tokens — the ceiling you ASK for is reserved up front, whether the
    // answer ends up using it or not. Two things follow, and the kit used to get both wrong.
    //
    // One: no single call may ask for more than the whole minute. A request with a padded 8000-token
    // completion ceiling is by itself larger than the entire budget and is refused outright with
    // "Request too large", however short the real answer would have been. So every ceiling below is
    // sized for the answer, and nothing is padded "just in case".
    //
    // Two: firing calls and reacting to the 429s afterwards cannot work here. A refused call burns
    // the same wall-clock time as a successful one and comes back with nothing, and the retry rounds
    // then re-refuse for the same reason — which is exactly what "Vocals · Cymbals · Toms" was.
    // So spend the minute deliberately: reserve each call's cost in a rolling 60s window and wait for
    // room BEFORE sending. A kit is a few minutes' work on this tier; that's fine, failing isn't.
    // Whose minute we're spending depends entirely on which backend is configured — Groq's free 8000
    // and a paid Gemini tier are orders of magnitude apart. Hardcoding Groq's figure throttled every
    // backend to Groq's worst case, which on paid Gemini turns a 30-second build into a 3-minute one
    // for nothing. Read it live rather than caching: the user can change backend between builds.
    const tpmBudget = () => (window.__aiTpmBudget ? window.__aiTpmBudget() : 7200);
    const TPM_WINDOW = 60000;
    const tpmLog = [];         // { t, tokens } reservations made within the last minute
    // Deliberately pessimistic: over-reserving costs a pause, under-reserving costs a refused call.
    const estTokens = (s) => Math.ceil(String(s || '').length / 3.5);
    // Set to a reason while a build should wind down — the deadline passing, or the user pressing
    // stop. Checked inside the pacer as well as by the loops, because most of a stuck build's life is
    // spent asleep in here: without this, "stop" wouldn't take effect until the current pause ended.
    let kitStop = null;
    async function tpmReserve(tokens, onWait){
        for (;;){
            if (kitStop) throw new Error(kitStop);
            const now = Date.now();
            while (tpmLog.length && now - tpmLog[0].t >= TPM_WINDOW) tpmLog.shift();
            const used = tpmLog.reduce((a, e) => a + e.tokens, 0);
            // The empty-log case also has to pass unconditionally: a call bigger than the whole budget
            // would otherwise wait for room that can never appear, and hang the build forever.
            if (!tpmLog.length || used + tokens <= tpmBudget()) { const e = { t: now, tokens }; tpmLog.push(e); return e; }
            const waitMs = Math.max(1000, TPM_WINDOW - (now - tpmLog[0].t) + 300);
            if (onWait) onWait(Math.ceil(waitMs / 1000));
            // Wake often even when the wait is long: the countdown and the elapsed clock only refresh
            // on these ticks, and a screen frozen for fifteen seconds at a time is precisely what made
            // the old progress display look like it had hung.
            await sleep(Math.min(waitMs, 5000));
        }
    }
    // A rejection means the server's own accounting disagrees with ours, so make the window believe
    // what the server said: park the full budget for as long as it asked to be left alone.
    function tpmPenalize(ms){
        // An entry expires at t + TPM_WINDOW, so back-date t to land the expiry exactly where the
        // server asked. That puts it out of order, and both the eviction loop and the wait maths read
        // tpmLog[0] as the oldest entry — so re-sort rather than quietly corrupting the window.
        tpmLog.push({ t: Date.now() - TPM_WINDOW + Math.max(1000, Math.min(ms || 15000, TPM_WINDOW)), tokens: tpmBudget() });
        tpmLog.sort((a, b) => a.t - b.t);
    }

    // A 400 while requesting JSON mode means this model/backend doesn't support response_format at all,
    // so once one call has found that out, no later call in the build should pay to rediscover it.
    let kitJsonMode = true;

    async function callWithRetry(sys, user, opts){
        let lastErr;
        let useJson = !!opts.json && kitJsonMode;
        // opts.retries lets a caller cut this short. A request that's too long to come back inside the
        // timeout fails identically every attempt, so for those the useful next move is to make the
        // request smaller (see the retry rounds below), not to fire the same one twice more.
        const retries = opts.retries == null ? KIT_RETRIES : opts.retries;
        const promptCost = estTokens(sys) + estTokens(user);
        const cost = promptCost + (opts.maxTokens || 1500);
        for (let attempt = 0; attempt <= retries; attempt++){
            const held = await tpmReserve(cost, opts.onWait);
            try {
                const out = await window.ferrettAI(sys, user, { ...opts, json: useJson });
                // Admission and consumption are metered differently, and conflating them costs real
                // minutes. Getting IN needs prompt + the whole ceiling to fit under the cap, which is
                // why `cost` is reserved above — but what the window then carries for the next 60s is
                // only what was actually spent, and an answer is routinely a fraction of its ceiling.
                // Holding the unused ceiling reserved throttles the build to roughly one call a
                // minute for no reason at all.
                if (held) held.tokens = promptCost + estTokens(out);
                return out;
            }
            catch(e){
                lastErr = e;
                // A refused call consumed NOTHING — the server rejected it before the model ran — so
                // its reservation has to come back off the window. Leaving it charged the minute for
                // tokens nobody spent, and tpmPenalize then parked the full budget on top of it, so
                // every single refusal cost the build two minutes of imaginary usage. That
                // double-counting is what turned a retry ladder into a forty-minute grind.
                // A 400 that's really about SIZE has nothing to do with JSON mode either. Turning JSON
                // mode off wouldn't shrink the request by a single token — it would just cost the rest
                // of the kit its guaranteed-parseable output in exchange for nothing.
                const refused = e.status === 429 || /too large|tokens per minute|\bTPM\b|rate limit/i.test(e.message || '');
                if (held) held.tokens = refused ? 0 : promptCost;
                // The DAILY budget being gone is not a wait-and-retry situation — it comes back in
                // hours, not seconds, so the rest of the ladder is guaranteed to fail. Wind the whole
                // build down now and keep whatever already came back, rather than spending minutes
                // proving the same point once per outstanding slot.
                if (e.exhausted || (window.__aiIsDailyLimit && window.__aiIsDailyLimit(e.message))) {
                    // Short and distinct on purpose. The call that actually hit the wall reports the
                    // server's full message; the slots that never got asked carry this instead, so the
                    // summary reads as one cause and a list of casualties rather than the same
                    // paragraph printed twice.
                    kitStop = 'skipped — the daily token budget was already gone by this point';
                    throw e;
                }
                if (kitStop) throw e; // winding down: don't retry, don't back off, just get out
                // Dropping JSON mode changes the request, so it earns a free attempt that isn't
                // counted against `retries` — and it can only ever happen once, since useJson is
                // false from here on.
                if (e.status === 400 && useJson && !refused) { useJson = false; kitJsonMode = false; attempt--; continue; }
                if (refused) tpmPenalize(e.retryAfterMs);
                if (attempt < retries) {
                    const backoff = 700 * Math.pow(2, attempt) + Math.random()*300;
                    await sleep(Math.min(e.retryAfterMs || backoff, 9000));
                }
            }
        }
        throw lastErr;
    }

    // `controls` is computed once per kit from the selected palette (see selectPalette) rather than
    // per call from the whole owned list, so what ships here is only the gear actually in play.
    function kitSysPrompt(slots, controls, gear){
        // Only name the spaces this kit's palette actually contains. Listing one the model can't use
        // would contradict the palette-only rule two lines above it.
        const have = (window.SPACE_PLUGINS || []).filter(sp =>
            (gear || []).some(g => window.normPluginName(g).toLowerCase() === window.normPluginName(sp.name).toLowerCase()));
        const spaceRule = have.length
            ? `- What may legitimately follow a tone source is a SPACE, not another amp and not another cabinet. ${have.length === 1 ? 'You have one:' : `You have ${have.length}, and they are different things:`} ${have.map(sp => `${sp.name} is ${sp.kind}`).join(', and ')}. Pick whichever the sound actually calls for instead of reaching for the same one every time.`
            : `- What may legitimately follow a tone source is a SPACE, not another amp and not another cabinet — and only if the palette actually contains one.`;
        // Same shape as spaceRule: only name the instruments this kit's palette actually holds, so
        // the list never contradicts the palette-only rule. Without this the model treats every
        // chain as processing applied to audio that already exists, and silently skips the question
        // of where the sound comes from for a synth or drum part.
        const insts = (window.INSTRUMENT_PLUGINS || []).filter(ip =>
            (gear || []).some(g => window.normPluginName(g).toLowerCase() === window.normPluginName(ip.name).toLowerCase()));
        const instRule = insts.length
            ? `- VIRTUAL INSTRUMENTS ARE FAIR GAME, and for a programmed part they are where the chain should START. Name the instrument first, say what kind of patch or preset direction to take it in, then the processing after it. The instruments in this palette are: ${insts.map(ip => `${ip.name} (${ip.kind})`).join('; ')}. A part that is played in rather than sampled should say so.\n- For a HOST plugin, never name a specific library, pack or preset — this app cannot see which are installed, so a named one is a guess the producer discovers is missing. Say what KIND of patch to load and process that.`
            : `- If the palette contains a virtual instrument, a programmed part's chain may START with it — name the instrument, say what kind of patch, then the processing.`;
        return `You are a veteran hip-hop producer and mix engineer with deep, specific knowledge of how each sub-genre gets its sound — the actual processing moves, not generic advice.

You will be given a genre with its tempo/mood/texture, and the COMPLETE list of plugins the producer owns. These are CANDIDATE instrument roles, not a required checklist: ${slots.join(', ')}.

HARD RULES:
- The genre is a blank slate — it does NOT necessarily use every candidate role. If a role genuinely isn't part of how this genre is actually produced (e.g. no live Guitars in a pure 808/trap style, no Toms in a genre built entirely on programmed kick/snare/hats, no separate Ad-Libs in a genre that doesn't typically use them), OMIT it from your response entirely. Do not invent a generic chain just to fill the slot.
- It's completely normal, and expected for narrower genres, to return fewer entries than candidates given — even zero, if none of these specific candidates genuinely apply.
- For roles you DO include: use ONLY plugins from the palette you are given, plus Reaper's own stock effects (${REAPER_STOCK}). Never invent or suggest anything else. Match the names exactly as given. If you name a plugin that is NOT in the palette and NOT Reaper stock, it gets flagged as "not your gear" on the scorecard and the producer cannot use that step at all — it is wasted work. If the palette lacks something you want, use the closest alternative FROM THE PALETTE or a Reaper stock plugin.
- SETTINGS MUST BE REAL. Only name a control the plugin genuinely has, and only a value that control can genuinely reach. Many of these are emulations of hardware, so the control set is the hardware's: often only two knobs, and often a stepped selector that stops at a fixed list of frequencies instead of sweeping. A setting that reads plausibly but doesn't exist on the knob is WORSE than no setting — the producer only finds out once they're sat in front of the plugin trying to dial it in.
- ONE TONE SOURCE PER SIGNAL PATH. A real recorded electric instrument (bass, guitar) gets its sound ONE of three ways, and they are alternatives, not stages of a chain: (a) clean DI straight into the FX chain, (b) an amp-sim plugin, or (c) a NAM capture loaded in Gateway. NEVER put an amp sim and Gateway/NAM in the same chain — that is two amps in series, which is not a sound anyone is going for. Pick one route per recipe. If both routes genuinely suit the instrument, make them two SEPARATE recipes and say which route each one is.
- Gateway is the NAM route, and it loads its own impulse responses internally. NEVER follow Gateway with NadIR or any other IR loader — the cabinet is already handled inside Gateway, so a separate IR plugin is pure redundancy. NadIR is only for a chain that has no Gateway in it.
${spaceRule}
${instRule}
- If you are not certain of a plugin's exact control name or its range, DESCRIBE THE MOVE using what that plugin actually exposes rather than inventing a figure: "Pultec MEQ-5 — dip the low-mid band, dial around 6" beats a made-up "cut 3dB at 420Hz". Prefer the nearest real stepped value over an arbitrary one. Never write a bare "to taste" — always say which knob and which direction.
- Where you ARE certain (ReaEQ, ReaComp, TDR Nova, Kilohearts, Vital and other plain digital tools with continuous parameters), stay fully specific: exact Hz, dB, ms, ratios.
- Order the chain the way it should sit in the insert slots, first to last.
- ${slots.length === 1 ? 'Give 1-2 recipes for this role — two only if the genre has a genuinely distinct second option worth having. Keep the whole reply compact; a short complete answer beats a long truncated one.' : 'Give 1-3 recipes per included role — your call. More where the genre has genuinely distinct options worth having, one where the genre demands a specific sound.'}
- Be genre-accurate. A Memphis horrorcore snare and a G-funk snare are not the same chain.
- Keep each "why" to one sentence.
- Give each recipe an evocative TITLE, not a technical description — the kind of 2-4 word phrase that names a vibe, like a mixtape or song title (e.g. "Crenshaw Cruisin'" for a laid-back G-Funk bassline, "Basement Static" for a lo-fi horrorcore snare). Never a literal description like "Distorted 808 Chain" or "Chain 1".

YOUR PALETTE — the ONLY non-Reaper plugins you may use:
${gear.join(', ')}

${controls ? '\n' + controls + '\n' : ''}
Reply with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:
{"instruments":[{"slot":"<exact candidate name>","recipes":[{"name":"evocative vibe title","chain":["Plugin Name — specific settings","Plugin Name — specific settings"],"why":"one sentence"}]}]}

Only slot names from this exact list may appear, and only if genuinely used: ${slots.join(', ')}.`;
    }

    function extractJson(text){
        let t = (text||'').trim();
        t = t.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
        const first = t.indexOf('{'), last = t.lastIndexOf('}');
        if (first > 0 || last < t.length-1) { if (first >= 0 && last > first) t = t.slice(first, last+1); }
        try { return JSON.parse(t); }
        catch(e){ return JSON.parse(t.replace(/,(\s*[}\]])/g, '$1')); } // common near-miss: a trailing comma before a closing bracket
    }

    // When a response gets cut off mid-way (the model hits its output ceiling, or the hop times out
    // just after the first instrument came back), the JSON is unparseable and the WHOLE batch used to
    // be thrown away — including the instruments that arrived intact before the cut. That's the single
    // biggest reason a batch like "Guitars, Kick, Snare" fails over and over: it's a long answer, it
    // gets truncated, and every retry truncates in the same place.
    //
    // So: walk the "instruments" array by hand, tracking string/escape state and brace depth, and keep
    // every element that closed properly. A trailing half-written element is simply dropped, and its
    // slot goes back on the pending list to be asked for on its own.
    function salvageInstruments(text){
        const t = String(text || '');
        const key = t.indexOf('"instruments"');
        if (key < 0) return [];
        const arr = t.indexOf('[', key);
        if (arr < 0) return [];
        const out = [];
        let depth = 0, start = -1, inStr = false, esc = false;
        for (let i = arr + 1; i < t.length; i++){
            const ch = t[i];
            if (inStr){
                if (esc) esc = false;
                else if (ch === '\\') esc = true;
                else if (ch === '"') inStr = false;
                continue;
            }
            if (ch === '"') { inStr = true; continue; }
            if (ch === '{') { if (depth === 0) start = i; depth++; continue; }
            if (ch === '}') {
                depth--;
                if (depth === 0 && start >= 0){
                    try { out.push(JSON.parse(t.slice(start, i + 1))); } catch(e){}
                    start = -1;
                }
                continue;
            }
            if (ch === ']' && depth === 0) break; // end of the instruments array
        }
        return out;
    }

    // ==================== PHASE 1: PICK THE PALETTE ====================
    // The kit used to resend the ENTIRE owned list on every batch call, and once the control-set
    // reference arrived it was resending that too — both of them four times over, for gear that
    // mostly never gets used in the genre being built. So: ask once which plugins this genre actually
    // calls for, then every batch carries only that shortlist and only the control docs belonging to
    // it. One extra call up front pays for itself several times over, and the reference block can
    // afford to be properly detailed because only the selected handful ever ships.
    //
    // It also makes for a better kit. Choosing the palette once, up front, gives every instrument in
    // the sheet the same working set — which is what a producer's template actually looks like —
    // instead of each batch independently rummaging through 150 plugins.
    const REAPER_STOCK = 'ReaEQ, ReaComp, ReaGate, ReaDelay, ReaVerbate, ReaXcomp, ReaPitch and the bundled JS effects are always available in Reaper and never need to be in the palette';
    const PALETTE_TARGET = 24;
    const PALETTE_MIN = 8; // fewer survivors than this means the pick genuinely failed, not that the genre is narrow

    // The model hands names back as prose, so "1176 Rev A" has to resolve to whatever the owned list
    // actually calls it before we trust it. Exact, then case-insensitive, then containment either way
    // with a length floor so a 2-character entry can't swallow everything. Anything that still doesn't
    // resolve was invented, and gets dropped rather than quietly passed through to the next phase.
    function snapToOwned(name, owned){
        const norm = window.normPluginName || (s => String(s || '').trim());
        const n = norm(name); if (n.length < 2) return null;
        const low = n.toLowerCase();
        // Compare on the normalized form, but always hand back the owned list's own spelling — that
        // string is what gets shown and re-sent to the model, so it has to stay exactly as recorded.
        const pairs = owned.map(o => ({ o, n: norm(o) }));
        const exact = pairs.find(p => p.n === n) || pairs.find(p => p.n.toLowerCase() === low);
        if (exact) return exact.o;
        if (low.length < 4) return null;
        const hit = pairs.find(p => p.n.length >= 4 && p.n.toLowerCase().includes(low))
                 || pairs.find(p => p.n.length >= 4 && low.includes(p.n.toLowerCase()));
        if (hit) return hit.o;
        // Models routinely drop hyphens ("SSL E-Channel" → "SSL E Channel") or swap them for spaces.
        // Strip all hyphens and collapse whitespace before a second containment pass so the match
        // doesn't fail over punctuation the model casually omits.
        const dehyphen = s => s.toLowerCase().replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();
        const dLow = dehyphen(n);
        const dHit = pairs.find(p => p.n.length >= 4 && dehyphen(p.n) === dLow)
                  || pairs.find(p => p.n.length >= 4 && dehyphen(p.n).includes(dLow))
                  || pairs.find(p => p.n.length >= 4 && dLow.includes(dehyphen(p.n)));
        return dHit ? dHit.o : null;
    }

    async function selectPalette(genre, meta, owned){
        const sys = `You are a veteran hip-hop producer. You will be given a genre and the COMPLETE list of plugins a producer owns. Choose the working palette you would actually reach for to produce a whole track in this genre — sound sources AND processing, between them covering every one of these roles: ${window.KIT_SLOTS.join(', ')}.

Pick around ${PALETTE_TARGET} plugins and never more than ${PALETTE_TARGET}. Choose ONLY from the list you are given, and copy each name EXACTLY as it appears there — do not rename, expand, abbreviate or tidy it. ${REAPER_STOCK}, so don't spend picks on those. Favour a tight, coherent set that a producer would keep loaded for this style over a broad survey of everything owned; genre accuracy matters far more than coverage.

Reply with ONLY valid JSON, no markdown fences, no commentary: {"palette":["exact name","exact name"]}`;
        const user = `GENRE: ${genre}
TEMPO: ${meta.bpm[0]}-${meta.bpm[1]} BPM
MOOD: ${meta.mood}
TEXTURE: ${meta.texture}

OWNED PLUGINS (${owned.length}):
${owned.join(', ')}`;
        const parsed = extractJson(await callWithRetry(sys, user, { creative: false, json: true }));
        const raw = Array.isArray(parsed && parsed.palette) ? parsed.palette : [];
        const picked = [];
        raw.forEach(n => { const o = snapToOwned(n, owned); if (o && !picked.includes(o)) picked.push(o); });
        // The cap was only ever a request in the prompt, and a model that ignores it hands back a
        // palette twice the size it was asked for — which puts the whole point of phase 1 (small,
        // coherent context on every batch call) straight back where it started. Enforce it here.
        // It's a hard cap rather than a nicety on a per-minute token budget: the palette is resent,
        // with the control docs for everything in it, on every single batch call, so each plugin over
        // the line is paid for four or five times over.
        return picked.slice(0, PALETTE_TARGET);
    }

    // Every generated kit is kept — regenerating adds a new entry rather than overwriting, so past
    // kits stay browsable. Reads normalize the old single-kit-per-genre shape (from before this was
    // a history) into a one-entry array in place, so any kit already generated for real isn't lost.
    function kitHistory(genre){
        window.db.genreKits = window.db.genreKits || {};
        const raw = window.db.genreKits[genre];
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        const migrated = [{ id: raw.id || raw.generatedAt || Date.now(), ...raw }];
        window.db.genreKits[genre] = migrated;
        return migrated;
    }
    function findKit(genre, kitId){ return kitHistory(genre).find(k => k.id === kitId) || null; }
    function songsForKit(kitId){ return (window.db.songBoard || []).filter(s => s.kitId === kitId); }
    window.kitHistory = kitHistory; window.findKit = findKit; window.songsForKit = songsForKit; // shared with the Song Board closure

    // Which recipes are currently in inline-edit mode, keyed "kitId:slot:recipeIndex". Kept outside
    // renderGenreKit so it survives the re-renders that happen while editing elsewhere on the page.
    const kitRecipeEditSet = new Set();
    const kitRecipeKey = (kitId, slot, ri) => kitId+':'+slot+':'+ri;

    // Progress is reported against the KIT, not against whichever sweep happens to be running. The old
    // "3 / 4 batches" renumbered itself every retry round — it counted up, reset, counted up again —
    // so a build that was genuinely making progress and one that was spinning looked identical, and
    // the number meant nothing either way. Instrument roles filled, out of the twelve candidates, only
    // ever moves forward. The clock and the stop button are there because the honest answer to "how
    // long is this going to take" on a rate-capped tier is "minutes", and that's only alarming when
    // nothing on screen admits it.
    function kitProgress(genre, done, label, startedAt){
        const disp = document.getElementById('recipe-display'); if (!disp) return;
        const total = window.KIT_SLOTS.length;
        const pct = Math.round((done / total) * 100);
        const secs = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        const clock = `${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
        disp.innerHTML = `<div class="h-full flex flex-col items-center justify-center gap-4 min-h-[400px] text-center px-8">
            <div class="text-[13px] font-bold tracking-widest text-[#FF88FF] uppercase animate-pulse">🤖 Building the ${String(genre).replace(/</g,'')} kit…</div>
            <div class="w-full max-w-xs h-1.5 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-[#FF88FF] transition-all duration-300" style="width:${pct}%"></div></div>
            <div class="text-[10px] text-[#E2E8F0]/45 font-mono">${done} / ${total} instrument roles · ${clock} elapsed</div>
            <div class="text-[10px] text-[#E2E8F0]/45 font-mono max-w-sm">now doing <span class="text-[#FF88FF]/80">${String(label).replace(/</g,'')}</span></div>
            <button id="btn-kit-stop" type="button" class="text-[9px] font-bold tracking-widest px-3 py-1.5 rounded border border-[#FF5A5A40] text-[#FF5A5A]/70 hover:text-[#FF5A5A] hover:bg-[#FF5A5A]/10 cursor-pointer mt-1">■ STOP &amp; KEEP WHAT'S DONE</button>
        </div>`;
        document.getElementById('btn-kit-stop')?.addEventListener('click', () => { kitStop = 'stopped — kept the roles that had already come back'; });
    }

    window.generateGenreKit = async (genre, opts) => {
        opts = opts || {}; // opts.quiet: build and return the kit without taking over the display (the A/B runner)
        const disp = document.getElementById('recipe-display'); if (!disp) return null;
        // Gate exactly the way the lyrics tools do, using the co-pilot's own helper.
        const configured = window.__aiIsConfigured ? window.__aiIsConfigured()
            : (()=>{ try { const c=JSON.parse(localStorage.getItem('ferrett_os_ai_v1')||'{}'); return c.mode==='groq'?!!c.groqKey:c.mode==='gemini'?!!c.geminiKey:!!(c.url&&c.token); } catch(e){ return false; } })();
        if (!configured) { window.__openAiModal && window.__openAiModal(); return; }
        if (!window.ferrettAI) { alert('AI co-pilot not loaded.'); return; }

        const owned = (window.db.ownedPlugins || []).filter(Boolean);
        if (!owned.length) { alert('Add the plugins you own first — Toolbox → AI Assistant → your gear list.'); return; }

        const meta = window.getGenreMeta(genre);
        const bpmOverride = document.getElementById('ai-override-bpm')?.value.trim();
        const moodOverride = document.getElementById('ai-override-mood')?.value.trim();
        const texOverride = document.getElementById('ai-override-texture')?.value.trim();
        // Recorded on the kit alongside mood/texture so they travel to the Lyria panel later. Key also
        // goes into the kit brief itself — it genuinely shapes what chain a producer reaches for.
        const keyOverride = document.getElementById('ai-override-key')?.value.trim();
        const negOverride = document.getElementById('ai-override-negative')?.value.trim();

        const batches = [];
        for (let i = 0; i < window.KIT_SLOTS.length; i += KIT_BATCH) batches.push(window.KIT_SLOTS.slice(i, i + KIT_BATCH));

        // A hard wall-clock budget for the whole build, because the retry ladder has no idea what it
        // costs any more. Four rounds over twelve slots is up to forty-odd calls, and every one of
        // them now waits its turn for token budget — so what used to be a quick flurry of failures
        // became a grind with no visible end. Whatever is done when the clock runs out gets saved as
        // a partial kit, which is strictly better than a build the user has to give up on.
        const startedAt = Date.now();
        const deadline = startedAt + KIT_TIME_BUDGET_MS;
        // Opened here rather than around just the recipe calls: a build is the palette pick, four
        // batches, every retry they needed and the overview, and the number is only honest if it
        // covers all of them. Closed on the way out, including the failure path.
        window.__aiUsage?.begin(`Recipe Kit: ${genre}`);
        kitStop = null;
        const windDown = () => kitStop || (Date.now() > deadline ? (kitStop = `gave up after ${Math.round(KIT_TIME_BUDGET_MS/60000)} minutes — the rest never came back`) : null);

        // Phase 1. A failed or too-thin pick isn't fatal — fall back to the old behaviour of handing
        // over the whole owned list, which still produces a kit, just a more expensive one.
        kitProgress(genre, 0, 'picking the palette for this genre', startedAt);
        let palette = [];
        try { palette = await selectPalette(genre, {bpm: meta.bpm, mood: moodOverride || meta.mood, texture: texOverride || meta.texture}, owned); } catch (pe) { palette = []; }
        const usingPalette = palette.length >= PALETTE_MIN;
        const gear = usingPalette ? palette : owned;

        const ctx = `GENRE: ${genre}
DESCRIPTION: ${meta.desc || ''}
TEMPO: ${bpmOverride || `${meta.bpm[0]}-${meta.bpm[1]}`} BPM
MOOD: ${moodOverride || meta.mood}
TEXTURE: ${texOverride || meta.texture}${keyOverride ? `\nKEY: ${keyOverride}` : ''}

${usingPalette ? `YOUR PALETTE FOR THIS GENRE (${gear.length}) — build every chain from these` : `OWNED PLUGINS (${gear.length}) — use only these`}:
${gear.join(', ')}`;

        // Phase 2 context, built once and reused by every batch and every retry.
        const controls = window.pluginControlsBrief(gear);

        // Runs one sweep over a list of {slots} entries, appending anything that comes back into
        // `instruments` and returning whichever entries still failed, each carrying the actual error
        // message from its last attempt — not just which slot failed, but why, so a persistent failure
        // is diagnosable instead of just "couldn't be reached".
        // Slots that have already produced recipes, so a later round never asks for them again and a
        // salvaged duplicate can't land twice.
        const have = new Set();
        // The model is told to copy slot names exactly, and mostly does — but "Guitar" for "Guitars" or
        // "Keys/Synths" for "Keys / Synths" happens, and those have to land on the canonical slot or
        // the same role gets asked for again and comes back twice under two spellings. Anything that
        // still doesn't resolve is kept under its own name rather than thrown away.
        const norm = (s) => String(s||'').toLowerCase().replace(/[^a-z]/g,'').replace(/s$/,'');
        function keep(list){
            let n = 0;
            (list || []).forEach(x => {
                if (!x || !x.slot || !Array.isArray(x.recipes) || !x.recipes.length) return;
                const raw = String(x.slot).trim();
                const slot = window.KIT_SLOTS.find(s => s.toLowerCase() === raw.toLowerCase())
                    || window.KIT_SLOTS.find(s => norm(s) === norm(raw))
                    || raw;
                if (have.has(slot)) return;
                have.add(slot); instruments.push({ ...x, slot }); n++;
            });
            return n;
        }

        async function runSweep(pending, label){
            const stillFailed = [];
            for (let b = 0; b < pending.length; b++) {
                const slots = pending[b].slots.filter(s => !have.has(s));
                if (!slots.length) continue; // an earlier round already covered these
                if (windDown()) { stillFailed.push({ slots, error: kitStop }); continue; }
                const what = `${label}: ${slots.join(', ')}`;
                kitProgress(genre, have.size, what, startedAt);
                try {
                    const raw = await callWithRetry(kitSysPrompt(slots, controls, gear), ctx, {
                        creative: true, json: true,
                        // Multi-slot gets one blip retry, then the splitter shrinks it. Single slots get
                        // none — the round loop below already retries them, with far better spacing than
                        // an inner backoff, and stacking the two meant a slot that was simply never
                        // coming back cost 9 calls against the rate cap.
                        retries: slots.length > 1 ? 1 : 0,
                        timeoutMs: 90000,
                        // Big enough that a real answer fits, small enough that prompt + ceiling clears
                        // the per-minute cap. Both matter: too high and the request is refused before
                        // the model runs, too low and it truncates and the slot has to be asked for
                        // again — which costs a whole extra call at this rate limit.
                        maxTokens: slots.length > 1 ? 3000 : 1800,
                        // The pacer holds calls back to stay inside the cap, which can mean a genuine
                        // half-minute of nothing happening. Say so, rather than looking hung.
                        onWait: (secs) => kitProgress(genre, have.size, `${what} — pausing ${secs}s for the token-per-minute cap`, startedAt),
                    });
                    let parsed = null, salvaged = false;
                    try { parsed = extractJson(raw); }
                    catch (pe) {
                        // Truncated or otherwise unparseable — rescue whatever came back whole rather
                        // than binning the entire batch, then requeue only the slots still missing.
                        const rescued = salvageInstruments(raw);
                        if (!rescued.length) throw new Error('unreadable response (likely cut off mid-answer)');
                        keep(rescued); salvaged = true;
                    }
                    if (!salvaged) {
                        // A malformed shape (not an array at all) is a real failure — retry it. An empty
                        // or partial array is a legitimate "this genre doesn't use these roles" answer —
                        // accept it as-is, don't retry just because the model correctly said "none of these".
                        if (!parsed || !Array.isArray(parsed.instruments)) throw new Error('malformed response shape');
                        keep(parsed.instruments);
                        continue; // a clean parse is the final word on every slot it covered
                    }
                    const missing = slots.filter(s => !have.has(s));
                    if (missing.length) stillFailed.push({ slots: missing, error: 'response was cut off before these came back' });
                } catch (be) {
                    stillFailed.push({ slots, error: (be && be.message) || String(be) });
                }
            }
            return stillFailed;
        }

        const instruments = [];
        try {
            // Keeps re-sweeping whatever's still failing, with a longer cooldown each round, instead of
            // a single fixed "one extra try" — most real flakiness (rate limits, a slow hop, one bad
            // parse) clears up given enough space between attempts, and this scales to however much
            // space it actually needs rather than a single guessed pause. Stops early once nothing's
            // left, or after MAX_ROUNDS if something's genuinely, persistently broken (bad key, HA down).
            // Every retry round after the first asks for ONE slot per call instead of three. Re-sending
            // an identical 3-slot request is what made failures look permanent: a batch that's too long
            // to come back inside the timeout is too long every single time, so three identical attempts
            // buy nothing. One slot is a third of the answer, and gets through where the trio never did.
            // Three, not four. Each round costs a call per outstanding slot and every call now queues
            // for token budget, so rounds are minutes rather than seconds — and a slot that has failed
            // three times over several minutes is not one round away from working.
            const MAX_ROUNDS = 3;
            let pending = batches.map(slots => ({ slots }));
            for (let round = 0; round < MAX_ROUNDS && pending.length && !windDown(); round++) {
                if (round > 0) {
                    // No cooldown here any more. Spacing calls out across the minute is the pacer's
                    // job now, and it does it from the actual token budget rather than a guessed
                    // 5s/10s/15s that was always either too short to matter or dead time.
                    pending = pending.flatMap(p => p.slots.map(s => ({ slots: [s], error: p.error })));
                }
                pending = await runSweep(pending, round === 0 ? 'building' : `retry pass ${round+1}/${MAX_ROUNDS-1}`);
            }
            const failed = pending.map(p => ({ label: p.slots.join(', '), error: p.error }));
            if (!instruments.length) throw new Error(failed[0]?.error || 'No slots came back.');

            kitProgress(genre, have.size, 'writing the overview', startedAt);
            let overview = '';
            // Skip it entirely when winding down: the roles are what the user is waiting for, and
            // spending another paced call on a nice-to-have paragraph after the clock has already run
            // out is the opposite of what stopping means.
            if (!kitStop) try {
                overview = await callWithRetry(
                    'You are a veteran hip-hop producer. Reply with 2-3 plain sentences and nothing else — no JSON, no markdown, no preamble.',
                    `In 2-3 sentences, describe the overall sonic approach for producing in this style:\n\nGENRE: ${genre}\nTEMPO: ${meta.bpm[0]}-${meta.bpm[1]} BPM\nMOOD: ${meta.mood}\nTEXTURE: ${meta.texture}`,
                    { creative: true, maxTokens: 700 });
            } catch (oe) { overview = ''; }

            const hist = kitHistory(genre);
            // Which model produced it, recorded on the kit itself. Without this a saved kit is an
            // anonymous artefact and any later comparison between models is guesswork.
            const newKit = { id: Date.now()+Math.floor(Math.random()*1000), genre, generatedAt: Date.now(), overview: (overview||'').trim(), instruments, palette: usingPalette ? palette : null, partial: failed.length ? failed : null,
                moodOverride: moodOverride || null, texOverride: texOverride || null,
                keyOverride: keyOverride || null, negOverride: negOverride || null,
                model: window.__aiModelLabel ? window.__aiModelLabel() : null, buildSecs: Math.round((Date.now()-startedAt)/1000),
                usage: window.__aiUsage?.end() || null };
            hist.push(newKit);
            window.db.genreKits[genre] = hist;
            window.saveData();
            if (!opts.quiet) window.renderGenreKit(genre, { kitId: newKit.id });
            return newKit;
        } catch(e) {
            // A failed build still spent money, and leaving the scope open would silently fold that
            // spend into whatever gets built next. Close it and report it on the error card, because
            // "it broke AND it cost you 6¢" is the part worth knowing.
            const spent = window.__aiUsage?.end();
            const spentLine = window.__aiUsage?.summary(spent);
            if (opts.quiet) return null; // the A/B runner renders its own summary; don't stamp on it
            disp.innerHTML = `<div class="h-full flex flex-col items-center justify-center gap-3 min-h-[400px] text-center px-6"><div class="text-[12px] font-bold tracking-widest text-[#FF5A5A] uppercase">⚠ Kit build failed</div><div class="text-[11px] text-[#E2E8F0]/60 font-mono max-w-md">${(e.message||'Unknown error').replace(/</g,'')}</div>${spentLine ? `<div class="text-[10px] text-[#FFD60A]/60 font-mono">spent anyway: ${spentLine}</div>` : ''}<button id="btn-kit-retry" class="btn-euterpe px-4 py-2 text-[10px] mt-2" style="border-color:#FF88FF80;color:#FF88FF">↻ TRY AGAIN</button></div>`;
            document.getElementById('btn-kit-retry')?.addEventListener('click', () => window.generateGenreKit(genre));
            return null;
        }
    };

    // ==================== MODEL A/B ====================
    // Builds the SAME genre on each model in turn and puts the scorecards side by side. Sequential on
    // purpose: the pacer's token window is shared, and running these concurrently would have them
    // rate-limiting each other and scoring the contention rather than the models.
    // Every kit produced is a real saved kit — nothing here is throwaway, so a winner can just be kept.
    const AB_DEFAULTS = {
        gemini: ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
        groq:   ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'],
        ha:     ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'],
    };
    window.kitModelAB = async (genre, models) => {
        const disp = document.getElementById('recipe-display'); if (!disp) return;
        const mode = window.__aiGetMode ? window.__aiGetMode() : 'ha';
        const list = (models && models.length) ? models : AB_DEFAULTS[mode] || AB_DEFAULTS.ha;
        const restore = window.__aiGetModel();
        const rows = [];
        try {
            for (let i = 0; i < list.length; i++) {
                window.__aiSetModel(list[i]);
                const kit = await window.generateGenreKit(genre, { quiet: true });
                rows.push({ model: list[i], kit, score: kit ? window.scoreKit(kit) : null });
            }
        } finally {
            // Always hand the setting back — including when a build throws or the user hits stop.
            // Leaving the app silently pointed at whichever model the comparison happened to end on
            // is a nasty surprise the next time they build a kit for real.
            window.__aiSetModel(restore);
        }
        const esc = (s) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const cols = rows.map(r => {
            if (!r.kit) return `<td class="align-top p-2 text-[10px] text-[#FF5A5A]/80">build failed</td>`;
            const s = r.score;
            const roles = (r.kit.instruments||[]).length;
            return `<td class="align-top p-2 text-[10px] text-[#E2E8F0]/70 font-mono">
                <div class="text-[#00FF88] font-bold mb-1">${roles} / ${window.KIT_SLOTS.length} roles</div>
                <div>${r.kit.buildSecs}s · ${s.recipes} recipes · ${s.steps} steps</div>
                ${r.kit.usage && r.kit.usage.calls ? `<div class="text-[#FFD60A]/70">${esc(window.__aiUsage.summary(r.kit.usage))}</div>` : ''}
                <div class="mt-1">verifiable: <b>${s.checked}</b></div>
                <div>committed: <b>${s.checkedSpecific}</b>${s.checked?` <span class="opacity-50">(${Math.round(s.checkedSpecific/s.checked*100)}%)</span>`:''}</div>
                <div class="${s.impossible?'text-[#FF9E9E]':''}">impossible: <b>${s.impossible}</b>
                    ${s.impossible?`<div class="text-[9px] mt-0.5 leading-snug text-[#FF9E9E]/80">${s.impossibleNotes.map(esc).join('<br>')}</div>`:''}
                </div>
                <div class="${s.offPalette?'text-[#FF9E9E]':''}">not your gear: <b>${s.offPalette}</b></div>
                <div class="${s.empty?'text-[#FF9E9E]':''}">no setting: <b>${s.empty}</b></div>
                <div>with numbers: <b>${s.specific}</b></div>
            </td>`;
        }).join('');
        disp.innerHTML = `<div class="animate-fade-in">
            <div class="border-b border-[#FF88FF25] pb-4 mb-5">
                <div class="text-[9px] tracking-widest text-[#FF88FF]/60 uppercase mb-1">⚖ Model comparison · ${esc(genre)}</div>
                <h2 class="text-[16px] font-bold tracking-widest text-[#FF88FF] uppercase">Same genre, ${rows.length} model${rows.length===1?'':'s'}</h2>
            </div>
            <div class="overflow-x-auto"><table class="w-full border-collapse">
                <tr>${rows.map(r=>`<th class="text-left p-2 text-[9px] tracking-widest uppercase text-[#00E5FF] border-b border-[#00E5FF25] font-mono">${esc(r.model)}</th>`).join('')}</tr>
                <tr>${cols}</tr>
            </table></div>
            <div class="text-[9px] text-[#E2E8F0]/45 leading-relaxed mt-4 p-3 rounded border border-white/10">
                <b>impossible</b> = a control that unit doesn't have, or a value off its stepped range — measured only over the <b>verifiable</b> steps, so read those two together.
                <b>committed</b> = of those verifiable steps, how many put a real figure on the documented unit instead of hedging. The percentage is the honest comparison between models: raising <b>verifiable</b> is easy, raising <b>committed</b> without raising <b>impossible</b> is the hard part.
                <b>not your gear</b> = a plugin named that isn't in the palette it was given and isn't Reaper stock, i.e. invented.
                <b>no setting</b> = a plugin named with nothing to actually do to it.
                All ${rows.length} kits were saved — browse them with the arrows and keep whichever won.
            </div>
        </div>`;
    };

    // Builds the "2. Select Instrument" list (left column). It shows BOTH sources of chains for this
    // genre, because there are two and always were: the roles in whichever AI kit is on screen, and
    // the recipes typed by hand into the Cookbook form (or brought in by IMPORT PACK / FRANKENSTEIN).
    // For a while this list was kit-only, which meant every hand-written recipe was still saved,
    // still searchable, still linkable from Channel Settings — and completely unreachable from the
    // tab that owns it. A genre with six typed recipes and no kit said "None made yet".
    // `kit` may be null (genre with no kits yet); either group is omitted when empty.
    function renderInstMenu(genre, kit, activeSlot) {
        const instMenuEl = document.getElementById('inst-menu'); if (!instMenuEl) return;
        const esc = (s) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const head = (txt, color) => `<div class="text-[8px] tracking-[0.18em] uppercase font-bold px-1 pt-2 pb-1" style="color:${color}99">${txt}</div>`;
        const parts = [];

        const insts = (kit && kit.instruments) || [];
        if (insts.length) {
            parts.push(head(`AI kit · ${insts.length} role${insts.length===1?'':'s'}`, '#FF88FF'));
            parts.push(...insts.map(inst => {
                const on = inst.slot === activeSlot;
                const n = (inst.recipes || []).length;
                return `<button type="button" class="kit-inst-btn w-full text-left px-3 py-2 text-[10px] rounded tracking-widest uppercase truncate font-bold border transition-colors ${on ? 'bg-[#FF88FF]/15 border-[#FF88FF60] text-[#FF88FF]' : 'border-transparent text-[#FF88FF]/60 hover:text-[#FF88FF] hover:bg-[#FF88FF]/5'}" data-slot="${esc(inst.slot)}">${esc(inst.slot)} <span class="opacity-50 normal-case">(${n})</span></button>`;
            }));
        }

        const written = (window.db.cookbook || []).filter(r => r.genre === genre);
        if (written.length) {
            parts.push(head(`Your recipes · ${written.length}`, '#00FF88'));
            parts.push(...written.map(r => {
                const on = r.id === window.currentCookbookId;
                return `<button type="button" class="cb-recipe-btn w-full text-left px-3 py-2 text-[10px] rounded tracking-widest uppercase truncate font-bold border transition-colors ${on ? 'active-inst' : 'border-transparent text-[#00FF88]/60 hover:text-[#00FF88] hover:bg-[#00FF88]/5'}" data-id="${r.id}">${esc(r.inst || 'Untitled')}</button>`;
            }));
        }

        if (!parts.length) parts.push('<div class="text-[10px] text-[#E2E8F0]/30 italic px-1 py-2">Nothing here yet — hit 🤖 AI KIT above, or + ADD RECIPE to write one yourself.</div>');
        instMenuEl.innerHTML = parts.join('');
        instMenuEl.querySelectorAll('.kit-inst-btn').forEach(b => b.addEventListener('click', () => window.renderGenreKit(genre, { kitId: kit.id, slot: b.dataset.slot })));
        instMenuEl.querySelectorAll('.cb-recipe-btn').forEach(b => b.addEventListener('click', () => window.selectInst(parseInt(b.dataset.id, 10))));
    }
    window.renderInstMenu = renderInstMenu;

    // opts.kitId: a real id shows that saved kit;
    // undefined defaults to the newest kit when history exists. opts.slot lets an
    // instrument click re-render just the right pane's selection. The left "2. Select Instrument"
    // list always mirrors whichever kit is currently on screen via renderKitInstMenu.
    window.renderGenreKit = (genre, opts) => {
        opts = opts || {};
        const disp = document.getElementById('recipe-display'); if (!disp) return;
        const hist = kitHistory(genre);
        if (!hist.length) { window.generateGenreKit(genre); return; }
        const esc = (s) => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const ordered = hist.slice().reverse(); // newest first for browsing
        let kitId = opts.kitId === undefined ? ordered[0].id : opts.kitId;
        let idx = ordered.findIndex(k => k.id === kitId);
        if (idx < 0) { idx = 0; kitId = ordered[0].id; } // dangling id — fall back to newest
        const kit = ordered[idx];

        const total = ordered.length;
        const olderId = idx+1 < total ? ordered[idx+1].id : null;
        const newerId = idx > 0 ? ordered[idx-1].id : null;
        const navLabel = `SAVED ${idx+1} / ${total}`;
        const navBar = `<div class="flex items-center gap-2 mb-4">
            <button id="kit-nav-older" type="button" class="w-7 h-7 shrink-0 flex items-center justify-center rounded border border-[#FF88FF30] text-[#FF88FF] text-[11px] ${olderId==null?'opacity-25 pointer-events-none':'hover:bg-[#FF88FF]/10 cursor-pointer'}" title="Older saved kit">◀</button>
            <div class="flex-1 text-center text-[9px] tracking-widest text-[#FF88FF]/70 font-bold uppercase">${navLabel}</div>
            <button id="kit-nav-newer" type="button" class="w-7 h-7 shrink-0 flex items-center justify-center rounded border border-[#FF88FF30] text-[#FF88FF] text-[11px] ${newerId==null?'opacity-25 pointer-events-none':'hover:bg-[#FF88FF]/10 cursor-pointer'}" title="Newer">▶</button>
            <button id="kit-nav-new" type="button" class="text-[9px] font-bold tracking-widest px-2.5 py-1.5 rounded border border-[#00FF8850] text-[#00FF88] hover:bg-[#00FF88]/10 cursor-pointer ml-1 shrink-0">+ NEW</button>
        </div>`;

        const songs = window.db.songBoard || [];
        const attachedSongs = songsForKit(kit.id);
        const when = new Date(kit.generatedAt).toLocaleString();
        const insts = kit.instruments || [];
        const active = insts.find(i => i.slot === opts.slot) || insts[0] || null;

        renderInstMenu(genre, kit, active && active.slot);

        const recipeHtml = !active ? `<div class="h-full flex items-center justify-center text-[#E2E8F0]/30 text-[11px] tracking-widest uppercase border-2 border-dashed border-[#FF88FF10] rounded-lg min-h-[300px] text-center px-6">${insts.length===0?'This kit has no instruments left — delete the kit itself, or hit + NEW to build another.':"This genre didn't come back with any usable instrument roles."}</div>` :
            !(active.recipes||[]).length ? `<div class="text-[10px] text-white/25 italic py-4 text-center">No recipes left for this instrument — deleted them all. Use 🗑 DELETE INSTRUMENT above to drop the slot too.</div>` :
            (active.recipes || []).map((r, ri) => {
                const key = kitRecipeKey(kit.id, active.slot, ri);
                if (kitRecipeEditSet.has(key)) {
                    return `<div class="${ri>0?'pt-5 mt-5 border-t border-white/10':''}" data-ri="${ri}">
                        <div class="flex justify-end mb-2">
                            <button type="button" class="kit-r-done text-[9px] font-bold tracking-widest text-[#00FF88] px-2 py-1.5 rounded border border-[#00FF8850] hover:bg-[#00FF88]/10 shrink-0" data-ri="${ri}">✓ DONE</button>
                        </div>
                        <div class="text-[8px] text-[#FF88FF]/40 tracking-widest uppercase mb-1 text-center">Title — the vibe this chain is going for</div>
                        <input type="text" class="kit-r-name w-full bg-black/40 border border-[#00FF8840] rounded text-[14px] font-black text-[#00FF88] text-center uppercase px-2 py-1.5 mb-3 focus:outline-none" value="${esc(r.name||'')}" placeholder="e.g. Crenshaw Cruisin'" data-ri="${ri}">
                        <div class="text-[8px] text-[#FF88FF]/40 tracking-widest uppercase mb-1">Chain — one step per line</div>
                        <textarea class="kit-r-chain w-full bg-black/40 border border-[#FF88FF30] rounded text-[11px] font-mono text-[#E2E8F0]/85 px-2 py-1.5 mb-2 focus:outline-none" rows="${Math.max(3,(r.chain||[]).length)}" data-ri="${ri}">${esc((Array.isArray(r.chain)?r.chain:[]).join('\n'))}</textarea>
                        <div class="text-[8px] text-[#FFD60A]/50 tracking-widest uppercase mb-1">Why it works</div>
                        <textarea class="kit-r-why w-full bg-black/40 border border-[#FFD60A30] rounded text-[10px] text-[#FFE9A6]/80 italic px-2 py-1.5 focus:outline-none" rows="2" data-ri="${ri}">${esc(r.why||'')}</textarea>
                    </div>`;
                }
                return `<div class="${ri>0?'pt-5 mt-5 border-t border-white/10':''}" data-ri="${ri}">
                    <div class="flex justify-end gap-2 mb-1">
                        <button type="button" class="kit-r-edit text-[10px] text-white/30 hover:text-[#00FF88] cursor-pointer" data-ri="${ri}" title="Edit this recipe">✏️</button>
                        <button type="button" class="kit-r-del text-[12px] leading-none text-white/30 hover:text-[#FF5A5A] cursor-pointer" data-ri="${ri}" title="Delete this recipe">×</button>
                    </div>
                    <div class="text-center mb-4">
                        <div class="text-[16px] md:text-[19px] font-black tracking-wide text-[#00FF88] uppercase" style="text-shadow:0 0 12px rgba(0,255,136,0.35);">${esc(r.name||'Untitled Vibe')}</div>
                    </div>
                    <ol class="space-y-1.5 mb-2">${(Array.isArray(r.chain)?r.chain:[]).map((step,si)=>{
                        const bad = window.lintChainStep(step);
                        return `
                        <li class="flex gap-2 text-[12px] font-mono text-[#E2E8F0]/85 leading-relaxed">
                            <span class="text-[#FF88FF]/40 shrink-0 tabular-nums">${si+1}.</span>
                            <span>${esc(step)}${bad.length?`<span class="block mt-1 text-[10px] not-italic text-[#FF9E9E]/90 font-sans leading-snug">${bad.map(b=>`⚠ ${esc(b)}`).join('<br>')}</span>`:''}</span>
                        </li>`;}).join('')}</ol>
                    ${(()=>{const st=window.lintChainStack(r.chain); return st.length?`<div class="text-[10px] text-[#FF9E9E]/90 leading-snug border-l-2 border-[#FF9E9E60] pl-2.5 mb-2">${st.map(n=>`⚠ ${esc(n)}`).join('<br>')}</div>`:'';})()}
                    ${r.why?`<div class="text-[10px] text-[#FFE9A6]/70 italic leading-relaxed border-l-2 border-[#FFD60A40] pl-2.5">${esc(r.why)}</div>`:''}
                </div>`;
            }).join('');

        disp.innerHTML = `<div class="animate-fade-in">
            <div class="border-b border-[#FF88FF25] pb-4 mb-5">
                <div class="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <div><div class="text-[9px] tracking-widest text-[#FF88FF]/60 uppercase mb-1">🤖 AI Kit · your gear only</div>
                    <h2 class="text-[16px] md:text-[20px] font-bold tracking-widest text-[#FF88FF] uppercase">${esc(genre)}</h2></div>
                    <div class="flex gap-2 flex-wrap">
                        <button id="btn-kit-md" class="text-[9px] font-bold tracking-widest px-2.5 py-1.5 rounded border border-[#7AFFBF40] text-[#7AFFBF] hover:bg-[#7AFFBF]/10 cursor-pointer">📄 .MD</button>
                        <button id="btn-kit-del" class="text-[9px] font-bold tracking-widest px-2.5 py-1.5 rounded border border-[#FF5A5A40] text-[#FF5A5A]/70 hover:text-[#FF5A5A] hover:bg-[#FF5A5A]/10 cursor-pointer" title="Delete this whole saved kit — every instrument in it">🗑 DELETE KIT</button>
                        ${hist.length > 1 ? `<button id="btn-kit-nuke" class="text-[9px] font-bold tracking-widest px-2.5 py-1.5 rounded border border-[#FF5A5A] text-[#FF5A5A] bg-[#FF5A5A]/10 hover:bg-[#FF5A5A]/25 cursor-pointer" title="Delete every saved kit for this genre — all ${hist.length} of them">☢ NUKE ALL ${hist.length}</button>` : ''}
                    </div>
                </div>
                <div class="text-[8px] text-[#E2E8F0]/30 font-mono tracking-widest">GENERATED ${esc(when)} · ${insts.length} INSTRUMENT${insts.length===1?'':'S'} USED IN THIS GENRE${attachedSongs.length?` · 🔗 ${attachedSongs.map(s=>esc(s.title||'Untitled')).join(', ')}`:''}${kit.usage && kit.usage.calls ? ` · 💲 ${esc(window.__aiUsage.summary(kit.usage))} over ${kit.usage.calls} call${kit.usage.calls===1?'':'s'}` : ''}</div>
            </div>
            ${navBar}
            ${kit.overview?`<p class="text-[11px] md:text-[12px] text-[#A7DCC3]/80 italic mb-5 border-l-2 border-[#FF88FF40] pl-4 leading-relaxed font-mono">${esc(kit.overview)}</p>`:''}
            ${(()=>{
                // The whole scorecard, not just the impossible count — because "0 impossible settings"
                // means one thing over 40 checked steps and nothing at all over 2. Showing coverage
                // next to the count is what keeps a quiet model from reading as a careful one.
                const s = window.scoreKit(kit);
                if (!s.steps) return '';
                const bad = s.impossible + s.offPalette + s.stacked;
                const tone = bad ? ['#FF9E9E40','#FF9E9E','#FFD6D6'] : ['#00FF8830','#00FF88','#A7DCC3'];
                const cell = (v, lab, warn) => `<div class="text-center px-2">
                    <div class="text-[15px] font-black ${warn&&v?'text-[#FF9E9E]':'text-[#E2E8F0]/80'}">${v}</div>
                    <div class="text-[8px] tracking-widest uppercase text-[#E2E8F0]/40 mt-0.5">${lab}</div></div>`;
                return `<div class="mb-5 p-3 rounded border" style="border-color:${tone[0]};background:${tone[1]}12">
                    <div class="text-[9px] tracking-widest font-bold mb-2.5" style="color:${tone[1]}">🔬 SETTINGS CHECK · ${bad?'FOUND PROBLEMS':'NOTHING IMPOSSIBLE FOUND'}</div>
                    <div class="flex flex-wrap justify-center gap-x-1 gap-y-2 mb-2">
                        ${cell(s.steps,'chain steps')}${cell(s.checked,'verifiable')}${cell(s.checkedSpecific,'committed')}${cell(s.impossible,'impossible',1)}${cell(s.offPalette,'not your gear',1)}${cell(s.empty,'no setting',1)}${cell(s.stacked,'two amps',1)}${cell(s.specific,'with numbers')}
                    </div>
                    <div class="text-[9px] leading-relaxed" style="color:${tone[2]}bb">
                        <b>${s.checked}</b> of ${s.steps} steps named a unit with documented controls, so only those could be checked — a low <b>impossible</b> count over a low <b>verifiable</b> count is not evidence of care.
                        <br><b>Committed</b> is the number that can't be gamed: <b>${s.checkedSpecific}</b> of those ${s.checked} put an actual figure on the documented unit${s.checked?` (${Math.round(s.checkedSpecific/s.checked*100)}%)`:''}. Naming an LA-2A and saying "to taste, gentle" passes every check without risking anything.
                        ${s.impossible?`<br><br><b class="text-[#FF9E9E]">Impossible settings:</b><br><span class="text-[#FF9E9E]/90">${s.impossibleNotes.map(esc).join('<br>')}</span>`:''}
                        ${s.offPalette?`<br><b>Not your gear:</b> ${esc(s.offPaletteNames.slice(0,6).join(', '))}${s.offPaletteNames.length>6?` +${s.offPaletteNames.length-6} more`:''} — invented outright, or named too loosely to match anything you own.`:''}
                        ${s.empty?`<br><b>${s.empty}</b> step${s.empty===1?'':'s'} name a plugin without saying what to do with it.`:''}
                        ${s.sources?`<br><b>${s.sources}</b> step${s.sources===1?'':'s'} are the sound source rather than a plugin (a DI take, a sample, a live performance) — not judged as gear, since there is no knob to check.`:''}
                        ${s.stacked?`<br><b>Two amps:</b> ${s.stackedNotes.map(esc).join('<br>')}`:''}
                    </div>
                </div>`;
            })()}
            ${Array.isArray(kit.palette)&&kit.palette.length?`<div class="mb-5 p-3 rounded border border-[#FF88FF25] bg-[#FF88FF]/5">
                <div class="text-[9px] tracking-widest text-[#FF88FF]/70 font-bold mb-2">🎛 PALETTE · ${kit.palette.length} PLUGINS CHOSEN FOR THIS GENRE</div>
                <div class="flex flex-wrap gap-1.5">${kit.palette.map(p=>`<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-[#FF88FF20] text-[#E2E8F0]/60">${esc(p)}</span>`).join('')}</div>
            </div>`:''}
            ${kit.partial?(()=>{
                // Older kits stored partial as plain label strings; newer ones carry the actual error
                // per slot too, which is what actually diagnoses a persistent failure.
                const labels = kit.partial.map(f => typeof f==='string' ? f : f.label);
                const errs = [...new Set(kit.partial.map(f => typeof f==='string' ? null : f.error).filter(Boolean))];
                return `<div class="mb-5 p-3 rounded border border-[#FFD60A40] bg-[#FFD60A]/6 text-[10px] text-[#FFE9A6]/85 leading-relaxed">
                    ⚠ Some candidate roles couldn't be reached after several retry rounds (not "doesn't apply" — an actual failed call): <b>${esc(labels.join(' · '))}</b>.
                    ${errs.length ? `<div class="mt-1.5 font-mono text-[9px] text-[#FFE9A6]/60">${errs.map(e=>esc(e)).join('<br>')}</div>` : ''}
                    Hit + NEW to try building a fresh one.
                </div>`;
            })():''}
            <div class="flex flex-wrap items-center gap-2 mb-5 p-3 rounded border border-[#00E5FF25] bg-[#00E5FF]/5">
                <span class="text-[9px] tracking-widest text-[#00E5FF]/70 font-bold">${attachedSongs.length?'ATTACH TO ANOTHER SONG':'ATTACH THIS KIT TO A SONG'}</span>
                <select id="kit-song-select" class="flex-1 min-w-[140px] bg-black/50 border border-[#00E5FF]/25 rounded text-[10px] text-[#00E5FF]/80 px-2 py-1.5 focus:outline-none">
                    <option value="">${songs.length?'— choose a song —':'— no songs on the board yet —'}</option>
                    ${songs.map(s=>`<option value="${s.id}">${esc((s.title||'Untitled').slice(0,40))}${s.kitId===kit.id?' (attached)':''}</option>`).join('')}
                </select>
                <button id="btn-kit-attach" class="btn-euterpe-green px-3 py-1.5 text-[10px]">🔗 ATTACH<span class="hidden sm:inline"> (+ COOKBOOK RECIPES)</span></button>
            </div>
            <div class="border border-[#FF88FF20] rounded-lg overflow-hidden bg-[#0A0A0F] p-5" id="kit-recipe-pane">
                ${active?`<div class="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[#FF88FF20]">
                    <div class="text-[10px] font-bold tracking-widest text-[#FF88FF] uppercase truncate">${esc(active.slot)} <span class="text-[#FF88FF]/40 normal-case">· ${(active.recipes||[]).length} recipe${(active.recipes||[]).length===1?'':'s'}</span></div>
                    <button id="btn-kit-inst-del" type="button" class="shrink-0 text-[9px] font-bold tracking-widest px-2.5 py-1.5 rounded border border-[#FF5A5A40] text-[#FF5A5A]/70 hover:text-[#FF5A5A] hover:bg-[#FF5A5A]/10 cursor-pointer" title="Remove this whole instrument — every recipe under it — from this kit">🗑 DELETE INSTRUMENT</button>
                </div>`:''}
                ${recipeHtml}
            </div>
        </div>`;

        document.getElementById('btn-kit-md')?.addEventListener('click', () => window.exportKitMarkdown(genre, kit.id));
        document.getElementById('kit-nav-older')?.addEventListener('click', () => olderId!=null && window.renderGenreKit(genre, { kitId: olderId }));
        document.getElementById('kit-nav-newer')?.addEventListener('click', () => newerId!=null && window.renderGenreKit(genre, { kitId: newerId }));
        document.getElementById('kit-nav-new')?.addEventListener('click', () => window.generateGenreKit(genre));
        document.getElementById('btn-kit-attach')?.addEventListener('click', () => {
            const sel = document.getElementById('kit-song-select'); const id = sel.value ? parseInt(sel.value,10) : null;
            if (!id) { sel.focus(); return; }
            window.attachKitToSong(id, genre, kit.id);
            window.renderGenreKit(genre, { kitId: kit.id, slot: active && active.slot });
            const b = document.getElementById('btn-kit-attach'); if (b) { const o=b.innerHTML; b.textContent = '✓ ATTACHED'; setTimeout(()=>{ if(document.body.contains(b)) b.innerHTML=o; }, 1500); }
        });

        document.getElementById('btn-kit-del')?.addEventListener('click', () => {
            const affected = songsForKit(kit.id);
            const warn = affected.length ? `\n\nThis kit is attached to: ${affected.map(s=>s.title||'Untitled').join(', ')}. Those songs will show "no kit attached" afterward — nothing else about them changes.` : '';
            if (!confirm(`Delete this saved kit for ${genre}? This can't be undone.${warn}`)) return;
            const h = kitHistory(genre);
            const i = h.findIndex(k => k.id === kit.id);
            if (i >= 0) h.splice(i, 1);
            // Drop the key rather than leaving genreKits[genre] = [] behind. An empty array reads as
            // "this genre has a kit history" everywhere that tests the key, and four of them had
            // already accumulated in the vault from earlier deletes.
            if (h.length) window.db.genreKits[genre] = h; else delete window.db.genreKits[genre];
            window.saveData();
            if (h.length) window.renderGenreKit(genre, { kitId: 'new' });
            else window.selectGenre(genre); // nothing left to browse — don't auto-trigger a fresh (paid) generation
        });

        // The nuclear option: every kit ever generated for this genre, gone in one go. Kits cost real
        // tokens and real minutes to rebuild and there is no undo, so unlike every other delete in
        // here this one is NOT a plain confirm() — a mis-aimed click on a button sitting next to the
        // single-kit delete would wipe an afternoon's work. Typing the genre name is deliberately
        // tedious: it makes you read which genre you're actually pointed at before anything happens.
        document.getElementById('btn-kit-nuke')?.addEventListener('click', () => {
            const all = kitHistory(genre);
            const hit = all.filter(k => songsForKit(k.id).length);
            const songs = [...new Set(hit.flatMap(k => songsForKit(k.id).map(s => s.title || 'Untitled')))];
            const warn = songs.length ? `\n\n${songs.length} song${songs.length===1?'':'s'} will lose their attached kit: ${songs.join(', ')}. Nothing else about those songs changes.` : '';
            const typed = prompt(`☢ DELETE ALL ${all.length} SAVED KITS for "${genre}"?\n\nThis wipes every kit you have ever generated for this genre, including the ones you are not currently looking at. It cannot be undone and rebuilding them costs tokens.${warn}\n\nType the genre name exactly to confirm:`);
            if (typed == null) return; // cancelled — say nothing
            if (window.normPluginName(typed).toLowerCase() !== window.normPluginName(genre).toLowerCase()) {
                alert('That did not match the genre name — nothing was deleted.');
                return;
            }
            delete window.db.genreKits[genre];
            window.saveData();
            window.selectGenre(genre);
        });

        // Deleting a whole instrument — the level between "the entire kit" and "one recipe at a time".
        // Drops the slot and every recipe under it, then falls through to whatever instrument is next
        // in the list so the pane never lands on nothing.
        document.getElementById('btn-kit-inst-del')?.addEventListener('click', () => {
            const n = (active.recipes || []).length;
            if (!confirm(`Delete ${active.slot} from this kit — all ${n} recipe${n===1?'':'s'} under it? This can't be undone.`)) return;
            const i = kit.instruments.findIndex(x => x.slot === active.slot);
            if (i >= 0) kit.instruments.splice(i, 1);
            [...kitRecipeEditSet].forEach(k => { if (k.startsWith(kit.id+':'+active.slot+':')) kitRecipeEditSet.delete(k); });
            window.saveData();
            const next = kit.instruments[Math.min(i, kit.instruments.length - 1)];
            window.renderGenreKit(genre, { kitId: kit.id, slot: next && next.slot });
        });

        // Edit/delete for individual recipes within the selected instrument. Text inputs autosave on
        // every keystroke WITHOUT re-rendering (a re-render would blow away focus/cursor mid-type) —
        // only the toggle buttons and delete trigger a redraw.
        disp.querySelectorAll('.kit-r-edit').forEach(b => b.addEventListener('click', () => {
            kitRecipeEditSet.add(kitRecipeKey(kit.id, active.slot, +b.dataset.ri));
            window.renderGenreKit(genre, { kitId: kit.id, slot: active.slot });
        }));
        disp.querySelectorAll('.kit-r-done').forEach(b => b.addEventListener('click', () => {
            kitRecipeEditSet.delete(kitRecipeKey(kit.id, active.slot, +b.dataset.ri));
            window.renderGenreKit(genre, { kitId: kit.id, slot: active.slot });
        }));
        disp.querySelectorAll('.kit-r-del').forEach(b => b.addEventListener('click', () => {
            const ri = +b.dataset.ri;
            if (!confirm('Delete this recipe?')) return;
            active.recipes.splice(ri, 1);
            kitRecipeEditSet.delete(kitRecipeKey(kit.id, active.slot, ri));
            window.saveData();
            window.renderGenreKit(genre, { kitId: kit.id, slot: active.slot });
        }));
        disp.querySelectorAll('.kit-r-name').forEach(inp => inp.addEventListener('input', () => {
            const ri = +inp.dataset.ri; if (active.recipes[ri]) { active.recipes[ri].name = inp.value; window.saveData(); }
        }));
        disp.querySelectorAll('.kit-r-chain').forEach(ta => ta.addEventListener('input', () => {
            const ri = +ta.dataset.ri; if (active.recipes[ri]) { active.recipes[ri].chain = ta.value.split('\n').map(s=>s.trim()).filter(Boolean); window.saveData(); }
        }));
        disp.querySelectorAll('.kit-r-why').forEach(ta => ta.addEventListener('input', () => {
            const ri = +ta.dataset.ri; if (active.recipes[ri]) { active.recipes[ri].why = ta.value; window.saveData(); }
        }));
    };

    // References the kit by id rather than deep-copying it, since saved kits are now permanent history
    // (never overwritten) — a reference is exactly as safe as a snapshot here, without duplicating the
    // whole chain sheet onto every attached song. Also snapshots the genre's hand-written Cookbook
    // recipes (which ARE editable/deletable over time, unlike kit history) so the song keeps its own
    // copy even if those recipes are later changed or removed.
    window.attachKitToSong = (songId, genre, kitId) => {
        const song = (window.db.songBoard || []).find(s => s.id === songId);
        const kit = findKit(genre, kitId);
        if (!song || !kit) return;
        song.kitId = kit.id;
        song.kitGenre = genre;
        delete song.kit; // migrate off the old snapshot field if this song had one
        song.cookbookRecipes = JSON.parse(JSON.stringify((window.db.cookbook || []).filter(r => r.genre === genre)));
        window.saveData();
        window.renderSongBoard && window.renderSongBoard();
    };

    window.exportKitMarkdown = (genre, kitId) => {
        const kit = findKit(genre, kitId); if (!kit) return;
        let md = `# ${genre} — AI Kit\n\n_Generated ${new Date(kit.generatedAt).toLocaleString()} from your owned plugins._\n\n`;
        if (kit.overview) md += `${kit.overview}\n\n`;
        if (Array.isArray(kit.palette) && kit.palette.length) md += `**Palette (${kit.palette.length}):** ${kit.palette.join(', ')}\n\n`;
        kit.instruments.forEach(inst => {
            md += `## ${inst.slot}\n\n`;
            (inst.recipes||[]).forEach(r => {
                md += `### ${r.name||'Chain'}\n\n`;
                (r.chain||[]).forEach((s,i) => { md += `${i+1}. ${s}\n`; });
                if (r.why) md += `\n> ${r.why}\n`;
                md += `\n`;
            });
        });
        const blob = new Blob([md], {type:'text/markdown'});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = genre.replace(/[^a-z0-9]+/gi,'_') + '_ai_kit.md'; a.click();
        setTimeout(()=>URL.revokeObjectURL(a.href), 800);
    };

    window.extractGenreElements = (genre) => {
        const byCategory = {};
        (window.db.cookbook || []).filter((r) => r.genre === genre).forEach((r) => {
            const parts = (r.inst || '').split(':');
            const cat = (parts[0] || 'Other').trim();
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(r.desc || parts.slice(1).join(':').trim());
        });
        return byCategory;
    };

    // ==================== LYRIA PROMPT ====================
    // The roles a prompt can fill, each mapped to the cookbook categories that feed it and the words
    // that mean "I am handling this one myself". ORDER IS THE CLASSIFIER: the first role whose regex
    // hits a clause wins it, so the specific ones come before the general. `bass` sits above `synths`
    // and `drums` on purpose — "moog bass line" and "808 bass" are bass, not a synth and not a drum,
    // and getting that wrong is exactly the double-up this is here to stop.
    window.LYRIA_ROLES = [
        { role: 'bass',    label: 'bass',       cats: ['Bass'],                   re: /\b(bass|sub|808s?|upright|contrabass)\b/i },
        { role: 'drums',   label: 'drums',      cats: ['Beats'],                  re: /\b(drum\w*|beat|kick|snare|hats?|hi-?hats?|percussion|breaks?|rimshot|clap)\b/i },
        { role: 'keys',    label: 'keys',       cats: ['Keys'],                   re: /\b(piano|rhodes|wurli\w*|organ|clav\w*|keys|harpsichord)\b/i },
        { role: 'guitars', label: 'guitar',     cats: ['Guitars'],                re: /\b(guitars?|riffs?|strat\w*|telecaster|les paul|wah)\b/i },
        { role: 'strings', label: 'strings',    cats: ['Strings'],                re: /\b(strings?|violin|cello|viola|orchestr\w*|pizzicato)\b/i },
        { role: 'horns',   label: 'horns',      cats: ['Horns', 'Brass'],         re: /\b(horns?|brass|trumpet|sax\w*|trombone|flute)\b/i },
        { role: 'vox',     label: 'vocals',     cats: ['Vox', 'Vocals'],          re: /\b(vocals?|vox|rap\w*|sung|singing|chant\w*|ad-?libs?|hook|choir)\b/i },
        { role: 'samples', label: 'samples',    cats: ['Samples'],                re: /\b(samples?|vinyl|chops?|loops?|scratch\w*|crackle)\b/i },
        { role: 'synths',  label: 'synths',     cats: ['Synths', 'Synths/Samples'], re: /\b(synths?|pads?|arps?|leads?|moog|juno|prophet|vocoder|wavetable)\b/i }
    ];

    // A clause that negates ("no strings", "without guitars") should suppress that role AND say so in
    // the prompt — Lyria responds to an explicit absence far better than to silence about it.
    const LYRIA_NEG_RE = /\b(no|not|without|avoid|skip|drop|omit|zero|minus|never)\b/i;

    // Cookbook descriptions are written for a producer reading a recipe card, not for a music model.
    // Two things in them actively hurt the prompt: mixing instructions, which Lyria cannot act on and
    // which crowd out the musical content, and named artists, which it is trained to refuse. Strip
    // both, keep the sentences that actually describe a sound.
    const LYRIA_PROD_JARGON = /\b(reverb|compress\w*|eq\b|-?\d+\s*d[bB]\b|\d+\s*k?[hH]z|plugin|vst|sidechain\w*|saturat\w*|limiter|gate[ds]?\b|high-?pass|low-?pass|filter\w*|mix bus|panned?|velocit\w*|quantiz\w*|midi|dry\/wet|bus\b|preamp|transient)\b/i;
    const lyriaClean = (raw) => {
        // Protect the abbreviations that would otherwise be mistaken for sentence ends.
        const guarded = String(raw == null ? '' : raw)
            .replace(/\b(Dr|Mr|Mrs|Ms|St|Jr|Sr|vs|feat|e\.g|i\.e)\./gi, '$1\u0001');
        const sentences = guarded.split(/\.\s+/)
            .map(s => s.replace(/\u0001/g, '.').trim())
            .filter(Boolean);
        const musical = sentences.filter(s => !LYRIA_PROD_JARGON.test(s));
        let t = (musical.length ? musical : sentences.slice(0, 1)).join('. ');
        return t
            .replace(/\([^)]*\)/g, ' ')                                                          // "(e.g., 'Still D.R.E.')"
            .replace(/\bThe\s+[A-Z][\w.]*(?:\s+[A-Z][\w.]*)*\s+(signature|sound)\b\s*\.?/g, '')  // "The Scott Storch signature."
            // A capitalised name in the possessive, leading a description, is a producer or artist
            // every time here ("Dr. Dre's signature snare", "Eminem's vocal technique"). Lyria is
            // trained to refuse prompts that name real artists, so the whole fragment is wasted if
            // it survives — drop the name and keep the description that follows it.
            .replace(/\b[A-Z][\w.]*(?:\s+[A-Z][\w.]*)*'s\s+(signature|classic|trademark)?\s*/g, '')
            .replace(/[\s,;.]+$/, '')                                                            // no trailing dot — the join adds it
            .replace(/\s{2,}/g, ' ')
            .replace(/\s+([,.])/g, '$1')
            .trim();
    };

    // Classify a fragment the same way a user clause is classified — first role whose regex hits.
    // The cookbook's own category is not enough on its own: "Synths: Pizzicato Strings" is filed
    // under Synths, so "no strings" would sail straight past a category-only check and hand back the
    // exact instrument that was just ruled out.
    const lyriaRoleOf = (text) => {
        const hit = window.LYRIA_ROLES.find(r => r.re.test(String(text || '')));
        return hit ? hit.role : null;
    };

    const lyriaCap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const lyriaPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Splitting the user's direction into clauses is what makes role detection work at all: "use a
    // 5 string electric bass, minimal kick/snare kit, no strings" is three separate statements and
    // classifying the whole blob at once would smear them together.
    window.parseLyriaDirection = (customNotes) => {
        const claimed = new Set(), excluded = new Set();
        String(customNotes || '').split(/[,;.\n]|\band\b|\bplus\b/i).forEach(clause => {
            const c = clause.trim(); if (!c) return;
            const hit = window.LYRIA_ROLES.find(r => r.re.test(c));
            if (!hit) return;
            (LYRIA_NEG_RE.test(c) ? excluded : claimed).add(hit.role);
        });
        return { claimed, excluded };
    };

    // ==================== LYRICS AND STRUCTURE INTO THE PROMPT ====================
    // Lyria 3 takes lyrics as well as a musical description, and a song that already has its words
    // in the Lyrics tab and its sections in the Arrangement timeline should not have to be retyped
    // into a prompt box.
    //
    // Two rules shape how this is assembled, and both matter more than they look:
    //
    //   The lyrics are appended VERBATIM after the AI has written the musical description — they are
    //   never passed through the model. A model asked to "tighten" a prompt will cheerfully reword a
    //   lyric, and a silently reworded lyric is the worst failure available here: it looks fine and
    //   it isn't your song any more. Code owns that text end to end.
    //
    //   What the AI DOES get is the structure — section names and their start times — because that
    //   genuinely shapes the description. Knowing the chorus lands at 0:53 is the difference between
    //   "the drums open up going into the chorus" and another generic paragraph.
    //
    // Timestamps are computed, never stored: seconds = bars x 4 x (60/bpm), accumulated across the
    // song's own arrangement, which is the same arithmetic the Arrangement timeline already displays.
    // A song with no arrangement gets its tags with no times rather than invented ones.
    const lyriaFmtTime = (secs) => `${Math.floor(secs/60)}:${String(Math.round(secs%60)).padStart(2,'0')}`;
    const lyriaTagCase = (t) => String(t||'').trim().replace(/\s+/g,' ').replace(/\w\S*/g, w => w[0].toUpperCase()+w.slice(1).toLowerCase());

    // VERIFIED against Google's own docs (Vertex "Lyria music generation prompt guide", updated
    // 2026-07-28, and the Gemini API music-generation guide). The earlier note here said the timestamp
    // format could not be verified, and the format it guessed — [0:00 - 0:32 Intro], name inside the
    // bracket — was wrong. Both guides document exactly two shapes, and they are NOT interchangeable:
    //
    //   Supplying your own words   ->  a bare tag on its own line, lyrics underneath:
    //                                    [Verse 1]
    //                                    Walking through the neon glow,
    //
    //   Directing the arrangement  ->  "Provide timestamps in [mm:ss - mm:ss] format", section name
    //                                  OUTSIDE the bracket, colon, then what happens:
    //                                    [0:00 - 0:12] Intro: Begin with a soft lo-fi beat.
    //                                    Intensity: 2/10 (Very Low)
    //
    // The old code produced a hybrid of the two (timestamps inside the tag AND raw lyrics under it)
    // that appears in neither guide. `timed` picks the shape; nothing else needs to know the syntax.
    window.lyriaSectionHeader = (tag, secs, endSecs, timed) => {
        const tagName = String(tag || '').trim() || 'Section';
        if (timed && secs != null && endSecs != null) return `[${lyriaFmtTime(secs)} - ${lyriaFmtTime(endSecs)}] ${tagName}:`;
        if (timed && secs != null) return `[${lyriaFmtTime(secs)}] ${tagName}:`;
        return `[${tagName}]`;
    };

window.lyriaSongBlock = (songId) => {
    const song = (window.db?.songBoard || []).find(s => String(s.id) === String(songId));
    if (!song) return null;

    // Read through window.db rather than the Lyrics tab's in-memory state: saveLyr() mirrors every
    // edit into db immediately, and db is reachable from this closure while lyrState is not.
    const sheet = (window.db?.lyrics?.sheets || []).find(sh => sh.id === song.lyricsSheetId || sh.songId === song.id);
    const lines = (sheet?.lines || []).filter(l => (l.text||'').trim());
    if (!lines.length) return null;

    // Group consecutive lines that share a tag into one section, so the tag heads its block once
    // instead of repeating on every line the way the sheet stores it.
    const blocks = [];
    let cur = null;
    lines.forEach(l => {
        const tag = (l.tag||'').trim();
        if (!cur || tag !== cur.tag) {
            cur = { tag, lines: [] };
            blocks.push(cur);
        }
        cur.lines.push(l.text.trim());
    });

    // Times are matched to sections BY NAME, not by position. Position looks simpler and is wrong
    // the moment a song has an instrumental intro: the arrangement has an Intro section, the lyric
    // sheet has no words under it, and every timestamp after that point slides by one. Name
    // matching also means a section the arrangement doesn't know about simply goes untimed instead
    // of poisoning the rest.
    const arr = song.arrangement;
    const bpm = song.bpm || (arr && arr.bpm) || null;
    let timeline = [], totalSecs = null;
    
    if (bpm && arr && Array.isArray(arr.sections) && arr.sections.length) {
        const secPerBar = 4 * (60 / bpm);
        let t = 0;
        timeline = arr.sections.map(s => {
            const out = { tag: s.name, time: t, endTime: t + (s.bars * secPerBar),
                          intensity: window.arrIntensityOf ? window.arrIntensityOf(s) : null };
            t += s.bars * secPerBar;
            return out;
        });
        totalSecs = t;
    }

    // Match matched section timestamps to lyric blocks IN ORDER
    const structure = [...timeline];
    let lyricText = '';
    const used = new Set();

    blocks.forEach(b => {
        // The lyric sheet only ever stores a BASE tag ("VERSE") — the numbering lives on the
        // arrangement ("Verse 1", "Verse 2"). Google's own custom-lyrics example uses the numbered
        // form, and it is the only thing telling the model these are two different verses rather than
        // a repeat, so prefer the matched arrangement name and keep the bare tag as the fallback.
        let matchedName = null, matchedTime = null, matchedEndTime = null;
        if (structure.length) {
            // Compare canonical tag keys, not display names: the lyric sheet stores "PRE" while the
            // arrangement stores "Pre-Chorus", and a string compare of those two never matches.
            const keyOf = window.lyrTagKeyFor || ((n) => String(n||'').toUpperCase().replace(/\s+\d+$/,'').trim());
            const bBase = keyOf(b.tag);
            const idx = structure.findIndex((st, i) => {
                if (used.has(i)) return false;
                return keyOf(st.tag) === bBase;
            });
            if (idx >= 0) {
                used.add(idx);
                matchedName = structure[idx].tag;
                matchedTime = structure[idx].time;
                matchedEndTime = structure[idx].endTime;
            }
        }
        if (lyricText) lyricText += '\n\n';
        // Always the bare-tag shape here: this block carries the actual words, and the timed shape is
        // documented for describing what happens in a segment, not for heading a lyric.
        // Prefer the arrangement's name (numbered, properly spelled); fall back to the tag's own
        // display name so an unmatched section still reads "Pre-Chorus" rather than "Pre".
        const fallbackName = window.lyrTagDisplay ? window.lyrTagDisplay(b.tag) : lyriaTagCase(b.tag);
        lyricText += window.lyriaSectionHeader(matchedName || fallbackName, null, null, false) + '\n';
        lyricText += b.lines.join('\n');
    });

    const uniqueTags = [...new Set(blocks.map(b => lyriaTagCase(b.tag)))];
    // The structure line the AI sees lists the WHOLE arrangement, including sections with no words
    // in them — an instrumental intro is part of the shape it is being asked to write to.
    const structureLine = timeline.length
        ? timeline.map(s => `${s.tag} at ${lyriaFmtTime(s.time)}`).join(', ')
        : blocks.map(b => lyriaTagCase(b.tag) || 'section').join(', ');
    return {
        title: song.title || 'Untitled',
        lyricsBlock: lyricText.trim(),
        structure: structureLine,
        timeline: timeline,          // full timed sections incl. per-section intensity
        sections: uniqueTags.length,
        bpm: bpm,
        timed: !!timeline.length,
        totalSecs: totalSecs,
        duration: totalSecs
    };
};

    // Songs worth offering: they need words, not just a title.
    window.lyriaSongsWithLyrics = () => (window.db?.songBoard || [])
        .filter(s => window.lyriaSongBlock(s.id))
        .map(s => ({ id: s.id, title: s.title || 'Untitled' }));

    // There is ONE prompt. Lyria 3 takes a single `input` string on the Interactions API and a single
    // "Prompt box" in the Vertex console — there is no style field and no lyrics field, and no
    // documented character limit on either. The model's stated input limit is 131,072 TOKENS, roughly
    // half a million characters; the longest song in this vault is 3,415.
    //
    // This replaces a two-box UI that split lyrics at 3,000 characters into "Part 1 / Part 2" for the
    // user to paste in sequence. That was wrong twice over: the limit does not exist, and the
    // workflow it described is impossible — "Multi-turn editing: Music generation is a single-turn
    // process. Iterative editing or refining a generated clip through multiple prompts is not
    // supported." Pasting part 2 never extended part 1; it started an unrelated song from half a
    // lyric sheet. The counter below is kept purely as a size readout, not as a limit.
    window.LYRIA_INPUT_TOKEN_LIMIT = 131072;

    // The timed-arrangement block, in the documented shape. Only built when the user asks for it,
    // because the same guide is explicit that timestamps describe what HAPPENS in a segment — they
    // are an alternative to handing over lyrics, not a decoration on top of them.
    window.buildLyriaArrangementBlock = (song) => {
        if (!song || !Array.isArray(song.timeline) || !song.timeline.length) return '';
        return song.timeline.map(s => {
            const head = window.lyriaSectionHeader(s.tag, s.time, s.endTime, true);
            const inten = s.intensity != null && window.arrIntensityLabel
                ? ` Intensity: ${s.intensity}/10 (${window.arrIntensityLabel(s.intensity)})`
                : '';
            return `${head}${inten}`;
        }).join('\n');
    };

    // Assembles the finished prompt in the documented order:
    //   [Genre & style] + [Mood] + [Instrumentation] + [Tempo & rhythm] + [Vocal style] + [Lyrics]
    // with the lyrics last, introduced by "Lyrics:" exactly as the guide specifies ("Use your own
    // lyrics: Type 'Lyrics:' before the lines you want the model to sing").
    window.assembleLyriaPrompt = ({ description, key, negative, arrangementBlock, song }) => {
        const parts = [];
        let head = String(description || '').trim();
        if (key && key.trim()) head += (/[.!?]$/.test(head) ? '' : '.') + ` In ${key.trim()}.`;
        parts.push(head);
        if (negative && negative.trim()) parts.push(`Avoid: ${negative.trim().replace(/\.$/, '')}.`);
        if (arrangementBlock) parts.push(arrangementBlock);
        if (song && song.lyricsBlock) parts.push(`Lyrics:\n${song.lyricsBlock}`);
        return parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    };

    // `vocal` flips the openers from instrumental to sung. It matters more than it looks: this draft is
    // not only the AI's brief, it is what stays in the style box when there is no API key configured
    // and when the AI call fails (the catch below deliberately keeps the draft rather than blanking
    // it). On both of those paths the user copies the style box and the lyric parts together — and a
    // style prompt opening "An instrumental G-Funk beat" handed over alongside four verses of words is
    // a prompt arguing with itself.
    window.buildLyriaPrompt = (genre, customNotes, bpmOverride, vocal) => {
        const meta = window.getGenreMeta(genre);
        const bpm = bpmOverride || window.getGenreBpmMid(genre);
        const elements = window.extractGenreElements(genre);
        const { claimed, excluded } = window.parseLyriaDirection(customNotes);

        const fragments = [], dropped = [], seen = new Set();
        window.LYRIA_ROLES.forEach(({ role, label, cats }) => {
            // The whole point: if the direction already names a bass, this must not go and describe a
            // different one. Same for a role explicitly ruled out.
            if (claimed.has(role) || excluded.has(role)) { if (elements && cats.some(c => (elements[c]||[]).length)) dropped.push(label); return; }
            const pool = cats.flatMap(c => elements[c] || []);
            if (!pool.length) return;
            const frag = lyriaClean(lyriaPick(pool));
            if (!frag) return;
            // Second gate, on what the fragment actually describes rather than where it is filed.
            const actual = lyriaRoleOf(frag);
            if (actual && actual !== role && (claimed.has(actual) || excluded.has(actual))) {
                const lab = (window.LYRIA_ROLES.find(r => r.role === actual) || {}).label;
                if (lab && !dropped.includes(lab)) dropped.push(lab);
                return;
            }
            // Two categories can describe the same instrument in near-identical words; keep one.
            const key = frag.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').slice(0, 5).join(' ');
            if (seen.has(key)) return;
            seen.add(key);
            fragments.push(frag);
        });

        // Four openers rather than one, so the 🎲 gives a genuinely different prompt instead of the
        // same sentence with one clause swapped.
        const shortGenre = genre.split('/')[0].trim();
        const opener = lyriaPick(vocal ? [
            `A ${shortGenre} track with vocals at ${bpm} BPM. ${lyriaCap(meta.mood)}.`,
            `${lyriaCap(meta.mood)} ${shortGenre} with a lead vocal, ${bpm} BPM.`,
            `A ${bpm} BPM ${shortGenre} song, vocal-led — ${meta.mood}.`,
            `${lyriaCap(shortGenre)} at ${bpm} BPM with sung/rapped vocals, ${meta.mood}.`
        ] : [
            `An instrumental ${shortGenre} beat at ${bpm} BPM. ${lyriaCap(meta.mood)}.`,
            `${lyriaCap(meta.mood)} instrumental ${shortGenre}, ${bpm} BPM.`,
            `A ${bpm} BPM ${shortGenre} instrumental — ${meta.mood}.`,
            `Instrumental ${shortGenre} at ${bpm} BPM, ${meta.mood}.`
        ]);

        const parts = [opener];
        if (fragments.length) parts.push(fragments.map(lyriaCap).join('. ') + '.');
        if (customNotes && customNotes.trim()) parts.push(`${lyriaCap(customNotes.trim().replace(/\.$/, ''))}.`);
        // Kept as prose inside the prompt rather than moved to Vertex's negative_prompt field: this
        // output is copied by hand, and the roles named here are ones the producer's own direction
        // ruled out, which reads better inline than as a bare exclusion list.
        const negatives = window.LYRIA_ROLES.filter(r => excluded.has(r.role)).map(r => r.label);
        if (negatives.length) parts.push(`No ${negatives.join(', no ')}.`);
        parts.push(lyriaPick([
            `Production style: ${meta.texture}.`,
            `Overall texture: ${meta.texture}.`,
            `${lyriaCap(meta.texture)} throughout.`
        ]));

        return { prompt: parts.join(' ').replace(/\s{2,}/g, ' ').trim(), dropped, claimed: [...claimed], excluded: [...excluded] };
    };

    window.populateLyriaGenreSelect = (preselect) => {
        const sel = document.getElementById('lyria-genre-select'); if (!sel) return;
        const genres = window.allCookbookGenres().sort();
        sel.innerHTML = genres.map((g) => `<option value="${g.replace(/"/g, '&quot;')}">${g}</option>`).join('');
        if (preselect && genres.includes(preselect)) sel.value = preselect;
        const bpmEl = document.getElementById('lyria-bpm'); if (bpmEl) bpmEl.value = window.getGenreBpmMid(sel.value);
    };

    // Fills the song picker and, when a song is chosen, pulls its arrangement BPM across so the tempo
    // in the prompt matches the tempo the song is actually written at rather than the genre's midpoint.
    window.populateLyriaSongSelect = (preselectSongId) => {
        const sel = document.getElementById('lyria-song-select'); if (!sel) return;
        const songs = window.lyriaSongsWithLyrics();
        sel.innerHTML = `<option value="">— none (instrumental) —</option>` +
            songs.map(s => `<option value="${s.id}">${String(s.title).replace(/</g,'&lt;')}</option>`).join('');
        if (preselectSongId != null && songs.some(s => String(s.id) === String(preselectSongId))) sel.value = String(preselectSongId);
        const note = document.getElementById('lyria-song-note');
        const sync = () => {
            const blk = sel.value ? window.lyriaSongBlock(sel.value) : null;
            if (blk && blk.bpm) { const b = document.getElementById('lyria-bpm'); if (b) b.value = blk.bpm; }
            const lyricsNote = blk ? `${blk.lyricsBlock.length.toLocaleString()} chars of lyrics` : '';
            if (note) note.innerHTML = !songs.length
                ? 'No song has lyrics yet — write some in Lyrics Lab and link the sheet to a Song Board song.'
                : blk
                    ? `${blk.sections} section${blk.sections===1?'':'s'} · ${blk.timed ? 'arrangement available for the timed block' : 'no arrangement yet, so no timings available'}${blk.bpm?` · ${blk.bpm} BPM`:''} · ${lyricsNote}. Copied in exactly as written — the AI never rewrites them.`
                    : 'Pick a song and its lyrics go into the prompt under <code class="text-[#FF88FF]">Lyrics:</code>, with <code class="text-[#FF88FF]">[Verse 1]</code>-style tags from its arrangement. Leave on “none” for an instrumental.';
        };
        sel.onchange = sync;
        sync();
    };

    window.openLyriaModal = (preselectGenre, preselectSongId) => {
        window.populateLyriaGenreSelect(preselectGenre);
        window.populateLyriaSongSelect(preselectSongId);
        
        const moodEl = document.getElementById('lyria-mood'); if (moodEl) moodEl.value = '';
        const texEl = document.getElementById('lyria-texture'); if (texEl) texEl.value = '';
        
        // populateLyriaSongSelect only pulls BPM across for songs with lyrics (the dropdown is
        // lyrics-gated). A song opened directly from its Song Board card may have no lyrics yet,
        // so pull its tempo across directly here rather than losing it to the genre's midpoint.
        if (preselectSongId != null) {
            const song = (window.db?.songBoard || []).find(s => String(s.id) === String(preselectSongId));
            if (song) {
                if (song.bpm) { const b = document.getElementById('lyria-bpm'); if (b) b.value = song.bpm; }
                const refKit = (song.kitId != null && song.kitGenre && window.findKit) ? window.findKit(song.kitGenre, song.kitId) : null;
                const kit = refKit || song.kit;
                if (kit && (kit.genre === preselectGenre || !preselectGenre)) {
                    if (kit.moodOverride && moodEl) moodEl.value = kit.moodOverride;
                    if (kit.texOverride && texEl) texEl.value = kit.texOverride;
                }
            }
        }
        // Carry Key / Keep-out across from the genre's own override boxes in the Cookbook, the same way
        // mood and texture already travel — the LYRIA PROMPT button sits directly under those fields,
        // so anything typed there is meant for this prompt.
        const keyEl = document.getElementById('lyria-key');
        const negEl = document.getElementById('lyria-negative');
        const kitForOverrides = (() => {
            if (preselectSongId == null) return null;
            const s = (window.db?.songBoard || []).find(x => String(x.id) === String(preselectSongId));
            if (!s) return null;
            return ((s.kitId != null && s.kitGenre && window.findKit) ? window.findKit(s.kitGenre, s.kitId) : null) || s.kit || null;
        })();
        if (keyEl) keyEl.value = document.getElementById('ai-override-key')?.value.trim() || kitForOverrides?.keyOverride || '';
        if (negEl) negEl.value = document.getElementById('ai-override-negative')?.value.trim() || kitForOverrides?.negOverride || '';
        const tsEl = document.getElementById('lyria-timestamps'); if (tsEl) tsEl.checked = false;
        document.getElementById('lyria-output-wrap')?.classList.add('hidden');
        document.getElementById('btn-lyria-regenerate')?.classList.add('hidden');
        const notesEl = document.getElementById('lyria-custom-notes'); if (notesEl) notesEl.value = '';
        const aiNote = document.getElementById('lyria-ai-note'); if (aiNote) aiNote.textContent = '';
        const styleOut = document.getElementById('lyria-output-style'); if (styleOut) styleOut.value = '';
        document.getElementById('lyria-modal')?.classList.replace('hidden', 'flex');
    };
    window.closeLyriaModal = () => document.getElementById('lyria-modal')?.classList.replace('flex', 'hidden');

    // The local builder is still what runs first: it is instant, free, works with no key, and its
    // role analysis is what tells the model which instruments are already spoken for. When a key IS
    // configured the draft becomes the AI's brief rather than the final answer — the model writes the
    // prose, but it is writing from this genre's real recipes and this producer's real direction,
    // not from the genre name alone.
    window.runLyriaGenerate = async () => {
        const genre = document.getElementById('lyria-genre-select')?.value; if (!genre) return;
        const bpm = parseInt(document.getElementById('lyria-bpm')?.value, 10) || undefined;
        const notes = document.getElementById('lyria-custom-notes')?.value || '';
        const key = document.getElementById('lyria-key')?.value || '';
        const negative = document.getElementById('lyria-negative')?.value || '';
        const wantTimes = !!document.getElementById('lyria-timestamps')?.checked;
        const songId = document.getElementById('lyria-song-select')?.value || '';
        const song = songId ? window.lyriaSongBlock(songId) : null;
        const built = window.buildLyriaPrompt(genre, notes, bpm, !!song);
        const arrangementBlock = wantTimes ? window.buildLyriaArrangementBlock(song) : '';
        window.__lyriaLastBuilt = { ...built, song, key, negative, arrangementBlock };

        const styleOut = document.getElementById('lyria-output-style');
        // One box, one prompt. The readout is the size of the whole thing — informational only, since
        // the documented limit is 131,072 tokens and nothing written here will approach it.
        const setStyle = (description) => {
            const full = window.assembleLyriaPrompt({ description, key, negative, arrangementBlock, song });
            if (styleOut) styleOut.value = full;
            const countEl = document.getElementById('lyria-style-count');
            if (countEl) {
                countEl.textContent = `${full.length.toLocaleString()} chars · ~${Math.ceil(full.length / 4).toLocaleString()} tokens of ${window.LYRIA_INPUT_TOKEN_LIMIT.toLocaleString()}`;
                countEl.className = 'text-[9px] font-mono text-[#00E5FF]/50';
            }
            return full;
        };
        setStyle(built.prompt);

        document.getElementById('lyria-output-wrap')?.classList.remove('hidden');
        document.getElementById('btn-lyria-regenerate')?.classList.remove('hidden');
        document.getElementById('btn-lyria-hide')?.classList.remove('hidden');
        const lh = document.getElementById('btn-lyria-hide'); if (lh) lh.textContent = 'HIDE';
        // Say out loud which roles your own direction took over. Silently dropping a whole instrument
        // from the description looks like a bug unless the reason is on screen next to it.
        const note = document.getElementById('lyria-ai-note');
        const setNote = (msg, ok) => { if (note) { note.textContent = msg; note.className = `text-[10px] mt-3 ${ok ? 'text-[#7AFFBF]/80' : 'text-[#FF5A5A]/80'}`; } };
        const covers = built.dropped.length ? ` Your direction covers ${built.dropped.join(', ')}, so those were left out to avoid doubling up.` : '';
        const partsNote = song ? ` Lyrics appended verbatim under “Lyrics:”.` : '';
        if (!window.__aiIsConfigured || !window.__aiIsConfigured() || !window.ferrettAI) {
            setNote(('Offline draft — add an API key for a written prompt.' + partsNote + covers).trim(), !!(partsNote || covers));
            return;
        }
        const gen = document.getElementById('btn-lyria-generate');
        if (gen) { gen.disabled = true; gen.textContent = '…writing'; }
        setNote('Writing a prompt from this genre’s recipes…', true);
        try {
            // Two briefs, because the job genuinely changes. Without a song this writes an instrumental
            // description, as it always did. With one, the track has a vocal and a known shape, so the
            // model is told the structure and asked to write to it — but it is never shown the lyrics
            // and never asked to produce any, because the real ones get appended after it has finished.
            const sys = [
                song
                    ? 'You write prompts for Google Lyria 3, which generates music WITH VOCALS from a single text prompt. The real lyrics are appended to your paragraph by the app afterwards and are NOT your job — describe the music that should carry them.'
                    : 'You write prompts for Google Lyria 3, which generates INSTRUMENTAL music from a single text prompt.',
                song
                    ? 'Reply with ONE paragraph of 40-70 words. Do NOT write, quote, echo or invent any lyrics. No headings, no preamble, no bullet points.'
                    : 'Reply with ONE paragraph of 40-70 words. No lyrics, no quotes, no headings, no preamble, no bullet points.',
                song
                    ? 'Describe INSTRUMENTATION, RHYTHM, MOOD, SONIC TEXTURE and the VOCAL delivery the song calls for (register, phrasing, how it sits in the mix).'
                    : 'Describe INSTRUMENTATION, RHYTHM, MOOD and SONIC TEXTURE. Name real instruments and playing styles.',
                song ? 'You are given the song\'s section order and timings. Write to that shape — say how the arrangement moves between sections rather than describing one static texture.' : '',
                'NEVER name a real artist, producer, band or song title — Lyria refuses prompts that do, and the whole prompt is wasted.',
                'NEVER mention plugins, mixing moves, dB, Hz, compression, EQ or reverb settings. Lyria cannot act on any of that and it crowds out the musical detail that matters.',
                'The brief lists roles the producer is playing THEMSELVES. Use exactly the instrument they named for that role and never propose an alternative for it — do not offer a synth bass when they said electric bass.',
                'Roles listed as excluded must not appear at all; state their absence plainly if it shapes the sound.'
            ].filter(Boolean).join(' ');
            const roleLines = [
                built.claimed.length ? `PRODUCER IS PLAYING THESE THEMSELVES (use their instrument, suggest no alternative): ${built.claimed.join(', ')}` : '',
                built.excluded.length ? `MUST NOT APPEAR: ${built.excluded.join(', ')}` : '',
                notes.trim() ? `PRODUCER'S DIRECTION (honour exactly): ${notes.trim()}` : ''
            ].filter(Boolean).join('\n');
            const meta = window.getGenreMeta(genre);
            const moodInput = document.getElementById('lyria-mood')?.value.trim();
            const texInput = document.getElementById('lyria-texture')?.value.trim();
            // Structure only — never the words themselves. Sending the lyrics would put them in reach
            // of a model whose whole job is rewriting the surrounding text.
            const songLines = song
                ? `\nSONG: ${song.title}\nSECTION ORDER${song.timed ? ' AND TIMINGS' : ''}: ${song.structure}${song.totalSecs ? `\nRUNS: ${lyriaFmtTime(song.totalSecs)}` : ''}\nThis is a VOCAL track — the lyrics exist and are supplied separately. Do not write any.`
                : '';
            const user = `GENRE: ${genre}\nDESCRIPTION: ${meta.desc || ''}\nTEMPO: ${song?.bpm || bpm || window.getGenreBpmMid(genre)} BPM\nMOOD: ${moodInput || meta.mood}\nTEXTURE: ${texInput || meta.texture}${songLines}\n${roleLines}\n\nWHAT THIS GENRE ACTUALLY SOUNDS LIKE, from the producer's own recipe book:\n${built.prompt}`;
            window.__aiUsage?.begin('Lyria Prompt Generation');
            const written = await window.ferrettAI(sys, user, { creative: true });
            const spent = window.__aiUsage?.end();
            const spentStr = window.__aiUsage?.summary(spent) || '';
            if (written && written.trim()) {
                const desc = written.trim().replace(/^["'\s]+|["'\s]+$/g, '');
                window.__lyriaLastBuilt.written = desc; // remembered so Enhance can work on it alone
                setStyle(desc);
            }
            setNote(((song ? `Written around “${song.title}”.` : 'Written from this genre’s recipes.') + partsNote + covers + (spentStr ? ` · 💲 ${spentStr}` : '')).trim(), true);
        } catch (e) {
            // The draft is already in the box and is a perfectly usable prompt — say what happened
            // rather than blanking it, so a rate limit costs nothing.
            setNote('⚠ ' + e.message + ' — showing the offline draft instead.', false);
        } finally {
            if (gen) { gen.disabled = false; gen.textContent = 'GENERATE PROMPT'; }
        }
    };



    // === PLUGIN COVERAGE GAP-CHECK ===
    window.db.ownedPlugins = window.db.ownedPlugins || [];

    window.checkPluginCoverage = () => {
        const el = document.getElementById('plugin-coverage-content'); if (!el) return;
        el.innerHTML = 'Scanning...';
        const haystack = [
            ...(window.db.cookbook || []).flatMap((r) => [r.reaper, r.notes]),
            ...(window.db.tones || []).flatMap((t) => [t.nam, t.ir, t.notes]),
            ...(window.db.tracks || []).flatMap((t) => [t.plugins, t.notes])
        ].join(' \n ').toLowerCase();
        const owned = window.db.ownedPlugins || [];
        if (owned.length === 0) { el.innerHTML = `<div class="text-[#E2E8F0]/40 italic">No owned plugins listed yet — click ✎ EDIT LIST above to add yours.</div>`; return; }
        const unused = owned.filter((p) => !haystack.includes(p.toLowerCase()));
        if (unused.length === 0) { el.innerHTML = `<div class="text-[#00FF88]">Every owned plugin shows up somewhere. Nice.</div>`; return; }
        el.innerHTML = `<div class="mb-2 text-[#E2E8F0]/50">${unused.length} of ${owned.length} owned plugins have never been referenced:</div><div class="flex flex-wrap gap-1.5">` +
            unused.map((p) => `<span class="px-2 py-1 rounded border border-[#FFD60A30] text-[#FFD60A] bg-[#FFD60A]/5">${p}</span>`).join('') + `</div>`;
    };
    document.getElementById('btn-check-coverage')?.addEventListener('click', () => window.checkPluginCoverage());
    document.getElementById('btn-edit-owned-plugins')?.addEventListener('click', () => {
        const editor = document.getElementById('owned-plugins-editor'); const ta = document.getElementById('owned-plugins-textarea');
        if (!editor || !ta) return;
        ta.value = (window.db.ownedPlugins || []).join('\n');
        editor.classList.remove('hidden');
        document.getElementById('plugin-coverage-content')?.classList.add('hidden');
        ta.focus();
    });
    document.getElementById('btn-cancel-owned-plugins')?.addEventListener('click', () => {
        document.getElementById('owned-plugins-editor')?.classList.add('hidden');
        document.getElementById('plugin-coverage-content')?.classList.remove('hidden');
    });
    document.getElementById('btn-save-owned-plugins')?.addEventListener('click', () => {
        const ta = document.getElementById('owned-plugins-textarea'); if (!ta) return;
        const list = [...new Set(ta.value.split('\n').map((s) => s.trim()).filter(Boolean))];
        window.db.ownedPlugins = list;
        window.saveData();
        document.getElementById('owned-plugins-editor')?.classList.add('hidden');
        document.getElementById('plugin-coverage-content')?.classList.remove('hidden');
        window.checkPluginCoverage();
    });

    window.blendGenres = () => {


        const genres = [...new Set((window.db.cookbook || []).map(r => r.genre))];
        if (genres.length < 2) { alert('Add recipes in at least 2 different genres to blend combos.'); return; }
        let a = genres[Math.floor(Math.random() * genres.length)]; let b;
        do { b = genres[Math.floor(Math.random() * genres.length)]; } while (b === a);
        const recipesA = window.db.cookbook.filter(r => r.genre === a); const recipesB = window.db.cookbook.filter(r => r.genre === b);
        const instA = recipesA[Math.floor(Math.random() * recipesA.length)].inst; const instB = recipesB[Math.floor(Math.random() * recipesB.length)].inst;
        const connectors = ['×', 'MEETS', 'COLLIDES WITH', 'FUSED WITH', 'VS'];
        const connector = connectors[Math.floor(Math.random() * connectors.length)];
        const title = `${a} ${connector} ${b}`;
        const templatePool = [
            `Run a ${a}-style ${instA} chain underneath ${b}-style ${instB} elements.`,
            `Borrow the energy of ${a}'s ${instA} and the texture of ${b}'s ${instB}.`,
            `Start a beat in ${a} mode, then flip the drop into full ${b} territory.`,
            `Layer ${b} instrumentation on top of a ${a} rhythmic foundation.`,
            `Write ${a}-leaning vocals/flow over a ${b}-leaning instrumental.`,
            `Take ${a}'s tempo and swing, but chase ${b}'s harmonic/tonal vibe.`,
            `Process ${instA} through the mindset of ${b}, and ${instB} through the mindset of ${a}.`
        ];
        const shuffled = [...templatePool].sort(() => Math.random() - 0.5);
        const picks = shuffled.slice(0, 3);
        const titleEl = document.getElementById('blend-title'); if (titleEl) titleEl.textContent = title;
        const promptsEl = document.getElementById('blend-prompts');
        if (promptsEl) promptsEl.innerHTML = picks.map(p => `<div class="text-[11px] md:text-[12px] text-[#E2E8F0]/85 font-mono leading-relaxed bg-black/40 border border-[#FFD60A20] rounded px-3 py-2">→ ${p}</div>`).join('');
        const card = document.getElementById('genre-blend-card');
        if (card) { card.classList.remove('hidden'); card.classList.add('surprise-flash'); setTimeout(() => card.classList.remove('surprise-flash'), 500); card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    };

    window.surpriseCookbook = () => {
        const recipes = window.db.cookbook || [];
        if (recipes.length === 0) return;
        let pick = recipes[Math.floor(Math.random() * recipes.length)];
        if (recipes.length > 1 && window.currentCookbookId != null) {
            const others = recipes.filter(r => r.id !== window.currentCookbookId);
            if (others.length > 0) pick = others[Math.floor(Math.random() * others.length)];
        }
        window.switchTab('cookbook');
        window.selectGenre(pick.genre);
        setTimeout(() => {
            window.selectInst(pick.id);
            document.getElementById('recipe-display')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const disp = document.getElementById('recipe-display');
            if (disp) { disp.classList.add('surprise-flash'); setTimeout(() => disp.classList.remove('surprise-flash'), 500); }
        }, 60);
    };

    window.refreshAllUI = () => {
        if (window.renderTracks) window.renderTracks(); if (window.renderTones) window.renderTones(); if (window.renderStarredTones) window.renderStarredTones();
        if (window.renderLinks) window.renderLinks(); if (window.renderNoteTabs) window.renderNoteTabs(); if (window.renderCookbookMenu) window.renderCookbookMenu();
        if (window.renderSessionStats) window.renderSessionStats();
    };

    window.currentMode = 'reaper';
    window.setDAW = () => {
        document.body.className = `h-screen flex flex-col overflow-hidden text-sm selection:bg-[#00FF88] selection:text-black`;
        if(window.FERRETT_QUIET) document.body.classList.add('quiet');
        const dn = document.getElementById('daw-display-name'); if(dn) dn.innerText = `EUTERPE WORKSPACE ${window.APP_VERSION}`;
        window.refreshAllUI();
    };

    // Everything that must happen when a tab is left, in one place. Exported because the nav is not
    // the only thing that switches tabs any more: 12-tab-init.js adds its own top-level buttons and
    // used to swap the .active class directly, which meant leaving the Toolbox by that route left the
    // metronome (and the tuner, the test tone, the routine timer...) audibly running on a tab with no
    // transport on it, and nothing to stop it short of a reload.
    window.leaveTab = (tabId) => {
        if (tabId !== 'toolbox') { window.stopMetronome?.(); window.stopTuner?.(); window.stopRoutine?.(false); window.stopTestTone?.(); window.stopBeatSketch?.(); window.stopToolsAudio?.(); }
        if (tabId === 'toolbox') { window.renderSessionStats?.(); window.refreshLab?.(); window.refreshTools?.(); }
        if (tabId === 'lyrics') { window.refreshLyrics?.(); }
        document.getElementById('tab-scroll-area')?.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.switchTab = (tabId) => {
        window.leaveTab(tabId);
        document.querySelectorAll('.middle-tab').forEach(el => el.classList.remove('active')); const targetTab = document.getElementById(`tab-${tabId}`);
        if(targetTab) { targetTab.classList.add('active'); document.getElementById('tab-scroll-area')?.scrollTo({ top: 0, behavior: 'instant' }); }
        // .style.boxShadow as well as the classes: 12-tab-init.js lights its own top-level buttons with
        // an inline glow, and a class-only reset leaves that glow behind on every tab already visited.
        document.querySelectorAll('.nav-btn').forEach(btn => { btn.classList.remove('active-nav-green', 'active-nav-cyan'); btn.classList.add('text-[#7AFFBF]/60', 'border-transparent'); btn.style.boxShadow = ''; });
        const activeBtn = document.getElementById(`nav-${tabId}`);
        if(activeBtn) { activeBtn.classList.remove('text-[#7AFFBF]/60', 'border-transparent'); activeBtn.classList.add('active-nav-green'); }
    };

    window.toggleForm = (formId) => {
        const form = document.getElementById(formId); if(!form) return; form.classList.toggle('hidden');
        if(!form.classList.contains('hidden')) {
            form.querySelectorAll('input:not([type=hidden]), textarea, select').forEach(i => { if(i.type === 'checkbox') i.checked = false; else if(i.tagName === 'SELECT') i.selectedIndex = 0; else i.value = ''; });
            if(formId === 'form-track') { document.getElementById('track-form-title').innerText = 'NEW CHANNEL SETTING'; window.tempTrackImages = []; window.renderImagePreviews('track-image-preview-container', [], 'track'); }
            if(formId === 'form-tone') { document.getElementById('tone-form-title').innerText = 'NEW TONE COMBO'; window.tempToneImages = []; window.renderImagePreviews('tone-image-preview-container', [], 'tone'); window.stopToneRecording(); window.tempToneAudio = null; window.renderAudioPreview('tone-audio-preview-container', null); }
            if(formId === 'form-cookbook') { document.getElementById('cookbook-form-title').innerText = 'NEW RECIPE'; window.tempCookbookImages = []; window.renderImagePreviews('cookbook-image-preview-container', [], 'cookbook'); document.getElementById('cookbook-split-view')?.classList.add('hidden'); }
            if(formId === 'form-link') { const t = document.getElementById('link-form-title'); if(t) t.innerText = 'NEW TOOL LINK'; }
            setTimeout(() => { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
        } else { if(formId === 'form-cookbook') document.getElementById('cookbook-split-view')?.classList.remove('hidden'); if(formId === 'form-tone') window.stopToneRecording(); }
    };
    
    ['cookbook', 'guitars', 'hardware', 'links', 'tracks', 'tones', 'toolbox', 'lyrics'].forEach(tab => { const navBtn = document.getElementById(`nav-${tab}`); if (navBtn) navBtn.addEventListener('click', () => window.switchTab(tab)); });

    // Notes is a persistent footer under every tab, not a switchable tab — just expand/collapse it.
    window.NOTES_FOOTER_KEY = 'ferrett_os_notes_footer_open_v1';
    window.setNotesFooterOpen = (open) => {
        const body = document.getElementById('notes-footer-body'); const chevron = document.getElementById('notes-footer-chevron'); const navBtn = document.getElementById('nav-notes');
        if (body) body.classList.toggle('hidden', !open);
        if (chevron) chevron.style.transform = open ? 'rotate(180deg)' : '';
        if (navBtn) { if (open) { navBtn.classList.remove('text-[#7AFFBF]/60', 'border-transparent'); navBtn.classList.add('active-nav-green'); } else { navBtn.classList.add('text-[#7AFFBF]/60', 'border-transparent'); navBtn.classList.remove('active-nav-green'); } }
        try { window.localStorage.setItem(window.NOTES_FOOTER_KEY, open ? '1' : '0'); } catch (e) {}
    };
    window.toggleNotesFooter = () => { const body = document.getElementById('notes-footer-body'); window.setNotesFooterOpen(body ? body.classList.contains('hidden') : true); };
    document.getElementById('notes-footer-toggle')?.addEventListener('click', () => window.toggleNotesFooter());
    document.getElementById('nav-notes')?.addEventListener('click', () => { window.toggleNotesFooter(); document.getElementById('notes-footer')?.scrollIntoView({ behavior: 'smooth', block: 'end' }); });
    let notesFooterInitiallyOpen = false;
    try { notesFooterInitiallyOpen = window.localStorage.getItem(window.NOTES_FOOTER_KEY) === '1'; } catch (e) {}
    window.setNotesFooterOpen(notesFooterInitiallyOpen);

    document.getElementById('calc-bpm-main')?.addEventListener('input', (e) => window.updateCalc(e.target.value));
    const tapHandler = () => { const now = Date.now(); window.tapTimes = window.tapTimes || []; window.tapTimes.push(now); if(window.tapTimes.length > 4) window.tapTimes.shift(); if(window.tapTimes.length > 1) { let sum = 0; for(let i=1; i<window.tapTimes.length; i++) { sum += (window.tapTimes[i] - window.tapTimes[i-1]); } const avg = sum / (window.tapTimes.length - 1); const bpm = Math.round(60000 / avg); const cbm = document.getElementById('calc-bpm-main'); if(cbm) cbm.value = bpm; window.updateCalc(bpm); } clearTimeout(window.tapTimeout); window.tapTimeout = setTimeout(() => { window.tapTimes = []; }, 2000); };
    document.getElementById('btn-tap-tempo-main')?.addEventListener('click', tapHandler);

    // === METRONOME (Web Audio scheduler for accurate timing, not setInterval drift) ===
    window.metro = { running: false, ctx: null, nextNoteTime: 0, currentBeat: 0, beatsPerMeasure: 4, timerID: null, lookahead: 25, scheduleAheadTime: 0.1 };

    window.renderMetroDots = () => {
        const container = document.getElementById('metro-beat-dots'); if (!container) return;
        const n = window.metro.beatsPerMeasure;
        container.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const dot = document.createElement('div');
            dot.className = 'metro-dot w-8 h-8 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all duration-75 ' + (i === 0 ? 'border-[#FFD60A50] text-[#FFD60A]/50' : 'border-[#00FF8830] text-[#00FF88]/40');
            dot.textContent = (i + 1).toString();
            dot.dataset.beat = i;
            container.appendChild(dot);
        }
    };

    window.metroScheduleClick = (beatNum, time) => {
        const ctx = window.metro.ctx; if (!ctx) return;
        const isAccent = beatNum === 0;
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.frequency.value = isAccent ? 1600 : 1000;
        gain.gain.setValueAtTime(isAccent ? 0.9 : 0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(time); osc.stop(time + 0.06);
        const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
        setTimeout(() => window.metroFlashBeat(beatNum), delayMs);
    };

    window.metroFlashBeat = (beatNum) => {
        const isAccent = beatNum === 0;
        document.querySelectorAll('.metro-dot').forEach((dot) => {
            const b = parseInt(dot.dataset.beat, 10);
            if (b === beatNum) { dot.style.background = isAccent ? '#FFD60A' : '#00FF88'; dot.style.color = '#000'; dot.style.borderColor = isAccent ? '#FFD60A' : '#00FF88'; dot.style.boxShadow = `0 0 12px ${isAccent ? '#FFD60A' : '#00FF88'}`; }
            else { dot.style.background = ''; dot.style.color = ''; dot.style.borderColor = ''; dot.style.boxShadow = ''; }
        });
        const flash = document.getElementById('metro-flash');
        if (flash) {
            flash.style.background = isAccent ? '#FFD60A' : '#00FF88';
            flash.style.borderColor = isAccent ? '#FFD60A' : '#00FF88';
            flash.style.boxShadow = `0 0 30px ${isAccent ? '#FFD60A' : '#00FF88'}`;
            clearTimeout(window.metroFlashTimeout);
            window.metroFlashTimeout = setTimeout(() => { flash.style.background = ''; flash.style.borderColor = ''; flash.style.boxShadow = ''; }, 90);
        }
        if (!window.FERRETT_QUIET) {
            const pulseClass = isAccent ? 'beat-pulse-accent' : 'beat-pulse';
            document.body.classList.add(pulseClass);
            clearTimeout(window.beatPulseTimeout);
            window.beatPulseTimeout = setTimeout(() => document.body.classList.remove('beat-pulse', 'beat-pulse-accent'), 70);
        }
    };

    window.metroNextNote = () => {
        const bpm = parseFloat(document.getElementById('metro-bpm')?.value) || 120;
        const secondsPerBeat = 60.0 / bpm;
        window.metro.nextNoteTime += secondsPerBeat;
        window.metro.currentBeat = (window.metro.currentBeat + 1) % window.metro.beatsPerMeasure;
    };

    window.metroScheduler = () => {
        while (window.metro.nextNoteTime < window.metro.ctx.currentTime + window.metro.scheduleAheadTime) {
            window.metroScheduleClick(window.metro.currentBeat, window.metro.nextNoteTime);
            window.metroNextNote();
        }
        window.metro.timerID = setTimeout(window.metroScheduler, window.metro.lookahead);
    };

    window.startMetronome = () => {
        if (window.metro.running) return;
        window.metro.ctx = window.metro.ctx || new (window.AudioContext || window.webkitAudioContext)();
        if (window.metro.ctx.state === 'suspended') window.metro.ctx.resume();
        window.metro.currentBeat = 0;
        window.metro.nextNoteTime = window.metro.ctx.currentTime + 0.05;
        window.metro.running = true;
        window.metroScheduler();
        const btn = document.getElementById('btn-metro-toggle'); if (btn) { btn.textContent = '■ STOP'; btn.classList.remove('btn-euterpe-green'); btn.style.borderColor = '#FF2A2A50'; btn.style.color = '#FF8888'; btn.style.background = 'rgba(255,42,42,0.08)'; }
    };

    window.stopMetronome = () => {
        if (!window.metro.running) return;
        window.metro.running = false;
        clearTimeout(window.metro.timerID);
        document.querySelectorAll('.metro-dot').forEach((dot) => { dot.style.background = ''; dot.style.color = ''; dot.style.borderColor = ''; dot.style.boxShadow = ''; });
        const flash = document.getElementById('metro-flash'); if (flash) { flash.style.background = ''; flash.style.borderColor = ''; flash.style.boxShadow = ''; }
        const btn = document.getElementById('btn-metro-toggle'); if (btn) { btn.textContent = '▶ START'; btn.classList.add('btn-euterpe-green'); btn.style.borderColor = ''; btn.style.color = ''; btn.style.background = ''; }
    };

    window.renderMetroDots();
    window.startSession = () => {
        const recipes = window.db.cookbook || [];
        if (recipes.length === 0) { alert('Add some cookbook recipes first, then Session Starter has something to pick from.'); return; }
        const pick = recipes[Math.floor(Math.random() * recipes.length)];
        const bpm = window.getGenreBpmMid(pick.genre);
        const bpmEl = document.getElementById('metro-bpm'); if (bpmEl) bpmEl.value = bpm;
        const newNote = { id: Date.now(), title: `Session — ${pick.genre}`, content: `// Session Starter — ${new Date().toLocaleDateString()}\n// Recipe: ${pick.genre} — ${pick.inst}\n\n[TODO] Load up the recipe chain\n[TODO] Track a rough idea\n[TODO] Save/export when done` };
        window.db.multiNotes.push(newNote); window.currentNoteId = newNote.id; window.saveData(); window.renderNoteTabs(); window.setNotesFooterOpen(true);
        if (!window.sessionState.running) window.toggleSessionTimer();
        window.switchTab('cookbook'); window.selectGenre(pick.genre); setTimeout(() => window.selectInst(pick.id), 120);
        setTimeout(() => alert(`Session started: ${pick.genre} @ ${bpm} BPM.\nRecipe loaded, fresh note ready, timer running.`), 150);
    };
    document.getElementById('btn-session-starter')?.addEventListener('click', () => window.startSession());

    document.getElementById('btn-metro-toggle')?.addEventListener('click', () => { window.metro.running ? window.stopMetronome() : window.startMetronome(); });


    document.getElementById('btn-metro-bpm-minus')?.addEventListener('click', () => { const el = document.getElementById('metro-bpm'); if (el) el.value = Math.max(30, parseInt(el.value, 10) - 1); });
    document.getElementById('btn-metro-bpm-plus')?.addEventListener('click', () => { const el = document.getElementById('metro-bpm'); if (el) el.value = Math.min(300, parseInt(el.value, 10) + 1); });
    document.getElementById('metro-beats')?.addEventListener('change', (e) => { window.metro.beatsPerMeasure = parseInt(e.target.value, 10); window.metro.currentBeat = 0; window.renderMetroDots(); });
    window.metroTapTimes = [];
    document.getElementById('btn-metro-tap')?.addEventListener('click', () => {
        const now = Date.now(); window.metroTapTimes.push(now); if (window.metroTapTimes.length > 4) window.metroTapTimes.shift();
        if (window.metroTapTimes.length > 1) { let sum = 0; for (let i = 1; i < window.metroTapTimes.length; i++) sum += (window.metroTapTimes[i] - window.metroTapTimes[i - 1]); const bpm = Math.round(60000 / (sum / (window.metroTapTimes.length - 1))); const el = document.getElementById('metro-bpm'); if (el) el.value = Math.max(30, Math.min(300, bpm)); }
        clearTimeout(window.metroTapTimeout); window.metroTapTimeout = setTimeout(() => { window.metroTapTimes = []; }, 2000);
    });

    // === PRACTICE ROUTINE (ramps metronome tempo on a timer) ===
    window.routine = { running: false, step: 0, totalSteps: 5, stepMs: 0, stepStartedAt: 0, tickInterval: null, stepTimeout: null };

    window.fmtMmSs = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

    window.routineTick = () => {
        const elapsed = Date.now() - window.routine.stepStartedAt;
        const remaining = window.routine.stepMs - elapsed;
        const statusEl = document.getElementById('routine-status');
        const bpmEl = document.getElementById('metro-bpm');
        if (statusEl) statusEl.textContent = `Step ${window.routine.step + 1}/${window.routine.totalSteps} — ${bpmEl?.value || ''} BPM — ${window.fmtMmSs(remaining)} left in step`;
        const bar = document.getElementById('routine-progress-bar'); if (bar) bar.style.width = `${Math.round(((window.routine.step + (elapsed / window.routine.stepMs)) / window.routine.totalSteps) * 100)}%`;
    };

    window.routineAdvanceStep = () => {
        window.routine.step++;
        if (window.routine.step >= window.routine.totalSteps) { window.stopRoutine(true); return; }
        const incr = parseInt(document.getElementById('routine-increment')?.value, 10) || 10;
        const bpmEl = document.getElementById('metro-bpm');
        if (bpmEl) bpmEl.value = Math.min(300, parseInt(bpmEl.value, 10) + incr);
        window.routine.stepStartedAt = Date.now();
        window.routine.stepTimeout = setTimeout(window.routineAdvanceStep, window.routine.stepMs);
    };

    window.startRoutine = () => {
        if (window.routine.running) return;
        const startBpm = parseInt(document.getElementById('routine-start-bpm')?.value, 10) || 80;
        const stepMins = parseFloat(document.getElementById('routine-step-mins')?.value) || 2;
        const totalSteps = parseInt(document.getElementById('routine-steps')?.value, 10) || 5;
        const bpmEl = document.getElementById('metro-bpm'); if (bpmEl) bpmEl.value = startBpm;
        window.routine.running = true; window.routine.step = 0; window.routine.totalSteps = totalSteps; window.routine.stepMs = stepMins * 60 * 1000; window.routine.stepStartedAt = Date.now();
        if (!window.metro.running) window.startMetronome();
        window.routine.stepTimeout = setTimeout(window.routineAdvanceStep, window.routine.stepMs);
        window.routine.tickInterval = setInterval(window.routineTick, 1000);
        window.routineTick();
        document.getElementById('routine-progress-bar-wrap')?.classList.remove('hidden');
        const btn = document.getElementById('btn-routine-toggle'); if (btn) { btn.textContent = '■ STOP ROUTINE'; btn.classList.remove('btn-euterpe-green'); btn.style.borderColor = '#FF2A2A50'; btn.style.color = '#FF8888'; btn.style.background = 'rgba(255,42,42,0.08)'; }
    };

    window.stopRoutine = (completed) => {
        if (!window.routine.running && !completed) return;
        window.routine.running = false;
        clearTimeout(window.routine.stepTimeout); clearInterval(window.routine.tickInterval);
        const statusEl = document.getElementById('routine-status'); if (statusEl) statusEl.textContent = completed ? '✓ Routine complete.' : '';
        const bar = document.getElementById('routine-progress-bar'); if (bar) bar.style.width = completed ? '100%' : '0%';
        const btn = document.getElementById('btn-routine-toggle'); if (btn) { btn.textContent = '▶ START ROUTINE'; btn.classList.add('btn-euterpe-green'); btn.style.borderColor = ''; btn.style.color = ''; btn.style.background = ''; }
        if (completed) window.stopMetronome();
    };

    document.getElementById('btn-routine-toggle')?.addEventListener('click', () => { window.routine.running ? window.stopRoutine(false) : window.startRoutine(); });

    // === TUNER (mic input + autocorrelation pitch detection) ===
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const GUITAR_STRINGS = [{ name: 'E2', freq: 82.41 }, { name: 'A2', freq: 110.00 }, { name: 'D3', freq: 146.83 }, { name: 'G3', freq: 196.00 }, { name: 'B3', freq: 246.94 }, { name: 'E4', freq: 329.63 }];
    const BASS5_STRINGS = [{ name: 'B0', freq: 30.87 }, { name: 'E1', freq: 41.20 }, { name: 'A1', freq: 55.00 }, { name: 'D2', freq: 73.42 }, { name: 'G2', freq: 98.00 }];
    window.tuner = { running: false, ctx: null, analyser: null, buf: null, stream: null, rafId: null, mode: 'guitar', targetFreq: null };

    window.noteNumFromFreq = (f) => Math.round(12 * (Math.log(f / 440) / Math.log(2))) + 69;
    window.freqFromNoteNum = (n) => 440 * Math.pow(2, (n - 69) / 12);
    window.centsOff = (f, n) => Math.floor(1200 * (Math.log(f / window.freqFromNoteNum(n)) / Math.log(2)));
    window.noteNameFromNum = (n) => NOTE_NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);

    window.autoCorrelatePitch = (buf, sampleRate) => {
        const SIZE = buf.length;
        let rms = 0;
        for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
        rms = Math.sqrt(rms / SIZE);
        if (rms < 0.01) return -1;
        let r1 = 0, r2 = SIZE - 1;
        const thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buf[i]) < thres) { r1 = i; break; } }
        for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; } }
        const trimmed = buf.slice(r1, r2);
        const n2 = trimmed.length;
        const c = new Array(n2).fill(0);
        for (let i = 0; i < n2; i++) { for (let j = 0; j < n2 - i; j++) c[i] += trimmed[j] * trimmed[j + i]; }
        let d = 0; while (d < n2 - 1 && c[d] > c[d + 1]) d++;
        let maxVal = -1, maxPos = -1;
        for (let i = d; i < n2; i++) { if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; } }
        let T0 = maxPos;
        if (T0 <= 0 || T0 >= n2 - 1) return -1;
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);
        return T0 > 0 ? sampleRate / T0 : -1;
    };

    window.renderTunerStrings = () => {
        const container = document.getElementById('tuner-string-buttons'); if (!container) return;
        const strings = window.tuner.mode === 'guitar' ? GUITAR_STRINGS : BASS5_STRINGS;
        container.innerHTML = strings.map((s) => `<button type="button" class="tuner-string-btn btn-euterpe" data-freq="${s.freq}" style="min-width:56px;">${s.name}</button>`).join('');
        container.querySelectorAll('.tuner-string-btn').forEach((btn) => btn.addEventListener('click', () => {
            container.querySelectorAll('.tuner-string-btn').forEach((b) => { b.style.background = ''; b.style.borderColor = ''; b.style.color = ''; });
            btn.style.background = 'rgba(0,229,255,0.18)'; btn.style.borderColor = '#00E5FF'; btn.style.color = '#00E5FF';
            window.tuner.targetFreq = parseFloat(btn.dataset.freq);
        }));
    };

    window.updateTunerReading = () => {
        if (!window.tuner.running) return;
        window.tuner.analyser.getFloatTimeDomainData(window.tuner.buf);
        const freq = window.autoCorrelatePitch(window.tuner.buf, window.tuner.ctx.sampleRate);
        const noteEl = document.getElementById('tuner-note-display'); const centsEl = document.getElementById('tuner-cents-display'); const freqEl = document.getElementById('tuner-freq-display'); const needle = document.getElementById('tuner-needle');
        if (freq > 0 && freq < 1200) {
            let cents, label;
            if (window.tuner.targetFreq) { cents = Math.floor(1200 * (Math.log(freq / window.tuner.targetFreq) / Math.log(2))); label = null; }
            else { const noteNum = window.noteNumFromFreq(freq); cents = window.centsOff(freq, noteNum); label = window.noteNameFromNum(noteNum); }
            if (noteEl) noteEl.textContent = label || (window.tuner.targetFreq ? GUITAR_STRINGS.concat(BASS5_STRINGS).find(s => s.freq === window.tuner.targetFreq)?.name || '--' : '--');
            if (freqEl) freqEl.textContent = freq.toFixed(1) + ' Hz';
            const clamped = Math.max(-50, Math.min(50, cents));
            if (needle) needle.style.left = (50 + clamped) + '%';
            const absC = Math.abs(cents);
            const color = absC <= 5 ? '#00FF88' : (absC <= 15 ? '#FFD60A' : '#FF5A5A');
            if (noteEl) noteEl.style.color = color; if (needle) needle.style.background = color;
            if (centsEl) centsEl.textContent = (cents > 0 ? '+' : '') + cents;
        } else {
            if (freqEl) freqEl.textContent = '-- Hz'; if (centsEl) centsEl.textContent = '';
        }
        window.tuner.rafId = requestAnimationFrame(window.updateTunerReading);
    };

    window.startTuner = async () => {
        if (window.tuner.running) return;
        const statusEl = document.getElementById('tuner-status');
        try {
            window.tuner.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
            window.tuner.ctx = window.tuner.ctx || new (window.AudioContext || window.webkitAudioContext)();
            if (window.tuner.ctx.state === 'suspended') await window.tuner.ctx.resume();
            const source = window.tuner.ctx.createMediaStreamSource(window.tuner.stream);
            window.tuner.analyser = window.tuner.ctx.createAnalyser();
            window.tuner.analyser.fftSize = 8192;
            window.tuner.buf = new Float32Array(window.tuner.analyser.fftSize);
            source.connect(window.tuner.analyser);
            window.tuner.running = true;
            window.updateTunerReading();
            const btn = document.getElementById('btn-tuner-toggle'); if (btn) { btn.textContent = '■ STOP TUNER'; btn.classList.remove('btn-euterpe-green'); btn.style.borderColor = '#FF2A2A50'; btn.style.color = '#FF8888'; btn.style.background = 'rgba(255,42,42,0.08)'; }
            if (statusEl) statusEl.textContent = 'Listening...';
        } catch (err) {
            if (statusEl) statusEl.textContent = 'Microphone access denied or unavailable.';
        }
    };

    window.stopTuner = () => {
        if (!window.tuner.running) return;
        window.tuner.running = false;
        cancelAnimationFrame(window.tuner.rafId);
        window.tuner.stream?.getTracks().forEach((t) => t.stop());
        const btn = document.getElementById('btn-tuner-toggle'); if (btn) { btn.textContent = '🎙️ START TUNER'; btn.classList.add('btn-euterpe-green'); btn.style.borderColor = ''; btn.style.color = ''; btn.style.background = ''; }
        const statusEl = document.getElementById('tuner-status'); if (statusEl) statusEl.textContent = '';
        const noteEl = document.getElementById('tuner-note-display'); if (noteEl) { noteEl.textContent = '--'; noteEl.style.color = ''; }
        const freqEl = document.getElementById('tuner-freq-display'); if (freqEl) freqEl.textContent = '-- Hz';
        const centsEl = document.getElementById('tuner-cents-display'); if (centsEl) centsEl.textContent = '';
        const needle = document.getElementById('tuner-needle'); if (needle) { needle.style.left = '50%'; needle.style.background = ''; }
    };

    window.renderTunerStrings();
    document.getElementById('btn-tuner-toggle')?.addEventListener('click', () => { window.tuner.running ? window.stopTuner() : window.startTuner(); });
    document.getElementById('btn-tuner-guitar')?.addEventListener('click', (e) => { window.tuner.mode = 'guitar'; window.tuner.targetFreq = null; window.renderTunerStrings(); e.target.style.background = 'rgba(0,229,255,0.12)'; e.target.style.borderColor = '#00E5FF80'; e.target.style.color = '#00E5FF'; const b = document.getElementById('btn-tuner-bass'); if (b) { b.style.background = ''; b.style.borderColor = ''; b.style.color = ''; } });
    document.getElementById('btn-tuner-bass')?.addEventListener('click', (e) => { window.tuner.mode = 'bass'; window.tuner.targetFreq = null; window.renderTunerStrings(); e.target.style.background = 'rgba(0,229,255,0.12)'; e.target.style.borderColor = '#00E5FF80'; e.target.style.color = '#00E5FF'; const g = document.getElementById('btn-tuner-guitar'); if (g) { g.style.background = ''; g.style.borderColor = ''; g.style.color = ''; } });

    
    window.updateCalc = function(bpm) {
        if(bpm > 0) {
            const bMs = 60000 / bpm; const u = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
            u('calc-14', Math.round(bMs) + 'ms'); u('calc-18', Math.round(bMs / 2) + 'ms'); u('calc-dot', Math.round(bMs * 0.75) + 'ms'); u('calc-hz', (bpm / 60).toFixed(2) + ' Hz');
            u('calc-main-12', Math.round(bMs * 2) + 'ms'); u('calc-main-14', Math.round(bMs) + 'ms'); u('calc-main-18', Math.round(bMs / 2) + 'ms'); u('calc-main-116', Math.round(bMs / 4) + 'ms');
            u('calc-main-14d', Math.round(bMs * 1.5) + 'ms'); u('calc-main-18d', Math.round((bMs / 2) * 1.5) + 'ms'); u('calc-main-116d', Math.round((bMs / 4) * 1.5) + 'ms');
            u('calc-main-14t', Math.round(bMs * 0.6667) + 'ms'); u('calc-main-18t', Math.round((bMs / 2) * 0.6667) + 'ms'); u('calc-main-116t', Math.round((bMs / 4) * 0.6667) + 'ms');
            u('calc-main-hz-bar', (bpm / 240).toFixed(2) + ' Hz'); u('calc-main-hz-1', (bpm / 60).toFixed(2) + ' Hz'); u('calc-main-hz-2', ((bpm / 60) * 2).toFixed(2) + ' Hz');
        }
    }

    const notesTitleInput = document.getElementById('active-note-title'); const notesTextArea = document.getElementById('studio-notes'); const notesTabsContainer = document.getElementById('notes-tabs-container'); const notesTasksPanel = document.getElementById('notes-tasks-panel');
    window.renderNoteTabs = () => { if(!notesTabsContainer) return; notesTabsContainer.innerHTML = ''; window.db.multiNotes.forEach(note => { const isActive = note.id === window.currentNoteId; const tab = document.createElement('div'); tab.className = `note-tab ${isActive ? 'active' : ''}`; tab.innerHTML = `<span class="truncate max-w-[120px] select-none" data-id="${note.id}">${window.escapeHtml(note.title || 'Untitled')}</span><span class="note-tab-close" data-close-id="${note.id}">×</span>`; notesTabsContainer.appendChild(tab); }); const activeNote = window.db.multiNotes.find(n => n.id === window.currentNoteId); if (activeNote && notesTitleInput && notesTextArea) { notesTitleInput.value = activeNote.title; notesTextArea.value = activeNote.content; } const footerTitle = document.getElementById('notes-footer-active-title'); if (footerTitle) footerTitle.textContent = activeNote ? (activeNote.title || 'Untitled') : 'No active note'; window.renderNoteTasks(); };

    const escapeHtml = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    window.renderNoteTasks = () => {
        if (!notesTasksPanel) return;
        const activeNote = window.db.multiNotes.find(n => n.id === window.currentNoteId);
        const content = activeNote ? (activeNote.content || '') : '';
        const lines = content.split('\n');
        const taskIdxs = [];
        lines.forEach((line, i) => { if (/^\s*\[(TODO|DONE)\]/i.test(line)) taskIdxs.push(i); });
        if (taskIdxs.length === 0) { notesTasksPanel.innerHTML = ''; notesTasksPanel.classList.add('hidden'); return; }
        const openCount = taskIdxs.filter(i => /^\s*\[TODO\]/i.test(lines[i])).length;
        notesTasksPanel.classList.remove('hidden');
        notesTasksPanel.innerHTML = `<div class="text-[9px] tracking-widest text-[#00FF88] font-bold uppercase mb-2">Checklist — ${openCount} open / ${taskIdxs.length} total</div>` +
            taskIdxs.map(i => {
                const line = lines[i]; const done = /^\s*\[DONE\]/i.test(line);
                const text = line.replace(/^\s*\[(TODO|DONE)\]\s?/i, '');
                return `<label class="flex items-start gap-2 px-1 py-1 rounded hover:bg-white/5 cursor-pointer group">
                    <input type="checkbox" data-line-idx="${i}" class="note-task-checkbox mt-[3px] w-3.5 h-3.5 accent-[#00FF88] cursor-pointer shrink-0" ${done ? 'checked' : ''}>
                    <span class="text-[11px] font-mono leading-snug ${done ? 'line-through opacity-40 text-[#7AFFBF]' : 'text-[#C9FFE6]'}">${escapeHtml(text) || '(empty task)'}</span>
                </label>`;
            }).join('');
    };
    notesTasksPanel?.addEventListener('change', (e) => {
        if (!e.target.classList.contains('note-task-checkbox')) return;
        const idx = parseInt(e.target.dataset.lineIdx, 10);
        const activeNote = window.db.multiNotes.find(n => n.id === window.currentNoteId);
        if (!activeNote) return;
        const lines = (activeNote.content || '').split('\n');
        if (lines[idx] === undefined) return;
        lines[idx] = lines[idx].replace(/^(\s*)\[(TODO|DONE)\]/i, (m, ws) => `${ws}[${e.target.checked ? 'DONE' : 'TODO'}]`);
        activeNote.content = lines.join('\n');
        if (notesTextArea) notesTextArea.value = activeNote.content;
        window.saveData();
        window.renderNoteTasks();
    });
    document.getElementById('btn-quick-add-task')?.addEventListener('click', () => {
        const activeNote = window.db.multiNotes.find(n => n.id === window.currentNoteId);
        if (!activeNote || !notesTextArea) return;
        const prefix = activeNote.content && !activeNote.content.endsWith('\n') ? '\n' : '';
        activeNote.content = (activeNote.content || '') + `${prefix}[TODO] `;
        notesTextArea.value = activeNote.content;
        window.saveData(); window.renderNoteTasks();
        notesTextArea.focus(); notesTextArea.setSelectionRange(notesTextArea.value.length, notesTextArea.value.length);
    });
    notesTabsContainer?.addEventListener('click', (e) => { if (e.target.dataset.id) { window.currentNoteId = parseInt(e.target.dataset.id); window.renderNoteTabs(); } if (e.target.dataset.closeId) { const idToDelete = parseInt(e.target.dataset.closeId); if (confirm('Delete this note tab?')) { window.db.multiNotes = window.db.multiNotes.filter(n => n.id !== idToDelete); if (window.db.multiNotes.length === 0) window.db.multiNotes.push({ id: Date.now(), title: 'Main Scratchpad', content: '' }); if (window.currentNoteId === idToDelete) window.currentNoteId = window.db.multiNotes[window.db.multiNotes.length - 1].id; window.saveData(); window.renderNoteTabs(); } } });
    document.getElementById('btn-add-note-tab')?.addEventListener('click', () => { const newNote = { id: Date.now(), title: 'New Note', content: '' }; window.db.multiNotes.push(newNote); window.currentNoteId = newNote.id; window.saveData(); window.renderNoteTabs(); notesTitleInput?.focus(); notesTitleInput?.select(); });
    notesTitleInput?.addEventListener('input', (e) => { const activeNote = window.db.multiNotes.find(n => n.id === window.currentNoteId); if (activeNote) { activeNote.title = e.target.value; const activeTabSpan = notesTabsContainer.querySelector('.note-tab.active span[data-id]'); if (activeTabSpan) activeTabSpan.innerText = activeNote.title || 'Untitled'; const footerTitle = document.getElementById('notes-footer-active-title'); if (footerTitle) footerTitle.textContent = activeNote.title || 'Untitled'; window.saveData(); } });
    notesTextArea?.addEventListener('input', (e) => { const activeNote = window.db.multiNotes.find(n => n.id === window.currentNoteId); if (activeNote) { activeNote.content = e.target.value; window.saveData(); window.renderNoteTasks(); } });

    const processImageFiles = async (files, arrayRef, containerId, arrayName) => {
        if (!files || files.length === 0) return;
        const imageFiles = [...files].filter((f) => f.type.startsWith('image/'));
        for (let i = 0; i < imageFiles.length; i++) { try { const base64 = await window.compressImage(imageFiles[i]); arrayRef.push(base64); } catch (err) { } }
        window.renderImagePreviews(containerId, arrayRef, arrayName);
    };
    const handleImgUpload = (e, arrayRef, containerId, arrayName) => processImageFiles(e.target.files, arrayRef, containerId, arrayName);

    const IMG_TARGETS = {
        cookbook: () => window.tempCookbookImages,
        track: () => window.tempTrackImages,
        tone: () => window.tempToneImages
    };
    document.getElementById('cookbook-image-input')?.addEventListener('change', (e) => handleImgUpload(e, window.tempCookbookImages, 'cookbook-image-preview-container', 'cookbook'));
    document.getElementById('track-image-input')?.addEventListener('change', (e) => handleImgUpload(e, window.tempTrackImages, 'track-image-preview-container', 'track'));
    document.getElementById('tone-image-input')?.addEventListener('change', (e) => handleImgUpload(e, window.tempToneImages, 'tone-image-preview-container', 'tone'));
    document.getElementById('cookbook-camera-input')?.addEventListener('change', (e) => { handleImgUpload(e, window.tempCookbookImages, 'cookbook-image-preview-container', 'cookbook'); e.target.value = ''; });
    document.getElementById('track-camera-input')?.addEventListener('change', (e) => { handleImgUpload(e, window.tempTrackImages, 'track-image-preview-container', 'track'); e.target.value = ''; });
    document.getElementById('tone-camera-input')?.addEventListener('change', (e) => { handleImgUpload(e, window.tempToneImages, 'tone-image-preview-container', 'tone'); e.target.value = ''; });

    // Drag & drop onto any of the three image preview zones (cookbook/track/tone).
    document.querySelectorAll('[data-drop-zone]').forEach((zone) => {
        const kind = zone.dataset.dropZone;
        const containerId = zone.id;
        ['dragenter', 'dragover'].forEach((evt) => zone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); zone.style.outline = '2px dashed currentColor'; zone.style.outlineOffset = '4px'; }));
        ['dragleave', 'dragend'].forEach((evt) => zone.addEventListener(evt, (e) => { zone.style.outline = ''; }));
        zone.addEventListener('drop', (e) => {
            e.preventDefault(); e.stopPropagation(); zone.style.outline = '';
            const arrayRef = IMG_TARGETS[kind]?.(); if (!arrayRef) return;
            processImageFiles(e.dataTransfer.files, arrayRef, containerId, kind);
        });
    });
    document.getElementById('tone-audio-input')?.addEventListener('change', (e) => window.handleToneAudioUpload(e));
    document.getElementById('btn-record-tone-audio')?.addEventListener('click', () => window.startToneRecording());
    document.getElementById('btn-stop-tone-audio')?.addEventListener('click', () => window.stopToneRecording());
    if (!window.MEDIA_RECORDER_SUPPORTED) document.getElementById('btn-record-tone-audio')?.classList.add('hidden');

    document.getElementById('btn-add-cookbook')?.addEventListener('click', () => window.toggleForm('form-cookbook')); document.getElementById('btn-cancel-cookbook')?.addEventListener('click', () => window.toggleForm('form-cookbook'));
    document.getElementById('btn-surprise-cookbook')?.addEventListener('click', () => window.surpriseCookbook());
    document.getElementById('btn-blend-genres')?.addEventListener('click', () => window.blendGenres());
    document.getElementById('btn-genre-lyria')?.addEventListener('click', () => window.openLyriaModal(window.currentCookbookGenre));
    document.getElementById('btn-genre-kit')?.addEventListener('click', () => { const g = window.currentCookbookGenre; if (!g) return; if (kitHistory(g).length) window.renderGenreKit(g); else window.generateGenreKit(g); });
    document.getElementById('btn-open-lyria-tools')?.addEventListener('click', () => window.openLyriaModal());
    document.getElementById('close-lyria-modal')?.addEventListener('click', () => window.closeLyriaModal());
    document.getElementById('lyria-modal')?.addEventListener('click', (e) => { if (e.target.id === 'lyria-modal') window.closeLyriaModal(); });
    document.getElementById('lyria-genre-select')?.addEventListener('change', (e) => { const bpmEl = document.getElementById('lyria-bpm'); if (bpmEl) bpmEl.value = window.getGenreBpmMid(e.target.value); });
    document.getElementById('btn-lyria-generate')?.addEventListener('click', () => window.runLyriaGenerate());
    document.getElementById('btn-lyria-regenerate')?.addEventListener('click', () => window.runLyriaGenerate());
    document.getElementById('btn-lyria-hide')?.addEventListener('click', () => { const w = document.getElementById('lyria-output-wrap'), h = document.getElementById('btn-lyria-hide'); if (!w || !h) return; const nowHidden = w.classList.toggle('hidden'); h.textContent = nowHidden ? 'SHOW' : 'HIDE'; });
    document.getElementById('btn-lyria-copy-style')?.addEventListener('click', () => { const out = document.getElementById('lyria-output-style'); if (!out) return; out.select(); navigator.clipboard?.writeText(out.value).then(() => { const btn = document.getElementById('btn-lyria-copy-style'); if (btn) { const orig = btn.textContent; btn.textContent = '✓ COPIED'; setTimeout(() => btn.textContent = orig, 1500); } }).catch(() => document.execCommand('copy')); });
    // Re-run the build when the timed-arrangement toggle changes, so the box reflects it immediately
    // instead of needing GENERATE again (and without spending another AI call — the description is
    // reused from the last build).
    document.getElementById('lyria-timestamps')?.addEventListener('change', () => {
        if (document.getElementById('lyria-output-wrap')?.classList.contains('hidden')) return;
        const b = window.__lyriaLastBuilt; if (!b) return;
        const wantTimes = !!document.getElementById('lyria-timestamps')?.checked;
        const out = document.getElementById('lyria-output-style');
        if (out) out.value = window.assembleLyriaPrompt({
            description: b.written || b.prompt,
            key: document.getElementById('lyria-key')?.value || '',
            negative: document.getElementById('lyria-negative')?.value || '',
            arrangementBlock: wantTimes ? window.buildLyriaArrangementBlock(b.song) : '',
            song: b.song
        });
    });
    document.getElementById('btn-import-recipes')?.addEventListener('click', () => document.getElementById('recipe-pack-input')?.click());
    document.getElementById('recipe-pack-input')?.addEventListener('change', (e) => { const file = e.target.files[0]; if (file) window.importRecipePack(file); e.target.value = ''; });
    document.getElementById('btn-reroll-blend')?.addEventListener('click', () => window.blendGenres());
    document.getElementById('btn-close-blend')?.addEventListener('click', () => document.getElementById('genre-blend-card')?.classList.add('hidden'));
 document.getElementById('btn-save-cookbook')?.addEventListener('click', () => { 
        const idStr = document.getElementById('cookbook-id').value; 
        const id = idStr ? parseInt(idStr, 10) : Date.now(); 
        const genre = document.getElementById('cookbook-genre').value || 'Uncategorized'; 
        
        const recipe = { 
            id: id, 
            genre: genre, 
            inst: document.getElementById('cookbook-inst').value || 'Unnamed Tool', 
            effort: document.getElementById('cookbook-effort')?.value || '', 
            desc: document.getElementById('cookbook-desc').value, 
            reaper: document.getElementById('cookbook-reaper').value, 
            notes: document.getElementById('cookbook-notes').value, 
            why: document.getElementById('cookbook-why')?.value || '', 
            mixNotes: document.getElementById('cb-mix-notes').value, // <--- HERE IS THE NEW LINE
            images: [...window.tempCookbookImages] 
        }; 
        
        if (idStr) { 
            const old = window.db.cookbook.find(r => r.id === recipe.id); 
            if (old) { 
                const snapshot = { desc: old.desc, reaper: old.reaper, notes: old.notes, savedAt: Date.now() }; 
                recipe.history = [snapshot, ...(old.history || [])].slice(0, 3); 
            } 
            window.db.cookbook = window.db.cookbook.map(r => r.id === recipe.id ? recipe : r); 
        } else {
            window.db.cookbook.push(recipe); 
        }
        
        window.currentCookbookGenre = genre; 
        window.saveData(); 
        window.toggleForm('form-cookbook'); 
        window.renderCookbookMenu(); 
    });
    document.getElementById('btn-add-link')?.addEventListener('click', () => window.toggleForm('form-link')); document.getElementById('btn-cancel-link')?.addEventListener('click', () => window.toggleForm('form-link')); document.getElementById('search-link')?.addEventListener('keyup', () => window.renderLinks());
    document.getElementById('btn-save-link')?.addEventListener('click', () => { const idStr = document.getElementById('link-id').value; const id = idStr ? parseInt(idStr, 10) : Date.now(); const link = { id: id, title: document.getElementById('link-title').value || 'Unnamed Tool', url: document.getElementById('link-url').value || '#', category: document.getElementById('link-category').value, daw: 'reaper', notes: document.getElementById('link-notes').value }; if (!link.url.startsWith('http') && link.url !== '#') link.url = 'https://' + link.url; if (idStr) window.db.links = window.db.links.map(l => l.id === link.id ? link : l); else window.db.links.unshift(link); window.saveData(); window.toggleForm('form-link'); window.renderLinks(); });

    document.getElementById('btn-add-track')?.addEventListener('click', () => window.toggleForm('form-track')); document.getElementById('btn-cancel-track')?.addEventListener('click', () => window.toggleForm('form-track'));
    document.getElementById('btn-save-track')?.addEventListener('click', () => { const idStr = document.getElementById('track-id').value; const id = idStr ? parseInt(idStr, 10) : Date.now(); const track = { id: id, inst: document.getElementById('track-inst').value || 'Unnamed', daw: 'reaper', plugins: document.getElementById('track-plugins').value, toneRef: parseInt(document.getElementById('track-tone-ref')?.value, 10) || null, recipeRef: parseInt(document.getElementById('track-recipe-ref')?.value, 10) || null, reflink: document.getElementById('track-reflink')?.value || '', notes: document.getElementById('track-notes').value, images: [...window.tempTrackImages] }; if (idStr) window.db.tracks = window.db.tracks.map(t => t.id === track.id ? track : t); else window.db.tracks.unshift(track); window.saveData(); window.toggleForm('form-track'); window.renderTracks(); });

    document.getElementById('btn-add-tone')?.addEventListener('click', () => window.toggleForm('form-tone')); document.getElementById('btn-cancel-tone')?.addEventListener('click', () => window.toggleForm('form-tone')); document.getElementById('search-tone')?.addEventListener('keyup', () => window.renderTones());
    document.getElementById('btn-save-tone')?.addEventListener('click', () => { const idStr = document.getElementById('tone-id').value; const id = idStr ? parseInt(idStr, 10) : Date.now(); const isStarred = document.getElementById('tone-starred').checked; if (isStarred && !idStr) { if (window.db.tones.filter(t => t.starred).length >= 10) { alert("You already have 10 Pinned Tones. Unpin an old tone first."); return; } } window.stopToneRecording(); const tone = { id: id, name: document.getElementById('tone-name').value || 'Unnamed Combo', category: document.getElementById('tone-category').value || 'CLEAN', daw: 'reaper', nam: document.getElementById('tone-nam').value, ir: document.getElementById('tone-ir').value, brand: (document.getElementById('tone-brand')?.value || '').trim(), notes: document.getElementById('tone-notes').value, starred: isStarred, images: [...window.tempToneImages], hasAudio: !!window.tempToneAudio }; if (idStr) window.db.tones = window.db.tones.map(t => t.id === tone.id ? tone : t); else window.db.tones.unshift(tone); window.saveData(); (async () => { if (window.tempToneAudio) { await window.audioDbSet(id, window.tempToneAudio); } else { await window.audioDbDelete(id); } window.scheduleAudioDriveSync(); })(); window.toggleForm('form-tone'); window.renderTones(); window.renderStarredTones(); });

    document.addEventListener('click', (e) => {
        const btnEditCb = e.target.closest('.btn-edit-cookbook'); if(btnEditCb) { const recipe = window.db.cookbook.find(r => r.id === parseInt(btnEditCb.dataset.id, 10)); if(recipe) { document.getElementById('cookbook-id').value = recipe.id; document.getElementById('cookbook-genre').value = recipe.genre; document.getElementById('cookbook-inst').value = recipe.inst; document.getElementById('cb-mix-notes').value = recipe.mixNotes || ''; { const ef=document.getElementById('cookbook-effort'); if(ef) ef.value = recipe.effort || ''; } document.getElementById('cookbook-desc').value = recipe.desc; document.getElementById('cookbook-reaper').value = recipe.reaper; document.getElementById('cookbook-notes').value = recipe.notes; { const wy=document.getElementById('cookbook-why'); if(wy) wy.value = recipe.why || ''; } const t=document.getElementById('cookbook-form-title'); if(t) t.innerText = 'EDIT RECIPE'; window.tempCookbookImages = recipe.images ? [...recipe.images] : []; window.renderImagePreviews('cookbook-image-preview-container', window.tempCookbookImages, 'cookbook'); document.getElementById('cookbook-split-view')?.classList.add('hidden'); document.getElementById('form-cookbook')?.classList.remove('hidden'); setTimeout(() => { document.getElementById('form-cookbook')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); } }
        const btnDelCb = e.target.closest('.btn-del-cookbook'); if(btnDelCb && confirm("Delete this recipe?")) { window.db.cookbook = window.db.cookbook.filter(r => r.id !== parseInt(btnDelCb.dataset.id, 10)); window.saveData(); window.renderCookbookMenu(); }
        const btnCloneTone = e.target.closest('.btn-clone-tone'); if(btnCloneTone) window.cloneTone(parseInt(btnCloneTone.dataset.id, 10));
        const btnEditTrack = e.target.closest('.btn-edit-track'); if(btnEditTrack) { const track = window.db.tracks.find(t => t.id === parseInt(btnEditTrack.dataset.id, 10)); if(track) { document.getElementById('track-id').value = track.id; document.getElementById('track-inst').value = track.inst; document.getElementById('track-plugins').value = track.plugins; if(window.populateTrackRefs) window.populateTrackRefs(); { const tr=document.getElementById('track-tone-ref'); if(tr) tr.value = track.toneRef || ''; const rr=document.getElementById('track-recipe-ref'); if(rr) rr.value = track.recipeRef || ''; } const rl = document.getElementById('track-reflink'); if (rl) rl.value = track.reflink || ''; document.getElementById('track-notes').value = track.notes; const t=document.getElementById('track-form-title'); if(t) t.innerText = 'EDIT TRACK SETTING'; window.tempTrackImages = track.images ? [...track.images] : []; window.renderImagePreviews('track-image-preview-container', window.tempTrackImages, 'track'); document.getElementById('form-track')?.classList.remove('hidden'); setTimeout(() => { document.getElementById('form-track')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); } }
        const btnDelTrack = e.target.closest('.btn-del-track'); if(btnDelTrack && confirm("Delete this track config?")) { window.db.tracks = window.db.tracks.filter(t => t.id !== parseInt(btnDelTrack.dataset.id, 10)); window.saveData(); window.renderTracks(); }
        const btnCloneTrack = e.target.closest('.btn-clone-track'); if(btnCloneTrack) window.cloneTrack(parseInt(btnCloneTrack.dataset.id, 10));
        const btnExportTrack = e.target.closest('.btn-export-track'); if(btnExportTrack) { const track = window.db.tracks.find(t => t.id === parseInt(btnExportTrack.dataset.id, 10)); if (track) window.exportTrackHandoff(track); }
        const btnEditTone = e.target.closest('.btn-edit-tone'); if(btnEditTone) { const tone = window.db.tones.find(t => t.id === parseInt(btnEditTone.dataset.id, 10)); if(tone) { document.getElementById('tone-id').value = tone.id; document.getElementById('tone-name').value = tone.name; document.getElementById('tone-category').value = tone.category || 'CLEAN'; document.getElementById('tone-nam').value = tone.nam; document.getElementById('tone-ir').value = tone.ir; { const br=document.getElementById('tone-brand'); if(br) br.value = tone.brand || ''; } document.getElementById('tone-notes').value = tone.notes; const cb=document.getElementById('tone-starred'); if(cb) cb.checked = tone.starred || false; const t=document.getElementById('tone-form-title'); if(t) t.innerText = 'EDIT TONE COMBO'; window.tempToneImages = tone.images ? [...tone.images] : []; window.renderImagePreviews('tone-image-preview-container', window.tempToneImages, 'tone'); window.tempToneAudio = null; window.renderAudioPreview('tone-audio-preview-container', null); document.getElementById('form-tone')?.classList.remove('hidden'); setTimeout(() => { document.getElementById('form-tone')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); if (tone.hasAudio) { window.audioDbGet(tone.id).then((b64) => { if (b64 && document.getElementById('tone-id').value == tone.id) { window.tempToneAudio = b64; window.renderAudioPreview('tone-audio-preview-container', b64); } }); } } }
        const btnDelTone = e.target.closest('.btn-del-tone'); if(btnDelTone && confirm("Delete this tone?")) { const delId = parseInt(btnDelTone.dataset.id, 10); window.db.tones = window.db.tones.filter(t => t.id !== delId); window.saveData(); window.audioDbDelete(delId).then(() => window.scheduleAudioDriveSync()); window.renderTones(); window.renderStarredTones(); }
        const btnCloneCb = e.target.closest('.btn-clone-cookbook'); if(btnCloneCb) window.cloneCookbook(parseInt(btnCloneCb.dataset.id, 10)); 
        const btnPrintCb = e.target.closest('.btn-print-cookbook'); if(btnPrintCb) { const recipe = window.db.cookbook.find(r => r.id === parseInt(btnPrintCb.dataset.id, 10)); if (recipe) window.printRecipeSheet(recipe); }
        const btnHistoryCb = e.target.closest('.btn-history-cookbook'); if(btnHistoryCb) { const recipe = window.db.cookbook.find(r => r.id === parseInt(btnHistoryCb.dataset.id, 10)); if (recipe) window.openHistoryModal(recipe); }
        const btnEditLink = e.target.closest('.btn-edit-link'); if(btnEditLink) { const link = window.db.links.find(l => l.id === parseInt(btnEditLink.dataset.id, 10)); if(link) { document.getElementById('link-id').value = link.id; document.getElementById('link-title').value = link.title; document.getElementById('link-url').value = link.url; document.getElementById('link-category').value = link.category; document.getElementById('link-notes').value = link.notes; const t=document.getElementById('link-form-title'); if(t) t.innerText = 'EDIT TOOL LINK'; document.getElementById('form-link')?.classList.remove('hidden'); setTimeout(() => { document.getElementById('form-link')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); } }
        const btnDelLink = e.target.closest('.btn-del-link'); if(btnDelLink && confirm("Delete this link?")) { window.db.links = window.db.links.filter(l => l.id !== parseInt(btnDelLink.dataset.id, 10)); window.saveData(); window.renderLinks(); }
        const btnTagLink = e.target.closest('.btn-tag-link'); if(btnTagLink) window.setLinkTag(btnTagLink.dataset.tag);
        const btnTagTone = e.target.closest('.btn-tag-tone'); if(btnTagTone) window.setToneTag(btnTagTone.dataset.tag);
        const btnTagScript = e.target.closest('.btn-tag-script'); if(btnTagScript) window.setScriptTag(btnTagScript.dataset.tag);
        const btnPlayToneAudio = e.target.closest('.btn-play-tone-audio'); if (btnPlayToneAudio) window.playToneAudio(parseInt(btnPlayToneAudio.dataset.toneAudio, 10), btnPlayToneAudio);
    });

    window.playToneAudio = async (id, btn) => {
        const slot = document.getElementById(`tone-audio-slot-${id}`); if (!slot) return;
        if (slot.dataset.loaded === '1') { slot.classList.toggle('hidden'); return; }
        const origLabel = btn.innerText; btn.innerText = 'LOADING...';
        const b64 = await window.audioDbGet(id);
        if (b64) { slot.innerHTML = `<audio controls autoplay src="${b64}" class="w-full h-8"></audio>`; slot.dataset.loaded = '1'; }
        else { slot.innerHTML = `<div class="text-[9px] text-[#FF8888] italic">Clip not found on this device — connect Google Drive to sync it back down.</div>`; }
        btn.innerText = origLabel;
    };

    window.renderLinks = () => { const list = document.getElementById('link-list'); const sInput = document.getElementById('search-link'); const search = sInput ? sInput.value.toLowerCase() : ''; if(!list) return; let filtered = [...window.db.links]; const allCats = [...new Set(filtered.map(l => l.category))].sort(); window.renderTagBarGeneric('link-tag-bar', allCats, window.currentLinkTag, window.linkCategoryColor, window.setLinkTag); if (window.currentLinkTag !== 'ALL') filtered = filtered.filter(l => l.category === window.currentLinkTag); if (search) filtered = filtered.filter(l => l.title.toLowerCase().includes(search) || l.url.toLowerCase().includes(search) || l.notes.toLowerCase().includes(search) || l.category.toLowerCase().includes(search)); list.innerHTML = ''; if (filtered.length === 0) { list.innerHTML = `<div class="col-span-full text-center text-[#E2E8F0]/30 text-[11px] italic p-8 border border-dashed border-[#00E5FF20] rounded">No tools match this tag/search.</div>`; return; } filtered.forEach(l => { const pc = window.linkCategoryColor(l.category); list.innerHTML += `<div class="card relative group bg-[rgba(5,8,7,0.8)] border-[#00E5FF30] flex flex-col h-full"><div class="absolute top-3 right-3 flex opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 gap-3 z-20"><button data-id="${l.id}" class="btn-edit-link text-[10px] font-bold text-[#00E5FF] hover:text-white">EDIT</button><button data-id="${l.id}" class="btn-del-link text-[10px] font-bold text-[#FF8888] hover:text-white">DEL</button></div><div class="flex items-center gap-2 mb-2 pr-16"><button data-tag="${l.category}" class="btn-tag-link text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border truncate cursor-pointer transition-all hover:brightness-125" style="color:${pc}; border-color:${pc}40; background:${pc}0A;" title="Filter by ${l.category}">${l.category}</button></div><h4 class="font-bold text-[14px] text-white mb-2 truncate" title="${window.escapeHtml(l.title)}">${window.escapeHtml(l.title)}</h4><p class="text-[11px] text-[#A7DCC3]/80 leading-relaxed font-mono flex-1 mb-4">${window.escapeHtml(l.notes)}</p><a href="${window.escapeHtml(l.url)}" target="_blank" rel="noopener" class="mt-auto text-center block w-full px-3 py-2 rounded bg-[rgba(0,229,255,0.08)] border border-[#00E5FF30] text-[#00E5FF] hover:bg-[#00E5FF20] transition-colors text-[10px] tracking-widest font-bold">LAUNCH TOOL ↗</a></div>`; }); };
    
    window.getImagesHtml = (imagesArray, colorClass, type, id) => { if (!imagesArray || imagesArray.length === 0) return ''; let html = `<div class="mt-4 p-3 bg-black/40 rounded border border-[${colorClass}20]"><div class="text-[9px] text-[${colorClass}]/70 tracking-widest mb-3 font-bold uppercase flex items-center gap-2">Signal Chain / Plugin Flow</div><div class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide cursor-pointer group" onclick="window.openModalGallery('${type}', ${id})">`; imagesArray.forEach((imgB64, i) => { html += `<img src="${imgB64}" class="w-20 h-20 object-cover border border-[${colorClass}40] rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] group-hover:border-[${colorClass}] transition-colors">`; if (i < imagesArray.length - 1) html += `<span class="text-[${colorClass}]/50 font-bold text-[18px] shrink-0">→</span>`; }); html += `</div></div>`; return html; };

    window.exportTrackHandoff = (track) => {
        const imagesHtml = (track.images || []).map((b64) => `<img src="${b64}" style="max-width:100%;border-radius:6px;margin:8px 0;border:1px solid #333;">`).join('');
        const embedHtml = track.reflink ? `<p style="margin-top:16px;"><a href="${track.reflink}" style="color:#00E5FF;">Reference: ${track.reflink}</a></p>` : '';
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${track.inst} — Session Handoff</title>
<style>body{background:#0a0f0d;color:#e2e8f0;font-family:'Courier New',monospace;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.6;}
h1{color:#00FF88;font-size:20px;letter-spacing:0.05em;}
.meta{color:#7AFFBF99;font-size:12px;margin-bottom:24px;}
h2{color:#00E5FF;font-size:13px;border-bottom:1px solid #333;padding-bottom:6px;margin-top:28px;}
p{font-size:13px;white-space:pre-wrap;}
.chain{background:#000;padding:12px;border-radius:6px;border:1px solid #222;font-size:12px;}</style></head>
<body>
<h1>${track.inst}</h1>
<div class="meta">Exported from EUTERPE_OS on ${new Date().toLocaleDateString()}</div>
<h2>FX CHAIN</h2>
<div class="chain">${track.plugins || 'None listed'}</div>
<h2>NOTES</h2>
<p>${track.notes || '(none)'}</p>
${embedHtml}
${imagesHtml ? `<h2>SCREENSHOTS</h2>${imagesHtml}` : ''}
</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${(track.inst || 'track').replace(/[^a-z0-9]/gi, '_')}_handoff.html`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    window.getEmbedHtml = (url) => {
        if (!url) return '';
        try {
            const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
            if (ytMatch) return `<div class="mt-3 rounded overflow-hidden border border-white/10"><iframe width="100%" height="160" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
            const spMatch = url.match(/open\.spotify\.com\/(track|album|playlist|artist)\/([\w]+)/);
            if (spMatch) return `<div class="mt-3 rounded overflow-hidden"><iframe style="border-radius:8px" src="https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`;
        } catch (e) {}
        return `<a href="${url}" target="_blank" rel="noopener" class="mt-3 inline-block text-[10px] font-bold text-[#00E5FF] hover:underline">🔗 Reference link ↗</a>`;
    };

    window.renderTracks = () => { const list = document.getElementById('track-list'); if(!list) return; list.innerHTML = ''; const filtered = window.db.tracks; filtered.forEach(t => { const c = '#00FF88'; list.innerHTML += `<div class="card relative group bg-[rgba(5,8,7,0.8)]" style="border-color: ${c}30;"><div class="absolute top-3 right-3 flex opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 gap-3 z-20"><button data-id="${t.id}" class="btn-edit-track text-[10px] font-bold hover:text-white" style="color: ${c}">EDIT</button><button data-id="${t.id}" class="btn-clone-track text-[10px] font-bold text-[#FFD60A] hover:text-white">CLONE</button><button data-id="${t.id}" class="btn-export-track text-[10px] font-bold text-[#FF88FF] hover:text-white">📤 EXPORT</button><button data-id="${t.id}" class="btn-del-track text-[10px] font-bold text-[#FF8888] hover:text-white">DEL</button></div><div class="flex items-center gap-2 mb-2"><h4 class="font-bold text-[14px]" style="color: ${c};">${window.escapeHtml(t.inst)}</h4></div><p class="text-[11px] text-[#A7DCC3]/50 mb-3 font-mono border-b pb-2" style="border-color: ${c}20;"><span class="text-white/40">CHAIN:</span> ${window.escapeHtml(t.plugins || 'None')}</p><p class="text-[11px] text-[#E2E8F0]/80 leading-relaxed whitespace-pre-wrap font-mono">${window.escapeHtml(t.notes)}</p>${window.getEmbedHtml(t.reflink)}${window.getImagesHtml(t.images, c, 'tracks', t.id)}</div>`; }); };
    // Rig visual: one amp head sitting on a 4x12 cab, driven by whichever tone is
    // selected in the dropdown (or clicked from the STAGES ladder). Head trim/nameplate
    // = brand color, cab trim/nameplate = gain-stage color, so the graphic itself carries
    // the same color coding the old cards used.
    const rigTrunc = (s, n) => { s = s || ''; return s.length > n ? s.slice(0, n - 1) + '…' : (s || '—'); };
    // Scale the nameplate font down as the string gets longer, and let it wrap —
    // NAM/IR names vary wildly in length so a fixed size either clips short names or overflows long ones.
    const rigFitFont = (s, min, max) => Math.max(min, Math.min(max, 150 / Math.max((s || '—').length, 8)));
    const rigPlate = (label, value, color) => `<div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:monospace;color:${color};line-height:1.18;overflow:hidden;padding:0 3px;box-sizing:border-box;">
        <div style="font-size:7px;letter-spacing:2px;opacity:0.6;font-weight:bold;flex-shrink:0;">${label}</div>
        <div style="font-size:${rigFitFont(value, 6.5, 12)}px;font-weight:bold;word-break:break-word;overflow-wrap:anywhere;">${value}</div>
    </div>`;
    window.renderRigSVG = (t, brandColor, stageColor) => {
        const nam = window.escapeHtml(rigTrunc(t.nam, 60));
        const ir = window.escapeHtml(rigTrunc(t.ir, 60));
        return `<svg viewBox="0 0 440 500" class="w-full h-auto select-none" style="filter:drop-shadow(0 8px 20px rgba(0,0,0,0.55));">
            <defs>
                <pattern id="rig-weave" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#0a0f0d"/><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.05)" stroke-width="2"/></pattern>
                <radialGradient id="rig-cone" cx="35%" cy="32%" r="72%"><stop offset="0%" stop-color="#3c4341"/><stop offset="65%" stop-color="#111614"/><stop offset="100%" stop-color="#040605"/></radialGradient>
            </defs>
            <!-- head -->
            <rect x="60" y="20" width="320" height="120" rx="12" fill="#0a0f0d" stroke="${brandColor}66" stroke-width="2"/>
            <rect x="68" y="30" width="88" height="100" rx="4" fill="#0c1110" stroke="${brandColor}33" stroke-width="1"/>
            <rect x="284" y="30" width="88" height="100" rx="4" fill="#0c1110" stroke="${brandColor}33" stroke-width="1"/>
            <rect x="160" y="30" width="120" height="100" rx="4" fill="#050807" stroke="${brandColor}40" stroke-width="1"/>
            ${[1,2,3,4,5].map(i => `<circle cx="${160 + i*20}" cy="50" r="7" fill="#121815" stroke="${brandColor}55" stroke-width="1"/><line x1="${160 + i*20}" y1="50" x2="${160 + i*20 + 5}" y2="45" stroke="${brandColor}80" stroke-width="1.5"/>`).join('')}
            <foreignObject x="164" y="62" width="112" height="60">${rigPlate('NAM', nam, brandColor)}</foreignObject>
            <circle cx="350" cy="118" r="5" fill="${stageColor}" opacity="0.9"><animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite"/></circle>
            <!-- cab -->
            <rect x="50" y="130" width="340" height="340" rx="14" fill="#0a0f0d" stroke="${stageColor}55" stroke-width="2"/>
            <rect x="66" y="146" width="308" height="280" rx="8" fill="url(#rig-weave)" stroke="${stageColor}26" stroke-width="1"/>
            ${[[143,216],[297,216],[143,356],[297,356]].map(([cx,cy]) => `<circle cx="${cx}" cy="${cy}" r="54" fill="#040605" stroke="${stageColor}40" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="44" fill="url(#rig-cone)"/><circle cx="${cx}" cy="${cy}" r="9" fill="#1a1f1c" stroke="${stageColor}30" stroke-width="1"/>`).join('')}
            <rect x="100" y="434" width="240" height="30" rx="4" fill="#050807" stroke="${stageColor}40" stroke-width="1"/>
            <foreignObject x="104" y="436" width="232" height="26">${rigPlate('CAB / IR', ir, stageColor)}</foreignObject>
        </svg>`;
    };
    window.renderTones = () => {
        const list = document.getElementById('tone-list'); const sInput = document.getElementById('search-tone');
        const search = sInput ? sInput.value.toLowerCase() : ''; if (!list) return;
        let filtered = [...window.db.tones];
        const allBrands = [...new Set(filtered.map(t => t.brand).filter(Boolean))].sort();
        window.renderTagBarGeneric('tone-tag-bar', allBrands, window.currentToneTag, window.toneBrandColor, window.setToneTag);
        if (window.currentToneTag !== 'ALL') filtered = filtered.filter(t => t.brand === window.currentToneTag);
        if (search) filtered = filtered.filter(t => t.name.toLowerCase().includes(search) || t.nam.toLowerCase().includes(search) || t.ir.toLowerCase().includes(search) || t.notes.toLowerCase().includes(search) || (t.brand || '').toLowerCase().includes(search));
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        list.innerHTML = '';
        if (filtered.length === 0) { list.innerHTML = `<div class="text-center text-[#E2E8F0]/30 text-[11px] italic p-8 border border-dashed border-[#00E5FF20] rounded">No tones match this tag/search.</div>`; return; }
        if (!window.currentRigToneId || !filtered.some(t => t.id === window.currentRigToneId)) window.currentRigToneId = filtered[0].id;
        const t = filtered.find(x => x.id === window.currentRigToneId);
        const c = '#00FF88'; const stageColor = window.toneCategoryColor(t.category); const brandColor = window.toneBrandColor(t.brand);
        const options = filtered.map(x => `<option value="${x.id}" ${x.id === t.id ? 'selected' : ''}>${window.escapeHtml(x.name)}${x.brand ? ' — ' + window.escapeHtml(x.brand) : ''} [${x.category}]</option>`).join('');
        list.innerHTML = `<div class="card relative bg-[rgba(5,8,7,0.8)]" data-tone-id="${t.id}" title="Double-tap the rig to pin/unpin" style="border-color: ${c}30;">
            <div class="flex items-center gap-2 mb-4 flex-wrap">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border" style="color:${stageColor}; border-color:${stageColor}40; background:${stageColor}0A;" title="Gain stage">${t.category}</span>
                ${t.brand ? `<button data-tag="${window.escapeHtml(t.brand)}" class="btn-tag-tone text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border cursor-pointer transition-all hover:brightness-125" style="color:${brandColor}; border-color:${brandColor}40; background:${brandColor}0A;" title="Filter by ${window.escapeHtml(t.brand)}">${window.escapeHtml(t.brand)}</button>` : ''}
                ${t.starred ? '<span class="text-[10px] text-[#00E5FF]" title="Pinned to Front Page">★</span>' : ''}
                <select id="tone-rig-select" class="input-euterpe ml-auto !w-auto min-w-[220px] !text-[11px]" title="Load a preset into the rig">${options}</select>
            </div>
            <div class="mx-auto" style="max-width:480px;">
                ${window.renderRigSVG(t, brandColor, stageColor)}
            </div>
            <h4 class="font-bold text-[15px] text-center mt-3" style="color: ${c};">${window.escapeHtml(t.name)}</h4>
            <p class="text-[11px] text-[#A7DCC3]/80 leading-relaxed whitespace-pre-wrap font-mono mt-2">${window.escapeHtml(t.notes)}</p>
            ${window.getImagesHtml(t.images, c, 'tones', t.id)}
            ${t.hasAudio ? `<div class="mt-3"><button data-tone-audio="${t.id}" class="btn-play-tone-audio text-[9px] font-bold px-2 py-1 rounded border border-[#00E5FF40] text-[#00E5FF] hover:bg-[#00E5FF]/10 uppercase tracking-widest cursor-pointer">🔊 Play Reference</button><div id="tone-audio-slot-${t.id}" class="mt-2"></div></div>` : ''}
            <div class="flex justify-end gap-3 mt-4 pt-3 border-t" style="border-color:${c}14;">
                <button data-id="${t.id}" class="btn-edit-tone text-[10px] font-bold hover:text-white" style="color: ${c}">EDIT</button>
                <button data-id="${t.id}" class="btn-clone-tone text-[10px] font-bold text-[#FFD60A] hover:text-white">CLONE</button>
                <button data-id="${t.id}" class="btn-tone-chain text-[10px] font-bold text-[#7FA8D9] hover:text-white" title="Visualize signal chain">🔗</button>
                <button data-id="${t.id}" class="btn-export-tone text-[10px] font-bold text-[#FF88FF] hover:text-white" title="Export / share this tone">📤</button>
                <button data-id="${t.id}" class="btn-del-tone text-[10px] font-bold text-[#FF8888] hover:text-white">DEL</button>
            </div>
        </div>`;
        document.getElementById('tone-rig-select')?.addEventListener('change', (e) => { window.currentRigToneId = parseInt(e.target.value, 10); window.renderTones(); });
    };
    window.renderStarredTones = () => { const list = document.getElementById('starred-tones-list'); if(!list) return; list.innerHTML = ''; const starred = window.db.tones.filter(t => t.starred).slice(0, 10); if (starred.length === 0) { list.innerHTML = `<div class="col-span-full text-center text-[#E2E8F0]/30 text-[11px] italic p-8 border border-dashed border-[#00FF8820] rounded">No Pinned Tones. Go to Tone DB [Tags] and click [★] to pin up to 10 favorites here.</div>`; return; } starred.forEach(t => { const catColor = window.toneCategoryColor(t.category); const catBg = catColor; list.innerHTML += `<div class="card border-[${catColor}30]"><div class="flex items-center gap-2 mb-1"><h4 class="font-bold text-[12px] tracking-wider truncate" style="color: ${catColor};">${window.escapeHtml(t.name.toUpperCase())}</h4></div><p class="text-[10px] tracking-widest text-[#E2E8F0]/50 mb-3 pb-2 border-b flex justify-between items-center" style="border-color: ${catColor}14;"><span class="truncate pr-2">${window.escapeHtml(t.nam)} + ${window.escapeHtml(t.ir)}</span><span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color: ${catBg};"></span></p><p class="text-[11px] text-[#A7DCC3]/80 leading-relaxed font-mono whitespace-pre-wrap">${window.escapeHtml(t.notes)}</p></div>`; }); };

    // Gesture: double-tap a tone card to instantly pin/unpin it (no need to open the edit form).
    window.toggleToneStar = (id) => {
        const tone = window.db.tones.find((t) => t.id === id); if (!tone) return;
        if (!tone.starred && window.db.tones.filter((t) => t.starred).length >= 10) { alert('You already have 10 Pinned Tones. Unpin an old tone first.'); return; }
        tone.starred = !tone.starred;
        window.saveData(); window.renderTones(); window.renderStarredTones();
    };
    (() => {
        let lastTapTime = 0, lastTapId = null;
        document.getElementById('tone-list')?.addEventListener('click', (e) => {
            const card = e.target.closest('[data-tone-id]'); if (!card || e.target.closest('button')) return;
            const id = parseInt(card.dataset.toneId, 10);
            const now = Date.now();
            if (id === lastTapId && now - lastTapTime < 350) { window.toggleToneStar(id); lastTapTime = 0; lastTapId = null; }
            else { lastTapTime = now; lastTapId = id; }
        });
    })();

    window.cloneCookbook = (id) => {
    const orig = window.db.cookbook.find(r => r.id === id); if(!orig) return;
    const clone = JSON.parse(JSON.stringify(orig)); clone.id = Date.now(); clone.inst = clone.inst + ' (Copy)';
    window.db.cookbook.push(clone); window.currentCookbookGenre = clone.genre;
    window.saveData(); window.renderCookbookMenu(); setTimeout(() => window.selectInst(clone.id), 100);
};
window.cloneTrack = (id) => {
    const orig = window.db.tracks.find(t => t.id === id); if(!orig) return;
    const clone = JSON.parse(JSON.stringify(orig)); clone.id = Date.now(); clone.inst = clone.inst + ' (Copy)';
    window.db.tracks.unshift(clone); window.saveData(); window.renderTracks();
};
window.cloneTone = (id) => {
    const orig = window.db.tones.find(t => t.id === id); if(!orig) return;
    const clone = JSON.parse(JSON.stringify(orig)); clone.id = Date.now(); clone.name = clone.name + ' (Copy)'; clone.starred = false;
    window.db.tones.unshift(clone); window.saveData(); window.renderTones(); window.renderStarredTones();
    if (orig.hasAudio) { window.audioDbGet(orig.id).then((b64) => { if (b64) { window.audioDbSet(clone.id, b64).then(() => window.scheduleAudioDriveSync()); } }); }
};
    window.renderCookbookMenu(); window.setDAW(); window.switchTab('cookbook'); window.renderNoteTabs();

    // HUD ANIMATIONS
    // Real session stopwatch — persisted across reloads, pausable via the REC/timecode control.
    const tcEl = document.getElementById('hud-timecode'); function fmt(n) { return String(n).padStart(2,'0'); }
    let sessionSaveCounter = 0; let lastLogTick = Date.now(); let badgeCounter = 0;
    setInterval(()=>{
        const ms = window.getSessionElapsedMs();
        const totalSec = Math.floor(ms/1000); const frame = Math.floor(((ms%1000)/1000)*30);
        if (tcEl) tcEl.textContent = `${fmt(Math.floor(totalSec/3600)%24)}:${fmt(Math.floor((totalSec%3600)/60))}:${fmt(totalSec%60)}:${fmt(frame)}`;
        if (window.sessionState.running) {
            const now = Date.now(); window.logSessionTime(now - lastLogTick); lastLogTick = now;
            sessionSaveCounter++; if (sessionSaveCounter >= 150) { sessionSaveCounter = 0; window.sessionState.elapsedMs = ms; window.sessionState.startedAt = Date.now(); window.saveSessionState(); }
            badgeCounter++; if (badgeCounter >= 1800) { badgeCounter = 0; window.updateAppBadge?.(window.getSessionStats?.()); window.renderSessionStats?.(); }
        } else { lastLogTick = Date.now(); }
    }, 1000/30);
    document.getElementById('btn-session-toggle')?.addEventListener('click', () => window.toggleSessionTimer());
    document.getElementById('btn-session-reset')?.addEventListener('click', (e) => { e.stopPropagation(); window.resetSessionTimer(); });
    window.updateSessionUI();
    // The old beforeunload handler rebased startedAt to "now" but left running:true, so the
    // wall-clock time the app spent closed still got added back in as elapsed on next open —
    // it never actually stopped. Pause for real here, and use the same hidden/pagehide pair as
    // the Drive flush above, since beforeunload alone doesn't fire on a swiped-away mobile PWA.
    window.pauseSessionOnExit = () => {
        if (!window.sessionState.running) return;
        window.sessionState.elapsedMs = window.getSessionElapsedMs();
        window.sessionState.running = false;
        window.sessionState.startedAt = null;
        window.saveSessionState();
        window.updateSessionUI();
    };
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') window.pauseSessionOnExit(); });
    window.addEventListener('pagehide', () => window.pauseSessionOnExit());
    window.addEventListener('beforeunload', () => window.pauseSessionOnExit());
    
    // VU meters: decorative random animation by default; toggle to drive them from real mic input.
    function rV() { return 3 + Math.pow(Math.random(), 0.7)*18; }
    const vL = document.querySelectorAll('#vuLeft .vu-bar'); const vR = document.querySelectorAll('#vuRight .vu-bar');
    window.vuLive = { active: false, ctx: null, analyser: null, buf: null, stream: null };
    setInterval(()=>{ if(window.FERRETT_QUIET || window.vuLive.active) return; vL.forEach(b=>b.style.height=rV()+'px'); vR.forEach(b=>b.style.height=rV()+'px'); }, 90);

    window.vuLiveTick = () => {
        if (!window.vuLive.active) return;
        window.vuLive.analyser.getByteTimeDomainData(window.vuLive.buf);
        let sum = 0; for (let i = 0; i < window.vuLive.buf.length; i++) { const v = (window.vuLive.buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / window.vuLive.buf.length);
        const px = Math.min(22, 3 + rms * 90);
        vL.forEach((b, i) => b.style.height = Math.max(2, px - i * 1.5 + (Math.random() * 2)) + 'px');
        vR.forEach((b, i) => b.style.height = Math.max(2, px - i * 1.5 + (Math.random() * 2)) + 'px');
        requestAnimationFrame(window.vuLiveTick);
    };

    window.startVuLive = async () => {
        try {
            window.vuLive.stream = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: false, noiseSuppression: false, echoCancellation: false } });
            window.vuLive.ctx = window.vuLive.ctx || new (window.AudioContext || window.webkitAudioContext)();
            if (window.vuLive.ctx.state === 'suspended') await window.vuLive.ctx.resume();
            const source = window.vuLive.ctx.createMediaStreamSource(window.vuLive.stream);
            window.vuLive.analyser = window.vuLive.ctx.createAnalyser(); window.vuLive.analyser.fftSize = 1024;
            window.vuLive.buf = new Uint8Array(window.vuLive.analyser.fftSize);
            source.connect(window.vuLive.analyser);
            window.vuLive.active = true;
            window.vuLiveTick();
            const btn = document.getElementById('btn-vu-live-toggle'); if (btn) { btn.classList.add('text-[#00FF88]'); btn.style.borderColor = '#00FF88'; btn.style.boxShadow = '0 0 8px #00FF8860'; }
        } catch (err) { alert('Could not access the microphone for live VU metering.'); }
    };
    window.stopVuLive = () => {
        window.vuLive.active = false;
        window.vuLive.stream?.getTracks().forEach((t) => t.stop());
        const btn = document.getElementById('btn-vu-live-toggle'); if (btn) { btn.classList.remove('text-[#00FF88]'); btn.style.borderColor = ''; btn.style.boxShadow = ''; }
    };
    document.getElementById('btn-vu-live-toggle')?.addEventListener('click', () => { window.vuLive.active ? window.stopVuLive() : window.startVuLive(); });
    
    function tG() { if(window.FERRETT_QUIET) return; document.body.classList.add('glitching-ui'); setTimeout(()=>document.body.classList.remove('glitching-ui'), 120+Math.random()*200); }
    setInterval(()=>{ if(!window.FERRETT_QUIET && Math.random()<0.1) tG(); }, 700);
    document.addEventListener('click', e=>{ if(!window.FERRETT_QUIET && (e.target.closest('.nav-btn')||e.target.closest('#genre-menu')||e.target.closest('#inst-menu')||e.target.closest('.note-tab'))) if(Math.random()<0.6) tG(); });

    const c = document.getElementById('spl-canvas');
    if(c) {
        const ctx = c.getContext('2d');
        // Real gauge: needle is driven by the actual mic reading (window.__splCal), calibrated via the CAL
        // button against a known SPL reading. No calibration yet (or mic off) = idle, dimmed needle at rest.
        function dG(val, idle) {
            ctx.clearRect(0,0,140,140); ctx.beginPath(); ctx.arc(70,70,58,0,Math.PI*2); ctx.strokeStyle='rgba(0,255,136,0.08)'; ctx.lineWidth=10; ctx.stroke();
            const sA=-Math.PI*0.78, range=Math.PI*1.56;
            for(let i=0;i<120;i++) {
                let t=i/120, col=(window.FERRETT_QUIET||idle)?'rgba(226,232,240,0.1)':(t<0.45?`rgba(0,255,136,${0.6+t*0.4})`:(t<0.68?`rgba(0,229,255,0.75)`:(t<0.85?`rgba(255,214,10,0.85)`:`rgba(255,68,68,0.9)`)));
                ctx.beginPath(); ctx.arc(70,70,58,sA+t*range,sA+((i+1)/120)*range); ctx.strokeStyle=col; ctx.lineWidth=10; ctx.lineCap='round'; ctx.stroke();
            }
            ctx.save(); ctx.translate(70,70);
            for(let i=0;i<=10;i++) {
                ctx.rotate(sA+(i/10)*range); ctx.beginPath(); ctx.moveTo(0,-52); ctx.lineTo(0,-46); ctx.strokeStyle=window.FERRETT_QUIET?'rgba(255,255,255,0.05)':(i%2?'rgba(255,255,255,0.18)':'rgba(0,255,136,0.45)'); ctx.lineWidth=i%5===0?1.5:1; ctx.stroke(); ctx.rotate(-(sA+(i/10)*range));
            }
            ctx.restore();
            const nA = sA + Math.min(1,Math.max(0,(val-60)/45))*range;
            ctx.save(); ctx.translate(70,70); ctx.rotate(nA);
            ctx.beginPath(); ctx.moveTo(0,6); ctx.lineTo(0,-50); ctx.strokeStyle=(window.FERRETT_QUIET||idle)?'#64748b':'#E6FFF4'; ctx.lineWidth=2; ctx.shadowColor=(window.FERRETT_QUIET||idle)?'transparent':'#00FF88'; ctx.shadowBlur=(window.FERRETT_QUIET||idle)?0:10; ctx.stroke();
            ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fillStyle='#050807'; ctx.fill(); ctx.strokeStyle=(window.FERRETT_QUIET||idle)?'#64748b':'#00FF88'; ctx.lineWidth=1.2; ctx.stroke();
            ctx.restore();
            ctx.beginPath(); ctx.arc(70,70,2.2,0,Math.PI*2); ctx.fillStyle=(window.FERRETT_QUIET||idle)?'#64748b':'#00FF88'; ctx.shadowColor=(window.FERRETT_QUIET||idle)?'transparent':'#00FF88'; ctx.shadowBlur=(window.FERRETT_QUIET||idle)?0:8; ctx.fill();
        }
        function l() {
            const cal=window.__splCal;
            const live = !window.FERRETT_QUIET && cal && cal.offset!=null && window.vuLive?.active && cal.cur!=null;
            const val = live ? Math.max(60,Math.min(105,cal.cur+cal.offset)) : 60;
            dG(val, !live);
            const ve=document.getElementById('spl-value'), b=document.getElementById('spl-bar');
            if(ve) ve.textContent = live ? val.toFixed(1) : '—';
            if(b) b.style.width = live ? ((val-60)/45*100).toFixed(1)+'%' : '0%';
            requestAnimationFrame(l);
        }
        l();
    }
    setInterval(()=>{ if(!window.FERRETT_QUIET) document.querySelectorAll('.bracket').forEach(b=>b.style.opacity=(0.45+Math.random()*0.55).toFixed(2)); }, 1200);
// =========================================================================
// THE SCRIPT ARSENAL MODULE PATCH
// =========================================================================

const RAW_BASE = "https://raw.githubusercontent.com/zsahs84/ferrett-audio-tools/main/";
const defaultScripts = [
    { id: 401, title: "Split-Audio.lua", category: "AI STEM & MIDI", shortcut: "Ctrl+Shift+U", func: "Triggers the UVR extraction pipeline from REAPER: writes a temp .command file next to auto_uvr.py and opens it in Terminal for a visible progress log.", url: RAW_BASE + "Split-Audio.lua" },
    { id: 402, title: "auto_uvr.py", category: "AI STEM & MIDI", shortcut: "Auto", func: "The separation engine. GUI picker for Vocals-only / Instrumental+Drums / Full pipeline. BS-Roformer vocals, MDX-Net instrumental, Demucs 6-stem split, MDX23C drum-piece separation, DeEcho-DeReverb cleanup - chained automatically, writes to Stems/UVR/.", url: RAW_BASE + "auto_uvr.py" },
    { id: 403, title: "Fadr_MIDI_Extract_v6_LastUsed.lua", category: "AI STEM & MIDI", shortcut: "Ctrl+Shift+F", func: "Auto-glues the selection, uploads to Fadr's cloud API, polls for MIDI extraction, and loads the result into a VSTi you pick from a custom GUI menu (Kontakt, Vital, Surge XT, NAM, etc).", url: RAW_BASE + "Lua/Pipeline_UVR_Fadr/Fadr_MIDI_Extract_v6_LastUsed.lua" },
    { id: 404, title: "Fadr_Chord_Mapper.lua", category: "AI STEM & MIDI", shortcut: "Alt+C", func: "Finds a Fadr chord-detection CSV near the selected audio, parses ~25 chord qualities, and writes exact time-anchored MIDI chords + markers to a dedicated muted 'Chords/Textures' track.", url: RAW_BASE + "Lua/Pipeline_UVR_Fadr/Fadr_Chord_Mapper.lua" },
    { id: 405, title: "fadr_cloud.py", category: "AI STEM & MIDI", shortcut: "Auto", func: "Backend for Fadr MIDI extraction: S3 upload, task polling, downloading the resulting MIDI. Called by Fadr_MIDI_Extract_v6_LastUsed.lua, not run directly.", url: RAW_BASE + "fadr_cloud.py" },
    { id: 406, title: "Ferrett_FadrPlus_Organizer.lua", category: "AI STEM & MIDI", shortcut: "Action List", func: "Creates 5 empty tracks (fadr_drums/bass/keys/vocals/other) for manually dragging in a Fadr+ stem export.", url: RAW_BASE + "Lua/Pipeline_UVR_Fadr/Ferrett_FadrPlus_Organizer.lua" },
    { id: 407, title: "Ferrett_GoogleFlow_Importer.lua", category: "AI STEM & MIDI", shortcut: "Action List", func: "Imports a Google Flow AI-generated song and builds a 4-track triage folder (Flow Stems / Rerecord / MIDI Replace / Keep Audio) to sort the AI output into.", url: RAW_BASE + "Lua/Pipeline_UVR_Fadr/Ferrett_GoogleFlow_Importer.lua" },

    { id: 410, title: "Autoproject_setup_master.lua", category: "PROJECT BUILDER", shortcut: "Ctrl+Shift+A", func: "Recursively scans the song folder for every UVR/Fadr stem, builds the full routed session (vox/synth/bass/guitar/drum buses + FX chains), mutes the original master, archives unmatched Fadr stems.", url: RAW_BASE + "Lua/Project_Setup/Autoproject_setup_master.lua" },
    { id: 411, title: "BeatBlocks.lua", category: "PROJECT BUILDER", shortcut: "Action List", func: "Takes a time-selected 4/8-bar loop and duplicates it into a full arrangement (Intro-Verse-Hook-Verse-Hook-Outro) with color-coded region markers, muting drums in the intro/outro for a beat-drop.", url: RAW_BASE + "Lua/Project_Setup/BeatBlocks.lua" },
    { id: 412, title: "Ferrett_Arrangement_Template.lua", category: "PROJECT BUILDER", shortcut: "Action List", func: "Sets project tempo to 86 BPM and drops markers for a fixed basement hip-hop structure. Markers only, no audio - lays out an empty map before tracking.", url: RAW_BASE + "Lua/Project_Setup/Ferrett_Arrangement_Template.lua" },
    { id: 413, title: "Ferrett_Bass_Bus_Builder.lua", category: "PROJECT BUILDER", shortcut: "Action List", func: "5-string bass bus chain: tuner, SVT-VR, dynamic EQ sidechained to the kick, 1176, sub-harmonic drive, high-pass.", url: RAW_BASE + "Lua/Bus_Builders/Ferrett_Bass_Bus_Builder.lua" },
    { id: 414, title: "Ferrett_Drum_Bus_Builder.lua", category: "PROJECT BUILDER", shortcut: "Action List", func: "Drum bus chain: transient shaper, tape saturation, bus compression, clipper.", url: RAW_BASE + "Lua/Bus_Builders/Ferrett_Drum_Bus_Builder.lua" },
    { id: 415, title: "Ferrett_Synth_Stack_Builder.lua", category: "PROJECT BUILDER", shortcut: "Action List", func: "Builds a 5-layer synth chorus stack (Sub/Body/Air/Movement/Glue) inside a folder track with bus glue.", url: RAW_BASE + "Lua/Bus_Builders/Ferrett_Synth_Stack_Builder.lua" },

    { id: 420, title: "VocalBooth.lua", category: "VOCAL CHAIN", shortcut: "Action List", func: "One-key full vocal SESSION builder: armed/monitoring Lead Vox with a starter chain, panned Double L/R tracks, an Adlib track, and Verb/Delay send buses grouped into a VOCALS folder.", url: RAW_BASE + "Lua/Vocal_Chains/VocalBooth.lua" },
    { id: 421, title: "Flow_Vocal_Pro_v2.lua", category: "VOCAL CHAIN", shortcut: "Ctrl+Shift+V", func: "Cheap-mic/bad-room fix chain: EQ correction, dynamic EQ, compression, de-essing, saturation, pitch correction, parallel width.", url: RAW_BASE + "Lua/Vocal_Chains/Flow_Vocal_Pro_v2.lua" },
    { id: 422, title: "Ferrett_Vocal_Chain_Chorus.lua", category: "VOCAL CHAIN", shortcut: "Action List", func: "Melodic-chorus-wide vocal chain for a produced room/good mic.", url: RAW_BASE + "Lua/Vocal_Chains/Ferrett_Vocal_Chain_Chorus.lua" },
    { id: 423, title: "Ferrett_Vocal_Chain_Rap.lua", category: "VOCAL CHAIN", shortcut: "Action List", func: "Percussive-rap-tight vocal chain for a produced room/good mic.", url: RAW_BASE + "Lua/Vocal_Chains/Ferrett_Vocal_Chain_Rap.lua" },
    { id: 424, title: "Ferrett_Vocal_Blues_Grit.lua", category: "VOCAL CHAIN", shortcut: "Action List", func: "Sung blues-chorus chain: drive, compression, saturation, room reverb, hall reverb, de-ess.", url: RAW_BASE + "Lua/Vocal_Chains/Ferrett_Vocal_Blues_Grit.lua" },
    { id: 425, title: "Ferrett_Owned_Comp_Rap.lua", category: "VOCAL CHAIN", shortcut: "Action List", func: "Compression-only module for a rap vocal chain, built strictly from owned gear.", url: RAW_BASE + "Lua/Vocal_Chains/Ferrett_Owned_Comp_Rap.lua" },
    { id: 426, title: "Ferrett_Owned_EQ_RapVox.lua", category: "VOCAL CHAIN", shortcut: "Action List", func: "EQ-only module for a rap vocal chain, built strictly from owned gear.", url: RAW_BASE + "Lua/Vocal_Chains/Ferrett_Owned_EQ_RapVox.lua" },

    { id: 430, title: "Ferrett_GhostNote_Purge.lua", category: "POCKET & MIDI", shortcut: "Action List", func: "Bulk-deletes AI-hallucinated MIDI notes shorter than 1/32nd.", url: RAW_BASE + "Lua/MIDI_Cleanup/Ferrett_GhostNote_Purge.lua" },
    { id: 431, title: "Ferrett_Legato_Fix.lua", category: "POCKET & MIDI", shortcut: "Action List", func: "Forces a small gap between overlapping notes so monophonic synths actually retrigger.", url: RAW_BASE + "Lua/MIDI_Cleanup/Ferrett_Legato_Fix.lua" },
    { id: 432, title: "Ferrett_CC_Cleanup.lua", category: "POCKET & MIDI", shortcut: "Action List", func: "Deletes hallucinated pitch-bend and mod-wheel CC1 data.", url: RAW_BASE + "Lua/MIDI_Cleanup/Ferrett_CC_Cleanup.lua" },
    { id: 433, title: "Ferrett_Bass_Range_Fix.lua", category: "POCKET & MIDI", shortcut: "Action List", func: "Moves notes below E1 up an octave and protects the keyswitch zone.", url: RAW_BASE + "Lua/MIDI_Cleanup/Ferrett_Bass_Range_Fix.lua" },
    { id: 434, title: "Ferrett_Velocity_Stalk_Fix.lua", category: "POCKET & MIDI", shortcut: "Action List", func: "Detects flat AI-printed velocity (>80% identical) and rebuilds musical dynamics with downbeat emphasis.", url: RAW_BASE + "Lua/MIDI_Cleanup/Ferrett_Velocity_Stalk_Fix.lua" },
    { id: 435, title: "Ferrett_Drum_Humanize_Pocket.lua", category: "POCKET & MIDI", shortcut: "Action List", func: "Humanizes timing/velocity, keeps kick/snare tight and ghosts loose, nudges drums 4 ticks late for pocket.", url: RAW_BASE + "Lua/MIDI_Cleanup/Ferrett_Drum_Humanize_Pocket.lua" },
    { id: 436, title: "Ferrett_Basement_Clean_Macro.lua", category: "POCKET & MIDI", shortcut: "Action List", func: "One-click chain of Ghost Purge + Legato Fix + CC Cleanup + Bass Range Fix + Velocity Stalk Fix.", url: RAW_BASE + "Lua/MIDI_Cleanup/Ferrett_Basement_Clean_Macro.lua" },

    { id: 440, title: "Load_Mega_Tone_Menu.lua", category: "INTERFACE & TONES", shortcut: "Ctrl+T", func: "Reads a real preset database (presets.txt), builds a nested right-click tone menu, loads Gateway + a standard mix chain + the preset's FX. Validates malformed/duplicate rows on load.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Load_Mega_Tone_Menu.lua" },
    { id: 441, title: "Ferrett_Gateway_Bass_5String_Pocket.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "5-string bass tone via Gateway (loads real NAM captures + IR together). Owned/Gateway is a deliberate pair, not a duplicate - pick Gateway for the captured amp tone.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Gateway_Bass_5String_Pocket.lua" },
    { id: 442, title: "Ferrett_Owned_Bass_5String_Pocket.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "5-string bass tone via the owned Ampeg SVTVR Classic plugin + ReaVerb IR directly - zero-latency tracking alternative to the Gateway/NAM version.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Owned_Bass_5String_Pocket.lua" },
    { id: 443, title: "Ferrett_Gateway_Guitar_Blues_Edge.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "Blues-edge guitar tone via Gateway (real NAM capture + IR).", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Gateway_Guitar_Blues_Edge.lua" },
    { id: 444, title: "Ferrett_Owned_Guitar_Blues_Edge.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "Blues-edge guitar tone via owned amp-sim plugins - zero-latency alternative to the Gateway version.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Owned_Guitar_Blues_Edge.lua" },
    { id: 445, title: "Ferrett_Gateway_Guitar_Distorted_Rhythm_Wall.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "Distorted rhythm wall guitar tone via Gateway, with quad tracking (2 tracks, hard-panned L/R) built in.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Gateway_Guitar_Distorted_Rhythm_Wall.lua" },
    { id: 446, title: "Ferrett_Owned_Guitar_Distorted_Wall.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "Distorted rhythm wall guitar tone via owned amp-sim plugins, quad tracking built in.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Owned_Guitar_Distorted_Wall.lua" },
    { id: 447, title: "Ferrett_Gateway_Guitar_PalmMute_Harmony.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "Palm-mute harmony guitar tone via Gateway, locked to sit under the bass.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Gateway_Guitar_PalmMute_Harmony.lua" },
    { id: 448, title: "Ferrett_Gateway_ToneMatrix_150_Owned.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "150 tone pairings built from your actual owned NAM captures and IR collection, loaded via Gateway.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Gateway_ToneMatrix_150_Owned.lua" },
    { id: 449, title: "Ferrett_ToneMatrix_Expanded_150.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "150 procedurally-generated amp/cab/mic pairings for bass and guitar, loaded via plugin + manual ReaVerb IR.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_ToneMatrix_Expanded_150.lua" },
    { id: 450, title: "Ferrett_Bass_Blues_Slide.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "Bass tone chain for slide/ghost-pop technique.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Bass_Blues_Slide.lua" },
    { id: 451, title: "Ferrett_Keys_Rhodes_Basement.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "Warbly basement Rhodes chain.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Keys_Rhodes_Basement.lua" },
    { id: 452, title: "Ferrett_Drum_Vinyl_Crunch.lua", category: "INTERFACE & TONES", shortcut: "Action List", func: "Vinyl-crunch drum kit chain.", url: RAW_BASE + "Lua/Guitar_Bass_Tone/Ferrett_Drum_Vinyl_Crunch.lua" },

    { id: 460, title: "Flow_OneClick_Render_v2.lua", category: "WORKFLOW & EXPORT", shortcut: "Ctrl+Alt+R", func: "Solos and renders VOX/INST/MIX buses to dated filenames, reports exactly which buses rendered vs were skipped.", url: RAW_BASE + "Lua/Rendering_QA/Flow_OneClick_Render_v2.lua" },
    { id: 461, title: "Render_Amps_To_Audio.lua", category: "WORKFLOW & EXPORT", shortcut: "Action List", func: "Renders every 'AMP - *' track to a stem and disables live amp-sim FX on the original (freeze workflow for CPU relief).", url: RAW_BASE + "Lua/Rendering_QA/Render_Amps_To_Audio.lua" },

    { id: 470, title: "HipHop_ChopSuite.lua", category: "SAMPLING & MIDI GEN", shortcut: "Action List", func: "Fully automated sample chopper: splits the selected item at transients, moves each chop to its own colored/named track, applies pitch-down and a starting lo-fi EQ.", url: RAW_BASE + "Lua/Sampling_and_MIDI_Generation/HipHop_ChopSuite.lua" },
    { id: 471, title: "Ferrett_Sample_Chop_Template.lua", category: "SAMPLING & MIDI GEN", shortcut: "Action List", func: "Builds 16 empty MIDI trigger pads (C1-D#2) for a ReaSamplOmatic5000 play-live chop kit - a different workflow from ChopSuite's auto-slicing.", url: RAW_BASE + "Lua/Sampling_and_MIDI_Generation/Ferrett_Sample_Chop_Template.lua" },
    { id: 472, title: "Ferrett_MIDI_From_Audio_Melody.lua", category: "SAMPLING & MIDI GEN", shortcut: "Action List", func: "Adds ReaTune to a take for humming/synth-line-to-MIDI conversion.", url: RAW_BASE + "Lua/Sampling_and_MIDI_Generation/Ferrett_MIDI_From_Audio_Melody.lua" },

    { id: 480, title: "DustMachine.lua", category: "TRASH & FX", shortcut: "Action List", func: "Two modes: applies a lo-fi dust chain to the selected track, or writes an actual programmed pitch-drop envelope for a tape-stop transition on the selected item.", url: RAW_BASE + "Lua/Trash_and_Echo_FX/DustMachine.lua" },
    { id: 481, title: "Ferrett_Effects_Throw_Builder.lua", category: "TRASH & FX", shortcut: "Action List", func: "Builds a dub/tape-stop FX-throw bus (Supermassive, Galaxy Tape Echo, ReaDelay, ReaPitch).", url: RAW_BASE + "Lua/Trash_and_Echo_FX/Ferrett_Effects_Throw_Builder.lua" },
    { id: 482, title: "Ferrett_Owned_TapeEcho_8Presets.lua", category: "TRASH & FX", shortcut: "Action List", func: "8-preset echo menu (Slap/Dub Throw/Plate+Echo/LoFi Warble/Ping Pong/Megaphone/Blues Call/Chamber), owned gear only.", url: RAW_BASE + "Lua/Trash_and_Echo_FX/Ferrett_Owned_TapeEcho_8Presets.lua" },
    { id: 483, title: "Ferrett_Owned_Trash_Morph_Container.lua", category: "TRASH & FX", shortcut: "Action List", func: "One-knob 'mild to megaphone' morph using an FX Container with owned plugins, with a graceful fallback if containers aren't supported.", url: RAW_BASE + "Lua/Trash_and_Echo_FX/Ferrett_Owned_Trash_Morph_Container.lua" },
    { id: 484, title: "Ferrett_Owned_TrashVocal_6Stages_Gateway.lua", category: "TRASH & FX", shortcut: "Action List", func: "One popup menu covering all 6 trash-vocal stages (Mild Tape to Beastie Megaphone), owned gear only.", url: RAW_BASE + "Lua/Trash_and_Echo_FX/Ferrett_Owned_TrashVocal_6Stages_Gateway.lua" },

    { id: 490, title: "Ferrett_Stem_Triage_Tagger.lua", category: "STEM WORKFLOW & QA", shortcut: "Action List", func: "Quick popup to tag a track KEEP/RERECORD/MIDI/TRASH, auto-mutes anything tagged TRASH.", url: RAW_BASE + "Lua/Stem_Workflow_QA/Ferrett_Stem_Triage_Tagger.lua" },
    { id: 491, title: "Ferrett_Synth_Keep_vs_Replace.lua", category: "STEM WORKFLOW & QA", shortcut: "Action List", func: "Popup for 3 synth-fix scenarios: mono pad widening, out-of-key lead to MIDI, thin chorus to a full stack.", url: RAW_BASE + "Lua/Stem_Workflow_QA/Ferrett_Synth_Keep_vs_Replace.lua" },
    { id: 492, title: "Ferrett_Mixed_Bag_Finalizer.lua", category: "STEM WORKFLOW & QA", shortcut: "Action List", func: "Pre-mix QA scan: flags [TRASH]-tagged tracks that aren't muted, shows a headphone-check reminder.", url: RAW_BASE + "Lua/Stem_Workflow_QA/Ferrett_Mixed_Bag_Finalizer.lua" },
    { id: 493, title: "Ferrett_Drum_Keep_Augment.lua", category: "STEM WORKFLOW & QA", shortcut: "Action List", func: "Adds a parallel crush send without replacing the original drums.", url: RAW_BASE + "Lua/Stem_Workflow_QA/Ferrett_Drum_Keep_Augment.lua" },
    { id: 494, title: "Ferrett_Drum_Full_MIDI_Replace.lua", category: "STEM WORKFLOW & QA", shortcut: "Action List", func: "Track setup for fully replacing messy AI drums with SSD5 MIDI.", url: RAW_BASE + "Lua/Stem_Workflow_QA/Ferrett_Drum_Full_MIDI_Replace.lua" },
    { id: 495, title: "Ferrett_Bass_Rerecord_Helper.lua", category: "STEM WORKFLOW & QA", shortcut: "Action List", func: "Creates a DI guide track with a tuner for re-recording AI bass with a real 5-string.", url: RAW_BASE + "Lua/Stem_Workflow_QA/Ferrett_Bass_Rerecord_Helper.lua" },

    { id: 500, title: "lyrics.lua", category: "REFERENCE & UTILITY", shortcut: "Action List", func: "Floating lyrics-prompter window driven by project markers, with a dimmed next-line preview synced to the playhead.", url: RAW_BASE + "Lua/Reference_Tools/lyrics.lua" },
    { id: 501, title: "Ferrett_Cookbook_Recipe_Finder.lua", category: "REFERENCE & UTILITY", shortcut: "Action List", func: "Asks what elements you have on hand (bass, guitar, vox type, drums, etc.) and suggests genre-appropriate arrangement combos.", url: RAW_BASE + "Lua/Reference_Tools/Ferrett_Cookbook_Recipe_Finder.lua" },

    { id: 502, title: "run_uvr_pipeline.command", category: "AI STEM & MIDI", shortcut: "Double-click", func: "Double-clickable Terminal launcher for auto_uvr.py - drop a WAV on it or pick one via a native file picker rooted at Music Projects/, then runs the full separation pipeline with a visible progress log.", url: RAW_BASE + "run_uvr_pipeline.command" },
    { id: 503, title: "unpack.sh", category: "REFERENCE & UTILITY", shortcut: "Terminal", func: "Batch-unzips NAM amp packs sitting in the current folder into ~/Music/NAM_Rig/Amps/<name>/, one folder per zip.", url: RAW_BASE + "Shell_Scripts/unpack.sh" },
    { id: 504, title: "unzip_nam_ir_library.zsh", category: "REFERENCE & UTILITY", shortcut: "Terminal", func: "Watches ~/Downloads for NAM zips and auto-sorts them into NAM_Rig/Amps vs /IRs by filename, stripping __MACOSX junk.", url: RAW_BASE + "Shell_Scripts/unzip_nam_ir_library.zsh" },
    { id: 505, title: "NAM_Re-Amp.RTrackTemplate", category: "PROJECT BUILDER", shortcut: "Template", func: "REAPER track template for re-amping a DI through NAM captures.", url: RAW_BASE + "Track_Templates/NAM_Re-Amp.RTrackTemplate" },
    { id: 506, title: "BASS_5STR_Basement.RTrackTemplate", category: "PROJECT BUILDER", shortcut: "Template", func: "REAPER track template for the 5-string bass basement tone chain.", url: RAW_BASE + "Track_Templates/BASS_5STR_Basement.RTrackTemplate" },

    { id: 507, title: "1_euclidean_rhythm_gui.lua", category: "SAMPLING & MIDI GEN", shortcut: "Action List", func: "Live Euclidean rhythm sequencer with a visual step grid and a PLAY button that auditions the pattern through the Virtual MIDI Keyboard before writing it to a MIDI item. Requires ReaImGui.", url: RAW_BASE + "Lua/Sampling_and_MIDI_Generation/1_euclidean_rhythm_gui.lua" },
    { id: 508, title: "2_markov_melody_gui.lua", category: "SAMPLING & MIDI GEN", shortcut: "Action List", func: "Learns note transitions from a source item, generates a new melody, then auditions it via the Virtual MIDI Keyboard before it lives in your project. Requires ReaImGui.", url: RAW_BASE + "Lua/Sampling_and_MIDI_Generation/2_markov_melody_gui.lua" },
    { id: 509, title: "3_glitch_slicer_gui.lua", category: "SAMPLING & MIDI GEN", shortcut: "Action List", func: "Interactive glitch/IDM audio slicer - dial slices + chaos, toggle repeat/reverse/pitch/half-time tricks, GLITCH, then audition the edited item via transport playback. Requires ReaImGui.", url: RAW_BASE + "Lua/Sampling_and_MIDI_Generation/3_glitch_slicer_gui.lua" },
    { id: 510, title: "4_chord_composer_gui.lua", category: "SAMPLING & MIDI GEN", shortcut: "Action List", func: "Functional-harmony chord progression generator with voice leading - pick key/mode, roll a progression, audition as block chords, then write to a MIDI item. Requires ReaImGui.", url: RAW_BASE + "Lua/Sampling_and_MIDI_Generation/4_chord_composer_gui.lua" },
    { id: 511, title: "5_human_groove_gui.lua", category: "SAMPLING & MIDI GEN", shortcut: "Action List", func: "Live-slider humanizer (swing/jitter/drift/velocity feel) that snapshots original note positions on LOAD so every APPLY re-feels from the clean original, with audition before committing. Requires ReaImGui.", url: RAW_BASE + "Lua/Sampling_and_MIDI_Generation/5_human_groove_gui.lua" },
];

// 1. Initialize the Array if it doesn't exist
if (!window.db.scripts) window.db.scripts = JSON.parse(JSON.stringify(defaultScripts));

// 2. The Render Engine
window.renderScripts = () => {
    const list = document.getElementById('script-list');
    if(!list) return;

    // Sort alphabetically by Category
    const sortedScripts = [...window.db.scripts].sort((a, b) => a.category.localeCompare(b.category));
    const allCats = [...new Set(sortedScripts.map(s => s.category))].sort();
    if (window.renderTagBarGeneric) window.renderTagBarGeneric('script-tag-bar', allCats, window.currentScriptTag, window.scriptCategoryColor, window.setScriptTag);

    const filtered = window.currentScriptTag && window.currentScriptTag !== 'ALL' ? sortedScripts.filter(s => s.category === window.currentScriptTag) : sortedScripts;
    list.innerHTML = '';
    if (filtered.length === 0) { list.innerHTML = `<div class="col-span-full text-center text-[#E2E8F0]/30 text-[11px] italic p-8 border border-dashed border-[#00E5FF20] rounded">No scripts match this tag.</div>`; return; }

    filtered.forEach(s => {
        const pc = window.scriptCategoryColor ? window.scriptCategoryColor(s.category) : '#00E5FF';
        list.innerHTML += `
            <div class="card relative group bg-[rgba(5,8,7,0.8)] border-[#00E5FF30] flex flex-col">
                <div class="absolute top-3 right-3 flex opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 gap-3 z-20">
                    <button data-id="${s.id}" class="btn-edit-script text-[10px] font-bold text-[#00E5FF] hover:text-white">EDIT</button>
                    <button data-id="${s.id}" class="btn-del-script text-[10px] font-bold text-[#FF8888] hover:text-white">DEL</button>
                </div>
                <div class="flex items-center justify-between mb-2 pr-16">
                    <h4 class="font-bold text-[13px] text-[#00E5FF] truncate" title="${s.title}">${s.title}</h4>
                    <code class="px-1.5 py-0.5 bg-[#00E5FF15] border border-[#00E5FF30] rounded text-[#00E5FF] text-[9px] font-mono whitespace-nowrap shrink-0">${s.shortcut}</code>
                </div>
                <div class="mb-3"><button data-tag="${s.category}" class="btn-tag-script text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border cursor-pointer transition-all hover:brightness-125" style="color:${pc}; border-color:${pc}40; background:${pc}0A;" title="Filter by ${s.category}">${s.category}</button></div>
                <p class="text-[11px] text-[#A7DCC3]/80 leading-relaxed font-mono flex-1 mb-4">${s.func}</p>
                ${s.url ? `<button type="button" class="btn-download-script mt-auto text-center block w-full px-3 py-2 rounded bg-[rgba(0,229,255,0.08)] border border-[#00E5FF30] text-[#00E5FF] hover:bg-[#00E5FF20] transition-colors text-[10px] tracking-widest font-bold cursor-pointer" data-url="${s.url}" data-title="${s.title}">DOWNLOAD ↓</button>` : ''}
            </div>
        `;
    });
};

// download attribute is ignored cross-origin (raw.githubusercontent.com), so fetch as a
// blob and save that instead - falls back to opening the raw file if the fetch fails
window.downloadScriptFile = async (url, title) => {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl; a.download = title;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(objUrl);
    } catch (e) {
        window.open(url, '_blank');
    }
};
document.getElementById('script-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-download-script');
    if (btn) window.downloadScriptFile(btn.dataset.url, btn.dataset.title);
});

// 3. Hook into the existing UI Refresher
const originalRefresh = window.refreshAllUI;
window.refreshAllUI = () => {
    if (originalRefresh) originalRefresh();
    window.renderScripts();
    window.lyrForceReload?.(); window.refreshLyrics?.();
};

// 4. Form Controls & Delegation
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-add-script')?.addEventListener('click', () => {
        if(window.toggleForm) window.toggleForm('form-script');
    });

    document.getElementById('btn-cancel-script')?.addEventListener('click', () => {
        if(window.toggleForm) window.toggleForm('form-script');
    });

    document.getElementById('btn-save-script')?.addEventListener('click', () => {
        const idStr = document.getElementById('script-id').value;
        const id = idStr ? parseInt(idStr, 10) : Date.now();
        const scriptData = {
            id: id,
            title: document.getElementById('script-title').value || 'Unnamed_Script.lua',
            category: document.getElementById('script-category').value || 'UNCATEGORIZED',
            shortcut: document.getElementById('script-shortcut').value || 'None',
            func: document.getElementById('script-func').value,
            url: document.getElementById('script-url').value || ''
        };
        
        if (idStr) window.db.scripts = window.db.scripts.map(s => s.id === scriptData.id ? scriptData : s); 
        else window.db.scripts.push(scriptData);
        
        window.saveData(); 
        if(window.toggleForm) window.toggleForm('form-script'); 
        window.renderScripts();
    });

    // Global Click Listener for Edit/Delete
    document.addEventListener('click', (e) => {
        const btnEdit = e.target.closest('.btn-edit-script');
        if (btnEdit) {
            const scriptData = window.db.scripts.find(s => s.id === parseInt(btnEdit.dataset.id, 10));
            if (scriptData) {
                document.getElementById('script-id').value = scriptData.id;
                document.getElementById('script-title').value = scriptData.title;
                document.getElementById('script-category').value = scriptData.category;
                document.getElementById('script-shortcut').value = scriptData.shortcut;
                document.getElementById('script-func').value = scriptData.func;
                document.getElementById('script-url').value = scriptData.url || '';
                
                const titleEl = document.getElementById('script-form-title');
                if (titleEl) titleEl.innerText = 'EDIT SCRIPT';
                
                document.getElementById('form-script')?.classList.remove('hidden');
                setTimeout(() => { document.getElementById('form-script')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
            }
        }

        const btnDel = e.target.closest('.btn-del-script');
        if (btnDel && confirm("Delete this script configuration?")) {
            window.db.scripts = window.db.scripts.filter(s => s.id !== parseInt(btnDel.dataset.id, 10));
            window.saveData();
            window.renderScripts();
        }
    });

    // Initial Render
    setTimeout(() => { window.renderScripts(); }, 100);
});

});
// --- REAPER DAW BRIDGE & TRACKER LOGIC ---

window.saveMatrix = (checkbox, songId, stemName) => {
    const song = (window.db?.songBoard || []).find(s => String(s.id) === String(songId));
    if (song) {
        if (!song.matrix) song.matrix = {};
        song.matrix[stemName] = checkbox.checked;
        window.saveData?.();
    }
};

window.exportToReaper = (songId) => {
    const song = (window.db?.songBoard || []).find(s => String(s.id) === String(songId));
    if (!song) return alert("Song not found.");
    
    const arr = song.arrangement;
    const bpm = song.bpm || (arr && arr.bpm) || 120;
    
    let rpp = `<REAPER_PROJECT 0.1 "5.98/OSX64" 1555555555\n`;
    rpp += `  TEMPO ${bpm} 4 4\n`;
    
    if (arr && Array.isArray(arr.sections) && arr.sections.length) {
        const secPerBar = 4 * (60 / bpm);
        let t = 0;
        let markerId = 1;
        arr.sections.forEach(s => {
            rpp += `  MARKER ${markerId} ${t.toFixed(3)} "${s.name}" 0 0 1 "" { }\n`;
            t += s.bars * secPerBar;
            markerId++;
        });
    }
    
    // Auto-generate the tracking matrix lanes
    const tracks = [
        "AI Guide Track", 
        "Drums (UAD Spark)", 
        "Bass (NAM)", 
        "Guitars (NAM)", 
        "Synths", 
        "Lead Vox (TheFerrett)", 
        "Backing Vox"
    ];
    
    tracks.forEach(name => {
        rpp += `  <TRACK\n    NAME "${name}"\n  >\n`;
    });
    
    rpp += `>\n`; 
    
    const blob = new Blob([rpp], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(song.title || 'Euterpe_Track').replace(/\s+/g, '_')}_Skeleton.rpp`;
    a.click();
};
