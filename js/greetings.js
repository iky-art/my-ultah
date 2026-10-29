(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  var items = Store.get('greetings', []), pending = null, st = $('gr-status');
  // A greeting arrives as #g=<code>. Take it out of the address bar right away so it never stays in history.
  if (location.hash.indexOf('#g=') === 0) { pending = location.hash; try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }

  function say(m, c) { st.textContent = m; st.className = 'status ' + (c || ''); }
  function copy(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
    return new Promise(function (res, rej) {
      var a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} a.remove(); ok ? res() : rej();
    });
  }
  function parse(s) {
    var m = String(s).match(/g=([A-Za-z0-9_-]+)/), code = m ? m[1] : String(s).replace(/\s/g, '');
    if (!/^[A-Za-z0-9_-]{8,4000}$/.test(code)) return null;
    var b = code.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
    try {
      var o = JSON.parse(decodeURIComponent(escape(atob(b))));
      if (!o || o.v !== 1 || typeof o.n !== 'string' || typeof o.m !== 'string') return null;
      var n = o.n.trim().slice(0, 40), msg = o.m.trim().slice(0, 500); if (!n || !msg) return null;
      return { n: n, m: msg, d: /^\d{4}-\d{2}-\d{2}$/.test(o.d) ? o.d : new Date().toISOString().slice(0, 10) };
    } catch (e) { return null; }
  }
  function add(s) {
    var g = parse(s); if (!g) return false;
    var dup = items.some(function (x) { return x.n === g.n && x.m === g.m && x.d === g.d; });
    if (!dup) { g.id = Date.now() + Math.random(); items.push(g); items = items.slice(-200); if (!Store.set('greetings', items)) return 'fail'; }
    return true;
  }
  function render() {
    var box = $('gr-list'); box.textContent = '';
    if (!items.length) { var e = document.createElement('p'); e.className = 'empty'; e.textContent = t('No greetings yet. When someone sends one, it will appear here.'); box.appendChild(e); return; }
    items.slice().reverse().forEach(function (g) {
      var a = document.createElement('article'), h = document.createElement('h3'), mt = document.createElement('p'), p = document.createElement('p'), r = document.createElement('div'), x = document.createElement('button');
      a.className = 'entry'; h.textContent = g.n; mt.className = 'meta'; mt.textContent = g.d; p.textContent = g.m; r.className = 'row';
      x.type = 'button'; x.className = 'btn'; x.textContent = t('Delete');
      x.onclick = function () { if (confirm(t('Delete this entry? This cannot be undone.'))) { items = items.filter(function (z) { return z.id !== g.id; }); Store.set('greetings', items); render(); } };
      r.appendChild(x); a.appendChild(h); a.appendChild(mt); a.appendChild(p); a.appendChild(r); box.appendChild(a);
    });
  }
  function report(r) {
    if (r === true) say(t('Greeting added.'), 'good');
    else if (r === 'fail') say(t('Could not save. Browser storage is full or blocked; download a backup and free some space.'), 'bad');
    else say(t('That link or code is not a valid greeting.'), 'bad');
  }
  $('gr-add').addEventListener('click', function () { var r = add($('gr-in').value); if (r === true) $('gr-in').value = ''; render(); report(r); });
  $('gr-copy').addEventListener('click', function () {
    var u = new URL('greet.html', location.href).href;
    copy(u).then(function () { say(t('Link copied.'), 'good'); }, function () { say(u, ''); });
  });
  window.onUnlock = function () {
    if (!pending) return;
    var r = add(pending); pending = null;
    document.body.classList.remove('locked'); Store.set('entered', 1); render();
    var b = document.querySelector('.tabs [data-go=greetings]'); if (b) b.click();
    report(r);
  };
  var prev = window.onLang;
  window.onLang = function () { if (prev) prev(); render(); };
  render();
})();
