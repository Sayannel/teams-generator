// A player's `id` is a number when it came from the server (a loaded
// roster row) and a string (crypto.randomUUID()) when created locally and
// never saved — the same discriminator the app already used for "is this
// player new" before persistence existed.
const hasServerId = (player) => typeof player.id === 'number'

/**
 * Diffs the roster as loaded (`savedRoster`) against the current working
 * list (`currentPlayers`) to figure out what to persist. Players flagged
 * `isAdHoc` are intentionally excluded from every bucket — they're
 * session-only guests, never written back to the server.
 *
 * A saved player who's simply absent from `currentPlayers` (unchecked in
 * the attendance picker, or never re-added) is NOT a deletion — the roster
 * is meant to persist across sessions regardless of who showed up. Only
 * players the user explicitly removed from the working list (tracked in
 * `removedRosterIds`) end up in `toDelete` — and only if they're still
 * absent from `currentPlayers`: re-adding a removed player before saving
 * cancels the pending deletion instead of detaching them right back off.
 */
export function computeListDiff(savedRoster, currentPlayers, removedRosterIds = new Set()) {
  const regular = currentPlayers.filter((p) => !p.isAdHoc)
  const savedById = new Map(savedRoster.map((p) => [p.id, p]))

  // "Needs attaching to this list" — covers both a brand-new local player
  // (string id) and one pulled in from the personal directory or another
  // saved list (already has a server id, just not attached *here* yet).
  // `api.attachPlayer` handles both: it reuses an existing directory row by
  // name instead of always inserting.
  const toCreate = regular
    .filter((p) => !savedById.has(p.id))
    .map(({ id, name, skill, gender }) => ({ localId: id, name, skill, gender }))

  const regularIds = new Set(regular.map((p) => p.id))
  const toDelete = savedRoster.filter((p) => removedRosterIds.has(p.id) && !regularIds.has(p.id))

  const toUpdate = regular
    .filter((p) => {
      if (!hasServerId(p)) return false
      const saved = savedById.get(p.id)
      return (
        saved && (saved.name !== p.name || saved.skill !== p.skill || saved.gender !== p.gender)
      )
    })
    .map(({ id, name, skill, gender }) => ({ id, name, skill, gender }))

  return { toCreate, toUpdate, toDelete }
}

export function isDiffEmpty(diff) {
  return diff.toCreate.length === 0 && diff.toUpdate.length === 0 && diff.toDelete.length === 0
}

/**
 * Persists a diff via the granular lists/players endpoints (no bulk endpoint
 * exists). Returns what was actually applied — critically, the server ids
 * assigned to `toCreate` entries (keyed by their local id) — so the caller
 * can reconcile local state and avoid re-creating the same player on a
 * later sync (their local id would otherwise never turn into a server id,
 * and `computeListDiff` would keep bucketing them into `toCreate` forever).
 *
 * If a step fails partway through, whatever already succeeded is attached
 * to the thrown error as `partialProgress` so the caller can still reconcile
 * it instead of losing track of what's already been persisted.
 */
export async function applyListDiff(api, listId, diff) {
  const progress = { created: new Map(), updated: [], deletedIds: [] }
  try {
    for (const player of diff.toDelete) {
      await api.detachPlayer(listId, player.id)
      progress.deletedIds.push(player.id)
    }
    for (const { localId, ...player } of diff.toCreate) {
      const record = await api.attachPlayer(listId, player)
      progress.created.set(localId, record)
    }
    for (const player of diff.toUpdate) {
      const record = await api.updatePlayer(player.id, player)
      progress.updated.push(record)
    }
  } catch (error) {
    error.partialProgress = progress
    throw error
  }
  return progress
}
