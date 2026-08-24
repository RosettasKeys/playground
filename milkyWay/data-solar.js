/* ═══════════════════════════════════════════════════════════════════════
   data-solar.js — points of interest inside the Solar System
   ───────────────────────────────────────────────────────────────────────
   HOW POSITIONS ARE COMPUTED

   The eight major planets use the Keplerian element set JPL publishes for
   approximate positions of the major planets (epoch J2000, with linear
   rates per Julian century, valid 1800–2050). Those positions are good to
   a fraction of a degree and are the honest ones on this map.

   Everything else — dwarf planets, small bodies, the interstellar comet —
   uses published osculating elements where the atlas author could verify
   them, and carries `orbitApprox: true` where the *phase along the orbit*
   could not be verified. The orbit shape is right in every case; the
   marker's position along it may not be. The panel says so rather than
   letting a pretty picture imply a measurement.

   Elements
     a   semi-major axis, au        (q = perihelion distance, for hyperbolics)
     e   eccentricity
     i   inclination, degrees
     om  longitude of ascending node, degrees
     w   argument of perihelion, degrees
     M0  mean anomaly at epoch, degrees
     L, peri, rates[]  — JPL major-planet form

   `kind` drives rendering: star, planet, dwarf, smallbody, interstellar,
   region, craft, hypothetical.
   ═══════════════════════════════════════════════════════════════════════ */

/* Mean orbital elements of the eight planets, J2000 epoch, with rates per
   Julian century. Order: a, e, i, L(mean longitude), peri(longitude of
   perihelion), om(longitude of ascending node). Source: jpl-elements. */
const PLANET_ELEMENTS = {
  mercury: { el: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593],
             rt: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081] },
  venus:   { el: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255],
             rt: [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418] },
  earth:   { el: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
             rt: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0] },
  mars:    { el: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
             rt: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343] },
  jupiter: { el: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
             rt: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106] },
  saturn:  { el: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
             rt: [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794] },
  uranus:  { el: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503],
             rt: [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589] },
  neptune: { el: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574],
             rt: [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664] }
};

