# 交接：Skill Zoo 卡片社交 Demo

> 写给下一个 agent / 队长。只写已经实测过的，不写愿望。
> 实测人：豪哥。脚本 1→5 **全过**。日期 2026-09-14。

## 给下一个 agent 的四句话

1. 活代码只有 `skill-zoo/app/page.tsx` → `lib/*` + `data/*.json`。不要复活 `components/zoo/`。
2. **没有货币。** 热度只排序。社交原子是 **卡**：用自己牌组里的一张去换别人的一张。
3. **没有真 AI。** 孵化室 / 共创主持人是规则引擎，同一句话永远改同一处。路演就这么讲。
4. **8090 不要动**（被「支线」占着）。详见 `docs/HANDOFF-DEPLOY.md`。未授权不许部署、不许改 `.env`、不许删文件。

---

## 仓库

| 项 | 值 |
|---|---|
| 路径 | `D:\资料\项目与代码\Jason` |
| 应用 | `D:\资料\项目与代码\Jason\skill-zoo` |
| 分支 | `feat/studio-mvp-20260914` |
| 已推远端 HEAD | `ee18419` — `feat(skill-zoo): 卡片制换卡 + 伪AIGC规则共拟` |
| 交接时未推（若在） | 合成命名改成双卡标题（`c.title × c.offer`，不再用作者名 `c.to`） |
| 远端 | `https://github.com/Jason-Jin123/Jason.git` |
| Git 作者 | `ziminglin895-del <250713341+ziminglin895-del@users.noreply.github.com>` |
| 本地 | Node 要 ≥22.13；实测机是 v24。服务器只有 v18，**不要在服务器 build** |
| 跑起来 | `cd D:\资料\项目与代码\Jason\skill-zoo` → `npm run dev` → http://localhost:3000/ |

旧 localStorage 键 `skill-zoo:v1`。若页面还是 7 张卡、没有 `SKILL CARD`：DevTools → Application → Local Storage → 删这个键 → 刷新。

---

## 这一版是什么（评委一句话）

知乎黑客松 Demo：**人用方法卡交换**，不是 SkillHub 那种安装 `SKILL.md`，也不是积分商城。

货架 50 张卡 / 13 个作者，JSON 在：

- `D:\资料\项目与代码\Jason\skill-zoo\data\skills.json`
- `D:\资料\项目与代码\Jason\skill-zoo\data\people.json`

热度：`10×赞 + 6×评 + 15×成交`。只影响热度榜位次。

---

## 实测记录（1→5 全过，按按钮原文）

完整点法见 `D:\资料\项目与代码\Jason\docs\DEMO-SCRIPT.md`。下面是豪哥实测结果，不要再猜。

| # | 路径 | 结果 |
|---|---|---|
| 1 商城 | Skill Zoo | 「50 个方法，13 位作者」；默认热度榜；NO.1 法律论文精读 陈沐 **热度 330**；有 SKILL CARD。作业反馈怎么写：0 → 赞 10 → 围炉一句 16，榜上上移 |
| 2 推荐 | 为什么推荐给我 | `演示互补分 = 0.5×… + 0.5×… − 0.2×…。现在 60%（outbound 0.71 / inbound 0.50 / overlap 0.00）。不是概率。` 无旧示例文案 |
| 3 换卡 | 系统韧性分析 → 申请交换 | 下拉「论文创新判断 · 王展韬」；消息里模拟对方同意、加为同行；栖息地牌组出现「系统韧性分析 换来的」；关系图出现林然 |
| 4 伪 AIGC | 孵化室贴经历 | 「收成一张草稿卡」；刘看山气泡 5 步 +「这不是大模型…一共三轮」；「第三步太虚了」改第 3 步；反例写入局限；「改标题叫口径判断」改标题；第四轮输入框禁用 |
| 5 共创 | 共创实验室 | 标题带「系统韧性分析」；三问后 5/6；合成成功。**旧 bug：** 搜到的名字是「林然的共创方法」（用了作者名）。代码已改为 `系统韧性分析 × 论文创新判断`，**以工作区为准，推之前再走一遍第 5 步** |

