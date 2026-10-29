(function () {
  'use strict';
  var L = window.LANGS, root = document.documentElement, D = {}, lang = 'en';
  Object.keys(L.T).forEach(function (l) {
    D[l] = {}; L.E.forEach(function (k, i) { D[l][k] = L.T[l][i]; });
    D[l][CONTENT.sampleOpening] = L.S[l];
  });
  window.t = function (s) { var d = D[lang]; return (d && d[s]) || s; };
  var sel = document.getElementById('lang'), tb = document.getElementById('theme');
  L.NAMES.forEach(function (n) { var o = document.createElement('option'); o.value = n[0]; o.textContent = n[1]; sel.appendChild(o); });

  // Tag every static element whose English text is a translation key
  document.querySelectorAll('main *, .tabs *').forEach(function (e) {
    if (e.id === 'opening-text' || e.id === 'pin-t' || e.id === 'pin-sub') return;
    if (!e.children.length) { var s = e.textContent.trim(); if (s && D.id.hasOwnProperty(s)) e.setAttribute('data-en', s); }
    var p = e.getAttribute('placeholder'); if (p && D.id.hasOwnProperty(p)) e.setAttribute('data-en-ph', p);
  });

  function apply() {
    document.querySelectorAll('[data-en]').forEach(function (e) { e.textContent = t(e.getAttribute('data-en')); });
    document.querySelectorAll('[data-en-ph]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-en-ph')); });
    var ds; try { ds = new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2027, 3, 4, 12))); } catch (x) { ds = 'April 4, 2027'; }
    document.querySelectorAll('.date').forEach(function (e) { e.textContent = ds; });
    sel.value = lang; sel.setAttribute('aria-label', t('Language')); tb.setAttribute('aria-label', t('Switch theme')); var sb = document.getElementById('snd'); if (sb) sb.setAttribute('aria-label', t('Sound'));
  }
  function setLang(l, save) {
    lang = D[l] ? l : 'en'; root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (save) Store.set('lang', lang);
    apply(); if (save && window.onLang) window.onLang();
  }
  sel.addEventListener('change', function () { setLang(sel.value, true); });

  function meta(th) { var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = th === 'light' ? '#e9e6f2' : '#262a36'; }
  tb.addEventListener('click', function () {
    var th = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', th); Store.set('theme', th); meta(th);
  });
  meta(root.getAttribute('data-theme') || 'dark');

  var g = (navigator.language || 'en').slice(0, 2);
  setLang(Store.get('lang', null) || g, false);
})();
