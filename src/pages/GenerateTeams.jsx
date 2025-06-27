import React, { useEffect, useState } from 'react'
import PlayerSkillSummary from './../components/PlayerSkillSummary'
import TeamSummary from './../components/TeamSummary'
import { STEPS_LIST } from '../App'

const GenerateTeams = ({ handleStepChange, players, config, teams, setTeams }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [balanceScore, setBalanceScore] = useState(null)
  const [genderParityScore, setGenderParityScore] = useState(null)
  const [maxPlayerByTeam, setMaxPlayerByTeam] = useState(0)

  useEffect(() => {
    generateBestTeams()
  }, [])

  const regenerateTeams = () => {
    if (window.confirm('Es-tu sûr·e de vouloir relancer la génération des équipes ?')) {
      generateBestTeams()
    }
  }

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
      <div className="row align-items-center justify-content-between mb-3">
        <div className="col col-auto">
          <h2 className=" text-red mb-0">Génération</h2>
        </div>

        <div className="col col-auto">
          {(balanceScore || genderParityScore) && (
            <div>
              {balanceScore && (
                <span className={`ms-2 badge bg-${balanceScore.status}`}>{balanceScore.label}</span>
              )}
              {genderParityScore && (
                <span className={`ms-2 badge bg-${genderParityScore.status}`}>
                  {genderParityScore.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div id="teams-list" className="fixed-controls-content">
        <div className="mb-4">
          <PlayerSkillSummary players={players} />
        </div>

        <div className="row">
          {teams.map((team, i) => (
            <TeamSummary
              team={team}
              maxPlayerByTeam={maxPlayerByTeam}
              selectedPlayer={selectedPlayer}
              handlePlayerSwap={handlePlayerSwap}
              index={i}
              key={i}
            />
          ))}
        </div>
      </div>

      <div className="fixed-controls p-3 p-md-0 shadow-lg">
        <div className="text-center">
          <div className="col col-auto">
            <button className="btn btn-red fw-bold w-100" onClick={regenerateTeams}>
              Relancer la génération
            </button>
          </div>
        </div>

        <hr />

        <div className="row justify-content-between">
          <div className="col col-auto">
            <button
              className="btn btn-outline-red"
              onClick={() => handleStepChange(STEPS_LIST.PLAYERS_LIST)}
            >
              &lt; Retour
            </button>
          </div>
          <div className="col col-auto">
            <button
              className="btn btn-red"
              onClick={() => handleStepChange(STEPS_LIST.EXPORT_TEAMS)}
            >
              Valider les équipes &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GenerateTeams
