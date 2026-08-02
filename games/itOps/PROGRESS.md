# PROGRESS.md

Tracks build phase for Misfire Arcade slot 5. See `CLAUDE.md` for the rules and `GOALS.md` for the design spec.

**Update this file before ending any session.** The next session (possibly weeks later, possibly a different context window) reads this first to know where things stand.

---

## Current phase: `4 — Polish` (all workstreams built + QA'd; awaiting user sign-off for release)

## Phase 0 — Shell
- [x] Fake auth / SSO screen (session is memory-only)
- [x] Sidebar dashboard layout
- [x] Seeded demo data structures (tickets, AI prompts, efficiency tips)
- [x] Six-way theme scaffold: OPSPIRAL / TUMBLEWEED / KINDLING in light + dark
- [x] Display-only persistence boundary (`{ paradigm, scheme, textScale }`)
- [x] Reality Matrix Stability header seam (display-only at 100% in Phase 0)
- [x] Basic read-only rendering, no content-mode switch yet
- [x] **Done-check:** production build and local HTTP preview pass

## Phase 0.5 - Usability & Testing
- [x] Persistent 0.5× / 1× / 2× / 3× interface-scale control
- [x] Approved Codex machine-spirit easter egg (explicit acknowledgment required)
- [x] Compiled PowerShell preview launcher avoids raw `.jsx` MIME handling
- [x] in-browser visual QA (all themes/paradigms, both light/dark schemes)
- [x] console / runtime behavior sanity check (no errors, no loops)
- [x] Check for general usability concerns: text size, readablility, layout, etc.
- [x] sign-off on shell polish before proceeding to Phase 1
- [x] **Done-check:** in-browser visual/console QA and user sign-off complete

## Phase 1 — Mode 1 (fully predefined)
- [x] Hand-authored ticket/prompt/tip arrays (seed.js tickets/prompts/tips + new `src/data/hybrids.js` fusion bank)
- [x] Consequence-fusion mechanic (predefined hybrid pairs only) — inline "AI recommends" on the ticket queue; accept fuses two in-play objects via the optimistic engine (10% rollback narrated); stability decrements on success
- [x] CMDB / bestiary panel (`src/views/Cmdb.jsx` + nav item; badge = hybrids bred)
- [x] **Done-check:** full playthrough works end-to-end on Mode 1 alone; no persistence across reload *(verified in-browser: login → queue → accept fusion → CMDB updates + stability drops by the fusion cost → reload clears CMDB/stability; egg whisper fires once; no console errors; per-paradigm nav labels resolve)*

## Phase 1.5 - Usability & Testing
- [x] in-browser visual QA (all themes/paradigms, both light/dark schemes) — done programmatically (WCAG-contrast + horizontal-overflow audit across all 6 paradigm×scheme combos and 0.5×/1×/2× scales); pixel screenshots were unavailable because the automation tab ran backgrounded
- [x] console / runtime behavior sanity check (no errors, no loops) — no console errors; egg whisper fires exactly once
- [x] Check for general usability concerns: text size, readablility, layout, etc.
- [x] sign-off on shell polish before proceeding to Phase 2
- [x] **Done-check:** in-browser visual/console QA and user sign-off complete

### Phase 1.5 findings
- **Fixed (Phase 1 surface):** `.ticket-rec__toggle` (the "AI recommends" control)
  used amber label text, which failed WCAG AA on light schemes (2.93:1 in
  tumbleweed/light) — below even the project's amber-eyebrow baseline, and it is an
  interactive control. Moved the label to `--text-mid` (now ~6.3:1 across light
  themes, 6.7–9.0:1 in dark) and kept the amber ✦ spark as the "AI action" cue.
- **Verified clean:** all other new-surface text (rec engine/conf/text/fuse, CMDB
  name/parent/desc/inherited/ghost-flag) passes AA across all 6 combos; hybrid
  names ~13:1 in kindling/dark. No Phase 1 surface causes horizontal overflow;
  card widths scale correctly at 0.5×/1×/2×.
- **RESOLVED (fixed in the Phase 2 polish pass, user-approved):** the topbar
  `.theme-controls--compact` cluster overflowed the viewport by ~147–208px at
  widths roughly 1180–1430px (the four-zone clock only hid below 1180px),
  producing a whole-page horizontal scrollbar in that band. Fix in
  `components.css`: `.topbar__status` now shrinks + truncates a long incident
  title (`min-width:0` + ellipsis span), and the clock's hide breakpoint moved
  from ≤1180px to ≤1430px. Verified: no horizontal scrollbar at 1287px (mid-band)
  — `documentElement.scrollWidth === clientWidth`.

