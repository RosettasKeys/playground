/* ═══════════════════════════════════════════════════════════════════════
   atlas.js — The Long Field
   ───────────────────────────────────────────────────────────────────────
   One galaxy scene, and any number of "system" scenes (orreries), sharing
   one camera and one input model.

     GALAXY   world units are light-years. The Sun sits at (0, −26 700);
              the Galactic Centre is the origin. Markers are projected
              from catalogue (l, b, distance) at draw time.

     SYSTEM   world units are astronomical units, passed through a radial
              compression so that a system's innermost and outermost
              bodies can share a screen. The compression is a display
              choice, is labelled as one, and can be switched off. The
              orbit solver takes the central body's GM, not just the
              Sun's — see SYSTEMS below — so the same code draws the
              Solar System, TRAPPIST-1, or any system added the same way.

   The painted galaxy is procedural — a seeded star field, not a
   photograph. Marker positions are catalogue data. Those are different
   kinds of thing and the code keeps them apart: nothing in the generator
   ever writes to a POI, and no POI is ever placed by eye.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     CONSTANTS & SMALL HELPERS
  ═══════════════════════════════════════════════════════════ */

  var R_SUN_LY = 26700;          // Sun → Galactic Centre, light-years
  var DEG = Math.PI / 180;
  var J2000 = 2451545.0;
  var GM_SUN = 0.0002959122082855911;   // au³/day²

  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var REDUCED_MOTION = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Time slider → days per real second. Cubic so there is fine control
     near zero. One function, so the slider and the per-system defaults
     can never disagree about what a given position means. */
  function rateFromSlider(v) {
    return Math.sign(v) * Math.pow(Math.abs(v), 3) * 0.9;
  }
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* Deterministic PRNG — the same galaxy every visit. A field that
     reshuffled itself on reload would make the map useless as a reference. */
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function fmtNum(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + ' million';
    if (n >= 1000) return Math.round(n).toLocaleString('en-US');
    if (n >= 10) return n.toFixed(0);
    if (n >= 1) return n.toFixed(1);
    return n.toFixed(2);
  }

  /* ═══════════════════════════════════════════════════════════
     PROJECTION — catalogue coordinates onto the galactic plane
  ═══════════════════════════════════════════════════════════ */

  function projectGalactic(poi) {
    var d = poi.dist || 0;
    var cb = Math.cos((poi.b || 0) * DEG);
    var l = (poi.l || 0) * DEG;
    return { x: -d * cb * Math.sin(l), y: -R_SUN_LY + d * cb * Math.cos(l) };
  }

  /* ═══════════════════════════════════════════════════════════
     ORBITAL MECHANICS
  ═══════════════════════════════════════════════════════════ */

  function solveKepler(M, e) {
    var E = e < 0.8 ? M : Math.PI, d, k;
    for (k = 0; k < 80; k++) {
      d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= d;
      if (Math.abs(d) < 1e-11) break;
    }
    return E;
  }

  function solveHyperbolic(M, e) {
    var H = Math.log(2 * Math.abs(M) / e + 1.8) * (M < 0 ? -1 : 1), d, k;
    for (k = 0; k < 100; k++) {
      d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
      H -= d;
      if (Math.abs(d) < 1e-11) break;
    }
    return H;
  }

  /* Orbital-plane coordinates → ecliptic x,y (the z component is dropped;
     this map is a plan view of the ecliptic). */
  function orbitToEcliptic(xo, yo, i, om, w) {
    var ci = Math.cos(i), si = Math.sin(i);
    var co = Math.cos(om), so = Math.sin(om);
    var cw = Math.cos(w), sw = Math.sin(w);
    return {
      x: (cw * co - sw * so * ci) * xo + (-sw * co - cw * so * ci) * yo,
      y: (cw * so + sw * co * ci) * xo + (-sw * so + cw * co * ci) * yo,
      z: (sw * si) * xo + (cw * si) * yo
    };
  }

  /* Major planets, JPL approximate-element form. `days` is days from J2000. */
  function planetPosition(key, days) {
    var E = PLANET_ELEMENTS[key];
    var T = days / 36525.0;
    var a = E.el[0] + E.rt[0] * T;
    var e = E.el[1] + E.rt[1] * T;
    var inc = (E.el[2] + E.rt[2] * T) * DEG;
    var L = (E.el[3] + E.rt[3] * T) * DEG;
    var peri = (E.el[4] + E.rt[4] * T) * DEG;
    var om = (E.el[5] + E.rt[5] * T) * DEG;
    var w = peri - om;
    var M = L - peri;
    M = M - 2 * Math.PI * Math.floor((M + Math.PI) / (2 * Math.PI));
    var Ea = solveKepler(M, e);
    var xo = a * (Math.cos(Ea) - e);
    var yo = a * Math.sqrt(1 - e * e) * Math.sin(Ea);
    var p = orbitToEcliptic(xo, yo, inc, om, w);
    p.a = a; p.e = e; p.inc = inc; p.om = om; p.w = w;
    return p;
  }

  /* Everything else: osculating elements held fixed. `GM` is the central
     body's gravitational parameter in au³/day² — defaults to the Sun's, so
     every existing call site that doesn't pass one behaves exactly as
     before. TRAPPIST-1's planets pass its (much smaller) stellar GM. */
  function bodyPosition(poi, days, GM) {
    if (poi.elKey) return planetPosition(poi.elKey, days);
    GM = GM || GM_SUN;

    var inc = (poi.i || 0) * DEG, om = (poi.om || 0) * DEG, w = (poi.w || 0) * DEG;

    if (poi.hyperbolic) {
      var ah = poi.q / (poi.e - 1);
      var n = Math.sqrt(GM / (ah * ah * ah));
      var dt = days - (poi.periJD - J2000);
      var M = n * dt;
      var H = solveHyperbolic(M, poi.e);
      var xo = ah * (poi.e - Math.cosh(H));
      var yo = ah * Math.sqrt(poi.e * poi.e - 1) * Math.sinh(H);
      var p = orbitToEcliptic(xo, yo, inc, om, w);
      p.a = ah; p.e = poi.e; p.inc = inc; p.om = om; p.w = w; p.hyp = true;
      return p;
    }

    var a = poi.a, e = poi.e || 0;
    var n2 = (180 / Math.PI) * Math.sqrt(GM / (a * a * a));  // deg/day, Kepler's third law
    var M2 = ((poi.M0 || 0) + n2 * days) * DEG;
    M2 = M2 - 2 * Math.PI * Math.floor((M2 + Math.PI) / (2 * Math.PI));
    var E2 = solveKepler(M2, e);
    var xo2 = a * (Math.cos(E2) - e);
    var yo2 = a * Math.sqrt(1 - e * e) * Math.sin(E2);
    var q = orbitToEcliptic(xo2, yo2, inc, om, w);
    q.a = a; q.e = e; q.inc = inc; q.om = om; q.w = w;
    return q;
  }

  /* ═══════════════════════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════════════════════ */

  var stage = document.getElementById('stage');
  var cvs = document.getElementById('sky');
  var ctx = cvs.getContext('2d');

  var W = 0, H = 0, DPR = 1;

  var S = {
    scene: 'galaxy',                 // 'galaxy' | any key in SYSTEMS ('solar', 'trappist1', ...)
    cam: { x: 0, y: 0, s: 1 },       // world → screen: pixels per world unit
    target: null,                    // active flyTo animation
    hover: null,
    selected: null,
    labelMode: 'key',                // 'all' | 'key' | 'off'
    solarScale: 'compressed',        // 'compressed' | 'true'
    filters: {},                     // category id → bool
    days: 0,                         // days from J2000
    rate: 4,                         // days per real second
    lastT: 0,
    ready: false,

    /* Mission state. The atlas does not run the missions — it is told
       what to aim at and what has been logged, and draws accordingly. */
    mission: null,                   // { scene, id, p } | null
    logged: {},                      // 'scene|id' → true
    burst: null                      // { p, t } capture animation
  };

  /* Registry of "system" scenes — anything that isn't the galaxy. The
     galaxy view is unique (procedural field, no central body); every
     orrery-style scene works the same way regardless of which star it
     orbits, so adding one is adding an entry here, not new code. */
  var SYSTEMS = {
    solar: {
      poi: SOLAR_POI,
      GM: GM_SUN,
      titleHTML: 'The <em>Solar System</em>',
      searchLabel: 'solar system',
      enterLabel: 'the Solar System',
      centerLabel: 'the Sun',
      veilIn: 'one star, two-thirds of the way out —',
      /* Time slider position on arrival: ≈4 days a second, so Earth takes
         about a minute and a half to go round. */
      timeDefault: 1.7,
      limits: { minSpan: 0.05, maxSpan: 130, homeCompressed: 9.6, homeTrue: 96 }
    },
    trappist1: {
      poi: TRAPPIST1_POI,
      GM: GM_SUN * 0.0898,        // the star's mass relative to the Sun's
      titleHTML: '<em>TRAPPIST-1</em>',
      searchLabel: 'TRAPPIST-1',
      enterLabel: 'the TRAPPIST-1 system',
      centerLabel: 'the star',
      veilIn: 'forty light-years out, to a star seven worlds crowd around —',
      /* The whole system fits inside 18.77 days, so the Sun's clock turns
         it into a blur — the innermost planet would lap the star three
         times a second. About 0.6 days a second instead: the outermost
         takes half a minute, the innermost a couple of seconds, and the
         resonance chain is actually watchable. */
      timeDefault: 0.9,
      limits: { minSpan: 0.02, maxSpan: 6, homeCompressed: 1.2, homeTrue: 0.18 }
    }
  };

  /* Camera limits per scene — kept as its own object since that's what
     span()/setSpan()/zoomAt() already key off of. */
  var LIMITS = { galaxy: { minSpan: 900, maxSpan: 600000, home: 132000 } };
  Object.keys(SYSTEMS).forEach(function (key) {
    var lim = SYSTEMS[key].limits;
    LIMITS[key] = { minSpan: lim.minSpan, maxSpan: lim.maxSpan, home: lim.homeCompressed };
  });

  function curSys() { return SYSTEMS[S.scene]; }
  function curGM() { return S.scene !== 'galaxy' && SYSTEMS[S.scene] ? SYSTEMS[S.scene].GM : GM_SUN; }

  function span() { return W / DPR / S.cam.s; }            // world units across viewport
  function setSpan(v) { S.cam.s = (W / DPR) / v; }

  function w2s(x, y) {
    return {
      x: (W / DPR) / 2 + (x - S.cam.x) * S.cam.s,
      y: (H / DPR) / 2 - (y - S.cam.y) * S.cam.s
    };
  }
  function s2w(sx, sy) {
    return {
      x: S.cam.x + (sx - (W / DPR) / 2) / S.cam.s,
      y: S.cam.y - (sy - (H / DPR) / 2) / S.cam.s
    };
  }

  /* ═══════════════════════════════════════════════════════════
     SOLAR RADIAL COMPRESSION

     compressed:  r' = r^0.34   — Mercury and the Oort Cloud on one screen
     true:        r' = r        — honest, and mostly empty
  ═══════════════════════════════════════════════════════════ */

  function compress(r) {
    if (S.solarScale === 'true') return r;
    return Math.pow(Math.max(r, 1e-6), 0.34);
  }
  function solarPoint(p) {
    var r = Math.hypot(p.x, p.y);
    if (r < 1e-9) return { x: 0, y: 0 };
    var k = compress(r) / r;
    return { x: p.x * k, y: p.y * k };
  }

  /* ═══════════════════════════════════════════════════════════
     GALAXY GENERATION

     Four logarithmic arms wound so that the Sun falls in the gap between
     the Sagittarius–Carina arm (inward) and the Perseus arm (outward),
     which is where the Sun actually is. Arm phase offsets are solved for
     that condition rather than chosen by eye:

       θ(r) = θ₀ + cot(pitch)·ln(r/r₀)
  ═══════════════════════════════════════════════════════════ */

  var ARMS = [
    { th0: 306.7 * DEG, k: 2.90, name: 'Sagittarius-Carina' },
    { th0: 236.7 * DEG, k: 2.90, name: 'Perseus' },
    { th0: 126.7 * DEG, k: 2.82, name: 'Scutum-Centaurus' },
    { th0: 56.7 * DEG, k: 2.82, name: 'Norma' }
  ];
  var ARM_R0 = 3000;

  var galaxyBmp = null;       // offscreen canvas
  var GAL_EXT = 78000;        // bitmap covers ±GAL_EXT light-years
  var liveStars = null;       // typed arrays, drawn every frame for crispness

  function armTheta(arm, r) { return arm.th0 + arm.k * Math.log(r / ARM_R0); }

  function buildGalaxy() {
    var px = (window.devicePixelRatio > 1.5 || W > 2200) ? 2048 : 1536;
    var c = document.createElement('canvas');
    c.width = c.height = px;
    var g = c.getContext('2d');
    var rnd = mulberry(0x5EED17);
    var mid = px / 2;
    var sc = mid / GAL_EXT;                 // world ly → bitmap px

    var toPx = function (x, y) { return [mid + x * sc, mid - y * sc]; };

    /* ── 1. Diffuse light: halo, disc, bulge, bar ─────────────── */
    g.globalCompositeOperation = 'lighter';

    var halo = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
    halo.addColorStop(0, 'rgba(90,110,170,0.30)');
    halo.addColorStop(0.22, 'rgba(60,80,140,0.15)');
    halo.addColorStop(0.55, 'rgba(30,45,90,0.05)');
    halo.addColorStop(1, 'rgba(10,16,40,0)');
    g.fillStyle = halo; g.fillRect(0, 0, px, px);

    var disc = g.createRadialGradient(mid, mid, 0, mid, mid, 46000 * sc);
    disc.addColorStop(0, 'rgba(190,175,140,0.34)');
    disc.addColorStop(0.30, 'rgba(120,135,175,0.20)');
    disc.addColorStop(0.70, 'rgba(60,80,130,0.07)');
    disc.addColorStop(1, 'rgba(20,30,60,0)');
    g.fillStyle = disc; g.fillRect(0, 0, px, px);

    /* Bar and bulge — an ellipse inclined 27° to the Sun–Centre line. */
    var barAng = (90 - 27) * DEG;
    g.save();
    g.translate(mid, mid); g.rotate(-barAng);
    var bar = g.createRadialGradient(0, 0, 0, 0, 0, 16000 * sc);
    bar.addColorStop(0, 'rgba(255,228,178,0.72)');
    bar.addColorStop(0.42, 'rgba(248,204,144,0.40)');
    bar.addColorStop(0.78, 'rgba(205,152,100,0.13)');
    bar.addColorStop(1, 'rgba(140,100,70,0)');
    g.scale(1, 0.34);
    g.fillStyle = bar;
    g.beginPath(); g.arc(0, 0, 16000 * sc, 0, 6.2832); g.fill();
    g.restore();

    var bulge = g.createRadialGradient(mid, mid, 0, mid, mid, 5200 * sc);
    bulge.addColorStop(0, 'rgba(255,238,205,0.85)');
    bulge.addColorStop(0.35, 'rgba(255,215,160,0.42)');
    bulge.addColorStop(1, 'rgba(210,160,110,0)');
    g.fillStyle = bulge; g.fillRect(0, 0, px, px);

    /* ── 2. Arm glow ──────────────────────────────────────────── */
    for (var ai = 0; ai < ARMS.length; ai++) {
      var arm = ARMS[ai];
      for (var r = 3400; r < 47000; r += 520) {
        var th = armTheta(arm, r);
        var p = toPx(r * Math.cos(th), r * Math.sin(th));
        var w = (1300 + r * 0.075) * sc;
        var gl = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], w);
        var fade = clamp(1 - (r - 30000) / 22000, 0.12, 1);
        gl.addColorStop(0, 'rgba(150,180,240,' + (0.10 * fade) + ')');
        gl.addColorStop(1, 'rgba(60,90,170,0)');
        g.fillStyle = gl;
        g.beginPath(); g.arc(p[0], p[1], w, 0, 6.2832); g.fill();
      }
    }

    /* ── 3. Stars ─────────────────────────────────────────────── */
    var STAR_N = px >= 2048 ? 78000 : 46000;
    var live = { x: new Float32Array(3400), y: new Float32Array(3400), s: new Float32Array(3400), c: new Uint8Array(3400) };
    var liveN = 0;

    var placeStar = function (x, y, size, col, alpha) {
      var p = toPx(x, y);
      g.fillStyle = col;
      g.globalAlpha = alpha;
      if (size <= 1.1) g.fillRect(p[0], p[1], size, size);
      else { g.beginPath(); g.arc(p[0], p[1], size * 0.5, 0, 6.2832); g.fill(); }
    };

    for (var i = 0; i < STAR_N; i++) {
      var u = rnd(), x, y, col, size = 0.85, alpha = 0.55 + rnd() * 0.45;

      if (u < 0.50) {
        /* Arm population — young, blue, tightly bound to the arm ridge. */
        var A = ARMS[(rnd() * ARMS.length) | 0];
        var rr = 3200 + Math.pow(rnd(), 0.62) * 44000;
        var t = armTheta(A, rr);
        var sig = 900 + rr * 0.058;
        var off = (rnd() + rnd() + rnd() - 1.5) * sig * 1.5;
        var ang = t + off / rr;
        var rj = rr + (rnd() - 0.5) * sig * 1.1;
        x = rj * Math.cos(ang); y = rj * Math.sin(ang);
        var hot = rnd();
        col = hot > 0.965 ? 'rgb(185,215,255)' : hot > 0.72 ? 'rgb(205,220,250)' : 'rgb(226,231,244)';
        if (hot > 0.985) size = 1.5;
        alpha *= clamp(1.05 - Math.max(0, rj - 27000) / 24000, 0.16, 1);

      } else if (u < 0.70) {
        /* Bar and bulge — old, warm, in a boxy ellipse. */
        var br = Math.pow(rnd(), 1.55) * 15500;
        var ba = rnd() * 6.2832;
        var bx = br * Math.cos(ba), by = br * Math.sin(ba) * 0.32;
        x = bx * Math.cos(barAng) - by * Math.sin(barAng);
        y = bx * Math.sin(barAng) + by * Math.cos(barAng);
        col = rnd() > 0.55 ? 'rgb(255,226,178)' : 'rgb(255,206,150)';
        alpha *= 0.9;

      } else if (u < 0.94) {
        /* Smooth disc between the arms. */
        var dr = -8600 * Math.log(1 - rnd() * 0.9935);
        if (dr > 52000) dr = 52000 * rnd();
        var da = rnd() * 6.2832;
        x = dr * Math.cos(da); y = dr * Math.sin(da);
        col = rnd() > 0.5 ? 'rgb(214,220,238)' : 'rgb(236,224,206)';
        alpha *= 0.62;

      } else {
        /* Halo — sparse, old, far out of the plane. */
        var hr = 8000 + Math.pow(rnd(), 0.60) * 54000;
        var ha = rnd() * 6.2832;
        x = hr * Math.cos(ha); y = hr * Math.sin(ha);
        col = 'rgb(200,198,214)';
        alpha *= 0.22;
      }

      placeStar(x, y, size, col, alpha);

      /* Promote a thin slice into the live layer, which is redrawn in world
         coordinates every frame and so stays sharp at any zoom. */
      if (liveN < live.x.length && rnd() < 0.045) {
        live.x[liveN] = x; live.y[liveN] = y;
        live.s[liveN] = 0.6 + rnd() * 1.5;
        live.c[liveN] = u < 0.50 ? 0 : u < 0.70 ? 1 : 2;
        liveN++;
      }
    }
    g.globalAlpha = 1;
    live.n = liveN;
    liveStars = live;

    /* ── 4. H II regions — the pink knots that mark the arms ──── */
    for (var hj = 0; hj < 260; hj++) {
      var HA = ARMS[(rnd() * ARMS.length) | 0];
      var hrr = 4000 + Math.pow(rnd(), 0.75) * 38000;
      var hth = armTheta(HA, hrr) + (rnd() - 0.5) * 0.055;
      var hp = toPx(hrr * Math.cos(hth), hrr * Math.sin(hth));
      var hw = (500 + rnd() * 1500) * sc;
      var hg = g.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], hw);
      hg.addColorStop(0, 'rgba(255,170,220,' + (0.16 + rnd() * 0.22) + ')');
      hg.addColorStop(0.45, 'rgba(220,120,190,0.09)');
      hg.addColorStop(1, 'rgba(150,60,140,0)');
      g.fillStyle = hg;
      g.beginPath(); g.arc(hp[0], hp[1], hw, 0, 6.2832); g.fill();
    }

    /* ── 5. Dust lanes — drawn last, over everything, on the inner
           edge of each arm where they actually sit. ───────────── */
    g.globalCompositeOperation = 'source-over';
    for (var dj = 0; dj < 7000; dj++) {
      var DA = ARMS[(rnd() * ARMS.length) | 0];
      var drr = 3400 + Math.pow(rnd(), 0.7) * 40000;
      var dth = armTheta(DA, drr) - 0.045 - rnd() * 0.070;   // inner edge
      var dsig = (700 + drr * 0.030);
      var dx = drr * Math.cos(dth) + (rnd() - 0.5) * dsig;
      var dy = drr * Math.sin(dth) + (rnd() - 0.5) * dsig;
      var dp = toPx(dx, dy);
      var dw = (280 + rnd() * 1100) * sc;
      var dg = g.createRadialGradient(dp[0], dp[1], 0, dp[0], dp[1], dw);
      var da2 = 0.07 + rnd() * 0.20;
      dg.addColorStop(0, 'rgba(14,9,14,' + da2 + ')');
      dg.addColorStop(1, 'rgba(14,9,14,0)');
      g.fillStyle = dg;
      g.beginPath(); g.arc(dp[0], dp[1], dw, 0, 6.2832); g.fill();
    }

    galaxyBmp = c;
  }

  /* ═══════════════════════════════════════════════════════════
     CATEGORY REGISTRY
  ═══════════════════════════════════════════════════════════ */

  var CATS = {
    core: { label: 'Galactic core', color: '#ff9a5c', scene: 'galaxy' },
    structure: { label: 'Structure', color: '#7fc8e8', scene: 'galaxy' },
    nebula: { label: 'Nebulae', color: '#e084c8', scene: 'galaxy' },
    cluster: { label: 'Clusters', color: '#ffd98a', scene: 'galaxy' },
    compact: { label: 'Black holes', color: '#b48cff', scene: 'galaxy' },
    star: { label: 'Stars', color: '#9fd4ff', scene: 'galaxy' },
    exo: { label: 'Exoplanets', color: '#6ce0b0', scene: 'galaxy' },
    satellite: { label: 'Satellites', color: '#ff7f9a', scene: 'galaxy' },
    home: { label: 'The Sun', color: '#ffe89a', scene: 'galaxy' },
    planet: { label: 'Planets', color: '#9fd4ff', scene: 'system' },
    dwarf: { label: 'Dwarf planets', color: '#c9a68a', scene: 'system' },
    smallbody: { label: 'Small bodies', color: '#b08d5e', scene: 'system' },
    region: { label: 'Regions', color: '#7fa8c8', scene: 'system' },
    interstellar: { label: 'Interstellar', color: '#5ce6c8', scene: 'system' },
    craft: { label: 'Spacecraft', color: '#f0e6c8', scene: 'system' },
    hypothetical: { label: 'Hypothetical', color: '#a08cd8', scene: 'system' }
  };
  Object.keys(CATS).forEach(function (k) { S.filters[k] = true; });

  function catColor(c) { return (CATS[c] && CATS[c].color) || '#9fd4ff'; }

  /* Precomputed galaxy marker positions — pure function of the data. */
  GALAXY_POI.forEach(function (p) {
    var q = projectGalactic(p);
    p._x = q.x; p._y = q.y;
  });

  /* The whole-galaxy overview is not a point and gets no marker; it is
     reached from the masthead title and from search. */
  var GALAXY_OVERVIEW = GALAXY_POI.filter(function (p) { return p.id === 'milky-way'; })[0];

  /* ═══════════════════════════════════════════════════════════
     RENDER — GALAXY
  ═══════════════════════════════════════════════════════════ */

  function drawGalaxy() {
    var vw = W / DPR, vh = H / DPR;
    var sp = span();

    /* Background gradient so the void is not flatly black. */
    var bg = ctx.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
    bg.addColorStop(0, '#050a18'); bg.addColorStop(1, '#01030a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, vw, vh);

    /* The prerendered field. Its opacity eases off as we zoom past its
       resolution, handing the image over to the live star layer. */
    if (galaxyBmp) {
      var tl = w2s(-GAL_EXT, GAL_EXT);
      var size = 2 * GAL_EXT * S.cam.s;
      var soft = clamp(1 - (sp < 26000 ? (26000 - sp) / 21000 : 0), 0.28, 1);
      ctx.globalAlpha = soft;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(galaxyBmp, tl.x, tl.y, size, size);
      ctx.globalAlpha = 1;
    }

    /* Live stars — crisp at every zoom. */
    if (liveStars) {
      var LC = ['rgba(214,226,252,', 'rgba(255,222,176,', 'rgba(222,224,238,'];
      var boost = clamp(26000 / sp, 1, 3.4);
      var n = liveStars.n;
      for (var i = 0; i < n; i++) {
        var p = w2s(liveStars.x[i], liveStars.y[i]);
        if (p.x < -8 || p.x > vw + 8 || p.y < -8 || p.y > vh + 8) continue;
        var r = liveStars.s[i] * (0.55 + boost * 0.42);
        ctx.fillStyle = LC[liveStars.c[i]] + clamp(0.30 + boost * 0.16, 0.3, 0.92) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
      }
    }

    drawGalaxyGrid(sp);
    drawMarkers(GALAXY_POI, sp);
  }

  /* Range rings centred on the Galactic Centre, plus the Sun's sightline
     spokes at galactic longitude 0/90/180/270 — the reference frame every
     number in the panels is quoted in. */
  function drawGalaxyGrid(sp) {
    var o = w2s(0, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(127,200,232,0.10)';
    ctx.fillStyle = 'rgba(127,200,232,0.34)';
    ctx.font = '9px "Space Mono", monospace';

    var step = sp > 200000 ? 50000 : sp > 60000 ? 20000 : sp > 16000 ? 5000 : 1000;
    for (var r = step; r <= 260000; r += step) {
      var rp = r * S.cam.s;
      if (rp < 26 || rp > Math.max(W, H)) continue;
      ctx.beginPath(); ctx.arc(o.x, o.y, rp, 0, 6.2832); ctx.stroke();
      ctx.fillText(fmtNum(r) + ' ly', o.x + rp * 0.7071 + 4, o.y - rp * 0.7071 - 4);
    }

    /* Sightlines from the Sun. */
    var sun = w2s(0, -R_SUN_LY);
    ctx.strokeStyle = 'rgba(212,175,55,0.13)';
    ctx.setLineDash([3, 7]);
    var dirs = [[0, 'l = 0°'], [90, 'l = 90°'], [180, 'l = 180°'], [270, 'l = 270°']];
    for (var k = 0; k < 4; k++) {
      var l = dirs[k][0] * DEG;
      var far = 120000;
      var e = w2s(-far * Math.sin(l), -R_SUN_LY + far * Math.cos(l));
      ctx.beginPath(); ctx.moveTo(sun.x, sun.y); ctx.lineTo(e.x, e.y); ctx.stroke();
      if (sp < 300000) {
        ctx.fillStyle = 'rgba(212,175,55,0.34)';
        var mx = lerp(sun.x, e.x, 0.30), my = lerp(sun.y, e.y, 0.30);
        ctx.fillText(dirs[k][1], mx + 5, my);
      }
    }
    ctx.setLineDash([]);
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER — SOLAR SYSTEM
  ═══════════════════════════════════════════════════════════ */

  function drawSystem() {
    var poi = curSys().poi;
    var vw = W / DPR, vh = H / DPR;
    var bg = ctx.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, Math.max(vw, vh) * 0.8);
    bg.addColorStop(0, '#050912'); bg.addColorStop(1, '#01030a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, vw, vh);

    /* A fixed backdrop of field stars, so panning reads as motion. */
    var rnd = mulberry(99);
    ctx.fillStyle = 'rgba(200,214,244,0.42)';
    for (var i = 0; i < 420; i++) {
      var sx = rnd() * vw, sy = rnd() * vh, r = rnd() * 0.9 + 0.2;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.2832); ctx.fill();
    }

    /* Regions first — annuli under everything else. */
    poi.forEach(function (p) {
      if (p.kind !== 'region' || !S.filters[p.cat]) return;
      var ri = compress(p.inner) * S.cam.s, ro = compress(p.outer) * S.cam.s;
      var o = w2s(0, 0);
      ctx.beginPath();
      ctx.arc(o.x, o.y, ro, 0, 6.2832);
      ctx.arc(o.x, o.y, ri, 0, 6.2832, true);
      ctx.fillStyle = 'rgba(127,168,200,0.055)';
      ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(127,168,200,0.20)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(o.x, o.y, ro, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.arc(o.x, o.y, ri, 0, 6.2832); ctx.stroke();
    });

    /* Orbit paths. Sampled through the compression, so a compressed
       ellipse is drawn as the curve it really becomes — never faked. */
    poi.forEach(function (p) {
      if (!S.filters[p.cat]) return;
      if (p.kind === 'region' || p.kind === 'star' || p.kind === 'craft') return;
      drawOrbit(p);
    });

    /* The system's star. Position is always the origin; color and glow
       size come from whichever POI carries kind:'star', so this reads
       right for the Sun or for a dim red dwarf alike. */
    var home = poi.filter(function (p) { return p.kind === 'star'; })[0];
    var starCol = (home && home.color) || '#ffd27a';
    var sun = w2s(0, 0);
    var sg = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 26);
    sg.addColorStop(0, hexA(starCol, 0.92));
    sg.addColorStop(0.30, hexA(starCol, 0.34));
    sg.addColorStop(1, hexA(starCol, 0));
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sun.x, sun.y, 26, 0, 6.2832); ctx.fill();

    drawMarkers(poi, span());
  }

  function drawOrbit(p) {
    var o = w2s(0, 0);
    var N = 220;
    ctx.beginPath();
    var started = false;

    if (p.hyperbolic) {
      /* Sample by hyperbolic anomaly rather than time, so the drawn arc is
         evenly covered rather than bunched at perihelion. */
      var ah = p.q / (p.e - 1);
      var inc = p.i * DEG, om = p.om * DEG, w = p.w * DEG;
      for (var k = 0; k <= N; k++) {
        var Hh = -2.6 + (5.2 * k) / N;
        var xo = ah * (p.e - Math.cosh(Hh));
        var yo = ah * Math.sqrt(p.e * p.e - 1) * Math.sinh(Hh);
        var e3 = orbitToEcliptic(xo, yo, inc, om, w);
        var d3 = solarPoint(e3);
        var s3 = w2s(d3.x, d3.y);
        if (!started) { ctx.moveTo(s3.x, s3.y); started = true; } else ctx.lineTo(s3.x, s3.y);
      }
      ctx.strokeStyle = 'rgba(92,230,200,0.44)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    var a, e, inc2, om2, w2;
    if (p.elKey) {
      var pe = planetPosition(p.elKey, S.days);
      a = pe.a; e = pe.e; inc2 = pe.inc; om2 = pe.om; w2 = pe.w;
    } else {
      a = p.a; e = p.e || 0; inc2 = (p.i || 0) * DEG; om2 = (p.om || 0) * DEG; w2 = (p.w || 0) * DEG;
    }
    if (!a) return;

    for (var j = 0; j <= N; j++) {
      var E = (j / N) * 6.2832;
      var xo2 = a * (Math.cos(E) - e);
      var yo2 = a * Math.sqrt(1 - e * e) * Math.sin(E);
      var ec = orbitToEcliptic(xo2, yo2, inc2, om2, w2);
      var dp = solarPoint(ec);
      var sp2 = w2s(dp.x, dp.y);
      if (!started) { ctx.moveTo(sp2.x, sp2.y); started = true; } else ctx.lineTo(sp2.x, sp2.y);
    }
    ctx.closePath();

    var sel = S.selected === p;
    ctx.strokeStyle = sel ? 'rgba(212,175,55,0.75)'
      : p.kind === 'planet' ? 'rgba(159,212,255,0.30)'
        : p.kind === 'hypothetical' ? 'rgba(160,140,216,0.34)'
          : 'rgba(160,178,208,0.20)';
    if (p.kind === 'hypothetical') ctx.setLineDash([6, 5]);
    ctx.lineWidth = sel ? 1.6 : 1;
    ctx.stroke();
    ctx.setLineDash([]);
    void o;
  }

  /* Current world position of a solar POI (already compressed). */
  function solarPos(p) {
    if (p.kind === 'star') return { x: 0, y: 0 };
    if (p.kind === 'region') return null;
    if (p.kind === 'craft') {
      var lon = p.eclLon * DEG, lat = p.eclLat * DEG;
      var rr = compress(p.dist);
      return { x: rr * Math.cos(lat) * Math.cos(lon), y: rr * Math.cos(lat) * Math.sin(lon) };
    }
    return solarPoint(bodyPosition(p, S.days, curGM()));
  }

  /* ═══════════════════════════════════════════════════════════
     MARKERS & LABELS (shared by both scenes)
  ═══════════════════════════════════════════════════════════ */

  var labelBoxes = [];

  function markerScreen(p) {
    if (S.scene === 'galaxy') return w2s(p._x, p._y);
    var w = solarPos(p);
    return w ? w2s(w.x, w.y) : null;
  }

  function markerRadius(p) {
    if (S.scene !== 'galaxy' && p.radiusKm) {
      /* Body sizes are compressed too — a literal scale would make every
         planet a sub-pixel dot next to the Sun. */
      var r = 2.4 + Math.log10(p.radiusKm) * 1.55;
      return clamp(r, 2.4, 11);
    }
    return p.rank >= 4 ? 6.5 : p.rank >= 3 ? 5 : p.rank >= 2 ? 4 : 3.2;
  }

  function drawMarkers(list, sp) {
    labelBoxes = [];
    ctx.font = '10.5px "Space Mono", monospace';
    ctx.textBaseline = 'middle';
    var vw = W / DPR, vh = H / DPR;
    var pending = [];      // labels, drawn after every marker is down

    /* Least important first, so the important ones land on top. */
    var ordered = list.slice().sort(function (a, b) { return (a.rank || 0) - (b.rank || 0); });

    for (var i = 0; i < ordered.length; i++) {
      var p = ordered[i];
      if (!S.filters[p.cat] || p.noMarker) continue;
      if (p.kind === 'region') { queueRegionLabel(p, pending); continue; }

      var s = markerScreen(p);
      if (!s) continue;
      if (s.x < -80 || s.x > vw + 80 || s.y < -60 || s.y > vh + 60) continue;

      var col = p.color || catColor(p.cat);
      var r = markerRadius(p);
      var isSel = S.selected === p, isHov = S.hover === p;

      /* Glow. */
      var gl = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 4.2);
      gl.addColorStop(0, hexA(col, 0.42));
      gl.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(s.x, s.y, r * 4.2, 0, 6.2832); ctx.fill();

      /* Body. */
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, 6.2832); ctx.fill();

      /* The Sun gets a surveyor's crosshair — it is where the reader is
         standing and the door into the second scene. */
      if (p.cat === 'home') {
        ctx.strokeStyle = 'rgba(255,232,154,0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(s.x, s.y, r + 6, 0, 6.2832); ctx.stroke();
        var t1 = r + 3, t2 = r + 11;
        ctx.beginPath();
        ctx.moveTo(s.x - t2, s.y); ctx.lineTo(s.x - t1, s.y);
        ctx.moveTo(s.x + t1, s.y); ctx.lineTo(s.x + t2, s.y);
        ctx.moveTo(s.x, s.y - t2); ctx.lineTo(s.x, s.y - t1);
        ctx.moveTo(s.x, s.y + t1); ctx.lineTo(s.x, s.y + t2);
        ctx.stroke();
      }

      /* Selection / hover ring. */
      if (isSel || isHov) {
        ctx.strokeStyle = isSel ? '#d4af37' : hexA(col, 0.8);
        ctx.lineWidth = isSel ? 1.6 : 1.1;
        ctx.beginPath(); ctx.arc(s.x, s.y, r + (isSel ? 7 : 5), 0, 6.2832); ctx.stroke();
      }
      /* A ring for anything carrying a recent finding — the reason to look. */
      if (p.fresh) {
        ctx.strokeStyle = 'rgba(212,175,55,0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.arc(s.x, s.y, r + 3.5, 0, 6.2832); ctx.stroke();
        ctx.setLineDash([]);
      }

      /* Anything logged on a mission keeps a mark, in its own category
         colour, for as long as the progress survives. Nine of these
         accumulating across three scenes is the point. */
      if (S.logged[S.scene + '|' + p.id]) drawStamp(s.x, s.y, r, col);

      /* Label. */
      var wants = S.labelMode === 'all' ? true
        : S.labelMode === 'off' ? (isHov || isSel)
          : (p.rank >= 3 || isHov || isSel || (p.rank >= 2 && sp < LIMITS[S.scene].home * 0.5));
      if (wants) pending.push({ text: p.name, x: s.x + r + 7, y: s.y, anchorX: s.x, pad: r + 7, col: col, strong: isSel || isHov, rank: p.rank || 0 });
    }

    drawBurst();

    /* Most important label first, so that when two collide the one that
       survives is the one worth reading. */
    pending.sort(function (a, b) { return (b.rank + (b.strong ? 10 : 0)) - (a.rank + (a.strong ? 10 : 0)); });
    for (var q = 0; q < pending.length; q++) {
      var L = pending[q];
      placeLabel(L.text, L.x, L.y, L.col, L.strong, L.anchorX, L.pad);
    }
  }

  /* A logged objective: a small open ring with four ticks off it, in the
     object's own colour. Reads as a surveyor's mark rather than a sticker,
     which keeps it inside the atlas's own vocabulary. */
  function drawStamp(x, y, r, col) {
    var rr = r + 4.5;
    ctx.strokeStyle = hexA(col, 0.95);
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.2832); ctx.stroke();
    ctx.beginPath();
    for (var k = 0; k < 4; k++) {
      var a = Math.PI / 4 + k * Math.PI / 2;
      var ca = Math.cos(a), sa = Math.sin(a);
      ctx.moveTo(x + ca * (rr + 1.5), y + sa * (rr + 1.5));
      ctx.lineTo(x + ca * (rr + 4), y + sa * (rr + 4));
    }
    ctx.stroke();
  }

  /* The capture animation — three rings going out in the object's colour.
     Purely a reward; nothing reads its state. */
  function drawBurst() {
    if (!S.burst) return;
    var b = S.burst;
    if (b.scene !== S.scene) { S.burst = null; return; }
    var s = markerScreen(b.p);
    if (!s) return;
    for (var i = 0; i < 3; i++) {
      var k = b.t - i * 0.16;
      if (k <= 0 || k >= 1) continue;
      ctx.strokeStyle = hexA(b.col, (1 - k) * 0.75);
      ctx.lineWidth = 2.2 * (1 - k) + 0.4;
      ctx.beginPath(); ctx.arc(s.x, s.y, 6 + k * 62, 0, 6.2832); ctx.stroke();
    }
  }

  function queueRegionLabel(p, pending) {
    var o = w2s(0, 0);
    var ro = compress(p.outer) * S.cam.s;
    if (ro < 34 || ro > Math.max(W, H) * 1.6) return;
    var lx = o.x + ro * 0.7071, ly = o.y - ro * 0.7071;
    var vw = W / DPR, vh = H / DPR;
    if (lx < 0 || lx > vw || ly < 0 || ly > vh) return;
    pending.push({
      text: p.name, x: lx + 4, y: ly, col: '#7fa8c8',
      strong: S.selected === p || S.hover === p, rank: 1
    });
  }

  function placeLabel(text, x, y, col, strong, anchorX, pad) {
    var w = ctx.measureText(text).width;
    var vw = W / DPR;

    /* Prefer the right of the marker; fall back to the left rather than
       running the name off the edge of the screen. */
    if (x + w > vw - 6 && anchorX !== undefined) {
      var left = anchorX - pad - w;
      if (left >= 6) x = left;
    }
    if (x < 4 || x + w > vw - 2) return;

    var box = [x - 2, y - 7, w + 4, 14];
    for (var i = 0; i < labelBoxes.length; i++) {
      var b = labelBoxes[i];
      if (box[0] < b[0] + b[2] && box[0] + box[2] > b[0] && box[1] < b[1] + b[3] && box[1] + box[3] > b[1]) return;
    }
    labelBoxes.push(box);
    ctx.fillStyle = 'rgba(3,6,16,0.62)';
    ctx.fillRect(box[0], box[1], box[2], box[3]);
    ctx.fillStyle = strong ? '#e8f0ff' : hexA(col, 0.86);
    ctx.fillText(text, x, y);
  }

  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ═══════════════════════════════════════════════════════════
     HIT TESTING
  ═══════════════════════════════════════════════════════════ */

  function pick(mx, my) {
    var list = S.scene === 'galaxy' ? GALAXY_POI : curSys().poi;
    var best = null, bestD = 22 * 22;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!S.filters[p.cat] || p.noMarker) continue;
      if (p.kind === 'region') continue;
      var s = markerScreen(p);
      if (!s) continue;
      var dx = s.x - mx, dy = s.y - my, d = dx * dx + dy * dy;
      var reach = Math.max(markerRadius(p) + 9, 13);
      if (d < reach * reach && (d < bestD - 4 || (d < bestD + 4 && best && p.rank > best.rank))) { bestD = Math.min(d, bestD); best = p; }
    }
    if (best) return best;

    /* Regions are picked by their outer ring, if nothing sharper is near. */
    if (S.scene !== 'galaxy') {
      var o = w2s(0, 0);
      var rr = Math.hypot(mx - o.x, my - o.y);
      for (var j = 0; j < list.length; j++) {
        var q = list[j];
        if (q.kind !== 'region' || !S.filters[q.cat]) continue;
        var ro = compress(q.outer) * S.cam.s;
        if (Math.abs(rr - ro) < 9) return q;
      }
    }
    return null;
  }

  /* ═══════════════════════════════════════════════════════════
     LOOP
  ═══════════════════════════════════════════════════════════ */

  function frame(t) {
    var dt = S.lastT ? Math.min((t - S.lastT) / 1000, 0.12) : 0;
    S.lastT = t;

    if (S.scene !== 'galaxy' && S.rate !== 0) {
      S.days += S.rate * dt;
      updateDateReadout();
    }

    if (S.target) {
      S.target.t += dt / S.target.dur;
      var k = ease(clamp(S.target.t, 0, 1));
      S.cam.x = lerp(S.target.x0, S.target.x1, k);
      S.cam.y = lerp(S.target.y0, S.target.y1, k);
      /* Zoom is interpolated logarithmically — linear scale interpolation
         reads as a lurch. */
      S.cam.s = Math.exp(lerp(Math.log(S.target.s0), Math.log(S.target.s1), k));
      if (S.target.t >= 1) S.target = null;
    }

    if (S.burst) {
      S.burst.t += dt / 1.1;
      if (S.burst.t >= 1.5) S.burst = null;
    }

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (S.scene === 'galaxy') drawGalaxy(); else drawSystem();
    updateScaleReadout();
    emitSignal(t);

    requestAnimationFrame(frame);
  }

  /* ═══════════════════════════════════════════════════════════
     SIGNAL — how close the view is to the current objective

     Two things have to be true at once, or the readout is trivial.

     Centring: distance from the camera to the target measured in
     half-screens, so it is scale-free.

     Resolution: how far in the reader has zoomed, as a fraction of the
     way from the scene's home view to the span at which this particular
     object fills the screen. Without this term, everything near the Sun
     reads hot the moment the galaxy loads — the whole neighbourhood is a
     rounding error at a 132,000-light-year field of view.

     Multiplied, a wide but perfectly centred view can only ever read
     weak, and only closing in on the right object reads locked.

     Six updates a second is plenty for a meter and a tick, and keeps
     this off the critical path of the draw.
  ═══════════════════════════════════════════════════════════ */

  var lastSignalAt = 0;

  function emitSignal(t) {
    if (!S.mission || t - lastSignalAt < 160) return;
    lastSignalAt = t;

    var m = S.mission, sig = 0, same = m.scene === S.scene;
    if (same) {
      var w = targetWorld(m.p);
      if (w) {
        var sp = span();
        var rel = Math.hypot(w.x - S.cam.x, w.y - S.cam.y) / (sp * 0.5);
        var centred = Math.pow(clamp(1 - rel, 0, 1), 0.8);

        var home = LIMITS[S.scene].home;
        var arrive = clamp(arrivalSpan(m.p), LIMITS[S.scene].minSpan, home);
        var depth = Math.log(home / arrive) > 0.01
          ? clamp(Math.log(home / sp) / Math.log(home / arrive), 0, 1)
          : 1;

        sig = centred * (0.3 + 0.7 * depth);
      }
    }
    document.dispatchEvent(new CustomEvent('atlas:signal', {
      detail: { signal: sig, sameScene: same, scene: m.scene }
    }));
  }

  function flyTo(x, y, targetSpan, dur) {
    var lim = LIMITS[S.scene];
    var sp = clamp(targetSpan, lim.minSpan, lim.maxSpan);
    S.target = {
      x0: S.cam.x, y0: S.cam.y, s0: S.cam.s,
      x1: x, y1: y, s1: (W / DPR) / sp,
      t: 0, dur: dur || 1.05
    };
  }

  /* ═══════════════════════════════════════════════════════════
     PANEL
  ═══════════════════════════════════════════════════════════ */

  var panel = document.getElementById('panel');
  var panelBody = document.getElementById('panel-body');

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* Description text is authored with *emphasis* markers and paragraph
     breaks; nothing else is interpreted. */
  function prose(text) {
    return text.split('\n\n').map(function (para) {
      return '<p>' + esc(para).replace(/\*([^*]+)\*/g, '<em>$1</em>') + '</p>';
    }).join('');
  }

  function citeList(ids) {
    return ids.map(function (id) {
      var s = SOURCES[id];
      if (!s) return '';
      return '<li>' +
        '<span class="kind-tag ' + s.kind + '">' + esc(s.kind) + '</span>' +
        '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.what) + '</a>' +
        '<span class="c-meta">' + esc(s.who) + ' · ' + esc(s.where) + ' · ' + esc(s.when) + '</span>' +
        '</li>';
    }).join('');
  }

  function openPanel(p) {
    S.selected = p;
    document.dispatchEvent(new CustomEvent('atlas:select', { detail: { poi: p, scene: S.scene } }));
    var cat = CATS[p.cat] || { label: p.cat, color: '#9fd4ff' };
    var html = '';

    html += '<div class="p-cat"><span class="dot" style="background:' + cat.color + '"></span>' + esc(cat.label) + '</div>';
    html += '<h2>' + esc(p.name) + '</h2>';
    if (p.alt) html += '<p class="p-alt">' + esc(p.alt) + '</p>';
    html += '<p class="p-type">' + esc(p.type) + '</p>';

    /* Position row, assembled from whatever the record actually carries. */
    var pos = [];
    if (S.scene === 'galaxy' && p.dist > 0) {
      pos.push(['Distance from Sun', fmtNum(p.dist) + ' ly']);
      pos.push(['Galactic coordinates',
        'l = ' + (p.l || 0).toFixed(2) + '°, b = ' + (p.b || 0).toFixed(2) + '°' + (p.lbApprox ? ' (approx.)' : '')]);
    }
    if (S.scene !== 'galaxy' && p.kind !== 'region' && p.kind !== 'star') {
      var w = solarPos(p);
      if (w) {
        var rTrue = p.kind === 'craft' ? p.dist : Math.hypot(bodyPosition(p, S.days, curGM()).x, bodyPosition(p, S.days, curGM()).y);
        pos.push(['Current distance from ' + curSys().centerLabel, rTrue.toFixed(rTrue < 10 ? 3 : 1) + ' au']);
      }
    }

    if (p.facts || pos.length) {
      html += '<table class="p-facts">';
      pos.concat(p.facts || []).forEach(function (f) {
        html += '<tr><th>' + esc(f[0]) + '</th><td>' + esc(f[1]) + '</td></tr>';
      });
      html += '</table>';
    }

    html += '<div class="p-desc">' + prose(p.desc) + '</div>';

    if (p.fresh) {
      html += '<div class="p-fresh"><div class="fresh-head">Recently &nbsp;<span class="fresh-year">' +
        esc(p.fresh.year) + '</span></div>' +
        '<p>' + esc(p.fresh.text).replace(/\*([^*]+)\*/g, '<em>$1</em>') + '</p></div>';
    }

    if (p.moons) {
      html += '<div class="p-sub">Notable moons</div><ul class="p-moons">';
      p.moons.forEach(function (m) { html += '<li><b>' + esc(m[0]) + '</b>' + esc(m[1]) + '</li>'; });
      html += '</ul>';
    }

    if (p.enterSystem) {
      html += '<button class="p-action" id="descend-btn">Descend into ' + esc(SYSTEMS[p.enterSystem].enterLabel) + ' →</button>';
    }

    if (p.cites && p.cites.length) {
      html += '<div class="p-sub">Sources for this entry</div><ul class="p-cites">' + citeList(p.cites) + '</ul>';
    }

    /* Honesty notes about how this marker was placed. */
    var notes = [];
    if (p.lbApprox) notes.push('The galactic longitude and latitude here place the marker in the right part of the sky but are approximate; treat the distance, not the position on this map, as the measurement.');
    if (p.orbitApprox) notes.push('The orbit shape is drawn from published elements. The body’s position along that orbit is approximate — this atlas is not an ephemeris.');
    if (p.posApprox) notes.push('Position is plotted from the spacecraft’s reported distance and heading, rounded. Use NASA’s live trackers for a current fix.');
    if (S.scene !== 'galaxy' && S.solarScale === 'compressed' && p.kind !== 'star') notes.push('Radial distances on screen are compressed (r^0.34) so the whole system fits one view. Switch the scale control to “true” to see the real proportions.');
    if (notes.length) html += '<div class="p-note">' + notes.map(esc).join('<br><br>') + '</div>';

    panelBody.innerHTML = html;
    panel.classList.add('open');
    panel.scrollTop = 0;

    var db = document.getElementById('descend-btn');
    if (db) db.addEventListener('click', function () { switchScene(p.enterSystem); });
  }

  function closePanel() {
    panel.classList.remove('open');
    S.selected = null;
  }

  /* ═══════════════════════════════════════════════════════════
     SCENE SWITCHING
  ═══════════════════════════════════════════════════════════ */

  var veil = document.getElementById('veil');
  var veilText = veil.querySelector('.veil-text');

  /* The veil used to lift the instant it had finished falling, which gave
     its line about a third of a second on screen — long enough to notice,
     nowhere near long enough to read. It now falls, holds while the scene
     is swapped underneath it, and lifts. The hold is reading time, so it
     scales with the length of the line, and anyone who already knows what
     it says can click or press a key to go on. */

  var VEIL_FADE = 500;                  // matches the CSS transition
  var veilTimers = [];
  var veilAfter = null;

  function clearVeilTimers() {
    veilTimers.forEach(clearTimeout);
    veilTimers = [];
  }

  function liftVeil() {
    clearVeilTimers();
    veil.classList.remove('on', 'holding');
    var fn = veilAfter; veilAfter = null;
    if (fn) fn();
  }

  function switchScene(to, after) {
    if (to === S.scene) { if (after) after(); return; }
    closePanel();
    veilText.textContent = to === 'galaxy'
      ? 'back up, out past the edge —'
      : SYSTEMS[to].veilIn;
    veil.classList.add('on');
    veilAfter = after || null;

    var words = veilText.textContent.trim().split(/\s+/).length;
    var hold = clamp(words * 250, 1100, 2400);

    clearVeilTimers();
    veilTimers.push(setTimeout(function () {
      S.scene = to;
      resetView(true);
      syncChrome();
      /* Only skippable once the scene underneath is actually the new one,
         so a skip can never reveal the old scene mid-swap. */
      veil.classList.add('holding');
    }, VEIL_FADE));
    veilTimers.push(setTimeout(liftVeil, VEIL_FADE + hold));
  }

  veil.addEventListener('click', function () {
    if (veil.classList.contains('holding')) liftVeil();
  });
  document.addEventListener('keydown', function () {
    if (veil.classList.contains('holding')) liftVeil();
  });

  function resetView(instant) {
    var lim = LIMITS[S.scene];
    var cx = 0, cy = 0;
    if (S.scene === 'galaxy') cy = -6000;
    if (instant) {
      S.cam.x = cx; S.cam.y = cy; setSpan(lim.home); S.target = null;
    } else {
      flyTo(cx, cy, lim.home, 0.9);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     CHROME (rail, chips, readouts)
  ═══════════════════════════════════════════════════════════ */

  var chipsBox = document.getElementById('chips');
  var btnScene = document.getElementById('btn-scene');
  var btnScale = document.getElementById('btn-scale');
  var timebar = document.getElementById('timebar');
  var rateEl = document.getElementById('time-rate');
  var titleEl = document.getElementById('map-title');
  var scaleReadout = document.getElementById('scale-readout');

  function syncChrome() {
    var inSystem = S.scene !== 'galaxy';
    btnScene.textContent = S.scene === 'galaxy' ? '↓ Into the Solar System' : '↑ Back to the Galaxy';
    btnScale.classList.toggle('hidden', !inSystem);
    timebar.classList.toggle('hidden', !inSystem);

    /* Every system keeps its own clock. One global rate is wrong the
       moment two systems differ in size by three orders of magnitude. */
    if (inSystem) {
      var t = curSys().timeDefault;
      if (t !== undefined) {
        rateEl.value = t;
        /* Read the position back rather than trusting what was written —
           the slider snaps to its own step, and the rate has to be the
           rate of where the handle actually is. */
        S.rate = rateFromSlider(parseFloat(rateEl.value));
      }
    }
    titleEl.innerHTML = S.scene === 'galaxy' ? 'The <em>Milky Way</em>' : curSys().titleHTML;
    buildChips();
    updateDateReadout();
  }

  function buildChips() {
    chipsBox.innerHTML = '';
    var inSystem = S.scene !== 'galaxy';
    Object.keys(CATS).forEach(function (k) {
      var c = CATS[k];
      if (inSystem ? c.scene !== 'system' : c.scene !== 'galaxy') return;
      var b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.setAttribute('aria-pressed', String(!!S.filters[k]));
      b.innerHTML = '<span class="dot" style="color:' + c.color + '"></span>' + c.label;
      b.addEventListener('click', function () {
        S.filters[k] = !S.filters[k];
        b.setAttribute('aria-pressed', String(S.filters[k]));
        if (S.selected && S.selected.cat === k && !S.filters[k]) closePanel();
      });
      chipsBox.appendChild(b);
    });
  }

  function updateScaleReadout() {
    var sp = span();
    var terse = (W / DPR) < 720;
    if (S.scene === 'galaxy') {
      scaleReadout.innerHTML = 'field of view <b>' + fmtNum(sp) + ' light-years</b>' +
        (terse ? '' : ' · ' + GALAXY_POI.length + ' points of interest · sun at l 0° b 0°, 26,700 ly out');
    } else {
      var sys = curSys();
      var edge = S.solarScale === 'true' ? sp / 2 : Math.pow(sp / 2, 1 / 0.34);
      var reach = (edge < 10 ? edge.toFixed(3) : fmtNum(edge)) + ' au';
      scaleReadout.innerHTML = terse
        ? '<b>' + reach + '</b> to the edge · scale <b>' + S.solarScale + '</b>'
        : 'field of view <b>' + reach + '</b> from ' + sys.centerLabel + ' to the edge · ' +
          sys.poi.length + ' points of interest · radial scale <b>' + S.solarScale + '</b>';
    }
  }

  var dateReadout = document.getElementById('date-readout');
  function updateDateReadout() {
    if (!dateReadout) return;
    var ms = (S.days + 10957.5) * 86400000;   // J2000 → Unix epoch
    var d = new Date(ms);
    dateReadout.textContent = isNaN(d.getTime()) ? '—' :
      d.toISOString().slice(0, 10);
  }

  /* ═══════════════════════════════════════════════════════════
     SEARCH
  ═══════════════════════════════════════════════════════════ */

  var searchEl = document.getElementById('search');
  var suggestEl = document.getElementById('suggest');
  var suggestIdx = -1;

  function allPoi() {
    var out = GALAXY_POI.map(function (p) { return { p: p, scene: 'galaxy' }; });
    Object.keys(SYSTEMS).forEach(function (key) {
      out = out.concat(SYSTEMS[key].poi.map(function (p) { return { p: p, scene: key }; }));
    });
    return out;
  }

  function runSearch(q) {
    q = q.trim().toLowerCase();
    suggestIdx = -1;
    if (!q) { suggestEl.classList.add('hidden'); return; }
    var hits = allPoi().filter(function (e) {
      return (e.p.name + ' ' + (e.p.alt || '') + ' ' + e.p.type).toLowerCase().indexOf(q) >= 0;
    }).slice(0, 9);

    if (!hits.length) { suggestEl.classList.add('hidden'); return; }
    suggestEl.innerHTML = '';
    hits.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      var scopeLabel = e.scene === 'galaxy' ? 'galaxy' : SYSTEMS[e.scene].searchLabel;
      b.innerHTML = esc(e.p.name) + '<span class="s-sub">' + esc(scopeLabel) + ' · ' + esc(e.p.type) + '</span>';
      b.addEventListener('click', function () { goTo(e); });
      suggestEl.appendChild(b);
    });
    suggestEl.classList.remove('hidden');
  }

  /* Where a point of interest sits, and how wide the view should be to
     count as having arrived at it. Both the fly-to and the signal readout
     work off these, so "close enough to fly to" and "close enough to read
     as a strong signal" can never drift apart. */

  function targetWorld(p) {
    if (S.scene === 'galaxy') return { x: p._x, y: p._y };
    if (p.kind === 'region') return { x: 0, y: 0 };
    return solarPos(p);
  }

  function arrivalSpan(p) {
    if (S.scene === 'galaxy') {
      var far = Math.max(Math.hypot(p._x, p._y) * 0.6, 900);
      return p.dist > 90000 ? far * 2.4 : clamp(p.dist * 2.6, 1400, 130000);
    }
    if (p.kind === 'region') return compress(p.outer) * 2.6;
    var w = solarPos(p);
    if (!w) return LIMITS[S.scene].home;
    var closeFloor = curSys().limits.homeCompressed * 0.12;
    return Math.max(compress(Math.hypot(w.x, w.y) || 1) * 2.4, closeFloor);
  }

  function goTo(entry) {
    suggestEl.classList.add('hidden');
    searchEl.value = '';
    var p = entry.p;

    var arrive = function () {
      var w = targetWorld(p);
      if (w) flyTo(w.x, w.y, arrivalSpan(p), 1.15);
      openPanel(p);
    };

    /* Hand the arrival to switchScene rather than racing it on a timer —
       it fires as the veil starts to lift, however long the hold ran. */
    if (entry.scene !== S.scene) switchScene(entry.scene, arrive);
    else arrive();
  }

  /* Small public seam so an outside script (the mission module) can fly
     the map to a point of interest, aim the signal readout, and mark what
     has been logged — without knowing anything about scenes, cameras, or
     the data files. The atlas still has no idea a mission exists; it only
     draws what it is handed. */

  function findPoi(scene, id) {
    var list = scene === 'galaxy' ? GALAXY_POI : (SYSTEMS[scene] ? SYSTEMS[scene].poi : []);
    return list.filter(function (x) { return x.id === id; })[0] || null;
  }

  window.AtlasBridge = {
    goTo: function (scene, id) {
      var p = findPoi(scene, id);
      if (p) goTo({ p: p, scene: scene });
    },

    /* Name and colour for a point of interest, for chrome outside the map. */
    lookup: function (scene, id) {
      var p = findPoi(scene, id);
      if (!p) return null;
      return { name: p.name, color: p.color || catColor(p.cat), fresh: !!p.fresh };
    },

    /* Aim the signal readout, or pass null to stand it down. */
    setObjective: function (scene, id) {
      var p = scene && findPoi(scene, id);
      S.mission = p ? { scene: scene, id: id, p: p } : null;
    },

    /* The full set of logged objectives, as 'scene|id' strings. */
    setLogged: function (keys) {
      S.logged = {};
      (keys || []).forEach(function (k) { S.logged[k] = true; });
    },

    /* Rings going out from a marker that has just been logged. */
    celebrate: function (scene, id) {
      if (REDUCED_MOTION) return;
      var p = findPoi(scene, id);
      if (p) S.burst = { p: p, scene: scene, col: p.color || catColor(p.cat), t: 0 };
    }
  };

  searchEl.addEventListener('input', function () { runSearch(searchEl.value); });
  searchEl.addEventListener('keydown', function (ev) {
    var btns = suggestEl.querySelectorAll('button');
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (!btns.length) return;
      suggestIdx = clamp(suggestIdx + (ev.key === 'ArrowDown' ? 1 : -1), 0, btns.length - 1);
      btns.forEach(function (b, i) { b.classList.toggle('active', i === suggestIdx); });
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      (btns[suggestIdx >= 0 ? suggestIdx : 0] || {}).click && btns[suggestIdx >= 0 ? suggestIdx : 0].click();
    } else if (ev.key === 'Escape') {
      suggestEl.classList.add('hidden'); searchEl.blur();
    }
  });
  document.addEventListener('click', function (ev) {
    if (!suggestEl.contains(ev.target) && ev.target !== searchEl) suggestEl.classList.add('hidden');
  });

  /* ═══════════════════════════════════════════════════════════
     SOURCES OVERLAY
  ═══════════════════════════════════════════════════════════ */

  function buildSources() {
    var groups = {
      paper: 'Peer-reviewed papers',
      preprint: 'Preprints and author manuscripts',
      release: 'Observatory and agency releases',
      archive: 'Catalogues and archives'
    };
    var out = '';
    Object.keys(groups).forEach(function (kind) {
      var ids = Object.keys(SOURCES).filter(function (id) { return SOURCES[id].kind === kind; });
      if (!ids.length) return;
      ids.sort(function (a, b) { return SOURCES[a].what.localeCompare(SOURCES[b].what); });
      out += '<h3>' + groups[kind] + ' (' + ids.length + ')</h3><ul class="src-list">';
      ids.forEach(function (id) {
        var s = SOURCES[id];
        out += '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.what) + '</a>' +
          '<span class="c-meta">' + esc(s.who) + ' · ' + esc(s.where) + ' · ' + esc(s.when) + '</span></li>';
      });
      out += '</ul>';
    });
    document.getElementById('src-groups').innerHTML = out;
  }

  /* ═══════════════════════════════════════════════════════════
     INPUT
  ═══════════════════════════════════════════════════════════ */

  var drag = null, moved = 0;

  function localPt(ev) {
    var r = cvs.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }

  stage.addEventListener('pointerdown', function (ev) {
    if (ev.target.closest('#rail, #panel, #masthead, #sources-overlay, #intro, #mission-hud')) return;
    var p = localPt(ev);
    drag = { x: p.x, y: p.y, id: ev.pointerId };
    moved = 0;
    stage.classList.add('dragging');
    stage.setPointerCapture(ev.pointerId);
    S.target = null;
  });

  stage.addEventListener('pointermove', function (ev) {
    var p = localPt(ev);
    if (drag && drag.id === ev.pointerId) {
      var dx = p.x - drag.x, dy = p.y - drag.y;
      moved += Math.abs(dx) + Math.abs(dy);
      S.cam.x -= dx / S.cam.s;
      S.cam.y += dy / S.cam.s;
      drag.x = p.x; drag.y = p.y;
      hideTip();
      return;
    }
    var hit = pick(p.x, p.y);
    S.hover = hit;
    stage.classList.toggle('over-poi', !!hit);
    if (hit) showTip(hit, ev.clientX, ev.clientY); else hideTip();
  });

  function endDrag(ev) {
    if (!drag || drag.id !== ev.pointerId) return;
    stage.classList.remove('dragging');
    var p = localPt(ev);
    if (moved < 6) {
      var hit = pick(p.x, p.y);
      if (hit) openPanel(hit); else closePanel();
    }
    drag = null;
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', function (ev) { drag = null; stage.classList.remove('dragging'); void ev; });

  stage.addEventListener('wheel', function (ev) {
    if (ev.target.closest('#rail, #panel, #sources-overlay, #mission-hud')) return;
    ev.preventDefault();
    zoomAt(localPt(ev), Math.exp(-ev.deltaY * (ev.deltaMode === 1 ? 0.05 : 0.0016)));
  }, { passive: false });

  function zoomAt(pt, factor) {
    S.target = null;
    var lim = LIMITS[S.scene];
    var before = s2w(pt.x, pt.y);
    var newSpan = clamp(span() / factor, lim.minSpan, lim.maxSpan);
    setSpan(newSpan);
    var after = s2w(pt.x, pt.y);
    S.cam.x += before.x - after.x;
    S.cam.y += before.y - after.y;
  }

  /* Pinch. */
  var pinch = null;
  stage.addEventListener('touchmove', function (ev) {
    if (ev.touches.length !== 2) { pinch = null; return; }
    ev.preventDefault();
    var r = cvs.getBoundingClientRect();
    var a = ev.touches[0], b = ev.touches[1];
    var d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    var mid = { x: (a.clientX + b.clientX) / 2 - r.left, y: (a.clientY + b.clientY) / 2 - r.top };
    if (pinch) zoomAt(mid, d / pinch);
    pinch = d;
    drag = null;
  }, { passive: false });
  stage.addEventListener('touchend', function () { pinch = null; });

  document.addEventListener('keydown', function (ev) {
    if (ev.target === searchEl) return;
    /* While the veil is up a keypress means "go on", not "pan the map". */
    if (veil.classList.contains('on')) return;
    var step = span() * 0.12;
    switch (ev.key) {
      case 'ArrowLeft': S.cam.x -= step; S.target = null; break;
      case 'ArrowRight': S.cam.x += step; S.target = null; break;
      case 'ArrowUp': S.cam.y += step; S.target = null; break;
      case 'ArrowDown': S.cam.y -= step; S.target = null; break;
      case '+': case '=': zoomAt({ x: (W / DPR) / 2, y: (H / DPR) / 2 }, 1.3); break;
      case '-': case '_': zoomAt({ x: (W / DPR) / 2, y: (H / DPR) / 2 }, 1 / 1.3); break;
      case 'Escape':
        if (!document.getElementById('sources-overlay').classList.contains('hidden')) {
          document.getElementById('sources-overlay').classList.add('hidden');
        } else closePanel();
        break;
      case '/': ev.preventDefault(); searchEl.focus(); break;
      default: return;
    }
    if (ev.key.indexOf('Arrow') === 0) ev.preventDefault();
  });

  /* ═══════════════════════════════════════════════════════════
     TOOLTIP
  ═══════════════════════════════════════════════════════════ */

  var tip = document.getElementById('tip');
  function showTip(p, cx, cy) {
    tip.innerHTML = esc(p.name) + '<span class="t-sub">' + esc(p.fresh ? 'new finding' : p.type) + '</span>';
    tip.style.left = cx + 'px';
    tip.style.top = cy + 'px';
    tip.classList.remove('hidden');
  }
  function hideTip() { tip.classList.add('hidden'); }

  /* ═══════════════════════════════════════════════════════════
     BOOT
  ═══════════════════════════════════════════════════════════ */

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    var sp = S.ready ? span() : null;
    W = Math.round(window.innerWidth * DPR);
    H = Math.round(window.innerHeight * DPR);
    cvs.width = W; cvs.height = H;
    cvs.style.width = window.innerWidth + 'px';
    cvs.style.height = window.innerHeight + 'px';
    if (sp) setSpan(sp);
  }
  window.addEventListener('resize', resize);

  document.getElementById('panel-close').addEventListener('click', closePanel);

  /* The title is the way in to the entry that describes the whole scene —
     the galaxy itself, or the Sun. Neither is a point you can sensibly put
     a marker on. */
  titleEl.addEventListener('click', function () {
    openPanel(S.scene === 'galaxy'
      ? GALAXY_OVERVIEW
      : curSys().poi.filter(function (p) { return p.kind === 'star'; })[0]);
  });
  btnScene.addEventListener('click', function () { switchScene(S.scene === 'galaxy' ? 'solar' : 'galaxy'); });
  document.getElementById('btn-reset').addEventListener('click', function () { resetView(false); });

  document.getElementById('btn-labels').addEventListener('click', function (ev) {
    S.labelMode = S.labelMode === 'key' ? 'all' : S.labelMode === 'all' ? 'off' : 'key';
    ev.currentTarget.textContent = 'Labels: ' + S.labelMode;
  });

  btnScale.addEventListener('click', function (ev) {
    S.solarScale = S.solarScale === 'compressed' ? 'true' : 'compressed';
    ev.currentTarget.textContent = 'Scale: ' + S.solarScale;
    if (S.scene !== 'galaxy') {
      var lim = curSys().limits;
      LIMITS[S.scene].home = S.solarScale === 'true' ? lim.homeTrue : lim.homeCompressed;
    }
    resetView(false);
    if (S.selected) openPanel(S.selected);
  });

  document.getElementById('btn-sources').addEventListener('click', function () {
    document.getElementById('sources-overlay').classList.remove('hidden');
  });
  document.getElementById('sources-close').addEventListener('click', function () {
    document.getElementById('sources-overlay').classList.add('hidden');
  });

  rateEl.addEventListener('input', function () {
    S.rate = rateFromSlider(parseFloat(rateEl.value));
  });
  document.getElementById('btn-now').addEventListener('click', function () {
    S.days = (Date.now() / 86400000) - 10957.5;
    updateDateReadout();
  });

  document.getElementById('intro-enter').addEventListener('click', function () {
    document.getElementById('intro').classList.add('hidden');
  });

  function boot() {
    resize();
    S.days = (Date.now() / 86400000) - 10957.5;
    buildGalaxy();
    buildSources();
    resetView(true);
    syncChrome();
    S.ready = true;
    requestAnimationFrame(frame);
  }

  /* Build after first paint so the intro card is on screen while the star
     field is generated. */
  requestAnimationFrame(function () { setTimeout(boot, 30); });

})();
