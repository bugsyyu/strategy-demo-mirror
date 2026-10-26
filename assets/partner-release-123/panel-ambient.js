import {createField} from './market-field.js';
import {createGrid} from './solana-grid-motion.js';


const selector='.story-source > .legacy-source, .family-portal .family-content > .card, .family-exit .family-content > .card, .family-exit .family-content > div:not(.card)';
const pending=new WeakSet();
const observer=new IntersectionObserver(entries=>{
 for(const entry of entries){if(!entry.isIntersecting||!pending.has(entry.target))continue;
  const host=entry.target;pending.delete(host);observer.unobserve(host);
  if(host.dataset.grid==='true')createGrid(host);createField(host.querySelector('canvas'));
 }
},{threshold:.01});
for(const panel of document.querySelectorAll(selector)){
 panel.classList.add('has-panel-ambient');
 const host=document.createElement('div');host.className='panel-ambient';host.setAttribute('data-maris-ambient','');host.setAttribute('aria-hidden','true');host.dataset.media='pending';host.dataset.grid=String(panel.matches('.legacy-source'));
 const poster=new Image();poster.className='market-field-poster';poster.alt='';poster.src=new URL('./solana-color-field.png',import.meta.url).href;
 const canvas=document.createElement('canvas');host.append(poster,canvas);panel.append(host);pending.add(host);observer.observe(host);
}
