import { ApiError, field, object } from './validation.ts';
import { body, current, db, digest, equal, id, json, now, passwordHash, publicUser, rate, requireUser, token } from './server.ts';
export async function auth(req:Request,action:string) {
  if(req.method==='GET'&&action==='me')return json({user:await current(req)});
  if(req.method!=='POST')throw new ApiError(405,'不支持该操作');
  if(action==='logout'){await db().prepare('DELETE FROM sessions WHERE hash=?').bind(await digest(token(req))).run();return json({ok:true},200,{'Set-Cookie':'zoo_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});}
  if(action==='profile'){
    const u=await requireUser(req);const v=object(await body(req));
    await db().prepare('UPDATE users SET name=?,bio=? WHERE id=?').bind(field(v.name,'名字',60),field(v.bio,'简介',500,false),u.id).run();return json({ok:true});
  }
  if(!['login','register'].includes(action))throw new ApiError(404,'接口不存在');
  await rate(`auth:${req.headers.get('cf-connecting-ip')||'local'}`,12,900);
  const v=object(await body(req)); const email=field(v.email,'邮箱',254).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError(400,'邮箱格式不正确');
  if(typeof v.password!=='string'||v.password.length<12||v.password.length>128)throw new ApiError(400,'密码需为 12–128 字符');
  let u: {id:string;email:string;name:string;bio:string}|null;
  if(action==='register'){
    const name=field(v.name,'名字',60);const uid=id();
    const r=await db().prepare('INSERT OR IGNORE INTO users VALUES(?,?,?,?,?,?)').bind(uid,email,name,'',await passwordHash(v.password),now()).run();
    if(!r.meta.changes)throw new ApiError(409,'该邮箱无法注册，请尝试登录');
    u={id:uid,email,name,bio:''};
  }else{
    const row=await db().prepare('SELECT * FROM users WHERE email=?').bind(email).first<{id:string;email:string;name:string;bio:string;password:string}>();
    const hash=await passwordHash(v.password,row?.password.split(':')[0]||'missing-user-salt');
    if(!row||!equal(hash,row.password))throw new ApiError(401,'邮箱或密码不正确');
    u={id:row.id,email:row.email,name:row.name,bio:row.bio};
  }
  const raw=(id()+id()).replaceAll('-','');
  await db().batch([db().prepare('DELETE FROM sessions WHERE expires<?').bind(now()),db().prepare('DELETE FROM limits WHERE expires<?').bind(now()),db().prepare('INSERT INTO sessions VALUES(?,?,?)').bind(await digest(raw),u.id,now()+7*86400000)]);
  return json({user:publicUser(u)},200,{'Set-Cookie':`zoo_session=${raw}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${new URL(req.url).protocol==='https:'?'; Secure':''}`});
}
