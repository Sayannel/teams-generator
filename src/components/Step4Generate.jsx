import React, { useEffect } from 'react'

const Step4Generate = ({ handleStepChange, players, config, setTeams, teams }) => {
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

  useEffect(() => {
    generateTeams()
  }, [])

  const generateTeams = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5)

    const teamCount = Math.ceil(shuffled.length / config.playersPerTeam)
    const teams = Array.from({ length: teamCount }, () => [])

    const totalSkill = players.reduce((sum, p) => sum + p.skill, 0)
    const averageTeamSize = Math.floor(shuffled.length / teamCount)
    const teamSizes = Array.from({ length: teamCount }, (_, i) =>
      i < shuffled.length % teamCount ? averageTeamSize + 1 : averageTeamSize
    )

    // Répartir équitablement le genre minoritaire
    const males = shuffled.filter((p) => p.gender === 'male')
    const females = shuffled.filter((p) => p.gender === 'female')
    const minority = males.length < females.length ? males : females
    const majority = males.length < females.length ? females : males

    // Injecter au moins un genre minoritaire dans chaque équipe si possible
    const teamsWithMinority = new Set()
    for (let i = 0; i < minority.length; i++) {
      const t = i % teamCount
      if (teams[t].length < teamSizes[t]) {
        teams[t].push(minority[i])
        teamsWithMinority.add(t)
      }
    }

    // Répartir le reste
    const alreadyUsed = new Set(minority.map((p) => p.id))
    const rest = shuffled.filter((p) => !alreadyUsed.has(p.id))

    // Sort by skill descending to assign the best remaining players where needed
    rest.sort((a, b) => b.skill - a.skill)

    for (const player of rest) {
      // Trouver l'équipe la plus faible et qui n'est pas encore pleine
      const incompleteTeams = teams
        .map((team, index) => ({
          index,
          team,
          totalSkill: team.reduce((sum, p) => sum + p.skill, 0),
          count: team.length,
        }))
        .filter((t) => t.count < teamSizes[t.index])

      // Parmi celles-ci, choisir celle avec le total de skill le plus faible
      incompleteTeams.sort((a, b) => a.totalSkill - b.totalSkill)

      if (incompleteTeams.length > 0) {
        teams[incompleteTeams[0].index].push(player)
      }
    }

    setTeams(teams)
  }

  return (
    <div>
      <h2 className="mb-3 text-red">Génération</h2>
      {teams.length > 0 && (
        <>
          <h3>Équipes</h3>
          <div className="row">
            {teams.map((team, i) => (
              <div key={i} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-header bg-light fw-bold">Équipe #{i + 1}</div>
                  <div className="list-group list-group-flush">
                    {team.map((p, j) => (
                      <div key={j} className="list-group-item py-0">
                        <div className="row align-items-center">
                          <div className="col col-11">{p.name}</div>
                          <div className="col col-1 border-start py-2">{p.skill}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
