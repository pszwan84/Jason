import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sqlite} from '../lib/platform/sqlite.ts';
import {configure} from '../lib/platform/server.ts';
import {handler} from '../lib/platform/handler.ts';
import {emptySkill} from '../lib/platform/types.ts';
void test('two-user lifecycle, authorization, moderation, Tripo failures and persistence',async()=>{
 const DB=sqlite(':memory:');configure({DB});
 async function call(path:string,method:'GET'|'POST'|'PATCH'|'DELETE'='GET',payload?:unknown,cookie=''){
  const options:RequestInit={method,headers:{origin:'http://localhost','content-type':'application/json',cookie}};if(method!=='GET'&&payload!==undefined)options.body=JSON.stringify(payload);
  const res=await handler(new Request('http://localhost/api/platform/'+path,options));
  return {status:res.status,data:await res.json() as {id:string;user:{id:string}|null;total:number;status:string;imageUrl?:string;versions:unknown[];contributors:{name:string}[];notifications:unknown[];exchanges:{id:string;skill_id:string|null}[];tasks:{id:string;done:number}[];jobs:{status:string}[];reports:{id:string}[]},cookie:res.headers.get('set-cookie')?.split(';')[0]||''};
 }
 const a=await call('auth/register','POST',{email:'a@example.test',password:'testing-password-123',name:'Alice'});assert.equal(a.status,200);
 const b=await call('auth/register','POST',{email:'b@example.test',password:'testing-password-456',name:'Bob'});assert.equal(b.status,200);
 const cookieA=a.cookie,cookieB=b.cookie;assert.ok(cookieA);
 const payload={body:{...emptySkill,title:'Evidence method',problem:'Question',input:'Paper',output:'Evidence',steps:'Read\nCompare',example:'Case',limits:'Boundaries'},status:'draft',revision:0};
 const created=await call('skills','POST',payload,cookieA);assert.equal(created.status,201);const sid=created.data.id;
 assert.equal((await call('skills/'+sid,'GET',undefined,cookieB)).status,404);
 assert.equal((await call('skills/'+sid,'PATCH',{...payload,status:'published',revision:1},cookieA)).status,200);
 assert.equal((await call('skills/'+sid,'PATCH',{...payload,status:'published',revision:1},cookieA)).status,409);
 assert.equal((await call('skills/'+sid,'PATCH',{...payload,revision:2},cookieB)).status,403);
 const detail=await call('skills/'+sid);assert.equal(detail.data.versions.length,1);
 assert.equal((await call('skills/'+sid+'/favorite','POST',{saved:true},cookieB)).status,200);
 assert.equal((await call('skills?saved=true','GET',undefined,cookieB)).data.total,1);
 assert.equal((await call('skills?q=Evidence')).data.total,1);
 assert.equal((await call('skills/'+sid+'/feedback','POST',{kind:'case',body:'A tested example'},cookieB)).status,201);
 assert.equal((await call('skills/'+sid)).data.contributors[0].name,'Bob');
 assert.equal((await call('exchanges','POST',{skillId:sid,body:'I can contribute cases'},cookieB)).status,201);
 const inbox=await call('inbox','GET',undefined,cookieA);assert.equal(inbox.data.notifications.length,2);const eid=inbox.data.exchanges[0].id;
 assert.equal((await call('exchanges/'+eid,'PATCH',{status:'accepted'},cookieB)).status,404);
 assert.equal((await call('exchanges/'+eid,'PATCH',{status:'accepted'},cookieA)).status,200);
 assert.equal((await call('tasks','POST',{exchangeId:eid,title:'Validate a case'},cookieB)).status,201);
 const tid=(await call('inbox','GET',undefined,cookieA)).data.tasks[0].id;
 assert.equal((await call('tasks/'+tid,'PATCH',{done:true},cookieA)).status,200);
 assert.equal((await call('inbox','GET',undefined,cookieB)).data.tasks[0].done,1);
 assert.equal((await call('skills/'+sid+'/jobs','POST',{prompt:'tree',confirmCost:true},cookieA)).status,403);
 configure({DB,ADMIN_USER_IDS:a.data.user!.id,TRIPO_USER_IDS:a.data.user!.id,TRIPO_API_KEY:'test-placeholder'});
 const originalFetch=globalThis.fetch;let creates=0;
 globalThis.fetch=async(input,init)=>{
  if(init?.method==='POST'){creates++;return Response.json({code:0,data:{task_id:'task_test_123'}});}
  return Response.json({code:0,data:{status:'success',progress:100,output:{model_url:'https://example.test/model.glb',rendered_image_url:'javascript:alert(1)'}}});
 };
 try{
  const job=await call('skills/'+sid+'/jobs','POST',{prompt:'a tree',confirmCost:true},cookieA);assert.equal(job.status,201);
  assert.equal((await call('skills/'+sid+'/jobs','POST',{prompt:'a tree',confirmCost:true},cookieA)).status,409);assert.equal(creates,1);
  assert.equal((await call('jobs/'+job.data.id,'GET',undefined,cookieB)).status,404);
  const result=await call('jobs/'+job.data.id,'GET',undefined,cookieA);assert.equal(result.data.status,'success');assert.equal(result.data.imageUrl,undefined);
  globalThis.fetch=async()=>{throw new Error('timeout');};
  assert.equal((await call('skills/'+sid+'/jobs','POST',{prompt:'another tree',confirmCost:true},cookieA)).status,504);
  assert.equal((await call('skills/'+sid+'/jobs','GET',undefined,cookieA)).data.jobs[0].status,'unknown');
 }finally{globalThis.fetch=originalFetch;}
 assert.equal((await call('reports','GET',undefined,cookieB)).status,403);
 assert.equal((await call('skills/'+sid+'/report','POST',{reason:'Needs review'},cookieB)).status,201);
 const rid=(await call('reports','GET',undefined,cookieA)).data.reports[0].id;
 assert.equal((await call('reports/'+rid,'PATCH',{action:'hide'},cookieA)).status,200);
 assert.equal((await call('skills/'+sid)).status,404);
 assert.equal((await call('skills/'+sid,'PATCH',{...payload,revision:2},cookieA)).status,403);
 const csrf=await handler(new Request('http://localhost/api/platform/auth/logout',{method:'POST',headers:{origin:'https://evil.test',cookie:cookieA}}));assert.equal(csrf.status,403);
 await call('auth/logout','POST',{},cookieA);assert.equal((await call('auth/me','GET',undefined,cookieA)).data.user,null);
 const login=await call('auth/login','POST',{email:'a@example.test',password:'testing-password-123'});assert.equal(login.status,200);
 assert.equal((await call('skills/'+sid,'DELETE',undefined,cookieB)).status,404);
 assert.equal((await call('skills/'+sid,'DELETE',undefined,login.cookie)).status,200);
 assert.equal((await call('inbox','GET',undefined,cookieB)).data.exchanges[0].skill_id,null);
});
