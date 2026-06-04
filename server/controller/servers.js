import fs from 'node:fs';

// xxir CDN-based speed test nodes + speedtest.im ISP/EDU nodes
export const XXIR_SERVERS = {
    // ── 🌐 CDN 自动选择 ──
    "xxir-auto": {
        name: "自动选择 (地理就近)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        category: "cdn",
        description: "自动检测网络出口，选择延迟最低的节点"
    },
    "east": {
        name: "华东节点 (抖音/京东)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        category: "cdn",
        description: "字节跳动/京东/剪映等华东CDN源"
    },
    "north": {
        name: "华北节点 (阿里/百度)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        category: "cdn",
        description: "阿里云/百度云/爱奇艺等华北CDN源"
    },
    "south": {
        name: "华南节点 (拼多多/网易)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        category: "cdn",
        description: "拼多多/网易/vivo等华南CDN源"
    },
    "west": {
        name: "西南节点 (新浪/搜狐)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        category: "cdn",
        description: "新浪/搜狐/凤凰网等西南CDN源"
    },

    // ── 📡 运营商专线 (speedtest.im) ──
    "cmcc-bj": {
        name: "移动 · 北京&河北专线",
        sponsor: "speedtest.im",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speedtest.im",
        type: "xxir",
        category: "isp",
        isp: "中国移动",
        description: "中国移动北京&河北专线节点"
    },
    "cmcc-all": {
        name: "移动 · 全国多线",
        sponsor: "speedtest.im",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speedtest.im",
        type: "xxir",
        category: "isp",
        isp: "中国移动",
        description: "中国移动全国多线节点"
    },
    "ct-gd": {
        name: "电信 · 广东专线",
        sponsor: "speedtest.im",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speedtest.im",
        type: "xxir",
        category: "isp",
        isp: "中国电信",
        description: "中国电信广东专线节点 (广东全省覆盖)"
    },
    "cu-all": {
        name: "联通 · 全国多线",
        sponsor: "speedtest.im",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speedtest.im",
        type: "xxir",
        category: "isp",
        isp: "中国联通",
        description: "中国联通全国多线节点"
    },

    // ── 🎓 教育网 ──
    "edu-ustc": {
        name: "教育网 · 中科大",
        sponsor: "speedtest.im",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "test.ustc.edu.cn",
        type: "xxir",
        category: "edu",
        description: "中国科学技术大学测速节点"
    },
    "edu-tsinghua": {
        name: "教育网 · 清华",
        sponsor: "speedtest.im",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "iptv.tsinghua.edu.cn",
        type: "xxir",
        category: "edu",
        description: "清华大学测速节点"
    },
    "edu-sjtu": {
        name: "教育网 · 上交",
        sponsor: "speedtest.im",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "ftp.sjtu.edu.cn",
        type: "xxir",
        category: "edu",
        description: "上海交通大学测速节点"
    },
    "edu-multi": {
        name: "教育网 · 多线",
        sponsor: "speedtest.im",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speedtest.im",
        type: "xxir",
        category: "edu",
        description: "教育网多线节点 (武汉/湖北)"
    },
    "edu-nju-fs": {
        name: "教育网 · 南大文件服务",
        sponsor: "南京大学",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "fs.nju.edu.cn",
        type: "xxir",
        category: "edu",
        description: "南京大学文件服务测速节点 (fs.nju.edu.cn)"
    },
    "edu-nju-test": {
        name: "教育网 · 南大测速",
        sponsor: "南京大学",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "test.nju.edu.cn",
        type: "xxir",
        category: "edu",
        description: "南京大学 LibreSpeed 测速节点 (test.nju.edu.cn)"
    },

    // ── 🌍 海外 ──
    "cloudflare": {
        name: "CloudFlare · 全球CDN",
        sponsor: "CloudFlare",
        country: "Global",
        cc: "US",
        distance: 0,
        host: "speed.cloudflare.com",
        type: "xxir",
        category: "global",
        description: "CloudFlare 全球CDN测速节点"
    },
};

let ooklaServers;
let libreServers;

export const getLibreServers = () => {
    if (libreServers) return libreServers;

    if (fs.existsSync("./data/servers/librespeed.json")) {
        libreServers = fs.readFileSync("./data/servers/librespeed.json");
        libreServers = JSON.parse(libreServers);

        return libreServers;
    }

    return [];
}

export const getOoklaServers = () => {
    if (ooklaServers) return ooklaServers;

    let servers = {};
    if (fs.existsSync("./data/servers/ookla.json")) {
        try {
            servers = JSON.parse(fs.readFileSync("./data/servers/ookla.json", "utf8"));
        } catch { }
    }

    // Merge xxir nodes (xxir takes priority)
    ooklaServers = { ...servers, ...XXIR_SERVERS };

    return ooklaServers;
}

export const getByMode = (mode) => {
    if (mode === "ookla") return getOoklaServers();
    if (mode === "libre") return getLibreServers();
    if (mode === "xxir") return XXIR_SERVERS;
}
