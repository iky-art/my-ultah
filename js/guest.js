(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  function pad(x) { return x < 10 ? '0' + x : '' + x; }

  // Countdown to midnight April 4, 2027 (UTC+7), same rule as the main page
  var START = Date.UTC(2027, 3, 3, 17, 0, 0), END = START + 864e5, timer = $('timer'), unit = timer.querySelector('span'), cmsg = $('c-msg');
  function tick() {
    var now = Date.now();
    if (now < START) {
      var s = Math.floor((START - now) / 1000);
      timer.className = 'timer'; unit.textContent = t('days');
      $('c-d').textContent = Math.floor(s / 86400); $('c-h').textContent = pad(Math.floor(s % 86400 / 3600));
      $('c-m').textContent = pad(Math.floor(s % 3600 / 60)); $('c-s').textContent = pad(s % 60);
      cmsg.textContent = t('Your day has not arrived yet.');
    } else if (now < END) {
      timer.className = 'timer done'; $('c-d').textContent = t('Today'); unit.textContent = '';
      cmsg.textContent = t('It is April 4. Happy birthday, Iky.');
    } else {
      timer.className = 'timer done'; $('c-d').textContent = Math.floor((now - START) / 864e5);
      unit.textContent = t('day(s) since your birthday'); cmsg.textContent = t('Your day has passed. It still belongs to you.');
    }
  }
  tick(); setInterval(tick, 1000);

  // The greeting lives only inside the link. Nothing is uploaded.
  var st = $('g-status'), link = $('g-link'), out = $('g-out');
  function say(m, c) { st.textContent = m; st.className = 'status ' + (c || ''); }
  function enc(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function copy(txt) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
    return new Promise(function (res, rej) {
      var a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} a.remove(); ok ? res() : rej();
    });
  }
  if (!navigator.share) $('g-share').hidden = true;
  $('g-make').addEventListener('click', function () {
    var n = $('g-name').value.trim(), m = $('g-msg').value.trim();
    if (!n || !m) { out.hidden = true; say(t('Write your name and a greeting first.'), 'bad'); return; }
    var code = enc({ v: 1, n: n.slice(0, 40), m: m.slice(0, 500), d: new Date().toISOString().slice(0, 10) });
    link.value = new URL('index.html', location.href).href.split('#')[0] + '#g=' + code;
    out.hidden = false; say('');
  });
  $('g-copy').addEventListener('click', function () {
    copy(link.value).then(function () { say(t('Link copied.'), 'good'); }, function () { link.focus(); link.select(); });
  });
  $('g-share').addEventListener('click', function () { try { navigator.share({ url: link.value }); } catch (e) {} });
  var prev = window.onLang; window.onLang = function () { if (prev) prev(); tick(); };
})();
