import { ApiError, field, object, safeUrl } from './validation.ts';
import { body, config, db, id, json, now, rate, requireUser } from './server.ts';
import { owned } from './skills.ts';
// Tripo's public Quick Start API uses the v2 OpenAPI host and task contract.
const base='https://api.tripo3d.ai/v2/openapi';
async function tripo(path:string,payload?:unknown,operation='请求') {
  if(!config.TRIPO_API_KEY)throw new ApiError(503,'尚未配置 Tripo 服务');
  let response:Response;
  try{response=await fetch(base+path,{method:payload?'POST':'GET',redirect:'error',headers:{Authorization:`Bearer ${config.TRIPO_API_KEY}`,'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(20000)});}catch{throw new ApiError(504,operation==='查询'?'Tripo 查询超时，请点击“重新查询”再试。':'Tripo 连接超时。创建结果可能未知，请先在 Tripo 控制台确认，避免重复扣费。');}
  if(!response.ok)throw new ApiError(502,`Tripo 请求失败（${response.status}），请检查服务配置、额度或稍后查询。`);
  let value:Record<string,unknown>;try{value=object(await response.json());}catch{throw new ApiError(502,'Tripo 返回了无法识别的结果');}
  if(value.code!==0)throw new ApiError(502,'Tripo 拒绝了请求，请在服务控制台检查原因');
  return object(value.data);
}
export async function jobs(req:Request,sid?:string,jid?:string) {
  const user=await requireUser(req);
  if(sid)await owned(sid,user.id);
  if(req.method==='GET'&&sid&&!jid){return json({jobs:(await db().prepare('SELECT id,status,created,task_id FROM jobs WHERE skill_id=? AND user_id=? ORDER BY created DESC,id DESC LIMIT 10').bind(sid,user.id).all()).results});}
  if(req.method==='POST'&&sid){
    if(!user.canGenerate)throw new ApiError(403,'生成权限未开通，请联系管理员');
    const v=object(await body(req));const prompt=field(v.prompt,'形象描述',1000);
    if(v.confirmCost!==true)throw new ApiError(400,'请确认生成会使用 Tripo 额度');
    await rate(`tripo:${user.id}`,3,86400);
    // A timed-out creation has no reliable remote task ID. Keep its audit row,
    // but release the local uniqueness guard so the user can safely try again.
    await db().prepare("UPDATE jobs SET status='superseded' WHERE skill_id=? AND user_id=? AND status='unknown'").bind(sid,user.id).run();
    const jobId=id();
    const reservation=await db().prepare("INSERT OR IGNORE INTO jobs VALUES(?,?,?,NULL,'creating',?)").bind(jobId,sid,user.id,now()).run();
    if(!reservation.meta.changes)throw new ApiError(409,'已有生成任务，请先查询；未知结果需在控制台确认');
    try{
      const result=await tripo('/task',{type:'text_to_model',prompt,model_version:config.TRIPO_MODEL||'v3.1-20260211'});
      if(typeof result.task_id!=='string'||!/^[\w-]{1,100}$/.test(result.task_id))throw new ApiError(502,'Tripo 未返回有效任务 ID，请先在控制台确认');
      await db().prepare("UPDATE jobs SET task_id=?,status='queued' WHERE id=?").bind(result.task_id,jobId).run();
      return json({id:jobId,status:'queued'},201);
    }catch(e){await db().prepare("UPDATE jobs SET status='unknown',created=? WHERE id=?").bind(now(),jobId).run();throw e;}
  }
  if(req.method==='GET'&&jid){
    const job=await db().prepare('SELECT * FROM jobs WHERE id=? AND user_id=?').bind(jid,user.id).first<{id:string;task_id:string|null;status:string}>();if(!job)throw new ApiError(404,'生成任务不存在');
    if(!job.task_id)return json({id:job.id,status:job.status});
    await rate(`poll:${user.id}`,30);
    const data=await tripo(`/task/${encodeURIComponent(job.task_id)}`,undefined,'查询');
    const status=typeof data.status==='string'?data.status:'';
    if(!['queued','running','success','failed','cancelled','banned'].includes(status))throw new ApiError(502,'未知任务状态，请稍后查询');
    const output=data.output?object(data.output):{};
    const result=output.result&&typeof output.result==='object'?output.result as Record<string,unknown>:{};
    const modelResult=result.pbr_model&&typeof result.pbr_model==='object'?result.pbr_model as Record<string,unknown>:{};
    const imageResult=result.rendered_image&&typeof result.rendered_image==='object'?result.rendered_image as Record<string,unknown>:{};
    const modelUrl=safeUrl(modelResult.url)||safeUrl(output.pbr_model)||safeUrl(output.model_url);
    const imageUrl=safeUrl(imageResult.url)||safeUrl(output.rendered_image)||safeUrl(output.generated_image)||safeUrl(output.thumbnail)||safeUrl(output.rendered_image_url);
    if(status==='success'&&!modelUrl)throw new ApiError(502,'生成完成但模型链接暂时不可用，请重新查询');
    await db().prepare('UPDATE jobs SET status=? WHERE id=?').bind(status,job.id).run();
    return json({id:job.id,status,progress:typeof data.progress==='number'?Math.min(100,Math.max(0,data.progress)):0,modelUrl,imageUrl});
  }
  throw new ApiError(405,'不支持该操作');
}
