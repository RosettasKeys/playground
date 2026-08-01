import { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { api } from '../api/fakeApi.js'
import { Brand } from '../components/Brand.jsx'
import { ThemeControls } from '../components/ThemeControls.jsx'
import { ArcadeExit } from '../components/ArcadeExit.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'

export function Login() {
  const { dispatch, toast } = useApp()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const { meta } = useTheme()

  const signIn = async (bypass = false) => {
    setBusy(true)
    const user = await api.login(bypass ? 'R. Keys' : name)
    dispatch({ type: 'SESSION_SET', user })
    toast(
      bypass
        ? 'SSO bypassed. Security has been notified. Security is you. You do not care.'
        : `Welcome back, ${user.name}. The queue missed you. The queue grew.`,
      'success'
    )
    setBusy(false)
  }

  return (
    <div className="login">
      <div className="login__theme">
        <ArcadeExit className="btn btn--ghost btn--sm" />
        <ThemeControls />
      </div>
      <div className="card login__card">
        <div className="login__brand">
          <Brand />
        </div>

        <div className="eyebrow">{meta.consoleLabel}</div>
        <h1 className="login__title">Sign in to the incident</h1>
        <p className="login__sub">
          There is always an incident. Authentication is decorative: any credentials are
          accepted, because the last person who forgot the admin password is the admin.
        </p>

        <form
          className="login__form"
          onSubmit={(e) => { e.preventDefault(); signIn(false) }}
        >
          <div className="field">
            <label className="field__label" htmlFor="login-name">Name or handle</label>
            <input
              id="login-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="R. Keys"
              autoComplete="username"
            />
            <span className="field__hint">Whatever you type becomes your identity. Leave blank to be R. Keys, incident commander, hour 71.</span>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="login-pass">Password</label>
            <input
              id="login-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="anything works, and that should worry you"
              autoComplete="current-password"
            />
            <span className="field__hint">Not checked, not stored, not judged. This is a demo; the real security theater is at the office.</span>
          </div>
          <button className="btn btn--primary" type="submit" disabled={busy} title="Sign in with the credentials above, which are accepted unconditionally">
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Authenticating (theatrically)…' : 'Sign in'}
          </button>
        </form>

        <div className="login__divider">OR</div>

        <button
          className="btn"
          style={{ width: '100%' }}
          onClick={() => signIn(true)}
          disabled={busy}
          title="Skip the form entirely — signs you in as the default persona because the identity provider is having a moment"
        >
          SSO is down again — just let me in
        </button>

        <p className="login__fine">
          By signing in you accept the on-call schedule, the reopened tickets, and the possibility
          of weather. Refreshing clears the session and all gameplay state. Only this visual theme
          preference survives, because testing in surprise light mode is itself a P1.
        </p>
      </div>
    </div>
  )
}
