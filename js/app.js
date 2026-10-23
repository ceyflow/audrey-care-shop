/*
 * Core shop logic shared by every page: catalogue, cart, header behaviour, cart drawer, search,
 * scroll reveals, chat button and the small API layer for Supabase.
 */
(function () {
  var C = window.AC_CONFIG, D = window.AC_DATA, I = window.AC_ICONS, ART = window.AC_ART;
  var AC = window.AC = {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  AC.$ = $; AC.$$ = $$;

  /* ---------- utilities ---------- */
  AC.esc = ART.esc;
  AC.money = function (n) { return 'Rs ' + Math.round(n).toLocaleString('en-US'); };
  AC.param = function (k) { return new URLSearchParams(location.search).get(k); };
  AC.find = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  AC.reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sri Lankan numbers: 07X XXX XXXX, +94 7X XXX XXXX, 947XXXXXXXX -> 07XXXXXXXX ('' if invalid) */
  AC.normPhone = function (v) {
    var d = String(v || '').replace(/[^\d+]/g, '');
    if (d.indexOf('+94') === 0) d = '0' + d.slice(3);
    else if (d.indexOf('94') === 0 && d.length === 11) d = '0' + d.slice(2);
    else if (d.length === 9 && d.charAt(0) !== '0') d = '0' + d;
    return /^0\d{9}$/.test(d) ? d : '';
  };

  var toastTimer;
  AC.toast = function (msg) {
    var t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, 2800);
  };

  var memStore = {};
  AC.store = {
    get: function (k) { try { var v = localStorage.getItem(k); return v === null ? (memStore[k] || null) : v; } catch (e) { return memStore[k] || null; } },
    set: function (k, v) { memStore[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  AC.json = function (k, fallback) { try { return JSON.parse(AC.store.get(k)) || fallback; } catch (e) { return fallback; } };

  /* ---------- backend (Supabase) ---------- */
  AC.configured = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  function headers(extra) {
    var h = { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY };
    for (var k in extra) h[k] = extra[k];
    return h;
  }
  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('Request timed out')); }, ms); })]);
  }
  AC.rest = function (path) {
    return withTimeout(fetch(C.SUPABASE_URL + '/rest/v1/' + path, { headers: headers() }), 8000).then(function (r) {
      if (!r.ok) throw new Error('Request failed (' + r.status + ')'); return r.json();
    });
  };
  AC.rpc = function (name, args) {
    return withTimeout(fetch(C.SUPABASE_URL + '/rest/v1/rpc/' + name, { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(args) }), 12000).then(function (r) {
      return r.json().then(function (j) { if (!r.ok) throw new Error((j && j.message) || 'Request failed'); return j; });
    });
  };
  AC.fn = function (name, body) {
    return withTimeout(fetch(C.SUPABASE_URL + '/functions/v1/' + name, { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) }), 20000).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || j.error) throw new Error(j.error || 'Something went wrong. Please try again.');
        return j;
      });
    });
  };
  /* Forms (newsletter, bulk enquiry, contact). Demo mode keeps them in this browser only. */
  AC.submitForm = function (type, payload) {
    if (!AC.configured) {
      var all = AC.json('ac_demo_forms', []); all.push({ type: type, at: new Date().toISOString(), data: payload });
      AC.store.set('ac_demo_forms', JSON.stringify(all));
      return new Promise(function (res) { setTimeout(function () { res({ ok: true, demo: true }); }, 500); });
    }
    var body = { type: type }; for (var k in payload) body[k] = payload[k];
    return AC.fn('submit-form', body);
  };
  AC.uploadSlip = function (orderNo, file) {
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    var path = orderNo + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    return withTimeout(fetch(C.SUPABASE_URL + '/storage/v1/object/payment-slips/' + path, {
      method: 'POST', headers: headers({ 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' }), body: file
    }), 60000).then(function (r) { if (!r.ok) throw new Error('Upload failed (' + r.status + ')'); return path; });
  };

  /* ---------- catalogue ---------- */
  AC.products = [];
  AC.settings = {
    shipping_flat: C.SHIPPING_FLAT_LKR, free_over: C.FREE_SHIPPING_OVER_LKR,
    payments: C.PAYMENTS, bank: C.BANK
  };

  function prepare(list) {
    return list.map(function (p) {
      p.kindObj = AC.find(D.kinds, p.kind) || D.kinds[0];
      p.frag = AC.find(D.fragrances, p.fragrance) || D.fragrances[0];
      p.images = p.images || [];
      p.variants.forEach(function (v) { v.productId = p.id; });
      p.from = Math.min.apply(null, p.variants.map(function (v) { return v.price; }));
      return p;
    });
  }

  function loadCatalog() {
    var local = prepare(JSON.parse(JSON.stringify(D.products)));
    if (!AC.configured) { AC.products = local; return Promise.resolve(); }
    return Promise.all([
      AC.rest('products?select=*,variants(*)&active=eq.true&order=sort.asc'),
      AC.rest('settings?select=key,value').catch(function () { return []; })
    ]).then(function (res) {
      var rows = res[0];
      if (rows && rows.length) {
        AC.products = prepare(rows.map(function (r) {
          return {
            id: r.id, kind: r.kind, fragrance: r.fragrance, name: r.name, badge: r.badge, tagline: r.tagline,
            description: r.description, how_to_use: r.how_to_use, images: r.images || [],
            variants: (r.variants || []).filter(function (v) { return v.active !== false; })
              .sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); })
              .map(function (v) { return { id: v.id, label: v.label, price: v.price_lkr, compare_at: v.compare_at_lkr, stock: v.stock }; })
          };
        }).filter(function (p) { return p.variants.length; }));
      } else { AC.products = local; }
      (res[1] || []).forEach(function (s) {
        var v = s.value;
        if (s.key === 'shipping_flat_lkr') AC.settings.shipping_flat = Number(v);
        if (s.key === 'free_shipping_over_lkr') AC.settings.free_over = Number(v);
        if (s.key === 'payments' && v) AC.settings.payments = v;
        if (s.key === 'bank' && v) AC.settings.bank = v;
      });
    }).catch(function () { AC.products = local; });
  }
  AC.ready = loadCatalog();

  AC.product = function (id) { return AC.find(AC.products, id); };
  AC.variant = function (vid) {
    for (var i = 0; i < AC.products.length; i++) {
      var v = AC.find(AC.products[i].variants, vid);
      if (v) return { v: v, p: AC.products[i] };
    }
    return null;
  };

  AC.media = function (p, view) {
    var src = p.images[view] || (view ? null : p.images[0]);
    if (src) return '<img src="' + AC.esc(src) + '" alt="' + AC.esc(p.name + ' ' + p.frag.name) + '" loading="lazy">';
    return ART.packshot(p, { view: view ? 'alt' : '' });
  };

  AC.card = function (p, i) {
    var single = p.variants.length === 1;
    var badge = p.badge ? '<span class="badge' + (p.badge === 'New' ? ' badge--new' : '') + '">' + AC.esc(p.badge) + '</span>' : '';
    return '<article class="card reveal" style="--d:' + (i || 0) + '"><div class="card-media">' + badge +
      '<div class="v v-main">' + AC.media(p, 0) + '</div><div class="v v-alt">' + AC.media(p, 1) + '</div>' +
      '<button class="btn btn--sm btn--block quick" data-quick="' + p.id + '" tabindex="-1">' + (single ? 'Quick add' : 'Choose size') + '</button></div>' +
      '<div class="card-body"><div class="card-kind"><span class="dot" style="background:' + p.frag.color + ';width:9px;height:9px;margin-right:8px"></span>' + AC.esc(p.kindObj.name) + ' · ' + AC.esc(p.frag.name) + '</div>' +
      '<h3 class="card-name"><a href="product.html?id=' + p.id + '">' + AC.esc(p.name) + '</a></h3>' +
      '<div class="card-price">' + (p.variants.length > 1 ? 'From ' : '') + AC.money(p.from) + '</div></div></article>';
  };

  /* ---------- cart ---------- */
  var CART_KEY = 'ac_cart_v1';
  AC.cart = {
    read: function () { var c = AC.json(CART_KEY, []); return Array.isArray(c) ? c : []; },
    write: function (items) { AC.store.set(CART_KEY, JSON.stringify(items)); document.dispatchEvent(new CustomEvent('ac:cart')); },
    add: function (vid, qty) {
      var items = this.read(), hit = null;
      items.forEach(function (x) { if (x.v === vid) hit = x; });
      if (hit) hit.q = Math.min(50, hit.q + (qty || 1)); else items.push({ v: vid, q: Math.min(50, qty || 1) });
      this.write(items);
    },
    set: function (vid, qty) {
      var items = this.read().map(function (x) { if (x.v === vid) x.q = qty; return x; }).filter(function (x) { return x.q > 0; });
      this.write(items);
    },
    clear: function () { this.write([]); },
    lines: function () {
      return this.read().map(function (x) {
        var f = AC.variant(x.v); if (!f) return null;
        return { v: f.v, p: f.p, q: x.q, total: f.v.price * x.q };
      }).filter(Boolean);
    },
    count: function () { return this.lines().reduce(function (n, l) { return n + l.q; }, 0); },
    subtotal: function () { return this.lines().reduce(function (n, l) { return n + l.total; }, 0); }
  };
  AC.shipping = function (sub) { return sub <= 0 || sub >= AC.settings.free_over ? 0 : AC.settings.shipping_flat; };

  AC.addToCart = function (vid, qty, opts) {
    AC.cart.add(vid, qty);
    var badge = $('#cartCount');
    if (badge) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
    if (!opts || opts.open !== false) AC.openCart();
  };

  /* ---------- cart drawer ---------- */
  var drawer, scrim, lastFocus;
  function drawerHtml() {
    return '<aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="Your bag" aria-hidden="true">' +
      '<div class="drawer-head"><h3>Your bag</h3><button class="icon-btn" id="drawerClose" aria-label="Close bag">' + I.close + '</button></div>' +
      '<div class="ship-box" id="shipBox"></div><div class="drawer-body" id="drawerBody"></div><div class="drawer-foot" id="drawerFoot"></div></aside>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
  }
  function renderCart() {
    var lines = AC.cart.lines(), sub = AC.cart.subtotal();
    var count = lines.reduce(function (n, l) { return n + l.q; }, 0);
    var badge = $('#cartCount');
    if (badge) { badge.textContent = count; badge.classList.toggle('has-items', count > 0); }
    if (!drawer) return;
    var free = AC.settings.free_over, left = Math.max(0, free - sub);
    $('#shipBox').innerHTML = sub <= 0 ? 'Free delivery on orders over <b>' + AC.money(free) + '</b>' :
      (left > 0 ? 'Add <b>' + AC.money(left) + '</b> more for free delivery' : '<b class="free">You’ve unlocked free delivery</b>') +
      '<div class="ship-bar"><i style="width:' + Math.min(100, sub / free * 100) + '%"></i></div>';
    if (!lines.length) {
      $('#drawerBody').innerHTML = '<div class="empty">' + I.bag + '<div class="serif-i">Your bag is empty</div><p>Nothing here yet — let’s find something gentle.</p><a class="btn btn--sm" href="shop.html">Start shopping</a></div>';
      $('#drawerFoot').innerHTML = ''; return;
    }
    $('#drawerBody').innerHTML = lines.map(function (l) {
      return '<div class="line"><a class="line-img" href="product.html?id=' + l.p.id + '">' + AC.media(l.p, 0) + '</a><div class="line-info">' +
        '<b>' + AC.esc(l.p.name) + '</b><span>' + AC.esc(l.p.frag.name) + ' · ' + AC.esc(l.v.label) + '</span>' +
        '<div class="line-row"><div class="qty"><button data-dec="' + l.v.id + '" aria-label="Decrease quantity">' + I.minus + '</button><output>' + l.q + '</output><button data-inc="' + l.v.id + '" aria-label="Increase quantity">' + I.plus + '</button></div>' +
        '<b>' + AC.money(l.total) + '</b></div><button class="line-remove" data-rm="' + l.v.id + '" style="justify-self:start;margin-top:6px">Remove</button></div></div>';
    }).join('');
    var ship = AC.shipping(sub);
    $('#drawerFoot').innerHTML = '<div class="row"><span class="muted">Subtotal</span><b>' + AC.money(sub) + '</b></div>' +
      '<div class="row"><span class="muted">Delivery</span><span>' + (ship ? AC.money(ship) : '<span class="free">Free</span>') + '</span></div>' +
      '<a class="btn btn--block" href="checkout.html">Checkout · ' + AC.money(sub + ship) + '</a>' +
      '<a class="link-arrow" style="justify-self:center" href="shop.html">Continue shopping</a>';
  }
  AC.openCart = function () {
    lastFocus = document.activeElement; renderCart();
    drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false');
    scrim.classList.add('is-open'); document.body.classList.add('is-locked');
    setTimeout(function () { var c = $('#drawerClose'); if (c) c.focus(); }, 60);
  };
  AC.closeCart = function () {
    if (!drawer) return;
    drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true');
    closeMnavScrimCheck(); if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  function closeMnavScrimCheck() {
    var m = $('#mnav');
    if (!m || !m.classList.contains('is-open')) { scrim.classList.remove('is-open'); document.body.classList.remove('is-locked'); }
  }

  /* ---------- mobile nav ---------- */
  function setMnav(open) {
    var m = $('#mnav'), b = $('#burger');
    m.classList.toggle('is-open', open); m.setAttribute('aria-hidden', open ? 'false' : 'true');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    scrim.classList.toggle('is-open', open || drawer.classList.contains('is-open'));
    document.body.classList.toggle('is-locked', open || drawer.classList.contains('is-open'));
  }

  /* ---------- mega menu ---------- */
  function initMega() {
    var mega = $('#mega'), header = $('#siteHeader'), triggers = $$('[data-mega]'), timer, current = null;
    if (!mega) return;
    function open(name) {
      clearTimeout(timer); current = name;
      $$('.mega-panel', mega).forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-panel') === name); });
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', t.getAttribute('data-mega') === name ? 'true' : 'false'); });
      mega.classList.add('is-open');
    }
    function close() {
      clearTimeout(timer); current = null; mega.classList.remove('is-open');
      triggers.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); });
    }
    var hoverable = window.matchMedia('(hover: hover)').matches;
    triggers.forEach(function (t) {
      var name = t.getAttribute('data-mega');
      t.addEventListener('click', function () { current === name ? close() : open(name); });
      if (hoverable) t.addEventListener('mouseenter', function () { clearTimeout(timer); timer = setTimeout(function () { open(name); }, 90); });
    });
    if (hoverable) {
      header.addEventListener('mouseleave', function () { clearTimeout(timer); timer = setTimeout(close, 180); });
      mega.addEventListener('mouseenter', function () { clearTimeout(timer); });
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) { if (current && !header.contains(e.target)) close(); });
    $$('a', mega).forEach(function (a) { a.addEventListener('click', close); });
    var mmClose = $('#mmClose'); if (mmClose) mmClose.addEventListener('click', close);
    /* category rail: hover or focus switches the columns, like the reference */
    $$('.mm-cat', mega).forEach(function (c) {
      var show = function () {
        var id = c.getAttribute('data-cat');
        $$('.mm-cat', mega).forEach(function (x) { x.classList.toggle('is-active', x === c); });
        $$('.mm-set', mega).forEach(function (x) { x.classList.toggle('is-active', x.getAttribute('data-set') === id); });
      };
      c.addEventListener('mouseenter', show); c.addEventListener('focus', show);
    });
  }

  /* ---------- search ---------- */
  function initSearch() {
    var input = $('#searchInput'), box = $('#searchResults');
    if (!input) return;
    function run() {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { box.classList.remove('is-open'); return; }
      var hits = AC.products.filter(function (p) {
        return (p.name + ' ' + p.kindObj.name + ' ' + p.frag.name + ' ' + (p.tagline || '')).toLowerCase().indexOf(q) > -1;
      }).slice(0, 5);
      box.innerHTML = hits.length ? hits.map(function (p) {
        return '<a href="product.html?id=' + p.id + '" role="option"><span class="thumb">' + AC.media(p, 0) + '</span><span><b>' + AC.esc(p.name) + '</b><span>' + AC.esc(p.frag.name) + ' · from ' + AC.money(p.from) + '</span></span></a>';
      }).join('') : '<div class="search-empty">No matches for “' + AC.esc(input.value.trim()) + '”. Try “shampoo” or “lavender”.</div>';
      box.classList.add('is-open');
    }
    input.addEventListener('input', run);
    input.addEventListener('focus', run);
    document.addEventListener('click', function (e) { if (!$('#search').contains(e.target)) box.classList.remove('is-open'); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { box.classList.remove('is-open'); input.blur(); } });
  }


  /* ---------- simple validated forms (bulk enquiry, contact) ---------- */
  AC.bindForm = function (form, type, rules, onDone) {
    var btn = form.querySelector('[type=submit]'), errBox = form.querySelector('.form-error');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null, data = {};
      Object.keys(rules).forEach(function (name) {
        var f = form.elements[name], wrap = f.closest('.field'), v = (f.value || '').trim(), r = rules[name], msg = '';
        if (r.req && !v) msg = r.msg || 'This field is required.';
        else if (v && r.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'That email doesn’t look right.';
        else if (v && r.kind === 'phone' && !AC.normPhone(v)) msg = 'Enter a valid mobile number, like 077 123 4567.';
        wrap.classList.toggle('has-error', !!msg); wrap.querySelector('.err').textContent = msg;
        if (msg && !bad) bad = f;
        data[name] = r.kind === 'phone' && v ? AC.normPhone(v) : v;
      });
      if (bad) { bad.focus(); return; }
      AC.$$('input,select,textarea', form).forEach(function (el) {
        if (!el.name || el.name in rules || el.type === 'submit' || el.type === 'checkbox') return;
        data[el.name] = el.value;
      });
      AC.$$('input[type=checkbox]:checked', form).forEach(function (el) { (data[el.name] = data[el.name] || []).push(el.value); });
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending…'; if (errBox) errBox.hidden = true;
      AC.submitForm(type, data).then(function () { onDone(data); }).catch(function (err) {
        btn.disabled = false; btn.textContent = label;
        if (errBox) { errBox.hidden = false; errBox.textContent = err.message || 'Something went wrong. Please try again.'; }
      });
    });
    AC.$$('.input,.textarea', form).forEach(function (el) { el.addEventListener('input', function () { var w = el.closest('.field'); w.classList.remove('has-error'); w.querySelector('.err').textContent = ''; }); });
  };

  /* ---------- scroll behaviour ---------- */
  function initScroll() {
    var header = $('#siteHeader'), ticking = false;
    function onScroll() {
      ticking = false;
      header.classList.toggle('is-compact', window.scrollY > 12);
      $$('[data-parallax]').forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;   // -1..1
        el.style.setProperty('--py', (p * -28).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  var io;
  AC.reveal = function (root) {
    var els = $$('.reveal:not(.is-in)', root);
    if (!('IntersectionObserver' in window) || AC.reduced) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    io = io || new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  };

  /* ---------- chat: greeting bubble + orb (WhatsApp when configured, else the contact page) ---------- */
  function initChat() {
    var url = C.WHATSAPP_NUMBER ? 'https://wa.me/' + C.WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi ' + C.SITE_NAME + ', I have a question.') : 'contact.html';
    var ext = C.WHATSAPP_NUMBER ? ' target="_blank" rel="noopener"' : '';
    var ring = '<svg viewBox="0 0 84 84" fill="none" stroke="currentColor" aria-hidden="true"><ellipse cx="42" cy="42" rx="34" ry="31" transform="rotate(-24 42 42)" stroke-width="4.500"/><ellipse cx="42" cy="42" rx="31" ry="34" transform="rotate(32 42 42)" stroke-width="2.500" opacity=".65"/></svg>';
    document.body.insertAdjacentHTML('beforeend',
      '<div class="chat" id="chat"><button class="chat-x" id="chatX" aria-label="Dismiss">' + I.close + '</button>' +
      '<a class="chat-bubble" id="chatBubble" href="' + url + '"' + ext + '>Hi, how may I help you?</a>' +
      '<a class="chat-fab" href="' + url + '"' + ext + ' aria-label="' + (C.WHATSAPP_NUMBER ? 'Chat with us on WhatsApp' : 'Contact us') + '">' + ring + '</a></div>');
    var chat = $('#chat'), seen = false;
    try { seen = sessionStorage.getItem('ac_chat_seen') === '1'; } catch (e) { /* ignore */ }
    if (!seen) {
      setTimeout(function () { chat.classList.add('is-greeting'); }, 2500);
      setTimeout(function () { chat.classList.remove('is-greeting'); }, 14000);   // fades away on its own so it never covers the page for long
    }
    $('#chatX').addEventListener('click', function () {
      chat.classList.remove('is-greeting'); try { sessionStorage.setItem('ac_chat_seen', '1'); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    document.body.insertAdjacentHTML('beforeend', AC_FOOTER_HTML + drawerHtml());
    drawer = $('#drawer'); scrim = $('#scrim');

    $('#cartBtn').addEventListener('click', AC.openCart);
    $('#drawerClose').addEventListener('click', AC.closeCart);
    $('#burger').addEventListener('click', function () { setMnav(true); });
    $('#mnavClose').addEventListener('click', function () { setMnav(false); });
    scrim.addEventListener('click', function () { setMnav(false); AC.closeCart(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMnav(false); AC.closeCart(); } });

    drawer.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      var inc = t.getAttribute('data-inc'), dec = t.getAttribute('data-dec'), rm = t.getAttribute('data-rm');
      var cur = function (id) { var l = AC.cart.lines().filter(function (x) { return x.v.id === id; })[0]; return l ? l.q : 0; };
      if (inc) AC.cart.set(inc, Math.min(50, cur(inc) + 1));
      if (dec) AC.cart.set(dec, cur(dec) - 1);
      if (rm) AC.cart.set(rm, 0);
    });
    document.addEventListener('click', function (e) {
      var q = e.target.closest('[data-quick]'); if (!q) return;
      e.preventDefault();
      var p = AC.product(q.getAttribute('data-quick')); if (!p) return;
      if (p.variants.length === 1) AC.addToCart(p.variants[0].id, 1); else location.href = 'product.html?id=' + p.id;
    });

    document.addEventListener('ac:cart', renderCart);
    window.addEventListener('storage', function (e) { if (e.key === CART_KEY) renderCart(); });

    initMega(); initScroll(); initChat();
    AC.reveal();
    AC.ready.then(function () { renderCart(); initSearch(); document.dispatchEvent(new CustomEvent('ac:ready')); });
  }
  boot();
})();
