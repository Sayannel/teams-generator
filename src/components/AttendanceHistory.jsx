import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, History, Search } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { api } from '../lib/api'
import { useToast } from './ui/ToastProvider'

const formatSessionDate = (isoDate) =>
  new Date(isoDate).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

// Above this many rows, scanning the full ranking or the full attendee list
// stops being useful at a glance — collapse it and let people opt into more.
const STATS_COLLAPSED_COUNT = 10
const STATS_SEARCH_THRESHOLD = 15
const ATTENDEES_COLLAPSED_COUNT = 8

/**
 * "Présence" history for a saved list: a per-player attendance-rate summary
 * (least-present first — that's the actionable end of the ranking) followed
 * by a chronological (newest-first) list of recorded sessions. Both lists
 * collapse past a threshold so a large roster (dozens of players, sessions
 * with 30+ attendees) doesn't turn the drawer into an endless scroll.
 */
const AttendanceHistory = ({ listId }) => {
  const theme = useTheme()
  const { showToast } = useToast()
  const [history, setHistory] = useState(null) // { sessions, stats }
  const [statsQuery, setStatsQuery] = useState('')
  const [showAllStats, setShowAllStats] = useState(false)
  const [expandedSessionIds, setExpandedSessionIds] = useState(() => new Set())

  useEffect(() => {
    api
      .getAttendanceHistory(listId)
      .then(setHistory)
      .catch(() => showToast("Impossible de charger l'historique.", 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId])

  const sortedStats = useMemo(() => {
    if (!history) return []
    return (
      [...history.stats]
        .filter((s) => s.totalSessions > 0)
        // Ascending rate: who's dropping off shows up first, which is the
        // question an organizer actually opens this ranking to answer.
        .sort((a, b) => a.present / a.totalSessions - b.present / b.totalSessions)
    )
  }, [history])

  const filteredStats = useMemo(() => {
    const query = statsQuery.trim().toLowerCase()
    if (!query) return sortedStats
    return sortedStats.filter((s) => s.name.toLowerCase().includes(query))
  }, [sortedStats, statsQuery])

  const toggleSessionExpanded = (sessionId) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  if (history === null) {
    return (
      <Typography color="text.disabled" sx={{ py: 6, textAlign: 'center' }}>
        Chargement…
      </Typography>
    )
  }

  const { sessions } = history

  if (sessions.length === 0) {
    return (
      <Card
        variant="outlined"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          py: 6,
          textAlign: 'center',
        }}
      >
        <History size={40} color={theme.palette.primary.main} style={{ marginBottom: 4 }} />
        <Typography variant="h6" fontWeight={500} color="text.secondary">
          Aucune séance enregistrée pour l'instant
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Valide des équipes depuis cette liste pour commencer l'historique.
        </Typography>
      </Card>
    )
  }

  const visibleStats = showAllStats ? filteredStats : filteredStats.slice(0, STATS_COLLAPSED_COUNT)
  const hiddenStatsCount = filteredStats.length - visibleStats.length

  return (
    <Stack spacing={3}>
      <Typography variant="body2" color="text.secondary">
        {sortedStats.length} joueur·euse{sortedStats.length > 1 ? 's' : ''} · {sessions.length}{' '}
        séance{sessions.length > 1 ? 's' : ''} enregistrée{sessions.length > 1 ? 's' : ''}
      </Typography>

      {sortedStats.length > 0 && (
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            Statistiques de présence
          </Typography>

          {sortedStats.length > STATS_SEARCH_THRESHOLD && (
            <TextField
              size="small"
              placeholder="Rechercher un·e joueur·euse…"
              value={statsQuery}
              onChange={(e) => setStatsQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}

          {filteredStats.length === 0 ? (
            <Typography variant="body2" color="text.disabled">
              Aucun·e joueur·euse ne correspond à « {statsQuery} ».
            </Typography>
          ) : (
            <>
              {visibleStats.map((s) => (
                <Box key={s.playerId}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {s.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.present}/{s.totalSessions} présences
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(s.present / s.totalSessions) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
              {hiddenStatsCount > 0 && (
                <Button
                  size="small"
                  onClick={() => setShowAllStats(true)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Voir le classement complet ({filteredStats.length})
                </Button>
              )}
              {showAllStats && filteredStats.length > STATS_COLLAPSED_COUNT && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setShowAllStats(false)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Réduire
                </Button>
              )}
            </>
          )}
        </Stack>
      )}

      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          Séances
        </Typography>
        <Stack spacing={1}>
          {sessions.map((session) => {
            const isExpanded = expandedSessionIds.has(session.id)
            const visibleAttendees = isExpanded
              ? session.attendees
              : session.attendees.slice(0, ATTENDEES_COLLAPSED_COUNT)
            const hiddenAttendeesCount = session.attendees.length - visibleAttendees.length

            return (
              <Card key={session.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', color: 'text.secondary' }}
                  >
                    <CalendarClock size={16} />
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {formatSessionDate(session.occurredAt)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    {session.attendees.length} présent·e{session.attendees.length > 1 ? 's' : ''}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {visibleAttendees.map((attendee) => (
                    <Chip key={attendee.id} size="small" label={attendee.name} />
                  ))}
                  {hiddenAttendeesCount > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`+${hiddenAttendeesCount} autres`}
                      onClick={() => toggleSessionExpanded(session.id)}
                    />
                  )}
                  {isExpanded && session.attendees.length > ATTENDEES_COLLAPSED_COUNT && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label="Réduire"
                      onClick={() => toggleSessionExpanded(session.id)}
                    />
                  )}
                </Stack>
              </Card>
            )
          })}
        </Stack>
      </Stack>
    </Stack>
  )
}

export default AttendanceHistory
