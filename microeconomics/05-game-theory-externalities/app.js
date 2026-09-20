/* Session 5 — game theory (payoff matrix, repeated PD) and externalities. */
(function () {
  'use strict';
  var clamp = TR.clamp, money = TR.money;
  var f1 = function (v) { return v.toFixed(1); };
  var yfmt = function (v) { return '$' + v; };
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ===================================================================== 5A */
  /* p[row][col] = [payoff to A (row player), payoff to B (column player)] */
  var PRESETS = {
    pd: { label: 'Prisoner’s dilemma', rows: ['Stay silent', 'Confess'], cols: ['Stay silent', 'Confess'],
          p: [[[-1, -1], [-10, 0]], [[0, -10], [-5, -5]]],
          story: 'Two suspects are questioned separately. Payoffs are years in prison as negatives (so higher is better). Each is tempted to confess.' },
    cartel: { label: 'Cartel (OPEC-style)', rows: ['Restrict output', 'Cheat (overproduce)'], cols: ['Restrict output', 'Cheat (overproduce)'],
          p: [[[10, 10], [2, 14]], [[14, 2], [5, 5]]],
          story: 'Two producers agreed to restrict output to keep prices high. Each earns more by secretly overproducing. Payoffs are profits ($m).' },
    stag: { label: 'Stag hunt', rows: ['Hunt stag', 'Hunt hare'], cols: ['Hunt stag', 'Hunt hare'],
          p: [[[4, 4], [0, 3]], [[3, 0], [3, 3]]],
          story: 'A coordination game: the stag pays best but only if both go for it; the hare is a safe option. Trust matters.' },
    battle: { label: 'Battle of the sexes', rows: ['Opera', 'Football'], cols: ['Opera', 'Football'],
          p: [[[3, 2], [0, 0]], [[0, 0], [2, 3]]],
          story: 'A couple wants to go out together but prefer different events. Both prefer being together over being apart.' },
    pennies: { label: 'Matching pennies', rows: ['Heads', 'Tails'], cols: ['Heads', 'Tails'],
          p: [[[1, -1], [-1, 1]], [[-1, 1], [1, -1]]],
          story: 'Pure conflict: A wins if the coins match, B wins if they differ. Any predictable strategy gets exploited.' }
  };
  var G = JSON.parse(JSON.stringify(PRESETS.pd));

  $('#matrix-host').innerHTML =
    '<table class="matrix"><tbody>' +
    '<tr><td></td><td></td><th colspan="2" class="who-b">Player B chooses…</th></tr>' +
    '<tr><td></td><td></td><th class="cn0"></th><th class="cn1"></th></tr>' +
    '<tr><th class="side who-a" rowspan="2">Player A chooses…</th><th class="rn0"></th>' + cellHtml(0, 0) + cellHtml(0, 1) + '</tr>' +
    '<tr><th class="rn1"></th>' + cellHtml(1, 0) + cellHtml(1, 1) + '</tr>' +
    '</tbody></table>' +
    '<p class="hint">Filled number = best reply to what the other player does. Both filled in one cell = Nash equilibrium. Type any payoffs you like.</p>';
  function cellHtml(i, j) {
    return '<td class="cell" data-i="' + i + '" data-j="' + j + '">' +
      '<input class="pa" type="number" step="1" min="-99" max="99" aria-label="A payoff">' +
      '<span class="comma">,</span>' +
      '<input class="pb" type="number" step="1" min="-99" max="99" aria-label="B payoff"></td>';
  }
  var cells = Array.prototype.slice.call(document.querySelectorAll('.matrix td.cell'));

  function fillInputs() {
    cells.forEach(function (td) {
      var i = +td.dataset.i, j = +td.dataset.j;
      td.querySelector('.pa').value = G.p[i][j][0];
      td.querySelector('.pb').value = G.p[i][j][1];
    });
    for (var k = 0; k < 2; k++) { $('.rn' + k).textContent = G.rows[k]; $('.cn' + k).textContent = G.cols[k]; }
    $('#story').textContent = G.story;
  }
  cells.forEach(function (td) {
    td.addEventListener('input', function () {
      var i = +td.dataset.i, j = +td.dataset.j;
      G.p[i][j][0] = +td.querySelector('.pa').value || 0;
      G.p[i][j][1] = +td.querySelector('.pb').value || 0;
      analyze();
    });
  });

  var presetSeg = TR.seg('#presets', Object.keys(PRESETS).map(function (k) { return [k, PRESETS[k].label]; }), 'pd', function (k) {
    G = JSON.parse(JSON.stringify(PRESETS[k])); fillInputs(); analyze();
  });

  function analyze() {
    var pay = function (i, j, w) { return G.p[i][j][w]; };
    var brA = [[false, false], [false, false]], brB = [[false, false], [false, false]], i, j;
    for (j = 0; j < 2; j++) { var mA = Math.max(pay(0, j, 0), pay(1, j, 0)); for (i = 0; i < 2; i++) brA[i][j] = pay(i, j, 0) === mA; }
    for (i = 0; i < 2; i++) { var mB = Math.max(pay(i, 0, 1), pay(i, 1, 1)); for (j = 0; j < 2; j++) brB[i][j] = pay(i, j, 1) === mB; }

    var ne = [];
    cells.forEach(function (td) {
      var ci = +td.dataset.i, cj = +td.dataset.j, isNE = brA[ci][cj] && brB[ci][cj];
      td.classList.toggle('nash', isNE);
      td.querySelector('.pa').classList.toggle('br', brA[ci][cj]);
      td.querySelector('.pb').classList.toggle('br', brB[ci][cj]);
      if (isNE) ne.push([ci, cj]);
    });

    var out = [];
    /* dominant strategies */
    var domA = -1, domB = -1, wdomA = -1, wdomB = -1;
    for (i = 0; i < 2; i++) {
      var o = 1 - i;
      if (pay(i, 0, 0) > pay(o, 0, 0) && pay(i, 1, 0) > pay(o, 1, 0)) domA = i;
      else if (pay(i, 0, 0) >= pay(o, 0, 0) && pay(i, 1, 0) >= pay(o, 1, 0)) wdomA = i;
    }
    for (j = 0; j < 2; j++) {
      var q = 1 - j;
      if (pay(0, j, 1) > pay(0, q, 1) && pay(1, j, 1) > pay(1, q, 1)) domB = j;
      else if (pay(0, j, 1) >= pay(0, q, 1) && pay(1, j, 1) >= pay(1, q, 1)) wdomB = j;
    }
    var domTxt = function (who, d, w, names) {
      if (d >= 0) return '<b>' + who + ' has a dominant strategy: ' + names[d] + '</b> — it is the best choice no matter what the other player does.';
      if (w >= 0) return who + ' has a <i>weakly</i> dominant strategy: ' + names[w] + ' (never worse, sometimes better).';
      return who + ' has <b>no dominant strategy</b> — the best choice depends on what the other does.';
    };
    out.push(domTxt('Player A', domA, wdomA, G.rows));
    out.push(domTxt('Player B', domB, wdomB, G.cols));

    /* pure Nash equilibria */
    if (ne.length) {
      var list = ne.map(function (c) { return '(' + G.rows[c[0]] + ', ' + G.cols[c[1]] + ') → payoffs ' + pay(c[0], c[1], 0) + ', ' + pay(c[0], c[1], 1); });
      out.push('<b>Pure Nash equilibrium' + (ne.length > 1 ? ' (' + ne.length + ' of them)' : '') + ':</b><br>' + list.join('<br>') + (ne.length > 1 ? '<br><i>Multiple equilibria: theory can’t say which one will be played — a coordination problem.</i>' : ''));
    } else {
      out.push('<b>No pure-strategy Nash equilibrium.</b> Whatever cell you’re in, someone wants to switch — so players must randomise.');
    }
    /* efficiency of the equilibrium */
    ne.forEach(function (c) {
      var a0 = pay(c[0], c[1], 0), b0 = pay(c[0], c[1], 1);
      for (var r = 0; r < 2; r++) for (var s = 0; s < 2; s++) {
        var a1 = pay(r, s, 0), b1 = pay(r, s, 1);
        if (a1 >= a0 && b1 >= b0 && (a1 > a0 || b1 > b0) && !(r === c[0] && s === c[1])) {
          out.push('<b>Inefficient:</b> at (' + G.rows[r] + ', ' + G.cols[s] + ') both players would be at least as well off (' + a1 + ', ' + b1 + '), but it isn’t an equilibrium — each has an incentive to deviate.');
        }
      }
    });
    /* mixed equilibrium */
    var dP = pay(0, 0, 1) - pay(1, 0, 1) - pay(0, 1, 1) + pay(1, 1, 1);
    var dQ = pay(0, 0, 0) - pay(0, 1, 0) - pay(1, 0, 0) + pay(1, 1, 0);
    if (dP !== 0 && dQ !== 0) {
      var pA = (pay(1, 1, 1) - pay(1, 0, 1)) / dP;      // prob A plays row 0 (makes B indifferent)
      var qB = (pay(1, 1, 0) - pay(0, 1, 0)) / dQ;      // prob B plays col 0 (makes A indifferent)
      if (pA > 0.0001 && pA < 0.9999 && qB > 0.0001 && qB < 0.9999) {
        var uA = qB * pay(0, 0, 0) + (1 - qB) * pay(0, 1, 0), uB = pA * pay(0, 0, 1) + (1 - pA) * pay(1, 0, 1);
        out.push('<b>Mixed-strategy equilibrium:</b> A plays “' + G.rows[0] + '” with probability ' + Math.round(pA * 100) + '%, B plays “' + G.cols[0] + '” with probability ' + Math.round(qB * 100) + '%. Expected payoffs: A ' + uA.toFixed(2) + ', B ' + uB.toFixed(2) + '.');
      }
    }
    $('#analysis').innerHTML = out.map(function (t) { return '<li>' + t + '</li>'; }).join('');
  }
  fillInputs(); analyze();

  /* ===================================================================== 5B */
  var PT = { CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1] };
  var N_ROUNDS = 10, hist = [];
  var oppSel = $('#opp');

  function oppMove() {
    var s = oppSel.value, last = hist[hist.length - 1];
    if (s === 'coop') return 'C';
    if (s === 'defect') return 'D';
    if (s === 'tft') return last ? last.you : 'C';
    if (s === 'grim') return hist.some(function (h) { return h.you === 'D'; }) ? 'D' : 'C';
    return Math.random() < 0.5 ? 'C' : 'D';
  }
  function play(m) {
    if (hist.length >= N_ROUNDS) return;
    var o = oppMove(), pts = PT[m + o];
    hist.push({ you: m, opp: o, y: pts[0], p: pts[1] });
    renderB();
  }
  function renderB() {
    var ty = 0, to = 0, rows = '';
    hist.forEach(function (h, k) {
      ty += h.y; to += h.p;
      rows += '<tr><td>' + (k + 1) + '</td><td class="' + (h.you === 'C' ? 'C' : 'Dd') + '">' + (h.you === 'C' ? 'Cooperate' : 'Defect') + '</td><td class="' + (h.opp === 'C' ? 'C' : 'Dd') + '">' + (h.opp === 'C' ? 'Cooperate' : 'Defect') + '</td><td>' + h.y + '</td><td>' + h.p + '</td></tr>';
    });
    $('#rounds-host').innerHTML = '<table class="rounds"><thead><tr><th>Round</th><th>You</th><th>Opponent</th><th>You +</th><th>Opp +</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="5" style="padding:22px;color:var(--ink2)">Choose Cooperate or Defect to play round 1.</td></tr>') +
      '<tr><th colspan="3" style="text-align:right">Total</th><th>' + ty + '</th><th>' + to + '</th></tr></tbody></table>';
    var done = hist.length >= N_ROUNDS;
    coopBtn.disabled = defBtn.disabled = done;
    TR.stats('#stats-b', [['Round', Math.min(hist.length + (done ? 0 : 1), N_ROUNDS) + ' / ' + N_ROUNDS], ['Your score', ty, 'key'], ['Opponent score', to], ['Both cooperate all 10', '30 each']]);
    var msg = 'Mutual cooperation earns 3 per round; mutual defection only 1. Defecting on a cooperator tempts you with 5.', kind = '';
    if (done) {
      var dcount = hist.filter(function (h) { return h.you === 'D'; }).length;
      msg = '<b>Game over.</b> You scored ' + ty + ' and your opponent ' + to + ' (you defected ' + dcount + ' time' + (dcount === 1 ? '' : 's') + '). ' +
        (ty >= 28 ? 'You sustained cooperation — repeated play makes collusion possible.' : ty <= 14 ? 'Constant defection leaves both of you near the “1 point each” trap.' : 'Some cooperation, some cheating: every defection risked triggering punishment.');
      kind = ty >= 28 ? 'good' : '';
    }
    TR.message('#msg-b', msg, kind);
  }
  var coopBtn = TR.button('#btn-b', 'Cooperate', function () { play('C'); }, 'primary');
  var defBtn = TR.button('#btn-b', 'Defect', function () { play('D'); });
  TR.button('#btn-b', 'Restart', function () { hist = []; renderB(); });
  oppSel.addEventListener('change', function () { hist = []; renderB(); });
  renderB();

  /* ===================================================================== 5C */
  /* Demand (private benefit) P = a − bQ;  private cost (supply) P = c + dQ.
     Negative externality: MSC = MPC + e.   Positive externality: MSB = MPB + e. */
  var X = { type: 'neg', a: 100, b: 1, c: 10, d: 1, e: 20, pol: 0 }, snapX = null, payer5 = 'N';   // payer5: 'N' net effect only, 'S' producers (shifts supply), 'D' consumers (shifts demand)
  var cC = TR.chart('#chart-c', { xmax: 120, ymax: 120, xstep: 20, ystep: 20, xlabel: 'Quantity', ylabel: 'Price / marginal value ($)', yfmt: yfmt, aspect: 0.82, maxH: 520 });

  function setLegend() {
    TR.legend('#legend-c', X.type === 'neg'
      ? [['demand', 'Demand = private &amp; social benefit'], ['supply', 'Supply = private cost (MPC)'], ['social dash', 'Social cost (MSC)'], ['supply dash', 'Supply + tax (if on producers)'], ['demand dash', 'Demand − tax (if on consumers)'], ['box red', 'Deadweight loss'], ['red', 'External cost']]
      : [['demand', 'Demand = private benefit (MPB)'], ['social dash', 'Social benefit (MSB)'], ['supply', 'Supply = private &amp; social cost'], ['demand dash', 'Demand + subsidy (if to consumers)'], ['supply dash', 'Supply − subsidy (if to producers)'], ['box red', 'Deadweight loss'], ['red', 'External benefit']]);
  }
  function calcX() {
    var neg = X.type === 'neg', a = X.a, b = X.b, c = X.c, d = X.d, e = X.e, den = b + d, r = { neg: neg, den: den };
    r.msb = neg ? function (q) { return a - b * q; } : function (q) { return a + e - b * q; };
    r.msc = neg ? function (q) { return c + e + d * q; } : function (q) { return c + d * q; };
    r.Qm = Math.max(0, (a - c) / den);
    r.Qs = Math.max(0, neg ? (a - c - e) / den : (a + e - c) / den);
    r.Qp = Math.max(0, neg ? (a - c - X.pol) / den : (a - c + X.pol) / den);
    var W = function (q) { return (r.msb(0) - r.msc(0)) * q - den * q * q / 2; };
    r.DWL = Math.max(0, W(r.Qs) - W(r.Qp));
    r.DWLm = Math.max(0, W(r.Qs) - W(r.Qm));
    return r;
  }
  cC.render = function (c) {
    var r = calcX(), neg = r.neg, a = X.a, b = X.b, cc = X.c, d = X.d, e = X.e, XM = 120;
    if (payC5) payC5.setKind(neg);          // label the options "Tax ..." or "Subsidy ..."
    var D = function (q) { return a - b * q; }, S = function (q) { return cc + d * q; };

    if (Math.abs(r.Qp - r.Qs) > 0.05) c.poly([[r.Qp, r.msb(r.Qp)], [r.Qp, r.msc(r.Qp)], [r.Qs, r.msb(r.Qs)]], 'red');

    c.line(0, a, XM, D(XM), 'demand', { drag: 'D' });
    c.line(0, cc, XM, S(XM), 'supply', { drag: 'S' });
    if (neg) c.line(0, cc + e, XM, cc + e + d * XM, 'social dash'); else c.line(0, a + e, XM, a + e - b * XM, 'social dash');
    if (X.pol > 0) {          // the taxed / subsidised side's curve shifts: tax = S up or D down; subsidy = S down or D up
      var dir = neg ? 1 : -1;
      if (payer5 === 'S') c.line(0, cc + dir * X.pol, XM, cc + dir * X.pol + d * XM, 'supply dash thin');
      else if (payer5 === 'D') c.line(0, a - dir * X.pol, XM, a - dir * X.pol - b * XM, 'demand dash thin');
    }

    /* labels */
    var lx = clamp((a - 25) / b, 20, 105);
    c.text(lx, D(lx), neg ? 'Demand' : 'Demand (MPB)', 'big', { anchor: 'start', dx: 8, dy: 16 });
    var sx = clamp((105 - cc) / d, 10, 105);
    c.text(sx, S(sx), neg ? 'Supply (MPC)' : 'Supply (MC)', 'big', { anchor: 'end', dx: -6, dy: 16 });
    if (neg) { var mx = clamp((112 - cc - e) / d, 10, 100); c.text(mx, cc + e + d * mx, 'Social cost (MSC)', 'big', { anchor: 'end', dx: -6, dy: -8 }); }
    else { var bx = clamp((a + e - 25) / b, 20, 105); c.text(bx, a + e - b * bx, 'Social benefit (MSB)', 'big', { anchor: 'start', dx: 8, dy: -8 }); }

    /* externality wedge at the market quantity */
    if (e > 0.5) {
      var y1 = neg ? S(r.Qm) : D(r.Qm), y2 = neg ? r.msc(r.Qm) : r.msb(r.Qm);
      c.pline([[r.Qm, y1], [r.Qm, y2]], 'red');
      c.text(r.Qm, (y1 + y2) / 2, 'e = $' + f1(e), 'lbl', { anchor: 'start', dx: 14 });
    }

    /* equilibria */
    var pm = D(r.Qm);
    c.line(r.Qm, pm, r.Qm, 0, 'drop'); c.dot(r.Qm, pm, 'hollow', 6); c.text(r.Qm, 0, 'Market', 'soft', { dy: -7 });
    var ps = r.msb(r.Qs);
    c.line(r.Qs, ps, r.Qs, 0, 'drop'); c.dot(r.Qs, ps, 'green', 7); c.text(r.Qs, 0, 'Optimum', 'soft', { dy: -21 });
    if (X.pol > 0) {
      if (payer5 === 'N') {                                    // net effect only: what the buyer pays vs what the seller receives
        c.dot(r.Qp, D(r.Qp), 'demand', 5.5); c.dot(r.Qp, S(r.Qp), 'supply', 5.5);
        c.line(r.Qp, Math.max(D(r.Qp), S(r.Qp)), r.Qp, 0, 'drop'); c.text(r.Qp, 0, 'With policy', 'soft', { dy: -35 });
      } else {
        var pp = payer5 === 'S' ? D(r.Qp) : S(r.Qp);            // intersection of the shifted curve with the other curve
        c.dot(r.Qp, pp, 'ink', 6); c.line(r.Qp, pp, r.Qp, 0, 'drop'); c.text(r.Qp, 0, 'With policy', 'soft', { dy: -35 });
      }
    }
    if (r.DWL > 20) c.text((2 * r.Qp + r.Qs) / 3, (r.msb(r.Qp) + r.msc(r.Qp) + r.msb(r.Qs)) / 3, 'DWL', 'big', { dx: 0, dy: 4 });

    var qh = clamp(0.25 * a / b, 6, 100); c.handle('D', qh, D(qh));
    var qs2 = clamp(0.55 * (120 - cc) / d, 10, 100); c.handle('S', qs2, S(qs2));

    var gov = X.pol * r.Qp, ext = e * r.Qp;
    TR.stats('#stats-c', [
      ['Market quantity', f1(r.Qm)], ['Socially optimal', f1(r.Qs), 'good'], ['Quantity with policy', f1(r.Qp), 'key'],
      [neg ? 'External cost / unit' : 'External benefit / unit', money(e)],
      ['Deadweight loss', money(r.DWL), r.DWL > 0.5 ? 'bad' : 'good'],
      [neg ? 'Total external harm' : 'Total external benefit', money(ext)],
      [neg ? 'Tax revenue' : 'Subsidy cost', money(gov)]
    ]);
    var msg, kind = '';
    var word = neg ? 'tax' : 'subsidy';
    if (e < 0.5) msg = 'No externality here: private and social costs and benefits coincide, so the market quantity is already efficient.';
    else if (X.pol === 0) msg = neg
      ? '<b>Market failure.</b> Producers ignore the pollution cost, so they produce ' + f1(r.Qm) + ' units — <b>' + f1(r.Qm - r.Qs) + ' too many</b>. The efficient quantity is ' + f1(r.Qs) + '. Deadweight loss = ' + money(r.DWLm) + '. Try a Pigouvian tax.'
      : '<b>Market failure.</b> Buyers ignore the benefit to others, so only ' + f1(r.Qm) + ' units are traded — <b>' + f1(r.Qs - r.Qm) + ' too few</b>. The efficient quantity is ' + f1(r.Qs) + '. Deadweight loss = ' + money(r.DWLm) + '. Try a subsidy.';
    else if (Math.abs(X.pol - e) < 0.6) { msg = '<b>Externality internalised.</b> A ' + word + ' of $' + f1(X.pol) + ' per unit equals the external ' + (neg ? 'cost' : 'benefit') + ', so private decision-makers now face the true social ' + (neg ? 'cost' : 'benefit') + ' and choose the efficient quantity. Deadweight loss ≈ 0.'; kind = 'good'; }
    else if (Qover(r)) { msg = 'The ' + word + ' is <b>too high</b>: it overshoots the optimum (' + f1(r.Qp) + ' vs ' + f1(r.Qs) + '), creating a new deadweight loss of ' + money(r.DWL) + '. The ideal ' + word + ' equals the marginal external ' + (neg ? 'cost' : 'benefit') + ' ($' + f1(e) + ').'; kind = 'bad'; }
    else { msg = 'The ' + word + ' <b>helps but isn’t enough</b>: quantity ' + f1(r.Qp) + ' is still ' + (neg ? 'above' : 'below') + ' the optimum ' + f1(r.Qs) + '. Deadweight loss is ' + money(r.DWL) + ' (down from ' + money(r.DWLm) + ').'; kind = 'warn'; }
    if (X.pol > 0.05 && e >= 0.5) msg += (payer5 === 'N' ? ' <i>Net effect only: the ' + (neg ? 'tax' : 'subsidy') + ' is not assigned to a side, so no curve is shifted.</i>' : ' <i>The ' + (neg ? 'tax' : 'subsidy') + ' is imposed on ' + (payer5 === 'S' ? 'producers, so the supply curve shifts' : 'consumers, so the demand curve shifts') + ' — the efficient result is the same whichever side it is imposed on.</i>');
    TR.message('#msg-c', msg, kind);
  };
  function Qover(r) { return r.neg ? r.Qp < r.Qs : r.Qp > r.Qs; }

  cC.onDragStart = function () { snapX = { a: X.a, c: X.c }; };
  cC.onDrag = function (id, x, y, s) {
    var dx = x - s.x, dy = y - s.y;
    if (id === 'D') X.a = clamp(snapX.a + dy + X.b * dx, 40, 110);
    else if (id === 'S') X.c = clamp(snapX.c + dy - X.d * dx, 0, 60);
    cC.draw();
  };

  var ctlC = document.querySelector('#ctl-c');
  var polSl, payC5;
  TR.seg(ctlC, [['neg', 'Negative externality (pollution)'], ['pos', 'Positive externality (vaccines)']], 'neg', function (t) {
    X.type = t; X.pol = 0; polSl.set(0);
    polSl.setLabel(t === 'neg' ? 'Pigouvian tax per unit' : 'Subsidy per unit');
    eSl.setLabel(t === 'neg' ? 'External cost per unit (e)' : 'External benefit per unit (e)');
    setLegend(); cC.draw();
  });
  var eSl = TR.slider(ctlC, { label: 'External cost per unit (e)', min: 0, max: 60, step: 1, value: X.e, fmt: money, onInput: function (v) { X.e = v; cC.draw(); } });
  polSl = TR.slider(ctlC, { label: 'Pigouvian tax per unit', min: 0, max: 80, step: 1, value: 0, fmt: money, onInput: function (v) { X.pol = v; cC.draw(); } });
  payC5 = TR.payer(ctlC, payer5, function (v) { payer5 = v; cC.draw(); });
  var dSl = TR.slider(ctlC, { label: 'Supply steepness', min: 0.4, max: 2.5, step: 0.1, value: X.d, fmt: f1, onInput: function (v) { X.d = v; cC.draw(); } });
  TR.button('#btn-c', 'Set policy to the optimal level (= e)', function () { X.pol = X.e; polSl.set(X.e); cC.draw(); }, 'primary');
  TR.button('#btn-c', 'Reset', function () { X = { type: X.type, a: 100, b: 1, c: 10, d: 1, e: 20, pol: 0 }; eSl.set(20); polSl.set(0); dSl.set(1); cC.draw(); });
  setLegend();
  cC.draw();
})();
