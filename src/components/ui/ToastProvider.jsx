import { createContext, useCallback, useContext, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

const ToastContext = createContext(null)

const SEVERITY = {
  success: 'success',
  error: 'error',
  info: 'info',
}

let nextToastId = 0

/**
 * App-wide toast/notification system (mounted once in App, above every
 * Drawer) so a toast survives things like a Drawer closing right after the
 * action that triggered it — e.g. login closes the auth Drawer immediately.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timeoutsRef = useRef({})

  const hideToast = useCallback((id) => {
    clearTimeout(timeoutsRef.current[id])
    delete timeoutsRef.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, variant = 'info', duration = 3000) => {
      const id = nextToastId++
      setToasts((prev) => [...prev, { id, message, variant }])
      timeoutsRef.current[id] = setTimeout(() => hideToast(id), duration)
    },
    [hideToast]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Box
        sx={(theme) => ({
          position: 'fixed',
          insetInline: 16,
          bottom: 96,
          zIndex: theme.zIndex.snackbar,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          [theme.breakpoints.up('md')]: {
            insetInline: 'auto',
            right: 16,
            bottom: 16,
            width: 320,
          },
        })}
      >
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            severity={SEVERITY[toast.variant] ?? 'info'}
            variant="filled"
            onClick={() => hideToast(toast.id)}
            sx={{ cursor: 'pointer', boxShadow: 3 }}
          >
            {toast.message}
          </Alert>
        ))}
      </Box>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
