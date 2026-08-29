/* ═══════════════════════════════════════════════════════════════════════
   sim-debris.js — lofted material
   ───────────────────────────────────────────────────────────────────────
   Debris is a CONSEQUENCE, never an effect. Particles are born where the
   ground scours or where a structure actually fails, and from then on
   they are carried by the same wind field that broke the thing they came
   from. Nothing here is on a timer.

   That matters twice over. Visually it is why the debris cloud leans and
   fountains the way it does. Scientifically it is what feeds the radar
   debris signature in render-radar.js — the sim earns that signature by
   actually having material in the air, rather than drawing one because
   the tornado looks strong.
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp;
  const MAX_PARTICLES = 2600;
  const G = 9.81;

  /* Per-kind aerodynamics. `follow` is how tightly the particle tracks the
     air (dust is nearly a tracer; a roof panel is not), `lift` is how much
     of the vortex updraft it feels, `fall` is terminal-ish settling. */
  const KINDS = {
    dust:       { follow: 3.2, lift: 1.00, fall: 0.35, size: [0.6, 2.2], life: [7, 15] },
    vegetation: { follow: 2.1, lift: 0.82, fall: 0.60, size: [1.0, 3.0], life: [6, 13] },
    structure:  { follow: 1.2, lift: 0.55, fall: 1.00, size: [1.4, 4.5], life: [8, 18] }
  };

  const _w = { u: 0, v: 0, w: 0, speed: 0, r: 0 };


  TS.spawnDebris = function (sim, x, y, count, kind) {
    if (!sim.visual) return;
    const list = sim.debris || (sim.debris = []);
    const k = KINDS[kind] || KINDS.dust;
    const rng = sim.debrisRng;
    const load = sim.params.debrisLoading;

    // The debris-loading control scales how much material a given failure
    // puts into the air — dry loose soil versus wet sod, roughly.
    const n = Math.max(1, Math.round(count * (0.35 + load * 1.5)));

    for (let i = 0; i < n; i++) {
      const life = rng.range(k.life[0], k.life[1]);
      const p = {
        x: x + rng.range(-6, 6),
        y: y + rng.range(-6, 6),
        z: rng.range(0.5, 6),
        vx: rng.range(-4, 4),
        vy: rng.range(-4, 4),
        vz: rng.range(1, 9),
        size: rng.range(k.size[0], k.size[1]),
        spin: rng.range(-6, 6),
        phase: rng() * TS.TAU,
        kind,
        k,
        life,
        maxLife: life,
        settled: false
      };
      // Recycle round-robin once full rather than shifting the array —
      // shift() is O(n) and this is called thousands of times per run.
      if (list.length >= MAX_PARTICLES) {
        sim._debrisCursor = (sim._debrisCursor || 0);
        list[sim._debrisCursor] = p;
        sim._debrisCursor = (sim._debrisCursor + 1) % MAX_PARTICLES;
      } else {
        list.push(p);
      }
    }
  };


  TS.updateDebris = function (sim, dt) {
    const list = sim.debris;
    if (!list || !list.length) return;

    let top = 0;
    let nearCount = 0;
    const cx = sim.center.x, cy = sim.center.y;
    const nearR = Math.max(sim.rmax * 3, 400);

    let write = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) continue;

      const k = p.k;

      if (!p.settled) {
        sim.windAt3(p.x, p.y, _w);

        // Horizontal: relax toward the air, at a rate set by how heavy
        // the particle is. Heavy debris lags, which is what makes it fly
        // outward rather than orbiting neatly.
        const f = k.follow * dt;
        p.vx += (_w.u - p.vx) * clamp(f, 0, 1);
        p.vy += (_w.v - p.vy) * clamp(f, 0, 1);

        // Vertical: the vortex updraft, weakening with height, against
        // gravity. Only the core can hold material high.
        const heightFall = Math.exp(-p.z / 900);
        const up = _w.w * k.lift * heightFall;
        p.vz += (up - p.vz) * clamp(k.follow * 0.6 * dt, 0, 1);
        p.vz -= G * k.fall * dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;

        if (p.z <= 0) {
          p.z = 0;
          if (Math.abs(p.vz) < 4 && _w.speed < 22) {
            p.settled = true;
            p.vx = p.vy = p.vz = 0;
            p.life = Math.min(p.life, 2.5);   // fade out once it lands
          } else {
            p.vz = Math.abs(p.vz) * 0.35;     // skip along the ground
          }
        }
        if (p.z > top) top = p.z;
        const dx = p.x - cx, dy = p.y - cy;
        if (dx * dx + dy * dy < nearR * nearR && p.z > 30) nearCount++;
      }

      list[write++] = p;
    }
    list.length = write;

    sim.debrisTop = top;
    // Concentration proxy, normalised. Feeds the radar debris signature
    // and the narration rule about lofting height.
    sim.debrisLoad = clamp(nearCount / 700, 0, 1);
  };


  /* Sample debris concentration in a disc — used by the radar to build a
     debris signature from what is genuinely in the air. */
  TS.debrisNear = function (sim, x, y, radius) {
    const list = sim.debris;
    if (!list) return 0;
    let n = 0;
    const r2 = radius * radius;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.z < 12) continue;
      const dx = p.x - x, dy = p.y - y;
      if (dx * dx + dy * dy < r2) n++;
    }
    return n;
  };

})(window.TS);
