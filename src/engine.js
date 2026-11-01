/*! sonic-text-engine v1.0.0 | MIT (code only; sprites belong to SEGA, see NOTICE.md) */
(function (root) {
  'use strict';
  var FONTS = /*__FONTS__*/[];
  var EH = /*__EH__*/{};
  var BYID = {}; FONTS.forEach(function (f) { BYID[f.id] = f; });
  var EMAP = { '🦔': 'sonic', '🔵': 'sonic', '🦊': 'tails', '🔴': 'knuckles', '🥊': 'knuckles', '💍': 'ring' };
  var EMOJI = { sonic: '🦔', tails: '🦊', knuckles: '🔴', ring: '💍' };
  var TOK = /:(sonic|tails|knuckles|ring):/gi;
  var EMRE = /🦔|🔵|🦊|🔴|🥊|💍|[\s\S]/gu;
  var DEF = { base: 's1c', random: true, games: [1], scale: 3, auto: false, glitch: 0.5, spacing: 0.5,
              ring: true, position: true, emoji: 'head', seed: null, animate: 0 };

  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function has(f, ch) { return !!BYID[f] && BYID[f].chars.indexOf(ch) > -1; }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }

  function pickFont(ch, r, o) {
    if (/[0-9]/.test(ch)) return has('s2s', ch) ? 's2s' : null;
    var pool = FONTS.filter(function (f) { return o.games.indexOf(f.game) > -1; });
    var f;
    if (o.random) f = pool[Math.floor(r() * pool.length)].id;
    else {
      var g = o.games[Math.floor(r() * o.games.length)];
      var sub = FONTS.filter(function (x) { return x.game === g; });
      f = g === 1 ? o.base : sub[Math.floor(r() * sub.length)].id;
    }
    if (!has(f, ch)) f = has(o.base, ch) ? o.base : 's1c';
    return has(f, ch) ? f : null;
  }
  function sprite(id, S) { var s = el('span', 'sf-g sf-' + id); s.style.setProperty('--sf-scale', S); return s; }

  function glyph(ch, r, o, S) {
    var en = EMAP[ch], gl = o.glitch, sp = o.spacing, strips = 1, sliceable = true;
    var gap = o.position ? (5 + r() * 5) * S * (0.35 + sp * 1.3) + (r() < gl * 0.35 ? r() * 22 * S * sp : 0) : 7.5 * S * (0.35 + sp * 1.3);
    var g2 = en && en !== 'ring' ? gl * 0.3 : gl;
    var jy = o.position ? (r() - 0.5) * (r() < g2 ? 36 : 6) * S * g2 + (r() - 0.5) * 2 * S : 0;
    var wrap = el('span', 'sf-gw'), id, sc = S;
    if (en === 'ring' || (!en && ch === 'O' && o.ring && r() < 0.6)) {
      var rg = el('span', 'sf-ring'); rg.style.width = rg.style.height = 20 * S + 'px'; rg.style.borderWidth = 2 * S + 'px';
      wrap.appendChild(rg); sliceable = false;
    } else if (en) {
      id = 'e-' + o.emoji + '-' + en; sc = o.emoji === 'head' ? S : 26 * S / (EH[en] || 36);
    } else {
      var f = pickFont(ch, r, o); if (!f) return null; id = f + '-' + ch;
    }
    if (sliceable) {
      if (r() < g2 * 0.65) strips = 2 + Math.floor(r() * 3);
      for (var i = 0; i < strips; i++) {
        var s = sprite(id, sc);
        if (strips > 1) {
          s.style.clipPath = 'inset(' + (100 * i / strips) + '% 0 ' + (100 - 100 * (i + 1) / strips) + '% 0)';
          s.style.transform = 'translateX(' + Math.round((r() - 0.5) * 14 * S * g2) + 'px)';
          if (i) { s.style.position = 'absolute'; s.style.left = 0; s.style.top = 0; }
        }
        wrap.appendChild(s);
      }
    }
    var sx = 1, sy = 1;
    if (r() < g2 * 0.45) { sx = 0.45 + r() * 1.1; sy = 0.6 + r() * 0.8; }
    if (r() < g2 * 0.18) wrap.classList.add('sf-dark');
    wrap.style.marginRight = gap + 'px';
    wrap.style.transform = 'translateY(' + jy.toFixed(1) + 'px) scale(' + sx.toFixed(2) + ',' + sy.toFixed(2) + ')';
    return wrap;
  }

  function paint(host, text, o, S) {
    var r = rng(o.seed), inner = el('div', 'sf-inner');
    host.textContent = ''; host.appendChild(inner);
    text.replace(TOK, function (m, n) { return EMOJI[n.toLowerCase()]; }).toUpperCase().split('\n').forEach(function (ln) {
      var L = el('div', 'sf-line'); L.style.paddingBlock = 3 * S + 'px'; inner.appendChild(L);
      ln.split(/ +/).filter(Boolean).forEach(function (w, wi) {
        if (wi) L.appendChild(document.createTextNode(' '));
        var W = el('span', 'sf-word'); W.style.margin = '0 ' + 6 * S * (0.5 + o.spacing) + 'px';
        (w.match(EMRE) || []).forEach(function (ch) { var n = glyph(ch, r, o, S); if (n) W.appendChild(n); });
        L.appendChild(W);
      });
    });
    return inner;
  }

  function wrapped(inner) {
    for (var i = 0; i < inner.children.length; i++) {
      var w = inner.children[i].children, t = null;
      for (var j = 0; j < w.length; j++) {
        var m = w[j].offsetTop + w[j].offsetHeight / 2;
        if (t === null) t = m; else if (Math.abs(m - t) > 3) return true;
      }
    }
    return false;
  }
  function layout(host) {
    var s = host._sf, o = s.o, inner;
    if (o.auto && host.clientWidth) {
      var c = [5, 4, 3, 2, 1.5, 1, 0.75, 0.5], S, done = false;
      for (var pass = 0; pass < 2 && !done; pass++) {   // pass 0: keep each line on one row; pass 1: allow wrapping
        for (var i = 0; i < c.length; i++) {
          S = c[i]; inner = paint(host, s.text, o, S);
          var jit = o.position ? 36 * S * o.glitch : 0;
          if (inner.scrollWidth <= host.clientWidth + 1 && (!host.clientHeight || inner.offsetHeight + jit <= host.clientHeight + 1) && (pass || !wrapped(inner))) { done = true; break; }
        }
      }
      s.scale = S;
    } else { s.scale = o.scale; paint(host, s.text, o, o.scale); }
    host.setAttribute('data-sf-scale', s.scale);
  }

  function norm(opts) {
    var o = {}, k; for (k in DEF) o[k] = DEF[k]; for (k in (opts || {})) if (opts[k] !== undefined) o[k] = opts[k];
    if (o.scale === 'auto') { o.auto = true; o.scale = 3; }
    o.games = [1].concat((o.games || []).map(Number).filter(function (g) { return g > 1; }));
    o.games = o.games.filter(function (g, i, a) { return a.indexOf(g) === i; });
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) o.animate = 0;
    return o;
  }
  function stop(host) { if (host._sfT) { clearInterval(host._sfT); host._sfT = 0; } }

  var SonicText = {
    version: '1.0.0', fonts: FONTS, defaults: DEF,
    render: function (host, text, opts) {
      stop(host); var o = norm(opts); if (o.seed == null) o.seed = (Math.random() * 1e9) | 0;
      host._sf = { text: String(text), o: o };
      host.classList.add('sf-text'); host.setAttribute('role', 'img');
      host.setAttribute('aria-label', String(text).replace(TOK, ''));
      layout(host);
      if (o.animate > 0) host._sfT = setInterval(function () { o.seed = (Math.random() * 1e9) | 0; layout(host); }, o.animate);
      return host;
    },
    update: function (host, patch) { var s = host._sf; if (!s) return; var o = {}, k;
      for (k in s.o) o[k] = s.o[k]; for (k in patch) o[k] = patch[k];
      return SonicText.render(host, patch.text != null ? patch.text : s.text, o); },
    reroll: function (host) { if (host._sf) { host._sf.o.seed = (Math.random() * 1e9) | 0; layout(host); } },
    stop: stop,
    attach: function (scope) {
      (scope || document).querySelectorAll('[data-sonic-text]').forEach(function (h) {
        var d = h.dataset, text = d.sonicText || h.textContent.trim(), o = {};
        if (d.sfFont) o.base = d.sfFont;
        if (d.sfRandom) o.random = d.sfRandom !== 'false';
        if (d.sfGames) o.games = d.sfGames.split(',');
        if (d.sfScale) o.scale = d.sfScale === 'auto' ? 'auto' : +d.sfScale;
        if (d.sfGlitch) o.glitch = +d.sfGlitch;
        if (d.sfSpacing) o.spacing = +d.sfSpacing;
        if (d.sfRing) o.ring = d.sfRing !== 'false';
        if (d.sfPosition) o.position = d.sfPosition !== 'false';
        if (d.sfEmoji) o.emoji = d.sfEmoji;
        if (d.sfSeed) o.seed = +d.sfSeed;
        if (d.sfAnimate) o.animate = +d.sfAnimate;
        SonicText.render(h, text, o);
      });
    }
  };
  if (typeof module === 'object' && module.exports) module.exports = SonicText; else root.SonicText = SonicText;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { SonicText.attach(); });
    else SonicText.attach();
  }
})(typeof window !== 'undefined' ? window : this);
