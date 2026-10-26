const CAMERA=2.6,K=Math.sqrt(CAMERA*CAMERA-1),POLAR=1,SP=Math.sin(POLAR),CP=Math.cos(POLAR);
export function mapPoint(u,v){const lon=-(u-.5)*Math.PI*2,lat=-(v-.5)*Math.PI,c=Math.cos(lat);return [Math.cos(lon)*c,Math.sin(lat),Math.sin(lon)*c]}
export function projectPoint(point,phase,geometry){
  const c=Math.cos(phase),s=Math.sin(phase),rx=point[0]*c-point[2]*s,rz=point[0]*s+point[2]*c;
  const ry=point[1]*SP-rz*CP,depth=point[1]*CP+rz*SP,p=K/(CAMERA-depth);
  return [geometry.cx+rx*geometry.r*p,geometry.cy-ry*geometry.r*p,depth,p];
}
export function pickSurface(x,y,geometry,phase){
  const u=(x-geometry.cx)/geometry.r,v=(geometry.cy-y)/geometry.r,q=u*u+v*v;
  if(q>=1)return null;
  const t=(CAMERA-Math.sqrt(1-q))/(1+q/(K*K)),rx=t*u/K,ry=t*v/K,depth=CAMERA-t;
  const wy=ry*SP+depth*CP,rz=-ry*CP+depth*SP,c=Math.cos(phase),s=Math.sin(phase);
  return [rx*c+rz*s,wy,-rx*s+rz*c];
}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
export class NightlightField{
  constructor(data){
    if(!Array.isArray(data.samples)||data.samples.length%3)throw Error('Invalid night-light samples');
    this.count=data.samples.length/3;this.points=new Float32Array(this.count*4);this.energy=new Float32Array(this.count);
    this.projected=new Float32Array(this.count*5);this.visibleCount=0;this.activeCount=0;
    for(let i=0;i<this.count;i++){
      const j=i*3,k=i*4,[x,y,z]=mapPoint(data.samples[j]/data.dimensions[0],data.samples[j+1]/data.dimensions[1]);
      this.points.set([x,y,z,Math.pow(data.samples[j+2]/255,1.25)],k);
    }
  }
  update(dt,phase,g,focus,strength){
    const c=Math.cos(phase),s=Math.sin(phase),rise=1-Math.exp(-dt*4.2),fall=1-Math.exp(-dt*.92);
    let visible=0,active=0,peak=0;
    for(let i=0;i<this.count;i++){
      const k=i*4,x=this.points[k],y=this.points[k+1],z=this.points[k+2],radiance=this.points[k+3];
      const proximity=focus?Math.exp(-Math.max(0,1-x*focus[0]-y*focus[1]-z*focus[2])*76):0;
      const target=strength*proximity;
      this.energy[i]+=(target-this.energy[i])*(target>this.energy[i]?rise:fall);
      peak=Math.max(peak,this.energy[i]);
      const rx=x*c-z*s,rz=x*s+z*c,ry=y*SP-rz*CP,depth=y*CP+rz*SP;
      if(depth<=1/CAMERA)continue;
      const p=K/(CAMERA-depth),sx=g.cx+rx*g.r*p,sy=g.cy-ry*g.r*p;
      if(sx<0||sx>g.w||sy<0||sy>g.h)continue;
      const limb=smooth(1/CAMERA,.65,depth),alpha=radiance*(.045+this.energy[i]*.9)*limb;
      if(alpha<.022)continue;
      const j=visible++*5;
      this.projected.set([sx,sy,alpha,radiance,p],j);
      if(this.energy[i]>.13)active++;
    }
    this.visibleCount=visible;this.activeCount=active;this.peakEnergy=peak;
  }
  draw(ctx,radius,sprites){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<this.visibleCount;i++){
      const j=i*5,x=this.projected[j],y=this.projected[j+1],a=this.projected[j+2],radiance=this.projected[j+3],p=this.projected[j+4];
      const color=radiance>.85?2:radiance>.59?1:0;
      const core=Math.min(1.05,Math.max(.32,radius*.00105*p))*(.6+.4*radiance);
      if(a>.075){
        const halo=Math.min(3.1,core*(2.2+radiance));
        ctx.globalAlpha=a*.43;ctx.drawImage(sprites[color],x-halo,y-halo,halo*2,halo*2);
      }
      ctx.globalAlpha=a;ctx.fillStyle=['#e5ad66','#f5ce98','#fff0d4'][color];
      ctx.fillRect(x-core*.5,y-core*.5,core,core);
      if(a>.5){ctx.globalAlpha=(a-.5)*.75;ctx.fillStyle='#f0f6fb';ctx.fillRect(x-.23,y-.23,.46,.46)}
    }
    ctx.restore();
  }
}
