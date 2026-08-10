import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { STEPS_LIST } from '../App'
import Button from '../components/ui/Button'
import NumberStepper from '../components/ui/NumberStepper'

const Setup = ({ handleStepChange, setConfig }) => {
  const [playersPerTeam, setPlayersPerTeam] = useState(4)
  const [isExplanationOpen, setIsExplanationOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    setConfig({ playersPerTeam })
    handleStepChange(STEPS_LIST.PLAYERS_LIST)
  }

  return (
    <div className="md:mx-auto md:max-w-xl">
      <form onSubmit={handleSubmit} className="text-center">
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
          Configurer les équipes
        </h2>

        <label className="mb-3 block font-medium text-slate-700 dark:text-slate-300">
          Nombre de joueur·euse·s par équipe
        </label>
        <div className="mb-6 flex justify-center">
          <NumberStepper
            value={playersPerTeam}
            onChange={setPlayersPerTeam}
            min={1}
            label="Nombre de joueur·euse·s par équipe"
          />
        </div>

        <Button type="submit" className="w-full md:w-auto">
          Valider le nombre de joueur·euse·s
        </Button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setIsExplanationOpen(!isExplanationOpen)}
          aria-expanded={isExplanationOpen}
          className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-slate-800 dark:text-slate-200"
        >
          Comment ça marche ?
          <ChevronDown
            className={`size-5 text-slate-400 transition-transform dark:text-slate-500 ${isExplanationOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isExplanationOpen && (
          <div className="border-t border-slate-200 p-4 dark:border-slate-700">
            <h3 className="mb-2 font-bold text-slate-900 dark:text-slate-100">
              Bienvenue dans le générateur d'équipes de volley
            </h3>
            <p className="mb-2 text-slate-600 dark:text-slate-400">
              Ce site vous permet de répartir automatiquement vos joueur·euse·s en équipes
              équilibrées.
            </p>
            <ul className="mb-2 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400">
              <li>
                <strong>Étape 1 :</strong> Choisissez le nombre de joueur·euse·s par équipe.
              </li>
              <li>
                <strong>Étape 2 :</strong> Ajoutez vos joueur·euse·s (manuellement ou en collant une
                liste) avec leur niveau et leur genre.
              </li>
              <li>
                <strong>Étape 3 :</strong> Générez les équipes équilibrées automatiquement.
              </li>
              <li>
                <strong>Étape 4 :</strong> Récupérez la liste finale des équipes.
              </li>
            </ul>
            <p className="mb-2 text-slate-600 dark:text-slate-400">
              L'algorithme essaie de respecter les points suivants :
            </p>
            <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400">
              <li>Équipes de taille équivalente (1 joueur d'écart maximum)</li>
              <li>Répartition équilibrée des genres</li>
              <li>
                Distribution intelligente des niveaux (meilleurs mélangés avec les moins bons)
              </li>
              <li>Équipe en sous-effectif = équipe renforcée</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default Setup
