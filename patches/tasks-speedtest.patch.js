/**
 * tasks/speedtest.js Patch
 *
 * Modify server/tasks/speedtest.js to handle the xxir provider.
 *
 * The xxir provider doesn't use serverId in the same way as Ookla,
 * so we need to handle the server selection differently.
 */

// ── In the run() function ────────────────────────────
// Update the serverId logic to handle xxir mode:

export const run = async (retryAuto = false) => {
    setRunning(true);
    let mode = await config.getValue("provider");

    if (mode === "none") {
        setRunning(false);
        throw { message: "No provider selected" };
    }

    // ── xxir mode: serverId is "xxir-1" or "xxir-2" ──
    let serverId, serverUrl;
    if (mode === "xxir") {
        serverId = await config.getValue("xxirId");
        if (serverId === "none" || !serverId) serverId = "xxir-1";
        serverUrl = undefined;
    } else {
        serverId = mode === "cloudflare" ? 0 : await config.getValue(mode + "Id");
        serverUrl = mode === "libre" ? await config.getValue("libreUrl") : undefined;

        if (serverId === "none") serverId = undefined;
        if (serverUrl === "none") serverUrl = undefined;
        if (mode === "libre" && serverUrl) serverId = undefined;
    }

    let speedtest = await (retryAuto ? speedTest(mode) : speedTest(mode, serverId, serverUrl));

    // ── xxir mode: no auto-detect server ──
    if (mode === "ookla" && speedtest.server) {
        if (serverId === undefined) await config.updateValue("ooklaId", speedtest.server?.id);
        serverId = speedtest.server?.id;
    }

    // ... rest of original code unchanged ...
};
