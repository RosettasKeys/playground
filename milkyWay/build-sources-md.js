/* ═══════════════════════════════════════════════════════════════════════
   build-sources-md.js — regenerate SOURCES.md from the data files
   ───────────────────────────────────────────────────────────────────────
   Not part of the page and not a build step: the atlas opens straight from
   disk with no tooling. This exists only so the markdown sources list
   cannot drift away from what the running page actually cites.

     cd milkyWay && node build-sources-md.js

   Run it after editing sources.js, data-galaxy.js or data-solar.js.
   ═══════════════════════════════════════════════════════════════════════ */

const SOURCES = require('./sources.js');
const GAL = require('./data-galaxy.js');
const { SOLAR_POI } = require('./data-solar.js');

const L = [];
const w = s => L.push(s);

w('# Sources — *The Long Field*');
w('');
w('> Generated from `sources.js`, `data-galaxy.js` and `data-solar.js`. Regenerate rather');
w('> than hand-edit: the atlas cites these keys directly, so this file and the running');
w('> page cannot disagree.');
w('');
w('Every claim the atlas makes traces to something here. Where a finding is recent enough');
w('to still be under argument, the entry says so and points at the paper rather than at a');
w('summary of it. Where a number could not be sourced, the field was left out of the data');
w('rather than filled in from memory.');
w('');
w('**Coverage:** ' + Object.keys(SOURCES).length + ' sources · ' + GAL.length + ' galactic points of interest · ' +
  SOLAR_POI.length + ' Solar System points of interest.');
w('');

// ── Method
w('## How to check a claim');
w('');
w('1. Find the object in the atlas and open its panel.');
w('2. Read the **Sources for this entry** list at the foot of the panel — those are the');
w('   specific references behind that entry\'s numbers and its *Recently* block.');
w('3. Cross-check against the tables below, which give the same references grouped by kind.');
w('');
w('Peer-reviewed papers are preferred throughout. Institutional releases (ESO, NASA, NOIRLab,');
w('STScI, Rubin, Subaru) are used where an observatory is the best summary of its own result,');
w('and are labelled `release` so they can be weighed accordingly. Catalogue and archive entries');
w('are labelled `archive` and are the provenance for orbital elements and designations, not for');
w('interpretation.');
w('');

// ── Recent findings index — the heart of the ask
w('## Recent findings, and what each one changes');
w('');
w('These are the entries carrying a *Recently* block — findings from roughly the last two');
w('years. Several of them contradict something a current textbook still says.');
w('');
w('| Finding | Year | Source(s) |');
w('| --- | --- | --- |');
const fresh = [...GAL, ...SOLAR_POI].filter(p => p.fresh);
fresh.sort((a, b) => String(a.fresh.year).localeCompare(String(b.fresh.year)) || a.name.localeCompare(b.name));
for (const p of fresh) {
  const links = (p.cites || []).map(id => {
    const s = SOURCES[id];
    return s ? `[${s.where}](${s.url})` : id;
  }).join('<br>');
  w(`| **${p.name}** — ${p.type} | ${p.fresh.year} | ${links} |`);
}
w('');
w(`_${fresh.length} of ${GAL.length + SOLAR_POI.length} entries carry a recent finding._`);
w('');

// ── Full bibliography by kind
const groups = {
  paper: 'Peer-reviewed papers',
  preprint: 'Preprints and author manuscripts',
  release: 'Observatory and agency releases',
  archive: 'Catalogues and archives'
};
w('## Full bibliography');
w('');
for (const [kind, title] of Object.entries(groups)) {
  const ids = Object.keys(SOURCES).filter(id => SOURCES[id].kind === kind)
    .sort((a, b) => SOURCES[a].what.localeCompare(SOURCES[b].what));
  if (!ids.length) continue;
  w(`### ${title} (${ids.length})`);
  w('');
  for (const id of ids) {
    const s = SOURCES[id];
    // Which entries lean on this source?
    const users = [...GAL, ...SOLAR_POI].filter(p => (p.cites || []).includes(id)).map(p => p.name);
    w(`- **[${s.what}](${s.url})**  `);
    w(`  ${s.who} · *${s.where}* · ${s.when}  `);
    w(`  <sub>cited by: ${users.length ? users.join(', ') : '—'}</sub>`);
  }
  w('');
}

// ── Positional method
w('## Where the positions come from');
w('');
w('**Galactic scale.** Markers are projected from catalogue galactic longitude, latitude and');
w('heliocentric distance at draw time:');
w('');
w('```');
w('x = -d · cos(b) · sin(l)');
w('y = -26,700 + d · cos(b) · cos(l)        (light-years; Sun → Galactic Centre = 26,700 ly)');
w('```');
w('');
w('The painted spiral behind the markers is **procedural** — a seeded model of four');
w('logarithmic arms, wound so the Sun falls in the gap between the Sagittarius–Carina arm');
w('and the Perseus arm, which is where it actually sits. It is an illustration of structure,');
w('not an image, and no marker is ever placed against it by eye.');
w('');
const approx = GAL.filter(p => p.lbApprox).map(p => p.name);
w('Entries whose longitude/latitude is indicative rather than a measurement — the atlas says');
w('so in the panel, and these should not be quoted as coordinates:');
w('');
w(approx.map(n => `- ${n}`).join('\n'));
w('');
w('**Solar System.** The eight major planets use JPL\'s Keplerian elements for approximate');
w('positions (epoch J2000, rates per Julian century, valid 1800–2050), solved through Kepler\'s');
w('equation each frame. Verified against known values: Earth\'s perihelion distance computes to');
w('0.98331 au and its aphelion to 1.01670 au, and the Sun\'s apparent ecliptic longitude to');
w('within a fraction of a degree.');
w('');
const oapprox = SOLAR_POI.filter(p => p.orbitApprox || p.posApprox).map(p => p.name);
w('Bodies whose **orbit shape** comes from published elements but whose **phase along that');
w('orbit** is approximate — the atlas is not an ephemeris, and says so in each panel:');
w('');
w(oapprox.map(n => `- ${n}`).join('\n'));
w('');
w('3I/ATLAS is propagated on its published hyperbolic solution (e = 6.1414, q = 1.3574 au,');
w('i = 175.12°, Ω = 322.17°, ω = 128.02°, perihelion 29 October 2025).');
w('');
w('**Radial compression.** In the Solar System view, screen radius defaults to the real');
w('distance raised to the power 0.34, so Mercury at 0.39 au and the Oort Cloud at 100,000 au');
w('can share one screen. The scale control switches this off. Body diameters are compressed');
w('logarithmically and are never to scale against the orbits.');
w('');
w('---');
w('');
w('_Compiled August 2026. Astronomy moves: a claim in this atlas is only ever as current as');
w('the source under it._');

require('fs').writeFileSync('SOURCES.md', L.join('\n') + '\n');
console.log('SOURCES.md written');
