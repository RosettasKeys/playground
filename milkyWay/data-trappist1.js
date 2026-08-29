/* ═══════════════════════════════════════════════════════════════════════
   data-trappist1.js — points of interest inside the TRAPPIST-1 system
   ───────────────────────────────────────────────────────────────────────
   The second orrery. Same shape as data-solar.js, same rendering and orbit
   engine — this atlas draws any star's planets the same way, not just the
   Sun's.

   Elements (a, e in au/dimensionless) are from Agol et al. 2021, the
   transit-timing solution that is the standard reference for this system.
   Orbital *phase* — where each planet actually sits along its orbit at a
   given moment — is not derived from that solution here, so every planet
   below carries `orbitApprox: true`, same convention the rest of the atlas
   uses for Ceres, Bennu, and the rest. Inclination and node are left at
   zero: the seven orbits are mutually coplanar to within a fraction of a
   degree, so a flat plan view is not a simplification worth flagging the
   way it would be anywhere else.

   The star's GM (for the mean-motion calculation atlas.js uses to move
   these planets) is derived from its measured mass, 0.0898 M☉ — see
   SYSTEMS.trappist1 in atlas.js.
   ═══════════════════════════════════════════════════════════════════════ */

const TRAPPIST1_POI = [

  {
    id: 'trappist1-star', name: 'TRAPPIST-1', kind: 'star', cat: 'star',
    type: 'Ultra-cool red dwarf (M8V)',
    radiusKm: 83000, color: '#ff9a6c', rank: 4,
    facts: [
      ['Mass', '0.0898 M☉ — about 89 Jupiters'],
      ['Radius', '0.119 R☉ — barely larger than Jupiter'],
      ['Surface temperature', '≈2,566 K'],
      ['Distance from Sun', '≈40.7 ly'],
      ['Planets', 'seven, all roughly Earth-sized']
    ],
    desc: 'A star barely larger than Jupiter, cool enough that most of its light is infrared — through a telescope it would look less like a sun than a dim coal. Seven rocky planets orbit it so tightly that all seven together would fit inside Mercury\'s orbit around the Sun, with room left over; light crosses the whole system in minutes, not hours.\n\nThe planets are locked into a resonant chain — each orbital period sits close to a simple ratio of its neighbours\' (roughly 8:5, 5:3, 3:2, outward from the star) — a pattern precise enough that it has been used to date when the system\'s orbits first locked into place, not long after the planets themselves formed.',
    cites: ['trappist1-agol2021', 'exo-6000']
  },

  {
    id: 'trappist1-b', name: 'TRAPPIST-1 b', kind: 'planet', cat: 'planet',
    type: 'Rocky planet — innermost',
    a: 0.01154, e: 0.00622, i: 0, om: 0, w: 0, M0: 20, orbitApprox: true,
    radiusKm: 7110, color: '#c9855f', rank: 3,
    facts: [
      ['Semi-major axis', '0.0115 au'], ['Year', '1.51 Earth days'],
      ['Radius', '1.12 R⊕'], ['Mass', '1.37 M⊕'],
      ['Atmosphere', 'none detected']
    ],
    desc: 'The innermost of the seven, tidally locked so tightly that its day and its year are the same 36-hour stretch of time. It receives about four times the light Earth gets from the Sun.\n\nJWST measured its dayside temperature directly in 2023 by timing the planet\'s disappearance behind the star. The heat matched a bare, sunlit rock with nothing carrying warmth to the night side — no atmosphere thick enough to matter, and none of the absorption a carbon-dioxide blanket would leave in the data. If TRAPPIST-1 b ever had air, the star appears to have stripped it away.',
    fresh: {
      year: '2023',
      text: 'This was the first time an Earth-sized exoplanet\'s dayside temperature had been measured directly rather than inferred, and it answered the central question about planets around small, violent stars: can they keep an atmosphere at all? For TRAPPIST-1 b, the measurement fit a bare rock so well that a thick atmosphere is difficult to reconcile with the data.'
    },
    cites: ['trappist1-agol2021', 'trappist-1b-thermal']
  },

  {
    id: 'trappist1-c', name: 'TRAPPIST-1 c', kind: 'planet', cat: 'planet',
    type: 'Rocky planet',
    a: 0.01580, e: 0.00654, i: 0, om: 0, w: 0, M0: 85, orbitApprox: true,
    radiusKm: 6989, color: '#b89a7c', rank: 3,
    facts: [
      ['Semi-major axis', '0.0158 au'], ['Year', '2.42 Earth days'],
      ['Radius', '1.10 R⊕'], ['Mass', '1.31 M⊕'],
      ['Density', 'close to Earth\'s — likely rock and iron']
    ],
    desc: 'Earth-sized almost exactly, and dense enough to be made of much the same rock and iron Earth is. It receives about twice the sunlight Venus gets, which makes what JWST ruled out in 2023 the interesting part: a thick carbon-dioxide atmosphere, the kind that turned Venus into a furnace. A thinner atmosphere, or none, both remain consistent with the data.',
    fresh: {
      year: '2023',
      text: 'Secondary-eclipse photometry — the combined light of star and planet, then the star alone as the planet passes behind it — found a dayside brightness too warm for a thick CO2 atmosphere to explain. TRAPPIST-1 c does not appear to be repeating Venus\'s runaway greenhouse.'
    },
    cites: ['trappist1-agol2021', 'trappist-1c-no-co2']
  },

  {
    id: 'trappist1-d', name: 'TRAPPIST-1 d', kind: 'planet', cat: 'planet',
    type: 'Rocky planet — low density',
    a: 0.02227, e: 0.00837, i: 0, om: 0, w: 0, M0: 150, orbitApprox: true,
    radiusKm: 4906, color: '#9fb8a0', rank: 3,
    facts: [
      ['Semi-major axis', '0.0223 au'], ['Year', '4.05 Earth days'],
      ['Radius', '0.77 R⊕'], ['Mass', '0.39 M⊕'],
      ['Density', 'notably low for its size']
    ],
    desc: 'The smallest of the seven, and the odd one out in the density table: its mass and radius together imply a body markedly less dense than solid rock, which for a planet this small usually means a lot of water or ice, or a thick envelope of light gas over a smaller core.\n\nIt sits just inside the habitable zone\'s inner edge as usually drawn — close enough that whether it is a steam world, an ocean, or something stranger turns on details of the star\'s output that are still being pinned down.',
    cites: ['trappist1-agol2021']
  },

  {
    id: 'trappist1-e', name: 'TRAPPIST-1 e', kind: 'planet', cat: 'planet',
    type: 'Rocky planet — best habitable-zone candidate',
    a: 0.02925, e: 0.00510, i: 0, om: 0, w: 0, M0: 205, orbitApprox: true,
    radiusKm: 5861, color: '#6fa8c9', rank: 4,
    facts: [
      ['Semi-major axis', '0.0293 au'], ['Year', '6.10 Earth days'],
      ['Radius', '0.92 R⊕'], ['Mass', '0.69 M⊕'],
      ['Habitable-zone status', 'best candidate of the seven']
    ],
    desc: 'Closest of the seven to Earth in both size and the sunlight it receives, and the planet every atmosphere hunt in this system has been built around. If any of the seven can hold onto air, this has always been the smart-money pick.\n\nThe honest answer, so far, is undecided. A full year of JWST time rules out a puffy hydrogen atmosphere and disfavours Venus- or Mars-like ones, and a thin nitrogen atmosphere with a trace of methane fits the data about as well as no atmosphere at all does. The star\'s own spots contaminate the signal enough that the question stays open.',
    fresh: {
      year: '2025',
      text: 'JWST spent 2025 on TRAPPIST-1 e and came back with a null result rather than a discovery — and here, a null result is informative. Hydrogen-rich is ruled out; Venus-like and Mars-like are disfavoured; a thin nitrogen atmosphere cannot be told apart from bare rock. The next round of observations, not this one, will likely settle it.'
    },
    cites: ['trappist1-agol2021', 'trappist-1e-dreams', 'trappist-1e-secondary']
  },

  {
    id: 'trappist1-f', name: 'TRAPPIST-1 f', kind: 'planet', cat: 'planet',
    type: 'Rocky planet — habitable zone, outer edge',
    a: 0.03849, e: 0.01007, i: 0, om: 0, w: 0, M0: 265, orbitApprox: true,
    radiusKm: 6658, color: '#8fb0a8', rank: 3,
    facts: [
      ['Semi-major axis', '0.0385 au'], ['Year', '9.21 Earth days'],
      ['Radius', '1.05 R⊕'], ['Mass', '1.04 M⊕'],
      ['Habitable-zone status', 'yes, toward the outer edge']
    ],
    desc: 'Almost exactly Earth\'s mass and size, sitting near the outer edge of the habitable zone where a thick enough atmosphere could still keep water liquid despite the fainter light this far from a dim star. Its density is consistent with a rocky interior topped by a significant amount of water or ice.\n\nNo atmosphere has been confirmed here either way; it is next in line for the kind of scrutiny e has already had.',
    cites: ['trappist1-agol2021']
  },

  {
    id: 'trappist1-g', name: 'TRAPPIST-1 g', kind: 'planet', cat: 'planet',
    type: 'Rocky planet — habitable zone, outer edge',
    a: 0.04683, e: 0.00208, i: 0, om: 0, w: 0, M0: 310, orbitApprox: true,
    radiusKm: 7193, color: '#a8b8c9', rank: 3,
    facts: [
      ['Semi-major axis', '0.0468 au'], ['Year', '12.35 Earth days'],
      ['Radius', '1.13 R⊕'], ['Mass', '1.32 M⊕'],
      ['Habitable-zone status', 'yes, toward the outer edge']
    ],
    desc: 'The largest of the seven, and the last one that still falls inside most versions of the habitable zone. Its density suggests a rocky core wrapped in something lighter — water, ice, or a thin atmosphere, neither confirmed nor ruled out.\n\nAt this distance from a star this dim, "habitable" is doing a lot of work: keeping water liquid here would need a substantial greenhouse effect, and nobody yet knows whether TRAPPIST-1 g actually has one.',
    cites: ['trappist1-agol2021']
  },

  {
    id: 'trappist1-h', name: 'TRAPPIST-1 h', kind: 'planet', cat: 'planet',
    type: 'Rocky planet — outermost',
    a: 0.06189, e: 0.00567, i: 0, om: 0, w: 0, M0: 350, orbitApprox: true,
    radiusKm: 4938, color: '#c9c4b0', rank: 3,
    facts: [
      ['Semi-major axis', '0.0619 au'], ['Year', '18.77 Earth days'],
      ['Radius', '0.78 R⊕'], ['Mass', '0.33 M⊕'],
      ['Modelled surface', 'likely frozen']
    ],
    desc: 'The outermost and coldest of the seven, receiving too little starlight for most habitable-zone bookkeeping to include it. Hubble\'s spectroscopy in 2022 found no sign of a puffy, hydrogen-dominated envelope — consistent with, though not proof of, an airless, frozen surface.\n\nIt closes the resonant chain: seven planets, seven closely-spaced years, all packed into an orbit that would fit inside Mercury\'s.',
    cites: ['trappist1-agol2021', 'trappist-1h-hst']
  }
];

if (typeof module !== 'undefined') { module.exports = TRAPPIST1_POI; }
