import React, { useEffect } from 'react'

const Step4Generate = ({ handleStepChange, players, config, setTeams, teams }) => {
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

  useEffect(() => {
    generateTeams()
  }, [])

  const generateTeams = () => {
    const shuffled = shuffle(players).sort((a, b) => b.skill - a.skill)
    const teamCount = Math.ceil(shuffled.length / config.playersPerTeam)
    const result = Array.from({ length: teamCount }, () => [])
    shuffled.forEach((p, i) => {
      result[i % teamCount].push(p)
    })
    setTeams(result)
  }

  return (
    <div>
      <h2 className="mb-3">(4/5) Génération des équipes</h2>
      {teams.length > 0 && (
        <>
          <h3>Équipes</h3>
          <div className="row">
            {teams.map((team, i) => (
              <div key={i} className="col-md-4 mb-3">
                <div className="card">
                  <div className="card-header bg-secondary text-white">Équipe #{i + 1}</div>
                  <ul className="list-group list-group-flush">
                    {team.map((p, j) => (
                      <li key={j} className="list-group-item">
                        {p.name} — {p.skill} — {p.gender === 'female' ? '♀' : '♂'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <div className="row justify-content-between my-4">
            <div className="col col-auto">
              <button className="btn btn-secondary" onClick={() => handleStepChange(2)}>
                &lt; Retour
              </button>
            </div>

            <div className="col col-auto">
              <button className="btn btn-danger mb-4" onClick={generateTeams}>
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
