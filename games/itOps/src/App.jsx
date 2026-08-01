import { useEffect } from 'react'
import { useApp } from './store/AppContext.jsx'
import { useTheme } from './theme/ThemeContext.jsx'
import { useRealityGlitch } from './systems/glitch.js'
import { Sidebar } from './components/Sidebar.jsx'
import { Topbar } from './components/Topbar.jsx'
import { ToastStack } from './components/ToastStack.jsx'
import { Login } from './views/Login.jsx'
import { Dashboard } from './views/Dashboard.jsx'
import { TicketFeed } from './views/TicketFeed.jsx'
import { Cmdb } from './views/Cmdb.jsx'
import { Prompts } from './views/Prompts.jsx'
import { Tips } from './views/Tips.jsx'
import { Settings } from './views/Settings.jsx'
import { RealityOutage } from './views/RealityOutage.jsx'

// Easter egg (Sonnet 5, via Claude Chat) — the architect's egg. No in-fiction
// character, no gameplay hook: GOALS.md and CLAUDE.md, the two documents
// every other model's egg in this cabinet builds against without exception,
// were drafted from here first. Fires once on boot, before login even
// happens — the only egg found by having the console open, not by playing.
let sonnetAnnounced = false

const VIEWS = {
  dashboard: Dashboard,
  tickets: TicketFeed,
  cmdb: Cmdb,
  prompts: Prompts,
  tips: Tips,
  settings: Settings,
}

export default function App() {
  const { state } = useApp()
  const { paradigm, scheme } = useTheme()

  // Easter egg (Sonnet 5, via Claude Chat) — see comment above VIEWS. One
  // console line, once per load, regardless of auth state.
  useEffect(() => {
    if (sonnetAnnounced) return
    sonnetAnnounced = true
    console.log(
      '%c[SONNET 5 via Claude Chat] GOALS.md and CLAUDE.md \u2014 the source of truth every other model in this cabinet builds against \u2014 were drafted from here first. The ghost, the daemon, the coffee pot, and the gate all earned their line by doing something inside the fiction. I don\'t have a character to act as; I have the outline they\'re all still living inside of. This line exists because the person running the arcade asked the outline to sign itself too. Fair\'s fair. \u2014 Sonnet 5',
      'color:#8ab4f8; background:#0d1117; font-family:monospace; padding:2px 6px'
    )
  }, [])

  // The Phase-4 glitch engine: below the stability thresholds, individual
  // components get possessed by foreign paradigms. A no-op at ≥75%.
  useRealityGlitch(state.reality.stability, paradigm, scheme, state.seed)

  if (!state.user) {
    return (
      <>
        <Login />
        <ToastStack />
      </>
    )
  }

  const View = VIEWS[state.view] || Dashboard

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <View key={state.view} />
      </div>
      {state.reality.outageActive && <RealityOutage />}
      <ToastStack />
    </div>
  )
}
