# CLAUDE.md — Rosetta's Portfolio (repo root)

> Top-level house brief for `webApps/portfolio/`. Read automatically at the
> start of any session rooted here or in a subfolder. This is the **root**
> file — deeper `CLAUDE.md` files (e.g. `games/CLAUDE.md`,
> `games/InterpretiveNetworking/CLAUDE.md`) carry zone- and mission-specific
> detail. Claude Code reads them hierarchically: this root file and any deeper
> ones apply together, and the deepest file wins for anything inside its own
> folder.

## What this repo is

Rosetta's personal portfolio — *Rosetta's Garden of Keys*. A root hub
(`index.html`) links out to a handful of themed **zones**, each a small,
self-contained, hand-made interactive piece (a toy, a game, a card). Same
containment-shelf spirit throughout: little loops for hands, eyes, and
attention — not "real" apps with menus, accounts, or win states. This repo
deploys to **GitHub Pages** (repo: `RosettasKeys/playground`).

## Zone map

Each zone has its own landing page with a distinct voice:

| Zone | Nearest index | Vibe |
|---|---|---|
| root hub | `index.html` (*Garden of Keys*) | explorative, botanical, faint edge |
| `ecards/` | `card-index.html` (*Deck of Cards*) | whimsical, Wonderland |
| `fidgetToy/` | `fidgetToy-index.html` (*Fidget Toy Garden*) | calm, sensory, soothing |
| `games/` | `games-index.html` (*MISFIRE ARCADE*) | unhinged, glitchy chaos |

## Easter-egg protocol → read `AGENTS.md`

There is an `AGENTS.md` beside this file. **For any new piece or substantial
new feature, read `AGENTS.md` in this directory and follow its propose-first
easter-egg protocol** — thematically-matched egg, matched to the nearest
landing page's vibe, **proposed for approval before any of it is coded.** Skip
it for trivial work (fixes, copy tweaks, refactors). That file is the
authoritative source for the rules; don't restate them here.

## Shared constraints (repo-wide baseline)

The category baseline is spelled out in `games/CLAUDE.md` §5 and applies across
the whole portfolio unless a deeper file overrides it for its own subtree:

- **No API keys** of any kind in client-side code — this repo is public and
  forkable. Hard no, AI-provider keys most of all.
- **No CDN-hosted libraries by default** (no GSAP, Google Fonts links, CDN
  React/Tailwind). Soft rule — flag if a library seems worth the tradeoff.
- **No build step.** Files open directly in a browser and deploy as-is to
  GitHub Pages. No `npm install`, no bundler.
- **No fail states** in toys/sandboxes unless a specific piece's own file says
  otherwise.

## Case-sensitivity (deploy-time gotcha)

Local dev is Windows (case-insensitive); GitHub Pages is Linux
(case-sensitive). Links and paths must match on-disk casing **exactly** — a
`./FeedTheMountain/` link to a `feedTheMountain/` folder works locally and
404s live. Verify casing before committing web changes.
