// Hero vector field: particles drift along a slowly changing flow field and leave fading trails.
// A handful of humanities terms sit in the field as labelled points; the pointer bends the flow around it.
(function () {
  var canvas = document.getElementById('field');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var WORDS = ['contingency', 'encounter', 'translation', 'archive', 'commentary',
               'edition', 'philology', 'reading', 'provenance', 'gloss'];
  var W = 0, H = 0, dpr = 1, particles = [], labels = [], t = 0;
  var pointer = { x: -9999, y: -9999, on: false };
  var colours = {};

  function readColours() {
    var s = getComputedStyle(document.documentElement);
    colours.bg = s.getPropertyValue('--bg').trim();
    colours.field = s.getPropertyValue('--field').trim();
    colours.red = s.getPropertyValue('--red').trim();
    colours.muted = s.getPropertyValue('--muted').trim();
    colours.blue = s.getPropertyValue('--blue').trim();
    colours.sand = s.getPropertyValue('--sand').trim();
  }

  function angle(x, y) {
    var u = x / Math.max(W, 1), v = y / Math.max(H, 1);
    var a = Math.sin(u * 5.1 + Math.cos(v * 3.3 + t * 0.15) * 1.7) * 1.4
          + Math.cos(v * 4.7 - u * 2.2 + t * 0.1) * 0.9
          + Math.sin((u + v) * 9.0 - t * 0.2) * 0.25;
    if (pointer.on) {
      var dx = x - pointer.x, dy = y - pointer.y, d2 = dx * dx + dy * dy, r = 170;
      if (d2 < r * r) {
        var k = 1 - Math.sqrt(d2) / r;
        a = a * (1 - k) + (Math.atan2(dy, dx) + Math.PI / 2) * k;
      }
    }
    return a;
  }

  function spawn(p) {
    p.x = Math.random() * W; p.y = Math.random() * H;
    p.life = 60 + Math.random() * 160;
    p.hue = Math.random() < 0.06 ? (Math.random() < 0.5 ? 'blue' : 'sand') : 'ink';
    return p;
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(1800, (W * H) / 650));
    particles = [];
    for (var i = 0; i < n; i++) particles.push(spawn({}));
    // Relative positions, kept to the right of the headline on wide screens and below the buttons on narrow ones.
    var spots = W < 700
      ? [[0.06, 0.915], [0.55, 0.91], [0.24, 0.965], [0.70, 0.962]]
      : [[0.66, 0.16], [0.84, 0.24], [0.60, 0.36], [0.90, 0.42], [0.72, 0.52],
         [0.62, 0.68], [0.86, 0.64], [0.74, 0.82], [0.92, 0.86], [0.58, 0.88]];
    labels = spots.map(function (s, i) {
      return { w: WORDS[i], bx: W * s[0], by: H * s[1], ph: Math.random() * 6.28 };
    });
    readColours();
    clear(1);
    if (reduce) drawStatic();
  }

  function clear(a) {
    ctx.globalAlpha = a; ctx.fillStyle = colours.bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  }

  function strokeColour(p, a) {
    if (p.hue === 'ink') return 'rgba(' + colours.field + ',' + a + ')';
    return colours[p.hue];
  }

  function drawLabels() {
    ctx.font = 'italic 15px "Source Serif 4", Georgia, serif';
    for (var i = 0; i < labels.length; i++) {
      var L = labels[i];
      var x = L.bx + Math.cos(t * 0.3 + L.ph) * 6, y = L.by + Math.sin(t * 0.25 + L.ph) * 5;
      x = Math.min(x, W - ctx.measureText(L.w).width - 22);
      ctx.fillStyle = colours.red;
      ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 6.283); ctx.fill();
      ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = colours.bg;
      ctx.strokeText(L.w, x + 9, y + 5);
      ctx.fillStyle = colours.muted;
      ctx.fillText(L.w, x + 9, y + 5);
    }
  }

  function drawStatic() {
    clear(1);
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 20) for (var gy = 0; gy < H; gy += 20) {
      var x = gx + Math.random() * 10, y = gy + Math.random() * 10;
      ctx.strokeStyle = 'rgba(' + colours.field + ',0.28)';
      ctx.beginPath(); ctx.moveTo(x, y);
      for (var s = 0; s < 4; s++) { var a = angle(x, y); x += Math.cos(a) * 5; y += Math.sin(a) * 5; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    drawLabels();
  }

  // Labels are redrawn each frame on a separate pass so trails do not smear them.
  var trail = document.createElement('canvas'), tctx = trail.getContext('2d');

  function frame() {
    // A hidden or collapsed hero has no size yet; wait for the next resize.
    if (!canvas.width || !canvas.height) { running = false; return; }
    if (trail.width !== canvas.width || trail.height !== canvas.height) {
      trail.width = canvas.width; trail.height = canvas.height;
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tctx.fillStyle = colours.bg; tctx.fillRect(0, 0, W, H);
    }
    t += 0.016;
    tctx.globalAlpha = 0.035; tctx.fillStyle = colours.bg; tctx.fillRect(0, 0, W, H); tctx.globalAlpha = 1;
    tctx.lineWidth = 1;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i], a = angle(p.x, p.y);
      var nx = p.x + Math.cos(a) * 1.3, ny = p.y + Math.sin(a) * 1.3;
      tctx.strokeStyle = strokeColour(p, 0.55);
      tctx.lineWidth = p.hue === 'ink' ? 1 : 1.6;
      tctx.beginPath(); tctx.moveTo(p.x, p.y); tctx.lineTo(nx, ny); tctx.stroke();
      p.x = nx; p.y = ny;
      if (--p.life < 0 || nx < -5 || ny < -5 || nx > W + 5 || ny > H + 5) spawn(p);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(trail, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawLabels();
    if (visible) requestAnimationFrame(frame); else running = false;
  }

  var visible = true, running = false;
  function start() { if (!running && !reduce) { running = true; requestAnimationFrame(frame); } }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas);
  }
  canvas.parentElement.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true;
  });
  canvas.parentElement.addEventListener('pointerleave', function () { pointer.on = false; });

  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { trail.width = 0; resize(); start(); }, 150); });
  document.addEventListener('vh-theme', function () {
    readColours(); trail.width = 0;
    if (reduce) drawStatic();
  });

  resize();
  start();
})();
