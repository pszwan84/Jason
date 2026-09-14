# Skill Zoo

让经验长成 Skill，让 Skill 连接到人。

当前版本是单浏览器 Mock 社交商城：18 条种子 Skill、热度榜、赞/评、交换沉淀、加同行。货在 `data/skills.json`，热度只影响排序、换不到货。六个界面仍由 `app/page.tsx` 渲染。

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

`npm test` 使用 Node 内置测试运行器，不需要 API key。覆盖规则提炼、互补打分、热度公式、赞/评约束、交换解锁与商城排序。

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

使用 `data/skills.json` 与 `data/people.json` 的 Mock 社区。收藏、赞、评、交换、好友存在浏览器 `skill-zoo:v1`。交换卡不会发给真人。规则提炼不是大模型。热度是演示加权。

## 当前限制

- 没有认证、服务端 API、数据库或多用户同步。
- 对方同意交换是本机「模拟对方同意」。
- `npm run lint` 仍有基线错误，主要来自 shadcn UI 模板；类型检查、测试和生产构建应通过。
- `tsconfig.tsbuildinfo` 是本地缓存，不应提交。

本次导入来源于已上线版本提交 `34ec1ace430b476a09177e7372e51ebdf2e7b08d`。保留原版角色素材，未加入环境变量、凭证、依赖目录或构建产物。