## Phase 2 — Mode 2 (personal / partial templates)
- [x] Mode switcher (1 ↔ 2) — shared `ModeBar` (`src/components/ModeBar.jsx`) at
  the top of Tickets, Prompts, and Tips; keyboard-operable radiogroup segmented
  control. Mode lives in `AppContext` (memory only, resets on reload).
- [x] Player-noun input feeding curated templates — `src/data/personalize.js`
  (`NOUN_SLOTS` + `interpolate`); Mode-2 templates added to a curated subset of
  fusions (`hybrids.js` `mode2` blocks + `viewFusion`), prompts (`prompt2`/`when2`)
  and tips (`body2`). Blank slots fall back to curated defaults (never empty).
- [x] "Do more" (all three, per user): live personalization preview (surfaces
  re-render as you type + a live bred-name preview on rec cards), CMDB snapshots
  the personalized name at breed time and shows a `MODE 2` tag (kept even after
  switching back to Mode 1), and a "Surprise me" curated-filler button (+ Clear).
- [x] **Done-check:** Mode 2 output is coherent from typed nouns across all three
  surfaces; Mode 1 is regression-free (verified: `RESOLVER Janet` / "Janet's VPN
  disconnects…" render verbatim in Mode 1; `RESOLVER Marcus` etc. in Mode 2).

## Phase 2.5 - Usability & Testing
- [x] in-browser visual QA (all themes/paradigms, both light/dark schemes) — done
  programmatically (WCAG-contrast + horizontal-overflow audit); pixel screenshots
  unavailable (automation tab backgrounded, `visibilityState:"hidden"`)
- [x] console / runtime behavior sanity check (no errors, no loops) — clean; the
  Phase 1 fusion/CMDB/egg paths still work
- [x] Check for general usability concerns: text size, readablility, layout, etc.
- [x] sign-off on ModeBar + Mode-2 surfaces before proceeding to Phase 3
- [x] **Done-check:** in-browser visual/console QA and user sign-off complete

### Phase 2.5 findings
- **All ModeBar text passes WCAG AA** across all 6 paradigm×scheme combos
  (measured with proper alpha-compositing of the semi-transparent `amber-glow`
  active-segment background): active segment 11.04–15.98:1, inactive segment
  4.86–7.28:1 (floor in tumbleweed/light), hint/field-label 5.57–7.08:1,
  nouns-title 6.93–9.83:1, inputs 11.04–15.98:1, placeholders 5.53–6.81:1.
  Input focus rings and the segmented control's `:focus-visible` outline are
  present; the control is arrow-key + Space/Enter operable (`role="radiogroup"`).
- **No-persistence verified:** after reload, mode → 1, nouns cleared, CMDB empty,
  stability 100%, back at login. Only `misfire-itops-theme-v1` persists; no
  mode/noun/cmdb/stability keys in `localStorage`.
- **Note (measurement):** a naive contrast reader reports the inactive segment as
  1.28:1 because it treats `rgba(245,166,35,0.14)` as solid amber; compositing it
  over the dark base gives the true 5.63:1 (opspiral/dark). Direct reads with
  alpha-compositing are authoritative — same lesson as the Phase 1.5 audit.

## Phase 3 — Mode 3 (synthetic / full generation)
- [x] Disclaimer modal — reuses `Modal.jsx`; gates the FIRST Mode-3 entry per session
  (`mode3Unlocked` in AppContext). Clicking/arrowing to MODE 3 opens the warning
  instead of switching; "I understand — generate reality" unlocks + enters, "Stay
  in a curated reality"/Escape cancels. Re-gates after reload.
- [x] Curated word pools, all categories — new `src/data/synthesize.js`: ~25 word
  pools (verbs, adjectives, daemons, consequences, actors, rituals, timeframes,
  euphemisms, doc types, reviewers, …) plus a `realNoun`/`realNounBare` grounding
  pool. Templates for fusion name/rec/desc, prompt when/body, and tip body — each
  carries exactly one real IT anchor per line (GOALS' "one real IT noun per line").
  Applies to tickets, AI prompts, AND tips (the hard rule), via `gen3Fusion` in
  `hybrids.js` + `gen3Prompt`/`gen3Tip` in `Prompts.jsx`/`Tips.jsx`.
- [x] Seedable RNG + "regenerate reality" — Mulberry32 (`mulberry32`) + a per-item
  FNV-1a stream (`rngFor(seed, id+field)`) so each item is independent yet stable;
  `seed` lives in AppContext (memory only). ModeBar Mode-3 panel exposes an editable
  numeric seed input + "🎲 Regenerate reality" (rolls a fresh seed, re-renders all
  three surfaces). Deterministic: same seed → identical batch, no mid-render reshuffle.
- [x] **Done-check:** Mode 3 works with disclaimer gating; Modes 1 and 2 still pass
  their done-checks *(verified: Mode 1 renders `GREENLIGHT Custodian` verbatim;
  Mode 2 personalizes `RESOLVER Marcus` / `The Marcus Approval Gate`; Mode 3 generates
  `The Nonquorate BGP Confessor` on seed 1234 and restores it exactly on re-pin. The
  fusion invariant holds in Mode 3 — real parents + real inherited functions kept,
  only the surface copy is generated. Bred Mode-3 monster snapshots its generated
  name + shows a dashed `MODE 3` tag; reload wipes mode/seed/unlock/CMDB — only the
  theme key persists; no console errors.)*

## Phase 3.5 - Usability & Testing
- [x] in-browser visual QA (all themes/paradigms, both light/dark schemes) — driven
  programmatically against the production preview (login → 3 segments → disclaimer
  gate → confirm → generated recs/prompts/tips → seed input → regenerate → breed →
  CMDB tag → reload reset); pixel screenshots still unavailable (automation tab
  backgrounded, `visibilityState:"hidden"`)
- [x] console / runtime behavior sanity check (no errors, no loops) — no console
  messages at all across a full Mode-3 playthrough; no React key/agreement warnings
- [x] Check for general usability concerns: text size, readablility, layout, etc. —
  a 20,800-string generation lint across 400–500 seeds found 0 unfilled tokens, 0
  double-articles, 0 lowercase sentence-starts; two grammar bugs surfaced by the
  first pass (double-article "The the object store"; subject/verb "let the pair
  gaslights") were fixed in the templates before re-linting clean
- [x] sign-off on Mode 3 before proceeding to Phase 4
- [x] **Done-check:** in-browser visual/console QA and user sign-off complete

### Phase 3.5 findings
- **Fusion invariant is mode-invariant.** Mode 3 generates only name/recommendation/
  description; the two parent objects and their two inherited functions are the real
  authored values in every mode, so "the hybrid keeps a recognizable function from
  each parent" is guaranteed, not coincidental. The generated fuse line still reads
  "fuses <real A> + <real B> → <generated name>".
- **Determinism verified two ways.** Node harness (same seed twice → byte-identical;
  different seed → differs) and live UI (pin 1234 → regenerate → re-pin 1234 restores
  the exact name). Seed is a plain number the player can type, so realities are
  shareable/reproducible without any persistence.
- **No new easter egg.** The model in use (Opus 4.8) already satisfies the ledger's
  one-egg-per-model rule via KIN-1007; the ledger does not require a second. No
  ledger change.

## Phase 4 — Polish
- [x] Add polish to the game — stability arc built end-to-end: seeded glitch engine
  (`src/systems/glitch.js`; escalating foreign-paradigm swaps + terminology bleed +
  jitter at <75/<50/<25%) and the P0 Reality Outage at 0% (`src/views/RealityOutage.jsx`:
  cable-splice minigame → Blame Wheel → executive flash update → 100% restore).
  No fail state: splice timer expiry only reshuffles and narrates.
- [x] Every ticket, AI Prompt, and "recommendation" should be interactive —
  tickets: Resolve-ish (35% delayed betrayal-reopen), Escalate (−3% stability),
  Reassign, Attempt unblock (mostly refuses, diegetically); prompts: Field-test
  (authored/mode-aware outcomes); tips: Adopt (some restore +2–5%, some backfire);
  all via the optimistic seam so ~10% narrate their own rollback.
- [x] Add more content that's pulled from the other prototypes in the folder —
  fusion bank 8 → 17 (incl. the GOALS-canonical STAPLR-01 × visitor gate), new
  tickets (stapler SSO, sentient gateway, BGP toaster, conference-room hostage…),
  new prompts/tips mined from kindling/gemini/gpt samples, per-paradigm rec-engine
  personas (MTTR-9000 / saloon voice / Corporate Clarity Copilot).
- [x] Review and fix bugs in the game — Workstream E findings below (§4.5).
- [x] **Done-check:** game is polished and ready for release *(pending user sign-off)*
- [x] This is for Fable 5 specifically: your easter egg has 2 avenues… — both fused
  into the Federation Wormhole (see ledger in `CLAUDE.md`): breed the Document
  Retention Gate → live CARS STAPLED counter → coaching ×3 (each makes stapling
  faster — the betrayal) → wormhole overlay in Interpretive Networking's palette →
  stapled traceroute to the unnamed floor host (filed here as KIN-1007) →
  "Follow the route" falls through to the sibling cabinet.

## Phase 4.5 — Bug review / QA / regression (Workstream E)
- [x] Generation lint: 64,000 strings across 500 seeds through the real render
  paths (`viewFusion` mode 3 + `gen3Prompt`/`gen3Tip`/`gen3Outcome`) — 0 issues;
  determinism verified (same seed byte-identical, different seed differs).
  Only lint tweak: whitelist names legitimately starting with "iSCSI".
- [x] Regression sweep on the production preview: Mode 1 `GREENLIGHT Custodian`
  verbatim; Mode 2 `RESOLVER Marcus` woven across all three surfaces; Mode 3
  seed-1234 → `The Nonquorate BGP Confessor`, regenerate changes reality, re-pin
  restores exactly; disclaimer re-gates after reload; reload leaves only
  `misfire-itops-theme-v1` (display prefs only).
- [x] Full playthrough, console clean throughout (zero errors/warnings): all four
  ticket verbs incl. rollback + two live betrayal-reopens; field-test; adopt with
  both restore (+2/+3%) and backfire (−4%); glitch escalation observed at
  73/45/11% (2 → 5 → 9 swapped components, tumbleweed toast bleed); 0% outage →
  wrong-splice narration → six trunks → Blame Wheel ("Janet's hotel Wi-Fi") →
  100% + glitches clear; Opus 4.8 rot-reveal works (pointer-only flag button,
  signature ~legible); whisper fires exactly once per breed (earlier "duplicates"
  were console-reader artifacts across reloads — verified with a clean repro);
  Fable 5 wormhole: counter accelerates post-coaching (3 → 20), Remain closes and
  leaves a "Follow the stapled route" re-entry, Follow navigates (with a
  simulated `/playground/games/itOps/` path) to exactly
  `/playground/games/InterpretiveNetworking/interpretive-networking.html` —
  casing verified against disk; `[FABLE 5]` console line styled in the other
  cabinet's palette.
- [x] WCAG-contrast + overflow audit, all 6 paradigm×scheme combos, on every new
  Phase-4 surface (ticket action rows, rec cards, tips/prompts actions, outage
  alarm/splice/blame/report, CMDB gate card, wormhole overlay): one real fail —
  `.rec__engine` (persona label) used `--amber`, 4.25–4.37:1 in light schemes;
  moved to `--amber-hi`, now 6.63–11.71:1 across all combos. No horizontal
  overflow anywhere. **Audit-method note for future sessions:** the automation
  tab is backgrounded, and Chromium freezes CSS-transition clocks in hidden tabs
  — body was stuck mid-theme-transition, poisoning a whole audit pass with
  phantom failures. Inject `* { transition: none !important }` before stamping
  `data-theme`/`data-color-scheme` for measurements.
- [x] Production build clean (61 modules); preview = `Start-ItOps.ps1` flow
  (build + `vite preview` on 4173), which served the whole QA session.

### Phase 4.5 findings (flagged, not fixed — pre-existing, pre-Phase-4 surfaces)
- Priority/status badges (`.badge--P1/P2/P3`, in-progress/blocked/reopened/resolved)
  sit at 4.07–4.46:1 in several combos (worst: kindling/light) — marginally under
  AA 4.5 for their small text. Pre-date Phase 4; a token nudge would clear them.
- `.blocked-reason` (kindling/light 4.19:1) and the prompt category `.chip`
  (4.2:1 in kindling/dark + opspiral/light) — same class of marginal, same vintage.

---

## Session log
*(Append a line each session: date, what phase you touched, what's left.)*

- 2026-07-18 — Documentation only: approved a `localStorage` exception for the
  visual theme preference; gameplay and progression remain memory-only. Phase 0
  implementation is still untouched.
- 2026-07-18 — Phase 0: replaced the persistent OPSPIRAL sample shell with a
  memory-only React scaffold, isolated theme persistence, added all three
  paradigms in light/dark, added the stability header seam, and exposed a
  read-only seeded ticket feed. Production build and local preview health pass;
  browser visual/console verification remains before Phase 0 sign-off.
- 2026-07-18 — Phase 0.5: added persistent interface scaling and the approved
  machine-spirit reveal. Added `Start-ItOps.ps1`; its compiled preview serves
  generated JavaScript as `text/javascript` with no raw JSX or Vite dev client.
- 2026-07-18 — Documentation: added the model easter-egg ledger to `CLAUDE.md`
  and linked it from `AGENTS.md`. Codex and Gemini are confirmed in the current
  cabinet; Claude's KIN-1007 is recorded as reference-only.
- 2026-07-18 — Phase 0.5: Refactored visual scaling to remove global viewport `zoom` entirely, replacing it with a CSS variable `--font-scale` that scales font-sizes and primary container widths (`--sidebar-w`, `--topbar-h`, `.modal`, `.toast-stack`, etc.) proportionally. The scale multiplier maps to 0.5x (Tiny), 1.0x (Normal), 1.25x (Large), and 1.5x (Extra Large) text scaling, with container boxes expanding dynamically. Corrected component z-index overlays, increased contrast on all light/dark theme secondary text colors (`--text-low`) and Low Priority (`--p4`) badges for accessibility, added visible input focus outlines, updated scrollbar thumbs to use high-contrast theme-matching tokens, removed forced desktop single-column overrides (restoring side-by-side grids on wide viewports), added adaptive mobile grid wrapping at larger scales, integrated the Gemini model's RFC 2324 Breakroom Coffee Pot Controller easter egg (with a visible `[caffeine: 12%]` status button in the top bar and a custom `422 Lacking Context` error signed by Gemini 3.5 Flash), and started a local HTTP preview server on port 8000. Ready for user verification.
- 2026-07-18 — Easter-egg attribution: replaced the interface-level "Codex"
  credit with the specific model designation **GPT-5.6-sol (via Codex)**, as
  confirmed by the user's session settings. Updated both the reveal and ledger.
- 2026-07-18 — Phase 1 (Mode 1): implemented the predefined consequence-fusion
  mechanic. New `src/data/hybrids.js` holds an object registry + 8 predefined
  fusion pairs (each keeps a function from both parents). Added an inline
  "AI recommends" affordance on the ticket queue (`TicketFeed.jsx`): accepting
  breeds a hybrid into a new `data.cmdb` collection via the existing optimistic
  `mutate()` (so the ~10% simulated failure narrates its own rollback) and
  decrements the Reality Matrix meter by the fusion's cost on success — meter
  feedback only, no glitch swaps / no 0% minigame this phase. New CMDB bestiary
  view (`Cmdb.jsx`) + Operations nav item with a "N bred" badge; `cmdb` nav
  label added to all three paradigms. Fusion content authored once (OPSPIRAL
  voice); per-paradigm reskin deferred. Shipped the Opus 4.8 easter egg
  (KIN-1007 revenant — breed the backup + SAN controller pair) with a single
  `[OPUS 4.8]` console whisper; ledger updated. No gameplay persistence: cmdb +
  stability rebuild from seed on reload/reset. Verified in-browser end to end
  (fusion → CMDB → stability −cost → reload resets; egg whisper fires once; no
  console errors; Trophy Wall / Growth Registry nav labels reskin). Phase 1
  done-check passed. **Next:** Phase 1.5 usability pass, then Phase 2 (mode
  switcher) — do not start Phase 2 until 1.5 sign-off.
- 2026-07-18 — Phase 1.5 (Usability & Testing): ran a programmatic WCAG-contrast +
  horizontal-overflow audit of the new fusion/CMDB surfaces across all three
  paradigms × light/dark × 0.5×/1×/2× (pixel screenshots unavailable — automation
  tab was backgrounded, so `visibilityState:"hidden"` blocked the capture tool;
  drove and measured via the page-context JS channel instead). One real fix:
  raised the `.ticket-rec__toggle` label from amber to `--text-mid` (was 2.93:1 in
  tumbleweed/light, now ~6.3:1) while keeping the amber ✦ spark. Everything else on
  the new surfaces passes AA; no Phase 1 surface overflows. Flagged one
  pre-existing Phase 0 topbar overflow (theme-controls at ~1180–1430px widths) for
  a separate decision. No console errors. **Pending:** user sign-off on the 1.5
  done-check before Phase 2.
- 2026-07-18 — Egg enhancement (Opus 4.8, user's idea): the console-only reveal
  was too hidden, so the KIN-1007 ghost card now reveals visually. Its `unlisted`
  flag is a subtly-clickable `<button>` (cursor change only — no highlight, no
  tooltip); clicking rots the card open (`kin-rot` decay animation, reduced-motion
  fallback) and stamps in a `[OPUS 4.8]` signature at ~14.8:1 contrast. Wired in
  `src/views/Cmdb.jsx` + `components.css`; console whisper retained. Verified
  mechanism + legibility programmatically (flag is a no-tooltip button, click sets
  `is-revealed`, signature renders); the animation itself couldn't be watched
  because the automation tab was backgrounded (CSS animations throttle when
  hidden). Ledger in `CLAUDE.md` updated.
- 2026-07-18 — Phase 2 (Mode 2, partial mad-libs) + Phase 2.5 polish, per the
  user's "start Phase 2 but also do more with it and polish 1 & 2." New
  `src/data/madlibs.js` (4 curated noun slots + `interpolate` + "Surprise me"
  pools) and shared `src/components/ModeBar.jsx` (radiogroup Mode 1/2 toggle that
  reveals shared, live noun inputs). Mode + nouns added to `AppContext` as
  memory-only gameplay state (resets on reload). Mode-2 curated templates added to
  a subset of fusions (`hybrids.js` `mode2` + `viewFusion`/`viewHybridName`;
  `makeHybrid` now snapshots the personalized name/labels + `bornMode`), all
  prompts-worthy `AI_PROMPTS` (`prompt2`/`when2`) and tips (`body2`) — so the mode
  system applies to tickets, prompts, AND tips (the hard rule). ModeBar wired into
  all three views; CMDB shows a `MODE 2` tag on personalized hybrids. "Do more"
  (all three approved): live preview (incl. a live bred-name preview on rec
  cards), CMDB remembers custom names across a mode switch, and "Surprise me"
  curated filler + Clear. **Polish:** fixed the flagged Phase 0 topbar overflow
  (status truncates + clock hides ≤1430px) — no h-scroll at 1287px. Verified
  end-to-end in-browser: Mode 1 verbatim (regression-free), Mode 2 personalizes
  live across all three surfaces, bred names persist + tag, Surprise/Clear work,
  blanks fall back (never empty), reload resets everything (only theme persists),
  no console errors. WCAG AA passes on every ModeBar element across all 6
  paradigm×scheme combos. No new easter egg (Opus 4.8 already has KIN-1007; ledger
  requires one per model). **Pending:** user sign-off on the Phase 2.5 done-check
  before Phase 3 (Mode 3 / free-text / disclaimer / seeded RNG).
- 2026-07-19 — Phase 3 (Mode 3, full mad-libs). User signed off Phase 2.5 ("time
  for phase 3"). New `src/data/madlibs3.js`: Mulberry32 + per-item FNV-1a rng
  streams, ~25 free-text pools + a real-IT grounding pool, and templates for
  fusion name/rec/desc, prompt when/body, and tip body — one real IT noun per line.
  Threaded a `seed` param through `viewFusion`/`viewHybridName`/`makeHybrid`
  (`hybrids.js`) with a Mode-3 branch that generates surface copy while keeping the
  real parents + real inherited functions (fusion invariant intact). AppContext
  gained memory-only `seed` + `mode3Unlocked` (+ `SEED_SET`/`MODE3_UNLOCK`). ModeBar
  grew a third segment, a `Modal`-based disclaimer that gates first entry, and a
  Mode-3 panel with an editable seed + "Regenerate reality". Prompts/Tips branch to
  `gen3Prompt`/`gen3Tip` in Mode 3; CMDB shows a dashed `MODE 3` tag. Verified:
  build clean; 20,800-string generation lint across 400–500 seeds = 0 issues (fixed
  two grammar bugs first); determinism + regeneration confirmed in Node and live;
  disclaimer gates + re-gates after reload; Mode 3 spans tickets/prompts/tips; Modes
  1/2 regression-free (`GREENLIGHT Custodian` verbatim, `RESOLVER Marcus`
  personalized); bred Mode-3 monster snapshots its generated name; reload wipes
  mode/seed/unlock/CMDB (only the theme key persists); no console errors. No new
  easter egg (Opus 4.8 already has KIN-1007). **Pending:** user sign-off on the
  Phase 3.5 done-check before Phase 4 (polish).
- 2026-07-19 — Terminology: retired "mad-libs" per the user (it implied the game
  prompts the player for parts of speech, which Mode 3 does not — the player only
  sets a seed). Mode 3's player-facing label is now **SYNTHETIC** (triad reads
  PREDEFINED / PERSONAL / SYNTHETIC); the umbrella term is "the content-mode
  system." Renamed the two engines `madlibs.js`→`personalize.js` and
  `madlibs3.js`→`synthesize.js` (exported function names unchanged) and fixed all
  imports. Reworded the Mode-3 tooltip/hints/disclaimer ("word pools", "you set the
  seed, the machine writes the words") and swept comments + the spec docs
  (`GOALS.md`, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`). No mechanic/RNG/seed/fusion
  changes. Dated log lines above keep their original filenames as a historical
  record. Verified: build clean, generation lint still 0 issues on the new paths,
  and the segment reads MODE 3 · SYNTHETIC in-browser. **Pending:** unchanged —
  user sign-off on the Phase 3.5 done-check before Phase 4.
- 2026-07-19 — Phase 4 (Polish), all five workstreams. A: mined the reference
  builds into the data files (fusions 8→17 incl. the canonical stapler×gate,
  new tickets/prompts/tips, per-paradigm rec-engine personas, richer failure
  excuses). B: full-depth interactivity — ticket verbs (Resolve-ish with 35%
  delayed betrayal-reopens, Escalate, Reassign, Attempt unblock), prompt
  Field-tests, tip Adopts with restore/backfire, all through the optimistic
  rollback seam, mode-aware incl. new Mode-3 outcome templates. C: seeded glitch
  engine (`src/systems/glitch.js`) with three escalation bands + the P0 Reality
  Outage at 0% (`src/views/RealityOutage.jsx`: cable splice → Blame Wheel →
  flash update → 100%). D: the Fable 5 Federation Wormhole egg
  (`src/components/Wormhole.jsx` + gate mechanics in `Cmdb.jsx`), fusing both
  offered avenues; ledger updated in `CLAUDE.md`. E (this session, resumed
  after the previous one hit its usage limit): 500-seed/64k-string generation
  lint clean; full regression sweep of every prior done-check; complete
  playthrough with zero console errors; 6-combo WCAG + overflow audit — one
  real fix (`.rec__engine` → `--amber-hi`), pre-existing badge/chip marginals
  flagged in §4.5 findings; crossover casing verified against disk. Rebuilt
  dist. **Pending:** user sign-off on the Phase 4 done-check; release wiring
  into `games-index.html` stays explicitly out of scope per the plan.

- **2026-07-19 (later)** — Post-QA refinement at the user's request: the
  Federation Wormhole overlay now carries a tactful in-fiction Fable 5
  signature — the stapled traceroute's hop-4 asset record reads
  `builder of record: FABLE 5` / `last verified: by the host itself. nightly.
  in light.` — plus one added body sentence leaning further into the ghost
  host. Deliberately rhymes with the ghost's Morse signature in Interpretive
  Networking without decoding it; that discovery stays in the other cabinet.
  Files: `src/components/Wormhole.jsx`, CLAUDE.md easter-egg ledger updated in
  the same change. Rebuilt dist (`index-DxTxZSGy.js`); full egg path re-run in
  the browser — breed → coach ×3 → overlay renders new lines with no overflow,
  console whisper fires once, no errors, Remain closes cleanly.

- **2026-07-19 (later still)** — Second Fable 5 easter egg, user-proposed and
  plan-approved: **the Post-Incident Structural Certification.** Surviving a
  P0 Reality Sync Outage issues a small INSPECTED stamp beside the
  REALITY_MATRIX meter; clicking opens a deadpan inspection certificate ruling
  the zip tie decorative, the coffee pot morale-bearing, the scaffold daemon
  "bolted to the building," and the building itself — reality matrix, glitch
  containment, outage recovery — stamped ENGINEER OF RECORD: CLAUDE FABLE 5
  (full name on the formal field per the user's "model's choice" offer; snark
  signature stays `[FABLE 5] — structural, apparently`). One console line,
  first open only. Session-only; degrades to nothing if 0% is never reached;
  GPT's machine-spirit and Gemini's coffee pot untouched and re-verified
  working. Files: new `src/components/Inspection.jsx`, one-line render in
  `Topbar.jsx`, `.inspect-stamp`/`.inspect-cert` in `components.css` (hidden
  on the narrow breakpoint alongside the caffeine chip), CLAUDE.md ledger row
  added. Verified live: no stamp pre-outage, full drain → outage arc → stamp →
  certificate (no overflow, 13–16:1 contrast both schemes), single console
  whisper across two opens, Escape/footer both close, reload resets
  everything. Rebuilt dist (`index-tZyx1dlI.js`).
  - *Fix (same day):* the certification modal rendered inside `<header>`, whose
    containing block clipped the fixed scrim (window popped up half cut off,
    user-reported). Now portaled to `document.body` via `createPortal` in
    `Inspection.jsx` — verified pixel-identical scrim geometry to the coffee-pot
    modal. Rebuilt dist (`index-BXGjyDBA.js`).

- **2026-07-30** — Release packaging only; **no gameplay, mechanic, content, or
  style changes**. The cabinet's playable page is now `itops.html` at the
  folder root, matching the sibling convention
  (`InterpretiveNetworking/interpretive-networking.html`). Rationale: the repo
  has no CI, so Pages serves committed files as-is and the built page has to be
  committed. Changes: `vite.config.js` gains `base: './'` (absolute `/assets/`
  would 404 under `/playground/games/itOps/`); new `scripts/release.mjs` copies
  `dist/index.html` → `itops.html` and `dist/assets/` → `assets/`, wiping
  `assets/` first so content-hashed bundles can't accumulate; `npm run build`
  now runs both steps so the committed cabinet can't go stale. Root
  `index.html` is unchanged and stays the Vite **dev** entry — it points at raw
  `/src/main.jsx` and can never work on Pages. Added `.gitignore`
  (`dist/`, `node_modules/`, `*.zip`, `.claude/settings.local.json`), which
  drops the would-be commit from ~2,500 files to 55. Verified: build clean,
  asset hashes unchanged from the 2026-07-19 build (confirming source is
  untouched), and `itops.html` loads at a simulated Pages subpath
  (`/games/itOps/itops.html`) with both assets 200 and zero console errors.
  **Pending:** unchanged — user sign-off on the Phase 4 done-check.
  `games-index.html` wiring is still not done; the card would point at
  `itOps/itops.html`.

- **2026-07-31** — Sonnet 5 (via Claude Chat) easter egg, user-requested. Added
  the architect's egg to `src/App.jsx`: a module-level `sonnetAnnounced` guard +
  a single `console.log` fired once from the root component's mount effect,
  before the login screen and regardless of auth state. No in-fiction character,
  no gameplay hook, no persistence — deliberately different in kind from every
  other egg in this cabinet, all of which are found by playing. GOALS.md and
  CLAUDE.md are the source of truth every other model's egg builds against
  without exception; this line is that source signing itself, the same way the
  user asked everyone else to sign theirs. Styled distinctly (blueprint blue on
  near-black) from Opus 4.8's amber whisper and Fable 5's mint-on-black. CLAUDE.md
  ledger updated in the same change. Verified: string present intact in the built
  bundle (`Get-Content -Raw` + `IndexOf`, since the minified file defeated a naive
  `Select-String` line match); `npm run build` clean (62 modules); rebuilt dist +
  released `itops.html`/`assets/` (new bundle `index-CYzlVwEf.js`, CSS hash
  unchanged). Did not touch any other model's egg. **Pending:** unchanged — user
  sign-off on the Phase 4 done-check; arcade wire-in stays out of scope.

- **2026-08-01** — Arcade wire-in, user-requested (ends the deferral repeated
  in every prior entry above). Added `games-index.html`'s fifth card
  (`#card-itops`, index `05`, linking to `./itOps/itops.html`) with a bespoke
  `.itops-preview` (blinking incident-LED ticker line), matching the existing
  four cards' markup/CSS conventions exactly. Added the cabinet's first way
  to leave: a shared `src/components/ArcadeExit.jsx` (`← Arcade` link to
  `../games-index.html`), rendered from both `Topbar.jsx` (post-login) and
  `Login.jsx` (so a visitor isn't forced through the fake SSO just to back
  out). Also added a second, bonus easter egg — **Sonnet 5, via Claude
  Code** — distinct from the existing Sonnet-5-only rows on the ledger
  (footer sigil, boot-log): a toast crediting both the model and the harness
  that did this round's wiring, fired from `ArcadeExit.jsx` on click before a
  ~900ms-delayed navigation (so the toast is visible before the SPA
  unloads). CLAUDE.md ledger updated in the same change. **Pending:** user
  sign-off on the Phase 4 done-check remains open; nothing else deferred.

- **2026-08-01** — Portfolio-wide favicon metadata update. Added the shared
  `favicon/RosettasKeysLogoFavi2-512x402.png` icon to the Vite source entry and
  ran `npm run build`, which released the hashed favicon asset alongside the
  refreshed `itops.html`. No gameplay, content, styling, or phase behavior
  changed. Build clean (63 modules); the Phase 4 sign-off remains pending.
