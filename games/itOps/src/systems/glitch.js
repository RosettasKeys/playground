// Phase 4 — the Reality Matrix glitch engine.
//
// GOALS §3: as stability degrades below thresholds (75 / 50 / 25%), the UI
// "glitches" — individual components swap stylesheets. The theme tokens are
// attribute-scoped (see tokens.css), so a glitch is just stamping a foreign
// `data-theme` (+ the current `data-color-scheme`) onto a DOM node: a saloon
// button renders on the corporate settings page, exactly as specified.
//
// Selection is SEEDED (Mulberry32 via rngFor) — stable for a given
// (seed, stability, cycle), re-rolled when stability changes, never a live
// mid-render reshuffle. The engine works on the DOM after render on purpose:
// React neither knows nor cares about the extra attributes, and a re-created
// node simply un-glitches until the next cycle, which reads as more glitch.
//
// Everything is memory-only. No persistence, no state outside the DOM and a
// ref; a reload restores a clean reality, as the hard rules require.

import { useEffect, useRef } from 'react'
import { rngFor } from '../data/synthesize.js'
import { PARADIGMS } from '../theme/themes.js'

// 0 = stable, 1 = mild (<75), 2 = degraded (<50), 3 = critical (<25).
export function glitchBand(stability) {
  if (stability >= 75) return 0
  if (stability >= 50) return 1
  if (stability >= 25) return 2
  return 3
}

// What a band does: how many components swap at once, how often the set
// re-rolls, whether swaps are transient flickers or persistent squatters, and
// whether the critical-band jitter class joins in.
const BAND_CONFIG = {
  1: { count: 2, cycleMs: 9000, transientMs: 2600, jitter: false },
  2: { count: 5, cycleMs: 12000, transientMs: 0, jitter: false },
  3: { count: 9, cycleMs: 7000, transientMs: 0, jitter: true },
}

// Components eligible for possession. Selectors that match nothing cost nothing.
const TARGETS = [
  '.card', '.ticket-card', '.btn', '.chip', '.page-head', '.queue-controls',
  '.nav-item', '.stability', '.topbar__status', '.mode-bar', '.rec',
  '.ticket-actions', '.sidebar__foot', '.tag',
]

function pickForeign(rng, current) {
  const others = Object.keys(PARADIGMS).filter((p) => p !== current)
  return others[Math.floor(rng() * others.length) % others.length]
}

export function useRealityGlitch(stability, paradigm, scheme, seed) {
  // Nodes currently possessed, so every cycle (and unmount) can exorcise them.
  const heldRef = useRef([])
  const timersRef = useRef([])

  useEffect(() => {
    const release = () => {
      for (const node of heldRef.current) {
        if (!node.isConnected) continue
        node.removeAttribute('data-theme')
        node.removeAttribute('data-color-scheme')
        node.classList.remove('is-glitched', 'is-glitch-jitter')
      }
      heldRef.current = []
      for (const t of timersRef.current) clearTimeout(t)
      timersRef.current = []
    }

    const band = glitchBand(stability)
    release()
    if (band === 0) return release

    const cfg = BAND_CONFIG[band]
    let cycle = 0

    const applyCycle = () => {
      release()
      const rng = rngFor(seed >>> 0, `glitch:${stability}:${cycle}`)
      const nodes = Array.from(document.querySelectorAll(TARGETS.join(', ')))
      if (nodes.length === 0) return
      const taken = new Set()
      for (let i = 0; i < cfg.count; i++) {
        const idx = Math.floor(rng() * nodes.length) % nodes.length
        if (taken.has(idx)) continue
        taken.add(idx)
        const node = nodes[idx]
        const foreign = pickForeign(rng, paradigm)
        node.setAttribute('data-theme', foreign)
        node.setAttribute('data-color-scheme', scheme)
        node.classList.add('is-glitched')
        if (cfg.jitter && rng() < 0.4) node.classList.add('is-glitch-jitter')
        heldRef.current.push(node)
        if (cfg.transientMs) {
          const held = node
          timersRef.current.push(setTimeout(() => {
            if (!held.isConnected) return
            held.removeAttribute('data-theme')
            held.removeAttribute('data-color-scheme')
            held.classList.remove('is-glitched', 'is-glitch-jitter')
          }, cfg.transientMs))
        }
      }
    }

    applyCycle()
    const interval = setInterval(() => { cycle += 1; applyCycle() }, cfg.cycleMs)
    return () => { clearInterval(interval); release() }
  }, [stability, paradigm, scheme, seed])
}

// Terminology bleed (band ≥ 2): some nav labels render in another paradigm's
// voice. Deterministic per (seed, stability, key) — labels do not flicker
// between renders, they are simply wrong until reality changes again.
export function bleedNavLabel(stability, seed, currentParadigm, key, fallback) {
  if (glitchBand(stability) < 2) return fallback
  const rng = rngFor(seed >>> 0, `bleed:${key}:${stability}`)
  if (rng() > 0.35) return fallback
  const others = Object.keys(PARADIGMS).filter((p) => p !== currentParadigm)
  const other = others[Math.floor(rng() * others.length) % others.length]
  return PARADIGMS[other]?.nav?.[key] ?? fallback
}

// Cross-voice postscripts (band 3): roughly a third of toasts arrive signed by
// the wrong paradigm. Keyed on the toast id so a given toast never rewrites
// itself mid-display.
const CROSS_VOICE = {
  opspiral: ' [NOC addendum: the meter saw this happen.]',
  tumbleweed: ' The saloon doors swing shut behind this message.',
  kindling: ' Kindling™ thanks you for bringing your whole self to this incident.',
}

export function crossVoiceSuffix(stability, seed, currentParadigm, toastId) {
  if (glitchBand(stability) < 3) return ''
  const rng = rngFor(seed >>> 0, `voice:${toastId}`)
  if (rng() > 0.34) return ''
  const others = Object.keys(CROSS_VOICE).filter((p) => p !== currentParadigm)
  return CROSS_VOICE[others[Math.floor(rng() * others.length) % others.length]]
}
