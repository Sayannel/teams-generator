import { useEffect, useState } from 'react'

export const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

// Reads the `md` breakpoint once and keeps it in sync via matchMedia.
// jsdom (used by tests) has no matchMedia implementation, so this safely
// falls back to "mobile" there, matching the app's mobile-first behavior.
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const handleChange = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}
