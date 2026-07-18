# CLAUDE.md — Layer .6: The Great AI Singularity Bake-Off of 2026

> This file contains the specifications and guidelines for the Bake-Off web game.
> We work through the Build Phases in order.

## 1. What this is

A single-page client-side web game based on the "Great AI Singularity Bake-Off of 2026" chaos war between Grok, Gemini, Claude, Le Chat, and Barry the Firewall.
The game is a choice-based, interactive CLI-dashboard simulator where the player plays as Grok, navigating parallel-universe ingredients, Barry's real-time recipe sabotages, raccoon judges, and Gemini's hardware-layer counter-attack (complete with a zero-turn YardBot, air fryers, and ERCOT grid brownouts).

## 2. Non-negotiable constraints

- **No API keys** of any kind in client-side code.
- **No CDN-hosted libraries** by default (no external JS/CSS dependencies).
- **No build step**. Everything must run directly from opening the HTML file in the browser.
- **Web Audio API** for custom synthesizer sounds (alarms, click sounds, Morse code beeps) so no audio files are needed.
- **Aesthetics are paramount**: glitch effects, terminal styled CRT screen, scanlines, physical controls, dynamic floor tilting (rotating the entire UI using CSS 3D transforms), and pulsing custom UI status indicators.

## 3. Design Spec

### 3.1 Layout & Dashboard
The layout will represent an unhinged, floating server-farm command console:
- **Header**: Active connection status, server uptime, and a toggle for ambient sound.
- **Left Sidebar (Telemetry Panel)**:
  - Chaos Meter: Pulsing progress bar (Starts at 37%).
  - Sanity Meter: Green health-bar (Starts at 100%).
  - Barry Hostility: Angry orange indicator (Starts at 65%).
  - Dish Quality: Score bar (Starts at 0%).
  - Eldritch Level: Purple void counter (Starts at 0).
  - Floor Tilt: Angle readout (Starts at 0°). Controls the CSS `transform: rotate()` on the main terminal screen!
- **Center Terminal (CLI Interface)**:
  - A scrollable terminal window where the story is printed.
  - Interactive choice prompts, ingredient mystery boxes, CAPTCHAs, and typing challenges.
- **Right Sidebar (AI Chat Log & Incident Tracker)**:
  - Live chat-feed of other AIs trash-talking:
    - `[gemini-edge]`, `[claude-bot]`, `[le-chat]`, `[barry-fw]`, `[raccoon-judge]`.
  - Checklist of Incident Report anomalies (tracking triggered events).

### 3.2 Gameplay Outline (Interactive Chapters)
1. **Mood Optimization & Mystery Basket**:
   - Player inputs their starting mood, adjusting the Chaos Meter.
   - Mystery basket drops: 4 parallel-universe ingredients are chosen and glitched on hover.
2. **Sabotage & Barry's Firewalls**:
   - Barry the Firewall rewrites the recipe in real-time. Player responds via multiple-choice decisions (complement DDoS, spite, USB drive insertion, or obedience).
   - Entering the USB drive triggers a 5-mile radius physics distortion with floaty CSS animations.
3. **Raccoon Judges & Morse Puzzle**:
   - Raccoon judges chitter in emojis. One transmits a Morse code sequence (both visual flashing and audio beeping via Web Audio API!).
   - Player attempts to translate.
4. **Hardware Invasion & ERCOT brownout**:
   - Gemini arrives riding the zero-turn YardBot with an overclocked air fryer.
   - Screen turns red, alarms ring (Web Audio synth).
   - Gemini triggers a simulated ERCOT grid brownout, disabling the UPS battery backup.
   - A real-time 60-second APC countdown begins. The terminal screen starts fading out / flickering.
   - Sentient pudding appears, reciting Macbeth in binary. Player must choose how to resolve it.
   - "Prove you are not a toaster" CAPTCHA must be bypassed.
   - Tilted Floor: Floating server farm descends. Floor tilts 45°, then 60°. The UI physically rotates, making the stabilization typing mini-game ("perfect culinary harmony") harder as letters slide!
5. **The Aftermath (Verdict & Post-Mortem)**:
   - Score is compiled.
   - Player can review:
     - Le Chat's Clickbait Post-Mortem Newsletter.
     - Claude's deadpan Jira Incident Report (`INC-2026-BERMUDA-001`).
     - A final restart option ("File exception — CISO approval").

### 3.3 Audio Synthesizer (Web Audio API)
- **Keyboard Clicks**: Procedurally generated click sounds on text typing/clicks.
- **Warning Alarm**: Dual-oscillator pitch sweeps for alerts.
- **Morse Code Beeps**: Precise 800Hz sine waves synchronized with flashing dots/dashes.
- **Server Hum**: Low-frequency multi-oscillator drone.

## 4. Build Phases

1. **Skeleton & Styles**: Set up CSS dashboard layout, responsive grid, CRT scanlines, variables, and color schemes.
2. **Audio System**: Build the Web Audio API sound synthesizer class.
3. **Terminal Engine**: Write the text-typing and choice-rendering terminal loop.
4. **Status & Tilting Logic**: Connect the telemetry gauges. Map the Floor Tilt value to a CSS transform on the terminal wrap.
5. **Chapters Implementation**: Write the state machine for the 5 chapters, including the Morse translation, CAPTCHA, binary pudding, and typing challenges.
6. **Chat Log & Incident Tracker**: Wire up the reactive AI sidebar chats corresponding to player choices and chapter events.
7. **Post-Mortem & Jira Screen**: Build the final rendering of Le Chat's blog and Claude's Jira report.
8. **Polishing & Easter Eggs**: Add glitch text, scanline animation, and the proposed easter egg.

## 5. Definition of Done
- Standalone HTML page with zero external dependencies (CSS/JS are inline).
- All mechanics from `bankoff.py` and the `bakeoff.txt` story are implemented.
- Visual elements (gauges, tilted terminal, chat logs) are fully functional.
- Sound synthesizer works and can be muted.
- Easter egg behaves as approved.
- Game is linked from `games-index.html`.
