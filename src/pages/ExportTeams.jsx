import { useState } from 'react'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Toast } from '../components/ui/Toast'
import { useToast } from '../components/ui/useToast'
import { getTeamColor } from '../lib/teamColors'

const ExportTeams = ({ teams, reset }) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  // Mélange les prénoms dans chaque équipe (affichage aléatoire)
  const shuffledTeams = teams.map((team) => [...team].sort(() => Math.random() - 0.5))

  const copyToClipboard = () => {
    const text = shuffledTeams
      .map((team, i) => `Équipe #${i + 1} : ${team.map((p) => p.name).join(', ')}`)
      .join('\n')

    navigator.clipboard.writeText(text).then(() => {
      showToast('Liste des équipes copiée dans le presse-papiers.', 'success')
    })
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        Export des équipes
      </h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {shuffledTeams.map((team, i) => {
          const color = getTeamColor(i)
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${color.border}`}
            >
              <div
                className={`border-b px-4 py-3 font-bold text-slate-900 dark:text-slate-100 ${color.border} ${color.header}`}
              >
                Équipe #{i + 1}
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {team.map((p) => (
                  <li key={p.id} className="px-4 py-2 text-slate-700 dark:text-slate-300">
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
        <Button variant="outline" onClick={copyToClipboard}>
          Copier les équipes
        </Button>
        <Button onClick={() => setIsResetConfirmOpen(true)}>Faire de nouvelles équipes</Button>
      </div>

      <ConfirmDialog
        open={isResetConfirmOpen}
        title="Nouvelles équipes ?"
        message="Cela efface la liste actuelle de joueur·euse·s et d'équipes."
        confirmLabel="Recommencer"
        onConfirm={() => {
          setIsResetConfirmOpen(false)
          reset()
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      <Toast toast={toast} onDismiss={hideToast} />
    </div>
  )
}

export default ExportTeams
