// 会话级持久化：单一数据源，六界面共用。
//
// 关键约束（踩过的坑）：
// - pool 里的 Skill 含 `icon`（React 组件），**不能直接 JSON 序列化**——
//   stringify 会丢弃它，读回来变成 undefined，渲染时直接抛 React #130。
//   所以写入前只保留可序列化的字段，`icon` 在读取后用 id 回填。
// - 首帧必须与 SSR 完全一致，否则 hydration mismatch 会让整页崩。
//   因此调用方在挂载后才应用这份状态（见 page.tsx 的 ready 门闩）。
const KEY = 'skill-zoo:v1';

// 允许落盘的字段白名单：只放能安全 JSON 化的内容
const SKILL_FIELDS = ['id','title','authorId','category','color','icon','author','role','days','cases','tag','desc','update','label','owner','steps','limits','source','story','example','counterexample','parentIds','createdAt'];

export function slimSkills<T extends Record<string, unknown>>(list: T[]): Record<string, unknown>[] {
  return list.map((s) => {
    const out: Record<string, unknown> = {};
    for (const k of SKILL_FIELDS) if (k in s) out[k] = s[k];
    return out;
  });
}

export function loadState<T extends object>(fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return { ...fallback, ...(parsed as T) };
  } catch {
    return fallback;
  }
}

export function saveState(state: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* 忽略：清理失败不影响使用 */
  }
}
