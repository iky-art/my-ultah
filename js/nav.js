(function () {
  'use strict';
  var ids = ['countdown', 'letter', 'archive', 'wish', 'greetings', 'closing'];
  var tabs = document.querySelectorAll('.tabs button');
  function show(id, focus) {
    if (ids.indexOf(id) < 0) id = 'countdown';
    ids.forEach(function (s) { document.getElementById(s).classList.toggle('on', s === id); });
    tabs.forEach(function (b) { var on = b.getAttribute('data-go') === id; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    try { sessionStorage.setItem('iky27:tab', id); } catch (e) {}
    window.scrollTo(0, 0);
    if (focus) { var h = document.getElementById(id).querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-go'), true); }); });
  document.getElementById('enter').addEventListener('click', function () { show('countdown', true); });
  var start = 'countdown'; try { start = sessionStorage.getItem('iky27:tab') || start; } catch (e) {}
  show(start, false);
})();
