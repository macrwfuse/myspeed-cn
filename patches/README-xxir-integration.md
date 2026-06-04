# xxir 测速节点集成指南

## 概述

将 [speed.xxir.com](https://speed.xxir.com/) 的下载测速节点集成到 MySpeed 中，作为第 4 种测速 provider（与 Ookla、LibreSpeed、Cloudflare 并列）。

### 与原版 provider 的区别

| 特性 | Ookla/LibreSpeed/Cloudflare | xxir |
|------|---------------------------|------|
| 实现方式 | 调用 CLI 二进制文件 | Node.js 原生 HTTP 多流并发 |
| 下载源 | 专用测速服务器 | 国内真实 CDN 文件（抖音/京东/百度等） |
| 需要下载二进制 | ✅ | ❌ |
| 适合中国大陆 | ⚠️ 需要可用节点 | ✅ 直接使用国内 CDN |

## 文件清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `server/util/providers/xxir.js` | xxir 测速引擎核心（多流并发下载/上传/延迟测试） |

### 需要修改的原版文件

以下文件不在 myspeed-cn 仓库中（属于原版 MySpeed），需要手动修改：

| 文件 | 修改内容 |
|------|---------|
| `server/util/providers/parseData.js` | 添加 `parseXxir` 函数和 `case "xxir"` 分支 |
| `server/util/speedtest.js` | 添加 xxir 模式分支（不需要 CLI 二进制） |
| `server/tasks/speedtest.js` | 处理 xxir 的 serverId 逻辑 |

### 已修改的文件

| 文件 | 修改内容 |
|------|---------|
| `server/controller/servers.js` | 导入 XXIR_SERVERS，合并到 ookla 服务器列表 |
| `server/util/loadServers.js` | 定义 XXIR_SERVERS，写入 ookla.json |

## 修改步骤

### 1. 复制 xxir.js 到项目

```bash
cp server/util/providers/xxir.js /path/to/myspeed/server/util/providers/
```

### 2. 修改 parseData.js

在 `server/util/providers/parseData.js` 中添加：

```javascript
// 在文件末尾添加 parseXxir 函数
export const parseXxir = (test) => {
    let ping = Math.round(test.ping.latency);
    let jitter = test.ping.jitter ? parseFloat(test.ping.jitter.toFixed(2)) : null;
    let download = roundSpeed(test.download.bandwidth);
    let upload = roundSpeed(test.upload.bandwidth);
    let time = Math.round((test.download.elapsed + test.upload.elapsed) / 1000);
    let serverName = test.server?.name ?? null;
    let serverHost = test.server?.host ?? null;
    return { ping, jitter, download, upload, time, resultId: null, serverName, serverHost };
};

// 在 parseData switch 中添加 case
export const parseData = (provider, data) => {
    switch (provider) {
        case "ookla":      return parseOokla(data);
        case "libre":      return parseLibre(data);
        case "cloudflare": return parseCloudflare(data);
        case "xxir":       return parseXxir(data);    // ← 新增
        default:           throw { message: "Invalid provider" };
    }
};
```

### 3. 修改 speedtest.js

在 `server/util/speedtest.js` 的 default export 函数开头添加：

```javascript
import { runXxirTest } from './providers/xxir.js';

export default async (mode, serverId, serverUrl) => {
    // xxir 模式：Node.js 原生执行，不需要 CLI 二进制
    if (mode === "xxir") {
        const nodeId = serverId || "xxir-1";
        return await runXxirTest(nodeId);
    }

    // ... 原有代码不变 ...
};
```

### 4. 修改 tasks/speedtest.js

在 `server/tasks/speedtest.js` 的 `run()` 函数中，修改 serverId 获取逻辑：

```javascript
export const run = async (retryAuto = false) => {
    setRunning(true);
    let mode = await config.getValue("provider");
    if (mode === "none") { setRunning(false); throw { message: "No provider selected" }; }

    let serverId, serverUrl;
    if (mode === "xxir") {
        // xxir 使用 xxirId 配置，值为 "xxir-1" 或 "xxir-2"
        serverId = await config.getValue("xxirId");
        if (serverId === "none" || !serverId) serverId = "xxir-1";
        serverUrl = undefined;
    } else {
        serverId = mode === "cloudflare" ? 0 : await config.getValue(mode + "Id");
        serverUrl = mode === "libre" ? await config.getValue("libreUrl") : undefined;
        if (serverId === "none") serverId = undefined;
        if (serverUrl === "none") serverUrl = undefined;
        if (mode === "libre" && serverUrl) serverId = undefined;
    }

    let speedtest = await (retryAuto ? speedTest(mode) : speedTest(mode, serverId, serverUrl));
    // ... 后续代码不变 ...
};
```

### 5. 前端适配（可选）

在前端 provider 选择器中添加 xxir 选项。需要修改客户端代码：

```javascript
// 在 provider 下拉菜单中添加
{ value: "xxir", label: "CDN测速 (xxir)" }
```

当选择 xxir 时，服务器选择器应显示：
- CDN节点1 (国内多源)
- CDN节点2 (分组随机)

## 测速原理

### 下载测速

```
1. 开启 15 个并发 HTTP GET 流
2. 每个流从国内 CDN 下载真实文件（APK/EXE/DEB 等）
3. 前 2 秒为宽限期（TCP 慢启动）
4. 之后每 200ms 采样一次速度
5. 取最高速度作为结果
6. 最长测试 20 秒
```

### 上传测速

```
1. 开启 5 个并发 HTTP POST 流
2. 向百度/字节跳动的公开接口发送随机数据
3. 前 2 秒为宽限期
4. 之后每 200ms 采样一次速度
5. 最长测试 15 秒
```

### 延迟测试

```
1. 向 CDN 端点发送 5 次 HTTP GET
2. 取最小 RTT 作为延迟
3. 计算相邻 RTT 差值的加权平均作为抖动
```

## 速度计算公式

```
速度(Mbps) = 已传输字节数 / 已用秒数 × 8 × 1.06 / 1,000,000
```

其中 1.06 是 TCP/IP 协议开销补偿系数。

## 节点说明

### xxir-1 (CDN节点1)

从 30 个国内 CDN URL 中随机选择一个下载。覆盖：
- 抖音 APK、AcFun 直播、七牛工具
- 支付宝小程序 Studio、百度网盘
- 新浪新闻、新浪微博、搜狐新闻
- 网易 UU、拼多多、京东
- 剪映、凤凰网视频、VIVO 应用商店等

### xxir-2 (CDN节点2)

从 7 个分组中随机选一组，再从该组随机选一个 URL（两层随机）。

## 测试验证

```bash
# 单独测试 xxir 引擎
node --experimental-vm-modules test-xxir.js
```

## 注意事项

1. **不需要下载 CLI 二进制**：xxir 模式完全用 Node.js HTTP 实现
2. **上传端点**：使用百度和字节跳动的公开日志接口，可能被限流
3. **CDN 文件可用性**：第三方 CDN 文件可能随时失效，建议定期更新 URL 列表
4. **与 Ookla 结果不可比**：xxir 使用真实 CDN 而非专用测速服务器，速度通常偏低
5. **防火墙**：确保服务器可以访问国内 CDN（适合部署在中国大陆的服务器）
