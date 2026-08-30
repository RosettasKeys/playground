/* ═══════════════════════════════════════════════════════════════════════
   sim-fling.js — the things that leave the ground whole
   ───────────────────────────────────────────────────────────────────────
   sim-debris.js carries thousands of PARTICLES: specks that only need a
   position and a tint. This file carries a couple of hundred BODIES —
   pieces big enough that you can see what they used to be. A roof. A wall
   section. A pickup. An entire house.

   The distinction earns its keep because those two things want opposite
   treatment. A speck needs to be cheap and numerous. A roof needs size,
   orientation and a tumble, and it needs to still be lying there ten
   seconds later, because where the wreckage came to rest is exactly what
   a damage survey walks the ground to map.

   Nothing here decides that something broke. sim-damage.js does that,
   from the wind field and the published damage-indicator ladders, and
   only then calls in here. A flung body is a CONSEQUENCE of a degree of
   damage that was already going to be reached — never a cause of one,
   and never an effect on a timer.

   Once airborne, a body is carried by the same wind field that broke it,
   through the same relaxation model sim-debris.js uses. It simply has
   more mass and less follow, which is the entire reason a roof panel
   sails and a brick wall does not.  [simplified here — a drag model, not
   rigid-body dynamics. Real debris flight involves lift, autorotation and
   tumbling aerodynamics that a browser has no business attempting.]
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp;
  const G = 9.81;

  /* Well under the particle budget on purpose. These cost a matrix each,
     and past a couple of hundred the eye stops reading them as objects
     and starts reading them as noise — at which point they should have
     been particles. */
  const MAX_BODIES = 260;

  /* Per-kind aerodynamics, the same three constants sim-debris.js uses:
     `follow` is how quickly it picks up the air velocity, `lift` how much
     of the vortex updraft it feels, `fall` its settling rate. `shape` is
     the only thing in here the renderer needs to read. */
  const KINDS = {
    roof:      { shape: 'slab',  follow: 1.60, lift: 0.95, fall: 0.55, tumble: [2.0, 7.0] },
    wall:      { shape: 'slab',  follow: 1.30, lift: 0.70, fall: 0.80, tumble: [1.0, 5.0] },
    whole:     { shape: 'block', follow: 0.70, lift: 0.42, fall: 1.05, tumble: [0.4, 2.0] },
    vehicle:   { shape: 'block', follow: 0.55, lift: 0.34, fall: 1.15, tumble: [0.6, 3.0] },
    trailer:   { shape: 'block', follow: 0.75, lift: 0.50, fall: 1.00, tumble: [0.5, 2.5] },
    crown:     { shape: 'crown', follow: 1.90, lift: 0.88, fall: 0.62, tumble: [1.0, 4.0] },
    clutter:   { shape: 'stick', follow: 2.40, lift: 1.00, fall: 0.48, tumble: [3.0, 10.0] },
    livestock: { shape: 'block', follow: 1.40, lift: 0.72, fall: 0.85, tumble: [1.0, 4.0] },
    tomato:    { shape: 'orb',   follow: 2.20, lift: 0.92, fall: 0.58, tumble: [2.0, 8.0] }
  };
  TS.FLING_KINDS = KINDS;

  const _w = { u: 0, v: 0, w: 0, speed: 0, r: 0 };


  /* ── Spawning ────────────────────────────────────────────────────────
     A body starts very nearly at rest. That is deliberate: it is the
     relaxation in updateFlung that then accelerates it toward the air,
     so how far a roof travels is decided by the wind actually there
     rather than by a launch impulse chosen for effect. A marginal failure
     in 40 m/s flops into the yard; the same roof in 90 m/s goes over the
     treeline. Neither outcome is written down anywhere. */

  TS.flingFrom = function (sim, o) {
    if (!sim.visual) return;                  // headless runs skip all of this
    const list = sim.flung || (sim.flung = []);
    const k = KINDS[o.kind] || KINDS.whole;
    const rng = sim.flingRng;

    const count = Math.max(1, o.count || 1);
    // Splitting one object into n pieces roughly conserves its footprint:
    // three roof panels are each about a third of the roof.
    const f = 1 / Math.sqrt(count);

    sim.windAt3(o.x, o.y, _w);

    for (let i = 0; i < count; i++) {
      const b = {
        x: o.x + rng.range(-o.w, o.w) * 0.4,
        y: o.y + rng.range(-o.d, o.d) * 0.4,
        z: Math.max(0.4, (o.z || o.h || 2) * rng.range(0.55, 1.0)),

        // Near rest, plus a small share of the local air. The wind field
        // does the rest of the work in updateFlung.
        vx: rng.range(-3, 3) + _w.u * 0.15,
        vy: rng.range(-3, 3) + _w.v * 0.15,
        vz: rng.range(1.5, 5) + Math.max(0, _w.w) * 0.25 * k.lift,

        sx: Math.max(0.3, o.w * f * rng.range(0.7, 1.15)),
        sy: Math.max(0.2, o.h * rng.range(0.25, 0.6)),
        sz: Math.max(0.3, o.d * f * rng.range(0.7, 1.15)),

        // Tumble about a fixed random axis. Not physical, but a piece
        // that does not rotate reads as a sprite rather than an object.
        ax: rng.range(-1, 1), ay: rng.range(-1, 1), az: rng.range(-1, 1),
        ang: rng() * TS.TAU,
        spin: rng.range(k.tumble[0], k.tumble[1]) * (rng.chance(0.5) ? 1 : -1),

        kind: o.kind,
        k: k,
        mat: o.mat || 'wood',
        bornT: sim.t,
        settled: false
      };

      // A whole object keeps its real proportions — a house that lifts off
      // its slab has to still look like that house while it is in the air.
      if (count === 1) { b.sx = o.w; b.sy = o.h; b.sz = o.d; }

      push(sim, list, b);
    }

    /* Tormato mode throws produce off everything it breaks. Same call,
       same wind, same budget — the orbs are just more bodies. */
    if (sim.mode === 'tormato' && o.kind !== 'tomato') {
      TS.flingFrom(sim, {
        x: o.x, y: o.y, z: o.z || o.h || 2,
        w: 1.6, h: 1.6, d: 1.6,
        kind: 'tomato', count: Math.min(4, count + 1), mat: 'tomato'
      });
    }
  };

  /* At capacity, retire the oldest SETTLED body first. Wreckage on the
     ground is worth less than something in the air the eye is following,
     and this keeps the debris field concentrated near the action rather
     than uniformly thinned along the whole track. */
  function push(sim, list, b) {
    if (list.length < MAX_BODIES) { list.push(b); return; }
    let best = -1, bestT = Infinity;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (c.settled && c.bornT < bestT) { bestT = c.bornT; best = i; }
    }
    if (best < 0) {
      sim._flingCursor = (sim._flingCursor || 0);
      best = sim._flingCursor;
      sim._flingCursor = (sim._flingCursor + 1) % MAX_BODIES;
    }
    list[best] = b;
  }


  /* ── Flight ──────────────────────────────────────────────────────────
     The same model as the particles, with one addition: a body that comes
     to rest STAYS at rest, and stays in the array. It costs nothing per
     frame after that, and it is the whole reason the ground afterwards
     reads as a damage path instead of a clean field. */

  TS.updateFlung = function (sim, dt) {
    const list = sim.flung;
    if (!list || !list.length) return;

    let airborne = 0;

    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (b.settled) continue;

      const k = b.k;
      sim.windAt3(b.x, b.y, _w);

      const f = clamp(k.follow * dt, 0, 1);
      b.vx += (_w.u - b.vx) * f;
      b.vy += (_w.v - b.vy) * f;

      const heightFall = Math.exp(-b.z / 900);
      const up = _w.w * k.lift * heightFall;
      b.vz += (up - b.vz) * clamp(k.follow * 0.6 * dt, 0, 1);
      b.vz -= G * k.fall * dt;

      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;

      // Spin bleeds off as the body matches the air. A piece drifting
      // along with the flow should not still be whirling like one that
      // came off a wall a moment ago.
      const rel = Math.abs(_w.speed - Math.sqrt(b.vx * b.vx + b.vy * b.vy));
      b.ang += b.spin * dt;
      b.spin *= (1 - clamp(dt * 0.35, 0, 0.5));
      if (rel > 20) b.spin += (b.spin >= 0 ? 1 : -1) * dt * 0.8;

      const floor = b.sy * 0.35;
      if (b.z <= floor) {
        b.z = floor;
        if (Math.abs(b.vz) < 5 && _w.speed < 26) {
          b.settled = true;
          b.vx = b.vy = b.vz = 0;
          b.spin = 0;
          // Lie down. A settled slab left on its edge reads as a wall
          // still standing, which is the opposite of what just happened.
          b.ax = 1; b.ay = 0; b.az = 0;
          b.ang = Math.PI / 2;
        } else {
          b.vz = Math.abs(b.vz) * 0.32;        // skip along, then tumble on
          b.vx *= 0.86; b.vy *= 0.86;
        }
      }
      if (!b.settled) airborne++;
    }

    sim.flungAir = airborne;
  };


  /* Rewind. The journal replays degrees of damage exactly, so the only
     thing left to undo is the wreckage that damage produced. Every body
     remembers when it was born, which makes scrubbing backward a filter
     rather than a re-simulation — and stops a flattened barn from lying
     in the yard of the barn that has just stood back up. */

  TS.rewindFlung = function (sim, t) {
    const list = sim.flung;
    if (!list || !list.length) return;
    let write = 0;
    for (let i = 0; i < list.length; i++) {
      if (list[i].bornT <= t) list[write++] = list[i];
    }
    list.length = write;
  };

})(window.TS);
