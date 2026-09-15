'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {Sprout,Plus,Search,ArrowUpRight} from 'lucide-react';
import {categories,type Skill,type User} from '@/lib/platform/types';
import {useResource} from '@/lib/platform/client';
import {Account} from './account';
import {Editor} from './editor';
import {Detail} from './detail';
import {Inbox,Moderation} from './inbox';
type View={tab:'discover'|'mine'|'saved'|'account'|'inbox'|'admin'}|{tab:'editor';skill?:Skill}|{tab:'detail';id:string};
export function Workspace(){
 const session=useResource<{user:User|null}>('auth/me');const user=session.data?.user||null;
 const inbox=useResource<{notifications:{read:number}[]}>('inbox',!!user);
 useEffect(()=>{if(!user)return;const refresh=()=>{if(document.visibilityState==='visible')inbox.refresh();};document.addEventListener('visibilitychange',refresh);return()=>document.removeEventListener('visibilitychange',refresh);},[user?.id]);
 const [view,setView]=useState<View>({tab:'discover'});const [q,setQ]=useState('');const [category,setCategory]=useState('');const [page,setPage]=useState(1);const [epoch,setEpoch]=useState(0);
 useEffect(()=>{const sync=()=>{const id=new URLSearchParams(window.location.search).get('skill');setView(id?{tab:'detail',id}:{tab:'discover'});};sync();window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
 function navigate(next:View){setView(next);setPage(1);window.history.pushState(null,'',next.tab==='detail'?'/studio?skill='+encodeURIComponent(next.id):'/studio');window.scrollTo({top:0});}
 const query=new URLSearchParams({q,category,page:String(page),mine:String(view.tab==='mine'),saved:String(view.tab==='saved'),epoch:String(epoch)});
 const listing=useResource<{items:Skill[];total:number}>('skills?'+query);
 function changed(){session.refresh();listing.refresh();setEpoch(v=>v+1);}
 const isList=['discover','mine','saved'].includes(view.tab);
 const unread=user&&inbox.data?inbox.data.notifications.filter(n=>!n.read).length:0;
 return <div className="studio"><header className="studio-header"><Link className="studio-brand" href="/"><Sprout/> Skill Zoo<span>生长工作台</span></Link><div className="studio-row"><Link href="/">浏览原型</Link><button className="outline" onClick={()=>navigate({tab:'account'})}>{user?user.name:'登录 / 注册'}</button></div></header>
 <div className="studio-layout"><nav aria-label="工作台导航" className="studio-nav">{([{tab:'discover',label:'发现方法'},{tab:'mine',label:'我的 Skill'},{tab:'saved',label:'我的收藏'},{tab:'inbox',label:'消息与共创'},{tab:'account',label:'个人身份'},...(user?.admin?[{tab:'admin',label:'内容审核'}]:[])] as {tab:'discover'|'mine'|'saved'|'inbox'|'account'|'admin';label:string}[]).map(item=><button aria-current={view.tab===item.tab?'page':undefined} key={item.tab} onClick={()=>navigate({tab:item.tab})}>{item.label}{item.tab==='inbox'&&unread>0&&<span className="studio-badge" aria-label={`${unread} 条未读通知`}>{unread>99?'99+':unread}</span>}</button>)}<button className="primary" onClick={()=>navigate(user?{tab:'editor'}:{tab:'account'})}><Plus size={16}/> 创建 Skill</button><p>一个问题，一套方法，<br/>一起验证，持续生长。</p></nav>
 <main className="studio-main"><span className="eyebrow">GROW THROUGH PRACTICE</span><h1>{view.tab==='discover'?'让好方法，真正被用起来。':view.tab==='mine'?'认真积累，每一步都有来历。':view.tab==='inbox'?'从具体问题开始连接。':'让经验持续生长。'}</h1>
 {session.error&&<div className="studio-note">{session.error}<button onClick={session.refresh}>重新连接</button></div>}
 {view.tab==='account'&&<Account key={user?.id||'guest'} user={user} refresh={changed}/>}
 {view.tab==='editor'&&user&&<Editor key={view.skill?.id||'new'} skill={view.skill} userId={user.id} onSaved={id=>{changed();navigate({tab:'detail',id});}} onCancel={()=>{listing.refresh();navigate({tab:'mine'});}}/>}
 {view.tab==='detail'&&<Detail key={view.id+epoch} id={view.id} user={user} onEdit={skill=>navigate({tab:'editor',skill})} onBack={()=>navigate({tab:'discover'})} onSelect={id=>navigate({tab:'detail',id})}/>}
 {view.tab==='inbox'&&(user?<Inbox key={user.id} user={user}/>:<Account user={null} refresh={changed}/>)}
 {view.tab==='admin'&&user?.admin&&<Moderation/>}
 {isList&&<><form className="studio-search" onSubmit={e=>{e.preventDefault();const value=new FormData(e.currentTarget).get('q');setQ(typeof value==='string'?value:'');setPage(1);}}><Search size={20}/><input name="q" aria-label="搜索方法或标签" placeholder="你正在解决什么问题？" maxLength={160}/><button className="primary">搜索</button></form>
 <div className="studio-row"><label>领域筛选<select value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">全部领域</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><p>{listing.data?.total||0} 个方法</p></div>
 {view.tab!=='discover'&&!user&&<p>登录后可查看自己的方法与收藏。</p>}
 {listing.error?<div className="studio-note">{listing.error}<button onClick={listing.refresh}>重试</button></div>:!listing.data?<output>正在寻找方法…</output>:listing.data.items.length?<div className="studio-cards">{listing.data.items.map(s=><article key={s.id} className="studio-card"><div className="studio-row"><span className="studio-pill">{s.category}</span><small>{s.status==='published'?'公开方法':s.status==='hidden'?'审核隐藏':'私有草稿'} · v{s.revision}</small></div><button className="studio-card-title" onClick={()=>navigate({tab:'detail',id:s.id})}>{s.title}<ArrowUpRight size={20}/></button><p>{s.tags||'从真实问题出发'}</p>{s.matchReason&&<small className="studio-match-reason">{s.matchReason}</small>}<div className="studio-row"><span>由 {s.author} 培养</span><small>{s.favorite?'已收藏':''}</small></div></article>)}</div>:<div className="studio-panel"><h2>这里还在等待第一颗种子</h2><p>{q?'试试不同的关键词，或选择全部领域。':'写下一个你反复解决的问题，让它长成可复用的方法。'}</p><button className="primary" onClick={()=>navigate(user?{tab:'editor'}:{tab:'account'})}>创建我的第一个 Skill</button></div>}
 <div className="studio-row studio-pagination"><button className="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>上一页</button><span>第 {page} 页</span><button className="outline" disabled={!listing.data||page*12>=listing.data.total} onClick={()=>setPage(p=>p+1)}>下一页</button></div></>}
 </main></div></div>;
}
