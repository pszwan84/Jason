import type { ZooState, Draft, Skill, ExchangeCard } from './model.ts';

export function nextId(items: { id: number }[]): number {
  return Math.max(0, ...items.map(item => item.id)) + 1;
}
export function validateDraft(draft: Draft): string {
  if (draft.title.trim().length < 2) return '请给 Skill 起一个至少 2 字的名字。';
  if (draft.kit.problem.trim().length < 10) return '请用至少 10 字说明它解决的问题。';
  if (draft.kit.steps.length !== 5 || draft.kit.steps.some(step => step.trim().length < 4)) return '请完善全部 5 步，每步至少 4 字。';
  if (!draft.kit.limits.trim()) return '请写明已知局限；尚未验证时也请明确说明。';
  return '';
}
export function publishDraft(state: ZooState, now = new Date().toISOString()): ZooState {
  const error = validateDraft(state.draft);
  if (error) throw new Error(error);
  const draft = state.draft;
  const existing = state.pool.find(skill => skill.id === draft.skillId && skill.owner === 'local');
  const skill: Skill = {
    id: existing?.id ?? nextId(state.pool), title: draft.title.trim(), category: draft.category,
    color: existing?.color ?? 'sage', author: state.profile, role: state.identity,
    days: existing?.days ?? 1, cases: existing?.cases ?? 0,
    tag: draft.kit.tags.join(' · '), desc: draft.kit.problem.trim(),
    update: existing ? '刚刚完善了方法' : '刚刚发布 · 等待验证', label: draft.access,
    steps: draft.kit.steps.map(step => step.trim()), limits: draft.kit.limits.trim(),
    source: draft.kit.source, story: draft.story, example: draft.example,
    counterexample: draft.counterexample, parentIds: existing?.parentIds ?? [],
    owner: 'local', createdAt: existing?.createdAt ?? now,
  };
  return { ...state, pool: existing ? state.pool.map(item => item.id === skill.id ? skill : item) : [...state.pool, skill], draft: { ...draft, skillId: skill.id } };
}
export function canAccess(state: ZooState, skill: Skill): boolean {
  if (skill.owner === 'local' || skill.label === '完全开放') return true;
  if (skill.label === '贡献后开放') return state.contributions.some(item => item.skillId === skill.id && item.status === 'accepted');
  if (skill.label === '交换后开放') return state.cards.some(item => item.skillId === skill.id && item.status === 'accepted');
  return false;
}
export function sendCard(state: ZooState, input: Omit<ExchangeCard, 'id' | 'createdAt' | 'reviewedAt' | 'status' | 'to' | 'title'>): ZooState {
  const skill = state.pool.find(item => item.id === input.skillId);
  if (!skill || skill.owner === 'local') throw new Error('请向另一位示例作者的 Skill 发起交换。');
  if (input.who.trim().length < 2 || input.why.trim().length < 10 || input.evidence.trim().length < 10 || !input.offer.trim()) throw new Error('请填写身份、具体问题和至少 10 字的贡献说明。');
  if (state.cards.some(item => item.skillId === skill.id && item.status !== 'rejected')) throw new Error('这个 Skill 已有待审核或已确认的交换卡，请到消息查看。');
  if (!state.pool.some(item => item.id === input.ownSkillId && item.owner === 'local')) throw new Error('请先发布一个自己的 Skill，作为本次交换与共创的母本。');
  const card: ExchangeCard = { ...input, who: input.who.trim(), why: input.why.trim(), evidence: input.evidence.trim(), id: nextId(state.cards), to: skill.author, title: skill.title, status: 'pending', createdAt: new Date().toISOString(), reviewedAt: '' };
  return { ...state, cards: [...state.cards, card] };
}
export function reviewCard(state: ZooState, id: number, accepted: boolean): ZooState {
  const card = state.cards.find(item => item.id === id);
  if (!card || card.status !== 'pending') throw new Error('只有待审核的交换卡可以处理。');
  const own = state.pool.find(item => item.id === card.ownSkillId && item.owner === 'local');
  const counterpart = state.pool.find(item => item.id === card.skillId);
  const projects = accepted && own && counterpart ? [...state.projects, {
    id: nextId(state.projects), cardId: id, parentIds: [own.id, counterpart.id], partner: card.to,
    tasks: Array.from({ length: 6 }, () => false), notes: [], answer: '', resultId: null,
  }] : state.projects;
  return { ...state, cards: state.cards.map(item => item.id === id ? { ...item, status: accepted ? 'accepted' : 'rejected', reviewedAt: new Date().toISOString() } : item), projects };
}
export function composeProject(state: ZooState, projectId: number): ZooState {
  const project = state.projects.find(item => item.id === projectId);
  if (!project || project.resultId !== null) throw new Error('项目不存在或已经发布，请查看已有成果。');
  if (!state.cards.some(card => card.id === project.cardId && card.status === 'accepted')) throw new Error('请先完成交换卡审核。');
  if (!project.tasks.slice(0, 5).every(Boolean) || project.notes.length < 3) throw new Error('请先完成前 5 项任务和 3 轮共创记录。');
  const parents = project.parentIds.map(id => state.pool.find(skill => skill.id === id));
  if (parents.some(parent => !parent)) throw new Error('找不到完整母本，无法合成。');
  const [first, second] = parents as [Skill, Skill];
  const id = nextId(state.pool);
  const skill: Skill = { ...first, id, title: `${first.title} × ${second.title}`.slice(0, 80),
    author: `${state.profile} × ${project.partner}`, role: '本地共创', owner: 'local', days: 1, cases: 0,
    label: '完全开放', desc: project.notes[0], story: project.notes.join('\n\n'), source: `继承《${first.title}》与《${second.title}》；共创记录由演示参与者填写，尚未经独立验证。`,
    steps: [`明确共同问题：${project.notes[0]}`, `应用母本一：${first.steps[1]}`, `结合母本二：${second.steps[2]}`, `交叉验证：${project.notes[1]}`, `检查边界：${project.notes[2]}`],
    limits: project.notes[2], example: project.notes[1], counterexample: project.notes[2],
    parentIds: [first.id, second.id], createdAt: new Date().toISOString(), tag: '共创方法 · 交叉验证', update: '刚完成本地共创 · 等待独立验证' };
  return { ...state, pool: [...state.pool, skill], projects: state.projects.map(item => item.id === project.id ? { ...item, resultId: id, tasks: item.tasks.map(() => true) } : item) };
}
