import fs from 'node:fs';

// xxir-based speed test nodes (university + global, CDN/ISP nodes removed)
export const XXIR_SERVERS = {
    // ── 🎓 教育网 ──
    "edu-ustc": {
        name: "教育网 · 中科大",
        sponsor: "中国科学技术大学",
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
        sponsor: "清华大学",
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
        sponsor: "上海交通大学",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "ftp.sjtu.edu.cn",
        type: "xxir",
        category: "edu",
        description: "上海交通大学测速节点"
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

// ── 🇨🇳 国内 Ookla Speedtest 节点 ──
// 来源: spiritLHLS/speedtest.net-CN-ID
export const OOKLA_CN_SERVERS = {
    "5396": {
        name: "苏州",
        sponsor: "江苏电信 5G",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "4gsuzhou1.speedtest.jsinfo.net"
    },
    "16204": {
        name: "苏州",
        sponsor: "JSQY",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speedtest.jsqiuying.com"
    },
    "24447": {
        name: "上海",
        sponsor: "上海联通 5G",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "mobile.shunicomtest.com"
    },
    "30852": {
        name: "昆山",
        sponsor: "昆山杜克大学",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speedtest.dukekunshan.edu.cn"
    },
    "36663": {
        name: "镇江",
        sponsor: "江苏电信 5G",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "5gzhenjiang.speedtest.jsinfo.net"
    },
    "43752": {
        name: "北京",
        sponsor: "北京联通",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "beijing.unicomtest.com"
    },
    "59387": {
        name: "宁波",
        sponsor: "浙江电信",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "cesu-nb.zjtelecom.com.cn"
    },
    "17265": {
        name: "中和",
        sponsor: "远传电信 (台湾)",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "fetsz1.seed.net.tw"
    },
    "73010": {
        name: "贺兰",
        sponsor: "Arslan Telecom",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "arslantel.online"
    }
};

// ── 🎓 国内 LibreSpeed 教育网节点 ──
// 来源: builtin-node-config.js 节点6方案
export const LIBRE_CN_SERVERS = {
    "cn-edu-ustc": {
        id: "cn-edu-ustc",
        name: "教育网 · 中科大 (LibreSpeed)",
        server: "https://test.ustc.edu.cn/backend/",
        dlURL: "garbage.php",
        ulURL: "empty.php",
        pingURL: "empty.php",
        getIpURL: "getIP.php"
    },
    "cn-edu-tsinghua": {
        id: "cn-edu-tsinghua",
        name: "教育网 · 清华 (LibreSpeed)",
        server: "https://iptv.tsinghua.edu.cn/st/",
        dlURL: "garbage.php",
        ulURL: "empty.php",
        pingURL: "empty.php",
        getIpURL: "getIP.php"
    },
    "cn-edu-sjtu": {
        id: "cn-edu-sjtu",
        name: "教育网 · 上交 (LibreSpeed)",
        server: "https://ftp.sjtu.edu.cn/speedtest/backend/",
        dlURL: "garbage.php",
        ulURL: "empty.php",
        pingURL: "empty.php",
        getIpURL: "getIP.php"
    },
    "cn-edu-nju": {
        id: "cn-edu-nju",
        name: "教育网 · 南大 (LibreSpeed)",
        server: "https://test.nju.edu.cn/backend/",
        dlURL: "garbage.php",
        ulURL: "empty.php",
        pingURL: "empty.php",
        getIpURL: "getIP.php"
    },
    "cn-edu-whut": {
        id: "cn-edu-whut",
        name: "教育网 · 武汉理工 (LibreSpeed)",
        server: "https://219.140.61.101/backend/",
        dlURL: "garbage.php",
        ulURL: "empty.php",
        pingURL: "empty.php",
        getIpURL: "getIP.php"
    },
    "cn-edu-hubei": {
        id: "cn-edu-hubei",
        name: "教育网 · 湖北节点 (LibreSpeed)",
        server: "https://119.36.86.250:81/backend/",
        dlURL: "garbage.php",
        ulURL: "empty.php",
        pingURL: "empty.php",
        getIpURL: "getIP.php"
    },
    "cn-edu-wh": {
        id: "cn-edu-wh",
        name: "教育网 · 武汉节点 (LibreSpeed)",
        server: "http://211.67.53.2/backend/",
        dlURL: "garbage.php",
        ulURL: "empty.php",
        pingURL: "empty.php",
        getIpURL: "getIP.php"
    }
};

let ooklaServers;
let libreServers;

export const getLibreServers = () => {
    if (libreServers) return libreServers;

    let servers = {};
    if (fs.existsSync("./data/servers/librespeed.json")) {
        try {
            servers = JSON.parse(fs.readFileSync("./data/servers/librespeed.json", "utf8"));
        } catch { }
    }

    // Merge CN education LibreSpeed nodes
    libreServers = { ...servers, ...LIBRE_CN_SERVERS };

    return libreServers;
}

export const getOoklaServers = () => {
    if (ooklaServers) return ooklaServers;

    let servers = {};
    if (fs.existsSync("./data/servers/ookla.json")) {
        try {
            servers = JSON.parse(fs.readFileSync("./data/servers/ookla.json", "utf8"));
        } catch { }
    }

    // Merge CN Ookla nodes + xxir nodes (xxir takes priority)
    ooklaServers = { ...servers, ...OOKLA_CN_SERVERS, ...XXIR_SERVERS };

    return ooklaServers;
}

export const getByMode = (mode) => {
    if (mode === "ookla") return getOoklaServers();
    if (mode === "libre") return getLibreServers();
    if (mode === "xxir") return XXIR_SERVERS;
}
