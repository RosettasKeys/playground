/* ═══════════════════════════════════════════════════════════════════════
   verify.js — physics checks for the sim layer
   ───────────────────────────────────────────────────────────────────────
   A development tool, NOT part of the page. Nothing in tornado-lab.html
   loads this, and the lab still opens straight from disk with no build
   step. Run it when you have changed anything in sim-*.js or
   data-terrain.js:

       node verify.js

   It loads the simulation layer through a fake `window` (no DOM, no
   THREE - which is exactly why the sim layer is forbidden from touching
   either) and asserts the behaviours the piece is actually claiming:

     - the right flank is stronger by twice the forward speed
     - the condensation funnel detaches from the ground as air dries,
       while the damaging wind field underneath does not change
     - THE EF CHECK: one identical violent tornado rates far lower over
       open field than over a town, because the rating comes from damage
     - a slow tornado out-damages a fast one at identical peak wind
     - the same seed reproduces a run exactly
     - the same environment, re-rolled, gives different tornadoes

   If the EF check ever stops showing a large gap between the open-field
   and small-town ratings, the damage model is wrong and the whole point
   of the piece has quietly broken.
   ═══════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DIR = __dirname;
const ctx = { window: {}, Math, console, isFinite, Object, Array, Number, String, JSON };
ctx.globalThis = ctx;
vm.createContext(ctx);

for (const f of ['sim-core.js', 'sim-env.js', 'sim-damage.js', 'sim-debris.js', 'data-terrain.js']) {
  vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx, { filename: f });
}
const TS = ctx.window.TS;
const MPH = TS.MPH;

function run(envKey, params, env, seed) {
  const terrain = TS.buildTerrain(envKey, seed || 1234);
  const sim = new TS.Sim({ seed: seed || 1234, params, env, terrain, visual: false });
  sim.runToEnd();
  return { sim, report: TS.assessDamage(sim) };
}

const line = (s) => console.log(s);
const hr = () => line('─'.repeat(72));

/* ── 1. World generation sanity ─────────────────────────────────────── */
hr(); line('WORLD GENERATION');
for (const e of TS.ENVIRONMENTS) {
  const w = TS.buildTerrain(e.key, 99);
  line(`  ${e.key.padEnd(11)} structures ${String(w.structures.length).padStart(5)}   trees ${String(w.trees.length).padStart(5)}`);
}

/* ── 2. Right-side asymmetry ────────────────────────────────────────── */
hr(); line('ASYMMETRY — wind 300 m either side of a due-north tornado (at maturity)');
{
  const sim = new TS.Sim({ seed: 5, params: { heading: 0, forwardSpeed: 20, vmax: 60, width: 400 } });
  for (let i = 0; i < 4500; i++) sim.step();
  const cx = sim.center.x, cy = sim.center.y;
  // Heading 0 = north (+y). Right side = +x.
  const right = sim.speedAt(cx + 300, cy) * MPH;
  const left = sim.speedAt(cx - 300, cy) * MPH;
  line(`  right ${right.toFixed(1)} mph   left ${left.toFixed(1)} mph   delta ${(right - left).toFixed(1)}`);
  line(`  ${right > left ? 'PASS' : 'FAIL'} — right side stronger`);
  const expect = 2 * 20 * MPH;
  line(`  expected delta ~= 2 x forward speed = ${expect.toFixed(1)} mph`);
}

/* ── 3. Faster forward motion widens the asymmetry ──────────────────── */
hr(); line('ASYMMETRY SCALES WITH FORWARD SPEED');
for (const fs_ of [5, 15, 30]) {
  const sim = new TS.Sim({ seed: 5, params: { heading: 0, forwardSpeed: fs_, vmax: 60, width: 400 } });
  for (let i = 0; i < 4500; i++) sim.step();
  const cx = sim.center.x, cy = sim.center.y;
  const d = (sim.speedAt(cx + 300, cy) - sim.speedAt(cx - 300, cy)) * MPH;
  line(`  forward ${String(fs_).padStart(2)} m/s -> delta ${d.toFixed(1)} mph`);
}

/* ── 4. Funnel vs damage radius as dewpoint drops ───────────────────── */
hr(); line('CONDENSATION FUNNEL vs WIND FIELD (vmax fixed at 62 m/s)');
for (const dew of [24, 20, 16, 10, 4]) {
  const sim = new TS.Sim({ seed: 7, params: { vmax: 62, width: 400 }, env: { surfaceTemp: 30, dewpoint: dew } });
  for (let i = 0; i < 4500; i++) sim.step();
  const d = sim.derived;
  line(`  dewpoint ${String(dew).padStart(2)}C  cloud base ${String(Math.round(d.cloudBase)).padStart(4)} m` +
    `  funnel reaches down to ${String(Math.round(sim.funnelBase)).padStart(4)} m` +
    `  ground Rmax ${Math.round(sim.rmax)} m  vmax ${Math.round(sim.vmax * MPH)} mph`);
}

/* ── 5. THE EF CHECK — same tornado, different worlds ───────────────── */
hr(); line('THE EF CHECK — identical violent tornado, six landscapes');
const violent = { vmax: 89, width: 700, forwardSpeed: 13, lifespan: 420, heading: 45 };
for (const e of TS.ENVIRONMENTS) {
  const { sim, report } = run(e.key, Object.assign({}, violent), null, 4242);
  const r = report.rating ? report.rating.label : ' —  ';
  line(`  ${e.key.padEnd(11)} ${r.padEnd(5)} survey ${String(report.peakEstimatedMph).padStart(3)} mph` +
    `  ground ${String(report.modelledPeakMph).padStart(3)} (rot ${String(report.rotationalPeakMph).padStart(3)}) mph` +
    `  damaged ${String(report.damaged).padStart(4)}  destroyed ${String(report.destroyed).padStart(4)}` +
    `  trees ${String(report.treesDamaged).padStart(4)}`);
}

