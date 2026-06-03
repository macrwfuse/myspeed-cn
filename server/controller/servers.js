import fs from 'node:fs';

// Embedded CN speedtest nodes (from spiritLHLS/speedtest.net-CN-ID)
const CN_SERVERS = {
    "5396": {"name":"Suzhou","sponsor":"China Telecom JiangSu 5G","country":"China","cc":"CN","distance":0,"host":"4gsuzhou1.speedtest.jsinfo.net.prod.hosts.ooklaserver.net"},
    "16204": {"name":"Suzhou","sponsor":"JSQY - Suzhou","country":"China","cc":"CN","distance":0,"host":"speedtest.jsqiuying.com"},
    "17265": {"name":"Zhonghe","sponsor":"FarEasTone Telecom","country":"Taiwan","cc":"CN","distance":0,"host":"fetsz1.seed.net.tw.prod.hosts.ooklaserver.net"},
    "24447": {"name":"Shanghai","sponsor":"China Unicom 5G","country":"China","cc":"CN","distance":0,"host":"mobile.shunicomtest.com.prod.hosts.ooklaserver.net"},
    "30852": {"name":"Kunshan","sponsor":"Duke Kunshan University","country":"China","cc":"CN","distance":0,"host":"speedtest.dukekunshan.edu.cn"},
    "36663": {"name":"Zhenjiang","sponsor":"China Telecom JiangSu 5G","country":"China","cc":"CN","distance":0,"host":"5gzhenjiang.speedtest.jsinfo.net.prod.hosts.ooklaserver.net"},
    "43752": {"name":"Beijing","sponsor":"BJ Unicom","country":"China","cc":"CN","distance":0,"host":"beijing.unicomtest.com"},
    "59387": {"name":"NingBo","sponsor":"浙江电信","country":"China","cc":"CN","distance":0,"host":"cesu-nb.zjtelecom.com.cn.prod.hosts.ooklaserver.net"},
    "73010": {"name":"Helan","sponsor":"Arslan Telecom","country":"Pakistan","cc":"CN","distance":0,"host":"arslantel.online.prod.hosts.ooklaserver.net"}
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

    // Always merge CN servers (CN servers take priority)
    servers = { ...servers, ...CN_SERVERS };
    ooklaServers = servers;

    return ooklaServers;
}

export const getByMode = (mode) => {
    if (mode === "ookla") return getOoklaServers();
    if (mode === "libre") return getLibreServers();
}
