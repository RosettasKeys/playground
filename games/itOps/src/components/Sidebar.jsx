import { useApp } from '../store/AppContext.jsx'
import { api } from '../api/fakeApi.js'
import { Led } from './Bits.jsx'
import { IconLogout } from './Icons.jsx'
import { Brand } from './Brand.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'
import { bleedNavLabel } from '../systems/glitch.js'

const NAV = [
  {
    group: 'Operations',
    items: [
      {
        id: 'dashboard', label: 'Dashboard',
        desc: 'Everything currently on fire, at a glance, before coffee.',
        led: (d) => ({ color: d?.incidents.some((i) => i.status === 'active') ? 'p1' : 'ok', pulse: true }),
      },
      {
        id: 'tickets', label: 'Ticket Queue',
        desc: 'The pile. Create, triage, resolve, watch them come back.',
        led: () => ({ color: 'amber' }),
        badge: (d) => d?.tickets.filter((t) => t.status !== 'resolved' && t.priority === 'P1').length || 0,
        badgeSuffix: 'P1',
      },
      {
        id: 'cmdb', label: 'CMDB',
        desc: 'The bestiary. Everything you fused, in order of regret.',
        led: (d) => ({ color: d?.cmdb?.length ? 'amber' : 'p4', pulse: !!d?.cmdb?.length }),
        badge: (d) => d?.cmdb?.length || 0,
        badgeSuffix: 'bred',
      },
    ],
  },
  {
    group: 'Survival Kit',
    items: [
      {
        id: 'prompts', label: 'Unhinged AI Prompts',
        desc: 'Battle-tested prompts for RCAs, handoffs, and Janet.',
        led: () => ({ color: 'p3' }),
      },
      {
        id: 'tips', label: 'Efficiency Tips',
        desc: 'Hard-won operational wisdom. Emphasis on the hard.',
        led: () => ({ color: 'p3' }),
      },
    ],
  },
  {
    group: 'System',
    items: [
      {
        id: 'settings', label: 'Settings',
        desc: 'Theme lab, session behavior, and notification filters.',
        led: () => ({ color: 'p4' }),
      },
    ],
  },
]

export function Sidebar() {
  const { state, dispatch, toast } = useApp()
  const { meta, paradigm } = useTheme()
  const { view, data, user, sidebarOpen } = state
  // Below 50% stability, some labels render in another paradigm's voice —
  // terminology bleed, deterministic per (seed, stability, key).
  const navLabel = (id, fallback) =>
    bleedNavLabel(state.reality.stability, state.seed, paradigm, id, meta.nav[id] || fallback)

  const logout = () => {
    api.logout()
    dispatch({ type: 'SESSION_CLEAR' })
    toast('Signed out. The tickets will be here when you return. They are always here.', 'success')
  }

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar__scrim"
          onClick={() => dispatch({ type: 'SIDEBAR_TOGGLE', open: false })}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar__brand">
          <Brand />
        </div>

        <nav className="sidebar__nav">
          {NAV.map((group) => (
            <div key={group.group}>
              <div className="nav-group-label">{group.group}</div>
              {group.items.map((item) => {
                const led = item.led(data)
                const badge = item.badge ? item.badge(data) : 0
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${view === item.id ? 'is-active' : ''}`}
                    onClick={() => dispatch({ type: 'VIEW_SET', view: item.id })}
                    aria-current={view === item.id ? 'page' : undefined}
                  >
                    <Led {...led} />
                    <span>
                      <span className="nav-item__label">
                        {navLabel(item.id, item.label)}
                        {badge > 0 && <span className="nav-badge" title={item.id === 'cmdb' ? `${badge} hybrid${badge > 1 ? 's' : ''} bred this session` : `${badge} unresolved P1 ticket${badge > 1 ? 's' : ''} in the queue`}>{badge} {item.badgeSuffix ?? 'P1'}</span>}
                      </span>
                      <span className="nav-item__desc">{item.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar__foot">
          <span className="avatar" title={`${user?.name} — ${user?.role}`}>{(user?.name || 'RK').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
          <div className="sidebar__foot-meta">
            <div className="sidebar__foot-name">{user?.name}</div>
            <div className="sidebar__foot-note">hour 71 · four time zones deep</div>
          </div>
          <button className="icon-btn" onClick={logout} title="Sign out. The queue survives without you; you are allowed to test this." aria-label="Sign out">
            <IconLogout />
          </button>
        </div>
      </aside>
    </>
  )
}
