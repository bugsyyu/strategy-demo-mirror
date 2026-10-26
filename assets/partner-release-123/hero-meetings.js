(()=>{
'use strict';
function initialize(){
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),hero=document.getElementById('teamHero'),code=document.getElementById('heroTeamCode'),stats=document.getElementById('stats');
function syncCode(){const value=document.getElementById('tvCode')?.textContent||'—';if(code.textContent!==value)code.textContent=value;const lead=hero.querySelector('.lead'),b=lead.querySelector('#tvCode');if(b){b.hidden=true;const a=b.previousSibling,c=b.nextSibling;if(a?.nodeType===3&&a.textContent.trim())a.textContent='';if(c?.nodeType===3&&/^ · /.test(c.textContent))c.textContent=c.textContent.replace(/^ · /,'')}}
new MutationObserver(syncCode).observe(hero.querySelector('.lead'),{childList:true,characterData:true,subtree:true});syncCode();
const icons={users:'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20v-2a5 5 0 0 1 10 0v2m0-4a5 5 0 0 1 10 2v2',active:'M12 3a9 9 0 1 0 9 9M12 3v5m4-1 3-3M5 13h4l2-4 3 8 2-4h3',risk:'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7Zm0 5v5m0 3v.01',capital:'M4 8 12 3l8 5M3 21h18M4 9h16M6 11v7m6-7v7m6-7v7',equity:'M4 7h16v14H4Zm3 0V4h10v3M7 11h4m-4 4h8m1-4h1',profit:'M3 19h18M4 16l5-6 4 3 7-9m-5 0h5v5',rate:'M5 19 19 5M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm8 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z'};
function decorate(){stats.querySelectorAll('.st:not([data-feature])').forEach(el=>{const label=el.querySelector('.k')?.textContent||'',key=/用户/.test(label)?'users':/运行/.test(label)?'active':/灯/.test(label)?'risk':/本金/.test(label)?'capital':/净值/.test(label)?'equity':/率|表现|均值/.test(label)?'rate':'profit';el.dataset.feature=key;el.tabIndex=0;const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','metric-icon');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',icons[key]);path.setAttribute('class','icon-signal');svg.append(path);el.prepend(svg)})}
new MutationObserver(decorate).observe(stats,{childList:true});decorate();
const stage=document.querySelector('.team-glass-stage'),surface=stage.querySelector('.users-list-surface'),slices=stage.querySelector('.team-glass-slices'),offsets=[0,20,40,48,72,72,48,40,20,0];
let visible=false,scheduled=0,settle=0,release=0,built=false,force=false,width=0,dirty=true,obscured=false,previous=-1;
function clearSlices(){slices.replaceChildren();built=false}
function ready(){stage.dataset.sliced='false';stage.dataset.handoff='false';if('requestIdleCallback' in window)requestIdleCallback(()=>{if(stage.dataset.sliced==='false')clearSlices()},{timeout:500});else setTimeout(()=>{if(stage.dataset.sliced==='false')clearSlices()},80)}
function build(){const w=surface.getBoundingClientRect().width;if(!w)return;width=w;slices.replaceChildren();const fragment=document.createDocumentFragment();
 const template=surface.cloneNode(true),sourceRows=[...surface.querySelectorAll('.urow')],copies=[...template.querySelectorAll('.urow')];
 
 if(copies.length>8){const spacer=document.createElement('div');spacer.style.height=sourceRows.slice(8).reduce((h,row)=>h+row.getBoundingClientRect().height,0)+'px';copies[8].before(spacer);copies.slice(8).forEach(row=>row.remove())}
 template.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));template.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes])if(a.name.startsWith('on'))el.removeAttribute(a.name);if(el.matches('button,input,select,textarea,a'))el.tabIndex=-1});template.classList.add('slice-content');template.style.width=w+'px';
 offsets.forEach((top,i)=>{const pane=document.createElement('div');pane.className='glass-slice';pane.style.left=(i*10)+'%';pane.style.setProperty('--top',(top*(innerWidth<600?.55:1))+'px');const content=template.cloneNode(true);content.style.left=(-w*i/10)+'px';pane.append(content);fragment.append(pane)});slices.append(fragment);built=true;dirty=false}
function update(){scheduled=0;const box=stage.getBoundingClientRect(),modal=document.getElementById('explainModal');if(document.hidden||box.height<=0||box.top>innerHeight+250||box.bottom< -250||(modal&&getComputedStyle(modal).display!=='none'))return;const p=reduce.matches||force?1:((innerHeight-box.top*1.4)/Math.min(box.height,604)>.5?1:0);
 if(reduce.matches||force){clearTimeout(settle);clearTimeout(release);stage.style.setProperty('--glass-progress',1);stage.dataset.progress='1';previous=1;ready();return}
 if(p===previous&&!dirty&&Math.abs(width-box.width)<1)return;
 stage.style.setProperty('--glass-progress',String(p));stage.dataset.progress=String(p);
 if(p===0){clearTimeout(settle);clearTimeout(release);if(previous===1&&!built){stage.style.setProperty('--glass-progress','1');build();stage.dataset.sliced='true';stage.dataset.handoff='true';requestAnimationFrame(()=>requestAnimationFrame(()=>{if(previous!==0)return;stage.dataset.handoff='false';stage.style.setProperty('--glass-progress','0')}))}else{stage.dataset.handoff='false';if(!built||dirty||Math.abs(width-box.width)>1)build();stage.dataset.sliced='true'}}
 else if(stage.dataset.sliced==='true'){clearTimeout(settle);settle=setTimeout(()=>{if(previous!==1)return;stage.dataset.handoff='true';release=setTimeout(ready,480)},1050)}else ready();previous=p;
}
function request(){if(!visible||document.hidden||obscured)return;if(!scheduled)scheduled=requestAnimationFrame(update)}
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else{clearTimeout(settle);clearTimeout(release);cancelAnimationFrame(scheduled);scheduled=0;clearSlices();stage.dataset.sliced='false';stage.dataset.handoff='false';previous=-1}},{rootMargin:'250px 0px'}).observe(stage);
new ResizeObserver(()=>{dirty=true;request()}).observe(surface);new MutationObserver(()=>{dirty=true;request()}).observe(document.getElementById('ulist'),{childList:true,subtree:true});
addEventListener('scroll',()=>{force=false;request()},{passive:true});addEventListener('resize',request,{passive:true});reduce.addEventListener('change',()=>{previous=-1;request()});document.addEventListener('visibilitychange',request);document.addEventListener('maris:explain-open',()=>{obscured=true});document.addEventListener('maris:explain-close',()=>{obscured=false;request()});
stage.dataset.motionBound='true';addEventListener('pageshow',()=>{previous=-1;request()});
surface.addEventListener('focusin',()=>{force=true;previous=-1;request()});document.addEventListener('maris:arrival',()=>{syncCode();decorate();request()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();
})();
