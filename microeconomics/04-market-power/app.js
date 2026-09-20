/* Session 4 — market power.
   Linear demand P = a − bQ, constant marginal cost c. Monopoly: MR = a − 2bQ. */
(function () {
  'use strict';
  var clamp = TR.clamp, money = TR.money;
  var f1 = function (v) { return v.toFixed(1); };
  var f2 = function (v) { return v.toFixed(2); };
  var yfmt = function (v) { return '$' + v; };

  /* ===================================================================== 4A */
  var M = { a: 100, b: 1, c: 20, F: 400, n: 3 };
  var mode = 'monopoly', snap = null;
  var XM = 150, YM = 120;

  var cA = TR.chart('#chart-a', { xmax: XM, ymax: YM, xstep: 25, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: yfmt, aspect: 0.8, maxH: 520 });
  TR.legend('#legend-a', [['demand', 'Demand'], ['mr', 'Marginal revenue (MR)'], ['mc', 'Marginal cost (MC)'], ['atc', 'ATC (with fixed cost F)'], ['box demand', 'Consumer surplus'], ['box supply', 'Producer surplus / profit'], ['box red', 'Deadweight loss']]);

  function outcome() {
    var a = M.a, b = M.b, c = M.c, F = M.F, o = { aD: a }, n = M.n;
    if (mode === 'monopc') o.aD = Math.min(a, c + 2 * Math.sqrt(b * F));
    var aD = o.aD;
    o.Qc = (aD - c) / b;
    switch (mode) {
      case 'competition': o.Q = o.Qc; o.P = c; break;
      case 'ppd': o.Q = o.Qc; o.P = c; break;
      case 'cournot': o.Q = n * (a - c) / ((n + 1) * b); o.P = a - b * o.Q; break;
      default: o.Q = (aD - c) / (2 * b); o.P = aD - b * o.Q;             // monopoly, monopolistic competition
    }
    o.TSmax = 0.5 * (aD - c) * o.Qc;
    if (mode === 'competition') { o.CS = o.TSmax; o.PS = 0; }
    else if (mode === 'ppd') { o.CS = 0; o.PS = o.TSmax; }
    else { o.CS = 0.5 * (aD - o.P) * o.Q; o.PS = (o.P - c) * o.Q; }
    o.DWL = Math.max(0, o.TSmax - o.CS - o.PS);
    o.profit = mode === 'competition' ? 0 : (mode === 'cournot' || mode === 'ppd') ? o.PS : o.PS - F;
    return o;
  }

  cA.render = function (c) {
    var a = M.a, b = M.b, cc = M.c, o = outcome(), aD = o.aD, D = function (q) { return aD - b * q; };
    var showF = mode === 'monopc' || (mode === 'monopoly' && M.F > 0);

    /* areas */
    if (mode === 'competition') c.poly([[0, a], [o.Qc, cc], [0, cc]], 'demand');
    else if (mode === 'ppd') c.poly([[0, a], [o.Qc, cc], [0, cc]], 'supply');
    else {
      c.poly([[0, aD], [o.Q, o.P], [0, o.P]], 'demand');
      c.rect(0, cc, o.Q, o.P, 'supply');
      if (o.DWL > 0.5) c.poly([[o.Q, o.P], [o.Qc, cc], [o.Q, cc]], 'red');
    }

    if (mode === 'monopc' && aD < a - 0.01) c.line(0, a, XM, a - b * XM, 'ghost');
    if (showF) c.curve(function (q) { return cc + M.F / q; }, 1, XM, 'atc');
    if (mode === 'monopoly' || mode === 'monopc') c.line(0, aD, aD / (2 * b), 0, 'mr');
    c.line(0, aD, XM, D(XM), 'demand', { drag: 'D' });
    c.line(0, cc, XM, cc, 'mc', { drag: 'MC' });

    c.text(Math.min(XM - 4, aD / b - 6), Math.max(4, D(Math.min(XM - 4, aD / b - 6))), 'Demand', 'big', { anchor: 'end', dy: -8 });
    c.text(120, cc, 'MC', 'big', { dy: 18 });
    if (mode === 'monopoly' || mode === 'monopc') c.text(aD / (2 * b), 0, 'MR', 'big', { dy: -8, dx: 10, anchor: 'start' });

    /* labels on areas */
    if (mode === 'competition') { c.text(o.Qc * 0.28, cc + (a - cc) * 0.27, 'CS', 'big'); }
    else if (mode === 'ppd') { c.text(o.Qc * 0.28, cc + (a - cc) * 0.27, 'Producer surplus', 'big'); }
    else {
      if (o.Q > 12 && aD - o.P > 12) c.text(o.Q * 0.3, o.P + (aD - o.P) * 0.3, 'CS', 'big');
      if (o.Q > 12 && o.P - cc > 12) c.text(o.Q / 2, (o.P + cc) / 2, mode === 'cournot' || mode === 'monopc' ? 'Profit' : 'Profit', 'big');
      if (o.DWL > 60) c.text(o.Q + (o.Qc - o.Q) * 0.32, cc + (o.P - cc) * 0.28, 'DWL', 'big');
    }

    /* key points */
    c.dot(o.Q, o.P, 'ink', 6.5);
    c.drop(o.Q, o.P, 'Q=' + f1(o.Q), 'P=$' + f1(o.P));
    if (mode !== 'competition' && mode !== 'ppd') {
      c.dot(o.Qc, cc, 'hollow', 5);
      if (!c.narrow) c.text(o.Qc, cc, 'Competitive Q', 'soft', { dy: 18 });
      if (mode === 'monopoly' || mode === 'monopc') { c.dot(o.Q, cc, 'aqua', 5.5); if (!c.narrow) c.text(o.Q, cc, 'MR = MC', 'soft', { dy: 18, dx: 4, anchor: 'start' }); }
    }

    /* handles */
    var qh = clamp(0.25 * aD / b, 6, 120); c.handle('D', qh, aD - b * qh);
    c.handle('MC', 138, cc);

    var lerner = o.P > 0 ? (o.P - cc) / o.P : 0;
    var rows = [['Price', money(o.P, 1)], ['Quantity', f1(o.Q)], ['Markup P − MC', money(o.P - cc, 1)], ['Lerner index', f2(lerner), 'key'],
      ['Consumer surplus', money(o.CS)], ['Producer surplus', money(o.PS)]];
    if (mode !== 'competition') rows.push([(mode === 'monopoly' || mode === 'monopc') ? 'Profit (after F)' : 'Profit', money(o.profit), o.profit > 0.5 ? 'good' : o.profit < -0.5 ? 'bad' : '']);
    rows.push(['Deadweight loss', money(o.DWL), o.DWL > 0.5 ? 'bad' : 'good'], ['Efficiency', o.TSmax > 0 ? Math.round(100 * (o.CS + o.PS) / o.TSmax) + '%' : '—']);
    TR.stats('#stats-a', rows);

    var msg = {
      monopoly: '<b>Monopoly.</b> MR = MC at Q = ' + f1(o.Q) + '. The firm then charges ' + money(o.P, 1) + ' — well above MC (' + money(cc) + '). Output is <b>half</b> the competitive quantity (' + f1(o.Qc) + '), so ' + money(o.DWL) + ' of gains from trade are lost.',
      competition: '<b>Perfect competition.</b> Many price-taking firms push price down to MC. Total surplus is at its maximum; there is no deadweight loss and no economic profit.',
      ppd: '<b>Perfect (first-degree) price discrimination.</b> Each buyer pays their own WTP, so the firm sells until demand hits MC — the efficient quantity. But <b>all</b> the surplus goes to the firm; consumers get none.',
      cournot: '<b>Oligopoly (Cournot, ' + M.n + ' firms).</b> Each firm chooses output given the others’. Total quantity = ' + f1(o.Q) + ' (each firm ' + f1(o.Q / M.n) + '). More firms → price falls toward MC. With 1 firm it’s monopoly; with many, competition. Firms have an incentive to collude — see Session 5.',
      monopc: '<b>Monopolistic competition, long run.</b> Each firm has a differentiated product (downward-sloping demand, P &gt; MC) but free entry shifts its demand left until it just touches ATC, so profit = ' + money(o.profit) + '. ' + (o.aD >= M.a - 0.01 ? 'At this F the firm already earns no profit on its current demand, so no new brands enter — lower F below ~ $' + f1(Math.pow(M.a - cc, 2) / (4 * b)) + ' to see entry shift demand left.' : 'Price is above MC but there’s no economic profit.')
    }[mode];
    TR.message('#msg-a', msg, o.DWL > 0.5 ? 'bad' : 'good');
  };

  cA.onDragStart = function () { snap = { a: M.a, c: M.c }; };
  cA.onDrag = function (id, x, y, s) {
    var dx = x - s.x, dy = y - s.y;
    if (id === 'D') M.a = clamp(snap.a + dy + M.b * dx, 40, 120);
    else if (id === 'MC') M.c = clamp(snap.c + dy, 0, M.a - 10);
    cA.draw();
  };

  var ctlA = document.querySelector('#ctl-a');
  var sN, sF, sB;
  TR.seg(ctlA, [['monopoly', 'Monopoly'], ['competition', 'Perfect competition'], ['cournot', 'Oligopoly (Cournot)'], ['ppd', 'Perfect price discrimination'], ['monopc', 'Monopolistic competition']], 'monopoly', function (m) {
    mode = m; sN.hide(m !== 'cournot'); sF.hide(m !== 'monopc' && m !== 'monopoly'); cA.draw();
  });
  sN = TR.slider(ctlA, { label: 'Number of firms', min: 1, max: 10, step: 1, value: M.n, fmt: function (v) { return v; }, onInput: function (v) { M.n = v; cA.draw(); } });
  sN.hide(true);
  sF = TR.slider(ctlA, { label: 'Fixed cost F', min: 0, max: 1600, step: 100, value: M.F, fmt: money, hint: 'Shown as ATC = MC + F/Q. Drives long-run entry in monopolistic competition.', onInput: function (v) { M.F = v; cA.draw(); } });
  sB = TR.slider(ctlA, { label: 'Demand steepness', min: 0.8, max: 2, step: 0.1, value: M.b, fmt: f1, onInput: function (v) { M.b = v; cA.draw(); } });
  TR.button('#btn-a', 'Reset', function () { M = { a: 100, b: 1, c: 20, F: 400, n: 3 }; sN.set(3); sF.set(400); sB.set(1); cA.draw(); });
  cA.draw();

  /* ===================================================================== 4B */
  var G = { a1: 60, b1: 0.6, a2: 100, b2: 1, c: 20 };
  var snapB = null;
  TR.legend('#legend-b', [['demand', 'Demand'], ['mr', 'MR'], ['mc', 'MC'], ['ink dash', 'Single (uniform) price'], ['box supply', 'Profit at group’s own price']]);
  var b1 = TR.chart('#chart-b1', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: yfmt, aspect: 0.9, maxH: 420 });
  var b2 = TR.chart('#chart-b2', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: yfmt, aspect: 0.9, maxH: 420 });

  function groupOut(a, b) {
    var Q = Math.max(0, (a - G.c) / (2 * b)), P = a - b * Q;
    return { Q: Q, P: P, profit: (P - G.c) * Q, CS: 0.5 * (a - P) * Q, e: Q > 0 ? (P / Q) / b : Infinity };
  }
  function uniform() {
    var best = { P: G.c, profit: 0 }, hi = Math.max(G.a1, G.a2);
    for (var P = G.c; P <= hi; P += 0.1) {
      var Q = Math.max(0, (G.a1 - P) / G.b1) + Math.max(0, (G.a2 - P) / G.b2), pr = (P - G.c) * Q;
      if (pr > best.profit) best = { P: P, profit: pr };
    }
    var q1 = Math.max(0, (G.a1 - best.P) / G.b1), q2 = Math.max(0, (G.a2 - best.P) / G.b2);
    best.CS = 0.5 * (G.a1 - best.P) * q1 + 0.5 * (G.a2 - best.P) * q2;
    return best;
  }
  function drawGroup(c, a, b, o, uni, which) {
    var XM2 = 120;
    c.rect(0, G.c, o.Q, o.P, 'supply');
    c.line(0, a, a / (2 * b), 0, 'mr');
    c.line(0, a, XM2, a - b * XM2, 'demand', { drag: 'D' });
    c.line(0, G.c, XM2, G.c, 'mc');
    c.line(0, uni.P, XM2, uni.P, 'ink dash thin');
    c.text(XM2 - 2, uni.P, 'Single price $' + f1(uni.P), 'soft', { anchor: 'end', dy: -7 });
    c.dot(o.Q, o.P, 'ink', 6.5);
    c.drop(o.Q, o.P, 'Q=' + f1(o.Q), 'P=$' + f1(o.P));
    c.text(o.Q / 2, (o.P + G.c) / 2, 'Profit', 'big');
    var qh = clamp(0.25 * a / b, 6, 100); c.handle('D' + which, qh, a - b * qh);
  }
  b1.render = function (c) { drawGroup(c, G.a1, G.b1, groupOut(G.a1, G.b1), uniform(), 1); summaryB(); };
  b2.render = function (c) { drawGroup(c, G.a2, G.b2, groupOut(G.a2, G.b2), uniform(), 2); };
  function summaryB() {
    var o1 = groupOut(G.a1, G.b1), o2 = groupOut(G.a2, G.b2), u = uniform(), pd = o1.profit + o2.profit;
    var tsD = pd + o1.CS + o2.CS, tsU = u.profit + u.CS;
    TR.stats('#stats-b', [
      ['Price group 1 / 2', money(o1.P, 1) + ' / ' + money(o2.P, 1), 'key'],
      ['|ε| at price 1 / 2', f2(o1.e) + ' / ' + f2(o2.e)],
      ['Profit — two prices', money(pd)], ['Profit — one price', money(u.profit)],
      ['Gain from discriminating', money(pd - u.profit), pd - u.profit > 0.5 ? 'good' : ''],
      ['Total surplus two / one', money(tsD) + ' / ' + money(tsU)]
    ]);
    var hi = o1.P > o2.P ? 1 : 2, lo = 3 - hi, gap = Math.abs(o1.P - o2.P);
    var msg = gap < 0.5 ? 'The two groups have the same demand, so the profit-maximising prices coincide — <b>no gain</b> from discriminating.'
      : 'Group ' + hi + ' pays <b>' + money(Math.max(o1.P, o2.P), 1) + '</b> and group ' + lo + ' pays <b>' + money(Math.min(o1.P, o2.P), 1) + '</b>. Group ' + hi + ' has the <b>less elastic</b> demand (|ε| ' + f2(hi === 1 ? o1.e : o2.e) + ' vs ' + f2(hi === 1 ? o2.e : o1.e) + '), so it bears the higher price. Profit rises by ' + money(pd - u.profit) + ' versus a single price of ' + money(u.P, 1) + '.';
    TR.message('#msg-b', msg);
  }
  function drawB() { b1.draw(); b2.draw(); }
  b1.onDragStart = function () { snapB = { a: G.a1 }; };
  b2.onDragStart = function () { snapB = { a: G.a2 }; };
  b1.onDrag = function (id, x, y, s) { G.a1 = clamp(snapB.a + (y - s.y) + G.b1 * (x - s.x), G.c + 10, 120); drawB(); };
  b2.onDrag = function (id, x, y, s) { G.a2 = clamp(snapB.a + (y - s.y) + G.b2 * (x - s.x), G.c + 10, 120); drawB(); };
  var ctlB = document.querySelector('#ctl-b');
  var sb1 = TR.slider(ctlB, { label: 'Group 1 steepness (students)', min: 0.6, max: 2, step: 0.1, value: G.b1, fmt: f1, hint: 'Flatter = more price-sensitive.', onInput: function (v) { G.b1 = v; drawB(); } });
  var sb2 = TR.slider(ctlB, { label: 'Group 2 steepness (adults)', min: 0.6, max: 2, step: 0.1, value: G.b2, fmt: f1, onInput: function (v) { G.b2 = v; drawB(); } });
  var sbc = TR.slider(ctlB, { label: 'Marginal cost', min: 0, max: 50, step: 1, value: G.c, fmt: money, onInput: function (v) { G.c = v; G.a1 = Math.max(G.a1, v + 10); G.a2 = Math.max(G.a2, v + 10); drawB(); } });
  TR.button(ctlB, 'Make demands identical', function () { G.a1 = G.a2; G.b1 = G.b2; sb1.set(G.b1); drawB(); });
  drawB();

  /* ===================================================================== 4C */
  var W = { a: 100, b: 1, c: 10, d: 0.5, minw: 0 };
  var wMode = 'monopsony', snapW = null;
  TR.legend('#legend-c', [['demand', 'Labor demand = MRP'], ['supply', 'Labor supply'], ['social', 'Marginal cost of labor (MCL)'], ['red dash', 'Minimum wage'], ['box supply', 'Workers’ surplus'], ['box demand', 'Employer’s surplus'], ['box red', 'Deadweight loss']]);
  var cC = TR.chart('#chart-c', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Workers hired (L)', ylabel: 'Wage ($)', yfmt: yfmt, aspect: 0.8, maxH: 500 });

  function labor() {
    var a = W.a, b = W.b, c = W.c, d = W.d, r = {};
    r.Lc = (a - c) / (b + d); r.wc = c + d * r.Lc;
    r.Lm = (a - c) / (b + 2 * d); r.wm = c + d * r.Lm;
    var wmin = W.minw, L, w, unemp = 0;
    if (wMode === 'competitive') {
      if (wmin > r.wc) { L = Math.max(0, (a - wmin) / b); w = wmin; unemp = Math.max(0, (wmin - c) / d - L); }
      else { L = r.Lc; w = r.wc; }
    } else if (wmin <= r.wm) { L = r.Lm; w = r.wm; }
    else {
      var Ls = Math.max(0, (wmin - c) / d), Ld = Math.max(0, (a - wmin) / b);
      L = Math.min(Ls, Ld); w = wmin; unemp = Math.max(0, Ls - L);
    }
    r.L = L; r.w = w; r.unemp = unemp;
    r.TS0 = 0.5 * (a - c) * r.Lc;
    r.TS = (a - c) * L - (b + d) * L * L / 2;
    r.DWL = Math.max(0, r.TS0 - r.TS);
    r.WS = w * L - c * L - d * L * L / 2;
    r.ES = a * L - b * L * L / 2 - w * L;
    r.mrp = a - b * L;
    return r;
  }
  cC.render = function (c) {
    var a = W.a, b = W.b, cc = W.c, d = W.d, r = labor(), XM3 = 120;
    var MRP = function (l) { return a - b * l; }, Sup = function (l) { return cc + d * l; };

    c.poly([[0, r.w], [r.L, r.w], [r.L, Sup(r.L)], [0, cc]], 'supply');
    c.poly([[0, a], [r.L, MRP(r.L)], [r.L, r.w], [0, r.w]], 'demand');
    if (r.Lc - r.L > 0.05) c.poly([[r.L, MRP(r.L)], [r.L, Sup(r.L)], [r.Lc, r.wc]], 'red');

    c.line(0, a, XM3, MRP(XM3), 'demand', { drag: 'MRP' });
    c.line(0, cc, XM3, Sup(XM3), 'supply', { drag: 'SUP' });
    if (wMode === 'monopsony') c.line(0, cc, XM3, cc + 2 * d * XM3, 'social');
    if (W.minw > 0) { c.line(0, W.minw, XM3, W.minw, 'red dash'); c.text(XM3, W.minw, 'Minimum wage', 'soft', { anchor: 'end', dy: -7 }); }
    if (r.unemp > 0.3) { c.pline([[r.L, W.minw], [r.L + r.unemp, W.minw]], 'red'); c.text(r.L + r.unemp / 2, W.minw, 'Unemployed', 'lbl', { dy: 16 }); }

    var lx = Math.min(112, (a - 18) / b);
    c.text(lx, MRP(lx), 'Demand (MRP)', 'big', { anchor: 'start', dx: 6, dy: 14 });
    var sx = Math.min(110, (108 - cc) / d);
    c.text(sx, Sup(sx), 'Supply', 'big', { anchor: 'end', dx: -6, dy: -8 });
    if (wMode === 'monopsony') { var mx = Math.min(56, (110 - cc) / (2 * d)); c.text(mx, cc + 2 * d * mx, 'MCL', 'big', { anchor: 'end', dx: -8, dy: -6 }); }

    if (r.L > 12) { c.text(r.L * 0.3, (r.w + Sup(r.L * 0.3)) / 2, 'Workers', 'big'); c.text(r.L * 0.3, (r.w + MRP(r.L * 0.3)) / 2, 'Employer', 'big'); }
    if (r.DWL > 30) c.text(r.L + (r.Lc - r.L) * 0.3, (MRP(r.L) + Sup(r.L)) / 2, 'DWL', 'big', { anchor: 'start', dx: 2 });

    c.dot(r.L, r.w, 'ink', 6.5); c.drop(r.L, r.w, 'L=' + f1(r.L), 'w=$' + f1(r.w));
    c.dot(r.Lc, r.wc, 'hollow', 5); c.text(r.Lc, r.wc, 'Competitive', 'soft', { dx: 10, dy: 16, anchor: 'start' });
    if (wMode === 'monopsony' && W.minw <= r.wm) { c.dot(r.Lm, MRP(r.Lm), 'aqua', 5); c.text(r.Lm, MRP(r.Lm), 'MRP = MCL', 'soft', { dy: -10 }); }
    var qh = clamp(0.25 * a / b, 6, 100); c.handle('MRP', qh, MRP(qh));
    var qs2 = clamp(0.55 * (120 - cc) / d, 10, 100); c.handle('SUP', qs2, Sup(qs2));

    TR.stats('#stats-c', [
      ['Employment', f1(r.L) + ' (comp. ' + f1(r.Lc) + ')', 'key'], ['Wage', money(r.w, 1) + ' (comp. ' + money(r.wc, 1) + ')'],
      ['Wage ÷ MRP', r.mrp > 0 ? Math.round(100 * r.w / r.mrp) + '%' : '—'],
      ['Workers’ surplus', money(r.WS)], ['Employer’s surplus', money(r.ES)],
      ['Unemployed', f1(r.unemp)], ['Deadweight loss', money(r.DWL), r.DWL > 0.5 ? 'bad' : 'good']
    ]);
    var msg;
    if (wMode === 'competitive' && W.minw <= r.wc) msg = '<b>Competitive labor market.</b> Wage = MRP = ' + money(r.wc, 1) + ' and ' + f1(r.Lc) + ' workers are hired. No deadweight loss.' + (W.minw > 0 ? ' The minimum wage is below the market wage, so it doesn’t bind.' : '');
    else if (wMode === 'competitive') msg = '<b>Minimum wage above the competitive wage.</b> Firms hire only ' + f1(r.L) + ' workers but ' + f1(r.L + r.unemp) + ' want jobs → ' + f1(r.unemp) + ' unemployed. The textbook result.';
    else if (W.minw <= r.wm) msg = '<b>Monopsony.</b> The firm hires where MRP = MCL (' + f1(r.Lm) + ' workers) and pays only what workers will accept on the supply curve (' + money(r.wm, 1) + ') — only ' + Math.round(100 * r.wm / MRP(r.Lm)) + '% of their marginal product. Employment and wages are below competitive.';
    else if (r.unemp < 0.3) msg = '<b>Minimum wage in monopsony.</b> A wage floor of ' + money(W.minw) + ' makes the firm’s labor cost flat, so it hires <b>more</b> workers (' + f1(r.L) + ' vs ' + f1(r.Lm) + ') at a <b>higher</b> wage. Deadweight loss shrinks.';
    else msg = '<b>Minimum wage set too high.</b> Above the competitive wage the firm cuts hiring to ' + f1(r.L) + ' and ' + f1(r.unemp) + ' workers are unemployed.';
    TR.message('#msg-c', msg, r.DWL > 0.5 ? 'bad' : 'good');
  };
  cC.onDragStart = function () { snapW = { a: W.a, c: W.c }; };
  cC.onDrag = function (id, x, y, s) {
    var dx = x - s.x, dy = y - s.y;
    if (id === 'MRP') W.a = clamp(snapW.a + dy + W.b * dx, 30, 120);
    else if (id === 'SUP') W.c = clamp(snapW.c + dy - W.d * dx, 0, 60);
    cC.draw();
  };
  var ctlC = document.querySelector('#ctl-c');
  TR.seg(ctlC, [['monopsony', 'Monopsony employer'], ['competitive', 'Competitive employers']], 'monopsony', function (m) { wMode = m; cC.draw(); });
  TR.slider(ctlC, { label: 'Minimum wage (0 = none)', min: 0, max: 80, step: 1, value: W.minw, fmt: function (v) { return v === 0 ? 'none' : money(v); }, onInput: function (v) { W.minw = v; cC.draw(); } });
  TR.slider(ctlC, { label: 'Labor supply steepness', min: 0.2, max: 1.2, step: 0.1, value: W.d, fmt: f1, hint: 'Steeper = workers less willing to move; monopsony power is bigger.', onInput: function (v) { W.d = v; cC.draw(); } });
  cC.draw();
})();
