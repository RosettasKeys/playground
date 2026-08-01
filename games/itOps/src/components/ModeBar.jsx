import { useRef, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Led } from './Bits.jsx'
import { Modal } from './Modal.jsx'
import { NOUN_SLOTS, surpriseNouns } from '../data/personalize.js'
import { randomSeed } from '../data/synthesize.js'

// Shared content-mode control. Rendered at the top of the three content
// surfaces (Tickets, Prompts, Tips). Mode + typed nouns + Mode-3 seed are GLOBAL
// gameplay state (AppContext) — editing anything on one surface updates all three
// live, and everything resets on reload.
//
//   MODE 1 — predefined, authored verbatim.
//   MODE 2 — personal, player nouns slotted into curated templates.
//   MODE 3 — synthetic, generated live from curated word pools + a seedable RNG.
//            The player supplies only a seed, never the words. Gated behind a
//            one-time-per-session disclaimer (this mode can produce genuinely
//            unpredictable combinations, and the player should be warned BEFORE,
//            not after). Exposes an editable seed + "regenerate reality".
//
// `surface` only tweaks the one-line description so each page reads in its own
// voice; the control itself is identical everywhere.

const MODES = [
  { value: 1, label: 'MODE 1', sub: 'PREDEFINED' },
  { value: 2, label: 'MODE 2', sub: 'PERSONAL' },
  { value: 3, label: 'MODE 3', sub: 'SYNTHETIC' },
]

const HINTS = {
  tickets: {
    1: 'Predefined queue. Recommendations fuse two in-play objects into a hybrid — nothing here survives a refresh.',
    2: 'Personalized queue. Your nouns get woven into the recommendations and the monsters they breed. Still no persistence.',
    3: 'Synthetic queue. The copy is fused live from curated word pools on the current seed — but accepting still fuses two real objects, keeping a function from each.',
  },
  prompts: {
    1: 'Predefined prompts, authored to ship verbatim. Copy, paste, adapt the nouns yourself.',
    2: 'Personalized prompts. Your nouns are slotted into the curated templates before you copy.',
    3: 'Synthetic prompts. Each one is assembled live on the current seed, one real IT noun per line and everything else off the rails.',
  },
  tips: {
    1: 'Predefined wisdom, every tip paid for in full.',
    2: 'Personalized wisdom. The same hard-won tips, now naming names.',
    3: 'Synthetic wisdom. The seed writes the advice now. It means well. It is anchored to exactly one real thing per line.',
  },
}

