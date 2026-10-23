(function () {
  var AC = window.AC, $ = AC.$, I = window.AC_ICONS, C = window.AC_CONFIG;
  var root = $('#orderRoot');
  var no = AC.param('no'), token = AC.param('t'), isNew = !!AC.param('new'), demo = !!AC.param('demo');
  var STEPS = ['Placed', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'];
  var STEP_OF = { new: 0, confirmed: 1, packed: 2, dispatched: 3, delivered: 4 };

  /* Returning from a card payment: the order exists, so the bag can be emptied. */
  if (AC.param('ret')) AC.cart.clear();

  function fetchOrder(orderNo, secret) {
    if (!AC.configured) {
      var o = AC.json('ac_demo_orders', {})[orderNo];
      var ok = o && (o.token === secret || (AC.normPhone ? AC.normPhone(secret) === o.phone : secret === o.phone));
      return ok ? Promise.resolve(o) : Promise.reject(new Error('We couldn’t find an order with those details.'));
    }
    return AC.rpc('get_order', { p_order_no: orderNo, p_secret: secret }).then(function (o) {
      if (!o) throw new Error('We couldn’t find an order with those details.'); return o;
    });
  }

  function lookupForm(msg) {
    root.innerHTML = '<div class="order-card" style="max-width:560px"><div class="center"><span class="kicker serif-i" style="font-size:24px;color:var(--green-600)">Where’s my order?</span><h1 class="h2">Track your <em>order</em></h1><p class="muted" style="margin-top:8px">Enter your order number and the mobile number you used at checkout.</p></div>' +
      (msg ? '<div class="notice notice--err" role="alert">' + AC.esc(msg) + '</div>' : '') +
      '<form id="lookup" class="form-grid" novalidate style="grid-template-columns:1fr">' +
      '<div class="field"><label for="lkNo">Order number</label><input class="input" id="lkNo" placeholder="AC-1001" autocomplete="off" value="' + AC.esc(no || '') + '"></div>' +
      '<div class="field"><label for="lkPhone">Mobile number</label><input class="input" id="lkPhone" type="tel" placeholder="07X XXX XXXX" autocomplete="tel"></div>' +
      '<button class="btn btn--block" type="submit">Find my order</button></form></div>';
    $('#lookup').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#lkNo').value.trim().toUpperCase(), ph = AC.normPhone($('#lkPhone').value);
      if (!n || !ph) { lookupForm('Please enter both your order number and a valid mobile number.'); return; }
      fetchOrder(n, ph).then(function (o) { no = n; token = null; show(o, ph); try { history.replaceState(null, '', 'order.html?no=' + encodeURIComponent(n)); } catch (e) { /* ignore */ } })
        .catch(function (err) { lookupForm(err.message); });
    });
  }

  function copy(btn, text) {
    var done = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  }

  function paymentPanel(o) {
    var m = o.payment_method, s = o.payment_status, total = AC.money(o.total_lkr);
    if (s === 'paid') return '<div class="panel"><h3>Payment received</h3><p class="muted">Thank you — your payment of ' + total + ' has been confirmed.</p></div>';
    if (m === 'cod') return '<div class="panel"><h3>Cash on delivery</h3><p class="muted">Please keep <b>' + total + '</b> ready to pay the courier when your order arrives.</p></div>';
    if (m === 'card') {
      if (s === 'failed') return '<div class="panel"><h3>Payment didn’t go through</h3><p class="muted">Your card wasn’t charged. Please <a style="text-decoration:underline" href="contact.html">contact us</a> and we’ll help you complete your order.</p></div>';
      return '<div class="panel"><h3>Confirming your card payment</h3><p class="muted">We’re waiting for confirmation from our payment partner. This usually takes under a minute.</p><button class="btn btn--sm btn--ghost" id="refresh" style="justify-self:start">Check again</button></div>';
    }
    /* bank transfer */
    var b = AC.settings.bank || {}, rows = '';
    [['Bank', b.bank], ['Account name', b.account_name], ['Account number', b.account_no], ['Branch', b.branch]].forEach(function (r) {
      if (r[1]) rows += '<dt>' + r[0] + '</dt><dd>' + AC.esc(r[1]) + (r[0] === 'Account number' ? '<button class="copy-btn" data-copy="' + AC.esc(r[1]) + '">Copy</button>' : '') + '</dd>';
    });
    var details = rows ? '<dl class="kv" data-nocms>' + rows + '<dt>Amount</dt><dd>' + total + '</dd><dt>Reference</dt><dd>' + AC.esc(o.order_no) + '<button class="copy-btn" data-copy="' + AC.esc(o.order_no) + '">Copy</button></dd></dl>' :
      '<p class="muted">We’ll send our bank details to your mobile number shortly. Please use <b>' + AC.esc(o.order_no) + '</b> as the payment reference.</p>';
    var slip;
    if (s === 'slip_uploaded') slip = '<div class="notice">We’ve received your payment slip and will confirm your payment shortly.</div>';
    else if (token) slip = '<label class="drop" id="drop"><input id="slipFile" type="file" accept="image/*,application/pdf" hidden>' + I.upload.replace('<svg', '<svg width="28" height="28"') + '<b>Upload your payment slip</b><span class="muted" style="font-size:14px">Photo or PDF, up to 5 MB</span></label><div class="err" id="slipErr" role="alert"></div>';
    else slip = '<p class="muted" style="font-size:14.5px">To upload your slip, open the link we showed you after checkout, or message us on WhatsApp with your order number.</p>';
    return '<div class="panel"><h3>Pay by bank transfer</h3>' + details + slip + '</div>';
  }

  function show(o, secret) {
    var step = STEP_OF[o.status], cancelled = o.status === 'cancelled';
    var first = (o.customer_name || '').split(' ')[0];
    var head = isNew ?
      '<div class="center" data-nocms style="display:grid;gap:14px;justify-items:center"><div class="check">' + I.check + '</div><h1 class="h2">Thank you' + (first ? ', <em>' + AC.esc(first) + '</em>' : '') + '</h1><p class="lead">Your order <b>' + AC.esc(o.order_no) + '</b> has been placed. We’ve saved the details below.</p></div>' :
      '<div class="center" data-nocms><span class="kicker serif-i" style="font-size:24px;color:var(--green-600)">Order</span><h1 class="h2">' + AC.esc(o.order_no) + '</h1><p class="muted">Placed ' + new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + '</p></div>';

    var steps = cancelled ? '<div class="notice notice--err">This order has been cancelled.</div>' :
      '<div class="steps" aria-label="Order progress">' + STEPS.map(function (s, i) { return '<div class="step' + (i < step ? ' done' : i === step ? ' current' : '') + '"><i></i>' + s + '</div>'; }).join('') + '</div>';

    var items = o.items.map(function (it) {
      return '<div class="row" data-nocms><span>' + AC.esc(it.name) + ' <span class="muted">· ' + AC.esc(it.variant_label) + ' × ' + it.qty + '</span></span><span>' + AC.money(it.unit_price_lkr * it.qty) + '</span></div>';
    }).join('');

    var track = o.tracking_no ? '<div class="panel"><h3>Delivery tracking</h3><dl class="kv" data-nocms><dt>Courier</dt><dd>' + AC.esc(o.courier || 'Courier') + '</dd><dt>Tracking number</dt><dd>' + AC.esc(o.tracking_no) + '</dd></dl></div>' : '';
    var addr = o.full ? '<div class="panel" data-nocms><h3>Delivering to</h3><dl class="kv"><dt>Name</dt><dd>' + AC.esc(o.customer_name) + '</dd><dt>Mobile</dt><dd>' + AC.esc(o.phone) + '</dd><dt>Address</dt><dd>' + AC.esc(o.address) + '</dd></dl></div>' : '';

    root.innerHTML = '<div class="order-card">' +
      (demo ? '<div class="notice notice--warn"><b>Demo mode.</b> This order is only saved in this browser — no payment was taken and nothing was sent to the shop.</div>' : '') +
      head + steps + (cancelled ? '' : paymentPanel(o)) + track + addr +
      '<div class="panel"><h3>Order summary</h3>' + items +
        '<div class="sum-totals"><div class="row"><span class="muted">Subtotal</span><span>' + AC.money(o.subtotal_lkr) + '</span></div>' +
        '<div class="row"><span class="muted">Delivery</span><span>' + (o.shipping_lkr ? AC.money(o.shipping_lkr) : '<span class="free">Free</span>') + '</span></div>' +
        '<div class="row total"><span>Total</span><span>' + AC.money(o.total_lkr) + '</span></div></div></div>' +
      '<div class="center" style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap"><a class="btn" href="shop.html">Continue shopping</a>' +
        (C.WHATSAPP_NUMBER ? '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + C.WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, about my order ' + o.order_no) + '">Message us</a>' : '<a class="btn btn--ghost" href="contact.html">Contact us</a>') + '</div></div>';

    root.addEventListener('click', function (e) { var c = e.target.closest('[data-copy]'); if (c) copy(c, c.getAttribute('data-copy')); });
    var r = $('#refresh'); if (r) r.addEventListener('click', function () { r.textContent = 'Checking…'; fetchOrder(no, token || secret).then(function (n) { show(n, secret); }); });

    var file = $('#slipFile'), drop = $('#drop');
    if (file) {
      file.addEventListener('change', function () { upload(file.files[0], o); });
      ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('is-over'); }); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0], o); });
    }
    /* a card payment can take a moment to be confirmed — poll a few times */
    if (o.payment_method === 'card' && o.payment_status === 'pending' && AC.configured && AC.param('ret')) poll(0);
  }

  var polls;
  function poll(n) {
    if (n > 6) return;
    clearTimeout(polls);
    polls = setTimeout(function () {
      fetchOrder(no, token).then(function (o) { if (o.payment_status !== 'pending') show(o); else poll(n + 1); }).catch(function () {});
    }, 4000);
  }

  function upload(file, o) {
    var err = $('#slipErr'); err.textContent = '';
    if (!file) return;
    if (!/^(image\/|application\/pdf)/.test(file.type)) { err.textContent = 'Please choose a photo or a PDF.'; return; }
    if (file.size > 5 * 1024 * 1024) { err.textContent = 'That file is over 5 MB. Please choose a smaller one.'; return; }
    $('#drop').innerHTML = '<b>Uploading…</b>';
    var finish = function () { return fetchOrder(no, token).then(function (n) { show(n); AC.toast('Slip received — thank you!'); }); };
    if (!AC.configured) {
      var all = AC.json('ac_demo_orders', {}); all[no].payment_status = 'slip_uploaded'; AC.store.set('ac_demo_orders', JSON.stringify(all)); finish(); return;
    }
    AC.uploadSlip(no, file).then(function (path) { return AC.rpc('attach_payment_slip', { p_order_no: no, p_token: token, p_path: path }); })
      .then(finish).catch(function (e) { show(o); $('#slipErr').textContent = 'Upload failed: ' + e.message + '. Please try again.'; });
  }

  AC.ready.then(function () {
    if (no && token) fetchOrder(no, token).then(function (o) { show(o, token); }).catch(function (e) { lookupForm(e.message); });
    else lookupForm();
  });
})();
