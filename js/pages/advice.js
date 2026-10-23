(function () {
  var AC = window.AC, $ = AC.$, D = window.AC_DATA, ART = window.AC_ART, root = $('#adviceRoot');
  var A = D.articles || [], id = AC.param('id'), art = AC.find(A, id), SEP = '<span aria-hidden="true">›</span>';
  var GROUP_LINK = { hair: 'Shop hair care', body: 'Shop body care', hands: 'Shop hand care', home: 'Shop home fragrance' };

  function card(a) {
    return '<article class="acard"><a class="img" href="advice.html?id=' + a.id + '" tabindex="-1" aria-hidden="true">' + (a.image ? ART.photo(a.image, a.title) : ART.banner(a.group)) + '</a>' +
      '<div class="kick">' + AC.esc(a.kicker) + '</div><h3><a href="advice.html?id=' + a.id + '">' + AC.esc(a.title) + '</a></h3><p>' + AC.esc(a.summary) + '</p></article>';
  }

  if (art) {
    document.title = art.title + ' — Audrey Care';
    $('#crumbs').innerHTML = '<a href="index.html">Home</a>' + SEP + '<a href="advice.html">Advice</a>' + SEP + '<span>' + AC.esc(art.title) + '</span>';
    var more = A.filter(function (x) { return x.id !== art.id; }).slice(0, 3);
    root.innerHTML = '<article style="padding-block:40px 20px;max-width:820px">' +
      '<div class="feature" style="display:block;margin-bottom:0"><div class="kick">' + AC.esc(art.kicker) + '</div></div>' +
      '<h1 class="page-title" style="font-size:52px;line-height:57px">' + AC.esc(art.title) + '</h1>' +
      '<div class="feature" style="display:block;margin:0 0 32px"><div class="img" style="aspect-ratio:16/8">' + (art.image ? ART.photo(art.image, art.title) : ART.banner(art.group)) + '</div></div>' +
      '<div class="page-desc" style="max-width:none;font-size:18px;line-height:1.8">' + art.body.map(function (t) { return '<p>' + AC.esc(t) + '</p>'; }).join('') + '</div>' +
      '<div style="margin-top:36px;display:flex;gap:14px;flex-wrap:wrap"><a class="btn" href="shop.html?group=' + art.group + '">' + GROUP_LINK[art.group] + '</a><a class="btn btn--ghost" href="advice.html">All advice</a></div></article>' +
      '<section style="padding-block:64px 100px"><h2 class="h2" style="margin-bottom:36px">More <em>tips</em></h2><div class="acards">' + more.map(card).join('') + '</div></section>';
  } else {
    var f = A[0];
    root.innerHTML = '<section class="shop-intro"><h1 class="page-title">Advice</h1><div class="page-desc"><p>Simple tips and ideas for getting more from everyday care: choosing a fragrance, washing hands well, making bath time last and looking after your hair.</p></div></section>' +
      (f ? '<div class="feature"><a class="img" href="advice.html?id=' + f.id + '" tabindex="-1" aria-hidden="true">' + (f.image ? ART.photo(f.image, f.title) : ART.banner(f.group)) + '</a><div><div class="kick">' + AC.esc(f.kicker) + '</div><h3><a href="advice.html?id=' + f.id + '">' + AC.esc(f.title) + '</a></h3><p>' + AC.esc(f.summary) + '</p><a class="more" href="advice.html?id=' + f.id + '">Read more</a></div></div>' : '') +
      '<div class="acards" style="padding-bottom:100px">' + A.slice(1).map(card).join('') + '</div>';
  }
})();
