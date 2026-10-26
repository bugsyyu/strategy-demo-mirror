const flow=document.querySelector('.story-flow');
if(flow){
 const buttons=[...flow.querySelectorAll('.flow-step')],art=[...flow.querySelectorAll('[data-node]')],entries=[...flow.querySelectorAll('[data-entry]')],routes=[...flow.querySelectorAll('[data-route]')];
 const colors=['#b4dce8','#c5b9e6','#b1dcca','#dcc9ac'];
 let selected=-1,lastPoint=null;
 function select(index){
  if(index<0||index>=buttons.length||selected===index)return;
  selected=index;flow.dataset.step=String(index);flow.style.setProperty('--flow-accent',colors[index]);
  entries.forEach((entry,i)=>{entry.classList.toggle('is-active',i===index);entry.querySelector('.flow-step-body').setAttribute('aria-hidden',String(i!==index))});
  buttons.forEach((button,i)=>{button.classList.toggle('is-active',i===index);button.setAttribute('aria-expanded',String(i===index));button.setAttribute('aria-pressed',String(i===index))});
  art.forEach((button,i)=>{button.classList.toggle('is-active',i===index);button.setAttribute('aria-pressed',String(i===index))});
  routes.forEach((route,i)=>route.classList.toggle('is-active',i===index));
  flow.querySelector('.loop-center-index').textContent=`0${index+1} / 04`;
  const lines=[['程序盯住','行情与资金流'],['信号出现时'],['自动同步下单'],['自动止损止盈、','自动平仓离场']][index];
  const title=flow.querySelector('.loop-center-title');title.replaceChildren();lines.forEach((line,i)=>{if(i)title.append(document.createElement('br'));title.append(document.createTextNode(line))});
 }
 
 flow.querySelector('.flow-layout').addEventListener('pointermove',event=>{
  if(event.pointerType==='touch')return;
  if(lastPoint&&Math.hypot(event.clientX-lastPoint.x,event.clientY-lastPoint.y)<1)return;
  lastPoint={x:event.clientX,y:event.clientY};
  const target=event.target.closest('[data-node],[data-entry]');
  if(target)select(Number(target.dataset.node??target.dataset.entry));
 });
 for(const column of [buttons,art])column.forEach((button,index)=>{
  button.addEventListener('click',()=>select(index));button.addEventListener('focus',()=>select(index));
  button.addEventListener('keydown',event=>{
   if(!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
   event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?column.length-1:(index+(['ArrowDown','ArrowRight'].includes(event.key)?1:column.length-1))%column.length;
   column[next].focus();select(next);
  });
 });
 select(0);
 new IntersectionObserver(entries=>{flow.dataset.visible=String(entries[0].isIntersecting)},{threshold:.04}).observe(flow);
 const pause=()=>document.documentElement.toggleAttribute('data-story-paused',document.hidden);document.addEventListener('visibilitychange',pause);pause();
}
const hwm=document.querySelector('.hwm-figure'),hwmImage=hwm?.querySelector('img');
if(hwmImage){const show=()=>hwm.classList.add('is-ready');if(hwmImage.complete&&hwmImage.naturalWidth)show();else hwmImage.addEventListener('load',show,{once:true})}
document.querySelectorAll('.story-source-link').forEach(link=>link.addEventListener('click',()=>{const target=document.querySelector(link.getAttribute('href'));if(target)target.open=true}));



for(const chart of document.querySelectorAll('.performance-source > .card > svg')){
 const line=chart.querySelector('polyline'),area=chart.querySelector('polygon');
 if(line&&area){area.setAttribute('points','0,40 '+line.getAttribute('points')+' 100,40');chart.dataset.fillSource='original-polyline'}
}
