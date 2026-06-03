import express from 'express';
import password from '../middlewares/password.js';
import * as serverController from '../controller/servers.js';
import * as interfaces from '../util/loadInterfaces.js';
import { getJson } from '../util/http.js';
import packageJson from '../../package.json';

const version = packageJson.version;
const remote_url = "https://api.github.com/repos/gnmyt/myspeed/releases/latest";
const app = express.Router();

app.get("/version", password(false), async (req, res) => {
    if (process.env.PREVIEW_MODE === "true") return res.json({local: version, remote: "0"});

    try {
        const data = await getJson(remote_url);
        res.json({local: version, remote: data.tag_name.replace("v", "")});
    } catch (e) {
        res.json({local: version, remote: "0"});
    }
});

app.get("/server/:provider", password(false), (req, res) => {
    if (!["ookla", "libre", "xxir"].includes(req.params.provider))
        return res.status(400).json({message: "Invalid provider"});

    res.json(serverController.getByMode(req.params.provider));
});

app.get("/interfaces", password(false), async (req, res) => {
    res.json(interfaces.interfaces);
});

// 获取网络出口IP、运营商和地理位置信息
app.get("/network-info", password(false), async (req, res) => {
    try {
        const data = await getJson("http://ip-api.com/json/?lang=zh-CN");
        res.json({
            ip: data.query,
            isp: data.isp,
            org: data.org,
            country: data.country,
            region: data.regionName,
            city: data.city,
            lat: data.lat,
            lon: data.lon
        });
    } catch (e) {
        res.status(500).json({message: "Failed to fetch network info"});
    }
});

export default app;