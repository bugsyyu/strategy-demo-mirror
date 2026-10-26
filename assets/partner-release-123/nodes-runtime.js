(()=>{
 const stage=document.getElementById('stage'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let timer=0,active=!stage.classList.contains('is-paused'),hold=0,last=performance.now();
 function check(){timer=0;const now=performance.now(),delta=Math.min(now-last,300);last=now;if(!active||document.hidden||reduce.matches)return;const animations=document.getAnimations().filter(a=>a.animationName?.startsWith('connected-card-backlink-'));if(animations.length&&animations.every(a=>a.playState==='finished')){hold+=delta;if(hold>=2400){animations.forEach(a=>a.currentTime=0);hold=0;stage.dataset.cycles=String(+(stage.dataset.cycles||0)+1)}}timer=setTimeout(check,100)}
 function sync(){clearTimeout(timer);timer=0;last=performance.now();if(active&&!document.hidden&&!reduce.matches)timer=setTimeout(check,100)}
 document.addEventListener('motion:play',()=>{active=true;sync()});document.addEventListener('motion:pause',()=>{active=false;sync()});document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);sync();
})();
