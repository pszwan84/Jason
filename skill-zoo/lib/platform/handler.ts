import { guarded } from './server.ts';
import { ApiError } from './validation.ts';
import { auth } from './auth.ts';
import { skills } from './skills.ts';
import { community, moderation } from './community.ts';
import { jobs } from './tripo.ts';
const handler=guarded(async(req:Request)=>{
  const [resource,rid,action,...rest]=new URL(req.url).pathname.replace('/api/platform/','').split('/');
  if(rest.length)throw new ApiError(404,'接口不存在');
  if(resource==='auth')return auth(req,rid);
  if(resource==='skills'&&action==='jobs')return jobs(req,rid);
  if(resource==='jobs')return jobs(req,undefined,rid);
  if(resource==='skills')return skills(req,rid,action);
  if(resource==='reports')return moderation(req,rid);
  if(['inbox','exchanges','tasks','notifications'].includes(resource))return community(req,resource,rid);
  throw new ApiError(404,'接口不存在');
});
export {handler};
