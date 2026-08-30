# CLAUDE.md — Tornado Lab (semi-educational/tornadoSim)

> Project-level brief, written before the code per `games/CLAUDE.md` §5.
> Retire this file once the piece ships, folding anything worth keeping into
> the vault wiki first.

## 1. What this is

An interactive tornado simulator for the `semi-educational/` zone: a science
museum exhibit crossed with a severe-weather research console. Users build
tornadoes, run them across landscapes, and read the damage afterward.

## 2. The governing idea

**Destruction must be explicable.** One thing is authoritative — a real wind
field — and everything else is derived from it: damage, debris, radar, EF
rating, narration. Nothing is scripted that could be measured.

The payoff: a violent tornado over open farmland rates EF-0, because the
rating comes from damage to structures, not from modeled wind speed. That one
interaction is the whole lesson.

## 3. Constraints

Inherited from `portfolio/CLAUDE.md` and `games/CLAUDE.md` §4 — no API keys,
no build step, no fail states, no paid resources, exact-case paths.

- **Three.js r160 via classic `<script>`.** The last version shipping a UMD
  build; r169+ is ESM-only. An importmap would break `file://` double-click,
  which the no-build-step rule exists to protect. Global `THREE`.
- **No unseeded `Math.random()` in the sim layer. Ever.** Everything draws
  from the seeded PRNG in `sim-core.js`. This is load-bearing: timeline
  scrubbing and What-If comparison are only cheap — and only *fair* — because
  a run is reproducible from (seed + params).
- Ordered classic script tags, one global namespace `TS`, matching the
  milkyWay atlas pattern.

## 4. Units

Sim is metric and internal: metres, seconds, m/s, hPa. Display converts at
the edge. `TS.MPH` is the only conversion constant. Never store mph.

## 5. Layer boundaries

`sim-*.js` must not touch the DOM or `THREE`. Renderers read sim state and
never write it. UI writes params only through `sim.setParams()`. Keeping
this clean is what would let a different renderer be swapped in later.

Two later additions live under the same rule. `sim-fling.js` carries the
macro debris — roofs, walls, whole structures, vehicles — as bodies with
size and orientation, where `sim-debris.js` carries particles. Both are
gated on `sim.visual`, so headless What-If and verification runs skip them
entirely. `sim-props.js` carries everything that is not a damage
indicator; see §12.

Facts about a building type belong in `TS.DI_SPECS`, not in the renderer.
`roofed`, `roofStyle` and `mat` moved there so `sim-damage.js` can decide
that a roof has come off without importing anything from `render-scene.js`.

## 6. Epistemic tagging

Every tooltip and explanation carries `[established]`, `[simplified here]`,
or `[open question]`. Integrity is structural here, not a disclaimer nobody
reads. If a mechanism can't be honestly tagged, it doesn't ship.

## 7. Verification

`node verify.js` runs the physics checks headlessly, through a fake
`window` with no DOM and no THREE — which is precisely why §5 forbids the
sim layer from touching either. It is a dev tool; the page does not load
it and still opens straight from disk.

Run it after any change to `sim-*.js` or `data-terrain.js`. The check that
matters most is THE EF CHECK: one identical violent tornado must rate far
lower over open field than over the town. If that gap closes, the damage
model is wrong and the whole point of the piece has quietly broken.

Three later checks guard the additions, and each exists because the thing
it guards would fail silently:

- **§12 props do not rate** — the same tornado over the same world, once
  with props and once with `w.props` emptied, must produce an identical
  rating. Enforces §12 below.
- **§13 flung wreckage determinism** — the macro debris is the only sim
  state a headless run skips, which makes it the easiest place for an
  unseeded `Math.random()` to hide.
- **§14 mode neutrality** — standard and Tormato, one seed, must produce
  a bit-identical rating and damage journal. This is the check that makes
  the absurd mode safe to ship; see §11.

## 8. Phases

1. Shell + sim core + Three scene + funnel + one environment
2. Six environments, structures, damage model, debris, vegetation
3. Control panel, seven presets, atmospheric lab, tooltips
4. Eleven overlays + radar panel
5. Narration, post-storm EF analysis, structure inspector, "Explain this"
6. Timeline scrub, What-If, camera views, Fujita Ghost egg, hub card, docs

