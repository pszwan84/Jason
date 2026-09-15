import { ApiError, field, object, skillInput } from './validation.ts';
import { body, current, db, id, json, now, notification, rate, requireUser } from './server.ts';
import type { Skill, SkillBody, SkillQuality } from './types.ts';
const select = 'SELECT s.*,u.name author,EXISTS(SELECT 1 FROM favorites f WHERE f.skill_id=s.id AND f.user_id=?) favorite FROM skills s JOIN users u ON u.id=s.owner_id';

const MATCH_FIELDS: Array<[keyof SkillBodyLike, string, number]> = [
  ['title', '标题', 6],
  ['category', '领域', 4],
  ['tags', '标签', 4],
  ['problem', '要解决的问题', 3],
  ['steps', '实践步骤', 2],
  ['example', '真实案例', 2],
  ['limits', '适用边界', 1],
  ['input', '输入', 1],
  ['output', '输出', 1],
];
type SkillBodyLike = {title?: string; category?: string; tags?: string; problem?: string; steps?: string; example?: string; limits?: string; input?: string; output?: string};

/** Return transparent match metadata for discovery UIs. Filtering remains SQL-backed. */
export function explainSkillMatch(skill: Pick<Skill, 'title'|'category'|'tags'|'body'|'author'>, query: string) {
  const raw = query.trim().toLocaleLowerCase();
  if (!raw) return {matchScore: 0, matchFields: [] as string[], matchReason: ''};
  let body: SkillBodyLike = {};
  try { body = JSON.parse(skill.body) as SkillBodyLike; } catch { /* legacy rows may contain malformed drafts */ }
  const values: Record<string, string> = {
    title: skill.title,
    category: skill.category,
    tags: skill.tags,
    author: skill.author,
    ...body,
  };
  const terms = raw.split(/[\s,，、;；]+/).filter(Boolean);
  const fields: string[] = [];
  let score = 0;
  for (const [key, label, weight] of MATCH_FIELDS) {
    const value = String(values[key] || '').toLocaleLowerCase();
    if (!value) continue;
    const hits = terms.filter(term => value.includes(term)).length;
    if (hits) { fields.push(label); score += weight * hits; }
  }
  if (String(values.author || '').toLocaleLowerCase().includes(raw)) { fields.push('作者'); score += 3; }
  const reason = fields.length ? `匹配${fields.slice(0, 3).join('、')}${fields.length > 3 ? '等' : ''}` : '标题、标签和方法内容暂无直接匹配';
  return {matchScore: score, matchFields: fields, matchReason: reason};
}
export async function accessible(sid:string,uid:string) {
  const s=await db().prepare(`${select} WHERE s.id=? AND (s.status='published' OR s.owner_id=?)`).bind(uid,sid,uid).first<Skill>();
  if(!s)throw new ApiError(404,'Skill 不存在或尚未公开');return s;
}
export async function owned(sid:string,uid:string) {const s=await accessible(sid,uid);if(s.owner_id!==uid)throw new ApiError(403,'只有作者可以修改');return s;}

/**
 * Build a deliberately simple quality summary. Each signal is visible to the
 * reader so this never presents a made-up "AI confidence" score as fact.
 */
export function skillQuality(skill: Skill, body: SkillBody, stats: {feedback:number;cases:number;helpful:number;unfit:number;versions:number;contributors:number}): SkillQuality {
  const signals: string[] = [];
  let score = skill.status === 'published' ? 20 : 0;
  if (body.example.trim()) { score += 20; signals.push('作者提供了真实案例'); }
  else signals.push('尚未提供真实案例');
  if (stats.versions > 1) { score += 15; signals.push(`已有 ${stats.versions} 个版本`); }
  if (stats.cases) { score += Math.min(25, stats.cases * 10); signals.push(`${stats.cases} 个使用案例反馈`); }
  if (stats.helpful) { score += Math.min(15, stats.helpful * 5); signals.push(`${stats.helpful} 条“有帮助”反馈`); }
  if (stats.unfit) { score -= Math.min(15, stats.unfit * 5); signals.push(`${stats.unfit} 条“不适用”反馈`); }
  if (stats.contributors) { score += Math.min(10, stats.contributors * 5); signals.push(`${stats.contributors} 位同行参与完善`); }
  score = Math.max(0, Math.min(100, score));
  const label: SkillQuality['label'] = score >= 70 ? '多人验证' : score >= 40 ? '初步验证' : '待验证';
  const confidence: SkillQuality['confidence'] = score >= 70 ? '高' : score >= 40 ? '中' : '低';
  return {score,label,confidence,feedbackCount:stats.feedback,caseCount:stats.cases,helpfulCount:stats.helpful,unfitCount:stats.unfit,versionCount:stats.versions,contributorCount:stats.contributors,source:body.example.trim() ? '作者填写的经历与案例（尚未经平台独立核验）' : '作者填写的 Skill 内容（尚未提供案例）',sourceVerified:false,signals};
}

