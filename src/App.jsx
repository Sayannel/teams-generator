import { useEffect, useState } from 'react'
import { Users, UsersRound, Volleyball } from 'lucide-react'
import Setup from './pages/Setup'
import PlayersList from './pages/PlayersList'
import GenerateTeams from './pages/GenerateTeams'
import ExportTeams from './pages/ExportTeams'
import StepProgress from './components/ui/StepProgress'
import ConfirmDialog from './components/ui/ConfirmDialog'

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
  const [step, setStep] = useState(STEPS_LIST.SETUP)
  const [config, setConfig] = useState({ playersPerTeam: 0 })
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [isHomeConfirmOpen, setIsHomeConfirmOpen] = useState(false)

  const handleStepChange = (n) => setStep(n)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const reset = () => {
    setStep(STEPS_LIST.SETUP)
    setConfig({ playersPerTeam: 0 })
    setPlayers([])
    setTeams([])
  }

  const confirmGoHome = () => {
    setIsHomeConfirmOpen(false)
    reset()
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-20 bg-brand-600 text-white">
        <div className="mx-auto max-w-2xl px-4 py-3 md:max-w-4xl lg:max-w-5xl">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold">
              <button
                type="button"
                onClick={() => setIsHomeConfirmOpen(true)}
                className="-ml-1 flex cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Volleyball className="size-6" />
                Générateur d'équipes
              </button>
            </h1>
            <div className="flex items-center divide-x divide-white/40 rounded-lg border border-white/40 font-bold">
              {config.playersPerTeam > 0 && (
                <div className="flex items-center gap-1 px-3 py-1">
                  {config.playersPerTeam}
                  <UsersRound className="size-4" />
                </div>
              )}
              <div className="flex items-center gap-1 px-3 py-1">
                {players.length}
                <Users className="size-4" />
              </div>
            </div>
          </div>
          <div className="mt-2">
            <StepProgress current={STEP_NUMBERS[step]} total={TOTAL_STEPS} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4 md:max-w-4xl lg:max-w-5xl">
        {step === STEPS_LIST.SETUP && (
          <Setup handleStepChange={handleStepChange} setConfig={setConfig} />
        )}
        {step === STEPS_LIST.PLAYERS_LIST && (
          <PlayersList
            handleStepChange={handleStepChange}
            players={players}
            setPlayers={setPlayers}
          />
        )}
        {step === STEPS_LIST.GENERATE_TEAMS && (
          <GenerateTeams
            handleStepChange={handleStepChange}
            players={players}
            config={config}
            setTeams={setTeams}
            teams={teams}
          />
        )}
        {step === STEPS_LIST.EXPORT_TEAMS && (
          <ExportTeams teams={teams} handleStepChange={handleStepChange} reset={reset} />
        )}
      </main>

      {step === STEPS_LIST.SETUP && (
        <footer className="pb-6 text-center text-sm text-slate-500">
          <a
            href="https://github.com/Sayannel"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-600"
          >
            &copy; Axel Gaillard
          </a>
        </footer>
      )}

      <ConfirmDialog
        open={isHomeConfirmOpen}
        title="Retourner à l'accueil ?"
        message="La configuration, les joueur·euse·s et les équipes générées seront réinitialisés."
        confirmLabel="Retourner à l'accueil"
        onConfirm={confirmGoHome}
        onCancel={() => setIsHomeConfirmOpen(false)}
      />
    </div>
  )
}

export default App
