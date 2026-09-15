'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {api,useAction,useResource} from '@/lib/platform/client';
import type {Job} from '@/lib/platform/types';
const labels:Record<string,string>={creating:'创建中',queued:'排队中',running:'生成中',success:'生成完成',failed:'生成失败',cancelled:'已取消',banned:'内容未通过审核',unknown:'结果未知，请先在 Tripo 控制台核对'};
export function Model({skillId,canGenerate}:{skillId:string;canGenerate:boolean}){
 const list=useResource<{jobs:Job[]}>('skills/'+skillId+'/jobs');const [selected,setSelected]=useState<Job|null>(null);const [pollError,setPollError]=useState('');const [polling,setPolling]=useState(true);const action=useAction();
 const job=selected||list.data?.jobs[0];
 useEffect(()=>{if(selected||!list.data?.jobs[0]?.id||!['success','failed','cancelled','banned'].includes(list.data.jobs[0].status))return;let active=true;api<Job>('jobs/'+list.data.jobs[0].id).then(next=>{if(active)setSelected(next);}).catch(()=>{});return()=>{active=false;};},[selected,list.data?.jobs]);
 useEffect(()=>{if(!job?.id||!['queued','running'].includes(job.status)||!polling)return;let active=true;let timer:ReturnType<typeof setTimeout>;const start=Date.now();
 async function poll(){try{const next=await api<Job>('jobs/'+job!.id);if(active){setSelected(next);setPollError('');}}catch(e){if(active){setPollError(e instanceof Error?e.message:'查询失败');setPolling(false);}}if(active&&Date.now()-start<180000)timer=setTimeout(()=>void poll(),5000);}
 timer=setTimeout(()=>void poll(),5000);return()=>{active=false;clearTimeout(timer);};},[job?.id,job?.status,polling]);
 return <section className="studio-subsection"><h3>为方法生成一个 3D 形象</h3><p>描述你心中的形象；生成会使用 Tripo 额度。完成后可查看渲染图并下载模型。</p>
 {!canGenerate&&<p className="studio-note">管理员开通生成权限并配置服务后可使用。</p>}
 <form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const prompt=new FormData(form).get('prompt');void action.run(async()=>{const next=await api<Job>('skills/'+skillId+'/jobs','POST',{prompt,confirmCost:true});setSelected(next);setPolling(true);list.refresh();});}}>
 <label>形象描述<textarea name="prompt" required maxLength={1000} placeholder="一棵由书页组成的树，温暖的绿色，低多边形风格"/></label>
 <label className="studio-check"><input type="checkbox" required/>确认使用生成额度（每人每天最多 3 次尝试）</label>
 <button className="primary" disabled={!canGenerate||action.busy||!!job&&['creating','queued','running'].includes(job.status)}>{action.busy?'提交中…':'生成 3D 形象'}</button></form>
 {job&&<div><output>{labels[job.status]||job.status} {job.progress!==undefined?`${job.progress}%`:''}</output>
 <button className="outline" disabled={action.busy} onClick={()=>void action.run(async()=>{setSelected(await api<Job>('jobs/'+job.id));setPolling(true);})}>重新查询 / 刷新下载链接</button>
 {job.imageUrl&&<Image unoptimized width={400} height={400} className="studio-model" src={job.imageUrl} alt="生成的 Skill 形象预览" referrerPolicy="no-referrer"/>}
 {job.modelUrl&&<p><a className="primary" href={job.modelUrl} target="_blank" rel="noopener noreferrer">下载 GLB 模型</a> 链接约 5 分钟有效，请及时下载。</p>}</div>}
 <output>{action.message||pollError||list.error}</output></section>;
}
