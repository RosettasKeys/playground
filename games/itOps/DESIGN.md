# Misfire Arcade Slot 5 — Architecture & Theme Contract

This is the implementation contract for the Franken-merged ITOps cabinet. The
OPSPIRAL notes later in this file are retained as historical salvage guidance;
they do not override `GOALS.md`, `CLAUDE.md`, or this current architecture.

## Phase 0 architecture

The cabinet is a Vite + React 18 single-page application. There is no router and
no backend. View changes are reducer actions, so later mechanics can inspect and
affect navigation without coordinating with URL state.

| Layer | Owner | Lifetime | May persist? |
|---|---|---|---|
| Visual paradigm, light/dark, and interface scale | `src/theme/ThemeContext.jsx` | Across reloads | Yes — sole `localStorage` exception |
| Auth persona and active view | `src/store/AppContext.jsx` | Current page load | No |
| Tickets, prompts, tips, incidents, settings, CMDB, modes, RNG, and stability | `src/store/AppContext.jsx` | Current page load | No |
| Latency and failure simulation | `src/api/fakeApi.js` | Per request | No |
| Authored baseline content | `src/data/seed.js` | Rebuilt on load/reset | Source only |

`ThemeProvider` wraps `AppProvider` in `src/main.jsx`. This is intentional: theme
is a device-level display preference, while everything inside `AppProvider` is a
disposable playthrough. Do not merge the providers or serialize `AppContext`.

The fake API is an asynchronous boundary, not storage. It waits 300–800 ms,
rejects roughly 10% of eligible mutations, and lets `AppContext.mutate()` restore
its pre-mutation snapshot. Reloading always rebuilds seed state and returns to
the fake login.

## Phase 0 surface

- Fake authentication accepts any credentials and never persists the session.
- The responsive shell owns the sidebar, sticky status header, seeded dashboard,
  ticket queue, prompt library, efficiency tips, and settings/theme laboratory.
- `[REALITY_MATRIX_STABILITY]` is present in the header at 100%. The state seam
  exists now; degradation, component glitches, and the outage minigame remain
  later-phase behavior.
- Content-mode controls, fusion actions, the CMDB/bestiary, and minigames must
  not be activated during Phase 0.
- The older War Room and ticket-mutation modules may remain in the source as a
  salvage bank, but the Phase 0 navigation must not expose later gameplay.

## Theme contract

Every theme uses the same DOM and component tree. `ThemeContext` sets three
attributes on `<html>`:

```html
<html data-theme="opspiral|tumbleweed|kindling"
      data-color-scheme="light|dark"
      data-text-scale="0.5|1|2|3">
```

Components consume semantic CSS tokens; they must not import theme-specific
stylesheets or branch into separate theme components. The stable token vocabulary
is:

- surfaces: `--bg-abyss`, `--bg-console`, `--bg-rack`, `--bg-rack-hover`
- borders/text: `--border*`, `--text-hi`, `--text-mid`, `--text-low`
- accent: the historically named `--amber*` variables, semantic across themes
- status: `--p1` through `--p4`, `--ok`, and their glow variants
- typography/shape: `--font-sans`, `--font-mono`, `--font-display`, `--radius*`
- shell utilities: `--sidebar-bg`, `--scrim`, shadows, and layout dimensions

The paradigms deliberately diverge:

- **OPSPIRAL:** charcoal/amber NOC, technical sans + mono, rack LEDs, compact
  corners and machine-status language.
- **TUMBLEWEED:** ledger paper/saloon wood, terracotta accent, serif-forward type,
  squared hardware, and frontier service-desk terminology.
- **KINDLING:** lavender/teal employee-success console, rounded UI, softer type,
  pills and HR-euphemistic terminology.

Each paradigm has independently tuned light and dark tokens. Theme changes may
alter presentation and interface terminology, but never data identity or reducer
shape. Later divergent ticket/prompt/tip copy should be produced by a content
adapter keyed by paradigm—not by duplicating session state.

The persisted payload is exactly `{ paradigm, scheme, textScale }` under
`misfire-itops-theme-v1`. No other module may call `localStorage`. Invalid saved
values fall back to OPSPIRAL, the operating-system color preference, and 1×
interface scale. At 2× and 3× the shell uses its drawer layout regardless of
viewport width so enlarged controls retain usable space.

## Future extension seams

- Add content modes to a dedicated generation domain; do not overload theme.
- Keep seedable RNG state in memory and pass the generator into content builders.
- Model fusions as objects with both parent IDs and recognizable inherited
  functions, then append them to an in-memory CMDB collection.
- Drive reality degradation through reducer actions. Theme glitches should add
  scoped component-level data attributes while leaving the user's selected base
  paradigm intact.
