/* Dial PIN: putar dial, lepas untuk memilih angka. API: Dial.init/setLen/fill/show/clear/state/ok/err/nudge/pickNow */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', wrap = document.getElementById('dialw');
  function mk(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function P(r, d) { var q = d * Math.PI / 180; return [r * Math.sin(q), -r * Math.cos(q)]; }
  function arc(r, a, b) { var p = P(r, a), q = P(r, b); return 'M' + p[0] + ' ' + p[1] + 'A' + r + ' ' + r + ' 0 0 1 ' + q[0] + ' ' + q[1]; }

  var svg = mk('svg', { viewBox: '-300 -300 600 600', 'aria-hidden': 'true' }, wrap);
  var base = mk('g', {}, svg), fl = mk('g', {}, svg), rot = mk('g', { 'class': 'd-rot' }, svg), spin = mk('g', { 'class': 'd-spin' }, rot);
  mk('circle', { r: 245, 'class': 'd-disc' }, spin);
  var tk = mk('g', { 'class': 'd-tk' }, spin), nums = [], i, a, p, q;
  for (i = 0; i < 100; i++) { a = i * 3.6; p = P(222, a); q = P(232, a); mk('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], 'class': 'f' }, tk); }
  for (i = 0; i < 50; i++) { if (i % 5 === 0) continue; a = i * 7.2; p = P(200, a); q = P(212, a); mk('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], 'class': 'm' }, tk); }
  for (i = 0; i < 10; i++) {
    a = i * 36; p = P(182, a); q = P(212, a); mk('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], 'class': 'M' }, tk);
    var tx = mk('text', { transform: 'rotate(' + a + ') translate(0,-150)', y: 10, 'class': 'd-n' }, spin); tx.textContent = i; nums.push(tx);
  }
  mk('circle', { r: 76, 'class': 'd-well' }, svg);
  mk('rect', { x: -14, y: -2.5, width: 28, height: 5, rx: 2.5, 'class': 'd-dash' }, svg);
  var cd = mk('text', { y: 26, 'class': 'd-cd' }, svg); cd.textContent = '0';
  mk('path', { d: 'M-34 4L-10 28L36 -26', 'class': 'd-chk' }, svg);
  mk('polygon', { points: '-17,-283 17,-283 0,-250', 'class': 'd-ptr' }, svg);

  var len = 6, cur = 0, last = 0, dragging = false, a0 = 0, dwell = null, opts = {}, arcs = [];
  function can() { return !opts.canTurn || opts.canTurn(); }
  function digitAt(r) { return ((Math.round(-r / 36) % 10) + 10) % 10; }
  function setRot(r) { cur = r; rot.style.transform = 'rotate(' + r + 'deg)'; }
  function hl(d) { nums.forEach(function (n, k) { n.setAttribute('class', 'd-n' + (k === d ? ' on' : '')); }); }
  function show(d) { if (d == null) { wrap.classList.remove('has'); hl(-1); return; } cd.textContent = d; wrap.classList.add('has'); hl(d); }
  function fill(n) { arcs.forEach(function (e, k) { e.setAttribute('class', 'd-f' + (k < n ? ' on' : '')); }); }
  function setLen(n) {
    len = n; base.textContent = ''; fl.textContent = ''; arcs = [];
    var seg = 360 / n, g = n > 1 ? 3.5 : 0;
    for (var k = 0; k < n; k++) {
      var d = arc(270, k * seg + g, (k + 1) * seg - g);
      mk('path', { d: d, 'class': 'd-b' }, base);
      arcs.push(mk('path', { d: d, 'class': 'd-f', pathLength: 100 }, fl));
    }
  }
  function ang(e) { var b = wrap.getBoundingClientRect(); return Math.atan2(e.clientX - (b.left + b.width / 2), -(e.clientY - (b.top + b.height / 2))) * 180 / Math.PI; }
  function schedule(delay) { clearTimeout(dwell); dwell = setTimeout(pick, delay == null ? 650 : delay); }
  function pick() { clearTimeout(dwell); dwell = null; if (!can()) return; var d = digitAt(cur); show(d); if (opts.onPick) opts.onPick(d); }

  wrap.addEventListener('pointerdown', function (e) {
    if (!can()) return;
    if (window.Sound && Sound.unlock) Sound.unlock();
    dragging = true; a0 = ang(e); clearTimeout(dwell); wrap.classList.add('drag');
    try { wrap.setPointerCapture(e.pointerId); } catch (x) {}
    last = digitAt(cur); show(last);
  });
  wrap.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var n = ang(e), d = n - a0; if (d > 180) d -= 360; if (d < -180) d += 360; a0 = n;
    setRot(cur + d); var k = digitAt(cur);
    if (k !== last) { last = k; show(k); if (opts.onStep) opts.onStep(k); }
  });
  function up() {
    if (!dragging) return; dragging = false; wrap.classList.remove('drag');
    setRot(Math.round(cur / 36) * 36); show(digitAt(cur)); schedule();
  }
  wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);

  window.Dial = {
    init: function (o) { opts = o || {}; },
    setLen: setLen, fill: fill, show: show,
    clear: function () { clearTimeout(dwell); dwell = null; show(null); setRot(0); last = 0; },
    state: function (s) { wrap.setAttribute('data-state', s || ''); },
    ok: function (cb) { clearTimeout(dwell); this.state('ok'); fill(len); setTimeout(function () { if (cb) cb(); }, 950); },
    err: function (cb) {
      var self = this; clearTimeout(dwell); this.state('err'); fill(len);
      setTimeout(function () { self.state(''); self.clear(); fill(0); if (cb) cb(); }, 850);
    },
    nudge: function (dir) { if (!can()) return; setRot(Math.round(cur / 36) * 36 - dir * 36); last = digitAt(cur); show(last); if (opts.onStep) opts.onStep(last); schedule(); },
    pickNow: function () { if (can() && wrap.classList.contains('has')) pick(); }
  };
})();
