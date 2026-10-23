(function () {
  var AC = window.AC, $ = AC.$, $$ = AC.$$, I = window.AC_ICONS, D = window.AC_DATA, ART = window.AC_ART;
  var ARROW = I.arrow;

  $('#heroPrev').innerHTML = I.left; $('#heroNext').innerHTML = I.right;
  $$('.pcar-arrow.prev').forEach(function (b) { b.innerHTML = I.left; });
  $$('.pcar-arrow.next').forEach(function (b) { b.innerHTML = I.right; });

  /* artwork */
  $$('[data-art]').forEach(function (el) { el.innerHTML = '<div class="art-clip">' + ART.hero(el.getAttribute('data-art')) + '</div>'; });
  $('#bannerArt').innerHTML = ART.wide();
  $('#bandArt').innerHTML = ART.band();
  $('#splitArt').innerHTML = ART.editorial();

  /* ---------- hero: manual, instant swap, no autoplay (as in the reference) ---------- */
  (function () {
    var hero = $('#hero'), slides = $$('.slide', hero), dots = $('#heroDots'), prev = $('#heroPrev'), next = $('#heroNext'), idx = 0;
    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
    });
    function go(n) {
      n = Math.max(0, Math.min(slides.length - 1, n));
      slides[idx].classList.remove('is-active'); idx = n; slides[idx].classList.add('is-active');
      $$('button', dots).forEach(function (b, i) { b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
      prev.disabled = idx === 0; next.disabled = idx === slides.length - 1;
    }
    prev.addEventListener('click', function () { go(idx - 1); });
    next.addEventListener('click', function () { go(idx + 1); });
    hero.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });
    var sx = null;
    hero.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    hero.addEventListener('pointerup', function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1)); });
    go(0);
  })();

  /* ---------- sections that need the catalogue ---------- */
  AC.ready.then(function () {
    /* explore tiles */
    var tiles = [{ id: '', name: 'All', href: 'shop.html', art: 'all' }].concat(D.groups.map(function (g) { return { id: g.id, name: g.name, href: 'shop.html?group=' + g.id, art: g.id }; }))
      .concat([{ id: 'bulk', name: 'Bulk orders', href: 'bulk.html', art: 'bulk' }]);
    $('#tiles').innerHTML = tiles.map(function (t) {
      return '<a class="tile" href="' + t.href + '"><span class="tile-img">' + ART.tile(t.art) + '</span><span class="tile-name"><span>' + AC.esc(t.name) + '</span>' + ARROW + '</span></a>';
    }).join('');

    /* bestsellers */
    var feat = AC.products.filter(function (p) { return p.badge; });
    AC.products.forEach(function (p) { if (feat.indexOf(p) < 0 && feat.length < 8) feat.push(p); });
    $('#bestTrack').innerHTML = feat.map(function (p) { return AC.card(p); }).join('');
    AC.carousel($('#bestCar'));

    /* fragrance tabs */
    var scentCar, current = D.fragrances[0].id;
    function paintScent() {
      $$('#scentTabs .tab').forEach(function (t) { t.setAttribute('aria-selected', t.getAttribute('data-id') === current); });
      $('#scentTrack').innerHTML = AC.products.filter(function (p) { return p.fragrance === current; }).map(function (p) { return AC.card(p); }).join('');
      $('#scentAll').href = 'shop.html?scent=' + current;
      if (scentCar) scentCar.reset();
    }
    $('#scentTabs').innerHTML = D.fragrances.map(function (f) { return '<button class="tab" role="tab" data-id="' + f.id + '">' + AC.esc(f.name) + '</button>'; }).join('');
    $('#scentTabs').addEventListener('click', function (e) { var t = e.target.closest('.tab'); if (!t) return; current = t.getAttribute('data-id'); paintScent(); });
    scentCar = AC.carousel($('#scentCar'));
    paintScent();

    /* tips */
    var A = D.articles || [];
    if (A.length) {
      var f = A[0];
      $('#tipsFeature').innerHTML = '<div class="feature"><a class="img" href="advice.html?id=' + f.id + '" tabindex="-1" aria-hidden="true">' + ART.banner(f.group) + '</a><div>' +
        '<div class="kick">' + AC.esc(f.kicker) + '</div><h3><a href="advice.html?id=' + f.id + '">' + AC.esc(f.title) + '</a></h3><p>' + AC.esc(f.summary) + '</p>' +
        '<a class="more" href="advice.html?id=' + f.id + '">Discover more about ' + AC.esc(f.title.toLowerCase()) + '</a></div></div>';
      $('#tipsCards').innerHTML = A.slice(1, 4).map(function (a) {
        return '<article class="acard"><a class="img" href="advice.html?id=' + a.id + '" tabindex="-1" aria-hidden="true">' + ART.banner(a.group) + '</a>' +
          '<div class="kick">' + AC.esc(a.kicker) + '</div><h3><a href="advice.html?id=' + a.id + '">' + AC.esc(a.title) + '</a></h3><p>' + AC.esc(a.summary) + '</p></article>';
      }).join('');
    }
  });
})();