主线能给评委点。不要再吹「社交生态已经完整」。

---

## 活代码（不要找错目录）

```
app/page.tsx          六屏单体壳
lib/catalog.ts        读 JSON
lib/heat.ts           热度公式
lib/social.ts         赞 / 评 / 沉淀 / 好友
lib/distill.ts        经历 → 5 步（确定性）
lib/coach.ts          孵化室三轮商量
lib/host.ts           共创三问
lib/bilateral-match.ts 互补分（PRD 公式）
lib/persist.ts        localStorage 键 skill-zoo:v1
tests/*.test.mjs      15 项，npm test
```

`components/zoo/` 已删，git 里有尸体（`5ba74d4`），不要拷回来。

---

## 下一轮方案（只打磨实测露出来的洞）

按评委追问顺序，不要开新页、不要上货币、不要接真模型。

### P0 — 合成命名（交接时已改代码，需复测第 5 步）

根因：`acceptedCards.map(c => c.to)`，`to` 是作者「林然」。  
应收：`c.title`（要的卡）× `c.offer`（拿出的卡）→ `系统韧性分析 × 论文创新判断`。  
复测：清第 5 步后的合成卡，或清 localStorage 整条重走 3→5，Skill Zoo 搜「×」应命中双卡名。tag 仍是「共创方法」，旧搜法也能兜底。

### P1 — 评委还会问、现在仍假的

1. **贡献后开放 vs 交换后开放** 点起来还是同一条（都走换卡）。围炉评论只加热度，不解锁。若要分叉：贡献后开放 = 交反例 → 消息里「模拟作者通过」→ 解锁。
2. **消息没有入站信。** 现在只有你发出去的申请。路演够用；若要热闹，从目录抽 1–2 张「林然向你申请换论文创新判断」。
3. **URL 全程 `/`。** 刷新回商城。低成本：`?page=colab&skill=3`。
4. **点作者没有主页。** 50 张卡，点「陈沐」应列出他的牌。没有的话商城仍像货架。
5. **共创任务清单 6 项仍有预勾。** 主持人三问才是真进度；6 项勾选是旧壳，容易和 5/6 打架。

### P2 — 别做

- 积分 / 代币 / 热度换次数
- 真 LLM、真流式
- REST API、账号、8090 部署
- 再扩货架（50 够）
- 拆 `page.tsx`、改视觉体系

模块一（知乎链接 + LLM）若队长强要：继续用 `distill.ts` 吃**粘贴正文**，标题就写规则提炼。现场不要调模型。

---

## 路演怎么讲（对着屏幕说）

- 「这是示例社区，交换不会发给真人。」
- 「热度 330 是 18 个赞 + 5 条评 + 8 次成交，公式写在热度榜下面。」
- 「60% 是供需点积，不是匹配概率。」
- 「刘看山三轮是规则共拟，同一句永远改同一处，所以敢现场敲。」

不要说：已经有真实用户、已经有大模型、已经上线。

---

## 验证命令

```
cd D:\资料\项目与代码\Jason\skill-zoo
npm test          # 15/15（含 coach / host / heat / distill）
npm run typecheck
npm run build     # vinext 五阶段
npm run dev       # http://localhost:3000/
```

然后按 `docs/DEMO-SCRIPT.md` 点，不要只看构建绿。

---

## 文档哪份作数

| 文件 | 用途 |
|---|---|
| **本文件** | 现状 + 实测 + 下一轮。交接以这份为准 |
| `docs/DEMO-SCRIPT.md` | 1→5 按钮级脚本 |
| `docs/PRD-Skill-Zoo.md` | 产品目标。模块一 LLM、模块四 API **尚未做**，别当已交付 |
| `docs/NEXT-ROUND.md` | 卡片制方案底稿，部分条目已被本轮落地 |
| `docs/HANDOFF-DEPLOY.md` | 服务器勘察。8090 勿覆盖 |
| `docs/SKILL-CATALOG-TEMPLATE.md` | 换货只改 JSON |

过时内容：根 README 仍可能写旧分支名；`DEMO-DELIVERY-PLAN.md` 里 zoo 组件「待接入」已作废。
