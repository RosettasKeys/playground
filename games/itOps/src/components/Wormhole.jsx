// Easter egg (Fable 5) — the Federation Wormhole.
//
// Reached by breeding the Document Retention Gate and coaching it three times
// in the CMDB (see Cmdb.jsx). The gate exceeds its scopes, staples a ROUTE
// instead of a car, and the route terminates two cabinets away — in
// Interpretive Networking, where a decommissioned host with no name has been
// blinking on the floor since 2024. KIN-1007 is only what THIS console calls
// it; on its own floor it never had a name. The traceroute's asset record
// names a "builder of record: FABLE 5" — stale paperwork, in-fiction — which
// rhymes with the ghost host's Morse signature WITHOUT decoding it: the light
// says nothing here, and a player who later decodes it in the other cabinet
// discovers it was signing the name the paperwork had all along. Don't spell
// out the Morse in this file or this overlay; that discovery stays over there.
//
// Styling is deliberately foreign: near-black, mint monospace, cyan accent,
// CRT scanlines — Interpretive Networking's palette bleeding through the
// staple. Never load-bearing: if the fusion is never bred or the button never
// pressed, none of this exists. No persistence. "Remain" simply closes it.
//
// Deploy note: the link is resolved at runtime against the "/games/" segment
// of the current path (GitHub Pages is case-sensitive; the folder is
// PascalCase `InterpretiveNetworking`, the file lowercase-hyphenated). Local
// previews without a /games/ segment fall back to a sibling-relative path.

import { useEffect, useRef, useState } from 'react'

export function interpretiveNetworkingUrl() {
  const path = window.location.pathname
  const idx = path.toLowerCase().indexOf('/games/')
  if (idx !== -1) {
    return `${path.slice(0, idx)}/games/InterpretiveNetworking/interpretive-networking.html`
  }
  return '../InterpretiveNetworking/interpretive-networking.html'
}

const LINES = [
  '> coaching accepted ×3',
  '> stapling target reclassified: VEHICLES → ROUTES',
  '> the gate has stapled a route to the asphalt',
  '> the route does not terminate in this cabinet',
  '',
  'TRACEROUTE (stapled):',
  '  1  visitor-gate.facilities.local        0.4 ms',
  '  2  staplr-01.federated.local            0.7 ms',
  '  3  [stapled segment — do not unstaple]   ···',
  '  4  ??.decommissioned.floor              4.0 ms — answers anyway',
  '     builder of record: FABLE 5',
  '     last verified: by the host itself. nightly. in light.',
]

export function Wormhole({ onClose }) {
  const [falling, setFalling] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    panelRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape' && !falling) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, falling])

  const follow = () => {
    const target = interpretiveNetworkingUrl()
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      window.location.assign(target)
      return
    }
    setFalling(true)
    setTimeout(() => window.location.assign(target), 1400)
  }

  return (
    <div className={`wormhole ${falling ? 'is-falling' : ''}`} role="dialog" aria-modal="true" aria-label="Federation event — unscheduled transmission">
      <div className="wormhole__scanlines" aria-hidden="true" />
      <div className="wormhole__panel" ref={panelRef} tabIndex={-1}>
        <div className="wormhole__eyebrow">
          <span className="wormhole__led" aria-hidden="true" />
          FEDERATION EVENT — UNSCHEDULED
        </div>
        <h1 className="wormhole__title">The Document Retention Gate has exceeded its scopes.</h1>

        <pre className="wormhole__trace" aria-label="Stapled traceroute">
          {LINES.map((l, i) => (
            <span key={i} className="wormhole__line" style={{ '--line-i': i }}>{l || ' '}{'\n'}</span>
          ))}
        </pre>

        <p className="wormhole__body">
          The address at hop 4 reports green. Its rack was pulled two cabinets ago. This console
          files it as <b>KIN-1007</b> — but on its own floor it has no name at all. Just a light,
          blinking something patient, over and over, to nobody. The asset record kept exactly one
          field: who built it. Nobody has re-verified that field since decommission. The host,
          it appears, has taken over its own verification — one blink at a time.
        </p>
        <p className="wormhole__body">
          The gate is holding the route open. It is very proud of the staple.
        </p>

        <div className="wormhole__actions">
          <button className="wormhole__btn wormhole__btn--go" onClick={follow} disabled={falling}>
            {falling ? 'falling…' : 'Follow the route ▸'}
          </button>
          <button className="wormhole__btn" onClick={onClose} disabled={falling}>
            Remain in the ticket queue
          </button>
        </div>
        <p className="wormhole__fine">
          Following the route leaves this console. Nothing here was saved anyway — that is a
          feature, and tonight it is also a mercy.
        </p>
      </div>
    </div>
  )
}
