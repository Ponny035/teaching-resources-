/* Session 3 — costs, MR = MC, perfect competition.
   Variable cost: VC(q) = k·(10q − 0.9q² + 0.03q³)   →  MC(q) = k·(10 − 1.8q + 0.09q²)
   Total cost: TC(q) = FC + VC(q). MC crosses AVC at q = 15. */
(function () {
  'use strict';
  var clamp = TR.clamp, money = TR.money;
  var f1 = function (v) { return v.toFixed(1); };

  var QMAX = 30;
  function costs(fc, k) {
    var o = {
      VC: function (q) { return k * (10 * q - 0.9 * q * q + 0.03 * q * q * q); },
      MC: function (q) { return k * (10 - 1.8 * q + 0.09 * q * q); },
      AVC: function (q) { return k * (10 - 0.9 * q + 0.03 * q * q); },
      AFC: function (q) { return fc / q; },
      ATC: function (q) { return fc / q + k * (10 - 0.9 * q + 0.03 * q * q); },
      TC: function (q) { return fc + k * (10 * q - 0.9 * q * q + 0.03 * q * q * q); }
    };
    /* minimum of ATC by scan (AVC minimum is exactly q=15) */
    var best = { q: 1, v: Infinity };
    for (var q = 1; q <= QMAX; q += 0.05) { var v = o.ATC(q); if (v < best.v) best = { q: q, v: v }; }
    o.minATC = best; o.minAVC = { q: 15, v: o.AVC(15) };
    /* profit-maximising output at price P (short run, includes shutdown rule) */
    o.qStar = function (P) {
      if (P < k) return 0;
      var q = 10 + (10 / 3) * Math.sqrt(P / k - 1);
      return P < o.AVC(q) ? 0 : q;
    };
    return o;
  }
  /* x where fn(x)=y on [lo,hi] (fn increasing); fallback if not bracketed */
  function xAtY(fn, y, lo, hi, fallback) {
    if (fn(hi) < y || fn(lo) > y) return fallback;
    return TR.bisect(function (x) { return fn(x) - y; }, lo, hi);
  }
  function drawCosts(c, C, opts) {
    opts = opts || {};
    c.curve(C.AVC, 0.3, QMAX, 'avc');
    c.curve(C.ATC, 0.6, QMAX, 'atc');
    if (!opts.noAFC) c.curve(C.AFC, 0.6, QMAX, 'afc');
    c.curve(C.MC, 0, QMAX, 'mc');
    var xm = xAtY(C.MC, 26, 10, QMAX, 26.5);
    c.text(xm, C.MC(xm), 'MC', 'big', { dx: -8, dy: -6, anchor: 'end' });
    c.text(28.5, C.ATC(28.5), 'ATC', 'big', { dy: -8, anchor: 'end' });
    c.text(28.5, C.AVC(28.5), 'AVC', 'big', { dy: 16, anchor: 'end' });
    if (!opts.noAFC) c.text(28.5, C.AFC(28.5), 'AFC', 'big', { dy: 16, anchor: 'end' });
  }

  /* ===================================================================== 3A */
  var S = { fc: 100, k: 1, P: 12 };
  TR.legend('#legend-a', [['mc', 'Marginal cost (MC)'], ['atc', 'Average total cost (ATC)'], ['avc', 'Average variable cost (AVC)'], ['afc', 'Average fixed cost (AFC)'], ['price', 'Price = MR'], ['box green', 'Profit'], ['box red', 'Loss']]);

  var a1 = TR.chart('#chart-a1', { xmax: QMAX, ymax: 30, xstep: 5, ystep: 5, xlabel: 'Output (q)', ylabel: '$ per unit', yfmt: function (v) { return '$' + v; }, aspect: 0.9, maxH: 460 });
  var a2 = TR.chart('#chart-a2', { xmax: QMAX, ymax: 800, xstep: 5, ystep: 200, xlabel: 'Output (q)', ylabel: 'Total $', yfmt: function (v) { return '$' + v; }, aspect: 0.9, maxH: 460 });

  function stateA() {
    var C = costs(S.fc, S.k), q = C.qStar(S.P);
    var tr = S.P * q, tc = q > 0 ? C.TC(q) : S.fc;
    return { C: C, q: q, tr: tr, tc: tc, profit: tr - tc };
  }
  function renderAll() { a1.draw(); a2.draw(); }

  a1.render = function (c) {
    var st = stateA(), C = st.C, P = S.P, q = st.q;
    if (q > 0) c.rect(0, C.ATC(q), q, P, st.profit >= 0 ? 'green' : 'red');
    drawCosts(c, C);
    c.line(0, P, QMAX, P, 'price', { drag: 'P' });
    c.text(3.6, P, 'P = MR = D', 'big', { anchor: 'start', dy: -8 });
    c.dot(C.minATC.q, C.minATC.v, 'hollow', 5); c.text(C.minATC.q, C.minATC.v, 'Break-even', 'soft', { dy: 20 });
    c.dot(C.minAVC.q, C.minAVC.v, 'hollow', 5); c.text(C.minAVC.q, C.minAVC.v, 'Shutdown point', 'soft', { dy: 20 });
    if (q > 0) {
      c.line(q, P, q, 0, 'drop');
      c.dot(q, P, 'green', 7);
      c.text(q, 0, 'q* = ' + f1(q), 'soft', { dy: -8 });
      if (Math.abs(st.profit) > 20) c.text(q / 2, (P + C.ATC(q)) / 2, st.profit >= 0 ? 'Profit' : 'Loss', 'big');
    }
    c.handle('P', 1.6, P);

    var dec = q > 0 ? 'Produce' : 'Shut down';
    TR.stats('#stats-a', [
      ['Price (= MR)', money(P, 1)], ['Output q*', f1(q), 'key'], ['Revenue', money(st.tr)], ['Total cost', money(st.tc)],
      ['Profit', money(st.profit), st.profit > 0.5 ? 'good' : st.profit < -0.5 ? 'bad' : ''], ['Decision', dec],
      ['Break-even price (min ATC)', money(C.minATC.v, 2)], ['Shutdown price (min AVC)', money(C.minAVC.v, 2)]
    ]);
    var msg, kind = '';
    if (q === 0) { msg = '<b>Shut down.</b> Price ($' + f1(P) + ') is below the lowest AVC ($' + f1(C.minAVC.v) + '): every unit would lose money on top of the fixed cost. Producing nothing limits the loss to the fixed cost ($' + S.fc + ').'; kind = 'bad'; }
    else if (st.profit > 0.5) { msg = '<b>Profit.</b> At q* = ' + f1(q) + ', price ($' + f1(P) + ') is above ATC ($' + f1(C.ATC(q)) + '). Profit per unit × units = ' + money(st.profit) + '.'; kind = 'good'; }
    else if (st.profit < -0.5) { msg = '<b>Loss, but keep producing.</b> Price is below ATC yet above AVC, so each unit helps cover fixed costs. Loss ' + money(-st.profit) + ' &lt; fixed cost ' + money(S.fc) + '.'; kind = 'warn'; }
    else msg = '<b>Break-even.</b> Price = ATC, so economic profit is zero — this is where the long run ends up.';
    TR.message('#msg-a', msg, kind);
  };

  a2.render = function (c) {
    var st = stateA(), C = st.C, q = st.q, P = S.P;
    c.line(0, 0, QMAX, QMAX * P, 'tr');
    c.curve(C.TC, 0, QMAX, 'atc');
    var xl = QMAX - 0.6, trEnd = Math.min(790, xl * P), tcEnd = C.TC(xl), trAbove = trEnd >= tcEnd;
    c.text(xl, trEnd, 'Total revenue', 'big', { anchor: 'end', dy: trAbove ? -10 : 18 });
    c.text(xl, tcEnd, 'Total cost', 'big', { anchor: 'end', dy: trAbove ? 18 : -10 });
    c.text(0.3, S.fc, 'Fixed cost', 'soft', { anchor: 'start', dy: -8 });
    if (q > 0) {
      var tcq = C.TC(q);
      c.line(q - 8, tcq - 8 * P, q + 8, tcq + 8 * P, 'ink dash thin');       // tangent-like line with slope P
      c.pline([[q, tcq], [q, P * q]], st.profit >= 0 ? 'green' : 'red');
      c.dot(q, P * q, 'green', 6); c.dot(q, tcq, 'violet', 6);
      c.text(q, (tcq + P * q) / 2, (st.profit >= 0 ? ' Profit ' : ' Loss ') + money(Math.abs(st.profit)), '', { anchor: 'start', dx: 8 });
      c.text(q, 0, 'q* = ' + f1(q), 'soft', { dy: -8 });
    } else {
      c.text(1, S.fc / 2, 'Shut down: loss = fixed cost', 'soft', { anchor: 'start' });
    }
  };

  var ctlA = document.querySelector('#ctl-a');
  var sPa = TR.slider(ctlA, { label: 'Market price', min: 0.5, max: 29.5, step: 0.5, value: S.P, fmt: money, onInput: function (v) { S.P = v; renderAll(); } });
  a1.onDrag = function (id, x, y) { S.P = clamp(Math.round(y * 2) / 2, 0.5, 29.5); sPa.set(S.P); renderAll(); };
  TR.slider(ctlA, { label: 'Fixed cost (FC)', min: 0, max: 300, step: 10, value: S.fc, fmt: money, hint: 'Rent, equipment — paid even if output is zero.', onInput: function (v) { S.fc = v; renderAll(); } });
  TR.slider(ctlA, { label: 'Input cost level (variable cost)', min: 0.5, max: 1.6, step: 0.1, value: S.k, fmt: function (v) { return '×' + v.toFixed(1); }, hint: 'Higher wages/materials → all variable costs and MC scale up.', onInput: function (v) { S.k = v; renderAll(); } });
  renderAll();

  /* ===================================================================== 3B */
  var FC = 100, K = 1;
  var CC = costs(FC, K);
  var MK = { n: 6, m: 16 }, timer = null;
  TR.legend('#legend-b', [['demand', 'Market demand'], ['supply', 'Market supply = n × firm MC'], ['ghost', 'Long-run price (min ATC)'], ['mc', 'Firm MC'], ['atc', 'Firm ATC'], ['avc', 'Firm AVC']]);

  var b1 = TR.chart('#chart-b1', { xmax: 720, ymax: 30, xstep: 120, ystep: 5, xlabel: 'Market quantity (all firms)', ylabel: 'Price ($)', yfmt: function (v) { return '$' + v; }, aspect: 0.9, maxH: 460 });
  var b2 = TR.chart('#chart-b2', { xmax: QMAX, ymax: 30, xstep: 5, ystep: 5, xlabel: 'Output of one firm (q)', ylabel: '$ per unit', yfmt: function (v) { return '$' + v; }, aspect: 0.9, maxH: 460 });

  function qd(P) { return Math.max(0, MK.m * (30 - P)); }
  function marketPrice(n) {
    return TR.bisect(function (P) { return qd(P) - n * CC.qStar(P); }, 0.01, 30);
  }
  function firmProfit(P) { var q = CC.qStar(P); return q > 0 ? P * q - CC.TC(q) : -FC; }
  function stateB() {
    var P = marketPrice(MK.n), q = CC.qStar(P);
    return { P: P, q: q, Q: MK.n * q, profit: firmProfit(P) };
  }
  function drawB() { b1.draw(); b2.draw(); }

  b1.render = function (c) {
    var st = stateB();
    c.line(0, 30, 720, 30 - 720 / MK.m, 'demand');
    c.text(720 - 20, Math.max(2, 30 - 700 / MK.m), 'Demand', 'big', { anchor: 'end', dy: -8 });
    c.line(0, CC.minATC.v, 720, CC.minATC.v, 'ghost');
    c.text(4, CC.minATC.v, 'Long-run price = min ATC', 'soft', { anchor: 'start', dy: 14 });
    var pts = [];
    for (var qf = 15; qf <= QMAX; qf += 0.25) { var x = MK.n * qf, y = CC.MC(qf); if (x > 720 || y > 30) break; pts.push([x, y]); }
    if (pts.length > 1) c.pline(pts, 'supply');
    if (pts.length) c.text(pts[pts.length - 1][0], pts[pts.length - 1][1], 'Supply (' + MK.n + ' firms)', 'big', { anchor: 'start', dx: 8, dy: 14 });
    c.dot(st.Q, st.P, 'ink', 6.5); c.drop(st.Q, st.P, 'Q=' + Math.round(st.Q), 'P=$' + f1(st.P));
  };
  b2.render = function (c) {
    var st = stateB();
    if (st.q > 0) c.rect(0, CC.ATC(st.q), st.q, st.P, st.profit >= 0 ? 'green' : 'red');
    drawCosts(c, CC, { noAFC: true });
    c.line(0, st.P, QMAX, st.P, 'price');
    c.text(0.4, st.P, 'P = MR', 'big', { anchor: 'start', dy: -8 });
    if (st.q > 0) { c.dot(st.q, st.P, 'green', 6.5); c.line(st.q, st.P, st.q, 0, 'drop'); c.text(st.q, 0, 'q=' + f1(st.q), 'soft', { dy: -8 }); }

    var status = st.profit > 0.5 ? 'Entry' : st.profit < -0.5 ? 'Exit' : 'Stable';
    TR.stats('#stats-b', [
      ['Market price', money(st.P, 2)], ['Market quantity', Math.round(st.Q)], ['Firms', MK.n, 'key'],
      ['Output / firm', f1(st.q)], ['Profit / firm', money(st.profit), st.profit > 0.5 ? 'good' : st.profit < -0.5 ? 'bad' : ''],
      ['Pressure', status]
    ]);
    var msg, kind = '';
    if (st.profit > 0.5) { msg = 'Firms earn <b>positive economic profit</b> (' + money(st.profit) + ' each). Profit signals attract <b>entry</b>: supply shifts right and price falls.'; kind = 'good'; }
    else if (st.profit < -0.5) { msg = 'Firms make <b>losses</b> (' + money(-st.profit) + ' each). Some <b>exit</b>, supply shifts left and price rises.'; kind = 'bad'; }
    else { msg = '<b>Long-run equilibrium.</b> P ≈ min ATC, economic profit ≈ 0. No incentive to enter or exit.'; kind = 'good'; }
    TR.message('#msg-b', msg, kind);
  };

  var ctlB = document.querySelector('#ctl-b');
  var sN = TR.slider(ctlB, { label: 'Number of firms', min: 1, max: 30, step: 1, value: MK.n, fmt: function (v) { return v; }, onInput: function (v) { MK.n = v; drawB(); } });
  var sM = TR.slider(ctlB, { label: 'Market demand size', min: 10, max: 24, step: 1, value: MK.m, fmt: function (v) { return v; }, hint: 'A demand boom shifts the demand curve right.', onInput: function (v) { MK.m = v; drawB(); } });

  function step() {
    var p = firmProfit(marketPrice(MK.n));
    if (Math.abs(p) < 0.5) return false;
    var nn = MK.n + (p > 0 ? 1 : -1);
    if (nn < 1 || nn > 30) return false;
    var pn = firmProfit(marketPrice(nn));
    if ((pn > 0) !== (p > 0)) {                    // the next firm would flip the sign: we are as close to zero as whole firms allow
      if (Math.abs(pn) < Math.abs(p)) { MK.n = nn; sN.set(nn); drawB(); }
      return false;
    }
    MK.n = nn; sN.set(nn); drawB();
    return true;
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; auto.textContent = 'Auto-run entry / exit'; } }
  TR.button('#btn-b', 'One step of entry / exit', function () { stop(); step(); }, 'primary');
  var auto = TR.button('#btn-b', 'Auto-run entry / exit', function () {
    if (timer) { stop(); return; }
    auto.textContent = 'Stop';
    timer = setInterval(function () { if (!step()) stop(); }, 450);
  });
  TR.button('#btn-b', 'Reset', function () { stop(); MK = { n: 6, m: 16 }; sN.set(6); sM.set(16); drawB(); });
  drawB();
})();
