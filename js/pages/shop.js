(function () {
  var AC = window.AC, $ = AC.$, D = window.AC_DATA;
  var st = {
    group: AC.param('group') || '', kind: AC.param('kind') || '', scent: AC.param('scent') || '',
    q: (AC.param('q') || '').trim(), sort: AC.param('sort') || 'featured'
  };

  /* a chosen product type implies its group */
  if (st.kind && !st.group) { var k0 = AC.find(D.kinds, st.kind); if (k0) st.group = k0.group; }

  function chip(label, pressed, attrs, dotColor) {
    return '<button class="chip" aria-pressed="' + pressed + '" ' + attrs + '>' +
      (dotColor ? '<span class="dot" style="background:' + dotColor + ';margin-right:8px"></span>' : '') + AC.esc(label) + '</button>';
  }

  function renderChips() {
    $('#groupChips').innerHTML = chip('All', !st.group, 'data-group=""') +
      D.groups.map(function (g) { return chip(g.name, st.group === g.id, 'data-group="' + g.id + '"'); }).join('');

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
    if (st.q) {
      var hay = (p.name + ' ' + p.kindObj.name + ' ' + p.frag.name + ' ' + (p.tagline || '') + ' ' + (p.description || '')).toLowerCase();
      return st.q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
    }
    return true;
  }

  function title() {
    var k = AC.find(D.kinds, st.kind), g = AC.find(D.groups, st.group), f = AC.find(D.fragrances, st.scent), t, lead;
    if (st.q) { t = 'Results for “' + st.q + '”'; lead = 'Showing products that match your search.'; }
    else if (k) { t = k.name + (f ? ' · ' + f.name : ''); lead = 'Our ' + k.name.toLowerCase() + ' range, in every fragrance.'; }
    else if (f) { t = (g ? g.name + ' · ' : '') + f.name; lead = f.note + '. ' + (g ? g.name + ' products' : 'Every product') + ' in this fragrance.'; }
    else if (g) { t = g.name; lead = 'Everyday essentials for ' + g.name.toLowerCase() + '.'; }
    else { t = 'All products'; lead = 'Gentle everyday care for hair, body, hands and home.'; }
    $('#shopTitle').textContent = t; $('#shopLead').textContent = lead;
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
    ['group', 'kind', 'scent', 'q'].forEach(function (k) { if (st[k]) p.set(k, st[k]); });
    if (st.sort !== 'featured') p.set('sort', st.sort);
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-group],[data-kind],[data-scent],[data-reset]'); if (!b) return;
    if (b.hasAttribute('data-reset')) { st.group = st.kind = st.scent = st.q = ''; }
    else if (b.hasAttribute('data-group')) { st.group = b.getAttribute('data-group'); st.kind = ''; }
    else if (b.hasAttribute('data-kind')) st.kind = b.getAttribute('data-kind');
    else if (b.hasAttribute('data-scent')) st.scent = b.getAttribute('data-scent');
    render();
  });
  $('#sort').addEventListener('change', function () { st.sort = this.value; render(); });

  $('#grid').innerHTML = new Array(8).join('<div><div class="skeleton" style="aspect-ratio:4/5"></div></div>');
  AC.ready.then(render);
})();
