// Single source of truth for the version shown in the tab title + header. Bump this AND
// CACHE_VERSION in service-worker.js together any time a change ships — keep the two numbers
// identical so there's only one version to remember, not two drifting counters.
window.APP_VERSION = 'v150';
document.title = `Euterpe Creativity Workbench (${window.APP_VERSION})`;
const GOOGLE_CLIENT_ID = '722579204865-hl1u9kt0flp6cqasl3perkssf9gv5kst.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyBmt4asIc5PD3NxJljW5iTwy1VK4LsWrWk';
const DRIVE_FILE_NAME = 'EUTERPE_OS_VAULT.json';

window.gapiLoadComplete = function() { gapi.load('client', async () => { try { await gapi.client.init({ apiKey: GOOGLE_API_KEY, discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'] }); } catch (err) { console.error(err); } }); };
window.gisLoadComplete = function() { try { window.tokenClient = google.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/drive.file', login_hint: 'zsahs84@gmail.com', callback: async (resp) => { if (resp.error) { window.setDriveStatus(false); return; } window.setDriveStatus(true); await (window.syncWithDrive ? window.syncWithDrive() : window.findOrPullDriveFile()); } }); window.trySilentDriveConnect?.(); } catch (err) { console.error(err); } };
