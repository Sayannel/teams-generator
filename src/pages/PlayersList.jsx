import React, { useRef, useState } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { STEPS_LIST } from '../App'

const PlayersList = ({ handleStepChange, players, setPlayers }) => {
  const rowRefs = useRef({})
  const [highlightedIndex, setHighlightedIndex] = useState(null)
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    skill: 1,
    gender: 'male',
  })

  const handleAddNewPlayer = () => {
    if (newPlayer.name.trim() === '') return
    const nameExists = players.some(
      (p) => p.name.toLowerCase() === newPlayer.name.trim().toLowerCase()
    )
    if (nameExists) {
      alert('Ce nom existe déjà dans la liste.')
      return
    }

    const newId = crypto.randomUUID()
    const playerToAdd = {
      id: newId,
      name: newPlayer.name.trim(),
      skill: newPlayer.skill,
      gender: newPlayer.gender,
    }

    setPlayers((prev) => [...prev, playerToAdd])
    setNewPlayer({ name: '', skill: 1, gender: 'male' })

    setTimeout(() => {
      rowRefs.current[newId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      flashRow(newId, 1000)
    }, 100)
  }

  const flashRow = (index, duration = 300) => {
    setHighlightedIndex(index)
    setTimeout(() => setHighlightedIndex(null), duration)
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
      <h2 className="mb-3 text-red">Liste des joueur·euse·s</h2>

      <div id="players-list" className="fixed-controls-content">
        {sortedPlayers.length === 0 && (
          <div className="text-center my-5">
            <FontAwesomeIcon icon="question" className="display-2" />
            <br />
            <div className="mt-3">
              <span className="display-4">Y a quelqu'un ?</span>
            </div>
          </div>
        )}
        {sortedPlayers.map((player) => (
          <div
            key={player.id}
            ref={(el) => (rowRefs.current[player.id] = el)}
            className={`align-items-center py-1 flex-wrap ${highlightedIndex === player.id ? 'bg-warning-subtle' : ''}`}
          >
            <div className="row align-items-center justify-content-start">
              <div className="col pe-0">
                <div className="input-group input-group" style={{ maxWidth: '100%' }}>
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
                    {[...Array(maxSkill < 8 ? 10 : maxSkill + 3)].map((_, n) => (
                      <option key={n + 1} value={n + 1}>
                        {n + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col col-auto justify-content-start">
                <button
                  className={`btn me-2 ${player.gender === 'male' ? 'btn-outline-primary' : 'btn-outline-red'}`}
                  onClick={() => toggleGender(player.id)}
                >
                  <FontAwesomeIcon icon={player.gender === 'female' ? 'venus' : 'mars'} />
                </button>
                <button
                  className="btn btn-outline-red fw-bold"
                  onClick={() => removePlayer(player.id)}
                >
                  <FontAwesomeIcon icon="trash" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr className="d-none d-md-block" />

      <div className="fixed-controls p-3 p-md-0 shadow-lg">
        <div className="mt-3">
          <div className="row align-items-center justify-content-start">
            <div className="col pe-0">
              <div className="input-group input-group" style={{ maxWidth: '100%' }}>
                <input
                  className="form-control flex-grow-1"
                  type="text"
                  placeholder="Nom du nouveau joueur·euse"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewPlayer()
                  }}
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                />
                <select
                  className="form-select"
                  style={{ maxWidth: '70px', flexShrink: 0 }}
                  value={newPlayer.skill}
                  onChange={(e) => setNewPlayer({ ...newPlayer, skill: parseInt(e.target.value) })}
                >
                  {[...Array(maxSkill < 8 ? 10 : maxSkill + 3)].map((_, n) => (
                    <option key={n + 1} value={n + 1}>
                      {n + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col col-auto justify-content-start">
              <button
                className={`btn ${newPlayer.gender === 'male' ? 'btn-outline-primary' : 'btn-outline-red'}`}
                onClick={() =>
                  setNewPlayer({
                    ...newPlayer,
                    gender: newPlayer.gender === 'male' ? 'female' : 'male',
                  })
                }
              >
                <FontAwesomeIcon icon={newPlayer.gender === 'female' ? 'venus' : 'mars'} />
              </button>
            </div>
          </div>
          <div className="row mt-2">
            <div className="col">
              <button
                className="btn btn-success fw-bold w-100"
                onClick={handleAddNewPlayer}
                disabled={newPlayer.name.trim() === ''}
                title="Ajouter le joueur·euse"
              >
                <FontAwesomeIcon icon="plus" /> Ajouter
              </button>
            </div>
          </div>
        </div>

        <hr />

        <div className="row justify-content-between mt-4">
          <div className="col col-auto">
            <button
              className="btn btn-outline-red"
              onClick={() => handleStepChange(STEPS_LIST.IMPORT_PLAYERS)}
            >
              &lt; Retour
            </button>
          </div>

          <div className="col col-auto">
            <button
              className="btn btn-red"
              onClick={() => {
                if (players.length > 0) {
                  handleStepChange(STEPS_LIST.GENERATE_TEAMS)
                } else {
                  alert('La liste est vide. Veuillez saisir au moins un·e joueur·euse.')
                }
              }}
              disabled={!isValid}
              title={!isValid ? 'Certains noms sont vides' : ''}
            >
              Valider &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayersList
