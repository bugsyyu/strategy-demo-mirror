(()=>{'use strict';

const nav=document.querySelector('.team-guest-nav');
nav?.querySelector('a[href*="/team"]')?.setAttribute('aria-current','page');
const chapters=document.querySelector('.partner-chapters');
function markChapter(){chapters?.querySelectorAll('a[href^="#"]').forEach(a=>{if(a.hash===location.hash)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}
addEventListener('hashchange',markChapter);markChapter();
const heading=document.querySelector('.family-exit .family-page-heading');
if(heading){
 const art=document.createElement('div');art.className='suite-heading-art agent-art';art.dataset.lightFlow='settlement';art.setAttribute('aria-hidden','true');
 const visual=document.createElement('span');visual.className='agent-art-visual';
 const image=document.createElement('img');image.src='./assets/partner-release-123/directory-art/settlement-v87.webp';image.alt='';image.width=768;image.height=512;image.decoding='async';visual.append(image);art.append(visual);
 heading.append(art);
}
const input=document.getElementById('tok');
if(input){
 if(new URLSearchParams(location.search).get('op')==='0')document.querySelector('.team-entry-secondary')?.setAttribute('href','#registerCard');
 let composing=false,lastComposition=-Infinity;
 input.addEventListener('compositionstart',()=>{composing=true;input.dataset.composing='true'});
 input.addEventListener('compositionend',()=>{composing=false;lastComposition=performance.now();delete input.dataset.composing});
 input.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;
  if(composing||e.isComposing||e.keyCode===229||performance.now()-lastComposition<180)return;
  e.preventDefault();window.login();
 });
}
})();


(()=>{
 const root=document.documentElement;
 const visibility=()=>root.toggleAttribute('data-motion-suspended',document.hidden);
 document.addEventListener('visibilitychange',visibility);visibility();
 document.addEventListener('maris:explain-open',()=>root.setAttribute('data-modal-motion',''));
 document.addEventListener('maris:explain-close',()=>root.removeAttribute('data-modal-motion'));
 const selector='.intelligence-map,.module-visual,.mechanism-pulse,.narrative-visual',seen=new WeakSet();
 const observer=new IntersectionObserver(entries=>{for(const e of entries)e.target.toggleAttribute('data-maris-sleep',!e.isIntersecting)},{rootMargin:'80px'});
 function scan(node){if(node.nodeType!==1)return;const targets=node.matches(selector)?[node,...node.querySelectorAll(selector)]:node.querySelectorAll(selector);for(const target of targets)if(!seen.has(target)){seen.add(target);observer.observe(target)}}
 scan(document.body);
 new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)scan(node)}).observe(document.body,{childList:true,subtree:true});
})();
