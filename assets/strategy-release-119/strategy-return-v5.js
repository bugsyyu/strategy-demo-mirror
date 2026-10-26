const host=document.querySelector('[data-performance-30d]');
if(host){
 const NS='http://www.w3.org/2000/svg',svg=host.querySelector('svg'),buttons=[...host.querySelectorAll('[data-return-basis]')],value=host.querySelector('.live-value'),readout=host.querySelector('[data-value-readout]');
 let data=null,basis='mtm',points=[],coordinates=[],selected=0,box=null,frame=0,pointerX=0;
 const percent=x=>(x>0?'+':'')+x.toFixed(2)+'%';
 const date=t=>new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Singapore',month:'2-digit',day:'2-digit'}).format(new Date(t));
 const dayLabel=t=>'第 '+Math.min(dayCount(data),Math.floor((t-points[0][0])/86400000)+1)+' 天';
 const axisLabel=t=>(data&&data.window_kind==='since_inception')?dayLabel(t):date(t);
 function node(name,attrs,text){const n=document.createElementNS(NS,name);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n}
 function renderLedger(d){
  const rows=host.querySelector('[data-trade-rows]'),ledger=host.querySelector('[data-trade-ledger]');if(!ledger)return;
  const trades=(Array.isArray(d.recent_trades)?d.recent_trades:[]).slice(0,8);
  const text=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=String(value);if(cls)el.className=cls;return el};
  rows.replaceChildren();
  for(const t of trades){
   if(!/^[A-Z0-9]{1,20}$/.test(t.sym)||!['多','空'].includes(t.side)||!Number.isFinite(t.roi5)||!Number.isFinite(t.spot)||![t.entry,t.exit].every(v=>Number.isFinite(Number(v))&&Number(v)>0)||![t.open,t.close].every(v=>/^\d{2}\/\d{2}$/.test(v)))continue;
   const tr=document.createElement('tr'),state=t.status==='mark_to_market'?'含尾仓估值':'已平仓';
   const cell=(label)=>{const c=document.createElement('td');c.dataset.label=label;tr.append(c);return c};
   const asset=cell('标的 / 方向');asset.append(text('strong',t.sym),text('span',t.side+' · 5×','ledger-side'),text('small',state,'ledger-status'));
   const entry=cell('入场参考');entry.append(text('span',t.entry),text('small',t.open,'ledger-date'));
   const exit=cell(t.status==='mark_to_market'?'估值参考':'退出参考');exit.append(text('span',t.exit),text('small',t.close,'ledger-date'));
   const roi=cell('复盘收益');roi.append(text('strong',(t.roi5>0?'+':'')+t.roi5.toFixed(1)+'%',t.roi5<0?'ledger-loss':'ledger-gain'),text('small','币价 '+(t.spot>0?'+':'')+t.spot.toFixed(1)+'%','ledger-date'));rows.append(tr);
  }
  host.querySelector('[data-trade-count]').textContent='最近 '+rows.children.length+' 笔交易';
  host.querySelector('[data-ledger-empty]').hidden=rows.children.length>0;
  host.querySelector('[data-ledger-updated]').textContent=d.ledger_updated_sgt?'账本更新 '+d.ledger_updated_sgt+'（UTC+8）':'';
  ledger.dataset.loaded=String(rows.children.length>0);
 }
 function pick(index){if(!coordinates.length)return;selected=Math.max(0,Math.min(coordinates.length-1,index));const [x,y]=coordinates[selected],p=points[selected];host.querySelector('[data-crosshair]').setAttribute('x1',x);host.querySelector('[data-crosshair]').setAttribute('x2',x);const dot=host.querySelector('[data-point]');dot.setAttribute('cx',x);dot.setAttribute('cy',y);readout.textContent=axisLabel(p[0])+' · '+percent(p[1]-100);svg.setAttribute('aria-label',(basis==='mtm'?'含浮盈':'已结算')+'收益率曲线，'+axisLabel(p[0])+'：'+percent(p[1]-100)+'。左右方向键查看原始数据点。')}
 function render(){if(!data)return;points=basis==='mtm'?data.curve:data.curve_realized;const pct=basis==='mtm'?data.ret_mtm_pct:data.ret_realized_pct,dd=basis==='mtm'?data.max_dd_pct:data.max_dd_realized_pct;
 value.replaceChildren(document.createTextNode((pct>0?'+':'')+pct.toFixed(2)),Object.assign(document.createElement('small'),{textContent:'%'}));value.classList.toggle('is-negative',pct<0);host.querySelector('[data-return-dd]').textContent=dd.toFixed(2)+'%';
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.returnBasis===basis)));
 const w=Math.max(260,Math.round(svg.getBoundingClientRect().width)),h=w<520?235:290,left=48,right=w-8,top=16,bottom=h-35;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const values=points.map(p=>p[1]-100),lo=Math.min(0,...values),hi=Math.max(0,...values),range=(hi-lo)||1,low=lo-range*.05,high=hi+range*.08;
 const x=t=>left+(t-points[0][0])/(points.at(-1)[0]-points[0][0])*(right-left),y=v=>bottom-(v-low)/(high-low)*(bottom-top);
 coordinates=points.map(p=>[x(p[0]),y(p[1]-100)]);svg.replaceChildren();
 const defs=node('defs',{}),gradient=node('linearGradient',{id:'live-return-fill',x1:'0',y1:'0',x2:'0',y2:'1'});gradient.append(node('stop',{offset:'0%','stop-color':'#8cbca7','stop-opacity':'.14'}),node('stop',{offset:'100%','stop-color':'#8cbca7','stop-opacity':'0'}));defs.append(gradient);svg.append(defs);
 for(let i=0;i<4;i++){const n=lo+(hi-lo)*i/3,yy=y(n);svg.append(node('line',{x1:left,x2:right,y1:yy,y2:yy,class:'live-guide'}),node('text',{x:left-12,y:yy+4,'text-anchor':'end',class:'live-axis'},Math.round(n)+'%'))}
 const ticks=w<520?2:5;for(let i=0;i<=ticks;i++){const t=points[0][0]+(points.at(-1)[0]-points[0][0])*i/ticks;svg.append(node('text',{x:x(t),y:h-8,'text-anchor':i===0?'start':i===ticks?'end':'middle',class:'live-axis'},axisLabel(t)))}
 
 let line='M'+coordinates[0].join(',');for(let i=1;i<coordinates.length;i++){const [x,y]=coordinates[i];line+=basis==='realized'?'H'+x+'V'+y:'L'+x+','+y}
 svg.append(node('path',{d:line+'L'+right+','+bottom+'L'+left+','+bottom+'Z',fill:'url(#live-return-fill)'}),node('path',{d:line,class:'live-chart-line'}),node('line',{x1:0,x2:0,y1:top,y2:bottom,class:'live-cursor','data-crosshair':''}),node('circle',{cx:0,cy:0,r:4,class:'live-point','data-point':''}));pick(points.length-1);host.dataset.loaded='true';
 }
 host.querySelectorAll('[data-return-basis]').forEach(b=>b.addEventListener('click',()=>{basis=b.dataset.returnBasis;render()}));
 svg.addEventListener('pointerenter',()=>box=svg.getBoundingClientRect(),{passive:true});
 svg.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;pointerX=e.clientX;if(frame)return;frame=requestAnimationFrame(()=>{frame=0;box??=svg.getBoundingClientRect();const x=(pointerX-box.left)/box.width*svg.viewBox.baseVal.width;let nearest=0;for(let i=1;i<coordinates.length;i++)if(Math.abs(coordinates[i][0]-x)<Math.abs(coordinates[nearest][0]-x))nearest=i;pick(nearest)})},{passive:true});
 svg.addEventListener('click',e=>{box=svg.getBoundingClientRect();const x=(e.clientX-box.left)/box.width*svg.viewBox.baseVal.width;let nearest=0;for(let i=1;i<coordinates.length;i++)if(Math.abs(coordinates[i][0]-x)<Math.abs(coordinates[nearest][0]-x))nearest=i;pick(nearest)});
 svg.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();pick(e.key==='Home'?0:e.key==='End'?points.length-1:selected+(e.key==='ArrowLeft'?-1:1))});
 new ResizeObserver(()=>{box=null;render()}).observe(svg);
 

 const BASE=host.getAttribute('data-performance-30d');
 const calUrl=c=>BASE+(BASE.includes('?')?'&':'?')+'caliber='+c+(c==='full'?'&since=inception':'')+'&t='+Date.now();
 const dayCount=d=>Math.round(Number(d&&d.days));
 const INCEPTION={kicker:'引擎满配口径 · 纸面账本',title:n=>'近 '+n+' 天策略收益率（引擎满配口径）',aria:n=>'近 '+n+' 天策略收益率（引擎满配口径）曲线',toc:'满配口径收益'};
 const q=sel=>host.querySelector(sel)||document.querySelector(sel);
 const ORIG={kicker:q('.live-kicker')?.textContent,title:q('#live-performance-title')?.textContent,aria:host.querySelector('.live-plot')?.getAttribute('aria-label'),meta:q('.ledger-meta span')?.textContent,caption:q('.ledger-table caption')?.textContent,note:q('.ledger-note')?.textContent,toc:document.querySelector('a[href="#strategy-live30"]')?.textContent,footnote:host.querySelector('.live-footnote')?.innerHTML,ledgerHidden:!!host.querySelector('[data-trade-ledger]')?.hidden};
 const setText=(sel,txt)=>{const el=q(sel);if(el&&txt!=null)el.textContent=txt};
 function applyReal7d(d){
  setText('.live-kicker','伙伴账户真实实盘 · 策略仓口径');
  setText('#live-performance-title','近7天真实实盘收益率');
  const plot=host.querySelector('.live-plot');if(plot)plot.setAttribute('aria-label','近7天真实实盘收益率曲线');
  setText('.ledger-meta span','伙伴账户真实实盘 · 策略仓口径');
  setText('.ledger-table caption','最近交易');
  setText('.ledger-note','真实实盘口径不展示逐笔账本。');
  const toc=document.querySelector('a[href="#strategy-live30"]');if(toc)toc.textContent='近7天收益';
  const fn=host.querySelector('.live-footnote');
  if(fn){const w=Array.isArray(d.window_sgt)?d.window_sgt:['',''];fn.replaceChildren(Object.assign(document.createElement('strong'),{textContent:'真实实盘口径'}),document.createTextNode('——统计我们实际托管的全部伙伴账户，只算策略仓盈亏（手动仓不计），分母为各账户在册本金合计；窗口 '+w[0]+' 至 '+w[1]+'（UTC+8），每日一个采样点，窗口每天向前滚动一天。含浮盈为主口径，已结算为辅助口径；此口径不是满配复盘，也不是任何单一账户的净值曲线；实际账户收益以账户后台为准，历史表现不代表未来收益。'))}
  const det=host.querySelector('[data-trade-ledger]');if(det)det.hidden=!(Array.isArray(d.recent_trades)&&d.recent_trades.length);
 }
 function applyFull(d){
  const n=dayCount(d);
  setText('.live-kicker',INCEPTION.kicker);setText('#live-performance-title',INCEPTION.title(n));
  const plot=host.querySelector('.live-plot');if(plot)plot.setAttribute('aria-label',INCEPTION.aria(n));
  setText('.ledger-meta span',ORIG.meta);setText('.ledger-table caption',ORIG.caption);setText('.ledger-note',ORIG.note);
  const toc=document.querySelector('a[href="#strategy-live30"]');if(toc)toc.textContent=INCEPTION.toc;
  const fn=host.querySelector('.live-footnote');if(fn&&ORIG.footnote!=null)fn.innerHTML=ORIG.footnote;
  const det=host.querySelector('[data-trade-ledger]');if(det)det.hidden=ORIG.ledgerHidden;
 }
 function applyCaliber(d){if(d&&d.caliber==='real7d')applyReal7d(d);else applyFull(d)}
 let caliber=null;
 const calWrap=document.createElement('div');calWrap.className='live-switch live-caliber-switch';calWrap.setAttribute('role','group');calWrap.setAttribute('aria-label','收益口径');
 const calButtons=[['real7d','近7天真实'],['full','引擎满配口径']].map(([k,label])=>{const b=document.createElement('button');b.type='button';b.dataset.returnCaliber=k;b.textContent=label;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{if(b.disabled||k===caliber)return;load(k)});calWrap.append(b);return b});
 const basisSwitch=host.querySelector('.live-switch');if(basisSwitch&&basisSwitch.parentNode)basisSwitch.parentNode.insertBefore(calWrap,basisSwitch);
 const markCaliber=()=>calButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.returnCaliber===caliber)));
 function validate(d){
  for(const key of ['ret_mtm_pct','ret_realized_pct','max_dd_pct','max_dd_realized_pct'])if(!Number.isFinite(d[key]))throw Error('收益指标不完整');
  for(const key of ['curve','curve_realized']){if(!Array.isArray(d[key])||d[key].length<2||d[key].some((p,i)=>!Array.isArray(p)||!p.every(Number.isFinite)||p[1]<=0||(i&&p[0]<=d[key][i-1][0])))throw Error('收益曲线数据不完整')}
  const span=d.curve.at(-1)[0]-d.curve[0][0];
  if(d.caliber==='real7d'){if(d.days!==7||Math.abs(span-7*86400000)>2*3600000)throw Error('数据窗口不满7天')}else if(d.window_kind!=='since_inception'||!(Number.isFinite(d.days)&&d.days>=1)||!(span>0))throw Error('满配口径数据窗口不完整');
  if(!Array.isArray(d.window_sgt)||d.window_sgt.length<2)throw Error('数据窗口缺失');
  return d;
 }
 function show(d){
  data=d;caliber=d.caliber==='real7d'?'real7d':'full';applyCaliber(d);markCaliber();
  host.querySelector('[data-window]').textContent=caliber==='real7d'?d.window_sgt[0]+' — '+d.window_sgt[1]+'（UTC+8）':'共 '+dayCount(d)+' 天 · 截至 '+d.window_sgt[1]+'（UTC+8）';
  host.querySelector('[data-realized-value]').textContent=percent(d.ret_realized_pct);renderLedger(d);render();buttons.forEach(b=>b.disabled=false);
 }
 function load(c){
  const first=!data;calButtons.forEach(b=>b.disabled=true);
  return demoGet(c?calUrl(c):BASE,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('收益数据暂未取得');return r.json()}).then(validate).then(show).catch(error=>{
   if(first){host.dataset.loaded='unavailable';value.textContent='—';readout.textContent=error.message+'，不展示替代曲线。';buttons.forEach(b=>b.disabled=true)}
   else{readout.textContent=error.message+'，保留当前口径曲线。'}
  }).finally(()=>{calButtons.forEach(b=>b.disabled=false)});
 }
 load(null);
}
