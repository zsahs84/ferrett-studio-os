if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((reg) => console.log('[SW] registered, scope:', reg.scope))
            .catch((err) => console.warn('[SW] registration failed (fine if opened via file:// or a fresh deploy):', err));
    });
}
