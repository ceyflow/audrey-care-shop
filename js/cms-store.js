/*
 * Owner tools shared by the admin dashboard and the on-page editor: sign-in, saving content,
 * uploading photos. Connected shop -> Supabase (signed in as the owner). Demo mode -> this browser only.
 * This file is only ever loaded on admin.html and in edit mode, never for customers.
 */
(function () {
  var C = window.AC_CONFIG, CT = window.AC_CONTENT;
  var live = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  var SESSION = 'ac_admin_session';
  var CMS = window.AC_CMS = { live: live };

  /* ---------- session ---------- */
  function readSession() { try { return JSON.parse(localStorage.getItem(SESSION)); } catch (e) { return null; } }
  function writeSession(s) { try { if (s) localStorage.setItem(SESSION, JSON.stringify(s)); else localStorage.removeItem(SESSION); } catch (e) { /* private mode */ } }
  CMS.session = readSession;
  CMS.email = function () { var s = readSession(); return s && s.user && s.user.email || ''; };

  function authCall(path, body) {
    return fetch(C.SUPABASE_URL + '/auth/v1/' + path, { method: 'POST', headers: { apikey: C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error_description || j.msg || j.message || 'Sign-in failed'); return j; }); });
  }
  function store(j) {
    var s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user && j.user.id, email: j.user && j.user.email } };
    writeSession(s); return s;
  }
  var refreshing = null;                    /* several requests may need a fresh token at once; refresh only once */
  function refresh() {
    if (refreshing) return refreshing;
    var s = readSession();
    if (!s || !s.refresh_token) { writeSession(null); return Promise.reject(new Error('Your session ended. Please sign in again.')); }
    refreshing = authCall('token?grant_type=refresh_token', { refresh_token: s.refresh_token }).then(function (j) { refreshing = null; return store(j).access_token; })
      .catch(function () { refreshing = null; writeSession(null); throw new Error('Your session ended. Please sign in again.'); });
    return refreshing;
  }
  function token() {
    var s = readSession();
    if (!s) return Promise.reject(new Error('Please sign in.'));
    return s.expires_at - Date.now() / 1000 > 60 ? Promise.resolve(s.access_token) : refresh();
  }

  CMS.login = function (email, password) {
    return authCall('token?grant_type=password', { email: email, password: password }).then(function (j) {
      store(j);
      return api('POST', '/rest/v1/rpc/is_admin', {}).then(function (ok) {
        if (ok !== true) { writeSession(null); throw new Error('This account is not an owner account for the shop.'); }
        return readSession();
      });
    });
  };
  CMS.logout = function () {
    var s = readSession(); writeSession(null);
    if (live && s) fetch(C.SUPABASE_URL + '/auth/v1/logout', { method: 'POST', headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + s.access_token } }).catch(function () {});
  };
  /* Resolves true if already signed in as an owner (or in demo mode). */
  CMS.check = function () {
    if (!live) return Promise.resolve(true);
    if (!readSession()) return Promise.resolve(false);
    return api('POST', '/rest/v1/rpc/is_admin', {}).then(function (ok) { return ok === true; }).catch(function () { return false; });
  };

  /* ---------- Supabase calls as the signed-in owner ---------- */
  function api(method, path, body, headers) {
    return token().then(function (t) {
      var h = { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + t }, raw = typeof Blob !== 'undefined' && body instanceof Blob;
      if (body !== undefined && !raw) h['Content-Type'] = 'application/json';
      for (var k in headers) h[k] = headers[k];
      return fetch(C.SUPABASE_URL + path, { method: method, headers: h, body: body === undefined ? undefined : raw ? body : JSON.stringify(body) });
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {
          var m = ''; try { var j = JSON.parse(t); m = j.message || j.error || ''; } catch (e) { /* not json */ }
          if (r.status === 401 || r.status === 403) m = m || 'Not allowed — are you signed in as the owner?';
          throw new Error(m || 'Request failed (' + r.status + ')');
        });
      }
      if (r.status === 204) return null;
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('json') > -1) return r.text().then(function (t) { return t ? JSON.parse(t) : null; });   /* saves may answer with an empty body */
      return r.blob();
    });
  }
  CMS.api = api;
  CMS.select = function (table, query) { return api('GET', '/rest/v1/' + table + (query ? '?' + query : '')); };
  CMS.insert = function (table, rows) { return api('POST', '/rest/v1/' + table, rows, { Prefer: 'return=representation' }); };
  CMS.upsert = function (table, rows, onConflict) { return api('POST', '/rest/v1/' + table + '?on_conflict=' + (onConflict || 'id'), rows, { Prefer: 'resolution=merge-duplicates,return=minimal' }); };
  CMS.patch = function (table, filter, body) { return api('PATCH', '/rest/v1/' + table + '?' + filter, body, { Prefer: 'return=minimal' }); };
  CMS.remove = function (table, filter) { return api('DELETE', '/rest/v1/' + table + '?' + filter, undefined, { Prefer: 'return=minimal' }); };

  /* ---------- site content (texts, photos, contact, colours) ---------- */
  CMS.loadContent = function () {
    if (!live) return Promise.resolve(CT.load());
    return CMS.select('site_content', 'select=key,value').then(function (rows) { var kv = {}; rows.forEach(function (r) { kv[r.key] = r.value; }); CT.write(kv); return kv; });
  };
  /* set: { key: value }, remove: [key, ...] */
  CMS.saveContent = function (set, remove) {
    set = set || {}; remove = remove || [];
    var keep = CT.load(), k;
    for (k in set) keep[k] = set[k];
    remove.forEach(function (key) { delete keep[key]; });
    var rows = Object.keys(set).map(function (key) { return { key: key, value: String(set[key]), updated_at: new Date().toISOString() }; });
    if (!live) {
      if (!CT.write(keep)) return Promise.reject(new Error('This browser has no room left to save changes (try smaller photos).'));
      return Promise.resolve();
    }
    var jobs = [];
    if (rows.length) jobs.push(CMS.upsert('site_content', rows, 'key'));
    if (remove.length) jobs.push(CMS.remove('site_content', 'key=in.(' + encodeURIComponent(remove.map(function (x) { return '"' + x.replace(/"/g, '') + '"'; }).join(',')) + ')'));
    return Promise.all(jobs).then(function () { CT.write(keep); });
  };
  /* Texts the owner changed, as [{ key, original, now }] */
  CMS.textEdits = function (kv) {
    var out = [];
    for (var k in kv) if (k.indexOf('tx.') === 0) { try { var o = JSON.parse(kv[k]); out.push({ key: k, original: o.o, now: o.n }); } catch (e) { /* skip */ } }
    return out;
  };

  /* ---------- photos ---------- */
  function toDataUrl(blob) { return new Promise(function (res, rej) { var f = new FileReader(); f.onload = function () { res(f.result); }; f.onerror = rej; f.readAsDataURL(blob); }); }
  /* Shrink a photo in the browser so uploads are quick and the site stays fast. */
  CMS.resize = function (file, maxSide) {
    maxSide = maxSide || 1600;
    if (/svg/.test(file.type)) return Promise.resolve(file);
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, maxSide / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w * s)); cv.height = Math.max(1, Math.round(h * s));
        var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, cv.width, cv.height);
        var png = file.type === 'image/png';
        cv.toBlob(function (b) { b ? resolve(b) : reject(new Error('Could not read that image.')); }, png ? 'image/png' : 'image/jpeg', png ? undefined : 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('That file isn’t a picture the browser can read. Use JPG, PNG or WebP.')); };
      img.src = url;
    });
  };
  /* Resolves with the address of the stored photo. */
  CMS.uploadImage = function (file, folder, maxSide) {
    if (!/^image\//.test(file.type)) return Promise.reject(new Error('Please choose a picture (JPG, PNG or WebP).'));
    return CMS.resize(file, maxSide).then(function (blob) {
      if (!live) return toDataUrl(blob);
      var ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/svg+xml' ? 'svg' : 'jpg';
      var base = (file.name || 'photo').replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'photo';
      var path = (folder || 'misc') + '/' + Date.now().toString(36) + '-' + base + '.' + ext;
      return api('POST', '/storage/v1/object/site-images/' + path, blob, { 'Content-Type': blob.type, 'x-upsert': 'false' })
        .then(function () { return C.SUPABASE_URL + '/storage/v1/object/public/site-images/' + path; });
    });
  };
  /* Open a private bank-transfer slip (connected shop only) */
  CMS.slipUrl = function (path) {
    return api('GET', '/storage/v1/object/authenticated/payment-slips/' + path).then(function (blob) { return URL.createObjectURL(blob); });
  };
})();