export async function skills(req:Request,sid?:string,action?:string) {
  const u=await current(req);const uid=u?.id||'';const url=new URL(req.url);
  if(req.method==='GET'&&!sid){
    const page=Math.max(1,Math.min(10000,Number(url.searchParams.get('page'))||1));const q=(url.searchParams.get('q')||'').slice(0,160).toLowerCase();
    const category=url.searchParams.get('category')||''; const mine=url.searchParams.get('mine')==='true';const saved=url.searchParams.get('saved')==='true';
    const where=` WHERE (s.status='published' OR s.owner_id=?) AND (?=0 OR s.owner_id=?) AND (?=0 OR EXISTS(SELECT 1 FROM favorites f WHERE f.skill_id=s.id AND f.user_id=?)) AND (?='' OR s.category=?) AND (?='' OR instr(lower(s.title || ' ' || s.tags || ' ' || s.body),?)>0)`;
    const args=[uid,mine?1:0,uid,saved?1:0,uid,category,category,q,q];
    const data=await db().prepare(select+where+' ORDER BY s.updated DESC LIMIT 12 OFFSET ?').bind(uid,...args,(page-1)*12).all();
    const items = (data.results as Skill[]).map(item => ({...item, ...explainSkillMatch(item, q)}));
    const count=await db().prepare('SELECT count(*) total FROM skills s'+where).bind(...args).first();
    return json({items,total:count?.total||0,page});
  }
  if(req.method==='GET'&&sid){
    const skill=await accessible(sid,uid);
    const [feedback,versions,related,contributors,statsResult]=await Promise.all([
      db().prepare('SELECT f.*,u.name FROM feedback f JOIN users u ON u.id=f.user_id WHERE skill_id=? ORDER BY created DESC LIMIT 100').bind(sid).all(),
      db().prepare('SELECT revision,body,created FROM versions WHERE skill_id=? ORDER BY revision DESC LIMIT 50').bind(sid).all(),
      db().prepare(select+" WHERE s.category=? AND s.id<>? AND s.status='published' ORDER BY s.updated DESC LIMIT 3").bind(uid,skill.category,sid).all(),
      db().prepare('SELECT DISTINCT u.id,u.name FROM feedback f JOIN users u ON u.id=f.user_id WHERE f.skill_id=? LIMIT 100').bind(sid).all(),
      db().prepare('SELECT count(*) feedback, sum(CASE WHEN kind=\'case\' THEN 1 ELSE 0 END) cases, sum(CASE WHEN kind=\'helpful\' THEN 1 ELSE 0 END) helpful, sum(CASE WHEN kind=\'unfit\' THEN 1 ELSE 0 END) unfit FROM feedback WHERE skill_id=?').bind(sid).first<{feedback:number;cases:number;helpful:number;unfit:number}>(),
    ]);
    const quality=skillQuality(skill,JSON.parse(skill.body) as SkillBody,{feedback:Number(statsResult?.feedback||0),cases:Number(statsResult?.cases||0),helpful:Number(statsResult?.helpful||0),unfit:Number(statsResult?.unfit||0),versions:versions.results.length,contributors:contributors.results.length});
    return json({skill,feedback:feedback.results,versions:versions.results,related:related.results,contributors:contributors.results,quality});
  }
  const user=await requireUser(req);await rate(`write:${user.id}`,60);
  if(req.method==='POST'&&!sid){
    const v=skillInput(await body(req));const sid=id();const t=now();
    await db().prepare('INSERT INTO skills VALUES(?,?,?,?,?,?,?,?,?,?)').bind(sid,user.id,v.body.title,v.body.category,v.body.tags,JSON.stringify(v.body),v.status,1,t,t).run();
    return json({id:sid},201);
  }
  if(!sid)throw new ApiError(404,'接口不存在');
  if(req.method==='PATCH'&&!action){
    const old=await owned(sid,user.id);if(old.status==='hidden')throw new ApiError(403,'内容已被审核隐藏，请联系管理员');
    const v=skillInput(await body(req));
    const r=await db().prepare("UPDATE skills SET title=?,category=?,tags=?,body=?,status=?,revision=revision+1,updated=? WHERE id=? AND owner_id=? AND revision=? AND status<>'hidden'").bind(v.body.title,v.body.category,v.body.tags,JSON.stringify(v.body),v.status,now(),sid,user.id,v.revision).run();
    if(!r.meta.changes)throw new ApiError(409,'内容已被其他页面更新，请重新打开后再编辑');return json({id:sid});
  }
  if(req.method==='DELETE'&&!action){await owned(sid,user.id);await db().prepare('DELETE FROM skills WHERE id=? AND owner_id=?').bind(sid,user.id).run();return json({ok:true});}
  const skill=await accessible(sid,user.id);
  if(req.method==='POST'&&action==='favorite'){
    const v=object(await body(req));if(typeof v.saved!=='boolean')throw new ApiError(400,'收藏状态不正确');
    await db().prepare(v.saved?'INSERT OR IGNORE INTO favorites VALUES(?,?)':'DELETE FROM favorites WHERE user_id=? AND skill_id=?').bind(user.id,sid).run();return json({ok:true});
  }
  if(req.method==='POST'&&action==='feedback'){
    const v=object(await body(req));if(!['helpful','unfit','suggestion','case'].includes(String(v.kind)))throw new ApiError(400,'反馈类型不正确');
    const message=field(v.body,'反馈',4000);await db().batch([
      db().prepare('INSERT INTO feedback VALUES(?,?,?,?,?,?)').bind(id(),sid,user.id,v.kind as string,message,now()),
      notification(skill.owner_id,`${user.name} 为「${skill.title}」提交了反馈`),
    ]);return json({ok:true},201);
  }
  if(req.method==='POST'&&action==='report'){
    const v=object(await body(req));await db().prepare('INSERT INTO reports VALUES(?,?,?,?,?,NULL,?)').bind(id(),sid,user.id,field(v.reason,'举报原因',2000),'pending',now()).run();return json({ok:true},201);
  }
  throw new ApiError(405,'不支持该操作');
}
