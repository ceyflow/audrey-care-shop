(function () {
  var AC = window.AC, $ = AC.$, D = window.AC_DATA;
  var st = {
    group: AC.param('group') || '', kind: AC.param('kind') || '', scent: AC.param('scent') || '',
    q: (AC.param('q') || '').trim(), sort: AC.param('sort') || 'featured', badge: AC.param('badge') || ''
  };

  /* a chosen product type implies its group */
  if (st.kind && !st.group) { var k0 = AC.find(D.kinds, st.kind); if (k0) st.group = k0.group; }

  function chip(label, pressed, attrs, dotColor) {
    return '<button class="chip" aria-pressed="' + pressed + '" ' + attrs + '>' +
      (dotColor ? '<span class="dot" style="background:' + dotColor + ';margin-right:8px"></span>' : '') + AC.esc(label) + '</button>';
  }

  function renderChips() {
    var ARROW = window.AC_ICONS.arrow;
    var tiles = [{ id: '', name: 'All' }].concat(D.groups);
    $('#groupChips').innerHTML = tiles.map(function (g) {
      return '<a class="cat' + (st.group === g.id ? ' is-active' : '') + '" href="shop.html' + (g.id ? '?group=' + g.id : '') + '" data-group="' + g.id + '">' +
        '<span class="cat-img">' + window.AC_ART.tile(g.id || 'all') + '</span><span class="cat-name">' + AC.esc(g.name) + '</span></a>';
    }).join('') + '<a class="cat cat--out" href="bulk.html"><span class="cat-img">' + window.AC_ART.tile('bulk') + '</span><span class="cat-name">Bulk orders ' + ARROW + '</span></a>';

    var kinds = D.kinds.filter(function (k) { return k.group === st.group; });
    $('#kindChips').hidden = !st.group || kinds.length < 2;
    $('#kindChips').innerHTML = chip('All ' + ((AC.find(D.groups, st.group) || {}).name || '').toLowerCase(), !st.kind, 'data-kind=""') +
      kinds.map(function (k) { return chip(k.name, st.kind === k.id, 'data-kind="' + k.id + '"'); }).join('');

    $('#scentChips').innerHTML = chip('Any fragrance', !st.scent, 'data-scent=""') +
      D.fragrances.map(function (f) { return chip(f.name, st.scent === f.id, 'data-scent="' + f.id + '"', f.color); }).join('');
    $('#sort').value = st.sort;
  }

  function matches(p) {
    if (st.group && p.kindObj.group !== st.group) return false;
    if (st.kind && p.kind !== st.kind) return false;
    if (st.scent && p.fragrance !== st.scent) return false;
    if (st.badge && p.badge !== st.badge) return false;
    if (st.q) {
      var hay = (p.name + ' ' + p.kindObj.name + ' ' + p.frag.name + ' ' + (p.tagline || '') + ' ' + (p.description || '')).toLowerCase();
      return st.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
    }
    return true;
  }

  var GROUP_COPY = {
    hair: 'Everyday shampoos and conditioners, in four fragrances.',
    body: 'Shower gel, body lotion and bubble bath for everyday freshness. Pick a fragrance and make daily care something to look forward to.',
    hands: 'Hand wash in an easy pump bottle, for kitchens, bathrooms and entryways.',
    home: 'Room fragrance to freshen the spaces you live in.'
  };
  function title() {
    var k = AC.find(D.kinds, st.kind), g = AC.find(D.groups, st.group), f = AC.find(D.fragrances, st.scent), t, paras;
    if (st.q) { t = 'Results for “' + st.q + '”'; paras = ['Showing products that match your search.']; }
    else if (st.badge) { t = (g ? g.name + ' · ' : '') + (st.badge === 'New' ? 'New in' : 'Bestsellers'); paras = ['Our ' + (st.badge === 'New' ? 'newest' : 'most-loved') + ' products' + (g ? ' for ' + g.name.toLowerCase() : '') + '.']; }
    else if (k) { t = k.name + (f ? ' · ' + f.name : ''); paras = ['Our ' + k.name.toLowerCase() + ' range, in every fragrance.']; }
    else if (f) { t = (g ? g.name + ' · ' : '') + f.name; paras = [f.note + '. ' + (g ? g.name + ' products' : 'Every product') + ' in this fragrance.']; }
    else if (g) { t = g.name; paras = [GROUP_COPY[g.id]]; }
    else { t = 'All products'; paras = ['Gentle everyday care for hair, body, hands and home. Choose by type or by fragrance, from shampoo and shower gel to hand wash and room spray.']; }
    if (!st.q) paras.push('Buying for a hotel, spa or business? We supply our range in 5 L cans. <a href="bulk.html">Request a quote</a>.');
    $('#shopTitle').textContent = t;
    $('#shopLead').innerHTML = paras.map(function (x) { return '<p>' + (x.indexOf('<a') > -1 ? x : AC.esc(x)) + '</p>'; }).join('');
    $('#crumbNow').textContent = t; document.title = t + ' — Audrey Care';
  }

  function sorted(list) {
    var l = list.slice();
    if (st.sort === 'price-asc') l.sort(function (a, b) { return a.from - b.from; });
    else if (st.sort === 'price-desc') l.sort(function (a, b) { return b.from - a.from; });
    else if (st.sort === 'name') l.sort(function (a, b) { return (a.name + a.frag.name).localeCompare(b.name + b.frag.name); });
    else l.sort(function (a, b) { return (b.badge ? 1 : 0) - (a.badge ? 1 : 0); });
    return l;
  }

  function render() {
    var list = sorted(AC.products.filter(matches));
    title(); renderChips();
    $('#count').textContent = list.length + (list.length === 1 ? ' product' : ' products');
    $('#grid').innerHTML = list.length ? list.map(function (p, i) { return AC.card(p, i % 4); }).join('') :
      '<div class="no-results" style="grid-column:1/-1"><div class="serif-i" style="font-size:32px;color:var(--green-900)">Nothing here — yet</div>' +
      '<p class="muted">Try removing a filter, or search for something else.</p><button class="btn btn--sm" data-reset>Clear filters</button></div>';
    AC.reveal($('#grid'));

    var p = new URLSearchParams();
    ['group', 'kind', 'scent', 'q', 'badge'].forEach(function (k) { if (st[k]) p.set(k, st[k]); });
    if (st.sort !== 'featured') p.set('sort', st.sort);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-group],[data-kind],[data-scent],[data-reset]'); if (!b) return;
    e.preventDefault();
    if (b.hasAttribute('data-reset')) { st.group = st.kind = st.scent = st.q = st.badge = ''; }
    else if (b.hasAttribute('data-group')) { st.group = b.getAttribute('data-group'); st.kind = ''; st.badge = ''; }
    else if (b.hasAttribute('data-kind')) st.kind = b.getAttribute('data-kind');
    else if (b.hasAttribute('data-scent')) st.scent = b.getAttribute('data-scent');
    render();
  });
  $('#sort').addEventListener('change', function () { st.sort = this.value; render(); });

  $('#grid').innerHTML = new Array(8).join('<div><div class="skeleton" style="aspect-ratio:4/5"></div></div>');
  AC.ready.then(render);
})();
