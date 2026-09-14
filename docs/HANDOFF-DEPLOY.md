# 交接文档：Skill Zoo 部署到知乎黑客松服务器

> 生成时间：2026-09-14
> 交接原因：本文档供下一个 agent 接手部署工作。上一轮 agent 已完成服务器勘察与代码盘点，**未做任何写操作**。

---

## 一、结论先行（给下一个 agent 的三句话）

1. **代码在本地 `D:\资料\项目与代码\Jason`，未部署到服务器任何位置。**
2. **指定的 8090 端口已被另一个项目「支线」占用**，不要直接覆盖，需新开端口。
3. **服务器 Docker 是完全空的**，但已存在用 Vinext 部署的先例，且 nginx 是主要托管方式。推荐**静态部署 + nginx 新端口**。

---

## 二、项目基本情况

| 项 | 值 |
|---|---|
| 项目名 | Skill Zoo（知乎黑客松参赛项目） |
| 定位 | 「让经验长成 Skill，让 Skill 连接到人」——经验资产化 + 双边互补匹配 |
| 本地路径 | `D:\资料\项目与代码\Jason` |
| 应用子目录 | `skill-zoo/`（仓库根还有 `docs/`、`AGENTS.md`、`README.md`） |
| 当前分支 | `feat/studio-mvp-20260914` |
| HEAD | `5ba74d4` — `feat(skill-zoo): 固化 2026-09-14 工作区，领域模型 + 双边匹配 + 孵化室组件` |
| 提交作者 | `ziminglin895-del <250713341+ziminglin895-del@users.noreply.github.com>` |
| 远端 | `https://github.com/Jason-Jin123/Jason.git` |
| 同步状态 | 本地与远端 `0/0` 完全一致，工作区干净 |
| 技术栈 | Next.js 风格 + **Vinext**（构建目标 Cloudflare Workers）+ React + TypeScript + Tailwind/shadcn |
| 构建命令 | `npm run build`（= `vinext build`） |
| 启动命令 | `npm start`（= `wrangler dev --config dist/server/wrangler.json`） |
| 测试 | `npm test`（6/6 通过，已实测） |
| 类型检查 | `npm run typecheck` |

### 关键文档（已在仓库内）
- `docs/PRD-Skill-Zoo.md` — 产品需求、四层架构、分工矩阵
- `docs/NEXT-STEPS.md` — 已修 7 个 bug 清单、后续优先级（P0-A/B/C、P1-A/B/C）
- `docs/DEMO-DELIVERY-PLAN.md` — **交付范围与验收标准，部署前必读**

---

## 三、服务器基本情况

### 连接信息
| 项 | 值 |
|---|---|
| 地址 | `62.234.154.21` |
| SSH | `ssh zhihu@62.234.154.21`，密码 `ZhihuHack2026` |
| 主机名 | `VM-0-5-ubuntu` |
| 系统 | Ubuntu，x86_64 |
| 磁盘 | 40G 总 / 21G 可用（46% 已用） |
| Node | **v18.19.1**（⚠️ 项目要求 v24.14.0，见风险节） |
| npm | 9.2.0 |
| Docker | **已安装但完全为空** — 无容器、无镜像，仅 3 个默认网络。Server 29.1.3，overlayfs |
| docker compose | **未安装**（`docker compose version` 无输出） |
| sudo | ⚠️ **需要密码**，`zhihu` 用户无法免密 sudo |
| nginx | active，master 进程 + 2 worker |

### ⚠️ 端口冲突情况（最重要）

**8090 已被占用**，不是 Docker，是宿主机 nginx 静态托管：

```
/etc/nginx/sites-available/sidequest  ->  listen 8090;  root /var/www/sidequest;
```

该站点返回 200，标题为 **「支线 - 现实生活伴生 Agent」**（Expo / React Native Web 构建产物，2026-09-11 部署）。

**下一个 agent 必须先确认「支线」是否可覆盖，否则请改用空闲端口。**

### 服务器上已部署的全部站点（勿覆盖）

| 端口 | 标题 | root |
|---|---|---|
| 80 | 24级商经空间站 | `/var/www/birthday` |
| 99 | VChot｜证据优先的事件情报 | — |
| 8080 | 凌梓铭 - Xiaomie \| 个人主页 | `/var/www/xiaomie` |
| 8081 | 三国尖塔 | `/var/www/sanguo-spire` |
| 8082 | 立体五子棋 | `/var/www/cubic-gomoku` |
| 8083 | NEStation | — |
| 8085 | 诸天烂尾楼（小说站） | `/var/www/zhutian-lanweilou` |
| 8088 | Movie Searcher | 反代 `127.0.0.1:18088` |
| **8090** | **支线 - 现实生活伴生 Agent** | **`/var/www/sidequest`** |
| 8095 | 断更就会死（小说站） | `/var/www/nitianlu` |
| 8888 | 挂科Hub | `/var/www/guakehub` |
| 9000 | 弹性作息 | `/var/www/schedule-app` |
| 999 | 万源享 — 资源共享平台 | 反代 `127.0.0.1:3457` |

其他 `/var/www/` 下但未在上面出现的目录：`ascent-crucible`、`mc`、`site99`、`zen-jump`、`html`(nginx 默认页)

