// Hero: an intarsia scene. A maple wall and a walnut-and-maple pavement in perspective, built to the
// hero's size, with the rhombicuboctahedron from Pacioli's De divina proportione hovering in front, turning slowly.
(function () {
  var svg = document.getElementById('scene');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MAPLE = '#e9c891', WALNUT = '#7a4a26', STRING = '#3b2412';
  var BEAM = '#1a1aff', RED = '#ff4a24';

  // ---------------------------------------------------------------- geometry

  var A = 1 + Math.SQRT2, verts = [], edges = [];
  [[1, 1, A], [1, A, 1], [A, 1, 1]].forEach(function (b) {
    [1, -1].forEach(function (sx) { [1, -1].forEach(function (sy) { [1, -1].forEach(function (sz) {
      verts.push([b[0] * sx, b[1] * sy, b[2] * sz]);
    }); }); });
  });
  for (var i = 0; i < verts.length; i++) for (var j = i + 1; j < verts.length; j++) {
    var d = Math.hypot(verts[i][0] - verts[j][0], verts[i][1] - verts[j][1], verts[i][2] - verts[j][2]);
    if (Math.abs(d - 2) < 1e-6) edges.push([i, j]);
  }

  // the 26 faces as vertex sets; each face's centroid lies on its outward normal, which gives visibility
  var faces = [];
  (function () {
    var ns = [];
    for (var a = 0; a < 3; a++) [1, -1].forEach(function (s) { var n = [0, 0, 0]; n[a] = s; ns.push(n); });
    [[0, 1], [0, 2], [1, 2]].forEach(function (ab) { [1, -1].forEach(function (s1) { [1, -1].forEach(function (s2) {
      var n = [0, 0, 0]; n[ab[0]] = s1; n[ab[1]] = s2; ns.push(n); }); }); });
    [1, -1].forEach(function (x) { [1, -1].forEach(function (y) { [1, -1].forEach(function (z) { ns.push([x, y, z]); }); }); });
    ns.forEach(function (n) {
      var d = verts.map(function (v) { return n[0] * v[0] + n[1] * v[1] + n[2] * v[2]; });
      var m = Math.max.apply(0, d);
      faces.push(d.map(function (x, q) { return Math.abs(x - m) < 1e-6 ? q : -1; }).filter(function (q) { return q >= 0; }));
    });
  })();
  var edgeFaces = edges.map(function (e) {
    return faces.map(function (f, k) { return (f.indexOf(e[0]) >= 0 && f.indexOf(e[1]) >= 0) ? k : -1; }).filter(function (k) { return k >= 0; });
  });
  var incident = verts.map(function (_, q) {
    return edges.map(function (e, n) { return (e[0] === q || e[1] === q) ? n : -1; }).filter(function (n) { return n >= 0; });
  });

  // the solid stands on a square face and turns about its vertical axis, seen a little from above


  function turn(v, spin, tilt) {
    var x = v[0] * Math.cos(spin) + v[2] * Math.sin(spin), z = -v[0] * Math.sin(spin) + v[2] * Math.cos(spin), y = v[1];
    return [x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
  }

  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (q) { return parseInt(a.substr(q, 2), 16); });
    var pb = [1, 3, 5].map(function (q) { return parseInt(b.substr(q, 2), 16); });
    return 'rgb(' + pa.map(function (x, q) { return Math.round(x + (pb[q] - x) * t); }).join(',') + ')';
  }

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // ---------------------------------------------------------------- scene

  var W, H, layout, polyG, beams = [], arrows = [], trails = [];

  // points in motion: each runs along one edge's displacement, then takes another edge at the vertex
  var travellers = [];
  for (var tv = 0; tv < 5; tv++) {
    var e0 = Math.floor(Math.random() * edges.length);
    travellers.push({ e: e0, from: edges[e0][0], t: Math.random(), speed: 0.35 + Math.random() * 0.25,
                      state: 'on', fade: 1, x: 0, y: 0, vx: 0, vy: 0, life: 0, wait: 0 });
  }
  function step(tr, dt) {
    tr.t += tr.speed * dt;
    while (tr.t >= 1) {
      var e = edges[tr.e], at = e[0] === tr.from ? e[1] : e[0];
      var next = incident[at].filter(function (n) { return n !== tr.e; });
      tr.e = next[Math.floor(Math.random() * next.length)];
      tr.from = at; tr.t -= 1;
    }
  }

  function build() {
    var r = svg.getBoundingClientRect();
    W = Math.max(320, r.width); H = Math.max(320, r.height);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    // put the solid in the room the copy leaves on the right; with too little room, hang it above the copy
    var hero = svg.parentElement, copy = hero.querySelector('.hero-copy'), wrap = hero.querySelector('.wrap');
    hero.classList.remove('is-stacked');
    wrap.style.paddingTop = '';
    hero.style.minHeight = '';
    var right = copy ? copy.getBoundingClientRect().right - r.left : W * 0.5;
    var room = W - right - 24;
    var stacked = room < Math.min(300, H * 0.42);
    if (stacked) {
      hero.classList.add('is-stacked');
      var ps = Math.min(W * 0.5, 220);
      wrap.style.paddingTop = Math.round(ps * 1.02 + 24) + 'px';
      // the horizon goes just below the copy, with a band of pavement beneath it
      var copyBottom = copy.getBoundingClientRect().bottom - hero.getBoundingClientRect().top;
      var horY = Math.round(copyBottom + 40);
      hero.style.minHeight = (horY + 170) + 'px';
      r = svg.getBoundingClientRect(); H = Math.max(320, r.height);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      layout = { hor: horY, vx: W * 0.5, px: W * 0.5, py: 8, ps: ps, tile: W * 0.16 };
    } else {
      // the horizon must clear the copy; grow the hero if it cannot
      var cb = copy.getBoundingClientRect().bottom - hero.getBoundingClientRect().top;
      var horY = Math.max(H * 0.74, cb + 48);
      if (horY > H - 150) {
        hero.style.minHeight = Math.round(horY + 150) + 'px';
        r = svg.getBoundingClientRect(); H = Math.max(320, r.height);
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      }
      var size = Math.min(horY * 0.66, room * 0.7);
      var cx = right + 24 + room / 2;
      layout = { hor: horY, vx: cx, px: cx, py: Math.max(12, horY * 0.07), ps: size, tile: W * 0.075 };
    }
    // the wood is drawn once into its own layer behind the animation, so its filters never run again
    var ground = hero.querySelector('#ground');
    if (!ground) {
      ground = document.createElementNS(NS, 'svg');
      ground.id = 'ground'; ground.setAttribute('aria-hidden', 'true'); ground.setAttribute('preserveAspectRatio', 'none');
      hero.insertBefore(ground, svg);
    }
    ground.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (ground.firstChild) ground.removeChild(ground.firstChild);
    var defs = el('defs', {}, ground);
    [['grainH', '0.0018 0.16', 3], ['grainV', '0.16 0.0018', 8]].forEach(function (g) {
      var f = el('filter', { id: g[0], x: 0, y: 0, width: '100%', height: '100%' }, defs);
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: g[1], numOctaves: 4, seed: g[2] }, f);
      el('feColorMatrix', { values: '0 0 0 0 0.24  0 0 0 0 0.13  0 0 0 0 0.05  0 0 0 0.38 -0.10' }, f);
      el('feComposite', { in2: 'SourceGraphic', operator: 'in' }, f);
    });
    var soft = el('filter', { id: 'soft' }, defs);
    el('feGaussianBlur', { stdDeviation: 6 }, soft);

    // wall, down to where it meets the floor
    var hor = layout.hor;
    el('rect', { width: W, height: hor, fill: MAPLE }, ground);
    el('rect', { width: W, height: hor, fill: MAPLE, filter: 'url(#grainH)', opacity: 0.45 }, ground);

    // a finite pavement of large tiles, laid in perspective from an eye above the floor's far edge;
    // seven rows run from the front of the picture back to the wall (distance-point construction)
    var ROWS = 7, t = layout.tile, vx = layout.vx;
    var eye = hor - 0.9 * (H - hor);                 // eye level, above the line where floor meets wall
    var dist = 0.9 * ROWS * t;                       // chosen so row ROWS lands exactly on that line
    function ty(k) { return eye + (H - eye) * dist / (dist + k * t); }
    function xat(xb, y) { return vx + (xb - vx) * (y - eye) / (H - eye); }
    var q = (hor - eye) / (H - eye);                 // scale at the back edge: front columns needed to cover it
    var n0 = Math.floor((vx - vx / q - vx) / t) - 1, n1 = Math.ceil((W - vx) / q / t) + 1;
    var dark = [], light = [];
    for (var k = 0; k < ROWS; k++) {
      var ya = ty(k + 1), yb = ty(k);
      for (var c = n0; c < n1; c++) {
        var x0 = vx + c * t, x1 = x0 + t;
        var pts = [xat(x0, ya), ya, xat(x1, ya), ya, xat(x1, yb), yb, xat(x0, yb), yb].map(function (n) { return n.toFixed(1); });
        ((c + k) % 2 === 0 ? dark : light).push(pts[0] + ',' + pts[1] + ' ' + pts[2] + ',' + pts[3] + ' ' + pts[4] + ',' + pts[5] + ' ' + pts[6] + ',' + pts[7]);
      }
    }
    [[dark, WALNUT, 'grainV'], [light, MAPLE, 'grainH']].forEach(function (set) {
      var g1 = el('g', { fill: set[1] }, ground), g2 = el('g', { fill: set[1], filter: 'url(#' + set[2] + ')', opacity: 0.9 }, ground);
      set[0].forEach(function (s) { el('polygon', { points: s }, g1); el('polygon', { points: s }, g2); });
    });
    el('path', { d: 'M0,' + hor.toFixed(1) + ' H' + W, stroke: STRING, 'stroke-width': 1, opacity: 0.45 }, ground);
    el('ellipse', { cx: layout.px, cy: ty(ROWS * 0.45), rx: layout.ps * 0.34, ry: layout.ps * 0.05,
                    fill: STRING, opacity: 0.4, filter: 'url(#soft)' }, ground);

    polyG = el('g', {}, svg);
    beams = edges.map(function () { return el('path', { 'stroke-linecap': 'round' }, polyG); });
    trails = travellers.map(function () {
      return el('path', { fill: 'none', stroke: '#fffaf0', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, polyG);
    });
    arrows = travellers.map(function () {
      return el('circle', { fill: '#fffaf0' }, polyG);
    });
    draw(spin, tilt);
  }

  var DIST = 11;
  function draw(spin, tilt) {
    var R = verts.map(function (v) { return turn(v, spin, tilt); });
    var P = R.map(function (v) { var f = DIST / (DIST + v[2]); return [v[0] * f, -v[1] * f]; });
    // fit to the box once, at rest, so the size does not pulse as it turns
    if (!layout.sc) {
      var xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
      var w = Math.max.apply(0, xs) - Math.min.apply(0, xs), h = Math.max.apply(0, ys) - Math.min.apply(0, ys);
      layout.sc = Math.min(layout.ps * 0.84 / w, layout.ps * 0.85 / h);
      layout.oy = layout.py + layout.ps * 0.52 - (Math.min.apply(0, ys) + Math.max.apply(0, ys)) / 2 * layout.sc;
    }
    var sc = layout.sc, ox = layout.px, oy = layout.oy;
    P = P.map(function (p) { return [p[0] * sc + ox, p[1] * sc + oy]; });
    var u = layout.ps / 100;
    var front = faces.map(function (f) {
      var c = [0, 0, 0];
      f.forEach(function (q) { c[0] += R[q][0]; c[1] += R[q][1]; c[2] += R[q][2]; });
      c = c.map(function (x) { return x / f.length; });
      return c[0] * c[0] + c[1] * c[1] + c[2] * (c[2] + DIST) < 0;
    });
    var seen = edgeFaces.map(function (fs) { return fs.some(function (k) { return front[k]; }); });
    var order = edges.map(function (e, n) { return [n, (R[e[0]][2] + R[e[1]][2]) / 2]; })
                     .sort(function (a, b) { return b[1] - a[1]; });
    var back = mix(BEAM, MAPLE, 0.55);
    order.forEach(function (o) {
      var e = edges[o[0]], b = beams[o[0]];
      b.setAttribute('d', 'M' + P[e[0]][0].toFixed(1) + ',' + P[e[0]][1].toFixed(1) + ' L' + P[e[1]][0].toFixed(1) + ',' + P[e[1]][1].toFixed(1));
      b.setAttribute('stroke', seen[o[0]] ? BEAM : back);
      b.setAttribute('stroke-width', ((seen[o[0]] ? 0.85 : 0.45) * u).toFixed(2));
      polyG.appendChild(b);
    });
    // a small point of light carried along each edge's displacement; thrown off ones fall in screen space
    travellers.forEach(function (tr, k) {
      var ar = arrows[k], op = 0;
      if (tr.state === 'on') {
        var e = edges[tr.e], a = tr.from, b2 = e[0] === a ? e[1] : e[0];
        tr.x = P[a][0] + (P[b2][0] - P[a][0]) * tr.t;
        tr.y = P[a][1] + (P[b2][1] - P[a][1]) * tr.t;
        op = (seen[tr.e] ? 0.55 : 0.2) * tr.fade;
      } else if (tr.state === 'off') {
        op = 0.95 * tr.life;                             // brighter once loose
      }
      var tl = trails[k];
      if (tr.state === 'off' && tr.trail && tr.trail.length > 1) {
        tl.setAttribute('d', 'M' + tr.trail.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' L'));
        tl.setAttribute('stroke-width', Math.max(1.2, 0.8 * u).toFixed(2));
        tl.setAttribute('opacity', (0.4 * tr.life).toFixed(3));
      } else {
        tl.setAttribute('d', '');
      }
      polyG.appendChild(tl);
      ar.setAttribute('cx', tr.x.toFixed(1));
      ar.setAttribute('cy', tr.y.toFixed(1));
      ar.setAttribute('r', Math.max(1.8, 1.1 * u).toFixed(2));
      ar.setAttribute('opacity', op.toFixed(3));
      polyG.appendChild(ar);
    });

  }

  // spin: a slow turn of its own, which the reader can take over by dragging; a flick carries on and slows
  var spin = 0.401, tilt = 0.367, tiltUser = 0, vel = 0, AUTO = 0.12;   // radians per second
  var dragging = false, lastX = 0, lastY = 0, lastT = 0, prev = null, visible = true, running = false;
  function frame(ts) {
    var dt = prev === null ? 0 : Math.min(0.05, (ts - prev) / 1000);
    prev = ts;
    if (!reduce) travellers.forEach(function (tr) { if (tr.state === 'on') step(tr, dt); });
    if (!dragging) {
      vel *= Math.pow(0.12, dt);                       // the flick dies away over a second or two
      spin += (reduce ? 0 : AUTO) * dt + vel * dt;
      tiltUser *= Math.pow(0.25, dt);                  // and settles back to its resting tilt
    }
    var lastSpin = frame.spin === undefined ? spin : frame.spin;
    frame.spin = spin;
    draw(spin, tilt + tiltUser + (reduce ? 0 : Math.sin(ts * 0.0004) * 0.03));
    shed(dt, dt > 0 ? Math.abs(spin - lastSpin) / dt : 0);
    var moving = !reduce || dragging || Math.abs(vel) > 0.002 || Math.abs(tiltUser) > 0.002 ||
                 travellers.some(function (tr) { return tr.state !== 'on' || tr.fade < 1; });
    if (visible && moving) requestAnimationFrame(frame); else { running = false; prev = null; }
  }
  function run() { if (!running) { running = true; requestAnimationFrame(frame); } }

  // spun hard, the points lose their hold: each keeps the velocity it had, falls and fades (NaN, off the solid);
  // once the solid turns slowly again they return to it one by one
  var SHED = 2.4, GRAV = 260, LAUNCH = 0.22, VMAX = 170;   // let-go speed (rad/s); gravity (px/s^2); launch scale and cap (px/s)
  function shed(dt, omega) {
    if (!dt) return;
    travellers.forEach(function (tr) {
      if (tr.state === 'on') {
        if (tr.lx !== undefined) { tr.vx = (tr.x - tr.lx) / dt; tr.vy = (tr.y - tr.ly) / dt; }
        tr.lx = tr.x; tr.ly = tr.y;
        tr.fade = Math.min(1, tr.fade + dt * 1.5);
        if (omega > SHED && Math.random() < (omega - SHED) * 0.9 * dt) {
          // leave along the line it was moving, slowed and capped so gravity can bend the path into an arc
          var vx = tr.vx * LAUNCH, vy = tr.vy * LAUNCH, sp = Math.hypot(vx, vy);
          if (sp > VMAX) { vx *= VMAX / sp; vy *= VMAX / sp; }
          tr.vx = vx; tr.vy = vy - 60;                 // a little lift, so the arc rises before it falls
          tr.state = 'off'; tr.life = 1; tr.trail = [[tr.x, tr.y]];
        }
      } else if (tr.state === 'off') {
        tr.vy += GRAV * dt;
        tr.x += tr.vx * dt; tr.y += tr.vy * dt;
        tr.trail.push([tr.x, tr.y]);
        if (tr.trail.length > 40) tr.trail.shift();
        tr.life -= dt * 0.5;
        if (tr.life <= 0) { tr.state = 'wait'; tr.wait = 1 + Math.random() * 2; }
      } else if (omega < 0.6) {
        tr.wait -= dt;
        if (tr.wait <= 0) {
          tr.e = Math.floor(Math.random() * edges.length); tr.from = edges[tr.e][0]; tr.t = Math.random();
          tr.state = 'on'; tr.fade = 0; tr.lx = undefined;
        }
      }
    });
  }

  // drag anywhere on the scene outside the copy; vertical drags still scroll the page on touch screens
  svg.style.cursor = 'grab';
  svg.style.touchAction = 'pan-y';
  svg.addEventListener('pointerdown', function (e) {
    dragging = true; vel = 0; lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    svg.style.cursor = 'grabbing'; run();
  });
  svg.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var now = performance.now(), dx = e.clientX - lastX, dy = e.clientY - lastY;
    var k = 3.2 / Math.max(160, layout.ps);            // a drag across the solid turns it about half a turn
    spin += dx * k;
    tiltUser = Math.max(-0.5, Math.min(0.5, tiltUser + dy * k * 0.6));
    var dtm = Math.max(1, now - lastT);
    vel = 0.8 * vel + 0.2 * (dx * k * 1000 / dtm);
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });
  function release(e) {
    if (!dragging) return;
    dragging = false; svg.style.cursor = 'grab';
    if (performance.now() - lastT > 80) vel = 0;       // held still before letting go: no flick
    try { svg.releasePointerCapture(e.pointerId); } catch (err) {}
    run();
  }
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', release);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) run(); }).observe(svg);
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); }, 150); });
  build();
  run();
  // the copy reflows when the web fonts arrive; measure again then
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
})();
