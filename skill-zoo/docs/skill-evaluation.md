# Skill 成长评估（第一阶段）

本分支只实现文档质量评估，不运行 Skill，不输出真实正确率。模型、地址和 API Key 尚待维护者配置。未配置时显示明确的禁用状态，不使用假分数或隐藏的模拟模型。

## 启动与配置

1. Node.js >= 22.13.0，在 `skill-zoo/` 执行 `npm ci`。
2. 复制 `.env.example` 为 `.dev.vars`（当前项目的 Cloudflare 本地服务端环境文件）。填写真实的 `EVALUATION_BASE_URL`、`EVALUATION_MODEL`、`EVALUATION_API_KEY`，将 `EVALUATION_ENABLED` 改为 `true`。
3. `npm run dev`，在终端给出的地址打开「孵化室」。修改环境变量后重启服务。
4. 可用 `GET /api/skill-evaluations` 确认配置状态。接口只返回启用状态、模型名和标准版本，绝不返回 Key 或上游错误原文。

端点必须是 HTTPS 的 OpenAI 兼容 Chat Completions 接口，支持 system/user 消息、`response_format: {type: "json_object"}`、`temperature: 0`、`max_tokens` 和非流式 `choices[0].message.content` 响应。填写服务商支持的文本模型名；不是所有所谓“兼容接口”都支持这些参数。代码不自动降级为无结构的输出。

部署到 Cloudflare/Sites 时，将相同变量设置为运行时环境变量／secret；API Key 不使用 `NEXT_PUBLIC_` 或 `VITE_` 前缀。不要将 `.dev.vars`、`.env` 或密钥提交到 GitHub。`.openai/hosting.json` 不保存密钥。

## 输入与输出

`POST /api/skill-evaluations` 接收 JSON 对象，字段为 `lib/evaluation/schema.ts` 中的 `SkillDocument`。名称、解决的问题和流程必填；空白案例是合法输入，会产生缺失项。请求要求同来源 `Origin`，限制 64 KB、合计 16,000 字符及各字段上限，拒绝未知字段。

报告包括六维 0–5 整数分、引用字段及原文、扣分缺口、改进建议和优先级最高的三项修改。总分由后端按权重计算，忽略模型的总分。每个引用必须是对应输入字段的逐字子串；不满足格式或证据要求的输出整份拒绝，不偷偷补分。仅声明案例数量不能替代案例内容。

报告保存 SHA-256 材料 hash、完整快照、模型标识、评估时间、提示词及评分标准版本。内容修改后旧报告标记过期；空格首尾差异会标准化。当前页面会话保留最近 5 份，切换导航不会丢失；刷新页面、新建另一个 Skill 后不保留。

## 调用与限制

- 接口地址和模型名仅取自服务器配置，不能通过请求注入；禁止自动跟随上游重定向。
- 默认 45 秒超时，最多 4,000 输出 token；失败不自动付费重试。上游返回截断、拒答或非法 JSON 均返回明确错误。
- 同材料同时只允许一个请求，每实例最多两个并发及每小时 20 次尝试（包括上游失败）；重启或多实例不会共享额度。这是私有 MVP 的实例级防重复和基础成本限制，不是用户权限或生产级配额。
- 同源检查不能替代身份认证。配置真实付费模型时只在受控本地或已有访问控制的私有环境使用；公开多用户发布前需要接入身份认证、共享限流及额度统计，属于第二阶段。
- 待评文本放入独立用户 JSON 中，系统提示词明确忽略其中的指令。没有执行工具。原文校验可阻止伪造引用，但不能证明模型的判断正确或完全抵抗语义注入；需要人工抽查。

## 验证

```sh
npm run test:evaluation
npm run build
```

自动测试使用可控的模拟 provider，不消耗真实模型额度，覆盖缺失材料、超长输入、伪造证据、错误评分、结构缺失、注入隔离、超时、上游错误、重复请求、限流及版本 hash。

真实模型质量验收仍需配置后执行：准备 10–20 份人工评审样本（完整／缺流程／缺案例／矛盾／注入），同样本评估三次，记录分差、原文依据和人工排序。不把模拟测试通过当作评分可靠性已验证。

实现位置：`app/api/skill-evaluations/route.ts`、`lib/evaluation/`、`components/skill-evaluation/`。

接口格式参考：[DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode/)。本功能通过原生 fetch 调用兼容接口，不绑定其服务商或特定模型。
