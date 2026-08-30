/* ═══════════════════════════════════════════════════════════════════════
   sim-props.js — the things that are not damage indicators
   ───────────────────────────────────────────────────────────────────────
   THE EF SCALE HAS NO DAMAGE INDICATOR FOR A CAR.

   That is not an oversight in this file, it is the actual state of the
   scale. All twenty-eight published indicators are buildings, towers,
   poles, or trees, because a survey has to reason from something whose
   construction is knowable. A pickup that has been rolled four hundred
   metres tells you a great deal about how the day went and almost
   nothing you can defend about wind speed, because nobody can tell you
   afterwards whether its handbrake was on.

   So everything in this file is damaged by exactly the same wind field
   as everything else, throws exactly the same debris, and is kept in a
   list that TS.assessDamage never opens. Props cannot move the rating.
   verify.js §12 runs a violent tornado twice — once with props, once
   with the list emptied — and fails if the two ratings differ by so much
   as a single mph.

   Which makes this file a second telling of the piece's whole lesson.
   The first is that a violent tornado over open farmland rates EF-0
   because there was nothing there to rate. The second is that the pickup
   wrapped around a tree does not count either.

   The thresholds below are OURS. They are reasonable, they are sourced
   where a source exists — highway crosswind advisories put a loaded
   semi-trailer at risk of blow-over well below hurricane force, which is
   why the biggest thing on the list is also the first to go — and they
   are emphatically not survey data.  [simplified here]
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp;
  const MPH = TS.MPH;

  /* Authored in mph so they sit alongside the EF thresholds in
     sim-damage.js and can be read against them — the instructive part is
     that a semi tips at a wind that would not scratch a house. Converted
     to m/s once, at load, exactly like the indicator ladders. */

  const SPECS = {
    car: {
      name: 'Passenger car', w: 1.9, h: 1.5, d: 4.6, fling: 'vehicle',
      mph: [95, 125],
      states: ['Slid or spun on the spot', 'Rolled and carried downwind']
    },
    pickup: {
      name: 'Pickup truck', w: 2.0, h: 1.9, d: 5.6, fling: 'vehicle',
      mph: [100, 133],
      states: ['Slid or spun on the spot', 'Rolled and carried downwind']
    },
    semi: {
      name: 'Semi-trailer', w: 2.6, h: 4.1, d: 16.2, fling: 'trailer',
      mph: [70, 100],
      states: ['Blown onto its side', 'Trailer separated and tumbled']
    },
    tractor: {
      name: 'Farm tractor', w: 2.4, h: 3.0, d: 5.0, fling: 'trailer',
      mph: [110, 145],
      states: ['Shifted and tipped', 'Overturned and moved']
    },
    fence: {
      name: 'Fence line', w: 0.2, h: 1.8, d: 12.0, fling: 'clutter',
      mph: [55, 70],
      states: ['Panels leaning or loose', 'Sections flattened and scattered']
    },
    mailbox: {
      name: 'Mailbox', w: 0.4, h: 1.2, d: 0.4, fling: 'clutter',
      mph: [60, 80],
      states: ['Bent over', 'Post pulled and gone']
    },
    cow: {
      name: 'Livestock', w: 0.8, h: 1.5, d: 2.4, fling: 'livestock',
      mph: [80, 105],
      states: ['Driven downwind against the fence', 'Carried off the pasture']
    },
    /* Not a prop so much as a rumour. Sits in the world at all times,
       drawn only in Tormato mode, and does nothing at all except notice
       that it has been run over. See ui.js. */
    salamander: {
      name: 'Salamander', w: 13.0, h: 2.6, d: 30.0, fling: null,
      mph: [45, 45], hidden: true,
      states: ['Noticed', 'Noticed']
    }
  };

  // mph -> m/s, once.
  for (const k in SPECS) {
    const sp = SPECS[k];
    sp.ms = sp.mph.map(function (v) { return v / MPH; });
    sp.minWind = sp.ms[0] * 0.8;
  }

  TS.PROP_SPECS = SPECS;

  /* Props store their state in a field called `dod` purely so that
     TS.rewindDamageTo works on them with no changes at all — it already
     just replays `e.ref.dod = e.from` over a monotone journal. Naming it
     anything more honest would have meant a second rewind path, and two
     rewind paths is how a timeline quietly desynchronises. */

  const _wv = { u: 0, v: 0, w: 0, speed: 0, r: 0 };

  TS.applyPropDamage = function (sim, dt) {
    const w = sim.terrain;
    if (!w || !w._idxP || !w.props || !w.props.length) return;

    const reach = clamp(sim.rmax * 3.2 + 180, 260, 1100);
    const hit = TS.queryPropIndex(w._idxP, sim.center.x, sim.center.y, reach, sim._hitP);

    for (let i = 0; i < hit.length; i++) {
      const pr = hit[i];
      const spec = SPECS[pr.kind];
      if (!spec) continue;

      sim.windAt(pr.x, pr.y, _wv);
      const sp = _wv.speed;
      if (sp > pr.peakWind) pr.peakWind = sp;

      // Which way it got shoved. The renderer leans displaced props into
      // this, the same way trees lean into their recorded wind vector.
      if (sp > 1 && pr.dod < 2) { pr.pushX = _wv.u / sp; pr.pushY = _wv.v / sp; }

      let nd = 0;
      for (let j = 0; j < spec.ms.length; j++) {
        if (pr.peakWind >= spec.ms[j] * pr.quality) nd = j + 1; else break;
      }
      if (nd <= pr.dod) continue;

      const from = pr.dod;
      pr.dod = nd;
      sim.journal.push({
        t: sim.t, kind: 'p', id: pr.id, ref: pr,
        from: from, to: nd, wind: sp, eff: sp, dwell: 0
      });

      // The egg. Sets a flag and nothing else — no DOM in this layer, so
      // ui.js is what notices. Only the Tormato is capable of finding it.
      if (pr.kind === 'salamander') {
        if (sim.mode === 'tormato') sim.salamanderHit = true;
        continue;
      }

      // Lofted is the rung at which it stops being scenery.
      if (nd >= 2 && from < 2 && TS.flingFrom && spec.fling) {
        TS.flingFrom(sim, {
          x: pr.x, y: pr.y, z: pr.h * 0.6,
          w: pr.w, h: pr.h, d: pr.d,
          kind: spec.fling, count: 1, mat: pr.kind === 'cow' ? 'livestock' : 'vehicle'
        });
      }
      if (TS.spawnDebris) TS.spawnDebris(sim, pr.x, pr.y, 2, 'structure');
    }
  };


  /* sim-damage.js builds the props index alongside the structure and tree
     ones and stashes it on the terrain, so only the lookup lives here.
     The one thing it has to agree with that file about is the cell size. */

  const CELL = 200;

  TS.queryPropIndex = function (idx, x, y, radius, out) {
    out = out || [];
    out.length = 0;
    const cells = idx.cells, span = idx.span, extent = idx.extent;
    const x0 = Math.max(0, Math.floor((x - radius + extent) / CELL));
    const x1 = Math.min(span - 1, Math.floor((x + radius + extent) / CELL));
    const y0 = Math.max(0, Math.floor((y - radius + extent) / CELL));
    const y1 = Math.min(span - 1, Math.floor((y + radius + extent) / CELL));
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const bucket = cells[cy * span + cx];
        if (bucket) for (let i = 0; i < bucket.length; i++) out.push(bucket[i]);
      }
    }
    return out;
  };


  /* What the inspector says when you click one. The point of the last
     line is that it is not an apology — it is the same reasoning that
     produces an EF-0 over open farmland, applied to a truck. */

  TS.explainProp = function (pr) {
    const spec = SPECS[pr.kind];
    if (!spec) return null;
    return {
      name: spec.name,
      state: pr.dod > 0 ? spec.states[Math.min(pr.dod, spec.states.length) - 1] : 'Undisturbed',
      peakMph: Math.round(pr.peakWind * MPH),
      thresholds: spec.mph,
      rated: false,
      note: 'The EF scale has no damage indicator for this. These thresholds ' +
            'are ours — reasonable, not surveyed — and nothing that happens to ' +
            'it reaches the rating.'
    };
  };

})(window.TS);
