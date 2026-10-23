(function () {
  var AC = window.AC, $ = AC.$, $$ = AC.$$, I = window.AC_ICONS, D = window.AC_DATA, ART = window.AC_ART;

  /* static icons declared in markup as data-icon="name" */
  $$('[data-icon]').forEach(function (el) { el.innerHTML = I[el.getAttribute('data-icon')] || ''; });
  $('#heroPrev').innerHTML = I.left; $('#heroNext').innerHTML = I.right;
  $('#railPrev').innerHTML = I.left; $('#railNext').innerHTML = I.right;

  /* hero artwork */
  $$('[data-art]').forEach(function (el) { el.innerHTML = ART.hero(el.getAttribute('data-art')); });
  $('#editorialArt').innerHTML = ART.editorial();
  $('#bandArt').innerHTML = ART.band();

  /* ---------- hero carousel ---------- */
  (function () {
    var hero = $('#hero'), slides = $$('.slide', hero), dots = $('#heroDots'), idx = 0, timer, paused = false;
    var DUR = 7000;
    hero.style.setProperty('--dur', DUR + 'ms');

    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
      if (i) s.setAttribute('inert', '');
    });

    function restartProgress() {
      hero.classList.remove('is-playing'); void hero.offsetWidth;
      if (!AC.reduced && !paused) hero.classList.add('is-playing');
    }
    function schedule() {
      clearTimeout(timer);
      if (AC.reduced || paused) return;
      timer = setTimeout(function () { go(idx + 1); }, DUR);
    }
    function go(n) {
      n = (n + slides.length) % slides.length;
      slides[idx].classList.remove('is-active'); slides[idx].setAttribute('inert', '');
      idx = n;
      slides[idx].classList.add('is-active'); slides[idx].removeAttribute('inert');
      $$('button', dots).forEach(function (b, i) { b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
      restartProgress(); schedule();
    }
    $('#heroPrev').addEventListener('click', function () { go(idx - 1); });
    $('#heroNext').addEventListener('click', function () { go(idx + 1); });

    function pause(v) { paused = v; if (v) { clearTimeout(timer); hero.classList.remove('is-playing'); } else { restartProgress(); schedule(); } }
    hero.addEventListener('mouseenter', function () { pause(true); });
    hero.addEventListener('mouseleave', function () { pause(false); });
    hero.addEventListener('focusin', function () { pause(true); });
    hero.addEventListener('focusout', function () { pause(false); });
    document.addEventListener('visibilitychange', function () { pause(document.hidden); });
    hero.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(idx - 1); if (e.key === 'ArrowRight') go(idx + 1); });

    var sx = null;
    hero.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    hero.addEventListener('pointerup', function (e) {
      if (sx === null) return; var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1));
    });

    $$('button', dots)[0].setAttribute('aria-current', 'true');
    restartProgress(); schedule();
  })();

  /* ---------- content that needs the catalogue ---------- */
  AC.ready.then(function () {
    /* category tiles: one representative product per group */
    var rep = { hair: 'shampoo-lavender', body: 'body-lotion-lavender', hands: 'hand-wash-apple', home: 'air-freshener-ocean-breeze' };
    $('#tiles').innerHTML = D.groups.map(function (g, i) {
      var p = AC.product(rep[g.id]) || AC.products.filter(function (x) { return x.kindObj.group === g.id; })[0];
      if (!p) return '';
      return '<a class="tile reveal" style="--d:' + i + '" href="shop.html?group=' + g.id + '">' + AC.media(p, 1) +
        '<div class="tile-cap"><b>' + g.name + '</b><i>' + I.arrow + '</i></div></a>';
    }).join('');

    /* bestseller rail */
    var feat = AC.products.filter(function (p) { return p.badge; });
    AC.products.forEach(function (p) { if (feat.indexOf(p) < 0 && feat.length < 8) feat.push(p); });
    $('#rail').innerHTML = feat.map(function (p, i) { return AC.card(p, i % 4); }).join('');

    var rail = $('#rail'), prev = $('#railPrev'), next = $('#railNext');
    function railState() {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    }
    function step(dir) { rail.scrollBy({ left: dir * (rail.clientWidth * 0.8), behavior: 'smooth' }); }
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    rail.addEventListener('scroll', railState, { passive: true }); window.addEventListener('resize', railState); railState();

    /* fragrance orbs */
    $('#scentList').innerHTML = D.fragrances.map(function (f, i) {
      var p = { name: f.name, kind: 'shower-gel', fragrance: f.id };
      return '<a class="scent reveal" style="--d:' + i + '" href="shop.html?scent=' + f.id + '"><div class="scent-orb">' +
        ART.packshot(p, { view: 'alt', scale: 1.25 }) + '</div><b>' + f.name + '</b><span>' + f.note + '</span></a>';
    }).join('');

    AC.reveal();
  });

  /* ---------- newsletter ---------- */
  var form = $('#nlForm'), note = $('#nlNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { note.style.color = 'var(--danger)'; note.textContent = 'Please enter a valid email address.'; return; }
    note.style.color = ''; note.textContent = 'Subscribing…';
    AC.submitForm('newsletter', { email: email, company: form.company.value }).then(function () {
      note.textContent = 'Thank you — you’re on the list.'; form.reset();
    }).catch(function (err) { note.style.color = 'var(--danger)'; note.textContent = err.message; });
  });
})();
