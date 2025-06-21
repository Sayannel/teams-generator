import React, { useEffect, useState } from 'react'
import Step1Setup from './components/Step1Setup'
import Step2Import from './components/Step2Import'
import Step3PlayerList from './components/Step3PlayerList'
import Step4Generate from './components/Step4Generate'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import Step5Export from './components/Step5Export'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
library.add(fas)

const App = () => {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({ playersPerTeam: 0 })
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])

  const handleStepChange = (n) => setStep(n)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const reset = () => {
    setStep(1)
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
            {step === 1 && <Step1Setup handleStepChange={handleStepChange} setConfig={setConfig} />}
            {step === 2 && (
              <Step2Import
                handleStepChange={handleStepChange}
                players={players}
                setPlayers={setPlayers}
                config={config}
              />
            )}
            {step === 3 && (
              <Step3PlayerList
                handleStepChange={handleStepChange}
                players={players}
                setPlayers={setPlayers}
              />
            )}
            {step === 4 && (
              <Step4Generate
                handleStepChange={handleStepChange}
                players={players}
                config={config}
                setTeams={setTeams}
                teams={teams}
              />
            )}
            {step === 5 && (
              <Step5Export teams={teams} handleStepChange={handleStepChange} reset={reset} />
            )}
          </div>
        </div>
      </main>

      {step === 1 && (
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
