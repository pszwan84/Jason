'use client';
import {useState} from 'react';
import {api,useAction,useResource} from '@/lib/platform/client';
import type {Detail as DetailData,Skill,SkillBody,SkillQuality,User} from '@/lib/platform/types';
import {Model} from './model';
export function Detail({id,user,onEdit,onBack,onSelect}:{id:string;user:User|null;onEdit:(s:Skill)=>void;onBack:()=>void;onSelect:(id:string)=>void}){
 const resource=useResource<DetailData>('skills/'+id);const action=useAction();const [using,setUsing]=useState(false);
 if(resource.error)return <section className="studio-panel"><p>{resource.error}</p><button onClick={resource.refresh}>重试</button><button onClick={onBack}>返回列表</button></section>;
 if(!resource.data)return <output>正在打开 Skill…</output>;
 const {skill,feedback,versions,related,contributors}=resource.data;const content:SkillBody=JSON.parse(skill.body);const mine=user?.id===skill.owner_id;
 const quality:SkillQuality=resource.data.quality||{score:skill.status==='published'&&content.example.trim()?40:skill.status==='published'?20:0,label:skill.status==='published'?'初步验证':'待验证',confidence:skill.status==='published'?'中':'低',feedbackCount:feedback.length,caseCount:feedback.filter(f=>f.kind==='case').length,helpfulCount:feedback.filter(f=>f.kind==='helpful').length,unfitCount:feedback.filter(f=>f.kind==='unfit').length,versionCount:versions.length,contributorCount:contributors.length,source:content.example.trim()?'作者填写的经历与案例（旧服务未返回独立核验状态）':'作者填写的 Skill 内容（尚未提供案例）',sourceVerified:false,signals:['使用兼容模式：当前服务未返回质量摘要']};
 const sections:{key:keyof SkillBody;title:string}[]=[{key:'problem',title:'解决的问题'},{key:'input',title:'需要的输入'},{key:'output',title:'预期输出'},{key:'steps',title:'工作步骤'},{key:'example',title:'真实案例'},{key:'limits',title:'适用边界与局限'}];
 return <section className="studio-panel"><div className="studio-row"><button className="text-button" onClick={onBack}>← 返回发现</button><span>{skill.status==='published'?'公开方法':skill.status==='hidden'?'审核隐藏':'私有草稿'} · v{skill.revision}</span></div>
 <h2>{skill.title}</h2><p>{skill.author} · {skill.category} · {skill.tags}</p><div className="studio-row">
 {mine&&<button className="primary" disabled={skill.status==='hidden'} onClick={()=>onEdit(skill)}>编辑 / 发布新版本</button>}
 <button className="outline" disabled={!user||action.busy} onClick={()=>void action.run(async()=>{await api('skills/'+id+'/favorite','POST',{saved:!skill.favorite});resource.refresh();})}>{skill.favorite?'已收藏 · 取消收藏':'收藏方法'}</button>
 <button className="outline" onClick={()=>setUsing(v=>!v)}>{using?'收起使用清单':'开始使用方法'}</button></div>
 <section className="studio-trust" aria-labelledby="trust-title">
  <div className="studio-trust-header"><div><h3 id="trust-title">为什么值得尝试</h3><p className="studio-muted">把可核验的来源和反馈放在一起，方便你判断是否适合当前问题。</p></div><span className="studio-trust-label">透明信号</span></div>
  <div className="studio-trust-grid">
   <div><b>来源</b><p>{content.example.trim()?'作者已提供真实案例':'作者经验待补充'}</p><small>依据 Skill 中的案例字段</small></div>
   <div><b>实践反馈</b><p>{quality.feedbackCount?`${quality.feedbackCount} 条使用反馈`:'还没有使用反馈'}</p><small>{quality.caseCount?`${quality.caseCount} 个真实案例`:'欢迎提交第一个案例'}</small></div>
   <div><b>帮助度</b><p>{quality.score}% · {quality.label}</p><small>{quality.helpfulCount||quality.unfitCount?`${quality.helpfulCount} 有帮助 · ${quality.unfitCount} 不适用`:'按反馈类型计算，不使用黑盒评分'}</small></div>
   <div><b>维护状态</b><p>v{skill.revision} · {quality.versionCount} 次发布</p><small>{quality.contributorCount?`${quality.contributorCount} 位共同完善者`:'尚无共同完善者'} · 置信度{quality.confidence}</small></div>
  </div>
  <div className="studio-trust-footer"><div><b>适用边界</b><p>{content.limits.trim()||'作者尚未填写局限。开始使用前，请先用小范围案例验证。'}</p><small>{quality.source}</small></div><div className="studio-author"><b>认识作者 · {skill.author}</b><p>交换你的问题和实践结果，一起判断这套方法是否适合你的场景。</p>{mine?<span className="studio-muted">这是你发布的 Skill</span>:user?<a className="studio-inline-link" href="#author-exchange">发起交换卡 →</a>:<span className="studio-muted">登录后可以发起交换卡</span>}</div></div>
  <div className="studio-trust-signals"><b>评分依据</b><ul>{quality.signals.length?quality.signals.map(signal=><li key={signal}>{signal}</li>):<li>暂无可计算信号，先提交一个真实案例。</li>}</ul><small>来源是否经过平台独立核验：{quality.sourceVerified?'是':'否'}。分数仅用于辅助判断。</small></div>
 </section>
 {using&&<div className="studio-note"><h3>按步骤实践</h3><p>这是人工实践清单。准备上面要求的输入，执行步骤，再把结果作为案例反馈。</p>{content.steps.split('\n').filter(Boolean).map((step,i)=><label className="studio-check" key={i}><input type="checkbox"/>{step}</label>)}</div>}
 {sections.map(s=><section className="studio-subsection" key={s.key}><h3>{s.title}</h3><p className="studio-prose">{content[s.key]||'作者尚未填写'}</p></section>)}
 <details><summary>版本历史（{versions.length}）</summary>{versions.map(v=>{const b:SkillBody=JSON.parse(v.body);return <details className="studio-note" key={v.revision}><summary>v{v.revision} · {new Date(v.created).toLocaleDateString()} · {b.change||'发布方法'}</summary>{sections.map(s=><p className="studio-prose" key={s.key}><b>{s.title}：</b>{b[s.key]}</p>)}</details>;})}</details>
 <h3>共同完善的人</h3><p>{contributors.length?contributors.map(c=>c.name).join('、'):'还没有贡献者，分享第一个案例吧。'}</p>
 {mine&&<Model skillId={id} canGenerate={user?.canGenerate||false}/>}
 <section className="studio-subsection"><h3>使用反馈与案例</h3>{feedback.map(f=><article className="studio-note" key={f.id}><b>{f.name} · {{helpful:'有帮助',unfit:'不适用',suggestion:'改进建议',case:'真实案例'}[f.kind]||f.kind}</b><p className="studio-prose">{f.body}</p></article>)}
 {user?<form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const value=Object.fromEntries(new FormData(form));void action.run(async()=>{await api('skills/'+id+'/feedback','POST',value);form.reset();resource.refresh();});}}><label>反馈类型<select name="kind"><option value="helpful">有帮助</option><option value="unfit">不适用</option><option value="suggestion">改进建议</option><option value="case">真实案例</option></select></label><label>使用过程与结果<textarea name="body" required maxLength={4000}/></label><button className="primary" disabled={action.busy}>提交反馈</button></form>:<p>登录后可收藏、反馈、举报或发送交换卡。</p>}</section>
 {user&&!mine&&<details id="author-exchange"><summary>和作者交换经验</summary><form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const body=new FormData(form).get('body');void action.run(async()=>{await api('exchanges','POST',{skillId:id,body});form.reset();action.setMessage('交换卡已发送，可在消息与共创中查看');});}}><label>你的问题与愿意贡献的内容<textarea name="body" required maxLength={4000}/></label><button className="primary" disabled={action.busy}>发送交换卡</button></form></details>}
 {user&&<details><summary>举报此内容</summary><form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const reason=new FormData(form).get('reason');void action.run(async()=>{await api('skills/'+id+'/report','POST',{reason});form.reset();action.setMessage('举报已提交审核');});}}><label>举报原因<textarea name="reason" required maxLength={2000}/></label><button className="outline" disabled={action.busy}>提交举报</button></form></details>}
 <output>{action.message}</output>
 <h3>同领域方法</h3><p className="studio-muted">按相同领域与最近更新推荐。</p>{related.map(s=><button key={s.id} className="studio-related" onClick={()=>onSelect(s.id)}>{s.title} →</button>)}
 </section>;
}
