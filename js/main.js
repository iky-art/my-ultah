(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = {};
  function say(el, msg, cls) { el.textContent = msg; el.className = 'status ' + (cls || ''); }
  function saved(el, key, msg) { clearTimeout(timers[key]); say(el, msg, 'good'); timers[key] = setTimeout(function () { say(el, ''); }, 3500); }
  function fail(el) { say(el, t('Could not save. Browser storage is full or blocked; download a backup and free some space.'), 'bad'); }

  var sky = $('sky');
  for (var i = 0; i < 45; i++) {
    var s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%';
    s.style.opacity = (0.2 + Math.random() * 0.5).toFixed(2);
    if (!reduce) { s.style.animationDelay = (-Math.random() * 6).toFixed(1) + 's'; s.style.animationDuration = (4 + Math.random() * 6).toFixed(1) + 's'; }
    sky.appendChild(s);
  }

  if (!Store.ok()) say($('own-status'), t('Could not save. Browser storage is full or blocked; download a backup and free some space.'), 'bad');

  $('enter').addEventListener('click', function () {
    document.body.classList.remove('locked');
    Store.set('entered', 1);
    $('countdown').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    $('t-count').setAttribute('tabindex', '-1'); $('t-count').focus({ preventScroll: true });
  });
  if (Store.get('entered', 0)) document.body.classList.remove('locked');

  // Countdown to midnight April 4, 2027 at UTC+7 (Western Indonesia Time)
  var START = Date.UTC(2027, 3, 3, 17, 0, 0), END = START + 864e5;
  var timer = $('timer'), cmsg = $('c-msg'), unit = timer.querySelector('span');
  function pad(x) { return x < 10 ? '0' + x : '' + x; }
  function tick() {
    var now = Date.now();
    if (now < START) {
      var secs = Math.floor((START - now) / 1000);
      timer.className = 'timer'; unit.textContent = t('days');
      $('c-d').textContent = Math.floor(secs / 86400);
      $('c-h').textContent = pad(Math.floor(secs % 86400 / 3600));
      $('c-m').textContent = pad(Math.floor(secs % 3600 / 60));
      $('c-s').textContent = pad(secs % 60);
      cmsg.textContent = t('Your day has not arrived yet.');
    } else if (now < END) {
      timer.className = 'timer done'; $('c-d').textContent = t('Today'); unit.textContent = '';
      cmsg.textContent = t('It is April 4. Happy birthday, Iky.');
    } else {
      var d = Math.floor((now - START) / 864e5);
      timer.className = 'timer done'; $('c-d').textContent = d;
      unit.textContent = t('day(s) since your birthday');
      cmsg.textContent = t('Your day has passed. It still belongs to you.');
    }
  }
  tick(); setInterval(tick, 1000);

  var ot = $('opening-text'), opEdit = $('op-edit'), opSave = $('op-save'), opReset = $('op-reset'), opSt = $('op-status'), tag = document.querySelector('#letter .tag');
  function showOpening() {
    var v = Store.get('opening', null);
    ot.textContent = v === null ? t(CONTENT.sampleOpening) : v;
    tag.textContent = v === null ? t('Sample opening. Rewrite it in your own words.') : t('Your opening, edited by you.');
  }
  function editing(on) { ot.contentEditable = on; ot.tabIndex = on ? 0 : -1; opEdit.hidden = on; opSave.hidden = !on; opReset.hidden = !on; if (on) ot.focus(); }
  showOpening();
  opEdit.onclick = function () { editing(true); };
  opSave.onclick = function () {
    var v = ot.innerText.trim();
    if (!v) return say(opSt, t('Please write something first.'), 'bad');
    if (Store.set('opening', v)) { editing(false); showOpening(); saved(opSt, 'op', t('Saved on this device.')); } else fail(opSt);
  };
  opReset.onclick = function () { Store.del('opening'); editing(false); showOpening(); saved(opSt, 'op', t('Saved on this device.')); };

  var own = $('own'), ownSt = $('own-status'), ownT;
  own.value = Store.get('own', '');
  own.addEventListener('input', function () {
    clearTimeout(ownT); say(ownSt, t('Writing...'));
    ownT = setTimeout(function () { if (Store.set('own', own.value)) saved(ownSt, 'own', t('Saved on this device.')); else fail(ownSt); }, 600);
  });

  var items = Store.get('archive', []), photo = '';
  var f = { id: $('a-id'), kind: $('a-kind'), title: $('a-title'), date: $('a-date'), text: $('a-text'), file: $('a-photo'), prev: $('a-prev'), save: $('a-save'), cancel: $('a-cancel'), st: $('a-status') };
  function persist() { return Store.set('archive', items); }
  function resetForm() { f.id.value = ''; f.title.value = ''; f.date.value = ''; f.text.value = ''; f.file.value = ''; photo = ''; f.prev.hidden = true; f.save.textContent = t('Add to archive'); f.cancel.hidden = true; }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }
  function render() {
    var box = $('a-list'); box.textContent = '';
    if (!items.length) { box.appendChild(el('p', t('Nothing here yet. Add the first thing worth remembering: a person, a project, a night that mattered.'), 'empty')); return; }
    items.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || '') || b.id - a.id; }).forEach(function (it) {
      var d = el('article', '', 'entry');
      d.appendChild(el('h3', it.title));
      d.appendChild(el('p', t(it.kind) + (it.date ? ' · ' + it.date : ''), 'meta'));
      if (it.photo) { var im = el('img'); im.src = it.photo; im.alt = it.title; d.appendChild(im); }
      if (it.text) d.appendChild(el('p', it.text));
      var r = el('div', '', 'row'), e = el('button', t('Edit'), 'btn'), x = el('button', t('Delete'), 'btn');
      e.type = x.type = 'button'; e.setAttribute('aria-label', t('Edit') + ' ' + it.title); x.setAttribute('aria-label', t('Delete') + ' ' + it.title);
      e.onclick = function () { f.id.value = it.id; f.kind.value = it.kind; f.title.value = it.title; f.date.value = it.date || ''; f.text.value = it.text || ''; photo = it.photo || ''; f.prev.hidden = !photo; if (photo) f.prev.src = photo; f.save.textContent = t('Save changes'); f.cancel.hidden = false; f.title.focus(); };
      x.onclick = function () { if (confirm(t('Delete this entry? This cannot be undone.'))) { items = items.filter(function (z) { return z.id !== it.id; }); persist(); render(); say(f.st, t('Saved on this device.'), 'good'); } };
      r.appendChild(e); r.appendChild(x); d.appendChild(r); box.appendChild(d);
    });
  }
  f.file.addEventListener('change', function () {
    var file = f.file.files[0]; if (!file) return;
    var rd = new FileReader();
    rd.onerror = function () { say(f.st, t('That photo could not be read. Try another.'), 'bad'); };
    rd.onload = function () {
      var img = new Image();
      img.onerror = function () { say(f.st, t('That photo could not be read. Try another.'), 'bad'); };
      img.onload = function () {
        var sc = Math.min(1, 720 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        photo = c.toDataURL('image/jpeg', 0.7); f.prev.src = photo; f.prev.hidden = false; say(f.st, '');
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
  $('a-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var ttl = f.title.value.trim(); if (!ttl) return say(f.st, t('Please write something first.'), 'bad');
    var backup = items.slice(), id = Number(f.id.value);
    var rec = { id: id || Date.now(), kind: f.kind.value, title: ttl, date: f.date.value, text: f.text.value.trim(), photo: photo };
    if (id) items = items.map(function (z) { return z.id === id ? rec : z; }); else items.push(rec);
    if (persist()) { render(); resetForm(); saved(f.st, 'a', id ? t('Saved on this device.') : t('Saved on this device.')); }
    else { items = backup; fail(f.st); }
  });
  f.cancel.onclick = function () { resetForm(); say(f.st, ''); };
  render();
  $('a-export').onclick = function () {
    var data = JSON.stringify({ opening: Store.get('opening', null), letter: Store.get('own', ''), archive: items, wish: Store.get('wish', '') }, null, 2);
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = 'iky-2027-backup.json';
    document.body.appendChild(a); a.click(); a.remove(); say(f.st, t('Backup downloaded. Keep it somewhere safe; it is not encrypted.'), 'good');
  };

  var w = $('w-text'), wSt = $('w-status');
  function showWish() { var v = Store.get('wish', ''), q = $('c-wish'); q.hidden = !v; q.textContent = v; }
  w.value = Store.get('wish', ''); showWish();
  $('w-save').onclick = function () { var v = w.value.trim(); if (Store.set('wish', v)) { showWish(); saved(wSt, 'w', v ? t('Saved on this device.') : t('Saved on this device.')); } else fail(wSt); };
  $('w-clear').onclick = function () { w.value = ''; Store.del('wish'); showWish(); saved(wSt, 'w', t('Saved on this device.')); };

  $('wipe').onclick = function () { if (confirm(t('Erase everything on this device') + '?')) { Store.wipe(); location.reload(); } };
  window.onLang = function () { showOpening(); render(); tick(); f.save.textContent = t(f.id.value ? 'Save changes' : 'Add to archive'); };
})();
