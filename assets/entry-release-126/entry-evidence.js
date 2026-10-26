(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MarisEntryEvidence=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const SCHEMA='maris.entry-evidence.v1';
const finite=v=>v===null||v===undefined||typeof v==='boolean'||typeof v==='string'&&!v.trim()?null:Number.isFinite(Number(v))?Number(v):null;
const positive=v=>{const n=finite(v);return n!==null&&n>0?n:null};
const stamp=v=>{const n=finite(v);return n!==null&&n>=946684800&&n<4102444800?n:null};
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(v,d=2)=>v===null?'未提供':v.toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const price=v=>v===null?'未提供':v.toLocaleString('en-US',{maximumFractionDigits:v<.01?8:v<1?6:4});
const percent=v=>v===null?'未提供':(v>0?'+':'')+number(v)+'%';
function time(v){const t=stamp(v);return t?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(t*1000)+'（UTC+8）':'时间未提供'}
function build(row={},context={}){
 const demo=context.demo===true,side=row.side==='多'?'long':row.side==='空'?'short':null;
 const entry=positive(row.entry),mark=positive(row.mark),upl=finite(row.upl_usdt);
 const change=side&&entry!==null&&mark!==null?(mark/entry-1)*100*(side==='short'?-1:1):null;
 const snap=stamp(context.snapshot_ts),received=stamp(context.received_at),stale=context.stale===true;
 const e=row.entry_evidence;
 const recordedAt=stamp(e?.recorded_at),confirmedAt=stamp(e?.confirmation_observed_at);
 const linked=!!(e&&e.schema===SCHEMA&&['verified','partial'].includes(e.status)&&e.source==='execution_receipt'&&recordedAt&&confirmedAt&&snap&&recordedAt<=confirmedAt&&confirmedAt<=snap);
 const symbol=String(row.sym||'未知标的').replace(/USDT$/,'');
 const model={title:symbol+' · '+(side==='long'?'做多':side==='short'?'做空':'方向未提供')+'入场解读',demo,side,stale,
  status:linked?e.status:'unavailable',headline:linked?'从入场记录，到成交确认。':'先核验这笔持仓，再判断证据边界。',
  summary:linked?'已关联到这笔持仓的入场指令与成交回执。下面分别看当时记录、执行结果和仍不能下的结论。':'当前接口提供了持仓与价格快照，尚未提供可关联的入场指令和成交证据；不能据此断言当时出现过资金流入、突破或多周期共振。',
  snapshot:time(snap),received:time(received),facts:[
   {label:'持仓均价',value:price(entry),note:'现有持仓的平均成本，不等于首次成交价'},
   {label:'快照价格',value:price(mark),note:'来自执行器价格快照，不声称此刻实时价'},
   {label:'按方向的价格变动',value:percent(change),note:'相对持仓均价计算，未乘杠杆',tone:change===null?'muted':change<0?'caution':'positive'},
   {label:'浮动盈亏',value:upl===null?'未提供':(upl>0?'+':'')+number(upl)+' U',note:'接口给出的浮动值，不视为已扣全部费用的净收益',tone:upl===null?'muted':upl<0?'caution':'positive'}],
  timeline:[],observations:[],gaps:[],risk:[],basis:[]};
 if(demo)model.demoNote=linked?'演示证据样本 · 用于预览分析结构，不对应真实账户成交。':'演示持仓 · 非真实账户记录，不以模拟盈亏证明策略有效。';
 if(stale)model.risk.push('这份持仓快照已标记待更新。下面的价格与盈亏仅代表该快照，不用于判断当前盘面。');
 if(!snap)model.risk.push('持仓快照没有提供数据时刻，无法判断价格和盈亏的新鲜度。');
 if(change!==null)model.risk.push(change<0?'快照价格相对持仓均价，沿本单不利方向变动 '+number(Math.abs(change))+'%。这说明当前成本承压，不等于已经触发某个止损条件。':change>0?'快照价格相对持仓均价，沿本单有利方向变动 '+number(change)+'%。这是持仓结果，不能反过来证明当初每项入场依据都正确。':'快照价格与持仓均价基本相同，仅凭这一时点不能判断入场逻辑是否成立。');
 else model.risk.push('价格或方向数据不完整，暂不计算本单价格变动，也不作盈亏方向推断。');
 if(linked){
  const reference=positive(e.reference_price),fill=positive(e.fill_price),recorded=stamp(e.recorded_at),confirmed=stamp(e.confirmation_observed_at);
  model.timeline=[{label:'入场指令记录',at:time(recorded),detail:reference===null?'指令参考价未提供':'指令参考价 '+price(reference)},
   {label:'成交回执观测',at:time(confirmed),detail:fill===null?'回执成交均价未提供':'回执成交均价 '+price(fill)},
   {label:'本次持仓快照',at:time(snap),detail:'持仓均价 '+price(entry)+' · 快照价格 '+price(mark)}];
  const count=finite(e.linked_receipts),total=finite(e.referenced_receipts);
  model.coverage=count!==null&&total!==null?'已关联 '+count+' / '+total+' 条成交回执引用':'回执覆盖数量未提供';
  if(e.status==='partial')model.gaps.push('部分成交引用尚未关联，不能把当前已找到的记录当成完整入场与加减仓历史。');
  if(reference!==null&&fill!==null&&side){const diff=(fill/reference-1)*100*(side==='short'?-1:1);
   model.basis.push('回执成交均价相对指令参考价的方向性偏离为 '+percent(diff)+'。正值表示成交价格较参考价不利；这不是完整滑点评估，因为没有同步盘口与全部成交明细。');}
  if(e.protection_at_confirmation==='confirmed')model.risk.push('执行记录显示：成交确认时的保护校验通过。该记录不能替代当前保护单状态，当前是否仍有效尚未提供。');
  else model.risk.push('入场记录没有可确认的保护校验结果，不能显示“止损已就位”或“风险已覆盖”。');
  const seen=new Set();
  for(const o of Array.isArray(e.observations)?e.observations:[]){
   if(!o||o.source!=='entry_instruction_archive'||seen.has(o.kind)||!stamp(o.recorded_at)||stamp(o.recorded_at)>confirmedAt||(o.observation_time!=null&&(!stamp(o.observation_time)||stamp(o.observation_time)>stamp(o.recorded_at))))continue;
   const value=finite(o.value);if(value===null)continue;
   let card=null;
   if(o.kind==='top_position_long_short_ratio'&&value>=0){const bias=value>1?'多头':value<1?'空头':'两侧相当';
    card={label:'大户样本多空持仓比',value:number(value,4),fact:'入场归档记录中的样本持仓比为 '+number(value,4)+'，'+(value===1?'样本两侧相当。':'样本中'+bias+'持仓占优。'),analysis:value===1?'这一项没有给出单边占优证据。':((side==='long'&&value>1)||(side==='short'&&value<1)?'与本单方向一致，提供一项持仓结构佐证。':'与本单方向存在分歧，需要其他独立证据解释。'),limit:'这不是资金净流入、主动买卖盘或未来涨跌概率。'};
   }else if(o.kind==='funding_rate_pct'){
    const pay=side?(side==='long'?value>0:value<0):null;
    card={label:'归档资金费率',value:(value>0?'+':'')+number(value,4)+'%',fact:value>0?'参考市场为正费率：对应结算条件下，多头向空头支付。':value<0?'参考市场为负费率：对应结算条件下，空头向多头支付。':'记录费率为零。',analysis:value===0?'该记录没有指向某一侧的资金费率负担。':pay===null?'方向未提供，暂不判断本单方向对应哪一侧。':pay?'本单方向在该参考市场处于支付侧，提醒同时关注持仓成本。':'本单方向在该参考市场处于收取侧，但不构成价格方向的保证。',limit:'参考市场可能与账户交易所不同，不能据此计算本账户实际费用或预测之后费率。'};
   }else if(o.kind==='quote_volume_24h_usdt'&&value>=0){
    card={label:'入场归档的成交额',value:number(value/1e6,2)+' 百万 U',fact:'归档时已收盘行情对应的约24小时计价成交额为 '+number(value,0)+' U。',analysis:'提供当时市场参与规模的可核对数据。',limit:'没有盘口深度和同期比较，不能据此宣称放量突破、低冲击成本或净流入。'};
   }
   if(card){seen.add(o.kind);card.kind=o.kind;card.at=(o.reference_market==='binance_usds_m'?'参考：Binance U本位合约 · ':'参考市场未明确 · ')+'归档 '+time(o.recorded_at);card.timing=o.observation_time?'采样 '+time(o.observation_time):'原记录未提供该指标独立采样时间';model.observations.push(card)}
  }
  if(!model.observations.length)model.gaps.push('已关联成交，但这条入场记录没有可展示的行情证据，成交成功不能代替选币和择时依据。');
 }else{
  model.gaps.push('尚未关联该持仓的原始入场指令、成交回执与随单行情证据。');
  model.gaps.push('没有入场时刻和当时的独立行情记录，不能用今天的价格或其他同名币种交易补写入场原因。');
  model.risk.push('当前接口未提供保护单状态、历史最大不利偏移及费用明细；不推断止损位置、仓位预算或已执行的风控动作。');
 }
 model.basis.push('持仓、价格和盈亏来自本队授权持仓接口；入场依据仅来自已关联的归档记录。未提供的内容明确留空。');
 const ratio=model.observations.find(o=>o.kind==='top_position_long_short_ratio'),funding=model.observations.find(o=>o.kind==='funding_rate_pct');
 if(linked&&ratio){
  const agreement=ratio.analysis.includes('与本单方向一致');
  model.headline=agreement?(funding?.analysis.includes('支付侧')?'方向有支撑，成本也要看。':'持仓结构与方向一致，接下来由价格检验。'):'入场结构有分歧，反证也要一起看。';
  model.summary=ratio.fact+(funding?' 同期归档的参考市场资金费率为 '+funding.value+'。':'');
 }else if(linked){model.headline='入场指令有了成交回执。';model.summary='这笔持仓关联到了执行记录；行情依据尚未提供，先把成交事实与入场判断分开看。'}
 else if(change!==null){model.headline=change>0?'这笔持仓的价格，暂时向有利方向移动。':change<0?'这笔持仓正在承压，先看清偏离幅度。':'价格仍在均价附近，判断尚待更多记录。';model.summary='当前可核验持仓均价、快照价格与浮动盈亏。真正的入场依据，还需要原始记录补齐。'}
 if(stale)model.headline='先看最后快照，等待数据更新。';
 return model;
}
function render(m){
 const e=escape;
 const feedback=m.facts[2];
 let html='<div class="entry-evidence" data-entry-status="'+e(m.status)+'">'+(m.demo?'<p class="entry-demo">'+e(m.demoNote)+'</p>':'')+
 '<div class="entry-verdict"><span class="entry-kicker">'+(m.status==='unavailable'?'持仓可核验 · 入场证据待关联':m.status==='partial'?'入场记录部分关联':'入场记录已关联')+'</span><h2>'+e(m.headline)+'</h2><p>'+e(m.summary)+'</p></div>'+
 '<div class="entry-feedback '+e(feedback.tone||'')+'"><div><span>这份快照给出的反馈</span><strong>'+e(feedback.value)+'</strong><small>按持仓方向计算的价格变动 · 未乘杠杆</small></div><div class="entry-price-path"><span>持仓均价 <b>'+e(m.facts[0].value)+'</b></span><i aria-hidden="true"></i><span>快照价格 <b>'+e(m.facts[1].value)+'</b></span><span class="entry-upl">浮动盈亏 <b>'+e(m.facts[3].value)+'</b></span></div></div>'+
 '<p class="entry-snapshot">快照 '+e(m.snapshot)+'</p>';
 if(m.stale)html+='<p class="entry-scope-note">快照已标记待更新，不能视为当前盘面。</p>';
 if(m.observations.length)html+='<section class="entry-signals-section"><h3>入场记录里的关键线索</h3><div class="entry-signals">'+m.observations.map(o=>'<article><span>'+e(o.label)+'</span><strong>'+e(o.value)+'</strong><p>'+e(o.analysis)+'</p></article>').join('')+'</div><p class="entry-scope-note">以上是参考市场的归档观察，不是胜率预测，也不等同本账户的实际费用。</p></section>';
 else html+='<p class="entry-scope-note">尚无可核验的入场行情证据，不以当前盈亏倒推出当时的原因。</p>';
 if(m.status==='partial')html+='<p class="entry-scope-note">'+e(m.coverage)+'；这不是完整的入场与加减仓历史。</p>';
 html+='<details class="entry-deep"><summary><span>沿着记录，展开这笔交易</span><small>成交链路 · 反证 · 来源</small></summary>';
 if(m.timeline.length)html+='<section><h3>入场与成交的证据链</h3><p class="entry-source">'+e(m.coverage)+'</p><ol class="entry-timeline">'+m.timeline.map(t=>'<li><b>'+e(t.label)+'</b><time>'+e(t.at)+'</time><span>'+e(t.detail)+'</span></li>').join('')+'</ol></section>';
 if(m.observations.length)html+='<section><h3>每条线索能证明什么</h3>'+m.observations.map(o=>'<article class="entry-observation"><div><h4>'+e(o.label)+'</h4><strong>'+e(o.value)+'</strong></div><p>'+e(o.fact)+'</p><p class="entry-limit">边界：'+e(o.limit)+'</p><small>'+e(o.at)+' · '+e(o.timing)+'</small></article>').join('')+'</section>';
 html+='<section><h3>反证与仍待确认的部分</h3><ul class="entry-risks">'+[...m.risk,...m.gaps].map(x=>'<li>'+e(x)+'</li>').join('')+'</ul></section>'+
 '<section class="entry-basis"><h3>来源与核对口径</h3><p>快照时刻：'+e(m.snapshot)+'</p><p>读取时刻：'+e(m.received)+'</p>'+m.basis.map(s=>'<p>'+e(s)+'</p>').join('')+'</section></details></div>';
 return html;
}
return {build,render};
});
