import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import MuiDrawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { X } from 'lucide-react'
import { useIsDesktop } from '../../lib/useIsDesktop'

// Mobile-first: this app's primary surface is the phone, where a bottom
// sheet keeps content reachable by the thumb. On desktop there's no such
// reach constraint and a bottom sheet just reads as a misplaced modal, so it
// becomes a normal centered dialog instead.
const Drawer = ({ open, title, onClose, children, maxWidth = 'xs' }) => {
  const isDesktop = useIsDesktop()

  const header = (
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}
    >
      {title && (
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      )}
      <IconButton onClick={onClose} aria-label="Fermer" size="small" sx={{ ml: 'auto' }}>
        <X size={20} />
      </IconButton>
    </Box>
  )

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={maxWidth}
        fullWidth
        aria-label={title}
        slotProps={{
          paper: {
            sx: { maxHeight: '85vh', p: 3 },
          },
        }}
      >
        {header}
        {children}
      </Dialog>
    )
  }

  return (
    <MuiDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      aria-label={title}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            mx: 'auto',
            width: '100%',
            maxWidth: 480,
            maxHeight: '85vh',
            p: 2.5,
            pb: 'calc(1.25rem + env(safe-area-inset-bottom))',
          },
        },
      }}
    >
      {header}
      {children}
    </MuiDrawer>
  )
}

export default Drawer
