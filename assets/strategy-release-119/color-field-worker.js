import {createColorField} from './color-field-core.js';
const source=new OffscreenCanvas(1,1),fields=new Map();
let engine=null,starting=false,failed=false,active=false,reduced=false,timer=0,time=8,last=0,sequence=0;
function fail(error){failed=true;clearTimeout(timer);timer=0;self.postMessage({type:'error',message:error.message||String(error)})}
async function start(){starting=true;try{engine=await createColorField(source);sync()}catch(error){fail(error)}}
function tick(){timer=0;if(!active||failed)return;const targets=[...fields.values()].filter(s=>s.visible&&s.w&&s.h);if(!targets.length)return;if(!engine){if(!starting)start();return}
 const now=performance.now();if(last&&!reduced)time+=Math.min((now-last)/1000,.15);last=now;
 try{const w=Math.max(...targets.map(s=>s.w)),h=Math.max(...targets.map(s=>s.h));engine.paint(time,w,h);
 for(const s of targets){if(s.canvas.width!==s.w||s.canvas.height!==s.h){s.canvas.width=s.w;s.canvas.height=s.h}s.ctx.drawImage(source,0,0,s.w,s.h);s.frames++}
 if(sequence++%8===0||reduced||targets.some(s=>s.frames===1))self.postMessage({type:'frame',time,fields:targets.map(s=>({id:s.id,frames:s.frames,w:s.w,h:s.h}))});
 }catch(error){fail(error);return}
 if(!reduced)timer=setTimeout(tick,Math.max(1,1000/30-(performance.now()-now)));
}
function sync(){clearTimeout(timer);timer=0;last=0;if(active&&!failed)tick()}
self.onmessage=({data})=>{
 if(data.type==='field'){const ctx=data.canvas.getContext('2d',{alpha:false});if(!ctx){fail(Error('Worker 2D unavailable'));return}fields.set(data.id,{id:data.id,canvas:data.canvas,ctx,visible:false,w:0,h:0,frames:0})}
 if(data.type==='state'){for(const value of data.fields){const s=fields.get(value.id);if(s)Object.assign(s,value)}active=data.active;reduced=data.reduced;sync()}
};
source.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(Error('Worker graphics context lost'))});
