import {marketPaths} from './market-trace-paths.js';
export function createTraceRenderer(canvas){
const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw Error('Trace 2D unavailable');
let width=0,height=0,coords=[],time=0,headIndex=0;
function fit(w,h,dpr){width=w;height=h;canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const src=marketPaths[height>width?'portrait':'desktop'],scale=Math.max(width/src.width,height/src.height)*1.025,dw=src.width*scale,dh=src.height*scale;coords=src.points.map(([x,y])=>[(width-dw)/2+x*dw,(height-dh)/2+y*dh]);draw(true)}
function path(start,end,offset=0){ctx.beginPath();for(let i=start;i<end;i++){const [x,y]=coords[i],lift=Math.sin(time*.45+x*.004)*.8+Math.sin(time*.29+x*.011)*.4;if(i===start)ctx.moveTo(x,y+offset+lift);else ctx.lineTo(x,y+offset+lift)}}
function draw(still=false){ctx.clearRect(0,0,width,height);ctx.lineJoin='round';ctx.lineCap='round';path(0,coords.length);ctx.strokeStyle='rgba(135,170,202,.22)';ctx.lineWidth=.65;ctx.stroke();
 if(!still){const count=coords.length;for(let n=0;n<2;n++){const phase=(time*.045+n*.51)%1,head=Math.floor(phase*(count+75)),from=Math.max(0,head-75),to=Math.min(count,head);if(to<=from)continue;const a=coords[from],b=coords[to-1],g=ctx.createLinearGradient(a[0],a[1],b[0]+.01,b[1]);g.addColorStop(0,'rgba(109,154,206,0)');g.addColorStop(.55,'rgba(149,181,226,.32)');g.addColorStop(1,'rgba(218,233,255,.92)');path(from,to);ctx.strokeStyle=g;ctx.lineWidth=1.1;ctx.globalAlpha=.18;ctx.lineWidth=4;ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=1.1;ctx.stroke();headIndex=head}
 
 for(let n=0;n<11;n++){const t=(time*.14+n*.217)%1,index=Math.floor(((n*.173)%1)*(coords.length-1)),[x,y]=coords[index];ctx.fillStyle=`rgba(163,197,234,${Math.sin(t*Math.PI)*.3})`;ctx.fillRect(x+Math.sin(n)*t*7,y-t*30,1,1)}}}

return {resize:fit,paint(t,still=false){time=t;draw(still);return headIndex}};
}
