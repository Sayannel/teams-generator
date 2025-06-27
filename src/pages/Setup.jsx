import React, { useState } from 'react'
import { STEPS_LIST } from '../App'

const Setup = ({ handleStepChange, setConfig }) => {
  const [playersPerTeam, setPlayersPerTeam] = useState(4)

  const [isCollapseOpen, setIsCollapseOpen] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setConfig({ playersPerTeam })
    handleStepChange(STEPS_LIST.IMPORT_PLAYERS)
  }

  return (
    <div className="container mb-0 py-0" id="step1Setup">
      <form onSubmit={handleSubmit}>
        <h2 className="mb-3 text-red text-center">Configurer les équipes</h2>
        <div className="mb-3 text-center row align-items-center flex-column">
          <label className="form-label fw-medium">Nombre de joueur·euse·s par équipe :</label>
          <input
            type="number"
            className="form-control input-lg w-50 text-center fs-3"
            value={playersPerTeam}
            onChange={(e) => setPlayersPerTeam(parseInt(e.target.value))}
            required
          />
        </div>

        <div className="text-center my-4">
          <button type="submit" className="btn btn-red">
            Valider le nombre de joueur·euse·s
          </button>
        </div>
      </form>

      <div className={`text-center my-4 ${isCollapseOpen && ' d-none'}`}>
        <button className="btn btn-outline-red" onClick={() => setIsCollapseOpen(!isCollapseOpen)}>
          {isCollapseOpen ? 'Masquer' : 'Afficher'} les explications
        </button>
      </div>

      <div className={`collapse mt-2${isCollapseOpen && ' show'}`}>
        <div className="alert alert-light mb-0">
          <h5>Bienvenue dans le générateur d’équipes de volley</h5>
          <p className="mb-1">
            Ce site vous permet de répartir automatiquement vos joueur·euse·s en équipes
            équilibrées.
          </p>
          <ul className="mb-1">
            <li>
              <strong>Étape 1 :</strong> Choisissez le nombre de joueur·euse·s par équipe.
            </li>
            <li>
              <strong>Étape 2 :</strong> Importez la liste des joueur·euse·s avec leur niveau et
              leur genre.
            </li>
            <li>
              <strong>Étape 3 :</strong> Vérifiez et modifiez les informations individuellement.
            </li>
            <li>
              <strong>Étape 4 :</strong> Générez les équipes équilibrées automatiquement.
            </li>
            <li>
              <strong>Étape 5 :</strong> Affichez la liste finale des équipes.
            </li>
          </ul>
          <p className="mb-0">L’algorithme essaie de respecter les points suivants :</p>
          <ul>
            <li>Équipes de taille équivalente (1 joueur d’écart maximum)</li>
            <li>Répartition équilibrée des genres</li>
            <li>Distribution intelligente des niveaux (meilleurs mélangés avec les moins bons)</li>
            <li>Équipe en sous-effectif = équipe renforcée</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Setup
