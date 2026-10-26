import {createColorField} from './color-field-core.js';


const reduce=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
const fields=new Map(),initialized=new WeakSet();
let worker=null,workerAttempted=false,engine=null,starting=false,failed=false,obscured=false,raf=0,last=0,painted=0,time=8,serial=0;
const source=document.createElement('canvas');
function fail(error){failed=true;cancelAnimationFrame(raf);raf=0;for(const s of fields.values()){s.host.dataset.media='fallback';s.canvas.dataset.motion='fallback'}console.warn('Curve visual fallback:',error.message||error)}
function useFallback(error){if(error)console.warn('Color worker unavailable; same shader retained',error.message||error);worker?.terminate();worker=null;for(const s of fields.values()){if(s.transferred){observer.unobserve(s.canvas);const replacement=s.canvas.cloneNode();s.canvas.replaceWith(replacement);s.resizeObserver.unobserve(s.canvas);s.canvas=replacement;s.resizeObserver.observe(replacement);observer.observe(replacement);s.transferred=false}s.ctx=s.canvas.getContext('2d',{alpha:false});s.canvas.width=s.w;s.canvas.height=s.h;s.canvas.dataset.renderThread='main-fallback'}sync()}
function startWorker(){workerAttempted=true;if(!HTMLCanvasElement.prototype.transferControlToOffscreen||typeof Worker==='undefined')return;try{
 worker=new Worker(new URL('./color-field-worker.js',import.meta.url),{type:'module'});
 worker.onmessage=({data})=>{if(data.type==='error'){useFallback(Error(data.message));return}if(data.type==='frame')for(const value of data.fields){const s=fields.get(value.id);if(!s)continue;s.host.dataset.media='ready';s.canvas.dataset.frames=String(value.frames);s.canvas.dataset.time=data.time.toFixed(3)}};
 worker.onerror=e=>useFallback(Error(e.message));
 }catch(error){worker=null;console.warn('Color worker initialization fallback',error.name)}}
function attach(s){if(!worker||s.transferred)return;const canvas=s.canvas.transferControlToOffscreen();s.transferred=true;s.canvas.dataset.renderThread='worker';worker.postMessage({type:'field',id:s.id,canvas},[canvas])}
function targets(){return [...fields.values()].filter(s=>s.visible&&s.w&&s.h)}
async function startFallback(){starting=true;try{engine=await createColorField(source);sync()}catch(error){fail(error)}}
function paint(){const active=targets();if(!engine||!active.length)return;try{const w=Math.max(...active.map(s=>s.w)),h=Math.max(...active.map(s=>s.h));engine.paint(time,w,h);for(const s of active){s.ctx??=s.canvas.getContext('2d',{alpha:false});if(s.canvas.width!==s.w||s.canvas.height!==s.h){s.canvas.width=s.w;s.canvas.height=s.h}s.ctx.drawImage(source,0,0,s.w,s.h);s.frames++;s.host.dataset.media='ready';if(s.frames%8===1){s.canvas.dataset.frames=String(s.frames);s.canvas.dataset.time=time.toFixed(3)}}}catch(error){fail(error)}}
function tick(now){raf=0;if(!engine||document.hidden||obscured||reduce.matches||!targets().length)return;if(last)time+=Math.min((now-last)/1000,.15);last=now;if(now-painted>=1000/30-.5){painted=now;paint()}raf=requestAnimationFrame(tick)}
function sync(){cancelAnimationFrame(raf);raf=0;const on=!document.hidden&&!obscured&&targets().length>0;
 for(const s of fields.values())s.canvas.dataset.motion=failed?'fallback':s.visible&&on&&!reduce.matches?'running':'paused';
 if(!workerAttempted&&on)startWorker();
 if(worker){try{for(const s of fields.values())if(s.visible)attach(s);worker.postMessage({type:'state',active:on,reduced:reduce.matches,fields:[...fields.values()].filter(s=>s.transferred).map(({id,w,h,visible})=>({id,w,h,visible}))})}catch(error){useFallback(error)}return}
 if(!on||failed)return;if(!starting){startFallback();return}if(!engine)return;paint();if(!reduce.matches){last=performance.now();painted=last;raf=requestAnimationFrame(tick)}
}
const observer=new IntersectionObserver(entries=>{for(const e of entries){const s=[...fields.values()].find(s=>s.canvas===e.target);if(s)s.visible=e.isIntersecting}sync()},{threshold:.01});
export function createField(canvas){if(canvas.classList.contains('position-earth-particles')||initialized.has(canvas))return;initialized.add(canvas);const host=canvas.parentElement;
 const s={id:++serial,canvas,host,ctx:null,w:0,h:0,visible:false,frames:0,transferred:false};fields.set(s.id,s);canvas.dataset.interactive='false';canvas.dataset.source='solana-community-original';canvas.dataset.maxFps='30';canvas.dataset.renderer='shared-field';
 function resize(){const r=s.canvas.getBoundingClientRect();if(!r.width||!r.height)return;const scale=Math.min(devicePixelRatio||1,1.25,(coarse.matches?256:640)/r.width,(coarse.matches?160:480)/r.height),w=Math.max(1,Math.round(r.width*scale)),h=Math.max(1,Math.round(r.height*scale));if(s.w===w&&s.h===h)return;s.w=w;s.h=h;sync()}
 s.resizeObserver=new ResizeObserver(resize);s.resizeObserver.observe(canvas);observer.observe(canvas);coarse.addEventListener('change',resize);resize();
}
source.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(Error('Graphics context lost'))});source.addEventListener('webglcontextrestored',()=>{engine=null;starting=failed=false;sync()});
document.addEventListener('visibilitychange',sync);document.addEventListener('maris:explain-open',()=>{obscured=true;sync()});document.addEventListener('maris:explain-close',()=>{obscured=false;sync()});reduce.addEventListener('change',sync);
document.querySelectorAll('[data-maris-ambient] canvas').forEach(createField);
