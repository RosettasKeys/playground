/* ═══════════════════════════════════════════════════════════════════════
   render-overlays.js — the visualisation layers
   ───────────────────────────────────────────────────────────────────────
   Twelve independently toggleable layers drawn on a 2D canvas over the
   scene, using the 3D camera's own projection so they sit on the world
   rather than floating in front of it.

   Every layer samples the live wind field. None of them are decorative
   diagrams: if you turn on vorticity and the tornado is weak, you see a
   weak vorticity field.
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp, MPH = TS.MPH;
  const O = {};
  TS.overlays = O;

  let cv, g, W = 0, H = 0;
  const on = {};
  const p0 = {}, p1 = {};
  const wv = { u: 0, v: 0, w: 0, speed: 0, r: 0 };

  O.init = function (canvas) {
    cv = canvas;
    g = cv.getContext('2d');
    for (const l of TS.LAYERS) on[l.id] = l.on;
    O.resize();
    window.addEventListener('resize', O.resize);
    return O;
  };

  O.resize = function () {
    if (!cv) return;
    W = cv.clientWidth || window.innerWidth;
    H = cv.clientHeight || window.innerHeight;
    // Deliberately 1:1 with CSS pixels rather than device pixels: these
    // are thin annotation strokes over a busy scene, and the fill cost of
    // a retina-resolution overlay buys nothing legible.
    cv.width = W; cv.height = H;
  };

  O.set = function (id, v) { on[id] = v; };
  O.get = function (id) { return !!on[id]; };
  O.any = function (ids) { return ids.some(i => on[i]); };

  let labelSlot = 0;

  /* 0 looking along the ground, 1 looking straight down. Annotation that
     is comfortable from the chaser view becomes a pile of overlapping
     text from directly above, so detail is gated on this. */
  function topDown() {
    const cam = TS.scene3d.cam;
    if (!cam) return 0;
    return clamp((cam.el - 0.45) / 0.75, 0, 1);
  }

  const color = {};
  for (const l of (TS.LAYERS || [])) color[l.id] = l.color;


  /* Sample the wind field on a ground grid around the tornado and hand
     each sample to a drawing function, already projected to the screen. */

  function gridSample(sim, span, n, fn) {
    const cx = sim.center.x, cy = sim.center.y;
    const step = (span * 2) / n;
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const x = cx - span + i * step;
        const y = cy - span + j * step;
        TS.scene3d.project(x, y, 0, p0);
        if (!p0.visible) continue;
        if (p0.x < -80 || p0.x > W + 80 || p0.y < -80 || p0.y > H + 80) continue;
        fn(x, y, p0.x, p0.y, step);
      }
    }
  }


  O.draw = function (sim) {
    if (!g) return;
    g.clearRect(0, 0, W, H);
    if (!sim) return;
    labelSlot = 0;

    const span = clamp(sim.rmax * 5, 500, 2600);

    if (on.pressure) drawPressure(sim, span);
    if (on.vort) drawVorticity(sim, span);
    if (on.refl || on.vel) drawRadarWash(sim, span);
    if (on.wind) drawWind(sim, span);
    if (on.updraft || on.downdraft) drawVertical(sim, span);
    if (on.rfd) drawRFD(sim);
    if (on.circ) drawCirculation(sim);
    if (on.debrisl) drawDebrisExtent(sim);
    if (on.precipl) drawPrecipLabel(sim);
    drawScaleBar(sim);
  };


  /* ── Surface wind vectors ────────────────────────────────────────── */

  function drawWind(sim, span) {
    g.lineWidth = 1;
    gridSample(sim, span, 17, (x, y, sx, sy) => {
      sim.windAt(x, y, wv);
      const sp = wv.speed;
      if (sp < 4) return;
      // Length in screen space, scaled so the strongest arrows stay legible
      const len = clamp(sp * 0.55, 4, 34);
      const inv = 1 / sp;
      TS.scene3d.project(x + wv.u * 6, y + wv.v * 6, 0, p1);
      let dx = p1.x - sx, dy = p1.y - sy;
      const d = Math.hypot(dx, dy) || 1;
      dx = dx / d * len; dy = dy / d * len;

      const t = clamp((sp * MPH - 30) / 150, 0, 1);
      g.strokeStyle = `rgba(${79 + t * 176 | 0},${195 - t * 90 | 0},${247 - t * 173 | 0},${0.35 + t * 0.5})`;
      g.beginPath();
      g.moveTo(sx, sy); g.lineTo(sx + dx, sy + dy);
      g.lineTo(sx + dx - dx * 0.3 - dy * 0.18, sy + dy - dy * 0.3 + dx * 0.18);
      g.stroke();
      void inv;
    });
  }


  /* ── Circulation ─────────────────────────────────────────────────────
     The radius of maximum wind as a ring on the ground, plus each
     subvortex. The ring is deliberately drawn at the DAMAGE radius, not
     the funnel radius, since telling those two apart is half the point
     of the whole console. */

  function drawCirculation(sim) {
    const td = topDown();
    // The one ring that carries meaning keeps its label; the outer dashed
    // ring is context and drops away as the view tips over, where it was
    // just another circle crowding the same few pixels.
    ringOnGround(sim.center.x, sim.center.y, sim.rmax, color.circ, 1.8, [],
      td > 0.55 ? null : 'Rmax');
    if (td < 0.75) {
      ringOnGround(sim.center.x, sim.center.y, sim.rmax * 2.2,
        'rgba(240,180,41,' + (0.30 * (1 - td)).toFixed(2) + ')', 1, [4, 5]);
    }

    for (const sv of sim.subvortices) {
      ringOnGround(sv.x, sv.y, sv.rmax, 'rgba(255,111,74,0.75)', 1.3, []);
    }

    TS.scene3d.project(sim.center.x, sim.center.y, 0, p0);
    if (p0.visible && td < 0.85) {
      g.fillStyle = color.circ;
      g.font = '10px "Space Mono", monospace';
      g.fillText('↺', p0.x - 4, p0.y - 6);
    }
  }

  function ringOnGround(cx, cy, r, stroke, lw, dash, label) {
    const N = 40;
    g.beginPath();
    let started = false, lx = -1e9, ly = 0;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      TS.scene3d.project(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0, p0);
      if (!p0.visible) { started = false; continue; }
      if (!started) { g.moveTo(p0.x, p0.y); started = true; }
      else g.lineTo(p0.x, p0.y);
      if (p0.x > lx) { lx = p0.x; ly = p0.y; }
    }
    g.strokeStyle = stroke; g.lineWidth = lw;
    g.setLineDash(dash || []);
    g.stroke();
    g.setLineDash([]);
    if (label && started) {
      // Stack labels rather than letting them pile up on each other at
      // the centre of the circulation.
      labelSlot++;
      g.fillStyle = stroke;
      g.font = '9px "Space Mono", monospace';
      g.fillText(label, lx + 8, ly + (labelSlot - 1) * 12);
    }
  }


  /* ── Vertical motion ─────────────────────────────────────────────────
     Up and down are drawn as separate layers because the difference
     between a single-cell and a two-cell vortex is exactly that the
     core reverses. Toggle both on and raise the swirl ratio to watch
     the centre flip from rising to sinking. */

  function drawVertical(sim, span) {
    const td = topDown();

    /* Sampled on RINGS about the vortex axis, not on a square grid laid
       over the landscape. Vertical motion here depends only on distance
       from the axis, and the core - the part that reverses, and the whole
       reason this layer is interesting - is barely a couple of hundred
       metres across. A Cartesian grid wide enough to cover the scene has
       cells larger than that, so it stepped straight over the downdraft
       and drew nothing at all. Rings resolve the core by construction and
       scale with the tornado instead of with the viewport. */

    const RINGS = 13;
    const outer = sim.rmax * 3.2;
    let downDrawn = 0, upDrawn = 0;

    for (let ri = 0; ri < RINGS; ri++) {
      const rr = (ri / (RINGS - 1)) * outer;
      const w = sim.verticalAt(rr);
      if (Math.abs(w) < 1.0) continue;
      const up = w > 0;
      if (up && !on.updraft) continue;
      if (!up && !on.downdraft) continue;

      const mag = clamp(Math.abs(w) / 34, 0, 1);
      const nA = ri === 0 ? 1 : Math.max(4, Math.round(ri * 2.6));
      const ringStep = outer / (RINGS - 1);

      for (let ai = 0; ai < nA; ai++) {
        const a = (ai / nA) * Math.PI * 2 + ri * 0.31;
        const x = sim.center.x + Math.cos(a) * rr;
        const y = sim.center.y + Math.sin(a) * rr;
        TS.scene3d.project(x, y, 0, p0);
        if (!p0.visible) continue;
        if (p0.x < -60 || p0.x > W + 60 || p0.y < -60 || p0.y > H + 60) continue;

        // Screen size of one ring step, so markers sit on the field
        // rather than at a fixed pixel size that means nothing.
        TS.scene3d.project(x + ringStep * 0.5, y, 0, p1);
        const sz = clamp(Math.abs(p1.x - p0.x), 3, 26);

        if (up) upDrawn++; else downDrawn++;

        g.beginPath();
        g.arc(p0.x, p0.y, sz * 0.92, 0, Math.PI * 2);
        g.fillStyle = up
          ? 'rgba(255,159,69,' + (0.07 + mag * 0.30).toFixed(3) + ')'
          : 'rgba(96,166,232,' + (0.10 + mag * 0.42).toFixed(3) + ')';
        g.fill();

        if (mag > 0.22 && td < 0.9) {
          const s2 = clamp(sz * 0.72, 4, 12);
          g.strokeStyle = up ? 'rgba(255,190,120,0.95)' : 'rgba(150,205,255,0.98)';
          g.lineWidth = 1.3 + mag * 1.2;
          const dir = up ? -1 : 1;
          for (let k = 0; k < (up ? 1 : 2); k++) {
            const oy = p0.y + dir * k * s2 * 0.75 - dir * s2 * 0.35;
            g.beginPath();
            g.moveTo(p0.x - s2 * 0.55, oy - dir * s2 * 0.42);
            g.lineTo(p0.x, oy + dir * s2 * 0.42);
            g.lineTo(p0.x + s2 * 0.55, oy - dir * s2 * 0.42);
            g.stroke();
          }
        }
      }
    }

    if (td < 0.9) {
      const items = [];
      if (on.updraft) items.push(['rising air', 'rgba(255,159,69,0.95)']);
      if (on.downdraft) items.push(['sinking air', 'rgba(96,166,232,0.95)']);
      g.font = '9.5px "Space Mono", monospace';
      items.forEach((it, i) => {
        const y = H - 132 - i * 14;
        g.fillStyle = it[1];
        g.fillRect(22, y - 7, 9, 9);
        g.fillStyle = 'rgba(207,217,234,0.75)';
        g.fillText(it[0], 36, y);
      });

      /* A layer drawing nothing looks broken when in fact the absence IS
         the result. Decided from the physics at the axis, not from how
         many samples happened to land - which is what got this wrong
         before, and told the user 2.60 was "below breakdown". */
      if (on.downdraft && sim.vmax > 12 && sim.verticalAt(0) >= 0) {
        const y = H - 132 - items.length * 14 - 20;
        g.fillStyle = 'rgba(207,217,234,0.6)';
        g.fillText('no sinking air — at swirl ' + sim.swirlNow.toFixed(2) +
          ' this vortex is single-celled', 22, y);
        g.fillText('and rising throughout. Raise swirl past ~1.15 to split the core.', 22, y + 12);
      }
      void downDrawn; void upDrawn;
    }
    void span;
  }


  /* ── Rear-flank downdraft ────────────────────────────────────────────
     A dry, sinking surge that wraps around the back of the mesocyclone.
     Its arrival is closely tied to tornadogenesis, though exactly how is
     still argued over.

     Drawn as many short streaklets rather than a few clean arcs with a
     boxed caption. Five hard curves and a label in a black box read as a
     diagram pasted over the world; a scatter of short, unevenly bright
     dashes lying on the ground reads as moving air, which is what it is.
     They are seeded, so they sit still when the simulation is paused. */

  const rfdRng = TS.makeRNG(0x5FD);
  const STREAKS = [];
  for (let i = 0; i < 90; i++) {
    STREAKS.push({
      lane: rfdRng.range(-1, 1),          // across the surge
      along: rfdRng(),                    // position round the arc
      len: rfdRng.range(0.10, 0.30),
      alpha: rfdRng.range(0.18, 0.75),
      speed: rfdRng.range(0.55, 1.35)
    });
  }

  function drawRFD(sim) {
    const td = topDown();
    const back = Math.atan2(-sim.dir.x, -sim.dir.y);
    const R0 = sim.rmax * 1.5, R1 = sim.rmax * 4.4;
    const t = sim.t;

    for (let i = 0; i < STREAKS.length; i++) {
      const st = STREAKS[i];
      // Drift round the surge over time; wraps seamlessly.
      const u0 = (st.along + t * 0.045 * st.speed) % 1;
      const u1 = Math.min(1, u0 + st.len);
      const spread = 0.95;

      let started = false;
      g.beginPath();
      for (let k = 0; k <= 5; k++) {
        const u = u0 + (u1 - u0) * (k / 5);
        const rr = R0 + (R1 - R0) * u;
        const aa = back + st.lane * spread + u * 0.72;
        TS.scene3d.project(sim.center.x + Math.sin(aa) * rr,
          sim.center.y + Math.cos(aa) * rr, 3, p0);
        if (!p0.visible) { started = false; continue; }
        if (!started) { g.moveTo(p0.x, p0.y); started = true; }
        else g.lineTo(p0.x, p0.y);
      }
      if (!started) continue;
      // Fade out toward the leading edge, the way a gust front thins.
      const fade = 1 - u0 * 0.55;
      g.strokeStyle = 'rgba(150,132,214,' + (st.alpha * fade * 0.8).toFixed(3) + ')';
      g.lineWidth = 0.8 + st.alpha * 1.5;
      g.lineCap = 'round';
      g.stroke();
    }
    g.lineCap = 'butt';

    // No box. A quiet caption sitting in the flow, dropped entirely from
    // above where it would land on top of everything else.
    if (td < 0.5) {
      TS.scene3d.project(sim.center.x + Math.sin(back) * R1 * 0.92,
        sim.center.y + Math.cos(back) * R1 * 0.92, 3, p0);
      if (p0.visible) {
        g.font = '9.5px "Space Mono", monospace';
        g.fillStyle = 'rgba(150,132,214,' + (0.75 * (1 - td * 2)).toFixed(2) + ')';
        g.fillText('rear-flank downdraft', p0.x + 6, p0.y);
      }
    }
  }


  /* ── Pressure field ─────────────────────────────────────────────────
     Contours of the cyclostrophic deficit — the same quantity that
     decides how far down the condensation funnel reaches. */

  function drawPressure(sim, span) {
    const levels = [200, 500, 1000, 2000, 4000, 7000, 11000];
    for (const lv of levels) {
      const r = TS.radiusForDeficit(lv, sim.rmax, sim.vmax, sim.alpha);
      if (!isFinite(r) || r > span * 1.6 || r < 4) continue;
      const t = clamp(lv / 11000, 0, 1);
      ringOnGround(sim.center.x, sim.center.y, r,
        `rgba(255,111,74,${0.18 + t * 0.5})`, 1, [2, 4],
        lv >= 1000 ? (lv / 100).toFixed(0) + ' hPa' : '');
    }
  }


  /* ── Vorticity ───────────────────────────────────────────────────── */

  function drawVorticity(sim, span) {
    const h = span / 26;
    gridSample(sim, span, 22, (x, y, sx, sy, step) => {
      // Central difference of the horizontal wind: dv/dx - du/dy.
      sim.windAt(x + h, y, wv); const vE = wv.v;
      sim.windAt(x - h, y, wv); const vW = wv.v;
      sim.windAt(x, y + h, wv); const uN = wv.u;
      sim.windAt(x, y - h, wv); const uS = wv.u;
      const zeta = (vE - vW) / (2 * h) - (uN - uS) / (2 * h);
      const mag = clamp(Math.abs(zeta) / 0.9, 0, 1);
      if (mag < 0.06) return;
      const sz = clamp(step * 0.02 + 2, 2, 9);
      g.fillStyle = zeta > 0
        ? `rgba(88,224,138,${mag * 0.55})`
        : `rgba(177,140,255,${mag * 0.5})`;
      g.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
    });
  }


  /* ── Radar fields draped on the ground ───────────────────────────────
     The same numbers the radar panel shows, projected onto the terrain
     so the hook echo and the velocity couplet can be seen in place. */

  function drawRadarWash(sim, span) {
    const rad = TS.radar && TS.radar.site ? TS.radar.site : { x: -26000, y: -26000 };
    gridSample(sim, span * 1.5, 26, (x, y, sx, sy, step) => {
      const sz = clamp(step * 0.045, 4, 22);
      if (on.refl) {
        const z = TS.radar.reflectivityAt(sim, x, y);
        if (z > 8) {
          const c = TS.radar.dbzColor(z);
          g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.20)`;
          g.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        }
      }
      if (on.vel) {
        // Same product as the panel, storm-relative subtraction included,
        // or the wash and the panel would disagree about what they show.
        const vr = TS.radar.velocityAt(sim, x, y, TS.radar.product === 'srm');
        const m = clamp(Math.abs(vr) / 55, 0, 1);
        if (m > 0.1) {
          g.fillStyle = vr > 0
            ? `rgba(255,77,109,${m * 0.34})`
            : `rgba(110,224,184,${m * 0.34})`;
          g.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        }
      }
    });
  }


  /* ── Debris extent ───────────────────────────────────────────────────
     Drawn as the outline of where material actually is, which is
     routinely wider than the funnel and a good deal wider than people
     expect. */

  function drawDebrisExtent(sim) {
    const list = sim.debris;
    if (!list || list.length < 12) return;
    let maxR = 0, top = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (p.z < 8) continue;
      const d = Math.hypot(p.x - sim.center.x, p.y - sim.center.y);
      if (d > maxR) maxR = d;
      if (p.z > top) top = p.z;
    }
    if (maxR < 10) return;
    // The number is already in the instrument panel; from above it is one
    // more piece of text landing on the same few pixels as everything else.
    ringOnGround(sim.center.x, sim.center.y, maxR,
      'rgba(201,168,106,0.55)', 1.1, [3, 4],
      topDown() > 0.5 ? null : 'debris ' + Math.round(maxR) + ' m');
  }


  function drawPrecipLabel(sim) {
    const st = sim.derived.storm;
    if (!st || st.wrap < 0.05) return;
    if (topDown() > 0.5) return;
    const d = sim.rmax * 4 + 800;
    TS.scene3d.project(sim.center.x + sim.dir.y * d, sim.center.y - sim.dir.x * d, 260, p0);
    if (!p0.visible) return;
    label(p0.x, p0.y, st.mode + ' · precipitation', 'rgba(138,151,171,0.9)');
  }


  /* A scale bar, because nothing else in a 3D view tells you how big any
     of this is — and tornado size is the thing people misjudge most. */

  function drawScaleBar(sim) {
    const cx = sim.center.x, cy = sim.center.y;
    const targets = [100, 200, 500, 1000, 2000, 5000];
    for (const m of targets) {
      TS.scene3d.project(cx, cy, 0, p0);
      TS.scene3d.project(cx + m, cy, 0, p1);
      if (!p0.visible || !p1.visible) continue;
      const px = Math.abs(p1.x - p0.x);
      if (px < 60 || px > 300) continue;
      const y = H - 104, x = 22;
      g.strokeStyle = 'rgba(207,217,234,0.55)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y - 4); g.lineTo(x, y); g.lineTo(x + px, y); g.lineTo(x + px, y - 4);
      g.stroke();
      g.fillStyle = 'rgba(207,217,234,0.75)';
      g.font = '10px "Space Mono", monospace';
      g.fillText(m >= 1000 ? (m / 1000) + ' km' : m + ' m', x + px / 2 - 12, y - 7);
      return;
    }
  }

  function label(x, y, text, col) {
    g.font = '9.5px "Space Mono", monospace';
    // A soft shadow rather than a filled box: readable over the scene
    // without looking like a sticker on top of it.
    g.fillStyle = 'rgba(4,6,12,0.85)';
    g.fillText(text, x + 1.5, y + 1);
    g.fillStyle = col;
    g.fillText(text, x + 1, y);
  }

})(window.TS);
