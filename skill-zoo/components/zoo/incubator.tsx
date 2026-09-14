'use client';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { ACCESS, CATEGORY_NAMES } from '@/lib/model';
import type { Draft } from '@/lib/model';
import { DEMO_EXPERIENCE } from '@/lib/fixtures';
import { distill } from '@/lib/distill';
import { normalizeTags } from '@/lib/bilateral-match';
import { publishDraft } from '@/lib/domain';
import { useZoo, updateZoo } from '@/lib/zoo-store';
import { navigate } from '@/lib/navigation';
import { Heading } from './primitives';

export function Incubator({ notify }: { notify: (message: string) => void }) {
  const { state } = useZoo();
  const draft = state.draft;
  const patch = (change: Partial<Draft>) => updateZoo(s => ({ ...s, draft: { ...s.draft, ...change } }));
  const patchKit = (change: Partial<Draft['kit']>) => updateZoo(s => ({ ...s, draft: { ...s.draft, kit: { ...s.draft.kit, ...change } } }));
  function extract() {
    if (draft.raw.trim().length < 30) { notify('请粘贴至少 30 字的经历；链接请先转换为正文。'); return; }
    const result = distill(draft.raw);
    const steps = Array.from({ length: 5 }, (_, i) => result.steps[i] ?? '');
    patch({ title: draft.title || result.title, kit: { ...draft.kit, days: 1, cases: 0, questions: [], problem: result.problem, tags: result.tags, steps, source: result.source, updated: '刚刚提炼', limits: draft.kit.limits || '尚未经独立案例验证；使用前请核验样本、证据与适用范围。' } });
    notify(result.steps.length < 5 ? '已提取已有步骤，请补齐空白步骤后发布。' : '已提炼 5 步草稿，请核验并编辑。');
  }
  function publish() {
    try { updateZoo(publishDraft); notify('Skill 已保存到本地社区。'); navigate('habitat'); }
    catch (error) { notify(error instanceof Error ? error.message : '发布未完成。'); }
  }
  return <><Heading tag="THE INCUBATOR" title="让一个方法，慢慢长成 Skill。" sub="从一段具体经历出发，把步骤、证据与边界写清楚。" /><div className="incubator-grid"><div>
    <section className="panel"><div className="section-head"><h2>从一段真实经历开始</h2><button className="text-button" onClick={() => patch({ raw: DEMO_EXPERIENCE })}>填入演示素材</button></div><p>粘贴文本或 Markdown。示例素材为演示编写；知乎链接需先粘贴回答正文。</p><label className="field-block" htmlFor="raw-experience">经历原文<textarea id="raw-experience" rows={6} maxLength={12000} value={draft.raw} onChange={e => patch({ raw: e.target.value })} placeholder="遇到了什么问题？原来怎么做？你先…然后…最后…" /></label><div className="section-head"><button className="outline" onClick={extract}>提炼成 Skill <Sparkles size={16} /></button><small>{draft.raw.length} / 12000</small></div><p className="small">规则提炼草稿 · 请逐步核验，未调用大模型。</p></section>
    <section className="panel"><label className="field-block" htmlFor="draft-title">Skill 名称<input id="draft-title" className="title-input" maxLength={80} value={draft.title} onChange={e => patch({ title: e.target.value })} /></label><label className="field-block" htmlFor="draft-problem">它解决什么问题<textarea id="draft-problem" maxLength={2000} value={draft.kit.problem} onChange={e => patchKit({ problem: e.target.value })} /></label><div className="form-columns"><label htmlFor="draft-category">所属分馆<select id="draft-category" value={draft.category} onChange={e => patch({ category: e.target.value })}>{CATEGORY_NAMES.map(name => <option key={name}>{name}</option>)}</select></label><label htmlFor="draft-tags">领域标签（用逗号分隔）<input id="draft-tags" value={draft.kit.tags.join('，')} onChange={e => patchKit({ tags: e.target.value.split(/[,，、]/).map(tag => tag.trim()).filter(Boolean).slice(0, 8) })} /></label></div>
    <h3>5 步工作流程</h3><div className="workflow editable-workflow">{draft.kit.steps.map((step, index) => <label key={index} htmlFor={`step-${index}`}><span>{index + 1}</span><textarea id={`step-${index}`} aria-label={`步骤 ${index + 1}`} value={step} maxLength={500} rows={2} onChange={e => patchKit({ steps: draft.kit.steps.map((old, i) => i === index ? e.target.value : old) })} placeholder="写成别人能照着执行的一步" /></label>)}</div><div className="source-note">{draft.kit.source}</div><label className="field-block" htmlFor="draft-limits">已知局限<textarea id="draft-limits" value={draft.kit.limits} maxLength={3000} onChange={e => patchKit({ limits: e.target.value })} /></label></section>
    <section className="panel"><h2>让每一步都有来历</h2><label className="field-block" htmlFor="draft-story">作者的话<textarea id="draft-story" value={draft.story} maxLength={5000} onChange={e => patch({ story: e.target.value })} placeholder="为什么开始整理这套方法？" /></label><label className="field-block" htmlFor="draft-example">具体使用案例<textarea id="draft-example" value={draft.example} maxLength={5000} onChange={e => patch({ example: e.target.value })} placeholder="写明情境、做法与可观察的结果。" /></label><label className="field-block" htmlFor="draft-counterexample">反例与失效条件<textarea id="draft-counterexample" value={draft.counterexample} maxLength={5000} onChange={e => patch({ counterexample: e.target.value })} placeholder="什么情况下不适用？" /></label></section>
    </div><aside><section className="panel"><h3>发布前的三件小事</h3><div className="timeline"><div><b>一个具体问题</b><p>写出情境和需要做出的判断。</p></div><div><b>五步可执行流程</b><p>每一步至少 4 字，可直接修改。</p></div><div><b>明确适用边界</b><p>没有验证过的部分，保留不确定性。</p></div></div><button className="text-button" onClick={() => { const tags = normalizeTags(draft.kit.tags); if (!tags.length) { notify('当前标签尚未映射到能力维度，请到栖息地手动选择。'); return; } updateZoo(s => ({ ...s, supply: tags })); notify('已用当前标签更新能力供给，需求可在栖息地调整。'); }}>用标签更新我的能力供给</button></section><section className="panel"><h3>你希望别人怎样获得它？</h3><div className="publish-options">{ACCESS.map((access, index) => <label className={draft.access === access ? 'chosen' : ''} key={access}><input type="radio" name="access" value={access} checked={draft.access === access} onChange={() => patch({ access })} /><span><b>{access}</b><small>{['直接查看全部步骤','交换卡通过审核后查看','反例或交叉测试通过审核后查看','预览前两步，保留交流入口'][index]}</small></span></label>)}</div><button className="primary full" onClick={publish}>{draft.skillId ? '保存并更新 Skill' : '发布 Skill'}<ArrowUpRight size={16} /></button><p className="small center">发布到本浏览器的演示社区。</p></section></aside></div></>;
}
