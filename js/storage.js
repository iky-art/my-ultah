window.Store = (function () {
  var P = 'iky27:';
  function ok() { try { localStorage.setItem(P + 't', '1'); localStorage.removeItem(P + 't'); return true; } catch (e) { return false; } }
  return {
    ok: ok,
    get: function (k, d) { try { var v = localStorage.getItem(P + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(P + k); } catch (e) {} },
    wipe: function () { try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(P) === 0) localStorage.removeItem(k); }); } catch (e) {} }
  };
})();
