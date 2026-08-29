/* ═══════════════════════════════════════════════════════════════════════
   data-missions.js — the mission program
   ───────────────────────────────────────────────────────────────────────
   Three ordered missions through points of interest that already exist in
   data-galaxy.js, data-solar.js and data-trappist1.js.

   Per objective:
     scene     which map it lives on — 'galaxy' | 'solar' | 'trappist1'
     id        the point of interest's own id in its data file
     brief     describes the object without naming it
     logged    read once it has been correctly opened
     noSignal  (optional) this objective has no marker to home in on, so
               the signal readout stands down and shows this text instead

   Every briefing is written from its target entry's own desc/facts/fresh
   text. Nothing here asserts a number, a date or a claim the entry does
   not already carry and cite — where a riddle wanted a fact the entry
   lacked, the riddle was rewritten rather than the atlas.

   missions.js is the only file that reads this one.
   ═══════════════════════════════════════════════════════════════════════ */

const MISSIONS = [

  /* ════ 01 ═══════════════════════════════════════════════════════════
     Big, bright, findable. Two in the galaxy to learn the drag and the
     zoom, then down into the Solar System and stay there.
  ═════════════════════════════════════════════════════════════════════ */
  {
    id: 'first-light', n: 1,
    title: 'First Light',
    level: 'short',
    blurb: 'Five things you can find on a first pass. Start here.',
    objectives: [
      {
        scene: 'galaxy', id: 'orion-nebula',
        brief: 'Somewhere near enough to see with your own eyes, stars are being built right now. Find the nursery — the closest place in the Galaxy where big stars are still being made.',
        logged: 'Logged — the nearest place stars are still being born.'
      },
      {
        scene: 'galaxy', id: 'pleiades',
        brief: 'Almost every culture that kept records of the night wrote this one down. Find the little knot of blue stars that everybody noticed.',
        logged: 'Logged — and the blue haze around it is dust the cluster is only passing through.'
      },
      {
        scene: 'solar', id: 'mars',
        brief: 'Head down into the Solar System. Find the planet that had rivers and lakes, lost its air, and froze — with the record of all of it still sitting on the surface.',
        logged: 'Logged — that unweathered record is why so much hardware keeps getting sent there.'
      },
      {
        scene: 'solar', id: 'saturn',
        brief: 'Find the planet less dense than water, wearing something it has not always had and will not always have.',
        logged: 'Logged — the rings are temporary. We happen to be here while they last.'
      },
      {
        scene: 'solar', id: 'voyager-1',
        brief: 'Something left here in 1977 and never came back. Find the most distant object humans have ever made — it is still switched on, and still talking.',
        logged: 'Logged — end of the mission. Out past everything else on this map, and still reporting.'
      }
    ]
  },

  /* ════ 02 ═══════════════════════════════════════════════════════════
     The original nine-objective path, carried across intact.
  ═════════════════════════════════════════════════════════════════════ */
  {
    id: 'long-field', n: 2,
    title: 'The Long Field',
    level: 'full',
    blurb: 'Nine objectives, from the centre of the Galaxy to a planet forty light-years out.',
    objectives: [
      {
        scene: 'galaxy', id: 'sgr-a-star',
        brief: 'Everything on this map — including you — is falling around one point. Find the thing every orbit here eventually answers to.',
        logged: 'Logged — the anchor the whole Galaxy is falling toward.'
      },
      {
        scene: 'galaxy', id: 'crab-nebula',
        brief: 'A star ended here, and left a lighthouse behind: a dead core no bigger than a city, spinning fast enough to sweep a beam past us thirty times a second.',
        logged: 'Logged — a star’s afterlife, still running like clockwork.'
      },
      {
        scene: 'galaxy', id: 'betelgeuse',
        brief: 'One of the brightest stars in the sky is old enough, and close enough, that astronomers keep half an eye on it for the day it ends.',
        logged: 'Logged — keep watching. It won’t look like this forever.'
      },
      {
        scene: 'solar', id: 'jupiter',
        brief: 'Back into the Solar System. Find the planet that outweighs everything else that isn’t the Sun put together — and the storm on it that’s older than any living person.',
        logged: 'Logged — the Solar System’s real centre of gravity, more or less.'
      },
      {
        scene: 'solar', id: 'saturn',
        brief: 'Find the rings that aren’t solid at all — trillions of separate pieces of ice, none of them touching the ones beside it, all moving together anyway.',
        logged: 'Logged — get in close and watch them actually move.'
      },
      {
        scene: 'solar', id: 'haumea',
        brief: 'Find the dwarf planet spinning so fast it stopped being round — stretched out closer to a football, with a family of icy fragments trailing behind it.',
        logged: 'Logged — not every world gets to keep its shape.'
      },
      {
        scene: 'solar', id: 'atlas-3i',
        brief: 'Find the one that isn’t from here. It arrived from outside the Solar System entirely, on a path so extreme it will never come back.',
        logged: 'Logged — say goodbye. It’s not coming back.'
      },
      {
        scene: 'galaxy', id: 'trappist-1',
        brief: 'Back out to the galaxy. Find the small, dim star barely bigger than a giant planet — then count how many worlds are crowded around it.',
        logged: 'Logged — go on, get closer.'
      },
      {
        scene: 'trappist1', id: 'trappist1-e',
        brief: 'Of the seven, this is the one every atmosphere hunt in this system has been built around — closest to Earth in size, closest to the right amount of light.',
        logged: 'Logged — end of the mission. Seven small worlds, and one very patient search for air.'
      }
    ]
  },

  /* ════ 03 ═══════════════════════════════════════════════════════════
     Every objective here carries a gold ring: something a textbook still
     gets wrong. Ends on the map itself.
  ═════════════════════════════════════════════════════════════════════ */
  {
    id: 'what-changed', n: 3,
    title: 'What Changed',
    level: 'hard',
    blurb: 'Eight things we were wrong about recently. Every objective wears a gold ring.',
    objectives: [
      {
        scene: 'galaxy', id: 'gaia-bh3',
        brief: 'Find the black hole nobody could see — no light, no glow, nothing to point a telescope at. It was caught only because the star going around it wobbles, and it turned out far heavier than the models allow.',
        logged: 'Logged — thirty-three solar masses, found by watching something else move.'
      },
      {
        scene: 'galaxy', id: 'radcliffe-wave',
        brief: 'Several star nurseries near us were catalogued separately for a century. Find the thing they all turned out to be pieces of — one enormous filament, and it is moving.',
        logged: 'Logged — not a curiosity in the arm. The spine the arm is made of.'
      },
      {
        scene: 'galaxy', id: 'barnards-star',
        brief: 'Find the star that crosses our sky faster than any other — the one where planets were announced, retracted as a fault in the telescope, and then, much later, found for real.',
        logged: 'Logged — four planets, all smaller than Earth, at the star that fooled everyone.'
      },
      {
        scene: 'solar', id: 'yr4',
        brief: 'Down into the Solar System. Find the building-sized rock that briefly held the highest impact odds ever recorded for its size — first for Earth, then for the Moon — and is now cleared of both.',
        logged: 'Logged — the right answer to a rising impact probability is more measurements, not alarm.'
      },
      {
        scene: 'solar', id: 'ammonite',
        brief: 'Find the fossil: only the fourth object ever found on an orbit like this, and it has held that orbit for about as long as the Sun has existed.',
        logged: 'Logged — and it points the wrong way, which is the interesting part.'
      },
      {
        scene: 'solar', id: 'planet-nine',
        brief: 'Find the planet that has never been seen. It is drawn on this map as a hypothesis — and the evidence for it has lately been moving in both directions at once.',
        logged: 'Logged — an orbit sketched for something nobody has recovered yet.'
      },
      {
        scene: 'trappist1', id: 'trappist1-b',
        brief: 'Out to TRAPPIST-1, and all the way in. Find the innermost of the seven — the first Earth-sized planet anywhere whose dayside temperature was measured rather than inferred.',
        logged: 'Logged — the measurement fit a bare, sunlit rock. That was the answer, and it wasn’t the hoped-for one.'
      },
      {
        scene: 'galaxy', id: 'milky-way',
        brief: 'Back out to the galaxy one last time. The final objective has no marker, because it is the map itself: its collision with Andromeda was a certainty in every textbook, and is now closer to a coin flip. Open the entry for the whole scene.',
        logged: 'Logged — end of the mission. Even the thing you are standing inside got revised.',
        noSignal: 'No marker — it is the galaxy itself. Open it from the title, top left.'
      }
    ]
  }
];

if (typeof module !== 'undefined') { module.exports = MISSIONS; }
