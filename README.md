# Team workspace

团队项目协作仓库。

项目通过独立分支和 Pull Request 提交，审核后合并至 main。

## 本地运行

```bash
cd skill-zoo
npm ci
npm run db:migrate
npm run dev
```

本地运行使用 D1 SQLite。部署时通过 Wrangler 提供：`TRIPO_API_KEY`（仅服务端读取）、可选的 `TRIPO_MODEL`、允许生成用户 ID 列表 `TRIPO_USER_IDS`，以及管理员 ID 列表 `ADMIN_USER_IDS`。

Tripo 采用异步任务：作者提交形象描述后，服务端保存任务 ID，前端轮询状态，完成后展示渲染图和临时 GLB 下载链接。创建超时不会自动重试，应先在 Tripo 控制台核对任务，避免重复消耗额度。

## 验证命令

```bash
npm test
npm run typecheck
npm run build
```

`npm run lint` 当前仍会报告部分 shadcn 基础组件的既有无障碍规则问题，已记录为 UI 质量专项。
