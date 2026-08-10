import { ArrowRightLeft } from 'lucide-react'
import Badge from './ui/Badge'
import { getTeamColor } from '../lib/teamColors'

const TeamSummary = ({ team, maxPlayerByTeam, selectedPlayer, handlePlayerSwap, index }) => {
  const teamSkill = team.reduce((sum, p) => sum + p.skill, 0)
  const isIncomplete = team.length < maxPlayerByTeam
  const color = getTeamColor(index)

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-900 ${color.border}`}
    >
      <div
        className={`flex items-center justify-between gap-2 border-b px-4 py-3 ${color.border} ${color.header}`}
      >
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Équipe #{index + 1}</h3>
        <div className="flex gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white ${color.badge}`}
          >
            Total : {teamSkill}
          </span>
          {isIncomplete && <Badge status="warning">incomplète</Badge>}
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {team.map((p, j) => {
          const isSelected =
            selectedPlayer?.teamIndex === index && selectedPlayer?.playerIndex === j
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-3 py-2 ${
                isSelected ? `ring-1 ring-inset ${color.ring}` : ''
              }`}
            >
              <span className="w-8 shrink-0 border-r border-slate-200 text-center font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                {p.skill}
              </span>
              <span className="min-w-0 flex-1 truncate text-slate-900 dark:text-slate-100">
                {p.name}
              </span>
              <button
                type="button"
                onClick={() => handlePlayerSwap(index, j)}
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label={`Échanger ${p.name}`}
              >
                <ArrowRightLeft className="size-4" />
                Échanger
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TeamSummary
