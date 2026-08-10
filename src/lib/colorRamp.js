const LEVEL_RAMP_START = [253, 164, 175] // rose-300
const LEVEL_RAMP_END = [76, 5, 25] // rose-950
const LEVEL_RAMP_MID = 'rgb(190, 18, 60)' // rose-700 (brand-600), used when only one level exists

export function getLevelColor(index, count) {
  if (count <= 1) return LEVEL_RAMP_MID
  const t = index / (count - 1)
  const [r, g, b] = LEVEL_RAMP_START.map((start, i) =>
    Math.round(start + (LEVEL_RAMP_END[i] - start) * t)
  )
  return `rgb(${r}, ${g}, ${b})`
}
