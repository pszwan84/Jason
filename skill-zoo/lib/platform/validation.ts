import { categories, type SkillBody } from './types.ts';
export class ApiError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status=status; } }
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, '请求格式不正确');
  return value as Record<string, unknown>;
}
export function field(value: unknown, name: string, max = 4000, required = true): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new ApiError(400, `${name}不能为空或超过 ${max} 字符`);
  return value.trim();
}
export function skillInput(value: unknown): { body: SkillBody; status: 'draft'|'published'; revision: number } {
  const v = object(value); const b = object(v.body);
  if (v.status !== 'draft' && v.status !== 'published') throw new ApiError(400, '发布状态不正确');
  if (!Number.isInteger(v.revision) || Number(v.revision) < 0) throw new ApiError(400, '版本号不正确');
  const required = v.status === 'published';
  const category = field(b.category, '领域', 20);
  if (!(categories as readonly string[]).includes(category)) throw new ApiError(400, '领域不正确');
  return { status:v.status, revision:Number(v.revision), body: {
    title:field(b.title,'名称',80), category, tags:field(b.tags,'标签',160,false),
    problem:field(b.problem,'解决的问题',4000,required), input:field(b.input,'输入',4000,required),
    output:field(b.output,'输出',4000,required), steps:field(b.steps,'步骤',8000,required),
    example:field(b.example,'案例',8000,required), limits:field(b.limits,'局限',4000,required), change:field(b.change,'变更说明',1000,false),
  }};
}
export function safeUrl(value: unknown): string|undefined {
  if (typeof value !== 'string') return undefined;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : undefined; } catch { return undefined; }
}
export function assertOrigin(req: Request) {
  if (req.method === 'GET') return;
  const origin=req.headers.get('origin');
  const requestOrigin=new URL(req.url).origin;
  // The local Vite app (3000) proxies API mutations to the SQLite server (3101).
  // Keep production same-origin protection strict while allowing this explicit
  // loopback development pair.
  const localDev=origin&&/^https?:\/\/(127\.0\.0\.1|localhost):3000$/.test(origin)&&/^https?:\/\/(127\.0\.0\.1|localhost):3101$/.test(requestOrigin);
  if (origin !== requestOrigin && !localDev) throw new ApiError(403, '请从本站提交操作');
}
