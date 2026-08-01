import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  COLOR_SCHEMES,
  PARADIGMS,
  TEXT_SCALES,
  THEME_STORAGE_KEY,
  isColorScheme,
  isParadigm,
  isTextScale,
} from './themes.js'

const ThemeContext = createContext(null)

function systemScheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initialPreference() {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY))
    return {
      paradigm: isParadigm(saved?.paradigm) ? saved.paradigm : 'opspiral',
      scheme: isColorScheme(saved?.scheme) ? saved.scheme : systemScheme(),
      textScale: isTextScale(saved?.textScale) ? String(saved.textScale) : '1',
    }
  } catch {
    return { paradigm: 'opspiral', scheme: systemScheme(), textScale: '1' }
  }
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(initialPreference)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = preference.paradigm
    root.dataset.colorScheme = preference.scheme
    root.dataset.textScale = preference.textScale
    root.style.colorScheme = preference.scheme

    // This is the project's only approved persistent state.
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference))
  }, [preference])

  const setParadigm = useCallback((paradigm) => {
    if (isParadigm(paradigm)) setPreference((current) => ({ ...current, paradigm }))
  }, [])

  const setScheme = useCallback((scheme) => {
    if (isColorScheme(scheme)) setPreference((current) => ({ ...current, scheme }))
  }, [])

  const toggleScheme = useCallback(() => {
    setPreference((current) => ({
      ...current,
      scheme: current.scheme === 'dark' ? 'light' : 'dark',
    }))
  }, [])

  const setTextScale = useCallback((textScale) => {
    if (isTextScale(textScale)) setPreference((current) => ({ ...current, textScale: String(textScale) }))
  }, [])

  const value = useMemo(() => ({
    ...preference,
    meta: PARADIGMS[preference.paradigm],
    paradigms: Object.values(PARADIGMS),
    colorSchemes: COLOR_SCHEMES,
    textScales: TEXT_SCALES,
    setParadigm,
    setScheme,
    toggleScheme,
    setTextScale,
  }), [preference, setParadigm, setScheme, toggleScheme, setTextScale])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
