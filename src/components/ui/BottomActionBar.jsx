import Paper from '@mui/material/Paper'

const BottomActionBar = ({ children, sx = [] }) => (
  <Paper
    elevation={3}
    sx={[
      (theme) => ({
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar,
        p: 1.5,
        pb: 'calc(0.75rem + env(safe-area-inset-bottom))',
        borderTop: 1,
        borderColor: 'divider',
        borderRadius: 0,
        [theme.breakpoints.up('md')]: {
          position: 'static',
          border: 0,
          boxShadow: 'none',
          backgroundColor: 'transparent',
          p: 0,
        },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Paper>
)

export default BottomActionBar
