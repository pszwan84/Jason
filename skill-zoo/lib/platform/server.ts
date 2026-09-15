import { ApiError, assertOrigin } from './validation.ts';
import type { User } from './types.ts';
type Bindings = { DB: D1Database; TRIPO_API_KEY?: string; TRIPO_MODEL?: string; ADMIN_USER_IDS?: string; TRIPO_USER_IDS?: string };
export let config: Bindings;
export function configure(bindings: Bindings) { config=bindings; }
export const db = () => { if (!config.DB) throw new ApiError(503, '数据库尚未配置'); return config.DB; };
export const id = () => crypto.randomUUID();
export const now = () => Date.now();
export function json(data: unknown, status = 200, headers: Record<string,string> = {}) {
  return Response.json(data, {status, headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
}
export async function body(req: Request): Promise<unknown> {
  if (!req.headers.get('content-type')?.includes('application/json')) throw new ApiError(415,'需要 JSON 请求');
  const reader = req.body?.getReader(); if (!reader) throw new ApiError(400,'请求为空');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const r=await reader.read(); if(r.done) break; size+=r.value.length; if(size>40000){await reader.cancel();throw new ApiError(413,'内容过长');} chunks.push(r.value); }
  const bytes=new Uint8Array(size); let offset=0; for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ApiError(400,'JSON 格式不正确');}
}
export async function digest(value: string) {return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function passwordHash(password: string, salt = id()) {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256);
  return `${salt}:${Array.from(new Uint8Array(bits)).map(x=>x.toString(16).padStart(2,'0')).join('')}`;
}
export function equal(a: string,b: string) {if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
export function token(req: Request) {return req.headers.get('cookie')?.match(/(?:^|;\s*)zoo_session=([a-f0-9]{64})(?:;|$)/)?.[1] || '';}
export function publicUser(u: {id:string;email:string;name:string;bio:string}): User {
  return {...u,admin:(config.ADMIN_USER_IDS||'').split(',').includes(u.id),canGenerate:(config.TRIPO_USER_IDS||'').split(',').includes(u.id)&&!!config.TRIPO_API_KEY};
}
export async function current(req:Request) {
  const t=token(req); if(!t)return null;
  const u=await db().prepare('SELECT u.id,u.email,u.name,u.bio FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.hash=? AND s.expires>?').bind(await digest(t),now()).first<{id:string;email:string;name:string;bio:string}>();
  return u?publicUser(u):null;
}
export async function requireUser(req:Request) {const u=await current(req);if(!u)throw new ApiError(401,'请先登录');return u;}
export async function rate(key:string,max:number,seconds=60) {
  const bucket=Math.floor(now()/(seconds*1000));
  const r=await db().prepare('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(`${key}:${bucket}`,now()+seconds*1000).first<{count:number}>();
  if((r?.count||0)>max)throw new ApiError(429,'操作过于频繁，请稍后重试');
}
export function notification(user:string,message:string) {return db().prepare('INSERT INTO notifications VALUES(?,?,?,0,?)').bind(id(),user,message,now());}
export function guarded(fn:(req:Request)=>Promise<Response>) {return async(req:Request)=>{try{assertOrigin(req);return await fn(req);}catch(e){if(e instanceof ApiError)return json({error:e.message},e.status);console.error('platform request failed',e instanceof Error?e.name:'UnknownError');return json({error:'服务暂时不可用，请稍后重试；本地首次运行请先执行数据库迁移。'},500);}};}
