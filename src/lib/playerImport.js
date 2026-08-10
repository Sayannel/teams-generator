function parseLine(line, lineIndex) {
  const parts = line
    .split(/[,\t]/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return { error: `Ligne ${lineIndex + 1} vide ou invalide : "${line}"` }
  }

  const name = parts[0]
  let skill = 1
  let gender = 'male'

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].toLowerCase()
    if (!isNaN(Number(part))) {
      skill = parseInt(part, 10)
    } else if (['m', 'male'].includes(part)) {
      gender = 'male'
    } else if (['f', 'female'].includes(part)) {
      gender = 'female'
    } else {
      return { error: `Ligne ${lineIndex + 1} : valeur inconnue "${parts[i]}"` }
    }
  }

  if (!name || skill <= 0 || isNaN(skill)) {
    return { error: `Ligne ${lineIndex + 1} invalide (nom ou niveau) : "${line}"` }
  }

  return { player: { id: crypto.randomUUID(), name, skill, gender } }
}

/**
 * Parses freeform "Nom, niveau, genre" lines (comma or tab separated, any
 * order for niveau/genre) into player objects, collecting one error message
 * per invalid line instead of failing the whole import. Lines whose name
 * (case-insensitive) repeats an earlier line in the same text are also
 * rejected as errors instead of producing duplicate players.
 */
export function parsePlayersFromText(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const players = []
  const errors = []
  const seenNames = new Set()

  lines.forEach((line, index) => {
    const { player, error } = parseLine(line, index)

    if (error) {
      errors.push(error)
      return
    }

    const key = player.name.toLowerCase()
    if (seenNames.has(key)) {
      errors.push(`Ligne ${index + 1} : "${player.name}" est en double, ignoré`)
      return
    }

    seenNames.add(key)
    players.push(player)
  })

  return { players, errors }
}
