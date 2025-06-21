import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'

const TeamSummary = ({
  team,
  maxPlayerByTeam,
  selectedPlayer,
  handlePlayerSwap,
  index,
  ...rest
}) => {
  const teamSkill = team.reduce((sum, p) => sum + p.skill, 0)
  const isIncomplete = team.length < maxPlayerByTeam
  return (
    <div className="col-md-6 mb-3" {...rest}>
      <div className="card">
        <div className="card-header bg-light fw-bold">
          <div className="row justify-content-between align-items-center">
            <div className="col col-auto">
              <h5 className="mb-0">Équipe #{index + 1}</h5>
            </div>
            <div className="col col-auto">
              <span className="badge bg-red">Total : {teamSkill}</span>
              {isIncomplete && <span className="badge bg-warning text-dark ms-2">incomplète</span>}
            </div>
          </div>
        </div>
        <div className="list-group list-group-flush">
          {team.map((p, j) => (
            <div
              key={j}
              className={`list-group-item py-0 ${
                selectedPlayer?.teamIndex === index && selectedPlayer?.playerIndex === j
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
                    onClick={() => handlePlayerSwap(index, j)}
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
}

export default TeamSummary
