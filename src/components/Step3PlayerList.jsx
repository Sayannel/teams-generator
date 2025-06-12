import React from 'react'

const Step3PlayerList = ({ handleStepChange, players, setPlayers }) => {
  const removePlayer = (index) => {
    const updated = [...players]
    updated.splice(index, 1)
    setPlayers(updated)
  }

  return (
    <div>
      <h2 className="mb-3">(3/5) Liste des joueur·euse·s ({players.length})</h2>
      <ul className="list-group mb-3">
        {players.map((p, i) => (
          <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
            {p.name} — Niveau {p.skill} — {p.gender === 'female' ? '♀' : '♂'}
            <button className="btn btn-sm btn-danger" onClick={() => removePlayer(i)}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      <div className="row justify-content-between my-4">
        <div className="col col-auto">
          <button className="btn btn-secondary" onClick={() => handleStepChange(2)}>
            &lt; Retour
          </button>
        </div>

        <div className="col col-auto">
          <button className="btn btn-primary" onClick={() => handleStepChange(4)}>
            Valider les joueur·euse·s
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step3PlayerList
