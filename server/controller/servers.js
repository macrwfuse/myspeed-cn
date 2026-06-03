import fs from 'node:fs';

// xxir CDN-based speed test nodes (speed.xxir.com)
export const XXIR_SERVERS = {
    "xxir-1": {
        name: "自动选择 (地理就近)",
        sponsor: "speed.xxir.com",
        country: "China",
        cc: "CN",
        distance: 0,
        host: "speed.xxir.com",
        type: "xxir",
        description: "自动检测网络出口，选择延迟最低的CDN节点组"
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