/* ═══════════════════════════════════════════════════════════════════════
   sim-env.js — the atmospheric lab
   ───────────────────────────────────────────────────────────────────────
   Environmental parameters here set RANGES AND TENDENCIES. They never add
   up to a hidden "tornado power" number, because that would teach exactly
   the wrong lesson: real forecasters cannot predict tornado intensity from
   a sounding, and this file should not pretend otherwise.

   Two modes:
     'direct'  — the tornado sliders are authoritative. The environment
                 still governs appearance (cloud base, funnel condensation,
                 rain-wrapping), so the funnel-vs-wind-field lesson is
                 available without entering the lab at all.
     'derived' — the environment proposes what it can support, and the
                 result is a DRAW, not a calculation. Re-roll the same
                 environment and you get a different tornado. That is the
                 point, and the UI says so out loud.
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  const clamp = TS.clamp;
  const lerp = TS.lerp;


  TS.defaultEnv = function () {
    return {
      mode:        'direct',  // direct | derived
      surfaceTemp:  29,       // °C
      dewpoint:     22,       // °C
      cape:         2800,     // J/kg
      shear:        22,       // m/s, 0–6 km bulk shear
      helicity:     250,      // m²/s², 0–1 km storm-relative helicity
      stormRelWind: 14,       // m/s, low-level storm-relative flow
      precip:       0.45,     // 0…1 precipitation intensity
      envSeed:      7          // re-roll handle for the 'derived' draw
    };
  };


  /* ── Lifting condensation level ───────────────────────────────────────
     Espy's rule: roughly 125 m of lift per °C of temperature–dewpoint
     spread. Crude, well over a century old, and still close enough that
     forecasters use it in their heads. [established, approximated]

     This is the single most consequential derived number in the whole
     lab, because cloud base is what decides whether a condensation funnel
     can reach the ground. */

  TS.lclHeight = function (tempC, dewC) {
    return clamp(125 * Math.max(0, tempC - dewC), 60, 3600);
  };

  /* The inverse, so the UI can offer a "cloud base height" slider that
     writes back to dewpoint. Dragging cloud base IS changing the moisture
     — better to make that visible than to carry two numbers that can
     silently disagree. */

  TS.cloudBaseToDewpoint = function (tempC, metres) {
    return tempC - clamp(metres, 60, 3600) / 125;
  };

  /* Relative humidity from temp/dewpoint via Magnus. Used for haze and
     for how quickly lofted dust stays visible. */

  TS.relHumidity = function (tempC, dewC) {
    const es = (t) => 6.112 * Math.exp((17.67 * t) / (t + 243.5));
    return clamp(es(dewC) / es(tempC), 0.05, 1);
  };


  /* ── Composite environmental support ──────────────────────────────────
     A simplified cousin of the Significant Tornado Parameter: it blends
     instability, low-level rotation, deep shear, and cloud-base height.
     Each ingredient below is genuinely part of the real index.

     What this number is: a measure of how FAVOURABLE the setup is.
     What it is NOT: a prediction of how strong the tornado will be. The
     lab is explicit about the difference, and `intensityDraw` below is
     built so that a great environment still frequently underperforms. */

  TS.supportIndex = function (env) {
    const lcl = TS.lclHeight(env.surfaceTemp, env.dewpoint);

    const capeTerm = clamp(env.cape / 2500, 0, 2);
    const srhTerm  = clamp(env.helicity / 250, 0, 2);
    const shearTerm = clamp((env.shear - 8) / 12, 0, 2);
    // Low cloud bases favour tornadoes; very high ones strongly disfavour.
    const lclTerm  = clamp((2000 - lcl) / 1200, 0, 1.4);

    const raw = capeTerm * srhTerm * shearTerm * lclTerm;
    return { raw, capeTerm, srhTerm, shearTerm, lclTerm, lcl };
  };

  /* Energy–Helicity Index — a real, widely used quantity, worth surfacing
     because users may have seen it and it is trivially derived. */
  TS.ehi = function (env) {
    return (env.cape * env.helicity) / 160000;
  };

  /* Theoretical parcel updraft maximum, sqrt(2 * CAPE). Real updrafts run
     roughly half this because of water loading and entrainment — showing
     both is a good, cheap lesson about idealised numbers. */
  TS.updraftPotential = function (cape) {
    const theoretical = Math.sqrt(2 * Math.max(0, cape));
    return { theoretical, realistic: theoretical * 0.5 };
  };


  /* ── The draw ─────────────────────────────────────────────────────────
     In 'derived' mode this returns the fraction of the requested peak wind
     the atmosphere actually delivers on this attempt. The spread is wide
     and stays wide: a superb environment narrows the odds but never
     guarantees a violent tornado, and a marginal one can still overachieve.

     Deterministic in (envSeed, environment) so a run stays reproducible,
     but re-rollable so the user can watch the same setup produce different
     outcomes — which is the honest depiction of what the science supports. */

  TS.intensityDraw = function (env) {
    const s = TS.supportIndex(env);
    const support = clamp(s.raw / 4, 0, 1);

    const rng = TS.makeRNG((env.envSeed >>> 0) * 2654435761 + 12345);
    const centre = 0.42 + 0.52 * support;
    const spread = 0.26 * (1 - 0.35 * support);
    const draw = clamp(rng.normal(centre, spread), 0.12, 1.18);

    // A genuinely hostile environment can fail outright, which is also
    // real: most supercells never produce a tornado at all.
    const failed = support < 0.06 && rng() < 0.5;

    return { value: failed ? 0.1 : draw, support, centre, spread, failed };
  };


  /* ── Storm mode / visual character ───────────────────────────────────
     The LP ↔ classic ↔ HP spectrum is what actually makes a tornado
     rain-wrapped: it is about where precipitation falls relative to the
     mesocyclone, driven by storm-relative flow and precipitation load —
     not a "rain-wrapped" toggle. */

  TS.stormMode = function (env) {
    const wrap = clamp(env.precip * 1.15 - (env.stormRelWind - 8) / 26, 0, 1);
    const mode = wrap > 0.62 ? 'HP' : wrap < 0.28 ? 'LP' : 'Classic';
    const label = mode === 'HP' ? 'high-precipitation'
      : mode === 'LP' ? 'low-precipitation' : 'classic';
    return { wrap, mode, label };
  };


  /* ── The single entry point the sim calls ────────────────────────────
     Everything above collapses into the handful of numbers sim-core needs.
     Keeping this the only export point means the sim never has to know
     what an EHI is. */

  TS.deriveEnvironment = function (env, params) {
    const lcl = TS.lclHeight(env.surfaceTemp, env.dewpoint);
    const rh = TS.relHumidity(env.surfaceTemp, env.dewpoint);
    const support = TS.supportIndex(env);
    const storm = TS.stormMode(env);
    const updraft = TS.updraftPotential(env.cape);

    // Condensation coefficient: pascals of pressure deficit needed per
    // metre the funnel descends below cloud base. The user's condensation
    // slider biases it; moisture nudges it. Cloud base does the real work.
    const bias = params ? params.condensation : 0.5;
    const condensationCoeff = lerp(7.2, 2.1, clamp(bias, 0, 1)) * lerp(1.12, 0.92, rh);

    // Downshear lean, in metres of horizontal offset at cloud base.
    const shearLean = clamp((env.shear - 6) * 7.5, 0, 380);

    // Concentrated low-level rotation nudges the vortex toward breakdown.
    const swirlBias = clamp((env.helicity - 200) / 700, -0.28, 0.34);

    let intensityCeiling = 1;
    let draw = null;
    if (env.mode === 'derived') {
      draw = TS.intensityDraw(env);
      intensityCeiling = draw.value;
    }

    return {
      lclHeight: lcl,
      cloudBase: lcl,
      relHumidity: rh,
      condensationCoeff,
      shearLean,
      swirlBias,
      intensityCeiling,
      draw,
      support,
      storm,
      updraft,
      ehi: TS.ehi(env)
    };
  };

})(window.TS);
