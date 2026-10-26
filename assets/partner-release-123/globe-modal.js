import {drawReflectStars} from './reflect-stars-renderer.js';
import {mapPoint,pickSurface} from './network-nightlights.js';
const modal=document.getElementById('explainModal'),canvas=document.getElementById('exGlobe'),ctx=canvas.getContext('2d',{alpha:true}),reduce=matchMedia('(prefers-reduced-motion: reduce)');
let width=0,height=0,dpr=1,phase=-.38,speed=.035,active=false,raf=0,last=0,hover=0,light=0,px=0,py=0,tx=0,ty=0,pointerInside=false,orbitTime=0;
let points=[],dataPromise=null;
const orbit=new Image();orbit.src='./assets/partner-release-123/reflect-globe-orbit.svg';orbit.onload=()=>{if(active&&reduce.matches)draw(performance.now(),true)};
canvas.dataset.initializations='1';canvas.dataset.geography='natural-earth-land-50m';canvas.dataset.camera='fov60-distance2.6-polar1';canvas.dataset.nightPalette='amber,ivory,cyan,rose,violet';
let cities=[],cityEnergy=new Float32Array(0),cityPeak=0,lastSample=0;
const pointBuckets=Array.from({length:4},()=>[]),lightBuckets=Array.from({length:20},()=>[]),lights=[],projected=new Float64Array(4);
const palette=[[255,206,137],[255,230,186],[155,224,241],[244,196,203],[205,185,240]];
const citySprites=palette.map(rgb=>{const c=document.createElement('canvas');c.width=c.height=24;const g=c.getContext('2d'),v=g.createRadialGradient(12,12,0,12,12,12);v.addColorStop(0,`rgba(${rgb},.8)`);v.addColorStop(.25,`rgba(${rgb},.3)`);v.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=v;g.fillRect(0,0,24,24);return c});



