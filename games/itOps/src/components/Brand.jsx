import { useTheme } from '../theme/ThemeContext.jsx'

export function Brand({ compact = false }) {
  const { meta } = useTheme()

  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <div className="brand-mark" aria-hidden="true"><span>{meta.short}</span></div>
      <div className="brand-copy">
        <div className="brand-name">{meta.name}</div>
        {!compact && <div className="brand-tag">{meta.descriptor}</div>}
      </div>
    </div>
  )
}
