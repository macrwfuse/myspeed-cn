/**
 * xxir Provider Patch
 *
 * Add this to server/util/providers/parseData.js
 * Add the parseXxir function and register it in the parseData switch.
 */

// ── Add to parseData.js ──────────────────────────────

// 1. Add the parseXxir function:

export const parseXxir = (test) => {
    let ping = Math.round(test.ping.latency);
    let jitter = test.ping.jitter ? parseFloat(test.ping.jitter.toFixed(2)) : null;
    let download = roundSpeed(test.download.bandwidth);
    let upload = roundSpeed(test.upload.bandwidth);
    let time = Math.round((test.download.elapsed + test.upload.elapsed) / 1000);
    let serverName = test.server?.name ?? null;
    let serverHost = test.server?.host ?? null;

    return { ping, jitter, download, upload, time, resultId: null, serverName, serverHost };
};

// 2. Update the parseData switch to add the xxir case:

export const parseData = (provider, data) => {
    switch (provider) {
        case "ookla":
            return parseOokla(data);
        case "libre":
            return parseLibre(data);
        case "cloudflare":
            return parseCloudflare(data);
        case "xxir":                          // ← ADD THIS
            return parseXxir(data);           // ← ADD THIS
        default:
            throw { message: "Invalid provider" };
    }
};