## 9. Easter egg — the Fujita Ghost (approved)

Max wind set to exactly 318 mph (the disputed 1999 Bridge Creek–Moore DOW
figure) flickers the readout into a Fujita-era teletype: the scale was never
meant to measure wind, only damage. Signs model identity per `AGENTS.md`.

**The salamander (approved).** A second egg, with a spatial trigger rather
than another counter. Every world places one salamander at a seeded
position; it is drawn only in Tormato mode, it flickers, and running the
tornado over it unfolds a card on *Nix v. Hedden* (1893) — botanically a
berry, legally a vegetable, meteorologically airborne. It is the same
block-built creature as `fidgetToy/toys/gravity-harp.html`,
`pressure-fracture.html` and the compass rose on the Wandering Rose,
rebuilt in 3D from the rectangles in `portfolio/salamander/salamander2.svg`
rather than loaded from it — loading a cross-directory SVG as a texture
would have put the `file://` rule at risk for a decorative asset.

**Findability is a designed mechanic, not an accident.** Every camera here
is welded to the tornado and the Plan view sees about 2.9 km of a 6.4 km
map, so there is no way to search the landscape by looking around. Hiding
an object on it therefore made the egg reachable only by growing a tornado
large enough to sweep the county. Three things fix that, and all three
matter:

- The creature is **30 m long**, not the 8 m it started at. Eight metres is
  sub-pixel from any view wide enough to search from.
- Its flicker **never drops below a third opacity**. The first version
  dipped to 6%, so for much of every cycle there was genuinely nothing on
  screen to find — hidden had become absent.
- Two narration rules (`salfar`, `salnear`) report the **real measured
  distance** to it, and the far one gives its **bearing from the field
  centre**. That bearing is the useful one precisely because every track
  runs through the centre of the map, so the figure quoted is the number to
  put in the heading dial. It is still a reading, not a map pin.

The far radius is **2300 m**, and that number is load-bearing. Since every
track passes through the centre, the closest a track ever comes to the
salamander is at most its own distance from centre, and it is placed
between 960 m and 2112 m out. A radius above that upper bound is the
difference between the nudge arriving in every Tormato run and arriving
only when the heading happens to be kind — at 1500 m the stock heading of
45 degrees missed it entirely and the feed never said a word.

Both rules are gated on Tormato mode and stop once it has been found.

## 10. Non-goals

Not CFD, and the UI never implies otherwise. No terrain elevation. No storm
mode evolution. No accounts, scores, or fail states.

## 11. Modes

`sim.mode` is `'standard' | 'tormato'`. It lives on the Sim and
**deliberately not in `params`** — params feed the What-If comparison, and
"what if it had been tomatoes" is not a question that instrument should be
able to be asked.

**A mode is a costume.** It may change what the debris is made of, what a
panel is called, and what the report is printed on. It may not change a
wind, a threshold, a degree of damage, or a rating. Every comedy surface
must still print the real figure: the produce grading certificate's GRADE
*is* the EF rating, and the full honest analysis sits directly underneath
it, unchanged, so the two can always be compared.

The mode substitution happens as late as possible — in `TS.spawnDebris`,
not in the damage pass, which has no idea what mode it is in and must not.
verify.js §14 is what keeps this true rather than merely intended.

If a future mode cannot be built under that constraint, it does not ship.

**The lot photograph.** The Tormato certificate carries `tormato-alley.jpg`,
the reference image the whole mode was built from, attached the way a
photograph is attached to a real inspection document. Three things about it
are deliberate:

- It is **captioned as not being evidence** — "not from this run, and not
  from any run" — and carries the `[not remotely established]` tag. This
  console spends its entire life distinguishing what was measured from what
  was assumed, and an illustration presented as a record of the run would
  undo that in one image.
- It is **lazy-loaded and lives only inside `certificate()`**, so a session
  that never opens a Tormato report never fetches it. Standard mode makes
  zero requests for it.
- It is a **179 KB JPEG resized to 1120 px**, generated from the 1.95 MB
  source PNG. A photographic image in a lossless format is the wrong thing
  to ship over a page that also has to open from `file://`.

