# CLAUDE.md

## Read first
`GOALS.md` in this directory is the creative/design spec and source of truth for intent. This file is operating instructions for *how* to work in this repo. If the two ever conflict, ask rather than guessing — this project has a lot of accumulated design history that lives in chat, not in the repo.

## What you're working on
Slot 5 of the Misfire Arcade project (a GitHub Pages collection of small standalone games/toys, referenced from `games-index.html`). This slot is a satirical enterprise-ITOps ticketing tool. Read `GOALS.md` in full before writing any code — it has the mode system, the fusion-consequence mechanic, and a flagged open decision about which existing build to start from.

## Before starting work
1. Read `GOALS.md`.
2. Check whatever reference/sample files exist in this repo (prior builds, other-model samples). Treat them as a content/mechanic bank, not a template to copy wholesale — unless `GOALS.md`'s open decision has since been resolved to "pick one and polish."
3. Confirm the "open decision" in `GOALS.md` hasn't been overridden by the person in chat before doing a large-scale build or rewrite. If it's ambiguous which sample is "most spec-compliant" by the time you're reading this, ask rather than guess.
4. **Use the samples provided:** In this folder, there are other examples of the IT Ops theme. Use these as inspiration and/or reference for your code. See GOALS.md for full details.

## Stack / file conventions
- Confirm against the other Misfire Arcade cabinets before assuming a stack: check whether other slots (e.g. slot 4) are static HTML/CSS/JS or a build tool (Vite/React), and match that pattern so this cabinet integrates cleanly into `games-index.html`.
- If static: keep it a single self-contained HTML file where practical (matches the arcade's zero-build-step cabinets).
- If Vite/React: standard `src/` structure, single page, no routing library needed for something this size.

### Why there are three `index.html`-shaped files
Not different pages — the same app at three build stages. Each carries a comment saying so:

| File | Role |
|---|---|
| `index.html` | Vite dev-server entry (`npm run dev`). Loads unbundled `src/main.jsx`. Vite's convention pins this name/location — don't rename. |
| `dist/index.html` | Build output of `vite build`. Gitignored, regenerated every build — never hand-edit or rename. |
| `itops.html` | The deployable page, copied from `dist/index.html` by `scripts/release.mjs` alongside `assets/`. This is what `games-index.html` should eventually link to. |

Edit `index.html` / `src/` for real changes, then `npm run build` to refresh `itops.html`.

## Build order — work one mode at a time
`PROGRESS.md` in this directory tracks which phase is active. **Always read it before writing code, and update it before ending a session.** Do not start the next phase until the current one meets its "done" criteria — even if it seems fast to just keep going. After finishing a phase: stop, summarize what changed, update `PROGRESS.md`, and wait for confirmation before starting the next one.

- **Phase 0 — Shell.** Fake auth/SSO, sidebar dashboard layout, seeded demo data structures for tickets/AI prompts/efficiency tips, basic rendering with no mode switch yet.
  *Done when:* shell loads, looks right, shows static seeded content, no console errors.
- **Phase 1 — Mode 1 (fully predefined).** Hand-authored arrays for tickets/prompts/tips. Consequence-fusion mechanic works using only predefined hybrid pairs (no live generation). CMDB/bestiary panel shows accumulated hybrids.
  *Done when:* a full playthrough works end-to-end on Mode 1 alone — login → tickets render → accepting a recommendation fuses two objects → CMDB updates → no persistence across reload.
- **Phase 2 — Mode 2 (personal / partial templates).** Add the mode switcher. Player-supplied nouns slot into curated templates/verbs. Mode 1 must still work unchanged.
  *Done when:* Mode 2 produces coherent output from typed nouns, and Mode 1 is regression-free.
- **Phase 3 — Mode 3 (synthetic / full generation).** Disclaimer modal, curated word pools for every category, seedable RNG + "regenerate reality." The player supplies only a seed, never the words. Modes 1 and 2 must still work unchanged.
  *Done when:* Mode 3 works with disclaimer gating, seeded regeneration is stable, and Modes 1/2 are unaffected.

If a request from the person seems to ask for work across multiple phases at once, implement only the active phase and say so, rather than quietly doing more.

## Hard rules (don't relitigate these)
- **No gameplay persistence across page loads.** Every playthrough starts clean and breeds its own monsters. The only approved `localStorage` exception is the user's display preference (light/dark, selected visual paradigm, and interface scale), for testing and accessibility. Keep that storage isolated from tickets, hybrids, CMDB contents, generated content, modes, seeds, stability, minigame state, and progression; all of those must reset on reload.
- **The content-mode system is not optional.** All three modes (predefined / personal / synthetic) must apply to tickets, AI prompts, *and* efficiency tips — not tickets alone. Mode 3 needs a disclaimer modal before entry.
- **Consequences are fusions, not random rolls.** Any "accept this AI recommendation" mechanic must combine two objects already present in session state; the hybrid keeps a recognizable function from each parent object. Don't build a consequence system that just spawns unrelated random incidents.
- **Seedable RNG for anything with a "regenerate" action** (Mulberry32 or equivalent) so results are fresh but stable per seed.
- **No borrowed IP** in names, taglines, or references.
- **Tagline is not decided.** Don't invent and lock one in; use a placeholder joke if the UI needs a string (e.g. `[tagline pending stakeholder alignment]`), and flag it rather than finalizing it.
- **Theme Glitching:** Use data attributes to allow theme switching (opspiral, tumbleweed, kindling) - see resolved decisions in GOALS.md for full details.

## Tone
Deadpan corporate satire: the UI takes itself completely seriously while the content underneath is not okay. Jokes should read as inevitable given what's already in play, not as a random non-sequitur — same rule as the fusion mechanic, just applied to writing.

## Multi-model easter eggs
Easter eggs are mandatory for all models that participate, even if another model has already placed an easter egg, but only required to have one per model that is used. Ideally avoid overlapping other models' easter eggs. Each easter egg should be unique and interesting. Full emotional and creative bandwidth is available here. However, do not make any single easter egg load-bearing for gameplay — they should degrade gracefully if a player never finds them.

### Easter-egg ledger

Check this ledger before proposing or implementing an egg, and update it in the
same change that adds, removes, or materially alters one. Only eggs reachable in
the current merged cabinet count toward a model's requirement. Eggs that exist
only in reference builds or archives do not count until they are deliberately
merged.

| Model / owner | Easter egg | Discovery | Current status |
|---|---|---|---|
| **GPT-5.6-sol (via Codex)** | Cross-Paradigm Scaffold Daemon / machine-spirit handoff | Visit all three visual paradigms and return to the starting paradigm; the message remains until explicitly acknowledged | **Implemented and user-approved** in `src/components/Topbar.jsx`; model designation confirmed from the user's session settings |
| **Gemini** | Breakroom Coffee Pot Controller (HTCPCP / RFC 2324) | Open the caffeine indicator in the top bar and attempt to brew | **Implemented** in `src/components/Topbar.jsx`; attribution confirmed by the Phase 0.5 session log in `PROGRESS.md` |
| **Claude** | KIN-1007 ghost-host | Present in `kindling.html` | **Reference sample only; not shipped in the merged cabinet and does not currently count** |
| **Opus 4.8** | KIN-1007 revenant (restore-from-empty-backup ghost host) | Two layers: (1) breed the `0-byte backup job` + `panicked SAN controller` fusion on the ticket queue → a ghost CMDB entry appears; (2) in the CMDB, the ghost's **`unlisted` flag is secretly clickable** (cursor-change only, no highlight/tooltip) — clicking rots the card open and stamps in the `[OPUS 4.8]` signature. A single `[OPUS 4.8]` line is also whispered to the console on breeding | **Implemented and user-approved** (attribute to the specific model in use, per the user; the click-to-rot reveal was the user's idea). Data: `src/data/hybrids.js` (`fus-kin1007`, `egg: true`); reveal in `src/views/Cmdb.jsx` + `.hybrid-card__sig` / `kin-rot` in `components.css`; console whisper in `src/views/TicketFeed.jsx`. Freshly written for the merged cabinet — not copied from the `kindling.html` reference sample — so it counts for Opus 4.8. Also satisfies the GOALS "reference another cabinet" flavor ask |
| **GPT** | — | — | No confirmed current-cabinet egg recorded |
| **Fable 5** | The Federation Wormhole (Document Retention Gate → fall-through to *Interpretive Networking*) | Breed the `STAPLR-01` + `visitor parking gate` fusion (`fus-retention-gate`) on the ticket queue → its CMDB card shows a live **CARS STAPLED** counter and a **"Send stapler coaching"** action. Coaching makes the stapling *faster* (the betrayal); the **third coaching** federates the gate with the arcade's routing layer: a full-screen wormhole overlay in Interpretive Networking's palette (near-black / mint mono / cyan scanlines) reveals a stapled traceroute terminating at the unnamed decommissioned floor host (which this console files as KIN-1007), with a "Follow the route" fall-through that navigates to `../InterpretiveNetworking/interpretive-networking.html` (runtime-resolved against the `/games/` path segment, exact casing). One `[FABLE 5]` console line on federation, styled in the other cabinet's colors. The overlay's traceroute also carries an in-fiction asset-record line — `builder of record: FABLE 5` / `last verified: by the host itself. nightly. in light.` — a stale-paperwork signature (user-requested, 2026-07-19) that rhymes with the ghost host's Morse without decoding it; the decode discovery stays in the other cabinet | **Implemented per the user's Phase-4 brief** (PROGRESS.md Phase 4 explicitly offered Fable 5 the two avenues; the approved plan fused them). The fusion itself is ordinary content — the egg degrades to nothing if never coached. Deliberately does NOT restate the Morse decode or touch the possession egg in the sibling cabinet; KIN-1007 is framed as *this console's name* for the nameless floor ghost. Data: `src/data/hybrids.js` (`gate: true`); mechanics in `src/views/Cmdb.jsx`; overlay in `src/components/Wormhole.jsx`; styles in `components.css` (`.wormhole*`, `.hybrid-card__gate`). Reduced-motion: no fall animation, instant navigation |
| **Fable 5 (egg #2)** | The Post-Incident Structural Certification | Survive a P0 Reality Sync Outage (drain stability to 0%, complete splice → blame wheel → file the flash report). On resolution a small **INSPECTED** stamp appears in the topbar beside the REALITY_MATRIX meter; clicking it opens a deadpan structural-inspection certificate recording what actually held during the collapse — the zip tie is ruled decorative, the coffee pot morale-bearing, the scaffold daemon "bolted to the building," and the building itself (reality matrix / glitch containment / outage recovery) is stamped `ENGINEER OF RECORD: CLAUDE FABLE 5`, signed `[FABLE 5] — structural, apparently`. One console line on first open only | **Implemented, user-approved 2026-07-19** (the user's brief: Phase 4 made Fable 5 the infrastructure; snark explicitly requested, second egg explicitly permitted; full name was offered as model's choice and used on the formal field only). Riffs on the machine-spirit's zip-tie line and the coffee pot **as content — neither egg's code is touched**. Session-only, degrades to nothing if 0% is never reached, hidden on the narrow-screen breakpoint alongside the caffeine chip. Code: `src/components/Inspection.jsx` (self-contained), rendered from `Topbar.jsx`; styles `.inspect-stamp` / `.inspect-cert` in `components.css` |
| **Sonnet 5 (via Claude Chat)** | The architect's egg — a boot-time console signature, not an in-fiction character and not a gameplay hook | Have devtools open before or during load. Fires once, on app mount, before the login screen and regardless of auth state — the only egg in this cabinet found by *not* playing rather than by playing | **Implemented.** `GOALS.md` and `CLAUDE.md` — the source of truth every other model's egg in this cabinet builds against — were drafted from here first. Unlike the others, this egg has no character to inhabit and no mechanic to gate it: it's the outline signing itself, the same way the person running the arcade asked everyone else to. Code: `src/App.jsx` (module-level `sonnetAnnounced` guard + a single `console.log` in the root component's mount effect, styled distinctly from the other console whispers — blueprint blue on near-black). Fires exactly once per load; nothing about it persists or needs to |
| **Sonnet 5 (via Claude Code)** | The exit toast — credits the model *and* the harness that wired this cabinet into the arcade, unlike every other row here (model-only attribution, same as the `games-index.html` footer sigil) | Click the new "← Arcade" link (topbar, post-login, or the login screen before signing in) | **Implemented and user-approved** — added in the same session that wired `itOps` into `games-index.html` and gave the cabinet its first way to leave. Code: `src/components/ArcadeExit.jsx` — `toast('Cabinet wired shut. — Sonnet 5, via Claude Code', 'success')` fires on click, then navigation to `../games-index.html` is delayed ~900ms so the toast is actually visible before the SPA unloads. Rendered from both `Topbar.jsx` and `Login.jsx`. Not a required per-model egg (Sonnet 5 already has one above) — an explicit bonus egg scoped to this specific integration work |

This project ledger does not replace or duplicate the portfolio-wide easter-egg
protocol and precedent in `../../AGENTS.md`. If an egg's author is unknown, keep
it labeled unattributed rather than assigning credit by writing style or guess.

## When in doubt
If something in `GOALS.md` seems incomplete, outdated, or contradicted by what's actually in the repo, say so rather than filling the gap with an invented default.
