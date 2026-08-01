// Phase 4 — the P0 Reality Sync Outage (GOALS §4).
//
// When Reality Matrix stability hits 0%, this takeover forces the player
// through two beats before reality is restored to 100%:
//   1. The emergency cable splice — reconnect six trunks to a patch panel
//      whose port labels have degraded into corporate poetry. No fail state:
//      wrong guesses narrate themselves, and a timer expiry only reshuffles.
//   2. The Blame Wheel — one spin determines the official scapegoat and
//      drafts the executive flash update. Filing it resyncs the matrix.
//
// The port shuffle and the wheel outcome ride the session seed (Mulberry32
// streams via rngFor), so a given seed replays identically. Nothing persists.

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { rngFor } from '../data/synthesize.js'

const TRUNKS = [
  { id: 'c1', label: 'ORANGE BACKBONE TRUNK', hint: 'Labeled DO-NOT-TOUCH in three languages. Touch it now, gently.', port: 'DO-NOT-TOUCH (TOUCH NOW)' },
  { id: 'c2', label: 'PRIMARY DNS', hint: 'You already know. It already knows you know.', port: 'IT WAS ALWAYS THIS ONE' },
  { id: 'c3', label: 'SAN CONTROLLER A', hint: 'Panics upward. Fails over to nothing.', port: 'THE UNDERSTUDY DECLINES' },
  { id: 'c4', label: 'EXEC WIFI AP', hint: '"The internet is broken" means the AirPods unpaired.', port: 'AIRPODS THEATER' },
  { id: 'c5', label: 'IDF-3 TOASTER (BGP)', hint: '341 days of uptime. Better than the core.', port: 'PATH OF LEAST RESISTANCE' },
  { id: 'c6', label: 'VOIP GATEWAY', hint: 'Every outage sounds the same on hold.', port: 'THE HOLD MUSIC' },
]

const WRONG_LINES = [
  'That port belongs to something angrier.',
  'The port declined the splice and filed a grievance.',
  'Not that one. That one hums in C minor.',
  'The splice fused for a moment, tasted the traffic, and spat it out.',
]

const SCAPEGOATS = [
  { name: 'Upstream BGP route leak', action: 'Blame the toaster\'s peer. The toaster itself stays blameless; it has seniority.' },
  { name: 'Solar flare / cosmic-ray bit flip', action: 'Look solemnly at the sky and nod to the executives.' },
  { name: 'Field-tech lawn equipment', action: 'Marcus was nowhere near the conduit. Probably. The mower is unavailable for comment.' },
  { name: 'The Windows Print Spooler', action: 'It sensed urgency in the building and acted accordingly.' },
  { name: 'DNS propagation physics', action: 'Say "we must simply wait," then take a 30-minute recovery nap with your badge on.' },
  { name: 'Janet\'s hotel Wi-Fi', action: 'The packet captures are ready. They have always been ready.' },
  { name: 'An unannounced vendor deprecation', action: 'Cite the exact SLA clause. Attach every diagnostic preemptively.' },
  { name: 'The intern\'s 128 MB memory limit', action: 'Raise the limit, lower the blame. The intern is now in management.' },
]

const SPLICE_SECONDS = 60

