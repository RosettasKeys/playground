/* ═══════════════════════════════════════════════════════════════════════
   sim-core.js — Tornado Lab: the authoritative layer
   ───────────────────────────────────────────────────────────────────────
   This file owns the wind field. Everything the user eventually sees —
   damage, debris, radar, the EF rating, the narration — is *derived* from
   what happens here. Nothing downstream invents its own physics.

   Two rules hold this together:
     1. No DOM, no THREE. This file must stay renderer-agnostic.
     2. No unseeded Math.random(). Every stochastic draw comes from the
        seeded PRNG, so (seed + params) fully determines a run. That is
        what makes scrubbing and What-If both cheap and fair.

   Units are metric and internal: metres, seconds, m/s, pascals. Display
   converts at the edge.
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  /* ── Constants ────────────────────────────────────────────────────── */

  TS.MPH = 2.2369362920544;      // m/s → mph, the only conversion constant
  TS.RHO = 1.15;                 // kg/m^3, near-surface air density

  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

  TS.clamp = clamp;
  TS.lerp = lerp;
  TS.smoothstep = smoothstep;
  TS.TAU = TAU;


  /* ── Seeded PRNG (mulberry32) ─────────────────────────────────────────
     Small, fast, and good enough for visual and structural variation.
     fork() lets a subsystem take its own independent stream without
     perturbing the caller sequence — important, because otherwise adding
     one particle would change every building quality draw. */

  TS.makeRNG = function makeRNG(seed) {
    let a = (seed >>> 0) || 1;
    const rng = function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    rng.range = (lo, hi) => lo + (hi - lo) * rng();
    rng.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * rng());
    rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
    rng.chance = (p) => rng() < p;
    rng.normal = function (mean, sd) {
      // Box-Muller, clipped at +/-3 sigma so a tail draw cannot produce an
      // absurd building or a particle launched into orbit.
      let u = 0, v = 0;
      while (u === 0) u = rng();
      while (v === 0) v = rng();
      const n = Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
      return mean + sd * clamp(n, -3, 3);
    };
    rng.fork = () => makeRNG(Math.floor(rng() * 4294967296));
    return rng;
  };


  /* ── Smooth pseudo-noise ──────────────────────────────────────────────
     Sum of incommensurate sines with seeded phases. Deterministic, cheap,
     no table, and continuous in time — which matters because it modulates
     tornado intensity, and a discontinuity there would read as a glitch. */

  TS.makeWobble = function (rng, octaves) {
    const n = octaves || 4;
    const ph = [], fr = [], am = [];
    let norm = 0;
    for (let i = 0; i < n; i++) {
      ph.push(rng() * TAU);
      fr.push(0.037 * Math.pow(1.93, i) * rng.range(0.85, 1.15));
      const a = 1 / (i + 1);
      am.push(a);
      norm += a;
    }
    return function (t) {
      let s = 0;
      for (let i = 0; i < n; i++) s += am[i] * Math.sin(t * fr[i] * TAU + ph[i]);
      return s / norm;                       // → roughly -1 … +1
    };
  };


  /* ── Default tornado parameters ───────────────────────────────────────
     These are the user-facing controls. Stored metric; the UI converts. */

  TS.defaultParams = function () {
    return {
      vmax:          62,      // m/s, peak tangential wind at maturity
      width:         400,     // m, damage-path width (2 x Rmax)
      shape:        'cone',   // rope | cone | stovepipe | wedge
      forwardSpeed:  13,      // m/s translation
      heading:       45,      // degrees, compass (0 = north, 90 = east)
      curvature:     0,       // degrees per minute of heading change
      swirl:         1.0,     // swirl ratio — controls vortex structure
      lifespan:      420,     // s
      condensation:  0.5,     // 0…1 bias on funnel visibility
      debrisLoading: 0.5,     // 0…1 how readily material is lofted
      multiVortex:   0.0,     // 0…1 extra push toward subvortex breakdown
      fluctuation:   0.35     // 0…1 intensity variability over the life
    };
  };


  /* ═══════════════════════════════════════════════════════════════════
     THE VORTEX

     A modified Rankine combined vortex: solid-body rotation inside the
     radius of maximum wind, decaying as a power law outside it.

         r <  Rmax :  v = Vmax * (r / Rmax)
         r >= Rmax :  v = Vmax * (Rmax / r)^alpha

     The translation vector is then added on top. That addition is not a
     detail — it is the entire reason a tornado right side (relative to
     its motion, northern hemisphere) is more damaging. We never
     special-case that asymmetry; it is simply what vector addition does.
     ═══════════════════════════════════════════════════════════════════ */

  /* The bare Rankine power law never actually reaches zero — at four or
     five Rmax it still predicts damaging wind, which would have a house a
     kilometre off the track sitting in 110 mph for minutes on end. Real
     tornado circulation does not extend like that: it is embedded in, and
     bounded by, the parent mesocyclone, and the tangential wind rolls off
     into the storm-scale flow well before then.

     So the profile carries an outer envelope beyond Rmax. The rolloff
     length is ours rather than derived — tagged [simplified here] — but
     the absence of one was plainly wrong. */

  const OUTER_ROLLOFF = 2.5;          // in units of Rmax

  function tangentialAt(r, rmax, vmax, alpha) {
    if (r < 1e-3) return 0;
    if (r < rmax) return vmax * (r / rmax);
    const base = vmax * Math.pow(rmax / r, alpha);
    const x = (r - rmax) / (OUTER_ROLLOFF * rmax);
    return base * Math.exp(-x * x);
  }

  /* Cyclostrophic pressure deficit, integrated from dp/dr = rho*v^2/r.
       outside:  dp = (rho*Vmax^2 / 2a) * (Rmax/r)^(2a)
       inside:   that, plus rho*Vmax^2*(1 - r^2/Rmax^2)/2
     The centre value is where "how far down does the funnel reach" gets
     answered, so it is worth having it be real rather than art-directed. */

  function deficitAt(r, rmax, vmax, alpha) {
    const q = TS.RHO * vmax * vmax;
    const atRmax = q / (2 * alpha);
    if (r >= rmax) return atRmax * Math.pow(rmax / Math.max(r, 1e-3), 2 * alpha);
    return atRmax + q * (1 - (r * r) / (rmax * rmax)) / 2;
  }

  /* Inverse of the above: radius at which the deficit equals `need`.
     Used to build the condensation funnel silhouette height by height. */

  function radiusForDeficit(need, rmax, vmax, alpha) {
    const q = TS.RHO * vmax * vmax;
    const atRmax = q / (2 * alpha);
    if (need <= 0) return Infinity;
    if (need <= atRmax) return rmax * Math.pow(atRmax / need, 1 / (2 * alpha));
    const inner = 1 - (2 * (need - atRmax)) / q;
    if (inner <= 0) return 0;               // deficit never gets this low
    return rmax * Math.sqrt(inner);
  }

  TS.tangentialAt = tangentialAt;
  TS.deficitAt = deficitAt;
  TS.radiusForDeficit = radiusForDeficit;


  /* Vertical Rmax profile — this is what "funnel shape" actually means.
     A cone flares with height; a wedge is nearly as wide as it is tall;
     a stovepipe holds its width; a rope is narrow and sinuous. Returned
     as a multiplier on the ground-level Rmax. */

  const SHAPE_FLARE = { rope: 1.30, cone: 1.85, stovepipe: 1.06, wedge: 1.18 };

  function shapeFlare(shape, zNorm) {
    const f = SHAPE_FLARE[shape] || SHAPE_FLARE.cone;
    // Slight concavity: real funnels flare fastest near cloud base.
    return lerp(1, f, Math.pow(clamp(zNorm, 0, 1), 1.45));
  }
  TS.shapeFlare = shapeFlare;


  /* ═══════════════════════════════════════════════════════════════════
     SIM
     ═══════════════════════════════════════════════════════════════════ */

  const DT = 1 / 30;                 // fixed sim step — physics never varies
  TS.DT = DT;

  /* The damage pass runs at 10 Hz rather than 30. At a typical forward
     speed the vortex moves under half a metre per step, so a third of the
     evaluations carry all of the information — and damage was comfortably
     the most expensive thing in the loop. */
  const DAMAGE_EVERY = 3;
  const DEBRIS_EVERY = 2;

  TS.Sim = function Sim(opts) {
    opts = opts || {};

    this.seed = (opts.seed >>> 0) || 20260827;
    /* Debris is the single most expensive thing in the loop — thousands of
       particles, each sampling the wind field every step. It exists for the
       eye and for the radar debris signature, so a headless run (What-If,
       verification) switches it off entirely and gets an identical damage
       swath for a fraction of the cost. */
    this.visual = opts.visual !== false;
    this.params = Object.assign(TS.defaultParams(), opts.params || {});
    this.env = Object.assign(TS.defaultEnv ? TS.defaultEnv() : {}, opts.env || {});
    this.terrain = opts.terrain || null;

    this.reset();
  };

  TS.Sim.prototype.reset = function () {
    const p = this.params;

    // Fresh stream from the same seed: a reset must reproduce the run.
    this.rng = TS.makeRNG(this.seed);
    const r = this.rng;

    this.wobbleV = TS.makeWobble(r.fork(), 4);   // intensity variation
    this.wobbleR = TS.makeWobble(r.fork(), 3);   // width variation
    this.wobbleT = TS.makeWobble(r.fork(), 3);   // tilt / lean wander
    this.subRng = r.fork();
    this.debrisRng = r.fork();

    this.t = 0;
    this.alive = true;
    this.phase = 'genesis';

    // Start far enough back that the tornado enters the scene under its
    // own motion rather than popping into existence mid-field.
    const hdg = p.heading * Math.PI / 180;
    this.dir = { x: Math.sin(hdg), y: Math.cos(hdg) };
    const travel = p.forwardSpeed * p.lifespan;
    this.origin = { x: -this.dir.x * travel * 0.5, y: -this.dir.y * travel * 0.5 };
    this.center = { x: this.origin.x, y: this.origin.y };
    this.heading = p.heading;

    this.vmax = 0;
    this.rmax = Math.max(8, p.width / 2);
    this.alpha = 0.6;
    this.tilt = { x: 0, y: 0 };
    this.deficit = 0;
    this.funnelBase = 0;          // lowest altitude reached by condensation
    this.minFunnelBase = 1e9;     // lowest it EVER got, for the post-mortem
    this._fbSum = 0; this._fbN = 0; this._fbGround = 0;
    this.subvortices = [];
    this.swirlNow = p.swirl;

    this.path = [];               // sampled centreline for the report
    this.journal = [];            // monotone damage record — see sim-damage
    this.history = [];            // ring of snapshots for scrubbing
    this.peakVmax = 0;      // peak ROTATIONAL wind
    this.peakGround = 0;    // peak GROUND-RELATIVE wind — what does damage
    this.peakRmax = 0;
    this.debris = [];             // lofted material, owned by sim-damage
    this.debrisTop = 0;           // m, highest lofted material
    this.debrisLoad = 0;          // concentration proxy, drives radar TDS

    this._histAccum = 0;
    this._pathAccum = 0;

    this.recalcEnvironment();
    if (TS.resetDamage) TS.resetDamage(this);
    this.snapshot();
  };

  /* Environmental derivation lives in sim-env.js; this is the hook that
     pulls its results in. Kept here so the sim has one place to look. */
  TS.Sim.prototype.recalcEnvironment = function () {
    this.derived = (TS.deriveEnvironment)
      ? TS.deriveEnvironment(this.env, this.params)
      : { cloudBase: 1000, lclHeight: 1000, condensationCoeff: 4,
          intensityCeiling: 1, shearLean: 0, swirlBias: 0 };
  };

  TS.Sim.prototype.setParams = function (patch) {
    Object.assign(this.params, patch);
    this.recalcEnvironment();
  };

  TS.Sim.prototype.setEnv = function (patch) {
    Object.assign(this.env, patch);
    this.recalcEnvironment();
  };


  /* ── Lifecycle envelope ──────────────────────────────────────────────
     Genesis ramp, mature plateau, decay into a rope. The rope stage is
     not merely "weaker": the vortex narrows and tilts as it stretches and
     is carried off by the parent storm flow, which is why the shape
     changes too. */

  TS.Sim.prototype.lifecycle = function (frac) {
    let intensity, width, ropeiness;
    if (frac < 0.16) {
      const t = smoothstep(frac / 0.16);
      intensity = t;
      width = 0.35 + 0.65 * t;
      ropeiness = 0.35 * (1 - t);
    } else if (frac < 0.68) {
      intensity = 1;
      width = 1;
      ropeiness = 0;
    } else {
      const t = smoothstep((frac - 0.68) / 0.32);
      intensity = 1 - 0.85 * t;
      width = 1 - 0.72 * t;
      ropeiness = t;
    }
    return { intensity, width, ropeiness };
  };


  /* ── Subvortices ─────────────────────────────────────────────────────
     Swirl ratio is the real control here. In laboratory vortex chambers,
     raising it walks the flow through single-cell -> vortex breakdown ->
     two-cell -> multiple vortices. We expose that ladder rather than a
     "multi-vortex: on/off" switch, because the ladder is the lesson.

     The sharp count threshold is ours, not nature's — tagged in the UI
     as [simplified here]. */

  TS.Sim.prototype.subvortexCount = function (S) {
    if (S < 1.15) return 0;
    return clamp(Math.floor(2 + (S - 1.15) * 3.6), 2, 6);
  };

  TS.Sim.prototype.updateSubvortices = function (dt) {
    const S = this.swirlNow;
    const want = this.alive ? this.subvortexCount(S) : 0;
    const list = this.subvortices;

    while (list.length > want) list.pop();
    while (list.length < want) {
      list.push({
        theta: this.subRng() * TAU,
        wob: TS.makeWobble(this.subRng.fork(), 2),
        strength: this.subRng.range(0.34, 0.56),
        size: this.subRng.range(0.12, 0.20),
        born: this.t,
        r: 0, x: 0, y: 0, vmax: 0, rmax: 1
      });
    }

    // Subvortices orbit at roughly half the local air speed — they are
    // features of the flow, not parcels being carried by it.
    const orbitR = 0.72 * this.rmax;
    const airSpeed = tangentialAt(orbitR, this.rmax, this.vmax, this.alpha);
    const omega = (airSpeed / Math.max(orbitR, 1)) * 0.55;

    for (let i = 0; i < list.length; i++) {
      const sv = list[i];
      sv.theta += omega * dt;
      const w = sv.wob(this.t);
      sv.r = orbitR * (1 + 0.12 * w);
      sv.vmax = this.vmax * sv.strength;
      sv.rmax = Math.max(4, this.rmax * sv.size);
      sv.x = this.center.x + Math.cos(sv.theta) * sv.r;
      sv.y = this.center.y + Math.sin(sv.theta) * sv.r;
    }
  };


  /* ── The step ────────────────────────────────────────────────────── */

  TS.Sim.prototype.step = function () {
    if (!this.alive) return;

    const p = this.params;
    const d = this.derived;
    const dt = DT;
    const frac = this.t / p.lifespan;
    const life = this.lifecycle(frac);

    // Intensity: envelope x environmental ceiling x fluctuation.
    // The environment sets what is *available*; it is not a power number.
    const fluct = 1 + p.fluctuation * 0.32 * this.wobbleV(this.t);
    const ceiling = d.intensityCeiling != null ? d.intensityCeiling : 1;
    this.vmax = Math.max(0, p.vmax * ceiling * life.intensity * fluct);

    const rFluct = 1 + p.fluctuation * 0.22 * this.wobbleR(this.t);
    this.rmax = Math.max(6, (p.width / 2) * life.width * rFluct);

    // Outer decay exponent: tighter vortices decay faster with radius.
    this.alpha = clamp(0.5 + 0.25 * (1 - clamp(this.rmax / 900, 0, 1)), 0.5, 0.78);

    this.swirlNow = clamp(p.swirl + p.multiVortex * 0.75 +
      (d.swirlBias || 0) - life.ropeiness * 0.5, 0.1, 2.6);

    this.deficit = deficitAt(0, this.rmax, this.vmax, this.alpha);

    // How far down the condensation funnel reaches. See sim-env.js — the
    // coefficient comes from cloud base and moisture, so a dry, high-based
    // storm can produce a fully damaging tornado under a stubby funnel.
    this.funnelBase = this.condensationFloor();
    // Remember how low it got while the tornado was actually doing
    // something. Reading the final value instead would always report a
    // lifted funnel, because by then the vortex has spun down.
    if (this.vmax > 20) {
      if (this.funnelBase < this.minFunnelBase) this.minFunnelBase = this.funnelBase;
      // A momentary touchdown during an intensity surge is not the same
      // as a funnel that was on the ground all afternoon, and the
      // post-mortem needs to be able to tell those apart.
      this._fbSum += this.funnelBase;
      this._fbN++;
      if (this.funnelBase < 40) this._fbGround++;
    }

    // Tilt: downshear lean, growing as the vortex ropes out.
    const shearLean = (d.shearLean || 0);
    const tw = this.wobbleT(this.t);
    const lean = shearLean * (0.4 + life.ropeiness * 1.6);
    this.tilt.x = this.dir.x * lean + 0.18 * lean * tw;
    this.tilt.y = this.dir.y * lean - 0.14 * lean * tw;

    // Track: heading curves at the requested rate.
    this.heading += (p.curvature / 60) * dt;
    const hdg = this.heading * Math.PI / 180;
    this.dir.x = Math.sin(hdg);
    this.dir.y = Math.cos(hdg);
    this.center.x += this.dir.x * p.forwardSpeed * dt;
    this.center.y += this.dir.y * p.forwardSpeed * dt;

    this.updateSubvortices(dt);

    if (this.vmax > this.peakVmax) this.peakVmax = this.vmax;
    if (this.rmax > this.peakRmax && this.vmax > 20) this.peakRmax = this.rmax;

    /* The strongest wind anywhere on the ground is not the rotational
       speed. On the right flank the translation adds to it, and a
       subvortex sitting there adds again. That sum is what structures
       actually feel, so it is the number the report has to quote — using
       the rotational speed alone made the survey estimate look as though
       it exceeded the wind the model had applied. */
    let subPeak = 0;
    for (let i = 0; i < this.subvortices.length; i++) {
      if (this.subvortices[i].vmax > subPeak) subPeak = this.subvortices[i].vmax;
    }
    const ground = this.vmax + p.forwardSpeed + subPeak;
    if (ground > this.peakGround) this.peakGround = ground;

    this.phase = frac < 0.16 ? 'genesis'
      : frac < 0.68 ? 'mature'
        : this.vmax > 18 ? 'decaying' : 'roping out';

    // Damage is applied by sim-damage.js, which reads this wind field and
    // writes into this.journal. Kept out of core so the physics file has
    // no opinion about what happens to be standing in the way.
    this._dmgTick = (this._dmgTick || 0) + 1;
    if (this._dmgTick >= DAMAGE_EVERY) {
      this._dmgTick = 0;
      if (TS.applyDamage) TS.applyDamage(this, dt * DAMAGE_EVERY);
    }
    if (this.visual && TS.updateDebris) {
      // 15 Hz is plenty for particles; the renderer interpolates anyway.
      this._debTick = (this._debTick || 0) + 1;
      if (this._debTick >= DEBRIS_EVERY) {
        this._debTick = 0;
        TS.updateDebris(this, dt * DEBRIS_EVERY);
      }
    }

    this.t += dt;

    this._pathAccum += dt;
    if (this._pathAccum >= 0.5) {
      this._pathAccum = 0;
      this.path.push({
        t: this.t, x: this.center.x, y: this.center.y,
        rmax: this.rmax, vmax: this.vmax
      });
    }

    this._histAccum += dt;
    if (this._histAccum >= 0.1) { this._histAccum = 0; this.snapshot(); }

    if (this.t >= p.lifespan) { this.alive = false; this.phase = 'dissipated'; }
  };


  /* Lowest altitude at which condensation occurs, given the deficit the
     vortex can produce. Below cloud base you need progressively more
     deficit to keep air saturated; condensationCoeff is Pa per metre of
     descent. When the vortex cannot supply enough, the funnel hangs. */

  /* How the funnel behaved over the life of the tornado, rather than at
     whatever instant you happened to ask. */
  TS.Sim.prototype.funnelSummary = function () {
    if (!this._fbN) return { avg: this.funnelBase, min: this.funnelBase, groundFrac: 0 };
    return {
      avg: this._fbSum / this._fbN,
      min: this.minFunnelBase < 1e8 ? this.minFunnelBase : this.funnelBase,
      groundFrac: this._fbGround / this._fbN
    };
  };

  TS.Sim.prototype.condensationFloor = function () {
    const d = this.derived;
    const base = d.cloudBase;
    const C = Math.max(0.4, d.condensationCoeff);
    const reach = this.deficit / C;                 // metres below cloud base
    return clamp(base - reach, 0, base);
  };

  /* The funnel visible radius at a given altitude. Returns ~0 where the
     vortex cannot hold condensation. This is what makes the silhouette a
     derived object rather than an artist cone. */

  TS.Sim.prototype.funnelRadiusAt = function (z) {
    const d = this.derived;
    const zNorm = clamp(z / Math.max(d.cloudBase, 1), 0, 1);
    const rmaxZ = this.rmax * shapeFlare(this.params.shape, zNorm);
    if (z >= d.cloudBase) return rmaxZ;
    const C = Math.max(0.4, d.condensationCoeff);
    const need = (d.cloudBase - z) * C;
    const r = radiusForDeficit(need, rmaxZ, this.vmax, this.alpha);
    // Condensation cannot be wider than the circulation carrying it. Near
    // cloud base the required deficit tends to zero and the solved radius
    // runs away, so the core radius at that height is the ceiling.
    if (!isFinite(r)) return rmaxZ;
    return Math.min(r, rmaxZ);
  };


  /* ── The wind field ──────────────────────────────────────────────────
     Ground-relative wind at a point. Rotational + radial inflow, plus
     every active subvortex, plus translation. Callers get the vector,
     not a magnitude, because the overlays and debris advection both
     need direction. */

  const _w = { u: 0, v: 0, w: 0, speed: 0, r: 0 };

  TS.Sim.prototype.windAt = function (x, y, out) {
    const o = out || _w;
    const p = this.params;

    let u = 0, v = 0;

    // Parent circulation
    const dx = x - this.center.x, dy = y - this.center.y;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r > 1e-3) {
      const vt = tangentialAt(r, this.rmax, this.vmax, this.alpha);
      // Inflow fraction falls off inside the core: air cannot converge
      // through the axis, it turns upward instead.
      const inflow = 0.32 * clamp(r / this.rmax, 0, 1);
      const vr = -vt * inflow;
      const tx = -dy / r, ty = dx / r;        // counter-clockwise (NH)
      u += vt * tx + vr * (dx / r);
      v += vt * ty + vr * (dy / r);
    }

    // Subvortices
    const list = this.subvortices;
    for (let i = 0; i < list.length; i++) {
      const sv = list[i];
      const sx = x - sv.x, sy = y - sv.y;
      const sr = Math.sqrt(sx * sx + sy * sy);
      if (sr < 1e-3) continue;
      const svt = tangentialAt(sr, sv.rmax, sv.vmax, 0.62);
      u += svt * (-sy / sr);
      v += svt * (sx / sr);
    }

    // Translation — added last, and the reason the right side is worse.
    u += this.dir.x * p.forwardSpeed;
    v += this.dir.y * p.forwardSpeed;

    o.u = u; o.v = v;
    o.r = r;
    o.speed = Math.sqrt(u * u + v * v);
    // Vertical motion is opt-in: it costs three exp() calls, and the
    // damage pass — the hottest caller by a wide margin — never wants it.
    o.w = 0;
    return o;
  };

  /* Same as windAt but fills in vertical motion. Debris and the updraft
     overlays use this; nothing on the damage path should. */
  TS.Sim.prototype.windAt3 = function (x, y, out) {
    const o = this.windAt(x, y, out);
    o.w = this.verticalAt(o.r);
    return o;
  };

  /* Vertical motion. At low swirl the core is a single updraft; past
     breakdown the core carries a downdraft with the updraft displaced
     into an annulus near Rmax. Both are real, and the overlays should
     be able to show the difference. */

  TS.Sim.prototype.verticalAt = function (r) {
    const rn = r / Math.max(this.rmax, 1);
    const twoCell = clamp((this.swirlNow - 0.85) / 0.6, 0, 1);
    const single = Math.exp(-rn * rn * 1.6);
    const annulus = Math.exp(-Math.pow((rn - 1) * 1.9, 2));
    const core = -0.55 * Math.exp(-rn * rn * 3.2);
    const scale = this.vmax * 0.42;
    return scale * lerp(single, annulus + core, twoCell);
  };

  /* Convenience: ground-relative speed only. Hot path for damage. */
  TS.Sim.prototype.speedAt = function (x, y) {
    return this.windAt(x, y, _w).speed;
  };


  /* ── Snapshots ───────────────────────────────────────────────────────
     Compact enough to keep a few thousand. Damage is *not* stored here —
     it lives in the monotone journal, and scrubbing replays that journal
     to an index. Storing damage per frame would be quadratic. */

  TS.Sim.prototype.snapshot = function () {
    this.history.push({
      t: this.t,
      x: this.center.x, y: this.center.y,
      vmax: this.vmax, rmax: this.rmax,
      alpha: this.alpha, swirl: this.swirlNow,
      deficit: this.deficit, funnelBase: this.funnelBase,
      heading: this.heading, phase: this.phase,
      subs: this.subvortices.length,
      debrisTop: this.debrisTop,
      journalLen: this.journal.length
    });
  };

  /* Restore display state to a snapshot index. Renderers read from the
     sim, so this is all that scrubbing needs to move. */
  TS.Sim.prototype.seekTo = function (index) {
    const h = this.history[clamp(index, 0, this.history.length - 1)];
    if (!h) return null;
    this.t = h.t;
    this.center.x = h.x; this.center.y = h.y;
    this.vmax = h.vmax; this.rmax = h.rmax;
    this.alpha = h.alpha; this.swirlNow = h.swirl;
    this.deficit = h.deficit; this.funnelBase = h.funnelBase;
    this.heading = h.heading; this.phase = h.phase;
    this.debrisTop = h.debrisTop;
    const hdg = this.heading * Math.PI / 180;
    this.dir.x = Math.sin(hdg); this.dir.y = Math.cos(hdg);
    if (TS.rewindDamageTo) TS.rewindDamageTo(this, h.journalLen);
    return h;
  };

  /* Run headless to completion — used by What-If to produce a comparison
     run without ever drawing it. Same seed, one parameter changed. */
  TS.Sim.prototype.runToEnd = function (maxSteps) {
    const cap = maxSteps || 40000;
    let n = 0;
    while (this.alive && n++ < cap) this.step();
    return this;
  };

})(window.TS);
