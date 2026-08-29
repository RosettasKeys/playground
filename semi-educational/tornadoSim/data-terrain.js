/* ═══════════════════════════════════════════════════════════════════════
   data-terrain.js — the six landscapes
   ───────────────────────────────────────────────────────────────────────
   Every environment is generated from the seed, never hand-placed, so a
   run is reproducible and What-If can rebuild an identical world with one
   parameter changed.

   Structures carry a real EF-scale DAMAGE INDICATOR code (`di`). That is
   not decoration: the post-storm rating is computed by asking which
   indicators failed and at what degree, exactly as a real damage survey
   does. See sim-damage.js for the ladders.
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp;
  const TAU = Math.PI * 2;

  const EXTENT = 3200;                  // metres from centre; world is 6.4 km
  TS.EXTENT = EXTENT;


  /* Jittered-grid scatter — cheap blue noise. Pure Poisson clumps badly
     and reads as random litter; a jittered grid reads as land use. */

  function scatter(rng, spacing, jitter, extent, fn) {
    const n = Math.ceil((extent * 2) / spacing);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x = -extent + (i + 0.5) * spacing + rng.range(-jitter, jitter);
        const y = -extent + (j + 0.5) * spacing + rng.range(-jitter, jitter);
        if (Math.abs(x) > extent || Math.abs(y) > extent) continue;
        fn(x, y, i, j);
      }
    }
  }


  /* ── Structure factory ───────────────────────────────────────────────
     `quality` is the seeded construction-quality draw, 0…1. It is what
     lets two identical houses on the same street rate differently — which
     is not a simulation artefact but a faithful reflection of how the EF
     scale works, since every degree of damage carries a lower and upper
     bound wind speed, not a single value. */

  let _nextId = 1;

  function makeStructure(rng, di, x, y, opts) {
    opts = opts || {};
    const spec = TS.DI_SPECS[di];
    return {
      id: _nextId++,
      di,
      x, y,
      rot: opts.rot != null ? opts.rot : rng.range(0, TAU),
      w: opts.w != null ? opts.w : spec.w * rng.range(0.85, 1.15),
      d: opts.d != null ? opts.d : spec.d * rng.range(0.85, 1.15),
      h: opts.h != null ? opts.h : spec.h * rng.range(0.9, 1.1),
      quality: rng.normal(0.5, 0.19),      // construction quality draw
      dod: 0,                              // degree of damage reached
      peakWind: 0,                         // m/s ever experienced
      load: 0                              // integrated wind loading
    };
  }

  function makeTree(rng, x, y, kind) {
    return {
      x, y,
      kind,                                 // 'hardwood' | 'softwood'
      h: kind === 'softwood' ? rng.range(9, 20) : rng.range(7, 17),
      r: rng.range(2.2, 5.0),
      quality: rng.normal(0.5, 0.2),
      dod: 0,
      peakWind: 0,
      bend: 0,                              // live, driven by local wind
      bendX: 0, bendY: 0
    };
  }


  /* ── Road networks ───────────────────────────────────────────────────
     Rural is a section-line grid (the US survey grid, one mile apart);
     suburbs curve; towns are a tight grid. Roads matter beyond looks —
     they are how the eye reads scale and direction of travel. */

  function gridRoads(rng, spacing, extent, width) {
    const roads = [];
    for (let v = -extent; v <= extent; v += spacing) {
      const j = rng.range(-spacing * 0.04, spacing * 0.04);
      roads.push({ pts: [[v + j, -extent], [v + j, extent]], width, kind: 'road' });
      roads.push({ pts: [[-extent, v + j], [extent, v + j]], width, kind: 'road' });
    }
    return roads;
  }

  function curvedRoads(rng, count, extent, width) {
    const roads = [];
    for (let i = 0; i < count; i++) {
      const pts = [];
      let x = rng.range(-extent, extent);
      let y = -extent;
      let ang = Math.PI / 2 + rng.range(-0.3, 0.3);
      const steps = 26;
      for (let s = 0; s <= steps; s++) {
        pts.push([x, y]);
        ang += rng.range(-0.16, 0.16);
        const step = (extent * 2) / steps;
        x += Math.cos(ang) * step * 0.5;
        y += Math.sin(ang) * step;
      }
      roads.push({ pts, width, kind: 'road' });
    }
    return roads;
  }


  /* ── Power lines ─────────────────────────────────────────────────────
     Poles are structures in their own right (DI: TP) because line failure
     is one of the most common and lowest-threshold damage indicators —
     and because "the power went out" is the first thing anyone notices. */

  function powerline(rng, pts, out) {
    const poles = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(1, Math.round(len / 80));
      for (let k = 0; k < n; k++) {
        const t = k / n;
        const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
        const pole = makeStructure(rng, 'TP', px, py, { rot: 0 });
        poles.push(pole);
        out.push(pole);
      }
    }
    return poles;
  }


  /* ── Field crops ─────────────────────────────────────────────────────
     Quads of differing crop tint. Their only job is to make the ground
     legible and to give the scour swath something to cut across. */

  function makeFields(rng, spacing, extent) {
    const fields = [];
    const crops = ['wheat', 'corn', 'soy', 'fallow', 'pasture'];
    scatter(rng, spacing, spacing * 0.02, extent, (x, y) => {
      fields.push({
        x, y,
        w: spacing * rng.range(0.86, 0.98),
        h: spacing * rng.range(0.86, 0.98),
        crop: rng.pick(crops),
        tone: rng.range(0, 1)
      });
    });
    return fields;
  }


  /* ═══════════════════════════════════════════════════════════════════
     THE SIX ENVIRONMENTS
     ═══════════════════════════════════════════════════════════════════ */

  const BUILDERS = {

    /* Open agricultural fields — the control case, and the one that makes
       the whole EF lesson land: a violent tornado here leaves almost
       nothing to rate. */
    openField(rng, w) {
      w.fields = makeFields(rng, 420, EXTENT);
      w.roads = gridRoads(rng, 1600, EXTENT, 7);
      scatter(rng, 220, 90, EXTENT, (x, y) => {
        if (rng.chance(0.10)) w.trees.push(makeTree(rng, x, y,
          rng.chance(0.6) ? 'hardwood' : 'softwood'));
      });
      // Deliberately no buildings at all. The only damage indicators out
      // here are trees and a single line of poles — which is the whole
      // point: a violent tornado crossing this leaves a survey team with
      // almost nothing to measure, and the rating collapses toward the
      // weakest thing it happened to touch.
      w.lines.push({ pts: [[-EXTENT, 200], [EXTENT, 200]] });
    },

    /* Rural farmland — scattered houses, barns, silos, windbreaks. */
    farmland(rng, w) {
      w.fields = makeFields(rng, 360, EXTENT);
      w.roads = gridRoads(rng, 1100, EXTENT, 8);
      scatter(rng, 560, 190, EXTENT, (x, y) => {
        if (!rng.chance(0.62)) return;
        const rot = rng.range(0, TAU);
        w.structures.push(makeStructure(rng, 'FR12', x, y, { rot }));
        w.structures.push(makeStructure(rng, 'SBO', x + Math.cos(rot + 1) * 55,
          y + Math.sin(rot + 1) * 55, { rot }));
        if (rng.chance(0.45)) {
          w.structures.push(makeStructure(rng, 'SILO', x + Math.cos(rot - 1) * 48,
            y + Math.sin(rot - 1) * 48, { rot: 0 }));
        }
        if (rng.chance(0.30)) {
          w.structures.push(makeStructure(rng, 'MHSF', x + rng.range(-90, 90),
            y + rng.range(-90, 90)));
        }
        // Windbreak: a tight row of softwoods on the upwind side.
        const n = rng.int(5, 11);
        for (let i = 0; i < n; i++) {
          w.trees.push(makeTree(rng, x - 80 + i * 9 + rng.range(-3, 3),
            y - 70 + rng.range(-4, 4), 'softwood'));
        }
      });
      scatter(rng, 300, 120, EXTENT, (x, y) => {
        if (rng.chance(0.16)) w.trees.push(makeTree(rng, x, y, 'hardwood'));
      });
      w.lines.push({ pts: [[-EXTENT, -500], [EXTENT, -500]] });
      w.lines.push({ pts: [[600, -EXTENT], [600, EXTENT]] });
    },

    /* Small town — a compact core surrounded by farmland. The contrast
       across the town edge is the single clearest demonstration of why
       the same tornado earns different ratings. */
    smallTown(rng, w) {
      BUILDERS.farmland(rng, w);
      const cx = rng.range(-500, 500), cy = rng.range(-500, 500);
      const R = 700;
      w.roads = w.roads.concat(gridRoads(rng, 120, R, 9)
        .map(r => ({ pts: r.pts.map(p => [p[0] + cx, p[1] + cy]), width: r.width, kind: 'street' })));

      scatter(rng, 62, 12, R, (x, y) => {
        const px = x + cx, py = y + cy;
        const d = Math.hypot(x, y);
        if (d > R) return;
        const core = d < 190;
        if (core) {
          if (rng.chance(0.55)) w.structures.push(makeStructure(rng, 'SM', px, py));
          else if (rng.chance(0.5)) w.structures.push(makeStructure(rng, 'MBS', px, py));
          else w.structures.push(makeStructure(rng, 'LRB', px, py));
        } else if (rng.chance(0.72)) {
          w.structures.push(makeStructure(rng, 'FR12', px, py));
        }
      });
      w.structures.push(makeStructure(rng, 'ESFR', cx + 260, cy - 240));
      w.structures.push(makeStructure(rng, 'CHBS', cx - 210, cy + 180));
      w.structures.push(makeStructure(rng, 'TWR', cx + 330, cy + 300, { rot: 0 }));
      scatter(rng, 74, 22, R, (x, y) => {
        if (Math.hypot(x, y) < R && rng.chance(0.34)) {
          w.trees.push(makeTree(rng, x + cx, y + cy, 'hardwood'));
        }
      });
      w.town = { x: cx, y: cy, r: R };
    },

    /* Suburban neighbourhood — curvilinear streets, near-uniform housing
       stock, and a scatter of mobile homes at the edge. Uniform stock is
       useful: it makes the wind-field asymmetry legible in the damage. */
    suburb(rng, w) {
      w.fields = makeFields(rng, 520, EXTENT);
      w.roads = curvedRoads(rng, 16, EXTENT, 9).concat(gridRoads(rng, 1400, EXTENT, 11));
      scatter(rng, 62, 11, EXTENT * 0.82, (x, y) => {
        if (!rng.chance(0.62)) return;
        w.structures.push(makeStructure(rng, 'FR12', x, y,
          { rot: Math.round(rng() * 4) * (Math.PI / 2) + rng.range(-0.08, 0.08) }));
        if (rng.chance(0.22)) w.trees.push(makeTree(rng, x + rng.range(-18, 18),
          y + rng.range(-18, 18), 'hardwood'));
      });
      scatter(rng, 640, 160, EXTENT, (x, y) => {
        if (rng.chance(0.3)) w.structures.push(makeStructure(rng, 'SM', x, y));
        if (rng.chance(0.22)) {
          // A mobile-home park: the lowest-threshold indicator there is.
          for (let i = 0; i < rng.int(6, 14); i++) {
            w.structures.push(makeStructure(rng, 'MHDF',
              x + rng.range(-90, 90), y + rng.range(-90, 90)));
          }
        }
      });
      w.structures.push(makeStructure(rng, 'ESFR', rng.range(-800, 800), rng.range(-800, 800)));
      w.lines.push({ pts: [[-EXTENT, 900], [EXTENT, 900]] });
      w.lines.push({ pts: [[-900, -EXTENT], [-900, EXTENT]] });
    },

    /* Dense urban — a mid/high-rise core. Tall buildings are stiff and
       rate poorly as indicators; the glass and the low-rise fringe do the
       talking, which is itself a lesson about surveying cities. */
    urban(rng, w) {
      w.fields = makeFields(rng, 700, EXTENT);
      w.roads = gridRoads(rng, 105, EXTENT * 0.6, 12)
        .concat(gridRoads(rng, 900, EXTENT, 16));
      scatter(rng, 76, 7, EXTENT * 0.62, (x, y) => {
        const d = Math.hypot(x, y);
        const rot = Math.round(rng() * 2) * (Math.PI / 2);
        if (d < 550) {
          w.structures.push(makeStructure(rng, rng.chance(0.35) ? 'HRB' : 'MRB', x, y, { rot }));
        } else if (d < 1200) {
          w.structures.push(makeStructure(rng, rng.chance(0.5) ? 'MRB' : 'LRB', x, y, { rot }));
        } else if (rng.chance(0.8)) {
          w.structures.push(makeStructure(rng, rng.chance(0.4) ? 'SM' : 'MBS', x, y, { rot }));
        }
      });
      scatter(rng, 190, 40, EXTENT, (x, y) => {
        if (Math.hypot(x, y) > EXTENT * 0.6 && rng.chance(0.5)) {
          w.structures.push(makeStructure(rng, 'FR12', x, y));
        }
      });
      scatter(rng, 130, 30, EXTENT, (x, y) => {
        if (rng.chance(0.2)) w.trees.push(makeTree(rng, x, y, 'hardwood'));
      });
      w.lines.push({ pts: [[-EXTENT, 1500], [EXTENT, 1500]] });
    },

    /* Mixed terrain — woodland, fields, a highway, a hamlet. The messiest
       and the most realistic; good for seeing how differently the same
       wind treats different things standing next to each other. */
    mixed(rng, w) {
      w.fields = makeFields(rng, 400, EXTENT);
      w.roads = curvedRoads(rng, 5, EXTENT, 14).concat(gridRoads(rng, 1300, EXTENT, 8));
      // Woodland patches
      scatter(rng, 900, 300, EXTENT, (px, py) => {
        if (!rng.chance(0.55)) return;
        const rad = rng.range(180, 420);
        const count = Math.round((rad * rad) / 900);
        for (let i = 0; i < count; i++) {
          const a = rng() * TAU, r = Math.sqrt(rng()) * rad;
          w.trees.push(makeTree(rng, px + Math.cos(a) * r, py + Math.sin(a) * r,
            rng.chance(0.55) ? 'hardwood' : 'softwood'));
        }
      });
      scatter(rng, 620, 200, EXTENT, (x, y) => {
        if (!rng.chance(0.5)) return;
        const kind = rng();
        if (kind < 0.45) {
          w.structures.push(makeStructure(rng, 'FR12', x, y));
          w.structures.push(makeStructure(rng, 'SBO', x + 45, y + 25));
        } else if (kind < 0.7) {
          for (let i = 0; i < rng.int(3, 8); i++) {
            w.structures.push(makeStructure(rng, 'FR12',
              x + rng.range(-120, 120), y + rng.range(-120, 120)));
          }
        } else if (kind < 0.85) {
          w.structures.push(makeStructure(rng, 'SM', x, y));
        } else {
          for (let i = 0; i < rng.int(4, 9); i++) {
            w.structures.push(makeStructure(rng, 'MHSF',
              x + rng.range(-70, 70), y + rng.range(-70, 70)));
          }
        }
      });
      w.lines.push({ pts: [[-EXTENT, -1200], [EXTENT, -1200]] });
      w.lines.push({ pts: [[1400, -EXTENT], [1400, EXTENT]] });
    }
  };


  TS.ENVIRONMENTS = [
    { key: 'openField', name: 'Open agricultural fields',
      blurb: 'Almost nothing to hit. The control case — and the fastest way to see why a violent tornado can still rate low.' },
    { key: 'farmland', name: 'Rural farmland',
      blurb: 'Scattered farmsteads, barns, silos and windbreaks. Damage indicators are sparse and mostly weak ones.' },
    { key: 'smallTown', name: 'Small town',
      blurb: 'A compact core in open country. Watch the rating change as the path crosses the town edge.' },
    { key: 'suburb', name: 'Suburban neighbourhood',
      blurb: 'Uniform housing stock, which makes the wind-field asymmetry unusually easy to read in the damage.' },
    { key: 'urban', name: 'Dense urban',
      blurb: 'Mid- and high-rise core. Tall buildings are stiff and rate poorly; the fringe tells the story.' },
    { key: 'mixed', name: 'Mixed terrain',
      blurb: 'Woodland, fields, a highway and a hamlet. Different things standing side by side, treated very differently.' }
  ];


  /* Build a world. Deterministic in (key, seed). */

  TS.buildTerrain = function (key, seed) {
    const rng = TS.makeRNG((seed >>> 0) || 1);
    _nextId = 1;

    const w = {
      key,
      name: (TS.ENVIRONMENTS.find(e => e.key === key) || {}).name || key,
      extent: EXTENT,
      fields: [],
      roads: [],
      structures: [],
      trees: [],
      lines: [],
      town: null
    };

    (BUILDERS[key] || BUILDERS.openField)(rng, w);

    // Caps keep instancing predictable on integrated graphics. Thin
    // uniformly rather than truncating: the list is generated in grid
    // order, so slicing it would delete a whole region of the map and
    // leave a conspicuously empty quarter.
    thinTo(w.structures, 5200);
    thinTo(w.trees, 9000);

    // Poles go in after the cap so a dense city can never thin away the
    // power lines, which are among the most legible indicators there are.
    for (const line of w.lines) line.poles = powerline(rng, line.pts, w.structures);

    w.counts = countByDI(w.structures);
    return w;
  };

  function thinTo(list, max) {
    if (list.length <= max) return;
    const keep = max / list.length;
    let write = 0, acc = 0;
    for (let i = 0; i < list.length; i++) {
      acc += keep;
      if (acc >= 1) { acc -= 1; list[write++] = list[i]; }
    }
    list.length = write;
  }

  function countByDI(list) {
    const out = {};
    for (const s of list) out[s.di] = (out[s.di] || 0) + 1;
    return out;
  }

  /* Reset damage state without regenerating geometry — used on restart so
     the world stays identical while the storm runs again. */
  TS.clearTerrainDamage = function (w) {
    for (const s of w.structures) { s.dod = 0; s.peakWind = 0; s.load = 0; }
    for (const t of w.trees) { t.dod = 0; t.peakWind = 0; t.bend = 0; t.bendX = 0; t.bendY = 0; }
  };

})(window.TS);
