import { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { Skel } from '../components/Bits.jsx'
import { ThemeControls } from '../components/ThemeControls.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'

const SETTING_DEFS = [
  {
    key: 'pageBeforeTwitter',
    name: 'Page me before social media finds out',
    desc: 'Alerts route to your pager the moment monitoring fires, instead of waiting for a customer to livestream the outage. Turning this off is a choice you would have to live with publicly.',
  },
  {
    key: 'suppressAnyUpdate',
    name: 'Suppress "any update?" messages during incidents',
    desc: 'Auto-mutes messages that consist entirely of a status request while a SEV1 is active. The senders are answered in bulk when there is, in fact, an update.',
  },
  {
    key: 'janetEarlyWarning',
    name: 'Reopen early-warning system',
    desc: 'Notifies you when a requester with 2+ prior reopens views one of their resolved tickets, giving you up to 90 seconds of emotional preparation before the inevitable.',
  },
  {
    key: 'calmVoice',
    name: 'Narrate alerts in a calm voice',
    desc: 'Reads P1 pages aloud in the tone of a meditation app. "A core switch has, gently, ceased to be. Breathe in." Experimental; unsettles some users more than the sirens did.',
  },
]

export function Settings() {
  const { state, mutate, resetDemo } = useApp()
  const { data, loading, user } = state
  const [resetting, setResetting] = useState(false)
  const { meta } = useTheme()

  const toggle = (key, def) => {
    const next = !data.settings[key]
    mutate(
      (d) => ({ ...d, settings: { ...d.settings, [key]: next } }),
      {
        success: `"${def.name}" turned ${next ? 'on' : 'off'}.`,
        failurePrefix: 'Could not save that preference.',
      }
    )
  }

  const doReset = async () => {
    setResetting(true)
    await resetDemo()
    setResetting(false)
  }

  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">system</div>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">
          Theme testing, session-only notification filters, and the lever that restores the demo
          to its original chaos. Only the visual theme survives a reload.
        </p>
      </div>

      {loading || !data ? (
        <div className="settings-stack" role="status" aria-label="Loading settings">
          <Skel h={120} style={{ borderRadius: 'var(--radius-lg)' }} />
          <Skel h={280} style={{ borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : (
        <div className="settings-stack">
          <section className="card panel">
            <div className="panel__head">
              <div>
                <div className="panel__title">Profile</div>
                <div className="panel__desc">Who the app believes you are. It is not wrong.</div>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__name">{user?.name}</div>
                <div className="setting-row__desc">{user?.role} · consciousness streak: 71 hours · tornadoes evaded: 1 · RCAs rejected with love: 4</div>
              </div>
            </div>
          </section>

          <section className="card panel theme-lab">
            <div className="panel__head">
              <div>
                <div className="panel__title">Visual paradigm laboratory</div>
                <div className="panel__desc">All three identities share one component tree. Tokens, shape, typography, and terminology change here without remounting the app.</div>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__name">Current identity: {meta.name}</div>
                <div className="setting-row__desc">This is the sole preference written to browser storage so light/dark and paradigm testing remain comfortable across refreshes.</div>
              </div>
              <ThemeControls />
            </div>
            <div className="theme-swatches" aria-label="Current semantic color tokens">
              <span className="swatch swatch--surface">surface</span>
              <span className="swatch swatch--accent">accent</span>
              <span className="swatch swatch--danger">P1</span>
              <span className="swatch swatch--success">stable</span>
            </div>
          </section>

          <section className="card panel">
            <div className="panel__head">
              <div>
                <div className="panel__title">Notification filters</div>
                <div className="panel__desc">Each toggle is session-only and exercises the optimistic rollback seam. Refreshing restores defaults.</div>
              </div>
            </div>
            {SETTING_DEFS.map((def) => (
              <div key={def.key} className="setting-row">
                <div>
                  <div className="setting-row__name">{def.name}</div>
                  <div className="setting-row__desc">{def.desc}</div>
                </div>
                <button
                  className={`switch ${data.settings[def.key] ? 'is-on' : ''}`}
                  role="switch"
                  aria-checked={data.settings[def.key]}
                  aria-label={def.name}
                  onClick={() => toggle(def.key, def)}
                  title={`${data.settings[def.key] ? 'On — click to disable' : 'Off — click to enable'}: ${def.name}`}
                />
              </div>
            ))}
          </section>

          <section className="card panel danger-zone">
            <div className="panel__head">
              <div>
                <div className="panel__title">Demo data</div>
                <div className="panel__desc">Gameplay lives in memory only. This resets the current in-memory snapshot without touching your visual theme.</div>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__name">Reset to factory chaos</div>
                <div className="setting-row__desc">
                  Discards all your changes and restores the original 18 seeded tickets, 3 incidents, and full activity feed —
                  timestamps regenerated so it all looks freshly terrible. Cannot be undone, exactly like the fiber cut.
                </div>
              </div>
              <button className="btn btn--danger" onClick={doReset} disabled={resetting} title="Wipe local changes and re-seed every ticket, incident, and feed entry from the original demo data">
                {resetting && <span className="spinner" aria-hidden="true" />}
                {resetting ? 'Re-seeding…' : 'Reset demo data'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
