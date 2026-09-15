import { ApiError, field, object } from './validation.ts';
import { body, db, id, json, now, notification, rate, requireUser } from './server.ts';
import { accessible } from './skills.ts';
import type { Exchange } from './types.ts';
export async function community(req:Request,resource:string,rid?:string) {
  const user=await requireUser(req);const uid=user.id;
  if(resource==='inbox'&&req.method==='GET'){
    const [exchanges,tasks,notifications]=await Promise.all([
      db().prepare('SELECT e.*,s.title skill_title,a.name sender_name,b.name recipient_name FROM exchanges e LEFT JOIN skills s ON s.id=e.skill_id JOIN users a ON a.id=e.sender JOIN users b ON b.id=e.recipient WHERE sender=? OR recipient=? ORDER BY e.created DESC LIMIT 100').bind(uid,uid).all(),
      db().prepare('SELECT t.* FROM tasks t JOIN exchanges e ON e.id=t.exchange_id WHERE e.sender=? OR e.recipient=? ORDER BY t.id LIMIT 500').bind(uid,uid).all(),
      db().prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created DESC LIMIT 100').bind(uid).all(),
    ]);return json({exchanges:exchanges.results,tasks:tasks.results,notifications:notifications.results});
  }
  await rate(`write:${uid}`,60);
  if(resource==='notifications'&&req.method==='PATCH'&&rid){await db().prepare('UPDATE notifications SET read=1 WHERE id=? AND user_id=?').bind(rid,uid).run();return json({ok:true});}
  const v=object(await body(req));
  if(resource==='exchanges'&&req.method==='POST'){
    const skill=await accessible(field(v.skillId,'Skill',100),uid);if(skill.owner_id===uid)throw new ApiError(400,'不能向自己发送交换卡');
    await db().batch([db().prepare('INSERT INTO exchanges VALUES(?,?,?,?,?,?,?)').bind(id(),skill.id,uid,skill.owner_id,field(v.body,'交换内容',4000),'pending',now()),notification(skill.owner_id,`${user.name} 向「${skill.title}」发送了一张交换卡`)]);return json({ok:true},201);
  }
  if(resource==='exchanges'&&req.method==='PATCH'&&rid){
    if(v.status!=='accepted'&&v.status!=='declined')throw new ApiError(400,'状态不正确');
    const e=await db().prepare('SELECT * FROM exchanges WHERE id=? AND recipient=?').bind(rid,uid).first<Exchange>();if(!e)throw new ApiError(404,'交换卡不存在');
    const result=await db().prepare("UPDATE exchanges SET status=? WHERE id=? AND recipient=? AND status='pending'").bind(v.status,rid,uid).run();
    if(!result.meta.changes)throw new ApiError(409,'交换卡已经处理');await notification(e.sender,`${user.name} ${v.status==='accepted'?'接受':'婉拒'}了交换卡`).run();return json({ok:true});
  }
  if(resource==='tasks'&&req.method==='POST'){
    const eid=field(v.exchangeId,'交换卡',100);const e=await db().prepare("SELECT id FROM exchanges WHERE id=? AND (sender=? OR recipient=?) AND status='accepted'").bind(eid,uid,uid).first();if(!e)throw new ApiError(403,'接受交换卡后双方才能共创');
    await db().prepare('INSERT INTO tasks VALUES(?,?,?,0)').bind(id(),eid,field(v.title,'任务',200)).run();return json({ok:true},201);
  }
  if(resource==='tasks'&&req.method==='PATCH'&&rid){
    if(typeof v.done!=='boolean')throw new ApiError(400,'任务状态不正确');
    const r=await db().prepare("UPDATE tasks SET done=? WHERE id=? AND exchange_id IN (SELECT id FROM exchanges WHERE (sender=? OR recipient=?) AND status='accepted')").bind(v.done?1:0,rid,uid,uid).run();if(!r.meta.changes)throw new ApiError(404,'任务不存在');return json({ok:true});
  }
  throw new ApiError(405,'不支持该操作');
}
export async function moderation(req:Request,rid?:string) {
  const user=await requireUser(req);if(!user.admin)throw new ApiError(403,'需要管理员权限');
  if(req.method==='GET'){const reports=await db().prepare('SELECT r.*,s.title FROM reports r JOIN skills s ON s.id=r.skill_id ORDER BY r.created DESC LIMIT 100').all();return json({reports:reports.results});}
  if(req.method==='PATCH'&&rid){
    const v=object(await body(req));if(v.action!=='hide'&&v.action!=='dismiss')throw new ApiError(400,'审核操作不正确');
    const r=await db().prepare("SELECT skill_id FROM reports WHERE id=? AND status='pending'").bind(rid).first<{skill_id:string}>();if(!r)throw new ApiError(409,'举报已处理或不存在');
    const queries=[db().prepare("UPDATE reports SET status=?,reviewer=? WHERE id=? AND status='pending'").bind(v.action,user.id,rid)];
    if(v.action==='hide')queries.push(db().prepare("UPDATE skills SET status='hidden' WHERE id=?").bind(r.skill_id));
    await db().batch(queries);return json({ok:true});
  }
  throw new ApiError(405,'不支持该操作');
}
