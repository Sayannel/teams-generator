import { describe, it, expect } from 'vitest'
import {
  generateTeams,
  generateSingleTeamSet,
  evaluateBalanceScore,
  evaluateGenderParity,
} from './teamGenerator'

function makePlayers(count, { skill = 3, gender = (i) => (i % 2 === 0 ? 'male' : 'female') } = {}) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    skill: typeof skill === 'function' ? skill(i) : skill,
    gender: typeof gender === 'function' ? gender(i) : gender,
  }))
}

// Mulberry32 — small seeded PRNG so determinism tests don't depend on Math.random.
function seededRng(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('generateTeams', () => {
  it('produces team sizes that differ by at most 1 on a non-exact division', () => {
    const { teams } = generateTeams(makePlayers(22), 5)
    const sizes = teams.map((t) => t.length)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  })

  it('places every input player in exactly one output team, exactly once', () => {
    const players = makePlayers(17)
    const { teams } = generateTeams(players, 4)
    const outputIds = teams.flatMap((t) => t.map((p) => p.id))
    expect(new Set(outputIds).size).toBe(players.length)
    expect(outputIds.slice().sort()).toEqual(players.map((p) => p.id).sort())
  })

  it('creates ceil(playerCount / playersPerTeam) teams', () => {
    const { teams } = generateTeams(makePlayers(22), 5)
    expect(teams.length).toBe(Math.ceil(22 / 5))
  })

  it('balances a wide skill spread far better than an unshuffled split', () => {
    const players = makePlayers(20, { skill: (i) => (i < 10 ? 1 : 10) })
    const { score } = generateTeams(players, 5)
    // An unshuffled split (first 10 low-skill, last 10 high-skill) would gap ~45.
    expect(score.gap).toBeLessThan(20)
  })

  it('perfectly balances a roster with identical skills', () => {
    const players = makePlayers(20, { skill: 5 })
    const { score } = generateTeams(players, 5)
    expect(score.gap).toBe(0)
    expect(score.label).toBe('Bon')
  })

  it('keeps gender counts per team within an acceptable band', () => {
    const players = makePlayers(20, { gender: (i) => (i < 16 ? 'male' : 'female') })
    const { parity } = generateTeams(players, 5)
    expect(parity.gap).toBeLessThanOrEqual(2)
  })

  describe('edge cases', () => {
    it('handles an empty roster without throwing', () => {
      const result = generateTeams([], 4)
      expect(result.teams).toEqual([])
      expect(result.score.gap).toBe(0)
    })

    it('rejects a playersPerTeam that is zero or negative', () => {
      expect(() => generateSingleTeamSet(makePlayers(5), 0)).toThrow()
      expect(() => generateSingleTeamSet(makePlayers(5), -1)).toThrow()
    })

    it('rejects a non-integer playersPerTeam', () => {
      expect(() => generateSingleTeamSet(makePlayers(5), 2.5)).toThrow()
    })

    it('puts everyone in a single team when the roster is smaller than playersPerTeam', () => {
      const players = makePlayers(3)
      const { teams } = generateTeams(players, 8)
      expect(teams.length).toBe(1)
      expect(teams[0]).toHaveLength(3)
    })

    it('does not crash when every player is the same gender', () => {
      const players = makePlayers(12, { gender: 'male' })
      expect(() => generateTeams(players, 4)).not.toThrow()
    })

    it('does not crash when only one team results', () => {
      const players = makePlayers(4)
      expect(() => generateTeams(players, 10)).not.toThrow()
    })
  })

  describe('determinism', () => {
    it('returns identical results for the same seeded rng', () => {
      const players = makePlayers(18)
      const a = generateTeams(players, 4, { rng: seededRng(42) })
      const b = generateTeams(players, 4, { rng: seededRng(42) })
      expect(a.teams).toEqual(b.teams)
    })
  })

  describe('randomness', () => {
    it('can land on different (equally valid) splits across independent calls', () => {
      // Uniform skill and an even gender split mean many different team
      // splits are all equally "good enough" — repeated calls (using the
      // real, unseeded rng) should not always collapse onto the same one.
      const players = makePlayers(8, { skill: 4 })
      const keys = new Set()

      for (let i = 0; i < 30; i++) {
        const { teams } = generateTeams(players, 4)
        keys.add(
          teams
            .map((t) =>
              t
                .map((p) => p.id)
                .sort()
                .join('-')
            )
            .join('|')
        )
      }

      expect(keys.size).toBeGreaterThan(1)
    })
  })
})

describe('evaluateBalanceScore', () => {
  it('returns a neutral result for an empty team list instead of an Infinity-driven gap', () => {
    expect(evaluateBalanceScore([])).toEqual({
      label: 'Aucun·e joueur·euse',
      status: 'neutral',
      gap: 0,
      level: 0,
    })
  })

  it('labels boundary skill gaps correctly', () => {
    const teamsWithGap = (gap) => [[{ skill: 0 }], [{ skill: gap }]]
    expect(evaluateBalanceScore(teamsWithGap(2)).label).toBe('Correct')
    expect(evaluateBalanceScore(teamsWithGap(3)).label).toBe('Moyen')
    expect(evaluateBalanceScore(teamsWithGap(5)).label).toBe('Déséquilibré')
  })
})

describe('evaluateGenderParity', () => {
  it('returns a neutral result for an empty team list instead of an Infinity-driven gap', () => {
    expect(evaluateGenderParity([])).toEqual({
      label: 'Aucun·e joueur·euse',
      status: 'neutral',
      gap: 0,
      level: 0,
    })
  })

  it('is unaffected by a single-gender roster (nothing to mix)', () => {
    const teams = [[{ gender: 'male' }, { gender: 'male' }], [{ gender: 'male' }]]
    expect(evaluateGenderParity(teams)).toMatchObject({
      label: 'Bonne',
      status: 'success',
    })
  })

  it('flags teams that have zero of the minority gender, not just an uneven head-count spread', () => {
    // 4 teams, `zeroCount` of them all-male (0 women), the rest an even 1m/1f mix.
    const teamsWithZeroMinorityCount = (zeroCount) =>
      Array.from({ length: 4 }, (_, i) =>
        i < zeroCount
          ? [{ gender: 'male' }, { gender: 'male' }]
          : [{ gender: 'male' }, { gender: 'female' }]
      )

    expect(evaluateGenderParity(teamsWithZeroMinorityCount(0)).label).toBe('Bonne')
    expect(evaluateGenderParity(teamsWithZeroMinorityCount(1)).label).toBe('Correcte')
    expect(evaluateGenderParity(teamsWithZeroMinorityCount(2)).label).toBe('Moyenne')
    expect(evaluateGenderParity(teamsWithZeroMinorityCount(3)).label).toBe('Déséquilibrée')
  })

  it('catches the "spread evenly by head-count but several teams have zero" case', () => {
    // 2 women round-robinned one-per-team across 4 teams of 4 looks even by
    // head-count (1,1,0,0) but leaves half the teams with no women at all.
    const teams = [
      [{ gender: 'male' }, { gender: 'male' }, { gender: 'male' }, { gender: 'female' }],
      [{ gender: 'male' }, { gender: 'male' }, { gender: 'male' }, { gender: 'female' }],
      [{ gender: 'male' }, { gender: 'male' }, { gender: 'male' }, { gender: 'male' }],
      [{ gender: 'male' }, { gender: 'male' }, { gender: 'male' }, { gender: 'male' }],
    ]
    const parity = evaluateGenderParity(teams)
    expect(parity.status).not.toBe('success')
    expect(parity.gap).toBe(2)
  })
})