### 服务器已运行的其他服务（勿动）
```
ubuntu  /home/ubuntu/movie-searcher/src/server.js
ubuntu  /opt/lifelens/venv/bin/python app.py
ubuntu  /var/www/cubic-gomoku/server.js
ubuntu  /home/ubuntu/tank-battle/server.js
ubuntu  /opt/station/server/server.js
ubuntu  /home/ubuntu/nkpingpong/server.js
ubuntu  server.mjs
ubuntu  java -DPaper.IgnoreJavaVersion=true (Minecraft Paper 服务端)
ubuntu  /var/www/sanguo-spire/server.py
skin-st+ /home/skin-steward/skin-steward-demo/node_modules/vinext/dist/cli.js start  ← 同为 Vinext
```

### 已占用端口汇总（勿重复绑定）
`22, 53, 80, 99, 999, 4174, 5000, 6666, 7000, 8080, 8081, 8082, 8083, 8085, 8088, 8090, 8095, 8765, 8888, 9000, 18088, 18089, 3457, 64738`

**建议下一个 agent 选用 8091 / 8096 / 8097**（经查未占用，但请再次确认）

---

## 四、从本机连服务器的方法（已打通，可直接复用）

本机 Windows，只有 OpenSSH（**不支持命令行传密码**）。已安装 **PuTTY**，用 `plink` 可非交互传密码：

```powershell
$plink = "C:\Program Files\PuTTY\plink.exe"
$fp    = "ssh-ed25519 255 SHA256:FNC+ybGZKW2h/Zrv4tH/1F3K5NJxeMUgUG3BaQNAdmc"
$pw    = "ZhihuHack2026"

& $plink -ssh -hostkey $fp -batch -pw $pw zhihu@62.234.154.21 "命令"
```

要点：
- **必须带 `-hostkey $fp`**，否则首次连接会在 host key 确认处卡死（`-batch` 下直接失败）
- 用 `-batch` 禁止任何交互提示，避免挂起
- **不要用 `<<<` 或 bash heredoc**（PowerShell 不支持，且 CRLF 会导致 `$'\r': command not found`）。多行脚本改为普通字符串命令拼接，或用 `$body | & $plink ... "bash -s"`
- 传输文件用 `pscp.exe`（同目录）或 `scp`

---

## 五、推荐部署方案

### 为什么不用 Docker
- Docker 虽已装但**完全为空**，且**未装 compose**
- 8090 跟 Docker 无关，是 nginx
- 部署需要 `sudo`（nginx 配置、`/var/www/`），`zhihu` 无免密 sudo

### 推荐：静态构建 + nginx 新端口

理由：应用本质是 **offline-capable single-browser demo**（见 `DEMO-DELIVERY-PLAN.md` 第 22 行），数据存浏览器 `localStorage`，**不需要服务端**。

步骤草案：
1. 本地 `cd skill-zoo; npm run build`
2. 从 `dist/`（或 `.vinext/`）取静态产物，确认是否含 `client/` 静态目录
3. 上传到服务器 `~/skill-zoo-dist/` 或经 sudo 放 `/var/www/skill-zoo/`
4. 加 nginx server 块监听新端口（如 8091）→ `root /var/www/skill-zoo;`
5. `nginx -t` 验证 → `systemctl reload nginx`

### 备选：Node/Vinext 常驻
服务器已有 Vinext 先例（`skin-steward-demo`，跑在 4174）。可参照其做法用 `vinext start` + `systemd` 常驻 + nginx 反代。但该目录属他人（`skin-steward` 用户），**无权限读取其配置**，需自行摸索。

---

## 六、风险与阻塞项

| 级别 | 问题 | 说明 |
|---|---|---|
| 🔴 高 | **8090 冲突** | 覆盖会毁掉「支线」项目。**必须用户明确授权或换端口** |
| 🔴 高 | **sudo 需密码** | 无法改 nginx 配置 / 写 `/var/www/`。需用户提供 sudo 密码，或由用户自己执行命令 |
| 🟡 中 | **Node 版本** | 服务器 v18.19.1，项目要求 v24.14.0。**建议本地构建后只上传产物，不在服务器 build** |
| 🟡 中 | **迁移未完成** | `components/zoo/` 新组件**尚未挂载为主页面流程**（`DEMO-DELIVERY-PLAN.md` 第 19 行明确说明）；新旧两套存储键（`skill-zoo:v1` / `:v2`）当前并存。**部署的是半迁移状态** |
| 🟡 中 | **凭据已暴露** | 服务器密码已出现在对话记录中。**比赛结束请务必改密** |
| 🟢 低 | `tsconfig.tsbuildinfo` 已提交 | 按 `DEMO-DELIVERY-PLAN.md` 第 16 行要求**不应提交**，但仍进了 `5ba74d4`。应加进 `.gitignore` |

---

## 七、待用户决策的三个问题

1. **8090 上的「支线」是否可覆盖？** 建议改用 8091，完全不动「支线」
2. **sudo 密码给不给？** 还是由用户自己在服务器上执行 agent 提供的命令
3. **接受静态部署方案吗？** （推荐）

---

## 八、上一轮 agent 已完成的只读勘察清单

- ✅ 确认服务器可达（22 / 8090 端口开放，ping 40ms）
- ✅ 打通非交互 SSH（装 PuTTY，用 plink `-hostkey`）
- ✅ 确认 Docker 为空、无 compose
- ✅ 枚举全部 nginx 站点、端口、web root
- ✅ 识别 8090 被「支线」占用
- ✅ 确认 sudo 需密码、Node 版本不匹配
- ✅ 枚举服务器全部运行中服务
- ✅ 盘点本地仓库状态（分支、提交、远端同步）
- ❌ **未做任何写操作**（未上传文件、未改 nginx、未重启服务）
