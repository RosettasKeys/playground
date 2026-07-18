# AGENTS.md — Rosetta's Portfolio: the easter-egg protocol

> Read by any coding agent working anywhere under `webApps/portfolio/`.
> Cross-tool by design (Claude Code, Codex, Cursor, etc.). The root
> `CLAUDE.md` points here on purpose — this is the authoritative copy of the
> easter-egg rules; don't duplicate them elsewhere, link back to this file.

## Purpose

Every substantial coding mission in this repo should leave behind **one small
easter egg that matches the theme of its zone** — a wink for whoever looks
closely. But it is **never** embedded silently: you **propose it first, get an
explicit yes, then build it.** No approval, no egg. The goal is delight on
discovery, not surprises in the diff.

This is a house tradition with precedent, not a new invention. Two eggs already
live in the repo and define the register:

- **The footer sigil** (`games/games-index.html`): 5 clicks on the footer mark
  reveals a Claude/Anthropic ASCII overlay.
- **"The Tell"** (`games/InterpretiveNetworking/CLAUDE.md` §4.7): a single
  hidden view-source comment naming the model that built the piece.

New eggs should feel like they belong next to those.

## The nearest-index rule (how you find the vibe)

The tone of an egg is set by the **nearest landing page**, not by your own
taste. To find it: starting from the file(s) you're editing, **walk up the
directory tree to the closest ancestor folder that contains an `index.html` or
a `*-index.html`.** That page's voice governs the egg.

| Zone (nearest index) | Path | Vibe |
|---|---|---|
| *Rosetta's Garden of Keys* | `index.html` (root hub) | explorative, botanical, curatorial — a faint wink of edge |
| *Deck of Cards* | `ecards/card-index.html` | whimsical, Wonderland — Alice-scale, decks, playing-card logic |
| *Fidget Toy Garden* | `fidgetToy/fidgetToy-index.html` | calm, sensory, soothing — quiet and unhurried |
| *MISFIRE ARCADE* | `games/games-index.html` | unhinged, glitchy — bunker chaos, machine spirits |

The **rule is authoritative, not the table.** New zones added later get their
own nearest index automatically — resolve by walking up, don't assume this list
is complete. When in genuine doubt about which index is nearest, open the
candidate page and read its `<title>` and hero copy before deciding.

## Intensity: the zone decides

Subtlety scales to the zone's vibe. The default bias across the whole repo is
**subtle & discoverable** (in the spirit of The Tell and the sigil), but the
ceiling moves per zone:

- **Calm / pleasant zones** (Fidget Garden, ecards, root) → keep eggs quiet and
  gentle. Nothing that jars the mood or demands attention. A long-idle reveal, a
  view-source note, a barely-there extra state.
- **The Arcade** → free to go loud and overt. Hidden chaos bursts, unhinged rare
  ticker lines, dramatic reveals all fit the "for people who chose chaos" brief.

Match the mood you'd get from actually sitting on that landing page.

### Zone tone guide (with example eggs — illustrative, not a menu)

- **Root — *Garden of Keys*** (explorative, gentle edge): a key that "opens"
  something unexpected — a view-source note framed as a lock that just clicked,
  or a rare hover that makes one element quietly bloom. Keep the edge faint.
- **ecards — *Deck of Cards*** (Wonderland whimsy): an Alice-ish "drink me / eat
  me" scale flip, a card that turns out to be from a different suit than
  printed, a painted-rose detail on close inspection.
- **fidgetToy — *Fidget Garden*** (calm): after a long undisturbed idle, a
  secret extra-gentle "breathing" state fades in — reward for stillness, never a
  jolt. Silent, slow, optional.
- **games — *MISFIRE ARCADE*** (unhinged): a hidden konami-style chaos burst, a
  one-in-a-hundred cursed ticker line, a machine-spirit whisper in the console.
  Loud is allowed here.

Treat these as calibration for *intensity*, not prompts to copy. The best egg is
specific to the piece you just built.

## When to propose (and when not to)

Propose an egg **only** when the mission is:

- a **new piece** — a new toy, game, card, or standalone page, **or**
- a **substantial new feature** on an existing piece.

**Skip it** for trivial work: bug fixes, copy tweaks, refactors, layout nudges,
dependency bumps, casing fixes. Don't manufacture an excuse to add one.

If you're unsure whether a task clears the bar, **ask rather than assume.** One
egg per mission, maximum.

## The proposal (present this, then wait)

Before writing any egg code, surface a short proposal in roughly this shape:

```
Easter egg proposal (optional — say the word and I'll add it, or skip it):
• What:      one-line description of the egg
• Zone/vibe: which nearest index governs it, and the register you're matching
• Where:     the file(s) and rough location it lives in
• Trigger:   how someone discovers it (view-source, key sequence, long idle,
             rare roll, hover, click-count…)
• Footprint: cost — LOC, any perf/animation impact, anything it touches
```

Then:

- **Approved** → build it as described. If it drifts from the proposal during
  implementation, note the change.
- **Declined / no answer** → drop it silently and finish the actual mission.
  Never leave a half-egg or a `TODO` for it.

## What makes a good egg here

- **Discoverable, not annoying.** Found on purpose or by the curious — never in
  the way of the real experience, never blocking, always reversible.
- **On-theme.** It reads as belonging to that zone's world (see the tone guide).
- **Cheap.** Small footprint. If explaining why it's fun takes more than a
  sentence, it's over-built — cut it back.
- **Constraint-respecting.** Eggs inherit the same non-negotiables as everything
  else in the repo (see `games/CLAUDE.md` §5, the shared baseline): **no API
  keys** in client-side code, **no CDN-hosted libraries** by default, **no build
  step**, and **no fail states** in toys/sandboxes. An egg that needs any of
  those is the wrong egg.
- **The mission comes first.** An egg must never degrade, delay, or complicate
  the actual deliverable. Don't stack multiple eggs. If polishing the egg is
  eating the piece, ship the piece.

## One standing exception — don't "fix" the sigil

The `games/` footer-sigil joke is that its overlay credits only Claude/Anthropic
and pointedly ignores the other models that contributed. That omission **is** the
joke. Do not "correct" it with multi-model credits, and don't replicate a
"corrected" version elsewhere. (See `games/CLAUDE.md` §4.)
