import React, { useState } from 'react'

const Step1Setup = ({ handleStepChange, setConfig }) => {
  const [playersPerTeam, setPlayersPerTeam] = useState(4)
  const [skillRange, setSkillRange] = useState(8)

  const handleSubmit = (e) => {
    e.preventDefault()
    setConfig({ playersPerTeam, skillRange })
    handleStepChange(2)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-3 text-red">Configurer les équipes</h2>
      <div className="mb-3">
        <label className="form-label">Nombre de joueur·euse·s par équipe :</label>
        <input
          type="number"
          className="form-control"
          value={playersPerTeam}
          onChange={(e) => setPlayersPerTeam(parseInt(e.target.value))}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Nombre de niveaux :</label>
        <input
          type="number"
          className="form-control"
          value={skillRange}
          onChange={(e) => setSkillRange(parseInt(e.target.value))}
          required
        />
      </div>

      <div className="row justify-content-end mt-4">
        <div className="col col-auto">
          <button type="submit" className="btn btn-red">
            Valider
          </button>
        </div>
      </div>
    </form>
  )
}

export default Step1Setup
