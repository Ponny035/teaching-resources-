/* Session 2 — demand, supply, equilibrium, surplus, DWL, elasticity. */
(function () {
  'use strict';
  var clamp = TR.clamp, money = TR.money;
  var f1 = function (v) { return v.toFixed(1); };
  var f2 = function (v) { return v.toFixed(2); };
  /* Explains which curve shifts, and that the legal payer does not change the economic outcome. */
  function payerNote(isTax, side, r) {
    var d = function (x) { return '$' + f1(x); }, txt;
    if (side === 'N') return ' <i>No curve is shifted because nothing says who legally pays the ' + (isTax ? 'tax' : 'subsidy') + '. Choose “to consumers” or “to producers” to see which curve moves — the result is the same either way.</i>';
    if (isTax) txt = side === 'S'
      ? 'The tax is legally on <b>sellers</b>, so the <b>supply</b> curve shifts up: buyers pay the market price ' + d(r.Pc) + ' and sellers keep ' + d(r.Ps) + '.'
      : 'The tax is legally on <b>buyers</b>, so the <b>demand</b> curve shifts down: sellers receive the market price ' + d(r.Ps) + ' and buyers pay that plus the tax, ' + d(r.Pc) + '.';
    else txt = side === 'S'
      ? 'The subsidy goes to <b>sellers</b>, so <b>supply</b> shifts down: buyers pay the market price ' + d(r.Pc) + ' and sellers receive ' + d(r.Ps) + '.'
      : 'The subsidy goes to <b>buyers</b>, so <b>demand</b> shifts up: sellers receive the market price ' + d(r.Ps) + ' and buyers effectively pay ' + d(r.Pc) + '.';
    return ' ' + txt + ' <i>Who is legally taxed makes no difference to the outcome</i>: the same quantity, prices and burden appear either way.';
  }

  /* =====================================================================
     2A — discrete willingness-to-pay staircase
     ===================================================================== */
  var N = 8;
  var W_DEF = [95, 85, 75, 65, 55, 45, 35, 25];
  var C_DEF = [10, 20, 30, 40, 50, 60, 70, 80];
  var wtp = W_DEF.slice(), cost = C_DEF.slice(), price = 52;

  var cA = TR.chart('#chart-a', { xmax: N, ymax: 100, xstep: 1, ystep: 20, xtickLabels: false,
    xlabel: 'Unit (slot k = k-th buyer and k-th seller)', ylabel: 'Price ($)', yfmt: function (v) { return '$' + v; }, aspect: 0.8, maxH: 480 });
  TR.legend('#legend-a', [['demand', 'Demand (buyers’ WTP)'], ['supply', 'Supply (sellers’ costs)'], ['box demand', 'Consumer surplus'], ['box supply', 'Producer surplus'], ['ink dash', 'Price']]);

  function equilibrium() {
    var Q = 0;
    while (Q < N && wtp[Q] >= cost[Q]) Q++;
    var lo = Q > 0 ? cost[Q - 1] : 0, hi = Q > 0 ? wtp[Q - 1] : 100;
    if (Q < N) { lo = Math.max(lo, wtp[Q]); hi = Math.min(hi, cost[Q]); }
    var maxTS = 0;
    for (var k = 0; k < Q; k++) maxTS += wtp[k] - cost[k];
    return { Q: Q, lo: lo, hi: hi, p: Math.round((lo + hi) / 2), maxTS: maxTS };
  }

  cA.render = function (c) {
    var P = price, qd = 0, qs = 0, k;
    for (k = 0; k < N; k++) { if (wtp[k] >= P) qd++; if (cost[k] <= P) qs++; }
    var Q = Math.min(qd, qs), CS = 0, PS = 0;

    for (k = 0; k < N; k++) {
      var b1 = k + 0.08, b2 = k + 0.48, s1 = k + 0.52, s2 = k + 0.92, trade = k < Q;
      c.rect(b1, 0, b2, wtp[k], 'demand' + (trade ? '' : ' faint'));
      c.rect(s1, 0, s2, cost[k], 'supply' + (trade ? '' : ' faint'));
      if (trade) {
        c.rect(b1, P, b2, wtp[k], 'demand strong');
        c.rect(s1, cost[k], s2, P, 'supply strong');
        CS += wtp[k] - P; PS += P - cost[k];
      }
      c.pline([[b1, 0], [b1, wtp[k]], [b2, wtp[k]], [b2, 0]], 'demand thin');
      c.pline([[s1, 0], [s1, cost[k]], [s2, cost[k]], [s2, 0]], 'supply thin');
      c.text(k + 0.5, 0, String(k + 1), 'soft', { dy: 17 });
    }
    var D = [], S = [];
    for (k = 0; k < N; k++) { D.push([k, wtp[k]], [k + 1, wtp[k]]); S.push([k, cost[k]], [k + 1, cost[k]]); }
    c.pline(D, 'demand'); c.pline(S, 'supply');
    c.text(0.56, wtp[0], 'Demand', '', { dy: -8, anchor: 'start' });
    c.text(N - 0.08, cost[N - 1], 'Supply', '', { dy: -24, anchor: 'end' });

    c.line(0, P, N, P, 'ink dash');
    c.text(0.05, P, 'Price $' + P, '', { dy: -8, anchor: 'start' });

    for (k = 0; k < N; k++) { c.handle('w' + k, k + 0.28, wtp[k]); c.handle('s' + k, k + 0.72, cost[k]); }
    c.handle('P', N, P);

    var e = equilibrium(), TS = CS + PS, dwl = e.maxTS - TS;
    TR.stats('#stats-a', [
      ['Buyers willing', qd], ['Sellers willing', qs], ['Units traded', Q, 'key'],
      ['Consumer surplus', money(CS)], ['Producer surplus', money(PS)], ['Total surplus', money(TS)],
      ['Deadweight loss', money(dwl), dwl > 0 ? 'bad' : 'good']
    ]);
    var msg, kind = '';
    if (P > e.hi) { msg = '<b>Surplus:</b> price is above equilibrium. ' + qs + ' sellers want to sell but only ' + qd + ' buyers will pay. Only ' + Q + ' trades happen, so some gains from trade are lost.'; kind = 'warn'; }
    else if (P < e.lo) { msg = '<b>Shortage:</b> price is below equilibrium. ' + qd + ' buyers want to buy but only ' + qs + ' sellers will sell. Only ' + Q + ' trades happen.'; kind = 'warn'; }
    else { msg = '<b>Market clears.</b> Every buyer who values the good above the price buys from a seller whose cost is below it. Equilibrium quantity = ' + e.Q + ' (any price from $' + e.lo + ' to $' + e.hi + ' works).'; kind = 'good'; }
    TR.message('#msg-a', msg, kind);
  };

  var sPriceA = TR.slider('#ctl-a', { label: 'Market price', min: 0, max: 100, step: 1, value: price, fmt: money, onInput: function (v) { price = v; cA.draw(); } });
  cA.onDrag = function (id, x, y) {
    var v = Math.round(clamp(y, 0, 100)), k;
    if (id === 'P') { price = v; sPriceA.set(v); }
    else if (id.charAt(0) === 'w') { k = +id.slice(1); wtp[k] = clamp(v, k < N - 1 ? wtp[k + 1] : 0, k > 0 ? wtp[k - 1] : 100); }
    else { k = +id.slice(1); cost[k] = clamp(v, k > 0 ? cost[k - 1] : 0, k < N - 1 ? cost[k + 1] : 100); }
    cA.draw();
  };
  TR.button('#btn-a', 'Go to equilibrium price', function () { price = equilibrium().p; sPriceA.set(price); cA.draw(); }, 'primary');
  TR.button('#btn-a', 'New random market', function () {
    var rnd = function (lo, hi) { return lo + 5 * Math.floor(Math.random() * ((hi - lo) / 5 + 1)); };
    wtp = []; cost = [];
    for (var i = 0; i < N; i++) { wtp.push(rnd(20, 100)); cost.push(rnd(0, 80)); }
    wtp.sort(function (a, b) { return b - a; }); cost.sort(function (a, b) { return a - b; });
    price = equilibrium().p; sPriceA.set(price); cA.draw();
  });
  TR.button('#btn-a', 'Reset', function () { wtp = W_DEF.slice(); cost = C_DEF.slice(); price = 52; sPriceA.set(price); cA.draw(); });
  cA.draw();

  /* =====================================================================
     2B — linear market with policy
     Demand: P = a - b·Q      Supply: P = c + d·Q
     ===================================================================== */
  var base = { a: 90, b: 1, c: 10, d: 1 };
  var M = Object.assign({}, base);
  var mode = 'none', pv = { ceiling: 35, floor: 65, tax: 20, subsidy: 15 }, payerB = 'N';   // payerB: 'N' net effect only, 'S' sellers (shifts supply), 'D' buyers (shifts demand)
  var snap = null;

  var cB = TR.chart('#chart-b', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: function (v) { return '$' + v; }, aspect: 0.82, maxH: 520 });
  TR.legend('#legend-b', [['demand', 'Demand'], ['supply', 'Supply'], ['ghost', 'Starting curves'], ['supply dash', 'Supply after tax / subsidy (on sellers)'], ['demand dash', 'Demand after tax / subsidy (on buyers)'], ['box demand', 'Consumer surplus'], ['box supply', 'Producer surplus'], ['box gold', 'Tax revenue / subsidy cost'], ['box red', 'Deadweight loss']]);

  function eqOf(m) {
    var Q = Math.max(0, (m.a - m.c) / (m.b + m.d));
    return { Q: Q, P: m.a - m.b * Q };
  }
  function solve(m, md, v) {
    var a = m.a, b = m.b, c = m.c, d = m.d, e = eqOf(m);
    var r = { Qe: e.Q, Pe: e.P, Q: e.Q, Pc: e.P, Ps: e.P, G: 0, gap: 0, gapKind: '' };
    if (md === 'ceiling' && v < e.P) {
      r.Q = Math.max(0, (v - c) / d); r.Pc = v; r.Ps = v;
      r.gap = Math.max(0, (a - v) / b) - r.Q; r.gapKind = 'Shortage';
    } else if (md === 'floor' && v > e.P) {
      r.Q = Math.max(0, (a - v) / b); r.Pc = v; r.Ps = v;
      r.gap = Math.max(0, (v - c) / d) - r.Q; r.gapKind = 'Surplus (unsold)';
    } else if (md === 'tax') {
      r.Q = Math.max(0, (a - c - v) / (b + d)); r.Pc = a - b * r.Q; r.Ps = r.Pc - v; r.G = v * r.Q;
    } else if (md === 'subsidy') {
      r.Q = Math.max(0, (a - c + v) / (b + d)); r.Pc = a - b * r.Q; r.Ps = r.Pc + v; r.G = -v * r.Q;   // G < 0: taxpayers pay
    }
    r.CS = a * r.Q - b * r.Q * r.Q / 2 - r.Pc * r.Q;
    r.PS = r.Ps * r.Q - c * r.Q - d * r.Q * r.Q / 2;
    r.TS0 = e.Q > 0 ? (a - c) * e.Q / 2 : 0;
    r.DWL = Math.max(0, r.TS0 - (r.CS + r.PS + r.G));
    return r;
  }
  function describe() {
    var e0 = eqOf(base), e1 = eqOf(M), P0 = e0.P, out = [];
    var qd = function (m) { return Math.max(0, (m.a - P0) / m.b); };
    var qs = function (m) { return Math.max(0, (P0 - m.c) / m.d); };
    var dD = qd(M) - qd(base), dS = qs(M) - qs(base);
    if (Math.abs(M.b - base.b) > 0.01) out.push('Demand became <b>' + (M.b > base.b ? 'steeper' : 'flatter') + '</b> (buyers ' + (M.b > base.b ? 'less' : 'more') + ' responsive to price).');
    else if (Math.abs(dD) > 0.5) out.push('Demand <b>shifted ' + (dD > 0 ? 'right' : 'left') + '</b> (' + (dD > 0 ? '+' : '') + f1(dD) + ' units demanded at the old price).');
    if (Math.abs(M.d - base.d) > 0.01) out.push('Supply became <b>' + (M.d > base.d ? 'steeper' : 'flatter') + '</b>.');
    else if (Math.abs(dS) > 0.5) out.push('Supply <b>shifted ' + (dS > 0 ? 'right' : 'left') + '</b> (' + (dS > 0 ? '+' : '') + f1(dS) + ' units supplied at the old price).');
    if (!out.length) return 'Drag a curve (or use the sliders) to see what changes. Equilibrium is at Q = ' + f1(e1.Q) + ', P = $' + f1(e1.P) + '.';
    var dq = e1.Q - e0.Q, dp = e1.P - e0.P;
    var arrow = function (x, u) { return Math.abs(x) < 0.05 ? 'unchanged' : (x > 0 ? '↑ ' : '↓ ') + f1(Math.abs(x)) + u; };
    out.push('New equilibrium: price ' + arrow(dp, '') + ', quantity ' + arrow(dq, '') + '. That is a <b>movement along</b> the curve that didn’t shift.');
    return out.join(' ');
  }

  cB.render = function (c) {
    var a = M.a, b = M.b, cc = M.c, d = M.d, XM = 120;
    var D = function (q) { return a - b * q; }, S = function (q) { return cc + d * q; };
    var r = solve(M, mode, pv[mode]);
    var changed = base.a !== M.a || base.b !== M.b || base.c !== M.c || base.d !== M.d;

    if (a > cc) {
      c.poly([[0, a], [r.Q, D(r.Q)], [r.Q, r.Pc], [0, r.Pc]], 'demand');
      c.poly([[0, r.Ps], [r.Q, r.Ps], [r.Q, S(r.Q)], [0, cc]], 'supply');
      if (mode === 'tax' && r.G > 0) c.rect(0, r.Ps, r.Q, r.Pc, 'gold');
      if (mode === 'subsidy' && r.G < 0) c.rect(0, r.Pc, r.Q, r.Ps, 'gold');
      if (Math.abs(r.Qe - r.Q) > 0.05) c.poly([[r.Q, S(r.Q)], [r.Q, D(r.Q)], [r.Qe, r.Pe]], 'red');
    }
    if (changed) {
      c.line(0, base.a, XM, base.a - base.b * XM, 'ghost');
      c.line(0, base.c, XM, base.c + base.d * XM, 'ghost');
    }
    c.line(0, a, XM, D(XM), 'demand', { drag: 'D' });
    c.line(0, cc, XM, S(XM), 'supply', { drag: 'S' });
    if ((mode === 'tax' || mode === 'subsidy') && pv[mode] > 0.05) {          // the curve of the taxed / subsidised side shifts
      var sgB = mode === 'tax' ? 1 : -1, vB = pv[mode];
      if (payerB === 'S') c.line(0, cc + sgB * vB, XM, cc + sgB * vB + d * XM, 'supply dash thin');
      else if (payerB === 'D') c.line(0, a - sgB * vB, XM, a - sgB * vB - b * XM, 'demand dash thin');
    }

    /* curve labels */
    var dx = Math.min(112, (a - 22) / b), sx = Math.min(112, (108 - cc) / d);
    c.text(Math.max(dx, 4), D(Math.max(dx, 4)), 'Demand', 'big', { dy: 18, dx: 4, anchor: 'start' });
    c.text(Math.max(sx, 4), S(Math.max(sx, 4)), 'Supply', 'big', { dy: -10, dx: -4, anchor: 'end' });

    /* policy line */
    if (mode === 'ceiling') { c.line(0, pv.ceiling, XM, pv.ceiling, 'red dash'); c.text(XM, pv.ceiling, 'Price ceiling', 'soft', { anchor: 'end', dy: -7 }); }
    if (mode === 'floor') { c.line(0, pv.floor, XM, pv.floor, 'red dash'); c.text(XM, pv.floor, 'Price floor', 'soft', { anchor: 'end', dy: -7 }); }

    if (a > cc) {
      var q3 = r.Q * 0.3;
      if (r.Q > 8) {
        c.text(q3, (r.Pc + D(q3)) / 2, 'CS', 'big');
        c.text(q3, Math.max(cc, (r.Ps + S(q3)) / 2), 'PS', 'big');
      }
      if (mode === 'tax' && r.G > 0 && (r.Pc - r.Ps) > 8) c.text(r.Q / 2, (r.Pc + r.Ps) / 2, 'Tax revenue', '');
      if (mode === 'subsidy' && r.G < 0 && (r.Ps - r.Pc) > 8) c.text(r.Q / 2, (r.Pc + r.Ps) / 2, 'Subsidy cost', '');
      if (r.DWL > 25) c.text(r.Q + (r.Qe - r.Q) * 0.4, (D(r.Q) + S(r.Q)) / 2 + (r.Pe - (D(r.Q) + S(r.Q)) / 2) * 0.1, 'DWL', 'big', { dx: 2 });
      c.dot(r.Qe, r.Pe, mode === 'none' ? 'ink' : 'hollow', 6);
      if (mode === 'none') { c.drop(r.Qe, r.Pe, 'Q*=' + f1(r.Qe), 'P*=$' + f1(r.Pe)); }
      else {
        c.dot(r.Q, D(r.Q), 'demand', 5); c.dot(r.Q, S(r.Q), 'supply', 5);
        c.line(r.Q, D(r.Q), r.Q, 0, 'drop'); c.text(r.Q, 0, 'Q=' + f1(r.Q), 'soft', { dy: -7 });
        if (mode === 'tax' || mode === 'subsidy') {          // new equilibrium: demand meets supply-after-policy
          c.text(r.Qe, r.Pe, 'Original E* ' + money(r.Pe, 1), 'soft', { dx: mode === 'tax' ? 10 : -10, dy: mode === 'tax' ? -12 : 20, anchor: mode === 'tax' ? 'start' : 'end' });
          if (payerB !== 'N') {
            c.dot(r.Q, payerB === 'S' ? r.Pc : r.Ps, 'ink', 6.5);
            c.text(r.Q, payerB === 'S' ? r.Pc : r.Ps, 'New E* ' + money(payerB === 'S' ? r.Pc : r.Ps, 1), '', { anchor: 'start', dx: 10, dy: mode === 'tax' ? -10 : 18 });
          }
        }
      }
    }

    /* grab handles */
    var qh = clamp(0.25 * a / b, 6, 100); c.handle('D', qh, D(qh));
    var qs2 = clamp(0.55 * (120 - cc) / d, 10, 100); c.handle('S', qs2, S(qs2));

    /* readouts */
    var rows = [['Equil. price P*', money(r.Pe, 1)], ['Equil. quantity Q*', f1(r.Qe)]];
    if (mode !== 'none') {
      rows.push(['Quantity traded', f1(r.Q), 'key']);
      if (mode === 'tax') rows.push(['Buyers pay', money(r.Pc, 1)], ['Sellers keep', money(r.Ps, 1)], ['Tax revenue', money(r.G)]);
      else if (mode === 'subsidy') rows.push(['Buyers pay', money(r.Pc, 1)], ['Sellers receive', money(r.Ps, 1)], ['Subsidy cost', money(-r.G)]);
      else rows.push(['Price', money(r.Pc, 1)]);
      if (r.gap > 0.05) rows.push([r.gapKind, f1(r.gap) + ' units', 'bad']);
    }
    rows.push(['Consumer surplus', money(r.CS)], ['Producer surplus', money(r.PS)], ['Deadweight loss', money(r.DWL), r.DWL > 0.5 ? 'bad' : 'good']);
    var pq = r.Qe > 0 ? r.Pe / r.Qe : 0;
    rows.push(['Elasticity |ε| demand / supply', f2(pq / b) + ' / ' + f2(pq / d)]);
    TR.stats('#stats-b', rows);

    var extra = '';
    if (a <= cc) extra = ' <b>Demand is below supply everywhere — no trade!</b>';
    else if (mode === 'ceiling') extra = pv.ceiling >= r.Pe ? ' The ceiling is above equilibrium, so it isn’t binding.' : ' The ceiling is binding: sellers offer fewer units, buyers want more → shortage. (We assume those who value the good most get it; otherwise the loss is even bigger.)';
    else if (mode === 'floor') extra = pv.floor <= r.Pe ? ' The floor is below equilibrium, so it isn’t binding.' : ' The floor is binding: buyers cut back, sellers can’t sell all they’d like → surplus.';
    else if (mode === 'subsidy') extra = ' The subsidy of $' + pv.subsidy + ' per unit pushes quantity above the equilibrium. Buyers’ price falls by $' + f1(r.Pe - r.Pc) + ' and sellers gain $' + f1(r.Ps - r.Pe) + '. Taxpayers pay $' + f1(-r.G) + ' — more than the gain to buyers and sellers, so the surplus is “added” but not for free: the excess is deadweight loss.';
    else if (mode === 'tax') extra = ' The tax drives a wedge of $' + pv.tax + ' between what buyers pay and sellers keep. Buyers bear $' + f1(r.Pc - r.Pe) + ' and sellers $' + f1(r.Pe - r.Ps) + ' of it.';
    if ((mode === 'tax' || mode === 'subsidy') && a > cc) extra += payerNote(mode === 'tax', payerB, r);
    TR.message('#msg-b', describe() + extra, r.DWL > 0.5 ? 'bad' : '');
    renderSplit(r);
  };

  /* Where does the original total surplus (TS0) end up? CS + PS + Gov + DWL = TS0.
     Gov is negative for a subsidy (taxpayers pay), so CS + PS can exceed TS0. */
  function renderSplit(r, hostId) {
    var host = document.getElementById(hostId || 'split-b');
    if (!(r.TS0 > 0)) { host.innerHTML = ''; return; }
    var pc = function (v) { return 100 * v / r.TS0; };
    var cs = pc(r.CS), ps = pc(r.PS), g = pc(r.G), dl = pc(r.DWL);
    var segs = [['cs', 'Consumers', cs], ['ps', 'Producers', ps]];
    if (g > 0.05) segs.push(['gov', 'Government (tax revenue)', g]);
    if (g <= 0.05 && dl > 0.05 && g > -0.05) segs.push(['dwl', 'Deadweight loss', dl]);
    if (g > 0.05 && dl > 0.05) segs.push(['dwl', 'Deadweight loss', dl]);
    var total = segs.reduce(function (t, s) { return t + s[2]; }, 0), scale = Math.max(100, total);
    var sgn = function (v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(0) + '%'; };
    var html = '<p class="ctl-title" style="margin:0 0 6px">Where does the surplus go? (share of the original total)</p>' +
      '<div class="split-wrap"><div class="split-bar">' +
      segs.map(function (s) { return '<i class="' + s[0] + '" style="width:' + (100 * s[2] / scale) + '%" title="' + s[1] + '"></i>'; }).join('') +
      '</div>' + (scale > 100.5 ? '<span class="split-mark" style="left:' + (100 / scale * 100) + '%" title="100% = original surplus"></span>' : '') + '</div>' +
      '<ul class="split-list">' +
      '<li><i class="sw box demand"></i>Consumers <b>' + sgn(cs) + '</b></li>' +
      '<li><i class="sw box supply"></i>Producers <b>' + sgn(ps) + '</b></li>';
    if (Math.abs(g) > 0.05) html += '<li><i class="sw box gold"></i>' + (g > 0 ? 'Government collects' : 'Taxpayers pay (subsidy)') + ' <b>' + sgn(g) + '</b></li>';
    html += '<li><i class="sw box red"></i>Deadweight loss <b>' + (dl > 0.05 ? '−' + dl.toFixed(0) + '%' : '0%') + '</b></li>' +
      '</ul><p class="hint">' + (g < -0.05
        ? 'Consumers and producers gain, but taxpayers pay more than they gain: the dashed line marks the original 100%. Net surplus is 100% − DWL.'
        : 'These four shares always add up to 100% of the surplus you started with.') + '</p>';
    host.innerHTML = html;
  }

  cB.onDragStart = function () { snap = { a: M.a, c: M.c }; };
  cB.onDrag = function (id, x, y, s) {
    var dx = x - s.x, dy = y - s.y;
    if (id === 'D') M.a = clamp(snap.a + dy + M.b * dx, 20, 120);
    else if (id === 'S') M.c = clamp(snap.c + dy - M.d * dx, 0, 100);
    cB.draw();
  };

  var ctlB = document.querySelector('#ctl-b');
  var sB = TR.slider(ctlB, { label: 'Demand steepness', min: 0.4, max: 2.5, step: 0.1, value: M.b, fmt: f1, hint: 'Steeper = buyers care less about price (less elastic).', onInput: function (v) { M.b = v; cB.draw(); } });
  var sD = TR.slider(ctlB, { label: 'Supply steepness', min: 0.4, max: 2.5, step: 0.1, value: M.d, fmt: f1, hint: 'Steeper = sellers can’t easily change output.', onInput: function (v) { M.d = v; cB.draw(); } });
  ctlB.insertAdjacentHTML('beforeend', '<p class="ctl-title">Government policy</p>');
  var sVal, payB;   // assigned below; the seg callback only runs on click
  TR.seg(ctlB, [['none', 'None'], ['ceiling', 'Price ceiling'], ['floor', 'Price floor'], ['tax', 'Per-unit tax'], ['subsidy', 'Per-unit subsidy']], 'none', function (m) {
    mode = m;
    var Pe = eqOf(M).P;
    if (m === 'ceiling') pv.ceiling = Math.round(Pe * 0.7);
    if (m === 'floor') pv.floor = Math.round(Pe * 1.3);
    sVal.hide(m === 'none'); payB.hide(m !== 'tax' && m !== 'subsidy'); if (m === 'tax' || m === 'subsidy') payB.setKind(m === 'tax');
    if (m !== 'none') {
      sVal.setLabel({ ceiling: 'Price ceiling', floor: 'Price floor', tax: 'Tax per unit', subsidy: 'Subsidy per unit' }[m]);
      sVal.setRange(0, (m === 'tax' || m === 'subsidy') ? 80 : 120);
      sVal.set(pv[m]);
    }
    cB.draw();
  });
  sVal = TR.slider(ctlB, { label: 'Price ceiling', min: 0, max: 120, step: 1, value: pv.ceiling, fmt: money, onInput: function (v) { pv[mode] = v; cB.draw(); } });
  sVal.hide(true);
  payB = TR.payer(ctlB, payerB, function (v) { payerB = v; cB.draw(); });
  payB.hide(true);

  TR.button('#btn-b', 'Make this the new baseline', function () { base = Object.assign({}, M); cB.draw(); }, 'primary');
  TR.button('#btn-b', 'Reset curves', function () {
    M = Object.assign({}, { a: 90, b: 1, c: 10, d: 1 }); base = Object.assign({}, M);
    sB.set(M.b); sD.set(M.d); cB.draw();
  });
  cB.draw();

  /* =====================================================================
     2C — taxes & subsidies: who bears them, who gets the surplus
     Uses solve() from 2B. Signed slider: t > 0 tax, t < 0 subsidy.
     "Substitutes" sliders set steepness: b = 2.5 / k  (more substitutes → flatter curve).
     ===================================================================== */
  var T = { a: 90, kb: 2.5, c: 10, kd: 2.5, t: 20 }, snapT = null;
  var PB = true;          // price breakdown: show what buyers pay vs what sellers receive
  var payerT = 'N';       // 'N' net effect only, 'S' sellers (shifts supply), 'D' buyers (shifts demand)
  var cT = TR.chart('#chart-t', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: function (v) { return '$' + v; }, aspect: 0.82, maxH: 520 });
  TR.legend('#legend-t', [['demand', 'Demand'], ['supply', 'Supply'], ['supply dash', 'Supply after tax / subsidy (on sellers)'], ['demand dash', 'Demand after tax / subsidy (on buyers)'], ['box demand', 'Consumer surplus'], ['box supply', 'Producer surplus'], ['box gold', 'Tax revenue / subsidy cost'], ['box red', 'Deadweight loss']]);
  function tCurves() { return { a: T.a, b: 2.5 / T.kb, c: T.c, d: 2.5 / T.kd }; }

  cT.render = function (c) {
    var m = tCurves(), a = m.a, b = m.b, cc = m.c, d = m.d, t = T.t, XM = 120;
    var D = function (q) { return a - b * q; }, S = function (q) { return cc + d * q; };
    var isTax = t >= 0, v = Math.abs(t), r = solve(m, v < 0.05 ? 'none' : (isTax ? 'tax' : 'subsidy'), v);
    if (typeof payT !== 'undefined' && payT) payT.setKind(isTax);

    if (a > cc) {
      c.poly([[0, a], [r.Q, D(r.Q)], [r.Q, r.Pc], [0, r.Pc]], 'demand');
      c.poly([[0, r.Ps], [r.Q, r.Ps], [r.Q, S(r.Q)], [0, cc]], 'supply');
      if (v >= 0.05) {
        var wlo = Math.min(r.Pc, r.Ps), whi = Math.max(r.Pc, r.Ps);
        if (PB) {          // split the wedge at the original price: lower part / upper part belong to different sides
          c.rect(0, wlo, r.Q, r.Pe, isTax ? 'supply strong' : 'demand strong');
          c.rect(0, r.Pe, r.Q, whi, isTax ? 'demand strong' : 'supply strong');
        } else c.rect(0, wlo, r.Q, whi, 'gold');
      }
      if (Math.abs(r.Qe - r.Q) > 0.05) c.poly([[r.Q, S(r.Q)], [r.Q, D(r.Q)], [r.Qe, r.Pe]], 'red');
    }
    c.line(0, a, XM, D(XM), 'demand', { drag: 'D' });
    c.line(0, cc, XM, S(XM), 'supply', { drag: 'S' });
    if (v >= 0.05) {          // the taxed / subsidised side's curve shifts (tax: S up or D down; subsidy: S down or D up)
      if (payerT === 'S') c.line(0, cc + t, XM, cc + t + d * XM, 'supply dash thin');
      else if (payerT === 'D') c.line(0, a - t, XM, a - t - b * XM, 'demand dash thin');
    }

    var dx = Math.min(112, (a - 22) / b), sx = Math.min(112, (108 - cc) / d);
    c.text(Math.max(dx, 4), D(Math.max(dx, 4)), 'Demand', 'big', { dy: 18, dx: 4, anchor: 'start' });
    c.text(Math.max(sx, 4), S(Math.max(sx, 4)), 'Supply', 'big', { dy: -10, dx: -4, anchor: 'end' });

    if (a > cc) {
      var q3 = r.Q * 0.3;
      if (r.Q > 8) {
        c.text(q3, (Math.max(r.Pc, r.Ps) + D(q3)) / 2, 'CS', 'big');           // keep labels outside the tax / subsidy wedge
        c.text(q3, Math.max(cc, (Math.min(r.Pc, r.Ps) + S(q3)) / 2), 'PS', 'big');
      }
      if (!PB && v >= 0.05 && Math.abs(r.Pc - r.Ps) > 8) c.text(r.Q / 2, (r.Pc + r.Ps) / 2, isTax ? 'Tax revenue' : 'Subsidy cost', '');
      if (PB && v >= 0.05) {
        var top = Math.max(r.Pc, r.Ps), bot = Math.min(r.Pc, r.Ps), buyerTop = r.Pc >= r.Ps;
        c.line(0, r.Pc, r.Q, r.Pc, 'demand dash thin'); c.line(0, r.Ps, r.Q, r.Ps, 'supply dash thin'); c.line(0, r.Pe, r.Q, r.Pe, 'ink dash thin');
        var pm = function (v) { return '$' + TR.fmt(v); }, dd = function (v) { var d = v - r.Pe; return ' (' + (d >= 0 ? '+' : '−') + pm(Math.abs(d)) + ')'; };
        c.text(0, r.Pc, 'Buyers pay ' + pm(r.Pc) + dd(r.Pc), '', { anchor: 'start', dx: 6, dy: buyerTop ? -7 : 16 });
        c.text(0, r.Ps, 'Sellers get ' + pm(r.Ps) + dd(r.Ps), '', { anchor: 'start', dx: 6, dy: buyerTop ? 16 : -7 });
      }
      if (r.DWL > 25) c.text(r.Q + (r.Qe - r.Q) * 0.4, (D(r.Q) + S(r.Q)) / 2, 'DWL', 'big', { dx: 2 });
      c.dot(r.Qe, r.Pe, 'hollow', 6);
      c.text(r.Qe, r.Pe, 'Original E* ' + money(r.Pe, 1), 'soft', { dx: isTax ? 10 : -10, dy: isTax ? -12 : 20, anchor: isTax ? 'start' : 'end' });
      if (v >= 0.05) {
        c.dot(r.Q, D(r.Q), 'demand', 5); c.dot(r.Q, S(r.Q), 'supply', 5);
        c.line(r.Q, D(r.Q), r.Q, 0, 'drop'); c.text(r.Q, 0, 'Q=' + f1(r.Q), 'soft', { dy: -7 });
        if (payerT !== 'N') {                              // new equilibrium E*: the shifted curve meets the other curve
          var qy = payerT === 'S' ? r.Pc : r.Ps;
          c.dot(r.Q, qy, 'ink', 6.5);
          c.text(r.Q, qy, 'New E* ' + money(qy, 1), '', { anchor: 'start', dx: 12, dy: (isTax === (payerT === 'S')) ? -22 : 20 });
        }
      }
    }
    var qh = clamp(0.25 * a / b, 6, 100); c.handle('D', qh, D(qh));
    var qs2 = clamp(0.55 * (120 - cc) / d, 10, 100); c.handle('S', qs2, S(qs2));

    var buyer = isTax ? r.Pc - r.Pe : r.Pe - r.Pc, seller = isTax ? r.Pe - r.Ps : r.Ps - r.Pe;
    var bShare = v > 0.05 ? Math.round(100 * buyer / v) : 0;
    var rows = [['Original E*', 'P ' + money(r.Pe, 1) + ' · Q ' + f1(r.Qe)]];
    if (v >= 0.05) rows.push(payerT === 'N' ? ['New quantity', f1(r.Q) + ' (was ' + f1(r.Qe) + ')', 'key'] : ['New E* (market price)', 'P ' + money(payerT === 'S' ? r.Pc : r.Ps, 1) + ' · Q ' + f1(r.Q), 'key']);
    rows.push(['Buyers pay', money(r.Pc, 1)], ['Sellers receive', money(r.Ps, 1)]);
    if (v >= 0.05) rows.push([isTax ? 'Buyers bear' : 'Buyers gain', bShare + '% ($' + f1(buyer) + ')'], [isTax ? 'Sellers bear' : 'Sellers gain', (100 - bShare) + '% ($' + f1(seller) + ')'],
      [isTax ? 'Tax revenue' : 'Subsidy cost', money(Math.abs(r.G))]);
    rows.push(['Deadweight loss', money(r.DWL), r.DWL > 0.5 ? 'bad' : 'good']);
    TR.stats('#stats-t', rows);

    var msg, kind = '';
    if (a <= cc) msg = '<b>Demand is below supply everywhere — no trade.</b>';
    else if (v < 0.05) msg = 'No tax or subsidy: equilibrium at Q = ' + f1(r.Qe) + ', P = $' + f1(r.Pe) + '. Slide the tax to the right (or a subsidy to the left).';
    else {
      var lead = payerT === 'N'
        ? 'Net effect: buyers pay <b>' + money(r.Pc, 1) + '</b> and sellers receive <b>' + money(r.Ps, 1) + '</b> (original price ' + money(r.Pe, 1) + ') at quantity ' + f1(r.Q) + '. '
        : 'The <b>new equilibrium (market) price</b> is ' + money(payerT === 'S' ? r.Pc : r.Ps, 1) + ' (E* was ' + money(r.Pe, 1) + ') at quantity ' + f1(r.Q) + '. ';
      var who = Math.abs(b - d) < 0.01 ? 'The burden is split <b>equally</b>' : 'The burden falls mostly on <b>' + (b > d ? 'buyers</b> (steeper demand, fewer substitutes)' : 'sellers</b> (steeper supply, fewer alternatives)');
      if (isTax) {
        msg = lead + 'The tax of $' + f1(v) + ' per unit cuts quantity by ' + f1(r.Qe - r.Q) + '. Buyers <b>substitute</b> away from the pricier good. ' + who + ': buyers bear ' + bShare + '%, sellers ' + (100 - bShare) + '%. ' +
          'Government collects <b>' + money(r.G) + '</b>; the trades that vanish are the <b>deadweight loss</b> (' + money(r.DWL) + ').';
      } else {
        msg = lead + 'The subsidy of $' + f1(v) + ' per unit raises quantity by ' + f1(r.Q - r.Qe) + '. Buyers get ' + bShare + '% of the benefit and sellers ' + (100 - bShare) + '% (the side with the <b>steeper</b> curve gains more). Taxpayers pay <b>' + money(-r.G) + '</b>, more than the gain to buyers and sellers: the extra units cost more to produce than buyers value them — <b>deadweight loss</b> ' + money(r.DWL) + '.';
      }
      msg += payerNote(isTax, payerT, r);
      kind = r.DWL > 0.5 ? 'warn' : '';
    }
    TR.message('#msg-t', msg, kind);
    renderPriceBreak(r, isTax, v);
    renderSplit(r, 'split-t');
  };
  /* Price breakdown: what the buyer pays vs what the seller receives, compared with the original price. */
  function renderPriceBreak(r, isTax, v) {
    var host = document.getElementById('price-t');
    if (!PB || v < 0.05 || !(r.Q > 0)) { host.innerHTML = ''; return; }
    var mx = Math.max(r.Pc, r.Ps, r.Pe), w = function (x) { return (100 * x / mx).toFixed(2) + '%'; };
    var mark = '<span class="pbar-mark" style="left:' + w(r.Pe) + '" title="original price"></span>';
    var seg = function (cls, val, tip) { return '<i class="' + cls + '" style="width:' + w(val) + '" title="' + tip + '"></i>'; };
    var consBar = isTax ? seg('ps', r.Ps, 'kept by the seller') + seg('gov', v, 'tax to government') : seg('cs', r.Pc, 'paid by the buyer');
    var prodBar = isTax ? seg('ps', r.Ps, 'kept by the seller') : seg('cs', r.Pc, 'paid by the buyer') + seg('gov', v, 'subsidy from taxpayers');
    var dl = function (val) { var d = val - r.Pe; return (d >= 0 ? '+' : '−') + money(Math.abs(d), 1) + ' vs original'; };
    var html = '<p class="ctl-title" style="margin:0 0 8px">Price breakdown</p>' +
      '<div class="pbar-row"><span>Consumer pays</span><div class="pbar-wrap"><div class="pbar">' + consBar + '</div>' + mark + '</div><b>' + money(r.Pc, 1) + '</b></div>' +
      '<div class="pbar-row"><span>Producer receives</span><div class="pbar-wrap"><div class="pbar">' + prodBar + '</div>' + mark + '</div><b>' + money(r.Ps, 1) + '</b></div>' +
      '<ul class="split-list" style="grid-template-columns:1fr">' +
      '<li><i class="sw box ink"></i>Original equilibrium price E* <b>' + money(r.Pe, 1) + '</b></li>' +
      (payerT === 'N' ? '' : '<li><i class="sw box ink"></i>New equilibrium (market) price <b>' + money(payerT === 'S' ? r.Pc : r.Ps, 1) + '</b></li>') +
      '<li><i class="sw box demand"></i>Buyers: <b>' + dl(r.Pc) + '</b></li>' +
      '<li><i class="sw box supply"></i>Sellers: <b>' + dl(r.Ps) + '</b></li>' +
      '<li><i class="sw box gold"></i>' + (isTax ? 'Tax wedge (consumer price − producer price)' : 'Subsidy (producer price − consumer price)') + ' <b>' + money(v, 1) + '</b></li></ul>' +
      '<p class="hint">' + (isTax
        ? 'The buyer pays the producer’s price <b>plus</b> the tax. The dashed line marks the original price ' + money(r.Pe, 1) + '.'
        : 'The seller receives the buyer’s price <b>plus</b> the subsidy, which taxpayers cover. The dashed line marks the original price ' + money(r.Pe, 1) + '.') + '</p>';
    host.innerHTML = html;
  }
  cT.onDragStart = function () { snapT = { a: T.a, c: T.c }; };
  cT.onDrag = function (id, x, y, s) {
    var m = tCurves(), dx = x - s.x, dy = y - s.y;
    if (id === 'D') T.a = clamp(snapT.a + dy + m.b * dx, 30, 120);
    else if (id === 'S') T.c = clamp(snapT.c + dy - m.d * dx, 0, 80);
    cT.draw();
  };
  var ctlT = document.querySelector('#ctl-t');
  var sTax = TR.slider(ctlT, { label: 'Per-unit tax (drag left for a subsidy)', min: -40, max: 60, step: 1, value: T.t,
    fmt: function (v) { return v < 0 ? 'Subsidy $' + Math.abs(v) : v === 0 ? 'None' : 'Tax $' + v; }, onInput: function (v) { T.t = v; cT.draw(); } });
  var subFmt = function (v) { return v <= 1.5 ? 'few' : v >= 4 ? 'many' : 'some'; };
  var sKb = TR.slider(ctlT, { label: 'Buyers’ substitutes', min: 1, max: 5, step: 0.5, value: T.kb, fmt: subFmt, hint: 'Many substitutes → flat demand: buyers switch away easily (elastic).', onInput: function (v) { T.kb = v; cT.draw(); } });
  var sKd = TR.slider(ctlT, { label: 'Sellers’ alternatives', min: 1, max: 5, step: 0.5, value: T.kd, fmt: subFmt, hint: 'Many alternatives (other products to make) → flat supply (elastic).', onInput: function (v) { T.kd = v; cT.draw(); } });
  var payT = TR.payer(ctlT, payerT, function (v) { payerT = v; cT.draw(); });
  ctlT.insertAdjacentHTML('beforeend', '<p class="ctl-title">Chart option</p>');
  var segPB = TR.seg(ctlT, [['on', 'Show buyer & seller price'], ['off', 'Hide']], 'on', function (v) { PB = v === 'on'; cT.draw(); });
  TR.button('#btn-t', 'Reset', function () { T = { a: 90, kb: 2.5, c: 10, kd: 2.5, t: 20 }; sTax.set(20); sKb.set(2.5); sKd.set(2.5); cT.draw(); });
  cT.draw();

  /* =====================================================================
     2D — elasticity on a linear demand curve
     Demand pivots around the point (50, 50): P = (50 + 50·b) − b·Q
     ===================================================================== */
  var E = { b: 1, Q: 50 };
  var LIM = 150;
  var c1 = TR.chart('#chart-c1', { xmax: LIM, ymax: LIM, xstep: 25, ystep: 25, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: function (v) { return '$' + v; }, aspect: 0.9, maxH: 440 });
  var c2 = TR.chart('#chart-c2', { xmax: LIM, ymax: 3000, xstep: 25, ystep: 500, xlabel: 'Quantity', ylabel: 'Total revenue ($)', yfmt: function (v) { return '$' + v; }, aspect: 0.9, maxH: 440 });

  function ePar() { var a = 50 + 50 * E.b; return { a: a, qint: a / E.b }; }
  function elasticity() { var p = ePar(), P = p.a - E.b * E.Q; return (1 / E.b) * (P / E.Q); }

  c1.render = function (c) {
    var p = ePar(), P = p.a - E.b * E.Q, rev = P * E.Q, el = elasticity();
    c.rect(0, 0, E.Q, P, 'gold');
    c.line(0, p.a, p.qint, 0, 'demand', { drag: 'pt' });
    c.dot(p.qint / 2, p.a / 2, 'hollow', 5);
    c.text(p.qint / 2, p.a / 2, 'Unit elastic (|ε| = 1)', 'soft', { dx: 10, dy: -8, anchor: 'start' });
    c.text(p.qint * 0.12, p.a * 0.88, 'Elastic |ε| > 1', 'soft', { anchor: 'start', dx: 8 });
    c.text(p.qint * 0.82, p.a * 0.18, 'Inelastic |ε| < 1', 'soft', { anchor: 'middle', dy: -10 });
    c.text(E.Q / 2, P / 2, 'Revenue', 'big');
    c.drop(E.Q, P, 'Q=' + f1(E.Q), 'P=$' + f1(P));
    c.handle('pt', E.Q, P);
    var kind = Math.abs(el - 1) < 0.03 ? 'Unit elastic' : el > 1 ? 'Elastic' : 'Inelastic';
    TR.stats('#stats-c', [['Price', money(P, 1)], ['Quantity', f1(E.Q)], ['Elasticity |ε|', f2(el), 'key'], ['Revenue P×Q', money(rev)], ['Demand is', kind]]);
    var msg;
    if (Math.abs(el - 1) < 0.03) msg = 'At |ε| = 1 revenue is at its <b>maximum</b>: a small price change is exactly offset by the quantity change.';
    else if (el > 1) msg = '<b>Elastic.</b> A 10% price cut raises quantity by about ' + f1(el * 10) + '%, so revenue <b>rises</b>. A price increase would <b>lower</b> revenue.';
    else msg = '<b>Inelastic.</b> A 10% price cut raises quantity by only about ' + f1(el * 10) + '%, so revenue <b>falls</b>. A price increase would <b>raise</b> revenue.';
    TR.message('#msg-c', msg, el > 1.03 ? 'good' : el < 0.97 ? 'warn' : '');
  };
  c1.onDrag = function (id, x) { E.Q = clamp(x, 2, ePar().qint - 2); c1.draw(); c2.draw(); };

  c2.render = function (c) {
    var p = ePar(), tr = function (q) { return q * (p.a - E.b * q); };
    c.curve(tr, 0, p.qint, 'tr');
    var qm = p.qint / 2;
    c.dot(qm, tr(qm), 'hollow', 5);
    c.text(qm, tr(qm), 'Max revenue (|ε| = 1)', 'soft', { dy: -12 });
    c.text(qm * 0.5, tr(qm * 0.5), 'Elastic', 'soft', { dx: -6, anchor: 'end', dy: -4 });
    c.text(qm * 1.5, tr(qm * 1.5), 'Inelastic', 'soft', { dx: 6, anchor: 'start', dy: -4 });
    c.dot(E.Q, tr(E.Q), 'demand', 7);
    c.drop(E.Q, tr(E.Q), null, null);
  };

  TR.slider('#ctl-c', { label: 'Demand steepness (pivots around Q=50, P=$50)', min: 0.5, max: 2, step: 0.1, value: E.b, fmt: f1, hint: 'Lower = flatter = more elastic at the pivot.',
    onInput: function (v) { E.b = v; E.Q = clamp(E.Q, 2, ePar().qint - 2); c1.draw(); c2.draw(); } });
  c1.draw(); c2.draw();

  /* =====================================================================
     2E — the labour market: wage vs hours, and how technology shifts S and D
     Labour demand: w = a − b·L   (firms' marginal revenue product)      Labour supply: w = c + d·L
     Technology: time-saving tech shifts S right by tS;  productivity tech shifts D right by tD (negative = automation).
     ===================================================================== */
  var LMB = { a: 90, b: 1, c: 10, d: 1 }, LMT = { tS: 0, tD: 0 }, snapLM = null;
  var cLM = TR.chart('#chart-lm', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Labour hired (thousand hours)', ylabel: 'Wage ($ per hour)', yfmt: function (v) { return '$' + v; }, aspect: 0.82, maxH: 520 });
  TR.legend('#legend-lm', [['demand', 'Labour demand (D)'], ['supply', 'Labour supply (S)'], ['ghost', 'Before technology'], ['box demand', 'Employers’ surplus'], ['box supply', 'Workers’ surplus']]);
  function lmEff() { return { a: LMB.a + LMB.b * LMT.tD, b: LMB.b, c: LMB.c - LMB.d * LMT.tS, d: LMB.d }; }
  function lmEq(m) { var L = Math.max(0, (m.a - m.c) / (m.b + m.d)); return { L: L, w: m.a - m.b * L }; }

  cLM.render = function (c) {
    var m = lmEff(), e = lmEq(m), e0 = lmEq(LMB), XM = 120, changed = LMT.tS !== 0 || LMT.tD !== 0;
    var D = function (l) { return m.a - m.b * l; }, S = function (l) { return m.c + m.d * l; };
    if (m.a > m.c) {
      c.poly([[0, e.w], [e.L, e.w], [e.L, S(e.L)], [0, m.c]], 'supply');
      c.poly([[0, m.a], [e.L, D(e.L)], [e.L, e.w], [0, e.w]], 'demand');
    }
    if (changed) { c.line(0, LMB.a, XM, LMB.a - LMB.b * XM, 'ghost'); c.line(0, LMB.c, XM, LMB.c + LMB.d * XM, 'ghost'); }
    c.line(0, m.a, XM, D(XM), 'demand', { drag: 'D' });
    c.line(0, m.c, XM, S(XM), 'supply', { drag: 'S' });
    var dx = Math.min(112, (m.a - 22) / m.b), sx = Math.min(112, (108 - m.c) / m.d);
    c.text(Math.max(dx, 4), D(Math.max(dx, 4)), 'Labour demand', 'big', { dy: 18, dx: 4, anchor: 'start' });
    c.text(Math.max(sx, 4), S(Math.max(sx, 4)), 'Labour supply', 'big', { dy: -10, dx: -4, anchor: 'end' });
    if (m.a > m.c) {
      if (e.L > 8) { c.text(e.L * 0.3, (e.w + D(e.L * 0.3)) / 2, 'Employers', 'big'); c.text(e.L * 0.3, Math.max(m.c, (e.w + S(e.L * 0.3)) / 2), 'Workers', 'big'); }
      if (changed) { c.dot(e0.L, e0.w, 'hollow', 6); c.text(e0.L, e0.w, 'Before', 'soft', { dx: -10, dy: 18, anchor: 'end' }); }
      c.dot(e.L, e.w, 'ink', 6.5); c.drop(e.L, e.w, 'L=' + f1(e.L), 'w=$' + f1(e.w));
    }
    var qh = clamp(0.25 * m.a / m.b, 6, 100); c.handle('D', qh, D(qh));
    var qs = clamp(0.55 * (120 - m.c) / m.d, 10, 100); c.handle('S', qs, S(qs));

    var dW = e.w - e0.w, dL = e.L - e0.L, sg = function (v) { return (v >= 0 ? '+' : '−') + '$' + Math.abs(v).toFixed(1); };
    var WS = e.w * e.L - m.c * e.L - m.d * e.L * e.L / 2, ES = m.a * e.L - m.b * e.L * e.L / 2 - e.w * e.L;
    TR.stats('#stats-lm', [
      ['Wage', money(e.w, 1), 'key'], ['Employment', f1(e.L) + ' k hours', 'key'],
      ['Wage change', changed ? sg(dW) : '—', dW < -0.05 ? 'bad' : dW > 0.05 ? 'good' : ''],
      ['Employment change', changed ? (dL >= 0 ? '+' : '−') + f1(Math.abs(dL)) : '—', dL < -0.05 ? 'bad' : dL > 0.05 ? 'good' : ''],
      ['Workers’ surplus', money(WS)], ['Employers’ surplus', money(ES)]
    ]);

    var parts = [];
    if (LMT.tS !== 0) parts.push('<b>Time-saving technology</b> (' + (LMT.tS > 0 ? 'appliances, delivery, remote work' : 'less usable time') + ') ' + (LMT.tS > 0 ? 'lets people offer more hours at every wage, so <b>supply shifts right</b>' : 'shifts supply left') + '.');
    if (LMT.tD !== 0) parts.push('<b>' + (LMT.tD > 0 ? 'Productivity technology' : 'Automation that replaces labour') + '</b> ' + (LMT.tD > 0 ? 'makes each hour worth more to firms, so <b>demand shifts right</b>' : 'makes each hour worth less to firms, so <b>demand shifts left</b>') + '.');
    var msg;
    if (m.a <= m.c) msg = '<b>Labour demand is below supply everywhere — no jobs at any wage.</b>';
    else if (!changed) msg = 'Drag a curve, or use the technology sliders, to see how the wage and employment change. Equilibrium: wage $' + f1(e.w) + ', ' + f1(e.L) + ' thousand hours.';
    else {
      var why = '';
      if (LMT.tS !== 0 && LMT.tD === 0) why = ' A supply shift moves the market <i>along</i> the demand curve: the wage and employment move in <b>opposite</b> directions.';
      else if (LMT.tD !== 0 && LMT.tS === 0) why = ' A demand shift moves the market <i>along</i> the supply curve: the wage and employment move in the <b>same</b> direction.';
      else why = ' Both curves moved, so employment’s direction is clear but the wage depends on which shift is bigger.';
      msg = parts.join(' ') + ' New equilibrium: wage ' + money(e.w, 1) + ' (' + sg(dW) + '), employment ' + f1(e.L) + ' thousand hours (' + (dL >= 0 ? '+' : '−') + f1(Math.abs(dL)) + ').' + why;
    }
    TR.message('#msg-lm', msg, dW < -0.05 && dL < -0.05 ? 'bad' : '');
  };
  cLM.onDragStart = function () { snapLM = { a: LMB.a, c: LMB.c }; };
  cLM.onDrag = function (id, x, y, sp) {
    var dx = x - sp.x, dy = y - sp.y;
    if (id === 'D') LMB.a = clamp(snapLM.a + dy + LMB.b * dx, 30, 120);
    else if (id === 'S') LMB.c = clamp(snapLM.c + dy - LMB.d * dx, 0, 100);
    cLM.draw();
  };
  var ctlLM = document.querySelector('#ctl-lm');
  var sTS = TR.slider(ctlLM, { label: 'Time-saving technology (shifts supply)', min: -20, max: 40, step: 1, value: 0, fmt: function (v) { return v === 0 ? 'none' : (v > 0 ? '+' : '−') + Math.abs(v) + ' k hours'; }, hint: 'More usable time at home / cheaper commuting: supply shifts right by this many hours at every wage.', onInput: function (v) { LMT.tS = v; cLM.draw(); } });
  var sTD = TR.slider(ctlLM, { label: 'Productivity technology (shifts demand)', min: -30, max: 40, step: 1, value: 0, fmt: function (v) { return v === 0 ? 'none' : (v > 0 ? '+' : '−') + Math.abs(v) + ' k hours'; }, hint: 'Negative = automation that replaces labour: demand shifts left.', onInput: function (v) { LMT.tD = v; cLM.draw(); } });
  TR.slider(ctlLM, { label: 'Supply steepness', min: 0.4, max: 2.5, step: 0.1, value: LMB.d, fmt: f1, hint: 'Steeper = hours respond little to the wage (like a backward-bending or inelastic supply).', onInput: function (v) { LMB.d = v; cLM.draw(); } });
  TR.slider(ctlLM, { label: 'Demand steepness', min: 0.4, max: 2.5, step: 0.1, value: LMB.b, fmt: f1, onInput: function (v) { LMB.b = v; cLM.draw(); } });
  TR.button('#btn-lm', 'Reset', function () { LMB = { a: 90, b: 1, c: 10, d: 1 }; LMT = { tS: 0, tD: 0 }; sTS.set(0); sTD.set(0); ctlLM.querySelectorAll('input[type=range]').forEach(function (i, n) { if (n === 2) i.value = 1; if (n === 3) i.value = 1; i.dispatchEvent(new Event('input')); }); cLM.draw(); });
  cLM.draw();
})();
