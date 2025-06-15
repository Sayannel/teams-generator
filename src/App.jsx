import React, { useState } from 'react'
import Step1Setup from './components/Step1Setup'
import Step2Import from './components/Step2Import'
import Step3PlayerList from './components/Step3PlayerList'
import Step4Generate from './components/Step4Generate'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
library.add(fas)

const App = () => {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({ playersPerTeam: 0 })
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])

  const handleStepChange = (n) => setStep(n)

  return (
    <div>
      <header className="navbar navbar-sm bg-red">
        <div className="container py-3 text-white justify-content-center">
          <div className="col col-md-8">
            <div className="d-flex justify-content-between text-white w-100">
              <div>
                <button
                  className="btn btn-link text-white text-decoration-none fw-bold"
                  onClick={() => setStep(1)}
                >
                  Générateur d'équipes
                </button>
              </div>
              <div className="fw-bold">{step} / 4</div>
            </div>
          </div>
        </div>
      </header>
      <main id="main" className="container mt-3">
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
