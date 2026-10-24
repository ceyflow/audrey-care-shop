/*
 * Editable content. Loaded on every page right after config.js.
 *
 * Whatever the owner changes in the admin dashboard (texts, photos, logo, contact details, colours)
 * is applied here before the page is drawn. Nothing in this file needs editing by hand.
 *
 *   kv keys (one row each in the `site_content` table, or in this browser in demo mode):
 *     tx.<hash>        {"o": original text, "n": new text}   any visible text on any page
 *     img.<slot>       photo URL        (img.logo, img.hero1, img.banner, img.tiles.hair ...)
 *     contact.<field>  phone | whatsapp | email | address
 *     site.name        shop name
 *     theme.<name>     brand | gold | text | soft  (colours for the whole shop)
 *     sty.<hash>       {"p": page|"*", "s": CSS path, "c": text colour, "b": background}   colours of one place
 */
(function () {
  var C = window.AC_CONFIG;
  if (!C) return;
  var live = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  var CACHE = live ? 'ac_content_v1' : 'ac_demo_content';
  var CT = window.AC_CONTENT = { live: live, cacheKey: CACHE, kv: {}, tx: {}, editing: false, disabled: !!window.AC_ADMIN };

  /* ---------- storage ---------- */
  function readCache() {
    try { var o = JSON.parse(localStorage.getItem(CACHE)); return o && o.kv && typeof o.kv === 'object' ? o : null; } catch (e) { return null; }
  }
  CT.write = function (kv) {
    try { localStorage.setItem(CACHE, JSON.stringify({ kv: kv, at: Date.now() })); return true; } catch (e) { return false; }
  };
  CT.load = function () { var c = readCache(); return c ? c.kv : {}; };

  /* ---------- tiny helpers ---------- */
  var OK_INLINE = { A: 1, B: 1, STRONG: 1, EM: 1, I: 1, U: 1, BR: 1, SPAN: 1, SMALL: 1, 'CMS-W': 1 };
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, SVG: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, CODE: 1, PRE: 1, TEMPLATE: 1, IFRAME: 1, CANVAS: 1, OUTPUT: 1, IMG: 1 };
  CT.norm = function (html) { return String(html).replace(/\s+/g, ' ').trim(); };
  var textHolder = document.createElement('div');
  function textKey(s) { textHolder.textContent = s.replace(/\s+/g, ' ').trim(); return textHolder.innerHTML; }

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36) + '.' + s.length.toString(36);
  }
  CT.txKey = function (original) { return 'tx.' + hash(original); };

  /* Allow only simple formatting; everything else is flattened to text. */
  CT.clean = function (html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = String(html);
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) return;
        if (c.nodeType !== 1) { node.removeChild(c); return; }
        var tag = c.tagName.toUpperCase();
        if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META|SVG|FORM|INPUT|TEXTAREA|SELECT|BUTTON)$/.test(tag)) { node.removeChild(c); return; }
        walk(c);
        if (!OK_INLINE[tag]) {
          while (c.firstChild) node.insertBefore(c.firstChild, c);
          node.removeChild(c); return;
        }
        var swap = tag === 'I' ? 'em' : tag === 'B' ? 'strong' : null;
        var keep = {};
        if (tag === 'A') {
          var href = c.getAttribute('href') || '';
          if (/^(https?:|mailto:|tel:|#|[\w./?=&%#-]+$)/i.test(href)) keep.href = href;
          ['class', 'target', 'rel'].forEach(function (a) { if (c.getAttribute(a)) keep[a] = c.getAttribute(a); });
        } else if (tag === 'SPAN' && c.getAttribute('class')) keep['class'] = c.getAttribute('class');
        var out = swap ? document.createElement(swap) : c;
        if (swap) { while (c.firstChild) out.appendChild(c.firstChild); node.replaceChild(out, c); }
        Array.prototype.slice.call(out.attributes).forEach(function (a) { out.removeAttribute(a.name); });
        for (var k in keep) out.setAttribute(k, keep[k]);
      });
    })(tpl.content);
    var d = document.createElement('div'); d.appendChild(tpl.content);
    return d.innerHTML;
  };

  /* ---------- turning the saved rows into settings ---------- */
  function derive(kv) {
    var tx = {};
    for (var k in kv) {
      if (k.indexOf('tx.') !== 0) continue;
      try { var o = JSON.parse(kv[k]); if (o && typeof o.o === 'string' && typeof o.n === 'string') tx[o.o] = o.n; } catch (e) { /* ignore a bad row */ }
    }
    CT.tx = tx; CT.hasTx = Object.keys(tx).length > 0;
    var sty = {};
    for (var q in kv) {
      if (q.indexOf('sty.') !== 0) continue;
      try { var e = JSON.parse(kv[q]); if (validStyle(e)) sty[q] = e; } catch (err) { /* ignore a bad row */ }
    }
    CT.stySet = sty;
  }

  /* ---------- colours of one place on a page ---------- */
  CT.page = location.pathname.split('/').pop() || 'index.html';
  var HEX = /^#[0-9a-f]{6}$/i, SAFE_SEL = /^[\w#\s>:()\\-]+$/;
  function validStyle(e) { return e && typeof e.p === 'string' && typeof e.s === 'string' && SAFE_SEL.test(e.s) && (!e.c || HEX.test(e.c)) && (!e.b || HEX.test(e.b)) && (e.c || e.b); }
  CT.styleKey = function (p, s) { return 'sty.' + hash(p + '|' + s); };
  /* a short, stable CSS path to an element, e.g.  #hero > article:nth-of-type(1) > div:nth-of-type(2) */
  CT.selectorOf = function (el) {
    var parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      if (el.id && !/^(ac-|\d)/.test(el.id)) { parts.unshift('#' + (window.CSS && CSS.escape ? CSS.escape(el.id) : el.id)); return parts.join(' > '); }
      var i = 1, sib = el;
      while ((sib = sib.previousElementSibling)) if (sib.tagName === el.tagName) i++;
      parts.unshift(el.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
      el = el.parentElement;
    }
    return 'body > ' + parts.join(' > ');
  };
  CT.pageOf = function (el) { return el.closest('#siteHeader, #mnav, #mega, #drawer, .footer, .scrim') ? '*' : CT.page; };
  CT.styleOf = function (el) { return CT.stySet[CT.styleKey(CT.pageOf(el), CT.selectorOf(el))] || null; };
  CT.renderStyles = function () {
    var css = '';
    for (var k in CT.stySet) {
      var e = CT.stySet[k];
      if (e.p !== CT.page && e.p !== '*') continue;
      var sel = e.s + (e.h ? ':not(:hover)' : '');       /* buttons keep their own hover look */
      if (e.c) css += sel + ',' + sel + ' *{color:' + e.c + ' !important}';
      if (e.b) css += sel + '{background-color:' + e.b + ' !important}';
    }
    var node = document.getElementById('ac-sty');
    if (!css) { if (node) node.parentNode.removeChild(node); return; }
    if (!node) { node = document.createElement('style'); node.id = 'ac-sty'; (document.head || document.documentElement).appendChild(node); }
    node.textContent = css;
  };
  /* patch: { c: '#hex'|null, b: '#hex'|null }. Returns { set, remove } rows for saving. */
  CT.setStyle = function (el, patch) {
    var s = CT.selectorOf(el), p = CT.pageOf(el), key = CT.styleKey(p, s);
    var cur = CT.stySet[key] || { p: p, s: s, h: (/^(A|BUTTON)$/.test(el.tagName) || el.classList.contains('btn')) ? 1 : 0 };
    ['c', 'b'].forEach(function (f) { if (f in patch) { if (patch[f]) cur[f] = patch[f]; else delete cur[f]; } });
    var out = { set: {}, remove: [] };
    if (!cur.c && !cur.b) { delete CT.stySet[key]; delete CT.kv[key]; out.remove.push(key); }
    else { CT.stySet[key] = cur; CT.kv[key] = JSON.stringify(cur); out.set[key] = CT.kv[key]; }
    CT.renderStyles();
    return out;
  };

  function mix(hex, to, t) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex;
    var n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var T = to === 'white' ? [255, 255, 255] : [0, 0, 0];
    function c(v, i) { return Math.round(v + (T[i] - v) * t); }
    return '#' + [c(r, 0), c(g, 1), c(b, 2)].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }
  function theme(kv) {
    var css = '', brand = kv['theme.brand'], gold = kv['theme.gold'], text = kv['theme.text'], soft = kv['theme.soft'];
    if (brand) {
      css += '--brand:' + brand + ';--green-950:' + mix(brand, 'black', .35) + ';--green-900:' + brand + ';--green-800:' + mix(brand, 'white', .12) +
        ';--green-700:' + mix(brand, 'white', .24) + ';--green-600:' + mix(brand, 'white', .38) + ';--green-500:' + mix(brand, 'white', .55) +
        ';--green-200:' + mix(brand, 'white', .8) + ';--green-100:' + mix(brand, 'white', .9) + ';--green-50:' + mix(brand, 'white', .95) + ';';
    }
    if (gold) css += '--gold:' + gold + ';';
    if (text) css += '--text:' + text + ';';
    if (soft) css += '--soft:' + soft + ';';
    var el = document.getElementById('ac-theme');
    if (!css) { if (el) el.parentNode.removeChild(el); return; }
    if (!el) { el = document.createElement('style'); el.id = 'ac-theme'; (document.head || document.documentElement).appendChild(el); }
    el.textContent = ':root{' + css + '}';
    if (brand) { var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', brand); }
  }

  function configure(kv) {
    var map = { 'site.name': 'SITE_NAME', 'contact.phone': 'PHONE', 'contact.whatsapp': 'WHATSAPP_NUMBER', 'contact.email': 'EMAIL', 'contact.address': 'ADDRESS', 'img.logo': 'LOGO' };
    for (var k in map) if (kv[k]) C[map[k]] = k === 'contact.whatsapp' ? String(kv[k]).replace(/\D/g, '') : kv[k];
    C.IMAGES = C.IMAGES || {}; C.IMAGES.tiles = C.IMAGES.tiles || {};
    for (var key in kv) {
      if (!kv[key]) continue;
      if (key.indexOf('img.tiles.') === 0) C.IMAGES.tiles[key.slice(10)] = kv[key];
      else if (key.indexOf('img.') === 0 && key !== 'img.logo') C.IMAGES[key.slice(4)] = kv[key];
    }
  }

  /* ---------- finding every piece of text on a page ---------- */
  var done = typeof WeakSet === 'function' ? new WeakSet() : { has: function () { return false; }, add: function () {} };

  function isInline(el, memo) {
    var hit = memo.get(el); if (hit !== undefined) return hit;
    var ok = !!OK_INLINE[el.tagName.toUpperCase()] && !el.hasAttribute('data-nocms') && !el.hasAttribute('style') &&
      (el.tagName.toUpperCase() === 'BR' || el.textContent.trim() !== '');
    if (ok) for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (!isInline(c, memo)) { ok = false; break; }
    memo.set(el, ok); return ok;
  }
  function allKidsInline(el, memo) {
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (!isInline(c, memo)) return false;
    return true;
  }

  /* Returns [{ t:'e', el, key } | { t:'n', node, key }]; key is the ORIGINAL text, whether or not an override was applied. */
  CT.units = function (root) {
    var memo = new Map(), out = [];
    (function visit(el) {
      var tag = el.tagName.toUpperCase();
      if (SKIP[tag] || el.hasAttribute('data-nocms') || el.getAttribute('contenteditable') === 'true' || el.classList.contains('hp') || el.closest('#ac-editor, #ac-pop, #ac-style')) return;
      if (allKidsInline(el, memo)) {
        var u = el;
        while (u.childNodes.length === 1 && u.firstChild.nodeType === 1 && isInline(u.firstChild, memo)) u = u.firstChild;
        if (u.textContent.trim()) {
          var now = CT.norm(u.innerHTML), mark = u.__cms;
          out.push({ t: 'e', el: u, key: mark && mark.n === now ? mark.o : now, applied: !!(mark && mark.n === now) });
        }
        return;
      }
      for (var c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 1) visit(c);
        else if (c.nodeType === 3 && c.data.trim() && !done.has(c)) out.push({ t: 'n', node: c, key: textKey(c.data) });
      }
    })(root);
    return out;
  };

  function wrap(node) {
    var s = document.createElement('cms-w');
    s.setAttribute('data-cms-wrap', '');
    node.parentNode.replaceChild(s, node);
    s.textContent = node.data;
    return s;
  }

  function applyText(u, newHtml) {
    if (u.t === 'e') {
      u.el.innerHTML = CT.clean(newHtml);
      u.el.__cms = { o: u.key, n: CT.norm(u.el.innerHTML) };
      return;
    }
    var node = u.node, tpl = document.createElement('template');
    tpl.innerHTML = CT.clean(newHtml);
    var lead = /^\s*/.exec(node.data)[0], trail = /\s*$/.exec(node.data)[0], frag = tpl.content;
    if (lead) frag.insertBefore(document.createTextNode(lead), frag.firstChild);
    if (trail) frag.appendChild(document.createTextNode(trail));
    Array.prototype.forEach.call(frag.childNodes, function (n) { if (n.nodeType === 3) done.add(n); });
    node.parentNode.replaceChild(frag, node);
  }

  CT.process = function (root) {
    if (!root || !root.isConnected) return;
    while (root.parentElement && OK_INLINE[root.tagName.toUpperCase()]) root = root.parentElement;   /* always work on whole blocks */
    if (!CT.hasTx && !CT.editing) return;
    CT.units(root).forEach(function (u) {
      if (CT.editing && u.t === 'n') {                       /* editing needs a real element to click on */
        var s = wrap(u.node); u = { t: 'e', el: s, key: u.key, applied: false };
      } else if (CT.editing && /^(BUTTON|SUMMARY)$/.test(u.el.tagName)) {   /* keep buttons themselves out of the editable part */
        var inner = document.createElement('cms-w'); inner.setAttribute('data-cms-wrap', '');
        while (u.el.firstChild) inner.appendChild(u.el.firstChild);
        u.el.appendChild(inner); u = { t: 'e', el: inner, key: u.key, applied: false };
      }
      if (!u.applied && CT.tx[u.key] !== undefined) applyText(u, CT.tx[u.key]);
      if (CT.editing) u.el.setAttribute('data-cms-edit', '');
    });
  };

  /* ---------- go ---------- */
  function start(kv) {
    CT.kv = kv; derive(kv); configure(kv); theme(kv);
    if (!CT.disabled) CT.renderStyles();
  }
  var cached = readCache();
  start(cached ? cached.kv : {});

  if (CT.disabled) return;

  CT.editing = /[?&]edit=1(&|$)/.test(location.search);
  if (CT.editing) document.documentElement.classList.add('cms-editing');

  var queue = new Set(), raf = 0;
  function flush() { raf = 0; var q = Array.from(queue); queue.clear(); q.forEach(function (el) { CT.process(el); }); }
  if (typeof MutationObserver === 'function') {
    new MutationObserver(function (muts) {
      if (!CT.hasTx && !CT.editing) return;
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) {
          var el = n.nodeType === 1 ? n : n.nodeType === 3 ? n.parentElement : null;
          if (el && !el.closest('#ac-editor, #ac-pop, #ac-style')) queue.add(el);
        });
      });
      if (queue.size && !raf) raf = requestAnimationFrame(flush);
    }).observe(document, { childList: true, subtree: true });
  }
  function all() { CT.process(document.body); }
  document.addEventListener('DOMContentLoaded', all);
  window.addEventListener('load', all);
  CT.processAll = all;

  /* Owner tools: load the page editor when ?edit=1 and an owner is signed in (or in demo mode). */
  if (CT.editing) {
    var signedIn = !live; try { signedIn = signedIn || !!JSON.parse(localStorage.getItem('ac_admin_session')).access_token; } catch (e) { /* not signed in */ }
    if (!signedIn) { location.replace('admin.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html')); return; }
    document.addEventListener('DOMContentLoaded', function () {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/editor.css'; document.head.appendChild(l);
      ['js/cms-store.js', 'js/editor.js'].reduce(function (p, src) {
        return p.then(function () { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s); }); });
      }, Promise.resolve());
    });
    return;
  }

  /* Connected shop: fetch the latest rows. First-ever visit waits briefly so nobody sees the page change. */
  if (!live) return;
  function fetchRows() {
    var ctl = typeof AbortController === 'function' ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    return fetch(C.SUPABASE_URL + '/rest/v1/site_content?select=key,value', {
      headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY }, signal: ctl ? ctl.signal : undefined
    }).then(function (r) { clearTimeout(t); if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (rows) { var kv = {}; rows.forEach(function (r) { kv[r.key] = r.value; }); return kv; });
  }
  function reveal() { document.documentElement.classList.remove('cms-wait'); }
  function same(a, b) { return JSON.stringify(Object.keys(a).sort().map(function (k) { return [k, a[k]]; })) === JSON.stringify(Object.keys(b).sort().map(function (k) { return [k, b[k]]; })); }

  var first = !cached, shown = false;
  if (first) {
    document.documentElement.classList.add('cms-wait');
    setTimeout(function () { shown = true; reveal(); }, 1800);
  }
  fetchRows().then(function (kv) {
    var changed = first || !same(kv, CT.kv);
    CT.write(kv);
    if (!changed) { reveal(); return; }
    if (first && !shown && Object.keys(kv).length) {
      try { if (sessionStorage.getItem('ac_cms_rl')) { reveal(); return; } sessionStorage.setItem('ac_cms_rl', '1'); } catch (e) { /* ignore */ }
      location.reload(); return;
    }
    start(kv); theme(kv); CT.process(document.body); reveal();
  }).catch(reveal);
})();
