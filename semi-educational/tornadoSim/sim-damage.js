/* ═══════════════════════════════════════════════════════════════════════
   sim-damage.js — damage indicators, degrees of damage, and the rating
   ───────────────────────────────────────────────────────────────────────
   The Enhanced Fujita scale does not measure wind. It reads damage and
   infers wind. So this file never asks the sim how strong the tornado is;
   it asks what broke, and works backwards — which is why a violent
   tornado over empty fields rates near zero here, exactly as it would in
   a real damage survey.

   The DOD ladders below are the real ones: each degree of damage carries
   an expected wind speed with a lower and an upper bound, because two
   nominally identical buildings fail at genuinely different speeds. We
   keep that spread rather than averaging it away — it is the honest part.

   Wind speeds in the tables are mph (that is how the scale is published);
   they are converted to m/s once, at load.
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp;
  const MPH = TS.MPH;


  /* ── Damage indicators ───────────────────────────────────────────────
     `dods` are [expected, lower, upper] in mph, in ascending order.
     `indicator: false` marks something that is not a recognised EF damage
     indicator — we still damage it, but it must not drive a rating. */

  const DI = {
    FR12: {
      name: 'One- or two-family residence', short: 'House',
      w: 13, d: 10, h: 6, roofed: true, roofStyle: 'gable', mat: 'wood', indicator: true, ef5capable: true,
      dods: [
        ['Threshold of visible damage', 65, 53, 80],
        ['Loss of roof covering, gutters or siding', 79, 63, 97],
        ['Broken glass in doors and windows', 96, 79, 114],
        ['Roof deck uplift, significant roof covering lost', 97, 81, 116],
        ['House shifted off its foundation', 121, 103, 141],
        ['Large sections of roof structure removed', 122, 104, 142],
        ['Exterior walls collapsed', 132, 113, 153],
        ['Most walls collapsed except small interior rooms', 152, 127, 178],
        ['All walls collapsed', 170, 142, 198],
        ['Swept clean; only the slab remains', 200, 165, 220]
      ]
    },
    MHSF: {
      name: 'Single-wide mobile home', short: 'Mobile home',
      w: 4, d: 16, h: 3.2, roofed: true, roofStyle: 'gable', mat: 'metal', indicator: true, ef5capable: false,
      dods: [
        ['Threshold of visible damage', 59, 49, 71],
        ['Loss of roof covering or awnings', 68, 56, 82],
        ['Unit slides off its blocks', 74, 61, 90],
        ['Unit overturns or rolls', 87, 72, 105],
        ['Significant damage to roof and walls', 98, 81, 118],
        ['Roof and walls destroyed', 110, 91, 132],
        ['Unit rolled or blown some distance downwind', 122, 101, 146],
        ['Obliterated; debris scattered', 142, 118, 170]
      ]
    },
    MHDF: {
      name: 'Double-wide mobile home', short: 'Double-wide',
      w: 8, d: 18, h: 3.4, roofed: true, roofStyle: 'gable', mat: 'metal', indicator: true, ef5capable: false,
      dods: [
        ['Threshold of visible damage', 63, 52, 76],
        ['Loss of roof covering or skirting', 74, 61, 89],
        ['Unit shifted off its piers', 80, 66, 97],
        ['Unit overturns', 94, 78, 113],
        ['Significant damage to roof and walls', 105, 87, 126],
        ['Roof and walls destroyed', 118, 98, 142],
        ['Unit rolled and displaced downwind', 132, 109, 158],
        ['Obliterated', 151, 125, 181]
      ]
    },
    SBO: {
      name: 'Small barn or farm outbuilding', short: 'Barn',
      w: 12, d: 20, h: 7, roofed: true, roofStyle: 'hip', mat: 'wood', indicator: true, ef5capable: false,
      dods: [
        ['Threshold of visible damage', 64, 53, 78],
        ['Loss of metal roof or wall cladding', 73, 60, 88],
        ['Large doors fail', 78, 64, 94],
        ['Roof uplift and removal', 85, 70, 103],
        ['Collapse of roof rafters or trusses', 94, 78, 114],
        ['Walls damaged or leaning', 103, 85, 124],
        ['Total destruction of the building', 117, 97, 141]
      ]
    },
    SILO: {
      name: 'Grain bin or silo', short: 'Silo',
      w: 9, d: 9, h: 13, roofed: false, roofStyle: null, mat: 'metal', indicator: false, ef5capable: false,
      dods: [
        ['Denting of the shell', 75, 62, 90],
        ['Roof or cap removed', 90, 74, 108],
        ['Shell buckled', 105, 87, 126],
        ['Bin toppled or destroyed', 120, 99, 144]
      ]
    },
    ESFR: {
      name: 'Elementary school, masonry', short: 'School',
      w: 60, d: 34, h: 7, roofed: true, roofStyle: 'hip', mat: 'metal', indicator: true, ef5capable: true,
      dods: [
        ['Threshold of visible damage', 67, 54, 81],
        ['Loss of roof covering, less than 20 percent', 75, 61, 91],
        ['Loss of significant roof covering', 87, 71, 105],
        ['Damage to or loss of rooftop equipment', 98, 80, 118],
        ['Exterior wall collapse at one or more bays', 110, 90, 132],
        ['Significant portion of roof structure removed', 122, 100, 147],
        ['Most interior walls of top floor collapsed', 133, 110, 160],
        ['Total destruction of a large section', 145, 120, 175],
        ['Most walls collapsed', 160, 132, 192],
        ['Complete destruction of the building', 178, 147, 214]
      ]
    },
    SM: {
      name: 'Strip mall', short: 'Strip mall',
      w: 55, d: 20, h: 6, roofed: true, roofStyle: 'parapet', mat: 'masonry', indicator: true, ef5capable: false,
      dods: [
        ['Threshold of visible damage', 70, 58, 85],
        ['Loss of roof covering, less than 20 percent', 78, 64, 94],
        ['Storefront glass and doors broken', 87, 72, 105],
        ['Uplift of roof deck; significant covering lost', 96, 79, 116],
        ['Damage to or collapse of parapet walls', 106, 88, 128],
        ['Roof structure removed over several units', 118, 97, 142],
        ['Exterior walls collapsed', 130, 108, 157],
        ['Complete destruction of the building', 145, 120, 175]
      ]
    },
    MBS: {
      name: 'Masonry apartment or small retail', short: 'Masonry block',
      w: 26, d: 16, h: 9, roofed: false, roofStyle: null, mat: 'masonry', indicator: true, ef5capable: true,
      dods: [
        ['Threshold of visible damage', 71, 59, 86],
        ['Loss of roof covering', 82, 68, 99],
        ['Broken glass in windows and doors', 92, 76, 111],
        ['Uplift of roof deck', 103, 85, 124],
        ['Exterior walls collapsed at upper floor', 116, 96, 140],
        ['Roof structure removed', 130, 108, 157],
        ['Most walls collapsed', 148, 122, 178],
        ['Total destruction', 165, 137, 199]
      ]
    },
    CHBS: {
      name: 'Church or institutional masonry', short: 'Church',
      w: 24, d: 34, h: 11, roofed: true, roofStyle: 'parapet', mat: 'masonry', indicator: true, ef5capable: true,
      dods: [
        ['Threshold of visible damage', 71, 59, 86],
        ['Loss of roof covering', 83, 69, 100],
        ['Broken glass; steeple damaged', 95, 78, 114],
        ['Uplift of roof deck; steeple toppled', 108, 89, 130],
        ['Exterior walls collapsed at one bay', 122, 101, 147],
        ['Roof structure removed', 138, 114, 166],
        ['Most walls collapsed', 155, 128, 187]
      ]
    },
    LRB: {
      name: 'Low-rise building, one to four storeys', short: 'Low-rise',
      w: 30, d: 24, h: 13, roofed: false, roofStyle: null, mat: 'masonry', indicator: true, ef5capable: true,
      dods: [
        ['Threshold of visible damage', 75, 62, 91],
        ['Windows broken on one face', 88, 73, 106],
        ['Loss of roof covering and rooftop equipment', 100, 83, 121],
        ['Uplift of roof deck; cladding lost', 113, 93, 136],
        ['Exterior cladding and glazing largely stripped', 127, 105, 153],
        ['Structural frame damaged; walls collapsed', 142, 118, 171],
        ['Total destruction', 160, 132, 193]
      ]
    },
    MRB: {
      name: 'Mid-rise building, five to twenty storeys', short: 'Mid-rise',
      w: 34, d: 28, h: 34, roofed: false, roofStyle: null, mat: 'glass', indicator: true, ef5capable: false,
      dods: [
        ['Threshold of visible damage', 80, 66, 96],
        ['Windows broken on one or more faces', 95, 79, 115],
        ['Most glazing on the windward face lost', 110, 91, 133],
        ['Cladding panels removed', 125, 103, 151],
        ['Extensive cladding loss; interior exposed', 142, 118, 171],
        ['Structural damage to the frame', 160, 132, 193]
      ]
    },
    HRB: {
      name: 'High-rise building, over twenty storeys', short: 'High-rise',
      w: 40, d: 34, h: 78, roofed: false, roofStyle: null, mat: 'glass', indicator: true, ef5capable: false,
      dods: [
        ['Threshold of visible damage', 85, 70, 102],
        ['Scattered window glass broken', 100, 83, 121],
        ['Most glazing on the windward face lost', 118, 98, 142],
        ['Cladding panels removed', 135, 112, 163],
        ['Extensive structural cladding failure', 155, 128, 187]
      ]
    },
    TWR: {
      name: 'Water or communications tower', short: 'Tower',
      w: 12, d: 12, h: 32, roofed: false, roofStyle: null, mat: 'metal', indicator: true, ef5capable: false,
      dods: [
        ['Visible deflection or panel loss', 80, 66, 96],
        ['Bracing members buckled', 95, 79, 115],
        ['Tank or dish displaced', 110, 91, 133],
        ['Structure collapsed', 130, 108, 157],
        ['Structure destroyed and displaced', 150, 124, 181]
      ]
    },
    TP: {
      name: 'Distribution pole line', short: 'Power pole',
      w: 0.5, d: 0.5, h: 11, roofed: false, roofStyle: null, mat: 'wood', indicator: true, ef5capable: false,
      dods: [
        ['Conductors down; poles leaning', 70, 58, 85],
        ['Poles snapped or uprooted', 85, 70, 103],
        ['Multiple poles down in sequence', 100, 83, 121],
        ['Line structure destroyed over a long span', 115, 95, 139]
      ]
    }
  };

  /* Trees are their own indicators, and the most abundant ones by far.
     They are also the most saturating: a debarked trunk tells you the
     wind was at least severe, but not how much more than that. */
  const TREE_DI = {
    hardwood: {
      name: 'Hardwood tree', short: 'Hardwood', indicator: true, ef5capable: false,
      dods: [
        ['Small limbs broken', 60, 49, 73],
        ['Large branches broken', 70, 58, 85],
        ['Trees uprooted', 91, 75, 110],
        ['Trunks snapped', 110, 91, 133],
        ['Debarked; only stubs of the largest branches remain', 131, 108, 158]
      ]
    },
    softwood: {
      name: 'Softwood tree', short: 'Softwood', indicator: true, ef5capable: false,
      dods: [
        ['Small limbs broken', 60, 49, 73],
        ['Large branches broken', 68, 56, 82],
        ['Trees uprooted', 87, 72, 105],
        ['Trunks snapped', 104, 86, 126],
        ['Debarked; only stubs of the largest branches remain', 131, 108, 158]
      ]
    }
  };

  /* Convert the published mph tables to m/s once, at load. Nothing
     downstream should ever see mph again until the UI formats it. */
  function toMetric(table) {
    for (const key in table) {
      const spec = table[key];
      spec.key = key;
      spec.ms = spec.dods.map(d => ({
        label: d[0],
        exp: d[1] / MPH,
        lo: d[2] / MPH,
        hi: d[3] / MPH,
        expMph: d[1], loMph: d[2], hiMph: d[3]
      }));
      spec.minWind = spec.ms[0].lo;
      spec.maxExp = spec.ms[spec.ms.length - 1].exp;
    }
  }
  toMetric(DI);
  toMetric(TREE_DI);

  TS.DI_SPECS = DI;
  TS.TREE_SPECS = TREE_DI;


  /* ── EF bands ────────────────────────────────────────────────────────
     Bands are on the 3-second gust in mph, as published. */

  const EF_BANDS = [
    { ef: 0, lo: 65, hi: 85, label: 'EF0', desc: 'Light damage' },
    { ef: 1, lo: 86, hi: 110, label: 'EF1', desc: 'Moderate damage' },
    { ef: 2, lo: 111, hi: 135, label: 'EF2', desc: 'Considerable damage' },
    { ef: 3, lo: 136, hi: 165, label: 'EF3', desc: 'Severe damage' },
    { ef: 4, lo: 166, hi: 200, label: 'EF4', desc: 'Devastating damage' },
    { ef: 5, lo: 201, hi: 999, label: 'EF5', desc: 'Incredible damage' }
  ];
  TS.EF_BANDS = EF_BANDS;

  TS.efFromMph = function (mph) {
    if (mph < 65) return null;
    for (const b of EF_BANDS) if (mph <= b.hi) return b;
    return EF_BANDS[EF_BANDS.length - 1];
  };


  /* ── Spatial index ───────────────────────────────────────────────────
     Damage is evaluated 30 times a second. Without an index that means
     six thousand wind-field evaluations per step, which is a slideshow.
     A uniform grid cuts it to the few hundred things actually near the
     vortex. Built once per world. */

  const CELL = 200;

  function buildIndex(items, extent) {
    const span = Math.ceil((extent * 2) / CELL) + 1;
    const cells = new Array(span * span);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const cx = Math.floor((it.x + extent) / CELL);
      const cy = Math.floor((it.y + extent) / CELL);
      if (cx < 0 || cy < 0 || cx >= span || cy >= span) continue;
      const k = cy * span + cx;
      (cells[k] || (cells[k] = [])).push(it);
    }
    return { cells, span, extent };
  }

  function queryIndex(idx, x, y, radius, out) {
    out.length = 0;
    const { cells, span, extent } = idx;
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
  }

  TS.resetDamage = function (sim) {
    const w = sim.terrain;
    if (!w) return;
    if (!w._idxS || w._idxSeedKey !== w.key) {
      w._idxS = buildIndex(w.structures, w.extent);
      w._idxT = buildIndex(w.trees, w.extent);
      w._idxP = buildIndex(w.props || [], w.extent);
      w._idxSeedKey = w.key;
    }
    TS.clearTerrainDamage(w);
    sim.debris = [];
    sim.debrisTop = 0;
    sim.debrisLoad = 0;
    sim.scour = [];
    sim._hitS = [];
    sim._hitT = [];
    sim._hitP = [];
    sim.flung = [];
    sim.salamanderHit = false;
  };


  /* ── Effective wind ──────────────────────────────────────────────────
     Two adjustments to the peak wind a structure saw, both real:

     Dwell — damage is cumulative. A structure held in 50 m/s for twenty
     seconds fails in ways one held for two seconds does not. This is
     precisely why a slow-moving violent tornado is more destructive than
     a fast one at identical peak wind, and it is the mechanism behind
     that preset.

     Quality — the seeded construction draw maps onto the lower/upper
     bounds the scale already publishes for every degree of damage. */

  /* Exposure as a load integral rather than a stopwatch.

     Counting seconds above a threshold does not work: while the tornado
     is approaching, the wind is always at its running maximum, so any
     "time near the peak" test is trivially true and a house at the edge
     of the path banks the same credit as one in the core. Integrating a
     high power of wind speed fixes that on a single streaming pass —
     time at half the peak contributes one sixteenth as much — and it is
     closer to how load actually accumulates, since force goes as v².

     `dwellOf` converts the integral back into an interpretable number:
     equivalent seconds spent at the structure's own peak wind. That is
     what the inspector panel reports, because "eleven seconds at peak"
     means something to a reader in a way that a raw integral does not. */

  const LOAD_POWER = 4;

  function dwellOf(s) {
    if (!s.load || s.peakWind < 1) return 0;
    return s.load / Math.pow(s.peakWind, LOAD_POWER);
  }
  TS.dwellOf = dwellOf;

  function effectiveWind(peak, dwell) {
    const bonus = 0.13 * clamp(Math.log1p(dwell / 4) / Math.log1p(6), 0, 1);
    return peak * (1 + bonus);
  }
  TS.effectiveWind = effectiveWind;

  /* Where inside the published bound this particular observation lands.

     This is not a fudge factor — it is how a real survey reasons. Every
     degree of damage carries a lower and an upper bound precisely because
     construction varies, and a surveyor who finds a well-built house
     swept from its slab estimates a higher wind than for a poorly-built
     one in the same condition. The same quality draw that made the
     structure harder to break also earns it a higher estimate, which is
     self-consistent: both follow from it having been better built.

     It is also what makes EF5 reachable at all. The expected value for a
     house swept clean is 200 mph, exactly the EF4/EF5 boundary, so an
     estimate that always snapped to the expected value could never
     produce an EF5 no matter what the tornado did. */

  function surveyEstimate(level, quality) {
    const q = clamp(quality, 0, 1);
    return level.loMph + (level.hiMph - level.loMph) * q;
  }
  TS.surveyEstimate = surveyEstimate;

  function thresholdFor(level, quality) {
    return surveyEstimate(level, quality) / MPH;      // mph table -> m/s
  }
  TS.thresholdFor = thresholdFor;

  function dodFor(spec, eff, quality) {
    let dod = 0;
    for (let i = 0; i < spec.ms.length; i++) {
      if (eff >= thresholdFor(spec.ms[i], quality)) dod = i + 1; else break;
    }
    return dod;
  }
  TS.dodFor = dodFor;


  /* ── The per-step damage pass ────────────────────────────────────────
     Called from sim-core. Reads the wind field, writes DOD state and the
     monotone journal. Never invents a number. */

  /* ── What comes off, and when ────────────────────────────────────────
     The renderer already decides what a damaged building LOOKS like from
     fractions of its own ladder length (a barn with 7 rungs and a house
     with 10 both lose their roof around the same point in their own
     story). Those same fractions decide what physically departs, so the
     roof leaving the mesh and the roof appearing in the air are the same
     event rather than two effects that happen to agree.

     Note this fires on the CROSSING, not on the state. A structure that
     jumps three rungs in one step still sheds its roof exactly once. */

  const F_ROOF = 0.40, F_WALLS = 0.62;

  function flingStructure(sim, s, spec, from, nd) {
    const maxDod = spec.ms.length;
    const fFrom = from / maxDod, fTo = nd / maxDod;
    const mat = spec.mat || 'wood';

    if (spec.roofed && fFrom < F_ROOF && fTo >= F_ROOF) {
      TS.flingFrom(sim, {
        x: s.x, y: s.y, z: s.h,
        w: s.w, h: s.h * 0.42, d: s.d,
        kind: 'roof', count: 3, mat: mat
      });
    }
    if (fFrom < F_WALLS && fTo >= F_WALLS) {
      TS.flingFrom(sim, {
        x: s.x, y: s.y, z: s.h * 0.55,
        w: s.w, h: s.h * 0.7, d: s.d,
        kind: 'wall', count: 4, mat: mat
      });
    }
    // The last rung on every ladder is some form of "swept away". When a
    // structure reaches it, the structure itself is what leaves.
    if (nd >= maxDod && from < maxDod) {
      TS.flingFrom(sim, {
        x: s.x, y: s.y, z: s.h * 0.5,
        w: s.w * 0.8, h: s.h * 0.6, d: s.d * 0.8,
        kind: 'whole', count: 1, mat: mat
      });
    }
  }


  const _wv = { u: 0, v: 0, w: 0, speed: 0, r: 0 };

  TS.applyDamage = function (sim, dt) {
    const w = sim.terrain;
    if (!w || sim.vmax < 8) return;

    // Everything meaningfully affected sits inside a few Rmax. The
    // power-law tail technically stays above the weakest tree threshold
    // for kilometres, but out there it only ever scratches DOD 1 on
    // limbs, so the search is bounded. [simplified here]
    const reach = clamp(sim.rmax * 3.2 + 180, 260, 1100);
    const cx = sim.center.x, cy = sim.center.y;

    const hitS = queryIndex(w._idxS, cx, cy, reach, sim._hitS);
    for (let i = 0; i < hitS.length; i++) {
      const s = hitS[i];
      const spec = DI[s.di];
      sim.windAt(s.x, s.y, _wv);
      const sp = _wv.speed;
      if (sp > s.peakWind) s.peakWind = sp;
      if (sp >= spec.minWind) s.load += Math.pow(sp, LOAD_POWER) * dt;
      const eff = effectiveWind(s.peakWind, dwellOf(s));
      const nd = dodFor(spec, eff, s.quality);
      if (nd > s.dod) {
        const from = s.dod;
        s.dod = nd;
        sim.journal.push({
          t: sim.t, kind: 's', id: s.id, ref: s,
          from, to: nd, wind: sp, eff, dwell: dwellOf(s)
        });
        // Failing structures are where debris comes from. Not decoration:
        // the radar debris signature downstream is driven by this.
        if (TS.spawnDebris) TS.spawnDebris(sim, s.x, s.y, (nd - from) * 3 + 2, 'structure');
        if (TS.flingFrom) flingStructure(sim, s, spec, from, nd);
      }
    }

    const hitT = queryIndex(w._idxT, cx, cy, reach, sim._hitT);
    for (let i = 0; i < hitT.length; i++) {
      const tr = hitT[i];
      const spec = TREE_DI[tr.kind];
      sim.windAt(tr.x, tr.y, _wv);
      const sp = _wv.speed;
      if (sp > tr.peakWind) tr.peakWind = sp;
      // Live bend: vegetation response is a readout of the local wind,
      // not an animation on a timer.
      const bend = clamp(sp / 45, 0, 1.35) * (tr.dod >= 3 ? 0.25 : 1);
      tr.bend = bend;
      if (sp > 1) { tr.bendX = _wv.u / sp; tr.bendY = _wv.v / sp; }
      const nd = dodFor(spec, sp, tr.quality);
      if (nd > tr.dod) {
        const from = tr.dod;
        tr.dod = nd;
        sim.journal.push({
          t: sim.t, kind: 't', id: tr.x * 7919 + tr.y, ref: tr,
          from, to: nd, wind: sp, eff: sp, dwell: 0
        });
        if (nd >= 3 && TS.spawnDebris) TS.spawnDebris(sim, tr.x, tr.y, 3, 'vegetation');
        // Uprooted is the rung at which a tree stops being scenery and
        // starts being a projectile. The crown goes; the stump does not.
        if (nd >= 3 && from < 3 && TS.flingFrom) {
          TS.flingFrom(sim, {
            x: tr.x, y: tr.y, z: tr.h * 0.7,
            w: tr.r * 1.7, h: tr.h * 0.55, d: tr.r * 1.7,
            kind: 'crown', count: 1, mat: 'vegetation'
          });
        }
      }
    }

    // Props are damaged on the same pass but kept in their own list, and
    // TS.assessDamage never walks that list. That separation is the whole
    // guarantee that a flying pickup cannot move the EF rating.
    if (TS.applyPropDamage) TS.applyPropDamage(sim, dt);

    // Ground scour: bare soil lifts once surface winds get high enough.
    // This is what makes the dust cloud appear before anything breaks.
    if (sim.vmax > 32 && TS.spawnDebris) {
      const n = Math.round(clamp((sim.vmax - 32) / 14, 0, 4) * sim.params.debrisLoading * 4);
      for (let i = 0; i < n; i++) {
        const a = sim.debrisRng() * TS.TAU;
        const rr = sim.rmax * sim.debrisRng.range(0.5, 1.5);
        TS.spawnDebris(sim, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1, 'dust');
      }
    }
  };


  /* Rewind: the journal is monotone, so scrubbing backward means undoing
     every entry past the target index. Cheap, exact, and the reason the
     timeline can move both ways without re-running the sim. */

  TS.rewindDamageTo = function (sim, len) {
    const j = sim.journal;
    if (len >= j.length) return;
    for (let i = j.length - 1; i >= len; i--) {
      const e = j[i];
      if (e.ref) e.ref.dod = e.from;
    }
    j.length = len;
  };


  /* ═══════════════════════════════════════════════════════════════════
     THE RATING

     This is the heart of the piece. We look only at damage. The tornado
     could have been carrying 250 mph winds over an empty field and this
     function will return EF0 or nothing at all, because that is what a
     damage survey would have concluded.
     ═══════════════════════════════════════════════════════════════════ */

  TS.assessDamage = function (sim) {
    const w = sim.terrain;
    const out = {
      rating: null,
      peakEstimatedMph: 0,
      drivingStructure: null,
      countsByDod: {},
      damaged: 0, destroyed: 0,
      treesDamaged: 0, treesSnapped: 0,
      polesDown: 0,
      saturated: 0,
      usefulIndicators: 0,
      byType: {},
      capped: false,
      note: ''
    };
    if (!w) return out;

    let best = 0, bestRef = null, bestSpec = null;

    for (const s of w.structures) {
      if (s.dod <= 0) continue;
      const spec = DI[s.di];
      out.damaged++;
      if (s.dod >= spec.ms.length) { out.destroyed++; out.saturated++; }
      if (s.di === 'TP' && s.dod >= 2) out.polesDown++;

      const t = out.byType[s.di] || (out.byType[s.di] = {
        di: s.di, name: spec.name, short: spec.short, n: 0, maxDod: 0, indicator: spec.indicator
      });
      t.n++; if (s.dod > t.maxDod) t.maxDod = s.dod;

      if (!spec.indicator) continue;
      // The survey estimate for this observation comes from the degree of
      // damage reached — never from the wind the sim actually applied.
      const est = surveyEstimate(spec.ms[s.dod - 1], s.quality);
      if (est > best) { best = est; bestRef = s; bestSpec = spec; }
      if (s.dod < spec.ms.length) out.usefulIndicators++;
    }

    for (const tr of w.trees) {
      if (tr.dod <= 0) continue;
      out.treesDamaged++;
      if (tr.dod >= 4) out.treesSnapped++;
      const spec = TREE_DI[tr.kind];
      const est = surveyEstimate(spec.ms[tr.dod - 1], tr.quality);
      if (est > best) { best = est; bestRef = tr; bestSpec = spec; }
    }

    out.peakEstimatedMph = Math.round(best);
    out.drivingStructure = bestRef;
    out.drivingSpec = bestSpec;
    out.rating = TS.efFromMph(best);

    // Saturation: if the strongest indicator is at the top of its ladder,
    // the survey has a floor, not a measurement. Real surveys hit this
    // constantly, and it is why so many rural tornadoes are rated low.
    if (bestRef && bestSpec) {
      const maxDod = bestSpec.ms.length;
      const dod = bestRef.dod;
      out.capped = dod >= maxDod;
      out.drivingLabel = bestSpec.ms[dod - 1].label;
      out.drivingQuality = bestRef.quality;
      out.drivingName = bestSpec.name;
    }

    // Ground-relative, because that is the wind that did the breaking.
    const modelledMph = Math.round((sim.peakGround || sim.peakVmax) * MPH);
    out.modelledPeakMph = modelledMph;
    out.rotationalPeakMph = Math.round(sim.peakVmax * MPH);
    out.translationMph = Math.round(sim.params.forwardSpeed * MPH);
    out.gap = modelledMph - out.peakEstimatedMph;

    if (!out.rating) {
      out.note = out.damaged || out.treesDamaged
        ? 'Damage was found, but none of it reached the threshold of the EF scale.'
        : 'No damage indicators were struck. A survey would have nothing to rate.';
    } else if (out.capped) {
      out.note = 'The strongest indicator reached the top of its scale. The rating is a floor, not a measurement — the wind may have been considerably higher.';
    } else if (out.gap > 25) {
      out.note = 'The modelled wind was well above what the damage supports. Nothing strong enough was in the way to record it.';
    }

    return out;
  };


  /* Per-structure explanation, for the click-to-inspect panel. Says what
     happened AND whether the observation would have been worth anything
     to a survey team. */

  TS.explainStructure = function (sim, s) {
    const isTree = s.kind === 'hardwood' || s.kind === 'softwood';
    const spec = isTree ? TREE_DI[s.kind] : DI[s.di];
    const dwell = isTree ? 0 : dwellOf(s);
    const eff = isTree ? s.peakWind : effectiveWind(s.peakWind, dwell);
    const dod = s.dod;
    const level = dod > 0 ? spec.ms[dod - 1] : null;
    const next = dod < spec.ms.length ? spec.ms[dod] : null;

    const reasons = [];
    const needMph = level ? Math.round(surveyEstimate(level, s.quality)) : 0;

    if (dod === 0) {
      reasons.push('Winds here stayed below the threshold at which this kind of structure shows any visible damage.');
    } else {
      const gain = Math.round((eff - s.peakWind) * MPH);
      const usedDwell = !isTree && dwell > 3 && gain >= 2;
      if (usedDwell) {
        reasons.push('Peak wind at this spot reached ' + Math.round(s.peakWind * MPH) +
          ' mph. It was then held under that load for the equivalent of ' + dwell.toFixed(1) +
          ' seconds, and damage accumulates — so the effect was closer to ' +
          Math.round(eff * MPH) + ' mph, which is past the ' + needMph +
          ' mph this particular structure needed for "' + level.label.toLowerCase() + '".');
      } else {
        reasons.push('Peak wind at this spot reached ' + Math.round(s.peakWind * MPH) +
          ' mph, past the ' + needMph + ' mph this particular structure needed for "' +
          level.label.toLowerCase() + '".');
      }
      const q = s.quality;
      if (q > 0.68) reasons.push('This one was built above average for its type, so it held on longer than its neighbours.');
      else if (q < 0.32) reasons.push('This one was below average for its type, and failed earlier than its neighbours did.');
      if (next) {
        reasons.push('The next degree of damage would have needed about ' +
          Math.round(surveyEstimate(next, s.quality)) + ' mph.');
      }
    }

    let usefulness;
    if (!spec.indicator) {
      usefulness = { ok: false, text: 'Not a recognised EF damage indicator. It can be described in a survey, but it cannot set a rating.' };
    } else if (dod === 0) {
      usefulness = { ok: false, text: 'Undamaged. Useful only as evidence of where the damaging wind was not.' };
    } else if (dod >= spec.ms.length) {
      usefulness = { ok: false, text: 'Saturated: this indicator is at the top of its scale. It proves the wind was at least ' + needMph + ' mph, but it cannot say how much more.' };
    } else if (!spec.ef5capable && dod >= spec.ms.length - 1) {
      usefulness = { ok: false, text: 'Near the top of a weak indicator. Structures like this fail so readily that they cannot support a high rating.' };
    } else {
      usefulness = { ok: true, text: 'A useful indicator. It failed partway up its scale, which brackets the wind from both sides.' };
    }

    return {
      name: spec.name,
      dod, maxDod: spec.ms.length,
      damage: level ? level.label : 'No visible damage',
      peakMph: Math.round(s.peakWind * MPH),
      effMph: Math.round(eff * MPH),
      estMph: level ? Math.round(surveyEstimate(level, s.quality)) : 0,
      expMph: level ? Math.round(level.expMph) : 0,
      rangeMph: level ? [Math.round(level.lo * MPH), Math.round(level.hi * MPH)] : null,
      dwell: dwell,
      quality: s.quality,
      reasons,
      usefulness,
      indicator: spec.indicator
    };
  };

})(window.TS);
