import {createNetworkSurface} from './network-surface.js';


const scene=document.querySelector('.network-scene');
if(scene){
 let canvas=scene.querySelector('canvas');const hero=scene.closest('section');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),finePointer=matchMedia('(hover: hover) and (pointer: fine)');
 const names=[['BTC','Bitcoin'],['ETH','Ethereum'],['USDT','Tether'],['SOL','Solana'],['BNB','BNB'],['XRP','XRP'],['USDC','USD Coin'],['ADA','Cardano'],['DOGE','Dogecoin'],['AVAX','Avalanche'],['LINK','Chainlink'],['DOT','Polkadot'],['TON','Toncoin'],['TRX','TRON'],['LTC','Litecoin'],['BCH','Bitcoin Cash'],['XLM','Stellar'],['ATOM','Cosmos'],['UNI','Uniswap'],['AAVE','Aave'],['NEAR','NEAR'],['SUI','Sui'],['APT','Aptos'],['ARB','Arbitrum'],['OP','Optimism'],['POL','Polygon'],['INJ','Injective'],['FIL','Filecoin'],['ICP','Internet Computer'],['ETC','Ethereum Classic'],['ALGO','Algorand'],['HBAR','Hedera'],['GRT','The Graph'],['STX','Stacks'],['MKR','Maker'],['DAI','Dai'],['SEI','Sei'],['RUNE','THORChain'],['FET','Fetch.ai'],['XMR','Monero']];
 scene.dataset.ringLayout='single';scene.dataset.distinctCoins=String(names.length);
 const labels=names.map(([id,name])=>{const el=document.createElement('div');el.className='network-orbit-label';el.dataset.coin=id;const im=new Image();im.src='./assets/partner-release-122/network-icons/'+id+'.svg';im.alt='';el.append(im,document.createTextNode(name));scene.querySelector('.network-orbit-labels').append(el);return el});
 let w=0,h=0,dpr=1,cx=0,cy=0,r=0,phase=.38,time=0,last=0,frame=0,visible=true,hover=0,px=-999,py=-999,inside=false,speed=.065,wheelVelocity=0,labelHitBoxes=[],labelSizes=[];
 let renderedFrames=0,lastSample=-Infinity,readingZone=null,drawWidth=0,drawHeight=0;const copy=hero.querySelector('.portal-copy');
 let worker=null,renderer=null,pending=false,requestId=0,generation=0,lastPaintTime=0,queued=null;
 function fallback(){if(worker){worker.terminate();worker=null;const replacement=canvas.cloneNode();canvas.replaceWith(replacement);canvas=replacement}renderer=createNetworkSurface(canvas);pending=false;scene.dataset.renderThread='main-fallback';}
 try{if(canvas.transferControlToOffscreen&&typeof Worker!=='undefined'){
   worker=new Worker(new URL('./network-worker.js',import.meta.url),{type:'module'});const surface=canvas.transferControlToOffscreen();
   worker.postMessage({type:'init',canvas:surface},[surface]);scene.dataset.renderThread='worker';
   worker.onmessage=e=>{pending=false;const {state,result}=e.data;if(e.data.generation===generation&&visible&&!document.hidden)present(state,result);if(queued){const next=queued;queued=null;submit(next)};};
   worker.onerror=e=>{console.warn('Optical worker unavailable; same renderer retained',e.message);fallback();sync()};
 }else fallback()}catch(error){console.warn('Optical worker initialization fallback',error.name);fallback()}
 function submit(state){if(pending){queued=state;return}pending=true;state.dt=state.still?0:Math.min(.1,Math.max(0,state.time-lastPaintTime));lastPaintTime=state.time;worker.postMessage({type:'paint',state,generation,id:++requestId})}
 function present(state,result){
  const {w,h,cx,cy,r,phase,hover,speed,wheelVelocity,time,still,now}=state;
  renderedFrames++;const step=Math.PI*2/labels.length;
  labelHitBoxes=[];
  labels.forEach((el,i)=>{
   const a=((i*step+phase-.38+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI,distance=r+34,x=cx+Math.cos(a)*distance,y=cy+Math.sin(a)*distance,angle=a*.78,size=labelSizes[i]||{width:0,height:0};
   let fade=Math.min(1,Math.max(0,(1.49-Math.abs(a))/.28));
   if(readingZone){const co=Math.cos(angle),si=Math.sin(angle),right=x+size.width*co+Math.abs(si)*size.height/2,top=y+Math.min(0,size.width*si)-size.height/2,bottom=y+Math.max(0,size.width*si)+size.height/2;
    const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)},overlap=smooth((bottom-readingZone.top+42)/64)*smooth((readingZone.bottom-top+42)/64);
    fade*=1-overlap*(1-smooth((readingZone.left-right+12)/88));
   }
   if(y+size.width+size.height<0||y-size.width-size.height>h)fade=0;const opacity=String(Math.round(fade*.83*1000)/1000);if(el.style.opacity!==opacity)el.style.opacity=opacity;if(!fade){el.style.willChange='auto';return}el.style.willChange='transform,opacity';
   el.style.transform=`translate3d(${x}px,${y}px,0) translateY(-50%) rotate(${angle}rad)`;
   if(fade>.18)labelHitBoxes.push({x,y,angle,width:size.width,height:size.height});
  });
  if(still||now-lastSample>160){lastSample=now;scene.dataset.renderedFrames=String(renderedFrames);scene.dataset.phase=phase.toFixed(5);scene.dataset.labelPhase=(phase-.38).toFixed(5);scene.dataset.wheelVelocity=wheelVelocity.toFixed(4);scene.dataset.speed=still?'0.0000':speed.toFixed(4);scene.dataset.hover=hover.toFixed(3);scene.dataset.glowPeak=result.peak.toFixed(3);scene.dataset.glowNodes=String(result.active);scene.dataset.motion=still?'still':'running';scene.dataset.renderer='optical-triangulated-shell';scene.dataset.elapsed=time.toFixed(3);scene.dataset.drawMs=result.drawMs.toFixed(3);scene.dataset.sampledAt=performance.now().toFixed(1);}
 }
 function draw(now,still=false){
  frame=0;if(!visible||document.hidden||!w)return;const drawStarted=performance.now();
  const dt=still?0:Math.min(last?(now-last)/1000:0,.04);last=now;time+=dt;
  const on=!still&&inside&&(px-cx)**2+(py-cy)**2<r*r;
  hover+=(+on-hover)*(1-Math.exp(-dt*4));
  wheelVelocity*=Math.exp(-dt*1.7);
  const driving=Math.abs(wheelVelocity)>.025, direction=driving?Math.sign(wheelVelocity):1;
  const targetSpeed=direction*(.065+.20*hover)+wheelVelocity;
  speed+=(targetSpeed-speed)*(1-Math.exp(-dt*5));phase+=dt*speed;
  const state={w,h,dpr,cx,cy,r,phase,time,dt,px,py,on,hover,speed,wheelVelocity,still,now};
  if(worker){if(!pending||still)submit(state)}
  else{const result=renderer.paint(state);result.drawMs=performance.now()-drawStarted;present(state,result)}
  if(!still&&!reduce.matches)frame=requestAnimationFrame(draw);
 }
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(visible&&!document.hidden){if(reduce.matches)draw(0,true);else frame=requestAnimationFrame(draw)}else scene.dataset.motion='paused'}
 function measureLabels(){labelSizes=labels.map(el=>({width:el.offsetWidth,height:el.offsetHeight}));if(copy){const a=copy.getBoundingClientRect(),b=scene.getBoundingClientRect();readingZone={left:a.left-b.left,top:a.top-b.top,bottom:a.bottom-b.top}}}
 document.fonts.ready.then(measureLabels);
 function resize(){
  const nextW=scene.clientWidth,nextH=scene.clientHeight;if(!nextW||!nextH)return;
  w=nextW;h=nextH;dpr=Math.min(devicePixelRatio||1,2);const mobile=w<700;
  
  
  cx=w*(mobile?-.08:.075);cy=h*(mobile?.245:.54);r=w*(mobile?.67:.33);
  generation++;queued=null;
  scene.dataset.layout=mobile?'phone':'panorama';scene.dataset.layoutWidth=String(w);scene.dataset.layoutHeight=String(h);scene.dataset.globeRadius=r.toFixed(2);
  drawWidth=Math.min(w,Math.ceil(cx+r+18));drawHeight=Math.min(h,Math.ceil(cy+r+18));canvas.style.width=drawWidth+'px';canvas.style.height=drawHeight+'px';
  measureLabels();scene.dataset.readingTreatment='soft-label-occlusion';sync();
 }
 if(copy)new ResizeObserver(measureLabels).observe(copy);
 function wheel(e){
  
  if(reduce.matches||!finePointer.matches||!visible||document.hidden||e.ctrlKey||e.metaKey||e.target.closest?.('a,button,input,textarea,select,[role="dialog"],.portal-copy,#csPanel'))return;
  const unit=e.deltaMode===1?16:e.deltaMode===2?innerHeight:1;
  const delta=(Math.abs(e.deltaY)>=Math.abs(e.deltaX)?e.deltaY:e.deltaX)*unit;
  if(!delta)return;
  const box=scene.getBoundingClientRect(),x=e.clientX-box.left,y=e.clientY-box.top;
  if(x<0||x>w||y<0||y>h)return;
  const onSphere=(x-cx)**2+(y-cy)**2<=r*r;
  
  
  const onLabel=labelHitBoxes.some(label=>{
   const dx=x-label.x,dy=y-label.y,c=Math.cos(label.angle),s=Math.sin(label.angle),u=dx*c+dy*s,v=-dx*s+dy*c;
   return u>=-10&&u<=label.width+10&&Math.abs(v)<=label.height/2+10;
  });
  const radial=Math.hypot(x-cx,y-cy),angle=Math.atan2(y-cy,x-cx);
  const onRing=Math.abs(angle)<1.36&&radial>=r&&radial<=r+58;
  if(!onSphere&&!onLabel&&!onRing)return;
  if(e.cancelable)e.preventDefault();
  px=x;py=y;inside=onSphere;
  scene.dataset.wheelTarget=onSphere?'sphere':'coin-ring';
  if(Math.sign(delta)!==Math.sign(wheelVelocity))wheelVelocity=0;
  wheelVelocity=Math.max(-1.25,Math.min(1.25,wheelVelocity+delta*.004));
 }
 function bindWheel(){removeEventListener('wheel',wheel);if(finePointer.matches&&!reduce.matches)addEventListener('wheel',wheel,{passive:false})}
 finePointer.addEventListener('change',bindWheel);reduce.addEventListener('change',bindWheel);bindWheel();
 function pointer(e){if(!visible||document.hidden||reduce.matches||e.target.closest?.('a,button,input,select,textarea,.portal-copy,#csPanel')){inside=false;return}const b=scene.getBoundingClientRect();px=e.clientX-b.left;py=e.clientY-b.top;inside=px>=0&&px<w&&py>=0&&py<h}
 addEventListener('pointermove',pointer,{passive:true});addEventListener('pointerdown',pointer,{passive:true});addEventListener('scroll',()=>inside=false,{passive:true});document.documentElement.addEventListener('pointerleave',()=>inside=false);document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',()=>{inside=false;hover=0;wheelVelocity=0;generation++;if(worker)worker.postMessage({type:'reset'});else renderer.reset();sync()});new ResizeObserver(resize).observe(scene);new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync()},{threshold:.02}).observe(hero);resize();
}
