(()=>{'use strict';


const fields=new WeakMap();
const editable=el=>el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el?.isContentEditable;
function state(el){let s=fields.get(el);if(!s){s={composing:false,endedAt:-Infinity};fields.set(el,s)}return s}
function secret(input){
 if(input.dataset.marisSecret==='true')return;
 input.dataset.marisSecret='true';
 if(!input.hasAttribute('data-concealed'))input.dataset.concealed='true';
 input.type='text';input.inputMode='text';input.spellcheck=false;
 input.setAttribute('autocapitalize','off');input.setAttribute('autocorrect','off');
 input.setAttribute('writingsuggestions','false');
}
function scan(root){
 if(root.nodeType!==1&&root.nodeType!==9)return;
 const selector='input[type="password"],input[data-concealed]';
 if(root.matches?.(selector))secret(root);
 root.querySelectorAll(selector).forEach(secret);
}
document.addEventListener('compositionstart',e=>{
 if(!editable(e.target))return;
 state(e.target).composing=true;e.target.dataset.composing='true';
},true);
document.addEventListener('compositionend',e=>{
 if(!editable(e.target))return;
 const s=state(e.target);s.composing=false;s.endedAt=performance.now();
 delete e.target.dataset.composing;
},true);
document.addEventListener('blur',e=>{
 if(!editable(e.target))return;
 const s=fields.get(e.target);if(s?.composing){s.composing=false;s.endedAt=performance.now()}
 delete e.target.dataset.composing;
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
scan(document);
new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)scan(node)}).observe(document.body,{childList:true,subtree:true});
})();
