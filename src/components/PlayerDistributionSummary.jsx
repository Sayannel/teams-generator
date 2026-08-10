import { useState } from 'react'
import { ChevronDown, Mars, Venus } from 'lucide-react'
import { Card } from './ui/Card'
import DonutChart from './ui/DonutChart'
import RatingDots from './ui/RatingDots'
import { getLevelColor } from '../lib/colorRamp'

const GENDER_COLORS = { female: '#f43f5e', male: '#6366f1' }

const PlayerDistributionSummary = ({ players, balanceScore, genderParityScore }) => {
  const [isOpen, setIsOpen] = useState(true)
  const total = players.length

  if (total === 0) return null

  const femaleCount = players.filter((player) => player.gender === 'female').length
  const maleCount = total - femaleCount
  const femalePct = Math.round((femaleCount / total) * 100)
  const malePct = Math.round((maleCount / total) * 100)

  const genderSegments = [
    { label: 'Féminin', value: femalePct, color: GENDER_COLORS.female },
    { label: 'Masculin', value: malePct, color: GENDER_COLORS.male },
  ]

  const groupedBySkill = Object.entries(
    players.reduce((acc, player) => {
      acc[player.skill] = (acc[player.skill] || 0) + 1
      return acc
    }, {})
  ).sort(([a], [b]) => Number(a) - Number(b))

  return (
    <Card>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex min-h-11 w-full items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
      >
        Répartition des joueur·euses
        <span className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
            {total} joueur·euse·s
          </span>
          <ChevronDown
            className={`size-5 text-slate-400 transition-transform dark:text-slate-500 ${isOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="p-4">
          {(balanceScore || genderParityScore) && (
            <div className="mb-5 grid grid-cols-2 gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
              {balanceScore && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Équilibre
                  </p>
                  <RatingDots
                    status={balanceScore.status}
                    filled={balanceScore.level}
                    label={balanceScore.label}
                  />
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{balanceScore.label}</p>
                </div>
              )}
              {genderParityScore && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Parité
                  </p>
                  <RatingDots
                    status={genderParityScore.status}
                    filled={genderParityScore.level}
                    label={genderParityScore.label}
                  />
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {genderParityScore.label}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col items-center gap-3">
              <p className="self-start text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Genre
              </p>
              <DonutChart
                segments={genderSegments}
                centerLabel={total}
                centerSublabel="joueur·euse·s"
              />
              <div className="w-full space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Venus className="size-4 shrink-0 text-rose-500" />
                  Féminin
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{femalePct}%</span>
                  <span className="w-6 shrink-0 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {femaleCount}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Mars className="size-4 shrink-0 text-indigo-500" />
                  Masculin
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{malePct}%</span>
                  <span className="w-6 shrink-0 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {maleCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Niveaux
              </p>
              <div className="flex flex-col gap-2.5">
                {groupedBySkill.map(([skill, count], index) => {
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={skill} className="flex items-center gap-2">
                      <span className="min-w-16 shrink-0 whitespace-nowrap text-xs font-medium text-slate-600 dark:text-slate-400">
                        Niveau {skill}
                      </span>
                      <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: getLevelColor(index, groupedBySkill.length),
                          }}
                        />
                      </div>
                      <span className="min-w-14 shrink-0 whitespace-nowrap text-right text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {count} · {pct}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default PlayerDistributionSummary
