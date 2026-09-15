'use client';
import {api,useAction,useResource} from '@/lib/platform/client';
import type {Exchange,Notice,Report,Task,User} from '@/lib/platform/types';
export function Inbox({user}:{user:User}){
 const resource=useResource<{exchanges:Exchange[];tasks:Task[];notifications:Notice[]}>('inbox');const action=useAction();
 return <section className="studio-panel"><div className="studio-row"><h2>消息与共创</h2><button className="outline" onClick={resource.refresh}>刷新消息</button></div><output>{resource.error||action.message}</output>
 {!resource.data?<p>正在加载…</p>:<><h3>通知</h3>{!resource.data.notifications.length&&<p>还没有通知。发布一个方法，让同行发现你。</p>}{resource.data.notifications.map(n=><div className="studio-note studio-row" key={n.id}><span>{n.body}</span>{n.read?<small>已读</small>:<button disabled={action.busy} onClick={()=>void action.run(async()=>{await api('notifications/'+n.id,'PATCH',{});resource.refresh();})}>标记已读</button>}</div>)}
<h3>交换卡</h3>{!resource.data.exchanges.length&&<p>在其他作者的 Skill 详情中发送交换卡，开启共创。</p>}{resource.data.exchanges.map(e=><article className="studio-subsection" key={e.id}><b>{e.sender_name} → {e.recipient_name}</b>{e.skill_id&&e.skill_title&&<p><a className="studio-inline-link" href={`/studio?skill=${encodeURIComponent(e.skill_id)}`}>回到「{e.skill_title}」→</a></p>}<p className="studio-prose">{e.body}</p><p>{{pending:'等待回应',accepted:'已接受，开始共创',declined:'已婉拒'}[e.status]}</p>
 {e.recipient===user.id&&e.status==='pending'&&<div className="studio-row">{(['accepted','declined'] as const).map(status=><button className="outline" disabled={action.busy} key={status} onClick={()=>void action.run(async()=>{await api('exchanges/'+e.id,'PATCH',{status});resource.refresh();})}>{status==='accepted'?'接受共创':'婉拒'}</button>)}</div>}
 {e.status==='accepted'&&<><h4>共同任务</h4>{resource.data!.tasks.filter(t=>t.exchange_id===e.id).map(t=><label key={t.id} className="studio-check"><input type="checkbox" checked={!!t.done} disabled={action.busy} onChange={event=>{const done=event.target.checked;void action.run(async()=>{await api('tasks/'+t.id,'PATCH',{done});resource.refresh();});}}/>{t.title}</label>)}<form onSubmit={event=>{event.preventDefault();const form=event.currentTarget;const title=new FormData(form).get('title');void action.run(async()=>{await api('tasks','POST',{exchangeId:e.id,title});form.reset();resource.refresh();});}}><label>新增共创任务<input name="title" required maxLength={200}/></label><button className="outline" disabled={action.busy}>添加任务</button></form></>}
 </article>)}</>}
 </section>;
}
export function Moderation(){
 const resource=useResource<{reports:Report[]}>('reports');const action=useAction();
 return <section className="studio-panel"><h2>内容审核</h2><output>{resource.error||action.message}</output>{resource.data?.reports.length===0&&<p>暂无举报。</p>}{resource.data?.reports.map(r=><article className="studio-note" key={r.id}><h3>{r.title}</h3><p>{r.reason}</p><p>{r.status}</p>{r.status==='pending'&&<div className="studio-row">{['hide','dismiss'].map(value=><button className="outline" disabled={action.busy} key={value} onClick={()=>void action.run(async()=>{await api('reports/'+r.id,'PATCH',{action:value});resource.refresh();})}>{value==='hide'?'隐藏 Skill':'驳回举报'}</button>)}</div>}</article>)}</section>;
}
