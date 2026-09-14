'use client';
import { ArrowUpRight, AlertCircle, ClipboardCheck, LoaderCircle, Sparkles, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { RUBRIC } from '@/lib/evaluation/rubric';
import { FIELD_LABELS, type SkillDocument, type SkillField } from '@/lib/evaluation/schema';
import { useEvaluation } from './use-evaluation';

export function EvaluationPanel({ skill, onImprove }: { skill: SkillDocument; onImprove: (field?: SkillField) => void }) {
  const state = useEvaluation(skill);
  const { report, busy, stale, error, configuration } = state;
  return <section className="panel evaluation-panel" aria-labelledby="evaluation-title">
    <div className="evaluation-heading"><span className="evaluation-mark"><ClipboardCheck size={23}/></span><div><span className="eyebrow">GROW THROUGH FEEDBACK</span><h2 id="evaluation-title">看看它长得怎么样</h2></div></div>
    <p className="evaluation-intro">检查方法说明、步骤和案例，找到下一步值得完善的地方。</p>
    <div className="evaluation-scope">文档质量评估 · 未运行 Skill，不代表真实准确率或实际效果。</div>
    {!configuration && <p role="status">正在连接评估服务…</p>}
    {configuration && !configuration.enabled && <div className="evaluation-message"><AlertCircle size={18}/><div><b>尚未连接评估模型</b><p>{configuration.message ?? '请联系项目维护者配置兼容接口后开始评估。'}</p><button className="text-button" onClick={() => void state.refreshConfiguration()}><RefreshCw size={14}/> 刷新连接状态</button></div></div>}
    <p className="evaluation-consent">点击评估后，当前材料会发送给项目配置的文本模型服务。本次会话最多保留 5 份报告，刷新页面后清空。</p>
    <button className="primary full" disabled={busy || !configuration?.enabled} onClick={() => void state.evaluate()}><Sparkles size={17}/>{busy ? '正在检查步骤与案例…' : report ? '重新评估当前版本' : '评估这个 Skill'}{busy && <LoaderCircle className="evaluation-spinner" size={16}/>}</button>
    {busy && <p className="evaluation-status" role="status">通常需要几十秒。你可以继续修改，报告会对应点击时的材料版本。</p>}
    {error && <div className="evaluation-message error" role="alert"><AlertCircle size={18}/><div><b>本次未生成新报告</b><p>{error}</p>{report && <p>下方保留的是上一次成功评估的报告。</p>}</div></div>}
    {!report && <div className="evaluation-empty"><h3>每一分，都应该有来历。</h3><p>评估后会展示六项得分、原文依据和优先改进的 3 件事。缺失的案例会明确标出。</p><div className="evaluation-dimensions-preview">{RUBRIC.map(d => <span key={d.id}>{d.label}<b>{d.weight}%</b></span>)}</div></div>}
    {report && <div className="evaluation-report" aria-live="polite">
      {stale && <div className="evaluation-message stale"><AlertCircle size={18}/><div><b>基于上一版本的材料</b><p>当前 Skill 已修改。重新评估后，才能看到这些改动对应的结果。</p></div></div>}
      <div className="evaluation-score"><div><span>文档质量总分</span><strong>{report.totalScore}<small> / 100</small></strong></div><span className="status-pill">{stale ? '待重新评估' : '对应当前材料'}</span></div>
      <p className="evaluation-summary">{report.summary}</p>
      <div className="evaluation-bars">{RUBRIC.map(r => {
        const dimension = report.dimensions.find(d => d.id === r.id)!;
        return <details className="evaluation-dimension" key={r.id}><summary><span>{r.label}<small>权重 {r.weight}%</small></span><b>{dimension.score}<small> / 5</small></b><Progress value={dimension.score * 20} aria-label={`${r.label} ${dimension.score} 分，满分 5 分`}/></summary><div className="evaluation-evidence"><p>{dimension.reason}</p><h4>原文依据</h4>{dimension.evidence.length ? dimension.evidence.map((e, i) => <blockquote key={i}><small>{FIELD_LABELS[e.field]}</small>{e.quote}</blockquote>) : <p>未提供足以支持该维度的原文材料。</p>}{dimension.gaps.length > 0 && <><h4>扣分与缺失项</h4><ul>{dimension.gaps.map((g, i) => <li key={i}><b>{FIELD_LABELS[g.field]}：</b>{g.detail}</li>)}</ul></>}<h4>怎么完善</h4><p>{dimension.suggestion}</p><button className="text-button" onClick={() => onImprove(dimension.gaps[0]?.field)}>修改相关材料 <ArrowUpRight size={15}/></button></div></details>;
      })}</div>
      <h3 className="evaluation-priorities-title">优先改进的 3 件事</h3><ol className="evaluation-priorities">{report.priorities.map((p, i) => <li key={i}><span>{i + 1}</span><div><b>{p.action}</b><p>{p.rationale}</p></div></li>)}</ol>
      <button className="outline full" onClick={() => onImprove()}>根据建议继续完善 <ArrowUpRight size={16}/></button>
      <dl className="evaluation-meta"><dt>评估时间</dt><dd>{new Date(report.createdAt).toLocaleString('zh-CN')}</dd><dt>模型</dt><dd>{report.model}</dd><dt>评分标准</dt><dd>{report.rubricVersion}</dd><dt>提示词版本</dt><dd>{report.promptVersion}</dd><dt>材料版本</dt><dd title={report.contentHash}>{report.contentHash.slice(0, 12)}</dd></dl>
      <details className="evaluation-snapshot"><summary>查看当时提交的材料</summary>{Object.entries(FIELD_LABELS).map(([field, label]) => <div key={field}><h4>{label}</h4><p>{report.snapshot[field as SkillField] || '未填写'}</p></div>)}</details>
    </div>}
    {state.reports.length > 1 && <div className="evaluation-history"><h3>本次会话的评估记录</h3>{state.reports.map((item, index) => <button key={item.id} aria-pressed={item.id === report?.id} onClick={() => state.selectReport(item.id)}><span>{new Date(item.createdAt).toLocaleTimeString('zh-CN')}{index === 0 ? ' · 最新' : ''}</span><b>{item.totalScore} / 100</b></button>)}</div>}
  </section>;
}
