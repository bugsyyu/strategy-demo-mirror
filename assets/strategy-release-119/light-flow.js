(()=>{'use strict';
const hosts=[...document.querySelectorAll('.directory-card,[data-light-flow]')];if(!hosts.length)return;
const reduce=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const paths=[[[25,94],[60,65],[104,85],[150,48],[210,85]],[[32,70],[78,73],[118,65],[164,67],[208,61]],[[45,66],[90,73],[161,65],[185,91],[132,115],[84,96]],[[24,83],[65,78],[115,49],[167,55],[211,87]]];
const detailPaths={scan:[[45,72],[52,80],[89,86],[119,84],[157,88],[188,82],[198,72]],signal:[[25,45],[70,53],[107,68],[150,71],[210,71]],execute:[[25,67],[65,66],[102,71],[148,72],[208,78]],protect:[[8,89],[49,74],[70,54],[93,66],[117,36],[132,67],[151,89],[185,80],[212,75]],account:[[71,98],[112,106],[174,100],[201,79],[190,45],[149,29],[108,34],[91,54]],settlement:paths[3]};
let frame=0,last=0;
function home(path,t){const f=t*(path.length-1),i=Math.min(path.length-2,Math.floor(f)),k=f-i;return{x:path[i][0]*(1-k)+path[i+1][0]*k,y:path[i][1]*(1-k)+path[i+1][1]*k}}
const cards=hosts.map((card,index)=>{
 const visual=card.querySelector('.directory-visual,.loop-icon,.agent-art-visual'),art=visual.querySelector('img');
 const canvas=document.createElement('canvas');canvas.className='directory-flow agent-light-flow';canvas.setAttribute('aria-hidden','true');visual.append(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});
 const s={card,visual,canvas,ctx,animation:null,index,visible:false,active:false,engaged:false,selected:card.classList.contains('flow-art-node')&&card.classList.contains('is-active'),isFlow:card.classList.contains('flow-art-node'),phase:index*.77,power:0,pointer:{x:-100,y:-100},nodes:[],paintFrame:0,x:0,y:0};
 for(let i=0;i<13;i++){const p=home(detailPaths[card.dataset.lightFlow]||paths[index%paths.length],i/12);s.nodes.push({...p,vx:0,vy:0,hx:p.x,hy:p.y})}
 function resize(){const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(visual.clientWidth*d);canvas.height=Math.round(visual.clientHeight*d);if(ctx){ctx.setTransform(canvas.width/240,0,0,canvas.height/140,0,0);s.gradient=ctx.createLinearGradient(20,0,222,0);s.gradient.addColorStop(0,'#acefff00');s.gradient.addColorStop(.2,'#acefff70');s.gradient.addColorStop(.6,'#d0c1ff8a');s.gradient.addColorStop(.86,'#f8d88f70');s.gradient.addColorStop(1,'#f8d88f00');paint(s,0)}}
 new ResizeObserver(resize).observe(visual);resize();
 if(art?.animate){s.animation=art.animate([{translate:'0px 0px'},{translate:'0px -2px'},{translate:'0px 0px'}],{duration:6500,iterations:Infinity,easing:'ease-in-out'});s.animation.pause();s.animation.currentTime=index*850}
 return s;
});


function paint(s,dt){
 const c=s.ctx;if(!c)return;c.clearRect(0,0,240,140);
 s.phase+=dt*(.65+s.power*.55);s.power+=(Number(s.active)-s.power)*(1-Math.exp(-6*dt));
 const ns=s.nodes;
 for(let i=0;i<ns.length;i++){
  const n=ns[i],wave=Math.sin(s.phase*1.8+i*.58)*1.5,dx=n.x-s.pointer.x,dy=n.y-s.pointer.y,d2=dx*dx+dy*dy;
  const influence=s.power*Math.exp(-d2/1900),force=7*influence;
  const tx=n.hx+Math.sin(s.phase+i*.36)*.6+dx*.12*force,ty=n.hy+wave+dy*.12*force;
  const tension=i&&i<ns.length-1?(ns[i-1].y+ns[i+1].y-2*n.y-(ns[i-1].hy+ns[i+1].hy-2*n.hy))*.65:0;
  n.vx+=(tx-n.x)*30*dt;n.vy+=((ty-n.y)*30+tension)*dt;
  const drag=Math.exp(-8*dt);n.vx*=drag;n.vy*=drag;n.x+=n.vx*dt;n.y+=n.vy*dt;
 }
 c.globalAlpha=.46+s.power*.44;c.strokeStyle=s.gradient;c.lineWidth=.55;
 for(let band=0;band<2;band++){
  const offset=(band?1:-1)*(1.6+s.power);c.beginPath();c.moveTo(ns[0].x,ns[0].y+offset);
  for(let i=1;i<ns.length-1;i++)c.quadraticCurveTo(ns[i].x,ns[i].y+offset,(ns[i].x+ns[i+1].x)/2,(ns[i].y+ns[i+1].y)/2+offset);
  c.lineTo(ns.at(-1).x,ns.at(-1).y+offset);c.stroke();
 }
 const count=fine.matches?18:10;
 for(let i=0;i<count;i++){
  const p=(s.phase*.15+i/count)%1,f=p*(ns.length-1),j=Math.min(ns.length-2,Math.floor(f)),k=f-j;
  const x=ns[j].x*(1-k)+ns[j+1].x*k,y=ns[j].y*(1-k)+ns[j+1].y*k+Math.sin(i*2.4+s.phase)*2.2;
  const fade=Math.min(1,p*8,(1-p)*8);c.globalAlpha=fade*(.38+s.power*.5);c.fillStyle=i%5===0?'#f8d88f':'#bdeffe';c.beginPath();c.arc(x,y,i%5===0?1.12:.65,0,Math.PI*2);c.fill();
 }
 c.globalAlpha=.32+s.power*.36;c.lineWidth=.4;c.strokeStyle='#bacfff';
 for(let i=2;i<ns.length-1;i+=4){const n=ns[i];c.beginPath();c.arc(n.x,n.y,2.3+s.power*.6,0,Math.PI*2);c.stroke()}
 c.globalAlpha=1;
}
function running(){return !document.hidden&&!reduce.matches&&cards.some(s=>s.visible)}
function tick(t){frame=0;if(!running()){last=0;return}const dt=last?Math.min((t-last)/1000,.035):1/60;last=t;for(const s of cards)if(s.visible)paint(s,dt);frame=requestAnimationFrame(tick)}
function schedule(){if(running()&&!frame)frame=requestAnimationFrame(tick);else if(!running()&&frame){cancelAnimationFrame(frame);frame=0;last=0}}
function sync(s){const play=s.visible&&!document.hidden&&!reduce.matches;if(s.animation){if(play)s.animation.play();else s.animation.pause()}s.card.dataset.motion=reduce.matches?'still':play?'running':'paused';if(reduce.matches&&s.ctx)s.ctx.clearRect(0,0,240,140)}
function activate(s,active){
 s.engaged=active;s.active=(s.isFlow?s.selected:(active||s.selected))&&!reduce.matches;s.card.dataset.engagement=s.active?'active':'rest';
 if(s.animation){if(s.animation.updatePlaybackRate)s.animation.updatePlaybackRate(s.active?1.5:1);else s.animation.playbackRate=s.active?1.5:1}
 if(!active){s.x=s.y=0;s.visual.style.transform='translate3d(0,0,0)'}
}
const observer=new IntersectionObserver(entries=>{for(const e of entries){const s=cards.find(s=>s.card===e.target);s.visible=e.isIntersecting;if(!s.visible)activate(s,false);sync(s)}schedule()},{threshold:.08});
for(const s of cards){activate(s,false);observer.observe(s.card);
 s.card.addEventListener('pointerenter',()=>{if(fine.matches)activate(s,true)});
 s.card.addEventListener('pointermove',e=>{if(!fine.matches||reduce.matches)return;const r=s.visual.getBoundingClientRect();s.pointer.x=(e.clientX-r.left)/r.width*240;s.pointer.y=(e.clientY-r.top)/r.height*140;s.x=(clamp(s.pointer.x/240,0,1)-.5)*4;s.y=(clamp(s.pointer.y/140,0,1)-.5)*3;if(!s.paintFrame)s.paintFrame=requestAnimationFrame(()=>{s.paintFrame=0;s.visual.style.transform=`translate3d(${s.x}px,${s.y}px,0)`})});
 s.card.addEventListener('pointerleave',()=>activate(s,s.card.matches(':focus-visible')));
 s.card.addEventListener('focus',()=>{s.pointer={x:120,y:70};activate(s,true)});s.card.addEventListener('blur',()=>activate(s,false));
}

const story=document.querySelector('.story-flow');
if(story&&cards.some(s=>s.isFlow))new MutationObserver(records=>{
 if(!records.some(r=>r.target.classList.contains('flow-art-node')))return;
 for(const s of cards)if(s.isFlow){s.selected=s.card.classList.contains('is-active');activate(s,s.engaged)}
}).observe(story,{attributes:true,subtree:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{cards.forEach(sync);schedule()});reduce.addEventListener('change',()=>{cards.forEach(s=>{activate(s,false);sync(s)});schedule()});

})();
