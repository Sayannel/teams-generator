import { useEffect, useMemo, useRef, useState } from 'react'
import { LogIn, Moon, Sun, UserCheck, Volleyball } from 'lucide-react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { ThemeProvider } from '@mui/material/styles'
import Home from './pages/Home'
import ListsHome from './pages/ListsHome'
import Setup from './pages/Setup'
import PlayersList from './pages/PlayersList'
import GenerateTeams from './pages/GenerateTeams'
import ExportTeams from './pages/ExportTeams'
import StepProgress from './components/ui/StepProgress'
import ConfirmDialog from './components/ui/ConfirmDialog'
import Drawer from './components/ui/Drawer'
import { ToastProvider } from './components/ui/ToastProvider'
import AuthPanel from './components/AuthPanel'
import { useThemePreference } from './lib/useThemePreference'
import { THEME_OPTIONS, resolveTheme } from './lib/theme'
import { buildMuiTheme } from './lib/muiTheme'
import { APP_HEADER_HEIGHT_VAR } from './lib/layout'
import { api } from './lib/api'

export const STEPS_LIST = {
  SETUP: 'setup',
  PLAYERS_LIST: 'players_list',
  GENERATE_TEAMS: 'generate_teams',
  EXPORT_TEAMS: 'export_teams',
}

const TOTAL_STEPS = 4
const STEP_NUMBERS = {
  [STEPS_LIST.SETUP]: 1,
  [STEPS_LIST.PLAYERS_LIST]: 2,
  [STEPS_LIST.GENERATE_TEAMS]: 3,
  [STEPS_LIST.EXPORT_TEAMS]: 4,
}

