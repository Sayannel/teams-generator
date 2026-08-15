const DEFAULT_MAX_ATTEMPTS = 40
const DEFAULT_HILL_CLIMB_ITERATIONS = 30
const GOOD_ENOUGH_SCORE_GAP = 2
const GOOD_ENOUGH_PARITY_GAP = 1

function shuffle(array, rng) {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function computeTeamSizes(playerCount, teamCount) {
  const averageTeamSize = Math.floor(playerCount / teamCount)
  const remainder = playerCount % teamCount
  return Array.from({ length: teamCount }, (_, i) =>
    i < remainder ? averageTeamSize + 1 : averageTeamSize
  )
}

// Spreads the smaller gender group round-robin across teams first, so gender
// balance isn't left to chance once the rest is filled by skill.
function distributeMinorityGender(minority, teamCount, teamSizes, teams) {
  const placedIds = new Set()
  for (let i = 0; i < minority.length; i++) {
    const teamIndex = i % teamCount
    const team = teams[teamIndex]
    if (team.length < teamSizes[teamIndex]) {
      team.push(minority[i])
      placedIds.add(minority[i].id)
    }
  }
  return placedIds
}

// Fills short teams first, then snake-drafts the skill-sorted remainder
// (alternating strongest/weakest) across all teams.
function snakeFillBySkill(rest, teamCount, teamSizes, teams) {
  const sorted = [...rest].sort((a, b) => b.skill - a.skill)

  const maxTeamSize = Math.max(...teamSizes)
  const shortTeamIndexes = teamSizes
    .map((size, index) => (size < maxTeamSize ? index : null))
    .filter((i) => i !== null)

  for (const i of shortTeamIndexes) {
    if (sorted.length === 0) break
    if (teams[i].length < teamSizes[i]) teams[i].push(sorted.shift())
  }

  let left = 0
  let right = sorted.length - 1
  let currentTeam = 0
  while (left <= right) {
    const team = teams[currentTeam]
    if (team.length < teamSizes[currentTeam] && left <= right) team.push(sorted[right--])
    if (team.length < teamSizes[currentTeam] && left <= right) team.push(sorted[left++])
    currentTeam = (currentTeam + 1) % teamCount
  }
}

function teamTotal(team) {
  return team.reduce((sum, p) => sum + p.skill, 0)
}

// First-improvement hill-climbing: repeatedly swaps a player from the
// strongest team with one from the weakest team when it shrinks the skill
// gap without leaving a team with zero of a gender it had more than one of.
function hillClimbBalance(teams, iterations) {
  let remaining = iterations
  while (remaining-- > 0) {
    const teamStats = teams
      .map((team, i) => ({ index: i, total: teamTotal(team) }))
      .sort((a, b) => a.total - b.total)

    const weakest = teamStats[0]
    const strongest = teamStats[teamStats.length - 1]
    const gap = strongest.total - weakest.total
    if (gap <= 2) break

    let swapped = false
    for (const p1 of teams[strongest.index]) {
      for (const p2 of teams[weakest.index]) {
        if (p1.skill - p2.skill <= 1) continue

        const genderOk =
          p1.gender === p2.gender ||
          (teams[strongest.index].filter((p) => p.gender === p1.gender).length > 1 &&
            teams[weakest.index].filter((p) => p.gender === p2.gender).length > 1)

        const newGap = Math.abs(
          strongest.total - p1.skill + p2.skill - (weakest.total - p2.skill + p1.skill)
        )
        if (newGap < gap && genderOk) {
          teams[strongest.index] = teams[strongest.index].map((p) => (p === p1 ? p2 : p))
          teams[weakest.index] = teams[weakest.index].map((p) => (p === p2 ? p1 : p))
          swapped = true
          break
        }
      }
      if (swapped) break
    }
    if (!swapped) break
  }
}

export function evaluateBalanceScore(teams) {
  if (teams.length === 0)
    return { label: 'Aucun·e joueur·euse', status: 'neutral', gap: 0, level: 0 }

  const totals = teams.map(teamTotal)
  const gap = Math.max(...totals) - Math.min(...totals)

  if (gap <= 1) return { label: 'Bon', status: 'success', gap, level: 4 }
  if (gap <= 2) return { label: 'Correct', status: 'good', gap, level: 3 }
  if (gap <= 4) return { label: 'Moyen', status: 'warning', gap, level: 2 }
  return { label: 'Déséquilibré', status: 'danger', gap, level: 1 }
}

/**
 * Parity is about whether every team actually gets a mix of both genders —
 * not just whether the minority-gender head count is spread evenly. Spreading
 * 2 women one-per-team across 4 teams looks "even" by head-count alone, but
 * leaves 2 of those teams with zero women; that's the real signal to catch.
 * `gap` is the number of teams with zero members of the smaller gender group
 * (when both genders are present in the roster at all).
 */
export function evaluateGenderParity(teams) {
  if (teams.length === 0)
    return { label: 'Aucun·e joueur·euse', status: 'neutral', gap: 0, level: 0 }

  const maleCount = (team) => team.filter((p) => p.gender === 'male').length
  const femaleCount = (team) => team.filter((p) => p.gender === 'female').length

  const totalMale = teams.reduce((sum, t) => sum + maleCount(t), 0)
  const totalFemale = teams.reduce((sum, t) => sum + femaleCount(t), 0)

  // A single-gender roster has nothing to mix — that's not a parity problem.
  if (totalMale === 0 || totalFemale === 0) {
    return { label: 'Bonne', status: 'success', gap: 0, level: 4 }
  }

  const minorityCounts = teams.map((t) =>
    totalMale <= totalFemale ? maleCount(t) : femaleCount(t)
  )
  const gap = minorityCounts.filter((count) => count === 0).length

  if (gap === 0) return { label: 'Bonne', status: 'success', gap, level: 4 }
  if (gap === 1) return { label: 'Correcte', status: 'good', gap, level: 3 }
  if (gap === 2) return { label: 'Moyenne', status: 'warning', gap, level: 2 }
  return { label: 'Déséquilibrée', status: 'danger', gap, level: 1 }
}

/**
 * Builds one team assignment: minority-gender round robin, then a
 * skill-sorted snake-draft fill, then a bounded hill-climb pass to shrink
 * the skill gap between the strongest and weakest team.
 */
export function generateSingleTeamSet(players, playersPerTeam, options = {}) {
  const { rng = Math.random, hillClimbIterations = DEFAULT_HILL_CLIMB_ITERATIONS } = options

  if (!Number.isInteger(playersPerTeam) || playersPerTeam <= 0) {
    throw new Error('playersPerTeam doit être un entier positif')
  }

  if (players.length === 0) {
    return {
      teams: [],
      score: evaluateBalanceScore([]),
      parity: evaluateGenderParity([]),
      maxSize: 0,
    }
  }

  const shuffled = shuffle(players, rng)
  const teamCount = Math.ceil(shuffled.length / playersPerTeam)
  const teams = Array.from({ length: teamCount }, () => [])
  const teamSizes = computeTeamSizes(shuffled.length, teamCount)

  const males = shuffled.filter((p) => p.gender === 'male')
  const females = shuffled.filter((p) => p.gender === 'female')
  const minority = males.length < females.length ? males : females

  const placedIds = distributeMinorityGender(minority, teamCount, teamSizes, teams)

  const rest = shuffled.filter((p) => !placedIds.has(p.id))
  snakeFillBySkill(rest, teamCount, teamSizes, teams)

  hillClimbBalance(teams, hillClimbIterations)

  return {
    teams,
    score: evaluateBalanceScore(teams),
    parity: evaluateGenderParity(teams),
    maxSize: Math.max(...teams.map((t) => t.length)),
  }
}

// Below this many *distinct* attempts, don't allow the early exit — the
// deterministic construction usually reaches "good enough" on the very
// first shuffle, so stopping immediately would collapse every call (i.e.
// every "regenerate" click) onto essentially the same arrangement. Collecting
// a handful of distinct candidates first, then picking randomly among the
// tied-best ones, keeps "regenerate" actually able to land on a different
// (but equally valid) split instead of the same one every time.
const MIN_DISTINCT_ATTEMPTS_BEFORE_EARLY_EXIT = 8

/**
 * Runs several independent attempts and randomly picks one of the best,
 * stopping early once enough attempts are "good enough" — the deterministic
 * construction already gets most attempts close to optimal, so exhausting
 * maxAttempts every time mostly wastes cycles on the common case while
 * still protecting the difficult ones (skewed skill spread, strong gender
 * imbalance).
 */
export function generateTeams(players, playersPerTeam, options = {}) {
  const { maxAttempts = DEFAULT_MAX_ATTEMPTS, rng = Math.random, hillClimbIterations } = options

  const seenKeys = new Set()
  const attempts = []

  for (let i = 0; i < maxAttempts; i++) {
    const result = generateSingleTeamSet(players, playersPerTeam, { rng, hillClimbIterations })

    const key = result.teams
      .map((t) =>
        t
          .map((p) => p.id)
          .sort()
          .join('-')
      )
      .join('|')

    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      attempts.push(result)
    }

    const isGoodEnough =
      result.score.gap <= GOOD_ENOUGH_SCORE_GAP && result.parity.gap <= GOOD_ENOUGH_PARITY_GAP
    if (isGoodEnough && attempts.length >= MIN_DISTINCT_ATTEMPTS_BEFORE_EARLY_EXIT) {
      break
    }
  }

  const bestGap = Math.min(...attempts.map((a) => a.score.gap + a.parity.gap))
  const bestAttempts = attempts.filter((a) => a.score.gap + a.parity.gap === bestGap)
  const chosen = bestAttempts[Math.floor(rng() * bestAttempts.length)]

  return { ...chosen, attemptsRun: attempts.length }
}
