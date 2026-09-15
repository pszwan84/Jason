'use client';
import { useState } from 'react';
import { ArrowUpRight, Sprout } from 'lucide-react';
import { FIELD_LABELS, FIELD_LIMITS, FIELD_KEYS, MAX_TOTAL_CHARS, type SkillField, type SkillDocument } from '@/lib/evaluation/schema';
import { EvaluationPanel } from './report';

const INITIAL: Omit<SkillDocument, 'title' | 'story'> = {
  purpose: '帮助用户判断一篇论文真正的研究创新在哪里。', scenarios: '论文精读、文献综述、研究选题、方法比较。',
  workflow: '1. 提取研究问题\n2. 找到基线方法\n3. 区分方法变化与研究贡献\n4. 判断创新是否可验证\n5. 给出证据与结论',
  criteria: '是否提出了新的问题、方法、机制或可验证结论。', inputs: '', outputs: '',
  positiveExample: '', negativeExample: '', limitations: '对高度理论化论文的判断稳定性仍然不足。',
  successStory: '', pitfalls: '', focus: '',
};
export function Incubator({ title, setTitle, story, setStory, isNew, initialPurpose, publish, setPublish, onPublish }: {
  title: string; setTitle: (value: string) => void; story: string; setStory: (value: string) => void;
  isNew: boolean; initialPurpose: string; publish: string; setPublish: (value: string) => void; onPublish: () => void;
}) {
  const [materials, setMaterials] = useState<Omit<SkillDocument, 'title' | 'story'>>(() => isNew ? { ...Object.fromEntries(Object.keys(INITIAL).map(key => [key, ''])), purpose: initialPurpose } as typeof INITIAL : INITIAL);
  const skill: SkillDocument = { ...materials, title, story };
  const count = FIELD_KEYS.reduce((n, key) => n + skill[key].length, 0);
  function update(field: SkillField, value: string) {
    if (field === 'title') setTitle(value); else if (field === 'story') setStory(value); else setMaterials(data => ({ ...data, [field]: value }));
  }
  function improve(field: SkillField = 'workflow') {
    const target = document.getElementById(`skill-field-${field}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' }); target?.focus({ preventScroll: true });
  }
  function input(field: SkillField, placeholder: string, rows = 3) {
    return <div className="field-block"><label htmlFor={`skill-field-${field}`}>{FIELD_LABELS[field]}{['purpose', 'workflow'].includes(field) && <span className="evaluation-required"> 必填</span>}</label><textarea id={`skill-field-${field}`} maxLength={FIELD_LIMITS[field]} rows={rows} value={skill[field]} onChange={e => update(field, e.target.value)} placeholder={placeholder}/><small className="evaluation-field-count">{skill[field].length} / {FIELD_LIMITS[field]}</small></div>;
  }
  return <div className="incubator-grid evaluation-layout"><div>
    <section className="panel evaluation-editor" id="skill-materials"><div className="eyebrow"><Sprout size={16}/> 正在培养 · 把经验写成可以检查的方法</div><label htmlFor="skill-field-title" className="evaluation-name-label">Skill 名称 <span className="evaluation-required">必填</span></label><input className="title-input" id="skill-field-title" maxLength={FIELD_LIMITS.title} value={title} onChange={e => setTitle(e.target.value)} placeholder="给这个 Skill 起个名字"/>
      <p>评估只使用这里实际填写的内容。案例数量和成长天数不会代替原文证据。</p>
      {input('purpose', '它帮助谁，解决什么具体问题？')}
      {input('scenarios', '适用于哪些任务？有哪些不适用的场景？', 2)}
      <div className="evaluation-input-output">{input('inputs', '使用前需要哪些信息、资料或格式？')}{input('outputs', '结果应该包含什么，如何判断已完成？')}</div>
      {input('workflow', '按顺序写清每一步做什么、如何判断以及下一步是什么。', 6)}
      {input('criteria', '用什么依据做判断？如何检查结论是否成立？')}
      {input('limitations', '什么时候不应使用？不确定、失败或缺少材料时怎么办？')}
    </section>
    <section className="panel evaluation-editor"><h2>让案例成为依据</h2><p>写出具体输入、执行过程与结果。暂时没有就留空，报告会指出这一缺口。</p>
      {input('positiveExample', '一个真实成功案例：当时的输入是什么？按哪些步骤执行？得到了什么结果？', 5)}
      {input('negativeExample', '一个失败或不适用的案例：哪里出了问题？如何发现，应该如何处理？', 5)}
    </section>
    <section className="panel evaluation-editor"><h2>它是怎么长出来的</h2><p>好的 Skill 都有来历。记录你的经历，也帮助别人理解方法的边界。</p>{input('story', '为什么开始做它？', 4)}{input('successStory', '哪一次经历让你觉得这套方法真的有用？')}{input('pitfalls', '哪些判断后来被证明是错的？')}{input('focus', '这次特别希望检查什么？例如：步骤是否足够具体。', 2)}<p className={count > MAX_TOTAL_CHARS ? 'evaluation-limit-exceeded' : 'evaluation-total-count'}>材料合计 {count.toLocaleString()} / {MAX_TOTAL_CHARS.toLocaleString()} 字符</p></section>
  </div><aside>
    <EvaluationPanel skill={skill} onImprove={improve}/>
    {!isNew && <section className="panel"><h3>每一步，都有来历</h3><div className="timeline">{[['第一次形成方法','找到了 5 个稳定步骤'],['第 8 次纠错','增加“证据是否支持创新”的判断'],['加入案例库','12 个正例，8 个反例'],['第一次被别人使用','收到 3 条反馈'],['v2.0 · 正在生长','增加边界条件与拒答规则']].map(([title, description]) => <div key={title}><b>{title}</b><p>{description}</p></div>)}</div><p className="small">示例成长记录；评估以左侧实际填写的材料为准。</p></section>}
    <section className="panel"><h3>你希望别人怎样获得它？</h3><div className="publish-options">{['完全开放','交换后开放','贡献后开放','体验版'].map((v,i) => <label className={publish === v ? 'chosen' : ''} key={v}><input type="radio" name="publish" checked={publish === v} onChange={() => setPublish(v)}/><span><b>{v} {i === 2 && <em>推荐</em>}</b><small>{['所有人都可以直接使用','先介绍自己，以及为什么需要它','带来一个案例、测试或建议','先体验部分能力，再交流'][i]}</small></span></label>)}</div><button className="primary full" onClick={onPublish}>发布 Skill <ArrowUpRight size={17}/></button><p className="small center">评估提供改进参考，不代替你的领域判断。</p></section>
  </aside></div>;
}