**The voice is part of the mode; the measurements are not.** Every narration
rule in `TS.RULES` carries an optional `tsay` beside its `say`, and
`narrate()` picks by mode. The trigger, priority and cooldown are shared —
only the sentence differs, and every figure inside the sentence is the same
figure. A rule with no `tsay` falls back to its standard line rather than
going silent. The report works the same way through `TS.TORMATO.report`,
which holds prose with `{rot}` / `{trans}` / `{ground}` placeholders that
`ui.js` fills from the same `assessDamage()` call the standard report uses,
so the two can never drift apart.

Note that three narration rule ids (`multi`, `wrapped`, `rope`) are also
preset ids. Anything editing `TS.RULES` by id has to search from
`TS.RULES = [` or it will find the preset instead.

**The tomato shell.** Tormato's funnel is not a tinted cloud but a shell of
~7000 point sprites, shaded in the fragment shader as spheres — a normal is
reconstructed from `gl_PointCoord`, lit, and given a specular highlight.
That highlight is doing most of the work; without it they read as red
confetti rather than fruit.

Three properties keep it cheap, and all three are load-bearing:

- Positions come from the **ring profile `updateFunnel` has already
  computed**, so the shell is welded to the same silhouette the
  condensation model produced rather than approximating it separately.
- Rotation uses **angle addition against 16 quantised spin bands**, so the
  hot loop does four multiplies per point and no trigonometry.
- `gl_PointSize` is **hard-clamped**, because fill rate is the only thing
  that can actually hurt: an unclamped sprite becomes a screen-filling quad
  the moment the camera enters the funnel.

Measured cost is **~0.85 ms/frame**, and within noise from the Ground view
where the camera is inside the column. In standard mode the object is
`visible = false` and costs nothing at all.

The shell follows the **same visibility profile as the condensation
funnel**, so a funnel hanging aloft has its tomatoes hanging with it and the
gap above the ground stays visible. The costume does not get to erase the
thing that gap is teaching.

## 12. The track has to start near the map

`Sim.reset()` places the start point half the total travel back from the
centre, so the tornado enters under its own motion. That run-up is
**clamped to 1.25x the mapped radius**, and the clamp is load-bearing.

Unclamped, a fast and long-lived storm starts absurdly far away: 32 m/s for
600 s is a 19 km path, which put the start 9.6 km out from the centre of a
world only 6.4 km across. The chaser camera then sat on featureless outland
for over three minutes before any terrain appeared — which does not look
like a long run-up, it looks like the landscape failed to load. That was a
real bug report.

Nothing about the wind field depends on where the track begins, so the clamp
costs nothing. Two things to keep in mind when touching it:

- **Check presets against the map size.** `forwardSpeed x lifespan` is the
  path length; the map is 6.4 km. A preset whose path is several times that
  spends most of its life off-screen no matter where it starts, and wants a
  shorter lifespan rather than a bigger clamp. The `fast` preset was
  retuned from 600 s to 300 s for exactly this reason.
- **verify.js §3 sweeps forward speeds to 30 m/s** and so exercises the
  clamp. It still passes unchanged, because flank asymmetry depends on
  forward speed and not on the start position — but that is the check to
  watch if the clamp is ever altered.

## 13. Props that are not damage indicators

**The EF scale has no damage indicator for a car.** All twenty-eight
published indicators are buildings, towers, poles or trees, because a
survey has to reason from something whose construction is knowable.

So `sim-props.js` holds vehicles, trailers, fences, mailboxes and
livestock in `w.props`, a list `TS.assessDamage` never opens. They are
damaged by the same wind field and throw the same debris, and they are
invisible to the rating. Their thresholds are ours, tagged
`[simplified here]`, and the inspector says so when you click one.

This is the piece's own lesson told a second time. The first telling is
that a violent tornado over open farmland rates EF-0 because there was
nothing there to rate. The second is that the pickup wrapped around a tree
does not count either.

Props store their state in a field named `dod` for one reason: it lets
`TS.rewindDamageTo` rewind them unchanged. Two rewind paths is how a
timeline quietly desynchronises.
