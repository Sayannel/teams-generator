import { useState } from 'react'

const PlayerSkillSummary = ({ players }) => {
  const [active, setActive] = useState(false)

  const groupedBySkill = Object.entries(
    players.reduce((acc, player) => {
      acc[player.skill] = acc[player.skill] || []
      acc[player.skill].push(player)
      return acc
    }, {})
  ).sort(([a], [b]) => parseInt(a) - parseInt(b))

  return (
    <div className="accordion" id="accordionSkill">
      <div className="accordion-item">
        <h2 className="accordion-header" id="headingSkill">
          <button
            className={`accordion-button ${!active ? 'collapsed' : ''}`}
            type="button"
            onClick={() => setActive(!active)}
            aria-expanded={active}
            aria-controls="collapseSkill"
          >
            <strong>{active ? 'Masquer' : 'Voir'} la répartition des niveaux</strong>
          </button>
        </h2>
        <div
          id="collapseSkill"
          className={`accordion-collapse collapse ${active ? 'show' : ''}`}
          aria-labelledby="headingSkill"
          data-bs-parent="#accordionSkill"
        >
          <div className="accordion-body">
            <div className="row">
              {groupedBySkill.map(([skill, playersAtSkill]) => (
                <div className="col-md-6 mb-3" key={skill}>
                  <div className="card shadow-sm">
                    <div className="card-header bg-light fw-bold">
                      Niveau {skill} ({playersAtSkill.length} joueur·euse·s)
                    </div>
                    <ul className="list-group list-group-flush">
                      {playersAtSkill.map((player) => (
                        <li key={player.id} className="list-group-item">
                          {player.name} ({player.gender === 'female' ? 'F' : 'M'})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerSkillSummary
