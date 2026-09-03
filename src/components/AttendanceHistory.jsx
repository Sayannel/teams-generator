import { useEffect, useState } from 'react'
import { CalendarClock, History } from 'lucide-react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
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

/**
 * "Présence" history for a saved list: a per-player attendance-rate summary
 * followed by a chronological (newest-first) list of recorded sessions.
 * Modeled on ListDetail/ListsHome's Card-based lists and empty-state pattern.
 */
const AttendanceHistory = ({ listId }) => {
  const theme = useTheme()
  const { showToast } = useToast()
  const [history, setHistory] = useState(null) // { sessions, stats }

  useEffect(() => {
    api
      .getAttendanceHistory(listId)
      .then(setHistory)
      .catch(() => showToast("Impossible de charger l'historique.", 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId])

  if (history === null) {
    return (
      <Typography color="text.disabled" sx={{ py: 6, textAlign: 'center' }}>
        Chargement…
      </Typography>
    )
  }

  const { sessions, stats } = history

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

  const sortedStats = [...stats]
    .filter((s) => s.totalSessions > 0)
    .sort((a, b) => b.present / b.totalSessions - a.present / a.totalSessions)

  return (
    <Stack spacing={3}>
      {sortedStats.length > 0 && (
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            Statistiques de présence
          </Typography>
          {sortedStats.map((s) => (
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
        </Stack>
      )}

      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          Séances
        </Typography>
        <Stack spacing={1}>
          {sessions.map((session) => (
            <Card key={session.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', color: 'text.secondary', mb: 1 }}
              >
                <CalendarClock size={16} />
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {formatSessionDate(session.occurredAt)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {session.attendees.map((attendee) => (
                  <Chip key={attendee.id} size="small" label={attendee.name} />
                ))}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Stack>
  )
}

export default AttendanceHistory
