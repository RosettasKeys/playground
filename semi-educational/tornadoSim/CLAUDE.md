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

## 10. Non-goals

Not CFD, and the UI never implies otherwise. No terrain elevation. No storm
mode evolution. No accounts, scores, or fail states.
