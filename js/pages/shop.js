(function () {
  var AC = window.AC, $ = AC.$, $$ = AC.$$, D = window.AC_DATA;
  function list(k) { return (AC.param(k) || '').split(',').filter(Boolean); }
  var st = {
    group: AC.param('group') || '', kinds: list('kind'), scents: list('scent'), badges: list('badge'),
    q: (AC.param('q') || '').trim(), sort: AC.param('sort') || 'featured'
  };
  /* a chosen product type implies its group */
  if (st.kinds.length && !st.group) { var k0 = AC.find(D.kinds, st.kinds[0]); if (k0) st.group = k0.group; }

  function renderTiles() {
    var ARROW = window.AC_ICONS.arrow;
    var tiles = [{ id: '', name: 'All' }].concat(D.groups);
    $('#groupChips').innerHTML = tiles.map(function (g) {
      return '<a class="cat' + (st.group === g.id ? ' is-active' : '') + '" href="shop.html' + (g.id ? '?group=' + g.id : '') + '" data-group="' + g.id + '">' +
        '<span class="cat-img">' + window.AC_ART.tile(g.id || 'all') + '</span><span class="cat-name">' + AC.esc(g.name) + '</span></a>';
    }).join('') + '<a class="cat" href="bulk.html"><span class="cat-img">' + window.AC_ART.tile('bulk') + '</span><span class="cat-name">Bulk orders ' + ARROW + '</span></a>';
  }

  function opt(kind, id, label, checked, dot) {
    return '<label class="fopt"><input type="checkbox" data-' + kind + '="' + id + '"' + (checked ? ' checked' : '') + '><span>' +
      (dot ? '<i class="dot" style="background:' + dot + ';margin-right:8px"></i>' : '') + AC.esc(label) + '</span></label>';
  }
  function renderFilters() {
    var kinds = D.kinds.filter(function (k) { return !st.group || k.group === st.group; });
    $('#fKinds').innerHTML = kinds.map(function (k) { return opt('kind', k.id, k.name, st.kinds.indexOf(k.id) > -1); }).join('');
    $('#fScents').innerHTML = D.fragrances.map(function (f) { return opt('scent', f.id, f.name, st.scents.indexOf(f.id) > -1, f.color); }).join('');
    $('#fBadges').innerHTML = opt('badge', 'Bestseller', 'Bestsellers', st.badges.indexOf('Bestseller') > -1) + opt('badge', 'New', 'New in', st.badges.indexOf('New') > -1);
    $('#sort').value = st.sort;
  }

  function matches(p) {
    if (st.group && p.kindObj.group !== st.group) return false;
    if (st.kinds.length && st.kinds.indexOf(p.kind) < 0) return false;
    if (st.scents.length && st.scents.indexOf(p.fragrance) < 0) return false;
    if (st.badges.length && st.badges.indexOf(p.badge) < 0) return false;
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
    var g = AC.find(D.groups, st.group), k = st.kinds.length === 1 ? AC.find(D.kinds, st.kinds[0]) : null, f = st.scents.length === 1 ? AC.find(D.fragrances, st.scents[0]) : null, t, paras;
    if (st.q) { t = 'Results for “' + st.q + '”'; paras = ['Showing products that match your search.']; }
    else if (k) { t = k.name + (f ? ' · ' + f.name : ''); paras = ['Our ' + k.name.toLowerCase() + ' range, in every fragrance.']; }
    else if (f && !g) { t = f.name; paras = [f.note + '. Every product in this fragrance.']; }
    else if (g) { t = g.name + (f ? ' · ' + f.name : ''); paras = [GROUP_COPY[g.id]]; }
    else if (st.badges.length === 1) { t = st.badges[0] === 'New' ? 'New in' : 'Bestsellers'; paras = ['Our ' + (st.badges[0] === 'New' ? 'newest' : 'most-loved') + ' products.']; }
    else { t = 'All products'; paras = ['Gentle everyday care for hair, body, hands and home. Choose by type or by fragrance, from shampoo and shower gel to hand wash and room spray.']; }
    if (!st.q) paras.push('Buying for a hotel, spa or business? We supply our range in 5 L cans. <a href="bulk.html">Request a quote</a>.');
    $('#shopTitle').textContent = t;
    $('#shopLead').innerHTML = paras.map(function (x) { return '<p>' + (x.indexOf('<a') > -1 ? x : AC.esc(x)) + '</p>'; }).join('');
    $('#crumbNow').textContent = t; document.title = t + ' — Audrey Care';
  }

  function sorted(l) {
    l = l.slice();
    if (st.sort === 'price-asc') l.sort(function (a, b) { return a.from - b.from; });
    else if (st.sort === 'price-desc') l.sort(function (a, b) { return b.from - a.from; });
    else if (st.sort === 'name') l.sort(function (a, b) { return (a.name + a.frag.name).localeCompare(b.name + b.frag.name); });
    else l.sort(function (a, b) { return (b.badge ? 1 : 0) - (a.badge ? 1 : 0); });
    return l;
  }

  function render() {
    var l = sorted(AC.products.filter(matches));
    title(); renderTiles(); renderFilters();
    $('#count').textContent = l.length + (l.length === 1 ? ' product' : ' products');
    $('#grid').innerHTML = l.length ? l.map(function (p) { return AC.card(p); }).join('') :
      '<div class="no-results" style="grid-column:1/-1"><div class="serif-i" style="font-size:32px;color:var(--brand)">Nothing here yet</div>' +
      '<p class="muted">Try removing a filter, or search for something else.</p><button class="btn btn--sm" data-reset>Clear filters</button></div>';
    var p = new URLSearchParams();
    if (st.group) p.set('group', st.group);
    if (st.kinds.length) p.set('kind', st.kinds.join(','));
    if (st.scents.length) p.set('scent', st.scents.join(','));
    if (st.badges.length) p.set('badge', st.badges.join(','));
    if (st.q) p.set('q', st.q);
    if (st.sort !== 'featured') p.set('sort', st.sort);
    try { history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : '')); } catch (e) { /* preview frames may refuse */ }
  }

  function toggle(arr, v, on) { var i = arr.indexOf(v); if (on && i < 0) arr.push(v); if (!on && i > -1) arr.splice(i, 1); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.cat[data-group], [data-reset]'); if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-reset')) { st.group = ''; st.kinds = []; st.scents = []; st.badges = []; st.q = ''; }
    else { st.group = t.getAttribute('data-group'); st.kinds = []; }
    render();
  });
  document.addEventListener('change', function (e) {
    var i = e.target; if (!i.matches || !i.matches('.fopt input')) return;
    if (i.hasAttribute('data-kind')) toggle(st.kinds, i.getAttribute('data-kind'), i.checked);
    if (i.hasAttribute('data-scent')) toggle(st.scents, i.getAttribute('data-scent'), i.checked);
    if (i.hasAttribute('data-badge')) toggle(st.badges, i.getAttribute('data-badge'), i.checked);
    render();
  });
  $('#sort').addEventListener('change', function () { st.sort = this.value; render(); });
  $('#filtersToggle').addEventListener('click', function () {
    var f = $('#filters'), on = !f.classList.contains('is-open'); f.classList.toggle('is-open', on); this.setAttribute('aria-expanded', on);
  });

  $('#grid').innerHTML = new Array(7).join('<div><div class="skeleton" style="aspect-ratio:1"></div></div>');
  AC.ready.then(render);
})();
