// 确定性提炼：把一段真实经历变成「5 步方法 + 领域标签」。
//
// This demo runs without credentials. A future model adapter can be tested with
// fixtures and evaluations; deterministic rules are an explicit demo fallback.

const STOP = new Set([
  '的', '了', '是', '在', '和', '我', '你', '他', '她', '这', '那', '有', '就', '不', '都',
  '一个', '上', '也', '很', '到', '说', '要', '去', '会', '着', '没有', '好', '自己', '因为',
  '所以', '但是', '如果', '就是', '他们', '我们', '你们', '之后', '然后', '什么', '怎么', '这个',
]);

const DOMAIN = [
  '法律', '科研', '论文', '写作', '设计', '商业', '工程', '教育', '数据', '城市', '决策', '复盘',
  '访谈', '实验', '系统', '团队', '产品', '运营', '财务', '医疗', '心理', '研究', '方法', '学习',
  '教学', '案例', '证据', '标准', '流程', '判断', '统计', '模型', '策略', '内容', '组织', '治理',
  '政策', '文献', '标注', '创新', '验证', '边界', '需求', '用户', '增长', '沟通', '会议', '选择',
];

// 顺序标记：中文里"先…接着…然后…再…最后…"就是天然的分步信号
const SEQ_MARK = /^(第[一二三四五六七八九十0-9]+步|[0-9]+[、.．)）]|[一二三四五六七八九十]+[、.．)）]|首先|先|接着|然后|其次|之后|紧接着|再|最后|最终|另外|还有|并且|其中|一是|二是|三是)/;

export type Distilled = {
  title: string;
  problem: string;
  steps: string[];
  tags: string[];
  source: string;
};

function toParts(input: string): string[] {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .trim()
    .split(/[。！？!?；;\n]+|[，,](?=首先|然后|接着|其次|最后|再)/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  for (const d of DOMAIN) {
    if (text.includes(d) && !tags.includes(d)) tags.push(d);
  }
  // 领域词命中不足时，用高频 2~3 字词组补齐（相同输入必然相同结果）
  const grams = new Map<string, number>();
  for (const run of text.split(/[^\u4e00-\u9fa5]+/)) {
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i + n <= run.length; i++) {
        const g = run.slice(i, i + n);
        if (STOP.has(g)) continue;
        if (g.split('').every((ch) => STOP.has(ch))) continue;
        grams.set(g, (grams.get(g) || 0) + 1);
      }
    }
  }
  const ranked = [...grams.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]));
  for (const [g] of ranked) {
    if (tags.length >= 5) break;
    if (tags.some((t) => t.includes(g) || g.includes(t))) continue;
    tags.push(g);
  }
  return tags.slice(0, 5);
}

export function distill(input: string): Distilled {
  const text = input.slice(0, 12000).replace(/<[^>]+>/g, ' ').replace(/[\t ]+/g, ' ').trim();
  const parts = toParts(text);

  const problem = (parts[0] || text).slice(0, 80);

  const marked = parts.filter((s) => SEQ_MARK.test(s));
  const plain = parts.filter((s) => !SEQ_MARK.test(s));

  const steps: string[] = [];
  for (const s of [...marked, ...plain]) {
    const core = s.replace(SEQ_MARK, '').replace(/^[，,、:：\s]+/, '').trim();
    if (core.length < 4) continue;
    const step = core.slice(0, 160);
    if (steps.includes(step)) continue;
    steps.push(step);
    if (steps.length >= 5) break;
  }

  const tags = extractTags(text);
  const title = tags.length ? `${tags[0]}的 5 步判断法` : '未命名方法';

  return {
    title,
    problem,
    steps,
    tags,
    source: `来自你粘贴的 1 段经历（${text.length} 字）· 由 5 步规则提炼，尚未经过真实案例验证`,
  };
}
