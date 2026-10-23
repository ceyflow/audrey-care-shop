(function () {
  var AC = window.AC, $ = AC.$, $$ = AC.$$, I = window.AC_ICONS;
  var DISTRICTS = ['Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'];
  var root = $('#coRoot');

  function field(id, label, opts) {
    opts = opts || {};
    var input = opts.type === 'select' ?
      '<select class="input" id="' + id + '" name="' + id + '" ' + (opts.req ? 'required' : '') + '><option value="">Select…</option>' + DISTRICTS.map(function (d) { return '<option>' + d + '</option>'; }).join('') + '</select>' :
      opts.type === 'textarea' ? '<textarea class="textarea" id="' + id + '" name="' + id + '" placeholder="' + (opts.ph || '') + '"></textarea>' :
      '<input class="input" id="' + id + '" name="' + id + '" type="' + (opts.type || 'text') + '" ' + (opts.req ? 'required' : '') + ' autocomplete="' + (opts.ac || 'off') + '" ' + (opts.mode ? 'inputmode="' + opts.mode + '"' : '') + ' placeholder="' + (opts.ph || '') + '">';
    return '<div class="field' + (opts.full ? ' full' : '') + '" data-field="' + id + '"><label for="' + id + '">' + label + (opts.req ? '' : ' <small>(optional)</small>') + '</label>' + input + '<div class="err" role="alert"></div></div>';
  }

  function payOption(id, icon, title, desc, checked) {
    return '<label class="pay-opt"><input type="radio" name="pay" value="' + id + '"' + (checked ? ' checked' : '') + '><span class="radio"></span>' +
      '<span><b>' + title + '</b><span class="d">' + desc + '</span></span><span class="pi">' + I[icon] + '</span></label>';
  }

  function render() {
    var lines = AC.cart.lines();
    if (!lines.length) {
      root.innerHTML = '<div class="empty" style="padding-block:96px">' + I.bag + '<div class="serif-i">Your bag is empty</div><p>Add something gentle before checking out.</p><a class="btn" href="shop.html">Shop now</a></div>';
      return;
    }
    var pay = AC.settings.payments || {}, first = pay.cod !== false ? 'cod' : (pay.bank !== false ? 'bank_transfer' : 'card');
    var saved = AC.json('ac_customer', {});

    root.innerHTML = '<div class="co"><form id="coForm" novalidate>' +
      '<div class="co-step"><h2><i>1</i>Contact</h2><div class="form-grid">' +
        field('name', 'Full name', { req: 1, ac: 'name', full: 1 }) +
        field('phone', 'Mobile number', { req: 1, type: 'tel', ac: 'tel', mode: 'tel', ph: '07X XXX XXXX' }) +
        field('email', 'Email', { type: 'email', ac: 'email', ph: 'For your order receipt' }) +
      '</div></div>' +
      '<div class="co-step"><h2><i>2</i>Delivery</h2><div class="form-grid">' +
        field('address', 'Address', { req: 1, ac: 'street-address', full: 1, ph: 'House no., street, area' }) +
        field('city', 'City / town', { req: 1, ac: 'address-level2' }) +
        field('district', 'District', { req: 1, type: 'select' }) +
        field('postal', 'Postal code', { ac: 'postal-code', mode: 'numeric' }) +
        field('notes', 'Delivery notes', { type: 'textarea', full: 1, ph: 'Landmarks, preferred time, gate code…' }) +
      '</div></div>' +
      '<div class="co-step"><h2><i>3</i>Payment</h2><div class="pay" role="radiogroup" aria-label="Payment method">' +
        (pay.cod !== false ? payOption('cod', 'cash', 'Cash on delivery', 'Pay the courier in cash when your order arrives.', first === 'cod') : '') +
        (pay.bank !== false ? payOption('bank_transfer', 'bank', 'Bank transfer', 'We’ll show our bank details next. Upload your slip to confirm.', first === 'bank_transfer') : '') +
        (pay.card !== false ? payOption('card', 'card', 'Debit or credit card', 'Pay securely online. You’ll be taken to our payment partner, PayHere.', first === 'card') : '') +
      '</div><div class="err" id="payErr" role="alert" style="margin-top:10px"></div></div>' +
      '<input class="hp" type="text" name="company" id="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="notice notice--err" id="formErr" role="alert" hidden></div>' +
      (!AC.configured ? '<div class="notice notice--warn" style="margin-bottom:16px"><b>Demo mode.</b> The shop isn’t connected to its order database yet, so orders placed here are only saved in this browser. See the README to connect Supabase.</div>' : '') +
      '<button class="btn btn--block" type="submit" id="placeBtn" style="padding-block:22px">Place order</button>' +
      '<p class="muted" style="font-size:13.5px;margin-top:14px;text-align:center">By placing your order you agree to our <a style="text-decoration:underline" href="policies.html#terms">Terms</a> and <a style="text-decoration:underline" href="policies.html#delivery">Delivery &amp; returns</a>.</p>' +
      '</form><aside class="summary" id="summary"></aside></div>';

    ['name', 'phone', 'email', 'address', 'city', 'district', 'postal'].forEach(function (k) { if (saved[k]) $('#' + k).value = saved[k]; });
    renderSummary();
    $('#coForm').addEventListener('submit', submit);
    $$('#coForm .input, #coForm .textarea').forEach(function (el) { el.addEventListener('input', function () { clearErr(el.closest('.field')); }); });
    $$('input[name=pay]').forEach(function (r) { r.addEventListener('change', function () { $('#payErr').textContent = ''; updateBtn(); }); });
    updateBtn();
  }

  function renderSummary() {
    var lines = AC.cart.lines(), sub = AC.cart.subtotal(), ship = AC.shipping(sub);
    $('#summary').innerHTML = '<h2>Your order</h2>' + lines.map(function (l) {
      return '<div class="sum-line" data-nocms><div class="line-img">' + AC.media(l.p, 0) + '<em>' + l.q + '</em></div><div><b>' + AC.esc(l.p.name) + '</b><span>' + AC.esc(l.p.frag.name) + ' · ' + AC.esc(l.v.label) + '</span></div><b style="font-weight:500">' + AC.money(l.total) + '</b></div>';
    }).join('') +
      '<div class="sum-totals"><div class="row"><span>Subtotal</span><span>' + AC.money(sub) + '</span></div>' +
      '<div class="row"><span>Delivery</span><span>' + (ship ? AC.money(ship) : '<span class="free">Free</span>') + '</span></div>' +
      '<div class="row total"><span>Total</span><span>' + AC.money(sub + ship) + '</span></div></div>' +
      '<a class="link-arrow" style="justify-self:start" href="shop.html">Edit bag</a>' +
      '<div class="secure">' + I.lock + '<span>Your details are only used to deliver your order.</span></div>';
  }

  function updateBtn() {
    var m = ($('input[name=pay]:checked') || {}).value;
    $('#placeBtn').textContent = m === 'card' ? 'Continue to secure payment' : 'Place order';
  }

  function setErr(f, msg) { f.classList.add('has-error'); f.querySelector('.err').textContent = msg; }
  function clearErr(f) { if (f) { f.classList.remove('has-error'); f.querySelector('.err').textContent = ''; } }

  function validate() {
    var bad = [], v = function (id) { return $('#' + id).value.trim(); };
    $$('.field.has-error').forEach(clearErr);
    if (v('name').length < 2) { setErr($('[data-field=name]'), 'Please enter your name.'); bad.push('name'); }
    if (!AC.normPhone(v('phone'))) { setErr($('[data-field=phone]'), 'Enter a valid mobile number, like 077 123 4567.'); bad.push('phone'); }
    if (v('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) { setErr($('[data-field=email]'), 'That email doesn’t look right.'); bad.push('email'); }
    if (v('address').length < 5) { setErr($('[data-field=address]'), 'Please enter your delivery address.'); bad.push('address'); }
    if (v('city').length < 2) { setErr($('[data-field=city]'), 'Please enter your city or town.'); bad.push('city'); }
    if (!v('district')) { setErr($('[data-field=district]'), 'Please choose your district.'); bad.push('district'); }
    var chosen = $('input[name=pay]:checked');
    if (!chosen) { $('#payErr').textContent = 'Please choose how you’d like to pay.'; bad.push('pay'); }
    else if (chosen.value === 'card' && !v('email') && bad.indexOf('email') < 0) { setErr($('[data-field=email]'), 'An email address is needed for card payments.'); bad.push('email'); }
    if (bad.length) { var el = $('#' + bad[0]) || $('.pay'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (el.focus) el.focus({ preventScroll: true }); }
    return !bad.length;
  }

  function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    var btn = $('#placeBtn'), errBox = $('#formErr'); errBox.hidden = true;
    var v = function (id) { return $('#' + id).value.trim(); };
    var method = $('input[name=pay]:checked').value;
    var payload = {
      customer: { name: v('name'), phone: AC.normPhone(v('phone')), email: v('email') },
      shipping: { address: v('address'), city: v('city'), district: v('district'), postal: v('postal') },
      notes: v('notes'), payment_method: method, hp: $('#company').value,
      items: AC.cart.lines().map(function (l) { return { variant_id: l.v.id, qty: l.q }; })
    };
    AC.store.set('ac_customer', JSON.stringify({ name: payload.customer.name, phone: v('phone'), email: v('email'), address: v('address'), city: v('city'), district: v('district'), postal: v('postal') }));

    btn.disabled = true; var label = btn.textContent; btn.textContent = 'Placing your order…';
    var done = AC.configured ? AC.fn('place-order', payload) : demoOrder(payload);
    done.then(function (res) {
      var url = 'order.html?no=' + encodeURIComponent(res.order_no) + '&t=' + encodeURIComponent(res.token) + '&new=1';
      if (res.payhere) { AC.store.set('ac_pending_card', res.order_no); postToPayHere(res.payhere); return; }
      AC.cart.clear(); location.href = url + (res.demo ? '&demo=1' : '');
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = label;
      errBox.hidden = false; errBox.textContent = err.message || 'We couldn’t place your order. Please try again, or message us on WhatsApp.';
      errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* Browser-only order for demo mode */
  function demoOrder(p) {
    return new Promise(function (resolve) {
      var all = AC.json('ac_demo_orders', {}), n = Object.keys(all).length + 1001, no = 'AC-' + n, token = Math.random().toString(36).slice(2, 12);
      var lines = AC.cart.lines(), sub = AC.cart.subtotal(), ship = AC.shipping(sub);
      all[no] = {
        order_no: no, token: token, status: 'new', payment_method: p.payment_method,
        payment_status: p.payment_method === 'bank_transfer' ? 'awaiting_slip' : 'pending',
        subtotal_lkr: sub, shipping_lkr: ship, total_lkr: sub + ship, created_at: new Date().toISOString(), full: true,
        customer_name: p.customer.name, phone: p.customer.phone, address: p.shipping.address + ', ' + p.shipping.city + ', ' + p.shipping.district,
        items: lines.map(function (l) { return { name: l.p.name + ' — ' + l.p.frag.name, variant_label: l.v.label, qty: l.q, unit_price_lkr: l.v.price }; })
      };
      AC.store.set('ac_demo_orders', JSON.stringify(all));
      setTimeout(function () { resolve({ order_no: no, token: token, demo: true }); }, 700);
    });
  }

  function postToPayHere(ph) {
    var f = document.createElement('form'); f.method = 'POST'; f.action = ph.action; f.style.display = 'none';
    Object.keys(ph.fields).forEach(function (k) { var i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = ph.fields[k]; f.appendChild(i); });
    document.body.appendChild(f); f.submit();
  }

  AC.ready.then(function () {
    render();
    document.addEventListener('ac:cart', function () { if (AC.cart.lines().length && $('#summary')) renderSummary(); else if (!AC.cart.lines().length) render(); });
    if (AC.param('cancelled')) { var n = document.createElement('div'); n.className = 'notice notice--warn'; n.style.marginBottom = '24px'; n.textContent = 'Your card payment was cancelled. Your bag is still here — you can try again or choose another payment method.'; root.prepend(n); }
  });
})();
