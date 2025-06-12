import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Step4Generate = ({ handleStepChange, players, config, setTeams, teams }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  useEffect(() => {
    generateTeams()
  }, [])

  const handlePlayerSwap = (teamIndex, playerIndex) => {
    if (!selectedPlayer) {
      setSelectedPlayer({ teamIndex, playerIndex })
    } else {
      const newTeams = [...teams]
      const temp = newTeams[selectedPlayer.teamIndex][selectedPlayer.playerIndex]
      newTeams[selectedPlayer.teamIndex][selectedPlayer.playerIndex] =
        newTeams[teamIndex][playerIndex]
      newTeams[teamIndex][playerIndex] = temp

      setTeams(newTeams)
      setSelectedPlayer(null)
    }
  }

  const generateTeams = () => {
    const sorted = [...players].sort((a, b) => a.skill - b.skill) // 1 = débutant, skill élevé = fort
    const teamCount = Math.ceil(players.length / config.playersPerTeam)
    const teams = Array.from({ length: teamCount }, () => [])

    // Calcul des tailles prévues pour chaque équipe
    const averageTeamSize = Math.floor(players.length / teamCount)
    const teamSizes = Array.from({ length: teamCount }, (_, i) =>
      i < players.length % teamCount ? averageTeamSize + 1 : averageTeamSize
    )

    // Séparer par genre
    const males = sorted.filter((p) => p.gender === 'male')
    const females = sorted.filter((p) => p.gender === 'female')
    const minority = males.length < females.length ? males : females

    // Injecter un joueur du genre minoritaire dans chaque équipe si possible
    const usedIds = new Set()
    for (let i = 0; i < minority.length; i++) {
      const t = i % teamCount
      if (teams[t].length < teamSizes[t]) {
        teams[t].push(minority[i])
        usedIds.add(minority[i].id)
      }
    }

    // Récupérer les joueurs restants (ceux pas encore utilisés)
    const remaining = sorted.filter((p) => !usedIds.has(p.id))

    // Identifier les équipes incomplètes (celles avec un joueur en moins)
    const minTeamSize = Math.min(...teamSizes)
    const maxTeamSize = Math.max(...teamSizes)
    const shortTeamIndexes = teamSizes
      .map((size, index) => (size < maxTeamSize ? index : null))
      .filter((i) => i !== null)

    // Trier les joueurs restants du plus fort au plus faible
    remaining.sort((a, b) => b.skill - a.skill)

    // Étape 1 : affecter les meilleurs joueurs aux équipes incomplètes en priorité
    for (const i of shortTeamIndexes) {
      if (remaining.length === 0) break
      const best = remaining.shift() // meilleur joueur restant
      teams[i].push(best)
    }

    // Étape 2 : distribuer les joueurs restants en essayant de mélanger fort/faible
    let left = 0
    let right = remaining.length - 1
    let currentTeam = 0

    while (left <= right) {
      const team = teams[currentTeam]
      if (team.length < teamSizes[currentTeam]) {
        // Ajoute un joueur faible
        if (left <= right) {
          team.push(remaining[right])
          right--
        }
      }
      if (team.length < teamSizes[currentTeam]) {
        // Ajoute un joueur fort
        if (left <= right) {
          team.push(remaining[left])
          left++
        }
      }

      currentTeam = (currentTeam + 1) % teamCount
    }

    setTeams(teams)
  }

  return (
    <div>
      <h2 className="mb-3 text-red">Génération</h2>
      {teams.length > 0 && (
        <>
          <div className="row">
            {teams.map((team, i) => {
              const teamSkill = team.reduce((sum, player) => sum + player.skill, 0)

              return (
                <div key={i} className="col-md-4 mb-3">
                  <div className="card">
                    <div className="card-header bg-light fw-bold">
                      <div className="row justify-content-between">
                        <div className="col col-auto">
                          <h5 className="mb-0">Équipe #{i + 1} </h5>
                        </div>
                        <div className="col col-auto">
                          <span className="badge bg-red ms-2">Niveau total : {teamSkill}</span>
                        </div>
                      </div>
                    </div>

                    <div className="list-group list-group-flush">
                      {team.map((p, j) => (
                        <div
                          key={j}
                          className={`list-group-item py-0 ${selectedPlayer?.teamIndex === i && selectedPlayer?.playerIndex === j ? 'bg-secondary' : ''}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="row align-items-center">
                            <div className="col col-2 text-center border-end py-2">{p.skill}</div>
                            <div className="col col-8">{p.name}</div>
                            <div className="col col-2">
                              <button
                                className="btn btn-outline-red btn-sm"
                                onClick={() => handlePlayerSwap(i, j)}
                              >
                                <FontAwesomeIcon icon="arrow-right-arrow-left" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="row justify-content-between mt-4">
            <div className="col col-auto">
              <button className="btn btn-outline-red" onClick={() => handleStepChange(3)}>
                &lt; Retour
              </button>
            </div>

            <div className="col col-auto">
              <button className="btn btn-red mb-4" onClick={generateTeams}>
                Relancer la généreration
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Step4Generate
