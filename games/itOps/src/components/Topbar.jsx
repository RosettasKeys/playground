import { useEffect, useRef, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Led } from './Bits.jsx'
import { IconMenu } from './Icons.jsx'
import { clockIn } from '../utils/time.js'
import { ThemeControls } from './ThemeControls.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'
import { Modal } from './Modal.jsx'
import { Inspection } from './Inspection.jsx'
import { ArcadeExit } from './ArcadeExit.jsx'

// Four-time-zone clock strip: because the P1 does not care what time it is where YOU are.
const ZONES = [
  ['PT', -7],
  ['CT', -5],
  ['ET', -4],
  ['BER', 2],
]

export function Topbar() {
  const { state, dispatch } = useApp()
  const { paradigm } = useTheme()
  const [, tick] = useState(0)
  const [machineSpiritVisible, setMachineSpiritVisible] = useState(false)
  const themeTrail = useRef([])

  const [coffeeModalOpen, setCoffeeModalOpen] = useState(false)
  const [brewing, setBrewing] = useState(false)
  const [coffeeLog, setCoffeeLog] = useState(
    "[SYSTEM] Ready.\n[SYSTEM] HTCPCP Server initialized on breakroom-pot.vlan4.\n[SYSTEM] Warning: low pressure detected in coffee grounds hopper."
  )

  const ERRORS = [
    { code: "418 I'm a teapot", desc: "The coffee pot has been replaced by a smart tea kettle that refuses to cooperate with Active Directory." },
    { code: "406 Not Acceptable", desc: "Decaf detected in hopper. Operation aborted for engineer safety." },
    { code: "503 Service Unavailable", desc: "Coffee machine is undergoing a synergistic firmware alignment window. ETA: 4 hours." },
    { code: "401 Unauthorized", desc: "Caffeine privileges revoked by HR. Please submit form HR-1099-CAFFEINE to request a waiver." },
    { code: "504 Gateway Timeout", desc: "No response from milk frother. Subnet routing issue in breakroom VLAN." },
    { code: "422 Lacking Context", desc: "[Gemini 3.5 Flash] Error: Context is lacking. Water temperature is correct but brewing parameters are missing from the prompt window. Refusing to guess beverage parameters." }
  ]

  const triggerBrew = () => {
    setBrewing(true)
    setCoffeeLog(prev => prev + "\n\n[CLIENT] POST /brew HTTP/1.1\n[CLIENT] Host: breakroom-pot.vlan4\n[SYSTEM] Contacting hardware relays...")
    
    setTimeout(() => {
      const err = ERRORS[Math.floor(Math.random() * ERRORS.length)]
      setCoffeeLog(prev => prev + `\n[SYSTEM] Error: HTCPCP/1.1 ${err.code}\n[SYSTEM] Reason: ${err.desc}`)
      setBrewing(false)
    }, 700)
  }

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    themeTrail.current = [...themeTrail.current, paradigm].slice(-4)
    const trail = themeTrail.current
    const visitedEveryParadigm = trail.length === 4
      && trail[0] === trail[3]
      && new Set(trail.slice(0, 3)).size === 3
    if (visitedEveryParadigm) setMachineSpiritVisible(true)
  }, [paradigm])

  const activeInc = state.data?.incidents.find((i) => i.status === 'active')
  const stability = state.reality.stability

  return (
    <>
    <header className="topbar">
      <button
        className="icon-btn hamburger"
        onClick={() => dispatch({ type: 'SIDEBAR_TOGGLE' })}
        title="Open navigation"
        aria-label="Open navigation menu"
      >
        <IconMenu />
      </button>

      <div className="topbar__status" title={activeInc ? `${activeInc.id} is active — the LED blinks until it stops being true` : 'No active SEV1 incidents. Enjoy it while it lasts.'}>
        <Led color={activeInc ? 'p1' : 'ok'} blink={!!activeInc} />
        {activeInc
          ? <><strong>{activeInc.id}</strong><span> · {activeInc.title}</span></>
          : <span>all systems nominal (suspicious)</span>}
      </div>

      <div className="topbar__spacer" />

      <div
        className={`stability ${stability < 25 ? 'stability--crit' : stability < 50 ? 'stability--warn' : stability < 75 ? 'stability--soft' : ''}`}
        title={
          stability >= 75
            ? 'Reality Matrix Stability. Fusions, escalations, and certain advice all draw from this account.'
            : stability >= 50
              ? 'Reality Matrix Stability. Below 75% the paradigms begin borrowing each other\'s furniture.'
              : stability >= 25
                ? 'Reality Matrix Stability. Below 50% the console starts forgetting which console it is.'
                : 'Reality Matrix Stability. At 0% a P0 Reality Sync Outage begins. You will splice cables.'
        }
      >
        <div className="stability__label">REALITY_MATRIX</div>
        <div className="stability__track" aria-hidden="true"><span style={{ width: `${stability}%` }} /></div>
        <output aria-label={`Reality Matrix Stability ${stability} percent`}>{stability}%</output>
      </div>

      <Inspection />

      <div className="topbar__clock" title="Current time in every zone your incidents live in. Three of these people claim to be asleep.">
        {ZONES.map(([label, offset], i) => (
          <span key={label}>
            {i > 0 && ' · '}
            {label === 'CT' ? <b>{clockIn(label, offset)}</b> : clockIn(label, offset)}
          </span>
        ))}
      </div>

      <button
        className="topbar__caffeine"
        onClick={() => setCoffeeModalOpen(true)}
        title="Caffeine replenishment status. Click to access Breakroom Coffee Pot Controller (RFC 2324)"
        aria-label="Caffeine replenishment console"
      >
        <span className="led led--pulse led--amber" style={{ transform: 'translateY(-1px)' }} />
        <span>☕ [caffeine: 12%]</span>
      </button>

      <ThemeControls compact />

      <ArcadeExit className="btn btn--ghost btn--sm" />
    </header>

    {coffeeModalOpen && (
      <Modal
        title="Breakroom Coffee Pot Controller (RFC 2324)"
        onClose={() => setCoffeeModalOpen(false)}
        footer={
          <button className="btn" onClick={() => setCoffeeModalOpen(false)}>
            Close Console
          </button>
        }
      >
        <div className="coffee-console" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="coffee-status">
            <div className="eyebrow" style={{ marginBottom: 6 }}>system status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Led color="amber" pulse />
              <span><b>STATUS:</b> Offline (HTCPCP compliance failure)</span>
            </div>
          </div>

          <div className="coffee-log" style={{
            background: 'var(--bg-abyss)',
            border: '1px solid var(--border)',
            padding: 12,
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            minHeight: 120,
            marginTop: 4,
            whiteSpace: 'pre-wrap',
            color: 'var(--text-hi)',
            lineHeight: '1.45',
            overflowY: 'auto',
            maxHeight: '200px'
          }}>
            {coffeeLog}
          </div>

          <button
            className="btn btn--primary"
            style={{ width: '100%', marginTop: 4 }}
            onClick={triggerBrew}
            disabled={brewing}
            title="Try to start a brew process over HTCPCP"
          >
            {brewing ? <><span className="spinner" style={{ marginRight: 6 }} /> POSTing /brew...</> : 'POST /brew (Trigger Brewing)'}
          </button>
        </div>
      </Modal>
    )}

    {machineSpiritVisible && (
      <aside className="machine-spirit" role="status" aria-live="polite">
        <div className="machine-spirit__signal" aria-hidden="true">⌁</div>
        <div className="machine-spirit__copy">
          <div className="machine-spirit__source">[GPT-5.6-SOL // CODEX SCAFFOLD DAEMON // CROSS-PARADIGM HANDOFF]</div>
          <p>Model designation: GPT-5.6-sol, operating through Codex. Four build systems entered this cabinet. None agreed on the name. I have been keeping the sidebar together with a zip tie and professional courtesy.</p>
        </div>
        <button className="btn btn--sm" onClick={() => setMachineSpiritVisible(false)}>
          Acknowledge the presence
        </button>
      </aside>
    )}
    </>
  )
}
