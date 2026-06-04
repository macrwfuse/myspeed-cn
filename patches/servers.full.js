import fs from 'node:fs';

// University + global speed test nodes
export const XXIR_SERVERS = {
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
        description: "南京大学文件服务测速节点"
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
        description: "南京大学 LibreSpeed 测速节点"
    },
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

    // Merge university + global nodes
    ooklaServers = { ...servers, ...XXIR_SERVERS };

    return ooklaServers;
}

export const getByMode = (mode) => {
    if (mode === "ookla") return getOoklaServers();
    if (mode === "libre") return getLibreServers();
    if (mode === "xxir") return getOoklaServers(); // xxir nodes are in ookla list
}
