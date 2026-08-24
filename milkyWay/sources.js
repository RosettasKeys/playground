/* ═══════════════════════════════════════════════════════════════════════
   sources.js — the bibliography
   ───────────────────────────────────────────────────────────────────────
   Every factual claim rendered by this atlas carries at least one citation
   key that resolves into this table. Nothing is asserted from memory: if a
   claim has no key here, it does not appear in the panels.

   Fields
     id      short key used by data-galaxy.js / data-solar.js
     who     author or institution as it should be read aloud
     what    title of the paper, release, or dataset
     where   journal, observatory, or archive
     when    publication date as published (not the date of the finding)
     url     a landing page a reader can actually open and check
     kind    'paper' (peer-reviewed) | 'preprint' | 'release' (institutional)
             | 'archive' (catalogue / mission data)

   Peer-reviewed papers are preferred. Institutional releases are used where
   a result is best summarised by the observatory that made it, and are
   flagged as such so the reader can weigh them accordingly.
   ═══════════════════════════════════════════════════════════════════════ */

const SOURCES = {

  /* ── The Galactic Centre ─────────────────────────────────────────── */

  'eht-sgra-pol': {
    who: 'Event Horizon Telescope Collaboration',
    what: 'First Sagittarius A* EHT Results. VII. Polarization of the Ring',
    where: 'The Astrophysical Journal Letters',
    when: '2024',
    url: 'https://iopscience.iop.org/article/10.3847/2041-8213/ad2df0',
    kind: 'paper'
  },
  'eht-sgra-fields': {
    who: 'Event Horizon Telescope Collaboration',
    what: 'Astronomers Unveil Strong Magnetic Fields Spiraling at the Edge of the Milky Way’s Central Black Hole',
    where: 'Event Horizon Telescope',
    when: '2024',
    url: 'https://eventhorizontelescope.org/blog/astronomers-unveil-strong-magnetic-fields-spiraling-edge-milky-way%E2%80%99s-central-black-hole',
    kind: 'release'
  },
  's301': {
    who: 'Abd El Dayem et al. / GRAVITY+ Collaboration',
    what: 'Discovery of a star sensitive to the spin of Sagittarius A*',
    where: 'Nature',
    when: 'August 2026',
    url: 'https://www.nature.com/articles/s41586-026-10894-w',
    kind: 'paper'
  },
  's301-pre': {
    who: 'GRAVITY+ Collaboration',
    what: 'Discovery of a star sensitive to the spin of Sgr A* (author manuscript)',
    where: 'arXiv / ESO',
    when: '2026',
    url: 'https://arxiv.org/html/2607.12664',
    kind: 'preprint'
  },
  'bh-polarimetry': {
    who: 'Black Hole Polarimetry II',
    what: 'The Connection between Spin and Polarization',
    where: 'The Astrophysical Journal',
    when: '2025',
    url: 'https://iopscience.iop.org/article/10.3847/1538-4357/ae20f3',
    kind: 'paper'
  },

  /* ── Galactic structure ──────────────────────────────────────────── */

  'gaia-milkyway': {
    who: 'European Space Agency',
    what: 'Gaia — The Milky Way (mission science pages)',
    where: 'ESA Cosmos',
    when: 'ongoing',
    url: 'https://www.cosmos.esa.int/web/gaia/milky-way',
    kind: 'release'
  },
  'gaia-dynamics': {
    who: 'Hunt & Vasiliev',
    what: 'Milky Way dynamics in light of Gaia',
    where: 'arXiv (review)',
    when: '2025',
    url: 'https://arxiv.org/pdf/2501.04075',
    kind: 'preprint'
  },
  'arm-bifurcations': {
    who: 'Hi-GAL / ATLASGAL clump analysis',
    what: 'Revealing the Bifurcations of the Milky Way Spiral Arms',
    where: 'The Astronomical Journal',
    when: '2025',
    url: 'https://iopscience.iop.org/article/10.3847/1538-3881/ae0320',
    kind: 'paper'
  },
  'hii-parallax': {
    who: 'Reid et al.',
    what: 'Parallax-based Distances to Galactic H II Regions: Nearby Spiral Structure',
    where: 'arXiv',
    when: '2025',
    url: 'https://arxiv.org/pdf/2503.01551',
    kind: 'preprint'
  },
  'radcliffe-osc': {
    who: 'Konietzka, Goodman, Zucker et al.',
    what: 'The Radcliffe Wave is oscillating',
    where: 'Nature',
    when: 'February 2024',
    url: 'https://www.nature.com/articles/s41586-024-07127-3',
    kind: 'paper'
  },
  'radcliffe-spine': {
    who: 'Swiggum et al.',
    what: 'The Radcliffe Wave as the gas spine of the Orion Arm',
    where: 'Astronomy & Astrophysics',
    when: '2022',
    url: 'https://www.aanda.org/articles/aa/full_html/2022/08/aa43761-22/aa43761-22.html',
    kind: 'paper'
  },
  'local-bubble': {
    who: 'Zucker, Goodman, Alves et al.',
    what: 'Star formation near the Sun is driven by expansion of the Local Bubble',
    where: 'Nature',
    when: '2022',
    url: 'https://arxiv.org/pdf/2201.05124',
    kind: 'paper'
  },
  'mw-andromeda': {
    who: 'Sawala et al.',
    what: 'No certainty of a Milky Way–Andromeda collision',
    where: 'Nature Astronomy',
    when: 'June 2025',
    url: 'https://www.nature.com/articles/s41550-025-02563-1',
    kind: 'paper'
  },

  /* ── Stars, remnants and clusters ────────────────────────────────── */

  'gaia-bh3': {
    who: 'Panuzzo et al. / Gaia Collaboration',
    what: 'Discovery of a dormant 33 solar-mass black hole in pre-release Gaia astrometry',
    where: 'ESO release eso2408 / Astronomy & Astrophysics',
    when: 'April 2024',
    url: 'https://www.eso.org/public/news/eso2408/',
    kind: 'paper'
  },
  'betelgeuse-companion': {
    who: 'Howell et al.',
    what: 'Gemini North Discovers Long-Predicted Stellar Companion of Betelgeuse',
    where: 'NSF NOIRLab / The Astrophysical Journal Letters',
    when: 'July 2025',
    url: 'https://noirlab.edu/public/news/noirlab2523/',
    kind: 'paper'
  },
  'betelgeuse-jpl': {
    who: 'NASA Jet Propulsion Laboratory',
    what: 'NASA Scientist Finds Predicted Companion Star to Betelgeuse',
    where: 'JPL News',
    when: 'July 2025',
    url: 'https://www.jpl.nasa.gov/news/nasa-scientist-finds-predicted-companion-star-to-betelgeuse/',
    kind: 'release'
  },
  'omega-cen-imbh': {
    who: 'Häberle et al.',
    what: 'Fast-moving stars around an intermediate-mass black hole in ω Centauri',
    where: 'Nature / ESA Hubble heic2409',
    when: 'July 2024',
    url: 'https://esahubble.org/news/heic2409/',
    kind: 'paper'
  },
  'omega-cen-stsci': {
    who: 'Space Telescope Science Institute',
    what: 'Hubble Finds Strong Evidence for Intermediate-Mass Black Hole in Omega Centauri',
    where: 'STScI news 2024-015',
    when: 'July 2024',
    url: 'https://www.stsci.edu/contents/news-releases/2024/news-2024-015',
    kind: 'release'
  },
  'lmc-smbh': {
    who: 'Han, Conroy & Hernquist',
    what: 'Hypervelocity Stars Trace a Supermassive Black Hole in the Large Magellanic Cloud',
    where: 'The Astrophysical Journal 982, 188',
    when: 'March 2025',
    url: 'https://iopscience.iop.org/article/10.3847/1538-4357/adb967',
    kind: 'paper'
  },
  'lmc-smbh-cfa': {
    who: 'Center for Astrophysics | Harvard & Smithsonian',
    what: 'Runaway Stars Reveal Hidden Black Hole in Milky Way’s Nearest Neighbor',
    where: 'CfA news',
    when: 'March 2025',
    url: 'https://www.cfa.harvard.edu/news/runaway-stars-reveal-hidden-black-hole-milky-ways-nearest-neighbor',
    kind: 'release'
  },
  'aquarius-iv': {
    who: 'Vera C. Rubin Observatory / NOIRLab, via EarthSky',
    what: 'First ultra-faint Milky Way satellite galaxy found by Rubin (Aquarius IV)',
    where: 'EarthSky / NOIRLab',
    when: 'August 2026',
    url: 'https://earthsky.org/space/1st-ultra-faint-milky-way-satellite-galaxy-aquarius-iv-rubin/',
    kind: 'release'
  },

  /* ── Exoplanets ──────────────────────────────────────────────────── */

  'trappist-1e-dreams': {
    who: 'Glidden et al. / JWST-TST DREAMS',
    what: 'NIRSpec/PRISM Transmission Spectroscopy of the Habitable Zone Planet TRAPPIST-1 e',
    where: 'The Astrophysical Journal Letters',
    when: 'September 2025',
    url: 'https://arxiv.org/pdf/2509.05414',
    kind: 'paper'
  },
  'trappist-1e-secondary': {
    who: 'Glidden et al. / JWST-TST DREAMS',
    what: 'Secondary Atmosphere Constraints for the Habitable Zone Planet TRAPPIST-1 e',
    where: 'The Astrophysical Journal Letters',
    when: 'September 2025',
    url: 'https://arxiv.org/pdf/2509.05407',
    kind: 'paper'
  },
  'alpha-cen-a': {
    who: 'Beichman, Sanghi et al.',
    what: 'Worlds Next Door: A Candidate Giant Planet Imaged in the Habitable Zone of α Cen A',
    where: 'The Astrophysical Journal Letters',
    when: 'August 2025',
    url: 'https://astrobiology.com/2025/08/07/worlds-next-door-a-candidate-giant-planet-imaged-in-the-habitable-zone-of-%ce%b1-cen-a-i-observations-orbital-and-physical-properties-and-exozodi-upper-limits/',
    kind: 'paper'
  },
  'alpha-cen-sciam': {
    who: 'Scientific American',
    what: 'JWST Spots Possible Alien Planet at Alpha Centauri',
    where: 'Scientific American',
    when: 'August 2025',
    url: 'https://www.scientificamerican.com/article/jwst-spots-possible-alien-planet-at-alpha-centauri/',
    kind: 'release'
  },
  'barnard-4': {
    who: 'Basant, Bean et al. (MAROON-X + ESPRESSO)',
    what: 'Four sub-Earth planets orbiting Barnard’s Star',
    where: 'The Astrophysical Journal Letters / AAS Nova',
    when: 'March 2025',
    url: 'https://aasnova.org/2025/03/11/confirmed-at-last-barnards-star-hosts-four-tiny-planets/',
    kind: 'paper'
  },
  'exo-6000': {
    who: 'NASA Exoplanet Archive / NASA',
    what: 'NASA’s Tally of Planets Outside Our Solar System Reaches 6,000',
    where: 'NASA',
    when: 'September 2025',
    url: 'https://www.nasa.gov/universe/exoplanets/nasas-tally-of-planets-outside-our-solar-system-reaches-6000/',
    kind: 'archive'
  },

  /* ── The Solar System ────────────────────────────────────────────── */

  'ammonite': {
    who: 'Chen, Huang et al. / FOSSIL survey',
    what: 'Discovery and dynamics of a Sedna-like object with a perihelion of 66 au',
    where: 'Nature Astronomy',
    when: 'July 2025',
    url: 'https://www.nature.com/articles/s41550-025-02595-7',
    kind: 'paper'
  },
  'ammonite-subaru': {
    who: 'Subaru Telescope / NAOJ',
    what: 'Subaru Telescope Discovers "Fossil" of the Early Solar System',
    where: 'Subaru Telescope',
    when: 'July 2025',
    url: 'https://subarutelescope.org/en/results/2025/07/14/3574.html',
    kind: 'release'
  },
  'atlas-3i-hst': {
    who: 'Jewitt et al.',
    what: 'Hubble Space Telescope Observations of the Interstellar Interloper 3I/ATLAS',
    where: 'arXiv',
    when: 'August 2025',
    url: 'https://arxiv.org/pdf/2508.02934',
    kind: 'preprint'
  },
  'atlas-3i-pre': {
    who: 'Multiple teams',
    what: 'Pre-perihelion Development of Interstellar Comet 3I/ATLAS',
    where: 'arXiv',
    when: 'October 2025',
    url: 'https://arxiv.org/pdf/2510.18769',
    kind: 'preprint'
  },
  'atlas-3i-old': {
    who: 'Multiple teams',
    what: 'Prediscovery Activity of New Interstellar Object 3I/ATLAS: A Dynamically-Old Comet?',
    where: 'arXiv',
    when: 'September 2025',
    url: 'https://arxiv.org/pdf/2509.08792',
    kind: 'preprint'
  },
  'yr4-cleared': {
    who: 'Sky & Telescope, reporting JWST astrometry',
    what: 'Lunar Impact from Asteroid 2024 YR4 Ruled Out',
    where: 'Sky & Telescope',
    when: 'March 2026',
    url: 'https://skyandtelescope.org/astronomy-news/lunar-impact-from-asteroid-2024-yr4-ruled-out/',
    kind: 'release'
  },
  'yr4-nasa': {
    who: 'NASA Planetary Defense',
    what: 'Latest Calculations Conclude Asteroid 2024 YR4 Poses No Significant Threat to Earth in 2032 and Beyond',
    where: 'NASA Planetary Defense blog',
    when: 'February 2025',
    url: 'https://science.nasa.gov/blogs/planetary-defense/2025/02/24/latest-calculations-conclude-asteroid-2024-yr4-now-poses-no-significant-threat-to-earth-in-2032-and-beyond',
    kind: 'release'
  },
  'xv93-atmos': {
    who: 'Sicardy et al.',
    what: 'The first detection of an atmosphere on a trans-Neptunian object beyond Pluto',
    where: 'Nature Astronomy',
    when: 'May 2026',
    url: 'https://www.nature.com/articles/s41550-026-02846-1',
    kind: 'paper'
  },
  'xv93-pre': {
    who: 'Sicardy et al.',
    what: 'The first detection of an atmosphere on a trans-Neptunian object beyond Pluto (preprint)',
    where: 'arXiv 2605.02243',
    when: 'May 2026',
    url: 'https://arxiv.org/abs/2605.02243',
    kind: 'preprint'
  },
  'bennu-pnas': {
    who: 'Glavin, Dworkin et al.',
    what: 'Prebiotic organic compounds in samples of asteroid Bennu indicate heterogeneous aqueous alteration',
    where: 'PNAS',
    when: '2025',
    url: 'https://www.pnas.org/doi/10.1073/pnas.2512461122',
    kind: 'paper'
  },
  'bennu-ammonia': {
    who: 'Glavin et al.',
    what: 'Abundant ammonia and nitrogen-rich soluble organic matter in samples from asteroid (101955) Bennu',
    where: 'Nature Astronomy',
    when: 'January 2025',
    url: 'https://www.nature.com/articles/s41550-024-02472-9',
    kind: 'paper'
  },
  'p9-akari': {
    who: 'Phan, Lee et al.',
    what: 'A search for Planet Nine with IRAS and AKARI data',
    where: 'Publications of the Astronomical Society of Australia',
    when: '2025',
    url: 'https://www.cambridge.org/core/journals/publications-of-the-astronomical-society-of-australia/article/search-for-planet-nine-with-iras-and-akari-data/4AC94D8DED041495F85F518C286D5284',
    kind: 'paper'
  },
  'p9-akari-pre': {
    who: 'Phan, Lee et al.',
    what: 'A Search for Planet Nine with IRAS and AKARI Data (preprint)',
    where: 'arXiv 2504.17288',
    when: 'April 2025',
    url: 'https://arxiv.org/abs/2504.17288',
    kind: 'preprint'
  },
  'uranus-moon': {
    who: 'ESA / Webb',
    what: 'New moon of Uranus (S/2025 U1)',
    where: 'ESA/Webb image release',
    when: 'August 2025',
    url: 'https://esawebb.org/images/uranus-moon-S2025U1/',
    kind: 'release'
  },
  'saturn-moons': {
    who: 'Ashton, Gladman et al. / CFHT',
    what: '128 new irregular moons of Saturn recognised by the IAU Minor Planet Center',
    where: 'University of Iowa Physics & Astronomy news',
    when: 'March 2025',
    url: 'https://physics.uiowa.edu/news/2025/03/janyes-comments-discovery-new-saturn-moons',
    kind: 'release'
  },
  'voyager-shutdown': {
    who: 'NASA',
    what: 'NASA Shuts Off Instrument on Voyager 1 to Keep Spacecraft Operating',
    where: 'NASA Voyager blog',
    when: 'April 2026',
    url: 'https://science.nasa.gov/blogs/voyager/2026/04/17/nasa-shuts-off-instrument-on-voyager-1-to-keep-spacecraft-operating/',
    kind: 'release'
  },
  'voyager-jpl': {
    who: 'NASA Jet Propulsion Laboratory',
    what: 'NASA Turns Off Two Voyager Science Instruments to Extend Mission',
    where: 'JPL News',
    when: '2025',
    url: 'https://www.jpl.nasa.gov/news/nasa-turns-off-two-voyager-science-instruments-to-extend-mission/',
    kind: 'release'
  },

  /* ── Surveys and catalogues ──────────────────────────────────────── */

  'rubin-lsst': {
    who: 'NSF–DOE Vera C. Rubin Observatory',
    what: 'Rubin Begins the Legacy Survey of Space and Time',
    where: 'Rubin Observatory',
    when: 'June 2026',
    url: 'https://rubinobservatory.org/news/action-rubin-lsst-begins',
    kind: 'release'
  },
  'rubin-alerts': {
    who: 'NSF–DOE Vera C. Rubin Observatory',
    what: 'Rubin Launches Real-Time Discovery Machine for Monitoring the Night Sky',
    where: 'Rubin Observatory',
    when: '2026',
    url: 'https://rubinobservatory.org/news/first-alerts',
    kind: 'release'
  },
  'jpl-elements': {
    who: 'E. M. Standish / NASA JPL Solar System Dynamics',
    what: 'Keplerian Elements for Approximate Positions of the Major Planets',
    where: 'JPL SSD',
    when: 'epoch J2000, valid 1800–2050',
    url: 'https://ssd.jpl.nasa.gov/planets/approx_pos.html',
    kind: 'archive'
  },
  'jpl-sbdb': {
    who: 'NASA JPL Solar System Dynamics',
    what: 'Small-Body Database (orbital element solutions for comets, asteroids and TNOs)',
    where: 'JPL SSD/CNEOS',
    when: 'continuously updated',
    url: 'https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html',
    kind: 'archive'
  },
  'mpc': {
    who: 'International Astronomical Union',
    what: 'Minor Planet Center — designations, orbits and natural satellite listings',
    where: 'IAU MPC',
    when: 'continuously updated',
    url: 'https://www.minorplanetcenter.net/',
    kind: 'archive'
  }
};

if (typeof module !== 'undefined') { module.exports = SOURCES; }
