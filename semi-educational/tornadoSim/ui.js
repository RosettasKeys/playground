/* ═══════════════════════════════════════════════════════════════════════
   ui.js — the console
   ───────────────────────────────────────────────────────────────────────
   Builds the panels from the definitions in data-content.js, drives the
   frame loop, and owns everything that is a matter of presentation.

   The one rule that matters here: the UI writes parameters IN and reads
   state OUT. It never computes physics, and it never decides what the
   damage was. When a number needs to be said out loud, it is asked for.
   ═══════════════════════════════════════════════════════════════════════ */

(function (TS) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const clamp = TS.clamp, MPH = TS.MPH;

  let sim = null, terrain = null;
  let running = false, rate = 1, acc = 0, lastT = 0;
  let seed = 20260827, envKey = 'farmland';
  let scrubbing = false;
  let radarAccum = 0, narrAccum = 0, factAccum = 0;
  const fired = {}, cooldowns = {};
  let lastRmax = 0, lastVmax = 0, lastJournal = 0;
  let baseline = null;              // the run What-If compares against
  const factRng = TS.makeRNG(0xFAC7);   // narration only — never the sim's stream


  /* ═══════════════════════════════════════════════════════════════════
     BOOT
     ═══════════════════════════════════════════════════════════════════ */

  function boot() {
    if (typeof THREE === 'undefined') {
      $('#bootmsg').innerHTML =
        '<span class="err">Three.js did not load.</span><br>' +
        'This page pulls the renderer from a CDN, so it needs a network connection the first time.';
      $('#boot .bar').style.display = 'none';
      return;
    }
    try {
      TS.scene3d.init($('#scene'));
    } catch (e) {
      $('#bootmsg').innerHTML = '<span class="err">WebGL could not start.</span><br>' +
        'This scene needs hardware 3D. ' + (e && e.message ? e.message : '');
      $('#boot .bar').style.display = 'none';
      return;
    }
    TS.overlays.init($('#overlay'));
    TS.radar.init($('#radar'));

    // The sim has to exist before anything binds to it: several of the
    // wiring functions below read or write parameters as they set up.
    newRun(true);

    buildEnvSelect();
    buildPresets();
    buildControls();
    buildLayers();
    buildViewControls();
    wireTabs();
    wireTransport();
    wireModes();
    wirePicking();

    syncControlValues();
    syncLayerButtons();
    refreshDerived();

    setTimeout(() => $('#boot').classList.add('gone'), 260);
    setTimeout(() => $('#boot').classList.add('hidden'), 1000);
    requestAnimationFrame(frame);
  }


  /* ═══════════════════════════════════════════════════════════════════
     RUN LIFECYCLE
     ═══════════════════════════════════════════════════════════════════ */

  function newRun(rebuildWorld) {
    const params = sim ? Object.assign({}, sim.params) : TS.defaultParams();
    const env = sim ? Object.assign({}, sim.env) : TS.defaultEnv();

    if (rebuildWorld || !terrain || terrain.key !== envKey) {
      terrain = TS.buildTerrain(envKey, seed);
      TS.scene3d.buildWorld(terrain);
    } else {
      TS.clearTerrainDamage(terrain);
    }

    sim = new TS.Sim({ seed, params, env, terrain });
    TS.scene3d.resetScour();
    for (const k in fired) delete fired[k];
    for (const k in cooldowns) delete cooldowns[k];
    lastRmax = 0; lastVmax = 0; lastJournal = 0;
    acc = 0;
    $('#notes').innerHTML = '';
    $('#scrub').max = 0; $('#scrub').value = 0;
    $('#seedval').textContent = seed;
    $('#report').classList.add('hidden');
    $('#inspector').classList.add('hidden');
    refreshDerived();
    syncControlValues();
  }

  /* Restart the run. Playback state is PRESERVED by default: if the user
     had paused to look at something, applying a preset should hand them a
     fresh run also paused, not quietly start it moving. Pass true only
     where the user's action was itself a request to run. */
  function relaunch(startPlaying) {
    const wasRunning = running;
    newRun(false);
    const go = startPlaying === undefined ? wasRunning : startPlaying;
    running = go;
    setPlay(go);
  }


  /* ═══════════════════════════════════════════════════════════════════
     FRAME
     ═══════════════════════════════════════════════════════════════════ */

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - lastT) / 1000 || 0, 0.1);
    lastT = now;
    tick(dt);
  }

  /* The body of a frame, separated from the scheduling so it can be
     driven explicitly — by a test harness, or by anything that needs to
     advance the world without waiting on the compositor. */
  function tick(dt) {
    if (running && sim.alive && !scrubbing) {
      acc += dt * rate;
      // Cap the catch-up so a background tab does not return and run the
      // entire storm in one frame.
      let budget = 400;
      while (acc >= TS.DT && sim.alive && budget-- > 0) {
        sim.step();
        acc -= TS.DT;
      }
      if (!sim.alive) onDissipate();
      const sc = $('#scrub');
      sc.max = Math.max(0, sim.history.length - 1);
      if (!scrubbing) sc.value = sim.history.length - 1;
    }

    TS.scene3d.sync(sim, dt, { running: running && !scrubbing });
    TS.scene3d.render();
    TS.overlays.draw(sim);

    radarAccum += dt;
    if (radarAccum > 0.13) {
      radarAccum = 0;
      TS.radar.draw(sim);
      $('#radarnote').textContent = TS.radar.note(sim);
    }

    updateReadouts();
    if (running && !scrubbing) narrate(dt);
  }


  /* A small handle for inspection and testing. Read-mostly on purpose:
     it exposes what the console already shows, not a second way to drive
     the simulation. */
  TS.ui = {
    tick,
    sim: () => sim,
    terrain: () => terrain,
    play: (v) => { setPlay(v === undefined ? !running : v); },
    view: setView,
    report: () => TS.assessDamage(sim),
    setEnvKey: (k) => { envKey = k; newRun(true); }
  };


  /* ═══════════════════════════════════════════════════════════════════
     CONTROLS
     ═══════════════════════════════════════════════════════════════════ */

  const controlRefs = [];

  function buildControls() {
    mount('#ctl-vortex', TS.CONTROLS.vortex);
    mount('#ctl-track', TS.CONTROLS.track);
    mount('#ctl-look', TS.CONTROLS.look);
    mount('#ctl-surface', TS.CONTROLS.surface);
    mount('#ctl-shear', TS.CONTROLS.shear);
    buildCloudBaseControl();
    buildRadarControls();
    buildSceneControls();
  }

  function mount(sel, defs) {
    const host = $(sel);
    for (const def of defs) host.appendChild(makeControl(def));
  }

  function makeControl(def) {
    const wrap = document.createElement('div');
    wrap.className = 'ctl';

    const head = document.createElement('div');
    head.className = 'ctl-head';
    const lab = document.createElement('label');
    lab.textContent = def.label;
    const val = document.createElement('span');
    val.className = 'val';
    head.appendChild(lab); head.appendChild(val);
    wrap.appendChild(head);

    if (def.tip) attachTip(lab, def.tip);

    let input;
    if (def.type === 'select') {
      input = document.createElement('select');
      for (const [v, t] of def.options) {
        const o = document.createElement('option');
        o.value = v; o.textContent = t;
        input.appendChild(o);
      }
      input.addEventListener('change', () => {
        writeParam(def, input.value);
        refreshDerived();
      });
    } else {
      input = document.createElement('input');
      input.type = 'range';
      const ui = def.ui;
      input.min = ui ? ui.min : def.min;
      input.max = ui ? ui.max : def.max;
      input.step = ui ? ui.step : def.step;
      input.addEventListener('input', () => {
        const raw = parseFloat(input.value);
        const v = ui ? ui.from(raw) : raw;
        writeParam(def, v);
        val.textContent = def.fmt ? def.fmt(v) : v;
        refreshDerived();
        if (def.key === 'vmax') checkGhost(raw);
      });
    }
    lab.setAttribute('for', input.id = 'c-' + def.key);
    wrap.appendChild(input);

    const ref = { def, input, val, lab };
    controlRefs.push(ref);
    return wrap;
  }

  function writeParam(def, v) {
    if (def.env) sim.setEnv({ [def.key]: v });
    else sim.setParams({ [def.key]: v });
  }

  function syncControlValues() {
    for (const ref of controlRefs) {
      const { def, input, val } = ref;
      const src = def.env ? sim.env : sim.params;
      const v = src[def.key];
      if (v === undefined) continue;
      if (def.type === 'select') input.value = v;
      else input.value = def.ui ? def.ui.to(v) : v;
      val.textContent = def.fmt ? def.fmt(v) : v;
      // In environment-driven mode the peak-wind slider is a request, not
      // a setting, so it says so rather than lying about the outcome.
      if (def.key === 'vmax') {
        const derived = sim.env.mode === 'derived';
        val.classList.toggle('locked', derived);
        if (derived) {
          val.textContent = def.fmt(v) + ' requested';
        }
      }
    }
    const cb = $('#c-cloudbase');
    if (cb) {
      cb.value = Math.round(sim.derived.cloudBase);
      $('#c-cloudbase-val').textContent = Math.round(sim.derived.cloudBase) + ' m';
    }
  }

  /* Cloud base is not an independent knob — it is what the temperature
     and dew point imply. Offering it as a slider that writes back to the
     dew point keeps both honest and makes the relationship visible. */

  function buildCloudBaseControl() {
    const host = $('#ctl-surface');
    const wrap = document.createElement('div');
    wrap.className = 'ctl';
    wrap.innerHTML =
      '<div class="ctl-head"><label for="c-cloudbase">Cloud base height</label>' +
      '<span class="val" id="c-cloudbase-val"></span></div>' +
      '<input type="range" id="c-cloudbase" min="120" max="3400" step="10">';
    host.appendChild(wrap);
    attachTip(wrap.querySelector('label'), {
      title: 'Cloud base height', tag: 'established',
      text: 'The altitude at which rising air becomes saturated and cloud forms. It is not a free parameter — it follows from the temperature and dew point, at roughly 125 m per degree of spread.',
      why: 'Dragging this really does change the moisture, so it writes back to the dew point. Low bases are strongly associated with tornadoes; high ones make a condensation funnel struggle to reach the ground even when the surface wind is severe.'
    });
    wrap.querySelector('input').addEventListener('input', (e) => {
      const m = parseFloat(e.target.value);
      const dew = TS.cloudBaseToDewpoint(sim.env.surfaceTemp, m);
      sim.setEnv({ dewpoint: clamp(dew, -5, 27) });
      syncControlValues();
      refreshDerived();
    });
  }

  function buildRadarControls() {
    const host = $('#ctl-radar');
    host.innerHTML =
      '<div class="ctl"><div class="ctl-head"><label for="c-range">Distance to radar</label>' +
      '<span class="val" id="c-range-val">42 km</span></div>' +
      '<input type="range" id="c-range" min="6" max="150" step="1" value="42"></div>' +
      '<div class="ctl"><div class="ctl-head"><label for="c-bearing">Bearing of site</label>' +
      '<span class="val" id="c-bearing-val">225°</span></div>' +
      '<input type="range" id="c-bearing" min="0" max="359" step="1" value="225"></div>';
    attachTip(host.querySelector('label[for=c-range]'), {
      title: 'Distance to radar', tag: 'established',
      text: 'How far the tornado is from the radar site. A radar beam spreads about one degree, so its width in metres is roughly the range in metres times 0.0175.',
      why: 'Drag this outward and watch the velocity couplet smear away. The tornado has not changed at all — only what the instrument can resolve. This is the main reason radar-measured wind is not what the EF scale is built on.'
    });
    $('#c-range').addEventListener('input', e => {
      TS.radar.rangeKm = +e.target.value;
      $('#c-range-val').textContent = e.target.value + ' km';
    });
    $('#c-bearing').addEventListener('input', e => {
      TS.radar.bearing = +e.target.value;
      $('#c-bearing-val').textContent = e.target.value + '°';
    });
  }

  function buildSceneControls() {
    const host = $('#ctl-scene');
    host.innerHTML =
      '<div class="btn-row"><button class="btn" id="s-wire">Toggle debris</button>' +
      '<button class="btn" id="s-shot">Save frame</button></div>';
    $('#s-wire').addEventListener('click', () => {
      const v = !TS.overlays.get('debrisl');
      TS.overlays.set('debrisl', v);
      syncLayerButtons();
    });
    $('#s-shot').addEventListener('click', () => {
      TS.scene3d.render();
      const a = document.createElement('a');
      a.download = 'tornado-lab.png';
      a.href = $('#scene').toDataURL('image/png');
      a.click();
    });
  }


  /* ── Landscape & presets ─────────────────────────────────────────── */

  function buildEnvSelect() {
    const sel = $('#env-select');
    for (const e of TS.ENVIRONMENTS) {
      const o = document.createElement('option');
      o.value = e.key; o.textContent = e.name;
      sel.appendChild(o);
    }
    sel.value = envKey;
    $('#env-blurb').textContent = TS.ENVIRONMENTS.find(e => e.key === envKey).blurb;
    sel.addEventListener('change', () => {
      envKey = sel.value;
      $('#env-blurb').textContent = TS.ENVIRONMENTS.find(e => e.key === envKey).blurb;
      running = false; setPlay(false);
      newRun(true);
    });
  }

  function buildPresets() {
    const host = $('#presets');
    for (const p of TS.PRESETS) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = p.name + '<small>' + p.hint + '</small>';
      b.addEventListener('click', () => {
        $$('#presets .chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        sim.setParams(p.params);
        sim.setEnv(p.env);
        syncControlValues();
        refreshDerived();
        relaunch();               // restarts, but keeps play/pause state
        addNote('Preset applied: ' + p.name + '. The run restarted from the beginning' +
          (running ? '.' : ' and is paused — press Play or Launch.'), 'obs');
      });
      host.appendChild(b);
    }
  }


  /* ── Layers ──────────────────────────────────────────────────────── */

  function buildLayers() {
    const host = $('#layers');
    for (const l of TS.LAYERS) {
      const b = document.createElement('button');
      b.className = 'layer';
      b.dataset.id = l.id;
      b.style.setProperty('--swatch', l.color);
      b.setAttribute('aria-pressed', String(!!l.on));
      b.innerHTML = '<i class="sw"></i><span>' + l.name + '</span>';
      b.addEventListener('click', () => {
        const v = !TS.overlays.get(l.id);
        TS.overlays.set(l.id, v);
        if (l.id === 'refl' && v) TS.radar.product = 'reflectivity';
        if (l.id === 'vel' && v && !TS.radar.isVelocity()) TS.radar.product = 'velocity';
        if (l.id === 'swath') {
          const sc = TS.scene3d;
          if (sc.setSwathVisible) sc.setSwathVisible(v);
        }
        syncLayerButtons();
      });
      host.appendChild(b);
    }
  }

  function syncLayerButtons() {
    $$('#layers .layer').forEach(b => {
      b.setAttribute('aria-pressed', String(TS.overlays.get(b.dataset.id)));
    });
    $('#radar-mode').textContent = TS.radar.product === 'srm' ? 'storm-relative'
      : TS.radar.product === 'velocity' ? 'velocity' : 'reflectivity';
  }


  /* ── Atmosphere mode ─────────────────────────────────────────────── */

  function wireModes() {
    const setMode = (m) => {
      sim.setEnv({ mode: m });
      $('#mode-direct').setAttribute('aria-pressed', String(m === 'direct'));
      $('#mode-derived').setAttribute('aria-pressed', String(m === 'derived'));
      $('#mode-note').textContent = m === 'direct'
        ? 'The tornado sliders are authoritative. The atmosphere still governs how it looks — cloud base, whether the funnel condenses, how much rain wraps around it — but not how strong it is.'
        : 'The atmosphere now proposes what it can support, and the result is a draw rather than a calculation. Re-roll the same environment and you will get a different tornado. That is not a shortcut: predicting tornado intensity from a sounding is something forecasters genuinely cannot do.';
      $('#draw-group').style.display = m === 'derived' ? '' : 'none';
      syncControlValues();
      refreshDerived();
    };
    $('#mode-direct').addEventListener('click', () => setMode('direct'));
    $('#mode-derived').addEventListener('click', () => setMode('derived'));
    $('#btn-reroll').addEventListener('click', () => {
      sim.setEnv({ envSeed: (sim.env.envSeed + 1) % 9973 });
      refreshDerived();
      relaunch();
    });
    setMode('direct');
  }

  function refreshDerived() {
    const d = sim.derived;
    const rows = [
      ['Cloud base', Math.round(d.cloudBase) + ' m'],
      ['Relative humidity', Math.round(d.relHumidity * 100) + '%'],
      ['Energy–helicity index', d.ehi.toFixed(1)],
      ['Updraft potential', Math.round(d.updraft.realistic) + ' m/s',
        'theoretical max ' + Math.round(d.updraft.theoretical)],
      ['Storm mode', d.storm.mode + ' · ' + d.storm.label]
    ];
    $('#derived-readout').innerHTML = rows.map(r =>
      '<div class="ro"><dt>' + r[0] + '</dt><dd>' + r[1] +
      (r[2] ? ' <em>' + r[2] + '</em>' : '') + '</dd></div>').join('');

    if (d.draw) {
      const pct = Math.round(d.draw.value * 100);
      $('#draw-readout').innerHTML =
        '<div class="ro"><dt>Delivered</dt><dd class="big">' + pct + '%</dd></div>' +
        '<div class="ro"><dt>of the wind you requested</dt><dd></dd></div>' +
        '<p style="font-size:10.5px;color:var(--muted);margin:.5rem 0 0;line-height:1.55">' +
        (d.draw.failed
          ? 'This environment failed to produce a significant tornado at all — which is the ordinary outcome. Most supercells never do.'
          : 'Support index ' + d.draw.support.toFixed(2) + '. The centre of the distribution is ' +
          Math.round(d.draw.centre * 100) + '% and it is wide on purpose: a superb environment shifts the odds without ever guaranteeing the outcome.') +
        '</p>';
    }
    syncControlValues();
  }


  /* ═══════════════════════════════════════════════════════════════════
     READOUTS
     ═══════════════════════════════════════════════════════════════════ */

  function updateReadouts() {
    const d = sim.derived;
    const funnelW = sim.funnelRadiusAt(Math.max(sim.funnelBase + 10, 20)) * 2;
    const gap = sim.funnelBase > 30;

    $('#readouts').innerHTML =
      row('Peak wind', Math.round(sim.vmax * MPH) + ' <em>mph</em>', 'big') +
      row('Damage width', TS.fmtWidth(sim.rmax * 2)) +
      row('Visible funnel', gap
        ? '<span style="color:var(--hot)">aloft only</span>'
        : TS.fmtWidth(funnelW)) +
      row('Pressure drop', (sim.deficit / 100).toFixed(0) + ' <em>hPa</em>') +
      row('Subvortices', sim.subvortices.length || '—') +
      row('Debris aloft', sim.debrisTop > 5 ? Math.round(sim.debrisTop) + ' <em>m</em>' : '—') +
      row('Cloud base', Math.round(d.cloudBase) + ' <em>m</em>');

    const total = sim.params.lifespan;
    $('#clock').textContent = fmtTime(sim.t) + ' / ' + fmtTime(total);
    $('#phase').textContent = sim.phase;
  }

  function row(k, v, cls) {
    return '<div class="ro"><dt>' + k + '</dt><dd class="' + (cls || '') + '">' + v + '</dd></div>';
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    return String(m).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }


  /* ═══════════════════════════════════════════════════════════════════
     NARRATION

     A rule engine, not a script. Each rule is a predicate over live state
     with a cooldown; what gets said is a measurement being reported.
     ═══════════════════════════════════════════════════════════════════ */

  function narrate(dt) {
    narrAccum += dt; factAccum += dt;
    for (const k in cooldowns) cooldowns[k] -= dt;
    if (narrAccum < 1.6) return;
    narrAccum = 0;

    const metrics = {
      dRmax: sim.rmax - lastRmax,
      dVmax: (sim.vmax - lastVmax) * MPH,
      newDamage: sim.journal.length - lastJournal,
      totalDamaged: sim.journal.length
    };
    lastRmax = sim.rmax; lastVmax = sim.vmax; lastJournal = sim.journal.length;

    let best = null;
    for (const rule of TS.RULES) {
      if (rule.once && fired[rule.id]) continue;
      if ((cooldowns[rule.id] || 0) > 0) continue;
      let ok = false;
      try { ok = rule.when(sim, metrics); } catch (_) { ok = false; }
      if (!ok) continue;
      if (!best || rule.pri > best.pri) best = rule;
    }

    if (best) {
      fired[best.id] = true;
      cooldowns[best.id] = best.cool;
      addNote(best.say(sim, metrics), best.pri >= 5 ? 'warn' : 'obs');
      factAccum = 0;
      return;
    }

    // Quiet stretch: a field note, so the panel is never dead air.
    if (factAccum > 22) {
      factAccum = 0;
      // Deliberately NOT sim.rng. Drawing from the simulation's own stream
      // would let a presentation detail perturb the physics, and the whole
      // architecture rests on a run being reproducible from its seed.
      const i = Math.floor(factRng() * TS.FACTS.length);
      addNote(TS.FACTS[i], 'fact');
    }
  }

  function addNote(text, kind) {
    const el = document.createElement('div');
    el.className = 'note ' + (kind || 'obs');
    el.innerHTML = '<time>' + fmtTime(sim.t) + '</time>' + text;
    const host = $('#notes');
    host.insertBefore(el, host.firstChild);
    while (host.children.length > 40) host.removeChild(host.lastChild);
  }


  /* ═══════════════════════════════════════════════════════════════════
     TRANSPORT
     ═══════════════════════════════════════════════════════════════════ */

  function wireTransport() {
    $('#t-play').addEventListener('click', () => { running = !running; setPlay(running); });
    $('#t-restart').addEventListener('click', () => relaunch());   // keeps play/pause as-is
    $$('#transport [data-rate]').forEach(b => {
      b.addEventListener('click', () => {
        rate = parseFloat(b.dataset.rate);
        $$('#transport [data-rate]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      });
    });

    const sc = $('#scrub');
    sc.addEventListener('pointerdown', () => { scrubbing = true; });
    sc.addEventListener('pointerup', () => { scrubbing = false; });
    sc.addEventListener('input', () => {
      scrubbing = true;
      sim.seekTo(parseInt(sc.value, 10));
      TS.scene3d.rebuildScour(sim);
    });

    $('#btn-launch').addEventListener('click', () => relaunch(true));
    $('#btn-reseed').addEventListener('click', () => {
      seed = (seed * 1103515245 + 12345) >>> 0 & 0xffffff;
      newRun(true); relaunch();
    });
    $('#btn-report').addEventListener('click', () => showReport());
    // Keep the label honest about what the button will produce.
    setInterval(() => {
      const b = $('#btn-report');
      if (!b || !sim) return;
      const want = sim.alive && sim.t > 1 ? 'Interim analysis' : 'Post-storm analysis';
      if (b.textContent !== want) b.textContent = want;
    }, 700);
    $('#btn-whatif').addEventListener('click', () => showWhatIf());
    $('#btn-explain').addEventListener('click', () => showExplain());
    $('#radar-mode').addEventListener('click', () => {
      TS.radar.nextProduct();
      TS.overlays.set('vel', TS.radar.isVelocity());
      TS.overlays.set('refl', TS.radar.product === 'reflectivity');
      syncLayerButtons();
    });

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, select, textarea')) return;
      if (e.key === ' ') { e.preventDefault(); running = !running; setPlay(running); }
      if (e.key === 'r') relaunch();
      const vk = { 1: 'chase', 2: 'ground', 3: 'aerial', 4: 'orbit', 5: 'plan' }[e.key];
      if (vk) setView(vk);
    });
  }

  function setPlay(v) {
    running = v;
    $('#t-play').textContent = v ? '❚❚ Pause' : '▶ Play';
  }

  function buildViewControls() {
    const map = { 'v-chase': 'chase', 'v-ground': 'ground', 'v-aerial': 'aerial', 'v-orbit': 'orbit', 'v-plan': 'plan' };
    for (const id in map) {
      $('#' + id).addEventListener('click', () => setView(map[id]));
    }
    TS.scene3d.onViewChange = (v) => markView(v);
  }

  function setView(v) { TS.scene3d.setView(v); markView(v); }

  function markView(v) {
    const map = { chase: 'v-chase', ground: 'v-ground', aerial: 'v-aerial', orbit: 'v-orbit', plan: 'v-plan' };
    for (const k in map) $('#' + map[k]).setAttribute('aria-pressed', String(k === v));
  }

  function wireTabs() {
    const tabs = $$('#console [role=tab]');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', String(on));
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
      if (window.innerWidth <= 900) $('#console').classList.add('open');
    }));
    if (window.innerWidth <= 900) {
      $('#console').addEventListener('click', (e) => {
        if (e.target === $('#console')) $('#console').classList.toggle('open');
      });
    }
  }


  /* ═══════════════════════════════════════════════════════════════════
     TOOLTIPS
     ═══════════════════════════════════════════════════════════════════ */

  const tipEl = () => $('#tooltip');

  function attachTip(el, tip) {
    const show = (e) => {
      const t = tipEl();
      t.innerHTML = '<h4>' + tip.title + '<span class="tag ' + tagClass(tip.tag) + '">' +
        tagLabel(tip.tag) + '</span></h4><p>' + tip.text + '</p>' +
        (tip.why ? '<p class="why">' + tip.why + '</p>' : '');
      t.classList.add('on');
      const r = el.getBoundingClientRect();
      const w = t.offsetWidth, h = t.offsetHeight;
      let x = r.right + 12, y = r.top - 6;
      if (x + w > window.innerWidth - 10) x = Math.max(10, r.left - w - 12);
      if (y + h > window.innerHeight - 10) y = Math.max(10, window.innerHeight - h - 10);
      t.style.left = x + 'px'; t.style.top = y + 'px';
      void e;
    };
    const hide = () => tipEl().classList.remove('on');
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', show);
    el.addEventListener('blur', hide);
  }

  function tagClass(t) {
    return t === 'established' ? 'established' : t === 'open' ? 'open' : 'simplified';
  }
  function tagLabel(t) {
    return t === 'established' ? 'established' : t === 'open' ? 'open question' : 'simplified here';
  }


  /* ═══════════════════════════════════════════════════════════════════
     INSPECTOR
     ═══════════════════════════════════════════════════════════════════ */

  function wirePicking() {
    let downX = 0, downY = 0;
    const cv = $('#scene');
    cv.addEventListener('pointerdown', e => { downX = e.clientX; downY = e.clientY; });
    cv.addEventListener('pointerup', e => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return;  // a drag, not a click
      const hit = TS.scene3d.pick(e.clientX, e.clientY);
      if (hit) showInspector(hit, e.clientX, e.clientY);
      else $('#inspector').classList.add('hidden');
    });
  }

  function showInspector(s, x, y) {
    const info = TS.explainStructure(sim, s);
    const isTree = s.kind === 'hardwood' || s.kind === 'softwood';
    const spec = isTree ? TS.TREE_SPECS[s.kind] : TS.DI_SPECS[s.di];

    const ladder = spec.ms.map((m, i) => {
      const n = i + 1;
      const cls = n === info.dod ? 'here' : (n < info.dod ? 'reached' : '');
      return '<div class="rung ' + cls + '"><span class="n">' + n + '</span>' +
        '<span class="w">' + Math.round(m.expMph) + '</span>' +
        '<span>' + m.label + '</span></div>';
    }).join('');

    const el = $('#inspector');
    el.innerHTML =
      '<button class="close" aria-label="Close">×</button>' +
      '<h3>' + info.name + '</h3>' +
      '<p class="sub">' + (info.indicator ? 'EF damage indicator' : 'not an EF indicator') +
      ' · degree of damage ' + info.dod + ' of ' + info.maxDod + '</p>' +
      '<p class="dmg">' + info.damage + '</p>' +
      '<div class="ro"><dt>Peak wind here</dt><dd>' + info.peakMph + ' mph</dd></div>' +
      (info.effMph !== info.peakMph
        ? '<div class="ro"><dt>With exposure</dt><dd>' + info.effMph + ' mph</dd></div>' : '') +
      (info.estMph ? '<div class="ro"><dt>A survey would estimate</dt><dd>' + info.estMph +
        ' mph <em>(' + info.rangeMph[0] + '–' + info.rangeMph[1] + ')</em></dd></div>' : '') +
      '<h4 style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:.9rem 0 .2rem;font-family:inherit">Why</h4>' +
      '<ul>' + info.reasons.map(r => '<li>' + r + '</li>').join('') + '</ul>' +
      '<h4 style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:.9rem 0 .2rem;font-family:inherit">Degrees of damage <span style="color:var(--dim)">(mph)</span></h4>' +
      '<div class="ladder">' + ladder + '</div>' +
      '<div class="useful ' + (info.usefulness.ok ? 'ok' : 'no') + '"><b>As a damage indicator:</b> ' +
      info.usefulness.text + '</div>';

    el.classList.remove('hidden');
    const w = 23 * 16;
    el.style.left = Math.min(x + 16, window.innerWidth - w - 16) + 'px';
    el.style.top = Math.min(y, window.innerHeight - el.offsetHeight - 16) + 'px';
    el.querySelector('.close').addEventListener('click', () => el.classList.add('hidden'));
  }


  /* ═══════════════════════════════════════════════════════════════════
     POST-STORM ANALYSIS
     ═══════════════════════════════════════════════════════════════════ */

  function onDissipate() {
    setPlay(false);
    baseline = snapshotRun();
    addNote('The tornado has dissipated. The post-storm analysis is ready.', 'warn');
    setTimeout(() => showReport(), 700);
  }

  function snapshotRun() {
    return {
      params: Object.assign({}, sim.params),
      env: Object.assign({}, sim.env),
      report: TS.assessDamage(sim),
      path: sim.path.slice(),
      envKey, seed,
      peakVmax: sim.peakVmax, peakRmax: sim.peakRmax, duration: sim.t
    };
  }

  function pathLength(path) {
    let d = 0;
    for (let i = 1; i < path.length; i++) {
      d += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    }
    return d;
  }

  function showReport() {
    const rep = TS.assessDamage(sim);
    const len = pathLength(sim.path);
    const r = rep.rating;
    const efc = r ? 'ef' + r.ef : 'none';

    /* A survey of a storm that is still happening is a real thing, but it
       is not a final rating and must not look like one. Damage only ever
       accumulates, so an interim number is a floor that can still rise. */
    const interim = sim.alive;
    const pct = Math.round(100 * sim.t / Math.max(sim.params.lifespan, 1));

    const byType = Object.values(rep.byType)
      .sort((a, b) => b.n - a.n)
      .map(t => {
        const spec = TS.DI_SPECS[t.di];
        const sat = t.maxDod >= spec.ms.length;
        return '<tr><td>' + t.name + '</td><td class="num">' + t.n + '</td>' +
          '<td class="num">' + t.maxDod + ' / ' + spec.ms.length + '</td>' +
          '<td>' + (!spec.indicator ? '<span style="color:var(--dim)">not an indicator</span>'
            : sat ? '<span style="color:var(--ef2)">saturated — a floor only</span>'
              : '<span style="color:var(--green)">usable</span>') + '</td></tr>';
      }).join('');

    $('#report').innerHTML =
      '<button class="close">× close</button><div class="sheet">' +
      '<h2>' + (interim ? 'Interim analysis' : 'Post-storm analysis') + '</h2>' +
      '<p class="lede">' + terrain.name + ' · seed ' + seed + ' · ' +
      (sim.env.mode === 'derived' ? 'environment-driven' : 'direct control') + '</p>' +
      (interim
        ? '<p class="gap"><b>The storm is still on the ground.</b> This is a survey of damage ' +
          'done so far — ' + fmtTime(sim.t) + ' of ' + fmtTime(sim.params.lifespan) + ', about ' +
          pct + '% through. Damage only accumulates, so every number below is a floor: the ' +
          'rating can still rise and the path is not finished. It is not a final rating.</p>'
        : '') +

      '<div class="ef"><div class="badge ' + efc + '">' + (r ? r.label : 'unrated') + '</div>' +
      '<div class="txt"><strong>' + (r ? r.desc : 'No rateable damage') + '</strong>' +
      '<p>' + (rep.drivingName
        ? 'The rating rests on a single strongest observation: <b>' + rep.drivingName +
          '</b> — "' + rep.drivingLabel + '" — which supports an estimate of ' +
          rep.peakEstimatedMph + ' mph.'
        : 'Nothing the tornado struck was strong enough to record how strong it was.') +
      '</p><p>' + (rep.note || '') + '</p></div></div>' +

      gapBlock(rep) +

      '<dl class="stats">' +
      stat('Path length', (len / 1609).toFixed(2), 'mi') +
      stat('Maximum width', TS.fmtWidth(sim.peakRmax * 2), '') +
      stat('Duration', fmtTime(sim.t), '') +
      stat('Modelled peak wind', rep.modelledPeakMph, 'mph') +
      stat('— of which rotation', rep.rotationalPeakMph, 'mph') +
      stat('Survey estimate', rep.peakEstimatedMph || '—', 'mph') +
      stat('Structures damaged', rep.damaged, '') +
      stat('Destroyed', rep.destroyed, '') +
      stat('Trees damaged', rep.treesDamaged, '') +
      stat('Poles down', rep.polesDown, '') +
      '</dl>' +

      '<h3>Damage swath</h3>' +
      '<canvas class="swathmap" id="swathmap" width="900" height="420"></canvas>' +
      '<div class="legend">' +
      '<span><i style="background:#3a3020"></i>path</span>' +
      '<span><i style="background:#7fb8d8"></i>EF0–1</span>' +
      '<span><i style="background:#ffd166"></i>EF2</span>' +
      '<span><i style="background:#ff9f45"></i>EF3</span>' +
      '<span><i style="background:#ff6f4a"></i>EF4</span>' +
      '<span><i style="background:#ff4d6d"></i>EF5</span>' +
      '</div>' +

      '<h3>What was hit, and whether it could tell us anything</h3>' +
      '<table><thead><tr><th>Damage indicator</th><th class="num">Struck</th>' +
      '<th class="num">Worst DOD</th><th>Value to a survey</th></tr></thead>' +
      '<tbody>' + (byType || '<tr><td colspan="4">Nothing was struck.</td></tr>') + '</tbody></table>' +

      '<h3>Rotation is not the whole wind</h3>' +
      '<p style="font-size:11.5px;line-height:1.7;color:var(--muted)">' +
      'The vortex rotated at up to <b>' + rep.rotationalPeakMph + ' mph</b>, but the tornado was ' +
      'also travelling at ' + rep.translationMph + ' mph, and on the right-hand side of the path ' +
      'those add together. The strongest ground-relative wind was about <b>' + rep.modelledPeakMph +
      ' mph</b> — and that is the wind structures actually had to survive. It is also why the ' +
      'damage on one side of the swath is consistently worse than on the other.</p>' +
      '<h3>How to read this</h3>' +
      '<p style="font-size:11.5px;line-height:1.7;color:var(--muted)">' +
      'The Enhanced Fujita rating above was produced the way a real one is: by looking at what broke ' +
      'and inferring the wind needed to break it. It is not a measurement of the tornado. Run the ' +
      'same tornado across open farmland and then across the town, and the rating will change while ' +
      'the tornado does not — which is the single most important thing to understand about the scale.' +
      '</p>' +
      '</div>';

    $('#report').classList.remove('hidden');
    $('#report .close').addEventListener('click', () => $('#report').classList.add('hidden'));
    drawSwath($('#swathmap'), [{ path: sim.path, color: '#ffd166', label: 'this run' }]);
  }

  function gapBlock(rep) {
    if (!rep.rating) return '';
    if (rep.gap < -8) {
      return '<p class="gap"><b>The damage reads high:</b> the strongest wind the model applied was <b>' +
        rep.modelledPeakMph + ' mph</b>, but the damage supports an estimate of <b>' +
        rep.peakEstimatedMph + ' mph</b>. That is not a contradiction. The degree-of-damage tables ' +
        'assume a brief gust, and this tornado lingered — prolonged loading destroys structures a ' +
        'short, stronger gust would leave standing. Slow-moving tornadoes are over-estimated by ' +
        'damage surveys for exactly this reason, and it is one of the known limitations of the scale.</p>';
    }
    if (rep.gap < 18) return '';
    return '<p class="gap"><b>The gap:</b> the model was applying winds up to <b>' +
      rep.modelledPeakMph + ' mph</b>, but the damage only supports <b>' +
      rep.peakEstimatedMph + ' mph</b> — a difference of ' + rep.gap +
      ' mph. Nothing strong enough was standing in the right place to record the rest. ' +
      'Real surveys hit this constantly, and it is why tornado intensity records are a record ' +
      'of what tornadoes have hit, not of how strong tornadoes get.</p>';
  }

  function stat(k, v, u) {
    return '<div class="stat"><dt>' + k + '</dt><dd>' + v +
      (u ? ' <small>' + u + '</small>' : '') + '</dd></div>';
  }


  /* Plan-view swath map. Draws one or more runs so What-If can overlay a
     comparison on the original without a second widget. */

  function drawSwath(canvas, runs) {
    const g = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    g.fillStyle = '#04070c';
    g.fillRect(0, 0, W, H);

    // Fit every path in view.
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const r of runs) for (const p of r.path) {
      if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    if (minX > maxX) return;
    const pad = 400;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const sc = Math.min(W / (maxX - minX), H / (maxY - minY));
    const ox = (W - (maxX - minX) * sc) / 2, oy = (H - (maxY - minY) * sc) / 2;
    const PX = (x) => ox + (x - minX) * sc;
    const PY = (y) => H - (oy + (y - minY) * sc);

    // Structures, coloured by the EF band their damage supports — this is
    // the damage swath, built from observations rather than drawn as a band.
    if (terrain) {
      for (const s of terrain.structures) {
        if (s.dod <= 0) continue;
        const spec = TS.DI_SPECS[s.di];
        const est = TS.surveyEstimate(spec.ms[s.dod - 1], s.quality);
        const band = TS.efFromMph(est);
        g.fillStyle = band
          ? ['#7fb8d8', '#7fb8d8', '#ffd166', '#ff9f45', '#ff6f4a', '#ff4d6d'][band.ef]
          : '#4a5568';
        const px = PX(s.x), py = PY(s.y);
        g.fillRect(px - 1.4, py - 1.4, 2.8, 2.8);
      }
      g.fillStyle = 'rgba(90,120,80,0.5)';
      for (const t of terrain.trees) {
        if (t.dod <= 0) continue;
        g.fillRect(PX(t.x) - 0.8, PY(t.y) - 0.8, 1.6, 1.6);
      }
    }

    for (const r of runs) {
      g.strokeStyle = r.color;
      g.lineWidth = 1.6;
      g.setLineDash(r.dash || []);
      g.beginPath();
      r.path.forEach((p, i) => i ? g.lineTo(PX(p.x), PY(p.y)) : g.moveTo(PX(p.x), PY(p.y)));
      g.stroke();
      g.setLineDash([]);

      // Width envelope, so the swath reads as an area rather than a line.
      g.fillStyle = r.color.replace(')', ',0.10)').replace('rgb', 'rgba');
      g.globalAlpha = 0.16;
      g.beginPath();
      for (let i = 0; i < r.path.length; i++) {
        const p = r.path[i], q = r.path[Math.min(i + 1, r.path.length - 1)];
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
        g.lineTo(PX(p.x - dy / d * p.rmax * 1.5), PY(p.y + dx / d * p.rmax * 1.5));
      }
      for (let i = r.path.length - 1; i >= 0; i--) {
        const p = r.path[i], q = r.path[Math.min(i + 1, r.path.length - 1)];
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
        g.lineTo(PX(p.x + dy / d * p.rmax * 1.5), PY(p.y - dx / d * p.rmax * 1.5));
      }
      g.closePath();
      g.fillStyle = r.color;
      g.fill();
      g.globalAlpha = 1;

      if (r.label) {
        const last = r.path[r.path.length - 1];
        g.fillStyle = r.color;
        g.font = '11px "Space Mono", monospace';
        g.fillText(r.label, PX(last.x) + 6, PY(last.y));
      }
    }

    // Scale bar
    const km = 1000 * sc;
    g.strokeStyle = 'rgba(207,217,234,0.5)';
    g.beginPath(); g.moveTo(16, H - 20); g.lineTo(16 + km, H - 20); g.stroke();
    g.fillStyle = 'rgba(207,217,234,0.7)';
    g.font = '10px "Space Mono", monospace';
    g.fillText('1 km', 16 + km / 2 - 12, H - 25);
  }


  /* ═══════════════════════════════════════════════════════════════════
     WHAT IF?

     Re-runs from the same seed with exactly one parameter changed. That
     the comparison is fair is a property of the architecture, not of this
     function: nothing in the sim layer touches an unseeded random number,
     so the only thing that differs between the two runs is the thing the
     user changed.
     ═══════════════════════════════════════════════════════════════════ */

  const WHATIFS = [
    { id: 'faster', label: 'moved twice as fast', apply: p => ({ forwardSpeed: Math.min(p.forwardSpeed * 2, 40) }) },
    { id: 'slower', label: 'moved half as fast', apply: p => ({ forwardSpeed: Math.max(p.forwardSpeed / 2, 1) }) },
    { id: 'halfwide', label: 'were half as wide', apply: p => ({ width: Math.max(p.width / 2, 40) }) },
    { id: 'twicewide', label: 'were twice as wide', apply: p => ({ width: Math.min(p.width * 2, 2400) }) },
    { id: 'multi', label: 'became multi-vortex', apply: () => ({ swirl: 2.0, multiVortex: 0.8 }) },
    { id: 'weaker', label: 'were one EF class weaker', apply: p => ({ vmax: p.vmax * 0.78 }) }
  ];

  function showWhatIf() {
    if (!sim.path.length) {
      addNote('Run a tornado first — What If needs something to compare against.', 'obs');
      return;
    }
    const base = baseline || snapshotRun();

    const envOpts = TS.ENVIRONMENTS.filter(e => e.key !== envKey)
      .map(e => '<option value="env:' + e.key + '">crossed ' + e.name.toLowerCase() + '</option>').join('');

    $('#report').innerHTML =
      '<button class="close">× close</button><div class="sheet">' +
      '<h2>What if&hellip;</h2>' +
      '<p class="lede">Same seed, same landscape, one thing changed. Everything else is held identical, ' +
      'so any difference you see is caused by the change and nothing else.</p>' +
      '<div style="display:flex;gap:.5rem;align-items:center;margin-bottom:1.4rem">' +
      '<select id="wi-pick" style="max-width:26rem">' +
      WHATIFS.map(w => '<option value="' + w.id + '">this tornado ' + w.label + '</option>').join('') +
      envOpts + '</select>' +
      '<button class="btn primary" id="wi-run" style="max-width:9rem">Run it</button></div>' +
      '<div id="wi-out"><p style="color:var(--muted);font-size:11.5px">Pick a change and run it.</p></div>' +
      '</div>';
    $('#report').classList.remove('hidden');
    $('#report .close').addEventListener('click', () => $('#report').classList.add('hidden'));
    $('#wi-run').addEventListener('click', () => runWhatIf(base, $('#wi-pick').value));
  }

  function runWhatIf(base, choice) {
    const out = $('#wi-out');
    out.innerHTML = '<p style="color:var(--muted);font-size:11.5px">Running the alternative&hellip;</p>';

    // Yield a frame so the message paints before the run blocks.
    setTimeout(() => {
      let params = Object.assign({}, base.params);
      let key = base.envKey, label;

      if (choice.startsWith('env:')) {
        key = choice.slice(4);
        label = 'crossed ' + TS.ENVIRONMENTS.find(e => e.key === key).name.toLowerCase();
      } else {
        const w = WHATIFS.find(x => x.id === choice);
        Object.assign(params, w.apply(base.params));
        label = 'it ' + w.label;
      }

      const t2 = TS.buildTerrain(key, base.seed);
      const s2 = new TS.Sim({
        seed: base.seed, params, env: Object.assign({}, base.env),
        terrain: t2, visual: false
      });
      s2.runToEnd();
      const rep2 = TS.assessDamage(s2);
      const rep1 = base.report;

      const rows = [
        ['EF rating', rep1.rating ? rep1.rating.label : 'unrated', rep2.rating ? rep2.rating.label : 'unrated', 'txt'],
        ['Survey estimate', rep1.peakEstimatedMph + ' mph', rep2.peakEstimatedMph + ' mph', 'num',
          rep2.peakEstimatedMph - rep1.peakEstimatedMph],
        ['Modelled peak', rep1.modelledPeakMph + ' mph', rep2.modelledPeakMph + ' mph', 'num',
          rep2.modelledPeakMph - rep1.modelledPeakMph],
        ['Path length', (pathLength(base.path) / 1609).toFixed(2) + ' mi',
          (pathLength(s2.path) / 1609).toFixed(2) + ' mi', 'num',
          (pathLength(s2.path) - pathLength(base.path)) / 1609],
        ['Structures damaged', rep1.damaged, rep2.damaged, 'num', rep2.damaged - rep1.damaged],
        ['Destroyed', rep1.destroyed, rep2.destroyed, 'num', rep2.destroyed - rep1.destroyed],
        ['Trees damaged', rep1.treesDamaged, rep2.treesDamaged, 'num', rep2.treesDamaged - rep1.treesDamaged]
      ];

      out.innerHTML =
        '<div class="compare">' +
        '<div><h4>Original</h4>' + rows.map(r => miniRow(r[0], r[1])).join('') + '</div>' +
        '<div><h4>What if ' + label + '</h4>' + rows.map(r =>
          miniRow(r[0], r[2], r[3] === 'num' ? r[4] : null)).join('') + '</div>' +
        '</div>' +
        '<h3>Both paths</h3>' +
        '<canvas class="swathmap" id="wi-map" width="900" height="420"></canvas>' +
        '<div class="legend"><span><i style="background:#ffd166"></i>original</span>' +
        '<span><i style="background:#4fc3f7"></i>alternative</span></div>' +
        '<p style="font-size:11.5px;line-height:1.7;color:var(--muted);margin-top:1rem">' +
        whatIfComment(rep1, rep2, choice) + '</p>';

      drawSwath($('#wi-map'), [
        { path: base.path, color: '#ffd166', label: 'original' },
        { path: s2.path, color: '#4fc3f7', label: 'alternative', dash: [5, 4] }
      ]);
    }, 30);
  }

  function miniRow(k, v, delta) {
    let d = '';
    if (delta != null && Math.abs(delta) > 0.001) {
      const cls = delta > 0 ? 'up' : 'down';
      const val = Math.abs(delta) < 10 ? Math.abs(delta).toFixed(1) : Math.round(Math.abs(delta));
      d = ' <span class="' + cls + '">' + (delta > 0 ? '▲' : '▼') + val + '</span>';
    }
    return '<div class="ro"><dt>' + k + '</dt><dd class="delta">' + v + d + '</dd></div>';
  }

  function whatIfComment(a, b, choice) {
    const dEst = b.peakEstimatedMph - a.peakEstimatedMph;
    if (choice.startsWith('env:')) {
      return 'The tornado was identical in both runs — same seed, same wind field, same track. ' +
        'Only what stood in its way changed, and the rating moved by ' + Math.abs(dEst) +
        ' mph. That is the whole argument for why the EF scale is a damage scale: it can only ' +
        'report what the tornado happened to meet.';
    }
    if (choice === 'faster' || choice === 'slower') {
      return 'Forward speed changes two things at once. It shifts the wind asymmetry between the ' +
        'two flanks, and it changes how long anything stays under load. A slower tornado covers ' +
        'less ground but works on each structure for longer.';
    }
    if (choice === 'halfwide' || choice === 'twicewide') {
      return 'Width does not change the peak wind — it changes how much is exposed to it. Notice ' +
        'whether the rating moved at all: often it does not, while the number of buildings hit ' +
        'changes enormously.';
    }
    if (choice === 'multi') {
      return 'Subvortices concentrate damage into narrow streaks inside the wider path. Total ' +
        'damage may not rise much, but the worst damage gets worse — and it becomes patchy in a ' +
        'way that is recognisable on the ground.';
    }
    return 'Compare the survey estimate rather than the modelled wind. The modelled number is what ' +
      'the simulation applied; the survey number is all anyone could actually have known.';
  }


  /* ═══════════════════════════════════════════════════════════════════
     EXPLAIN THIS TORNADO
     ═══════════════════════════════════════════════════════════════════ */

  function showExplain() {
    const d = sim.derived;
    const rep = TS.assessDamage(sim);
    const p = sim.params;
    const fs = sim.funnelSummary();
    const bits = [];

    bits.push(['established',
      'You asked for a peak wind of ' + Math.round(p.vmax * MPH) + ' mph across a damage path ' +
      TS.fmtWidth(p.width) + ' wide, travelling ' + Math.round(p.forwardSpeed * MPH) +
      ' mph toward ' + TS.compass(p.heading) + '. Because forward motion adds to the rotation on ' +
      'one side and subtracts on the other, the two flanks differed by about ' +
      Math.round(p.forwardSpeed * 2 * MPH) + ' mph the whole way.']);

    bits.push(['established',
      'Cloud base sat at ' + Math.round(d.cloudBase) + ' m, set by a ' +
      Math.round(sim.env.surfaceTemp - sim.env.dewpoint) + '°C spread between temperature and dew point. ' +
      (fs.groundFrac > 0.70
        ? 'That was low enough for the funnel to condense to the ground and essentially stay there.'
        : fs.groundFrac > 0.12
          ? 'That put the condensation level right at the limit. The funnel reached the ground about ' +
            Math.round(fs.groundFrac * 100) + '% of the time — during surges — and otherwise hung around ' +
            Math.round(fs.avg) + ' m up. The damaging wind underneath it never went away.'
          : 'That was high enough that condensation never reached the ground. The funnel hung around ' +
            Math.round(fs.avg) + ' m up while full-strength wind carried on underneath it, which is ' +
            'the most dangerous thing a tornado can do: be entirely present and barely visible.')]);

    if (sim.subvortices.length) {
      bits.push(['simplified',
        'A swirl ratio of ' + sim.swirlNow.toFixed(2) + ' pushed the vortex past breakdown into ' +
        sim.subvortices.length + ' subvortices. The sequence is real and reproduced in laboratory ' +
        'chambers; the exact threshold used here is ours.']);
    }

    if (sim.env.mode === 'derived' && d.draw) {
      bits.push(['open',
        'In environment-driven mode the atmosphere delivered ' + Math.round(d.draw.value * 100) +
        '% of what you asked for. That figure was drawn from a wide distribution, and re-rolling ' +
        'the identical sounding would give a different answer — because why one supercell in a ' +
        'favourable environment produces a tornado and its neighbour does not is genuinely unsolved.']);
    }

    bits.push([rep.rating ? 'established' : 'established',
      rep.rating
        ? 'The survey rated it ' + rep.rating.label + ', resting on ' + rep.drivingName +
          ' at "' + rep.drivingLabel + '". That supports ' + rep.peakEstimatedMph +
          ' mph. The strongest ground-relative wind the model actually applied was ' +
          rep.modelledPeakMph + ' mph.' +
          (rep.gap > 18
            ? ' The ' + rep.gap + ' mph difference is not an error — it is the part of the ' +
              'tornado that left no record, because nothing strong enough stood where it was strongest.'
            : rep.gap < -8
              ? ' Note that the damage implies MORE wind than actually occurred. That is not a ' +
                'bug: this tornado lingered, and the damage tables assume a brief gust. Prolonged ' +
                'loading breaks things a short stronger gust would not, so a survey reads high. ' +
                'Slow-moving tornadoes are over-estimated for exactly this reason.'
              : '')
        : 'Nothing rateable was struck, so no rating could be assigned at all. This is common for ' +
          'tornadoes over open country, and it is why the historical record undercounts strong ones.']);

    $('#report').innerHTML =
      '<button class="close">× close</button><div class="sheet">' +
      '<h2>Explain this tornado</h2>' +
      '<p class="lede">' + TS.EXPLAIN.disclaimer + '</p>' +
      bits.map(b =>
        '<p style="font-size:12.5px;line-height:1.8;margin:0 0 1.1rem;padding-left:.9rem;' +
        'border-left:2px solid var(--' +
        (b[0] === 'established' ? 'tag-established' : b[0] === 'open' ? 'tag-open' : 'tag-simplified') +
        ')"><span class="tag ' + tagClass(b[0]) + '" style="margin-right:.5rem">' +
        tagLabel(b[0]) + '</span>' + b[1] + '</p>').join('') +
      '</div>';
    $('#report').classList.remove('hidden');
    $('#report .close').addEventListener('click', () => $('#report').classList.add('hidden'));
  }


  /* ═══════════════════════════════════════════════════════════════════
     THE FUJITA GHOST

     Dial the peak wind to exactly 318 mph — the figure a Doppler on
     Wheels recorded above Bridge Creek, Oklahoma on 3 May 1999, and one
     of the most-argued-over numbers in the field.
     ═══════════════════════════════════════════════════════════════════ */

  let ghostSeen = false;

  function checkGhost(mph) {
    if (mph !== 318 || ghostSeen) return;
    ghostSeen = true;
    const el = $('#ghost');
    const paper = el.querySelector('.paper');
    el.classList.remove('hidden', 'out');
    paper.textContent = '';

    const text =
      'FUJITA, T. — SMRP RESEARCH PAPER, UNIV. CHICAGO\n' +
      '3 MAY 1999 · BRIDGE CREEK, OKLA. · DOW: 318 MPH\n' +
      '\n' +
      'THE SCALE WAS NEVER MEANT TO MEASURE WIND.\n' +
      'IT WAS MEANT TO READ WHAT THE WIND LEFT BEHIND.\n' +
      '\n' +
      'A NUMBER MEASURED 30 M ABOVE A ROAD IS NOT A\n' +
      'RATING. THE HOUSE IS THE INSTRUMENT. THE SCALE\n' +
      'ONLY ASKS WHAT IT TOOK TO BREAK IT.\n' +
      '\n' +
      '— rendered by Claude Opus 5 (Anthropic), via Claude Code';

    let i = 0;
    const tick = setInterval(() => {
      paper.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(tick);
        setTimeout(() => {
          el.classList.add('out');
          setTimeout(() => el.classList.add('hidden'), 800);
        }, 4200);
      }
    }, 14);
  }


  /* ═══════════════════════════════════════════════════════════════════ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

})(window.TS);
