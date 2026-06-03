/**
 * xxir Speed Test Provider
 *
 * Implements a multi-stream concurrent download/upload speed test,
 * inspired by speed.xxir.com's browser-based approach but running
 * entirely in Node.js (no browser/Web Worker needed).
 *
 * How it works:
 *   1. Ping:     HTTP GET to a lightweight endpoint, measure RTT
 *   2. Download: 15 concurrent HTTP GET streams downloading real CDN files,
 *                accumulate bytes over ~20 seconds, compute Mbps
 *   3. Upload:   5 concurrent HTTP POST streams uploading random data,
 *                accumulate bytes over ~15 seconds, compute Mbps
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

// ──────────────────────────────────────────────
// Download URL pools (from speed.xxir.com/js/js.js)
// ──────────────────────────────────────────────

const DLID1 = [
    "https://lf9-apk.ugapk.cn/package/apk/aweme/5072_340301/aweme_douyin-huidu-gw-aweme-3430_v5072_340301_eea8_1747058635.apk",
    "https://cdn.aixifan.com/downloads/AcfunLive-Setup-1.9.0.200-ReleaseX64_6d5c40.exe",
    "https://devtools.qiniu.com/linux/amd64/qrsctl",
    "https://gw.alipayobjects.com/os/volans-demo/93211a67-0eed-40ff-8a48-f6c137a88781/MiniProgramStudio-3.1.3.exe",
    "https://8c8947-1956185621.antpcdn.com:19001/b/pkg-ant.baidu.com/issue/netdisk/LinuxGuanjia/4.17.7/baidunetdisk_4.17.7_amd64.deb",
    "https://downapp.sina.cn/m/06/sinaNews_8.27.0_1719288606_4386_3538_armeabi-v7a.apk",
    "https://i1.sinaimg.cn/edu/sinaopen/SinaOpencourse_V2.02.apk",
    "https://upgrade.k.sohu.com/upgrade/SohuNews_V7.3.6_0421110326_online_1003.apk",
    "https://statics.itc.cn/lt-app/sohumobile_official_gray_optimizeRelease_4_1.0.3_01161850.apk",
    "https://pkg.sinaimg.cn/weibo_13.11.1_vcode_6489_wm_3333_1001_so_32_64_weibo_5395_205935.apk",
    "https://open-image.ws.126.net/android_phone_release-sp_open-v9.9.9-v0a5b3c1dc0df472bb2fb057d0a5426c3.apk",
    "https://lf3-cdn-tos.bytegoofy.com/obj/douyin-pc-client/7044145585217083655/releases/8293088/1.0.8/win32-ia32/douyin-v1.0.8-win32-ia32-douyin.exe",
    "https://lf6-cdn-tos.bytegoofy.com/obj/douyin-pc-client/7044145585217083655/releases/8293088/1.0.8/win32-ia32/douyin-v1.0.8-win32-ia32-douyin.exe",
    "https://wwwstatic.vivo.com.cn/vivoportal/files/download/app/20231026/350bda07c8a0719919bcadbf5aea3538.apk",
    "https://cd.pddpic.com/android_dev/2023-11-08/a35eaee8e1f9f018cc40ace12931f7a2.apk",
    "https://1270e8-3086970414.antpcdn.com:19001/b/pkg-ant.baidu.com/issue/netdisk/yunguanjia/BaiduNetdisk_7.55.1.101.exe",
    "https://rls.tapimg.com/pub2/202310/64a7c775fa5503fc30f46c6fea6f9faf.apk",
    "https://uu.gdl.netease.com/4112/UU-4.68.1.exe",
    "https://cd.pddpic.com/android_dev/2024-06-26/06027b4121edcd1f106d992128a7124b.apk",
    "https://cd.pddpic.com/volantis-open/volantis-common/app/com.xunmeng.workBench/Release_1834716.exe",
    "https://cdn-ws.up366.cn/cn/files/setup/C72C242ED8400001EE2178A912E01146/2022/06/21/4dca83b3e1c461e070f75d2b485e75e7/up366-5.6.6.0.exe",
    "https://open-image.ws.126.net/android_phone_release-sp_open-v9.10.1-vb7b79d6b531448baaca3a81e7fbdc13f.apk",
    "https://lf3-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe",
    "https://lf6-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe",
    "https://lf9-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe",
    "https://file.ljcdn.com/saas-pkg/asaas-new/new_asaas_4.0.56_win_prod.zip",
    "https://video19.ifeng.com/video09/2022/07/06/p6950362006465552946-102-162611.mp4",
    "https://apk.360buyimg.com/build-cms/V5.2.0-4258-800000136-bazaar-64bit.apk",
    "https://download.jr.jd.com/downapp/jrapp_jr9631.apk",
];

// Sub-pools for "node 2" style (random group → random URL)
const DL_GROUPS = [
    ["https://cdn.aixifan.com/downloads/AcfunLive-Setup-1.9.0.200-ReleaseX64_6d5c40.exe", "https://devtools.qiniu.com/linux/amd64/qrsctl", "https://devtools.qiniu.com/qdoractl-darwin-amd64-0.4.6", "https://gw.alipayobjects.com/os/volans-demo/93211a67-0eed-40ff-8a48-f6c137a88781/MiniProgramStudio-3.1.3.exe", "https://apk.360buyimg.com/build-cms/V5.2.0-4258-800000136-bazaar-64bit.apk", "https://download.jr.jd.com/downapp/jrapp_jr9631.apk"],
    ["https://8c8947-1956185621.antpcdn.com:19001/b/pkg-ant.baidu.com/issue/netdisk/LinuxGuanjia/4.17.7/baidunetdisk_4.17.7_amd64.deb", "https://downapp.sina.cn/m/06/sinaNews_8.27.0_1719288606_4386_3538_armeabi-v7a.apk", "https://i1.sinaimg.cn/edu/sinaopen/SinaOpencourse_V2.02.apk", "https://upgrade.k.sohu.com/upgrade/SohuNews_V7.3.6_0421110326_online_1003.apk", "https://uu.gdl.netease.com/4112/UU-4.68.1.exe"],
    ["https://statics.itc.cn/lt-app/sohumobile_official_gray_optimizeRelease_4_1.0.3_01161850.apk", "https://pkg.sinaimg.cn/weibo_13.11.1_vcode_6489_wm_3333_1001_so_32_64_weibo_5395_205935.apk", "https://open-image.ws.126.net/android_phone_release-sp_open-v9.9.9-v0a5b3c1dc0df472bb2fb057d0a5426c3.apk", "https://lf3-cdn-tos.bytegoofy.com/obj/douyin-pc-client/7044145585217083655/releases/8293088/1.0.8/win32-ia32/douyin-v1.0.8-win32-ia32-douyin.exe"],
    ["https://lf6-cdn-tos.bytegoofy.com/obj/douyin-pc-client/7044145585217083655/releases/8293088/1.0.8/win32-ia32/douyin-v1.0.8-win32-ia32-douyin.exe", "https://lf3-cdn-tos.bytegoofy.com/obj/douyin-pc-client/7044145585217083655/releases/8293088/1.0.8/win32-ia32/douyin-v1.0.8-win32-ia32-douyin.exe", "https://wwwstatic.vivo.com.cn/vivoportal/files/download/app/20231026/350bda07c8a0719919bcadbf5aea3538.apk"],
    ["https://lf9-apk.ugapk.cn/package/apk/aweme/5072_340301/aweme_douyin-huidu-gw-aweme-3430_v5072_340301_eea8_1747058635.apk", "https://cd.pddpic.com/android_dev/2023-11-08/a35eaee8e1f9f018cc40ace12931f7a2.apk", "https://1270e8-3086970414.antpcdn.com:19001/b/pkg-ant.baidu.com/issue/netdisk/yunguanjia/BaiduNetdisk_7.55.1.101.exe", "https://video19.ifeng.com/video09/2022/07/06/p6950362006465552946-102-162611.mp4"],
    ["https://rls.tapimg.com/pub2/202310/64a7c775fa5503fc30f46c6fea6f9faf.apk", "https://cd.pddpic.com/android_dev/2024-06-26/06027b4121edcd1f106d992128a7124b.apk", "https://cdn-ws.up366.cn/cn/files/setup/C72C242ED8400001EE2178A912E01146/2022/06/21/4dca83b3e1c461e070f75d2b485e75e7/up366-5.6.6.0.exe", "https://file.ljcdn.com/saas-pkg/asaas-new/new_asaas_4.0.56_win_prod.zip", "https://lf9-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe"],
    ["https://cd.pddpic.com/volantis-open/volantis-common/app/com.xunmeng.workBench/Release_1834716.exe", "https://open-image.ws.126.net/android_phone_release-sp_open-v9.10.1-vb7b79d6b531448baaca3a81e7fbdc13f.apk", "https://lf3-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe", "https://lf6-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe"],
];

// Upload endpoints (POST targets that accept data)
const UPLOAD_URLS = [
    "https://mbd.baidu.com/ztbox?action=zpblog",
    "https://vcs.zijieapi.com/vc/setting?aid=6383&pageId=6241",
];

// Ping endpoints
const PING_URLS = [
    "https://lf3-cdn-tos.bytecdntp.com/",
    "https://maponline0.bdimg.com/tile/?qt=vtile&x=0&y=0&z=17",
];

// ──────────────────────────────────────────────
// Config (mirrors speed.xxir.com settings)
// ──────────────────────────────────────────────

const CONFIG = {
    dlStreams: 15,           // concurrent download streams
    ulStreams: 5,            // concurrent upload streams
    streamDelay: 100,        // ms delay between stream starts
    dlGraceTime: 2,          // seconds before measuring starts
    ulGraceTime: 2,
    dlMaxTime: 20,           // max download test seconds
    ulMaxTime: 15,           // max upload test seconds
    pingCount: 5,            // number of pings
    overheadFactor: 1.06,    // TCP/IP overhead compensation
    pollInterval: 200,       // ms between speed samples
    ulBlobSize: 1024 * 1024, // 1MB upload blob
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function makeUrl(base) {
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}nocache=${Math.random()}`;
}

/**
 * HTTP GET with streaming — returns a promise that resolves with total bytes received.
 * Calls onProgress(bytesSoFar) on each chunk.
 */
