import React, { useState } from 'react'

const Step3PlayerList = ({ handleStepChange, players, setPlayers }) => {
  const [highlightedIndex, setHighlightedIndex] = useState(null)

  const flashRow = (index) => {
    setHighlightedIndex(index)
    setTimeout(() => setHighlightedIndex(null), 300)
  }

  const handleNameChange = (id, newName) => {
    const updated = players.map((p) => (p.id === id ? { ...p, name: newName } : p))
    setPlayers(updated)
    flashRow(id)
  }

  const handleSkillChange = (id, newSkill) => {
    const updated = players.map((p) => (p.id === id ? { ...p, skill: parseInt(newSkill) } : p))
    setPlayers(updated)
    flashRow(id)
  }

  const toggleGender = (id) => {
    const updated = players.map((p) =>
      p.id === id ? { ...p, gender: p.gender === 'male' ? 'female' : 'male' } : p
    )
    setPlayers(updated)
    flashRow(id)
  }

  const removePlayer = (id) => {
    const updated = players.filter((p) => p.id !== id)
    setPlayers(updated)
  }

  const sortedPlayers = [...players].sort((a, b) => a.skill - b.skill)
  const maxSkill = Math.max(...players.map((p) => p.skill), 5)

  const isValid = sortedPlayers.every((p) => p.name.trim() !== '')

  return (
    <div>
      <h2 className="mb-3 text-red">Liste des joueur·euse·s ({players.length})</h2>

      {sortedPlayers.map((player) => (
        <div
          key={player.id}
          className={`align-items-center py-1 flex-wrap ${highlightedIndex === player.id ? 'bg-warning-subtle' : ''}`}
        >
          <div className="row align-items-center justify-content-between">
            <div className="col col-9">
              <div className="input-group input-group-sm" style={{ maxWidth: '100%' }}>
                <input
                  className="form-control flex-grow-1"
                  type="text"
                  value={player.name}
                  onChange={(e) => handleNameChange(player.id, e.target.value)}
                  required
                />
                <select
                  className="form-select"
                  style={{ maxWidth: '70px', flexShrink: 0 }}
                  value={player.skill}
                  onChange={(e) => handleSkillChange(player.id, e.target.value)}
                >
                  {[...Array(maxSkill)].map((_, n) => (
                    <option key={n + 1} value={n + 1}>
                      {n + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col col-auto justify-content-between">
              <button
                className={`btn btn-sm me-2 ${player.gender === 'male' ? 'btn-outline-primary' : 'btn-outline-red'}`}
                onClick={() => toggleGender(player.id)}
              >
                {player.gender === 'female' ? '♀' : '♂'}
              </button>
              <button
                className="btn btn-sm btn-outline-red fw-bold"
                onClick={() => removePlayer(player.id)}
              >
                ╳
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="row justify-content-between mt-4">
        <div className="col col-auto">
          <button className="btn btn-outline-red" onClick={() => handleStepChange(1)}>
            &lt; Retour
          </button>
        </div>

        <div className="col col-auto">
          <button
            className="btn btn-red"
            onClick={() => handleStepChange(4)}
            disabled={!isValid}
            title={!isValid ? 'Certains noms sont vides' : ''}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step3PlayerList
