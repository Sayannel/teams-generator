const STORAGE_KEY = 'teams-generator-theme'

export const THEME_OPTIONS = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
}

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? THEME_OPTIONS.DARK
    : THEME_OPTIONS.LIGHT
}

export function getStoredPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === THEME_OPTIONS.LIGHT || stored === THEME_OPTIONS.DARK ? stored : null
  } catch {
    return null
  }
}

export function setStoredPreference(preference) {
  try {
    if (preference === THEME_OPTIONS.SYSTEM) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Storage unavailable (private browsing, etc.) — the preference just won't persist.
  }
}

export function resolveTheme(preference) {
  return preference === THEME_OPTIONS.LIGHT || preference === THEME_OPTIONS.DARK
    ? preference
    : getSystemTheme()
}

export function applyResolvedTheme(resolved) {
  document.documentElement.setAttribute('data-theme', resolved)
}