function httpGet(url, onProgress, signal) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.get(url, { headers: { 'Cache-Control': 'no-cache' } }, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                httpGet(res.headers.location, onProgress, signal).then(resolve).catch(reject);
                return;
            }
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            let bytes = 0;
            res.on('data', (chunk) => {
                bytes += chunk.length;
                onProgress(bytes);
            });
            res.on('end', () => resolve(bytes));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
        if (signal) {
            signal.addEventListener('abort', () => { req.destroy(); reject(new Error('aborted')); });
        }
    });
}

/**
 * HTTP POST with streaming upload — sends random data, returns bytes sent.
 */
function httpPost(url, sizeBytes, signal) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': sizeBytes,
                'Cache-Control': 'no-cache',
            },
        }, (res) => {
            res.resume();
            resolve(sizeBytes);
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('timeout')); });
        if (signal) {
            signal.addEventListener('abort', () => { req.destroy(); reject(new Error('aborted')); });
        }
        // Send random data in chunks to avoid memory spike
        const chunkSize = 64 * 1024;
        let sent = 0;
        const buf = Buffer.alloc(chunkSize);
        // Fill with random-ish data
        for (let i = 0; i < chunkSize; i++) buf[i] = Math.floor(Math.random() * 256);

        function writeChunk() {
            if (signal?.aborted) { req.destroy(); return; }
            const toWrite = Math.min(chunkSize, sizeBytes - sent);
            if (toWrite <= 0) { req.end(); return; }
            const ok = req.write(buf.slice(0, toWrite));
            sent += toWrite;
            if (!ok) {
                req.once('drain', writeChunk);
            } else {
                setImmediate(writeChunk);
            }
        }
        writeChunk();
    });
}

