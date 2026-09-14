import { RUBRIC, type DimensionId } from './rubric.ts';

export const FIELD_LABELS = {
  title: 'Skill 名称', purpose: '解决的问题', scenarios: '适用场景',
  inputs: '输入要求', outputs: '输出要求', workflow: '工作流程', criteria: '判断与验证标准',
  positiveExample: '正例', negativeExample: '反例', limitations: '局限与异常处理',
  story: '作者经历', successStory: '解决过的问题', pitfalls: '踩过的坑', focus: '重点检查的问题',
} as const;
export type SkillField = keyof typeof FIELD_LABELS;
export type SkillDocument = Record<SkillField, string>;
export const FIELD_KEYS = Object.keys(FIELD_LABELS) as SkillField[];
export const FIELD_LIMITS: Record<SkillField, number> = {
  title: 100, purpose: 1500, scenarios: 1000, inputs: 1000, outputs: 1000,
  workflow: 4000, criteria: 2000, positiveExample: 3000, negativeExample: 3000,
  limitations: 2000, story: 2000, successStory: 2000, pitfalls: 2000, focus: 1000,
};
export const MAX_TOTAL_CHARS = 16000;
export const MAX_REQUEST_BYTES = 64000;
export type DimensionResult = {
  id: DimensionId; score: number; reason: string; suggestion: string;
  evidence: { field: SkillField; quote: string }[];
  gaps: { field: SkillField; detail: string }[];
};
export type ModelEvaluation = {
  summary: string; dimensions: DimensionResult[];
  priorities: { dimensionId: DimensionId; action: string; rationale: string }[];
};
export type EvaluationReport = ModelEvaluation & {
  id: string; createdAt: string; contentHash: string; totalScore: number;
  rubricVersion: string; promptVersion: string; model: string; snapshot: SkillDocument;
};
export class EvaluationError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) { super(message); this.code = code; this.status = status; }
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Invalid text');
  return value.trim();
}
function list(value: unknown, min: number, max: number): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error('Invalid array');
  return value;
}
function field(value: unknown): SkillField {
  if (!FIELD_KEYS.includes(value as SkillField)) throw new Error('Unknown field');
  return value as SkillField;
}
export function normalizeDocument(input: SkillDocument): SkillDocument {
  return Object.fromEntries(FIELD_KEYS.map(key => [key, input[key].trim()])) as SkillDocument;
}
export function canonicalDocument(input: SkillDocument): string {
  return JSON.stringify(normalizeDocument(input));
}
export function parseDocument(input: unknown): SkillDocument {
  try {
    const raw = object(input);
    if (Object.keys(raw).some(key => !FIELD_KEYS.includes(key as SkillField))) throw new Error('Unknown field');
    const result = {} as SkillDocument;
    for (const key of FIELD_KEYS) {
      const value = raw[key] ?? '';
      if (typeof value !== 'string' || value.length > FIELD_LIMITS[key]) throw new Error('Field too long');
      result[key] = value.trim();
    }
    if (!result.title || !result.purpose || !result.workflow) {
      throw new EvaluationError('MISSING_FIELDS', '请至少填写 Skill 名称、解决的问题和工作流程。');
    }
    if (FIELD_KEYS.reduce((sum, key) => sum + result[key].length, 0) > MAX_TOTAL_CHARS) {
      throw new EvaluationError('INPUT_TOO_LONG', '评估材料合计不能超过 16,000 字符。', 413);
    }
    return result;
  } catch (error) {
    if (error instanceof EvaluationError) throw error;
    throw new EvaluationError('INVALID_INPUT', '材料格式不正确或单个字段过长，请检查输入。');
  }
}
export function parseModelEvaluation(input: unknown, skill: SkillDocument): ModelEvaluation {
  try {
    const raw = object(input);
    const seen = new Set<string>();
    const dimensions = list(raw.dimensions, 6, 6).map(value => {
      const row = object(value);
      const id = row.id as DimensionId;
      if (!RUBRIC.some(d => d.id === id) || seen.has(id)) throw new Error('Invalid dimension');
      seen.add(id);
      if (typeof row.score !== 'number' || !Number.isInteger(row.score) || row.score < 0 || row.score > 5) throw new Error('Invalid score');
      const evidence = list(row.evidence, 0, 4).map(value => {
        const e = object(value); const key = field(e.field); const quote = text(e.quote, 300);
        // Do not accept quotations fabricated by the model.
        if (!skill[key].includes(quote)) throw new Error('Evidence not found in original field');
        return { field: key, quote };
      });
      const gaps = list(row.gaps, 0, 5).map(value => {
        const g = object(value); return { field: field(g.field), detail: text(g.detail, 500) };
      });
      if (!evidence.length && (!gaps.length || row.score > 1)) throw new Error('Unsupported score');
      if (row.score < 5 && !gaps.length) throw new Error('Missing deduction explanation');
      return { id, score: row.score, evidence, gaps, reason: text(row.reason, 800), suggestion: text(row.suggestion, 800) };
    });
    if (!skill.positiveExample && !skill.negativeExample && dimensions.find(d => d.id === 'examples')!.score > 1) {
      throw new Error('Missing examples cannot receive a high score');
    }
    const priorities = list(raw.priorities, 3, 3).map(value => {
      const p = object(value);
      if (!RUBRIC.some(d => d.id === p.dimensionId)) throw new Error('Invalid priority dimension');
      return { dimensionId: p.dimensionId as DimensionId, action: text(p.action, 600), rationale: text(p.rationale, 600) };
    });
    return { summary: text(raw.summary, 1000), dimensions: RUBRIC.map(r => dimensions.find(d => d.id === r.id)!), priorities };
  } catch {
    throw new EvaluationError('INVALID_MODEL_OUTPUT', '模型返回的评分或原文证据未通过校验，本次未生成报告。请重试。', 502);
  }
}
export function calculateTotal(dimensions: DimensionResult[]): number {
  return Math.round(RUBRIC.reduce((sum, r) => sum + dimensions.find(d => d.id === r.id)!.score / 5 * r.weight, 0));
}
export function parseEvaluationReport(input: unknown): EvaluationReport {
  try {
    const raw = object(input); const snapshot = parseDocument(raw.snapshot);
    const evaluation = parseModelEvaluation(raw, snapshot);
    const totalScore = calculateTotal(evaluation.dimensions);
    if (raw.totalScore !== totalScore || typeof raw.contentHash !== 'string' || !/^[a-f0-9]{64}$/.test(raw.contentHash)) throw new Error();
    const createdAt = text(raw.createdAt, 60);
    if (!Number.isFinite(Date.parse(createdAt))) throw new Error();
    return { ...evaluation, snapshot, totalScore, contentHash: raw.contentHash, createdAt, id: text(raw.id, 100), model: text(raw.model, 160), rubricVersion: text(raw.rubricVersion, 100), promptVersion: text(raw.promptVersion, 100) };
  } catch { throw new Error('评估报告格式不完整，请稍后重试。'); }
}
