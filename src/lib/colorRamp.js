const LEVEL_RAMP_START = [253, 165, 165] // light tint of brand-600
const LEVEL_RAMP_END = [77, 5, 5] // deep shade of brand-600
const LEVEL_RAMP_MID = 'rgb(218, 10, 10)' // brand-600 (Étoile Vive), used when only one level exists

export function getLevelColor(index, count) {
  if (count <= 1) return LEVEL_RAMP_MID
  const t = index / (count - 1)
  const [r, g, b] = LEVEL_RAMP_START.map((start, i) =>
    Math.round(start + (LEVEL_RAMP_END[i] - start) * t)
  )
  return `rgb(${r}, ${g}, ${b})`
}
