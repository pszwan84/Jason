// Binary supply/demand vectors implement the PRD's bilateral complementarity model.
//
// 目的很具体：让界面上的匹配分**跟着数据动**，而不是永远写死 63%。
// 它必须可解释——分数从哪里来要说得清，否则只是换个地方拍脑袋。
// 公式：基础分 + 重叠领域加分 + 她能补你的缺口加分 + 有标签的加分。
// 等 PRD 的 S_i·D_j 向量模型落地时，直接换掉这个函数即可，UI 不用动。

export type Persona = {
  name: string;
  role: string;
  tags: string[];
};

export const LINRAN: Persona = {
  name: '林然',
  role: '城市研究博士生',
  tags: ['城市研究', '系统思维', '数据分析', '公共政策', '韧性'],
};

export type MatchResult = {
  score: number;
  overlap: string[];
  gap: string[];
  reason: string;
};

export function complementScore(tags: string[], persona: Persona = LINRAN): MatchResult {
  const mine = tags.filter(Boolean);
  const overlap = mine.filter((t) => persona.tags.some((p) => p.includes(t) || t.includes(p)));
  const gap = persona.tags.filter((p) => !mine.some((t) => p.includes(t) || t.includes(p)));

  let score = 30;
  score += 14 * overlap.length;
  score += 7 * Math.min(gap.length, 4);
  score += mine.length === 0 ? -12 : 4;
  score = Math.max(8, Math.min(92, Math.round(score)));

  const reason = mine.length === 0
    ? '还没有给这个方法打标签，暂时看不出互补点——先去孵化室补上它解决的问题。'
    : overlap.length > 0
      ? `你们都在「${overlap[0]}」上有积累，可以先用共同语言对齐判断标准；她在「${gap[0] ?? '其他领域'}」上的经验能补你的验证缺口。`
      : `你们没有直接重叠的领域，但她的「${gap[0] ?? '领域判断'}」正好能补上你方法里缺少的外部视角。`;

  return { score, overlap, gap, reason };
}
