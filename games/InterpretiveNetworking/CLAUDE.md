# CLAUDE.md — Layer .5: An Interpretive Networking Toy

> This file is read automatically at the start of every Claude Code session in this
> repo. It is the full brief — you shouldn't need anything re-explained. Work through
> the Build Phases in order and check in with the user at each checkpoint marked
> **STOP**. Don't skip ahead to later phases even if they seem straightforward.

## 1. What this is

A single-page, client-side-only browser toy based on a running in-house joke:
"Interpretive Networking" — a fictional Windows Server protocol that turns
motherboard ARGB LED controllers into a real network layer, live-migrating VMs
by blinking chassis lights at ~9600 baud.

This is going into a personal portfolio, as a new card alongside existing pieces
like a gravity-well toy and a pressure-fracture toy. It should read the same way
those do: a small, self-contained, slightly deranged interactive sandbox — not a
full "game" with menus, levels, or win/lose states.

**The joke is the point.** Every mechanic below exists to make the joke funnier by
turning it into a real (if silly) system, not to build a deep game. If an
implementation idea would take more than a paragraph to explain why it's fun,
it's probably over-engineered — cut it back.

### 1.1 Where this lives in your repo

This project is unrelated to `antivoid.html` (a separate, still-in-progress
experiment elsewhere in the user's `webApps` folder) — don't try to merge or
reconcile the two. Actual location:
`webApps/portfolio/games/InterpretiveNetworking/`. Claude Code reads
`CLAUDE.md` files hierarchically, so a folder-level `CLAUDE.md` higher up
(general conventions, referencing prior pieces like `antivoid.html`) and this
project-level one both apply together automatically — no conflict by default.
Where the two do disagree (this project allows splitting into multiple
files, which is looser than the folder-level default), **this file takes
precedence for anything inside this project's own folder.**

The portfolio's structure is: a main landing page → category landing pages
(e.g. a "games" index) → individual pieces. A `games-index.html` for this
category doesn't exist yet and is a separate, later piece of work — likely
built with a different tool, not this session. **Don't build or wire up any
index/landing page as part of this project.** Just deliver the standalone
toy; it'll get linked in from wherever the games index ends up once that
exists.

## 2. Non-negotiable constraints

- **No API keys of any kind embedded in client-side code.** This repo is public
  and forkable — a key sitting in plain JS is a leaked key the moment it's
  pushed. This applies most of all to AI provider keys (Claude, Mistral, GPT,
  etc.): don't design any feature that would need one baked in (a live "AI
  Sysadmin," a real chat-completion call, anything like it). There's no server
  here to hide a key behind, so this isn't a "be careful with it" — it's a hard
  no, regardless of how the feature is framed.
- **No paid or proprietary external resources** (no paid fonts, paid CDN
  libraries, paid APIs). Free-to-use CDN resources (Google Fonts, cdnjs, etc.)
  are fine — this isn't a cost/security issue like the API-key rule above, it's
  about not introducing anything that requires payment to use or host. Soft
  rule either way: flag it back to the user if a specific library, free or
  paid, seems worth the tradeoff.
- **Non-AI, no-auth, free public API calls are permitted in principle** if a
  future feature genuinely needs one (e.g. a public data endpoint that needs no
  key). Nothing in this v1 design requires one — treat this as a door left open
  for later, not something to reach for now. If a design decision seems to call
  for one mid-build, flag it back to the user rather than adding it unprompted.
- **File structure is flexible.** A single HTML file with inline CSS/JS is the
  simplest default, but splitting into companion `.css` / `.js` files
  alongside the `.html` is equally fine if that produces cleaner code — Fable
  5's judgment call. Either way: no build step, no `npm install`, no bundler.
  Files should open directly in a browser or deploy as-is to GitHub Pages with
  zero setup.
- **No fail state.** This is a sandbox with light scoring, not a game with a
  loss condition. Nothing should ever produce a hard "Game Over."
- **No precision-timed audio.** Simple one-shot sound effects via the Web Audio
  API are fine (a blip, a scratch, a hum). A beat-matched rhythm-game engine is
  explicitly out of scope — see Non-Goals.

## 3. Source material & tone

The bit, in short: a decommissioned server's chassis lights kept "transmitting"
after the network cable was pulled, and the joke escalated across several AI
conversations into a full fake RFC, a fake CVE, a fake NIST control table, and a
fake incident post-mortem. The user has all of this documented; the flavor text
below is pulled directly from it and can be reproduced verbatim (it's the user's
own material, not third-party content).

Tone: deadpan technical writing describing something absurd. Corporate
incident-report voice, not slapstick. The comedy comes from the systems taking
the bit completely seriously.

## 4. Design spec

### 4.1 The core chaos model

A rack of nodes — **5 columns × 4 rows = 20 nodes**, rendered as a simple front-
elevation grid (stacked rectangles, like 1U server bays), not isometric. Keep the
rendering approach simple: CSS Grid + `box-shadow` glow per node, or a single
`<canvas>`. Don't build a 3D or isometric renderer — it adds real complexity for
no comedic payoff.

Each node has:
- a **lighting profile** (see 4.2)
- a **throughput value** (0–100)
- a **blocked** flag (Post-it note covering it)

Each tick (every ~200ms is a reasonable default, tune by feel):
1. Each node's throughput moves toward its profile's base value.
2. **Cross-talk**: each node's throughput is nudged slightly toward the average
   of its grid neighbors. This diffusion step *is* cross-talk — no separate
   system needed, it falls out of the model for free.
3. Blocked nodes contribute 0 regardless of profile.
4. Random chaos events roll on a timer (see 4.4).

### 4.2 Lighting profiles

Player can cycle each node's profile (click to cycle, or a small picker):

| Profile | Base throughput | Cost/tick | Notes |
|---|---|---|---|
| Static Solid | 0 | lowest | "Jitter" — flattens bandwidth to zero |
| Pulse | medium | low | the safe default |
| Rainbow Wave | high | medium | |
| Strobe | high, volatile | medium-high | spikes and dips randomly |
| Sandstorm.config | highest | highest | best throughput, worst cost & cross-talk |

### 4.3 Player actions

- **Click a node** → cycle its lighting profile.
- **Click a blocked (Post-it) node** → clears it.
- **Spacebar → Goth Admin workaround**: instantly sets every node to
  Static Solid / `#000000`, throughput drops to exactly 0, cost-per-tick drops
  to 0, screen briefly flashes near-black, ticker prints something like "Goth
  Admin engaged — throughput zeroed, technically HIPAA compliant now." Profiles
  do **not** auto-restore after — the player has to manually re-rave the rack.
  This is a deliberate design choice (keeps stakes light but real); feel free to
  flag if it feels wrong once it's playable.

### 4.4 Chaos events (fire on a random timer, roughly every 8–15s)

- **Post-it blocker** — a random node gets `blocked = true` until clicked.
- **Denial of raving** — all throughput zeroed for ~4 seconds, room-wide.
- **Jitter** — a random node is forced to Static Solid; player has to notice
  and fix it.
- **Cross-talk spike** — temporarily increase the diffusion strength for a few
  seconds, with a visible lime-green pulse across affected nodes.

Don't add more event types than this for v1. Four is enough to keep it lively
without needing a whole event-authoring system.

### 4.5 Scoring (light, background, never a fail state)

Two running numbers, always visible:
- **Throughput** — live sum/average across active nodes. Render as a number
  plus a small rolling sparkline (a simple SVG `<polyline>` updated each tick is
  enough — no charting library).
- **Layer 8 (Financial)** — a cumulative cost counter that increases each tick
  proportional to which profiles are active. Flashier profiles cost more. This
  is flavor-as-scoreboard: there's no target, it's just "look how much this is
  costing now."

### 4.6 Incident ticker

A scrolling text log (bottom of screen, terminal-style) that prints a line
whenever something happens, plus rotates through ambient lines every ~6s if
nothing else is going on. Seed pool (reuse verbatim, add more in the same voice
if it helps):

```
If the link light isn't raving, the route isn't active.
Post-it note detected blocking line-of-sight.
Denial of raving in progress.
Cross-talk: lime-green noise bleeding into the routing table.
Jitter detected — bandwidth flattened to zero.
Epilepsy Exploit: flash photography now constitutes unauthenticated RCE.
Strobotage detected: laser pointer injecting packets via window.
Color-Based Privilege Escalation: neon vest read as kernel override frame.
Layer 8 Financial: client asking about the $400 Corsair invoice.
Vaporwave decode: hex colors reassembling into ASCII.
Goth Admin engaged — throughput zeroed, technically HIPAA compliant now.
```

Tie specific lines to specific events where it's easy (e.g. print the Post-it
line when a Post-it event fires) and let the rest rotate ambiently. Don't build
a whole rules engine for this — a simple weighted-random pick is enough.

