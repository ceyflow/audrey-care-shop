/*
 * On-page editor. Opens when a shop page is loaded with ?edit=1 by the signed-in owner (see admin.html).
 * Click any text to change it, click any photo to replace it. Changes are saved as you go.
 */
(function () {
  var CT = window.AC_CONTENT, CMS = window.AC_CMS, AC = window.AC;
  var current = null, startKey = '', startHtml = '', allow = false, statusTimer;

  var PAGES = [
    ['Home', 'index.html'], ['Shop', 'shop.html'], ['Product page', 'product.html'], ['Bulk orders', 'bulk.html'], ['Our story', 'about.html'],
    ['Contact', 'contact.html'], ['Advice', 'advice.html'], ['Quizzes', 'quiz.html'], ['Checkout', 'checkout.html'], ['Track an order', 'order.html'], ['Policies', 'policies.html']
  ];
  var here = location.pathname.split('/').pop() || 'index.html';

  /* ---------- toolbar ---------- */
  var bar = document.createElement('div');
  bar.id = 'ac-editor'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Page editor');
  bar.innerHTML =
    '<div class="ed-row"><b class="ed-title">Editing ' + (CMS.live ? '' : '<small>demo — saved in this browser only</small>') + '</b>' +
    '<label class="ed-page">Page <select id="edPage">' + PAGES.map(function (p) { return '<option value="' + p[1] + '"' + (p[1] === here ? ' selected' : '') + '>' + p[0] + '</option>'; }).join('') + '</select></label>' +
    '<span class="ed-sep"></span>' +
    '<button type="button" id="edItalic" title="Make the selected words the soft italic accent">Accent</button>' +
    '<button type="button" id="edReset" title="Put this text back to how it was">Reset text</button>' +
    '<button type="button" id="edMenu">Menu</button><button type="button" id="edBag">Bag</button>' +
    '<span class="ed-status" id="edStatus" role="status"></span>' +
    '<a class="ed-done" href="admin.html">Done</a></div>' +
    '<div class="ed-hint">Click any text to change it. Click a photo to replace it. Enter saves, Esc cancels.</div>';
  document.body.appendChild(bar);
  var status = bar.querySelector('#edStatus');

  function say(msg, kind) {
    status.textContent = msg; status.className = 'ed-status' + (kind ? ' is-' + kind : '');
    clearTimeout(statusTimer);
    if (kind === 'ok') statusTimer = setTimeout(function () { status.textContent = ''; }, 2200);
  }
  bar.addEventListener('mousedown', function (e) { if (e.target.tagName !== 'SELECT') e.preventDefault(); });   /* keep the caret where it is */

  bar.querySelector('#edPage').addEventListener('change', function (e) {
    commit();
    var url = e.target.value;
    if (url === 'product.html') {
      var p = AC && AC.products && AC.products[0];
      url += '?id=' + (p ? p.id : '');
    }
    location.href = url + (url.indexOf('?') > -1 ? '&' : '?') + 'edit=1';
  });
  bar.querySelector('#edItalic').addEventListener('click', function () { if (current) document.execCommand('italic'); });
  bar.querySelector('#edReset').addEventListener('click', function () { if (current) { current.innerHTML = startKey; commit(); } });
  function press(sel) { var el = document.querySelector(sel); if (!el) return; allow = true; try { el.click(); } finally { allow = false; } }
  bar.querySelector('#edMenu').addEventListener('click', function () { press('[data-mega="shop"]'); });
  bar.querySelector('#edBag').addEventListener('click', function () { if (AC && AC.openCart) { allow = true; try { AC.openCart(); } finally { allow = false; } } });

  /* ---------- text ---------- */
  function keyOf(el) { var now = CT.norm(el.innerHTML); return el.__cms && el.__cms.n === now ? el.__cms.o : now; }

  function begin(el, ev) {
    if (current === el) return;
    commit();
    current = el; startKey = keyOf(el); startHtml = CT.norm(el.innerHTML);
    el.setAttribute('contenteditable', 'true');
    el.focus();
    var r = ev && document.caretRangeFromPoint ? document.caretRangeFromPoint(ev.clientX, ev.clientY) : null;
    if (r && el.contains(r.startContainer)) { var s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    say('Editing…');
  }

  function fanOut(origKey, html) {       /* the same words elsewhere on this page change too */
    CT.units(document.body).forEach(function (u) {
      if (u.t !== 'e' || u.key !== origKey || u.el === current) return;
      u.el.innerHTML = html === null ? origKey : CT.clean(html);
      u.el.__cms = html === null ? null : { o: origKey, n: CT.norm(u.el.innerHTML) };
    });
  }

  function commit() {
    if (!current) return;
    var el = current; current = null;
    el.removeAttribute('contenteditable');
    var html = CT.clean(el.innerHTML), now = CT.norm(html);
    el.innerHTML = html;
    if (now === startHtml) { if (status.textContent === 'Editing…') say(''); return; }
    var key = CT.txKey(startKey), prev = startHtml, orig = startKey, revert = now === orig;
    if (!now) { el.innerHTML = prev; say('A text can’t be empty — use Reset instead.', 'err'); return; }
    say('Saving…');
    var job = revert ? CMS.saveContent({}, [key]) : CMS.saveContent((function () { var o = {}; o[key] = JSON.stringify({ o: orig, n: html }); return o; })());
    job.then(function () {
      if (revert) { delete CT.tx[orig]; el.__cms = null; } else { CT.tx[orig] = html; CT.hasTx = true; el.__cms = { o: orig, n: CT.norm(el.innerHTML) }; }
      fanOut(orig, revert ? null : html);
      say('Saved', 'ok');
    }).catch(function (err) { el.innerHTML = prev; say('Could not save: ' + err.message, 'err'); });
  }

  document.addEventListener('focusout', function (e) { if (current && e.target === current) setTimeout(function () { if (current === e.target) commit(); }, 0); });
  document.addEventListener('keydown', function (e) {
    if (!current || !current.contains(e.target)) return;
    if (e.key === 'Enter') { e.preventDefault(); current.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); current.innerHTML = startHtml; current.blur(); }
  }, true);
  document.addEventListener('keyup', function (e) {                 /* Space must not "press" the button the label sits in */
    if (current && e.key === ' ' && current.closest('button, summary')) e.preventDefault();
  }, true);
  document.addEventListener('paste', function (e) {
    if (!current || !current.contains(e.target)) return;
    e.preventDefault();
    var t = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, t);
  }, true);

  /* ---------- photos ---------- */
  var pop = document.createElement('div'); pop.id = 'ac-pop'; pop.hidden = true; document.body.appendChild(pop);
  function closePop() { pop.hidden = true; }
  function slotChoices(slot, x, y) {
    var name = slot.getAttribute('data-slot'), kvKey = 'img.' + name, custom = !!CT.kv[kvKey] || (name === 'logo' && !!CT.kv['img.logo']);
    pop.innerHTML = '<b>' + (name === 'logo' ? 'Logo' : 'Photo') + '</b><button type="button" data-do="pick">Choose a new picture</button>' + (custom ? '<button type="button" data-do="clear">Use the built-in picture</button>' : '') + '<button type="button" data-do="x">Cancel</button>';
    pop.hidden = false;
    pop.style.left = Math.max(8, Math.min(innerWidth - 250, x - 20)) + 'px'; pop.style.top = Math.max(8, Math.min(innerHeight - 160, y + 10)) + 'px';
    pop.onclick = function (e) {
      var t = e.target.closest('[data-do]'), a = t && t.getAttribute('data-do'); if (!a) return;
      closePop();
      if (a === 'pick') pick(name);
      if (a === 'clear') { say('Saving…'); CMS.saveContent({}, [kvKey]).then(function () { location.reload(); }).catch(function (err) { say('Could not save: ' + err.message, 'err'); }); }
    };
  }
  function pick(name) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/svg+xml';
    inp.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'; document.body.appendChild(inp);
    inp.onchange = function () {
      var f = inp.files[0]; inp.remove(); if (!f) return;
      say('Uploading…');
      CMS.uploadImage(f, 'site', name === 'logo' ? 800 : 1800).then(function (url) {
        var set = {}; set['img.' + name] = url; return CMS.saveContent(set);
      }).then(function () { say('Saved — refreshing…', 'ok'); location.reload(); }).catch(function (err) { say('Could not save: ' + err.message, 'err'); });
    };
    inp.click();
  }

  /* ---------- colours of one place ---------- */
  var st = document.createElement('div'); st.id = 'ac-style'; st.hidden = true;
  st.innerHTML = '<div class="st-head"><b id="stName">Colours</b><button type="button" data-st="x" aria-label="Close">×</button></div>' +
    '<label class="st-row"><span>Text colour</span><input type="color" id="stText"><button type="button" data-st="clr-c">Clear</button></label>' +
    '<label class="st-row"><span>Background</span><input type="color" id="stBg"><button type="button" data-st="clr-b">Clear</button></label>' +
    '<div class="st-row st-area"><span>Area</span><button type="button" data-st="up">↑ Bigger</button><button type="button" data-st="down">↓ Smaller</button></div>' +
    '<p class="st-hint">Changes only this one place. Use <b>Bigger</b> to colour the whole box around it.</p>';
  document.body.appendChild(st);
  var stTarget = null, stStack = [], stPending = null, stText = st.querySelector('#stText'), stBg = st.querySelector('#stBg');

  function hexOf(c) {
    var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c);
    if (!m || (m[4] !== undefined && Number(m[4]) === 0)) return null;
    return '#' + [1, 2, 3].map(function (i) { return ('0' + Number(m[i]).toString(16)).slice(-2); }).join('');
  }
  function nameOf(t) {
    var tag = t.tagName;
    if (t.classList.contains('btn') || tag === 'BUTTON') return 'Button';
    if (/^H[1-6]$/.test(tag)) return 'Heading';
    if (/^(P|SPAN|A|LI|LABEL|EM|STRONG|SMALL|CITE|BLOCKQUOTE|DT|DD)$/.test(tag)) return 'Text';
    if (tag === 'SECTION' || tag === 'ARTICLE') return 'Section';
    return 'Box';
  }
  function fillStyle() {
    var t = stTarget, own = CT.styleOf(t) || {}, cs = getComputedStyle(t);
    st.querySelector('#stName').textContent = nameOf(t) + ' colours';
    stText.value = own.c || hexOf(cs.color) || '#000000';
    stBg.value = own.b || hexOf(cs.backgroundColor) || '#ffffff';
    st.querySelector('[data-st="clr-c"]').hidden = !own.c;
    st.querySelector('[data-st="clr-b"]').hidden = !own.b;
    st.querySelector('[data-st="up"]').disabled = !canGoUp(t);
    st.querySelector('[data-st="down"]').disabled = !stStack.length;
  }
  function canGoUp(t) { var p = t.parentElement; return !!p && p !== document.body && p.tagName !== 'MAIN' && p !== document.documentElement; }
  function pickTarget(t) {
    if (stTarget) stTarget.classList.remove('cms-sel');
    stTarget = t; t.classList.add('cms-sel'); fillStyle();
  }
  function showStyle(t, e) {
    if (!t || t === document.body || t.closest('#ac-editor, #ac-pop, #ac-style, [data-nocms]')) return;
    stStack = []; stPending = null; pickTarget(t);
    st.hidden = false;
    var x = e ? e.clientX : 40, y = e ? e.clientY : 40, w = st.offsetWidth, h = st.offsetHeight;
    var top = y + 18; if (top + h > innerHeight - 110) top = Math.max(8, y - h - 14);
    st.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - 30)) + 'px'; st.style.top = top + 'px';
  }
  function persistStyle() {
    if (!stPending) return;
    var out = stPending; stPending = null; say('Saving…');
    CMS.saveContent(out.set, out.remove).then(function () { say('Saved', 'ok'); }).catch(function (err) { say('Could not save: ' + err.message, 'err'); });
  }
  function closeStyle() {
    persistStyle();
    if (stTarget) stTarget.classList.remove('cms-sel');
    stTarget = null; stStack = []; st.hidden = true;
  }
  stText.addEventListener('input', function () { stPending = CT.setStyle(stTarget, { c: stText.value }); st.querySelector('[data-st="clr-c"]').hidden = false; });
  stBg.addEventListener('input', function () { stPending = CT.setStyle(stTarget, { b: stBg.value }); st.querySelector('[data-st="clr-b"]').hidden = false; });
  stText.addEventListener('change', persistStyle); stBg.addEventListener('change', persistStyle);
  st.addEventListener('click', function (e) {
    var b = e.target.closest('[data-st]'); if (!b) return;
    var a = b.getAttribute('data-st');
    if (a === 'x') closeStyle();
    else if (a === 'clr-c' || a === 'clr-b') { stPending = CT.setStyle(stTarget, a === 'clr-c' ? { c: null } : { b: null }); persistStyle(); fillStyle(); }
    else if (a === 'up' && canGoUp(stTarget)) { stStack.push(stTarget); pickTarget(stTarget.parentElement); }
    else if (a === 'down' && stStack.length) pickTarget(stStack.pop());
  });

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (e) {
    if (allow || e.target.closest('#ac-editor')) return;
    if (e.target.closest('#ac-pop, #ac-style')) return;
    closePop(); closeStyle();
    if (current && e.target !== current && e.target.contains(current)) { e.preventDefault(); e.stopPropagation(); return; }   /* a button around the text being edited */
    var live = e.target.closest('[contenteditable="true"]');
    if (live) { if (live.closest('button, a, summary')) { e.preventDefault(); e.stopPropagation(); } return; }
    var text = e.target.closest('[data-cms-edit]');
    if (text) { e.preventDefault(); e.stopPropagation(); begin(text, e); showStyle(text.tagName === 'CMS-W' ? text.parentElement : text, e); return; }
    var btn = e.target.closest('button, summary');                     /* edge of a button: edit its label instead of pressing it */
    var label = btn && btn.querySelector('[data-cms-edit]');
    if (label) { e.preventDefault(); e.stopPropagation(); begin(label, e); showStyle(btn, e); return; }
    var slot = e.target.closest('[data-slot]');
    if (slot && !e.target.closest('button')) { e.preventDefault(); e.stopPropagation(); commit(); slotChoices(slot, e.clientX, e.clientY); return; }
    var link = e.target.closest('a[href]');
    if (link) { e.preventDefault(); e.stopPropagation(); showStyle(link, e); return; }
    if (!e.target.closest('button, input, select, textarea, summary, label')) showStyle(e.target, e);   /* blank space: colour that box */
  }, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
  window.addEventListener('beforeunload', commit);

  CT.processAll();
  document.title = 'Editing — ' + document.title;
})();
