import { useApp } from '../store/AppContext.jsx'
import { useTheme } from '../theme/ThemeContext.jsx'
import { Led } from './Bits.jsx'
import { IconX } from './Icons.jsx'
import { crossVoiceSuffix } from '../systems/glitch.js'

export function ToastStack() {
  const { state, dispatch } = useApp()
  const { paradigm } = useTheme()
  if (state.toasts.length === 0) return null
  return (
    <div className="toast-stack" aria-live="polite">
      {state.toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`} role="status">
          <Led color={t.kind === 'error' ? 'p1' : 'ok'} pulse={t.kind === 'error'} />
          <span>{t.message}{crossVoiceSuffix(state.reality.stability, state.seed, paradigm, t.id)}</span>
          <button
            className="icon-btn toast__dismiss"
            onClick={() => dispatch({ type: 'TOAST_DISMISS', id: t.id })}
            title="Dismiss this notification"
            aria-label="Dismiss notification"
          >
            <IconX width={13} height={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
