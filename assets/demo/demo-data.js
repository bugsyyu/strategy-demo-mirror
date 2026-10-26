(function () {
  'use strict';
  var NOW = Date.now();
  var NOW_S = Math.floor(NOW / 1000);
  var DAY = 86400000;
  var END = Date.UTC(2026, 0, 31, 0, 0, 0);

  function store() {
    var data = Object.create(null);
    var api = {
      getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
      setItem: function (k, v) { data[String(k)] = String(v); },
      removeItem: function (k) { delete data[String(k)]; },
      clear: function () { Object.keys(data).forEach(function (k) { delete data[k]; }); },
      key: function (i) { var ks = Object.keys(data); return i >= 0 && i < ks.length ? ks[i] : null; }
    };
    return new Proxy(data, {
      get: function (t, k) {
        if (k === 'length') return Object.keys(data).length;
        if (typeof k === 'string' && Object.prototype.hasOwnProperty.call(api, k)) return api[k];
        return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : undefined;
      },
      set: function (t, k, v) { data[String(k)] = String(v); return true; },
      deleteProperty: function (t, k) { delete data[k]; return true; },
      has: function (t, k) { return Object.prototype.hasOwnProperty.call(data, k); },
      ownKeys: function () { return Object.keys(data); },
      getOwnPropertyDescriptor: function (t, k) {
        if (!Object.prototype.hasOwnProperty.call(data, k)) return undefined;
        return { value: data[k], writable: true, enumerable: true, configurable: true };
      }
    });
  }
  window.demoMem = store();
  window.demoMem.setItem('marisTeamTk', 'DEMO-SESSION');

  function respond(status, obj) {
    var body = JSON.stringify(obj);
    return {
      ok: status >= 200 && status < 300,
      status: status,
      statusText: status === 200 ? 'OK' : 'Demo',
      redirected: false,
      type: 'basic',
      url: '',
      headers: {
        get: function (k) { return String(k).toLowerCase() === 'content-type' ? 'application/json' : null; },
        has: function (k) { return String(k).toLowerCase() === 'content-type'; }
      },
      json: function () { return Promise.resolve(JSON.parse(body)); },
      text: function () { return Promise.resolve(body); },
      clone: function () { return respond(status, obj); }
    };
  }

  function parseQuery(qs) {
    var out = {};
    (qs || '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = i < 0 ? kv : kv.slice(0, i);
      var v = i < 0 ? '' : kv.slice(i + 1);
      try { out[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { out[k] = v; }
    });
    return out;
  }

  function series(start, step, values) {
    return values.map(function (v, i) { return [start + i * step, v]; });
  }

  var TRADES = [
    { sym: 'DEMOA', side: '多', open: '01/24', close: '01/26', entry: 1.2345, exit: 1.3012, roi5: 27.0, spot: 5.4, status: 'closed' },
    { sym: 'DEMOB', side: '空', open: '01/25', close: '01/27', entry: 0.4567, exit: 0.4381, roi5: 20.4, spot: 4.1, status: 'closed' },
    { sym: 'DEMOC', side: '多', open: '01/28', close: '01/31', entry: 2.3456, exit: 2.3101, roi5: -7.6, spot: -1.5, status: 'mark_to_market' }
  ];

  function h01(q) {
    if (q.caliber === 'full') {
      var full = [], fullR = [], v = 100, r = 100;
      var steps = [0.6, -0.3, 0.9, 0.4, -0.5, 0.8, 0.2, 0.7, -0.4, 0.6, 0.3, -0.2, 0.5, 0.4, -0.6, 0.9, 0.3, 0.2, -0.3, 0.6, 0.5, -0.4, 0.7, 0.2, 0.4, -0.2, 0.6, 0.3, 0.5, 0.42];
      full.push(100); fullR.push(100);
      steps.forEach(function (s) { v = +(v + s).toFixed(2); r = +(r + s * 0.82).toFixed(2); full.push(v); fullR.push(r); });
      return {
        ok: true, demo: true, caliber: 'full', window_kind: 'since_inception', days: 30,
        window_sgt: ['2026-01-01', '2026-01-31'],
        ret_mtm_pct: +(v - 100).toFixed(2), ret_realized_pct: +(r - 100).toFixed(2),
        max_dd_pct: -3.21, max_dd_realized_pct: -2.45,
        curve: series(END - 30 * DAY, DAY, full),
        curve_realized: series(END - 30 * DAY, DAY, fullR),
        recent_trades: TRADES, ledger_updated_sgt: '2026-01-31 08:00'
      };
    }
    return {
      ok: true, demo: true, caliber: 'real7d', days: 7,
      window_sgt: ['2026-01-24', '2026-01-31'],
      ret_mtm_pct: 3.21, ret_realized_pct: 2.45, max_dd_pct: -1.23, max_dd_realized_pct: -0.98,
      curve: series(END - 7 * DAY, DAY, [100, 100.6, 101.1, 100.8, 101.9, 102.4, 102.1, 103.21]),
      curve_realized: series(END - 7 * DAY, DAY, [100, 100.4, 100.9, 100.9, 101.6, 101.9, 102.0, 102.45]),
      recent_trades: TRADES, ledger_updated_sgt: '2026-01-31 08:00'
    };
  }

  function h02() {
    var hist = [10000, 10120, 10250, 10180, 10420, 10600, 10520, 10850, 11050, 10920, 11200, 11350, 11150, 11500, 11680, 11540, 11800, 11950, 11820, 12050, 11900, 11760, 11930, 11860];
    var t0 = NOW_S - 23 * 3600;
    return {
      ok: true, demo: true, code: 'MP-DEMO', name_mask: '演**（演示数据）', status: 'active', exchange: 'binance',
      credit: 120, arrears: 0, accrued: 558, accrued_mtm: 612, settlement_deduct: 558,
      min_amount: 50, channel_ready: true,
      principal_total: 10000, equity: 11860, profit_total: 1860, profit_pct: 18.6,
      equity_history: hist.map(function (v, i) { return [t0 + i * 3600, v]; }),
      recent_ledger: [
        { t: '01-11', label: '充值到账', amt: '+2,000 U', good: true },
        { t: '01-02', label: '第 1 期分红结算', amt: '-372 U', good: false }
      ],
      min_credit_required: 100, run_gate_ok: true, gate_hint: '门槛已达标，系统自动开跑（演示）',
      tier: 0, tier_label: '演示档', next_settle_ts: NOW_S + 9 * 86400,
      entry_allowed_effective: true, entry_block_reasons: [], reminders: [], reminder_slot: null,
      last_credited: null,
      accounts: [{ account_ref: 'demo-1', exchange: 'binance' }], selected_account_ref: 'demo-1'
    };
  }

  function teamUser(name, contact, light, principal, equity, dayPct) {
    var profit = +(equity - principal).toFixed(2);
    var share = +(Math.max(0, profit) * 0.3).toFixed(2);
    return {
      name: name, contact: contact, light: light, status: 'active', stale: false, credit_source: '',
      card: {
        credit_exempt: false, profit_total: profit, principal_total: principal,
        return_chain: { pct: +(profit / principal * 100).toFixed(2) },
        created_ts: NOW_S - 37 * 86400, equity: equity, equity_age_s: 45,
        hwm: Math.max(principal, equity), profit_above_hwm: Math.max(0, profit),
        accrued_share: share, accrued_share_mtm: +(share * 1.05).toFixed(2), settlement_deduct: share, credit: 120
      },
      day_covered_h: 24, volume: 12345.67, month_div: share,
      last_settle_amount: 123.45, last_settle_ts: NOW_S - 12 * 86400, settled_n: 1, settled_total: 123.45,
      day_pct: dayPct, month_pct: +(profit / principal * 100).toFixed(2), principal: principal, credit: 120
    };
  }

  function h03() {
    var users = [
      teamUser('Demo A', '演示联系人 A', 'green', 10000, 11234.56, 0.42),
      teamUser('Demo B', '演示联系人 B', 'green', 5000, 5321.0, 0.18),
      teamUser('Demo C', '演示联系人 C', 'yellow', 3000, 2987.65, -0.12)
    ];
    var principal = 18000, equity = 19543.21, profit = +(equity - principal).toFixed(2);
    return {
      ok: true, role: 'owner', demo: true,
      team: { name: '演示团队', code: 'DEMO01', payout_address: 'TDemoAddressForLayoutOnly0000000' },
      promo_link: 'partner_portal.html?team=DEMO01',
      users: users, yellow: ['Demo C'], red: [],
      overview: {
        users_active: 3, principal: principal, equity: equity, profit: profit,
        profit_pct: +(profit / principal * 100).toFixed(2),
        principal_incomplete: 0, equity_incomplete: 0, profit_incomplete: 0
      },
      operators: [{ id: 'op-demo1', label: '演示操作员 A', last_seen_ts: NOW_S - 3600, revoked_ts: null }],
      commission_settlements: [{ month: '2026-01', share_deduct_total: 1234.56, commission_rate: 0.1234, amount: 152.34, status: 'paid', txid: 'demo-tx-0001', paid_at: NOW_S - 20 * 86400 }],
      month_div_total: 456.78, team_share_est: 56.37, team_share_rate_source: null, team_share_rate: null
    };
  }

  function h04() {
    function row(k, sym, side, entry, mark, upl, roi, notional) {
      return {
        user_key: k, user_masked: '••••' + k, sym: sym, side: side, entry: entry, mark: mark,
        upl_usdt: upl, roi_pct: roi, notional: notional,
        entry_explain: { title: '演示说明', lines: ['这是演示数据，不对应任何真实仓位。'] }
      };
    }
    return {
      ok: true, demo: true, snapshot_ts: NOW_S - 120, stale: false,
      rows: [
        row('7K2Q', 'DEMOAUSDT', '多', 1.2345, 1.2789, 35.97, 3.6, 999.0),
        row('3M8D', 'DEMOBUSDT', '空', 0.4567, 0.4501, 14.45, 1.45, 1000.0),
        row('9P4X', 'DEMOCUSDT', '多', 2.3456, 2.3301, -6.61, -0.66, 1001.0)
      ]
    };
  }

  function route(path, q, body) {
    switch (path) {
      case 's07': return h01(q);
      case 's01': case 's03': return { ok: true, rows: [] };
      case 's02': return { ok: true };
      case 's12': return { ok: true, name: '演示团队', code: q.t || 'DEMO01' };
      case 's11': return { ok: true, client_code: 'MP-DEMO', msg: '演示提交成功（未发送任何数据）' };
      case 's10': return { ok: true, client_code: 'MP-DEMO', msg: '演示：已更换（未发送任何数据）' };
      case 's15': return h02(body);
      case 's13': {
        var amount = Number(body && body.amount) || 100;
        return { ok: true, order_id: 'demo-0001', pay_amount: +(amount + 0.37).toFixed(2), address: 'TDemoAddressForLayoutOnly0000000' };
      }
      case 's17': return { ok: true, status: 'credited', pay_amount: 100.37 };
      case 's16': return { ok: true };
      case 's18': return { ok: true, tier_label: '演示档' };
      case 's09': return { ok: true, codes: [{ code: 'MP-DEMO', exchange: 'binance' }] };
      case 's08': return { ok: true };
      case 's19': return h03();
      case 's21': return h04();
      case 's23': return { ok: true, token: 'DEMO-SESSION', promo_link: 'partner_portal.html?team=DEMO01' };
      case 's22': return { ok: true, token: 'DEMO-SESSION' };
      case 's24': case 's20': return { ok: true };
      case 's06': case 's04': case 's05': case 's14':
        return { ok: false, error: 'demo_only', hint: '演示站不提交任何数据' };
      default: return { ok: false, error: 'demo_only', hint: '演示站：此操作不连接任何服务' };
    }
  }

  window.demoGet = function (input, opts) {
    var url = String(input && input.url ? input.url : input);
    var signal = opts && opts.signal;
    var body = null;
    if (opts && typeof opts.body === 'string') { try { body = JSON.parse(opts.body); } catch (e) { body = null; } }
    var rest = url.replace(/^demo:/, '');
    var qi = rest.indexOf('?');
    var path = (qi < 0 ? rest : rest.slice(0, qi)).replace(/^\/+|\/+$/g, '');
    var q = parseQuery(qi < 0 ? '' : rest.slice(qi + 1));
    console.debug('[demo] local data for', path);
    return new Promise(function (resolve, reject) {
      function abortError() {
        try { return new DOMException('The operation was aborted.', 'AbortError'); } catch (e) { var x = new Error('aborted'); x.name = 'AbortError'; return x; }
      }
      if (signal && signal.aborted) { reject(abortError()); return; }
      var timer = setTimeout(function () { resolve(respond(200, route(path, q, body))); }, 120);
      if (signal && signal.addEventListener) {
        signal.addEventListener('abort', function () { clearTimeout(timer); reject(abortError()); });
      }
    });
  };

  function badge() {
    if (!document.body || document.querySelector('[data-demo-badge]')) return;
    var b = document.createElement('div');
    b.setAttribute('data-demo-badge', '');
    b.textContent = '演示站 · 零接口 · 动态数字均为示例';
    b.style.cssText = 'position:absolute;left:50%;top:6px;transform:translateX(-50%);white-space:nowrap;z-index:2147483647;pointer-events:none;font:12px/1.4 system-ui,-apple-system,"PingFang SC",sans-serif;color:#e2e8f0;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.35);border-radius:999px;padding:5px 10px;';
    document.body.appendChild(b);
  }

  function autoFill() {
    var p = location.pathname;
    if (!/partner_(topup|exit)\.html$/.test(p)) return;
    var q = document.getElementById('q');
    if (q && !q.value) q.value = /exit/.test(p) ? 'DEMO-API-KEY' : 'MP-DEMO';
    if (typeof window.who === 'function') window.who();
  }

  window.addEventListener('DOMContentLoaded', badge);
  window.addEventListener('load', function () { setTimeout(autoFill, 300); });
})();
