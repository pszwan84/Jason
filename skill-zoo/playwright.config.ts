import {defineConfig} from '@playwright/test';
const webPort=process.env.ZOO_WEB_PORT||'3000';
const apiPort=process.env.ZOO_API_PORT||'3101';
const baseURL=`http://127.0.0.1:${webPort}`;
export default defineConfig({webServer:{command:`ZOO_WEB_PORT=${webPort} ZOO_API_PORT=${apiPort} npm run dev`,url:`${baseURL}/studio`,reuseExistingServer:true,timeout:120000},testDir:'./tests/e2e',workers:1,timeout:60000,use:{baseURL,headless:true,launchOptions:process.platform==='darwin'?{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}:{},trace:'retain-on-failure'},outputDir:'outputs/playwright'});
