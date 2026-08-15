import MuiFab from '@mui/material/Fab'

// An "extended" pill with a visible label reads clearer on mobile than a
// bare icon circle, and its rounded-rect shape (not a full circle) matches
// the corner language used by every other button in the app.
// `right` uses the same centered column formula as the page content so on
// wide viewports the button stays anchored to that column's edge instead of
// drifting off to the far right of the window.
const Fab = ({ children, sx, ...props }) => (
  <MuiFab
    variant="extended"
    color="primary"
    sx={[
      (theme) => ({
        position: 'fixed',
        bottom: 96,
        right: 'max(1rem, calc(50vw - 20rem))',
        zIndex: theme.zIndex.fab,
        borderRadius: '14px',
        px: 2.5,
        gap: 1,
        [theme.breakpoints.up('md')]: { bottom: 24 },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  >
    {children}
  </MuiFab>
)

export default Fab
