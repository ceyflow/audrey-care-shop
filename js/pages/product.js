(function () {
  var AC = window.AC, $ = AC.$, $$ = AC.$$, I = window.AC_ICONS;

  function out(p, v) { return v.stock !== null && v.stock !== undefined && v.stock <= 0; }

  AC.ready.then(function () {
    var p = AC.product(AC.param('id'));
    var root = $('#pdp');
    if (!p) {
      root.innerHTML = '<div class="no-results" style="grid-column:1/-1"><div class="serif-i" style="font-size:34px;color:var(--green-900)">We couldn’t find that product</div><p class="muted">It may have been renamed or is no longer available.</p><a class="btn btn--sm" href="shop.html">Back to shop</a></div>';
      return;
    }

    var f = p.frag, sel = p.variants[0], qty = 1, view = 0;
    document.title = p.name + ' · ' + f.name + ' — Audrey Care';
    var meta = document.querySelector('meta[name=description]'); if (meta) meta.content = p.tagline || p.description || '';
    $('#crumbs').innerHTML = '<a href="index.html">Home</a><span>/</span><a href="shop.html">Shop</a><span>/</span><a href="shop.html?kind=' + p.kind + '">' + AC.esc(p.kindObj.name) + '</a><span>/</span><span>' + AC.esc(p.name) + '</span>';

    /* other fragrances of the same product */
    var siblings = AC.products.filter(function (x) { return x.name === p.name && x.kind === p.kind; });

    var views = p.images.length ? p.images.map(function (src, i) { return AC.media(p, i); }) : [AC.media(p, 0), AC.media(p, 1)];
    var thumbs = views.map(function (h, i) { return '<button data-view="' + i + '" aria-label="View image ' + (i + 1) + '" aria-current="' + (i === 0) + '">' + h + '</button>'; }).join('');
    var stage = views.map(function (h, i) { return '<div class="v' + (i === 0 ? ' is-on' : '') + '">' + h + '</div>'; }).join('');

    root.innerHTML =
      '<div class="gallery"><div class="thumbs">' + thumbs + '</div><div class="stage">' +
        (p.badge ? '<span class="badge' + (p.badge === 'New' ? ' badge--new' : '') + '">' + AC.esc(p.badge) + '</span>' : '') + stage + '</div></div>' +
      '<div class="pdp-info">' +
        '<div class="card-kind"><span class="dot" style="background:' + f.color + ';width:10px;height:10px;margin-right:8px"></span>' + AC.esc(p.kindObj.name) + '</div>' +
        '<h1 class="pdp-title">' + AC.esc(p.name) + '<em>' + AC.esc(f.name) + '</em></h1>' +
        '<div class="pdp-price" id="price"></div>' +
        (p.tagline ? '<p class="lead" style="font-size:18px">' + AC.esc(p.tagline) + '</p>' : '') +
        (siblings.length > 1 ? '<div><span class="field-label">Fragrance · ' + AC.esc(f.name) + '</span><div class="opts scent-opts">' +
          siblings.map(function (s) { return '<a class="opt" role="radio" aria-checked="' + (s.id === p.id) + '" href="product.html?id=' + s.id + '"><span class="dot" style="background:' + s.frag.color + ';margin:0"></span>' + AC.esc(s.frag.name) + '</a>'; }).join('') + '</div></div>' : '') +
        (p.variants.length > 1 ? '<div><span class="field-label">Size</span><div class="opts" id="sizes" role="radiogroup" aria-label="Size"></div></div>' : '') +
        '<div class="buy-row"><div class="qty" aria-label="Quantity"><button id="qMinus" aria-label="Decrease quantity">' + I.minus + '</button><output id="qVal">1</output><button id="qPlus" aria-label="Increase quantity">' + I.plus + '</button></div>' +
        '<button class="btn" id="addBtn">Add to bag</button></div>' +
        '<ul class="assure"><li>' + I.truck + '<span>Free delivery on orders over ' + AC.money(AC.settings.free_over) + '</span></li>' +
          '<li>' + I.cash + '<span>Cash on delivery, bank transfer or card</span></li>' +
          '<li>' + I.leaf + '<span>Need it in bulk? <a href="bulk.html" style="text-decoration:underline">Request a quote</a></span></li></ul>' +
        '<div>' +
          '<details class="acc" open><summary>Details ' + I.plus + '</summary><div class="acc-body">' + AC.esc(p.description || '') + '</div></details>' +
          (p.how_to_use ? '<details class="acc"><summary>How to use ' + I.plus + '</summary><div class="acc-body">' + AC.esc(p.how_to_use) + '</div></details>' : '') +
          '<details class="acc"><summary>Ingredients ' + I.plus + '</summary><div class="acc-body">The full ingredient list is printed on the pack.</div></details>' +
          '<details class="acc"><summary>Delivery ' + I.plus + '</summary><div class="acc-body">Delivery across Sri Lanka, ' + AC.money(AC.settings.shipping_flat) + ' per order, free over ' + AC.money(AC.settings.free_over) + '. See <a href="policies.html#delivery" style="text-decoration:underline">delivery details</a>.</div></details>' +
        '</div>' +
      '</div>';

    var price = $('#price'), addBtn = $('#addBtn'), sizes = $('#sizes');

    function paint() {
      price.innerHTML = AC.money(sel.price * qty) + (sel.compare_at && sel.compare_at > sel.price ? ' <s class="muted" style="font-size:18px;font-weight:400">' + AC.money(sel.compare_at * qty) + '</s>' : '') +
        (qty > 1 ? ' <span class="muted" style="font-size:15px;font-weight:400">(' + AC.money(sel.price) + ' each)</span>' : '');
      var gone = out(p, sel);
      addBtn.disabled = gone; addBtn.textContent = gone ? 'Out of stock' : 'Add to bag';
      $('#qVal').textContent = qty;
      $('#stickyName').textContent = p.name + ' · ' + f.name;
      $('#stickyPrice').textContent = sel.label + ' · ' + AC.money(sel.price * qty);
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

    var resetT;
    function add() {
      if (out(p, sel)) return;
      AC.addToCart(sel.id, qty);
      addBtn.classList.add('is-added'); addBtn.innerHTML = I.check.replace('<svg', '<svg width="18" height="18"') + ' Added';
      clearTimeout(resetT); resetT = setTimeout(function () { addBtn.classList.remove('is-added'); paint(); }, 1800);
    }
    addBtn.addEventListener('click', add);
    $('#stickyBtn').addEventListener('click', add);

    /* gallery */
    function show(i) {
      view = i;
      $$('.stage .v').forEach(function (v, n) { v.classList.toggle('is-on', n === i); });
      $$('.thumbs button').forEach(function (b, n) { b.setAttribute('aria-current', n === i); });
    }
    $$('.thumbs button').forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-view')); }); });
    var stageEl = $('.stage');
    if (stageEl) stageEl.addEventListener('click', function () { show((view + 1) % views.length); });

    /* mobile sticky buy bar: shown whenever the main button is off screen (below or above) */
    var sticky = $('#stickyBuy'), tick = false;
    function stickyUpdate() {
      tick = false;
      var r = addBtn.getBoundingClientRect();
      var on = (r.bottom < 0 || r.top > window.innerHeight) && window.scrollY > 240;
      sticky.classList.toggle('is-on', on); sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      $('#stickyBtn').tabIndex = on ? 0 : -1;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(stickyUpdate); } }, { passive: true });
    window.addEventListener('resize', stickyUpdate);

    /* structured data for search engines */
    var ld = document.createElement('script'); ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: p.name + ' — ' + f.name, description: p.description,
      brand: { '@type': 'Brand', name: 'Audrey Care' },
      offers: p.variants.map(function (v) { return { '@type': 'Offer', priceCurrency: 'LKR', price: v.price, availability: out(p, v) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' }; })
    });
    document.head.appendChild(ld);

    paint();

    /* related */
    var rel = AC.products.filter(function (x) { return x.id !== p.id && x.kindObj.group === p.kindObj.group; });
    AC.products.forEach(function (x) { if (x.id !== p.id && rel.indexOf(x) < 0 && rel.length < 4) rel.push(x); });
    rel = rel.slice(0, 4);
    if (rel.length) { $('#relatedSection').hidden = false; $('#related').innerHTML = rel.map(function (x, i) { return AC.card(x, i); }).join(''); AC.reveal(); }
  });
})();
