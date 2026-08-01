# AGENTS.md — Misfire Arcade Slot 5

These instructions apply to this directory and everything below it.

## Inherited instructions

This project remains governed by the portfolio-level
[`../../AGENTS.md`](../../AGENTS.md). Follow it in addition to this file. In
particular, do not implement an easter egg unless the work qualifies under that
file and the user explicitly approves the proposal first. Do not duplicate the
portfolio easter-egg protocol here.

## Required project context

Before changing implementation code, read these files in full:

1. [`GOALS.md`](GOALS.md) — current creative/design specification and source of
   truth for product intent, resolved decisions, mechanics, and non-goals.
2. [`CLAUDE.md`](CLAUDE.md) — repository workflow, hard rules, build order, and
   phase boundaries. Its instructions apply to every coding agent despite the
   filename. Its **Easter-egg ledger** is the authoritative project-level record
   of which models already have a shipped egg; check and update it instead of
   duplicating the ledger here.
3. [`PROGRESS.md`](PROGRESS.md) — active phase, done-checks, and session handoff.
   Work only in the active phase, and update this file before ending a coding
   session.
4. [`DESIGN.md`](DESIGN.md) — OPSPIRAL variant handoff and a bank of reusable
   visual, content, architecture, and polish ideas.

## Precedence and interpretation

- The inherited [`../../AGENTS.md`](../../AGENTS.md) governs portfolio-wide
  agent behavior and the easter-egg approval protocol.
- `GOALS.md` governs what the current Slot 5 game should become.
- `CLAUDE.md` governs how work is performed, including phase sequencing.
- `PROGRESS.md` identifies the phase currently authorized for implementation.
- `DESIGN.md` documents one pre-existing sample. Treat it as reference material,
  not as the current product specification.
- When sample behavior conflicts with the current rules, the current rules win.
  Most notably, do not carry `DESIGN.md`'s general `localStorage` persistence
  into the merged game: all gameplay state must remain in memory and reset on
  reload. The sole approved persistence exception is the user's display
  preference (light/dark, selected visual paradigm, and interface scale).
- If `GOALS.md` and `CLAUDE.md` conflict, or the active phase/open decision is
  genuinely unclear, ask the user instead of inventing a default.

## Working constraints

- Do not advance beyond the active phase in `PROGRESS.md` without user
  confirmation after its done-check passes.
- Preserve the three-mode content system, consequence-by-fusion mechanic,
  seedable regeneration, theme data attributes, and gameplay no-persistence rule
  defined in `GOALS.md` and `CLAUDE.md`.
- Use existing builds and archives as a content/mechanics bank. Do not assume any
  one sample is the final implementation.
- Do not lock a working title or tagline without user approval.
- Keep changes compatible with the surrounding Misfire Arcade integration and
  inspect the neighboring cabinet conventions before making stack or packaging
  decisions.
