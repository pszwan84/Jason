# Skill Zoo demo delivery plan

## Verified baseline — 2026-09-14
- Repository: `D:/资料/项目与代码/Jason`, application: `skill-zoo/`.
- Branch: `feature/skill-zoo-ui`; HEAD and remote feature branch: `17d86f64f177ec669a7fad086fc42cfb9df93c8f`.
- Existing working changes are retained. The claimed separate server MVP is not present in the inspected tree or remote heads.
- Runtime: Node v24.14.0, npm 11.9.0. Dependencies are already installed.
- Existing implementation uses deterministic extraction and browser-local persistence. It has no authenticated multi-user backend.

## Baseline work completed
- Added repository structure and preservation rules in `AGENTS.md`.
- Added `npm run typecheck` and `npm test` without installing dependencies.
- Four tests pass: experience extraction, blank input, serializable field filtering, and persistence roundtrip/failure reporting.
- Typecheck and all five production-build stages pass.
- Lint baseline: 28 errors across the page and existing UI primitives; not yet fixed.
- Existing trailing blank-line findings remain in the root README and global styles. Typecheck generated `skill-zoo/tsconfig.tsbuildinfo`; retain it locally and do not include it in a commit.
- The user approved implementation with “实施”. The local demo scope below is authorized; server/database/deployment remain outside scope.
- Active shell is still `app/page.tsx`. Catalog lives in `skill-zoo/data/{skills,people}.json` (18 skills, 8 people). Heat, likes, comments, exchange unlock and friends are in `lib/heat.ts` + `lib/social.ts`.
- `components/zoo/` was deleted as unmounted dead code. Do not restore it for this demo.

## Delivery scope — approved by the user on 2026-09-14
Deliver an offline-capable, single-browser demo with the existing six-screen visual design. Present local persistence, sample data, rules-based extraction and simulated counterpart approval accurately.

1. Establish repeatable typecheck, domain tests, lint and production-build checks without new global dependencies.
2. Separate domain types, sample fixtures and key feature components from the oversized page incrementally, preserving current user changes and visuals.
3. Repair the full local lifecycle: input → editable five-step draft → published Skill → searchable detail; retain fields after refresh.
4. Implement the PRD's bilateral supply-demand scoring with visible inputs, weights and explanations; describe scores as demo ranking scores rather than calibrated probabilities.
5. Save complete exchange-card form data, bind cards to skills, enforce explicit simulated review and openness rules, and carry accepted exchanges into tasks and derived Skill lineage.
6. Add URL-backed screen/detail navigation, functional browser back/forward, useful empty states, and storage recovery/error feedback without silently destroying user data.
7. Verify a complete demonstration and mobile layout. Deliver an honest README, a short demonstration script, limitations and remaining server work.

## Out of scope for this proposal
- Authentication, shared server data, database schemas/migrations, model/API credentials, cloud services or public deployment.
- Unverified teammate code, fabricated claims of real AI generation or messages sent to another user.
- Git push or deletion. A local checkpoint commit may be prepared after validation; stage only reviewed task files.

## Acceptance
- Typecheck, domain tests, lint and build succeed, with any unavoidable baseline issue documented accurately.
- Real browser verification passes publishing, filtering, exchange review, gated access, co-creation and refresh persistence.
- Direct navigation and browser history work, keyboard controls have accessible names, and narrow screens do not overflow.
- The demo can be started using documented commands without API keys.

---

## 交付记录 — 2026-09-14（第二轮，agent）

现状与实测以 `docs/HANDOFF.md` 为准；本节只记这份计划里已被交付的范围条目。

| 范围条目 | 状态 | 证据 |
|---|---|---|
| 3 修复生命周期（发布 → 搜索 → 详情，刷新后字段保留） | 已交付 | 孵化室发布 + 刷新复测；`icon` 不再落盘（`lib/persist.ts`） |
| 4 双边供需打分可见 | 已交付（上一轮） | 推荐弹窗展示 α/β/γ 与三项点积 |
| 5 交换卡表单、绑定 skill、显式模拟审核与开放规则、成交进任务与族谱 | 已交付（本轮补齐开放规则分叉） | 三条门三条路；贡献解锁见 `lib/social.ts`；族谱按 `parentIds` |
| 6 URL 支撑的屏/详情导航、后退前进、空状态、存储容错 | 已交付（本轮） | `lib/routes.ts`；`?page=…&skill=…`；popstate 还原；`isIconType` 挡住坏图标而不是清库 |
| 7 完整演示与移动端验证、诚实的 README / 演示脚本 / 限制说明 | 已交付 | `docs/DEMO-SCRIPT.md` 1→5 + 四条新路径；400px 无横向溢出 |

基线告警：`npm run lint` 仍有 35 条历史问题（a11y 与 `data.get()` 的 no-base-to-string），本轮未新增，未修。
后端（认证 / 共享数据 / 模型密钥 / 部署）仍按上表 out of scope，未动。
