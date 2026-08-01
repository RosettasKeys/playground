# GOALS.md — Misfire Arcade, Slot 5

## What this is
A cabinet in **Misfire Arcade** (a GitHub Pages collection of small, standalone, deliberately unhinged web toys — see `games-index.html`). This one is a satirical enterprise ITOps/ticketing console whose polished corporate shell hides a comedy engine that generates its own escalating chaos.

## Working title
Not locked. Candidates on the table so far: **TUMBLEWEED** (wild-west/cowboy ITOps) and **Kindling™ Service Experience Platform** (HR-euphemism ITOps). The tagline is explicitly parked — don't pick one without asking. `[tagline pending stakeholder alignment]` is a fine placeholder joke if a display string is needed before then.

## Core loop
1. Player logs into a fake, self-serious enterprise console (SSO theater — accepts anything).
2. Dashboard seeds with realistic-looking tickets that are actually quiet cries for help.
3. An "AI assistant" panel recommends actions that are technically helpful and completely insane.
4. Accepting a recommendation doesn't spawn a random new incident — it **fuses two objects already in play** into a hybrid that keeps a recognizable function from each parent. (Canonical example: stapler + parking gate → a car-stapler that staples cars to the pavement when they drive through.) This fusion rule *is* the design pattern; new mechanics should follow it rather than just adding random chaos on top.
5. Hybrids accumulate in a mutable CMDB/bestiary visible over the session — that visible, growing monster list *is* the progression system.
6. Session resets on reload. **No `localStorage`.** Each playthrough breeds its own monsters and none should persist — that's intentional, not a missing feature.

## The content-mode system (must ship — this keeps getting deprioritized across samples, don't let it slip again)
Three selectable modes, applied consistently across **tickets, AI prompts, and efficiency tips** — not tickets alone:

- **Mode 1 — fully predefined.** Hand-authored arrays, best jokes, ships verbatim. Quality baseline, safe default.
- **Mode 2 — partially predefined (personal).** Player types in a few real nouns (a coworker's name, an actual device on their desk); curated verb/template arrays still do the fusing around it. Personalization without betting the joke on the player's improv.
- **Mode 3 — synthetic (fully generated).** Every category (devices, locations, protocols, consequences, people, etc.) is drawn from curated word pools and fused live at generation time by a seeded RNG. The player supplies only a seed, never the words — this is *not* a fill-in-the-blanks / mad-libs prompt. Needs a **disclaimer modal before entry** — this mode can produce genuinely unpredictable combinations, and the player should be warned before, not after.

Generation rule that keeps Mode 3 from reading as word salad: **one real IT noun per line**, everything else can be absurd. Use a seedable RNG (e.g. Mulberry32) so a "regenerate reality" action produces a fresh but stable batch — no mid-render reshuffling.

## Multi-model collaboration conceit
This cabinet is framed as having been built by at least four different AI models who left comments/notes as though talking to each other — without literally cross-triggering each other's easter eggs. At least one ticket should be a ghost/ambient reference to another Misfire Arcade cabinet (e.g. the decommissioned host from *Interpretive Networking*, or slot 4's contractor leaving notes in "the gate firmware"). This is flavor, not something gameplay should depend on.

## Shell requirements
- Fake authentication / SSO screen.
- Sidebar-nav dashboard layout.
- Realistic seeded demo data so it feels alive on first load.
- Empty states, loading states, optimistic updates — with occasional deliberate "optimistic update reverted" comedy. Worth stealing outright from a prior sample: a fake API layer with 300–800ms simulated latency and a ~10% failure rate, each failure narrated with its own dry excuse.
- Responsive.
- Fits into Misfire Arcade's `games-index.html` as slot 5. Should borrow "a tad" from the arcade's existing visual vibe but doesn't need to match it exactly — each cabinet has its own flavor.

