import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { STEPS_LIST } from '../App'

const ImportMode = ({ handleStepChange }) => {
  const modes = [
    {
      icon: 'list',
      text: 'Importer une liste de joueur.euse.s',
      target: STEPS_LIST.IMPORT_PLAYERS,
    },
    {
      icon: 'user-plus',
      text: 'Ajouter des joueur.euse.s',
      target: STEPS_LIST.PLAYERS_LIST,
    },
    {
      icon: 'cloud-arrow-down',
      text: 'Récupérer une liste',
      target: STEPS_LIST.FETCH_LISTS,
    },
  ]

  return (
    <div className="text-center">
      <h2 className="mb-3 text-red">Choisir le mode d'ajout</h2>
      <div className="row">
        {modes.map(({ icon, text, target }) => (
          <div
            key={target}
            onClick={(event) => {
              event.preventDefault()
              handleStepChange(target)
            }}
            className="col col-md-4 d-flex align-items-center justify-content-center mb-4"
          >
            <div className="card h-100 w-100 import-mode">
              <div className="card-body d-flex align-items-center justify-content-center flex-column">
                <FontAwesomeIcon icon={icon} className="display-6 mb-3 text-red" />
                {text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ImportMode
