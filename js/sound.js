(function () {
  'use strict';
  var VOL = 1; // overall loudness: raise (up to ~1.5) or lower to taste
  var ctx = null, master = null, btn = document.getElementById('snd'), root = document.documentElement;
  function on() { return Store.get('sound', true) !== false; }
  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); master = ctx.createDynamicsCompressor(); master.connect(ctx.destination); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type, vol, delay) {
    var c = ac(); if (!c) return;
    var t0 = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.min(1, (vol || 0.5) * VOL), t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function vib(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  window.Sound = {
    unlock: function () { ac(); },
    step: function () { if (!on()) return; tone(2000, 0.04, 'square', 0.5); tone(320, 0.05, 'triangle', 0.9); vib(6); },
    lock: function () { if (!on()) return; tone(170, 0.16, 'sine', 1); tone(950, 0.05, 'square', 0.4); vib(18); },
    tick: function (i) { if (!on()) return; var f = 560 + (i || 0) * 80; tone(f, 0.09, 'triangle', 0.8); tone(f * 2, 0.05, 'sine', 0.45); vib(12); },
    back: function () { if (!on()) return; tone(300, 0.09, 'triangle', 0.8); tone(150, 0.07, 'sine', 0.4); vib(8); },
    ok: function () { if (!on()) return; tone(523, 0.2, 'sine', 0.6); tone(659, 0.2, 'sine', 0.6, 0.09); tone(784, 0.3, 'sine', 0.6, 0.18); vib(20); },
    bad: function () { if (!on()) return; tone(150, 0.18, 'sawtooth', 0.45); tone(115, 0.22, 'sawtooth', 0.45, 0.13); vib([40, 40, 40]); }
  };
  function paint() { var o = on(); root.setAttribute('data-sound', o ? 'on' : 'off'); btn.setAttribute('aria-pressed', o ? 'true' : 'false'); }
  btn.addEventListener('click', function () { Store.set('sound', !on()); paint(); Sound.tick(2); });
  paint();
})();
