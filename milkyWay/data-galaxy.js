/* ═══════════════════════════════════════════════════════════════════════
   data-galaxy.js — points of interest at galactic scale
   ───────────────────────────────────────────────────────────────────────
   Positions are given the way catalogues give them: galactic longitude l,
   galactic latitude b, and heliocentric distance. The atlas projects them
   onto the galactic plane at draw time rather than storing screen
   coordinates, so the map and the numbers in the panel can never drift
   apart.

     x = -d·cos(b)·sin(l)
     y = -R0 + d·cos(b)·cos(l)          R0 = 26,700 ly (Sun → Galactic Centre)

   lbApprox: true means the longitude/latitude here is good enough to put
   the marker in the right part of the sky but should not be quoted as a
   measurement. The panel says so out loud rather than quietly rounding.

   Every `facts` row and every sentence of `fresh` traces to a key in
   sources.js. Fields left out are fields nobody could source.
   ═══════════════════════════════════════════════════════════════════════ */

const GALAXY_POI = [

  /* ════ THE CORE ═══════════════════════════════════════════════════ */

  {
    id: 'sgr-a-star',
    name: 'Sagittarius A*',
    alt: 'Sgr A*',
    cat: 'core',
    type: 'Supermassive black hole',
    l: 359.944, b: -0.046, dist: 26700,
    rank: 3,
    facts: [
      ['Mass', '≈4.3 million M☉'],
      ['Schwarzschild radius', '≈12.7 million km (0.08 au)'],
      ['Imaged', 'Event Horizon Telescope, 2022'],
      ['Spin axis', 'inclined close to our line of sight']
    ],
    desc: 'The gravitational anchor of the Galaxy. Everything on this map — including the Sun, including you — is falling around this point. It is quiet as supermassive black holes go: it accretes so little that it would take a decade of its output to boil a kettle, which is precisely why we can see stars orbiting it at all.\n\nThe Event Horizon Telescope resolved its emission ring in 2022, then in 2024 published the same ring in polarised light. The polarisation spirals, which means strong, ordered magnetic fields are threaded through the gas right at the edge of the hole — the same structure already seen at M87*, suggesting it is a general feature of accreting black holes rather than a quirk of one.',
    fresh: {
      year: '2026',
      text: 'A star called S301 was found on an 8.7-year orbit that takes it close enough to Sgr A* to reach roughly 25,000 km/s at closest approach — about 8% of light speed. That is fast enough for the orbit to feel the black hole\'s *spin*, not just its mass. Earlier stars such as S2 could only test relativity to order β²; S301 reaches the β³ terms where the Kerr metric\'s frame-dragging shows up. The team estimates that tracking it to 2035 would pin the spin to about ±0.1.'
    },
    cites: ['s301', 's301-pre', 'eht-sgra-pol', 'eht-sgra-fields', 'bh-polarimetry']
  },

  {
    id: 'nuclear-cluster',
    name: 'The S-Cluster',
    alt: 'Nuclear star cluster',
    cat: 'core',
    type: 'Dense stellar cluster',
    l: 359.30, b: -0.046, dist: 26700, lbApprox: true,
    rank: 1,
    facts: [
      ['Orbits tracked', 'decades of adaptive-optics astrometry'],
      ['S2 period', '≈16 years'],
      ['S301 period', '≈8.7 years'],
      ['Instruments', 'VLT Interferometer + GRAVITY, Keck']
    ],
    desc: 'A swarm of young, bright stars orbiting Sgr A* on paths tight enough to be measured individually. They are the best test particles in gravitational physics: nothing else lets us watch general relativity operate around a supermassive black hole one orbit at a time.\n\nThe cluster is also a puzzle in its own right. These are massive, short-lived stars sitting where tidal forces should have prevented them from forming. Either they formed elsewhere and migrated in, or star formation works differently than expected in the deepest part of the potential well.',
    cites: ['s301', 's301-pre']
  },

  {
    id: 'galactic-bar',
    name: 'The Galactic Bar',
    cat: 'structure',
    type: 'Stellar bar / boxy bulge',
    l: 8.5, b: 0, dist: 18500, lbApprox: true,
    rank: 2,
    facts: [
      ['Half-length', '≈5 kpc (16,000 ly)'],
      ['Angle to Sun–Centre line', '≈27°'],
      ['Shape', 'boxy / peanut-shaped in profile']
    ],
    desc: 'The Milky Way is a barred spiral, and this is the bar: a slab of old stars sweeping through the inner Galaxy, driving gas inward and stirring the orbits of everything it passes. We only established it was there because we sit inside it and had to infer the shape from star counts and velocities rather than simply look.\n\nGaia\'s astrometry has since made the bar\'s dynamical fingerprints visible directly — asymmetries in stellar velocity fields, resonant features in phase space, and a bar orientation more inclined to our line of sight than older models assumed.',
    cites: ['gaia-dynamics', 'gaia-milkyway']
  },

  {
    id: 'fermi-bubbles',
    name: 'The Fermi Bubbles',
    cat: 'structure',
    type: 'Gamma-ray outflow lobes',
    l: 351.5, b: 0, dist: 26700, lbApprox: true,
    rank: 2,
    facts: [
      ['Extent', '≈25,000 ly above and below the disc'],
      ['Discovered', '2010, Fermi Gamma-ray Space Telescope'],
      ['X-ray counterpart', 'larger eROSITA bubbles, 2020']
    ],
    desc: 'Two enormous lobes of gamma-ray emission ballooning out of the Galactic Centre, perpendicular to the disc, each reaching about as far above the plane as the Sun sits from the centre. They went unnoticed until 2010 because they are diffuse and the foreground is bright.\n\nThey are the fossil of something violent — either a burst of star formation or an episode when Sgr A* was feeding far more aggressively than it is now. Whatever it was happened within the last few million years, which is recent enough that the Galaxy we live in is not quite the quiet place it looks.',
    cites: ['gaia-milkyway']
  },

  {
    id: 'sgr-b2',
    name: 'Sagittarius B2',
    alt: 'Sgr B2',
    cat: 'nebula',
    type: 'Giant molecular cloud',
    l: 0.67, b: -0.04, dist: 26700,
    rank: 1,
    facts: [
      ['Mass', '≈3 million M☉ of gas and dust'],
      ['Diameter', '≈45 ly'],
      ['Notable for', 'complex organic molecules']
    ],
    desc: 'The largest molecular cloud in the Galactic Centre, and the single richest hunting ground for interstellar chemistry. Radio astronomers have identified dozens of molecules here that exist nowhere else in our observational reach — including sugars, alcohols and the precursors of amino acids, assembled on the surfaces of cold dust grains.\n\nIt matters beyond chemistry trivia: it demonstrates that complex organics form readily in ordinary interstellar conditions, long before a planet exists to host them.',
    cites: ['gaia-milkyway']
  },

  {
    id: 'arches',
    name: 'Arches Cluster',
    cat: 'cluster',
    type: 'Young massive star cluster',
    l: 0.12, b: 0.02, dist: 25000,
    rank: 1,
    facts: [
      ['Age', '≈2–4 million years'],
      ['Density', 'among the densest known in the Galaxy'],
      ['Location', '≈100 ly from Sgr A*']
    ],
    desc: 'One of the densest star clusters in the Milky Way, packed into a region where the tidal pull of the Galactic Centre should be shredding it. It is young enough that its most massive stars have not yet exploded, and dense enough that stellar collisions are a real possibility rather than a thought experiment.\n\nIt is also doomed: within a few tens of millions of years the Galactic tide will disperse it entirely into the nuclear region.',
    cites: ['gaia-milkyway']
  },

  /* ════ LARGE-SCALE STRUCTURE ══════════════════════════════════════ */

  {
    id: 'orion-spur',
    name: 'The Orion Spur',
    alt: 'Local Arm',
    cat: 'structure',
    type: 'Spiral arm segment',
    l: 80, b: 0, dist: 3000,
    lbApprox: true,
    rank: 3,
    facts: [
      ['Length', '≈20,000 ly'],
      ['Width', '≈3,500 ly'],
      ['Contains', 'the Sun, Orion, Cygnus X, the Local Bubble']
    ],
    desc: 'Our address. For decades the Orion Spur was treated as a minor bridge between the Sagittarius and Perseus arms — a spur, hence the name. Maser parallax measurements of star-forming regions have since shown it is substantially longer and denser than that dismissal implied, comparable to the major arms in star formation even if not in stellar mass.\n\nThe honest summary is that the Milky Way\'s arms are not the clean, symmetric structures of a textbook diagram. They branch, bifurcate and trail spurs, and we happen to live inside one of the ambiguous bits.',
    cites: ['hii-parallax', 'arm-bifurcations', 'radcliffe-spine']
  },

  {
    id: 'radcliffe-wave',
    name: 'The Radcliffe Wave',
    cat: 'structure',
    type: 'Undulating gas filament',
    l: 155, b: 0, dist: 1500,
    lbApprox: true,
    rank: 3,
    facts: [
      ['Length', '≈2.7 kpc (9,000 ly)'],
      ['Closest approach to Sun', '≈300 pc (1,000 ly)'],
      ['Discovered', '2020, from 3D dust mapping'],
      ['Motion', 'oscillating through the galactic plane']
    ],
    desc: 'A single connected chain of star-forming gas clouds running through the solar neighbourhood — including Orion, Perseus and Taurus, which had always been catalogued as separate objects. It only became visible when 3D dust maps built from Gaia parallaxes revealed that these nurseries lie on one sinusoidal filament nearly 9,000 light-years long.\n\nIt is now understood as the gas spine of the Orion Arm itself: not a curiosity in the arm, but the thing the arm is made of.',
    fresh: {
      year: '2024',
      text: 'The wave is not a static shape — it is *waving*. Measuring the 3D velocities of young star clusters strung along it showed the whole filament oscillating up and down through the galactic plane, like a travelling wave on a rope, while drifting radially outward from the Galactic Centre. That drift carries a further implication: the cluster whose supernovae blew the Local Bubble around us may itself have been born in the Radcliffe Wave.'
    },
    cites: ['radcliffe-osc', 'radcliffe-spine', 'local-bubble']
  },

  {
    id: 'local-bubble',
    name: 'The Local Bubble',
    cat: 'structure',
    type: 'Supernova-blown cavity',
    l: 0, b: 0, dist: 1,
    rank: 3,
    facts: [
      ['Diameter', '≈1,000 ly'],
      ['Carved by', '≈15 supernovae over ~14 million years'],
      ['Sun entered', '≈5 million years ago'],
      ['Interior', 'hot, tenuous, nearly dust-free gas']
    ],
    desc: 'The Sun is inside a hole. A series of supernovae blew a cavity roughly a thousand light-years across in the interstellar medium, and the Solar System wandered into it about five million years ago — a coincidence of timing, not a cause.\n\nThe cavity is why our view of the Galaxy is as clear as it is. Beyond the bubble wall, dust reddens and dims everything; inside it, we look out through unusually empty space. A civilisation on the far side of a dense molecular cloud would have had a much harder time working out what galaxy it lived in.',
    fresh: {
      year: '2022',
      text: 'Gaia-based 3D mapping showed that essentially every young star-forming region within about 650 light-years sits on the *surface* of the bubble, not scattered through the volume. The expanding shell swept up gas and triggered the collapse that made them. Nearby star formation is not a background process — it is this bubble\'s expansion, still visibly in progress.'
    },
    cites: ['local-bubble', 'radcliffe-osc']
  },

  {
    id: 'perseus-arm',
    name: 'Perseus Arm',
    cat: 'structure',
    type: 'Major spiral arm',
    l: 135, b: 0, dist: 6500,
    lbApprox: true,
    rank: 2,
    facts: [
      ['Distance from Sun', '≈6,400 ly at nearest'],
      ['Position', 'next major arm outward from ours']
    ],
    desc: 'The major arm immediately outside our own, and the one whose structure is best measured because we can see it against the outer Galaxy rather than through the crowded inner disc. Maser parallaxes to its star-forming regions gave the first geometric distances to a spiral arm, replacing kinematic estimates that had been in circulation for half a century.',
    cites: ['hii-parallax', 'arm-bifurcations']
  },

  {
    id: 'sagittarius-arm',
    name: 'Sagittarius–Carina Arm',
    cat: 'structure',
    type: 'Major spiral arm',
    l: 310, b: 0, dist: 5000,
    lbApprox: true,
    rank: 2,
    facts: [
      ['Position', 'next major arm inward from ours'],
      ['Contains', 'the Carina Nebula, the Eagle Nebula']
    ],
    desc: 'The arm inward of us, and the one that supplies most of the spectacular nebulae in the southern sky — Carina and the Eagle both sit in it. Looking toward Sagittarius means looking down its length, which is why that direction is so crowded with star-forming regions stacked one behind another.',
    fresh: {
      year: '2025',
      text: 'Surveys of dense clumps traced with Hi-GAL and ATLASGAL have identified where the arms split rather than run cleanly. One bifurcation suggests the Sagittarius and Perseus arms may merge near galactic longitude 15°, and another that the Centaurus and Norma arms converge near 333° — the Milky Way\'s arms fork more than the classic four-arm diagram admits.'
    },
    cites: ['arm-bifurcations', 'hii-parallax']
  },

  {
    id: 'scutum-centaurus',
    name: 'Scutum–Centaurus Arm',
    cat: 'structure',
    type: 'Major spiral arm',
    l: 30, b: 0, dist: 15000,
    lbApprox: true,
    rank: 2,
    facts: [['Position', 'inner major arm, anchored on the bar']],
    desc: 'One of the two dominant inner arms, attached to the end of the central bar. It is thought to carry a large fraction of the Galaxy\'s old stellar mass, and it wraps far enough around the far side of the Galaxy that most of it is permanently hidden from us behind the bulge.',
    cites: ['arm-bifurcations', 'gaia-dynamics']
  },

  {
    id: 'galactic-warp',
    name: 'The Galactic Warp',
    cat: 'structure',
    type: 'Disc deformation',
    l: 180, b: 0, dist: 40000,
    lbApprox: true,
    rank: 2,
    facts: [
      ['Location', 'outer disc, beyond ≈8 kpc from centre'],
      ['Behaviour', 'warped and precessing']
    ],
    desc: 'The Milky Way\'s disc is not flat. Past roughly the solar radius it bends — up on one side, down on the other — and the bend itself rotates, precessing faster than the stars that make it. Cepheid variables and Gaia astrometry pinned the geometry down after decades of it being visible only in radio maps of neutral hydrogen.\n\nThe most likely culprit is gravitational torque from the satellite galaxies, principally the Large Magellanic Cloud. Our galaxy is being visibly bent by its own companions.',
    cites: ['gaia-dynamics', 'gaia-milkyway']
  },

  /* ════ NEBULAE AND STAR-FORMING REGIONS ═══════════════════════════ */

  {
    id: 'orion-nebula',
    name: 'Orion Nebula',
    alt: 'M42 / NGC 1976',
    cat: 'nebula',
    type: 'H II region',
    l: 209.01, b: -19.38, dist: 1344,
    rank: 3,
    facts: [
      ['Distance', '≈1,344 ly'],
      ['Diameter', '≈24 ly'],
      ['Ionised by', 'the Trapezium Cluster'],
      ['Visible to', 'the unaided eye, as Orion\'s sword']
    ],
    desc: 'The nearest region of massive star formation, and consequently the most studied object of its kind. It sits on the near wall of a much larger molecular cloud; what we see glowing is a blister of ionised gas eating into that cloud from the front, lit by a handful of hot young stars at its heart.\n\nHubble found protoplanetary discs here — proplyds — being photo-evaporated by the same ultraviolet light that makes the nebula glow. It is a direct look at planetary systems forming and, in some cases, being destroyed before they finish.',
    cites: ['radcliffe-osc', 'radcliffe-spine']
  },

  {
    id: 'carina-nebula',
    name: 'Carina Nebula',
    alt: 'NGC 3372',
    cat: 'nebula',
    type: 'H II region',
    l: 287.6, b: -0.6, dist: 7500,
    rank: 2,
    facts: [
      ['Distance', '≈7,500 ly'],
      ['Diameter', '≈300 ly'],
      ['Contains', 'Eta Carinae, the Cosmic Cliffs']
    ],
    desc: 'Far larger and more violent than Orion, and home to some of the most massive stars known. Its "Cosmic Cliffs" — a ridge of gas being eroded by ultraviolet radiation from young stars above it — became one of the first images JWST released, and showed dozens of previously invisible protostellar jets punching out of the wall.\n\nThe nebula is essentially a demonstration of stellar feedback: massive stars carving apart the cloud that made them, compressing its edges into the next generation as they go.',
    cites: ['hii-parallax']
  },

  {
    id: 'eagle-nebula',
    name: 'Eagle Nebula',
    alt: 'M16 — the Pillars of Creation',
    cat: 'nebula',
    type: 'H II region with open cluster',
    l: 17.0, b: 0.8, dist: 5700,
    rank: 2,
    facts: [
      ['Distance', '≈5,700 ly'],
      ['Pillars height', '≈4–5 ly'],
      ['Imaged', 'Hubble 1995, JWST 2022']
    ],
    desc: 'The Pillars of Creation are columns of cold molecular gas left standing because they are dense enough to resist the ultraviolet erosion stripping the cloud around them. Inside their tips, new stars are condensing — the pillars are simultaneously being destroyed and giving birth.\n\nJWST\'s infrared view cut through the dust that Hubble\'s optical image could only show in silhouette, revealing embedded protostars as bright knots inside the columns.',
    cites: ['arm-bifurcations']
  },

  {
    id: 'crab-nebula',
    name: 'Crab Nebula',
    alt: 'M1 / SN 1054',
    cat: 'nebula',
    type: 'Supernova remnant + pulsar',
    l: 184.56, b: -5.78, dist: 6500,
    rank: 2,
    facts: [
      ['Progenitor explosion', 'observed AD 1054'],
      ['Pulsar spin', '≈33 milliseconds'],
      ['Expansion speed', '≈1,500 km/s']
    ],
    desc: 'The only supernova remnant whose explosion has a written eyewitness record — Chinese and Japanese astronomers logged a "guest star" bright enough for daylight visibility in July 1054, and the expansion of the nebula runs backwards to exactly that date.\n\nAt its centre is a neutron star spinning thirty times a second, its magnetic field whipping the surrounding gas into a luminous wind nebula. The Crab is bright and steady enough across the electromagnetic spectrum that it is used as a calibration standard for X-ray telescopes.',
    cites: ['gaia-milkyway']
  },

  {
    id: 'rho-oph',
    name: 'Rho Ophiuchi Cloud',
    cat: 'nebula',
    type: 'Dark cloud / star-forming complex',
    l: 353.2, b: 16.9, dist: 460,
    rank: 2,
    facts: [
      ['Distance', '≈460 ly'],
      ['Status', 'nearest star-forming region to the Sun'],
      ['Young stars', 'several hundred protostars']
    ],
    desc: 'The closest place where stars are actively being born — near enough that JWST can resolve individual protostellar jets, and near enough that it sits on the wall of our own Local Bubble. Its youngest objects are only a few hundred thousand years old, which is to say they formed after our species did.\n\nJWST\'s first-anniversary image of this cloud showed jets of molecular hydrogen firing out of newborn stars in every direction, the tell-tale exhaust of accretion still in progress.',
    cites: ['local-bubble', 'radcliffe-osc']
  },

  {
    id: 'cygnus-x',
    name: 'Cygnus X',
    cat: 'nebula',
    type: 'Massive star-forming complex',
    l: 80.2, b: 0.8, dist: 4600,
    rank: 1,
    facts: [
      ['Distance', '≈4,600 ly'],
      ['Extent', '≈600 ly'],
      ['Contains', 'Cygnus OB2, one of the largest OB associations known']
    ],
    desc: 'One of the most active star-forming complexes in the Galaxy, and the brightest region of the sky at radio wavelengths outside the Galactic Centre. We look down the length of the Orion Spur toward it, which stacks the emission of several structures on top of each other and made untangling its geometry a decades-long problem.',
    cites: ['hii-parallax', 'radcliffe-spine']
  },

  {
    id: 'helix',
    name: 'Helix Nebula',
    alt: 'NGC 7293',
    cat: 'nebula',
    type: 'Planetary nebula',
    l: 36.16, b: -57.12, dist: 655,
    rank: 1,
    facts: [
      ['Distance', '≈655 ly'],
      ['Age', '≈10,600 years'],
      ['Central object', 'a white dwarf']
    ],
    desc: 'A Sun-like star\'s discarded outer atmosphere, lit from inside by the exposed stellar core it left behind. Nothing to do with planets — the name is an eighteenth-century misnomer that stuck because the discs looked planetary in small telescopes.\n\nIt is a preview. In roughly five billion years the Sun will shed its envelope the same way, and the Solar System will spend a brief geological moment looking like this before fading to a cooling white dwarf.',
    cites: ['gaia-milkyway']
  },

  /* ════ COMPACT OBJECTS ════════════════════════════════════════════ */

  {
    id: 'gaia-bh3',
    name: 'Gaia BH3',
    cat: 'compact',
    type: 'Dormant stellar-mass black hole',
    l: 39, b: -18, dist: 1926, lbApprox: true,
    rank: 3,
    facts: [
      ['Mass', '33 M☉'],
      ['Distance', '≈1,926 ly, in Aquila'],
      ['Companion', 'an old, metal-poor giant star'],
      ['Status', 'second-closest known black hole to Earth']
    ],
    desc: 'By a wide margin the most massive stellar black hole known in the Milky Way — the previous record-holder, Cygnus X-1, reaches about 21 solar masses. It is dormant: with no companion close enough to strip, it emits nothing at all, and was found only because the star orbiting it wobbles.',
    fresh: {
      year: '2024',
      text: 'Spotted in pre-release Gaia astrometry while the data were being validated, and announced in April 2024. Its mass is a genuine problem for stellar evolution models: a star in our galaxy\'s chemistry should shed too much mass in stellar winds to leave a 33 M☉ remnant. Its companion is metal-poor, which supports the idea that BH3 formed from a very low-metallicity star that held onto its mass — the kind of object usually assumed to exist only in the early universe.'
    },
    cites: ['gaia-bh3']
  },

  {
    id: 'cygnus-x1',
    name: 'Cygnus X-1',
    cat: 'compact',
    type: 'X-ray binary / black hole',
    l: 71.33, b: 3.07, dist: 7200,
    rank: 2,
    facts: [
      ['Black hole mass', '≈21 M☉'],
      ['Companion', 'a blue supergiant'],
      ['Discovered', '1964, as an X-ray source']
    ],
    desc: 'The first object to be widely accepted as a black hole, and the subject of Hawking and Thorne\'s famous 1974 bet — Hawking took the position that it was not one, admitting defeat in 1990. It is actively feeding: gas stripped from its blue supergiant companion spirals in and shines in X-rays before it crosses the horizon.',
    cites: ['gaia-bh3']
  },

  {
    id: 'betelgeuse',
    name: 'Betelgeuse',
    alt: 'α Orionis',
    cat: 'star',
    type: 'Red supergiant',
    l: 199.79, b: -8.96, dist: 548,
    rank: 3,
    facts: [
      ['Radius', '≈700× the Sun'],
      ['Fate', 'core-collapse supernova, timing uncertain'],
      ['Great Dimming', '2019–2020, caused by an ejected dust cloud']
    ],
    desc: 'A star massive enough that it will end as a supernova, close enough that when it does it will be visible in daylight, and unstable enough that predicting when is genuinely hard. Its 2019–20 "Great Dimming" briefly raised hopes that the explosion was imminent; the cause turned out to be a cloud of dust the star had itself belched out, condensing across our line of sight.',
    fresh: {
      year: '2025',
      text: 'Betelgeuse has a companion. A faint star roughly 1.5 solar masses, orbiting *inside* the supergiant\'s extended atmosphere at about four times the Earth–Sun distance, was directly detected with the ʼAlopeke speckle imager on Gemini North in July 2025 — confirming a companion that had been inferred from a six-year variability cycle but never seen. It has since been named Siwarha.'
    },
    cites: ['betelgeuse-companion', 'betelgeuse-jpl']
  },

  {
    id: 'eta-carinae',
    name: 'Eta Carinae',
    cat: 'star',
    type: 'Luminous blue variable (binary)',
    l: 287.6, b: -0.63, dist: 7500,
    rank: 2,
    facts: [
      ['System mass', '≈100+ and ≈30 M☉'],
      ['Great Eruption', '1837–1856'],
      ['Ejected', '≈10–20 M☉ of material']
    ],
    desc: 'In the 1840s this star briefly became the second-brightest in the sky, threw off more material than ten Suns, and survived. The ejecta form the bilobed Homunculus Nebula still expanding around it today.\n\nWhy it survived is unresolved. An event that energetic should have destroyed the star; instead it is still there, still unstable, and still one of the best candidates for the next Galactic supernova.',
    cites: ['hii-parallax']
  },

  /* ════ CLUSTERS ═══════════════════════════════════════════════════ */

  {
    id: 'omega-cen',
    name: 'Omega Centauri',
    alt: 'NGC 5139',
    cat: 'cluster',
    type: 'Globular cluster (probable stripped galaxy core)',
    l: 309.1, b: 15.0, dist: 17090,
    rank: 3,
    facts: [
      ['Stars', '≈10 million'],
      ['Mass', '≈4 million M☉'],
      ['Distance', '≈17,090 ly'],
      ['Status', 'largest, brightest globular in the sky']
    ],
    desc: 'Too big, too massive, and too chemically varied to be an ordinary globular cluster. Its stars span multiple generations with different compositions, which a single cluster cannot produce. The consensus reading is that Omega Centauri is the stripped nucleus of a dwarf galaxy the Milky Way swallowed — a survivor of a merger, not a native.',
    fresh: {
      year: '2024',
      text: 'Two decades of Hubble imaging — more than 500 exposures originally taken for calibration — revealed seven stars in the cluster core moving fast enough that they should have escaped long ago unless something massive is holding them. The implied mass is at least 8,200 M☉ in a region small enough to make an intermediate-mass black hole the leading explanation. IMBHs are the long-missing link between stellar-mass and supermassive black holes, and this is the strongest case yet found.'
    },
    cites: ['omega-cen-imbh', 'omega-cen-stsci']
  },

  {
    id: 'pleiades',
    name: 'The Pleiades',
    alt: 'M45 / Seven Sisters',
    cat: 'cluster',
    type: 'Open cluster',
    l: 166.57, b: -23.52, dist: 444,
    rank: 2,
    facts: [
      ['Distance', '≈444 ly'],
      ['Age', '≈100 million years'],
      ['Members', '≈1,000 stars']
    ],
    desc: 'The most recognised star cluster in the sky, catalogued independently by nearly every culture that kept records of the night. The blue haze around its brightest members is not leftover birth material — the cluster is drifting through an unrelated dust cloud and lighting it up in passing.\n\nIts distance was a minor scandal for years: Hipparcos measured it about 10% closer than every other method, and Gaia eventually settled the argument in favour of the other methods.',
    cites: ['gaia-milkyway']
  },

  {
    id: '47-tuc',
    name: '47 Tucanae',
    alt: 'NGC 104',
    cat: 'cluster',
    type: 'Globular cluster',
    l: 305.9, b: -44.9, dist: 13000,
    rank: 1,
    facts: [
      ['Distance', '≈13,000 ly'],
      ['Age', '≈13 billion years'],
      ['Notable', 'dense core, many millisecond pulsars']
    ],
    desc: 'The second-brightest globular cluster in the sky and one of the densest. Its core is packed tightly enough that stars interact — it hosts an unusually large population of millisecond pulsars, neutron stars spun up by stripping material from binary partners they acquired through close encounters.\n\nAt roughly 13 billion years old, its stars formed before the Milky Way\'s disc existed.',
    cites: ['omega-cen-imbh']
  },

  {
    id: 'westerlund-1',
    name: 'Westerlund 1',
    cat: 'cluster',
    type: 'Super star cluster',
    l: 339.55, b: -0.4, dist: 12000,
    rank: 1,
    facts: [
      ['Age', '≈3–5 million years'],
      ['Mass', '≈50,000–100,000 M☉'],
      ['Status', 'most massive young cluster known in the Milky Way']
    ],
    desc: 'A cluster massive enough to blur the line between "open cluster" and "young globular". It contains a substantial fraction of all known Wolf–Rayet stars in the Galaxy, several red supergiants, and a magnetar whose existence is awkward: it should have formed from a star massive enough to have collapsed into a black hole instead.\n\nHeavy dust extinction hides it almost completely at optical wavelengths, which is why an object this extreme was not catalogued until 1961.',
    cites: ['hii-parallax']
  },

  /* ════ THE SOLAR NEIGHBOURHOOD ════════════════════════════════════ */

  {
    id: 'sol',
    name: 'The Sun',
    alt: 'Sol — you are here',
    cat: 'home',
    type: 'G2V main-sequence star',
    l: 0, b: 0, dist: 0,
    rank: 4,
    facts: [
      ['Distance to Galactic Centre', '≈26,700 ly (8.2 kpc)'],
      ['Orbital speed', '≈230 km/s'],
      ['Galactic year', '≈230 million years'],
      ['Position', 'inside the Local Bubble, on the Orion Spur']
    ],
    desc: 'One star among a few hundred billion, roughly two-thirds of the way out from the centre, currently passing through a cavity blown by supernovae that detonated before our genus existed. It has completed something like twenty circuits of the Galaxy since it formed.\n\nThe view from here is unusually good — the Local Bubble is nearly dust-free — which is a large part of why we were able to work out what the Milky Way looks like from inside it.',
    cites: ['local-bubble', 'gaia-dynamics'],
    enterSystem: 'solar'
  },

  {
    id: 'proxima',
    name: 'Proxima Centauri',
    cat: 'star',
    type: 'M5.5V red dwarf',
    l: 313.94, b: -1.93, dist: 4.246,
    rank: 3,
    facts: [
      ['Distance', '4.25 ly — the nearest star'],
      ['Planets', 'Proxima b (2016), Proxima d (2022)'],
      ['Proxima b', '≈1.07 M⊕, in the habitable zone'],
      ['Complication', 'violent stellar flares']
    ],
    desc: 'The closest star to the Sun, gravitationally bound to the Alpha Centauri pair in a very wide orbit. It hosts at least two confirmed planets, one of them roughly Earth-mass and receiving about the right amount of light for liquid water.\n\nWhether that means anything is unsettled. Proxima is a flare star, capable of brightening by a factor of a thousand in minutes, and any atmosphere on a planet that close has spent billions of years being sandblasted by that radiation.',
    cites: ['exo-6000']
  },

  {
    id: 'alpha-cen',
    name: 'Alpha Centauri A & B',
    alt: 'Rigil Kentaurus & Toliman',
    cat: 'star',
    type: 'G2V + K1V binary',
    l: 315.73, b: -0.68, dist: 4.365,
    rank: 3,
    facts: [
      ['Distance', '4.37 ly'],
      ['Separation', '11–36 au'],
      ['α Cen A', 'nearly a solar twin']
    ],
    desc: 'The nearest Sun-like star, in a binary close enough that the pair complicates planet formation and far enough apart that stable planetary orbits are still possible around each. It has been the first target of nearly every serious interstellar mission concept ever drafted.',
    fresh: {
      year: '2025',
      text: 'JWST\'s mid-infrared instrument, using a coronagraph to blot out the star\'s glare, imaged a candidate object in α Cen A\'s habitable zone in August 2024 — roughly Saturn-mass, at about twice the Earth–Sun distance. It is a *candidate*, not a confirmation: follow-up attempts in February and April 2025 failed to recover it, though modelling shows that just over half of the plausible orbits would have placed it out of view on those dates. Being a gas giant, it would not be habitable itself.'
    },
    cites: ['alpha-cen-a', 'alpha-cen-sciam']
  },

  {
    id: 'barnards-star',
    name: "Barnard's Star",
    cat: 'star',
    type: 'M4V red dwarf',
    l: 30.99, b: 14.06, dist: 5.96,
    rank: 3,
    facts: [
      ['Distance', '5.96 ly — fourth-nearest star'],
      ['Proper motion', 'the largest known of any star'],
      ['Age', '≈7–10 billion years']
    ],
    desc: 'The fastest-moving star across our sky, covering a Moon-diameter every 180 years. It is also the site of one of astronomy\'s cautionary tales: in the 1960s Peter van de Kamp announced Jupiter-mass planets here based on photographic astrometry, and the signal turned out to be an artefact of maintenance on his own telescope.',
    fresh: {
      year: '2025',
      text: 'It does have planets after all — four of them, all *smaller* than Earth, confirmed in March 2025 by combining MAROON-X on Gemini North with ESPRESSO on the VLT. They are far too close to the star to be habitable, but they are the kind of sub-Earth worlds that were beyond detection entirely a decade ago, at the star van de Kamp got wrong.'
    },
    cites: ['barnard-4', 'exo-6000']
  },

  {
    id: 'sirius',
    name: 'Sirius',
    alt: 'α Canis Majoris',
    cat: 'star',
    type: 'A1V + white dwarf binary',
    l: 227.23, b: -8.89, dist: 8.6,
    rank: 2,
    facts: [
      ['Distance', '8.6 ly'],
      ['Apparent magnitude', '−1.46, brightest star in the sky'],
      ['Sirius B', 'a white dwarf, ≈1 M☉ in an Earth-sized body']
    ],
    desc: 'The brightest star in the night sky, and half of one of the most consequential binaries in astrophysics. Sirius B was the first white dwarf recognised as such: a star with the mass of the Sun compressed into the volume of the Earth, which forced physicists to accept electron degeneracy pressure as a real thing holding matter up against gravity.',
    cites: ['gaia-milkyway']
  },

  {
    id: 'trappist-1',
    name: 'TRAPPIST-1',
    cat: 'exo',
    type: 'Ultra-cool dwarf with seven planets',
    l: 69.47, b: -47.12, dist: 40.7,
    rank: 3,
    facts: [
      ['Distance', '≈40.7 ly'],
      ['Planets', 'seven, all roughly Earth-sized'],
      ['In habitable zone', 'three (e, f, g)'],
      ['Orbits', 'all closer in than Mercury']
    ],
    desc: 'Seven rocky planets around a star barely larger than Jupiter, packed so tightly that the whole system would fit inside Mercury\'s orbit and the planets tug each other into a resonant chain. It is the most accessible test case anywhere for the question of whether small planets around small stars can hold onto atmospheres.',
    fresh: {
      year: '2025',
      text: 'JWST spent 2025 on TRAPPIST-1e, the best habitable-zone candidate, and the honest answer is: not yet. Transmission spectra are contaminated by the star\'s own spots and faculae, which mimic planetary signals. The data rule out a hydrogen-rich atmosphere and disfavour Venus-like and Mars-like ones; a nitrogen-rich atmosphere with trace methane fits acceptably — but so does having no atmosphere at all. The null hypothesis has not been rejected.'
    },
    cites: ['trappist-1e-dreams', 'trappist-1e-secondary', 'exo-6000'],
    enterSystem: 'trappist1'
  },

  /* ════ SATELLITES AND HALO ════════════════════════════════════════ */

  {
    id: 'lmc',
    name: 'Large Magellanic Cloud',
    cat: 'satellite',
    type: 'Satellite galaxy',
    l: 280.47, b: -32.89, dist: 163000,
    rank: 3,
    facts: [
      ['Distance', '≈163,000 ly'],
      ['Mass', '≈10–20% of the Milky Way'],
      ['Contains', 'the Tarantula Nebula, SN 1987A']
    ],
    desc: 'The Milky Way\'s largest satellite, massive enough to be visibly deforming our galaxy rather than merely orbiting it — the warp in our outer disc is largely its doing. It hosted SN 1987A, the only supernova of the modern era close enough for its neutrinos to be detected on Earth.',
    fresh: {
      year: '2025',
      text: 'The LMC appears to have a supermassive black hole of its own, around 600,000 solar masses. The evidence is indirect but clean: of 21 hypervelocity stars found unbound in the Milky Way\'s outer halo, nine trace back not to our Galactic Centre but to the centre of the LMC. Stars are flung to those speeds when a binary is torn apart by a supermassive black hole, so nine independent trajectories pointing at one place is a hard result to explain any other way.'
    },
    cites: ['lmc-smbh', 'lmc-smbh-cfa']
  },

  {
    id: 'smc',
    name: 'Small Magellanic Cloud',
    cat: 'satellite',
    type: 'Satellite galaxy',
    l: 302.8, b: -44.3, dist: 199000,
    rank: 2,
    facts: [
      ['Distance', '≈199,000 ly'],
      ['Status', 'being tidally disrupted'],
      ['Trailing', 'the Magellanic Stream']
    ],
    desc: 'Smaller, more distant and visibly coming apart. Its interaction with the LMC and the Milky Way has drawn out the Magellanic Stream, a vast ribbon of hydrogen trailing both clouds across a wide arc of the southern sky. Recent kinematic work suggests the SMC may not be one object at all, but two structures overlapping along our line of sight.',
    cites: ['lmc-smbh', 'gaia-dynamics']
  },

  {
    id: 'sgr-dwarf',
    name: 'Sagittarius Dwarf Galaxy',
    alt: 'Sgr dSph',
    cat: 'satellite',
    type: 'Disrupting dwarf spheroidal',
    l: 5.6, b: -14.1, dist: 65000,
    rank: 2,
    facts: [
      ['Distance', '≈65,000 ly'],
      ['Status', 'mid-merger, tidally shredded'],
      ['Discovered', '1994']
    ],
    desc: 'A dwarf galaxy currently being eaten. It passes through the Milky Way\'s disc repeatedly, and each passage strips more of it away into a tidal stream that now wraps the entire sky. It went unnoticed until 1994 because it sits behind the Galactic Centre, where the foreground star density is overwhelming.\n\nThose passages may have consequences for us: modelling links them to bursts of star formation in the Milky Way\'s disc, possibly including the one that produced the Sun.',
    cites: ['gaia-dynamics']
  },

  {
    id: 'aquarius-iv',
    name: 'Aquarius IV',
    cat: 'satellite',
    type: 'Ultra-faint dwarf satellite',
    l: 55, b: -50, dist: 300000, lbApprox: true,
    rank: 2,
    facts: [
      ['Apparent magnitude', '≈18.3 — extremely faint'],
      ['Stellar population', 'very metal-poor'],
      ['Estimated age', '≈13 billion years'],
      ['Found by', 'Vera C. Rubin Observatory']
    ],
    desc: 'An ultra-faint dwarf galaxy: a satellite so dim it is barely more than a statistical overdensity of ancient stars. Objects like this are the smallest galaxies that exist, and they are dominated by dark matter to an extreme degree, which makes them among the sharpest available tests of what dark matter actually is.',
    fresh: {
      year: '2026',
      text: 'The first ultra-faint Milky Way satellite discovered by the Vera C. Rubin Observatory, from commissioning data taken between April 2025 and January 2026 — before the ten-year Legacy Survey of Space and Time had properly begun. Its stars are poor in heavy elements, marking them as roughly 13 billion years old: fossils of the era before the Milky Way had a disc. Rubin is expected to find many more.'
    },
    cites: ['aquarius-iv', 'rubin-lsst', 'rubin-alerts']
  },

  {
    id: 'gaia-enceladus',
    name: 'Gaia–Enceladus',
    alt: 'the Gaia Sausage',
    cat: 'satellite',
    type: 'Merger remnant (stellar debris)',
    l: 180, b: 40, dist: 30000, lbApprox: true,
    rank: 2,
    facts: [
      ['Merger epoch', '≈8–11 billion years ago'],
      ['Detected in', 'stellar velocity space, not position'],
      ['Contributed', 'much of the Milky Way\'s inner halo']
    ],
    desc: 'Not an object you can point at — a *shape in the data*. When Gaia plotted the velocities of halo stars, a large population appeared on extremely radial orbits, forming a sausage-shaped cloud in velocity space. Those stars are the shredded remains of a dwarf galaxy the Milky Way absorbed around ten billion years ago, in the last major merger it has experienced.\n\nThe collision is thought to have heated the Milky Way\'s existing disc into what is now the thick disc. It is the single largest event in our galaxy\'s recorded history, and we only learned of it in 2018.',
    cites: ['gaia-dynamics', 'gaia-milkyway']
  },

  {
    id: 'milky-way',
    name: 'The Milky Way',
    cat: 'structure',
    type: 'Barred spiral galaxy, SBbc',
    l: 0, b: 0, dist: 26700,
    rank: 4,
    noMarker: true,
    facts: [
      ['Stellar disc diameter', '≈100,000 ly'],
      ['Stars', 'a few hundred billion'],
      ['Confirmed exoplanets', '6,000+ as of September 2025'],
      ['Satellites', 'dozens, several found in the last two years']
    ],
    desc: 'A barred spiral galaxy of a few hundred billion stars, with a supermassive black hole at the centre, four principal arms that branch and fork more than diagrams admit, a warped outer disc, and a halo built from the wreckage of galaxies it has eaten.\n\nWe map it from the inside, which is the hardest possible vantage point — the equivalent of surveying a forest from one tree. Almost everything on this map was measured indirectly, and a good deal of it has been revised in the last five years.',
    fresh: {
      year: '2025',
      text: 'The Milky Way\'s collision with Andromeda is no longer a certainty. The textbook prediction of a head-on merger in about five billion years assumed measurements more precise than they are; a June 2025 Nature Astronomy analysis that propagated the real uncertainties — and included the gravitational pull of M33 and the Large Magellanic Cloud — found roughly a 50% chance of a merger within the next ten billion years. M33 makes a collision more likely; the LMC makes it less. It went from near-certainty to a coin flip.'
    },
    cites: ['mw-andromeda', 'gaia-dynamics', 'exo-6000', 'gaia-milkyway']
  }
];

if (typeof module !== 'undefined') { module.exports = GALAXY_POI; }