### 4.7 Model signature (easter egg)

A small, discoverable nod to which model built this, in the same voice as the
rest of the doc trail's "The Tell" convention (every fake artifact in the
source material has one technical detail that gives away it's fiction, if you
look closely). Default implementation — and the whole scope of it for v1 — is
a single hidden HTML comment near the top of the source:

```html
<!-- Layer .5 built by Fable 5. If you're reading this in view-source,
     congratulations — per RFC 9999's own security section, you've just
     achieved line-of-sight. -->
```

That's it. No UI treatment, no in-game reveal, no click-to-discover mechanic —
the comment is the whole joke, and it costs nothing to build. If it turns out
to be worth surfacing in-game later (e.g. a rare incident-ticker line), that's
a fine idea for a future pass, not part of this build.

## 5. Visual style

### 5.1 Ask the user first

**STOP before finalizing palette/typography.** The user has a reference
screenshot of the existing portfolio card style (from the gravity-well /
pressure-fracture pieces) that they weren't able to paste into the planning
conversation. Ask them for it directly (or for a description of palette/type/
layout) before locking in colors and fonts, so this new card matches the rest
of the portfolio.

### 5.2 Default direction (use if no reference is provided)

Dark rack-and-terminal aesthetic:
- Near-black background (`#0a0a0a`-ish), monospace font throughout.
- Each node: small rectangle, `box-shadow` glow colored by its active profile
  (e.g. warm orange/red for Static, cyan-green for Pulse, full hue-cycle
  gradient for Rainbow Wave, high-contrast flicker for Strobe).
