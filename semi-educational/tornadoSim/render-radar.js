/* ═══════════════════════════════════════════════════════════════════════
   render-radar.js — what a nearby radar would see
   ───────────────────────────────────────────────────────────────────────
   Nothing here is drawn. The hook echo and the velocity couplet are not
   shapes we paint because the tornado looks strong — they are what falls
   out of sampling the actual wind and precipitation fields from a point
   some tens of kilometres away.

   The most important thing the panel teaches is its own limitation. A
   radar beam spreads about one degree, so at 40 km it is already 700 m
   across and cannot resolve anything smaller. Move the site further out
   and the couplet smears until the tornado disappears into a gradient —
   which is exactly why radar-measured wind is not what the EF scale is
   built on.
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp, MPH = TS.MPH;
  const RD = {};
  TS.radar = RD;

  let cv, g, SZ = 280;
  const GRID = 68;                       // gates across the display
  let zBuf, vBuf, zTmp, vTmp;
  const wv = { u: 0, v: 0, w: 0, speed: 0, r: 0 };

  RD.product = 'reflectivity';           // reflectivity | velocity | srm
  RD.rangeKm = 20;                       // distance to the radar site
  RD.bearing = 135;                      // where the site sits, degrees
  RD.site = { x: 0, y: 0 };
  RD.boxKm = 9;                          // width of the displayed box
  RD.couplet = { rawDV: 0, seenDV: 0, meanRadial: 0, beamM: 0, resolved: false };

  RD.init = function (canvas) {
    cv = canvas;
    g = cv.getContext('2d');
    SZ = cv.width;
    zBuf = new Float32Array(GRID * GRID);
    vBuf = new Float32Array(GRID * GRID);
    zTmp = new Float32Array(GRID * GRID);
    vTmp = new Float32Array(GRID * GRID);
    return RD;
  };

  RD.placeSite = function (sim) {
    const a = RD.bearing * Math.PI / 180;
    RD.site.x = sim.center.x - Math.sin(a) * RD.rangeKm * 1000;
    RD.site.y = sim.center.y - Math.cos(a) * RD.rangeKm * 1000;
  };


  /* ── Reflectivity ────────────────────────────────────────────────────
     Two contributions, both physical. Precipitation wraps around the
     mesocyclone from the storm-relative upwind side — draw that and the
     hook appears on its own. Lofted debris is an extremely good radar
     scatterer, so it shows up bright and marks the tornado itself. */

  RD.reflectivityAt = function (sim, x, y) {
    const d = sim.derived;
    const wrap = d.storm ? d.storm.wrap : 0.4;
    const dx = x - sim.center.x, dy = y - sim.center.y;
    const r = Math.hypot(dx, dy);

    // The precipitation core sits back and to the left of the tornado,
    // with a curtain hooking around the circulation.
    const coreX = sim.center.x + sim.dir.y * 2600 - sim.dir.x * 1500;
    const coreY = sim.center.y - sim.dir.x * 2600 - sim.dir.y * 1500;
    const dc = Math.hypot(x - coreX, y - coreY);
    let z = 58 * Math.exp(-(dc * dc) / (2 * 2100 * 2100)) * (0.45 + wrap);

    // The hook: a spiral band of precipitation drawn around the
    // circulation by the same flow that is feeding it.
    const ang = Math.atan2(dy, dx);
    const hookR = sim.rmax * 3.4 + 260;
    const spiral = hookR * (1 + 0.42 * (ang / Math.PI));
    const dh = Math.abs(r - spiral);
    z += 34 * Math.exp(-(dh * dh) / (2 * 340 * 340)) *
      clamp(wrap + 0.25, 0, 1) * clamp(sim.vmax / 40, 0, 1);

    // Debris. High reflectivity, and the reason a debris signature is
    // treated as confirmation of a tornado on the ground.
    if (sim.debris && sim.debris.length) {
      const n = TS.debrisNear(sim, x, y, 190);
      z += clamp(n * 1.7, 0, 32);
    }

    return clamp(z, 0, 78);
  };

  /* Radial velocity: the component of the wind along the beam. Toward the
     radar is conventionally negative (inbound). */

  RD.velocityAt = function (sim, x, y, stormRelative) {
    sim.windAt(x, y, wv);
    let u = wv.u, v = wv.v;
    /* Storm-relative velocity subtracts the storm's own motion before
       projecting onto the beam. It is a real product, and it exists for
       exactly the reason it is needed here: a tornado travelling toward
       the radar shifts its whole neighbourhood inbound, so a ground-
       relative display can be entirely one colour while a textbook
       couplet sits inside it. Removing the translation leaves the
       rotation, which is the thing being looked for. */
    if (stormRelative) {
      u -= sim.dir.x * sim.params.forwardSpeed;
      v -= sim.dir.y * sim.params.forwardSpeed;
    }
    const dx = x - RD.site.x, dy = y - RD.site.y;
    const d = Math.hypot(dx, dy) || 1;
    return (u * dx + v * dy) / d;
  };

  RD.isVelocity = function () { return RD.product === 'velocity' || RD.product === 'srm'; };


  /* ── Colour tables ───────────────────────────────────────────────── */

  const DBZ_STOPS = [
    [5, 100, 130, 160], [15, 60, 160, 200], [25, 40, 190, 110],
    [35, 240, 220, 70], [45, 240, 150, 50], [55, 230, 60, 60],
    [65, 200, 40, 160], [78, 240, 220, 240]
  ];

  RD.dbzColor = function (z) {
    if (z < 5) return [10, 16, 24];
    for (let i = 0; i < DBZ_STOPS.length - 1; i++) {
      const a = DBZ_STOPS[i], b = DBZ_STOPS[i + 1];
      if (z <= b[0]) {
        const t = (z - a[0]) / (b[0] - a[0]);
        return [a[1] + (b[1] - a[1]) * t | 0,
                a[2] + (b[2] - a[2]) * t | 0,
                a[3] + (b[3] - a[3]) * t | 0];
      }
    }
    return [240, 220, 240];
  };

  function velColor(v) {
    const m = clamp(Math.abs(v) / 62, 0, 1);
    if (v < 0) return [30 + m * 60 | 0, 90 + m * 165 | 0, 70 + m * 90 | 0];   // inbound, green
    return [110 + m * 145 | 0, 40 + m * 40 | 0, 60 + m * 50 | 0];             // outbound, red
  }


  /* ── The frame ───────────────────────────────────────────────────────
     Sample, blur by the beam width, then colour. The blur is the whole
     lesson: it is applied AFTER sampling the true field, so what you see
     is genuinely the true field degraded by the instrument. */

  RD.draw = function (sim) {
    if (!g || !sim) return;
    RD.placeSite(sim);

    const box = RD.boxKm * 1000;
    const cell = box / GRID;
    const x0 = sim.center.x - box / 2, y0 = sim.center.y - box / 2;

    const srm = RD.product === 'srm';
    let rawMin = 1e9, rawMax = -1e9, sum = 0;
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const x = x0 + (i + 0.5) * cell;
        const y = y0 + (j + 0.5) * cell;
        const k = j * GRID + i;
        zBuf[k] = RD.reflectivityAt(sim, x, y);
        const v = RD.velocityAt(sim, x, y, srm);
        vBuf[k] = v;
        if (v < rawMin) rawMin = v;
        if (v > rawMax) rawMax = v;
        sum += v;
      }
    }

    // A ~1° beam: width in metres is range × 0.0175. Half of it is the
    // smoothing radius, converted to gate cells.
    const beamM = RD.rangeKm * 1000 * 0.0175;
    const rad = clamp(Math.round((beamM * 0.5) / cell), 0, 9);
    boxBlur(vBuf, vTmp, rad);
    boxBlur(zBuf, zTmp, Math.max(1, Math.round(rad * 0.6)));

    /* Gate-to-gate ΔV is the quantity an operational forecaster actually
       reads off a velocity display, and it is invariant to any constant
       bias along the beam. Recording it before AND after the beam
       smoothing turns the panel's own limitation into a number: this is
       how much of the real rotation the instrument threw away. */
    let seenMin = 1e9, seenMax = -1e9;
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const v = vBuf[j * GRID + i];
        if (v < seenMin) seenMin = v;
        if (v > seenMax) seenMax = v;
      }
    }
    RD.couplet.rawDV = rawMax - rawMin;
    RD.couplet.seenDV = seenMax - seenMin;
    RD.couplet.meanRadial = sum / (GRID * GRID);
    RD.couplet.beamM = beamM;
    RD.couplet.resolved = beamM < sim.rmax * 2;

    const img = g.createImageData(SZ, SZ);
    const px = SZ / GRID;
    for (let sy = 0; sy < SZ; sy++) {
      // Gate rows run south to north; screen rows run top to bottom, so
      // the display would be upside down without the flip.
      const j = GRID - 1 - Math.min(GRID - 1, (sy / px) | 0);
      for (let sx = 0; sx < SZ; sx++) {
        const i = Math.min(GRID - 1, (sx / px) | 0);
        const k = j * GRID + i;
        let c;
        if (RD.isVelocity()) {
          c = Math.abs(vBuf[k]) < 1.4 ? [12, 16, 22] : velColor(vBuf[k]);
        } else {
          c = RD.dbzColor(zBuf[k]);
        }
        const o = (sy * SZ + sx) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    drawFurniture(sim, box);
  };

  /* Separable box blur, run twice for a near-Gaussian falloff. */
  function boxBlur(buf, tmp, rad) {
    if (rad < 1) return;
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < GRID; j++) {
        for (let i = 0; i < GRID; i++) {
          let s = 0, n = 0;
          for (let k = -rad; k <= rad; k++) {
            const ii = i + k;
            if (ii < 0 || ii >= GRID) continue;
            s += buf[j * GRID + ii]; n++;
          }
          tmp[j * GRID + i] = s / n;
        }
      }
      for (let j = 0; j < GRID; j++) {
        for (let i = 0; i < GRID; i++) {
          let s = 0, n = 0;
          for (let k = -rad; k <= rad; k++) {
            const jj = j + k;
            if (jj < 0 || jj >= GRID) continue;
            s += tmp[jj * GRID + i]; n++;
          }
          buf[j * GRID + i] = s / n;
        }
      }
    }
  }

  function drawFurniture(sim, box) {
    // Range rings, in kilometres, centred on the display.
    g.strokeStyle = 'rgba(207,217,234,0.13)';
    g.lineWidth = 1;
    const perKm = SZ / (box / 1000);
    for (let km = 1; km * perKm < SZ; km++) {
      g.beginPath();
      g.arc(SZ / 2, SZ / 2, km * perKm, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(SZ / 2, 0); g.lineTo(SZ / 2, SZ);
    g.moveTo(0, SZ / 2); g.lineTo(SZ, SZ / 2);
    g.stroke();

    // Bearing to the radar site.
    const a = (RD.bearing) * Math.PI / 180;
    g.strokeStyle = 'rgba(240,180,41,0.5)';
    g.setLineDash([3, 4]);
    g.beginPath();
    g.moveTo(SZ / 2, SZ / 2);
    g.lineTo(SZ / 2 - Math.sin(a) * SZ, SZ / 2 + Math.cos(a) * SZ);
    g.stroke();
    g.setLineDash([]);

    g.font = '9px "Space Mono", monospace';
    g.fillStyle = 'rgba(240,180,41,0.85)';
    g.fillText(RD.rangeKm + ' km →', 6, SZ - 8);
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(4, 3, 130, 14);
    g.fillStyle = 'rgba(207,217,234,0.85)';
    /* Tormato renames the banner and leaves every product beneath it
       exactly as it was — same reflectivity, same velocity couplet, same
       debris signature, still fed by material genuinely in the air. */
    const label = PRODUCT_LABEL[RD.product] || RD.product;
    g.fillText(sim && sim.mode === 'tormato'
      ? TS.TORMATO.radarLabel + ' · ' + label
      : label, 8, 13);

    const beamM = Math.round(RD.couplet.beamM || RD.rangeKm * 1000 * 0.0175);
    g.fillStyle = RD.couplet.resolved ? 'rgba(207,217,234,0.55)' : 'rgba(255,111,74,0.95)';
    g.fillText('beam ' + beamM + ' m', SZ - 84, SZ - 8);

    if (RD.isVelocity()) {
      // The number a forecaster would actually read, next to the number
      // that was really there. The gap between them is the instrument.
      const seen = Math.round(RD.couplet.seenDV * MPH);
      const raw = Math.round(RD.couplet.rawDV * MPH);
      const lost = raw - seen > 25;

      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(4, 18, 116, 26);
      g.fillStyle = 'rgba(207,217,234,0.9)';
      g.fillText('ΔV seen  ' + seen + ' mph', 8, 29);
      g.fillStyle = lost ? 'rgba(255,111,74,0.95)' : 'rgba(207,217,234,0.45)';
      g.fillText('actual   ' + raw + ' mph', 8, 40);

      // Legend along the bottom, clear of the header.
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(SZ - 118, SZ - 34, 112, 14);
      g.fillStyle = 'rgba(110,224,184,0.95)';
      g.fillText('◀ toward', SZ - 114, SZ - 24);
      g.fillStyle = 'rgba(255,110,130,0.95)';
      g.fillText('away ▶', SZ - 52, SZ - 24);
    }
  }

  // Kept short: the panel is 280 px wide and these used to collide with
  // the legend.
  const PRODUCT_LABEL = {
    reflectivity: 'reflectivity',
    velocity: 'velocity · ground-rel',
    srm: 'velocity · storm-rel'
  };
  RD.PRODUCT_LABEL = PRODUCT_LABEL;
  RD.nextProduct = function () {
    RD.product = RD.product === 'reflectivity' ? 'velocity'
      : RD.product === 'velocity' ? 'srm' : 'reflectivity';
    return RD.product;
  };


  /* A short plain-language note under the panel, recomputed each frame,
     saying what the display is actually able to tell you right now. */

  RD.note = function (sim) {
    const c = RD.couplet;
    const beamM = Math.round(c.beamM || RD.rangeKm * 1000 * 0.0175);
    const width = Math.round(sim.rmax * 2);
    const tds = sim.debrisTop > 150 && sim.debrisLoad > 0.3;
    const seen = Math.round(c.seenDV * MPH);
    const raw = Math.round(c.rawDV * MPH);
    const bias = Math.round(Math.abs(c.meanRadial) * MPH);

    /* Branch on the product being displayed FIRST. Anything else can
       caption a velocity display with the reflectivity story. */

    if (RD.product === 'velocity' || RD.product === 'srm') {
      if (sim.vmax < 12) {
        return 'Nothing much is rotating yet. A velocity display shows the wind along the beam ' +
          'only — toward the radar in green, away from it in red.';
      }
      if (beamM > width * 1.6) {
        return 'The beam is ' + beamM + ' m across but the tornado is only ' + width +
          ' m wide, so the couplet is averaged away before it can be seen. The display reads a ' +
          'ΔV of ' + seen + ' mph where the true difference across the circulation is ' + raw +
          ' mph. Bring the radar closer and watch the couplet emerge — this is the single ' +
          'biggest reason radar-measured wind is not what the EF scale is built on.';
      }
      if (RD.product === 'srm' && bias < 6) {
        // Being told a product is doing nothing is more useful than being
        // left to wonder why two displays look the same.
        return 'The radar currently sits roughly at right angles to the storm’s track, so its ' +
          'motion barely projects onto the beam and there is almost nothing for the ' +
          'storm-relative correction to remove — this looks the same as ground-relative on ' +
          'purpose. Swing the bearing round behind or ahead of the storm to see it earn its keep. ' +
          'ΔV across the couplet is ' + seen + ' mph.';
      }
      if (RD.product === 'velocity' && bias > 18) {
        return 'Almost the whole display is one colour because the storm is travelling ' +
          bias + ' mph along the beam, which shifts every gate the same way. The rotation is ' +
          'still there underneath it — ΔV across the couplet is ' + seen + ' mph. Switch to ' +
          'storm-relative velocity to subtract the motion and see it directly.';
      }
      return 'Green beside red is a velocity couplet: air moving toward the radar on one side ' +
        'of the circulation and away on the other, which is what rotation looks like from a ' +
        'single radar. ΔV across it is ' + seen + ' mph' +
        (raw - seen > 25 ? ', against ' + raw + ' mph actually present — the rest was lost to ' +
          'beam width.' : '.');
    }

    // Reflectivity.
    if (tds) {
      return 'Debris is showing as high reflectivity co-located with the circulation — a debris ' +
        'signature. This is confirmation of a tornado on the ground, and it is what lets a ' +
        'warning be issued at night, when nobody can see anything.';
    }
    if (beamM > width * 2.2) {
      return 'The hook is precipitation wrapped around the mesocyclone. At this range the beam ' +
        'is ' + beamM + ' m across, so it marks roughly where the circulation is and nothing ' +
        'finer than that.';
    }
    return 'The hook is precipitation being wrapped around the mesocyclone. It marks where the ' +
      'circulation is, but says nothing directly about how strong it is — for that, switch to ' +
      'velocity.';
  };

})(window.TS);
