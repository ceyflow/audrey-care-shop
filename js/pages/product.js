(function () {
  var AC = window.AC, $ = AC.$, $$ = AC.$$, I = window.AC_ICONS;

  function out(v) { return v.stock !== null && v.stock !== undefined && v.stock <= 0; }
  var ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="m20 20-4.800-4.800M10.500 7.500v6M7.500 10.500h6"/></svg>';

  AC.ready.then(function () {
    var p = AC.product(AC.param('id'));
    var root = $('#pdp');
    if (!p) {
      root.innerHTML = '<div class="no-results" style="grid-column:1/-1"><div class="serif-i" style="font-size:34px;color:var(--green-900)">We couldn’t find that product</div><p class="muted">It may have been renamed or is no longer available.</p><a class="btn btn--sm" href="shop.html">Back to shop</a></div>';
      return;
    }

    var f = p.frag, sel = p.variants[0], qty = 1, view = 0, SEP = '<span aria-hidden="true">›</span>';
    document.title = p.name + ' ' + f.name + ' — Audrey Care';
    var meta = document.querySelector('meta[name=description]'); if (meta) meta.content = p.tagline || p.description || '';
    $('#crumbs').innerHTML = '<a href="index.html">Home</a>' + SEP + '<a href="shop.html">Products</a>' + SEP +
      '<a href="shop.html?group=' + p.kindObj.group + '">' + AC.esc((AC.find(window.AC_DATA.groups, p.kindObj.group) || {}).name || '') + '</a>' + SEP +
      '<a href="shop.html?kind=' + p.kind + '">' + AC.esc(p.kindObj.name) + '</a>' + SEP + '<span>' + AC.esc(p.name + ' ' + f.name) + '</span>';

    var siblings = AC.products.filter(function (x) { return x.name === p.name && x.kind === p.kind; });
    var views = p.images.length ? p.images.map(function (src, i) { return AC.media(p, i); }) : [AC.media(p, 0), AC.media(p, 1)];
    var thumbs = views.map(function (h, i) { return '<button data-view="' + i + '" aria-label="View image ' + (i + 1) + '" aria-current="' + (i === 0) + '">' + h + '</button>'; }).join('');
    var stage = views.map(function (h, i) { return '<div class="v' + (i === 0 ? ' is-on' : '') + '">' + h + '</div>'; }).join('');

    root.innerHTML =
      '<div class="gallery"><div class="stage-wrap"><div class="stage">' +
        (p.badge ? '<span class="badge' + (p.badge === 'New' ? ' badge--new' : '') + '">' + AC.esc(p.badge) + '</span>' : '') + stage + '</div>' +
        '<button class="zoom-btn" id="zoomBtn" aria-label="Zoom image">' + ZOOM + '</button></div>' +
        (views.length > 1 ? '<div class="thumbs">' + thumbs + '</div>' : '') + '</div>' +
      '<div class="pdp-info">' +
        '<h1 class="pdp-title">' + AC.esc(p.name) + ' ' + AC.esc(f.name) + '</h1>' +
        '<div class="pdp-price" id="price"></div>' +
        (p.variants.length > 1 ? '<div class="opts" id="sizes" role="radiogroup" aria-label="Size"></div>' : '<div class="opts"><span class="opt" aria-checked="true" role="radio">' + AC.esc(sel.label) + '</span></div>') +
        (siblings.length > 1 ? '<div><span class="field-label">Fragrance</span><div class="opts scent-opts">' +
          siblings.map(function (s) { return '<a class="opt" role="radio" aria-checked="' + (s.id === p.id) + '" href="product.html?id=' + s.id + '"><span class="dot" style="background:' + s.frag.color + ';margin:0"></span>' + AC.esc(s.frag.name) + '</a>'; }).join('') + '</div></div>' : '') +
        '<p class="pdp-desc">' + AC.esc(p.description || p.tagline || '') + '</p>' +
        '<div><div class="tabs" role="tablist" aria-label="How to buy"><button role="tab" id="tabOnline" aria-selected="true" aria-controls="panelOnline" data-tab="online">Online</button><button role="tab" id="tabBulk" aria-selected="false" aria-controls="panelBulk" data-tab="bulk">Bulk orders</button></div>' +
          '<div class="tab-panel" id="panelOnline" role="tabpanel" aria-labelledby="tabOnline">' +
            '<div class="buy-row"><div class="qty" aria-label="Quantity"><button id="qMinus" aria-label="Decrease quantity">' + I.minus + '</button><output id="qVal">1</output><button id="qPlus" aria-label="Increase quantity">' + I.plus + '</button></div>' +
            '<button class="btn" id="addBtn">Add to bag</button></div>' +
            '<ul class="assure"><li>' + I.truck + '<span>Free delivery on orders over ' + AC.money(AC.settings.free_over) + '</span></li>' +
              '<li>' + I.cash + '<span>Cash on delivery, bank transfer or card</span></li></ul></div>' +
          '<div class="tab-panel" id="panelBulk" role="tabpanel" aria-labelledby="tabBulk" hidden>' +
            '<p class="muted" style="margin-bottom:18px">Ordering for a hotel, spa, restaurant or business? We supply ' + AC.esc(p.kindObj.name.toLowerCase()) + ' in 5 L cans, in the fragrance you choose.</p>' +
            '<a class="btn btn--block" href="bulk.html#enquiry">Request a quote</a></div></div>' +
        '<div>' +
          (p.how_to_use ? '<details class="acc"><summary>How to use ' + I.plus + '</summary><div class="acc-body">' + AC.esc(p.how_to_use) + '</div></details>' : '') +
          '<details class="acc"><summary>Ingredients ' + I.plus + '</summary><div class="acc-body">The full ingredient list is printed on the pack.</div></details>' +
          '<details class="acc"><summary>Delivery ' + I.plus + '</summary><div class="acc-body">Delivery across Sri Lanka, ' + AC.money(AC.settings.shipping_flat) + ' per order, free over ' + AC.money(AC.settings.free_over) + '. See <a href="policies.html#delivery" style="text-decoration:underline">delivery details</a>.</div></details>' +
        '</div>' +
      '</div>';

    var price = $('#price'), addBtn = $('#addBtn'), sizes = $('#sizes');

    function paint() {
      price.innerHTML = AC.money(sel.price * qty) + (sel.compare_at && sel.compare_at > sel.price ? ' <s class="muted" style="font-size:18px;font-weight:400">' + AC.money(sel.compare_at * qty) + '</s>' : '') +
        (qty > 1 ? ' <span class="muted" style="font-size:15px;font-weight:400">(' + AC.money(sel.price) + ' each)</span>' : '');
      var gone = out(sel);
      addBtn.disabled = gone; addBtn.textContent = gone ? 'Out of stock' : 'Add to bag';
      $('#qVal').textContent = qty;
      $('#stickyName').textContent = p.name + ' · ' + f.name;
      $('#stickyPrice').textContent = sel.label + ' · ' + AC.money(sel.price * qty);
      $('#stickyBtn').disabled = gone;
      if (sizes) $$('button', sizes).forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-v') === sel.id); });
    }
    if (sizes) {
      sizes.innerHTML = p.variants.map(function (v) {
        return '<button class="opt" role="radio" data-v="' + v.id + '">' + AC.esc(v.label) + '<br><small style="font-weight:400;opacity:.8">' + AC.money(v.price) + '</small></button>';
      }).join('');
      sizes.addEventListener('click', function (e) {
        var b = e.target.closest('[data-v]'); if (!b) return;
        sel = AC.find(p.variants, b.getAttribute('data-v')); paint();
      });
    }
    $('#qMinus').addEventListener('click', function () { qty = Math.max(1, qty - 1); paint(); });
    $('#qPlus').addEventListener('click', function () { qty = Math.min(20, qty + 1); paint(); });

    /* Online / Bulk tabs */
    $$('[data-tab]').forEach(function (t) {
      t.addEventListener('click', function () {
        var which = t.getAttribute('data-tab');
        $$('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', x === t); });
        $('#panelOnline').hidden = which !== 'online'; $('#panelBulk').hidden = which !== 'bulk';
      });
    });

    var resetT;
    function add() {
      if (out(sel)) return;
      AC.addToCart(sel.id, qty);
      addBtn.classList.add('is-added'); addBtn.innerHTML = I.check.replace('<svg', '<svg width="18" height="18"') + ' Added';
      clearTimeout(resetT); resetT = setTimeout(function () { addBtn.classList.remove('is-added'); paint(); }, 1800);
    }
    addBtn.addEventListener('click', add);
    $('#stickyBtn').addEventListener('click', add);

    /* gallery + zoom */
    function show(i) {
      view = i;
      $$('.stage .v').forEach(function (v, n) { v.classList.toggle('is-on', n === i); });
      $$('.thumbs button').forEach(function (b, n) { b.setAttribute('aria-current', n === i); });
    }
    $$('.thumbs button').forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-view')); }); });

    var lb = null, lastFocus;
    function closeZoom() { if (!lb) return; lb.remove(); lb = null; document.body.classList.remove('is-locked'); if (lastFocus) lastFocus.focus(); }
    $('#zoomBtn').addEventListener('click', function () {
      lastFocus = document.activeElement;
      lb = document.createElement('div'); lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Zoomed image');
      lb.innerHTML = '<button class="lb-close" aria-label="Close">' + I.close + '</button><div class="lb-img">' + views[view] + '</div>';
      lb.addEventListener('click', closeZoom);
      document.body.appendChild(lb); document.body.classList.add('is-locked'); lb.querySelector('.lb-close').focus();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeZoom(); });

    /* sticky buy bar: shown whenever the main button is off screen */
    var sticky = $('#stickyBuy'), tick = false;
    $('#stickyThumb').innerHTML = AC.media(p, 0);
    function stickyUpdate() {
      tick = false;
      var r = addBtn.getBoundingClientRect(), vis = r.width > 0;
      var on = vis && (r.bottom < 0 || r.top > window.innerHeight) && window.scrollY > 240;
      sticky.classList.toggle('is-on', on); sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      document.body.classList.toggle('has-sticky', on);
      $('#stickyBtn').tabIndex = on ? 0 : -1;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(stickyUpdate); } }, { passive: true });
    window.addEventListener('resize', stickyUpdate);

    /* structured data for search engines */
    var ld = document.createElement('script'); ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: p.name + ' — ' + f.name, description: p.description,
      brand: { '@type': 'Brand', name: 'Audrey Care' },
      offers: p.variants.map(function (v) { return { '@type': 'Offer', priceCurrency: 'LKR', price: v.price, availability: out(v) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' }; })
    });
    document.head.appendChild(ld);

    paint();

    var rel = AC.products.filter(function (x) { return x.id !== p.id && x.kindObj.group === p.kindObj.group; });
    AC.products.forEach(function (x) { if (x.id !== p.id && rel.indexOf(x) < 0 && rel.length < 4) rel.push(x); });
    rel = rel.slice(0, 4);
    if (rel.length) { $('#relatedSection').hidden = false; $('#related').innerHTML = rel.map(function (x, i) { return AC.card(x, i); }).join(''); AC.reveal(); }
  });
})();
