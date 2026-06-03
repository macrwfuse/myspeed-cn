import fs from 'node:fs';

// xxir CDN-based speed test nodes (speed.xxir.com)
export const XXIR_SERVERS = {
    "xxir-1": {
        name: "CDN节点1 (国内多源)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        description: "30个国内CDN源随机下载测速（抖音/京东/百度/阿里等）"
    },
    "xxir-2": {
        name: "CDN节点2 (分组随机)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        description: "7组CDN源随机选择一组后随机下载测速"
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