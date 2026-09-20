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
    var QM = opts.qmax || QMAX;
    if (!opts.simple) c.curve(C.AVC, 0.3, QM, 'avc');
    c.curve(C.ATC, 0.6, QM, 'atc');
    if (!opts.noAFC && !opts.simple) c.curve(C.AFC, 0.6, QM, 'afc');
    c.curve(C.MC, 0, QM, 'mc');
    var lx = QM * 0.95, xm = xAtY(C.MC, 26, 10, QM, QM * 0.88);
    c.text(xm, C.MC(xm), opts.mcLabel || 'MC', 'big', { dx: -8, dy: -6, anchor: 'end' });
    c.text(lx, C.ATC(lx), opts.atcLabel || 'ATC', 'big', { dy: -8, anchor: 'end' });
    if (!opts.simple) c.text(lx, C.AVC(lx), 'AVC', 'big', { dy: 16, anchor: 'end' });
    if (!opts.noAFC && !opts.simple) c.text(lx, C.AFC(lx), 'AFC', 'big', { dy: 16, anchor: 'end' });
  }

  /* ===================================================================== 3A */
  var S = { fc: 100, k: 1, P: 12 };
  var SIMPLE = false;          // "Simple: ATC only" view — hides AVC, AFC, shutdown point and the FC / variable-cost sliders
  function legendA() {
    TR.legend('#legend-a', [['mc', 'Marginal cost (MC)'], ['atc', 'Average total cost (ATC)']]
      .concat(SIMPLE ? [] : [['avc', 'Average variable cost (AVC)'], ['afc', 'Average fixed cost (AFC)']])
      .concat([['price', 'Price = MR'], ['box green', 'Profit'], ['box red', 'Loss']]));
  }
  legendA();

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
    drawCosts(c, C, { simple: SIMPLE });
    c.line(0, P, QMAX, P, 'price', { drag: 'P' });
    c.text(3.6, P, 'P = MR = D', 'big', { anchor: 'start', dy: -8 });
    c.dot(C.minATC.q, C.minATC.v, 'hollow', 5); c.text(C.minATC.q, C.minATC.v, 'Break-even', 'soft', { dy: 20 });
    if (!SIMPLE) { c.dot(C.minAVC.q, C.minAVC.v, 'hollow', 5); c.text(C.minAVC.q, C.minAVC.v, 'Shutdown point', 'soft', { dy: 20 }); }
    if (q > 0) {
      c.line(q, P, q, 0, 'drop');
      c.dot(q, P, 'green', 7);
      c.text(q, 0, 'q* = ' + f1(q), 'soft', { dy: -8 });
      if (Math.abs(st.profit) > 20) c.text(q / 2, (P + C.ATC(q)) / 2, st.profit >= 0 ? 'Profit' : 'Loss', 'big');
    }
    c.handle('P', 1.6, P);

    var dec = q > 0 ? 'Produce' : 'Shut down';
    var rowsA = [
      ['Price (= MR)', money(P, 1)], ['Output q*', f1(q), 'key'], ['Revenue', money(st.tr)], ['Total cost', money(st.tc)],
      ['Profit', money(st.profit), st.profit > 0.5 ? 'good' : st.profit < -0.5 ? 'bad' : ''], ['Decision', dec],
      ['Break-even price (min ATC)', money(C.minATC.v, 2)]
    ];
    if (!SIMPLE) rowsA.push(['Shutdown price (min AVC)', money(C.minAVC.v, 2)]);
    TR.stats('#stats-a', rowsA);
    var msg, kind = '';
    if (q === 0 && SIMPLE) { msg = '<b>Shut down.</b> Price ($' + f1(P) + ') is too low to cover the extra cost of producing, so the firm does best by producing nothing.'; kind = 'bad'; }
    else if (q === 0) { msg = '<b>Shut down.</b> Price ($' + f1(P) + ') is below the lowest AVC ($' + f1(C.minAVC.v) + '): every unit would lose money on top of the fixed cost. Producing nothing limits the loss to the fixed cost ($' + S.fc + ').'; kind = 'bad'; }
    else if (st.profit > 0.5) { msg = '<b>Profit.</b> At q* = ' + f1(q) + ', price ($' + f1(P) + ') is above ATC ($' + f1(C.ATC(q)) + '). Profit per unit × units = ' + money(st.profit) + '.'; kind = 'good'; }
    else if (st.profit < -0.5 && SIMPLE) { msg = '<b>Loss, but keep producing.</b> Price is below ATC (so there is a loss of ' + money(-st.profit) + '), but producing still loses less than shutting down (' + money(S.fc) + ').'; kind = 'warn'; }
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
    if (!SIMPLE) c.text(0.3, S.fc, 'Fixed cost', 'soft', { anchor: 'start', dy: -8 });
    if (q > 0) {
      var tcq = C.TC(q);
      c.line(q - 8, tcq - 8 * P, q + 8, tcq + 8 * P, 'ink dash thin');       // tangent-like line with slope P
      c.pline([[q, tcq], [q, P * q]], st.profit >= 0 ? 'green' : 'red');
      c.dot(q, P * q, 'green', 6); c.dot(q, tcq, 'violet', 6);
      c.text(q, (tcq + P * q) / 2, (st.profit >= 0 ? ' Profit ' : ' Loss ') + money(Math.abs(st.profit)), '', { anchor: 'start', dx: 8 });
      c.text(q, 0, 'q* = ' + f1(q), 'soft', { dy: -8 });
    } else {
      c.text(1, S.fc / 2, SIMPLE ? 'Shut down: no output' : 'Shut down: loss = fixed cost', 'soft', { anchor: 'start' });
    }
  };

  var ctlA = document.querySelector('#ctl-a');
  var sFC, sK, segA, segB, segC;
  function setDetail(v) {
    SIMPLE = v === 'simple';
    segA.set(v); segB.set(v);
    sFC.hide(SIMPLE); sK.hide(SIMPLE);
    if (segC) segC.set(v);
    legendA(); legendB(); legendC(); renderAll(); drawB(); drawC();
  }
  var DETAIL = [['full', 'Full detail'], ['simple', 'Simple: ATC only']];
  ctlA.insertAdjacentHTML('beforeend', '<p class="ctl-title">Detail level</p>');
  segA = TR.seg(ctlA, DETAIL, 'full', setDetail);
  ctlA.insertAdjacentHTML('beforeend', '<p class="hint" style="margin-top:-8px">Simple view hides AVC, AFC and the fixed / variable cost sliders, leaving ATC, MC and the price line.</p>');
  var sPa = TR.slider(ctlA, { label: 'Market price', min: 0.5, max: 29.5, step: 0.5, value: S.P, fmt: money, onInput: function (v) { S.P = v; renderAll(); } });
  a1.onDrag = function (id, x, y) { S.P = clamp(Math.round(y * 2) / 2, 0.5, 29.5); sPa.set(S.P); renderAll(); };
  sFC = TR.slider(ctlA, { label: 'Fixed cost (FC)', min: 0, max: 300, step: 10, value: S.fc, fmt: money, hint: 'Rent, equipment — paid even if output is zero.', onInput: function (v) { S.fc = v; renderAll(); } });
  sK = TR.slider(ctlA, { label: 'Input cost level (variable cost)', min: 0.5, max: 1.6, step: 0.1, value: S.k, fmt: function (v) { return '×' + v.toFixed(1); }, hint: 'Higher wages/materials → all variable costs and MC scale up.', onInput: function (v) { S.k = v; renderAll(); } });
  renderAll();

  /* ===================================================================== 3B */
  var FC = 100, K = 1;
  var CC = costs(FC, K);
  var MK = { n: 6, m: 16, t: 0 }, timer = null;      // t: per-unit tax on firms (negative = subsidy)
  function legendB() {
    TR.legend('#legend-b', [['demand', 'Market demand'], ['supply', 'Market supply = n × firm MC'], ['ghost', 'Long-run price (min ATC)'], ['supply dash', 'Supply + tax (or − subsidy)'], ['mc', 'Firm MC'], ['atc', 'Firm ATC']]
      .concat(SIMPLE ? [] : [['avc', 'Firm AVC']]).concat([['box gold', 'Tax revenue / subsidy cost']]));
  }
  legendB();

  var b1 = TR.chart('#chart-b1', { xmax: 720, ymax: 30, xstep: 120, ystep: 5, xlabel: 'Market quantity (all firms)', ylabel: 'Price ($)', yfmt: function (v) { return '$' + v; }, aspect: 0.9, maxH: 460 });
  var b2 = TR.chart('#chart-b2', { xmax: QMAX, ymax: 30, xstep: 5, ystep: 5, xlabel: 'Output of one firm (q)', ylabel: '$ per unit', yfmt: function (v) { return '$' + v; }, aspect: 0.9, maxH: 460 });

  function qd(P) { return Math.max(0, MK.m * (30 - P)); }
  /* With a per-unit tax t the firm keeps only P − t, so it supplies qStar(P − t). */
  function marketPrice(n) {
    return TR.bisect(function (P) { return qd(P) - n * CC.qStar(Math.max(P - MK.t, 0)); }, 0.01, 30);
  }
  function firmProfit(P) { var q = CC.qStar(P); return q > 0 ? P * q - CC.TC(q) : -FC; }
  function profitAt(n) { return firmProfit(marketPrice(n) - MK.t); }         // profit per firm at the market price for n firms
  function stateB() {
    var P = marketPrice(MK.n), Ps = P - MK.t, q = CC.qStar(Math.max(Ps, 0));
    return { P: P, Ps: Ps, q: q, Q: MK.n * q, profit: firmProfit(Ps), G: MK.t * MK.n * q };
  }
  function drawB() { b1.draw(); b2.draw(); }

  b1.render = function (c) {
    var st = stateB();
    c.line(0, 30, 720, 30 - 720 / MK.m, 'demand');
    c.text(720 - 20, Math.max(2, 30 - 700 / MK.m), 'Demand', 'big', { anchor: 'end', dy: -8 });
    var t = MK.t, taxed = Math.abs(t) > 0.05, lrP = CC.minATC.v + t;
    if (taxed && st.q > 0) c.rect(0, Math.min(st.P, st.Ps), st.Q, Math.max(st.P, st.Ps), 'gold');
    c.line(0, lrP, 720, lrP, 'ghost');
    c.text(4, lrP, taxed ? 'Long-run price = min ATC + tax' : 'Long-run price = min ATC', 'soft', { anchor: 'start', dy: 14 });
    var pts = [], pts2 = [];
    for (var qf = 15; qf <= QMAX; qf += 0.25) { var x = MK.n * qf, y = CC.MC(qf); if (x > 720 || y > 30) break; pts.push([x, y]); if (y + t <= 30 && y + t >= 0) pts2.push([x, y + t]); }
    if (pts.length > 1) c.pline(pts, 'supply');
    if (taxed && pts2.length > 1) c.pline(pts2, 'supply dash thin');
    if (pts.length) c.text(pts[pts.length - 1][0], pts[pts.length - 1][1], 'Supply (' + MK.n + ' firms)', 'big', { anchor: 'start', dx: 8, dy: 14 });
    c.dot(st.Q, st.P, 'ink', 6.5); c.drop(st.Q, st.P, 'Q=' + Math.round(st.Q), 'P=$' + f1(st.P));
    if (taxed && st.q > 0) { c.dot(st.Q, st.Ps, 'supply', 5); c.text(st.Q, st.Ps, 'Firms get $' + f1(st.Ps), 'soft', { anchor: 'start', dx: 10, dy: 14 }); }
  };
  b2.render = function (c) {
    var st = stateB();
    var t = MK.t, taxed = Math.abs(t) > 0.05;
    if (st.q > 0) c.rect(0, CC.ATC(st.q), st.q, st.Ps, st.profit >= 0 ? 'green' : 'red');
    drawCosts(c, CC, { noAFC: true, simple: SIMPLE });
    if (taxed) { c.line(0, st.P, QMAX, st.P, 'ink dash thin'); c.text(QMAX - 0.4, st.P, 'Consumers pay $' + f1(st.P), 'soft', { anchor: 'end', dy: -7 }); }
    c.line(0, st.Ps, QMAX, st.Ps, 'price');
    c.text(0.4, st.Ps, taxed ? 'Firm gets P − tax = MR' : 'P = MR', 'big', { anchor: 'start', dy: -8 });
    if (st.q > 0) { c.dot(st.q, st.Ps, 'green', 6.5); c.line(st.q, st.Ps, st.q, 0, 'drop'); c.text(st.q, 0, 'q=' + f1(st.q), 'soft', { dy: -8 }); }

    var status = st.profit > 0.5 ? 'Entry' : st.profit < -0.5 ? 'Exit' : 'Stable';
    var rowsB = [
      [taxed ? 'Consumers pay' : 'Market price', money(st.P, 2)], ['Market quantity', Math.round(st.Q)], ['Firms', MK.n, 'key'],
      ['Output / firm', f1(st.q)], ['Profit / firm', money(st.profit), st.profit > 0.5 ? 'good' : st.profit < -0.5 ? 'bad' : ''],
      ['Pressure', status]
    ];
    if (taxed) rowsB.splice(1, 0, ['Firms receive', money(st.Ps, 2)], [t > 0 ? 'Tax revenue' : 'Subsidy cost', money(Math.abs(st.G))]);
    TR.stats('#stats-b', rowsB);
    var msg, kind = '';
    if (st.profit > 0.5) { msg = 'Firms earn <b>positive economic profit</b> (' + money(st.profit) + ' each). Profit signals attract <b>entry</b>: supply shifts right and price falls.'; kind = 'good'; }
    else if (st.profit < -0.5) { msg = 'Firms make <b>losses</b> (' + money(-st.profit) + ' each). Some <b>exit</b>, supply shifts left and price rises.'; kind = 'bad'; }
    else { msg = '<b>Long-run equilibrium.</b> P ≈ min ATC, economic profit ≈ 0. No incentive to enter or exit.'; kind = 'good'; }
    if (taxed) msg += ' <b>' + (t > 0 ? 'Tax' : 'Subsidy') + ':</b> consumers pay ' + money(st.P, 2) + ' but firms keep only ' + money(st.Ps, 2) + '. With entry and exit, firms end up receiving the minimum ATC (' + money(CC.minATC.v, 2) + '), so in the long run consumers pay ' + money(CC.minATC.v + t, 2) + ' — the whole ' + (t > 0 ? 'tax' : 'subsidy') + ' is passed on to consumers (constant-cost industry).';
    TR.message('#msg-b', msg, kind);
  };

  var ctlB = document.querySelector('#ctl-b');
  ctlB.insertAdjacentHTML('beforeend', '<p class="ctl-title">Detail level</p>');
  segB = TR.seg(ctlB, DETAIL, 'full', setDetail);
  var sN = TR.slider(ctlB, { label: 'Number of firms', min: 1, max: 30, step: 1, value: MK.n, fmt: function (v) { return v; }, onInput: function (v) { MK.n = v; drawB(); } });
  var sTb = TR.slider(ctlB, { label: 'Per-unit tax on firms (negative = subsidy)', min: -5, max: 10, step: 0.5, value: MK.t, fmt: function (v) { return v < 0 ? 'Subsidy $' + Math.abs(v).toFixed(1) : v === 0 ? 'None' : 'Tax $' + v.toFixed(1); }, hint: 'Firms keep only P − tax per unit.', onInput: function (v) { MK.t = v; drawB(); } });
  var sM = TR.slider(ctlB, { label: 'Market demand size', min: 10, max: 24, step: 1, value: MK.m, fmt: function (v) { return v; }, hint: 'A demand boom shifts the demand curve right.', onInput: function (v) { MK.m = v; drawB(); } });

  function step() {
    var p = profitAt(MK.n);
    if (Math.abs(p) < 0.5) return false;
    var nn = MK.n + (p > 0 ? 1 : -1);
    if (nn < 1 || nn > 30) return false;
    var pn = profitAt(nn);
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
  TR.button('#btn-b', 'Reset', function () { stop(); MK = { n: 6, m: 16, t: 0 }; sN.set(6); sM.set(16); sTb.set(0); drawB(); });
  drawB();

  /* ===================================================================== 3C */
  /* Short run vs long run for ONE firm, same market price.
     SR: plant fixed (s = 1, the firm from 3A/3B).  LR: firm picks the best plant size for each output.
     Plant of size s:  FC = 100·s^0.5,  variable cost scale a = s^0.67  (economies of scale in FC, diseconomies in VC)
     -> LRAC is U-shaped with its minimum (= min SRATC of the s = 1 plant) at q ≈ 19. */
  var QM3 = 45, PC = { P: 11 };
  var plFC = function (s) { return 100 * Math.pow(s, 0.5); };
  var plA = function (s) { return Math.pow(s, 0.67); };
  var plATC = function (s, q) { var x = q / s; return plFC(s) / q + plA(s) * (10 - 0.9 * x + 0.03 * x * x); };
  var plMC = function (s, q) { var x = q / s; return plA(s) * (10 - 1.8 * x + 0.09 * x * x); };
  var plTC = function (s, q) { var x = q / s; return plFC(s) + plA(s) * s * (10 * x - 0.9 * x * x + 0.03 * x * x * x); };

  /* table of the cost-minimising plant size for each output (linearly interpolated) */
  var LR_STEP = 0.25, LR_MAX = 60, LR_S = [];
  (function () {
    for (var q = LR_STEP; q <= LR_MAX + 1e-9; q += LR_STEP) {
      /* ternary search: ATC is unimodal in plant size, and a fine search keeps LRMC smooth */
      var lo = 0.002, hi = 8;
      for (var it = 0; it < 90; it++) {
        var m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
        if (plATC(m1, q) < plATC(m2, q)) hi = m2; else lo = m1;
      }
      LR_S.push((lo + hi) / 2);
    }
  })();
  function sOf(q) {
    var t = clamp(q, LR_STEP, LR_MAX) / LR_STEP - 1, i = Math.min(LR_S.length - 2, Math.floor(t));
    return LR_S[i] + (LR_S[i + 1] - LR_S[i]) * (t - i);
  }
  var lrac = function (q) { return plATC(sOf(q), q); };
  var lrmc = function (q) { return plMC(sOf(q), q); };
  var MINLR = (function () { var b = { q: 1, v: Infinity }; for (var q = 1; q <= QM3; q += 0.05) { var v = lrac(q); if (v < b.v) b = { q: q, v: v }; } return b; })();
  function qLR(P) { return P < MINLR.v - 1e-9 ? 0 : TR.bisect(function (q) { return lrmc(q) - P; }, MINLR.q, LR_MAX - 1); }
  var C1 = costs(100, 1);                                   // the short-run firm (plant size 1)

  function firmC(P) {
    var qs = C1.qStar(P), ql = qLR(P), sl = ql > 0 ? sOf(ql) : 1;
    return {
      P: P, qs: qs, ql: ql, sl: sl,
      profS: qs > 0 ? P * qs - C1.TC(qs) : -100,
      profL: ql > 0 ? (P - lrac(ql)) * ql : 0,
      atcS: qs > 0 ? C1.ATC(qs) : NaN, atcL: ql > 0 ? lrac(ql) : NaN
    };
  }
  function legendC() {
    TR.legend('#legend-c', [['mc', 'Marginal cost (SRMC / LRMC)'], ['atc', 'Average total cost (SRATC / LRAC)']]
      .concat(SIMPLE ? [] : [['avc', 'AVC (short run)']])
      .concat([['atc dash', 'SRATC of the plant chosen in the long run'], ['ghost', 'Long-run price (entry stops here)'], ['price', 'Price = MR'], ['box green', 'Profit'], ['box red', 'Loss']]));
  }
  legendC();

  var c1 = TR.chart('#chart-c1', { xmax: QM3, ymax: 30, xstep: 5, ystep: 5, xlabel: 'Output (q)', ylabel: '$ per unit', yfmt: function (v) { return '$' + v; }, aspect: 0.95, maxH: 480 });
  var c2 = TR.chart('#chart-c2', { xmax: QM3, ymax: 30, xstep: 5, ystep: 5, xlabel: 'Output (q)', ylabel: '$ per unit', yfmt: function (v) { return '$' + v; }, aspect: 0.95, maxH: 480 });
  function drawC() { c1.draw(); c2.draw(); }

  c1.render = function (c) {
    var f = firmC(PC.P), P = PC.P;
    if (f.qs > 0) c.rect(0, f.atcS, f.qs, P, f.profS >= 0 ? 'green' : 'red');
    c.curve(lrac, 1, QM3, 'ghost');                         // LRAC for reference
    drawCosts(c, C1, { simple: SIMPLE, noAFC: true, qmax: QM3, mcLabel: 'SRMC', atcLabel: 'SRATC' });
    c.line(0, P, QM3, P, 'price', { drag: 'P' });
    c.text(3.6, P, 'P = MR', 'big', { anchor: 'start', dy: -8 });
    if (f.qs > 0) { c.line(f.qs, P, f.qs, 0, 'drop'); c.dot(f.qs, P, 'green', 7); c.text(f.qs, 0, 'q = ' + f1(f.qs), 'soft', { dy: -8 }); if (Math.abs(f.profS) > 15) c.text(f.qs / 2, (P + f.atcS) / 2, f.profS >= 0 ? 'Profit' : 'Loss', 'big'); }
    c.handle('P', 1.6, P);
  };
  c2.render = function (c) {
    var f = firmC(PC.P), P = PC.P;
    if (f.ql > 0) c.rect(0, f.atcL, f.ql, P, f.profL >= 0 ? 'green' : 'red');
    c.curve(lrac, 1, QM3, 'atc');
    c.curve(lrmc, 1, QM3, 'mc');
    if (f.ql > 0) c.curve(function (q) { return plATC(f.sl, q); }, Math.max(1, f.ql * 0.35), Math.min(QM3, f.ql * 1.75), 'atc dash thin');
    c.line(0, MINLR.v, QM3, MINLR.v, 'ghost');
    c.text(22, MINLR.v, 'Long-run price (min LRAC)', 'soft', { anchor: 'start', dy: 18 });
    c.text(QM3 * 0.93, lrmc(QM3 * 0.93), 'LRMC', 'big', { anchor: 'end', dy: -8 });
    c.text(QM3 * 0.95, lrac(QM3 * 0.95), 'LRAC', 'big', { anchor: 'end', dy: -7 });
    c.line(0, P, QM3, P, 'price', { drag: 'P' });
    c.text(3.6, P, 'P = MR', 'big', { anchor: 'start', dy: -8 });
    c.dot(MINLR.q, MINLR.v, 'hollow', 5);
    if (f.ql > 0) { c.line(f.ql, P, f.ql, 0, 'drop'); c.dot(f.ql, P, 'green', 7); c.text(f.ql, 0, 'q = ' + f1(f.ql), 'soft', { dy: -8 }); if (Math.abs(f.profL) > 15) c.text(f.ql / 2, (P + f.atcL) / 2, f.profL >= 0 ? 'Profit' : 'Loss', 'big'); }
    c.handle('P', 1.6, P);
    summaryC(f);
  };
  function summaryC(f) {
    var P = f.P, up = firmC(P + 1), col = function (v) { return v > 0.5 ? 'pos' : v < -0.5 ? 'neg' : ''; };
    var atc = function (v) { return isNaN(v) ? '—' : money(v, 2); };
    var html = '<table class="tbl cmp"><thead><tr><th></th><th>Short run</th><th>Long run</th></tr></thead><tbody>' +
      '<tr><td>Output q</td><td>' + f1(f.qs) + '</td><td>' + f1(f.ql) + '</td></tr>' +
      '<tr><td>Plant size</td><td>1.00 (fixed)</td><td>' + (f.ql > 0 ? f.sl.toFixed(2) + ' (chosen)' : '—') + '</td></tr>' +
      '<tr><td>Average cost (ATC)</td><td>' + atc(f.atcS) + '</td><td>' + atc(f.atcL) + '</td></tr>' +
      '<tr><td>Profit</td><td class="' + col(f.profS) + '">' + money(f.profS) + '</td><td class="' + col(f.profL) + '">' + money(f.profL) + '</td></tr>' +
      '<tr><td>Output gained if price +$1</td><td>+' + f1(up.qs - f.qs) + '</td><td>+' + f1(up.ql - f.ql) + '</td></tr>' +
      '</tbody></table>';
    document.getElementById('cmp-c').innerHTML = html;
    var msg, kind = '';
    var dead = f.ql === 0;
    if (dead) { msg = '<b>Price too low.</b> Below the minimum LRAC ($' + f1(MINLR.v) + ') the firm cannot cover costs even after choosing the best plant, so in the long run it <b>exits</b>.'; kind = 'bad'; }
    else if (P > MINLR.v + 0.05) { msg = 'At $' + f1(P) + ' the firm earns <b>profit in both runs</b> (' + money(f.profS) + ' short run, ' + money(f.profL) + ' with a better plant). But profit invites <b>entry</b>: supply shifts right and the market price is pulled down to <b>$' + f1(MINLR.v) + '</b> (the dashed level), where profit is zero. ' + 'The long-run firm also reacts more to price: +$1 raises output by ' + f1(up.ql - f.ql) + ' (LR) vs ' + f1(up.qs - f.qs) + ' (SR) because it can resize its plant.'; kind = 'good'; }
    else { msg = '<b>Long-run equilibrium.</b> Price = minimum LRAC = $' + f1(MINLR.v) + ': the firm is on the bottom of its LRAC at the best plant size, and economic profit is zero in the long run.'; kind = 'good'; }
    TR.message('#msg-c', msg, kind);
  }
  var dragP = function (id, x, y) { PC.P = clamp(Math.round(y * 2) / 2, 2, 12); sPc.set(PC.P); drawC(); };
  c1.onDrag = c2.onDrag = dragP;

  var ctlC = document.querySelector('#ctl-c');
  ctlC.insertAdjacentHTML('beforeend', '<p class="ctl-title">Detail level</p>');
  segC = TR.seg(ctlC, DETAIL, SIMPLE ? 'simple' : 'full', setDetail);
  var sPc = TR.slider(ctlC, { label: 'Market price', min: 2, max: 12, step: 0.5, value: PC.P, fmt: money, hint: 'Drag the price line in either chart. Try prices below and above the dashed long-run price.', onInput: function (v) { PC.P = v; drawC(); } });
  drawC();
})();
