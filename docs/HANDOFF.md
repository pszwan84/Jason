# 交接信息

仓库 `D:\资料\项目与代码\Jason` ｜ 分支 `feat/studio-mvp-20260914` ｜ HEAD `d393477`

远端 `origin/feat/studio-mvp-20260914` 已同步（0/0）。全部提交作者 `ziminglin895-del`。

---

## 一、本次完成的三个提交

| 提交 | 内容 |
|---|---|
| `c894865` | 新增 `docs/HANDOFF-DEPLOY.md`（服务器勘察结果） |
| `238c804` | 停止跟踪 `tsconfig.tsbuildinfo`（`git rm --cached` + `.gitignore` 规则） |
| `d393477` | 删除未挂载死代码，测试改为覆盖实际运行模块 |

验证：`typecheck` 通过、`build` 五阶段通过、`npm test` 5/5、`localhost:3000` 返回 200。

---

## 二、代码架构现状（已查证）

**活代码路径**：`app/page.tsx`（73 行，单体组件）→ `lib/persist.ts`（localStorage 键 `skill-zoo:v1`）

**实际被 page.tsx 使用的 lib**：
- `lib/match.ts` — `complementScore(tags)`，page.tsx 第 57 行渲染 `{complementScore(kit.tags).score}%`
- `lib/distill.ts` — 规则提炼，孵化室「提炼成 Skill」按钮
- `lib/bilateral-match.ts` — `normalizeTags` 等
- `lib/persist.ts` — v1 读写
- `lib/utils.ts` — 被 60 个 shadcn UI 组件使用

**模板**：`skills` 数组 7 条内置数据写死在 page.tsx 第 14-21 行。`DEMO_KIT` / `starterKit()` 在第 26-27 行。

---

## 三、已删除内容（`d393477`，确认无引用）

```
components/zoo/explore.tsx      6718B
components/zoo/incubator.tsx    6987B
components/zoo/primitives.tsx   2909B
components/zoo/AGENTS.md
lib/domain.ts                   6375B
lib/fixtures.ts                 6261B
lib/model.ts                    2473B
lib/navigation.ts               1575B
lib/storage.ts                  7513B
lib/zoo-store.ts                3079B
tests/domain.test.mjs           4318B（原 6 项测试，测的是上述被删模块）
```

**删除依据**：`app/` 下只有 `layout.tsx` + `page.tsx`，无其他路由。这三个组件只互相 import，从未挂载。`lib/{domain,fixtures,model,navigation,storage,zoo-store}` 仅被这三个孤儿引用。

新增 `tests/match.test.mjs`（5 项）覆盖实际在用的 `match.ts` + `distill.ts`。

---

## 四、待办 / 已知问题

1. **`docs/NEXT-STEPS.md` 与 `docs/DEMO-DELIVERY-PLAN.md` 已部分过时** —— 两文档均描述 `components/zoo/*` 为「已实现待接入」，该目录已删除。第 18-19 行的描述需更新。
2. **`docs/PRD-Skill-Zoo.md` 的模块三（交换卡闭环状态机）、模块四（持久化 API）落地代码已随本次删除移除** —— PRD 仍描述这些功能。若后续要实现，需重写（原实现有测试覆盖，可参考 `git show 5ba74d4`）。
3. **8090 端口**：服务器上已被「支线 - 现实生活伴生 Agent」占用，**未部署，勿覆盖**。详见 `docs/HANDOFF-DEPLOY.md`。
4. **`skill-zoo/package.json` 的 `test` 脚本**仍为 `tests/*.test.mjs`，当前匹配到 1 个文件，正常。

---

## 五、本地命令

```bash
cd D:\资料\项目与代码\Jason\skill-zoo
npm run dev        # http://localhost:3000/
npm run typecheck
npm test           # 5/5
npm run build      # vinext build
npm run lint       # oxlint（基线 27 条错误，集中在 components/ui/* 上游代码）
```

本地 Node v24.9.0（服务器只有 v18.19.1，**不要在服务器上 build**）。

---

## 六、Git 身份

仓库级配置已固定，新提交自动使用 noreply 地址，不会再触发 GH007：

```
user.name  = ziminglin895-del
user.email = 250713341+ziminglin895-del@users.noreply.github.com
```
