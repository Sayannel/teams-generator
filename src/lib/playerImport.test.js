import { describe, it, expect } from 'vitest'
import { parsePlayersFromText } from './playerImport'

describe('parsePlayersFromText', () => {
  it('parses "Nom, niveau, genre"', () => {
    const { players, errors } = parsePlayersFromText('Alice, 4, f')
    expect(errors).toHaveLength(0)
    expect(players).toMatchObject([{ name: 'Alice', skill: 4, gender: 'female' }])
  })

  it('parses "Nom, genre, niveau" in any order', () => {
    const { players, errors } = parsePlayersFromText('Bob, m, 7')
    expect(errors).toHaveLength(0)
    expect(players).toMatchObject([{ name: 'Bob', skill: 7, gender: 'male' }])
  })

  it('accepts tab-separated values', () => {
    const { players } = parsePlayersFromText('Chris\t3\tm')
    expect(players).toMatchObject([{ name: 'Chris', skill: 3, gender: 'male' }])
  })

  it('defaults to skill 1 and male when omitted', () => {
    const { players } = parsePlayersFromText('Dana')
    expect(players).toMatchObject([{ name: 'Dana', skill: 1, gender: 'male' }])
  })

  it('accepts "male"/"female" spelled out, case-insensitively', () => {
    const { players } = parsePlayersFromText('Eve, FEMALE, 2\nFred, Male, 2')
    expect(players.map((p) => p.gender)).toEqual(['female', 'male'])
  })

  it('ignores blank lines', () => {
    const { players, errors } = parsePlayersFromText('Alice, 4, f\n\n   \nBob, 3, m')
    expect(players).toHaveLength(2)
    expect(errors).toHaveLength(0)
  })

  it('reports an error and drops a line with an unrecognized token', () => {
    const { players, errors } = parsePlayersFromText('Alice, 4, f\nGeorge, xyz')
    expect(players).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Ligne 2')
  })

  it('reports an error for a non-positive skill', () => {
    const { players, errors } = parsePlayersFromText('Henry, 0, m')
    expect(players).toHaveLength(0)
    expect(errors).toHaveLength(1)
  })

  it('assigns each parsed player a unique id', () => {
    const { players } = parsePlayersFromText('Alice, 4, f\nBob, 3, m')
    expect(new Set(players.map((p) => p.id)).size).toBe(2)
  })

  it('rejects a repeated name within the same text, case-insensitively', () => {
    const { players, errors } = parsePlayersFromText('Alice, 4, f\nALICE, 3, m\nBob, 2, m')
    expect(players.map((p) => p.name)).toEqual(['Alice', 'Bob'])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Ligne 2')
  })
})
