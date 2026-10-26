import {createTraceRenderer} from './market-trace-core.js';
let renderer=null,active=false,reduced=false,timer=0,last=0,time=0,frames=0;
function stop(){clearTimeout(timer);timer=0;last=0}
function paint(){timer=0;if(!renderer||!active)return;const now=performance.now();if(last&&!reduced)time+=Math.min((now-last)/1000,.1);last=now;const head=renderer.paint(time,reduced);if(++frames%8===1||reduced)postMessage({type:'frame',time,head,frames});if(!reduced)timer=setTimeout(paint,Math.max(1,1000/30-(performance.now()-now)))}
onmessage=({data})=>{try{
 if(data.type==='init'){renderer=createTraceRenderer(data.canvas);renderer.resize(data.width,data.height,data.dpr)}
 if(data.type==='resize'){renderer?.resize(data.width,data.height,data.dpr)}
 if(data.type==='state'){stop();active=data.active;reduced=data.reduced;if(active)paint()}
}catch(e){stop();postMessage({type:'error',message:e.message})}};
