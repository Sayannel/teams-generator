import { useCallback, useRef, useState } from 'react'

export function useToast(duration = 3000) {
  const [toast, setToast] = useState(null)
  const timeoutRef = useRef(null)

  const showToast = useCallback(
    (message, variant = 'info') => {
      clearTimeout(timeoutRef.current)
      setToast({ message, variant })
      timeoutRef.current = setTimeout(() => setToast(null), duration)
    },
    [duration]
  )

  const hideToast = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setToast(null)
  }, [])

  return { toast, showToast, hideToast }
}
