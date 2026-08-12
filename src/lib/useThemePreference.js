import { useEffect, useState } from 'react'
import {
  THEME_OPTIONS,
  applyResolvedTheme,
  getStoredPreference,
  resolveTheme,
  setStoredPreference,
} from './theme'

export function useThemePreference() {
  const [preference, setPreference] = useState(() => getStoredPreference() ?? THEME_OPTIONS.SYSTEM)

  useEffect(() => {
    applyResolvedTheme(resolveTheme(preference))

    if (preference !== THEME_OPTIONS.SYSTEM) return

    // Following the OS setting: keep the app in sync if it changes while open.
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyResolvedTheme(resolveTheme(THEME_OPTIONS.SYSTEM))
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [preference])

  const changePreference = (next) => {
    setStoredPreference(next)
    setPreference(next)
  }

  return [preference, changePreference]
}
