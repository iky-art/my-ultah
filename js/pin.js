(function () {
  'use strict';
  var body = document.body, $ = function (i) { return document.getElementById(i); };
  var LEN = 6, N, buf = '', first = '', mode, busy = false, fails = 0, changing = false;
  var dotsEl = $('pin-dots'), msg = $('pin-msg'), title = $('pin-t'), sub = $('pin-sub'), flashing = false;
  Dial.init({ canTurn: function () { return !busy && !flashing; }, onPick: function (d) { press(String(d)); }, onStep: function () { Sound.step(); } });

  function unlock() {
    body.classList.remove('pinlock');
    if (window.onUnlock) window.onUnlock();
    try { (body.classList.contains('locked') ? $('enter') : document.querySelector('.screen.on h2')).focus({ preventScroll: true }); } catch (e) {}
  }
  if (!Store.ok()) { $('pin-change').hidden = true; unlock(); return; } // nothing can be saved, so a PIN would protect nothing

  // SHA-256 when the browser allows it (secure context), plus a weak fallback hash otherwise.
  function hash(p, salt) {
    var s = salt + ':' + p, h = 5381, i;
    for (i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    var d = 'd' + h;
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (b) {
        return { sha: Array.from(new Uint8Array(b)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''), d: d };
      }, function () { return { sha: null, d: d }; });
    }
    return Promise.resolve({ sha: null, d: d });
  }
  function verify(p) {
    var r = Store.get('pin', null); if (!r) return Promise.resolve(false);
    return hash(p, r.salt).then(function (x) { return (r.h && x.sha) ? x.sha === r.h : x.d === r.d; });
  }
  function curLen() { var r = Store.get('pin', null); return r ? (r.n || 4) : LEN; } // PINs made before v2 have 4 digits
  function build() { Dial.setLen(N); dotsEl.textContent = ''; for (var i = 0; i < N; i++) dotsEl.appendChild(document.createElement('i')); }

  N = curLen(); mode = Store.get('pin', null) ? 'enter' : 'create'; build();
  function render() {
    var k = mode === 'create' ? 'Create a PIN' : mode === 'confirm' ? 'Confirm your PIN' : mode === 'old' ? 'Enter your current PIN' : 'Enter your PIN';
    title.textContent = t(k);
    sub.textContent = t('Choose 6 digits to lock this letter on this device.'); sub.hidden = (mode === 'enter' || mode === 'old');
    if (!flashing) Dial.fill(buf.length);
    var d = dotsEl.children; for (var i = 0; i < d.length; i++) d[i].className = i < buf.length ? 'on' : '';
    $('pin-back').setAttribute('aria-label', t('Delete digit'));
  }
  function bad(key) { Sound.bad(); buf = ''; msg.className = 'status bad'; msg.textContent = t(key); flashing = true; render(); Dial.err(function () { flashing = false; render(); }); }
  function submit() {
    if (mode === 'create') { first = buf; buf = ''; mode = 'confirm'; Dial.clear(); render(); return; }
    if (mode === 'confirm') {
      if (buf !== first) { first = ''; mode = 'create'; bad('PINs do not match. Try again.'); return; }
      var salt = Math.random().toString(36).slice(2) + Date.now().toString(36), len = N;
      busy = true; Dial.state('spin');
      hash(buf, salt).then(function (x) { Store.set('pin', { salt: salt, h: x.sha, d: x.d, n: len }); Sound.ok(); Dial.ok(function () { busy = false; changing = false; unlock(); }); });
      return;
    }
    busy = true; Dial.state('spin');
    Promise.all([verify(buf), new Promise(function (r) { setTimeout(r, 380); })]).then(function (res) {
      var ok = res[0]; Dial.state('');
      if (ok) {
        fails = 0; Sound.ok();
        if (changing) { busy = false; mode = 'create'; N = LEN; buf = ''; first = ''; build(); Dial.clear(); render(); return; }
        Dial.ok(function () { busy = false; unlock(); }); return;
      }
      fails++;
      if (fails >= 5) { bad('Too many tries. Wait a moment.'); setTimeout(function () { busy = false; fails = 0; msg.textContent = ''; }, 30000); }
      else { busy = false; bad('Wrong PIN. Try again.'); }
    });
  }
  function press(d) { if (busy || flashing || buf.length >= N) return; Sound.lock(); buf += d; msg.textContent = ''; render(); if (buf.length === N) setTimeout(submit, 140); }
  function back() { if (busy || flashing || !buf) return; Sound.back(); buf = buf.slice(0, -1); Dial.show(null); render(); }

  $('pin-back').addEventListener('click', back);
  document.addEventListener('keydown', function (e) {
    if (!body.classList.contains('pinlock')) return;
    var onBtn = e.target.closest && e.target.closest('button,select');
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') Dial.nudge(1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') Dial.nudge(-1);
    else if ((e.key === 'Enter' || e.key === ' ') && !onBtn) { e.preventDefault(); Dial.pickNow(); }
    else if (e.key === 'Backspace') back();
  });
  $('pin-forgot').addEventListener('click', function () {
    if (confirm(t('Erase everything on this device') + '?')) { Store.wipe(); location.reload(); }
  });
  $('pin-change').addEventListener('click', function () {
    changing = true; mode = 'old'; N = curLen(); buf = ''; first = ''; busy = false; msg.textContent = ''; Dial.clear();
    body.classList.add('pinlock'); build(); render(); window.scrollTo(0, 0);
  });

  var prev = window.onLang;
  window.onLang = function () { if (prev) prev(); render(); };
  render();
})();
