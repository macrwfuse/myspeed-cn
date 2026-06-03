import fs from 'node:fs';

// xxir CDN-based speed test nodes (speed.xxir.com)
export const XXIR_SERVERS = {
    "xxir-auto": {
        name: "自动选择 (地理就近)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        description: "自动检测网络出口，选择延迟最低的CDN节点组"
    },
    "xxir-east": {
        name: "华东节点 (抖音/京东)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        description: "字节跳动/京东/剪映等华东CDN源"
    },
    "xxir-north": {
        name: "华北节点 (阿里/百度)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        description: "阿里云/百度云/爱奇艺等华北CDN源"
    },
    "xxir-south": {
        name: "华南节点 (拼多多/网易)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        description: "拼多多/网易/vivo等华南CDN源"
    },
    "xxir-west": {
        name: "西南节点 (新浪/搜狐)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        description: "新浪/搜狐/凤凰网等西南CDN源"
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