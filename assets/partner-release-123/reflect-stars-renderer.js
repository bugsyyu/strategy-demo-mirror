import {reflectStarLayers} from './reflect-stardust.js';
const visibleLayers=reflectStarLayers.map(layer=>layer.filter(([x])=>x<=936));

export function drawReflectStars(ctx,w,h,time,cx=w/2,cy=h/2){const fw=936,fh=560,left=cx-fw/2,top=cy-fh/2;ctx.save();ctx.beginPath();ctx.rect(left,top,fw,fh);ctx.clip();ctx.shadowBlur=0;
visibleLayers.forEach((layer,k)=>{const phase=(time%(100+k*50))/(100+k*50)*2000,opacity=[.7,.35,.21][k];for(const [x,rawY] of layer){const y=rawY-phase+k;if(x>fw||y<0||y>fh)continue;const p=y/fh,mask=p<.25?p/.25*.8:p<.5?.8+(p-.25)/.25*.2:p<.75?1-(p-.5)/.25*.2:(1-p)/.25*.8;ctx.fillStyle=`rgba(255,255,255,${opacity*mask})`;ctx.fillRect(left+x,top+y,1,1)}});ctx.restore()}
