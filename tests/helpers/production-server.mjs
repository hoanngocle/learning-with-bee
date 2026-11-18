import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
export async function startProductionServer(env) {
 const listener=createServer();
 await new Promise(resolve=>listener.listen(0,'127.0.0.1',resolve));
 const port=listener.address().port;await new Promise(resolve=>listener.close(resolve));
 const origin=`http://127.0.0.1:${port}`;
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port',String(port)],{env:{...process.env,...env},stdio:['ignore','pipe','pipe'],windowsHide:true});
 let output='';server.stdout.on('data',value=>output+=value);server.stderr.on('data',value=>output+=value);
 const stop=async()=>{if(server.exitCode!==null)return;server.kill();await new Promise(resolve=>server.once('exit',resolve));};
 try{
  for(let i=0;i<150;i++) {
   if(server.exitCode!==null)throw new Error(`Server exited: ${output}`);
   try{const response=await fetch(origin);await response.text();if(response.ok)return {origin,stop,output:()=>output};}catch{}
   await delay(100);
  }
  throw new Error(`Server startup timed out: ${output}`);
 }catch(error){await stop();throw error;}
}
