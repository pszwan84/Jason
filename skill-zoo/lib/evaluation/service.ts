import { RUBRIC_VERSION, PROMPT_VERSION } from './rubric.ts';
import { readConfig, readLimitedBody, evaluateWithProvider, type Environment } from './provider.ts';
import { EvaluationError, parseDocument, calculateTotal, canonicalDocument, MAX_REQUEST_BYTES, type EvaluationReport } from './schema.ts';

const json = (data: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

/** Deliberately process/isolate-local for the private MVP, not a distributed quota. */
export function createEvaluationHandlers({ env, fetcher = fetch, now = Date.now }: { env: () => Environment; fetcher?: typeof fetch; now?: () => number }) {
  let active = 0; let requests: number[] = [];
  const inFlight = new Set<string>();
  return {
    GET() {
      try { const config = readConfig(env()); return json({ enabled: true, model: config.model, rubricVersion: RUBRIC_VERSION }); }
      catch { return json({ enabled: false, message: '成长评估尚未启用，请联系项目维护者配置模型。', rubricVersion: RUBRIC_VERSION }); }
    },
    async POST(request: Request) {
      let lockedHash: string | undefined;
      let retryAfter = 60;
      try {
        // Browser-only same-origin mutations. CLI tests must explicitly provide Origin.
        if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
          throw new EvaluationError('INVALID_ORIGIN', '请从当前网站发起评估。', 403);
        }
        if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') throw new EvaluationError('INVALID_INPUT', '请提交 JSON 格式的评估材料。', 415);
        const config = readConfig(env());
        let input;
        try { input = JSON.parse(await readLimitedBody(request, MAX_REQUEST_BYTES)); }
        catch (error) { if (error instanceof EvaluationError) throw error; throw new EvaluationError('INVALID_INPUT', '评估材料不是有效 JSON。'); }
        const skill = parseDocument(input);
        const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalDocument(skill)));
        const hash = Array.from(new Uint8Array(hashBytes), x => x.toString(16).padStart(2, '0')).join('');
        requests = requests.filter(t => t > now() - 3600000);
        if (inFlight.has(hash)) throw new EvaluationError('ALREADY_EVALUATING', '这份材料正在评估，请等待结果。', 409);
        if (requests.length >= 20) {
          retryAfter = Math.max(1, Math.ceil((requests[0] + 3600000 - now()) / 1000));
          throw new EvaluationError('RATE_LIMITED', `本小时评估次数已用完，请约 ${Math.ceil(retryAfter / 60)} 分钟后重试。`, 429);
        }
        if (active >= 2) throw new EvaluationError('RATE_LIMITED', '评估请求较多，请稍后重试。', 429);
        active++; requests.push(now()); inFlight.add(hash); lockedHash = hash;
        const evaluation = await evaluateWithProvider(skill, config, fetcher);
        const report: EvaluationReport = {
          ...evaluation, totalScore: calculateTotal(evaluation.dimensions), id: crypto.randomUUID(),
          createdAt: new Date(now()).toISOString(), contentHash: hash, model: config.model,
          rubricVersion: RUBRIC_VERSION, promptVersion: PROMPT_VERSION, snapshot: skill,
        };
        return json(report);
      } catch (error) {
        const safe = error instanceof EvaluationError ? error : new EvaluationError('INTERNAL_ERROR', '评估暂时不可用，请稍后重试。', 500);
        return json({ error: { code: safe.code, message: safe.message } }, safe.status, safe.status === 429 ? { 'Retry-After': String(retryAfter) } : {});
      } finally { if (lockedHash) { active--; inFlight.delete(lockedHash); } }
    },
  };
}
