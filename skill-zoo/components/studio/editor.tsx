'use client';
import {useEffect,useRef,useState} from 'react';
import {categories,emptySkill,type Skill,type SkillBody} from '@/lib/platform/types';
import {api,useAction} from '@/lib/platform/client';
import {distill} from '@/lib/platform/distill';
import {EvaluationPanel} from '@/components/skill-evaluation/report';
import type {SkillDocument} from '@/lib/evaluation/schema';
const fields: {key:keyof SkillBody;label:string;max:number}[]=[{key:'problem',label:'它解决什么问题',max:4000},{key:'input',label:'使用者需要提供什么输入',max:4000},{key:'output',label:'预期获得什么输出',max:4000},{key:'steps',label:'工作步骤（每行一步）',max:8000},{key:'example',label:'一个真实案例',max:8000},{key:'limits',label:'适用边界与已知局限',max:4000},{key:'change',label:'这次改进了什么',max:1000}];
export function Editor({skill,userId,onSaved,onCancel}:{skill?:Skill;userId:string;onSaved:(id:string)=>void;onCancel:()=>void}){
 const initial:SkillBody=skill?JSON.parse(skill.body):{...emptySkill};
 const [value,setValue]=useState<SkillBody>(initial);const [restore,setRestore]=useState<SkillBody|null>(null);const [storageError,setStorageError]=useState('');
 const action=useAction();const key=`zoo:editor:${userId}:${skill?.id||'new'}`;
 const [experience,setExperience]=useState('');const [distilled,setDistilled]=useState(Boolean(skill));const nameRef=useRef<HTMLInputElement>(null);
 const evaluationSkill:SkillDocument={title:value.title,purpose:value.problem,scenarios:value.category,inputs:value.input,outputs:value.output,workflow:value.steps,criteria:'请根据案例和适用边界检查结论。',positiveExample:value.example,negativeExample:'',limitations:value.limits,story:'',successStory:value.example,pitfalls:'',focus:value.change};
 useEffect(()=>{try{const raw=localStorage.getItem(key);if(raw){const saved:unknown=JSON.parse(raw);if(saved&&typeof saved==='object'&&Object.keys(emptySkill).every(k=>typeof (saved as Record<string,unknown>)[k]==='string'))queueMicrotask(()=>setRestore(saved as SkillBody));}}catch{queueMicrotask(()=>setStorageError('无法读取浏览器草稿，请使用保存草稿按钮。'));}},[key]);
 function change(k:keyof SkillBody,v:string){const next={...value,[k]:v};setValue(next);try{localStorage.setItem(key,JSON.stringify(next));setStorageError('');}catch{setStorageError('浏览器备份失败，请保存草稿到账号。');}}
 function clear(){try{localStorage.removeItem(key);}catch{/* Saved on server; local storage may be disabled. */}}
 async function save(status:'draft'|'published'){await action.run(async()=>{const result=await api<{id:string}>('skills'+(skill?'/'+skill.id:''),skill?'PATCH':'POST',{body:value,status,revision:skill?.revision||0});clear();onSaved(result.id);});}
 function extract(){const result=distill(experience);if(experience.trim().length<30){action.setMessage('请先粘贴至少 30 字的真实经历。');return;}const steps=Array.from({length:5},(_,i)=>result.steps[i]||'');const next={...value,title:value.title||result.title,problem:result.problem,input:value.input||'相关背景、参与者、目标和可用材料',output:value.output||'一套可执行、可复盘的解决步骤',steps:steps.join('\n'),example:value.example||experience.trim().slice(0,800),tags:result.tags.join(' '),limits:value.limits||'尚未经独立案例验证；请先核验适用范围。'};setValue(next);try{localStorage.setItem(key,JSON.stringify(next));setStorageError('');}catch{setStorageError('浏览器备份失败，请保存草稿到账号。');}setDistilled(true);action.setMessage(result.steps.length<5?'已提取部分步骤，请补齐后发布。':'已提炼 5 步草稿，请核验并编辑。');queueMicrotask(()=>nameRef.current?.focus());}
 return <section className="studio-panel"><div className="studio-row"><h2>{skill?'继续培养 · '+skill.title:'让经验长成 Skill'}</h2><button className="outline" onClick={onCancel}>返回</button></div>
 <p>把一次真实解决过程整理成可复用的方法。草稿可随时保存；发布前请核验内容与适用边界。</p>
 {!skill&&<section className="studio-note" aria-labelledby="distill-heading"><h3 id="distill-heading">第 1 步 · 粘贴真实经历</h3><p>先写清楚问题、你的做法和验证结果。系统会生成标题、步骤和标签，生成内容仍由你确认。</p><label htmlFor="experience">你的经历<textarea id="experience" value={experience} onChange={e=>setExperience(e.target.value)} rows={7} maxLength={12000} placeholder="我遇到了什么问题？先做了什么？后来如何验证？"/><span className="studio-muted">{experience.trim().length}/30 字起 · 最多 12,000 字</span></label><button type="button" className="primary" onClick={extract}>提炼成 Skill</button></section>}
 {restore&&<div className="studio-note">发现尚未提交的浏览器草稿。<button onClick={()=>{setValue(restore);setDistilled(true);setRestore(null);}}>恢复草稿</button><button onClick={()=>{clear();setRestore(null);}}>忽略备份</button></div>}
 {!skill&&!distilled&&<button type="button" className="outline" onClick={()=>setDistilled(true)}>跳过提炼，手动填写</button>}
 {distilled&&<form onSubmit={e=>{e.preventDefault();void save('published');}}><fieldset disabled={action.busy}>
 <h3>{skill?'完善并发布新版本':distilled?'第 2 步 · 核验并发布':'第 2 步 · 编辑方法内容'}</h3><p className="studio-muted">逐项检查标题、步骤、案例和局限；确认后再发布，方法才会进入 Skill Zoo。</p>
 <label>Skill 名称<input ref={nameRef} value={value.title} onChange={e=>change('title',e.target.value)} required maxLength={80}/></label>
 <div className="studio-grid"><label>领域<select value={value.category} onChange={e=>change('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>标签（空格分隔）<input value={value.tags} onChange={e=>change('tags',e.target.value)} maxLength={160}/></label></div>
 {fields.map(f=><label key={f.key}>{f.label}<textarea value={value[f.key]} onChange={e=>change(f.key,e.target.value)} maxLength={f.max} required={f.key!=='change'} rows={f.key==='steps'?5:3}/></label>)}
 <div className="studio-row"><button type="button" className="outline" onClick={()=>void save('draft')}>保存为私有草稿</button><button className="primary">{action.busy?'正在保存…':skill?'发布新版本':'发布 Skill'}</button></div></fieldset></form>}
 {skill&&<button className="studio-danger" disabled={action.busy} onClick={()=>{if(window.confirm('删除此 Skill 及其版本、反馈和生成记录？此操作不可恢复。'))void action.run(async()=>{await api('skills/'+skill.id,'DELETE');clear();onCancel();});}}>删除 Skill</button>}
 <EvaluationPanel skill={evaluationSkill} onImprove={()=>nameRef.current?.focus()}/>
 <output>{action.message||storageError}</output></section>;
}
