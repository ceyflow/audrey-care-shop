/* Bulk enquiry and contact forms. */
(function () {
  var AC = window.AC, $ = AC.$, I = window.AC_ICONS, D = window.AC_DATA, C = window.AC_CONFIG;
  var page = document.body.getAttribute('data-page');

  $$icons();
  function $$icons() { AC.$$('[data-icon]').forEach(function (el) { el.innerHTML = I[el.getAttribute('data-icon')] || ''; }); }

  function thanks(wrapId, title, text) {
    $(wrapId).innerHTML = '<div class="co-step" style="margin:0;text-align:center;display:grid;gap:16px;justify-items:center;padding-block:56px"><div class="check">' + I.check + '</div>' +
      '<h3 class="h2" style="font-size:32px">' + title + '</h3><p class="lead" style="margin-inline:auto">' + text + '</p>' +
      '<a class="btn btn--sm" href="shop.html">Continue shopping</a></div>';
    $(wrapId).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (page === 'bulk') {
    $('#btype').insertAdjacentHTML('beforeend', D.bulk.types.map(function (t) { return '<option>' + t + '</option>'; }).join(''));
    $('#size').innerHTML = '<option value="">Select…</option>' + D.bulk.sizes.map(function (t) { return '<option>' + t + '</option>'; }).join('');
    $('#kinds').innerHTML = D.bulk.kinds.map(function (k) { return '<label><input type="checkbox" name="products" value="' + k + '"><span>' + k + '</span></label>'; }).join('');
    AC.bindForm($('#bulkForm'), 'bulk', {
      business: { req: 1, msg: 'Please tell us your business name.' },
      contact: { req: 1, msg: 'Please tell us who to contact.' },
      phone: { req: 1, kind: 'phone' },
      email: { req: 1, kind: 'email', msg: 'Please enter your email.' },
      btype: {}, size: {}, quantity: {}, message: {}
    }, function () { thanks('#formWrap', 'Thank you — enquiry sent', 'We’ve got your details and will get back to you with a quote, usually within one working day.'); });
  }

  if (page === 'contact') {
    var bits = [
      C.ADDRESS ? ['pin', 'Visit us', AC.esc(C.ADDRESS)] : null,
      C.PHONE ? ['phone', 'Call us', '<a href="tel:' + C.PHONE.replace(/\s/g, '') + '">' + AC.esc(C.PHONE) + '</a>'] : null,
      C.EMAIL ? ['mail', 'Email us', '<a href="mailto:' + AC.esc(C.EMAIL) + '">' + AC.esc(C.EMAIL) + '</a>'] : null,
      C.WHATSAPP_NUMBER ? ['chat', 'WhatsApp', '<a href="https://wa.me/' + C.WHATSAPP_NUMBER + '" target="_blank" rel="noopener">Message us on WhatsApp</a>'] : null
    ].filter(Boolean);
    $('#reachList').innerHTML = bits.length ? bits.map(function (b) {
      return '<li><span class="ico">' + I[b[0]] + '</span><div><b>' + b[1] + '</b><span>' + b[2] + '</span></div></li>';
    }).join('') : '<li><span class="ico">' + I.mail + '</span><div><b>Send us a message</b><span>Use the form and we’ll reply as soon as we can.</span></div></li>';
    AC.bindForm($('#contactForm'), 'contact', {
      name: { req: 1, msg: 'Please tell us your name.' },
      phone: { kind: 'phone' },
      email: { req: 1, kind: 'email', msg: 'Please enter your email so we can reply.' },
      message: { req: 1, msg: 'Please write a short message.' }
    }, function () { thanks('#formWrap', 'Message sent', 'Thank you for getting in touch. We’ll reply as soon as we can.'); });
  }
  AC.reveal();
})();
