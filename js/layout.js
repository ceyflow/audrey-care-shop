/*
 * Shared header and footer. Loaded synchronously right after <body> opens so the header is in
 * place before first paint (no layout shift). Edit navigation links here.
 */
(function () {
  var C = window.AC_CONFIG, D = window.AC_DATA;
  var page = document.body.getAttribute('data-page') || '';

  function ic(path, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + path + '</svg>';
  }
  var I = window.AC_ICONS = {
    search: ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    bag: ic('<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
    close: ic('<path d="M6 6l12 12M18 6 6 18"/>'),
    menu: ic('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    down: ic('<path d="m6 9 6 6 6-6"/>'),
    right: ic('<path d="m9 6 6 6-6 6"/>'),
    left: ic('<path d="m15 6-6 6 6 6"/>'),
    arrow: ic('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    minus: ic('<path d="M5 12h14"/>'),
    check: ic('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    truck: ic('<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>'),
    lock: ic('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    cash: ic('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>'),
    card: ic('<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>'),
    bank: ic('<path d="M3 9.5 12 4l9 5.5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/>'),
    chat: ic('<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/>'),
    leaf: ic('<path d="M5 19C5 10 11 5 20 5c0 9-4 14-11 14"/><path d="M5 19c3-5 7-8 11-10"/>'),
    drop: ic('<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.600 6-11 6-11z"/>'),
    heart: ic('<path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/>'),
    box: ic('<path d="m3 8 9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8"/>'),
    pin: ic('<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
    phone: ic('<path d="M6 3h3l1.500 4-2 1.500a11 11 0 0 0 6 6l1.500-2 4 1.500v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/>'),
    upload: ic('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
    logo: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 30C5 15 15 5 35 5c0 17-9 29-24 29-3 0-5-1-6-4z" fill="#4CAF6D"/><path d="M7 33c5-9 12-16 22-22" stroke="#fff" stroke-width="2.200" stroke-linecap="round" fill="none"/></svg>'
  };
  window.AC_ICON = function (n) { return I[n] || ''; };

  function brand(extra) {
    return '<a class="brand" href="index.html" aria-label="' + C.SITE_NAME + ' home">' + I.logo +
      '<span class="brand-name">Audrey Care<small>Gentle everyday care</small></span></a>';
  }

  /* ---------- header ---------- */
  var groupsHtml = D.groups.map(function (g) {
    var kinds = D.kinds.filter(function (k) { return k.group === g.id; });
    return '<div class="mega-col"><h4>' + g.name + '</h4>' +
      kinds.map(function (k) { return '<a href="shop.html?kind=' + k.id + '">' + k.name + '</a>'; }).join('') +
      '<a href="shop.html?group=' + g.id + '" style="color:var(--green-600);font-size:15px;margin-top:6px">Shop all ' + g.name.toLowerCase() + '</a></div>';
  }).join('');

  var scentHtml = D.fragrances.map(function (f) {
    var p = { name: f.name, kind: 'shower-gel', fragrance: f.id };
    return '<a class="scent-link" href="shop.html?scent=' + f.id + '"><div class="scent-thumb">' +
      window.AC_ART.packshot(p, { view: 'alt', scale: 1.1 }) + '</div><b>' + f.name + '</b><span>' + f.note + '</span></a>';
  }).join('');

  var featured = D.products[0];
  var wa = C.WHATSAPP_NUMBER ? '<a href="https://wa.me/' + C.WHATSAPP_NUMBER + '" target="_blank" rel="noopener">WhatsApp us ' + I.right + '</a>' : '';

  var header =
    '<a class="skip" href="#main">Skip to content</a>' +
    '<header class="site-header" id="siteHeader">' +
      '<div class="utility"><div class="wrap utility-in">' +
        '<nav aria-label="Site"><a class="' + (page === 'home' ? 'is-current' : '') + '" href="index.html">Audrey Care</a>' +
        '<a class="' + (page === 'bulk' ? 'is-current' : '') + '" href="bulk.html">Bulk orders</a>' +
        '<a class="' + (page === 'about' ? 'is-current' : '') + '" href="about.html">Our story</a></nav>' +
        '<nav aria-label="Account"><a href="order.html">Track my order ' + I.right + '</a>' + wa + '</nav>' +
      '</div></div>' +
      '<div class="mainbar"><div class="wrap mainbar-in">' +
        '<button class="icon-btn burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mnav">' + I.menu + '</button>' +
        brand() +
        '<nav class="mainnav" aria-label="Primary">' +
          '<button class="navlink' + (page === 'shop' || page === 'product' ? ' is-current' : '') + '" data-mega="shop" aria-expanded="false" aria-controls="mega">Shop ' + I.down + '</button>' +
          '<button class="navlink" data-mega="scent" aria-expanded="false" aria-controls="mega">Fragrances ' + I.down + '</button>' +
          '<a class="navlink' + (page === 'bulk' ? ' is-current' : '') + '" href="bulk.html">Bulk orders</a>' +
          '<a class="navlink' + (page === 'about' ? ' is-current' : '') + '" href="about.html">Our story</a>' +
        '</nav>' +
        '<div class="search" id="search" role="search"><form action="shop.html" method="get" autocomplete="off">' +
          '<input type="search" name="q" id="searchInput" placeholder="Type something here…" aria-label="Search products" aria-autocomplete="list" aria-controls="searchResults">' +
          '<button type="submit" aria-label="Search">' + I.search + '</button></form>' +
          '<div class="search-results" id="searchResults" role="listbox"></div></div>' +
        '<button class="icon-btn cart-btn" id="cartBtn" aria-label="Open bag">' + I.bag + '<span class="cart-count" id="cartCount">0</span></button>' +
      '</div>' +
      '<div class="mega" id="mega"><div class="wrap">' +
        '<div class="mega-panel" data-panel="shop">' + groupsHtml +
          '<a class="mega-feature" href="product.html?id=' + featured.id + '">' + window.AC_ART.packshot(featured, { view: 'alt', scale: 1.2 }) + '<span>Bestseller</span></a></div>' +
        '<div class="mega-panel mega-panel--scent" data-panel="scent">' + scentHtml + '</div>' +
      '</div></div></div>' +
    '</header>' +
    '<aside class="mnav" id="mnav" aria-label="Menu" aria-hidden="true">' +
      '<div class="mnav-top">' + brand() + '<button class="icon-btn" id="mnavClose" aria-label="Close menu">' + I.close + '</button></div>' +
      '<form action="shop.html" method="get"><input type="search" name="q" placeholder="Type something here…" aria-label="Search products"><button class="icon-btn" aria-label="Search" type="submit">' + I.search + '</button></form>' +
      '<div class="mnav-list">' +
        '<details><summary>Shop ' + I.down + '</summary><div>' +
          D.kinds.map(function (k) { return '<a href="shop.html?kind=' + k.id + '">' + k.name + '</a>'; }).join('') +
          '<a href="shop.html" style="color:var(--green-600)">Shop all</a></div></details>' +
        '<details><summary>Fragrances ' + I.down + '</summary><div>' +
          D.fragrances.map(function (f) { return '<a href="shop.html?scent=' + f.id + '"><span class="dot" style="background:' + f.color + '"></span>' + f.name + '</a>'; }).join('') +
          '</div></details>' +
        '<a href="bulk.html">Bulk orders</a><a href="about.html">Our story</a><a href="contact.html">Contact</a><a href="order.html">Track my order</a>' +
      '</div>' +
      '<div class="mnav-foot">' + (C.PHONE ? '<a href="tel:' + C.PHONE.replace(/\s/g, '') + '">' + C.PHONE + '</a>' : '') +
        (C.WHATSAPP_NUMBER ? '<a href="https://wa.me/' + C.WHATSAPP_NUMBER + '">Chat on WhatsApp</a>' : '') +
        (C.EMAIL ? '<a href="mailto:' + C.EMAIL + '">' + C.EMAIL + '</a>' : '') + '</div>' +
    '</aside>' +
    '<div class="scrim" id="scrim"></div>';

  var host = document.currentScript;
  host.insertAdjacentHTML('afterend', header);

  /* ---------- footer ---------- */
  var contactBits = [
    C.ADDRESS ? '<li>' + C.ADDRESS + '</li>' : '',
    C.PHONE ? '<li><a href="tel:' + C.PHONE.replace(/\s/g, '') + '">' + C.PHONE + '</a></li>' : '',
    C.EMAIL ? '<li><a href="mailto:' + C.EMAIL + '">' + C.EMAIL + '</a></li>' : '',
    C.WHATSAPP_NUMBER ? '<li><a href="https://wa.me/' + C.WHATSAPP_NUMBER + '" target="_blank" rel="noopener">WhatsApp</a></li>' : ''
  ].join('');

  var footer =
    '<footer class="footer"><div class="wrap"><div class="footer-grid">' +
      '<div>' + brand() + '<p>Gentle shampoos, body care and fragrances for everyday life. Available for delivery across Sri Lanka, and in bulk for hotels and spas.</p>' +
        '<div class="pay-row"><span>Cash on delivery</span><span>Bank transfer</span><span>Debit &amp; credit cards</span></div></div>' +
      '<div><h4>Shop</h4><ul>' + D.kinds.map(function (k) { return '<li><a href="shop.html?kind=' + k.id + '">' + k.name + '</a></li>'; }).join('') + '</ul></div>' +
      '<div><h4>Company</h4><ul><li><a href="about.html">Our story</a></li><li><a href="bulk.html">Bulk orders</a></li><li><a href="contact.html">Contact us</a></li><li><a href="order.html">Track my order</a></li></ul></div>' +
      '<div><h4>Get in touch</h4><ul>' + (contactBits || '<li><a href="contact.html">Send us a message</a></li>') + '</ul></div>' +
    '</div>' +
    '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' ' + C.SITE_NAME + '. All rights reserved.</span>' +
      '<nav aria-label="Legal"><a href="policies.html#delivery">Delivery</a><a href="policies.html#returns">Returns</a><a href="policies.html#privacy">Privacy</a><a href="policies.html#terms">Terms</a></nav></div>' +
    '</div></footer>';

  window.AC_FOOTER_HTML = footer;
})();
