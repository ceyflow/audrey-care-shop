/* "Find your fragrance": two questions, then a match and the products to try. */
(function () {
  var AC = window.AC, $ = AC.$, D = window.AC_DATA, ART = window.AC_ART, root = $('#quizRoot');
  var Q = [
    { q: 'How do you want to feel?', key: 'mood', opts: [
      ['Calm and relaxed', 'lavender'], ['Fresh and awake', 'ocean-breeze'], ['Cheerful and sweet', 'strawberry'], ['Crisp and clean', 'apple']] },
    { q: 'What are you shopping for?', key: 'group', opts: [
      ['Hair', 'hair'], ['Body', 'body'], ['Hands', 'hands'], ['Home', 'home'], ['Not sure yet', '']] }
  ];
  var ans = {}, step = 0;

  function frame(inner) { root.innerHTML = '<div style="max-width:760px">' + inner + '</div>'; }

  function ask() {
    var q = Q[step];
    frame('<p class="eyebrow">Question ' + (step + 1) + ' of ' + Q.length + '</p>' +
      '<h1 class="page-title" style="font-size:48px;line-height:54px;margin:14px 0 32px">' + AC.esc(q.q) + '</h1>' +
      '<div class="opts" role="group" aria-label="' + AC.esc(q.q) + '">' + q.opts.map(function (o, i) {
        return '<button class="opt" style="min-width:200px;min-height:56px;font-size:18px" data-i="' + i + '">' + AC.esc(o[0]) + '</button>';
      }).join('') + '</div>' + (step ? '<p style="margin-top:32px"><button class="link-arrow" id="back" style="text-decoration:underline">Back</button></p>' : ''));
    root.querySelectorAll('[data-i]').forEach(function (b) {
      b.addEventListener('click', function () {
        ans[q.key] = q.opts[+b.getAttribute('data-i')][1];
        step++; step < Q.length ? ask() : result();
      });
    });
    var back = $('#back'); if (back) back.addEventListener('click', function () { step--; ask(); });
  }

  function result() {
    var f = AC.find(D.fragrances, ans.mood) || D.fragrances[0];
    var picks = AC.products.filter(function (p) { return p.fragrance === f.id && (!ans.group || p.kindObj.group === ans.group); });
    if (!picks.length) picks = AC.products.filter(function (p) { return p.fragrance === f.id; });
    picks = picks.slice(0, 4);
    document.title = 'Your match: ' + f.name + ' — Audrey Care';
    frame('<p class="eyebrow">Your match</p>' +
      '<h1 class="page-title" style="margin:14px 0 12px">' + AC.esc(f.name) + '</h1>' +
      '<p class="page-desc" style="margin-bottom:32px"><span>' + AC.esc(f.note) + '. ' + (ans.group ? 'Here are the ' + AC.esc(ans.group) + ' products to try first.' : 'Here are some products to try first.') + '</span></p>');
    root.innerHTML += '<div class="grid grid--4" style="margin-top:8px">' + picks.map(function (p) { return AC.card(p); }).join('') + '</div>' +
      '<div style="margin-top:48px;display:flex;gap:14px;flex-wrap:wrap"><a class="btn" href="shop.html?scent=' + f.id + (ans.group ? '&group=' + ans.group : '') + '">Shop ' + AC.esc(f.name) + '</a><button class="btn btn--ghost" id="again">Retake the quiz</button></div>';
    $('#again').addEventListener('click', function () { ans = {}; step = 0; ask(); });
  }

  AC.ready.then(ask);
})();
