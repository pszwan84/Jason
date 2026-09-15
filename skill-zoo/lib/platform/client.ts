'use client';
import {useCallback,useEffect,useState} from 'react';
export async function api<T>(path:string,method:'GET'|'POST'|'PATCH'|'DELETE'='GET',value?:unknown):Promise<T>{
  const options:RequestInit={method,signal:AbortSignal.timeout(30000)};
  if(method!=='GET'&&value!==undefined){options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(value);}
  const response=await fetch('/api/platform/'+path,options);
  const data=await response.json();if(!response.ok)throw new Error(data&&typeof data==='object'&&'error' in data&&typeof data.error==='string'?data.error:'请求失败');return data as T;
}
export function useResource<T>(path:string,enabled=true){
  const [state,setState]=useState<{path:string;data?:T;error?:string}>({path});const [version,setVersion]=useState(0);
  const refresh=useCallback(()=>setVersion(v=>v+1),[]);
  useEffect(()=>{if(!enabled)return;let active=true;api<T>(path).then(data=>{if(active)setState({path,data});}).catch((e:unknown)=>{if(active)setState({path,error:e instanceof Error?e.message:'加载失败'});});return()=>{active=false;};},[path,version,enabled]);
  return {data:state.path===path?state.data:undefined,error:state.path===path?state.error:undefined,refresh};
}
export function useAction(){
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  async function run(work:()=>Promise<void>){if(busy)return;setBusy(true);setMessage('');try{await work();}catch(e){setMessage(e instanceof Error?e.message:'操作失败');}finally{setBusy(false);}}
  return {busy,message,setMessage,run};
}
