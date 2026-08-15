import { createTheme } from '@mui/material/styles'
import { THEME_OPTIONS } from './theme'

export function buildMuiTheme(resolvedTheme) {
  const isDark = resolvedTheme === THEME_OPTIONS.DARK
  const headerRed = isDark ? '#7a1f1f' : '#b90c11'
  const primaryLight = isDark ? '#d97a7a' : '#f87171'

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#b23a3a' : '#da0a0a',
        light: primaryLight,
        dark: headerRed,
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#141822' : '#f8fafc',
        paper: isDark ? '#1b212c' : '#ffffff',
      },
      // RatingDots' "good" (2nd-best) tier — not one of MUI's standard
      // semantic colors (success/warning/error), so it needs its own entry
      // to track light/dark like the others instead of a raw hex value.
      good: { main: isDark ? '#ca8a04' : '#eab308' },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Inter","Roboto","Helvetica","Arial",sans-serif',
      fontWeightBold: 700,
    },
    components: {
      MuiTypography: {
        styleOverrides: {
          h5: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12, minHeight: 44, fontWeight: 600, whiteSpace: 'nowrap' },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: isDark ? { backgroundColor: headerRed } : {},
        },
      },
    },
  })
}