const App = () => {
  const headerRef = useRef(null)
  const [user, setUser] = useState(null)
  const [step, setStep] = useState(STEPS_LIST.SETUP)
  const [currentList, setCurrentList] = useState(null)
  const [savedRoster, setSavedRoster] = useState([])
  const [config, setConfig] = useState({ playersPerTeam: 0 })
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [isHomeConfirmOpen, setIsHomeConfirmOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isNewSessionFlow, setIsNewSessionFlow] = useState(false)
  const [isManagingLists, setIsManagingLists] = useState(false)
  const [themePreference, setThemePreference] = useThemePreference()
  const resolvedTheme = resolveTheme(themePreference)
  const muiTheme = useMemo(() => buildMuiTheme(resolvedTheme), [resolvedTheme])
  // Hidden on the lists dashboard and the "Gérer mes listes" page — neither
  // is a numbered step; the stepper reappears once a path is picked.
  const showStepper = (step !== STEPS_LIST.SETUP || !user || isNewSessionFlow) && !isManagingLists

  const handleStepChange = (n) => setStep(n)

  const toggleTheme = () => {
    setThemePreference(
      resolvedTheme === THEME_OPTIONS.DARK ? THEME_OPTIONS.LIGHT : THEME_OPTIONS.DARK
    )
  }

  // Login is optional and only unlocks saving/retrieving lists — the app is
  // fully usable without it, so this is a quiet background check, never a
  // loading gate.
  useEffect(() => {
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {})
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  // The sticky header's rendered height varies by breakpoint and content
  // (stepper shown/hidden, config chips shown/hidden), so it's measured
  // live instead of hardcoded — anything else sticking to the viewport top
  // (the step-2 table header) reads this CSS var to offset below it.
  useEffect(() => {
    const el = headerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        APP_HEADER_HEIGHT_VAR,
        `${entry.contentRect.height}px`
      )
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const reset = () => {
    setStep(STEPS_LIST.SETUP)
    setCurrentList(null)
    setSavedRoster([])
    setConfig({ playersPerTeam: 0 })
    setPlayers([])
    setTeams([])
    setIsNewSessionFlow(false)
  }

  const confirmGoHome = () => {
    setIsHomeConfirmOpen(false)
    reset()
  }

  // Nothing meaningful to lose yet if no player has been added — skip the
  // confirmation and go straight home. Same for the lists management page:
  // it has nothing to lose either, everything there is already persisted.
  const handleHomeClick = () => {
    if (isManagingLists) {
      setIsManagingLists(false)
    } else if (players.length === 0) {
      reset()
    } else {
      setIsHomeConfirmOpen(true)
    }
  }

  // A list is just people — team size is chosen per session, so resuming one
  // routes through the Setup step (like an ad-hoc session) instead of
  // jumping straight to the players list.
  const handleResumeList = (list, presentPlayers) => {
    setCurrentList(list)
    setSavedRoster(list.players)
    setPlayers(presentPlayers)
    setIsNewSessionFlow(true)
  }

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser)
    setIsAuthOpen(false)
  }

  // Clears whatever list/roster/session the previous account had open —
  // otherwise it lingers pointed at a list the new session doesn't own,
  // and every subsequent save silently fails server-side.
  const handleLogout = () => {
    setUser(null)
    setIsAuthOpen(false)
    reset()
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ToastProvider>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <AppBar position="sticky" color="primary" ref={headerRef}>
            <Container maxWidth="md">
              <Toolbar disableGutters sx={{ gap: 2, justifyContent: 'space-between' }}>
                <Typography
                  component="button"
                  type="button"
                  onClick={handleHomeClick}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: 'inherit',
                    bgcolor: 'transparent',
                    border: 0,
                    borderRadius: 2,
                    px: 0.5,
                    py: 0.25,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <Volleyball size={24} />
                  Générateur d'équipes
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton
                    onClick={() => setIsAuthOpen(true)}
                    aria-label={user ? 'Mon compte' : 'Connexion'}
                    sx={{
                      border: 1,
                      borderColor: 'rgba(255,255,255,0.4)',
                      borderRadius: '12px',
                      color: 'inherit',
                    }}
                  >
                    {user ? <UserCheck size={20} /> : <LogIn size={20} />}
                  </IconButton>
                  <IconButton
                    onClick={toggleTheme}
                    aria-label={
                      resolvedTheme === THEME_OPTIONS.DARK
                        ? 'Passer au thème clair'
                        : 'Passer au thème sombre'
                    }
                    sx={{
                      border: 1,
                      borderColor: 'rgba(255,255,255,0.4)',
                      borderRadius: '12px',
                      color: 'inherit',
                    }}
                  >
                    {resolvedTheme === THEME_OPTIONS.DARK ? <Sun size={20} /> : <Moon size={20} />}
                  </IconButton>
                </Stack>
              </Toolbar>
              {showStepper && (
                <Box sx={{ pb: 1.5 }}>
                  <StepProgress current={STEP_NUMBERS[step]} total={TOTAL_STEPS} />
                </Box>
              )}
            </Container>
          </AppBar>

          <Container maxWidth="md" sx={{ py: 2 }}>
            {isManagingLists ? (
              <ListsHome onBack={() => setIsManagingLists(false)} />
            ) : (
              <>
                {step === STEPS_LIST.SETUP &&
                  (user && !isNewSessionFlow ? (
                    <Home
                      onStartNewSession={() => setIsNewSessionFlow(true)}
                      onResumeList={handleResumeList}
                      onManageLists={() => setIsManagingLists(true)}
                    />
                  ) : (
                    <Setup handleStepChange={handleStepChange} setConfig={setConfig} user={user} />
                  ))}
                {step === STEPS_LIST.PLAYERS_LIST && (
                  <PlayersList
                    handleStepChange={handleStepChange}
                    players={players}
                    setPlayers={setPlayers}
                    currentList={currentList}
                    savedRoster={savedRoster}
                    setSavedRoster={setSavedRoster}
                    user={user}
                  />
                )}
                {step === STEPS_LIST.GENERATE_TEAMS && (
                  <GenerateTeams
                    handleStepChange={handleStepChange}
                    players={players}
                    config={config}
                    setTeams={setTeams}
                    teams={teams}
                    currentList={currentList}
                  />
                )}
                {step === STEPS_LIST.EXPORT_TEAMS && <ExportTeams teams={teams} reset={reset} />}
              </>
            )}
          </Container>

          <ConfirmDialog
            open={isHomeConfirmOpen}
            title="Retourner à l'accueil ?"
            message="La configuration, les joueur·euse·s et les équipes générées seront réinitialisés."
            confirmLabel="Confirmer"
            onConfirm={confirmGoHome}
            onCancel={() => setIsHomeConfirmOpen(false)}
          />

          <Drawer
            open={isAuthOpen}
            title={user ? 'Mon compte' : 'Connexion'}
            onClose={() => setIsAuthOpen(false)}
          >
            <AuthPanel user={user} onLogin={handleLogin} onLogout={handleLogout} />
          </Drawer>
        </Box>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