## What already exists (reference / salvage — not automatically the final answer)
Two prior full Claude builds:
- **TUMBLEWEED** — single-file static HTML, wild-west theme, Bounty Board, "Chaos Index" gauge, MTTR-9000 recommendation engine, betrayal-on-resolve mechanic on the stapler ticket.
- **Kindling™ Service Experience Platform** — React, HR-euphemism theme, implements the 3-mode system as Guided Serenity / Managed Chaos / Full Synergy, stapler-federation as a 4-phase state machine, KIN-1007 ghost-host easter egg.

Plus a wider pool of other-model samples gathered purely to mine for ideas: **PanicDesk** (static HTML, cleanest zero-build-step shell, but no content-mode/fusion system), **OPS-NIGHTMARE** (Vite/React shell only — component content was never pasted, so it's an unknown), a **Gemini "War Room"** build (richest, most game-like, but uses `localStorage` — conflicts with the reset-per-session rule), a **GPT** build, an **"unhinged-itops"** build, **"employee-success-service-desk"** (the only sample that actually matched the mode/fusion spec), and **"opspiral"** (weak on spec, but has the fake-latency/failure-narration API layer above — worth lifting directly).Many of the pools live in .zip files.

## Resolved Decision — Franken-merge + Leaning into the Divergence

The team has resolved to combine **Franken-merge** (grafting in mechanics from multiple samples) with **Leaning into the divergence as the joke** (the console visibly failing to maintain a single identity).

### Architectural Spec for the Hybrid System:
1. **Core Layout Spine**: 
   - A single-page React/Vite dashboard structure that acts as the console's shell. 
2. **The Paradigm Switcher & Theme Glitcher**:
   - The UI supports three distinct visual paradigms via data attributes (e.g., `data-theme="opspiral"`, `data-theme="tumbleweed"`, `data-theme="kindling"`):
     - **OPSPIRAL**: A "NOC at 3 AM" vibe (Charcoal/Amber warning glow, IBM Plex font, rack status LEDs).
     - **TUMBLEWEED**: A Wild West Saloon theme (Dusty browns, terracotta accent, rustic styling).
     - **KINDLING**: An HR-Euphemistic "Guided Serenity" theme (Lavender, pastel teal, soothing rounded badge pills).
     - Each theme glitch should work in light mode and dark mode with a toggle that preserves user's preference
3. **Reality Matrix Stability Index**:
   - A health bar or percentage (`[REALITY_MATRIX_STABILITY]`) is pinned in the header.
   - Performing actions (e.g., executing unhinged recommendations, splicing cables, or triggering alert storms) causes the stability index to drop.
   - As stability degrades below thresholds (e.g., 75%, 50%, 25%), the UI "glitches"—individual components swap stylesheets randomly (e.g., a saloon button renders on the corporate settings page, or text descriptions shift layout).
4. **P0 Reality Outage Minigame**:
   - When stability reaches 0%, a "Reality Sync Outage" is triggered. The player is forced to complete a minigame (such as the color-match **Cable Splicing/Wire Sorting Game** or a **Blame Wheel** spin) to restore the matrix stability to 100%.
5. **Divergent Content Framing**:
   - Core data structures (tickets, prompts, tips) change terminology based on the active paradigm. For example, a severed fiber trunk is described as a technical cable cut in *Opspiral*, a sliced rawhide lasso in *Tumbleweed*, and a "synergistic pathway realignment window" in *Kindling*.
6. **Persistence Rules**:
   - Gameplay state lives in memory and resets completely on reload. The sole
     persistence exception is the user's display preference (light/dark,
     selected visual paradigm, and interface scale), which may use `localStorage`
     to support testing and accessibility. Tickets, hybrids, CMDB contents, generated content,
     modes, seeds, stability, minigame state, and progression must never persist.


## Explicit non-goals
- No gameplay or progression persistence across page loads/sessions. A narrowly
  scoped display preference is the only approved persistence exception.
- No borrowed IP in naming or references (a Stranger-Things-adjacent name was considered and rejected for this reason).
- No cross-model easter egg that mechanically depends on another one firing first — each should degrade gracefully alone.
