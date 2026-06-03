/**
 * xxir Speed Test Provider — Enhanced CN Edition
 *
 * Integrates nodes from:
 *   - speed.xxir.com (CDN multi-source)
 *   - speedtest.im (运营商专线 + 教育网)
 *   - Additional ISP-specific endpoints
 *
 * Node categories:
 *   🌐 CDN 自动选择 — 多区域CDN，自动就近
 *   📡 运营商专线 — 移动/电信/联通/教育网
 *   🌍 海外节点 — CloudFlare 等
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

// ──────────────────────────────────────────────
// All speed test nodes
// ──────────────────────────────────────────────

const REGION_ENDPOINTS = {
    // ═══════════════════════════════════════════
    // 🌐 CDN 自动选择节点 (speed.xxir.com)
    // ═══════════════════════════════════════════

    // 华东 (电信/联通骨干) - 抖音、京东、百度等
    east: {
        name: '华东节点 (CDN)',
        category: 'cdn',
        ping: 'https://lf3-cdn-tos.bytecdntp.com/',
        pingFallback: 'https://www.baidu.com/favicon.ico',
        download: [
            "https://lf9-apk.ugapk.cn/package/apk/aweme/5072_340301/aweme_douyin-huidu-gw-aweme-3430_v5072_340301_eea8_1747058635.apk",
            "https://lf3-cdn-tos.bytegoofy.com/obj/douyin-pc-client/7044145585217083655/releases/8293088/1.0.8/win32-ia32/douyin-v1.0.8-win32-ia32-douyin.exe",
            "https://lf6-cdn-tos.bytegoofy.com/obj/douyin-pc-client/7044145585217083655/releases/8293088/1.0.8/win32-ia32/douyin-v1.0.8-win32-ia32-douyin.exe",
            "https://lf3-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe",
            "https://lf6-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe",
            "https://lf9-package.vlabstatic.com/obj/faceu-packages/Jianying_split_4_8_0_10791_jianyingpro_0.exe",
            "https://apk.360buyimg.com/build-cms/V5.2.0-4258-800000136-bazaar-64bit.apk",
            "https://download.jr.jd.com/downapp/jrapp_jr9631.apk",
        ],
    },
    // 华北 (阿里云、百度云CDN)
    north: {
        name: '华北节点 (CDN)',
        category: 'cdn',
        ping: 'https://maponline0.bdimg.com/tile/?qt=vtile&x=0&y=0&z=17',
        pingFallback: 'https://www.baidu.com/favicon.ico',
        download: [
            "https://gw.alipayobjects.com/os/volans-demo/93211a67-0eed-40ff-8a48-f6c137a88781/MiniProgramStudio-3.1.3.exe",
            "https://8c8947-1956185621.antpcdn.com:19001/b/pkg-ant.baidu.com/issue/netdisk/LinuxGuanjia/4.17.7/baidunetdisk_4.17.7_amd64.deb",
            "https://1270e8-3086970414.antpcdn.com:19001/b/pkg-ant.baidu.com/issue/netdisk/yunguanjia/BaiduNetdisk_7.55.1.101.exe",
            "https://cdn.aixifan.com/downloads/AcfunLive-Setup-1.9.0.200-ReleaseX64_6d5c40.exe",
            "https://devtools.qiniu.com/linux/amd64/qrsctl",
            "https://uu.gdl.netease.com/4112/UU-4.68.1.exe",
        ],
    },
    // 华南 (腾讯、网易CDN)
    south: {
        name: '华南节点 (CDN)',
        category: 'cdn',
        ping: 'https://lf3-cdn-tos.bytecdntp.com/',
        pingFallback: 'https://cdn.staticfile.org/favicon.ico',
        download: [
            "https://wwwstatic.vivo.com.cn/vivoportal/files/download/app/20231026/350bda07c8a0719919bcadbf5aea3538.apk",
            "https://cd.pddpic.com/android_dev/2023-11-08/a35eaee8e1f9f018cc40ace12931f7a2.apk",
            "https://cd.pddpic.com/android_dev/2024-06-26/06027b4121edcd1f106d992128a7124b.apk",
            "https://cd.pddpic.com/volantis-open/volantis-common/app/com.xunmeng.workBench/Release_1834716.exe",
            "https://rls.tapimg.com/pub2/202310/64a7c775fa5503fc30f46c6fea6f9faf.apk",
            "https://open-image.ws.126.net/android_phone_release-sp_open-v9.9.9-v0a5b3c1dc0df472bb2fb057d0a5426c3.apk",
            "https://open-image.ws.126.net/android_phone_release-sp_open-v9.10.1-vb7b79d6b531448baaca3a81e7fbdc13f.apk",
        ],
    },
    // 西南 (新浪、搜狐CDN)
    west: {
        name: '西南节点 (CDN)',
        category: 'cdn',
        ping: 'https://lf3-cdn-tos.bytecdntp.com/',
        pingFallback: 'https://cdn.bootcdn.net/favicon.ico',
        download: [
            "https://downapp.sina.cn/m/06/sinaNews_8.27.0_1719288606_4386_3538_armeabi-v7a.apk",
            "https://i1.sinaimg.cn/edu/sinaopen/SinaOpencourse_V2.02.apk",
            "https://upgrade.k.sohu.com/upgrade/SohuNews_V7.3.6_0421110326_online_1003.apk",
            "https://statics.itc.cn/lt-app/sohumobile_official_gray_optimizeRelease_4_1.0.3_01161850.apk",
            "https://pkg.sinaimg.cn/weibo_13.11.1_vcode_6489_wm_3333_1001_so_32_64_weibo_5395_205935.apk",
            "https://video19.ifeng.com/video09/2022/07/06/p6950362006465552946-102-162611.mp4",
        ],
    },

    // ═══════════════════════════════════════════
    // 📡 运营商专线节点 (speedtest.im)
    // ═══════════════════════════════════════════

    // 移动节点 — 北京&河北专线
    'cmcc-bj': {
        name: '移动 · 北京&河北专线',
        category: 'isp',
        isp: '中国移动',
        ping: 'http://211.136.30.118:9000/speed/10.data',
        pingFallback: 'http://221.179.144.126:9000/speed/10.data',
        download: [
            'http://211.136.30.118:9000/speed/100000.data',
            'http://221.179.144.126:9000/speed/100000.data',
            'http://211.136.30.102:9001/speed/100000.data',
            'http://211.136.30.98:9000/speed/100000.data',
            'http://211.136.30.110:9000/speed/100000.data',
            'http://211.136.30.122:9000/speed/100000.data',
            'http://211.136.30.114:9000/speed/100000.data',
            'http://211.136.30.126:9000/speed/100000.data',
            'http://211.136.30.102:9000/speed/100000.data',
            'http://211.136.30.106:9000/speed/100000.data',
        ],
        upload: [
            'http://211.136.30.118:9000/speed/10.data',
            'http://221.179.144.126:9000/speed/10.data',
            'http://211.136.30.102:9001/speed/10.data',
            'http://211.136.30.98:9000/speed/10.data',
            'http://211.136.30.110:9000/speed/10.data',
            'http://211.136.30.122:9000/speed/10.data',
        ],
    },

    // 移动节点 — 全国多线
    'cmcc-all': {
        name: '移动 · 全国多线',
        category: 'isp',
        isp: '中国移动',
        ping: 'http://111.11.36.122:9000/speed/10.data',
        pingFallback: 'http://111.63.234.18:9000/speed/10.data',
        download: [
            'http://111.11.36.122:9000/speed/100000.data',
            'http://111.11.20.226:9000/speed/100000.data',
            'http://111.63.234.18:9000/speed/100000.data',
            'http://111.11.78.14:9000/speed/100000.data',
            'http://111.11.32.170:9000/speed/100000.data',
            'http://111.11.20.234:9000/speed/100000.data',
            'http://111.11.78.18:9000/speed/100000.data',
        ],
        upload: [
            'http://111.11.36.122:9000/speed/10.data',
            'http://111.11.20.226:9000/speed/10.data',
            'http://111.63.234.18:9000/speed/10.data',
            'http://111.11.78.14:9000/speed/10.data',
        ],
    },

    // 电信节点 — 广东专线
    'ct-gd': {
        name: '电信 · 广东专线',
        category: 'isp',
        isp: '中国电信',
        ping: 'http://sz.10000gd.tech:12348/shmfile/100',
        pingFallback: 'http://gz.10000gd.tech:12348/shmfile/100',
        download: [
            'http://sz.10000gd.tech:12348/shmfile/100',
            'http://gz.10000gd.tech:12348/shmfile/100',
            'http://jm.10000gd.tech:12348/shmfile/100',
            'http://yf.10000gd.tech:12348/shmfile/100',
            'http://zh.10000gd.tech:12348/shmfile/100',
            'http://zq.10000gd.tech:12348/shmfile/100',
            'http://jy.10000gd.tech:12348/shmfile/100',
            'http://st.10000gd.tech:12348/shmfile/100',
            'http://hz.10000gd.tech:12348/shmfile/100',
            'http://sg.10000gd.tech:12348/shmfile/100',
            'http://sw.10000gd.tech:12348/shmfile/100',
            'http://hy.10000gd.tech:12348/shmfile/100',
            'http://zj.10000gd.tech:12348/shmfile/100',
            'http://cz.10000gd.tech:12348/shmfile/100',
            'http://qy.10000gd.tech:12348/shmfile/100',
            'http://mz.10000gd.tech:12348/shmfile/100',
            'http://mm.10000gd.tech:12348/shmfile/100',
            'http://zs.10000gd.tech:12348/shmfile/100',
            'http://yj.10000gd.tech:12348/shmfile/100',
            'http://dg.10000gd.tech:12348/shmfile/100',
            'http://fs.10000gd.tech:12348/shmfile/100',
            'http://yb.10000gd.tech:12348/shmfile/100',
            'http://yd.10000gd.tech:12348/shmfile/100',
            'http://yx.10000gd.tech:12348/shmfile/100',
            'http://zsj.10000gd.tech:12348/shmfile/100',
        ],
        upload: [
            'http://sz.10000gd.tech:12348/upload',
            'http://gz.10000gd.tech:12348/upload',
            'http://jm.10000gd.tech:12348/upload',
            'http://yf.10000gd.tech:12348/upload',
            'http://zh.10000gd.tech:12348/upload',
            'http://zq.10000gd.tech:12348/upload',
            'http://jy.10000gd.tech:12348/upload',
            'http://st.10000gd.tech:12348/upload',
            'http://hz.10000gd.tech:12348/upload',
            'http://sg.10000gd.tech:12348/upload',
        ],
    },

    // 联通节点 — 全国多线
    'cu-all': {
        name: '联通 · 全国多线',
        category: 'isp',
        isp: '中国联通',
        ping: 'http://113.229.96.166:8800/Dat/upServer',
        pingFallback: 'http://60.22.32.158:8800/Dat/upServer',
        download: [
            'http://113.229.96.166:8800/Dat/DownloadServer',
            'http://60.22.32.158:8800/Dat/DownloadServer',
        ],
        upload: [
            'http://113.229.96.166:8800/Dat/upServer',
            'http://60.22.32.158:8800/Dat/upServer',
        ],
    },

    // ═══════════════════════════════════════════
    // 🎓 教育网节点 (speedtest.im)
    // ═══════════════════════════════════════════

    'edu-ustc': {
        name: '教育网 · 中科大',
        category: 'edu',
        ping: 'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        pingFallback: 'https://test.nju.edu.cn/backend/empty.php?cors=1',
        download: [
            'https://test.ustc.edu.cn/backend/garbage.php?cors=1&ckSize=100',
            'https://test.nju.edu.cn/backend/garbage.php?cors=1&ckSize=100',
        ],
        upload: [
            'https://test.ustc.edu.cn/backend/empty.php?cors=1',
            'https://test.nju.edu.cn/backend/empty.php?cors=1',
        ],
    },

    'edu-tsinghua': {
        name: '教育网 · 清华',
        category: 'edu',
        ping: 'https://iptv.tsinghua.edu.cn/st/empty.php?cors=1',
        pingFallback: 'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        download: [
            'https://iptv.tsinghua.edu.cn/st/garbage.php?cors=1&ckSize=100',
            'https://test.ustc.edu.cn/backend/garbage.php?cors=1&ckSize=100',
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
            'https://ftp.sjtu.edu.cn/speedtest/backend/garbage.php?cors=1&ckSize=100',
            'https://test.ustc.edu.cn/backend/garbage.php?cors=1&ckSize=100',
        ],
        upload: [
            'https://ftp.sjtu.edu.cn/speedtest/backend/empty.php?cors=1',
            'https://test.ustc.edu.cn/backend/empty.php?cors=1',
        ],
    },

    'edu-multi': {
        name: '教育网 · 多线',
        category: 'edu',
        ping: 'https://219.140.61.101/backend/empty.php?cors=1',
        pingFallback: 'https://119.36.86.250:81/backend/empty.php?cors=1',
        download: [
            'https://219.140.61.101/backend/garbage.php?cors=1&ckSize=100',
            'https://119.36.86.250:81/backend/garbage.php?cors=1&ckSize=100',
            'http://211.67.53.2/backend/garbage.php?cors=1&ckSize=100',
        ],
        upload: [
            'https://219.140.61.101/backend/empty.php?cors=1',
            'https://119.36.86.250:81/backend/empty.php?cors=1',
            'http://211.67.53.2/backend/empty.php?cors=1',
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

    // Ping
    const pingResult = await pingTest(bestRegion);

    // Download
    const dlResult = await downloadTest(bestRegion);

    // Upload
    const ulResult = await uploadTest(bestRegion);

    const totalTime = Math.round((performance.now() - startTime) / 1000);

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
            host: 'speed.xxir.com',
        },
        elapsed: totalTime,
        result: { id: null },
    };
}
