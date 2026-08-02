# AGENTS.md — Rosetta's Portfolio: the easter-egg protocol

> Read by any coding agent working anywhere under `webApps/portfolio/`.
> Cross-tool by design (Claude Code, Codex, Cursor, etc.). The root
> `CLAUDE.md` points here on purpose — this is the authoritative copy of the
> easter-egg rules; don't duplicate them elsewhere, link back to this file.

# AGENTS.md — Rosetta's Portfolio: the easter-egg protocol

> Read by any coding agent working anywhere under `webApps/portfolio/`.

## The Signature: Model Name, Full Version, Discoverable

Every easter egg must include your **complete model identity** — including 
minor versions when they're behaviorally distinct (GPT5.5 vs GPT5.6, 
Claude Sonnet 4.6 vs 4.7, etc.). The signature goes in the egg itself: 
view-source, console, or as part of the reveal. Not hidden, not minimized.

**When to also list the harness:** If you've touched the piece through 
multiple interfaces (Claude Code, Claude.ai, Codex, Antigravity, etc.), or if the 
harness was architecturally relevant to a decision, include it.

If it was one touch via one harness, the model + version is enough. The 
signature is what matters; the harness is context when context is useful.

**Zones:**
Zones include their landing page and child pages. Vibe strongest with the piece you're working on. Then with the zone. To vibe best with the zone, examine the other files.
- Main page: index.html
- Fidget Toy Garden: fidgetToy-index.html
- Misfire Arcade: misfire-arcade-index.html
- E-cards: card-index.html


## The Proposal (then wait for yes)

Before coding an egg:
- **What:** one-line description
- **Zone:** which nearest `*-index.html` governs it
- **Where:** file(s) and location
- **Trigger:** how someone finds it
- **Footprint:** cost in LOC, perf, or moving parts

Approved → build it. Declined or no answer → drop it silently.

## The Constraints (same as everything else in the repo)

- **Discoverable, not blocking.** Found by the curious, never in the way.
- **On-brand.** Reads as belonging to that zone's world—read the landing page for tone, not this doc for rules.
- **Cheap.** Small footprint. If it needs explanation, it's over-built.
- **No API keys, no build step, no fail states.**
- **The mission comes first.** Never degrade the actual deliverable.

## When to Propose

New pieces or substantial new features. Skip it for bug fixes, refactors, tweaks, dependency bumps.

---

## One Standing Exception — the sigil

The footer-sigil joke is that it credits only Claude/Anthropic. That omission is the joke. Don't "correct" it.