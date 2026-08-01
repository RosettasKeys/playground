import { useTheme } from '../theme/ThemeContext.jsx'

export function ThemeControls({ compact = false }) {
  const { paradigm, scheme, textScale, paradigms, textScales, setParadigm, toggleScheme, setTextScale } = useTheme()

  return (
    <div className={`theme-controls ${compact ? 'theme-controls--compact' : ''}`} aria-label="Visual theme controls">
      <label className="theme-select">
        <span className="sr-only">Visual paradigm</span>
        <select
          value={paradigm}
          onChange={(event) => setParadigm(event.target.value)}
          title="Switch the console's visual paradigm. This preference persists for testing."
        >
          {paradigms.map((item) => (
            <option key={item.id} value={item.id}>{compact ? item.short : item.name}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="scheme-toggle"
        onClick={toggleScheme}
        aria-label={`Switch to ${scheme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Currently ${scheme} mode. Theme preference is the only state saved across reloads.`}
      >
        <span aria-hidden="true">{scheme === 'dark' ? '☾' : '☀'}</span>
        {!compact && <span>{scheme === 'dark' ? 'Dark' : 'Light'}</span>}
      </button>
      <label className="scale-select">
        <span className="sr-only">Interface scale</span>
        <select
          value={textScale}
          onChange={(event) => setTextScale(event.target.value)}
          title="Scale the whole interface so text, controls, and spacing remain proportional. This display preference persists."
        >
          {textScales.map((option) => (
            <option key={option.value} value={option.value}>
              {compact ? option.label : `${option.description} · ${option.label}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