function loadGeography(){if(dataPromise)return dataPromise;dataPromise=Promise.all([import('./earth-coordinates.js'),import('./earth-land-lights-data.js').then(m=>m.default)]).then(([{landCoordinates},data])=>{points=landCoordinates.map(([lon,lat])=>mapPoint((lon+180)/360,(90-lat)/180));canvas.dataset.pointCount=String(points.length);
 if(!Array.isArray(data.cities)||!data.landSha256)throw Error('Invalid land-filtered nightlight samples');
 for(let i=0;i<data.cities.length;i++){const [lon,lat,v]=data.cities[i],p=mapPoint((lon+180)/360,(90-lat)/180);cities.push([...p,Math.pow(v/255,.65),i%13<10?(v>190?1:0):2+i%3])}
 canvas.dataset.landMask=data.landSource;canvas.dataset.landMaskHash=data.landSha256;
 cityEnergy=new Float32Array(cities.length);canvas.dataset.nightSource='NASA Black Marble / VIIRS';canvas.dataset.nightObservationYear=String(data.observationYear);canvas.dataset.nightSampleCount=String(cities.length);canvas.dataset.nightStatus='ready';if(active&&reduce.matches)draw(performance.now(),true);
}).catch(error=>{canvas.dataset.nightStatus='unavailable';console.error('Local decorative night-light asset failed',error)});return dataPromise}
function resize(){if(width===innerWidth&&height===innerHeight&&canvas.width>300)return;width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!px){px=tx=width*.69;py=ty=height*.46}if(reduce.matches&&active)draw(performance.now(),true)}
function draw(now,still=false){
 raf=0;if(!active||document.hidden)return;
 const dt=still?0:Math.min((now-last)/1000||.016,.05);last=now;
 const radius=width<600?Math.min(width*.91,height*.62):Math.min(width*.49,height*.74),cx=width*(width<600?.64:.68),cy=height*(width<600?.74:.80),dx=(tx-cx)/radius,dy=(ty-cy)/radius;
 const target=!still&&pointerInside&&dx*dx+dy*dy<1?1:0;
 hover+=(target-hover)*(1-Math.exp(-dt*4));speed+=(.035+.12*hover-speed)*(1-Math.exp(-dt*5));phase+=speed*dt;orbitTime+=dt;
 light+=(target-light)*(1-Math.exp(-dt*6));px+=(tx-px)*(1-Math.exp(-dt*10));py+=(ty-py)*(1-Math.exp(-dt*10));ctx.clearRect(0,0,width,height);
 drawReflectStars(ctx,width,height,orbitTime,cx,height/2);
 if(orbit.complete&&orbit.naturalWidth){ctx.save();ctx.translate(cx,cy);ctx.rotate(-orbitTime*Math.PI*2/70);ctx.scale(-1,1);ctx.globalAlpha=.30;ctx.drawImage(orbit,-radius*1.055,-radius*1.055,radius*2.11,radius*2.11);ctx.restore()}
 const cos=Math.cos(phase),sin=Math.sin(phase),sp=Math.sin(1),cp=Math.cos(1),k=Math.sqrt(2.6*2.6-1),buckets=pointBuckets;buckets.forEach(b=>b.length=0);
 function project([x,y,z]){const rx=x*cos-z*sin,rz=x*sin+z*cos,ry=y*sp-rz*cp,depth=y*cp+rz*sp,p=k/(2.6-depth);projected[0]=cx+rx*radius*p;projected[1]=cy-ry*radius*p;projected[2]=depth;projected[3]=p;return projected}
 points.forEach(point=>{const [sx,sy,depth,p]=project(point);if(depth<1/2.6||sx<0||sx>width||sy<0||sy>height)return;
  buckets[Math.min(3,Math.floor(Math.max(0,(depth-1/2.6)/(1-1/2.6))*4))].push(sx,sy,Math.max(.52,Math.min(1.5,radius*.0022*p)));
 });
 buckets.forEach((b,i)=>{ctx.beginPath();for(let j=0;j<b.length;j+=3){const x=b[j],y=b[j+1],r=b[j+2];ctx.moveTo(x+r,y);ctx.arc(x,y,r,0,Math.PI*2)}ctx.fillStyle=['rgba(239,234,255,.13)','rgba(239,234,255,.25)','rgba(239,234,255,.42)','rgba(239,234,255,.64)'][i];ctx.fill()});
 
 
 const focus=light>.01?pickSurface(px,py,{cx,cy,r:radius},phase):null,colors=new Set();lights.length=0;lightBuckets.forEach(b=>b.length=0);let nextPeak=0;const attack=1-Math.exp(-dt*5),decay=1-Math.exp(-dt*1.35);
 if(light>.01||cityPeak>.035)cities.forEach((city,index)=>{const [x,y,z,radiance,color]=city,proximity=focus?Math.exp(-Math.max(0,1-x*focus[0]-y*focus[1]-z*focus[2])*15):0;
  const excitation=light*proximity;cityEnergy[index]+=(excitation-cityEnergy[index])*(excitation>cityEnergy[index]?attack:decay);nextPeak=Math.max(nextPeak,cityEnergy[index]);
  if(cityEnergy[index]<.035)return;const [sx,sy,depth,p]=project(city);if(depth<1/2.6||sx<0||sx>width||sy<0||sy>height)return;
  const limb=Math.min(1,(depth-1/2.6)*8),a=Math.min(1,cityEnergy[index]*radiance*2.3)*limb;
  if(a>.10){lights.push(sx,sy,a,color,p);lightBuckets[color*4+Math.min(3,Math.floor(a*4))].push(sx,sy,p);colors.add(color)}
 });
 cityPeak=nextPeak;ctx.save();ctx.globalCompositeOperation='screen';
 for(let bucket=0;bucket<20;bucket++){
  const points=lightBuckets[bucket];if(!points.length)continue;const [r,g,b]=palette[Math.floor(bucket/4)];ctx.beginPath();
  for(let j=0;j<points.length;j+=3){const x=points[j],y=points[j+1],p=points[j+2],size=Math.min(1.25,.5+radius*.00048*p);ctx.moveTo(x+size,y);ctx.arc(x,y,size,0,Math.PI*2)}
  ctx.fillStyle=`rgba(${r},${g},${b},${.28+bucket%4*.23})`;ctx.fill();
 }
 for(let j=0;j<lights.length;j+=5){const x=lights[j],y=lights[j+1],a=lights[j+2],color=lights[j+3];if(a<.3)continue;ctx.globalAlpha=a*.45;ctx.drawImage(citySprites[color],x-3,y-3,6,6)}ctx.globalAlpha=1;
 ctx.shadowBlur=0;ctx.fillStyle='#fff5dd';ctx.beginPath();for(let j=0;j<lights.length;j+=5){if(lights[j+2]<.75)continue;ctx.rect(lights[j]-.3,lights[j+1]-.3,.6,.6)}ctx.fill();ctx.restore();
 if(still||now-lastSample>160){lastSample=now;canvas.dataset.stardustTime=orbitTime.toFixed(3);canvas.dataset.illumination=light.toFixed(3);canvas.dataset.highlightModel='historical-city-regions-world-anchored';canvas.dataset.phase=phase.toFixed(5);canvas.dataset.speed=still?'0':speed.toFixed(5);canvas.dataset.litPoints=String(lights.length/5);canvas.dataset.litColors=String(colors.size);canvas.dataset.lightX=px.toFixed(1);canvas.dataset.lightY=py.toFixed(1);canvas.dataset.motion=still?'still':'running';canvas.dataset.orbit=orbit.complete?'original-visible':'loading'};
 if(!still&&!reduce.matches)raf=requestAnimationFrame(draw);
}
function show(){active=true;loadGeography();resize();if(!raf){last=performance.now();if(reduce.matches)draw(last,true);else raf=requestAnimationFrame(draw)}}
function hide(){active=false;pointerInside=false;cancelAnimationFrame(raf);raf=0;canvas.dataset.motion='paused'}
modal.addEventListener('pointermove',e=>{if(reduce.matches)return;tx=e.clientX;ty=e.clientY;pointerInside=true},{passive:true});modal.addEventListener('pointerleave',()=>{pointerInside=false});modal.addEventListener('pointerdown',e=>{if(reduce.matches)return;tx=e.clientX;ty=e.clientY;pointerInside=true},{passive:true});document.addEventListener('maris:explain-open',show);document.addEventListener('maris:explain-close',hide);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(active)show()});reduce.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;pointerInside=false;hover=light=0;cityEnergy.fill(0);if(active)show()});addEventListener('resize',resize);if(getComputedStyle(modal).display!=='none')show();
