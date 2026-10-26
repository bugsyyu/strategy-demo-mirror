

(()=>{
  'use strict';
  const host=document.querySelector('.hero-black-hole-stars');
  if(!host)return;
  const stars=[...host.children].map((el,i)=>{
    const s=el.style,vector=s.getPropertyValue('--transform').match(/-?[\d.]+(?=px)/g)||[];
    return {x:parseFloat(s.left)*7,y:parseFloat(s.top)*7,dx:+vector[0]||0,dy:+vector[1]||0,duration:parseFloat(s.animationDuration)*1000,delay:parseFloat(s.animationDelay)*1000,opacity:(i+1)%3===0?.5:1};
  });
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  canvas.width=canvas.height=700;canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  canvas.setAttribute('aria-hidden','true');
  host.replaceChildren(canvas);host.style.animation='none';host.dataset.renderer='batched-stars';host.dataset.starCount=String(stars.length);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let active=parent===window,raf=0,last=0,elapsed=0,painted=0,frames=0;
  function draw(){
    ctx.clearRect(0,0,700,700);ctx.save();ctx.translate(350,350);ctx.rotate(-elapsed/70000*Math.PI*2);ctx.translate(-350,-350);
    ctx.fillStyle='#fff';
    for(const s of stars){
      if(elapsed<s.delay||!s.duration)continue;
      const p=((elapsed-s.delay)%s.duration)/s.duration,size=2-p;
      ctx.globalAlpha=Math.min(1,p*10)*s.opacity;
      ctx.beginPath();ctx.arc(s.x+1+s.dx*p,s.y+1+s.dy*p,size/2,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();host.dataset.frames=String(++frames);
  }
  function tick(now){
    raf=0;if(!active||document.hidden||reduce.matches){last=0;return;}
    if(last)elapsed+=Math.min(100,now-last);last=now;
    if(now-painted>=32){draw();painted=now;}
    raf=requestAnimationFrame(tick);
  }
  function pause(){active=false;if(raf)cancelAnimationFrame(raf);raf=0;last=0;host.dataset.motion='paused';}
  function play(){active=true;host.dataset.motion=reduce.matches?'reduced':'playing';if(!raf&&!document.hidden&&!reduce.matches)raf=requestAnimationFrame(tick);}
  document.addEventListener('motion:play',play);document.addEventListener('motion:pause',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else if(active)play();});
  reduce.addEventListener('change',()=>{if(reduce.matches){if(raf)cancelAnimationFrame(raf);raf=0;last=0;host.dataset.motion='reduced';}else if(active)play();});
  draw();if(active)play();
})();