// ──────────────────────────────────────────────
// Ping test
// ──────────────────────────────────────────────

async function pingTest(count = CONFIG.pingCount) {
    const url = makeUrl(pick(PING_URLS));
    const latencies = [];

    for (let i = 0; i < count; i++) {
        const start = performance.now();
        try {
            await httpGet(url, () => { });
            const rtt = performance.now() - start;
            latencies.push(rtt);
        } catch {
            // skip failed ping
        }
        // Small delay between pings
        await new Promise(r => setTimeout(r, 100));
    }

    if (latencies.length === 0) return { latency: 0, jitter: 0 };

    const latency = Math.min(...latencies);
    let jitter = 0;
    if (latencies.length >= 2) {
        let totalDiff = 0;
        for (let i = 1; i < latencies.length; i++) {
            totalDiff += Math.abs(latencies[i] - latencies[i - 1]);
        }
        jitter = totalDiff / (latencies.length - 1);
    }

    return {
        latency: parseFloat(latency.toFixed(2)),
        jitter: parseFloat(jitter.toFixed(2)),
    };
}

// ──────────────────────────────────────────────
// Download test (multi-stream, grace time, auto-stop)
// ──────────────────────────────────────────────

async function downloadTest(nodeId) {
    const controller = new AbortController();
    let totalBytes = 0;
    const startTime = performance.now();
    let graceDone = false;
    let graceStartTime = startTime;
    const speeds = []; // collected Mbps samples

    // Pick URL pool based on node
    const getDownloadUrl = () => {
        if (nodeId === 'xxir-1') {
            return makeUrl(pick(DLID1));
        } else {
            // xxir-2: random group → random URL
            return makeUrl(pick(pick(DL_GROUPS)));
        }
    };

    // Per-stream byte tracking
    const streamBytes = new Array(CONFIG.dlStreams).fill(0);

    // Start streams with staggered delay
    const streamPromises = [];
    for (let i = 0; i < CONFIG.dlStreams; i++) {
        streamPromises.push((async () => {
            await new Promise(r => setTimeout(r, i * CONFIG.streamDelay));
            while (!controller.signal.aborted) {
                try {
                    await httpGet(getDownloadUrl(), (bytes) => {
                        const delta = bytes - streamBytes[i];
                        streamBytes[i] = bytes;
                        totalBytes += delta;
                    }, controller.signal);
                } catch (e) {
                    if (e.message === 'aborted') break;
                    // On error, try next URL
                }
            }
        })());
    }

    // Speed sampling loop
    const samplingDone = new Promise((resolve) => {
        const interval = setInterval(() => {
            const elapsed = (performance.now() - startTime) / 1000;

            // Grace period
            if (!graceDone) {
                if (elapsed > CONFIG.dlGraceTime && totalBytes > 0) {
                    graceDone = true;
                    graceStartTime = performance.now();
                    totalBytes = 0; // reset counter after grace
                }
                return;
            }

            const measureTime = (performance.now() - graceStartTime) / 1000;
            if (measureTime < 0.2) return;

            const bps = totalBytes / measureTime;
            const mbps = (bps * 8 * CONFIG.overheadFactor) / 1_000_000;
            speeds.push(mbps);

            // Auto-stop: if we've been measuring long enough
            if (measureTime >= CONFIG.dlMaxTime) {
                clearInterval(interval);
                controller.abort();
                resolve();
            }
        }, CONFIG.pollInterval);

        // Safety timeout
        setTimeout(() => {
            clearInterval(interval);
            controller.abort();
            resolve();
        }, (CONFIG.dlGraceTime + CONFIG.dlMaxTime + 5) * 1000);
    });

    await samplingDone;
    await Promise.allSettled(streamPromises);

    // Calculate final speed (average of samples, excluding first few)
    const validSpeeds = speeds.slice(Math.floor(speeds.length * 0.2));
    const download = validSpeeds.length > 0
        ? parseFloat(Math.max(...validSpeeds).toFixed(2))
        : 0;

    return { download, elapsed: Math.round((performance.now() - startTime) / 1000) };
}

