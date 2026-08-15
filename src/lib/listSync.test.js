import { describe, it, expect, vi } from 'vitest'
import { computeListDiff, isDiffEmpty, applyListDiff } from './listSync'

describe('computeListDiff', () => {
  const savedRoster = [
    { id: 1, name: 'Alice', skill: 4, gender: 'female' },
    { id: 2, name: 'Bob', skill: 3, gender: 'male' },
  ]

  it('reports no changes when the current list matches the saved roster', () => {
    const diff = computeListDiff(savedRoster, savedRoster)
    expect(isDiffEmpty(diff)).toBe(true)
  })

  it('buckets a brand-new local player (string id) as toCreate', () => {
    const currentPlayers = [
      ...savedRoster,
      { id: crypto.randomUUID(), name: 'Chris', skill: 2, gender: 'male' },
    ]
    const diff = computeListDiff(savedRoster, currentPlayers)
    expect(diff.toCreate).toMatchObject([{ name: 'Chris', skill: 2, gender: 'male' }])
    expect(diff.toUpdate).toHaveLength(0)
    expect(diff.toDelete).toHaveLength(0)
  })

  it('buckets a player with a server id from elsewhere (e.g. another saved list) as toCreate', () => {
    // Dana already exists in the personal directory / on another list (she
    // has a real server id), but she's not part of *this* list's saved
    // roster yet — importing her here must still attach her, not silently
    // drop her because she already "has a server id".
    const dana = { id: 42, name: 'Dana', skill: 3, gender: 'female' }
    const currentPlayers = [...savedRoster, dana]
    const diff = computeListDiff(savedRoster, currentPlayers)
    expect(diff.toCreate).toMatchObject([{ localId: 42, name: 'Dana', skill: 3, gender: 'female' }])
    expect(diff.toUpdate).toHaveLength(0)
    expect(diff.toDelete).toHaveLength(0)
  })

  it('buckets an edited saved player (server id, changed field) as toUpdate', () => {
    const currentPlayers = [{ ...savedRoster[0], skill: 5 }, savedRoster[1]]
    const diff = computeListDiff(savedRoster, currentPlayers)
    expect(diff.toUpdate).toMatchObject([{ id: 1, name: 'Alice', skill: 5, gender: 'female' }])
    expect(diff.toCreate).toHaveLength(0)
    expect(diff.toDelete).toHaveLength(0)
  })

  it('does not bucket a merely absent saved player as toDelete', () => {
    // Bob is on the roster but wasn't present tonight — absence alone must
    // never remove someone from the persistent list.
    const currentPlayers = [savedRoster[0]]
    const diff = computeListDiff(savedRoster, currentPlayers)
    expect(diff.toDelete).toHaveLength(0)
    expect(diff.toCreate).toHaveLength(0)
    expect(diff.toUpdate).toHaveLength(0)
  })

  it('buckets an explicitly removed saved player as toDelete', () => {
    const currentPlayers = [savedRoster[0]]
    const diff = computeListDiff(savedRoster, currentPlayers, new Set([2]))
    expect(diff.toDelete).toMatchObject([{ id: 2, name: 'Bob' }])
    expect(diff.toCreate).toHaveLength(0)
    expect(diff.toUpdate).toHaveLength(0)
  })

  it('cancels a pending deletion when the removed player is re-added before saving', () => {
    // Bob was removed (added to removedRosterIds) then re-added to the
    // working list — he must not be detached on save.
    const currentPlayers = [savedRoster[0], savedRoster[1]]
    const diff = computeListDiff(savedRoster, currentPlayers, new Set([2]))
    expect(diff.toDelete).toHaveLength(0)
    expect(diff.toCreate).toHaveLength(0)
    expect(diff.toUpdate).toHaveLength(0)
  })

  it('never includes an isAdHoc player in any bucket, even if edited or removed', () => {
    const adHoc = { id: 99, name: 'Jane Doe', skill: 4, gender: 'female', isAdHoc: true }
    const currentPlayers = [...savedRoster, { ...adHoc, skill: 10 }]
    const diff = computeListDiff(savedRoster, currentPlayers)
    expect(isDiffEmpty(diff)).toBe(true)
  })
})

describe('applyListDiff', () => {
  it('calls detach/attach/update for each bucket entry', async () => {
    const api = {
      detachPlayer: vi.fn(),
      attachPlayer: vi.fn(),
      updatePlayer: vi.fn(),
    }
    const diff = {
      toCreate: [{ name: 'Chris', skill: 2, gender: 'male' }],
      toUpdate: [{ id: 1, name: 'Alice', skill: 5, gender: 'female' }],
      toDelete: [{ id: 2, name: 'Bob', skill: 3, gender: 'male' }],
    }

    await applyListDiff(api, 42, diff)

    expect(api.detachPlayer).toHaveBeenCalledWith(42, 2)
    expect(api.attachPlayer).toHaveBeenCalledWith(42, diff.toCreate[0])
    expect(api.updatePlayer).toHaveBeenCalledWith(1, diff.toUpdate[0])
  })

  it('returns created records keyed by localId, so a second sync recognizes them as already persisted', async () => {
    const localId = crypto.randomUUID()
    const api = {
      detachPlayer: vi.fn(),
      attachPlayer: vi.fn().mockResolvedValue({ id: 7, name: 'Chris', skill: 2, gender: 'male' }),
      updatePlayer: vi.fn(),
    }
    const diff = {
      toCreate: [{ localId, name: 'Chris', skill: 2, gender: 'male' }],
      toUpdate: [],
      toDelete: [],
    }

    const progress = await applyListDiff(api, 42, diff)
    expect(progress.created.get(localId)).toEqual({
      id: 7,
      name: 'Chris',
      skill: 2,
      gender: 'male',
    })

    // Once the caller reconciles the local player's id with the created
    // record and refreshes savedRoster from it, a second diff must not
    // re-bucket that same player as toCreate (the bug this regression-tests).
    const reconciledPlayers = [{ id: 7, name: 'Chris', skill: 2, gender: 'male' }]
    const refreshedSavedRoster = [...progress.created.values()]
    const secondDiff = computeListDiff(refreshedSavedRoster, reconciledPlayers)
    expect(isDiffEmpty(secondDiff)).toBe(true)
  })

  it('attaches whatever succeeded to the thrown error when a later step fails', async () => {
    const api = {
      detachPlayer: vi.fn(),
      attachPlayer: vi.fn().mockResolvedValue({ id: 7, name: 'Chris', skill: 2, gender: 'male' }),
      updatePlayer: vi.fn().mockRejectedValue(new Error('network')),
    }
    const diff = {
      toCreate: [{ localId: 'local-1', name: 'Chris', skill: 2, gender: 'male' }],
      toUpdate: [{ id: 1, name: 'Alice', skill: 5, gender: 'female' }],
      toDelete: [],
    }

    await expect(applyListDiff(api, 42, diff)).rejects.toMatchObject({
      partialProgress: {
        created: new Map([['local-1', { id: 7, name: 'Chris', skill: 2, gender: 'male' }]]),
      },
    })
  })
})
