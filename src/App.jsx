import React, { useState } from 'react'
import Step1Setup from './components/Step1Setup'
import Step2Import from './components/Step2Import'
import Step3PlayerList from './components/Step3PlayerList'
import Step4Generate from './components/Step4Generate'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
library.add(fas)

const App = () => {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({ playersPerTeam: 0, skillRange: 0 })
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])

  const handleStepChange = (n) => setStep(n)

  return (
    <div className="pt-5">
      <header className="navbar navbar-sm bg-red fixed-top">
        <div className="container py-3 text-white fw-bold">
          <div className="d-flex justify-content-between text-white fw-bold w-100">
            <div>Générateur d'équipes</div>
            <div>{step} / 4</div>
          </div>
        </div>
      </header>
      <main id="main" className="container mt-3">
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
      </main>
      <footer className="text-center text-muted bg-light py-2">
        <small>
          <a href="https://github.com/Sayannel" target="_blank" rel="noopener noreferrer">
            &copy; Axel Gaillard
          </a>
        </small>
      </footer>
    </div>
  )
}

export default App
