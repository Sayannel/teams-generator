export class ApiError extends Error {
  constructor(status, data) {
    super(data?.error || 'api_error')
    this.status = status
    this.data = data
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export const api = {
  requestOtp: (email) => request('/auth/request-otp.php', { method: 'POST', body: { email } }),
  verifyOtp: (email, code) =>
    request('/auth/verify-otp.php', { method: 'POST', body: { email, code } }),
  logout: () => request('/auth/logout.php', { method: 'POST' }),
  me: () => request('/auth/me.php'),

  getLists: () => request('/lists/index.php'),
  createList: (name) => request('/lists/index.php', { method: 'POST', body: { name } }),
  getList: (id) => request(`/lists/item.php?id=${id}`),
  updateList: (id, patch) => request(`/lists/item.php?id=${id}`, { method: 'PUT', body: patch }),
  deleteList: (id) => request(`/lists/item.php?id=${id}`, { method: 'DELETE' }),

  attachPlayer: (listId, player) =>
    request('/lists/players.php', { method: 'POST', body: { listId, ...player } }),
  detachPlayer: (listId, playerId) =>
    request(
      `/lists/players.php?listId=${encodeURIComponent(listId)}&playerId=${encodeURIComponent(playerId)}`,
      { method: 'DELETE' }
    ),
  updatePlayer: (id, patch) =>
    request(`/players/item.php?id=${id}`, { method: 'PUT', body: patch }),
  searchPlayers: (query) => request(`/players/index.php?search=${encodeURIComponent(query)}`),

  recordAttendance: (listId, playerIds) =>
    request('/lists/attendance.php', { method: 'POST', body: { listId, playerIds } }),
  getAttendanceHistory: (listId) => request(`/lists/attendance.php?listId=${listId}`),
}