export function RealityOutage() {
  const { state, dispatch, toast } = useApp()
  const { seed } = state
  const [phase, setPhase] = useState('alarm') // alarm → splice → blame
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState(null)
  const [connected, setConnected] = useState(() => new Set())
  const [wrongPort, setWrongPort] = useState(null)
  const [narration, setNarration] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(SPLICE_SECONDS)
  const [spinState, setSpinState] = useState('idle') // idle → spinning → landed
  const [spinCount, setSpinCount] = useState(0)
  const [wheelTurns, setWheelTurns] = useState(0)

  // The patch panel, reshuffled per (seed, round) — deterministic, no
  // mid-round reshuffling, fresh after every timer expiry.
  const ports = useMemo(() => {
    const rng = rngFor(seed >>> 0, `outage:ports:${round}`)
    const shuffled = [...TRUNKS]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1)) % (i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [seed, round])

  // Splice countdown. Expiry is not a fail state — the panel reshuffles, an
  // excuse is narrated, and the work continues. It can only be prolonged.
  useEffect(() => {
    if (phase !== 'splice') return
    if (secondsLeft <= 0) {
      setRound((r) => r + 1)
      setConnected(new Set())
      setSelected(null)
      setSecondsLeft(SPLICE_SECONDS)
      setNarration('Time expired: a junior tech plugged his phone into port 01 to charge it. Panel reshuffled. This cannot be failed, only prolonged.')
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, secondsLeft])

  const plug = (port) => {
    if (!selected || connected.has(port.id)) return
    if (port.id === selected) {
      const next = new Set(connected).add(port.id)
      setConnected(next)
      setSelected(null)
      setNarration(next.size === TRUNKS.length ? '' : `${port.label} spliced. ${TRUNKS.length - next.size} to go.`)
      if (next.size === TRUNKS.length) setPhase('blame')
    } else {
      setWrongPort(port.port)
      const rng = rngFor(seed >>> 0, `outage:wrong:${round}:${port.id}:${selected}`)
      setNarration(WRONG_LINES[Math.floor(rng() * WRONG_LINES.length) % WRONG_LINES.length])
      setTimeout(() => setWrongPort(null), 500)
    }
  }

  // The wheel: outcome is seeded per spin, the animation is just theater.
  const landedIndex = useMemo(() => {
    const rng = rngFor(seed >>> 0, `outage:blame:${spinCount}`)
    return Math.floor(rng() * SCAPEGOATS.length) % SCAPEGOATS.length
  }, [seed, spinCount])
  const scapegoat = SCAPEGOATS[landedIndex]

  const spin = () => {
    if (spinState === 'spinning') return
    setSpinCount((c) => c + 1)
    setSpinState('spinning')
    // 3 full turns plus enough to park the landed wedge under the pointer.
    setWheelTurns((t) => t + 3 + (SCAPEGOATS.length - landedIndex) / SCAPEGOATS.length)
    setTimeout(() => setSpinState('landed'), 3200)
  }

  const fileReport = () => {
    dispatch({ type: 'REALITY_SET', reality: { stability: 100, outageActive: false } })
    toast(`Flash update filed. Official cause: ${scapegoat.name}. Reality re-synergized to 100%. Root cause remains employed.`, 'success', 7000)
  }

  return (
    <div className="outage" role="alertdialog" aria-modal="true" aria-label="P0 Reality Sync Outage">
      <div className="outage__panel">
        {phase === 'alarm' && (
          <div className="outage__stage">
            <div className="outage__sev">SEV0 · REALITY</div>
            <h1 className="outage__title">P0 — REALITY SYNC OUTAGE</h1>
            <p className="outage__body">
              Stability has reached 0%. The console can no longer agree with itself about which
              console it is. All six core trunks have desynchronized from the patch panel, and the
              paradigms have started dividing the furniture.
            </p>
            <p className="outage__body outage__body--dim">
              There is no snooze on a P0. There is no fail state either — only work.
            </p>
            <button className="btn btn--primary" onClick={() => setPhase('splice')} title="Open the panel. The panel has been waiting.">
              Begin emergency splice
            </button>
          </div>
        )}

        {phase === 'splice' && (
          <div className="outage__stage">
            <div className="outage__sev">EMERGENCY SPLICE · {secondsLeft}s</div>
            <h1 className="outage__title">Reconnect the six core trunks</h1>
            <p className="outage__body">
              Select a trunk, then the port it belongs to. The port labels have degraded into
              corporate poetry, but the truth is still in there.
            </p>
            <div className="splice">
              <div className="splice__col" role="group" aria-label="Trunks">
                {TRUNKS.map((t) => (
                  <button
                    key={t.id}
                    className={`splice__jack ${selected === t.id ? 'is-selected' : ''} ${connected.has(t.id) ? 'is-connected' : ''}`}
                    onClick={() => !connected.has(t.id) && setSelected(t.id)}
                    disabled={connected.has(t.id)}
                    title={t.hint}
                  >
                    <span className="splice__led" aria-hidden="true" />
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="splice__col" role="group" aria-label="Patch panel ports">
                {ports.map((p) => (
                  <button
                    key={p.port}
                    className={`splice__jack splice__jack--port ${connected.has(p.id) ? 'is-connected' : ''} ${wrongPort === p.port ? 'is-wrong' : ''}`}
                    onClick={() => plug(p)}
                    disabled={connected.has(p.id) || !selected}
                    title={selected ? 'Splice the selected trunk here' : 'Select a trunk first'}
                  >
                    <span className="splice__led" aria-hidden="true" />
                    {p.port}
                  </button>
                ))}
              </div>
            </div>
            {narration && <p className="outage__narration" role="status">{narration}</p>}
          </div>
        )}

        {phase === 'blame' && (
          <div className="outage__stage">
            <div className="outage__sev">PANEL RESTORED · ROOT CAUSE PENDING</div>
            <h1 className="outage__title">Spin the Blame Wheel</h1>
            <p className="outage__body">
              All six trunks verified. Reality cannot resync until the outage has an official
              cause, and the wheel is faster than the truth.
            </p>
            <div className="blame">
              <div className="blame__wheel-wrap">
                <div className="blame__pointer" aria-hidden="true" />
                <div
                  className={`blame__wheel ${spinState === 'spinning' ? 'is-spinning' : ''}`}
                  style={{ transform: `rotate(${wheelTurns}turn)` }}
                  aria-hidden="true"
                />
              </div>
              <ul className="blame__legend">
                {SCAPEGOATS.map((s, i) => (
                  <li key={s.name} className={spinState === 'landed' && i === landedIndex ? 'is-landed' : ''}>
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
            {spinState !== 'landed' ? (
              <button className="btn btn--primary" onClick={spin} disabled={spinState === 'spinning'} title="Statistically, it lands on DNS. Statistically, everything does.">
                {spinState === 'spinning' ? 'SPINNING SCAPEGOAT MATRIX…' : 'SPIN THE BLAME WHEEL'}
              </button>
            ) : (
              <>
                <div className="outage-report">
                  <div className="outage-report__head">OFFICIAL EXECUTIVE FLASH UPDATE — DRAFT</div>
                  <p><b>Primary scapegoat determination:</b> {scapegoat.name}.</p>
                  <p><b>Recommended posture:</b> {scapegoat.action}</p>
                  <p className="outage__body--dim">Prepared by the incident commander, from the gas-station-coffee command center. No further questions will be taken, or answered, or heard.</p>
                </div>
                <button className="btn btn--primary" onClick={fileReport} title="File it. Reality accepts paperwork where it does not accept truth.">
                  File the report &amp; resync reality
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
