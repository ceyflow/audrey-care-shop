/*
 * Shop admin dashboard (admin.html). One file: sign in, then Overview, Orders, Products, Edit pages,
 * Photos & logo, Colours, Settings and Messages. Works against Supabase when it is connected;
 * in demo mode everything is saved in this browser only.
 */
(function () {
  var C = window.AC_CONFIG, CT = window.AC_CONTENT, CMS = window.AC_CMS, D = window.AC_DATA, ART = window.AC_ART;
  var live = CMS.live;
  var app = document.getElementById('adApp');
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function money(n) { return 'Rs ' + Math.round(Number(n) || 0).toLocaleString('en-US'); }
  function when(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function lsGet(k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { toast('This browser has no room left to save. Try smaller photos.', true); return false; } }
  var toastTimer;
  function toast(msg, bad) {
    var t = $('#adToast'); t.textContent = msg; t.className = 'ad-toast is-on' + (bad ? ' is-err' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('is-on'); }, bad ? 5200 : 2600);
  }
  function busy(btn, p) {
    if (btn) btn.disabled = true;
    return p.then(function (v) { if (btn) btn.disabled = false; return v; }, function (e) { if (btn) btn.disabled = false; throw e; });
  }
  function fail(e) { toast(e && e.message ? e.message : 'Something went wrong.', true); }
  function download(name, text) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(rows) { return rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'); }
  function waLink(phone, text) {
    var d = String(phone || '').replace(/\D/g, ''); if (d.charAt(0) === '0') d = '94' + d.slice(1);
    return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function field(label, html, note, cls) { return '<div class="ad-field' + (cls ? ' ' + cls : '') + '"><label>' + label + '</label>' + html + (note ? '<span class="note">' + note + '</span>' : '') + '</div>'; }
  function input(name, val, opts) {
    opts = opts || {};
    return '<input class="ad-in" name="' + name + '" type="' + (opts.type || 'text') + '" value="' + esc(val) + '"' + (opts.ph ? ' placeholder="' + esc(opts.ph) + '"' : '') + (opts.attrs ? ' ' + opts.attrs : '') + '>';
  }
  function select(name, val, options) {
    return '<select class="ad-in" name="' + name + '">' + options.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }
  function toggle(name, on) { return '<label class="ad-toggle"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '><span></span></label>'; }

  var S = { kv: {}, orders: null, products: null, forms: null, settings: null, ui: { orderFilter: 'all', orderQ: '', msgType: 'all' } };
  var main;

  /* ================= sign in ================= */
  var LOGO_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 30C5 15 15 5 35 5c0 17-9 29-24 29-3 0-5-1-6-4z" fill="#4CAF6D"/><path d="M7 33c5-9 12-16 22-22" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';

  function loginScreen(msg) {
    app.innerHTML = '<div class="ad-login"><form class="ad-login-card" id="loginForm"><div class="logo">' + LOGO_SVG + 'Audrey Care</div><h1>Shop admin</h1>' +
      '<p style="color:#666">Sign in with the owner account to manage your shop.</p>' +
      (msg ? '<div class="ad-banner" style="margin:0;background:#fcefec;border-color:#e8b9b0;color:#8f2a1d" role="alert">' + esc(msg) + '</div>' : '') +
      field('Email', '<input class="ad-in" type="email" name="email" autocomplete="username" required>') +
      field('Password', '<input class="ad-in" type="password" name="password" autocomplete="current-password" required>') +
      '<button class="ad-btn" type="submit">Sign in</button></form></div>';
    $('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      busy($('button', f), CMS.login(f.email.value.trim(), f.password.value)).then(enter).catch(function (err) { loginScreen(err.message); });
    });
  }

  /* ================= shell & routing ================= */
  var TABS = [['dash', 'Overview'], ['orders', 'Orders'], ['products', 'Products'], ['pages', 'Edit pages'], ['images', 'Photos & logo'], ['design', 'Colours'], ['settings', 'Settings'], ['messages', 'Messages']];

  function shell() {
    app.innerHTML = '<div class="ad-shell"><aside class="ad-side"><div class="logo">' + LOGO_SVG + '<span>Audrey Care<small>Shop admin</small></span></div>' +
      '<nav class="ad-nav" id="adNav">' + TABS.map(function (t) { return '<a href="#' + t[0] + '" data-tab="' + t[0] + '">' + t[1] + '<span class="n" hidden></span></a>'; }).join('') + '</nav>' +
      '<div class="ad-side-foot"><a href="index.html" target="_blank" rel="noopener">View the shop</a>' +
      (live ? '<span>' + esc(CMS.email()) + '</span><button type="button" id="logout">Sign out</button>' : '<span>Demo mode</span>') + '</div></aside>' +
      '<main class="ad-main" id="adMain"></main></div>';
    main = $('#adMain');
    var lo = $('#logout'); if (lo) lo.addEventListener('click', function () { CMS.logout(); loginScreen(); });
  }

  function enter() {
    var next = new URLSearchParams(location.search).get('next');
    if (next && /^[\w.-]+\.html$/.test(next) && !S.redirected) { S.redirected = true; location.replace(next + '?edit=1'); return; }
    shell();
    CMS.loadContent().then(function (kv) { S.kv = kv; }, function () { S.kv = CT.load(); }).then(function () {
      if (!S.bound) { S.bound = true; window.addEventListener('hashchange', route); }
      route(); refreshCounts();
    });
  }

  function route() {
    var tab = (location.hash || '#dash').slice(1);
    if (!VIEWS[tab]) tab = 'dash';
    S.tab = tab;
    $$('#adNav a').forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('data-tab') === tab); });
    main.innerHTML = '<p class="ad-loading">Loading…</p>';
    window.scrollTo(0, 0);
    Promise.resolve().then(function () { return VIEWS[tab](); }).catch(function (e) { main.innerHTML = '<div class="ad-card"><h3>Could not load this page</h3><p class="hint">' + esc(e.message) + '</p></div>'; });
  }

  function head(title, sub, actions) {
    return '<div class="ad-head"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="ad-actions">' + actions + '</div>' : '') + '</div>';
  }
  function demoBanner() {
    return live ? '' : '<div class="ad-banner"><b>Demo mode.</b> Everything you change here is saved in <b>this browser only</b>, so you can try the whole dashboard. To make changes appear for every visitor and to receive real orders, the shop needs to be connected to Supabase — see the setup guide in <b>README.md</b>.</div>';
  }

  /* ================= data layer ================= */
  var STATUS = [['new', 'New'], ['confirmed', 'Confirmed'], ['packed', 'Packed'], ['dispatched', 'Dispatched'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']];
  var PAYSTATUS = [['pending', 'Not paid yet'], ['awaiting_slip', 'Waiting for bank slip'], ['slip_uploaded', 'Slip uploaded — please check'], ['paid', 'Paid'], ['failed', 'Payment failed'], ['refunded', 'Refunded']];
  var METHOD = { cod: 'Cash on delivery', bank_transfer: 'Bank transfer', card: 'Card' };
  function label(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return v; }

  function normOrder(r) {
    var items = r.order_items || r.items || [];
    return {
      id: r.id || r.order_no, no: r.order_no, at: r.created_at, status: r.status, pay: r.payment_method, paid: r.payment_status,
      name: r.customer_name, phone: r.phone, email: r.email || '',
      address: r.city ? [r.address, r.city, r.district, r.postal_code].filter(Boolean).join(', ') : r.address,
      notes: r.notes || '', sub: r.subtotal_lkr, ship: r.shipping_lkr, total: r.total_lkr, slip: r.payment_slip_path || '',
      courier: r.courier || '', track: r.tracking_no || '', note: r.admin_note || '',
      items: items.map(function (i) { return { name: i.name, label: i.variant_label, price: i.unit_price_lkr, qty: i.qty }; })
    };
  }
  function loadOrders() {
    if (!live) {
      var all = lsGet('ac_demo_orders', {});
      S.orders = Object.keys(all).map(function (k) { return normOrder(all[k]); }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
      return Promise.resolve();
    }
    return CMS.select('orders', 'select=*,order_items(*)&order=created_at.desc&limit=300').then(function (rows) { S.orders = rows.map(normOrder); });
  }
  function saveOrder(o, patch) {
    if (!live) {
      var all = lsGet('ac_demo_orders', {}); if (!all[o.no]) return Promise.reject(new Error('Order not found.'));
      all[o.no].status = patch.status; all[o.no].payment_status = patch.payment_status; all[o.no].courier = patch.courier; all[o.no].tracking_no = patch.tracking_no; all[o.no].admin_note = patch.admin_note;
      return lsSet('ac_demo_orders', all) ? Promise.resolve() : Promise.reject(new Error('Not saved.'));
    }
    patch.updated_at = new Date().toISOString();
    return CMS.patch('orders', 'id=eq.' + encodeURIComponent(o.id), patch);
  }

  function loadForms() {
    if (!live) {
      S.forms = lsGet('ac_demo_forms', []).map(function (f, i) { return { id: i, type: f.type, at: f.at, data: f.data || {}, handled: !!f.handled }; }).reverse();
      return Promise.resolve();
    }
    return CMS.select('form_submissions', 'select=*&order=created_at.desc&limit=500').then(function (rows) {
      S.forms = rows.map(function (r) { return { id: r.id, type: r.type, at: r.created_at, data: r.data || {}, handled: r.handled }; });
    });
  }
  function setHandled(f, v) {
    if (!live) { var all = lsGet('ac_demo_forms', []); if (all[f.id]) all[f.id].handled = v; lsSet('ac_demo_forms', all); return Promise.resolve(); }
    return CMS.patch('form_submissions', 'id=eq.' + f.id, { handled: v });
  }
  function delForm(f) {
    if (!live) { var all = lsGet('ac_demo_forms', []); all.splice(f.id, 1); lsSet('ac_demo_forms', all); return Promise.resolve(); }
    return CMS.remove('form_submissions', 'id=eq.' + f.id);
  }

  function fromRow(r) {
    return {
      id: r.id, kind: r.kind, fragrance: r.fragrance, name: r.name, badge: r.badge || '', tagline: r.tagline || '', description: r.description || '', how_to_use: r.how_to_use || '',
      images: r.images || [], sort: r.sort || 0, active: r.active !== false,
      variants: (r.variants || []).slice().sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); }).map(function (v) {
        return { id: v.id, label: v.label, price: v.price_lkr, compare_at: v.compare_at_lkr, stock: v.stock, active: v.active !== false };
      })
    };
  }
  function demoProducts() {
    var saved = lsGet('ac_demo_products', null);
    if (saved) return saved;
    return D.products.map(function (p, i) {
      return {
        id: p.id, kind: p.kind, fragrance: p.fragrance, name: p.name, badge: p.badge || '', tagline: p.tagline || '', description: p.description || '', how_to_use: p.how_to_use || '',
        images: (p.images || []).slice(), sort: i * 10, active: true,
        variants: p.variants.map(function (v) { return { id: v.id, label: v.label, price: v.price, compare_at: v.compare_at || null, stock: v.stock == null ? null : v.stock, active: true }; })
      };
    });
  }
  function loadProducts() {
    if (!live) { S.products = demoProducts(); return Promise.resolve(); }
    return CMS.select('products', 'select=*,variants(*)&order=sort.asc').then(function (rows) { S.products = rows.map(fromRow); });
  }
  function persistDemoProducts() { return lsSet('ac_demo_products', S.products); }
  function productRow(p) { return { id: p.id, kind: p.kind, fragrance: p.fragrance, name: p.name, badge: p.badge || null, tagline: p.tagline || null, description: p.description || null, how_to_use: p.how_to_use || null, images: p.images, sort: p.sort, active: p.active }; }
  function variantRows(p) {
    return p.variants.map(function (v, i) { return { id: v.id, product_id: p.id, label: v.label, price_lkr: v.price, compare_at_lkr: v.compare_at, stock: v.stock, sort: i * 10, active: v.active }; });
  }
  function saveProduct(p, old) {
    if (!live) {
      var i = S.products.findIndex(function (x) { return x.id === p.id; });
      if (i < 0) S.products.push(p); else S.products[i] = p;
      return persistDemoProducts() ? Promise.resolve() : Promise.reject(new Error('Not saved.'));
    }
    var gone = old ? old.variants.map(function (v) { return v.id; }).filter(function (id) { return !p.variants.some(function (v) { return v.id === id; }); }) : [];
    return CMS.upsert('products', [productRow(p)], 'id')
      .then(function () { return CMS.upsert('variants', variantRows(p), 'id'); })
      .then(function () { return gone.length ? CMS.remove('variants', 'id=in.(' + encodeURIComponent(gone.map(function (g) { return '"' + g + '"'; }).join(',')) + ')') : null; });
  }
  function deleteProduct(p) {
    if (!live) { S.products = S.products.filter(function (x) { return x.id !== p.id; }); persistDemoProducts(); return Promise.resolve(); }
    return CMS.remove('products', 'id=eq.' + encodeURIComponent(p.id));
  }
  function patchProduct(p, fields) {
    if (!live) { for (var k in fields) p[k] = fields[k]; persistDemoProducts(); return Promise.resolve(); }
    return CMS.patch('products', 'id=eq.' + encodeURIComponent(p.id), fields).then(function () { for (var k in fields) p[k] = fields[k]; });
  }

  var DEFAULT_NAME = 'Audrey Care';
  var DEFAULTS = { shipping_flat: C.SHIPPING_FLAT_LKR, free_over: C.FREE_SHIPPING_OVER_LKR, payments: { cod: true, bank: true, card: true }, bank: { bank: '', account_name: '', account_no: '', branch: '' } };
  function loadSettings() {
    var s = JSON.parse(JSON.stringify(DEFAULTS));
    if (!live) {
      var d = lsGet('ac_demo_settings', null);
      if (d) for (var k in d) s[k] = d[k];
      S.settings = s; return Promise.resolve();
    }
    return CMS.select('settings', 'select=key,value').then(function (rows) {
      rows.forEach(function (r) {
        if (r.key === 'shipping_flat_lkr') s.shipping_flat = Number(r.value);
        if (r.key === 'free_shipping_over_lkr') s.free_over = Number(r.value);
        if (r.key === 'payments' && r.value) s.payments = r.value;
        if (r.key === 'bank' && r.value) s.bank = r.value;
      });
      S.settings = s;
    });
  }
  function saveSettings(s) {
    if (!live) return lsSet('ac_demo_settings', s) ? Promise.resolve() : Promise.reject(new Error('Not saved.'));
    return CMS.upsert('settings', [
      { key: 'shipping_flat_lkr', value: s.shipping_flat }, { key: 'free_shipping_over_lkr', value: s.free_over },
      { key: 'payments', value: s.payments }, { key: 'bank', value: s.bank }
    ], 'key');
  }

  function saveKv(set, remove) {
    return CMS.saveContent(set, remove).then(function () {
      for (var k in set) S.kv[k] = set[k];
      (remove || []).forEach(function (k) { delete S.kv[k]; });
    });
  }

  function refreshCounts() {
    Promise.all([loadOrders().catch(function () { S.orders = S.orders || []; }), loadForms().catch(function () { S.forms = S.forms || []; })]).then(function () {
      var n1 = (S.orders || []).filter(function (o) { return o.status === 'new'; }).length, n2 = (S.forms || []).filter(function (f) { return !f.handled && f.type !== 'newsletter'; }).length;
      [['orders', n1], ['messages', n2]].forEach(function (x) {
        var el = $('#adNav a[data-tab="' + x[0] + '"] .n'); if (!el) return; el.textContent = x[1]; el.hidden = !x[1];
      });
    });
  }

  /* ================= views ================= */
  var VIEWS = {};

  /* ---------- Overview ---------- */
  VIEWS.dash = function () {
    return Promise.all([loadOrders(), loadForms(), loadProducts(), loadSettings()]).then(function () {
      var newOrders = S.orders.filter(function (o) { return o.status === 'new'; }).length;
      var slips = S.orders.filter(function (o) { return o.paid === 'slip_uploaded'; }).length;
      var msgs = S.forms.filter(function (f) { return !f.handled && f.type !== 'newsletter'; }).length;
      var hasLogo = !!(S.kv['img.logo'] || C.LOGO), hasContact = !!(S.kv['contact.phone'] || S.kv['contact.whatsapp'] || S.kv['contact.email'] || C.PHONE || C.WHATSAPP_NUMBER || C.EMAIL);
      var bank = S.settings.bank || {}, hasBank = !!bank.account_no;
      var checks = [
        [live, 'Connect the shop to Supabase so your changes and customers’ orders are saved for real', 'https://github.com/ceyflow/audrey-care-shop#readme'],
        [hasLogo, 'Add your logo', '#images'], [hasContact, 'Add your phone, WhatsApp and email', '#settings'],
        [hasBank, 'Add your bank details for bank transfers', '#settings'], [false, 'Check your products, sizes and prices', '#products'],
        [false, 'Read through the policy pages (delivery, returns, privacy, terms) and make them yours', 'policies.html?edit=1']
      ];
      main.innerHTML = demoBanner() + head('Overview', 'Here is what needs your attention today.') +
        '<div class="ad-stats">' +
        '<a class="ad-stat" href="#orders"><b>' + newOrders + '</b><span>New orders</span></a>' +
        '<a class="ad-stat" href="#orders"><b>' + slips + '</b><span>Bank slips to check</span></a>' +
        '<a class="ad-stat" href="#messages"><b>' + msgs + '</b><span>Messages to answer</span></a>' +
        '<a class="ad-stat" href="#products"><b>' + S.products.filter(function (p) { return p.active; }).length + '</b><span>Products in the shop</span></a></div>' +
        '<div class="ad-card"><h3>Getting started</h3><p class="hint">A short list to get the shop ready for customers.</p><ul class="ad-steps">' +
        checks.map(function (c) { return '<li class="' + (c[0] ? 'is-done' : '') + '"><i>' + (c[0] ? '✓' : '') + '</i><span>' + (c[2] ? '<a href="' + c[2] + '"' + (c[2].indexOf('.html') > -1 || c[2].indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '') + '>' + c[1] + '</a>' : c[1]) + '</span></li>'; }).join('') + '</ul></div>' +
        '<div class="ad-card"><h3>Change anything on your pages</h3><p class="hint">Open a page in edit mode, click any text to retype it, click any picture to replace it.</p>' + pageGrid() + '</div>';
    });
  };

  function pageGrid() {
    var first = (S.products && S.products[0]) || D.products[0];
    var list = [
      ['Home', 'index.html', 'Slides, categories, banners, tips'], ['Shop', 'shop.html', 'Titles, filters, labels'],
      ['Product page', 'product.html?id=' + encodeURIComponent(first.id), 'Tabs, delivery and help text'], ['Bulk orders', 'bulk.html', 'Wholesale page and form'],
      ['Our story', 'about.html', 'About text and picture'], ['Contact', 'contact.html', 'Contact page'],
      ['Advice', 'advice.html', 'Articles'], ['Quizzes', 'quiz.html', 'Fragrance quiz'],
      ['Checkout', 'checkout.html', 'Labels and payment text'], ['Track an order', 'order.html', 'Order lookup'], ['Policies', 'policies.html', 'Delivery, returns, privacy, terms']
    ];
    return '<div class="ad-pagegrid">' + list.map(function (p) {
      var url = p[1] + (p[1].indexOf('?') > -1 ? '&' : '?') + 'edit=1';
      return '<a class="ad-pagecard" href="' + esc(url) + '"><b>' + p[0] + '</b><span>' + p[2] + '</span><em>Edit this page →</em></a>';
    }).join('') + '</div>';
  }

  /* ---------- Orders ---------- */
  VIEWS.orders = function () {
    return loadOrders().then(renderOrders);
  };
  function payBadge(o) {
    var cls = o.paid === 'paid' ? 'good' : o.paid === 'slip_uploaded' ? 'warn' : o.paid === 'failed' || o.paid === 'refunded' ? 'bad' : '';
    return '<span class="ad-badge ' + cls + '">' + esc(label(PAYSTATUS, o.paid)) + '</span>';
  }
  function statusBadge(o) {
    var cls = o.status === 'new' ? 'new' : o.status === 'delivered' ? 'good' : o.status === 'cancelled' ? 'bad' : 'info';
    return '<span class="ad-badge ' + cls + '">' + esc(label(STATUS, o.status)) + '</span>';
  }
  function renderOrders() {
    var u = S.ui, list = S.orders.filter(function (o) {
      if (u.orderFilter !== 'all' && o.status !== u.orderFilter) return false;
      var q = u.orderQ.trim().toLowerCase();
      return !q || (o.no + ' ' + o.name + ' ' + o.phone).toLowerCase().indexOf(q) > -1;
    });
    var counts = {}; S.orders.forEach(function (o) { counts[o.status] = (counts[o.status] || 0) + 1; });
    main.innerHTML = demoBanner() + head('Orders', 'Click an order to see the details, update its progress and add tracking.',
      '<button class="ad-btn ad-btn--ghost" data-act="orders-csv">Download list (CSV)</button>') +
      '<div class="ad-bar"><div class="ad-chips">' + [['all', 'All']].concat(STATUS).map(function (s) {
        return '<button class="ad-chip' + (u.orderFilter === s[0] ? ' is-on' : '') + '" data-act="order-filter" data-v="' + s[0] + '">' + s[1] + '<i>' + (s[0] === 'all' ? S.orders.length : (counts[s[0]] || 0)) + '</i></button>';
      }).join('') + '</div><input class="ad-in" id="orderQ" type="search" placeholder="Search name, phone or order no." value="' + esc(u.orderQ) + '"></div>' +
      (list.length ? '<div class="ad-tablewrap"><table class="ad-table"><thead><tr><th>Order</th><th>Placed</th><th>Customer</th><th>Payment</th><th class="num">Total</th><th>Progress</th></tr></thead><tbody>' +
        list.map(function (o) {
          return '<tr data-open="' + esc(o.no) + '"><td><b>' + esc(o.no) + '</b></td><td class="sm">' + when(o.at) + '</td><td>' + esc(o.name) + '<div class="sm">' + esc(o.phone) + '</div></td>' +
            '<td>' + esc(METHOD[o.pay] || o.pay) + '<div>' + payBadge(o) + '</div></td><td class="num">' + money(o.total) + '</td><td>' + statusBadge(o) + '</td></tr>';
        }).join('') + '</tbody></table></div>' :
        '<div class="ad-card ad-empty">' + (S.orders.length ? 'No orders match.' : 'No orders yet. When a customer places one it will appear here.') + '</div>');
    var q = $('#orderQ');
    q.addEventListener('input', function () { u.orderQ = q.value; var pos = q.selectionStart; renderOrders(); var n = $('#orderQ'); n.focus(); n.setSelectionRange(pos, pos); });
  }

  function openOrder(no) {
    var o = S.orders.filter(function (x) { return x.no === no; })[0]; if (!o) return;
    var first = (o.name || '').split(' ')[0];
    var over = document.createElement('div'); over.className = 'ad-over';
    over.innerHTML = '<div class="ad-panel" role="dialog" aria-label="Order ' + esc(o.no) + '"><header><div><h2>' + esc(o.no) + '</h2><div class="sm" style="color:#777">' + when(o.at) + '</div></div><button class="ad-x" data-close aria-label="Close">×</button></header>' +
      '<dl class="ad-kv"><dt>Customer</dt><dd><b>' + esc(o.name) + '</b></dd><dt>Phone</dt><dd><a href="tel:' + esc(o.phone) + '">' + esc(o.phone) + '</a> · <a href="' + esc(waLink(o.phone)) + '" target="_blank" rel="noopener">WhatsApp</a></dd>' +
      (o.email ? '<dt>Email</dt><dd><a href="mailto:' + esc(o.email) + '">' + esc(o.email) + '</a></dd>' : '') + '<dt>Address</dt><dd>' + esc(o.address) + '</dd>' +
      (o.notes ? '<dt>Customer note</dt><dd>' + esc(o.notes) + '</dd>' : '') + '<dt>Payment</dt><dd>' + esc(METHOD[o.pay] || o.pay) + '</dd></dl>' +
      '<div class="ad-lines">' + o.items.map(function (i) { return '<div><span>' + esc(i.name) + ' <span style="color:#777">· ' + esc(i.label) + ' × ' + i.qty + '</span></span><span>' + money(i.price * i.qty) + '</span></div>'; }).join('') +
      '<div><span>Delivery</span><span>' + (o.ship ? money(o.ship) : 'Free') + '</span></div><div class="t"><span>Total</span><span>' + money(o.total) + '</span></div></div>' +
      (o.pay === 'bank_transfer' ? '<div class="ad-field"><label>Bank slip</label>' + (o.slip && live ? '<button class="ad-btn ad-btn--ghost ad-btn--sm" data-act="view-slip" style="justify-self:start">Open payment slip</button>' : '<span class="note">' + (o.slip ? 'Uploaded (demo)' : 'Not uploaded yet') + '</span>') + '</div>' : '') +
      '<form id="orderForm" class="ad-grid">' +
      field('Order progress', select('status', o.status, STATUS)) + field('Payment', select('payment_status', o.paid, PAYSTATUS)) +
      field('Courier', input('courier', o.courier, { ph: 'e.g. Domex, Pronto' })) + field('Tracking number', input('tracking_no', o.track), 'The customer sees this on their order page.') +
      field('Your private note', '<textarea class="ad-in" name="admin_note" placeholder="Only you can see this">' + esc(o.note) + '</textarea>', '', 'full') +
      '<div class="full ad-actions"><button class="ad-btn" type="submit">Save changes</button>' +
      '<a class="ad-btn ad-btn--ghost" id="orderWa" target="_blank" rel="noopener" href="#">Message on WhatsApp</a></div></form></div>';
    document.body.appendChild(over);
    var form = $('#orderForm', over);
    function close() { over.remove(); }
    function waText() {
      var s = form.status.value, t = 'Hi ' + first + ', this is Audrey Care about your order ' + o.no + '. ';
      if (s === 'confirmed') t += 'We have confirmed your order and are getting it ready.';
      else if (s === 'packed') t += 'Your order is packed and will be handed to the courier soon.';
      else if (s === 'dispatched') t += 'Your order is on its way' + (form.courier.value ? ' with ' + form.courier.value : '') + (form.tracking_no.value ? ' (tracking: ' + form.tracking_no.value + ')' : '') + '.';
      else if (s === 'delivered') t += 'Your order has been delivered. We hope you love it!';
      else if (s === 'cancelled') t += 'Your order has been cancelled.';
      else t += 'Thank you for your order.';
      return t;
    }
    function setWa() { $('#orderWa', over).href = waLink(o.phone, waText()); }
    setWa(); form.addEventListener('input', setWa);
    over.addEventListener('click', function (e) {
      if (e.target === over || e.target.hasAttribute('data-close')) close();
      var b = e.target.closest('[data-act="view-slip"]');
      if (b) busy(b, CMS.slipUrl(o.slip)).then(function (url) { window.open(url, '_blank'); }).catch(fail);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var patch = { status: form.status.value, payment_status: form.payment_status.value, courier: form.courier.value.trim() || null, tracking_no: form.tracking_no.value.trim() || null, admin_note: form.admin_note.value.trim() || null };
      busy($('button[type=submit]', form), saveOrder(o, patch)).then(function () {
        o.status = patch.status; o.paid = patch.payment_status; o.courier = patch.courier || ''; o.track = patch.tracking_no || ''; o.note = patch.admin_note || '';
        toast('Order saved'); close(); renderOrders(); refreshCounts();
      }).catch(fail);
    });
    document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc_); } });
  }

  /* ---------- Products ---------- */
  VIEWS.products = function () { return loadProducts().then(renderProducts); };

  function thumb(p) {
    if (p.images && p.images[0]) return '<img src="' + esc(p.images[0]) + '" alt="">';
    return ART.packshot({ name: p.name, kind: p.kind, fragrance: p.fragrance }, { plain: true });
  }
  function fragName(id) { var f = D.fragrances.filter(function (x) { return x.id === id; })[0]; return f ? f.name : id; }
  function kindName(id) { var k = D.kinds.filter(function (x) { return x.id === id; })[0]; return k ? k.name : id; }

  function renderProducts() {
    S.editing = null;
    main.innerHTML = demoBanner() + head('Products', 'Everything you sell. Turn a product off to hide it from the shop without deleting it.',
      '<button class="ad-btn" data-act="p-new">+ Add a product</button>') +
      (S.products.length ? '<div class="ad-tablewrap"><table class="ad-table"><thead><tr><th>Product</th><th>Type</th><th>Prices</th><th>Stock</th><th>In shop</th><th>Order</th><th></th></tr></thead><tbody>' +
        S.products.map(function (p, i) {
          var prices = p.variants.map(function (v) { return v.price; }), lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
          var stock = p.variants.every(function (v) { return v.stock == null; }) ? '<span class="sm">Not tracked</span>' : p.variants.map(function (v) { return v.stock == null ? '–' : v.stock; }).join(' / ');
          return '<tr data-id="' + esc(p.id) + '"><td><div class="ad-prodcell"><span class="ad-thumb">' + thumb(p) + '</span><span><b>' + esc(p.name) + ' ' + esc(fragName(p.fragrance)) + '</b>' + (p.badge ? '<span class="ad-badge new">' + esc(p.badge) + '</span>' : '') + '</span></div></td>' +
            '<td>' + esc(kindName(p.kind)) + '</td><td>' + (prices.length ? (lo === hi ? money(lo) : money(lo) + ' – ' + money(hi)) : '<span class="sm">No sizes</span>') + '</td><td>' + stock + '</td>' +
            '<td>' + toggle('active', p.active).replace('<input', '<input data-act="p-active"') + '</td>' +
            '<td class="num"><button class="ad-link" data-act="p-up"' + (i === 0 ? ' disabled style="opacity:.3"' : '') + ' aria-label="Move up">▲</button> <button class="ad-link" data-act="p-down"' + (i === S.products.length - 1 ? ' disabled style="opacity:.3"' : '') + ' aria-label="Move down">▼</button></td>' +
            '<td class="num"><button class="ad-btn ad-btn--ghost ad-btn--sm" data-act="p-edit">Edit</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="ad-card ad-empty">No products yet. Add your first one.</div>');
  }

  function blankProduct() {
    return { id: '', kind: D.kinds[0].id, fragrance: D.fragrances[0].id, name: '', badge: '', tagline: '', description: '', how_to_use: '', images: [], sort: 0, active: true, variants: [{ id: '', label: '', price: '', compare_at: null, stock: null, active: true }], isNew: true };
  }
  function varRow(v) {
    return '<tr data-id="' + esc(v.id || '') + '"><td>' + input('label', v.label, { ph: '250 ml' }) + '</td><td>' + input('price', v.price, { type: 'number', attrs: 'min="0" step="1"' }) + '</td>' +
      '<td>' + input('compare', v.compare_at == null ? '' : v.compare_at, { type: 'number', attrs: 'min="0" step="1"', ph: 'optional' }) + '</td>' +
      '<td>' + input('stock', v.stock == null ? '' : v.stock, { type: 'number', attrs: 'min="0" step="1"', ph: 'not tracked' }) + '</td>' +
      '<td>' + toggle('vactive', v.active) + '</td><td><button type="button" class="ad-link" data-act="p-rmvar">Remove</button></td></tr>';
  }
  function photosHtml(p) {
    return p.images.map(function (src, i) {
      return '<div class="ad-photo"><div class="pic"><img src="' + esc(src) + '" alt=""></div><div class="row"><span>' + (i === 0 ? 'Main photo' : 'Photo ' + (i + 1)) + '</span></div>' +
        '<div class="row">' + (i > 0 ? '<button type="button" class="ad-link" data-act="p-photo-main" data-i="' + i + '">Make main</button>' : '<span></span>') + '<button type="button" class="ad-link" data-act="p-photo-rm" data-i="' + i + '">Remove</button></div></div>';
    }).join('') || '<p class="hint" style="margin:0">No photos yet — the shop shows a built-in illustration until you add one.</p>';
  }

  function editProduct(p) {
    S.editing = p;
    var form = '<form id="pForm">' +
      '<div class="ad-card"><div class="ad-grid">' +
      field('Product name', input('name', p.name, { ph: 'e.g. Gentle Shampoo' }), 'The fragrance is added automatically, e.g. “Gentle Shampoo Lavender”.') +
      field('Fragrance', select('fragrance', p.fragrance, D.fragrances.map(function (f) { return [f.id, f.name]; }))) +
      field('Type', select('kind', p.kind, D.kinds.map(function (k) { return [k.id, k.name]; }))) +
      field('Label on the picture', input('badge', p.badge, { ph: 'e.g. New or Bestseller (optional)' }).replace('<input', '<input list="badgeList"') + '<datalist id="badgeList"><option value="New"><option value="Bestseller"></datalist>') +
      field('Short line', input('tagline', p.tagline, { ph: 'A soft daily lather for clean, comfortable hair.' }), 'Shown in search and under the title.', 'full') +
      field('Description', '<textarea class="ad-in" name="description">' + esc(p.description) + '</textarea>', '', 'full') +
      field('How to use', '<textarea class="ad-in" name="how_to_use">' + esc(p.how_to_use) + '</textarea>', 'Shown in the “How to use” section. Leave empty to hide it.', 'full') +
      '</div></div>' +
      '<div class="ad-card"><h3>Photos</h3><p class="hint">The first photo is the main picture. A square or portrait photo on a plain light background looks best.</p><div class="ad-photos" id="pPhotos">' + photosHtml(p) + '</div>' +
      '<button type="button" class="ad-btn ad-btn--ghost" data-act="p-addphoto">Add photos</button><input type="file" id="pFiles" accept="image/jpeg,image/png,image/webp" multiple hidden></div>' +
      '<div class="ad-card"><h3>Sizes &amp; prices</h3><p class="hint">Each size is sold separately. Leave “stock” empty if you don’t count it; put 0 to show “out of stock”. “Was price” shows a crossed-out higher price.</p>' +
      '<div class="ad-tablewrap" style="box-shadow:none"><table class="ad-table ad-varrows"><thead><tr><th>Size</th><th>Price (Rs)</th><th>Was price</th><th>Stock</th><th>For sale</th><th></th></tr></thead><tbody id="pVars">' + p.variants.map(varRow).join('') + '</tbody></table></div>' +
      '<button type="button" class="ad-btn ad-btn--ghost ad-btn--sm" data-act="p-addvar" style="margin-top:12px">+ Add a size</button></div>' +
      '<div class="ad-card"><label class="ad-check">' + toggle('active', p.active) + ' Show this product in the shop</label></div>' +
      '<div class="ad-actions"><button class="ad-btn" type="submit">Save product</button><button class="ad-btn ad-btn--ghost" type="button" data-act="p-cancel">Cancel</button>' +
      (p.isNew ? '' : '<button class="ad-btn ad-btn--danger" type="button" data-act="p-delete" style="margin-left:auto">Delete product</button>') + '</div></form>';
    main.innerHTML = demoBanner() + head(p.isNew ? 'Add a product' : esc(p.name) + ' ' + esc(fragName(p.fragrance)), '<a href="#products" data-act="p-cancel" class="ad-link">← Back to products</a>') + form;
    window.scrollTo(0, 0);

    var f = $('#pForm');
    f.addEventListener('submit', function (e) { e.preventDefault(); submitProduct(f, p); });
    $('#pFiles').addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files); if (!files.length) return;
      toast('Uploading ' + files.length + (files.length > 1 ? ' photos…' : ' photo…'));
      files.reduce(function (chain, file) {
        return chain.then(function () { return CMS.uploadImage(file, 'products', live ? 1600 : 900).then(function (url) { p.images.push(url); }); });
      }, Promise.resolve()).then(function () { $('#pPhotos').innerHTML = photosHtml(p); toast('Photos added — press Save product to keep them'); }).catch(fail);
      e.target.value = '';
    });
  }

  function submitProduct(f, p) {
    var name = f.elements.name.value.trim();
    if (!name) return toast('Please enter a product name.', true);
    var rows = $$('#pVars tr'), vars = [], seen = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], lab = $('[name=label]', r).value.trim(), price = $('[name=price]', r).value;
      if (!lab && price === '') continue;
      if (!lab) return toast('Every size needs a name, like “250 ml”.', true);
      if (price === '' || Number(price) < 0) return toast('Enter a price for “' + lab + '”.', true);
      if (seen[lab.toLowerCase()]) return toast('You have two sizes called “' + lab + '”.', true);
      seen[lab.toLowerCase()] = 1;
      var cmp = $('[name=compare]', r).value, st = $('[name=stock]', r).value;
      vars.push({ id: r.getAttribute('data-id'), label: lab, price: Math.round(Number(price)), compare_at: cmp === '' ? null : Math.round(Number(cmp)), stock: st === '' ? null : Math.round(Number(st)), active: $('[name=vactive]', r).checked });
    }
    if (!vars.length) return toast('Add at least one size with a price.', true);
    var old = p.isNew ? null : JSON.parse(JSON.stringify(p));
    var np = {
      id: p.id, kind: f.kind.value, fragrance: f.fragrance.value, name: name, badge: f.badge.value.trim(), tagline: f.tagline.value.trim(), description: f.description.value.trim(), how_to_use: f.how_to_use.value.trim(),
      images: p.images, sort: p.sort, active: f.active.checked, variants: vars
    };
    if (!np.id) {
      var base = slug(np.name + '-' + np.fragrance) || 'product', id = base, n = 2;
      while (S.products.some(function (x) { return x.id === id; })) id = base + '-' + (n++);
      np.id = id; np.sort = S.products.reduce(function (m, x) { return Math.max(m, x.sort || 0); }, 0) + 10;
    }
    var used = {};
    vars.forEach(function (v) { if (v.id) used[v.id] = 1; });
    vars.forEach(function (v) {
      if (v.id) return;
      var b = np.id + '-' + (slug(v.label) || 'size'), id = b, k = 2;
      while (used[id]) id = b + '-' + (k++);
      used[id] = 1; v.id = id;
    });
    busy($('button[type=submit]', f), saveProduct(np, old)).then(function () {
      toast('Product saved'); return loadProducts();
    }).then(function () { location.hash = '#products'; if (S.tab === 'products') renderProducts(); }).catch(fail);
  }

  /* ---------- Edit pages & changed texts ---------- */
  function toPlain(html) { return html.replace(/<br\s*\/?>/gi, '\n').replace(/<(em|i)>(.*?)<\/\1>/gi, '*$2*').replace(/<(strong|b)>(.*?)<\/\1>/gi, '$2').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' '); }
  function simpleHtml(html) { return !/<(?!\/?(em|i|strong|b|br)\b)[a-z]/i.test(html); }
  function fromPlain(t) {
    var d = document.createElement('div'); d.textContent = t;
    return d.innerHTML.replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  }
  VIEWS.pages = function () {
    return loadProducts().then(function () {
      var edits = CMS.textEdits(S.kv);
      main.innerHTML = demoBanner() + head('Edit pages', 'Open any page and change it right there — click a text to retype it, click a picture to replace it. Changes save as you go.') +
        '<div class="ad-card"><h3>Pick a page</h3><p class="hint">Words you change are updated everywhere that exact wording appears (for example a button name used on several pages).</p>' + pageGrid() + '</div>' +
        (function () {
          var n = Object.keys(S.kv).filter(function (k) { return k.indexOf('sty.') === 0; }).length;
          return '<div class="ad-card"><h3>Colours changed on pages (' + n + ')</h3><p class="hint">Click any text, button or box while editing a page and a small colour panel appears. Use <b>Bigger</b> in that panel to colour the whole box around it. For colours across the whole shop, use the <a href="#design">Colours</a> page.</p>' +
            (n ? '<button class="ad-btn ad-btn--ghost ad-btn--sm" data-act="sty-reset">Put all page colours back to normal</button>' : '<p class="ad-empty" style="padding:6px 0 0;text-align:left">Nothing changed yet.</p>') + '</div>';
        })() +
        '<div class="ad-card"><h3>Texts you have changed (' + edits.length + ')</h3><p class="hint">Edit or undo any change here. Put *stars* around words to make them the soft italic accent, like *softer*.</p>' +
        (edits.length ? '<div class="ad-texts">' + edits.map(function (t, i) {
          var ok = simpleHtml(t.now);
          return '<div class="ad-text" data-key="' + esc(t.key) + '"><div class="was">Original: <s>' + esc(toPlain(t.original)) + '</s></div>' +
            (ok ? '<textarea class="ad-in" rows="2">' + esc(toPlain(t.now)) + '</textarea>' : '<div class="ad-banner" style="margin:0">This text contains a link, so edit it by opening the page.</div>') +
            '<div class="acts">' + (ok ? '<button class="ad-btn ad-btn--sm" data-act="text-save" data-i="' + i + '">Save</button>' : '') + '<button class="ad-btn ad-btn--ghost ad-btn--sm" data-act="text-reset" data-i="' + i + '">Back to original</button></div></div>';
        }).join('') + '</div>' : '<p class="ad-empty" style="padding:20px 0">Nothing changed yet.</p>') + '</div>';
      S.edits = edits;
    });
  };

  /* ---------- Photos & logo ---------- */
  var SLOTS = [
    ['logo', 'Logo', 'Top-left of every page. A transparent PNG or SVG, at least 200 px tall.', 800],
    ['hero1', 'Home slide 1 — “Gentle by nature”', '1000 × 800', 1800], ['hero2', 'Home slide 2 — “Find your scent”', '1000 × 800', 1800], ['hero3', 'Home slide 3 — “Made with care”', '1000 × 800', 1800],
    ['banner', 'Wide banner (text on the right)', '1600 × 640', 2000], ['band', 'Bulk orders block (green)', '900 × 600', 1400], ['split', 'Square picture beside “Care that’s kind…”', '640 × 640', 1200],
    ['about', 'Our story — portrait picture', '520 × 650', 1200],
    ['tiles.all', 'Category tile — All', '340 × 220', 900], ['tiles.hair', 'Category tile — Hair', '340 × 220', 900], ['tiles.body', 'Category tile — Body', '340 × 220', 900],
    ['tiles.hands', 'Category tile — Hands', '340 × 220', 900], ['tiles.home', 'Category tile — Home', '340 × 220', 900], ['tiles.bulk', 'Category tile — Bulk orders', '340 × 220', 900]
  ];
  function builtIn(name) {
    try {
      if (name === 'logo') return LOGO_SVG;
      if (name === 'hero1') return ART.hero('care'); if (name === 'hero2') return ART.hero('scent'); if (name === 'hero3') return ART.hero('bulk');
      if (name === 'banner') return ART.wide(); if (name === 'band') return ART.band(); if (name === 'split' || name === 'about') return ART.editorial();
      if (name.indexOf('tiles.') === 0) return ART.tile(name.slice(6));
    } catch (e) { /* preview only */ }
    return '';
  }
  function slotCard(s) {
    var url = S.kv['img.' + s[0]];
    return '<div class="ad-slot" data-slot="' + s[0] + '"><div class="prev' + (s[0] === 'logo' ? ' logo' : '') + '"><span class="tag">' + (url ? 'Your picture' : 'Built-in picture') + '</span>' + (url ? '<img src="' + esc(url) + '" alt="">' : builtIn(s[0])) + '</div>' +
      '<div class="body"><b>' + esc(s[1]) + '</b><span>' + esc(s[2]) + (s[0] === 'logo' ? '' : ' px · JPG, PNG or WebP') + '</span><div class="acts"><button class="ad-btn ad-btn--sm" data-act="slot-pick">' + (url ? 'Replace' : 'Upload') + '</button>' + (url ? '<button class="ad-btn ad-btn--ghost ad-btn--sm" data-act="slot-clear">Use built-in</button>' : '') + '</div></div></div>';
  }
  VIEWS.images = function () {
    main.innerHTML = demoBanner() + head('Photos & logo', 'Replace the logo and the pictures on your pages. Pictures are shrunk automatically so the shop stays fast.') +
      '<div class="ad-slots">' + SLOTS.map(slotCard).join('') + '</div><input type="file" id="slotFile" accept="image/jpeg,image/png,image/webp,image/svg+xml" hidden>' +
      '<div class="ad-card" style="margin-top:20px"><h3>Product photos</h3><p class="hint">Photos of your products are added on each product — open <a href="#products">Products</a> and press Edit.</p></div>';
  };

  /* ---------- Colours ---------- */
  var COLORS = [['brand', 'Main colour', 'Header, buttons, headings', '#143d2c'], ['gold', 'Accent colour', 'Small highlights and the soft italic words', '#ab8457'], ['text', 'Text colour', 'Body text', '#3b3b3b'], ['soft', 'Soft background', 'Grey panels and cards', '#f6f6f6']];
  VIEWS.design = function () {
    function cur(c) { return S.kv['theme.' + c[0]] || c[3]; }
    main.innerHTML = demoBanner() + head('Colours', 'Change the shop’s main colours everywhere at once. Related shades (hover colours, soft tints) follow your main colour automatically. To colour just one button, heading or box, open <a href="#pages">Edit pages</a> and click it.') +
      '<div class="ad-card"><form id="colorForm"><div class="ad-colors">' + COLORS.map(function (c) {
        return '<label class="ad-color"><input type="color" name="' + c[0] + '" value="' + esc(cur(c)) + '"><span><b>' + c[1] + '</b><span>' + c[2] + '</span></span></label>';
      }).join('') + '</div>' +
      '<div class="ad-sample" id="colorSample"><h4>Gentle by <em style="color:var(--gold)">nature</em></h4><span class="b">Shop now</span></div>' +
      '<div class="ad-actions" style="margin-top:18px"><button class="ad-btn" type="submit">Save colours</button><button class="ad-btn ad-btn--ghost" type="button" data-act="colors-reset">Back to Audrey Care colours</button></div></form></div>';
    var f = $('#colorForm'), sample = $('#colorSample');
    function paint() { var b = f.brand.value; sample.style.background = f.soft.value; sample.style.color = f.text.value; $('h4', sample).style.color = b; $('em', sample).style.color = f.gold.value; var btn = $('.b', sample); btn.style.background = b; btn.style.borderColor = b; btn.style.color = '#fff'; }
    f.addEventListener('input', paint); paint();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var set = {}, rem = [];
      COLORS.forEach(function (c) { var v = f[c[0]].value; if (v.toLowerCase() === c[3]) rem.push('theme.' + c[0]); else set['theme.' + c[0]] = v; });
      busy($('button[type=submit]', f), saveKv(set, rem)).then(function () { toast('Colours saved'); }).catch(fail);
    });
  };

  /* ---------- Settings ---------- */
  VIEWS.settings = function () {
    return loadSettings().then(function () {
      var s = S.settings, kv = S.kv, pay = s.payments || {}, b = s.bank || {};
      function k(key, dflt) { return kv[key] != null ? kv[key] : (dflt || ''); }
      main.innerHTML = demoBanner() + head('Settings', 'Your contact details, delivery charges and payment options.') +
        '<form id="setForm"><div class="ad-card"><h3>Contact details</h3><p class="hint">Shown in the footer, on the contact page and on the chat button. Leave blank to hide.</p><div class="ad-grid">' +
        field('Shop name (footer)', input('site_name', k('site.name', DEFAULT_NAME))) + field('Phone', input('phone', k('contact.phone', C.PHONE), { ph: '+94 77 123 4567' })) +
        field('WhatsApp number', input('whatsapp', k('contact.whatsapp', C.WHATSAPP_NUMBER), { ph: '94771234567' }), 'Country code first, digits only. Customers tap the chat button to message this number.') +
        field('Email', input('email', k('contact.email', C.EMAIL), { type: 'email', ph: 'hello@yourdomain.lk' })) +
        field('Address', input('address', k('contact.address', C.ADDRESS)), '', 'full') + '</div></div>' +
        '<div class="ad-card"><h3>Delivery</h3><p class="hint">Charges added at checkout.</p><div class="ad-grid">' +
        field('Delivery charge per order (Rs)', input('shipping_flat', s.shipping_flat, { type: 'number', attrs: 'min="0" step="1"' })) +
        field('Free delivery over (Rs)', input('free_over', s.free_over, { type: 'number', attrs: 'min="0" step="1"' }), 'Orders above this amount get free delivery.') + '</div></div>' +
        '<div class="ad-card"><h3>Ways to pay</h3><p class="hint">Turn off any method you don’t want to offer.</p>' +
        '<div style="display:grid;gap:12px"><label class="ad-check">' + toggle('pay_cod', pay.cod !== false) + ' Cash on delivery</label><label class="ad-check">' + toggle('pay_bank', pay.bank !== false) + ' Bank transfer (customer uploads the slip)</label><label class="ad-check">' + toggle('pay_card', pay.card !== false) + ' Debit &amp; credit cards (PayHere)</label></div></div>' +
        '<div class="ad-card"><h3>Your bank details</h3><p class="hint">Customers who choose bank transfer see these after checkout.</p><div class="ad-grid">' +
        field('Bank', input('bank_name', b.bank)) + field('Branch', input('bank_branch', b.branch)) + field('Account name', input('bank_acc_name', b.account_name)) + field('Account number', input('bank_acc_no', b.account_no)) + '</div></div>' +
        '<div class="ad-actions"><button class="ad-btn" type="submit">Save settings</button></div></form>';
      var f = $('#setForm');
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var set = {}, rem = [];
        [['site.name', f.site_name.value.trim(), DEFAULT_NAME], ['contact.phone', f.phone.value.trim()], ['contact.whatsapp', f.whatsapp.value.replace(/\D/g, '')], ['contact.email', f.email.value.trim()], ['contact.address', f.address.value.trim()]].forEach(function (x) {
          if (x[1] && x[1] !== x[2]) set[x[0]] = x[1]; else rem.push(x[0]);
        });
        var next = {
          shipping_flat: Math.max(0, Math.round(Number(f.shipping_flat.value) || 0)), free_over: Math.max(0, Math.round(Number(f.free_over.value) || 0)),
          payments: { cod: f.pay_cod.checked, bank: f.pay_bank.checked, card: f.pay_card.checked },
          bank: { bank: f.bank_name.value.trim(), account_name: f.bank_acc_name.value.trim(), account_no: f.bank_acc_no.value.trim(), branch: f.bank_branch.value.trim() }
        };
        if (!next.payments.cod && !next.payments.bank && !next.payments.card) return toast('Keep at least one way to pay switched on.', true);
        busy($('button[type=submit]', f), Promise.all([saveKv(set, rem), saveSettings(next)])).then(function () { S.settings = next; toast('Settings saved'); }).catch(fail);
      });
    });
  };

  /* ---------- Messages ---------- */
  var FORM_LABEL = { bulk: 'Bulk enquiry', contact: 'Message', newsletter: 'Newsletter' };
  var DATA_LABEL = { name: 'Name', business: 'Business', business_name: 'Business', phone: 'Phone', email: 'Email', message: 'Message', details: 'Details', kind: 'Looking for', quantity: 'Quantity', products: 'Products', city: 'City', type: 'Business type', fragrance: 'Fragrance', size: 'Size', subject: 'Subject' };
  VIEWS.messages = function () { return loadForms().then(renderMessages); };
  function formTitle(f) {
    var d = f.data;
    if (f.type === 'newsletter') return esc(d.email || 'Subscriber');
    return esc(d.name || d.business || d.email || d.phone || 'Someone');
  }
  function renderMessages() {
    var t = S.ui.msgType, list = S.forms.filter(function (f) { return t === 'all' ? f.type !== 'newsletter' : f.type === t; });
    var counts = { all: S.forms.filter(function (f) { return f.type !== 'newsletter'; }).length, bulk: 0, contact: 0, newsletter: 0 };
    S.forms.forEach(function (f) { counts[f.type] = (counts[f.type] || 0) + 1; });
    list = list.slice().sort(function (a, b) { return (a.handled === b.handled) ? (a.at < b.at ? 1 : -1) : (a.handled ? 1 : -1); });
    main.innerHTML = demoBanner() + head('Messages', 'Bulk enquiries, contact messages and newsletter sign-ups from your website.',
      '<button class="ad-btn ad-btn--ghost" data-act="forms-csv">Download as CSV</button>') +
      '<div class="ad-bar"><div class="ad-chips">' + [['all', 'Messages'], ['bulk', 'Bulk enquiries'], ['contact', 'Contact'], ['newsletter', 'Newsletter']].map(function (x) {
        return '<button class="ad-chip' + (t === x[0] ? ' is-on' : '') + '" data-act="msg-type" data-v="' + x[0] + '">' + x[1] + '<i>' + (counts[x[0]] || 0) + '</i></button>';
      }).join('') + '</div></div>' +
      (list.length ? list.map(function (f) {
        var d = f.data, rows = Object.keys(d).filter(function (k) { return k !== 'company' && d[k] !== '' && d[k] != null; }).map(function (k) { return '<dt>' + esc(DATA_LABEL[k] || k) + '</dt><dd>' + esc(d[k]) + '</dd>'; }).join('');
        var phone = d.phone ? '<a class="ad-btn ad-btn--ghost ad-btn--sm" target="_blank" rel="noopener" href="' + esc(waLink(d.phone)) + '">WhatsApp</a>' : '', mail = d.email ? '<a class="ad-btn ad-btn--ghost ad-btn--sm" href="mailto:' + esc(d.email) + '">Email</a>' : '';
        return '<details class="ad-msg' + (f.handled ? ' is-done' : '') + '" data-id="' + f.id + '"><summary><span class="ad-badge ' + (f.type === 'bulk' ? 'warn' : f.type === 'contact' ? 'info' : '') + '">' + FORM_LABEL[f.type] + '</span><b>' + formTitle(f) + '</b>' +
          (f.handled ? '<span class="ad-badge good">Done</span>' : '') + '<span class="sm">' + when(f.at) + '</span></summary><div class="inner"><dl class="ad-kv">' + rows + '</dl>' +
          '<div class="ad-actions">' + phone + mail + '<button class="ad-btn ad-btn--sm" data-act="msg-done" data-id="' + f.id + '" data-v="' + (f.handled ? '0' : '1') + '">' + (f.handled ? 'Mark as not done' : 'Mark as done') + '</button><button class="ad-btn ad-btn--danger ad-btn--sm" data-act="msg-del" data-id="' + f.id + '">Delete</button></div></div></details>';
      }).join('') : '<div class="ad-card ad-empty">Nothing here yet.</div>');
  }

  /* ================= clicks ================= */
  var ACT = {
    'order-filter': function (b) { S.ui.orderFilter = b.getAttribute('data-v'); renderOrders(); },
    'orders-csv': function () {
      download('orders.csv', csv([['Order', 'Placed', 'Customer', 'Phone', 'Address', 'Payment', 'Payment status', 'Progress', 'Items', 'Total (Rs)', 'Courier', 'Tracking']].concat(S.orders.map(function (o) {
        return [o.no, o.at, o.name, o.phone, o.address, METHOD[o.pay] || o.pay, label(PAYSTATUS, o.paid), label(STATUS, o.status), o.items.map(function (i) { return i.qty + ' × ' + i.name + ' (' + i.label + ')'; }).join('; '), o.total, o.courier, o.track];
      }))));
    },
    'p-new': function () { editProduct(blankProduct()); },
    'p-edit': function (b) { var p = S.products.filter(function (x) { return x.id === b.closest('tr').getAttribute('data-id'); })[0]; if (p) editProduct(JSON.parse(JSON.stringify(p))); },
    'p-cancel': function (b, e) { e.preventDefault(); if (location.hash === '#products') renderProducts(); else location.hash = '#products'; },
    'p-active': function (b) {
      var p = S.products.filter(function (x) { return x.id === b.closest('tr').getAttribute('data-id'); })[0]; if (!p) return;
      patchProduct(p, { active: b.checked }).then(function () { toast(b.checked ? 'Now showing in the shop' : 'Hidden from the shop'); }).catch(function (err) { b.checked = !b.checked; fail(err); });
    },
    'p-up': function (b) { moveProduct(b, -1); }, 'p-down': function (b) { moveProduct(b, 1); },
    'p-addvar': function () { $('#pVars').insertAdjacentHTML('beforeend', varRow({ id: '', label: '', price: '', compare_at: null, stock: null, active: true })); },
    'p-rmvar': function (b) { b.closest('tr').remove(); },
    'p-addphoto': function () { $('#pFiles').click(); },
    'p-photo-rm': function (b) { S.editing.images.splice(Number(b.getAttribute('data-i')), 1); $('#pPhotos').innerHTML = photosHtml(S.editing); },
    'p-photo-main': function (b) { var im = S.editing.images, i = Number(b.getAttribute('data-i')); im.unshift(im.splice(i, 1)[0]); $('#pPhotos').innerHTML = photosHtml(S.editing); },
    'p-delete': function () {
      var p = S.editing; if (!window.confirm('Delete “' + p.name + ' ' + fragName(p.fragrance) + '” for good? Past orders keep their details. To just hide it, switch it off instead.')) return;
      deleteProduct(p).then(function () { toast('Product deleted'); return loadProducts(); }).then(function () { location.hash = '#products'; if (S.tab === 'products') renderProducts(); }).catch(fail);
    },
    'text-save': function (b) {
      var t = S.edits[Number(b.getAttribute('data-i'))], ta = $('textarea', b.closest('.ad-text')), html = CT.clean(fromPlain(ta.value.trim()));
      if (!ta.value.trim()) return toast('A text can’t be empty.', true);
      var set = {}; set[t.key] = JSON.stringify({ o: t.original, n: html });
      busy(b, saveKv(set, [])).then(function () { toast('Saved'); }).catch(fail);
    },
    'text-reset': function (b) {
      var t = S.edits[Number(b.getAttribute('data-i'))];
      busy(b, saveKv({}, [t.key])).then(function () { toast('Back to the original'); VIEWS.pages(); }).catch(fail);
    },
    'slot-pick': function (b) {
      var name = b.closest('.ad-slot').getAttribute('data-slot'), s = SLOTS.filter(function (x) { return x[0] === name; })[0], inp = $('#slotFile');
      inp.onchange = function () {
        var file = inp.files[0]; inp.value = ''; if (!file) return;
        toast('Uploading…');
        CMS.uploadImage(file, 'site', live ? s[3] : Math.min(s[3], 1000)).then(function (url) { var set = {}; set['img.' + name] = url; return saveKv(set, []); })
          .then(function () { $('.ad-slot[data-slot="' + name + '"]').outerHTML = slotCard(s); toast('Picture saved'); }).catch(fail);
      };
      inp.click();
    },
    'slot-clear': function (b) {
      var name = b.closest('.ad-slot').getAttribute('data-slot'), s = SLOTS.filter(function (x) { return x[0] === name; })[0];
      saveKv({}, ['img.' + name]).then(function () { $('.ad-slot[data-slot="' + name + '"]').outerHTML = slotCard(s); toast('Using the built-in picture'); }).catch(fail);
    },
    'sty-reset': function (b) {
      if (!window.confirm('Put every colour you changed on the pages back to normal?')) return;
      var keys = Object.keys(S.kv).filter(function (k) { return k.indexOf('sty.') === 0; });
      busy(b, saveKv({}, keys)).then(function () { toast('Page colours reset'); VIEWS.pages(); }).catch(fail);
    },
    'colors-reset': function () { saveKv({}, COLORS.map(function (c) { return 'theme.' + c[0]; })).then(function () { toast('Colours reset'); VIEWS.design(); }).catch(fail); },
    'msg-type': function (b) { S.ui.msgType = b.getAttribute('data-v'); renderMessages(); },
    'msg-done': function (b) {
      var f = S.forms.filter(function (x) { return String(x.id) === b.getAttribute('data-id'); })[0], v = b.getAttribute('data-v') === '1';
      setHandled(f, v).then(function () { f.handled = v; renderMessages(); refreshCounts(); }).catch(fail);
    },
    'msg-del': function (b) {
      var f = S.forms.filter(function (x) { return String(x.id) === b.getAttribute('data-id'); })[0];
      if (!window.confirm('Delete this for good?')) return;
      delForm(f).then(function () { return loadForms(); }).then(function () { renderMessages(); refreshCounts(); }).catch(fail);
    },
    'forms-csv': function () {
      var list = S.ui.msgType === 'all' ? S.forms : S.forms.filter(function (f) { return f.type === S.ui.msgType; });
      var keys = []; list.forEach(function (f) { Object.keys(f.data).forEach(function (k) { if (k !== 'company' && keys.indexOf(k) < 0) keys.push(k); }); });
      download('messages.csv', csv([['Type', 'Received', 'Done'].concat(keys)].concat(list.map(function (f) { return [FORM_LABEL[f.type], f.at, f.handled ? 'yes' : 'no'].concat(keys.map(function (k) { return f.data[k]; })); }))));
    }
  };

  function moveProduct(b, dir) {
    var id = b.closest('tr').getAttribute('data-id'), i = S.products.findIndex(function (p) { return p.id === id; }), j = i + dir;
    if (i < 0 || j < 0 || j >= S.products.length) return;
    var a = S.products[i], c = S.products[j], sa = a.sort, sc = c.sort;
    if (sa === sc) { sa = i * 10; sc = j * 10; }
    var job = live ? Promise.all([CMS.patch('products', 'id=eq.' + encodeURIComponent(a.id), { sort: sc }), CMS.patch('products', 'id=eq.' + encodeURIComponent(c.id), { sort: sa })]) : Promise.resolve();
    job.then(function () {
      a.sort = sc; c.sort = sa; S.products.sort(function (x, y) { return x.sort - y.sort; });
      if (!live) { S.products.forEach(function (p, n) { p.sort = n * 10; }); persistDemoProducts(); }
      renderProducts();
    }).catch(fail);
  }

  document.addEventListener('click', function (e) {
    var row = e.target.closest('tr[data-open]');
    var b = e.target.closest('[data-act]');
    if (b && !b.closest('.ad-over')) { var fn = ACT[b.getAttribute('data-act')]; if (fn && b.tagName !== 'INPUT') { fn(b, e); return; } }
    if (row && !e.target.closest('button, a, input')) openOrder(row.getAttribute('data-open'));
  });
  document.addEventListener('change', function (e) { var b = e.target.closest('[data-act]'); if (b && b.tagName === 'INPUT' && ACT[b.getAttribute('data-act')]) ACT[b.getAttribute('data-act')](b, e); });

  /* ================= start ================= */
  CMS.check().then(function (ok) { if (ok) enter(); else loginScreen(); }).catch(function () { loginScreen(); });
})();
