// 会话级持久化：单一数据源，六界面共用。
//
// 关键约束（踩过的坑）：
// - pool 里的 Skill 含 `icon`（React 组件），**不能直接 JSON 序列化**。
//   函数型组件会被 stringify 丢掉，但 forwardRef 图标是个对象，会落成 `{}`——
//   读回来当组件渲染就抛 React #130（Element type is invalid）。所以白名单里
//   永远不放 `icon`，读回时用 `isIconType` 把 `{}` 这类垃圾挡住，再按
//   category 回填（见 page.tsx 的 iconOf）。
// - 首帧必须与 SSR 完全一致，否则 hydration mismatch 会让整页崩。
//   因此调用方在挂载后才应用这份状态（见 page.tsx 的 ready 门闩）。
//
// v1 → v2：v1 里躺的是「林然的共创方法」那张旧合成卡（命名 bug）。本轮换了
// 合成命名并加了贡献解锁，顺手换键，让路演机器不用手动清 localStorage。
const KEY = 'skill-zoo:v2';
export const LEGACY_KEYS = ['skill-zoo:v1'];

// 允许落盘的字段白名单：只放能安全 JSON 化的内容（刻意不含 icon）
const SKILL_FIELDS = ['id','title','authorId','category','color','author','role','days','cases','tag','desc','update','label','owner','steps','limits','source','story','example','counterexample','parentIds','createdAt'];

export function slimSkills<T extends Record<string, unknown>>(list: T[]): Record<string, unknown>[] {
  return list.map((s) => {
    const out: Record<string, unknown> = {};
    for (const k of SKILL_FIELDS) if (k in s) out[k] = s[k];
    return out;
  });
}

/** 真的能当组件渲染的值：函数组件，或带 $$typeof 的 React 组件对象。 */
export function isIconType(value: unknown): value is React.ComponentType<{ size?: number; strokeWidth?: number }> {
  if (typeof value === 'function') return true;
  return typeof value === 'object' && value !== null && '$$typeof' in value;
}

export function loadState<T extends object>(fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    for (const legacy of LEGACY_KEYS) window.localStorage.removeItem(legacy);
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
