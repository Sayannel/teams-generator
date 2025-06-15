import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const Step4Generate = ({ handleStepChange, players, config }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [teams, setTeams] = useState([])
  const [balanceScore, setBalanceScore] = useState(null)
  const [genderParityScore, setGenderParityScore] = useState(null)
  const [maxPlayerByTeam, setMaxPlayerByTeam] = useState(0)

  useEffect(() => {
    generateBestTeams()
  }, [])

  const evaluateBalanceScore = (teams) => {
    const totals = teams.map((team) => team.reduce((sum, p) => sum + p.skill, 0))
    const max = Math.max(...totals)
    const min = Math.min(...totals)
    const gap = max - min

    if (gap <= 2) return { label: 'Très équilibré', status: 'success', gap }
    if (gap <= 4) return { label: 'Moyennement équilibré', status: 'warning', gap }
    return { label: 'Déséquilibré', status: 'danger', gap }
  }

  const evaluateGenderParity = (teams) => {
    const maleCounts = teams.map((team) => team.filter((p) => p.gender === 'male').length)
    const femaleCounts = teams.map((team) => team.filter((p) => p.gender === 'female').length)

    const minM = Math.min(...maleCounts)
    const maxM = Math.max(...maleCounts)
    const minF = Math.min(...femaleCounts)
    const maxF = Math.max(...femaleCounts)

    const genderGap = Math.max(maxM - minM, maxF - minF)

    if (genderGap <= 1) return { label: 'Bonne parité', status: 'success', gap: genderGap }
    if (genderGap <= 2) return { label: 'Parité moyenne', status: 'warning', gap: genderGap }
    return { label: 'Parité déséquilibrée', status: 'danger', gap: genderGap }
  }

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

  const generateSingleTeamSet = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5)
    const teamCount = Math.ceil(shuffled.length / config.playersPerTeam)
    const teams = Array.from({ length: teamCount }, () => [])

    const averageTeamSize = Math.floor(shuffled.length / teamCount)
    const teamSizes = Array.from({ length: teamCount }, (_, i) =>
      i < shuffled.length % teamCount ? averageTeamSize + 1 : averageTeamSize
    )

    const males = shuffled.filter((p) => p.gender === 'male')
    const females = shuffled.filter((p) => p.gender === 'female')
    const minority = males.length < females.length ? males : females

    const teamsWithMinority = new Set()
    for (let i = 0; i < minority.length; i++) {
      const t = i % teamCount
      if (teams[t].length < teamSizes[t]) {
        teams[t].push(minority[i])
        teamsWithMinority.add(t)
      }
    }

    const usedIds = new Set(minority.map((p) => p.id))
    const rest = shuffled.filter((p) => !usedIds.has(p.id))
    rest.sort(() => Math.random() - 0.5)
    rest.sort((a, b) => b.skill - a.skill)

    const shortTeamIndexes = teamSizes
      .map((size, index) => (size < Math.max(...teamSizes) ? index : null))
      .filter((i) => i !== null)

    for (const i of shortTeamIndexes) {
      if (rest.length === 0) break
      teams[i].push(rest.shift())
    }

    let left = 0
    let right = rest.length - 1
    let currentTeam = 0
    while (left <= right) {
      const team = teams[currentTeam]
      if (team.length < teamSizes[currentTeam]) {
        if (left <= right) team.push(rest[right--])
      }
      if (team.length < teamSizes[currentTeam]) {
        if (left <= right) team.push(rest[left++])
      }
      currentTeam = (currentTeam + 1) % teamCount
    }

    // Optimisation
    let maxIterations = 30
    while (maxIterations-- > 0) {
      const teamStats = teams
        .map((team, i) => ({
          index: i,
          total: team.reduce((sum, p) => sum + p.skill, 0),
        }))
        .sort((a, b) => a.total - b.total)

      const weakest = teamStats[0]
      const strongest = teamStats[teamStats.length - 1]
      const gap = strongest.total - weakest.total
      if (gap <= 2) break

      let swapped = false
      for (const p1 of teams[strongest.index]) {
        for (const p2 of teams[weakest.index]) {
          const diff = p1.skill - p2.skill
          if (diff <= 1) continue
          const genderOk =
            p1.gender === p2.gender ||
            (teams[strongest.index].filter((p) => p.gender === p1.gender).length > 1 &&
              teams[weakest.index].filter((p) => p.gender === p2.gender).length > 1)

          const newGap = Math.abs(
            strongest.total - p1.skill + p2.skill - (weakest.total - p2.skill + p1.skill)
          )
          if (newGap < gap && genderOk) {
            teams[strongest.index] = teams[strongest.index].map((p) => (p === p1 ? p2 : p))
            teams[weakest.index] = teams[weakest.index].map((p) => (p === p2 ? p1 : p))
            swapped = true
            break
          }
        }
        if (swapped) break
      }
      if (!swapped) break
    }

    return {
      teams,
      score: evaluateBalanceScore(teams),
      parity: evaluateGenderParity(teams),
      maxSize: Math.max(...teams.map((t) => t.length)),
    }
  }

  const generateBestTeams = () => {
    const attempts = []
    for (let i = 0; i < 500; i++) {
      const result = generateSingleTeamSet()
      const key = result.teams
        .map((t) =>
          t
            .map((p) => p.id)
            .sort()
            .join('-')
        )
        .join('|')
      if (!attempts.find((a) => a.key === key)) {
        attempts.push({ ...result, key })
      }
    }

    attempts.sort((a, b) => {
      const gapA = a.score.gap + a.parity.gap
      const gapB = b.score.gap + b.parity.gap
      return gapA - gapB
    })

    const best = attempts[0]
    setTeams(best.teams)
    setBalanceScore(best.score)
    setGenderParityScore(best.parity)
    setMaxPlayerByTeam(best.maxSize)
  }

  return (
    <div>
      <h2 className="mb-3 text-red">Génération</h2>

      {balanceScore && (
        <div className={`alert alert-${balanceScore.status}`}>
          <strong>Équilibrage :</strong> {balanceScore.label} (écart max : {balanceScore.gap})
        </div>
      )}

      {genderParityScore && (
        <div className={`alert alert-${genderParityScore.status}`}>
          <strong>Parité :</strong> {genderParityScore.label} (écart max : {genderParityScore.gap})
        </div>
      )}

      <div className="row">
        {teams.map((team, i) => {
          const teamSkill = team.reduce((sum, p) => sum + p.skill, 0)
          const isIncomplete = team.length < maxPlayerByTeam

          return (
            <div key={i} className="col-md-6 mb-3">
              <div className="card">
                <div className="card-header bg-light fw-bold">
                  <div className="row justify-content-between align-items-center">
                    <div className="col col-auto">
                      <h5 className="mb-0">Équipe #{i + 1}</h5>
                    </div>
                    <div className="col col-auto">
                      <span className="badge bg-red">Total : {teamSkill}</span>
                      {isIncomplete && (
                        <span className="badge bg-warning text-dark ms-2">incomplète</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="list-group list-group-flush">
                  {team.map((p, j) => (
                    <div
                      key={j}
                      className={`list-group-item py-0 ${
                        selectedPlayer?.teamIndex === i && selectedPlayer?.playerIndex === j
                          ? 'bg-secondary'
                          : ''
                      }`}
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
          <button className="btn btn-red mb-4" onClick={generateBestTeams}>
            Relancer la génération
          </button>
        </div>
      </div>
    </div>
  )
}

export default Step4Generate