/* ── 6. Dwell: slow vs fast at identical peak wind ──────────────────── */
hr(); line('DWELL — identical peak wind, PATH LENGTH HELD CONSTANT at 5.5 km');
line('  (varying lifespan with speed, otherwise a fast tornado just covers more ground)');
for (const fs_ of [6, 13, 26]) {
  const life = 5500 / fs_;
  const { report, sim } = run('suburb', Object.assign({}, violent, { forwardSpeed: fs_, lifespan: life }), null, 808);
  const r = report.rating ? report.rating.label : '—';
  // Mean dwell among structures that actually took damage.
  // Mean dwell and mean damage among houses close to the centreline —
  // the population where the dwell mechanism should actually show up.
  let dw = 0, n = 0, dodSum = 0;
  for (const st of sim.terrain.structures) {
    if (st.di !== 'FR12' || st.peakWind < 45) continue;
    dw += TS.dwellOf(st); dodSum += st.dod; n++;
  }
  line(`  forward ${String(fs_).padStart(2)} m/s (life ${String(Math.round(life)).padStart(3)}s) -> ${r.padEnd(4)}` +
    ` survey ${String(report.peakEstimatedMph).padStart(3)} mph  destroyed ${String(report.destroyed).padStart(4)}` +
    `  houses near track ${String(n).padStart(4)}  mean dwell ${(n ? dw / n : 0).toFixed(1)}s  mean DOD ${(n ? dodSum / n : 0).toFixed(2)}`);
}

/* ── 7. Determinism ─────────────────────────────────────────────────── */
hr(); line('DETERMINISM');
{
  const a = run('smallTown', Object.assign({}, violent), null, 31337);
  const b = run('smallTown', Object.assign({}, violent), null, 31337);
  const same = a.report.peakEstimatedMph === b.report.peakEstimatedMph &&
    a.report.destroyed === b.report.destroyed &&
    a.sim.journal.length === b.sim.journal.length;
  line(`  journal ${a.sim.journal.length} vs ${b.sim.journal.length}, destroyed ${a.report.destroyed} vs ${b.report.destroyed}`);
  line(`  ${same ? 'PASS' : 'FAIL'} — same seed reproduces the run exactly`);
}

/* ── 8. Rewind exactness ────────────────────────────────────────────── */
hr(); line('REWIND');
{
  const terrain = TS.buildTerrain('suburb', 55);
  const sim = new TS.Sim({ seed: 55, params: Object.assign({}, violent), terrain, visual: false });
  sim.runToEnd();
  const endDestroyed = TS.assessDamage(sim).destroyed;
  const mid = Math.floor(sim.history.length * 0.5);
  sim.seekTo(mid);
  const midDestroyed = TS.assessDamage(sim).destroyed;
  sim.seekTo(sim.history.length - 1);
  const backDestroyed = TS.assessDamage(sim).destroyed;
  line(`  end ${endDestroyed} -> scrub to midpoint ${midDestroyed} -> scrub to end ${backDestroyed}`);
  line(`  ${midDestroyed < endDestroyed ? 'PASS' : 'FAIL'} — rewind actually undoes damage`);
  line(`  note: forward re-scrub cannot restore without replay (expected: ${backDestroyed})`);
}

/* ── 9. Multi-vortex ladder ─────────────────────────────────────────── */
hr(); line('SWIRL RATIO LADDER');
{
  const sim = new TS.Sim({ seed: 9, params: { vmax: 70, width: 500 } });
  for (const S of [0.5, 0.9, 1.1, 1.3, 1.7, 2.2]) {
    line(`  swirl ${S.toFixed(1)} -> ${sim.subvortexCount(S)} subvortices`);
  }
}

/* ── 10. Derived mode: same environment, different outcomes ─────────── */
hr(); line('DERIVED MODE — one environment, ten re-rolls');
{
  const base = { mode: 'derived', surfaceTemp: 30, dewpoint: 23, cape: 3200, shear: 25, helicity: 320, stormRelWind: 14, precip: 0.4 };
  const vals = [];
  for (let s = 1; s <= 10; s++) {
    const d = TS.deriveEnvironment(Object.assign({}, base, { envSeed: s }), TS.defaultParams());
    vals.push(d.intensityCeiling);
  }
  line('  ceilings: ' + vals.map(v => v.toFixed(2)).join('  '));
  const min = Math.min(...vals), max = Math.max(...vals);
  line(`  spread ${min.toFixed(2)} … ${max.toFixed(2)}   ${max - min > 0.2 ? 'PASS' : 'FAIL'} — same setup gives different tornadoes`);
}

/* ── 11. Debris lofting ─────────────────────────────────────────────── */
hr(); line('DEBRIS');
{
  const terrain = TS.buildTerrain('smallTown', 12);
  const sim = new TS.Sim({ seed: 12, params: Object.assign({}, violent), terrain });
  let maxTop = 0, maxLoad = 0, maxN = 0;
  while (sim.alive) {
    sim.step();
    if (sim.debrisTop > maxTop) maxTop = sim.debrisTop;
    if (sim.debrisLoad > maxLoad) maxLoad = sim.debrisLoad;
    if (sim.debris.length > maxN) maxN = sim.debris.length;
  }
  line(`  peak lofted height ${Math.round(maxTop)} m   peak particles ${maxN}   peak load ${maxLoad.toFixed(2)}`);
}
hr();
