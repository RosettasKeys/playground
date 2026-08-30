/* ═══════════════════════════════════════════════════════════════════════
   data-content.js — presets, tooltips, narration rules, field notes
   ───────────────────────────────────────────────────────────────────────
   All the words. Kept apart from the machinery so the copy can be edited
   without touching physics, and so every explanatory claim sits next to
   the tag saying how much weight it can bear.

   Tags:  established     — well supported by observation
          simplified     — real, but modelled crudely here
          open           — an active research question
   ═══════════════════════════════════════════════════════════════════════ */

window.TS = window.TS || {};

(function (TS) {
  'use strict';

  /* ── Control definitions ─────────────────────────────────────────────
     `key` names the sim parameter; `to`/`from` convert between the metric
     value the sim stores and whatever unit reads best to a person. */

  const MPH = TS.MPH;

  TS.CONTROLS = {

    vortex: [
      /* Stepped in mph rather than m/s. The sim is metric throughout, but
         a slider that moves in 2.2 mph jumps cannot land on a specific
         historic figure — and one particular figure is worth being able
         to reach exactly. */
      { key: 'vmax', group: 'vortex',
        ui: { min: 40, max: 325, step: 1, to: v => v * MPH, from: v => v / MPH },
        label: 'Maximum wind speed',
        fmt: v => Math.round(v * MPH) + ' mph',
        tip: {
          title: 'Maximum wind speed', tag: 'established',
          text: 'The fastest wind in the vortex, at the radius of maximum wind. Everything inside that radius spins more slowly, like a record; everything outside falls away with distance.',
          why: 'This is the wind the model applies. It is NOT the number the post-storm rating will report — that one comes from what actually broke.'
        } },
      { key: 'width', min: 40, max: 2400, step: 10, group: 'vortex',
        label: 'Tornado width',
        fmt: v => v >= 1609 ? (v / 1609).toFixed(2) + ' mi' : Math.round(v) + ' m',
        tip: {
          title: 'Tornado width', tag: 'established',
          text: 'The width of the damaging wind field — twice the radius of maximum wind. The visible funnel is usually narrower than this, and sometimes very much narrower.',
          why: 'Widening a tornado exposes more ground to damaging wind without making the peak wind any higher.'
        } },
      { key: 'swirl', min: 0.15, max: 2.6, step: 0.05, group: 'vortex',
        label: 'Swirl ratio',
        fmt: v => v.toFixed(2),
        tip: {
          title: 'Swirl ratio', tag: 'simplified',
          text: 'How much the inflow is rotating relative to how fast it is being drawn upward. Raise it and the vortex walks through a real sequence seen in laboratory chambers: a single smooth core, then a breakdown bubble, then a two-celled vortex, then multiple subvortices.',
          why: 'The sequence is well established. The exact point where subvortices appear here is our choice, not nature’s.'
        } },
      { key: 'multiVortex', min: 0, max: 1, step: 0.02, group: 'vortex',
        label: 'Subvortex tendency',
        fmt: v => Math.round(v * 100) + '%',
        tip: {
          title: 'Subvortex tendency', tag: 'simplified',
          text: 'An extra nudge toward vortex breakdown, on top of the swirl ratio. Subvortices are small, fast, short-lived whirls orbiting inside the parent circulation.',
          why: 'They are why damage inside a single tornado path can vary from total to trivial across a few metres.'
        } },
      { key: 'fluctuation', min: 0, max: 1, step: 0.02, group: 'vortex',
        label: 'Strength variability',
        fmt: v => Math.round(v * 100) + '%',
        tip: {
          title: 'Strength variability', tag: 'established',
          text: 'How much the tornado surges and slackens over its life. Real tornadoes are rarely steady; they pulse.',
          why: 'A tornado that surges as it crosses a town rates very differently from one that surges over a field two minutes earlier.'
        } }
    ],

    track: [
      { key: 'forwardSpeed', min: 1, max: 40, step: 0.5, group: 'track',
        label: 'Forward speed',
        fmt: v => Math.round(v * MPH) + ' mph',
        tip: {
          title: 'Forward speed', tag: 'established',
          text: 'How fast the whole circulation travels across the ground. This adds vectorially to the rotation, so the right-hand side of the path (in the northern hemisphere) sees rotation plus forward motion, and the left sees rotation minus it.',
          why: 'A tornado moving at 60 mph has a 120 mph difference between its two flanks. That asymmetry is visible in almost every damage survey.'
        } },
      { key: 'heading', min: 0, max: 359, step: 1, group: 'track',
        label: 'Direction of travel',
        fmt: v => Math.round(v) + '° ' + compass(v),
        tip: {
          title: 'Direction of travel', tag: 'established',
          text: 'The compass bearing the tornado moves toward. Most tornadoes in the US Plains track roughly northeast, following the parent storm.',
          why: 'Combined with path curvature, this decides what the tornado hits — which decides its rating.'
        } },
      { key: 'curvature', min: -30, max: 30, step: 0.5, group: 'track',
        label: 'Path curvature',
        fmt: v => (v === 0 ? 'straight' : Math.abs(v).toFixed(1) + '°/min ' + (v > 0 ? 'right' : 'left')),
        tip: {
          title: 'Path curvature', tag: 'established',
          text: 'How sharply the track bends. Tornadoes late in their life often hook left as the parent mesocyclone occludes and the vortex is swept around it.',
          why: 'A curving path is why damage swaths are so often arcs rather than straight lines.'
        } },
      { key: 'lifespan', min: 60, max: 3600, step: 10, group: 'track',
        label: 'Lifespan',
        fmt: v => Math.floor(v / 60) + ':' + String(Math.round(v % 60)).padStart(2, '0'),
        tip: {
          title: 'Lifespan', tag: 'established',
          text: 'How long the tornado is on the ground. Most last under ten minutes. A few have lasted well over an hour.',
          why: 'Lifespan times forward speed gives path length — and a long path crosses more things worth rating.'
        } }
    ],

    look: [
      { key: 'shape', type: 'select', group: 'look',
        label: 'Funnel shape',
        options: [
          ['rope', 'Rope — narrow and sinuous'],
          ['cone', 'Cone — classic, flaring upward'],
          ['stovepipe', 'Stovepipe — near-constant width'],
          ['wedge', 'Wedge — wider than it is tall']
        ],
        tip: {
          title: 'Funnel shape', tag: 'simplified',
          text: 'How the condensation funnel flares between the ground and cloud base. Shape is a consequence of the pressure field and the cloud base height, not a property a tornado chooses.',
          why: 'Here it is a direct control, which is a simplification. Shape genuinely does not predict strength: wedges can be weak and ropes can be violent.'
        } },
      { key: 'condensation', min: 0, max: 1, step: 0.02, group: 'look',
        label: 'Condensation bias',
        fmt: v => Math.round(v * 100) + '%',
        tip: {
          title: 'Condensation bias', tag: 'simplified',
          text: 'How readily the pressure drop inside the vortex produces visible cloud. Push it down and the funnel retreats upward while the wind field below is entirely unchanged.',
          why: 'The single most dangerous misconception about tornadoes is that the visible funnel is the tornado. It is not. It is only where the air happens to be condensing.'
        } },
      { key: 'debrisLoading', min: 0, max: 1, step: 0.02, group: 'look',
        label: 'Debris loading',
        fmt: v => Math.round(v * 100) + '%',
        tip: {
          title: 'Debris loading', tag: 'established',
          text: 'How much soil and material the tornado lifts. Dry, loose, freshly ploughed ground loads heavily; wet sod and pavement barely at all.',
          why: 'Lofted debris is what radar detects as a debris signature — direct confirmation that a tornado is on the ground and doing damage.'
        } }
    ],

    surface: [
      { key: 'surfaceTemp', min: 8, max: 42, step: 0.5, env: true,
        label: 'Surface temperature',
        fmt: v => Math.round(v) + '°C',
        tip: {
          title: 'Surface temperature', tag: 'established',
          text: 'How warm the air near the ground is. Together with the dew point it sets the cloud base height.',
          why: 'Warm air over a cooler layer aloft is unstable — it wants to rise, which is what powers the storm.'
        } },
      { key: 'dewpoint', min: -5, max: 27, step: 0.5, env: true,
        label: 'Dew point',
        fmt: v => Math.round(v) + '°C',
        tip: {
          title: 'Dew point', tag: 'established',
          text: 'The temperature at which the air would become saturated — in plain terms, how humid it is. The gap between temperature and dew point sets cloud base at roughly 125 metres per degree.',
          why: 'This is the control that decides whether a funnel can reach the ground at all. Watch the funnel, not the wind readout, as you drag it.'
        } },
      { key: 'precip', min: 0, max: 1, step: 0.02, env: true,
        label: 'Precipitation intensity',
        fmt: v => Math.round(v * 100) + '%',
        tip: {
          title: 'Precipitation intensity', tag: 'established',
          text: 'How much rain the storm is producing, and therefore how much of it wraps around the mesocyclone.',
          why: 'Heavy precipitation wrapping around the circulation is what makes a tornado rain-wrapped: fully formed, fully dangerous, and completely invisible until it arrives.'
        } },
      { key: 'stormRelWind', min: 2, max: 30, step: 0.5, env: true,
        label: 'Storm-relative wind',
        fmt: v => Math.round(v * MPH) + ' mph',
        tip: {
          title: 'Storm-relative wind', tag: 'established',
          text: 'How fast low-level air moves relative to the storm itself, rather than relative to the ground.',
          why: 'Strong storm-relative flow ventilates the updraft and carries precipitation away from it, keeping the tornado visible. Weak flow lets rain collapse back over the circulation.'
        } }
    ],

    shear: [
      { key: 'cape', min: 0, max: 7000, step: 50, env: true,
        label: 'CAPE (instability)',
        fmt: v => Math.round(v) + ' J/kg',
        tip: {
          title: 'CAPE — convective available potential energy', tag: 'established',
          text: 'How much buoyant energy a rising parcel of air can draw on. Think of it as how hard the atmosphere is willing to push upward.',
          why: 'High CAPE builds tall, powerful storms. But instability alone produces thunderstorms, not tornadoes — without rotation it goes nowhere.'
        } },
      { key: 'shear', min: 4, max: 45, step: 0.5, env: true,
        label: 'Deep-layer wind shear',
        fmt: v => Math.round(v * MPH) + ' mph',
        tip: {
          title: 'Deep-layer wind shear', tag: 'established',
          text: 'How much the wind changes speed and direction between the ground and about six kilometres up.',
          why: 'Shear tilts the updraft away from its own rain, so the storm does not choke on its downdraft. It is what separates a supercell from an ordinary thunderstorm that collapses in twenty minutes.'
        } },
      { key: 'helicity', min: 0, max: 900, step: 10, env: true,
        label: 'Low-level helicity',
        fmt: v => Math.round(v) + ' m²/s²',
        tip: {
          title: 'Storm-relative helicity, 0–1 km', tag: 'established',
          text: 'How much spin is available in the lowest kilometre of the atmosphere for the storm to tilt upright and stretch.',
          why: 'This is the ingredient most associated with tornadoes specifically, rather than with severe storms generally. It is still not a guarantee — see below.'
        } }
    ]
  };

  function compass(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    // Normalise first. A negative bearing used to index the array from
    // the wrong end and come back undefined, which no caller passed
    // until something needed a bearing computed with atan2.
    const d = ((deg % 360) + 360) % 360;
    return dirs[Math.round(d / 22.5) % 16];
  }
  TS.compass = compass;


  /* ── Presets ─────────────────────────────────────────────────────────
     Recognisable behaviours, each set up so that the thing it is meant to
     demonstrate actually shows. */

  TS.PRESETS = [
    { id: 'rope', name: 'Weak rope', hint: 'thin, wandering, brief',
      params: { vmax: 30, width: 60, shape: 'rope', forwardSpeed: 11, swirl: 0.5,
        lifespan: 180, condensation: 0.62, debrisLoading: 0.3, multiVortex: 0, fluctuation: 0.55, curvature: 7 },
      env: { surfaceTemp: 26, dewpoint: 18, cape: 1200, shear: 15, helicity: 130, precip: 0.3, stormRelWind: 12 } },

    { id: 'cone', name: 'Classic cone', hint: 'the textbook tornado',
      params: { vmax: 58, width: 320, shape: 'cone', forwardSpeed: 13, swirl: 0.95,
        lifespan: 420, condensation: 0.55, debrisLoading: 0.5, multiVortex: 0, fluctuation: 0.3, curvature: 2 },
      env: { surfaceTemp: 29, dewpoint: 21, cape: 2800, shear: 22, helicity: 260, precip: 0.4, stormRelWind: 15 } },

    { id: 'wedge', name: 'Large wedge', hint: 'wider than it is tall',
      params: { vmax: 88, width: 1500, shape: 'wedge', forwardSpeed: 12, swirl: 1.35,
        lifespan: 900, condensation: 0.72, debrisLoading: 0.72, multiVortex: 0.35, fluctuation: 0.22, curvature: 3 },
      env: { surfaceTemp: 31, dewpoint: 24, cape: 4200, shear: 30, helicity: 420, precip: 0.45, stormRelWind: 17 } },

    { id: 'slow', name: 'Slow violent', hint: 'lingers — dwell does the damage',
      params: { vmax: 96, width: 700, shape: 'stovepipe', forwardSpeed: 4.5, swirl: 1.1,
        lifespan: 1500, condensation: 0.6, debrisLoading: 0.8, multiVortex: 0.2, fluctuation: 0.18, curvature: -4 },
      env: { surfaceTemp: 31, dewpoint: 23, cape: 4600, shear: 28, helicity: 480, precip: 0.35, stormRelWind: 16 } },

    { id: 'fast', name: 'Fast mover', hint: 'lopsided damage, little warning',
      params: { vmax: 66, width: 420, shape: 'cone', forwardSpeed: 32, swirl: 0.9,
        lifespan: 300, condensation: 0.5, debrisLoading: 0.55, multiVortex: 0, fluctuation: 0.3, curvature: 1 },
      env: { surfaceTemp: 27, dewpoint: 19, cape: 2400, shear: 38, helicity: 350, precip: 0.5, stormRelWind: 22 } },

    { id: 'multi', name: 'Multi-vortex', hint: 'subvortices inside one storm',
      params: { vmax: 78, width: 900, shape: 'wedge', forwardSpeed: 14, swirl: 2.0,
        lifespan: 540, condensation: 0.45, debrisLoading: 0.9, multiVortex: 0.75, fluctuation: 0.35, curvature: 4 },
      env: { surfaceTemp: 30, dewpoint: 21, cape: 3600, shear: 26, helicity: 520, precip: 0.3, stormRelWind: 15 } },

    { id: 'wrapped', name: 'Rain-wrapped', hint: 'there, and invisible',
      params: { vmax: 74, width: 620, shape: 'stovepipe', forwardSpeed: 16, swirl: 1.05,
        lifespan: 480, condensation: 0.35, debrisLoading: 0.5, multiVortex: 0.15, fluctuation: 0.3, curvature: 5 },
      env: { surfaceTemp: 28, dewpoint: 24, cape: 3000, shear: 24, helicity: 340, precip: 0.95, stormRelWind: 7 } }
  ];


  /* ── Modes ────────────────────────────────────────────────────────
     Standard is the instrument. Tormato is a costume worn over the
     identical instrument: same wind field, same damage-indicator
     ladders, same rating, same radar products underneath the label. The
     only things that change are what the debris is made of, what the
     panels are called, and what the report is printed on.

     That constraint is not a matter of taste. Half this piece exists to
     argue that the EF rating comes from damage rather than from the
     wind you dialled in, and a mode that quietly moved a number would
     make the console a liar in both modes rather than only one. There is
     a check in verify.js (§14) that runs both modes from one seed and
     fails if a single rating or damage event differs. */

  TS.MODES = [
    {
      id: 'standard',
      name: 'Standard',
      hint: 'Severe weather, as surveyed',
      note: 'The instrument as intended. Everything on screen is derived from ' +
            'one wind field, and the rating at the end comes from what broke.'
    },
    {
      id: 'tormato',
      name: 'Tormato',
      hint: 'A tornado of tomatoes',
      note: 'Absurd on purpose, and honest underneath. The wind field, the ' +
            'damage ladders, the EF rating and every radar product are ' +
            'bit-for-bit identical to Standard — only the debris, the labels ' +
            'and the stationery change. Even the flight model is real: a ' +
            'tomato is nearly spherical and fairly dense, so it tracks the air ' +
            'closely and drops the instant the updraft lets go of it.'
    }
  ];

  /* Tormato renames three panels and nothing else. Each keeps the real
     figure beside it, because a joke that has to hide the measurement is
     not confident enough to be funny. */

  TS.TORMATO = {
    tag: 'not remotely established',
    radarLabel: 'PRODUCE',
    radarNote: 'Same reflectivity, velocity and storm-relative products as ever. ' +
               'The debris signature below the couplet is real too — it is fed by ' +
               'material genuinely in the air, which today happens to be salad.',
    salsaNote: 'Lofted mass over the swath area, normalised. It is the debris ' +
               'loading readout wearing a hat.',
    certTitle: 'CERTIFICATE OF PRODUCE GRADING',
    certAuthority: 'OFFICE OF AGRICULTURAL METEOROLOGY (fictitious)',
    photoTitle: 'Lot photograph · Tormato Alley, undated',
    photoNote: 'Not from this run, and not from any run. This is the reference ' +
      'the mode was built from, and it is the reason the mode exists at all. ' +
      'Every figure on this certificate was measured. The picture was not.',
    certFoot: 'Grade is the Enhanced Fujita rating, computed exactly as it is in ' +
              'Standard mode: from damage to recognised indicators, and from ' +
              'nothing else. No tomato was consulted.',
    facts: [
      'A tomato is botanically a berry — it develops from a single ovary and ' +
      'carries its seeds inside the flesh.',
      'In 1893 the US Supreme Court ruled unanimously that a tomato is a ' +
      'vegetable, for tariff purposes, because of how it is eaten rather than ' +
      'how it grows.',
      'Debris is what makes a tornado visible on radar. The debris signature ' +
      'does not care in the slightest what the debris used to be.',
      'The tomatoes are carried by the same wind field as everything else in ' +
      'this console. Nothing about them is on a timer.',
      'A tomato is nearly spherical and fairly dense, so it tracks the air ' +
      'closely and drops the moment the updraft lets go of it. That is why ' +
      'the fruit falls out of the column before the roof panels do.',
      'The EF rating below is computed from damage to buildings and trees. ' +
      'No quantity of airborne produce can move it in either direction.',
      'Tomatoes are not a damage indicator. Neither are cars. The scale rates ' +
      'things whose construction is knowable, which is a shorter list than ' +
      'most people expect.',
      'Every number in this console is the number Standard mode would show ' +
      'for the same seed. Only the stationery is different.'
    ],

    /* The report's prose. The FIGURES are never in here — ui.js substitutes
       those from the same assessDamage() call the standard report uses, so
       the two versions cannot drift apart. Only the sentences around them
       are Tormato's. */
    report: {
      swath: 'Distribution swath',
      byType: 'What was actually struck, and whether it could tell us anything',
      rotation: 'Rotation is not the whole wind',
      rotationBody: 'The column rotated at up to <b>{rot} mph</b>, but it was also ' +
        'travelling at {trans} mph, and on the right-hand side of the path those add ' +
        'together. The strongest ground-relative wind was about <b>{ground} mph</b> — ' +
        'that is the wind the buildings had to survive, and the speed the produce on ' +
        'that flank was doing. It is also why one side of the swath is consistently ' +
        'worse than the other.',
      howTo: 'How to read this',
      howToBody: 'The grade at the top is an Enhanced Fujita rating, produced the way a ' +
        'real one is: by looking at what broke and inferring the wind needed to break it. ' +
        'It is not a measurement of the tornado, and it is not a measurement of the ' +
        'tomatoes — the fruit contributes nothing to it at all. Run the same Tormato ' +
        'across open farmland and then across the town and the grade will change while ' +
        'the storm does not. That is the single most important thing to understand about ' +
        'the scale, and it is exactly as true in here as it is in Standard mode.',
      nothingStruck: 'Nothing was struck.',
      unrated: 'No gradeable damage'
    }
  };


  /* ── Visualisation layers ────────────────────────────────────────── */

  TS.LAYERS = [
    { id: 'wind',     name: 'Surface wind vectors', color: '#4fc3f7', on: false },
    { id: 'circ',     name: 'Tornado circulation',  color: '#f0b429', on: true },
    { id: 'updraft',  name: 'Updraft',              color: '#ff9f45', on: false },
    { id: 'downdraft',name: 'Downdraft',            color: '#7fb8d8', on: false },
    { id: 'rfd',      name: 'Rear-flank downdraft', color: '#b18cff', on: false },
    { id: 'precipl',  name: 'Precipitation',        color: '#8a97ab', on: true },
    { id: 'debrisl',  name: 'Debris cloud',         color: '#c9a86a', on: true },
    { id: 'pressure', name: 'Pressure field',       color: '#ff6f4a', on: false },
    { id: 'vort',     name: 'Rotation / vorticity', color: '#58e08a', on: false },
    { id: 'refl',     name: 'Radar reflectivity',   color: '#6ee0b8', on: false },
    { id: 'vel',      name: 'Radar velocity',       color: '#ff4d6d', on: false },
    { id: 'swath',    name: 'Damage swath',         color: '#ffd166', on: true }
  ];


  /* ── Narration rules ─────────────────────────────────────────────────
     Each rule is a predicate over live sim state plus a cooldown. Nothing
     fires on a timer: every line below is a measurement being reported.
     `once` means it will not repeat within a run. */

  const MPHR = (v) => Math.round(v * MPH);

  TS.RULES = [
    { id: 'genesis', cool: 999, once: true, pri: 5,
      when: s => s.vmax > 14 && s.t < 60,
      say: () => 'Circulation has reached the ground. Damaging wind is now in contact with the surface.' ,
      tsay: () => 'Circulation has reached the ground. Produce is now in contact with the surface.'
    },

    { id: 'lowrot', cool: 60, pri: 3,
      when: s => s.derived.support && s.derived.support.srhTerm > 1.2 && s.t < 90,
      say: () => 'Strong low-level rotation is developing — there is plenty of near-ground spin for the updraft to stretch.' ,
      tsay: () => 'Strong low-level rotation is developing. There is plenty of near-ground spin for the updraft to stretch, and plenty of salad for it to stretch.'
    },

    { id: 'widening', cool: 45, pri: 4,
      when: (s, m) => m.dRmax > 26 && s.vmax > 25,
      say: (s) => 'The tornado has widened to about ' + fmtWidth(s.rmax * 2) +
        ', increasing the area exposed to damaging winds.' ,
      tsay: (s) => 'The Tormato has widened to about ' + fmtWidth(s.rmax * 2) +
        ', increasing the area exposed to produce at speed.'
    },

    { id: 'narrowing', cool: 55, pri: 2,
      when: (s, m) => m.dRmax < -26 && s.vmax > 22,
      say: () => 'The circulation is contracting. A narrower vortex concentrates its rotation — this often means it is getting stronger, not weaker.' ,
      tsay: () => 'The circulation is contracting. A narrower vortex concentrates its rotation — and its tomatoes. This usually means stronger, not weaker.'
    },

    { id: 'rightside', cool: 90, pri: 4,
      when: s => s.params.forwardSpeed > 16 && s.vmax > 28,
      say: (s) => 'Forward motion of ' + MPHR(s.params.forwardSpeed) +
        ' mph is adding to wind speeds on the tornado’s right side and subtracting on its left — a ' +
        MPHR(s.params.forwardSpeed * 2) + ' mph difference across the path.' ,
      tsay: (s) => 'Forward motion of ' + MPHR(s.params.forwardSpeed) +
        ' mph is adding to wind speeds on the right side and subtracting on the left — a ' +
        MPHR(s.params.forwardSpeed * 2) + ' mph difference across the path. The right flank is getting the fastest tomatoes.'
    },

    { id: 'funnelgap', cool: 80, pri: 5,
      when: s => s.vmax > 30 && s.funnelBase > s.derived.cloudBase * 0.22,
      say: (s) => 'The condensation funnel stops about ' + Math.round(s.funnelBase) +
        ' m above the ground, but the damaging wind field below it is ' + fmtWidth(s.rmax * 2) +
        ' wide. What you can see is not the tornado.' ,
      tsay: (s) => 'The condensation funnel stops about ' + Math.round(s.funnelBase) +
        ' m above the ground, but the damaging wind field below it is ' + fmtWidth(s.rmax * 2) +
        ' wide. The tomatoes stop where the funnel does. The wind does not.'
    },

    { id: 'wider', cool: 100, pri: 4,
      when: s => s.vmax > 30 && s.funnelBase < 40 &&
        s.funnelRadiusAt(20) < s.rmax * 0.75,
      say: () => 'The visible funnel is narrower than the actual damaging wind field. Debris is being thrown well outside anything you can see.' ,
      tsay: (s) => 'The debris cloud is running wider than the visible column. What you can see is the garnish, not the tornado.'
    },

    { id: 'tds', cool: 70, pri: 5,
      when: s => s.debrisTop > 180 && s.debrisLoad > 0.35,
      say: (s) => 'Debris is now being lofted past ' + Math.round(s.debrisTop) +
        ' m — high enough to appear on radar as a debris signature, which is direct confirmation of a tornado on the ground.' ,
      tsay: () => 'Radar is showing a debris signature — returns co-located with the circulation, from material genuinely in the air. The signature does not care that the material is fruit.'
    },

    { id: 'multi', cool: 70, pri: 5,
      when: s => s.subvortices.length >= 2,
      say: (s) => s.subvortices.length + ' subvortices are orbiting inside the parent circulation. Damage under a multi-vortex tornado varies enormously over just a few metres.' ,
      tsay: (s) => 'Subvortices have formed inside the parent circulation: ' + s.subvortices.length +
        ' of them, each carrying its own load of produce at well above the parent wind speed.'
    },

    { id: 'wrapped', cool: 120, pri: 5, once: true,
      when: s => s.derived.storm && s.derived.storm.wrap > 0.68 && s.vmax > 26,
      say: () => 'Precipitation has wrapped around the circulation. From the ground this tornado would be effectively invisible until it arrived.' ,
      tsay: () => 'Heavy precipitation is wrapping around the circulation. Somewhere in there is a great deal of tomato, and you cannot see any of it.'
    },

    { id: 'highbase', cool: 120, pri: 3, once: true,
      when: s => s.derived.cloudBase > 1500 && s.vmax > 26,
      say: (s) => 'Cloud base is around ' + Math.round(s.derived.cloudBase) +
        ' m — high and dry. Funnels struggle to condense all the way down in air like this, even when the wind at the surface is severe.' ,
      tsay: () => 'The cloud base is high and the air is dry, so the funnel condenses late. The produce is still going up regardless — condensation and material are two different things.'
    },

    { id: 'surge', cool: 55, pri: 4,
      when: (s, m) => m.dVmax > 7,
      say: (s) => 'The tornado is intensifying — peak wind now near ' + MPHR(s.vmax) + ' mph.' ,
      tsay: (s) => 'Rapid intensification. The column is drawing up material faster than it can shed it.'
    },

    { id: 'weakening', cool: 70, pri: 2,
      when: (s, m) => m.dVmax < -7 && s.t > s.params.lifespan * 0.5,
      say: () => 'The vortex is weakening as the parent circulation occludes.' ,
      tsay: () => 'The circulation is weakening. It is beginning to drop what it was carrying.'
    },

    { id: 'rope', cool: 999, once: true, pri: 4,
      when: s => s.phase === 'roping out',
      say: () => 'Roping out: the vortex is being stretched thin and carried around the occluding mesocyclone. Still capable of damage.' ,
      tsay: () => 'Roping out. The column has narrowed to a thread and is shedding the last of its load along the track.'
    },

    { id: 'town', cool: 60, pri: 5,
      when: (s, m) => m.newDamage > 26,
      say: (s, m) => 'Damage is accumulating quickly — ' + m.newDamage +
        ' structures affected in the last few seconds.' ,
      tsay: () => 'The Tormato is over built-up ground. This is where the rating comes from — the buildings, not the tomatoes.'
    },

    /* ── Finding the salamander ──────────────────────────────────────
       Every camera in this console is welded to the tornado, and the Plan
       view sees about 2.9 km of a 6.4 km map. There is therefore no way
       to search the landscape — which made an egg hidden somewhere on it
       findable only by growing a tornado big enough to sweep the county,
       which is precisely what one player ended up doing.

       So the feed does what the rest of this console does and reports a
       measurement: the real distance to the thing, once you are near
       enough that a real observer would have noticed it. No direction, no
       marker, no map pin. It turns a needle in a haystack into a hunt
       with feedback, and you still have to fly the track yourself.

       The far radius is 2300 m on purpose. Every track runs through the
       centre of the map, so the closest a track ever comes to the
       salamander is at most its own distance from centre — and it is
       placed between 960 m and 2112 m out. A radius above that upper
       bound is therefore the difference between the nudge arriving in
       every Tormato run and arriving only when the heading happens to
       be kind. At 1500 m the stock heading missed it completely and the
       feed never said a word, which is the state that prompted this.

       Tormato only, and only until you find it. */

    { id: 'salfar', cool: 22, pri: 3,
      when: (s) => s.mode === 'tormato' && !s.salamanderHit && s.terrain &&
        s.terrain.salamander && s.vmax > 18 &&
        Math.hypot(s.terrain.salamander.x - s.center.x,
                   s.terrain.salamander.y - s.center.y) < 2300,
      /* The bearing is given from the FIELD CENTRE, not from the vortex,
         and that is the whole usefulness of it: every track runs through
         the centre of the map, so this figure is exactly the number to
         put in the heading dial. Still a reading rather than a map pin —
         it says where the thing is, not what to do about it. */
      say: (s) => 'There is something out there that is not crop and not a building — ' +
        Math.round(Math.hypot(s.terrain.salamander.x - s.center.x,
                              s.terrain.salamander.y - s.center.y)) +
        ' m off, bearing ' + compass(Math.atan2(s.terrain.salamander.x,
                                                s.terrain.salamander.y) * 180 / Math.PI) +
        ' of the field centre. It has not moved all storm.' },

    { id: 'salnear', cool: 14, pri: 5,
      when: (s) => s.mode === 'tormato' && !s.salamanderHit && s.terrain &&
        s.terrain.salamander && s.vmax > 18 &&
        Math.hypot(s.terrain.salamander.x - s.center.x,
                   s.terrain.salamander.y - s.center.y) < 650,
      say: (s) => 'Whatever it is, it is ' +
        Math.round(Math.hypot(s.terrain.salamander.x - s.center.x,
                              s.terrain.salamander.y - s.center.y)) +
        ' m away, it is gold, and it is blinking.' },

    { id: 'nothing', cool: 150, pri: 1,
      when: (s, m) => s.vmax > 55 && m.totalDamaged === 0 && s.t > 90,
      say: () => 'Violent winds, and nothing in the way. A survey team would have almost nothing to measure here — which is exactly how strong tornadoes end up with low ratings.' ,
      tsay: () => 'Violent winds, and nothing underneath them but the crop. Tomatoes are not damage indicators, so a survey walking this ground would have almost nothing to write down.'
    }
  ];

  function fmtWidth(m) {
    return m >= 1609 ? (m / 1609).toFixed(1) + ' miles' : Math.round(m) + ' m';
  }
  TS.fmtWidth = fmtWidth;


  /* ── Field notes ─────────────────────────────────────────────────────
     Shown during quiet stretches. Each is true, and several of them are
     deliberately the sort of thing that contradicts common belief. */

  TS.FACTS = [
    'The Enhanced Fujita scale rates damage, not wind. A tornado is assigned the rating its worst damage supports — so an identical tornado crossing open prairie and a subdivision earns two different numbers.',
    'Tornado wind speed has almost never been measured directly. The scale is built from engineering estimates of what it takes to break particular things.',
    'The visible funnel is condensation, not the tornado. The damaging circulation is usually wider, and can reach the ground with no visible funnel at all.',
    'A tornado moving at 50 mph has a 100 mph difference in ground-relative wind between its right and left flanks.',
    'Mobile homes fail at wind speeds far below what a well-built house survives, which is why they make poor high-end damage indicators — they saturate almost immediately.',
    'Debarked trees indicate extreme wind, but they cannot say how extreme. Once bark is gone, more wind leaves no further mark.',
    'Radar cannot see the ground. A beam fired from 60 miles away passes thousands of feet above the tornado it is watching.',
    'A tornadic debris signature — radar detecting lofted material — is one of the few ways to confirm a tornado is on the ground at night.',
    'Multi-vortex tornadoes can leave undamaged houses between destroyed ones. The subvortices, not luck, decide which is which.',
    'Wedge tornadoes are not necessarily strong, and rope tornadoes are not necessarily weak. Shape reflects cloud base height and pressure, not intensity.',
    'Why one supercell in a favourable environment produces a tornado while its neighbour does not remains an open research question.',
    'The lowest pressure ever measured inside a tornado was recorded by a probe deliberately placed in its path in South Dakota in 2003 — a drop of roughly 100 hPa.',
    'Most tornadoes are weak and brief. The small fraction rated EF4 or EF5 cause the large majority of tornado deaths.',
    'Tornadoes have been observed to cross rivers, ridges and canyons. Terrain does not reliably protect anywhere.',
    'The 1925 Tri-State Tornado tracked at least 219 miles. Its forward speed reached about 70 mph — faster than most cars on the roads of the day.',
    'Downbursts can produce damage easily mistaken for a tornado. Surveys tell them apart by direction: tornado debris converges, downburst debris spreads outward.'
  ];


  /* ── Explanation vocabulary ─────────────────────────────────────────
     "Explain this tornado" composes from these, keyed to what the run
     actually did. Each fragment carries its own epistemic tag so the
     explanation cannot claim more confidence than the mechanism has. */

  TS.EXPLAIN = {
    intro: 'Here is what this tornado did, and why.',
    disclaimer: 'This is an educational approximation built from a simplified vortex model, not a fluid-dynamics simulation. It is arranged so the mechanisms are honest even though the numbers are not predictions.'
  };

})(window.TS);
