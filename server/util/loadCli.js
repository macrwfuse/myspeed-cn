import * as libreProvider from './providers/loadLibre.js';
import * as ooklaProvider from './providers/loadOokla.js';
import * as cloudflareProvider from './providers/loadCloudflare.js';

export const load = async () => {
    // Download binaries in background — don't block server startup
    // This prevents slow/blocked CDN downloads (especially in China) from
    // preventing the web UI from loading.
    const downloadAll = async () => {
        try { await libreProvider.load(); } catch (e) { console.warn("LibreSpeed binary download skipped:", e.message); }
        try { await ooklaProvider.load(); } catch (e) { console.warn("Ookla binary download skipped:", e.message); }
        try { await cloudflareProvider.load(); } catch (e) { console.warn("Cloudflare binary download skipped:", e.message); }
        console.log("CLI binaries ready.");
    };
    downloadAll(); // fire-and-forget
};