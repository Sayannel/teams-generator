import React from 'react'

const ExportTeams = ({ teams, reset }) => {
  // Mélange les prénoms dans chaque équipe (affichage aléatoire)
  const shuffledTeams = teams.map((team) => [...team].sort(() => Math.random() - 0.5))

  const copyToClipboard = () => {
    const text = shuffledTeams
      .map((team, i) => `Équipe #${i + 1} : ${team.map((p) => p.name).join(', ')}`)
      .join('\n')

    navigator.clipboard.writeText(text).then(() => {
      alert('La liste des équipes a été copiée dans le presse-papiers.')
    })
  }

  const confirmReset = () => {
    if (window.confirm('Es-tu sûr·e de vouloir commencer de nouvelles équipes ?')) {
      reset()
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-red">Export des équipes</h2>

      <div className="row">
        {shuffledTeams.map((team, i) => (
          <div key={i} className="col-md-6 mb-3">
            <div className="card">
              <div className="card-header bg-light fw-bold">Équipe #{i + 1}</div>
              <ul className="list-group list-group-flush">
                {team.map((p, j) => (
                  <li key={j} className="list-group-item">
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="row justify-content-between mt-4 flex-column">
        <div className="col mb-3">
          <button className="btn btn-outline-red w-100" onClick={copyToClipboard}>
            Copier les équipes
          </button>
        </div>
        <div className="col">
          <button className="btn btn-red w-100" onClick={confirmReset}>
            Faire de nouvelles équipes
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportTeams
