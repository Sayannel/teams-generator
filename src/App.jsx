import React, { useEffect, useState } from 'react'
import Setup from './pages/Setup'
import ImportPlayers from './pages/ImportPlayers'
import PlayersList from './pages/PlayersList'
import GenerateTeams from './pages/GenerateTeams'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import ExportTeams from './pages/ExportTeams'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import ImportMode from './pages/ImportMode'

library.add(fas)

export const STEPS_LIST = {
  SETUP: 'setup',
  IMPORT_MODE: 'import_mode',
  FETCH_LISTS: 'fetch_lists',
  IMPORT_PLAYERS: 'import_players',
  PLAYERS_LIST: 'players_list',
  GENERATE_TEAMS: 'generate_teams',
  EXPORT_TEAMS: 'export_teams',
}

const App = () => {
  const [step, setStep] = useState(STEPS_LIST.SETUP)
  const [config, setConfig] = useState({ playersPerTeam: 0 })
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])

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

  return (
    <div>
      <header className="navbar navbar-sm bg-red">
        <div className="container py-1 text-white justify-content-center">
          <div className="col col-md-8">
            <div className="d-flex justify-content-between align-items-center text-white w-100">
              <h1 className="display-6 mb-0" id="app-title">
                <FontAwesomeIcon icon="volleyball" className="me-2" />
                Générateur d'équipes
              </h1>
              <div className="fw-bold border p-2 rounded">
                {players.length}
                <FontAwesomeIcon icon="users" className="ms-3" />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main id="main" className="container py-3">
        <div className="row justify-content-center">
          <div className="col col-12 col-md-8">
            {step === STEPS_LIST.SETUP && (
              <Setup handleStepChange={handleStepChange} setConfig={setConfig} />
            )}
            {step === STEPS_LIST.IMPORT_MODE && (
              <ImportMode handleStepChange={handleStepChange} setPlayers={setPlayers} />
            )}
            {step === STEPS_LIST.IMPORT_PLAYERS && (
              <ImportPlayers
                handleStepChange={handleStepChange}
                players={players}
                setPlayers={setPlayers}
              />
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
          </div>
        </div>
      </main>

      {step === STEPS_LIST.SETUP && (
        <footer className="text-center text-muted bg-light py-2">
          <small>
            <a href="https://github.com/Sayannel" target="_blank" rel="noopener noreferrer">
              &copy; Axel Gaillard
            </a>
          </small>
        </footer>
      )}
    </div>
  )
}

export default App
