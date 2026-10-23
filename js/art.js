/*
 * Generated product artwork. Until real photos are added (`images` in data.js), products are
 * drawn as clean SVG packshots in each fragrance's colour. Nothing here needs editing.
 */
(function () {
  var uid = 0;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* amt > 0 mixes toward white, amt < 0 toward black. */
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  var CAP = '#F6F2EA';

  /* ---------- label printed on every pack ---------- */
  function label(x, y, w, h, color, kind, scent) {
    var cx = x + w / 2;
    return (
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7" fill="#fff" opacity=".95"/>' +
      '<text x="' + cx + '" y="' + (y + 21) + '" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-style="italic" font-size="13" fill="' + shade(color, -0.45) + '">Audrey Care</text>' +
      '<rect x="' + (cx - 11) + '" y="' + (y + 29) + '" width="22" height="1.5" fill="' + color + '"/>' +
      '<text x="' + cx + '" y="' + (y + 46) + '" text-anchor="middle" font-family="Figtree,Arial,sans-serif" font-weight="600" font-size="7.4" letter-spacing="1.3" fill="#2a3a31">' + esc(kind.toUpperCase()) + '</text>' +
      '<text x="' + cx + '" y="' + (y + 62) + '" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-style="italic" font-size="11.5" fill="' + color + '">' + esc(scent) + '</text>'
    );
  }

  /* ---------- pack shapes, drawn in a 200 x 300 box ---------- */
  function body(id, color) {
    return (
      '<linearGradient id="' + id + 'b" x1="0" x2="1" y1="0" y2="0">' +
      '<stop offset="0" stop-color="' + shade(color, -0.22) + '"/>' +
      '<stop offset=".3" stop-color="' + color + '"/>' +
      '<stop offset=".55" stop-color="' + shade(color, 0.28) + '"/>' +
      '<stop offset=".78" stop-color="' + color + '"/>' +
      '<stop offset="1" stop-color="' + shade(color, -0.3) + '"/></linearGradient>'
    );
  }

  var SHAPES = {
    pump: function (id, c, kind, scent) {
      return '<defs>' + body(id, c) + '</defs>' +
        '<path d="M44 128q0-28 28-28h56q28 0 28 28v140q0 24-24 24H68q-24 0-24-24z" fill="url(#' + id + 'b)"/>' +
        '<rect x="86" y="78" width="28" height="26" rx="4" fill="' + shade(c, -0.12) + '"/>' +
        '<rect x="79" y="66" width="42" height="16" rx="4" fill="' + CAP + '"/>' +
        '<rect x="95" y="38" width="10" height="30" rx="3" fill="' + CAP + '"/>' +
        '<path d="M70 30q0-8 8-8h52q12 0 18 8l2 6q0 6-6 6H76q-6 0-6-6z" fill="' + CAP + '"/>' +
        '<rect x="54" y="116" width="7" height="150" rx="3.5" fill="#fff" opacity=".2"/>' +
        label(55, 150, 90, 96, c, kind, scent);
    },
    bottle: function (id, c, kind, scent) {
      return '<defs>' + body(id, c) + '</defs>' +
        '<path d="M48 126q0-32 32-32h40q32 0 32 32v142q0 24-24 24H72q-24 0-24-24z" fill="url(#' + id + 'b)"/>' +
        '<path d="M72 96q0-14 8-20h40q8 6 8 20z" fill="' + shade(c, -0.12) + '"/>' +
        '<rect x="70" y="46" width="60" height="34" rx="7" fill="' + CAP + '"/>' +
        '<rect x="70" y="72" width="60" height="3" fill="' + shade(CAP, -0.12) + '"/>' +
        '<rect x="94" y="40" width="12" height="8" rx="3" fill="' + CAP + '"/>' +
        '<rect x="58" y="116" width="7" height="150" rx="3.5" fill="#fff" opacity=".2"/>' +
        label(55, 150, 90, 96, c, kind, scent);
    },
    bubble: function (id, c, kind, scent) {
      return '<defs>' + body(id, c) + '</defs>' +
        '<path d="M50 124q0-36 50-36t50 36v142q0 28-50 28t-50-28z" fill="url(#' + id + 'b)"/>' +
        '<rect x="62" y="40" width="76" height="52" rx="12" fill="' + CAP + '"/>' +
        '<g stroke="' + shade(CAP, -0.14) + '" stroke-width="2"><path d="M76 48v36M88 48v36M100 48v36M112 48v36M124 48v36"/></g>' +
        '<rect x="58" y="112" width="7" height="150" rx="3.5" fill="#fff" opacity=".2"/>' +
        label(55, 152, 90, 96, c, kind, scent);
    },
    spray: function (id, c, kind, scent) {
      return '<defs>' + body(id, c) + '</defs>' +
        '<rect x="56" y="112" width="88" height="180" rx="18" fill="url(#' + id + 'b)"/>' +
        '<path d="M68 114q0-24 14-30h36q14 6 14 30z" fill="' + shade(c, -0.12) + '"/>' +
        '<rect x="76" y="46" width="46" height="40" rx="7" fill="' + CAP + '"/>' +
        '<rect x="118" y="54" width="30" height="11" rx="3.5" fill="' + CAP + '"/>' +
        '<path d="M94 84q0 14-14 24l10 3q16-10 16-27z" fill="' + shade(CAP, -0.1) + '"/>' +
        '<rect x="64" y="124" width="7" height="156" rx="3.5" fill="#fff" opacity=".2"/>' +
        label(63, 158, 74, 96, c, kind, scent);
    },
    jar: function (id, c, kind, scent) {
      return '<defs>' + body(id, c) + '</defs>' +
        '<rect x="34" y="166" width="132" height="124" rx="22" fill="url(#' + id + 'b)"/>' +
        '<rect x="30" y="134" width="140" height="42" rx="12" fill="' + CAP + '"/>' +
        '<rect x="30" y="168" width="140" height="3" fill="' + shade(CAP, -0.12) + '"/>' +
        '<rect x="42" y="176" width="6" height="100" rx="3" fill="#fff" opacity=".2"/>' +
        label(55, 192, 90, 80, c, kind, scent);
    },
    bar: function (id, c) {
      return '<defs>' + body(id, c) + '</defs>' +
        '<rect x="22" y="196" width="156" height="92" rx="38" fill="url(#' + id + 'b)"/>' +
        '<rect x="34" y="204" width="132" height="14" rx="7" fill="#fff" opacity=".18"/>' +
        '<g transform="translate(100 244)" fill="' + shade(c, -0.3) + '" opacity=".5"><path d="M-28 6C-14-22 18-22 30-6 18 14-12 18-28 6Z"/></g>';
    },
    can: function (id, c, kind, scent) {
      return '<defs>' + body(id, c) + '</defs>' +
        '<path d="M42 112h96l22 22v146q0 14-14 14H56q-14 0-14-14z" fill="url(#' + id + 'b)"/>' +
        '<path d="M58 112V90q0-18 18-18h40q18 0 18 18v22" fill="none" stroke="' + shade(c, -0.25) + '" stroke-width="13" stroke-linecap="round"/>' +
        '<rect x="116" y="92" width="28" height="22" rx="4" fill="' + CAP + '"/>' +
        '<rect x="52" y="124" width="7" height="150" rx="3.5" fill="#fff" opacity=".2"/>' +
        '<rect x="56" y="156" width="88" height="96" rx="7" fill="#fff" opacity=".95"/>' +
        '<text x="100" y="182" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-style="italic" font-size="13" fill="' + shade(c, -0.45) + '">Audrey Care</text>' +
        '<text x="100" y="222" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-weight="600" font-size="30" fill="' + c + '">5 L</text>' +
        '<text x="100" y="240" text-anchor="middle" font-family="Figtree,Arial,sans-serif" font-weight="600" font-size="7.4" letter-spacing="1.3" fill="#2a3a31">' + esc((kind || 'BULK').toUpperCase()) + '</text>';
    }
  };

  function shape(type, color, kind, scent) {
    var id = 'p' + (++uid);
    return (SHAPES[type] || SHAPES.pump)(id, color, kind || '', scent || '');
  }

  /* ---------- fragrance motifs, drawn around (0,0) ---------- */
  var MOTIFS = {
    strawberry: function (c) {
      var seeds = '';
      [[-18, -4], [8, -14], [22, 6], [-6, 14], [-22, 22], [14, 28], [0, 40], [-12, 0], [18, -2]].forEach(function (p) {
        seeds += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="2.4" ry="3.6" fill="#fff" opacity=".7"/>';
      });
      return '<path d="M0-40C42-62 74-20 52 22 40 46 16 66 0 72-16 66-40 46-52 22-74-20-42-62 0-40Z" fill="' + c + '"/>' + seeds +
        '<path d="M0-42l-22-20 12-2 10 8 10-8 12 2z" fill="#5FA83C"/><path d="M0-42l-30-6 6 12zM0-42l30-6-6 12z" fill="#4C8F2E"/>';
    },
    lavender: function (c) {
      var out = '';
      [-34, 0, 34].forEach(function (x, i) {
        var top = i === 1 ? -70 : -54;
        out += '<path d="M' + x + ' 76Q' + x + ' 10 ' + x + ' ' + top + '" stroke="#5E8F4F" stroke-width="3" fill="none" stroke-linecap="round"/>';
        for (var k = 0; k < 7; k++) {
          var y = top + k * 11;
          out += '<ellipse cx="' + (x - 6) + '" cy="' + y + '" rx="4.5" ry="7" transform="rotate(-24 ' + (x - 6) + ' ' + y + ')" fill="' + c + '"/>' +
                 '<ellipse cx="' + (x + 6) + '" cy="' + (y + 5) + '" rx="4.5" ry="7" transform="rotate(24 ' + (x + 6) + ' ' + (y + 5) + ')" fill="' + shade(c, 0.12) + '"/>';
        }
      });
      return out;
    },
    apple: function (c) {
      return '<path d="M0-30C30-52 72-30 66 10 62 50 30 76 0 62-30 76-62 50-66 10-72-30-30-52 0-30Z" fill="' + c + '"/>' +
        '<path d="M-34 -6C-30 -24 -14 -30 -4 -26" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>' +
        '<path d="M0-30Q4-48 14-58" stroke="#6b4a2f" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        '<path d="M14-52C30-70 54-64 58-56 44-44 24-44 14-52Z" fill="#4C8F2E"/>';
    },
    'ocean-breeze': function (c) {
      var out = '';
      for (var i = 0; i < 4; i++) {
        out += '<path d="M-72 ' + (-42 + i * 28) + 'q18-18 36 0t36 0 36 0 36 0" stroke="' + c + '" stroke-width="7" fill="none" stroke-linecap="round" opacity="' + (1 - i * 0.18) + '"/>';
      }
      return out;
    }
  };

  function motif(fragId, color, x, y, scale, rot, opacity) {
    var fn = MOTIFS[fragId];
    if (!fn) return '';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + (scale || 1) + ')" opacity="' + (opacity == null ? 1 : opacity) + '">' + fn(color) + '</g>';
  }

  function leaf(x, y, s, rot, c, op) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + s + ')" opacity="' + (op == null ? 1 : op) + '">' +
      '<path d="M0 0C30-44 94-44 124 0 94 44 30 44 0 0Z" fill="' + c + '"/>' +
      '<path d="M6 0H112" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/></g>';
  }


  /* ---------- your own photos (see IMAGES in config.js) ---------- */
  function photo(src, alt) {
    return '<img src="' + String(src).replace(/"/g, '&quot;') + '" alt="' + esc(alt || '') + '" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block">';
  }
  function images() { return (window.AC_CONFIG && window.AC_CONFIG.IMAGES) || {}; }
  /* Returns the photo for a named slot if one is set, otherwise the built-in illustration. */
  function slot(name, fallback, alt) { var v = images()[name]; return v ? photo(v, alt || name) : fallback(); }

  /* ---------- public: product packshot (400 x 500) ---------- */
  function lookup(key, list) {
    for (var i = 0; i < list.length; i++) if (list[i].id === key) return list[i];
    return null;
  }

  function packshot(product, opts) {
    opts = opts || {};
    var D = window.AC_DATA;
    var frag = lookup(product.fragrance, D.fragrances) || D.fragrances[0];
    var kind = lookup(product.kind, D.kinds) || D.kinds[0];
    var id = 'g' + (++uid);
    var alt = opts.view === 'alt';
    var plain = !!opts.plain;
    var bg = plain ? '#ffffff' : (alt ? shade(frag.color, 0.78) : frag.tint);
    var inner = shape(kind.type, frag.color, kind.name, frag.name);
    var scale = opts.scale || 1.42;
    var tx = 200 - 100 * scale;
    var ty = alt ? 34 : 38;

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="' + esc(product.name + ' ' + frag.name) + '" preserveAspectRatio="xMidYMid slice">' +
      '<defs><radialGradient id="' + id + 'g" cx=".5" cy=".42" r=".62"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 's" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
      (opts.bg === 'none' ? '' : '<rect width="400" height="500" fill="' + bg + '"/>') +
      (plain ? '' : '<rect width="400" height="500" fill="url(#' + id + 'g)"/>');

    if (plain) {
      /* clean cut-out on white: no motif, no glow */
    } else if (alt) {
      svg += motif(frag.id, frag.color, 262, 190, 2.1, -8, 0.22) +
             leaf(-20, 430, 1.4, -20, shade(frag.color, 0.2), 0.35);
    } else {
      svg += motif(frag.id, frag.color, 330, 92, 0.6, 10, 0.9);
    }
    svg += '<ellipse cx="200" cy="' + (ty + 292 * scale + 2) + '" rx="' + (88 * scale) + '" ry="' + (10 * scale) + '" fill="url(#' + id + 's)"/>' +
      '<g transform="translate(' + tx + ' ' + ty + ') scale(' + scale + ')' + (alt ? ' rotate(-5 100 292)' : '') + '">' + inner + '</g></svg>';
    return svg;
  }

  /* ---------- public: hero compositions (900 x 780) ---------- */
  function heroSvg(inner, bgA, bgB, vb) {
    var id = 'h' + (++uid);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || '90 120 720 570') + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + bgA + '"/><stop offset="1" stop-color="' + bgB + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'g" cx=".42" cy=".4" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + id + 's" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
      '<rect x="-200" y="-200" width="1400" height="1200" fill="url(#' + id + ')"/><rect x="-200" y="-200" width="1400" height="1200" fill="url(#' + id + 'g)"/>' + inner(id) + '</svg>';
  }

  function placed(id, type, color, kind, scent, x, y, s, rot) {
    return '<ellipse cx="' + (x + 100 * s) + '" cy="' + (y + 294 * s) + '" rx="' + (84 * s) + '" ry="' + (11 * s) + '" fill="url(#' + id + 's)"/>' +
      '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ' ' + (100 * s) + ' ' + (292 * s) + ') scale(' + s + ')">' + shape(type, color, kind, scent) + '</g>';
  }

  var HERO = {
    care: function () {
      return heroSvg(function (id) {
        return leaf(560, 90, 1.6, -28, '#7CBF93', 0.55) + leaf(-30, 560, 1.9, -50, '#8CCBA0', 0.5) + leaf(640, 560, 1.3, 36, '#6FB488', 0.45) +
          '<circle cx="470" cy="420" r="250" fill="#fff" opacity=".28"/>' +
          placed(id, 'bottle', '#5FA83C', 'Shampoo', 'Apple', 120, 237, 1.45, -9) +
          placed(id, 'pump', '#8A74C2', 'Body Lotion', 'Lavender', 285, 124, 1.8, 0) +
          placed(id, 'bar', '#7CBF93', '', '', 535, 304, 1.2, 10);
      }, '#E3F3E8', '#B9DEC6');
    },
    scent: function () {
      var xs = [74, 232, 390, 548], fr = window.AC_DATA.fragrances, types = ['pump', 'bottle', 'pump', 'bubble'], kinds = ['Hand Wash', 'Shampoo', 'Shower Gel', 'Bubble Bath'];
      return heroSvg(function (id) {
        var out = '', i;
        out += motif('strawberry', fr[0].color, 160, 150, 1.15, -12, 0.3) + motif('lavender', fr[1].color, 760, 160, 1.3, 14, 0.3) +
               motif('apple', fr[2].color, 130, 690, 1.05, 10, 0.28) + motif('ocean-breeze', fr[3].color, 720, 670, 1.2, -6, 0.32);
        for (i = 0; i < 4; i++) {
          out += placed(id, types[i], fr[i].color, kinds[i], fr[i].name, xs[i], 190 + (i % 2) * 36, 1.5, (i - 1.5) * 4);
        }
        return out;
      }, '#F1ECF8', '#DDEAF2');
    },
    bulk: function () {
      return heroSvg(function (id) {
        return leaf(-20, 120, 1.7, 40, '#E2C48F', 0.55) + leaf(620, 600, 1.8, -30, '#D9B678', 0.5) +
          '<circle cx="450" cy="420" r="260" fill="#fff" opacity=".3"/>' +
          placed(id, 'can', '#2F8A57', 'Hand Wash', '', 100, 215, 1.5, -4) +
          placed(id, 'can', '#2F8FAE', 'Shower Gel', '', 470, 170, 1.7, 4) +
          placed(id, 'pump', '#B5651D', 'Body Lotion', 'Lavender', 345, 345, 1.05, 0);
      }, '#F6EBD8', '#E6CFA6');
    }
  };

  function band() {
    return heroSvg(function (id) {
      return leaf(120, 40, 1.4, 30, '#E2C48F', 0.55) + leaf(730, 400, 1.3, -35, '#D9B678', 0.5) +
        placed(id, 'can', '#2F8A57', 'Hand Wash', '', 110, 170, 1.4, -3) +
        placed(id, 'pump', '#B5651D', 'Body Lotion', 'Lavender', 310, 270, 1.15, 0) +
        placed(id, 'can', '#2F8FAE', 'Shower Gel', '', 440, 110, 1.6, 3) +
        placed(id, 'bottle', '#8A74C2', 'Shampoo', 'Lavender', 620, 250, 1.2, 5);
    }, '#F6EBD8', '#E6CFA6', '0 0 900 600');
  }


  /* ---------- public: category tile (348 x 300) and menu banner (480 x 270) ---------- */
  var TILE = {
    all:   { bg: '#143d2c' },
    hair:  { bg: '#37B98E', item: ['bottle', '#8A74C2', 'Shampoo', 'Lavender'] },
    body:  { bg: '#F27D8A', item: ['pump', '#2F8FAE', 'Body Lotion', 'Ocean Breeze'] },
    hands: { bg: '#F2B632', item: ['pump', '#5FA83C', 'Hand Wash', 'Apple'] },
    home:  { bg: '#46B3C8', item: ['spray', '#8A74C2', 'Air Freshener', 'Lavender'] },
    bulk:  { bg: '#E58A3C', item: ['can', '#2F8A57', 'Hand Wash', ''] }
  };
  function tile(g) {
    var tp = images().tiles || {};
    if (tp[g]) return photo(tp[g], g);
    var st = TILE[g] || TILE.all, id = 't' + (++uid), inner;
    if (g === 'all' || !TILE[g]) {
      inner = '<g transform="translate(170 110) scale(3.2) translate(-20 -20)"><path d="M5 30C5 15 15 5 35 5c0 17-9 29-24 29-3 0-5-1-6-4z" fill="#fff"/><path d="M7 33c5-9 12-16 22-22" stroke="' + st.bg + '" stroke-width="2.2" stroke-linecap="round" fill="none"/></g>';
    } else {
      inner = '<circle cx="170" cy="110" r="88" fill="#fff" opacity=".18"/>' + placed(id, st.item[0], st.item[1], st.item[2], st.item[3], 112, 10, 0.64, 0);
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><radialGradient id="' + id + 's" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="340" height="220" fill="' + st.bg + '"/>' + inner + '</svg>';
  }

  var BANNER = {
    hair:  { a: '#E3F4EC', b: '#BFE4D3', items: [['bottle', '#8A74C2', 'Shampoo', 'Lavender', 36, 20, 0.8, -5], ['bottle', '#5FA83C', 'Shampoo', 'Apple', 160, 10, 0.86, 0], ['bottle', '#D9566B', 'Conditioner', 'Strawberry', 292, 22, 0.8, 5]] },
    body:  { a: '#FDE9EC', b: '#F6C4CB', items: [['pump', '#2F8FAE', 'Shower Gel', 'Ocean Breeze', 36, 20, 0.8, -5], ['pump', '#8A74C2', 'Body Lotion', 'Lavender', 160, 10, 0.86, 0], ['bubble', '#D9566B', 'Bubble Bath', 'Strawberry', 292, 22, 0.8, 5]] },
    hands: { a: '#FFF3D6', b: '#F8DC93', items: [['pump', '#5FA83C', 'Hand Wash', 'Apple', 96, 14, 0.84, -4], ['pump', '#8A74C2', 'Hand Wash', 'Lavender', 228, 14, 0.84, 4]] },
    home:  { a: '#E1F3F7', b: '#B5DEE8', items: [['spray', '#2F8FAE', 'Air Freshener', 'Ocean Breeze', 96, 14, 0.84, -4], ['spray', '#8A74C2', 'Air Freshener', 'Lavender', 228, 14, 0.84, 4]] }
  };
  function banner(g) {
    var b = BANNER[g] || BANNER.hair, id = 'b' + (++uid);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + b.a + '"/><stop offset="1" stop-color="' + b.b + '"/></linearGradient>' +
      '<radialGradient id="' + id + 's" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="480" height="270" fill="url(#' + id + ')"/>' +
      b.items.map(function (i) { return placed(id, i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7]); }).join('') + '</svg>';
  }


  function wide() {
    var fr = window.AC_DATA.fragrances;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F8A57"/><stop offset="1" stop-color="#1B5239"/></linearGradient>' +
      '<radialGradient id="ws" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="1600" height="640" fill="url(#wg)"/>' +
      '<circle cx="470" cy="330" r="330" fill="#fff" opacity=".07"/><circle cx="470" cy="330" r="210" fill="#fff" opacity=".07"/>' +
      leaf(40, 40, 1.9, 30, '#7CBF93', 0.35) + leaf(820, 430, 1.8, -25, '#7CBF93', 0.3) +
      placed('w', 'bottle', fr[1].color, 'Shampoo', 'Lavender', 90, 150, 1.45, -6) +
      placed('w', 'pump', fr[0].color, 'Body Lotion', 'Strawberry', 290, 110, 1.75, 0) +
      placed('w', 'pump', fr[2].color, 'Hand Wash', 'Apple', 520, 160, 1.45, 4) +
      placed('w', 'spray', fr[3].color, 'Air Freshener', 'Ocean Breeze', 680, 190, 1.3, 7) + '</svg>';
  }

  /* ---------- public: editorial collage (arch, 600 x 760) ---------- */
  function editorial() {
    var id = 'e' + (++uid), fr = window.AC_DATA.fragrances;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DDEFE3"/><stop offset="1" stop-color="#BFE0CB"/></linearGradient>' +
      '<radialGradient id="' + id + 's" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="600" height="760" fill="url(#' + id + ')"/>' +
      leaf(380, 60, 1.5, -30, '#7CBF93', 0.55) + leaf(-40, 420, 1.7, -40, '#8CCBA0', 0.5) +
      motif('lavender', fr[1].color, 120, 150, 0.9, -8, 0.35) +
      placed(id, 'jar', '#4CAF6D', 'Body Butter', 'Apple', 70, 330, 1.45, -6) +
      placed(id, 'pump', fr[1].color, 'Hand Wash', 'Lavender', 270, 190, 1.9, 4) +
      '</svg>';
  }

  window.AC_ART = { slot: slot, photo: photo, packshot: packshot, wide: wide, tile: tile, banner: banner, band: band, hero: function (k) { return (HERO[k] || HERO.care)(); }, editorial: editorial, motif: motif, shade: shade, shape: shape, esc: esc };
})();