const SOLAR_POI = [

  /* ════ THE STAR ═══════════════════════════════════════════════════ */
  {
    id: 'sun', name: 'The Sun', alt: 'Sol', kind: 'star', cat: 'star',
    type: 'G2V main-sequence star',
    radiusKm: 696340, color: '#ffd27a', rank: 4,
    facts: [
      ['Mass', '99.86% of the Solar System'],
      ['Surface temperature', '≈5,772 K'],
      ['Age', '≈4.6 billion years'],
      ['Core fusion', '≈600 million tonnes of hydrogen per second']
    ],
    desc: 'Everything else on this map is a rounding error. The Sun holds 99.86% of the Solar System\'s mass; the planets, moons, asteroids and comets together make up the remainder, and Jupiter is most of that.\n\nIt is an ordinary star, which is the interesting part — there is nothing rare about the conditions that produced this system. It is roughly halfway through its main-sequence life. In about five billion years it will exhaust its core hydrogen, swell into a red giant, and shed its outer layers into a planetary nebula, leaving a white dwarf behind.',
    cites: ['gaia-milkyway']
  },

  /* ════ TERRESTRIAL PLANETS ════════════════════════════════════════ */
  {
    id: 'mercury', name: 'Mercury', kind: 'planet', cat: 'planet',
    type: 'Terrestrial planet', elKey: 'mercury',
    radiusKm: 2439.7, color: '#a8a29a', rank: 3,
    facts: [
      ['Semi-major axis', '0.387 au'], ['Year', '88 Earth days'],
      ['Day', '176 Earth days (solar)'], ['Moons', 'none'],
      ['Surface range', '−180 °C to +430 °C']
    ],
    desc: 'The smallest planet, the closest to the Sun, and the one with the largest iron core relative to its size — roughly 85% of its radius, against Earth\'s 55%. The favoured explanation is a giant impact early on that stripped away most of its rocky mantle.\n\nIts rotation is locked in a 3:2 resonance with its orbit, so it turns exactly three times for every two circuits of the Sun. A solar day there lasts two Mercurian years. Despite the heat, radar has found water ice in permanently shadowed craters at its poles.',
    cites: ['jpl-elements']
  },
  {
    id: 'venus', name: 'Venus', kind: 'planet', cat: 'planet',
    type: 'Terrestrial planet', elKey: 'venus',
    radiusKm: 6051.8, color: '#e6c98a', rank: 3,
    facts: [
      ['Semi-major axis', '0.723 au'], ['Year', '225 Earth days'],
      ['Surface pressure', '92× Earth'], ['Surface temperature', '≈464 °C'],
      ['Rotation', 'retrograde, 243 Earth days']
    ],
    desc: 'Earth\'s twin by size and mass, and nothing like it in any way that matters. A runaway greenhouse has left it with a carbon-dioxide atmosphere ninety-two times Earth\'s surface pressure and a surface hot enough to melt lead — hotter than Mercury\'s, despite being twice as far from the Sun.\n\nIt rotates backwards, and so slowly that its day is longer than its year. Whatever happened to Venus is the single most important cautionary data point in comparative planetology: two planets can start alike and end this differently.',
    cites: ['jpl-elements']
  },
  {
    id: 'earth', name: 'Earth', kind: 'planet', cat: 'planet',
    type: 'Terrestrial planet', elKey: 'earth',
    radiusKm: 6371, color: '#6fa8dc', rank: 4,
    facts: [
      ['Semi-major axis', '1.000 au (149.6 million km)'],
      ['Moons', '1'], ['Atmosphere', '78% N₂, 21% O₂'],
      ['Surface', '71% liquid water'], ['Age', '≈4.54 billion years']
    ],
    moons: [
      ['The Moon', '3,474 km across — a quarter of Earth\'s diameter, unusually large for a body of this size. Probably formed from debris after a Mars-sized impact ~4.5 billion years ago. It stabilises Earth\'s axial tilt, and it is receding at about 3.8 cm per year.']
    ],
    desc: 'The only place liquid water is known to be stable on the surface, and the only place life is known at all. Its free oxygen is not a geological given — it is a waste product, exhaled by organisms over two billion years, and it would vanish within a few million years if that ceased.\n\nSeen from anywhere else on this map, Earth is a point of light whose spectrum would show water, oxygen, methane and ozone together. That combination is chemically unstable and cannot be maintained without something continuously replenishing it. It is exactly the signature we go looking for around other stars.',
    cites: ['jpl-elements', 'exo-6000']
  },
  {
    id: 'mars', name: 'Mars', kind: 'planet', cat: 'planet',
    type: 'Terrestrial planet', elKey: 'mars',
    radiusKm: 3389.5, color: '#c1683c', rank: 3,
    facts: [
      ['Semi-major axis', '1.524 au'], ['Year', '687 Earth days'],
      ['Moons', '2 — Phobos and Deimos'],
      ['Olympus Mons', '≈22 km high, tallest known volcano'],
      ['Atmosphere', '95% CO₂, <1% of Earth\'s pressure']
    ],
    moons: [
      ['Phobos', 'Orbits below synchronous altitude and is spiralling inward. In ~50 million years it will break up into a ring or hit the surface.'],
      ['Deimos', 'Smaller, further out, and slowly receding. Both moons are probably captured asteroids or reaccreted impact debris.']
    ],
    desc: 'A planet that had rivers, lakes and possibly an ocean, then lost its magnetic field, then lost most of its atmosphere to the solar wind, and froze. The geological record of that transition is still sitting on the surface, unweathered, which is why so much hardware has been sent there.\n\nCuriosity and Perseverance have both found the chemistry that habitability requires — clays, sulphates, organics, ancient river deltas. No evidence of life has been found. Samples cached by Perseverance in Jezero Crater are meant to be returned to Earth for analysis that no rover-borne instrument can do.',
    cites: ['jpl-elements']
  },

  /* ════ THE ASTEROID BELT ══════════════════════════════════════════ */
  {
    id: 'asteroid-belt', name: 'The Asteroid Belt', kind: 'region', cat: 'region',
    type: 'Main-belt small body population',
    inner: 2.1, outer: 3.3, color: '#8a8271', rank: 2,
    facts: [
      ['Range', '≈2.1–3.3 au'], ['Total mass', '≈4% of the Moon'],
      ['Known objects', 'over 1.4 million catalogued'],
      ['Largest', 'Ceres, holding ~1/3 of the belt\'s mass']
    ],
    desc: 'Not a failed planet and not the wreckage of one. Jupiter\'s gravity stirred this region too violently for material to accrete, so it stayed as debris. The total mass of everything in the belt is about 4% of the Moon\'s — the popular image of a densely packed hazard is wrong by many orders of magnitude, and spacecraft cross it without evasive manoeuvres.',
    fresh: {
      year: '2026',
      text: 'The Vera C. Rubin Observatory found roughly 11,000 new asteroids in its first six weeks of preliminary data — about a million observations, which also recovered more than 80,000 already-known bodies. It has since begun its full ten-year Legacy Survey of Space and Time and is issuing hundreds of thousands of alerts a night. The catalogued small-body population is about to change scale entirely.'
    },
    cites: ['rubin-lsst', 'rubin-alerts', 'mpc']
  },
  {
    id: 'ceres', name: 'Ceres', kind: 'dwarf', cat: 'dwarf',
    type: 'Dwarf planet (main belt)',
    a: 2.7658, e: 0.0785, i: 10.59, om: 80.31, w: 73.60, M0: 95.99, orbitApprox: true,
    radiusKm: 473, color: '#9c968c', rank: 2,
    facts: [
      ['Semi-major axis', '2.77 au'], ['Diameter', '≈940 km'],
      ['Status', 'largest object in the asteroid belt'],
      ['Visited by', 'Dawn, 2015–2018']
    ],
    desc: 'Discovered in 1801 and classified as a planet for half a century before demotion to asteroid, then promoted to dwarf planet in 2006 — an object that has been reclassified more often than it has been visited.\n\nDawn found bright deposits in Occator Crater that turned out to be sodium carbonate, left by briny water reaching the surface from a subsurface reservoir and evaporating. Ceres is not a dead rock: it has, or recently had, liquid brine underground.',
    cites: ['jpl-sbdb', 'mpc']
  },
  {
    id: 'bennu', name: '101955 Bennu', kind: 'smallbody', cat: 'smallbody',
    type: 'Near-Earth carbonaceous asteroid',
    a: 1.1264, e: 0.2037, i: 6.03, om: 2.06, w: 66.22, M0: 101.7, orbitApprox: true,
    radiusKm: 0.245, color: '#7d7368', rank: 3,
    facts: [
      ['Diameter', '≈490 m'], ['Sample returned', '24 September 2023'],
      ['Sample mass', '≈120 g'], ['Structure', 'a loose rubble pile']
    ],
    desc: 'A carbon-rich near-Earth asteroid that OSIRIS-REx sampled in 2020 and delivered to Utah in 2023. It is barely held together — a rubble pile so loosely bound that the spacecraft\'s sampling arm sank into it, and the surface behaved more like a fluid than a solid.',
    fresh: {
      year: '2025',
      text: 'The returned sample contains 14 of the 20 amino acids life on Earth uses to build proteins, and all five nucleobases that store genetic information in DNA and RNA. It also contains tryptophan — never previously found in a meteorite or returned sample — along with abundant ammonia, formaldehyde, and eleven minerals that only precipitate when salty water evaporates. Bennu\'s parent body held brine. None of this is evidence of life; it is evidence that life\'s ingredients were common across the early Solar System.'
    },
    cites: ['bennu-pnas', 'bennu-ammonia']
  },
  {
    id: 'yr4', name: '2024 YR4', kind: 'smallbody', cat: 'smallbody',
    type: 'Near-Earth asteroid',
    a: 2.516, e: 0.662, i: 3.41, om: 271.4, w: 134.4, M0: 20.0, orbitApprox: true,
    radiusKm: 0.03, color: '#c99a6a', rank: 3,
    facts: [
      ['Diameter', '≈53–67 m'], ['Discovered', 'December 2024'],
      ['Earth impact risk', 'zero — ruled out February 2025'],
      ['Lunar impact risk', 'zero — ruled out March 2026']
    ],
    desc: 'A building-sized rock that briefly held the highest impact probability ever recorded for an object of its size, and became the first real-world exercise of the modern planetary-defence apparatus.',
    fresh: {
      year: '2026',
      text: 'It is now cleared of everything. An Earth impact in 2032 was ruled out in February 2025 as the orbit tightened. Attention then shifted to the Moon, where the estimated impact probability climbed to about 4.3% — high enough that JWST was given emergency observing time. Observations on 18 and 26 February 2026 measured the asteroid against background stars precisely enough to eliminate that too: it will pass the Moon at more than 20,000 km on 22 December 2032. The whole episode is the clearest demonstration yet that the correct response to a rising impact probability is more measurements, not alarm.'
    },
    cites: ['yr4-cleared', 'yr4-nasa']
  },
  {
    id: 'apophis', name: '99942 Apophis', kind: 'smallbody', cat: 'smallbody',
    type: 'Near-Earth asteroid',
    a: 0.9224, e: 0.1914, i: 3.34, om: 204.0, w: 126.7, M0: 210.0, orbitApprox: true,
    radiusKm: 0.17, color: '#b08d5e', rank: 2,
    facts: [
      ['Diameter', '≈340 m'], ['Close approach', '13 April 2029'],
      ['Approach distance', '≈31,600 km — inside geostationary orbit'],
      ['Impact risk', 'ruled out for at least a century']
    ],
    desc: 'On Friday 13 April 2029, Apophis will pass closer to Earth than our geostationary satellites, and will be visible to the unaided eye from Europe and Africa. An object this size comes this close roughly once every 7,500 years.\n\nIt was ranked a genuine hazard when discovered in 2004; radar observations have since eliminated the risk for at least the next hundred years. The 2029 pass is now treated as a free experiment — Earth\'s tides will visibly reshape the asteroid, and several missions intend to be watching.',
    cites: ['jpl-sbdb', 'yr4-nasa']
  },

  /* ════ GIANT PLANETS ══════════════════════════════════════════════ */
  {
    id: 'jupiter', name: 'Jupiter', kind: 'planet', cat: 'planet',
    type: 'Gas giant', elKey: 'jupiter',
    radiusKm: 69911, color: '#d9a066', rank: 4,
    facts: [
      ['Semi-major axis', '5.20 au'], ['Year', '11.9 Earth years'],
      ['Mass', '2.5× all other planets combined'],
      ['Moons', '95 confirmed'], ['Day', '9 h 56 m — fastest in the system']
    ],
    moons: [
      ['Io', 'The most volcanically active body known. Tidal flexing from Jupiter and the other Galilean moons keeps its interior molten; it resurfaces itself continuously.'],
      ['Europa', 'A saltwater ocean beneath an ice shell, containing perhaps twice the water of all Earth\'s oceans. Europa Clipper is en route to assess its habitability.'],
      ['Ganymede', 'The largest moon in the Solar System — bigger than Mercury — and the only one with its own magnetic field.'],
      ['Callisto', 'The most heavily cratered surface known, essentially unchanged for four billion years. Geologically dead, and a likely subsurface ocean.']
    ],
    desc: 'Two and a half times the mass of every other planet put together, and the reason the inner Solar System looks the way it does. Its migration early on rearranged the small-body populations, and its gravity still governs the structure of the asteroid belt.\n\nThe Great Red Spot is a storm that has been running for at least 190 years and possibly 360, though it has been measurably shrinking for decades. Juno\'s gravity measurements found the planet has no sharp core — instead a "fuzzy" dilute core spread over a large fraction of the interior, which no formation model had predicted.',
    cites: ['jpl-elements']
  },
  {
    id: 'saturn', name: 'Saturn', kind: 'planet', cat: 'planet',
    type: 'Gas giant', elKey: 'saturn',
    radiusKm: 58232, color: '#e3cb92', rank: 4,
    facts: [
      ['Semi-major axis', '9.54 au'], ['Year', '29.4 Earth years'],
      ['Moons', '274 — most of any planet'],
      ['Ring thickness', 'typically ~10 m'], ['Density', 'less than water']
    ],
    moons: [
      ['Titan', 'The only moon with a substantial atmosphere — thicker than Earth\'s — and the only other body with stable surface liquid: lakes and rivers of methane and ethane. Dragonfly, a nuclear-powered rotorcraft, is being built to fly there.'],
      ['Enceladus', 'Vents plumes of water vapour from a subsurface ocean through cracks at its south pole. Cassini flew through them and found salts, silica and organic molecules — direct samples of an alien ocean, collected without landing.'],
      ['Mimas', 'Long assumed to be frozen solid; recent analysis of its rotation points to a young subsurface ocean beneath an unbroken, ancient-looking crust.']
    ],
    desc: 'The rings are young and temporary. They are almost pure water ice, they are being drawn into the planet by its magnetic field, and the current estimate is that they are perhaps a hundred million years old and will be gone within another hundred million. Saturn has not always had them, and will not always have them; we happen to be here while it does.',
    fresh: {
      year: '2025',
      text: 'Saturn\'s moon count went from 146 to 274 in a single announcement. In March 2025 the IAU Minor Planet Center recognised 128 new irregular satellites, found with the Canada–France–Hawaii Telescope by a team using a "shift and stack" technique to pull out objects only a few kilometres across. They are captured fragments, not primordial moons — probably debris from collisions among earlier captures — and Saturn now has more known moons than the rest of the planets combined.'
    },
    cites: ['saturn-moons', 'mpc']
  },
  {
    id: 'uranus', name: 'Uranus', kind: 'planet', cat: 'planet',
    type: 'Ice giant', elKey: 'uranus',
    radiusKm: 25362, color: '#8fd4d9', rank: 3,
    facts: [
      ['Semi-major axis', '19.19 au'], ['Year', '84 Earth years'],
      ['Axial tilt', '98° — it orbits on its side'],
      ['Moons', '29'], ['Visited by', 'Voyager 2, once, in 1986']
    ],
    moons: [
      ['Miranda', 'A patchwork of mismatched terrain including a 20 km cliff, as though the moon was broken apart and reassembled.'],
      ['S/2025 U1', 'The 29th moon, about 10 km across, found by JWST in 2025 — close in to the ring system and missed by Voyager 2 entirely.']
    ],
    desc: 'Tipped over on its side, almost certainly by a giant impact, so that each pole spends 42 years in continuous sunlight and 42 in darkness. Its interior is not gas but a hot, dense fluid of water, ammonia and methane ices, which is why it and Neptune are classed separately from Jupiter and Saturn.\n\nOne spacecraft has ever visited, for a few hours in 1986, and it arrived at solstice — meaning we have essentially seen one hemisphere, at one season, once.',
    fresh: {
      year: '2025',
      text: 'JWST found a 29th moon in August 2025, designated S/2025 U1: roughly 10 km across, orbiting close to the ring system. Voyager 2 flew through this system and missed it. That a moon this close in went undetected through a flyby and forty years of ground-based observation is a fair measure of how thinly the ice giants have been surveyed.'
    },
    cites: ['uranus-moon', 'mpc']
  },
  {
    id: 'neptune', name: 'Neptune', kind: 'planet', cat: 'planet',
    type: 'Ice giant', elKey: 'neptune',
    radiusKm: 24622, color: '#4f7fd4', rank: 3,
    facts: [
      ['Semi-major axis', '30.07 au'], ['Year', '164.8 Earth years'],
      ['Wind speeds', 'up to ≈2,100 km/h — fastest known'],
      ['Moons', '16'], ['Discovered', '1846, by mathematical prediction']
    ],
    moons: [
      ['Triton', 'Orbits backwards, which means it was captured rather than formed in place — almost certainly a Kuiper Belt object like Pluto. It has nitrogen geysers, a thin atmosphere, and is spiralling in; eventually Neptune will tear it into a ring.']
    ],
    desc: 'Found with a pen before it was found with a telescope: discrepancies in Uranus\'s orbit let Le Verrier calculate where an unseen planet must be, and Galle found it within a degree of the prediction on the first night of looking.\n\nIt radiates more than twice the energy it receives from the Sun, and drives the fastest winds in the Solar System — on a world so far out that sunlight is 1/900th of Earth\'s. Where that energy comes from is not fully settled.',
    cites: ['jpl-elements']
  },

  /* ════ THE KUIPER BELT ════════════════════════════════════════════ */
  {
    id: 'kuiper-belt', name: 'The Kuiper Belt', kind: 'region', cat: 'region',
    type: 'Trans-Neptunian small body population',
    inner: 30, outer: 50, color: '#5f7a8c', rank: 3,
    facts: [
      ['Range', '≈30–50 au'], ['Catalogued objects', 'more than 5,000'],
      ['Estimated population', 'hundreds of thousands larger than 100 km'],
      ['Total mass', 'a few percent of Earth\'s']
    ],
    desc: 'A ring of icy leftovers beyond Neptune, and the source of the short-period comets. Its structure is a fossil record: the orbits of its members preserve the imprint of Neptune\'s outward migration billions of years ago, which swept objects into resonances that are still occupied today.\n\nNew Horizons flew past Arrokoth here in 2019 — a contact binary, two lobes settled gently together, unaltered since the Solar System formed.',
    cites: ['mpc', 'xv93-atmos']
  },
  {
    id: 'pluto', name: 'Pluto', kind: 'dwarf', cat: 'dwarf',
    type: 'Dwarf planet (plutino)',
    a: 39.482, e: 0.2488, i: 17.16, om: 110.30, w: 113.83, M0: 14.53, orbitApprox: true,
    radiusKm: 1188, color: '#c9a68a', rank: 3,
    facts: [
      ['Semi-major axis', '39.5 au'], ['Year', '248 Earth years'],
      ['Moons', '5 — Charon, Styx, Nix, Kerberos, Hydra'],
      ['Resonance', '2:3 with Neptune'], ['Visited by', 'New Horizons, 2015']
    ],
    moons: [
      ['Charon', 'Half Pluto\'s diameter. The two are mutually tidally locked and orbit a barycentre outside Pluto\'s surface — a genuine double system rather than a planet and a moon.']
    ],
    desc: 'New Horizons found something nobody had modelled: Sputnik Planitia, a 1,000 km basin filled with nitrogen ice, convecting in slow cells and completely free of craters. It is being resurfaced *now*, on a world receiving 1/1600th of Earth\'s sunlight, four and a half billion years after formation.\n\nWhere the internal heat comes from is unresolved, and it upended the assumption that small, cold, distant bodies must be geologically dead. Pluto is the reason the outer Solar System is no longer treated as a freezer full of inert rocks.',
    cites: ['jpl-sbdb', 'mpc']
  },
  {
    id: 'xv93', name: '(612533) 2002 XV93', kind: 'dwarf', cat: 'dwarf',
    type: 'Plutino with a detected atmosphere',
    a: 39.3, e: 0.124, i: 13.3, om: 246.0, w: 116.0, M0: 160.0, orbitApprox: true,
    radiusKm: 250, color: '#7ea3b8', rank: 3,
    facts: [
      ['Radius', '≈250 km'], ['Surface pressure', '≈100–200 nanobar'],
      ['Detected via', 'stellar occultation, 10 January 2024'],
      ['Significance', 'first TNO atmosphere found beyond Pluto']
    ],
    desc: 'An unremarkable-looking plutino roughly 500 km across, and now one of the most consequential objects in the outer Solar System.',
    fresh: {
      year: '2026',
      text: 'It has an atmosphere. A coordinated stellar occultation campaign in January 2024 caught a refractive signature as the object passed in front of a star — the light bent rather than simply cutting off, which only happens if there is gas above the surface. The derived pressure is 100–200 nanobar. Until this, Pluto was the only trans-Neptunian object with a detected atmosphere, and surveys of much *larger* bodies had only ever set upper limits. A few-hundred-kilometre object should not be able to hold onto volatiles at all, so the gas is probably transient — resupplied by cryovolcanism, or thrown up by a recent impact. Published in Nature Astronomy in May 2026.'
    },
    cites: ['xv93-atmos', 'xv93-pre']
  },
  {
    id: 'arrokoth', name: '486958 Arrokoth', kind: 'smallbody', cat: 'smallbody',
    type: 'Cold classical Kuiper Belt object',
    a: 44.58, e: 0.0416, i: 2.45, om: 158.9, w: 178.0, M0: 315.0, orbitApprox: true,
    radiusKm: 18, color: '#b58a72', rank: 2,
    facts: [
      ['Length', '≈36 km'], ['Shape', 'contact binary — two lobes joined'],
      ['Flyby', 'New Horizons, 1 January 2019'],
      ['Status', 'most distant object ever visited by spacecraft']
    ],
    desc: 'Two flattened lobes resting against each other, joined at a gentle few metres per second. It is a cold classical Kuiper Belt object, meaning it has never been scattered or heated — its orbit is essentially where it formed.\n\nThat makes it the most pristine object ever examined at close range, and it settled a long argument about planetesimal formation. The gentle contact and preserved shape support gradual gravitational collapse of a pebble cloud, not violent collisional accretion.',
    cites: ['mpc', 'jpl-sbdb']
  },
  {
    id: 'quaoar', name: '50000 Quaoar', kind: 'dwarf', cat: 'dwarf',
    type: 'Kuiper Belt object with rings',
    a: 43.69, e: 0.0392, i: 7.99, om: 188.8, w: 155.0, M0: 301.0, orbitApprox: true,
    radiusKm: 545, color: '#a58fb0', rank: 2,
    facts: [
      ['Diameter', '≈1,090 km'], ['Moon', 'Weywot'],
      ['Rings', 'two, found by occultation in 2023']
    ],
    desc: 'Quaoar has rings, and they are in the wrong place. Both lie well outside the Roche limit — the distance within which tidal forces prevent material from clumping into a moon. Everything in ring dynamics said that material there should have accreted long ago.\n\nThe leading explanations involve collisional damping or resonances with Weywot keeping the particles from sticking. Either way, the Roche limit is not the hard boundary for ring survival that it was taken to be.',
    cites: ['mpc', 'jpl-sbdb']
  },
  {
    id: 'haumea', name: '136108 Haumea', kind: 'dwarf', cat: 'dwarf',
    type: 'Dwarf planet',
    a: 43.13, e: 0.191, i: 28.21, om: 122.13, w: 239.2, M0: 218.2, orbitApprox: true,
    radiusKm: 780, color: '#d6d2c4', rank: 2,
    facts: [
      ['Rotation', '3.9 hours'], ['Shape', 'a triaxial ellipsoid'],
      ['Moons', '2 — Hiʻiaka and Namaka'], ['Rings', 'yes, found 2017']
    ],
    desc: 'Spinning so fast that it has been pulled into an elongated ellipsoid roughly twice as long as it is wide — one of the most extreme shapes of any large body known. A day there lasts under four hours.\n\nIt has a ring and two moons, and it is the parent of the only known collisional family in the Kuiper Belt: a group of icy fragments sharing its orbit and surface composition, all struck off in the same ancient impact that presumably set it spinning.',
    cites: ['mpc', 'jpl-sbdb']
  },
  {
    id: 'makemake', name: '136472 Makemake', kind: 'dwarf', cat: 'dwarf',
    type: 'Dwarf planet',
    a: 45.43, e: 0.161, i: 28.98, om: 79.36, w: 296.4, M0: 165.5, orbitApprox: true,
    radiusKm: 715, color: '#c7a898', rank: 1,
    facts: [
      ['Diameter', '≈1,430 km'], ['Surface', 'methane and ethane ice'],
      ['Moon', 'one, provisionally MK 2']
    ],
    desc: 'One of the bodies whose discovery forced the 2006 reclassification debate that cost Pluto its planetary status. Its surface is coated in large methane ice grains, and a stellar occultation in 2011 showed it has no global atmosphere — unlike Pluto, whose atmosphere is sustained by a marginally warmer surface.',
    cites: ['mpc', 'jpl-sbdb']
  },
  {
    id: 'eris', name: '136199 Eris', kind: 'dwarf', cat: 'dwarf',
    type: 'Dwarf planet (scattered disc)',
    a: 67.78, e: 0.4362, i: 44.04, om: 35.95, w: 151.4, M0: 205.99, orbitApprox: true,
    radiusKm: 1163, color: '#dbdde0', rank: 2,
    facts: [
      ['Semi-major axis', '67.8 au'], ['Year', '558 Earth years'],
      ['Mass', '≈27% more massive than Pluto'],
      ['Moon', 'Dysnomia']
    ],
    desc: 'Slightly smaller than Pluto but appreciably more massive, and the direct cause of Pluto\'s demotion: once an object this size turned up, the IAU either had to admit an open-ended number of planets or draw a new line. It drew the line.\n\nIts surface is highly reflective methane ice — probably its atmosphere, frozen out entirely as it moved away from perihelion. When it comes back in, some of that should sublimate again.',
    cites: ['mpc', 'jpl-sbdb']
  },

  /* ════ THE FAR EDGE ═══════════════════════════════════════════════ */
  {
    id: 'sedna', name: '90377 Sedna', kind: 'dwarf', cat: 'dwarf',
    type: 'Sednoid — detached object',
    a: 506.8, e: 0.8496, i: 11.93, om: 144.25, w: 311.3, M0: 358.3, orbitApprox: true,
    radiusKm: 498, color: '#b4534a', rank: 3,
    facts: [
      ['Perihelion', '≈76 au'], ['Aphelion', '≈937 au'],
      ['Orbital period', '≈11,400 years'],
      ['Next perihelion', '≈2076']
    ],
    desc: 'The first object found whose orbit could not be explained by anything currently in the Solar System. Its perihelion at 76 au is far beyond Neptune\'s influence, so nothing we know of could have placed it on such an elongated path — a "detached" object, decoupled from the planets entirely.\n\nThe candidate explanations are all consequential: an undiscovered massive planet, a close stellar passage early in the Sun\'s life while it was still in its birth cluster, or capture from another star. Sedna is currently near perihelion and is about as observable as it gets; it will not be this close again for 11,000 years.',
    cites: ['ammonite', 'p9-akari', 'mpc']
  },
  {
    id: 'ammonite', name: '2023 KQ14 — "Ammonite"', kind: 'dwarf', cat: 'dwarf',
    type: 'Sednoid',
    a: 252, e: 0.738, i: 11.0, om: 250.0, w: 250.0, M0: 30.0, orbitApprox: true,
    radiusKm: 110, color: '#d08a4e', rank: 4,
    facts: [
      ['Perihelion', '≈66 au'], ['Aphelion', '≈438 au'],
      ['Discovered', '16 May 2023, Subaru Telescope (FOSSIL survey)'],
      ['Published', 'Nature Astronomy, 14 July 2025'],
      ['Status', 'only the fourth known sednoid']
    ],
    desc: 'The fourth known sednoid, found by the Subaru Telescope\'s FOSSIL survey and nicknamed for the spiral fossil its discoverers thought its orbit resembled. Only four objects in the entire Solar System are known to be on orbits like this.',
    fresh: {
      year: '2025',
      text: 'Ammonite complicates Planet Nine rather than supporting it. Simulations show it has held a stable orbit for at least 4.5 billion years — nearly as old as the Sun — making it a genuine fossil of the early Solar System. But its orbit does *not* align with the other three sednoids, and that clustering was the main circumstantial evidence for an unseen massive planet. As the discovery team put it, the misalignment lowers the likelihood of the Planet Nine hypothesis. One reading is that a planet did exist and was later ejected, leaving these orbits behind as a scar.'
    },
    cites: ['ammonite', 'ammonite-subaru', 'p9-akari']
  },
  {
    id: 'planet-nine', name: 'Planet Nine', kind: 'hypothetical', cat: 'hypothetical',
    type: 'Hypothesised distant planet — unconfirmed',
    a: 600, e: 0.3, i: 16, om: 100, w: 150, M0: 180, orbitApprox: true,
    radiusKm: 15000, color: '#6c5f9e', rank: 3,
    facts: [
      ['Status', 'hypothesis — never directly observed'],
      ['Proposed mass', '≈5–10 Earth masses'],
      ['Proposed distance', '≈400–800 au'],
      ['Evidence', 'circumstantial, and weakening']
    ],
    desc: 'A planet proposed in 2016 to explain apparent clustering in the orbits of distant trans-Neptunian objects. It has never been seen. The case for it rests on a statistical pattern in a small sample of objects that are, by construction, hard to find and easy to find non-randomly — which is exactly the situation in which selection effects produce false patterns.',
    fresh: {
      year: '2025–26',
      text: 'The evidence has moved in both directions at once. A far-infrared search comparing the IRAS (1983) and AKARI (2006) all-sky surveys — 23 years apart, enough for the predicted ~3 arcmin/year motion to show — produced 13 candidate pairs and, after inspection, one good candidate at 500–700 au implying 7–17 Earth masses. It cannot be an orbit until someone recovers it; follow-up with DECam is proposed. Meanwhile the *original* argument has weakened: the sednoid Ammonite does not share the orbital alignment the hypothesis was built on, and the OSSOS survey found no clustering in its independent sample. Rubin\'s LSST should settle the question in either direction within a few years.'
    },
    cites: ['p9-akari', 'p9-akari-pre', 'ammonite', 'rubin-lsst']
  },
  {
    id: 'heliopause', name: 'The Heliopause', kind: 'region', cat: 'region',
    type: 'Boundary of the Sun\'s magnetic influence',
    inner: 119, outer: 123, color: '#6d8fb3', rank: 2,
    facts: [
      ['Distance', '≈120 au in the direction Voyager 1 travelled'],
      ['Voyager 1 crossing', 'August 2012'],
      ['Voyager 2 crossing', 'November 2018'],
      ['Marks', 'where the solar wind gives way to interstellar plasma']
    ],
    desc: 'The edge of the heliosphere — the bubble the solar wind inflates in the interstellar medium — and the only reasonable answer to "where does the Solar System end" that anything has actually crossed. It is not spherical and not fixed: it breathes with the solar cycle.\n\nBoth Voyagers detected the crossing the same way, as a sharp rise in plasma density. Beyond it, the Sun\'s magnetic field no longer dominates. Gravitationally, though, the Sun holds sway out to the Oort Cloud, roughly a thousand times further.',
    cites: ['voyager-shutdown', 'voyager-jpl']
  },
  {
    id: 'oort-cloud', name: 'The Oort Cloud', kind: 'region', cat: 'region',
    type: 'Hypothesised spherical comet reservoir',
    inner: 2000, outer: 100000, color: '#4a5c78', rank: 2,
    facts: [
      ['Inner edge', '≈2,000 au'], ['Outer edge', '≈100,000 au (1.5 ly)'],
      ['Structure', 'spherical, not a disc'],
      ['Status', 'inferred from long-period comets, never directly observed']
    ],
    desc: 'A shell of icy bodies surrounding the entire Solar System, extending perhaps a quarter of the way to Proxima Centauri. Nobody has ever seen it. Its existence is inferred from long-period comets, which arrive from every direction rather than from the plane of the planets — implying a spherical source rather than a disc.\n\nAt those distances the Sun\'s grip is weak enough that passing stars and the tide of the Galaxy itself can nudge objects loose and send them inward. The Solar System\'s outermost boundary is set by the Milky Way, which is where this map began.',
    cites: ['mpc', 'ammonite']
  },

  /* ════ VISITORS AND DEPARTURES ════════════════════════════════════ */
  {
    id: 'atlas-3i', name: '3I/ATLAS', kind: 'interstellar', cat: 'interstellar',
    type: 'Interstellar comet — hyperbolic trajectory',
    q: 1.3574, e: 6.1414, i: 175.12, om: 322.17, w: 128.02,
    periJD: 2460978.0, hyperbolic: true,
    radiusKm: 2.5, color: '#5ce6c8', rank: 4,
    facts: [
      ['Discovered', '1 July 2025, ATLAS survey, Río Hurtado, Chile'],
      ['Eccentricity', '6.14 — unbound, by a wide margin'],
      ['Speed at infinity', '≈58 km/s'],
      ['Perihelion', '1.36 au, 29 October 2025'],
      ['Closest to Earth', '≈1.8 au, 19 December 2025'],
      ['Inclination', '175.1° — retrograde, nearly in the ecliptic plane']
    ],
    desc: 'The third interstellar object ever identified, after 1I/ʻOumuamua and 2I/Borisov, and by a long way the most extreme orbit ever recorded in the Solar System. An eccentricity of 6.14 is not a marginal case: this object was never bound to the Sun and will never return.',
    fresh: {
      year: '2025',
      text: 'Unlike ʻOumuamua, which was inert and ambiguous, 3I/ATLAS arrived visibly active — trailing dust, with a nucleus estimated at up to a few kilometres, making it the largest interstellar body yet seen. TESS precovery images show it was already outgassing on 7 May 2025 at 6.4 au, 180 days before perihelion, which points to a volatile mix different from Solar System comets. Its retrograde, nearly-ecliptic path made it observable by almost everything with a mirror: Hubble, ground-based photometry through perihelion on 29 October 2025, and monitoring past its 19 December closest approach at 1.8 au. It posed no risk to Earth at any point.'
    },
    cites: ['atlas-3i-hst', 'atlas-3i-pre', 'atlas-3i-old', 'jpl-sbdb']
  },
  {
    id: 'voyager-1', name: 'Voyager 1', kind: 'craft', cat: 'craft',
    type: 'Interstellar spacecraft',
    dist: 169, eclLon: 255, eclLat: 35, posApprox: true,
    color: '#f0e6c8', rank: 3,
    facts: [
      ['Launched', '5 September 1977'],
      ['Distance', '≈169 au and increasing'],
      ['Speed', '≈17 km/s'],
      ['Crossed heliopause', 'August 2012'],
      ['Instruments still on', '2']
    ],
    desc: 'The most distant human-made object, and the first to leave the heliosphere. Its plutonium supply has been decaying at about four watts a year since 1977, and keeping it alive now means choosing which instruments to switch off.',
    fresh: {
      year: '2026',
      text: 'NASA shut down Voyager 1\'s Low-Energy Charged Particle experiment on 17 April 2026 — the same instrument already turned off on Voyager 2 in March 2025. Two science instruments remain: a plasma-wave receiver and a magnetometer. The engineers are buying time for a power-management upgrade nicknamed "the Big Bang" that might let some instruments be restarted; with it, they believe at least one instrument on each probe could still be returning data into the 2030s.'
    },
    cites: ['voyager-shutdown', 'voyager-jpl']
  },
  {
    id: 'voyager-2', name: 'Voyager 2', kind: 'craft', cat: 'craft',
    type: 'Interstellar spacecraft',
    dist: 143, eclLon: 290, eclLat: -32, posApprox: true,
    color: '#f0e6c8', rank: 2,
    facts: [
      ['Launched', '20 August 1977 — before Voyager 1'],
      ['Distance', '≈143 au'],
      ['Crossed heliopause', 'November 2018'],
      ['Unique record', 'the only spacecraft to visit Uranus and Neptune']
    ],
    desc: 'Launched sixteen days before its twin, on a slower trajectory that let it take the Grand Tour: Jupiter, Saturn, Uranus, Neptune. It remains the only spacecraft ever to have visited the two ice giants, and every close-up image of Uranus and Neptune in existence came from a few hours of its 1986 and 1989 flybys.\n\nIts Low-Energy Charged Particle instrument was switched off in March 2025 to conserve power. Three science instruments are still returning data.',
    cites: ['voyager-jpl', 'voyager-shutdown']
  }
];

if (typeof module !== 'undefined') { module.exports = { SOLAR_POI, PLANET_ELEMENTS }; }
