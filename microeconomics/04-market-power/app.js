/* Session 4 — market power.
   Linear demand P = a − bQ, constant marginal cost c. Monopoly: MR = a − 2bQ. */
(function () {
  'use strict';
  var clamp = TR.clamp, money = TR.money;
  var f1 = function (v) { return v.toFixed(1); };
  var f2 = function (v) { return v.toFixed(2); };
  var yfmt = function (v) { return '$' + v; };

  /* ===================================================================== 4A */
  /* Same demand & costs drawn twice: SHORT RUN (left) and LONG RUN (right).
     Perfect competition: SR supply is upward (fixed capacity), LR supply is flat at c (entry).
     Cournot: SR has n firms; LR has free entry so per-firm profit -> 0.
     Monopolistic competition: SR demand vs LR demand after entry. Monopoly / PPD: barriers, so SR = LR. */
  var M = { a: 100, b: 1, c: 20, F: 400, n: 2, t: 0 };     // t: per-unit tax (negative = subsidy) on the firms
  var mode = 'monopoly', snap = null;
  var XM = 150, YM = 120, A0 = 100, GAM = 1.5;        // A0: demand height before a "boom"; GAM: SR supply curvature

  var cA = TR.chart('#chart-a', { xmax: XM, ymax: YM, xstep: 25, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: yfmt, aspect: 0.95, maxH: 480 });
  var cA2 = TR.chart('#chart-a2', { xmax: XM, ymax: YM, xstep: 25, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: yfmt, aspect: 0.95, maxH: 480 });
  function drawA() { cA.draw(); cA2.draw(); }
  TR.legend('#legend-a', [['demand', 'Demand'], ['mr', 'Marginal revenue (MR)'], ['mc', 'Marginal cost (MC) / supply'], ['atc', 'ATC'], ['ghost', 'Demand / MC before the shift or tax'], ['box demand', 'Consumer surplus'], ['box supply', 'Producer surplus / profit'], ['box green', 'Profit over ATC'], ['box gold', 'Tax revenue / subsidy cost'], ['box red', 'Deadweight loss / loss']]);

  /* A per-unit tax t raises the firms' marginal cost to cE = c + t (a subsidy lowers it).
     Consumers pay P, firms keep P - t, government gets t·Q.  Efficient benchmark uses the true cost c. */
  function outcome(hz, tt) {
    var a = M.a, b = M.b, c = M.c, F = M.F, t = tt == null ? M.t : tt, cE = Math.max(0.01, c + t);
    var o = { aD: a, hz: hz, n: M.n, t: t, cE: cE };
    if (mode === 'monopc' && hz === 'lr') o.aD = Math.min(a, cE + 2 * Math.sqrt(b * F));
    var aD = o.aD; o.Qc = Math.max(0, (aD - cE) / b); o.Qeff = Math.max(0, (aD - c) / b);
    if (mode === 'cournot') {
      o.n = hz === 'lr' ? clamp((a - cE) / Math.sqrt(b * Math.max(F, 1)) - 1, 1, 50) : M.n;
      o.Q = Math.max(0, o.n * (a - cE) / ((o.n + 1) * b)); o.P = a - b * o.Q;
    } else if (mode === 'competition') {
      var Q0 = Math.max(1, (A0 - c) / b); o.Q0 = Q0;
      o.VC = function (q) { return c * Math.pow(q, GAM + 1) / ((GAM + 1) * Math.pow(Q0, GAM)); };
      o.FC0 = c * Q0 * GAM / (GAM + 1);                         // fixed cost such that profit = 0 at the "before" equilibrium
      var solveSR = function (tx) { return a - tx <= 0 ? 0 : TR.bisect(function (q) { return a - b * q - c * Math.pow(q / Q0, GAM) - tx; }, 0, Math.max(1, a / b)); };
      if (hz === 'sr') { o.Q = solveSR(t); o.P = a - b * o.Q; o.Qnt = solveSR(0); }
      else { o.Q = o.Qc; o.P = cE; }
    } else if (mode === 'ppd') { o.Q = o.Qc; o.P = cE; }
    else { o.Q = Math.max(0, (aD - cE) / (2 * b)); o.P = aD - b * o.Q; }        // monopoly, monopolistic competition
    o.G = t * o.Q;

    if (mode === 'competition') {
      o.CS = 0.5 * (a - o.P) * o.Q;
      o.PS = hz === 'sr' ? (o.P - t) * o.Q - o.VC(o.Q) : 0;
      o.profit = hz === 'sr' ? o.PS - o.FC0 : 0;
      if (hz === 'sr') { var W0 = function (q) { return a * q - b * q * q / 2 - o.VC(q); }; o.DWL = Math.max(0, W0(o.Qnt) - W0(o.Q)); }
      else o.DWL = Math.max(0, 0.5 * (a - c) * (a - c) / b - o.CS - o.G);
    } else {
      o.TS0 = 0.5 * (aD - c) * o.Qeff;
      if (mode === 'ppd') { o.CS = 0; o.PS = 0.5 * (aD - cE) * o.Qc; }
      else { o.CS = 0.5 * (aD - o.P) * o.Q; o.PS = (o.P - cE) * o.Q; }
      o.DWL = Math.max(0, o.TS0 - o.CS - o.PS - o.G);
      o.profit = mode === 'cournot' ? o.PS / o.n - F : mode === 'ppd' ? o.PS : o.PS - F;
    }
    return o;
  }

  function renderA(c, hz) {
    var a = M.a, b = M.b, cc = M.c, o = outcome(hz), aD = o.aD, cE = o.cE, t = o.t, D = function (q) { return aD - b * q; };
    var comp = mode === 'competition', sr = hz === 'sr', taxed = Math.abs(t) > 0.05;
    var S0 = function (q) { return cc * Math.pow(q / (o.Q0 || 1), GAM); };
    var showATC = (mode === 'monopoly' || mode === 'monopc') && M.F > 0;

    /* ---- shaded areas ---- */
    if (comp) {
      c.poly([[0, a], [o.Q, o.P], [0, o.P]], 'demand');
      if (sr) c.rect(0, (o.FC0 + o.VC(o.Q)) / o.Q + t, o.Q, o.P, o.profit >= 0 ? 'green' : 'red');
      if (taxed) { if (sr) c.poly([[0, 0], [o.Q, S0(o.Q)], [o.Q, S0(o.Q) + t], [0, t]], 'gold'); else c.rect(0, Math.min(cc, cE), o.Q, Math.max(cc, cE), 'gold'); }
      if (o.DWL > 0.5) {
        if (sr) {          // area between demand and the (untaxed) SR supply curve, from Q to the no-tax quantity
          var lo = Math.min(o.Q, o.Qnt), hi = Math.max(o.Q, o.Qnt), up = [], dn = [];
          for (var i = 0; i <= 20; i++) { var q = lo + (hi - lo) * i / 20; up.push([q, D(q)]); dn.unshift([q, S0(q)]); }
          c.poly(up.concat(dn), 'red');
        } else c.poly([[o.Q, o.P], [o.Qeff, cc], [o.Q, cc]], 'red');
      }
    } else if (mode === 'ppd') {
      c.poly([[0, a], [o.Qc, cE], [0, cE]], 'supply');
      if (taxed) c.rect(0, Math.min(cc, cE), o.Qc, Math.max(cc, cE), 'gold');
      if (o.DWL > 0.5) c.poly([[o.Qc, cE], [o.Qeff, cc], [o.Qc, cc]], 'red');
    } else {
      c.poly([[0, aD], [o.Q, o.P], [0, o.P]], 'demand');
      c.rect(0, cE, o.Q, o.P, 'supply');
      if (taxed) c.rect(0, Math.min(cc, cE), o.Q, Math.max(cc, cE), 'gold');
      if (o.DWL > 0.5) c.poly([[o.Q, o.P], [o.Qeff, cc], [o.Q, cc]], 'red');
    }

    /* ---- curves ---- */
    if ((mode === 'monopc' && aD < a - 0.01) || (comp && Math.abs(a - A0) > 0.5)) c.line(0, mode === 'monopc' ? a : A0, XM, (mode === 'monopc' ? a : A0) - b * XM, 'ghost');
    if (showATC) c.curve(function (q) { return cE + M.F / q; }, 1, XM, 'atc');
    if (comp && sr) c.curve(function (q) { return (o.FC0 + o.VC(q)) / q + t; }, 1, XM, 'atc');
    if (taxed && !(comp && sr)) c.line(0, cc, XM, cc, 'ghost');
    if (mode === 'monopoly' || mode === 'monopc') c.line(0, aD, aD / (2 * b), 0, 'mr');
    c.line(0, aD, XM, D(XM), 'demand', { drag: 'D' });
    if (comp && sr) { if (taxed) c.curve(S0, 0, XM, 'ghost'); c.curve(function (q) { return S0(q) + t; }, 0, XM, 'mc'); }
    else c.line(0, cE, XM, cE, 'mc', { drag: 'MC' });

    /* ---- labels ---- */
    var dxl = Math.min(XM - 4, aD / b - 6);
    c.text(dxl, Math.max(4, D(dxl)), 'Demand', 'big', { anchor: 'end', dy: -8 });
    if (comp && sr) c.text(XM * 0.8, Math.min(YM - 6, S0(XM * 0.8) + t), taxed ? 'SR supply + tax' : 'SR supply = SRMC', 'big', { anchor: 'end', dx: -6, dy: -8 });
    else if (comp) c.text(XM - 4, cE, taxed ? 'LR supply + tax' : 'LR supply = LRAC = LRMC', 'big', { anchor: 'end', dy: -16 });
    else c.text(120, cE, taxed ? (t > 0 ? 'MC + tax' : 'MC − subsidy') : 'MC', 'big', { dy: 18 });
    if (mode === 'monopoly' || mode === 'monopc') c.text(aD / (2 * b), 0, 'MR', 'big', { dy: -8, dx: 10, anchor: 'start' });
    if (comp && sr) c.text(XM * 0.9, (o.FC0 + o.VC(XM * 0.9)) / (XM * 0.9) + t, 'SR ATC', 'big', { anchor: 'end', dy: 16 });
    if (taxed && !comp && o.Q > 8 && Math.abs(cE - cc) > 9) c.text(o.Q / 2, (cc + cE) / 2, t > 0 ? 'Tax revenue' : 'Subsidy cost', 'soft');

    if (comp) { c.text(o.Q * 0.28, o.P + (a - o.P) * 0.3, 'CS', 'big'); if (sr && Math.abs(o.profit) > 60) c.text(o.Q / 2, (o.P + (o.FC0 + o.VC(o.Q)) / o.Q + t) / 2, o.profit >= 0 ? 'Profit' : 'Loss', 'big'); }
    else if (mode === 'ppd') c.text(o.Qc * 0.28, cE + (a - cE) * 0.27, 'Producer surplus', 'big');
    else {
      if (o.Q > 12 && aD - o.P > 12) c.text(o.Q * 0.3, o.P + (aD - o.P) * 0.3, 'CS', 'big');
      if (o.Q > 12 && o.P - cE > 12) c.text(o.Q / 2, (o.P + cE) / 2, 'Profit', 'big');
      if (o.DWL > 60) c.text(o.Q + (o.Qeff - o.Q) * 0.32, cc + (o.P - cc) * 0.28, 'DWL', 'big');
    }

    /* ---- key points ---- */
    c.dot(o.Q, o.P, 'ink', 6.5);
    c.drop(o.Q, o.P, 'Q=' + f1(o.Q), 'P=$' + f1(o.P));
    if (comp && sr && Math.abs(a - A0) > 0.5) { c.dot(o.Q0, cc, 'hollow', 5); if (!c.narrow) c.text(o.Q0, cc, 'Before shift', 'soft', { dy: 18 }); }
    if (!comp && mode !== 'ppd') {
      c.dot(o.Qeff, cc, 'hollow', 5);
      if (!c.narrow) c.text(o.Qeff, cc, taxed ? 'Efficient Q (no tax)' : 'Competitive Q', 'soft', { dy: 18 });
      if (mode === 'monopoly' || mode === 'monopc') { c.dot(o.Q, cE, 'aqua', 5.5); if (!c.narrow) c.text(o.Q, cE, 'MR = MC', 'soft', { dy: 18, dx: 4, anchor: 'start' }); }
    }
    var qh = clamp(0.25 * aD / b, 6, 120); c.handle('D', qh, aD - b * qh);
    if (!(comp && sr)) c.handle('MC', 138, cE);
    return o;
  }
  cA.render = function (c) { renderA(c, 'sr'); summaryA(); };
  cA2.render = function (c) { renderA(c, 'lr'); };

  function summaryA() {
    var s = outcome('sr'), l = outcome('lr'), cc = M.c, t = M.t, taxed = Math.abs(t) > 0.05;
    var pfLabel = mode === 'cournot' ? 'Profit per firm' : mode === 'competition' ? 'Economic profit' : 'Profit (after F)';
    var col = function (v) { return v > 0.5 ? 'pos' : v < -0.5 ? 'neg' : ''; };
    var row = function (label, a, b, cls) { return '<tr><td>' + label + '</td><td class="' + (cls ? cls(s) : '') + '">' + a + '</td><td class="' + (cls ? cls(l) : '') + '">' + b + '</td></tr>'; };
    var html = '<table class="tbl cmp"><thead><tr><th></th><th>Short run</th><th>Long run</th></tr></thead><tbody>' +
      row('Price', money(s.P, 1), money(l.P, 1)) +
      row('Quantity', f1(s.Q), f1(l.Q)) +
      (mode === 'cournot' ? row('Firms', f1(s.n), f1(l.n)) : '') +
      (taxed ? row('Producers receive (P − tax)', money(s.P - t, 1), money(l.P - t, 1)) : '') +
      row('Markup P − MC' + (taxed ? ' (incl. tax)' : ''), money(s.P - s.cE, 1), money(l.P - l.cE, 1)) +
      row(pfLabel, money(s.profit), money(l.profit), function (o) { return col(o.profit); }) +
      row('Consumer surplus', money(s.CS), money(l.CS)) +
      row('Producer surplus', money(s.PS), money(l.PS)) +
      (taxed ? row(t > 0 ? 'Tax revenue' : 'Subsidy cost', money(Math.abs(s.G)), money(Math.abs(l.G))) : '') +
      row('Deadweight loss', money(s.DWL), money(l.DWL), function (o) { return o.DWL > 0.5 ? 'neg' : 'pos'; }) +
      '</tbody></table>';
    document.getElementById('cmp-a').innerHTML = html;

    var msg, kind = '';
    if (mode === 'monopoly') { msg = '<b>Monopoly.</b> Barriers to entry keep rivals out, so the long run looks like the short run: MR = MC at Q = ' + f1(s.Q) + ', price ' + money(s.P, 1) + ' (well above MC), and profit of ' + money(s.profit) + ' <b>persists</b>. ' + money(s.DWL) + ' of gains from trade are lost.'; kind = 'bad'; }
    else if (mode === 'ppd') { msg = '<b>Perfect price discrimination.</b> Each buyer pays their own WTP, so output is the efficient quantity and no deadweight loss remains — but the firm captures <b>all</b> the surplus. Barriers keep the outcome the same in the long run.'; kind = 'good'; }
    else if (mode === 'competition') {
      if (Math.abs(M.a - A0) < 0.5) msg = '<b>Perfect competition.</b> With demand unchanged, price = ' + money(l.P) + ' = LRAC' + (Math.abs(M.t) > 0.05 ? ' + tax' : '') + ' in the long run and profit is zero. <b>Drag the demand curve to the right</b> (a demand boom) to see the two runs differ.';
      else msg = '<b>Short run:</b> capacity is fixed, so the boom moves the market up the steep SR supply curve: price ' + money(s.P, 1) + ' is above ATC, giving <b>economic profit ' + money(s.profit) + '</b>. <b>Long run:</b> profit attracts entry, SR supply shifts right until price falls back to ' + money(l.P) + ' (LR supply is flat' + (Math.abs(M.t) > 0.05 ? ' at LRAC + tax' : '') + '), profit = 0, and output rises to ' + f1(l.Q) + '.';
      kind = s.profit > 0.5 ? 'good' : '';
    } else if (mode === 'cournot') {
      msg = '<b>Oligopoly (Cournot).</b> <b>Short run:</b> ' + M.n + ' firms, price ' + money(s.P, 1) + ', profit ' + money(s.profit) + ' per firm (fixed cost F per firm). <b>Long run:</b> ' + (s.profit > 0.5 ? 'profit invites entry; firms enter until profit per firm is ~0, at about ' + f1(l.n) + ' firms, and price falls to ' + money(l.P, 1) + '.' : s.profit < -0.5 ? 'losses drive firms out until profit per firm is ~0, at about ' + f1(l.n) + ' firms, and price rises to ' + money(l.P, 1) + '.' : 'profit is already ~0, so there is no entry or exit.') + ' (Real oligopolies often have barriers that stop this.)';
      kind = s.profit > 0.5 ? 'warn' : '';
    } else if (mode === 'monopc') {
      msg = '<b>Monopolistic competition.</b> <b>Short run:</b> a differentiated firm has some market power: price ' + money(s.P, 1) + ' &gt; MC and profit ' + money(s.profit) + '. <b>Long run:</b> ' + (l.aD < M.a - 0.01 ? 'entry of similar brands shifts its demand left until it just touches ATC: profit = ' + money(l.profit) + ', but price (' + money(l.P, 1) + ') is still above MC, so a small deadweight loss remains.' : 'at this F the firm already earns no profit on its current demand, so nothing changes — lower F below about $' + f1(Math.pow(M.a - cc, 2) / (4 * M.b)) + ' to see entry.');
      kind = s.profit > 0.5 ? 'warn' : '';
    }
    if (taxed) {          // pass-through of the tax to consumers (compare with the no-tax outcome)
      var s0 = outcome('sr', 0), l0 = outcome('lr', 0), pct = function (x) { return Math.round(100 * x / t) + '%'; };
      msg += ' <b>' + (t > 0 ? 'Tax' : 'Subsidy') + ' pass-through:</b> the price to consumers changes by ' + money(s.P - s0.P, 1) + ' in the short run (' + pct(s.P - s0.P) + ' of the ' + (t > 0 ? 'tax' : 'subsidy') + ') and ' + money(l.P - l0.P, 1) + ' in the long run (' + pct(l.P - l0.P) + '). Firms with more market power (monopoly) pass through only about half with linear demand; with free entry and constant costs, competitive firms pass through all of it.';
    }
    TR.message('#msg-a', msg, kind);
  }

  function dragA(id, x, y, s) {
    var dx = x - s.x, dy = y - s.y;
    if (id === 'D') M.a = clamp(snap.a + dy + M.b * dx, 40, 130);
    else if (id === 'MC') M.c = clamp(snap.c + dy, Math.max(0, 1 - M.t), M.a - 10);
    drawA();
  }
  cA.onDragStart = cA2.onDragStart = function () { snap = { a: M.a, c: M.c }; };
  cA.onDrag = cA2.onDrag = dragA;

  var ctlA = document.querySelector('#ctl-a');
  var sN, sF, sB, sT;
  function syncControls() {
    sN.hide(mode !== 'cournot');
    sF.hide(mode !== 'monopc' && mode !== 'monopoly' && mode !== 'cournot');
    sF.setLabel(mode === 'cournot' ? 'Fixed cost per firm F' : 'Fixed cost F');
  }
  TR.seg(ctlA, [['monopoly', 'Monopoly'], ['competition', 'Perfect competition'], ['cournot', 'Oligopoly (Cournot)'], ['ppd', 'Perfect price discrimination'], ['monopc', 'Monopolistic competition']], 'monopoly', function (m) {
    mode = m;
    if (m === 'competition' && M.a <= A0 + 5) M.a = 115;           // start with a demand boom so SR and LR differ
    else if (m !== 'competition' && M.a === 115) M.a = A0;
    syncControls(); drawA();
  });
  sN = TR.slider(ctlA, { label: 'Number of firms (short run)', min: 1, max: 10, step: 1, value: M.n, fmt: function (v) { return v; }, hint: 'In the long run entry/exit picks the number of firms.', onInput: function (v) { M.n = v; drawA(); } });
  sF = TR.slider(ctlA, { label: 'Fixed cost F', min: 0, max: 1600, step: 100, value: M.F, fmt: money, hint: 'Shown as ATC = MC + F/Q. Drives long-run entry.', onInput: function (v) { M.F = v; drawA(); } });
  sB = TR.slider(ctlA, { label: 'Demand steepness', min: 0.8, max: 2, step: 0.1, value: M.b, fmt: f1, onInput: function (v) { M.b = v; drawA(); } });
  sT = TR.slider(ctlA, { label: 'Per-unit tax (negative = subsidy)', min: -15, max: 40, step: 1, value: M.t, fmt: function (v) { return v < 0 ? 'Subsidy $' + Math.abs(v) : v === 0 ? 'None' : 'Tax $' + v; }, hint: 'Paid by the firms: raises (or lowers) marginal cost by this amount.', onInput: function (v) { M.t = v; drawA(); } });
  syncControls();
  TR.button('#btn-a', 'Reset', function () { M = { a: 100, b: 1, c: 20, F: 400, n: 2, t: 0 }; if (mode === 'competition') M.a = 115; sN.set(2); sF.set(400); sB.set(1); sT.set(0); drawA(); });
  drawA();

  /* ===================================================================== 4B */
  var G = { a1: 60, b1: 0.6, a2: 100, b2: 1, c: 20, t: 0 };     // t: per-unit tax on the firm (negative = subsidy); marginal cost becomes c + t
  var cEff = function (tt) { return Math.max(0.01, G.c + (tt == null ? G.t : tt)); };
  var snapB = null;
  TR.legend('#legend-b', [['demand', 'Demand'], ['mr', 'MR'], ['mc', 'MC'], ['ink dash', 'Single (uniform) price'], ['ghost', 'MC before tax'], ['box supply', 'Profit at group’s own price'], ['box gold', 'Tax revenue / subsidy cost']]);
  var b1 = TR.chart('#chart-b1', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: yfmt, aspect: 0.9, maxH: 420 });
  var b2 = TR.chart('#chart-b2', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Quantity', ylabel: 'Price ($)', yfmt: yfmt, aspect: 0.9, maxH: 420 });

  function groupOut(a, b, tt) {
    var t = tt == null ? G.t : tt, cE = cEff(t), Q = Math.max(0, (a - cE) / (2 * b)), P = a - b * Q;
    return { Q: Q, P: P, profit: (P - cE) * Q, CS: 0.5 * (a - P) * Q, G: t * Q, e: Q > 0 ? (P / Q) / b : Infinity };
  }
  function uniform(tt) {
    var t = tt == null ? G.t : tt, cE = cEff(t), best = { P: cE, profit: 0 }, hi = Math.max(G.a1, G.a2);
    for (var P = cE; P <= hi; P += 0.1) {
      var Q = Math.max(0, (G.a1 - P) / G.b1) + Math.max(0, (G.a2 - P) / G.b2), pr = (P - cE) * Q;
      if (pr > best.profit) best = { P: P, profit: pr };
    }
    var q1 = Math.max(0, (G.a1 - best.P) / G.b1), q2 = Math.max(0, (G.a2 - best.P) / G.b2);
    best.CS = 0.5 * (G.a1 - best.P) * q1 + 0.5 * (G.a2 - best.P) * q2;
    best.G = t * (q1 + q2);
    return best;
  }
  function drawGroup(c, a, b, o, uni, which) {
    var XM2 = 120, cE = cEff(), taxed = Math.abs(G.t) > 0.05;
    c.rect(0, cE, o.Q, o.P, 'supply');
    if (taxed) c.rect(0, Math.min(G.c, cE), o.Q, Math.max(G.c, cE), 'gold');
    c.line(0, a, a / (2 * b), 0, 'mr');
    c.line(0, a, XM2, a - b * XM2, 'demand', { drag: 'D' });
    if (taxed) c.line(0, G.c, XM2, G.c, 'ghost');
    c.line(0, cE, XM2, cE, 'mc');
    if (taxed) c.text(XM2 - 2, cE, G.t > 0 ? 'MC + tax' : 'MC − subsidy', 'soft', { anchor: 'end', dy: 16 });
    c.line(0, uni.P, XM2, uni.P, 'ink dash thin');
    c.text(XM2 - 2, uni.P, 'Single price $' + f1(uni.P), 'soft', { anchor: 'end', dy: -7 });
    c.dot(o.Q, o.P, 'ink', 6.5);
    c.drop(o.Q, o.P, 'Q=' + f1(o.Q), 'P=$' + f1(o.P));
    c.text(o.Q / 2, (o.P + cE) / 2, 'Profit', 'big');
    if (taxed && Math.abs(cE - G.c) > 9 && o.Q > 10) c.text(o.Q / 2, (G.c + cE) / 2, G.t > 0 ? 'Tax' : 'Subsidy', 'soft');
    var qh = clamp(0.25 * a / b, 6, 100); c.handle('D' + which, qh, a - b * qh);
  }
  b1.render = function (c) { drawGroup(c, G.a1, G.b1, groupOut(G.a1, G.b1), uniform(), 1); summaryB(); };
  b2.render = function (c) { drawGroup(c, G.a2, G.b2, groupOut(G.a2, G.b2), uniform(), 2); };
  function summaryB() {
    var o1 = groupOut(G.a1, G.b1), o2 = groupOut(G.a2, G.b2), u = uniform(), pd = o1.profit + o2.profit;
    var t = G.t, taxed = Math.abs(t) > 0.05, gD = o1.G + o2.G;
    var tsD = pd + o1.CS + o2.CS + gD, tsU = u.profit + u.CS + u.G;        // total surplus includes the government's share
    var rowsB = [
      ['Price group 1 / 2', money(o1.P, 1) + ' / ' + money(o2.P, 1), 'key'],
      ['|ε| at price 1 / 2', f2(o1.e) + ' / ' + f2(o2.e)]];
    if (taxed) rowsB.push(['Firm keeps (P − tax) 1 / 2', money(o1.P - t, 1) + ' / ' + money(o2.P - t, 1)], [t > 0 ? 'Tax revenue two / one price' : 'Subsidy cost two / one price', money(Math.abs(gD)) + ' / ' + money(Math.abs(u.G))]);
    rowsB.push(['Profit — two prices', money(pd)], ['Profit — one price', money(u.profit)],
      ['Gain from discriminating', money(pd - u.profit), pd - u.profit > 0.5 ? 'good' : ''],
      ['Total surplus two / one', money(tsD) + ' / ' + money(tsU)]);
    TR.stats('#stats-b', rowsB);
    var hi = o1.P > o2.P ? 1 : 2, lo = 3 - hi, gap = Math.abs(o1.P - o2.P);
    var msg = gap < 0.5 ? 'The two groups have the same demand, so the profit-maximising prices coincide — <b>no gain</b> from discriminating.'
      : 'Group ' + hi + ' pays <b>' + money(Math.max(o1.P, o2.P), 1) + '</b> and group ' + lo + ' pays <b>' + money(Math.min(o1.P, o2.P), 1) + '</b>. Group ' + hi + ' has the <b>less elastic</b> demand (|ε| ' + f2(hi === 1 ? o1.e : o2.e) + ' vs ' + f2(hi === 1 ? o2.e : o1.e) + '), so it bears the higher price. Profit rises by ' + money(pd - u.profit) + ' versus a single price of ' + money(u.P, 1) + '.';
    if (taxed) {          // pass-through of the tax into each group's price (compare with no tax)
      var n1 = groupOut(G.a1, G.b1, 0), n2 = groupOut(G.a2, G.b2, 0), pc = function (x) { return Math.round(100 * x / t) + '%'; };
      msg += ' <b>' + (t > 0 ? 'Tax' : 'Subsidy') + ' pass-through:</b> group 1’s price changes by ' + money(o1.P - n1.P, 1) + ' (' + pc(o1.P - n1.P) + ' of the ' + (t > 0 ? 'tax' : 'subsidy') + ') and group 2’s by ' + money(o2.P - n2.P, 1) + ' (' + pc(o2.P - n2.P) + '). With linear demand the firm passes on about half to <i>each</i> group, so the price gap between the groups barely changes, and the government ' + (t > 0 ? 'collects ' : 'pays ') + money(Math.abs(gD)) + ' when the firm discriminates.';
    }
    TR.message('#msg-b', msg);
  }
  function drawB() { b1.draw(); b2.draw(); }
  b1.onDragStart = function () { snapB = { a: G.a1 }; };
  b2.onDragStart = function () { snapB = { a: G.a2 }; };
  b1.onDrag = function (id, x, y, s) { G.a1 = clamp(snapB.a + (y - s.y) + G.b1 * (x - s.x), cEff() + 10, 120); drawB(); };
  b2.onDrag = function (id, x, y, s) { G.a2 = clamp(snapB.a + (y - s.y) + G.b2 * (x - s.x), cEff() + 10, 120); drawB(); };
  var ctlB = document.querySelector('#ctl-b');
  var sb1 = TR.slider(ctlB, { label: 'Group 1 steepness (students)', min: 0.6, max: 2, step: 0.1, value: G.b1, fmt: f1, hint: 'Flatter = more price-sensitive.', onInput: function (v) { G.b1 = v; drawB(); } });
  var sb2 = TR.slider(ctlB, { label: 'Group 2 steepness (adults)', min: 0.6, max: 2, step: 0.1, value: G.b2, fmt: f1, onInput: function (v) { G.b2 = v; drawB(); } });
  var sbc = TR.slider(ctlB, { label: 'Marginal cost', min: 0, max: 50, step: 1, value: G.c, fmt: money, onInput: function (v) { G.c = v; G.a1 = Math.max(G.a1, cEff() + 10); G.a2 = Math.max(G.a2, cEff() + 10); drawB(); } });
  var sbt = TR.slider(ctlB, { label: 'Per-unit tax (negative = subsidy)', min: -15, max: 40, step: 1, value: G.t, fmt: function (v) { return v < 0 ? 'Subsidy $' + Math.abs(v) : v === 0 ? 'None' : 'Tax $' + v; }, hint: 'Paid by the firm: raises (or lowers) its marginal cost by this amount in both groups.', onInput: function (v) { G.t = v; G.a1 = Math.max(G.a1, cEff() + 10); G.a2 = Math.max(G.a2, cEff() + 10); drawB(); } });
  TR.button(ctlB, 'Make demands identical', function () { G.a1 = G.a2; G.b1 = G.b2; sb1.set(G.b1); drawB(); });
  drawB();

  /* ===================================================================== 4C */
  var W = { a: 100, b: 1, c: 10, d: 0.5, minw: 0, t: 0 };     // t: payroll tax per worker paid by the employer (negative = wage subsidy)
  var wMode = 'monopsony', snapW = null;
  TR.legend('#legend-c', [['demand', 'Labor demand = MRP'], ['supply', 'Labor supply'], ['social', 'Marginal cost of labor (MCL)'], ['red dash', 'Minimum wage'], ['box supply', 'Workers’ surplus'], ['box demand', 'Employer’s surplus'], ['box gold', 'Tax revenue / subsidy cost'], ['ghost', 'MRP before tax'], ['box red', 'Deadweight loss']]);
  var cC = TR.chart('#chart-c', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Workers hired (L)', ylabel: 'Wage ($)', yfmt: yfmt, aspect: 0.8, maxH: 500 });

  function labor() {
    var a = W.a, t = W.t, aN = a - t, b = W.b, c = W.c, d = W.d, r = {};
    r.Lc = (a - c) / (b + d); r.wc = c + d * r.Lc;                                      // efficient outcome (no tax)
    r.LcT = Math.max(0, (aN - c) / (b + d)); r.wcT = c + d * r.LcT;                     // competitive, with the payroll tax
    r.LmT = Math.max(0, (aN - c) / (b + 2 * d)); r.wmT = c + d * r.LmT;                 // monopsony, with the payroll tax
    var wmin = W.minw, L, w, unemp = 0;
    if (wMode === 'competitive') {
      if (wmin > r.wcT) { L = Math.max(0, (aN - wmin) / b); w = wmin; unemp = Math.max(0, (wmin - c) / d - L); }
      else { L = r.LcT; w = r.wcT; }
    } else if (wmin <= r.wmT) { L = r.LmT; w = r.wmT; }
    else {
      var Ls = Math.max(0, (wmin - c) / d), Ld = Math.max(0, (aN - wmin) / b);
      L = Math.min(Ls, Ld); w = wmin; unemp = Math.max(0, Ls - L);
    }
    r.L = L; r.w = w; r.unemp = unemp; r.t = t; r.aN = aN;
    r.TS0 = 0.5 * (a - c) * r.Lc;
    r.TS = (a - c) * L - (b + d) * L * L / 2;
    r.DWL = Math.max(0, r.TS0 - r.TS);
    r.G = t * L;
    r.WS = w * L - c * L - d * L * L / 2;
    r.ES = aN * L - b * L * L / 2 - w * L;               // employer's surplus after paying wage and payroll tax
    r.mrp = a - b * L;
    return r;
  }
  cC.render = function (c) {
    var a = W.a, t = W.t, aN = a - t, b = W.b, cc = W.c, d = W.d, r = labor(), XM3 = 120, taxed = Math.abs(t) > 0.05;
    var MRP = function (l) { return a - b * l; }, MRPn = function (l) { return aN - b * l; }, Sup = function (l) { return cc + d * l; };

    c.poly([[0, r.w], [r.L, r.w], [r.L, Sup(r.L)], [0, cc]], 'supply');
    c.poly([[0, aN], [r.L, MRPn(r.L)], [r.L, r.w], [0, r.w]], 'demand');
    if (taxed) c.poly([[0, aN], [r.L, MRPn(r.L)], [r.L, MRP(r.L)], [0, a]], 'gold');
    if (Math.abs(r.Lc - r.L) > 0.05) c.poly([[r.L, MRP(r.L)], [r.L, Sup(r.L)], [r.Lc, r.wc]], 'red');

    if (taxed) c.line(0, a, XM3, MRP(XM3), 'ghost');
    c.line(0, aN, XM3, MRPn(XM3), 'demand', { drag: 'MRP' });
    c.line(0, cc, XM3, Sup(XM3), 'supply', { drag: 'SUP' });
    if (wMode === 'monopsony') c.line(0, cc, XM3, cc + 2 * d * XM3, 'social');
    if (W.minw > 0) { c.line(0, W.minw, XM3, W.minw, 'red dash'); c.text(XM3, W.minw, 'Minimum wage', 'soft', { anchor: 'end', dy: -7 }); }
    if (r.unemp > 0.3) { c.pline([[r.L, W.minw], [r.L + r.unemp, W.minw]], 'red'); c.text(r.L + r.unemp / 2, W.minw, 'Unemployed', 'lbl', { dy: 16 }); }

    var lx = Math.min(112, (aN - 18) / b);
    c.text(lx, MRPn(lx), taxed ? (t > 0 ? 'MRP − payroll tax' : 'MRP + subsidy') : 'Demand (MRP)', 'big', { anchor: 'start', dx: 6, dy: 14 });
    var sx = Math.min(110, (108 - cc) / d);
    c.text(sx, Sup(sx), 'Supply', 'big', { anchor: 'end', dx: -6, dy: -8 });
    if (wMode === 'monopsony') { var mx = Math.min(56, (110 - cc) / (2 * d)); c.text(mx, cc + 2 * d * mx, 'MCL', 'big', { anchor: 'end', dx: -8, dy: -6 }); }

    if (r.L > 12) { c.text(r.L * 0.3, (r.w + Sup(r.L * 0.3)) / 2, 'Workers', 'big'); c.text(r.L * 0.3, (r.w + MRPn(r.L * 0.3)) / 2, 'Employer', 'big'); }
    if (r.DWL > 30) c.text(r.L + (r.Lc - r.L) * 0.3, (MRP(r.L) + Sup(r.L)) / 2, 'DWL', 'big', { anchor: 'start', dx: 2 });

    c.dot(r.L, r.w, 'ink', 6.5); c.drop(r.L, r.w, 'L=' + f1(r.L), 'w=$' + f1(r.w));
    c.dot(r.Lc, r.wc, 'hollow', 5); c.text(r.Lc, r.wc, taxed ? 'Competitive, no tax' : 'Competitive', 'soft', { dx: 10, dy: 16, anchor: 'start' });
    if (wMode === 'monopsony' && W.minw <= r.wmT) { c.dot(r.LmT, MRPn(r.LmT), 'aqua', 5); c.text(r.LmT, MRPn(r.LmT), 'MRP = MCL', 'soft', { dy: -10 }); }
    var qh = clamp(0.25 * aN / b, 6, 100); c.handle('MRP', qh, MRPn(qh));
    var qs2 = clamp(0.55 * (120 - cc) / d, 10, 100); c.handle('SUP', qs2, Sup(qs2));

    var rows = [
      ['Employment', f1(r.L) + ' (comp. ' + f1(r.LcT) + ')', 'key'], ['Wage workers get', money(r.w, 1) + ' (comp. ' + money(r.wcT, 1) + ')']];
    if (taxed) rows.push(['Employer pays per worker', money(r.w + t, 1)], [t > 0 ? 'Tax revenue' : 'Subsidy cost', money(Math.abs(r.G))]);
    rows.push(['Wage ÷ MRP', r.mrp > 0 ? Math.round(100 * r.w / r.mrp) + '%' : '—'],
      ['Workers’ surplus', money(r.WS)], ['Employer’s surplus', money(r.ES)],
      ['Unemployed', f1(r.unemp)], ['Deadweight loss', money(r.DWL), r.DWL > 0.5 ? 'bad' : 'good']);
    TR.stats('#stats-c', rows);
    var msg;
    if (wMode === 'competitive' && W.minw <= r.wcT) msg = '<b>Competitive labor market.</b> Wage = ' + (taxed ? 'MRP − tax' : 'MRP') + ' = ' + money(r.wcT, 1) + ' and ' + f1(r.LcT) + ' workers are hired.' + (taxed ? '' : ' No deadweight loss.') + (W.minw > 0 ? ' The minimum wage is below the market wage, so it doesn’t bind.' : '');
    else if (wMode === 'competitive') msg = '<b>Minimum wage above the competitive wage.</b> Firms hire only ' + f1(r.L) + ' workers but ' + f1(r.L + r.unemp) + ' want jobs → ' + f1(r.unemp) + ' unemployed. The textbook result.';
    else if (W.minw <= r.wmT) msg = '<b>Monopsony.</b> The firm hires where ' + (taxed ? 'net MRP' : 'MRP') + ' = MCL (' + f1(r.LmT) + ' workers) and pays only what workers will accept on the supply curve (' + money(r.wmT, 1) + ') — only ' + Math.round(100 * r.wmT / Math.max(1, MRP(r.LmT))) + '% of their marginal product. Employment and wages are below competitive.';
    else if (r.unemp < 0.3) msg = '<b>Minimum wage in monopsony.</b> A wage floor of ' + money(W.minw) + ' makes the firm’s labor cost flat, so it hires <b>more</b> workers (' + f1(r.L) + ' vs ' + f1(r.LmT) + ') at a <b>higher</b> wage. Deadweight loss shrinks.';
    else msg = '<b>Minimum wage set too high.</b> Above the competitive wage the firm cuts hiring to ' + f1(r.L) + ' and ' + f1(r.unemp) + ' workers are unemployed.';
    if (taxed) {
      var w0 = wMode === 'competitive' ? r.wc : cc + d * (a - cc) / (b + 2 * d);          // wage with no tax, same market structure
      var free = W.minw <= (wMode === 'competitive' ? r.wcT : r.wmT);                     // minimum wage not binding
      msg += ' <b>' + (t > 0 ? 'Payroll tax' : 'Wage subsidy') + ':</b> the employer pays ' + money(r.w + t, 1) + ' per worker, the worker receives ' + money(r.w, 1) + ', and the government ' + (t > 0 ? 'collects ' : 'pays ') + money(Math.abs(r.G)) + '.' +
        (free ? ' Workers ' + (t > 0 ? 'bear ' : 'gain ') + Math.round(100 * (w0 - r.w) / t) + '% of it (the wage moves from ' + money(w0, 1) + ' with no tax to ' + money(r.w, 1) + ').' : ' (The minimum wage is binding, so the wage does not fall.)');
    }
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
  var sTaxC = TR.slider(ctlC, { label: 'Payroll tax per worker (negative = wage subsidy)', min: -20, max: 30, step: 1, value: W.t, fmt: function (v) { return v < 0 ? 'Subsidy $' + Math.abs(v) : v === 0 ? 'None' : 'Tax $' + v; }, hint: 'Paid by the employer on top of the wage.', onInput: function (v) { W.t = v; cC.draw(); } });
  TR.slider(ctlC, { label: 'Minimum wage (0 = none)', min: 0, max: 80, step: 1, value: W.minw, fmt: function (v) { return v === 0 ? 'none' : money(v); }, onInput: function (v) { W.minw = v; cC.draw(); } });
  TR.slider(ctlC, { label: 'Labor supply steepness', min: 0.2, max: 1.2, step: 0.1, value: W.d, fmt: f1, hint: 'Steeper = workers less willing to move; monopsony power is bigger.', onInput: function (v) { W.d = v; cC.draw(); } });
  cC.draw();
})();