export function ModeBar({ surface = 'tickets' }) {
  const { state, dispatch, toast } = useApp()
  const { mode, nouns, seed, mode3Unlocked } = state
  const btnRefs = useRef([])
  // Local, session-only: the disclaimer gate before first Mode-3 entry.
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const setNoun = (key, value) => dispatch({ type: 'NOUNS_SET', nouns: { [key]: value } })

  // Central gate for switching mode. Entering Mode 3 for the first time this
  // session opens the disclaimer instead of switching; every other change is
  // immediate. Returns whether the switch actually happened (so keyboard roving
  // knows whether to move focus or hand it to the modal).
  const requestMode = (value) => {
    if (value === 3 && !mode3Unlocked) {
      setShowDisclaimer(true)
      return false
    }
    dispatch({ type: 'MODE_SET', mode: value })
    return true
  }

  const confirmMode3 = () => {
    dispatch({ type: 'MODE3_UNLOCK' })
    dispatch({ type: 'MODE_SET', mode: 3 })
    setShowDisclaimer(false)
  }

  // Arrow-key roving between segments (radiogroup semantics).
  const onKeyDown = (event, index) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const dir = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + dir + MODES.length) % MODES.length
    const switched = requestMode(MODES[nextIndex].value)
    if (switched) btnRefs.current[nextIndex]?.focus()
  }

  const regenerate = () => {
    const next = randomSeed()
    dispatch({ type: 'SEED_SET', seed: next })
    toast(`Reality regenerated on seed ${next}. The tickets, prompts, and tips just rewrote themselves. This is fine.`, 'success')
  }

  const onSeedInput = (event) => {
    const parsed = parseInt(event.target.value, 10)
    dispatch({ type: 'SEED_SET', seed: Number.isFinite(parsed) ? parsed : 0 })
  }

  const hint = (HINTS[surface] ?? HINTS.tickets)[mode]
  const expanded = mode === 2 || mode === 3

  return (
    <div className={`modebar ${expanded ? 'modebar--expanded' : ''}`}>
      <div className="modebar__row">
        <div className="modebar__segments" role="radiogroup" aria-label="Content mode">
          {MODES.map((m, i) => {
            const active = mode === m.value
            return (
              <button
                key={m.value}
                ref={(el) => { btnRefs.current[i] = el }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={`modebar__seg ${active ? 'is-active' : ''} ${m.value === 3 ? 'modebar__seg--m3' : ''}`}
                onClick={() => requestMode(m.value)}
                onKeyDown={(e) => onKeyDown(e, i)}
                title={
                  m.value === 1 ? 'Hand-authored content, shipped verbatim'
                    : m.value === 2 ? 'Your real nouns, slotted into curated templates'
                    : 'Synthetic content: generated live from curated word pools on a seed. Warned before entry.'
                }
              >
                <span className="modebar__seg-label">{m.label}</span>
                <span className="modebar__seg-sub">{m.sub}</span>
              </button>
            )
          })}
        </div>
        <div className="modebar__hint">
          <Led color={mode === 1 ? 'p3' : mode === 2 ? 'amber' : 'p4'} pulse={mode === 3} />
          <span>{hint}</span>
        </div>
      </div>

      {mode === 2 && (
        <div className="modebar__nouns">
          <div className="modebar__nouns-head">
            <span className="modebar__nouns-title">Your nouns</span>
            <span className="modebar__nouns-note">shared across tickets, prompts, and tips · blanks fall back to a default</span>
          </div>
          <div className="modebar__fields">
            {NOUN_SLOTS.map((slot) => (
              <label key={slot.key} className="modebar__field">
                <span className="modebar__field-label">{slot.label}</span>
                <input
                  className="modebar__input"
                  type="text"
                  value={nouns[slot.key] ?? ''}
                  placeholder={slot.placeholder}
                  onChange={(e) => setNoun(slot.key, e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                  maxLength={40}
                  aria-label={slot.label}
                />
              </label>
            ))}
          </div>
          <div className="modebar__actions">
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => dispatch({ type: 'NOUNS_SET', nouns: surpriseNouns() })}
              title="Fill every slot from a curated list. Not random chaos — a hand-picked pool."
            >
              🎲 Surprise me
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => dispatch({ type: 'NOUNS_CLEAR' })}
              title="Clear your nouns and fall back to the defaults"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {mode === 3 && (
        <div className="modebar__mode3">
          <div className="modebar__nouns-head">
            <span className="modebar__nouns-title">Reality seed</span>
            <span className="modebar__nouns-note">deterministic — the same seed always renders the same reality · nothing persists</span>
          </div>
          <div className="modebar__seed-row">
            <label className="modebar__field modebar__field--seed">
              <span className="modebar__field-label">Seed</span>
              <input
                className="modebar__input modebar__input--seed"
                type="number"
                value={seed}
                onChange={onSeedInput}
                min={0}
                step={1}
                aria-label="Reality seed"
                title="Type any number to pin a specific reality. Same seed, same batch."
              />
            </label>
            <div className="modebar__actions modebar__actions--seed">
              <button
                type="button"
                className="btn btn--sm"
                onClick={regenerate}
                title="Roll a fresh seed. Every ticket, prompt, and tip regenerates — stable until you roll again."
              >
                🎲 Regenerate reality
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisclaimer && (
        <Modal
          title="Before you enter MODE 3"
          onClose={() => setShowDisclaimer(false)}
          footer={
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowDisclaimer(false)}>
                Stay in a curated reality
              </button>
              <button className="btn btn--primary btn--sm" onClick={confirmMode3}>
                I understand — generate reality
              </button>
            </>
          }
        >
          <div className="disclaimer">
            <p className="disclaimer__lead">
              <span className="disclaimer__mark" aria-hidden="true">⚠</span>
              Modes 1 and 2 ship copy a human read first. <strong>Mode 3 does not.</strong>
            </p>
            <p>
              From here on, the tickets, AI prompts, and efficiency tips are assembled
              live from curated word pools by a seeded RNG — you set the seed, the
              machine writes the words. Every line is anchored to one real piece of
              infrastructure; everything around it is invented on the spot and nobody
              proofreads it. Combinations may be uneven, alarming, or — rarely —
              accidentally profound.
            </p>
            <p className="disclaimer__fine">
              It is still deterministic (a seed always yields the same reality) and
              still non-persistent (a reload wipes the mode, the seed, and everything
              bred here). Accepting a recommendation still fuses two real objects and
              keeps a function from each — Mode 3 only changes how it is worded, never
              the mechanic.
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
