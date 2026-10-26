

export function createNetworkSurface(canvas){
 const ctx=canvas.getContext('2d',{alpha:true});
 const makeCanvas=()=>typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(64,64):document.createElement('canvas');
 let w=0,h=0,dpr=1,cx=0,cy=0,r=0,phase=0,time=0,px=0,py=0,hover=0;
 let seed=419;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
 const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l)};
 const phi=(1+Math.sqrt(5))/2;
 let vertices=[[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].map(norm);
 let faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 
 const mids=new Map();function mid(a,b){const key=[a,b].sort((x,y)=>x-y).join(',');if(mids.has(key))return mids.get(key);const i=vertices.length;vertices.push(norm(vertices[a].map((v,j)=>(v+vertices[b][j])/2)));mids.set(key,i);return i}
 for(let level=0;level<2;level++)faces=faces.flatMap(([a,b,c])=>{const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);return [[a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]]});
 const edgeSet=new Set(),edges=[];faces.forEach(f=>{for(let k=0;k<3;k++){const pair=[f[k],f[(k+1)%3]].sort((a,b)=>a-b),key=pair.join(',');if(!edgeSet.has(key)){edgeSet.add(key);edges.push(pair)}}});
 const stars=Array.from({length:1200},()=>{const z=rand()*2-1,a=rand()*Math.PI*2,r=Math.cbrt(rand())*.80,c=Math.sqrt(1-z*z);return [r*c*Math.cos(a),r*z,r*c*Math.sin(a),rand(),rand()]}),energy=new Float32Array(vertices.length);
 let projC=1,projS=0;
 const projectedVertices=vertices.map(()=>[0,0,0]),projectedStars=stars.map(()=>[0,0,0]);
 const starBatches=Array.from({length:24},()=>[]),flares=[],wireBatches=Array.from({length:40},()=>[]);
 let glass,drawWidth=0,drawHeight=0;
 const rim=makeCanvas();
 const colors=['#b4d9ff','#e8caff','#e9e4ff','#a8dedb'];
 const sprites=colors.map(color=>{const c=makeCanvas();c.width=c.height=64;const g=c.getContext('2d'),grad=g.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,color);grad.addColorStop(.09,color+'f0');grad.addColorStop(.23,color+'55');grad.addColorStop(1,color+'00');g.fillStyle=grad;g.fillRect(0,0,64,64);return c});
 function project(v,out){const co=projC,si=projS,xx=v[0]*co-v[2]*si,zz=v[0]*si+v[2]*co,yy=v[1]*.94-zz*.342,z=v[1]*.342+zz*.94;out[0]=cx+xx*r;out[1]=cy-yy*r;out[2]=z;return out}
 function inView(p,pad=18){return p[0]>=-pad&&p[0]<=drawWidth+pad&&p[1]>=-pad&&p[1]<=drawHeight+pad}
 function intersects(a,b){return !(Math.max(a[0],b[0])<0||Math.min(a[0],b[0])>drawWidth||Math.max(a[1],b[1])<0||Math.min(a[1],b[1])>drawHeight)}
 function line(a,b,stroke,width=1,dx=0,dy=0){ctx.beginPath();ctx.moveTo(a[0]+dx,a[1]+dy);ctx.lineTo(b[0]+dx,b[1]+dy);ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke()}
 function prepareRim(){const size=r*2+8;rim.width=rim.height=Math.ceil(size*dpr);const c=rim.getContext('2d');c.setTransform(dpr,0,0,dpr,size*dpr/2,size*dpr/2);
  for(let j=0;j<160;j++){const a=j/160*Math.PI*2,b=a+Math.PI*2/160+.001,lum=Math.pow(.5+.5*Math.sin(a*2.7),7),alpha=.075+.65*lum;for(let k=0;k<3;k++){c.beginPath();c.arc((k-1)*.35,0,r+(k-1)*.75,a,b);c.lineWidth=.8;c.strokeStyle=`rgba(${['146,206,235','231,218,248','207,149,219'][k]},${alpha*(k===1?1:.6)})`;c.stroke()}}
 }

 function paint(state){
 const resized=w!==state.w||h!==state.h||dpr!==state.dpr||r!==state.r;
 ({w,h,dpr,cx,cy,r,phase,time,px,py,hover}=state);const {dt,on}=state;
 projC=Math.cos(phase);projS=Math.sin(phase);
 if(resized){drawWidth=Math.min(w,Math.ceil(cx+r+18));drawHeight=Math.min(h,Math.ceil(cy+r+18));canvas.width=Math.round(drawWidth*dpr);canvas.height=Math.round(drawHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  glass=ctx.createRadialGradient(cx-r*.28,cy-r*.35,r*.05,cx,cy,r);glass.addColorStop(0,'#9d9ccc05');glass.addColorStop(.60,'#8f8fb60b');glass.addColorStop(.86,'#95a2c31c');glass.addColorStop(.965,'#bdc5df35');glass.addColorStop(1,'#95c1e105');
 prepareRim();}
  ctx.clearRect(0,0,drawWidth,drawHeight);ctx.save();ctx.globalCompositeOperation='screen';
  
  ctx.fillStyle=glass;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  vertices.forEach((v,i)=>project(v,projectedVertices[i]));const points=projectedVertices;
  for(let i=0;i<points.length;i++){
   const p=points[i],dist=((p[0]-px)**2+(p[1]-py)**2)/(r*r),target=on&&p[2]>0?Math.exp(-dist*10):0;
   energy[i]+=(target-energy[i])*(1-Math.exp(-dt*(target>energy[i]?5:1.4)));
  }
  faces.forEach((f,i)=>{const z=(points[f[0]][2]+points[f[1]][2]+points[f[2]][2])/3;
   if(z<.06)return;const a=points[f[0]],b=points[f[1]],c=points[f[2]];if(Math.max(a[0],b[0],c[0])<0||Math.min(a[0],b[0],c[0])>drawWidth||Math.max(a[1],b[1],c[1])<0||Math.min(a[1],b[1],c[1])>drawHeight)return;const shimmer=.5+.5*Math.sin(time*.18+i*.71);
   ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();const e=f.reduce((v,k)=>v+energy[k],0)/3;ctx.fillStyle=`rgba(${e>.18?(i%3===0?'242,172,97':'74,215,238'):(i%3===0?'191,161,224':'143,182,226')},${(.007+.024*shimmer)*z+e*.20})`;ctx.fill();
  });
  
  starBatches.forEach(b=>b.length=0);flares.length=0;
  stars.forEach((v,i)=>{const p=project(v,projectedStars[i]);if(!inView(p,5))return;const light=.18+.56*(p[2]+1)/2,scint=.7+.3*Math.sin(time*.8+v[3]*24),size=.40+v[4]*.75,alpha=light*scint;starBatches[(i%4)*6+Math.min(5,Math.floor(alpha*8))].push(i);if(v[4]>.974)flares.push(i)});
  starBatches.forEach((batch,i)=>{ctx.globalAlpha=(i%6+.5)/8;ctx.fillStyle=colors[Math.floor(i/6)];ctx.beginPath();for(const j of batch){const [x,y]=projectedStars[j],s=.40+stars[j][4]*.75;ctx.moveTo(x+s,y);ctx.arc(x,y,s,0,Math.PI*2)}ctx.fill()});
  for(const j of flares){const p=projectedStars[j];ctx.globalAlpha=.35*(.7+.3*Math.sin(time*.8+stars[j][3]*24));ctx.drawImage(sprites[j%4],p[0]-4,p[1]-4,8,8)}ctx.globalAlpha=1;
  wireBatches.forEach(b=>b.length=0);
  edges.forEach(([a,b],i)=>{if(!intersects(points[a],points[b]))return;const z=(points[a][2]+points[b][2])/2,e=(energy[a]+energy[b])*.5,alpha=Math.min(.94,(z<0?.045:.24+.58*z)+e*.42);wireBatches[(i%4)*10+Math.min(9,Math.floor(alpha*10))].push(i)});
  wireBatches.forEach((batch,i)=>{if(!batch.length)return;const alpha=(i%10+.5)/10,base=["203,213,248","187,205,236","216,191,237","177,218,226"][Math.floor(i/10)];ctx.beginPath();for(const j of batch){const [a,b]=edges[j],p=points[a],q=points[b];ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1])}
   if(alpha>.15){ctx.save();ctx.strokeStyle=`rgba(133,210,248,${alpha*.4})`;ctx.lineWidth=1.1;ctx.stroke();ctx.strokeStyle=`rgba(228,147,220,${alpha*.35})`;ctx.stroke();ctx.restore()}
   ctx.strokeStyle=`rgba(${base},${alpha})`;ctx.lineWidth=alpha>.15?.78:.45;ctx.stroke();
  });
  
  
  edges.forEach(([a,b],i)=>{const e=Math.min(energy[a],energy[b]);if(e<.14||points[a][2]<0||points[b][2]<0)return;
   const rgb=i%3===0?'255,196,117':'97,231,250';
   line(points[a],points[b],`rgba(${rgb},${e*.22})`,6);
   line(points[a],points[b],`rgba(${rgb},${Math.min(1,e*1.6)})`,1.8);
   for(let j=1;j<5;j++){const f=j/5,x=points[a][0]*(1-f)+points[b][0]*f,y=points[a][1]*(1-f)+points[b][1]*f;
    ctx.globalAlpha=e*.85;ctx.fillStyle=i%3===0?'#fff0c6':'#c1f4ff';ctx.fillRect(x-.65,y-.65,1.3,1.3)}ctx.globalAlpha=1;
  });
  let peak=0,active=0;
  points.forEach((p,i)=>{const e=energy[i];peak=Math.max(peak,e);if(e>.1)active++;if(p[2]<-.2||!inView(p))return;const glint=.4+.6*Math.pow(.5+.5*Math.sin(time*.38+i*1.9),12),a=(.18+Math.max(0,p[2])*.68)*glint+e*.8,s=4.8+e*10;
   ctx.globalAlpha=Math.min(1,a);ctx.drawImage(sprites[i%4],p[0]-s,p[1]-s,s*2,s*2);ctx.globalAlpha=Math.min(1,.45+e*.5);ctx.fillStyle='#eff1ff';ctx.beginPath();ctx.arc(p[0],p[1],.7+e*.5,0,Math.PI*2);ctx.fill();
   if(e>.20||glint>.96){const ray=(3+e*10)*glint;ctx.globalAlpha=Math.min(.65,a);line([p[0]-ray,p[1]],[p[0]+ray,p[1]],'#dfe8ff',.5);line([p[0],p[1]-ray],[p[0],p[1]+ray],'#dddaff',.5)}
  });
  ctx.globalAlpha=1;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(time*.03);ctx.globalAlpha=.92+hover*.08;ctx.drawImage(rim,-r-4,-r-4,r*2+8,r*2+8);ctx.restore();
  ctx.restore();
 return {peak,active,width:canvas.width,height:canvas.height};
 }
 return {paint,reset(){energy.fill(0)}};
}
