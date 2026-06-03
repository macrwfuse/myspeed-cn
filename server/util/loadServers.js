import fs from 'node:fs';
import { getJson } from './http.js';

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

const sources = [
    {
        file: "data/servers/ookla.json",
        url: "https://www.speedtest.net/api/js/servers?limit=20",
        format: (row) => ({
            name: row.name,
            sponsor: row.sponsor,
            country: row.country,
            cc: row.cc,
            distance: row.distance,
            host: row.host
        }),
        isCurrent: (entries) => entries.length === 0 || entries.every(([, value]) =>
            value !== null && typeof value === "object" && "sponsor" in value && "name" in value)
    },
    {
        file: "data/servers/librespeed.json",
        url: "https://librespeed.org/backend-servers/servers.php",
        format: (row) => row.name,
        isCurrent: () => true
    }
];

const isFileCurrent = (file, isCurrent) => {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
        if (parsed === null || typeof parsed !== "object") return false;
        return isCurrent(Object.entries(parsed));
    } catch {
        return false;
    }
};

for (const {file, url, format, isCurrent} of sources) {
    if (fs.existsSync(file) && isFileCurrent(file, isCurrent)) continue;

    getJson(url)
        .then((data) => {
            let servers = Object.fromEntries((data ?? []).map((row) => [row.id, format(row)]));

            // Merge CN servers into ookla list (CN servers take priority)
            if (file.includes("ookla")) {
                servers = { ...servers, ...CN_SERVERS };
            }

            fs.writeFileSync(file, JSON.stringify(servers, null, 4));
        })
        .catch(() => {
            // If online fetch fails, still write CN servers
            if (file.includes("ookla") && !fs.existsSync(file)) {
                fs.writeFileSync(file, JSON.stringify(CN_SERVERS, null, 4));
            }
            console.error("Could not load servers from online, using embedded CN servers");
        });
}