- A stability value of zero activates an in-memory outage state; successful
  minigame completion restores it. Neither value persists.

---

## Historical appendix — OPSPIRAL sample handoff

One of ~10 variants of the "Unhinged and Deranged Task Manager for ITOps" concept,
built for a convergence/merge. This file exists so a future session (any model, any
directory, zero context) can absorb this variant without spelunking the source.

## Run it

```
npm install
npm run dev    # http://localhost:5173
```

The original sample had no backend and stored its full state in `localStorage`
(`opspiral-state-v1`, session in `opspiral-session-v1`). That persistence has
been removed from the merged architecture. The sample's latency, rollback,
content, and polish remain useful salvage material.

## Non-negotiables (from the original brief)

- The **"Recommended Unhinged AI Prompts"** and **"Unhinged Efficiency Tips"**
  sections stay. Content lives in `src/data/seed.js` (`AI_PROMPTS`, `EFFICIENCY_TIPS`).
- **No "wild wild west" framing.** The theme is real ITOps chaos: a P1 chased across
  four time zones, Slack that won't stop pinging, a "resolved" ticket reopened three
  times this week, a field tech who cut the wrong fiber having read neither the ticket
  nor the cable map, a 71-hour outage, one tornado.
- Every element carries a genuinely useful description (nav subtitles, stat-card
  explanations, field hints, `title` tooltips on all buttons/badges). No vague labels.

## Aesthetic: "NOC at 3 AM"

Deliberately NOT the green-on-black terminal cliché. Tokens in `src/styles/tokens.css`.

- **Surfaces**: `#101318` page → `#161b22` card → `#1d242e` raised. Borders `#2a333f`.
- **Brand accent**: amber `#f5a623` (a warning wall, a pager, a sodium lamp). Used for
  eyebrows, active nav, primary buttons, focus rings.
- **Priority ladder**: P1 `#f0564f` (burns) · P2 amber · P3 `#4cb8df` · P4 `#7a8798`
  (barely registers). Success `#3fc98f`.
- **Type**: IBM Plex Sans (UI) + IBM Plex Mono (anything a machine said: IDs,
  timestamps, stat values, eyebrows). Google Fonts link in `index.html`.
- **Signature motif**: rack-equipment status LEDs (`.led` in `base.css`) — pulse on
  P1 tickets, blink on active incidents, steady green when (allegedly) fine. Used in
  nav, topbar, stat cards, tickets, timelines, toasts.
- **Section eyebrows** styled like cable labels: mono, uppercase, wrapped in `[ ]`.

## Architecture

Vite + React 18, JSX, no router (view switching in store), no UI framework, no deps
beyond react/react-dom.

- `src/store/AppContext.jsx` — Context + reducer. `mutate(updater, msgs)` is the
  **optimistic-update engine**: apply to state instantly → `api.persist` → on reject,
  restore snapshot + error toast.
- `src/api/fakeApi.js` — 300–800 ms latency, **10% simulated failure** with rotating
  excuses ("It is probably DNS. It is always DNS."), localStorage persistence, fake
  auth (any credentials accepted).
- `src/data/seed.js` — all demo content: 18 tickets, 3 incidents (timelines +
  escalation chains + Slack-pings-suppressed counters), 10 activity entries, 4-zone
  on-call roster, 5 team personas, 8 AI prompts, 12 tips. Timestamps generated
  relative to load time so the queue always looks freshly abandoned.
- Views in `src/views/`: Login (SSO-is-down bypass button), Dashboard (stat cards,
  fire banner, activity feed, on-call), Tickets (full CRUD, filters, search, reopen
  counters, blocked reasons), WarRoom, Prompts (copy-to-clipboard), Tips (category
  filter), Settings (stateful toggles + demo reset).

## Polish inventory (what to preserve in a merge)

- Skeleton loading states on every view (visible thanks to fake latency).
- Two distinct designed empty states in the queue: filters-matched-nothing vs.
  queue-actually-empty ("THE QUEUE IS EMPTY… Savor it: entropy is already dialing.").
- Toasts for every mutation outcome, including rollback with the backend's excuse.
- Responsive: sidebar → overlay drawer under 900px, ticket rows restack under 620px,
  no horizontal scroll at 420px. `prefers-reduced-motion` respected; focus-visible
  styling; modals close on Escape/scrim.
- Topbar: four-time-zone clock + live incident status LED.

## Known quirks

- `vite.config.js` ignores `**/*.zip` in the watcher — a locked archive dropped into
  the project root once crashed chokidar (EBUSY) and took the dev server down.
- Reopen counter increments only via the Reopen action; seed data ships with Janet's
  VPN ticket at ×3, as history demands.
