import React, { useState } from 'react'
import Step1Setup from './components/Step1Setup'
import Step2Import from './components/Step2Import'
import Step3PlayerList from './components/Step3PlayerList'
import Step4Generate from './components/Step4Generate'

const App = () => {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({ playersPerTeam: 0, skillRange: 0 })
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])

  const handleStepChange = (n) => setStep(n)

  return (
    <div className="container">
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
  )
}

export default App
