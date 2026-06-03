/**
 * speedtest.js Patch
 *
 * Modify server/util/speedtest.js to support the xxir provider.
 *
 * The xxir provider runs natively in Node.js (no CLI binary needed),
 * so it needs special handling in the speedtest wrapper.
 */

// ── Add import at top of server/util/speedtest.js ────

import { runXxirTest } from './providers/xxir.js';

// ── Replace the default export function ──────────────
// Add the xxir branch BEFORE the binary/spawn logic.

export default async (mode, serverId, serverUrl) => {
    // ── xxir mode: native Node.js, no CLI binary ──
    if (mode === "xxir") {
        const nodeId = serverId || "xxir-1";
        return await runXxirTest(nodeId);
    }

    // ── Original logic for ookla/libre/cloudflare ──
    const binaryPath = mode === "ookla" ? './bin/speedtest' + (process.platform === "win32" ? ".exe" : "")
        : mode === "libre" ? './bin/librespeed-cli' + (process.platform === "win32" ? ".exe" : "")
            : './bin/cfspeedtest' + (process.platform === "win32" ? ".exe" : "");

    // ... rest of original code unchanged ...
};