- Subtle CRT scanline overlay via a `repeating-linear-gradient` pseudo-element
  — cheap, no library needed.
- Ticker styled like a terminal log line, monospace, slightly dim.

### 5.3 Portfolio integration

This build is a standalone destination page (e.g. `interpretive-networking.html`
or split into companion files) — it does not need to link to or be linked from
anything else. No games-category index page exists yet; that's separate,
later work, likely not built in this session. Don't invent or assume any
linking structure — just deliver the toy itself.

## 6. Tech stack & file structure

- Simplest default is one HTML file with inline `<style>`/`<script>`;
  splitting into companion `.css` / `.js` files next to it is equally fine if
  that produces cleaner code. Either way, no external `<link>` or `<script
  src>` tags pointing off-disk.
- Rendering: CSS Grid + DOM elements per node, or a single `<canvas>` — pick
  whichever is simpler to implement cleanly; don't mix both.
- Web Audio API is fine for short one-shot SFX (success blip, event alert,
  Goth Admin thump). No music, no beat-matching.
- No `localStorage` needed for v1 (there's nothing worth persisting across
  sessions — it's a sandbox, not a save-file game). If a later version wants a
  high-score-style persisted stat, that's fine to revisit then.

## 7. Build phases (work through in order; STOP = check in with user)

1. **Static scaffold** — grid of 20 nodes rendered, no logic yet. Confirm the
   default visual direction looks right before wiring up mechanics. **STOP.**
2. **Core tick loop** — profile base values, diffusion/cross-talk, blocked
   nodes. Get the rack "breathing" with no chaos events yet.
3. **Player actions** — click to cycle profile, click to clear Post-it,
   spacebar for Goth Admin.
4. **Chaos events** — all four event types on their random timers.
5. **Scoring** — throughput readout + sparkline, Layer 8 cost counter.
6. **Incident ticker** — seeded line pool, event-tied + ambient rotation.
7. **Visual polish pass** — apply the real portfolio palette/type once the
   reference is in hand. **STOP before this phase if the reference hasn't been
   provided yet.**

There is no "wire into the portfolio index" phase for this build — no games
index exists yet, and hooking this in is separate, later work.

## 8. Definition of done

- Opens with no console errors and no unexpected network requests (check the
  network tab — should be empty apart from loading the page's own files).
- All four chaos events fire and are recoverable through player action.
- Goth Admin workaround works, ticker announces it, profiles don't auto-restore.
- Throughput and Layer 8 cost are both visibly live and update every tick.
- Runs indefinitely with no fail state or dead end.
- Visually consistent with the rest of the portfolio (once reference provided).
- Hidden model-signature comment (section 4.7) is present in the source.

## 9. Explicit non-goals (do not build these)

- Multiple game modes (no separate campaign/puzzle/management-sim modes).
- A rhythm-game / beat-matched timing engine.
- Procedural rack layout generation.
- Hidden unlockable modes, achievements systems, or a meta-progression layer.
- Any CDN-hosted library or resource that requires payment to use or host
  (GSAP, paid fonts/icon packs, etc.) — free-to-use CDN resources are fine
  per §2.
- Any feature that calls out to an AI API (Claude, Mistral, GPT, or otherwise)
  — there's no backend to hold a key, so this isn't buildable safely in a
  public static repo no matter how it's pitched (e.g. Mistral's "hidden AI
  Sysadmin" idea — fun concept, wrong hosting model for it).
- A win/lose condition of any kind.

If something outside this brief seems worth adding, flag it to the user as an
idea rather than building it — this file is meant to be the complete v1 scope.

# CLAUDE.md Addendum — Repositioning + Stakes Mode

> Patch to the existing CLAUDE.md, not a replacement. The build has already
> drifted past the original v1 brief (CVSS readout, TikTok reenactment/RMA
> flow, blanket + vaporwave tripod interactions, theme toggle) — this
> addendum layers on top of wherever the current file sits. Reconcile by
> hand rather than overwriting; the existing phased structure and STOP
> checkpoints still apply.

## 1. Repositioning

This is now the **first entry in a new "games" section** of the portfolio,
not another card in the toy lineage (gravity well, pressure fracture). A few
lines in the current brief were written for the old framing and are now
stale:

- Drop "Toy" from the title if it still reads as `Layer .5: An Interpretive
  Networking Toy`. It's just `Layer .5` (or whatever title Fable 5 has
  settled on) now.
- The line stating this is *"not a full 'game' with menus, levels, or
  win/lose states"* no longer holds — see Stakes Mode below. Replace with
  language pointing at section 2.
- The games-category index page is still explicitly out of scope for this
  build (per earlier note) — no change there. The repositioning affects
  framing/tone, not this build's file scope.

## 2. Two modes: Sandbox (default) and Stakes Mode (toggle)

The toy still opens in **Sandbox mode** exactly as currently built — no
fail state, throughput + Layer 8 cost meter running lightly in the
background. **Stakes Mode is an explicit opt-in toggle**, not a replacement.
Nothing about existing sandbox behavior should change except the two
additions below.

### 2.1 Sandbox mode additions (light-touch, still no ending)

**Raving Streak**
- A combo multiplier that builds for every consecutive tick all 20 nodes
  are simultaneously "raving" (lit/active, any profile).
- Breaking the streak (any node goes dark/blocked/jittered) resets the
  multiplier to 1x — no penalty beyond that, no game over.
- Display: small multiplier readout near the existing throughput number.
  Keep it understated; this is garnish, not a new HUD system.

**Incident Log**
- A collectible/checklist panel (toggle open/closed, doesn't need to be
  visible by default) tracking whether the player has triggered each
  known chaos type at least once this session:
  - Post-it blocker
  - Denial of Raving
  - Jitter
  - Cross-talk spike
  - Melted node / RMA event
- Styled like the existing fake-documentation family (CVE writeup, NIST
  table) — think a redacted-looking checklist, not a generic achievements
  UI.
- Optional stretch, not required for v1 of this addendum: on 100%
  completion, surface "The Tell" comment in-game instead of leaving it
  purely as a view-source easter egg (e.g. one line added to the incident
  ticker). Only do this if it's a small, low-risk addition — if it starts
  requiring new plumbing, skip it and leave the hidden comment as-is.

### 2.2 Stakes Mode (toggle)

A separate, clearly-labeled toggle (e.g. a switch near the theme toggle)
that turns on real consequences. When off, behavior is identical to
Sandbox mode described above and in the base CLAUDE.md.

**Trigger condition** (pick whichever is cleaner to implement against the
existing meters — don't build a new one):
- Layer 8 Financial cost meter crosses a set threshold, OR
- Cumulative downtime (nodes non-raving) crosses a set duration.

Either is fine; a combined "whichever comes first" is also fine. Keep the
threshold tuning simple — a constant near the top of the file, not a
difficulty curve.

**The ending**
- On trigger, the game freezes and assembles a short, auto-generated
  incident report using the session's actual event history — which chaos
  types fired, roughly how long they ran, and the final cost meter value.
- Voice/format: match the existing Sev-1 post-mortem doc (Trigger / Root
  Cause / Discovered Exploits style sections), not a generic "GAME OVER"
  screen. This should read like the fourth document in the same fake-doc
  family, personalized to that playthrough.
- Recovery: a single button labeled something like "File exception — CISO
  approval + Finance waiver," lifted from the NIST doc's Exception
  Process line. Clicking it resets state and returns to Sandbox mode.

## 3. Content-domain note (re-flagged)

Restating this explicitly since the game framing raises the stakes on it:
all CVE/CVSS/NIST-control/exploit-style content in this project is
satirical flavor text for a browser UI toy — not security tooling,
guidance, or documentation of a real vulnerability. If Claude Code's
safety classifiers flag anything cybersecurity-adjacent (the CVSS vector
string, the "exploit" names, the control table) and the session falls
back to a different model mid-build, that's expected and low-cost here —
worst case, continue from the STOP checkpoint with the fallback model.