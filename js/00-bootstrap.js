// Single source of truth for the version shown in the tab title + header. Bump this AND
// CACHE_VERSION in service-worker.js together any time a change ships — keep the two numbers
// identical so there's only one version to remember, not two drifting counters.
window.APP_VERSION = 'v151';
document.title = `Euterpe Creativity Workbench (${window.APP_VERSION})`;
const DRIVE_FILE_NAME = 'EUTERPE_OS_VAULT.json';

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
