const LEVEL_RAMPS = {
  light: { start: [248, 113, 113], end: [69, 10, 10] }, // #f87171 -> #450a0a
  dark: { start: [254, 202, 202], end: [185, 28, 28] }, // #fecaca -> #b91c1c
}
const LEVEL_MID = {
  light: 'rgb(218, 10, 10)', // brand-600 (Étoile Vive)
  dark: 'rgb(240, 30, 30)', // dark-mode brand primary
}

export function getLevelColor(index, count, isDark = false) {
  const mode = isDark ? 'dark' : 'light'
  if (count <= 1) return LEVEL_MID[mode]
  const { start, end } = LEVEL_RAMPS[mode]
  const t = index / (count - 1)
  const [r, g, b] = start.map((s, i) => Math.round(s + (end[i] - s) * t))
  return `rgb(${r}, ${g}, ${b})`
}
