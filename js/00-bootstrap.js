// Single source of truth for the version shown in the tab title + header. Bump this AND
// CACHE_VERSION in service-worker.js together any time a change ships — keep the two numbers
// identical so there's only one version to remember, not two drifting counters.
window.APP_VERSION = 'v159';
document.title = `Euterpe Creativity Workbench (${window.APP_VERSION})`;
const DRIVE_FILE_NAME = 'EUTERPE_OS_VAULT.json';

// ---- device identity -------------------------------------------------------
// Deliberately NOT part of window.db. The vault syncs, so an id stored in it would arrive
// on every other machine and each one would believe it was the same device — which is
// exactly what per-device plugin lists must not do. This lives beside the vault, like the
// AI and Drive config, so it stays unique to this browser on this machine.
const DEVICE_KEY = 'euterpe_device_v1';
function guessDeviceName() {
    const ua = navigator.userAgent || '';
    if (/iPhone/i.test(ua)) return 'iPhone';
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Android/i.test(ua)) return 'Android device';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Linux|X11/i.test(ua)) return 'Linux PC';
    return 'This device';
}
window.getDevice = () => {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DEVICE_KEY) || 'null'); } catch (e) {}
    if (!d || !d.id) {
        d = { id: 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4), name: guessDeviceName() };
        try { localStorage.setItem(DEVICE_KEY, JSON.stringify(d)); } catch (e) {}
    }
    return d;
};
window.setDeviceName = (name) => {
    const d = window.getDevice();
    d.name = String(name || '').trim() || guessDeviceName();
    try { localStorage.setItem(DEVICE_KEY, JSON.stringify(d)); } catch (e) {}
    return d;
};
// Which profile THIS device reads its plugin list from. Also per-device: a phone with no
// plugins of its own should be able to point at the studio machine's list without changing
// what the studio machine uses.
const ACTIVE_PROFILE_KEY = 'euterpe_active_plugin_profile_v1';
window.getActiveProfileId = () => { try { return localStorage.getItem(ACTIVE_PROFILE_KEY) || ''; } catch (e) { return ''; } };
window.setActiveProfileId = (id) => { try { id ? localStorage.setItem(ACTIVE_PROFILE_KEY, id) : localStorage.removeItem(ACTIVE_PROFILE_KEY); } catch (e) {} };

// Google Drive sync is bring-your-own-credentials: whoever deploys this app supplies their
// own OAuth client, so their vault syncs to their own Drive. Nothing is hardcoded here — a
// Google OAuth client ID only works from the origins listed on it, so a fork could never
// reuse someone else's anyway. Set it in ⚙ setup → GOOGLE DRIVE; it is stored in this
// browser's localStorage only and never committed.
const DRIVE_CFG_KEY = 'ferrett_os_drive_cfg_v1';
window.getDriveCfg = () => { try { return JSON.parse(localStorage.getItem(DRIVE_CFG_KEY) || '{}'); } catch (e) { return {}; } };
window.saveDriveCfg = (c) => { try { localStorage.setItem(DRIVE_CFG_KEY, JSON.stringify(c || {})); } catch (e) {} };
window.driveClientId = () => (window.getDriveCfg().clientId || '').trim();
window.isDriveConfigured = () => !!window.driveClientId();

// The API key is optional — every Drive call here is authorized by the OAuth token, so the
// key would only cover the discovery document. Left blank, gapi fetches it unauthenticated.
window.gapiLoadComplete = function() {
    gapi.load('client', async () => {
        try {
            const key = (window.getDriveCfg().apiKey || '').trim();
            const init = { discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] };
            if (key) init.apiKey = key;
            await gapi.client.init(init);
        } catch (err) { console.error(err); }
    });
};

// Builds (or rebuilds) the OAuth token client from whatever client ID is configured right
// now. Called on GIS load and again whenever the user saves a new one, so setting Drive up
// takes effect immediately instead of needing a page reload.
window.initDriveClient = function() {
    const clientId = window.driveClientId();
    if (!clientId || typeof google === 'undefined' || !google.accounts) { window.tokenClient = null; return false; }
    try {
        window.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: async (resp) => {
                if (resp.error) { window.setDriveStatus(false); return; }
                window.setDriveStatus(true);
                await (window.syncWithDrive ? window.syncWithDrive() : window.findOrPullDriveFile());
            }
        });
        return true;
    } catch (err) { console.error(err); window.tokenClient = null; return false; }
};

window.gisLoadComplete = function() {
    window.gisReady = true;
    if (window.initDriveClient()) window.trySilentDriveConnect?.();
};
