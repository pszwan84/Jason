import { initialState, emptyDraft, SAMPLE_SKILLS } from './fixtures.ts';
import { ACCESS, CATEGORY_NAMES } from './model.ts';
import type { ZooState, Skill, Draft } from './model.ts';

export const STORAGE_KEY = 'skill-zoo:v2';
export const LEGACY_KEY = 'skill-zoo:v1';
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown): v is string => typeof v === 'string';
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text);
const ids = (v: unknown): v is number[] => Array.isArray(v) && v.every(n => Number.isSafeInteger(n) && n > 0);
const stringFields = (value: Record<string, unknown>, keys: string[]) => keys.every(key => text(value[key]));
function validSkill(v: unknown): v is Skill {
  return record(v) && Number.isSafeInteger(v.id) && Number(v.id) > 0 &&
    stringFields(v, ['title','category','color','author','role','tag','desc','update','label','limits','source','story','example','counterexample','createdAt']) &&
    ['sage','peach','lavender','yellow'].includes(String(v.color)) && ACCESS.includes(v.label as Skill['label']) && CATEGORY_NAMES.includes(String(v.category)) &&
    Number.isFinite(v.days) && Number(v.days) >= 0 && Number.isFinite(v.cases) && Number(v.cases) >= 0 && strings(v.steps) && v.steps.length === 5 && ids(v.parentIds) && ['sample','local'].includes(String(v.owner));
}
function validDraft(v: unknown): v is Draft {
  return record(v) && stringFields(v, ['title','raw','story','example','counterexample','access','category']) &&
    (v.skillId === null || Number.isSafeInteger(v.skillId)) && ACCESS.includes(v.access as Draft['access']) && CATEGORY_NAMES.includes(String(v.category)) &&
    record(v.kit) && stringFields(v.kit, ['problem','source','limits','updated']) && strings(v.kit.tags) && strings(v.kit.steps) && v.kit.steps.length === 5 && strings(v.kit.questions) && Number.isFinite(v.kit.days) && Number.isFinite(v.kit.cases);
}
export function validateState(v: unknown): v is ZooState {
  if (!record(v) || v.version !== 2 || !Array.isArray(v.pool) || !v.pool.every(validSkill) || !validDraft(v.draft) || !ids(v.saved) || !stringFields(v,['profile','identity']) || !strings(v.supply) || !strings(v.demand) || typeof v.motionPaused !== 'boolean') return false;
  const skillIds = new Set(v.pool.map(skill => skill.id));
  if (skillIds.size !== v.pool.length || v.saved.some(id => !skillIds.has(id))) return false;
  if (!Array.isArray(v.cards) || !v.cards.every(c => record(c) && Number.isSafeInteger(c.id) && skillIds.has(Number(c.skillId)) && (c.ownSkillId === null || skillIds.has(Number(c.ownSkillId))) && stringFields(c,['to','title','who','why','offer','evidence','createdAt','reviewedAt']) && ['pending','accepted','rejected'].includes(String(c.status)))) return false;
  if (!Array.isArray(v.comments) || !v.comments.every(c => record(c) && Number.isSafeInteger(c.id) && skillIds.has(Number(c.skillId)) && stringFields(c,['author','body','createdAt']))) return false;
  if (!Array.isArray(v.contributions) || !v.contributions.every(c => record(c) && Number.isSafeInteger(c.id) && skillIds.has(Number(c.skillId)) && stringFields(c,['author','body','createdAt']) && ['反例','交叉测试'].includes(String(c.kind)) && ['pending','accepted','rejected'].includes(String(c.status)))) return false;
  if (!Array.isArray(v.projects) || !v.projects.every(p => record(p) && Number.isSafeInteger(p.id) && Number.isSafeInteger(p.cardId) && ids(p.parentIds) && p.parentIds.length === 2 && p.parentIds.every(id => skillIds.has(id)) && text(p.partner) && text(p.answer) && strings(p.notes) && p.notes.length <= 3 && Array.isArray(p.tasks) && p.tasks.length === 6 && p.tasks.every(b => typeof b === 'boolean') && (p.resultId === null || skillIds.has(Number(p.resultId))))) return false;
  return true;
}
export function migrateLegacy(v: unknown): ZooState {
  if (!record(v) || !Array.isArray(v.pool)) throw new Error('无法识别旧版数据格式。');
  const state = initialState();
  state.pool = v.pool.map((value, index) => {
    if (!record(value) || !Number.isSafeInteger(value.id) || !text(value.title)) throw new Error(`旧版 Skill ${index + 1} 无法识别。`);
    const sample = SAMPLE_SKILLS.find(skill => skill.id === value.id);
    const base = sample ?? { ...SAMPLE_SKILLS[1], id: Number(value.id), owner: 'local' as const, days: 1, cases: 0, source: '来自旧版本地数据；旧版未保存步骤，当前流程为待核验的占位步骤。' };
    const result = { ...base };
    for (const key of ['title','category','color','author','role','tag','desc','update','label'] as const) {
      if (text(value[key])) Object.assign(result, { [key]: value[key] });
    }
    for (const key of ['days','cases'] as const) if (typeof value[key] === 'number') result[key] = value[key];
    return result;
  });
  if (text(v.profile)) state.profile = v.profile;
  if (text(v.identity)) state.identity = v.identity;
  if (ids(v.saved)) state.saved = v.saved.filter(id => state.pool.some(skill => skill.id === id));
  state.draft = { ...emptyDraft(text(v.draft) ? v.draft : ''), ...(record(v.kit) ? { kit: v.kit } : {}), story: text(v.story) ? v.story : '', raw: text(v.raw) ? v.raw : '' } as Draft;
  if (text(v.publish) && ACCESS.includes(v.publish as Draft['access'])) state.draft.access = v.publish as Draft['access'];
  if (Array.isArray(v.cards)) for (const value of v.cards) {
    if (!record(value) || !text(value.title)) throw new Error('旧交换卡格式无法识别。');
    const skill = state.pool.find(s => s.title === value.title);
    if (!skill) throw new Error('旧交换卡的 Skill 无法定位；旧数据已保留。');
    state.cards.push({ id: Number(value.id), skillId: skill.id, ownSkillId: null, to: text(value.to) ? value.to : skill.author, title: value.title, who: state.profile,
      why: '旧版未保存问题说明', offer: text(value.offer) ? value.offer : '旧版未保存', evidence: '旧版未保存贡献详情，请重新核验。',
      status: value.status === 'accepted' ? 'accepted' : 'pending', createdAt: '', reviewedAt: '' });
  }
  if (!validateState(state)) throw new Error('旧版含有不完整字段；旧数据已保留，请先导出备份。');
  return state;
}
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export function readStore(storage: StorageLike): { state: ZooState; error: string; migrated: boolean } {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (!validateState(parsed)) throw new Error('本地数据字段不完整。');
      return { state: parsed, error: '', migrated: false };
    }
    const old = storage.getItem(LEGACY_KEY);
    if (old !== null) return { state: migrateLegacy(JSON.parse(old)), error: '', migrated: true };
    return { state: initialState(), error: '', migrated: false };
  } catch {
    return { state: initialState(), error: '无法读取本地数据，自动保存已暂停，原始数据保留。可导出备份，或使用不覆盖原数据的临时演示。', migrated: false };
  }
}
export function writeStore(storage: StorageLike, state: ZooState): string {
  if (!validateState(state)) return '数据校验未通过，本次未保存。';
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return ''; }
  catch { return '浏览器存储不可用或空间不足，本次更改仅保留在当前页面；请导出备份。'; }
}
