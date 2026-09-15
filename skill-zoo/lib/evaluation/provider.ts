import { evaluationMessages } from './prompt.ts';
import { EvaluationError, parseModelEvaluation, type SkillDocument } from './schema.ts';

export type Environment = Record<string, string | undefined>;
export type ProviderConfig = { endpoint: string; model: string; apiKey: string; timeoutMs: number };
export function readConfig(env: Environment): ProviderConfig {
  if (env.EVALUATION_ENABLED !== 'true') throw new EvaluationError('NOT_CONFIGURED', '成长评估尚未启用，请联系项目维护者配置模型。', 503);
  const { EVALUATION_BASE_URL: base, EVALUATION_MODEL: model, EVALUATION_API_KEY: apiKey } = env;
  if (!base || !model?.trim() || !apiKey?.trim()) throw new EvaluationError('NOT_CONFIGURED', '评估模型尚未配置完整，请联系项目维护者。', 503);
  try {
    const url = new URL(base);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || model.length > 160) throw new Error();
    const timeoutMs = Number(env.EVALUATION_TIMEOUT_MS ?? 45000);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) throw new Error();
    return { endpoint: base.replace(/\/+$/, '') + '/chat/completions', model: model.trim(), apiKey: apiKey.trim(), timeoutMs };
  } catch { throw new EvaluationError('NOT_CONFIGURED', '模型服务配置不正确，请联系项目维护者检查。', 503); }
}
export async function readLimitedBody(message: Request | Response, maxBytes: number): Promise<string> {
  if (Number(message.headers.get('content-length')) > maxBytes) throw new EvaluationError('BODY_TOO_LARGE', '内容超过允许大小。', 413);
  const reader = message.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder(); let bytes = 0; let output = '';
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.length;
      if (bytes > maxBytes) { await reader.cancel(); throw new EvaluationError('BODY_TOO_LARGE', '内容超过允许大小。', 413); }
      output += decoder.decode(value, { stream: true });
    }
    return output + decoder.decode();
  } finally { reader.releaseLock(); }
}
export async function evaluateWithProvider(skill: SkillDocument, config: ProviderConfig, fetcher: typeof fetch = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetcher(config.endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      redirect: 'error', signal: controller.signal,
      body: JSON.stringify({ model: config.model, messages: evaluationMessages(skill), response_format: { type: 'json_object' }, temperature: 0, max_tokens: 4000, stream: false }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 429) throw new EvaluationError('PROVIDER_BUSY', '模型服务繁忙或额度不足，请稍后重试。', 503);
      throw new EvaluationError('PROVIDER_ERROR', '模型服务调用失败，请联系维护者检查配置或稍后重试。', 502);
    }
    let envelope;
    try { envelope = JSON.parse(await readLimitedBody(response, 128000)); }
    catch (error) { if (controller.signal.aborted) throw error; throw new EvaluationError('INVALID_MODEL_OUTPUT', '模型返回格式异常，本次未生成报告。', 502); }
    const choice = envelope?.choices?.[0];
    if (choice?.finish_reason !== 'stop' || typeof choice?.message?.content !== 'string' || choice.message.refusal) {
      throw new EvaluationError('INVALID_MODEL_OUTPUT', '模型输出不完整或拒绝评估，本次未生成报告。', 502);
    }
    let raw;
    try { raw = JSON.parse(choice.message.content); }
    catch { throw new EvaluationError('INVALID_MODEL_OUTPUT', '模型未返回有效评分格式，请重试。', 502); }
    return parseModelEvaluation(raw, skill);
  } catch (error) {
    if (controller.signal.aborted) throw new EvaluationError('MODEL_TIMEOUT', '评估超时，材料已保留，请稍后重试。', 504);
    if (error instanceof EvaluationError) throw error;
    throw new EvaluationError('PROVIDER_ERROR', '暂时无法连接模型服务，请稍后重试。', 502);
  } finally { clearTimeout(timer); }
}
