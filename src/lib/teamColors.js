const TEAM_COLORS = [
  {
    border: 'border-blue-200 dark:border-blue-900',
    header: 'bg-blue-50 dark:bg-blue-950/40',
    badge: 'bg-blue-600',
    ring: 'ring-blue-500 bg-blue-50 dark:ring-blue-400 dark:bg-blue-950/40',
  },
  {
    border: 'border-emerald-200 dark:border-emerald-900',
    header: 'bg-emerald-50 dark:bg-emerald-950/40',
    badge: 'bg-emerald-600',
    ring: 'ring-emerald-500 bg-emerald-50 dark:ring-emerald-400 dark:bg-emerald-950/40',
  },
  {
    border: 'border-amber-200 dark:border-amber-900',
    header: 'bg-amber-50 dark:bg-amber-950/40',
    badge: 'bg-amber-600',
    ring: 'ring-amber-500 bg-amber-50 dark:ring-amber-400 dark:bg-amber-950/40',
  },
  {
    border: 'border-purple-200 dark:border-purple-900',
    header: 'bg-purple-50 dark:bg-purple-950/40',
    badge: 'bg-purple-600',
    ring: 'ring-purple-500 bg-purple-50 dark:ring-purple-400 dark:bg-purple-950/40',
  },
  {
    border: 'border-pink-200 dark:border-pink-900',
    header: 'bg-pink-50 dark:bg-pink-950/40',
    badge: 'bg-pink-600',
    ring: 'ring-pink-500 bg-pink-50 dark:ring-pink-400 dark:bg-pink-950/40',
  },
  {
    border: 'border-cyan-200 dark:border-cyan-900',
    header: 'bg-cyan-50 dark:bg-cyan-950/40',
    badge: 'bg-cyan-600',
    ring: 'ring-cyan-500 bg-cyan-50 dark:ring-cyan-400 dark:bg-cyan-950/40',
  },
  {
    border: 'border-orange-200 dark:border-orange-900',
    header: 'bg-orange-50 dark:bg-orange-950/40',
    badge: 'bg-orange-600',
    ring: 'ring-orange-500 bg-orange-50 dark:ring-orange-400 dark:bg-orange-950/40',
  },
  {
    border: 'border-teal-200 dark:border-teal-900',
    header: 'bg-teal-50 dark:bg-teal-950/40',
    badge: 'bg-teal-600',
    ring: 'ring-teal-500 bg-teal-50 dark:ring-teal-400 dark:bg-teal-950/40',
  },
]

export function getTeamColor(index) {
  return TEAM_COLORS[index % TEAM_COLORS.length]
}
