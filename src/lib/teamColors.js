// One representative hue per team (roughly Tailwind's -600 shade). Tints,
// borders and ring highlights are derived from this at render time via
// MUI's alpha() so they stay theme/mode-aware without a separate dark set.
const TEAM_HUES = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#9333ea', // purple
  '#db2777', // pink
  '#0891b2', // cyan
  '#ea580c', // orange
  '#0d9488', // teal
]

export function getTeamColor(index) {
  return TEAM_HUES[index % TEAM_HUES.length]
}
