import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
const envArgs=existsSync('.env.local')?['--env-file=.env.local']:[];
const apiPort=process.env.ZOO_API_PORT||'3101';
const webPort=process.env.ZOO_WEB_PORT||'3000';
const api=spawn(process.execPath,[...envArgs,'--experimental-strip-types','scripts/api.mjs'],{stdio:'inherit',env:{...process.env,ZOO_API_PORT:apiPort}});
const app=spawn('node_modules/.bin/vinext',['dev','--hostname','127.0.0.1','--port',webPort],{stdio:'inherit',env:{...process.env,ZOO_NODE_DEV:'1',ZOO_API_PORT:apiPort}});
let stopping=false;function stop(){if(stopping)return;stopping=true;api.kill();app.kill();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);api.on('exit',stop);app.on('exit',stop);
