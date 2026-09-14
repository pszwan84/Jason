# Skill Zoo

让经验长成 Skill，让 Skill 连接到人。

当前版本包含刘看山动态主角色，以及探索、我的栖息地、孵化室、共创实验室、消息和关系图谱六个界面。当前页面仍以原型状态机渲染；新增的领域状态机和本地数据校验已经独立完成，正在接入主页面。

## 本地运行

需要 Node.js 22.13.0 或更高版本及 npm。

```sh
cd skill-zoo
npm ci
npm run dev
```

打开终端输出的本地地址。

## 可复现检查

```sh
npm test
npm run typecheck
npm run build
```

`npm test` 使用 Node 内置测试运行器，不需要 API key。当前 6 项领域测试通过，覆盖确定性提炼、双边匹配、交换卡审核、共创前置条件和本地存储失败保护。

## 构建

```sh
npm run build
```

## 目录

- `app/`：页面、布局与响应式样式。
- `components/`、`hooks/`、`lib/`：复用组件和工具。
- `public/kanshan/`：刘看山动图及减少动态效果时使用的静态图片。
- `package-lock.json`：锁定项目依赖。
- `.openai/hosting.json`：现有 Sites 项目关联配置，不含访问凭证。部署到其他项目时需由维护者调整关联。

## 原型范围

使用示例社区数据。当前旧页面的收藏、编辑、讨论和共创任务等状态使用浏览器本地演示；新领域层使用 `skill-zoo:v2` 结构化存储，并保留旧版 `skill-zoo:v1` 的迁移入口。交换卡不会发送给真实用户，规则提炼也不会冒充大模型生成。

## 当前限制

- 尚未接入认证、服务端 API、数据库或多用户同步。
- 新领域组件位于 `components/zoo/`，需要下一步挂载到 `app/page.tsx` 后，浏览器才能完整走新状态机。
- `npm run lint` 仍有 28 条错误，主要来自现有 shadcn UI 模板和旧版单文件页面；类型检查、测试和生产构建均通过。
- `tsconfig.tsbuildinfo` 是 TypeScript 增量检查生成的本地缓存，不应提交。

本次导入来源于已上线版本提交 `34ec1ace430b476a09177e7372e51ebdf2e7b08d`。保留原版角色素材，未加入环境变量、凭证、依赖目录或构建产物。
