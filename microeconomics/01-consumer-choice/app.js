/* Session 1 — consumer choice. Preferences: U(x,y) = x^a · y^(1-a)  (Cobb-Douglas).
   x = pizza slices, y = movie tickets. Goods are treated as divisible. */
(function () {
  'use strict';
  var clamp = TR.clamp, fmt = TR.fmt;

  var LIM = 40;                                        // both axes run 0..LIM
  var U = function (x, y, a) { return Math.pow(Math.max(x, 1e-9), a) * Math.pow(Math.max(y, 1e-9), 1 - a); };
  /* the y on the indifference curve of utility u, at x */
  var icY = function (u, a) { return function (x) { return Math.pow(u / Math.pow(x, a), 1 / (1 - a)); }; };
  var f1 = function (v) { return v.toFixed(1); };
  var f2 = function (v) { return v.toFixed(2); };

  /* ================= 1A ================= */
  var A = { I: 120, px: 6, py: 8, a: 0.5, bx: 5, by: 11 };

  var cA = TR.chart('#chart-a', { xmax: LIM, ymax: LIM, xlabel: 'Pizza slices (x)', ylabel: 'Movie tickets (y)', aspect: 0.9, maxH: 500, xstep: 5, ystep: 5 });
  TR.legend('#legend-a', [['ink', 'Budget line'], ['demand', 'Indifference curve through your bundle'], ['ink dash', 'Best possible indifference curve'], ['box green', 'Affordable set']]);

  var ctlA = document.querySelector('#ctl-a');
  var sI  = TR.slider(ctlA, { label: 'Income', min: 60, max: 160, step: 10, value: A.I, fmt: TR.money, onInput: function (v) { A.I = v; cA.draw(); } });
  var sPx = TR.slider(ctlA, { label: 'Price of pizza slice', min: 4, max: 12, step: 1, value: A.px, fmt: TR.money, onInput: function (v) { A.px = v; cA.draw(); } });
  var sPy = TR.slider(ctlA, { label: 'Price of movie ticket', min: 4, max: 12, step: 1, value: A.py, fmt: TR.money, onInput: function (v) { A.py = v; cA.draw(); } });
  var sA  = TR.slider(ctlA, { label: 'Taste for pizza (a)', min: 0.2, max: 0.8, step: 0.05, value: A.a, fmt: f2, hint: 'Higher = pizza matters more to you than movies.', onInput: function (v) { A.a = v; cA.draw(); } });

  function best() { return { x: A.a * A.I / A.px, y: (1 - A.a) * A.I / A.py }; }

  cA.render = function (c) {
    var I = A.I, px = A.px, py = A.py, a = A.a;
    var xi = I / px, yi = I / py, o = best(), uo = U(o.x, o.y, a);

    c.poly([[0, 0], [xi, 0], [0, yi]], 'green faint');
    c.curve(icY(uo, a), 0.2, LIM, 'ink dash thin', { n: 300 });
    var ub = U(A.bx, A.by, a);
    c.curve(icY(ub, a), 0.2, LIM, 'ic', { n: 300 });
    c.line(0, yi, xi, 0, 'budget');

    c.dot(o.x, o.y, 'green', 7);
    c.text(o.x, o.y, 'Best bundle', '', { dx: 12, dy: -12, anchor: 'start' });
    c.text(xi, 0, 'Px=' + px, 'soft', { dx: 0, dy: -8 });
    if (yi <= LIM) c.text(0, yi, 'Py=' + py, 'soft', { dx: 8, dy: 4, anchor: 'start' });
    c.handle('B', A.bx, A.by);

    /* stats + message */
    var cost = px * A.bx + py * A.by, afford = cost <= I + 1e-6, onLine = cost / I > 0.985;
    var mrs = (a / (1 - a)) * (A.by / A.bx), pr = px / py;
    var muxPerD = a * Math.pow(A.by / A.bx, 1 - a) / px;             // MUx / Px
    var muyPerD = (1 - a) * Math.pow(A.bx / A.by, a) / py;           // MUy / Py
    var ok = afford && Math.abs(cost - I) < 0.02 * I && Math.abs(mrs - pr) < 0.03 * pr;

    TR.stats('#stats-a', [
      ['Opp. cost of 1 pizza', f2(pr) + ' movies', 'key'],
      ['Spending', TR.money(cost) + ' / ' + TR.money(I), afford ? '' : 'bad'],
      ['Your utility', f1(ub)],
      ['Best utility', f1(uo), 'good'],
      ['MRS (x for y)', f2(mrs)],
      ['Price ratio Px/Py', f2(pr)],
      ['Utility per $ — pizza', f2(muxPerD)],
      ['Utility per $ — movies', f2(muyPerD)]
    ]);

    var msg, kind = '';
    if (!afford) { msg = 'Outside your budget: this bundle costs ' + TR.money(cost) + ' but you only have ' + TR.money(I) + '. Scarcity!'; kind = 'bad'; }
    else if (!onLine) { msg = 'You are leaving ' + TR.money(I - cost) + ' unspent. Because more is better, there is always a better bundle on the budget line.'; kind = 'warn'; }
    else if (ok) { msg = '<b>Optimal.</b> The indifference curve just touches the budget line: MRS ≈ Px/Py, and the last dollar gives equal utility either way.'; kind = 'good'; }
    else if (mrs > pr) { msg = 'MRS (' + f2(mrs) + ') &gt; price ratio (' + f2(pr) + '): you’d happily give up ' + f2(mrs) + ' movies for one slice, but the market only asks ' + f2(pr) + '. <b>Buy more pizza, fewer movies.</b>'; }
    else { msg = 'MRS (' + f2(mrs) + ') &lt; price ratio (' + f2(pr) + '): the market wants ' + f2(pr) + ' movies per slice but you value a slice at only ' + f2(mrs) + '. <b>Buy fewer pizza, more movies.</b>'; }
    TR.message('#msg-a', msg, kind);
  };
  cA.onDrag = function (id, x, y) { A.bx = clamp(x, 0.5, LIM - 0.5); A.by = clamp(y, 0.5, LIM - 0.5); cA.draw(); };
  TR.button('#btn-a', 'Snap to best bundle', function () { var o = best(); A.bx = o.x; A.by = o.y; cA.draw(); }, 'primary');
  TR.button('#btn-a', 'Reset', function () {
    A = { I: 120, px: 6, py: 8, a: 0.5, bx: 5, by: 11 };
    sI.set(A.I); sPx.set(A.px); sPy.set(A.py); sA.set(A.a); cA.draw();
  });
  cA.draw();

  /* ================= 1B ================= */
  /* Price change OR per-unit tax/subsidy on pizza. New price p1 = p0 + t.
     Rebate option: government hands the tax revenue back lump-sum (income I + t·x). */
  var B = { I: 120, py: 8, p0: 6, p1: 3, a: 0.5, mode: 'price', t: 3, rebate: false };

  var cB = TR.chart('#chart-b', { xmax: LIM, ymax: LIM, xlabel: 'Pizza slices (x)', ylabel: 'Movie tickets (y)', aspect: 0.9, maxH: 500, xstep: 5, ystep: 5 });
  function setLegendB() {
    var tax = B.mode === 'tax';
    TR.legend('#legend-b', [
      ['ink thin', 'Old budget line (Px=$6)'],
      ['demand', tax ? (B.t >= 0 ? 'Budget line after tax' : 'Budget line after subsidy') : 'New budget line'],
      ['ink dash thin', 'Compensated line (new prices, old utility)']]
      .concat(tax && B.rebate ? [['gold', 'Budget line with revenue rebated']] : [])
      .concat([['social', 'Old utility curve'], ['green', 'New utility curve']]));
  }
  var ctlB = document.querySelector('#ctl-b');
  var sP1, sT, segRebate;
  TR.seg(ctlB, [['price', 'Market price change'], ['tax', 'Per-unit tax / subsidy']], 'price', function (m) {
    B.mode = m; sP1.hide(m !== 'price'); sT.hide(m !== 'tax'); segRebate.hidden = (m !== 'tax'); setLegendB(); cB.draw();
  });
  sP1 = TR.slider(ctlB, { label: 'New price of pizza (was $6)', min: 3, max: 12, step: 0.5, value: B.p1, fmt: TR.money, onInput: function (v) { B.p1 = v; cB.draw(); } });
  sT = TR.slider(ctlB, { label: 'Tax per slice (negative = subsidy)', min: -3, max: 6, step: 0.5, value: B.t, fmt: function (v) { return (v < 0 ? '−' : '') + TR.money(Math.abs(v), 1); },
    hint: 'The buyer now pays $6 + tax per slice; the government collects the tax.', onInput: function (v) { B.t = v; setLegendB(); cB.draw(); } });
  sT.hide(true);
  var rebateWrap = TR.el('div', 'ctl', '<label><span>What does the government do with the money?</span></label>', ctlB);
  segRebate = rebateWrap;
  segRebate.hidden = true;
  TR.seg(rebateWrap, [['no', 'Keeps it'], ['yes', 'Rebates it lump-sum']], 'no', function (v) { B.rebate = v === 'yes'; setLegendB(); cB.draw(); });
  TR.slider(ctlB, { label: 'Taste for pizza (a)', min: 0.2, max: 0.8, step: 0.05, value: B.a, fmt: f2, onInput: function (v) { B.a = v; cB.draw(); } });
  ctlB.insertAdjacentHTML('beforeend', '<p class="hint">Income is fixed at $120; a movie ticket costs $8.</p>');

  cB.render = function (c) {
    var a = B.a, I = B.I, py = B.py, p0 = B.p0, tax = B.mode === 'tax';
    var t = tax ? B.t : B.p1 - p0, p1 = p0 + t;
    var A0 = { x: a * I / p0, y: (1 - a) * I / py };
    var u0 = U(A0.x, A0.y, a);
    var Bn = { x: a * I / p1, y: (1 - a) * I / py };                     // no rebate
    /* Hicksian (compensated) bundle at new prices, old utility */
    var C = { x: u0 * Math.pow(a * py / ((1 - a) * p1), 1 - a), y: u0 * Math.pow((1 - a) * p1 / (a * py), a) };
    var Icomp = p1 * C.x + py * C.y;
    /* with a rebate of the revenue: x' = a·I / (p0 + (1-a)·t) — lies on the OLD budget line */
    var Fin = Bn, Ireb = I, useRebate = tax && B.rebate;
    if (useRebate) {
      var xr = a * I / (p0 + (1 - a) * t);
      Ireb = I + t * xr;
      Fin = { x: xr, y: (1 - a) * Ireb / py };
    }
    var uF = U(Fin.x, Fin.y, a);

    c.curve(icY(uF, a), 0.2, LIM, 'green thin', { n: 300 });
    c.curve(icY(u0, a), 0.2, LIM, 'social', { n: 300 });
    c.line(0, I / py, I / p0, 0, 'ink thin');
    c.line(0, I / py, I / p1, 0, 'ic');
    if (useRebate) c.line(0, Ireb / py, Ireb / p1, 0, 'gold');
    c.line(0, Icomp / py, Icomp / p1, 0, 'ink dash thin');

    [['A', A0, 'ink'], ['C', C, 'hollow'], [useRebate ? 'B′' : 'B', Fin, 'green']].forEach(function (p) {
      c.dot(p[1].x, p[1].y, p[2], 7);
      c.text(p[1].x, p[1].y, p[0], 'big', { dx: 12, dy: -10, anchor: 'start' });
    });

    var se = C.x - A0.x, ie = Fin.x - C.x, tot = Fin.x - A0.x;
    var rows = [
      ['A (old choice)', f1(A0.x) + ' slices'],
      [useRebate ? 'B′ (after rebate)' : 'B (new choice)', f1(Fin.x) + ' slices'],
      ['Total effect', (tot >= 0 ? '+' : '') + f1(tot), 'key'],
      ['Substitution A→C', (se >= 0 ? '+' : '') + f1(se)],
      ['Income effect C→' + (useRebate ? 'B′' : 'B'), (ie >= 0 ? '+' : '') + f1(ie)]
    ];
    var msg, kind = '';
    if (!tax) {
      rows.push(['Income change that keeps old utility', (Icomp - I >= 0 ? '+' : '') + TR.money(Icomp - I, 1)]);
      if (Math.abs(p1 - p0) < 0.01) msg = 'Price unchanged — nothing moves. Slide the price to see the split.';
      else {
        var share = Math.abs(tot) > 1e-9 ? Math.round(100 * se / tot) : 0;
        msg = 'The price of pizza ' + (p1 < p0 ? 'fell' : 'rose') + ' from $' + p0 + ' to $' + p1 + '. About <b>' + share + '%</b> of the change in pizza comes from <b>substitution</b> and <b>' + (100 - share) + '%</b> from the <b>income effect</b>. ' +
          (p1 < p0 ? 'Cheaper pizza also makes you feel richer (you could reach a higher curve).' : 'Pricier pizza makes you effectively poorer (you drop to a lower curve).');
      }
    } else {
      var cv = Icomp - I, revC = t * C.x, eb = cv - revC, rev = t * Fin.x;
      rows.push(['Price you pay', TR.money(p1, 1)], [t >= 0 ? 'Tax revenue collected' : 'Subsidy cost (gov.)', TR.money(Math.abs(rev), 1)],
        [t >= 0 ? 'Your loss (in $)' : 'Your gain (in $)', TR.money(Math.abs(cv), 1)], ['Deadweight loss', TR.money(eb, 1), eb > 0.05 ? 'bad' : 'good']);
      if (Math.abs(t) < 0.01) msg = 'No tax — nothing changes. Slide the tax up to see what happens.';
      else if (t > 0) {
        var wasted = cv > 0 ? Math.round(100 * eb / cv) : 0;
        msg = 'The tax raises the price you pay by $' + f1(t) + '. To be as happy as before you would need <b>' + TR.money(cv, 1) + '</b> more income. Of that loss, about <b>' + TR.money(revC, 1) + '</b> is a <i>transfer</i> (what the government would collect at that compensated point) and <b>' + TR.money(eb, 1) + ' (' + wasted + '%)</b> is <b>pure waste</b> (deadweight loss): you switch away from pizza (the substitution effect A→C) so trades that were worth it never happen.' +
          (useRebate ? ' <b>Rebating</b> the revenue puts your choice B′ back on the <i>old</i> budget line, so almost only the substitution effect is left (the income effect nearly vanishes) — you still end up worse off than at A.' : ' If the government keeps the money, you also lose purchasing power (income effect C→B).');
        kind = 'warn';
      } else {
        var gain = -cv, cost = -revC, waste = cost - gain;
        msg = 'The subsidy lowers your price by $' + f1(-t) + '. It is worth <b>' + TR.money(gain, 1) + '</b> to you but costs taxpayers about <b>' + TR.money(cost, 1) + '</b>; the difference, <b>' + TR.money(waste, 1) + '</b>, is deadweight loss from over-buying pizza (substitution effect).';
        kind = 'warn';
      }
    }
    TR.stats('#stats-b', rows);
    TR.message('#msg-b', msg, kind);
  };
  setLegendB();
  cB.draw();
})();
