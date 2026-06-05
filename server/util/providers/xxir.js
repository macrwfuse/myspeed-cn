/**
 * xxir Speed Test Provider — Enhanced CN Edition
 *
 * Integrates nodes from:
 *   - University-hosted LibreSpeed endpoints (中科大/清华/上交/南大)
 *   - CloudFlare global CDN
 *
 * Node categories:
 *   🎓 教育网 — 高校 LibreSpeed 节点
 *   🌍 海外节点 — CloudFlare 等
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ──────────────────────────────────────────────
// All speed test nodes
// ──────────────────────────────────────────────

const REGION_ENDPOINTS = {
    // ═══════════════════════════════════════════
    // 🎓 教育网节点 (university-hosted)
    // ═══════════════════════════════════════════

    'edu-ustc': {
        name: '教育网 · 中科大',
        category: 'edu',
        ping: 'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        pingFallback: 'https://fs.nju.edu.cn/speed/empty.php?cors=1',
        download: [
            'https://test.ustc.edu.cn/backend/garbage.php?cors=1&ckSize=500',
            'https://fs.nju.edu.cn/speed/garbage.php?cors=1&ckSize=500',
        ],
        upload: [
            'https://test.ustc.edu.cn/backend/empty.php?cors=1',
            'https://fs.nju.edu.cn/speed/empty.php?cors=1',
        ],
    },

    'edu-tsinghua': {
        name: '教育网 · 清华',
        category: 'edu',
        ping: 'https://iptv.tsinghua.edu.cn/st/empty.php?cors=1',
        pingFallback: 'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        download: [
            'https://iptv.tsinghua.edu.cn/st/garbage.php?cors=1&ckSize=500',
            'https://test.ustc.edu.cn/backend/garbage.php?cors=1&ckSize=500',
        ],
        upload: [
            'https://iptv.tsinghua.edu.cn/st/empty.php?cors=1',
            'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        ],
    },

    'edu-sjtu': {
        name: '教育网 · 上交',
        category: 'edu',
        ping: 'https://ftp.sjtu.edu.cn/speedtest/backend/empty.php?cors=1',
        pingFallback: 'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        download: [
            'https://ftp.sjtu.edu.cn/speedtest/backend/garbage.php?cors=1&ckSize=500',
            'https://test.ustc.edu.cn/backend/garbage.php?cors=1&ckSize=500',
        ],
        upload: [
            'https://ftp.sjtu.edu.cn/speedtest/backend/empty.php?cors=1',
            'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        ],
    },

    // 南京大学 · 文件服务 (fs.nju.edu.cn)
    'edu-nju-fs': {
        name: '教育网 · 南大文件服务',
        category: 'edu',
        ping: 'https://fs.nju.edu.cn/speed/empty.php?cors=1',
        pingFallback: 'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        download: [
            'https://fs.nju.edu.cn/speed/garbage.php?cors=1&ckSize=500',
        ],
        upload: [
            'https://fs.nju.edu.cn/speed/empty.php?cors=1',
        ],
    },

    // 南京大学 · LibreSpeed 测速 (test.nju.edu.cn → Anubis保护, 改用fs.nju.edu.cn)
    'edu-nju-test': {
        name: '教育网 · 南大测速',
        category: 'edu',
        ping: 'https://fs.nju.edu.cn/speed/empty.php?cors=1',
        pingFallback: 'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        download: [
            'https://fs.nju.edu.cn/speed/garbage.php?cors=1&ckSize=500',
        ],
        upload: [
            'https://fs.nju.edu.cn/speed/empty.php?cors=1',
        ],
    },

    // ═══════════════════════════════════════════
    // 🌍 海外节点
    // ═══════════════════════════════════════════

    'cloudflare': {
        name: 'CloudFlare · 全球CDN',
        category: 'global',
        ping: 'https://speed.cloudflare.com/__down?bytes=0',
        pingFallback: 'https://1.1.1.1/cdn-cgi/trace',
        download: [
            'https://speed.cloudflare.com/__down?bytes=25000000',
            'https://speed.cloudflare.com/__down?bytes=10000000',
        ],
        upload: [
            'https://speed.cloudflare.com/__up',
        ],
        isUpload: true,
    },
};

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

const CONFIG = {
    dlStreams: 12,
    ulStreams: 5,
    streamDelay: 100,
    dlGraceTime: 2,
    ulGraceTime: 2,
    dlMaxTime: 15,
    ulMaxTime: 12,
    pingCount: 3,
    overheadFactor: 1.06,
    pollInterval: 200,
    ulBlobSize: 1024 * 1024,
    regionTimeout: 5000,
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

function httpGet(url, onProgress, signal, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.get(url, { headers: { 'Cache-Control': 'no-cache' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                httpGet(res.headers.location, onProgress, signal, timeout).then(resolve).catch(reject);
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
                if (onProgress) onProgress(bytes);
            });
            res.on('end', () => resolve(bytes));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(timeout, () => { req.destroy(); reject(new Error('timeout')); });
        if (signal) {
            signal.addEventListener('abort', () => { req.destroy(); reject(new Error('aborted')); });
        }
    });
}

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
        const chunkSize = 64 * 1024;
        let sent = 0;
        const buf = Buffer.alloc(chunkSize);
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
// Ping with fallback
// ──────────────────────────────────────────────

async function pingUrl(url, timeout) {
    const start = performance.now();
    await httpGet(makeUrl(url), null, null, timeout);
    return performance.now() - start;
}

async function pingWithFallback(ep, count = CONFIG.pingCount) {
    const latencies = [];

    // Try primary
    for (let i = 0; i < count; i++) {
        try {
            latencies.push(await pingUrl(ep.ping, CONFIG.regionTimeout));
        } catch { }
        await new Promise(r => setTimeout(r, 50));
    }

    // Try fallback
    if (latencies.length === 0 && ep.pingFallback) {
        for (let i = 0; i < count; i++) {
            try {
                latencies.push(await pingUrl(ep.pingFallback, CONFIG.regionTimeout));
            } catch { }
            await new Promise(r => setTimeout(r, 50));
        }
    }

    return latencies;
}

// ──────────────────────────────────────────────
// Region detection — ping all, pick fastest
// ──────────────────────────────────────────────

async function detectBestRegion() {
    const regions = Object.keys(REGION_ENDPOINTS);
    const results = {};

    await Promise.allSettled(regions.map(async (region) => {
        const ep = REGION_ENDPOINTS[region];
        const latencies = await pingWithFallback(ep);
        if (latencies.length > 0) {
            results[region] = Math.min(...latencies);
        }
    }));

    let bestRegion = 'east';
    let bestLatency = Infinity;
    for (const [region, latency] of Object.entries(results)) {
        if (latency < bestLatency) {
            bestLatency = latency;
            bestRegion = region;
        }
    }

    console.log(`xxir: detected best region = ${bestRegion} (${bestLatency.toFixed(0)}ms)`);
    return bestRegion;
}

// ──────────────────────────────────────────────
// Ping test
// ──────────────────────────────────────────────

async function pingTest(regionKey, count = 5) {
    const region = REGION_ENDPOINTS[regionKey];
    const latencies = [];

    // Try primary
    for (let i = 0; i < count; i++) {
        try {
            latencies.push(await pingUrl(region.ping, CONFIG.regionTimeout));
        } catch { }
        await new Promise(r => setTimeout(r, 100));
    }

    // Try fallback
    if (latencies.length === 0 && region.pingFallback) {
        for (let i = 0; i < count; i++) {
            try {
                latencies.push(await pingUrl(region.pingFallback, CONFIG.regionTimeout));
            } catch { }
            await new Promise(r => setTimeout(r, 100));
        }
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
// Download test
// ──────────────────────────────────────────────

async function downloadTest(regionKey) {
    const region = REGION_ENDPOINTS[regionKey];
    const controller = new AbortController();
    let totalBytes = 0;
    const startTime = performance.now();
    let graceDone = false;
    let graceStartTime = startTime;
    const speeds = [];

    const getDownloadUrl = () => makeUrl(pick(region.download));

    const streamBytes = new Array(CONFIG.dlStreams).fill(0);

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
                }
            }
        })());
    }

    const samplingDone = new Promise((resolve) => {
        const interval = setInterval(() => {
            const elapsed = (performance.now() - startTime) / 1000;

            if (!graceDone) {
                if (elapsed > CONFIG.dlGraceTime && totalBytes > 0) {
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

            if (measureTime >= CONFIG.dlMaxTime) {
                clearInterval(interval);
                controller.abort();
                resolve();
            }
        }, CONFIG.pollInterval);

        setTimeout(() => {
            clearInterval(interval);
            controller.abort();
            resolve();
        }, (CONFIG.dlGraceTime + CONFIG.dlMaxTime + 5) * 1000);
    });

    await samplingDone;
    await Promise.allSettled(streamPromises);

    const validSpeeds = speeds.slice(Math.floor(speeds.length * 0.2));
    const download = validSpeeds.length > 0
        ? parseFloat(Math.max(...validSpeeds).toFixed(2))
        : 0;

    return { download, elapsed: Math.round((performance.now() - startTime) / 1000) };
}

// ──────────────────────────────────────────────
// Upload test
// ──────────────────────────────────────────────

function getUploadUrls(regionKey) {
    const region = REGION_ENDPOINTS[regionKey];
    if (region.upload && region.upload.length > 0) return region.upload;
    // Fallback to generic upload endpoints
    return [
        "https://mbd.baidu.com/ztbox?action=zpblog",
        "https://vcs.zijieapi.com/vc/setting?aid=6383&pageId=6241",
    ];
}

async function uploadTest(regionKey) {
    const controller = new AbortController();
    let totalBytes = 0;
    const startTime = performance.now();
    let graceDone = false;
    let graceStartTime = startTime;
    const speeds = [];

    const blobSize = CONFIG.ulBlobSize;
    const uploadUrls = getUploadUrls(regionKey);

    const streamPromises = [];
    for (let i = 0; i < CONFIG.ulStreams; i++) {
        streamPromises.push((async () => {
            await new Promise(r => setTimeout(r, i * CONFIG.streamDelay));
            while (!controller.signal.aborted) {
                try {
                    const url = makeUrl(pick(uploadUrls));
                    await httpPost(url, blobSize, controller.signal);
                    totalBytes += blobSize;
                } catch (e) {
                    if (e.message === 'aborted') break;
                }
            }
        })());
    }

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
// LibreSpeed CLI binary test for edu nodes
// ──────────────────────────────────────────────

function getLibreBinaryPath() {
    const binName = `librespeed-cli${process.platform === 'win32' ? '.exe' : ''}`;
    const binPath = path.join(process.cwd(), 'bin', binName);
    return fs.existsSync(binPath) ? binPath : null;
}

function buildLibreServerConfig(regionKey) {
    const ep = REGION_ENDPOINTS[regionKey];
    if (!ep || ep.category !== 'edu') return null;

    // Extract base URL from the first download endpoint
    const dlUrl = ep.download[0];
    const parsed = new URL(dlUrl);
    const serverBase = `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/garbage\.php.*$/, '')}`;

    return [{
        id: 1,
        name: ep.name,
        server: serverBase,
        dlURL: 'garbage.php',
        ulURL: 'empty.php',
        pingURL: 'empty.php',
        getIpURL: 'getIP.php'
    }];
}

async function runLibreBinaryTest(regionKey) {
    let binaryPath = getLibreBinaryPath();

    // Try to download the binary if not present
    if (!binaryPath) {
        try {
            const { load } = await import('./loadLibre.js');
            await load();
            binaryPath = getLibreBinaryPath();
        } catch {}
    }
    if (!binaryPath) return null;

    const serverConfig = buildLibreServerConfig(regionKey);
    if (!serverConfig) return null;

    // Write temp server config
    const tempDir = path.join(process.cwd(), 'data', 'servers');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tempJsonPath = path.join(tempDir, `xxir_edu_${regionKey}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(serverConfig, null, 2));

    const args = [
        '--json',
        '--duration=8',
        '--local-json=' + tempJsonPath,
        '--server=1'
    ];

    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        const proc = spawn(binaryPath, args, { windowsHide: true });
        proc.stdout.on('data', (buf) => { stdout += buf.toString(); });
        proc.stderr.on('data', (buf) => { stderr += buf.toString(); });

        proc.on('error', () => resolve(null));
        proc.on('exit', () => {
            try {
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    if (!line.startsWith('{') && !line.startsWith('[')) continue;
                    let data = JSON.parse(line);
                    if (Array.isArray(data)) data = data[0];
                    if (data && (data.ping !== undefined || data.download !== undefined)) {
                        // LibreSpeed CLI output format:
                        // { ping, jitter, download, upload, ... }  (values in Mbps)
                        const regionInfo = REGION_ENDPOINTS[regionKey];
                        let host = 'unknown';
                        try { host = new URL(regionInfo.ping).host; } catch {}

                        resolve({
                            ping: {
                                latency: parseFloat((data.ping || 0).toFixed(2)),
                                jitter: parseFloat((data.jitter || 0).toFixed(2)),
                            },
                            download: {
                                bandwidth: Math.round((data.download || 0) * 125000), // Mbps → bytes/s * 0.8 → bandwidth
                                elapsed: (data.download_test_duration || 8) * 1000,
                            },
                            upload: {
                                bandwidth: Math.round((data.upload || 0) * 125000),
                                elapsed: (data.upload_test_duration || 8) * 1000,
                            },
                            server: {
                                id: `xxir-${regionKey}`,
                                name: regionInfo.name,
                                host: host,
                            },
                            elapsed: Math.round((data.download_test_duration || 0) + (data.upload_test_duration || 0) + (data.ping_test_duration || 0)),
                            result: { id: null },
                            _source: 'libre-cli'
                        });
                        return;
                    }
                }
            } catch {}
            resolve(null);
        });

        // Timeout safety
        setTimeout(() => { try { proc.kill(); } catch {} }, 60000);
    });
}

// ──────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────

export async function runXxirTest(nodeId = 'xxir-auto') {
    const startTime = performance.now();

    let bestRegion;
    if (nodeId === 'xxir-auto' || nodeId === 'xxir-1') {
        bestRegion = await detectBestRegion();
    } else if (nodeId.startsWith('xxir-')) {
        bestRegion = nodeId.replace('xxir-', '');
        if (!REGION_ENDPOINTS[bestRegion]) {
            bestRegion = await detectBestRegion();
        }
    } else if (REGION_ENDPOINTS[nodeId]) {
        bestRegion = nodeId;
    } else {
        bestRegion = await detectBestRegion();
    }

    const regionInfo = REGION_ENDPOINTS[bestRegion];

    // For edu nodes: try LibreSpeed CLI binary first (more accurate)
    if (regionInfo.category === 'edu') {
        try {
            const binaryResult = await runLibreBinaryTest(bestRegion);
            if (binaryResult) {
                console.log(`xxir: edu node ${bestRegion} tested via LibreSpeed CLI binary`);
                return binaryResult;
            }
        } catch (e) {
            console.log(`xxir: LibreSpeed CLI failed for ${bestRegion}, falling back to HTTP: ${e.message}`);
        }
    }

    // Fallback: Node.js HTTP multi-stream test
    const pingResult = await pingTest(bestRegion);
    const dlResult = await downloadTest(bestRegion);
    const ulResult = await uploadTest(bestRegion);

    const totalTime = Math.round((performance.now() - startTime) / 1000);

    let host = 'test.ustc.edu.cn';
    try {
        const pingUrl = regionInfo.ping || regionInfo.pingFallback || '';
        host = new URL(pingUrl).host || host;
    } catch {}

    return {
        ping: {
            latency: pingResult.latency,
            jitter: pingResult.jitter,
        },
        download: {
            bandwidth: Math.round(dlResult.download * 1250),
            elapsed: dlResult.elapsed * 1000,
        },
        upload: {
            bandwidth: Math.round(ulResult.upload * 1250),
            elapsed: ulResult.elapsed * 1000,
        },
        server: {
            id: nodeId,
            name: regionInfo.name,
            host: host,
        },
        elapsed: totalTime,
        result: { id: null },
    };
}
