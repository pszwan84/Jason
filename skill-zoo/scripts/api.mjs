import {createServer} from 'node:http';
import {setGlobalDispatcher,EnvHttpProxyAgent} from 'undici';
import {configure} from '../lib/platform/server.ts';
import {sqlite} from '../lib/platform/sqlite.ts';
import {handler} from '../lib/platform/handler.ts';
// Node's native fetch does not automatically honor the lowercase proxy
// variables used by the local development environment. Use them when present
// so third-party API polling behaves like curl; production can omit them.
if(process.env.http_proxy||process.env.https_proxy||process.env.HTTP_PROXY||process.env.HTTPS_PROXY){setGlobalDispatcher(new EnvHttpProxyAgent());}
configure({DB:sqlite('.data/skill-zoo.sqlite'),TRIPO_API_KEY:process.env.TRIPO_API_KEY,TRIPO_MODEL:process.env.TRIPO_MODEL,TRIPO_USER_IDS:process.env.TRIPO_USER_IDS,ADMIN_USER_IDS:process.env.ADMIN_USER_IDS});
const server=createServer(async(req,res)=>{
 try{
  const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
  const init={method:req.method,headers};if(!['GET','HEAD'].includes(req.method)){init.body=req;init.duplex='half';}
  const response=await handler(new Request(`http://${req.headers.host}${req.url}`,init));
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'服务异常，请重试'}));}
});
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error('Skill Zoo API port 3101 is already in use. Stop the existing dev server first.');
    process.exit(1);
  }
  throw error;
});
const apiPort=Number(process.env.ZOO_API_PORT||3101);
server.listen(apiPort,'127.0.0.1',()=>console.log(`Skill Zoo SQLite API: http://127.0.0.1:${apiPort}`));
