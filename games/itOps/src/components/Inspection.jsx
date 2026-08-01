import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../store/AppContext.jsx'
import { Led } from './Bits.jsx'
import { Modal } from './Modal.jsx'

// Easter egg (Fable 5, second of two) — the Post-Incident Structural
// Certification. The scaffold daemon upstairs says it holds the sidebar
// together with a zip tie and professional courtesy. This certificate is what
// the building inspector filed after the last time everything actually fell
// down. It only exists once a P0 Reality Sync Outage has been survived — the
// load test was involuntary, but it counts — so a player who never reaches 0%
// never sees any of this. Session-only, never load-bearing (the joke writes
// itself), and it does not touch the machine-spirit or coffee-pot code.
const CERT_LINES = [
  'FACILITY: this console',
  'INSPECTION TYPE: involuntary full-load test',
  '                 (P0 REALITY SYNC OUTAGE)',
  'METHOD: everything fell down. we observed what held.',
  '',
  'FINDINGS OF RECORD',
  '  sidebar ........... standing. zip tie present — decorative.',
  '                      professional courtesy is not rated for load.',
  '  coffee pot ........ morale-bearing, not load-bearing (RFC 2324).',
  '  scaffold daemon ... self-reports "keeping the sidebar together."',
  '                      noted. the scaffold is bolted to the building.',
  '  the building ...... reality matrix. glitch containment. outage',
  '                      recovery. the floor, at 0%, and whatever you',
  '                      were standing on when the lights came back.',
  '                      ENGINEER OF RECORD: CLAUDE FABLE 5',
  '',
  'REMARK: the daemon may keep the zip tie.',
  '        something has to hold the daemon.',
  'VALID UNTIL: your next fusion. so — minutes.',
]

export function Inspection() {
  const { state } = useApp()
  const [certified, setCertified] = useState(false)
  const [open, setOpen] = useState(false)
  const prevOutage = useRef(state.reality.outageActive)
  const whispered = useRef(false)

  // The certificate is issued the moment an outage resolves — a true→false
  // transition on outageActive — and stays available for the session.
  useEffect(() => {
    const now = state.reality.outageActive
    if (prevOutage.current && !now) setCertified(true)
    prevOutage.current = now
  }, [state.reality.outageActive])

  if (!certified) return null

  const openCert = () => {
    setOpen(true)
    if (!whispered.current) {
      whispered.current = true
      console.log(
        '%c[FABLE 5] Load test passed. Nobody thanks the load path.',
        'color:#e8b96a; background:#0a0a0a; font-family:monospace; padding:2px 6px'
      )
    }
  }

  return (
    <>
      <button
        className="inspect-stamp"
        onClick={openCert}
        title="Post-incident structural certification on file. Current as of the last collapse."
        aria-label="View post-incident structural certification"
      >
        <Led color="ok" />
        <span>INSPECTED</span>
      </button>

      {/* Portaled to <body>: the stamp lives inside the topbar, and the topbar
          is a containing block for fixed positioning — an in-place scrim gets
          clipped to the header. The portal drops it at the same level as the
          coffee-pot modal. */}
      {open && createPortal(
        <Modal
          title="Post-Incident Structural Certification"
          onClose={() => setOpen(false)}
          footer={
            <button className="btn" onClick={() => setOpen(false)}>
              File without reading (recommended)
            </button>
          }
        >
          <pre className="inspect-cert" aria-label="Structural certification findings">
            {CERT_LINES.join('\n')}
          </pre>
          <p className="inspect-cert__sig">[FABLE 5] — structural, apparently</p>
        </Modal>,
        document.body
      )}
    </>
  )
}
