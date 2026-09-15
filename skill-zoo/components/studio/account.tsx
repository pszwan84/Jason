'use client';
import {useState} from 'react';
import {api,useAction} from '@/lib/platform/client';
import type {User} from '@/lib/platform/types';
export function Account({user,refresh}:{user:User|null;refresh:()=>void}){
 const [register,setRegister]=useState(false);const action=useAction();
 return <section className="studio-panel"><h2>{user?'我的身份':register?'加入 Skill Zoo':'登录后开始培养'}</h2>
 <p>{user?'完善你的领域，让同行更容易认识你。':'用邮箱和密码创建独立账号。邮箱目前仅作登录标识。'}</p>
 <form onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));void action.run(async()=>{await api('auth/'+(user?'profile':register?'register':'login'),'POST',data);form.reset();refresh();action.setMessage(user?'资料已保存':'登录成功');});}}>
 {(user||register)&&<label>名字<input name="name" defaultValue={user?.name} required maxLength={60} autoComplete="name"/></label>}
 {user?<><label>关注领域与简介<textarea name="bio" defaultValue={user.bio} maxLength={500}/></label><p className="studio-muted">账号 ID：{user.id}</p></>:<><label>邮箱<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>密码（至少 12 字符）<input name="password" type="password" autoComplete={register?'new-password':'current-password'} required minLength={12} maxLength={128}/></label></>}
 <button className="primary" disabled={action.busy}>{action.busy?'正在保存…':user?'保存身份':register?'注册并登录':'登录'}</button>
 </form>
 {user?<button className="outline" disabled={action.busy} onClick={()=>void action.run(async()=>{await api('auth/logout','POST');refresh();})}>退出登录</button>:<button type="button" className="text-button" onClick={()=>setRegister(v=>!v)}>{register?'已有账号，去登录':'创建新账号'}</button>}
 <output>{action.message}</output></section>;
}
