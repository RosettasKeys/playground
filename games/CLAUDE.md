# CLAUDE.md — Games category (webApps/portfolio/games)

> Read automatically by Claude Code at the start of any session rooted here
> or in a subfolder. This is the **category-level** brief — conventions and
> current state for the games section as a whole. Individual game subfolders
> (e.g. `InterpretiveNetworking/`) carry their own `CLAUDE.md` with
> project-specific specs. Claude Code reads these hierarchically: both apply
> together, and a subfolder's own file wins for anything inside that
> subfolder.

## 1. What this is

The "games" category of the portfolio: one landing/index page
(`games-index.html`) linked from the main portfolio (`../index.html`), which
in turn links out to individual game/toy subfolders. Same containment-shelf
voice as the rest of the portfolio — small, self-contained, slightly
deranged interactive pieces, not "real" games with menus or win states.

## 2. This folder is live, not a scratch copy

`C:\2-Obsidian-Claude-Vault\webApps\portfolio\games` is the actual
GitHub-synced production folder. Anything written here is a real change to
the live site, not a draft. Bake-offs, finalists, and multi-model
experiments belong in a scratch location (e.g. `C:\temp\...`) until a
decision is made — only the winner (or a mashup of winners) moves in here.

## 3. Current file inventory

- `game-index.html` — thin redirect stub (`meta refresh` + JS) pointing to
  `games-index.html`, meant to catch the singular/plural typo. **Currently
  absent** — it was removed at some point, and the decision (July 2026) was
  to leave it missing rather than recreate it. Only recreate if the
  typo-catch is wanted again.
- `InterpretiveNetworking/` — a completed, live game subfolder
  (`interpretive-networking.html`), built by Fable 5 from its own
  `InterpretiveNetworking/CLAUDE.md`. Use that file as the template for how a
  new game subfolder's own CLAUDE.md should read (what-this-is → constraints
  → design spec → visual style → build phases with STOP checkpoints →
  definition of done → explicit non-goals).
- `physics-reversal/` — **referenced in the landing page copy
  ("Physics, Reversed") but does not exist yet.** The card is a real
  placeholder for in-progress work, not a broken link waiting to be
  noticed — just don't be surprised the folder's missing.

## 4. The landing-page mashup (in progress)

Three finalists were built independently for `games-index.html`:
deepseek, gemini, and claude. Decision was to use claude's version as the
base and pull specific pieces from the other two rather than pick one
outright. A merged version exists at `C:\temp\Finalists\mashup.html`
(not yet moved into this folder). What it borrows:

- **From deepseek:** the graph-paper grid background (`--grid-line` CSS var
  + repeating linear-gradient on `body`), and the faint numbered-card
  watermark (01/02/03).
- **From gemini:** the pill-style theme toggle (slid handle + baked-in
  DARK/LIGHT labels), the per-card hover-reactive previews (physics card =
  reversed-gravity canvas particles, networking card = LED node rave), and
  the light-mode-only ambient bubble field (repulsion bubbles that float
  away from the cursor).
- **From claude (kept as-is, not modified):** the glitch hero text, CRT
  scanlines, the ghost "???" reserved-slot card, and — importantly — the
  footer sigil easter egg (5 clicks → Anthropic/Claude ASCII overlay). This
  is the piece that made claude the base. **Don't add multi-model credits to
  that overlay** — the joke is specifically that it doesn't acknowledge
  deepseek or gemini at all; "fixing" that kills the joke.
- **Deliberately not ported:** gemini's dark-mode particle swarm (mouse
  attraction, connecting lines, glitch jumps). The portfolio already has
  plenty of dark-mode particle effects elsewhere — the ambient bubbles are
  reserved for light mode only, on purpose.

### 4.1 Outstanding before this can replace `games-index.html`

- **Hrefs aren't wired.** claude's original cards were plain `<article>`
  elements with no links (all three "games" were still in development at
  the time). The mashup inherited that. Before going live, the two
  non-ghost cards need real `<a href="...">` wrappers — pointing at
  `InterpretiveNetworking/interpretive-networking.html` and, once it exists,
  `physics-reversal/physics-reversal.html` — matching gemini's convention.
- **Back-link placeholders.** Both the header and footer back-links
  currently point at `#portfolio-home`. gemini's live version uses
  `../index.html` — the mashup should match that once confirmed.
- Once both are fixed: back up or rename the current `games-index.html`
  (or just trust git history), copy `mashup.html` in as the new
  `games-index.html`, and leave `game-index.html` untouched.

## 5. Non-negotiable constraints (category-wide default)

Same defaults as `InterpretiveNetworking/CLAUDE.md` — repeated here so every
new subfolder doesn't have to re-derive them. A subfolder's own CLAUDE.md can
override any of these for itself, but this is the assumed baseline:

- **No API keys of any kind in client-side code.** This repo is public and
  forkable. Hard no, regardless of framing (AI-provider keys most of all).
- **No CDN-hosted libraries by default** (no GSAP, Google Fonts links, CDN
  React/Tailwind). Soft rule — flag back to the user if a specific library
  seems worth the tradeoff, don't just add one.
- **No build step.** Files should open directly in a browser or deploy as-is
  to GitHub Pages with zero setup. No `npm install`, no bundler.
- **No fail states** in toys/games unless a specific project's own CLAUDE.md
  says otherwise.

## 6. Adding a new game

1. Create `games/<GameName>/` (match the InterpretiveNetworking capitalization
   style — PascalCase folder, kebab-case or matching-name entry HTML file
   inside it).
2. Write that subfolder's own `CLAUDE.md` following the
   `InterpretiveNetworking/CLAUDE.md` shape before writing any code.
3. Wire it into `games-index.html` as a new card once it's actually playable
   — don't add a card for a game that doesn't exist yet (the "???" ghost
   slot exists precisely so there's always an honest placeholder instead of
   a card linking to nothing).

## 7. Explicit non-goals

- Don't invent a second landing page or rename `games-index.html` — the
  redirect stub already handles the naming ambiguity.
- Don't merge or reconcile this category with unrelated experiments
  elsewhere in `webApps/` (e.g. `antivoid.html` is a separate, unrelated,
  still-in-progress piece — leave it alone).
- Don't retrofit multi-model credits into the sigil easter egg (see §4).
- Don't build out `physics-reversal/` as a side effect of landing-page work —
  that's separate, later work with its own CLAUDE.md when it starts.
