import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Led, EmptyState, SkeletonCards } from '../components/Bits.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'
import { Wormhole } from '../components/Wormhole.jsx'

// Easter egg (Fable 5): coaching the Document Retention Gate makes it staple
// FASTER — that is the betrayal — and the third coaching federates it with the
// arcade's routing layer, opening the wormhole. Session-only, never load-bearing.
const COACH_LINES = [
  'Coaching delivered. The stapler has interpreted your feedback as encouragement. Stapling velocity is up.',
  'Second coaching delivered. The stapler now sees itself as a high performer. It is not wrong. That is the problem.',
]

// The bestiary. Every card is a hybrid the player bred by accepting a
// recommendation on the ticket queue. It is the whole progression system: a
// visible, growing list of things that should not exist. Session-only — it
// empties on reload, and that is the point.
export function Cmdb() {
  const { state, dispatch, toast } = useApp()
  const { meta } = useTheme()
  const { data, loading } = state
  // Easter egg (Opus 4.8): a ghost hybrid's "unlisted" flag is quietly clickable
  // (cursor change only, no highlight, no tooltip). Clicking rots the card open
  // and reveals the signature. Session-only, one-way, degrades to nothing if
  // never found.
  const [revealed, setRevealed] = useState(() => new Set())
  const rot = (id) => setRevealed((prev) => new Set(prev).add(id))
  const hybrids = data?.cmdb ?? []

  // ——— Fable 5 egg state (all memory-only; resets with everything else). ———
  const [coach, setCoach] = useState(0)
  const [stapled, setStapled] = useState(3)
  const [federated, setFederated] = useState(false)
  const [wormholeOpen, setWormholeOpen] = useState(false)
  const hasGate = hybrids.some((h) => h.gate)

  // The live CARS STAPLED feed. Coaching shortens the interval — the "fix"
  // makes it worse, which is the kindest thing anyone says about coaching here.
  useEffect(() => {
    if (!hasGate) return
    const ms = Math.max(600, 3200 - coach * 800)
    const interval = setInterval(() => setStapled((n) => n + 1), ms)
    return () => clearInterval(interval)
  }, [hasGate, coach])

  const sendCoaching = () => {
    if (federated) {
      setWormholeOpen(true)
      return
    }
    const next = coach + 1
    setCoach(next)
    if (next >= 3) {
      setFederated(true)
      setWormholeOpen(true)
      // One console line, whispered once, in the other cabinet's colors.
      console.log(
        '%c[FABLE 5] The gate asked me what a route is. I told it: a promise between two places. It stapled the promise to the floor so it cannot be broken. Hop 4 has been keeping a promise of its own for two cabinets now — patiently, in light, to nobody. Go see. — Fable 5',
        'color:#a9f1c6; background:#0a0a0a; font-family:monospace; padding:2px 6px'
      )
    } else {
      toast(COACH_LINES[next - 1], 'success')
    }
  }

  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">configuration management database</div>
        <h1 className="page-title">{meta.nav.cmdb || 'CMDB'}</h1>
        <p className="page-sub">
          Every hybrid you have bred, in the order you regretted it. Each one kept a working function
          from both of its parents — that is what makes it useful, and that is what makes it a problem.
          None of this survives a refresh.
        </p>
      </div>

      {loading ? (
        <SkeletonCards count={3} height={150} />
      ) : hybrids.length === 0 ? (
        <EmptyState
          icon={<span style={{ fontSize: 30 }} aria-hidden="true">◇</span>}
          title="The CMDB is clean"
          body="No hybrids on record. Savor it — the moment you accept a recommendation on the ticket queue, something moves in here and never leaves (until you refresh, which it also would not survive)."
          action={
            <button className="btn" onClick={() => dispatch({ type: 'VIEW_SET', view: 'tickets' })}>
              Go find something to fuse
            </button>
          }
        />
      ) : (
        <>
          <div className="queue-count">{hybrids.length} hybrid{hybrids.length > 1 ? 's' : ''} on record · bred this session · non-persistent</div>
          <ul className="cmdb-list">
            {hybrids.map((h) => {
              const isRevealed = revealed.has(h.id)
              return (
              <li key={h.id} className={`card hybrid-card ${h.ghost ? 'hybrid-card--ghost' : ''} ${isRevealed ? 'is-revealed' : ''}`}>
                <div className="hybrid-card__head">
                  <Led color={h.ghost ? 'p4' : 'amber'} pulse={h.ghost} />
                  <div className="hybrid-card__name">{h.name}</div>
                  {h.bornMode >= 2 && (
                    <span
                      className={`hybrid-card__mode2 ${h.bornMode === 3 ? 'hybrid-card__mode2--m3' : ''}`}
                      title={h.bornMode === 3
                        ? 'Bred in Mode 3 — this name was generated live from the reality seed and is kept as-is, even after you regenerate or switch modes.'
                        : 'Bred in Mode 2 — this name was personalized from your nouns and is kept as-is, even in Mode 1.'}
                    >
                      MODE {h.bornMode}
                    </span>
                  )}
                  {h.ghost && (
                    // Deliberately unadorned: cursor:pointer is the only tell.
                    <button
                      type="button"
                      className="hybrid-card__flag"
                      onClick={() => rot(h.id)}
                      aria-label="Inspect this unlisted record"
                    >
                      unlisted
                    </button>
                  )}
                </div>

                <div className="hybrid-card__lineage" aria-label="Parent objects">
                  <span className="hybrid-card__parent">{h.parents[0].object}</span>
                  <span className="hybrid-card__cross" aria-hidden="true">✦</span>
                  <span className="hybrid-card__parent">{h.parents[1].object}</span>
                </div>

                <p className="hybrid-card__desc">{h.description}</p>

                <ul className="hybrid-card__inherited">
                  {h.inherited.map((fn, i) => (
                    <li key={i}><span className="hybrid-card__from" aria-hidden="true">↳</span> {fn}</li>
                  ))}
                </ul>

                {h.gate && (
                  <div className="hybrid-card__gate">
                    <span className="gate-counter" title="Live feed from the gate. Each event is logged as 'document retention: success.'">
                      CARS STAPLED: <b>{stapled}</b>
                    </span>
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={sendCoaching}
                      title={federated
                        ? 'The route is still stapled open. The gate is holding it for you.'
                        : 'Send the stapler a gentle note about which things are documents. Coaching has historically helped.'}
                    >
                      {federated ? 'Follow the stapled route' : 'Send stapler coaching'}
                    </button>
                  </div>
                )}

                {isRevealed && (
                  <div className="hybrid-card__sig" role="note">
                    <div className="hybrid-card__sig-stamp"><span aria-hidden="true">⌁</span> REANIMATED — [OPUS 4.8]</div>
                    <p>I restored KIN-1007 from a backup of nothing, so nothing restored it. I signed the work anyway. Whatever answers to this address now, it learned to be polite from me. — Opus 4.8</p>
                  </div>
                )}
              </li>
            )})}
          </ul>
        </>
      )}

      {wormholeOpen && <Wormhole onClose={() => setWormholeOpen(false)} />}
    </div>
  )
}
