(()=>{
  'use strict';
  const asset=new Image();
  asset.onload=()=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',initialize,{once:true}):initialize();
  asset.onerror=()=>console.warn('Navigation artwork unavailable; original direction labels retained.');
  asset.src='./assets/partner-release-122/orbit-arrow.webp';
  function initialize(){
    const root=document.querySelector('.wrap');if(!root)return;
    const selectors='a,button,.pgt',arrows=new Map(),owners=new WeakMap();let serial=0;
    const directions={'→':'right','›':'right','←':'left','‹':'left','↗':'ne','↘':'se','↓':'down','↑':'up','▾':'down','▴':'up'};
    const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>{entry.target.dataset.orbitVisible=String(entry.isIntersecting)}),{rootMargin:'24px',threshold:0});
    function pause(){document.documentElement.toggleAttribute('data-orbit-paused',document.hidden)}
    document.addEventListener('visibilitychange',pause);pause();
    function direction(state,glyph){
      if(glyph)state.direction=directions[glyph];
      if(state.toggle&&state.owner.hasAttribute('aria-expanded'))state.direction=state.owner.getAttribute('aria-expanded')==='true'?'up':'down';
      if(state.host.dataset.orbitDirection!==state.direction)state.host.dataset.orbitDirection=state.direction;
    }
    function lastText(element){
      const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let node,last=null;
      while(node=walker.nextNode())if(node.textContent.trim()&&!node.parentElement.closest('script,style,svg,[inert]'))last=node;
      return last;
    }
    function decorate(element){
      if(!element.isConnected||element.closest('[inert]'))return;
      const existing=owners.get(element);if(existing)direction(existing);
      const node=lastText(element);if(!node)return;
      const match=node.textContent.match(/([→›←‹↗↘↓↑▾▴])\s*$/u);if(!match)return;
      const owner=element.closest('a,button,.pgh')||element;
      const bare=node.textContent.trim()===match[1];
      const host=bare&&!node.parentElement.matches('a,button')?node.parentElement:element;
      let state=arrows.get(host);
      if(!state){
        state={host,owner,toggle:/[▾▴]/.test(match[1])||owner.classList.contains('disclosure'),direction:directions[match[1]]};
        arrows.set(host,state);owners.set(element,state);owners.set(owner,state);
        host.classList.add('orbit-host');host.style.setProperty('--orbit-phase',(-serial++*.71%7.8).toFixed(2)+'s');
        owner.setAttribute('data-orbit-control','');
        if(bare&&host!==owner){host.classList.add('orbit-host--only');host.setAttribute('aria-hidden','true')}
        visibility.observe(host);
      }
      direction(state,match[1]);
      node.textContent=node.textContent.slice(0,match.index).trimEnd();
    }
    function scan(node){
      if(node.nodeType!==1)return;
      if(node.matches(selectors))decorate(node);
      node.querySelectorAll(selectors).forEach(decorate);
    }
    scan(root);
    const observer=new MutationObserver(records=>{
      const pending=new Set();let removals=false;
      for(const record of records){
        const element=record.target.nodeType===1?record.target:record.target.parentElement;
        if(record.type==='attributes'){const state=owners.get(element);if(state)direction(state);continue}
        const owner=element?.closest(selectors);if(owner)pending.add(owner);
        for(const added of record.addedNodes||[])if(added.nodeType===1)pending.add(added);
        if(record.removedNodes?.length)removals=true;
      }
      for(const node of pending)scan(node);
      if(removals)for(const [host] of arrows)if(!host.isConnected){visibility.unobserve(host);arrows.delete(host)}
    });
    observer.observe(root,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['aria-expanded']});
  }
})();
