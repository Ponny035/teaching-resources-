/* ==========================================================================
   TR — tiny dependency-free helpers for interactive economics charts.
   Charts are SVG sized to their container's real pixel width (so text stays
   readable on phones). Draw everything from a `render(c)` callback in DATA
   coordinates; the helper redraws it on resize and on every drag.
   ========================================================================== */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function mk(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function fmt(v, d) {
    d = d == null ? 1 : d;
    return Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(d);
  }
  function money(v, d) { return (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(d == null ? 0 : d); }
  function niceStep(range, target) {
    var raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }
  /* find x in [lo,hi] where f changes sign (f decreasing or increasing) */
  function bisect(f, lo, hi, n) {
    var flo = f(lo);
    for (var i = 0; i < (n || 60); i++) {
      var mid = (lo + hi) / 2, fm = f(mid);
      if ((fm > 0) === (flo > 0)) { lo = mid; flo = fm; } else { hi = mid; }
    }
    return (lo + hi) / 2;
  }

  /* --------------------------------------------------------------------- */
  function chart(host, o) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    var opt = Object.assign({
      xmin: 0, xmax: 100, ymin: 0, ymax: 100,
      xlabel: '', ylabel: '', aspect: 0.74, minH: 340, maxH: 470,
      xticks: 6, yticks: 6, xstep: null, ystep: null,
      xfmt: fmt, yfmt: fmt, xtickLabels: true, ytickLabels: true,
      margin: { t: 14, r: 24, b: 46, l: 54 }
    }, o || {});
    var m = opt.margin, baseL = m.l;
    var svg = mk('svg', { class: 'chart', role: 'img', 'aria-label': opt.title || (opt.ylabel + ' versus ' + opt.xlabel) });
    host.appendChild(svg);
    var c = { svg: svg, opt: opt, W: 600, H: 400, pw: 0, ph: 0, g: null, drag: null, start: null,
              render: null, onDrag: null, onDragStart: null, onDragEnd: null };

    function layout() {
      var w = host.clientWidth || 600;
      var narrow = w < 480;
      c.narrow = narrow;
      m.l = narrow ? Math.min(baseL, 50) : baseL;
      c.W = w;
      c.H = clamp(Math.round(w * opt.aspect * (narrow ? 1.15 : 1)), opt.minH, opt.maxH);
      c.pw = c.W - m.l - m.r;
      c.ph = c.H - m.t - m.b;
      svg.setAttribute('viewBox', '0 0 ' + c.W + ' ' + c.H);
    }
    /* data -> pixel and pixel -> data */
    c.X = function (x) { return m.l + (x - opt.xmin) / (opt.xmax - opt.xmin) * c.pw; };
    c.Y = function (y) { return m.t + c.ph - (y - opt.ymin) / (opt.ymax - opt.ymin) * c.ph; };
    c.x = function (px) { return opt.xmin + (px - m.l) / c.pw * (opt.xmax - opt.xmin); };
    c.y = function (py) { return opt.ymin + (m.t + c.ph - py) / c.ph * (opt.ymax - opt.ymin); };

    function txt(parent, x, y, s, cls, anchor, extra) {
      var t = mk('text', Object.assign({ x: x, y: y, class: cls || '', 'text-anchor': anchor || 'middle' }, extra || {}), parent);
      t.textContent = s;
      return t;
    }

    function axes() {
      var g = mk('g', { class: 'axes' }, svg);
      var xs = opt.xstep || niceStep(opt.xmax - opt.xmin, opt.xticks);
      var ys = opt.ystep || niceStep(opt.ymax - opt.ymin, opt.yticks);
      var v;
      for (v = opt.xmin; v <= opt.xmax + 1e-9; v += xs) {
        mk('line', { class: 'grid', x1: c.X(v), x2: c.X(v), y1: c.Y(opt.ymin), y2: c.Y(opt.ymax) }, g);
        if (opt.xtickLabels) txt(g, c.X(v), c.Y(opt.ymin) + 17, opt.xfmt(v), 'tick', 'middle');
      }
      for (v = opt.ymin; v <= opt.ymax + 1e-9; v += ys) {
        mk('line', { class: 'grid', x1: c.X(opt.xmin), x2: c.X(opt.xmax), y1: c.Y(v), y2: c.Y(v) }, g);
        if (opt.ytickLabels) txt(g, c.X(opt.xmin) - 8, c.Y(v) + 4, opt.yfmt(v), 'tick', 'end');
      }
      mk('line', { class: 'axis', x1: c.X(opt.xmin), x2: c.X(opt.xmax), y1: c.Y(opt.ymin), y2: c.Y(opt.ymin) }, g);
      mk('line', { class: 'axis', x1: c.X(opt.xmin), x2: c.X(opt.xmin), y1: c.Y(opt.ymin), y2: c.Y(opt.ymax) }, g);
      if (opt.xlabel) txt(g, m.l + c.pw / 2, c.H - 8, opt.xlabel, 'axis-title', 'middle');
      if (opt.ylabel) {
        var yy = m.t + c.ph / 2;
        txt(g, 14, yy, opt.ylabel, 'axis-title', 'middle', { transform: 'rotate(-90 14 ' + yy + ')' });
      }
    }

    /* ---------- drawing primitives (all in DATA coordinates) ---------- */
    function pathD(pts) {
      return pts.map(function (p, i) { return (i ? 'L' : 'M') + c.X(p[0]).toFixed(1) + ' ' + c.Y(p[1]).toFixed(1); }).join('');
    }
    function addPath(d, cls, o2) {
      var p = mk('path', { d: d, class: cls }, c.g);
      if (o2 && o2.drag) mk('path', { d: d, class: 'ln hit', 'data-drag': o2.drag }, c.g);
      return p;
    }
    /* y = fn(x) sampled; pieces outside the y-range are dropped */
    c.curve = function (fn, x0, x1, cls, o2) {
      var n = (o2 && o2.n) || 160, d = '', pen = false;
      for (var i = 0; i <= n; i++) {
        var x = x0 + (x1 - x0) * i / n, y = fn(x);
        if (!isFinite(y) || y < opt.ymin - 1e-9 || y > opt.ymax + 1e-9) { pen = false; continue; }
        d += (pen ? 'L' : 'M') + c.X(x).toFixed(1) + ' ' + c.Y(y).toFixed(1);
        pen = true;
      }
      return addPath(d, 'ln ' + cls, o2);
    };
    /* straight line clipped to the plot box (Liang–Barsky) */
    c.line = function (x1, y1, x2, y2, cls, o2) {
      var dx = x2 - x1, dy = y2 - y1, t0 = 0, t1 = 1;
      var p = [-dx, dx, -dy, dy];
      var q = [x1 - opt.xmin, opt.xmax - x1, y1 - opt.ymin, opt.ymax - y1];
      for (var i = 0; i < 4; i++) {
        if (Math.abs(p[i]) < 1e-12) { if (q[i] < 0) return null; }
        else {
          var r = q[i] / p[i];
          if (p[i] < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
          else { if (r < t0) return null; if (r < t1) t1 = r; }
        }
      }
      return addPath(pathD([[x1 + t0 * dx, y1 + t0 * dy], [x1 + t1 * dx, y1 + t1 * dy]]), 'ln ' + cls, o2);
    };
    c.pline = function (pts, cls, o2) { return addPath(pathD(pts), 'ln ' + cls, o2); };
    c.poly = function (pts, cls) { return mk('path', { d: pathD(pts) + 'Z', class: 'fill ' + cls }, c.g); };
    c.rect = function (x1, y1, x2, y2, cls) { return c.poly([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], cls); };
    c.dot = function (x, y, cls, r) { return mk('circle', { cx: c.X(x), cy: c.Y(y), r: r || 5.5, class: 'dot ' + cls }, c.g); };
    /* label: x,y in data coords; dx,dy pixel nudges */
    c.text = function (x, y, s, cls, o2) {
      o2 = o2 || {};
      return txt(c.g, c.X(x) + (o2.dx || 0), c.Y(y) + (o2.dy || 0), s, 'lbl ' + (cls || ''), o2.anchor || 'middle');
    };
    /* dashed drop-lines to both axes with value tags */
    c.drop = function (x, y, xs, ys, cls) {
      c.line(x, y, x, opt.ymin, 'drop');
      c.line(x, y, opt.xmin, y, 'drop');
      if (xs != null) c.text(x, opt.ymin, xs, 'soft', { dy: -7 });
      if (ys != null) c.text(opt.xmin, y, ys, 'soft', { dx: 6, dy: -6, anchor: 'start' });
    };
    c.handle = function (id, x, y, cls) {
      var gg = mk('g', { class: 'handle ' + (cls || ''), 'data-drag': id, transform: 'translate(' + c.X(x) + ',' + c.Y(y) + ')' }, c.g);
      mk('circle', { class: 'hit', r: 20 }, gg);
      mk('circle', { class: 'knob', r: 8 }, gg);
      return gg;
    };

    /* ---------- dragging (event delegation; survives redraws) ---------- */
    function pt(e) {
      var r = svg.getBoundingClientRect();
      var px = (e.clientX - r.left) * (c.W / r.width), py = (e.clientY - r.top) * (c.H / r.height);
      return { x: c.x(px), y: c.y(py), px: px, py: py };
    }
    svg.addEventListener('pointerdown', function (e) {
      var t = e.target.closest ? e.target.closest('[data-drag]') : null;
      if (!t) return;
      c.drag = t.getAttribute('data-drag');
      c.start = pt(e);
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      svg.classList.add('dragging');
      if (c.onDragStart) c.onDragStart(c.drag, c.start);
      e.preventDefault();
    });
    svg.addEventListener('pointermove', function (e) {
      if (!c.drag) return;
      var p = pt(e);
      if (c.onDrag) c.onDrag(c.drag, p.x, p.y, c.start, p);
    });
    function end() {
      if (!c.drag) return;
      c.drag = null; svg.classList.remove('dragging');
      if (c.onDragEnd) c.onDragEnd();
    }
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);

    /* ---------- draw / resize ---------- */
    c.draw = function () {
      layout();
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      axes();
      c.g = mk('g', { class: 'dyn' }, svg);
      if (c.render) c.render(c);
    };
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        if (Math.abs((host.clientWidth || 600) - c.W) > 1) c.draw();
      }).observe(host);
    }
    layout();
    return c;
  }

  /* ---------- HTML controls ---------- */
  function el(tag, cls, html, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  }
  var uid = 0;
  function slider(host, o) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    var id = 'tr-sl-' + (++uid);
    var wrap = el('div', 'ctl', null, host);
    wrap.innerHTML = '<label for="' + id + '"><span>' + o.label + '</span><output></output></label>' +
      '<input id="' + id + '" type="range" min="' + o.min + '" max="' + o.max + '" step="' + (o.step || 1) + '" value="' + o.value + '">' +
      (o.hint ? '<small>' + o.hint + '</small>' : '');
    var inp = wrap.querySelector('input'), out = wrap.querySelector('output');
    var f = o.fmt || function (v) { return v; };
    function show() { out.textContent = f(+inp.value); }
    inp.addEventListener('input', function () { show(); if (o.onInput) o.onInput(+inp.value); });
    show();
    return {
      el: wrap, input: inp,
      get: function () { return +inp.value; },
      set: function (v) { inp.value = v; show(); },
      hide: function (b) { wrap.hidden = !!b; },
      setLabel: function (s) { wrap.querySelector('label span').textContent = s; },
      setRange: function (min, max) { inp.min = min; inp.max = max; }
    };
  }
  /* segmented buttons: opts = [[value,label],...] */
  function seg(host, opts, value, onChange) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    var wrap = el('div', 'seg', null, host), cur = value;
    wrap.setAttribute('role', 'group');
    var btns = opts.map(function (op) {
      var b = el('button', null, op[1], wrap);
      b.type = 'button';
      b.addEventListener('click', function () { api.set(op[0]); if (onChange) onChange(op[0]); });
      return b;
    });
    var api = {
      get: function () { return cur; },
      set: function (v) { cur = v; btns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(opts[i][0] === v)); }); },
      setLabels: function (labels) { btns.forEach(function (b, i) { b.textContent = labels[i]; }); }
    };
    api.set(value);
    return api;
  }
  /* Who is the tax / subsidy imposed on?  'N' = net effect only (nothing specific, no curve shifts),
     'D' = the demand side (consumers / buyers / employers), 'S' = the supply side (producers / sellers / workers).
     Call .setKind(isTax) to relabel the buttons "Tax ..." or "Subsidy ...". */
  function payer(host, value, onChange, opts) {
    opts = opts || {};
    host = typeof host === 'string' ? document.querySelector(host) : host;
    var box = el('div', 'ctl', null, host), dName = opts.dName || 'consumers (C)', sName = opts.sName || 'producers (P)';
    box.innerHTML = '<p class="ctl-title" style="margin:0 0 8px">' + (opts.title || 'Who is it imposed on?') + '</p>';
    var api = seg(box, [['N', 'Net effect only'], ['D', 'To ' + dName], ['S', 'To ' + sName]], value, onChange);
    api.kindTax = true;
    api.setKind = function (isTax) {
      if (api.kindTax === isTax && api.labeled) return;
      api.kindTax = isTax; api.labeled = true;
      var w = isTax ? 'Tax' : 'Subsidy';
      api.setLabels([w + ' (net effect only)', w + ' to ' + dName, w + ' to ' + sName]);
    };
    api.setKind(true);
    api.el = box; api.hide = function (b) { box.hidden = !!b; };
    return api;
  }
  function button(host, label, onClick, cls) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    var b = el('button', 'btn ' + (cls || ''), label, host);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }
  /* rows: [label, value, cssClass?] */
  function stats(host, rows) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    host.className = (host.className.replace(/\bstats\b/, '') + ' stats').trim();
    host.innerHTML = rows.map(function (r) {
      return '<div class="stat ' + (r[2] || '') + '"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>';
    }).join('');
  }
  function message(host, text, kind) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    host.className = 'msg ' + (kind || '');
    host.innerHTML = text;
  }
  /* items: [cssClass, label, extra?]  e.g. ['demand','Demand'] ['box demand','Consumer surplus'] */
  function legend(host, items) {
    host = typeof host === 'string' ? document.querySelector(host) : host;
    host.className = 'legend';
    host.innerHTML = items.map(function (i) { return '<span><i class="sw ' + i[0] + '"></i>' + i[1] + '</span>'; }).join('');
  }

  global.TR = {
    chart: chart, slider: slider, seg: seg, payer: payer, button: button, stats: stats, message: message, legend: legend,
    clamp: clamp, fmt: fmt, money: money, bisect: bisect, el: el
  };
})(window);
