export type Access = '完全开放' | '交换后开放' | '贡献后开放' | '体验版';
export type Color = 'sage' | 'peach' | 'lavender' | 'yellow';
export type Skill = {
  id: number; title: string; category: string; color: Color;
  author: string; role: string; days: number; cases: number;
  tag: string; desc: string; update: string; label: Access;
  steps: string[]; limits: string; source: string; story: string;
  example: string; counterexample: string; parentIds: number[];
  owner: 'sample' | 'local'; createdAt: string;
};
export type Kit = {
  days: number; cases: number; problem: string; tags: string[];
  steps: string[]; source: string; limits: string; questions: string[]; updated: string;
};
export type Draft = {
  skillId: number | null; title: string; raw: string; kit: Kit; story: string;
  example: string; counterexample: string; access: Access; category: string;
};
export type ExchangeCard = {
  id: number; skillId: number; ownSkillId: number | null; to: string; title: string;
  who: string; why: string; offer: string; evidence: string;
  status: 'pending' | 'accepted' | 'rejected'; createdAt: string; reviewedAt: string;
};
export type Contribution = {
  id: number; skillId: number; author: string; body: string;
  kind: '反例' | '交叉测试'; status: 'pending' | 'accepted' | 'rejected'; createdAt: string;
};
export type Comment = { id: number; skillId: number; author: string; body: string; createdAt: string };
export type Project = {
  id: number; cardId: number; parentIds: number[]; partner: string;
  tasks: boolean[]; notes: string[]; answer: string; resultId: number | null;
};
export type ZooState = {
  version: 2; pool: Skill[]; saved: number[]; draft: Draft;
  profile: string; identity: string; supply: string[]; demand: string[];
  cards: ExchangeCard[]; contributions: Contribution[]; comments: Comment[];
  projects: Project[]; motionPaused: boolean;
};
export const ACCESS: Access[] = ['完全开放', '交换后开放', '贡献后开放', '体验版'];
export const CATEGORY_NAMES = ['科研馆', '法律馆', '设计馆', '商业馆', '工程馆', '教育馆'];
export const TASKS = ['提供真实案例', '对齐判断标准', '建立第一版流程', '完成交叉测试', '记录边界与冲突', '发布 v0.1'];
export const PROMPTS = ['你们要一起解决什么具体问题？', '双方各提供什么证据，怎样判断方法有效？', '交叉测试发现了什么例外，适用边界是什么？'];
