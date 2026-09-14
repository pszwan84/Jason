export const RUBRIC_VERSION = 'skill-document-v1.0';
export const PROMPT_VERSION = 'evaluator-v1.0';
export const RUBRIC = [
  { id: 'clarity', label: '问题与边界清晰度', weight: 15, criteria: '明确目标用户、问题、适用及不适用场景。' },
  { id: 'execution', label: '流程可执行性', weight: 25, criteria: '输入输出明确，步骤具体且有顺序，陌生使用者能照着执行。' },
  { id: 'verification', label: '判断依据与可验证性', weight: 20, criteria: '结论有证据、判断标准及可以检查的验证方式。' },
  { id: 'examples', label: '案例与反例覆盖', weight: 20, criteria: '有具体输入、执行过程、输出和反例；仅声称案例数量不算证据。' },
  { id: 'reuse', label: '可复用性', weight: 10, criteria: '说明可调整的参数、前提及迁移方法，不依赖作者未写出的隐性经验。' },
  { id: 'limitations', label: '局限与异常处理', weight: 10, criteria: '说明失败情形、不确定性、拒答条件和人工复核方式。' },
] as const;
export type DimensionId = typeof RUBRIC[number]['id'];
export const SCORE_LEVELS = [
  '0：完全缺失、无可判断材料或明显自相矛盾。',
  '1：只有口号、名称或非常零散的说明，关键内容缺失。',
  '2：有部分具体内容，但重要步骤、依据或边界缺失。',
  '3：基本完整可理解，有具体材料支持，仍有明确缺口。',
  '4：清晰完整、细节充分，只有少量可定位的不足。',
  '5：在文档层面完整、具体、一致且可验证；不能据此声称真实效果已验证。',
] as const;
