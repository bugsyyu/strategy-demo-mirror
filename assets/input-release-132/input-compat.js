(()=>{'use strict';




const fields=new WeakMap(),masked=new Set(),queue=new Set();let frame=0;
const editable=el=>el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el?.isContentEditable;
const segments=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
const nativeValue=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
function state(el){let s=fields.get(el);if(!s){s={composing:false,endedAt:-Infinity};fields.set(el,s)}return s}
function repaint(input){queue.add(input);if(!frame)frame=requestAnimationFrame(()=>{frame=0;for(const el of queue)paint(el);queue.clear()})}
function paint(input){
 const s=fields.get(input);if(!s?.canvas||!input.isConnected)return;
 const canvas=s.canvas,cs=getComputedStyle(input),w=input.clientWidth,h=input.clientHeight;
 const hidden=input.dataset.concealed!=='false';canvas.hidden=!hidden||!w||!h;
 if(canvas.hidden)return;
 const scale=Math.min(devicePixelRatio||1,2),cw=Math.round(w*scale),ch=Math.round(h*scale);
 if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch}
 canvas.style.left=(input.offsetLeft+input.clientLeft)+'px';canvas.style.top=(input.offsetTop+input.clientTop)+'px';canvas.style.width=w+'px';canvas.style.height=h+'px';
 const ctx=canvas.getContext('2d');ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,w,h);
 const size=parseFloat(cs.fontSize)||16,spacing=parseFloat(cs.letterSpacing)||0;
 ctx.font=cs.fontStyle+' '+cs.fontWeight+' '+size+'px '+cs.fontFamily;ctx.textBaseline='middle';ctx.fillStyle=cs.getPropertyValue('--secret-ink').trim()||'#d8e6ec';
 const left=parseFloat(cs.paddingLeft)||0,right=parseFloat(cs.paddingRight)||0,top=parseFloat(cs.paddingTop)||0,bottom=parseFloat(cs.paddingBottom)||0;
 const y=top+(h-top-bottom)/2;let x=left-input.scrollLeft;
 ctx.save();ctx.beginPath();ctx.rect(left,0,Math.max(0,w-left-right),h);ctx.clip();
 const value=input.value,parts=segments?segments.segment(value):Array.from(value).map((segment,index)=>({segment,index}));
 for(const part of parts){
  const advance=ctx.measureText(part.segment).width+spacing;
  if(x+advance>=left&&x<w-right){
   if(s.composing&&part.index>=s.composeStart&&part.index<s.composeStart+(s.composeText||'').length){
    ctx.fillText(part.segment,x,y);ctx.fillRect(x,y+size*.65,Math.max(1,advance-1),1);
   }else{ctx.beginPath();ctx.arc(x+advance/2,y,Math.max(1.6,size*.105),0,Math.PI*2);ctx.fill()}
  }
  x+=advance;if(x>w-right)break;
 }
 ctx.restore();
}
function secret(input){
 const s=state(input);if(s.canvas)return;
 input.dataset.marisSecret='true';if(!input.hasAttribute('data-concealed'))input.dataset.concealed='true';
 input.type='text';input.inputMode='text';input.spellcheck=false;
 input.setAttribute('autocomplete','off');input.setAttribute('autocapitalize','off');input.setAttribute('autocorrect','off');input.setAttribute('writingsuggestions','false');
 let wrapper=input.parentElement;
 if(!wrapper.matches('.family-secret,.secret-field,.maris-secret-wrap')){wrapper=document.createElement('div');wrapper.className='maris-secret-wrap';input.before(wrapper);wrapper.append(input)}
 wrapper.classList.add('maris-secret-host');
 const canvas=document.createElement('canvas');canvas.className='maris-secret-mask';canvas.setAttribute('aria-hidden','true');wrapper.append(canvas);s.canvas=canvas;masked.add(input);
 
 
 if(nativeValue?.get&&nativeValue?.set&&!Object.getOwnPropertyDescriptor(input,'value'))Object.defineProperty(input,'value',{configurable:true,enumerable:true,get(){return nativeValue.get.call(this)},set(v){nativeValue.set.call(this,v);repaint(this)}});
 for(const name of ['input','change','focus','scroll','select'])input.addEventListener(name,()=>repaint(input),{passive:true});
 new MutationObserver(()=>repaint(input)).observe(input,{attributes:true,attributeFilter:['data-concealed','class','style']});
 if(typeof ResizeObserver==='function')new ResizeObserver(()=>repaint(input)).observe(input);
 repaint(input);
}
function scan(root){
 if(root.nodeType!==1&&root.nodeType!==9)return;
 const selector='input[type="password"],input[data-concealed],input[data-maris-secret]';
 if(root.matches?.(selector))secret(root);root.querySelectorAll(selector).forEach(secret);
}
document.addEventListener('compositionstart',e=>{
 if(!editable(e.target))return;
 const s=state(e.target);s.composing=true;s.composeStart=e.target.selectionStart||0;s.composeText='';e.target.dataset.composing='true';repaint(e.target);
},true);
document.addEventListener('compositionupdate',e=>{if(!editable(e.target))return;state(e.target).composeText=e.data||'';repaint(e.target)},true);
document.addEventListener('compositionend',e=>{
 if(!editable(e.target))return;
 const s=state(e.target);s.composing=false;s.endedAt=performance.now();
 delete e.target.dataset.composing;repaint(e.target);
},true);
document.addEventListener('blur',e=>{
 if(!editable(e.target))return;
 const s=fields.get(e.target);if(s?.composing){s.composing=false;s.endedAt=performance.now()}
 delete e.target.dataset.composing;repaint(e.target);
},true);
function pending(el){const s=fields.get(el);return !!s&&(s.composing||performance.now()-s.endedAt<180)}
document.addEventListener('keydown',e=>{
 if(e.key!=='Enter'||!editable(e.target))return;
 if(e.isComposing||e.keyCode===229||pending(e.target)){
  
  
  e.stopImmediatePropagation();
  return;
 }
 if(e.target.id==='tok'&&typeof window.login==='function'){
  e.preventDefault();e.stopImmediatePropagation();window.login();
 }
},true);
document.addEventListener('submit',e=>{
 const active=document.activeElement;
 if(editable(active)&&pending(active)){e.preventDefault();e.stopImmediatePropagation()}
},true);
addEventListener('resize',()=>masked.forEach(repaint),{passive:true});
document.addEventListener('selectionchange',()=>{if(masked.has(document.activeElement))repaint(document.activeElement)});
document.fonts?.ready.then(()=>masked.forEach(repaint));
scan(document);
new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)scan(node)}).observe(document.body,{childList:true,subtree:true});
})();
