import { useApp } from '../store/AppContext.jsx'
import { Led, Avatar, Skel } from '../components/Bits.jsx'
import { timeAgo } from '../utils/time.js'
import { teamById } from '../data/seed.js'
import { useTheme } from '../theme/ThemeContext.jsx'

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard">
      <Skel h={64} style={{ marginBottom: 22, borderRadius: 'var(--radius-lg)' }} />
      <div className="stat-grid">
        {[0, 1, 2, 3].map((i) => <Skel key={i} h={118} style={{ borderRadius: 'var(--radius-lg)' }} />)}
      </div>
      <div className="dash-cols">
        <Skel h={420} style={{ borderRadius: 'var(--radius-lg)' }} />
        <Skel h={320} style={{ borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  )
}

export function Dashboard() {
  const { state, dispatch } = useApp()
  const { meta } = useTheme()
  const { data, loading, user } = state

  if (loading || !data) {
    return (
      <div className="content">
        <div className="page-head">
          <div className="eyebrow">{meta.overview}</div>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <DashboardSkeleton />
      </div>
    )
  }

  const { tickets, incidents, activity, oncall } = data
  const activeInc = incidents.find((i) => i.status === 'active')
  const openP1 = tickets.filter((t) => t.priority === 'P1' && t.status !== 'resolved').length
  const reopened = tickets.reduce((sum, t) => sum + t.reopenCount, 0)
  const unresolved = tickets.filter((t) => t.status !== 'resolved').length
  const tzSpread = new Set(oncall.map((o) => o.region)).size

  const stats = [
    {
      label: 'Open P1s', value: openP1, alarm: openP1 > 0, led: openP1 > 0 ? 'p1' : 'ok',
      desc: 'Unresolved tickets at the highest severity. Each one is a meeting someone is scheduling about you right now.',
    },
    {
      label: 'Queue depth', value: unresolved, led: 'amber',
      desc: 'Every ticket not yet resolved. It goes down when you work and up when you sleep, which is why you stopped.',
    },
    {
      label: 'Reopens this week', value: reopened, led: reopened > 2 ? 'p1' : 'p3',
      desc: 'Times a "resolved" ticket came back for an encore. Three of these are the same ticket. You know which one.',
    },
    {
      label: 'Time zones on call', value: tzSpread, led: 'p3',
      desc: 'Distinct zones in the current rotation. Your P1 follows the sun; the sun has not been consulted.',
    },
  ]

  return (
    <div className="content">
      <div className="page-head">
        <div className="eyebrow">{meta.overview}</div>
        <h1 className="page-title">Morning, {user?.name?.split(' ')[0]?.replace(/\.$/, '') || 'commander'}. It is not morning everywhere.</h1>
        <p className="page-sub">
          The state of everything you are responsible for, condensed into numbers you can read
          while a bridge call happens in your other ear.
        </p>
      </div>

      {activeInc && (
        <div className="fire-banner" role="alert">
          <Led color="p1" blink title="This LED blinks until the incident stops being active. It has been blinking a while." />
          <div>
            <div className="fire-banner__title">
              <span className="mono">{activeInc.id}</span> · {activeInc.title}
            </div>
            <div className="fire-banner__meta">
              {activeInc.severity} · running {timeAgo(activeInc.startedAt).replace(' ago', '')} · {activeInc.timezonesAffected.length} time zones affected · {activeInc.slackPingsSuppressed} Slack pings suppressed so far
            </div>
          </div>
          <div className="fire-banner__cta">
            <button
              className="btn btn--danger btn--sm"
              onClick={() => dispatch({ type: 'VIEW_SET', view: 'tickets' })}
              title="Open the seeded ticket feed. Incident gameplay arrives after the Phase 0 shell is approved."
            >
              Review ticket feed
            </button>
          </div>
        </div>
      )}

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className={`card stat-card ${s.alarm ? 'stat-card--alarm' : ''}`}>
            <div className="stat-card__top">
              <span className="stat-card__label">{s.label}</span>
              <Led color={s.led} pulse={s.alarm} />
            </div>
            <div className="stat-card__value">{s.value}</div>
            <div className="stat-card__desc">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="dash-cols">
        <div className="card panel">
          <div className="panel__head">
            <div>
              <div className="panel__title"><Led color="amber" pulse /> Live activity</div>
              <div className="panel__desc">What the team actually did, minus the 380 messages that just said "any update?"</div>
            </div>
          </div>
          <ul>
            {activity.map((a, i) => {
              const who = teamById(a.who)
              return (
                <li key={i} className="feed-item">
                  <Avatar userId={a.who} size={28} />
                  <div className="feed-item__body">
                    <div className="feed-item__text"><b>{who.name}</b> {a.text}</div>
                    <div className="feed-item__meta">
                      <span>{timeAgo(a.at)}</span>
                      <span>{a.ref}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="card panel">
          <div className="panel__head">
            <div>
              <div className="panel__title"><Led color="p3" /> On-call rotation</div>
              <div className="panel__desc">Who answers the pager in each zone, and their current condition.</div>
            </div>
          </div>
          <ul>
            {oncall.map((o) => {
              const who = teamById(o.who)
              return (
                <li key={o.who} className="oncall-row">
                  <Led color={o.status === 'active' ? 'ok' : 'p4'} pulse={o.status === 'active'} title={o.status === 'active' ? 'Currently on shift' : 'On standby — asleep, or claiming to be'} />
                  <div>
                    <div className="oncall-row__name">
                      {who.name}
                      <span>{o.region} · {o.window}</span>
                    </div>
                    <div className="oncall-row__note">{o.note}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