// ──────────────────────────────────────────────
// Upload test (multi-stream)
// ──────────────────────────────────────────────

async function uploadTest() {
    const controller = new AbortController();
    let totalBytes = 0;
    const startTime = performance.now();
    let graceDone = false;
    let graceStartTime = startTime;
    const speeds = [];

    const blobSize = CONFIG.ulBlobSize;

    // Start upload streams
    const streamPromises = [];
    for (let i = 0; i < CONFIG.ulStreams; i++) {
        streamPromises.push((async () => {
            await new Promise(r => setTimeout(r, i * CONFIG.streamDelay));
            while (!controller.signal.aborted) {
                try {
                    const url = makeUrl(pick(UPLOAD_URLS));
                    await httpPost(url, blobSize, controller.signal);
                    totalBytes += blobSize;
                } catch (e) {
                    if (e.message === 'aborted') break;
                    // On error, try next URL
                }
            }
        })());
    }

    // Speed sampling loop
    const samplingDone = new Promise((resolve) => {
        const interval = setInterval(() => {
            const elapsed = (performance.now() - startTime) / 1000;

            if (!graceDone) {
                if (elapsed > CONFIG.ulGraceTime && totalBytes > 0) {
                    graceDone = true;
                    graceStartTime = performance.now();
                    totalBytes = 0;
                }
                return;
            }

            const measureTime = (performance.now() - graceStartTime) / 1000;
            if (measureTime < 0.2) return;

            const bps = totalBytes / measureTime;
            const mbps = (bps * 8 * CONFIG.overheadFactor) / 1_000_000;
            speeds.push(mbps);

            if (measureTime >= CONFIG.ulMaxTime) {
                clearInterval(interval);
                controller.abort();
                resolve();
            }
        }, CONFIG.pollInterval);

        setTimeout(() => {
            clearInterval(interval);
            controller.abort();
            resolve();
        }, (CONFIG.ulGraceTime + CONFIG.ulMaxTime + 5) * 1000);
    });

    await samplingDone;
    await Promise.allSettled(streamPromises);

    const validSpeeds = speeds.slice(Math.floor(speeds.length * 0.2));
    const upload = validSpeeds.length > 0
        ? parseFloat(Math.max(...validSpeeds).toFixed(2))
        : 0;

    return { upload, elapsed: Math.round((performance.now() - startTime) / 1000) };
}

// ──────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────

/**
 * Run a full xxir speed test.
 * @param {string} nodeId - "xxir-1" or "xxir-2"
 * @returns {Object} Test result in MySpeed-compatible format
 */
export async function runXxirTest(nodeId = 'xxir-1') {
    const startTime = performance.now();

    // 1. Ping
    const pingResult = await pingTest();

    // 2. Download
    const dlResult = await downloadTest(nodeId);

    // 3. Upload
    const ulResult = await uploadTest();

    const totalTime = Math.round((performance.now() - startTime) / 1000);

    return {
        ping: {
            latency: pingResult.latency,
            jitter: pingResult.jitter,
        },
        download: {
            bandwidth: Math.round(dlResult.download * 1250), // Mbps → bytes/s ÷ 1000 (ookla format)
            elapsed: dlResult.elapsed * 1000,
        },
        upload: {
            bandwidth: Math.round(ulResult.upload * 1250),
            elapsed: ulResult.elapsed * 1000,
        },
        server: {
            id: nodeId,
            name: nodeId === 'xxir-1' ? 'CDN节点1 (国内多源)' : 'CDN节点2 (分组随机)',
            host: 'speed.xxir.com',
        },
        elapsed: totalTime,
        result: { id: null },
    };
}
