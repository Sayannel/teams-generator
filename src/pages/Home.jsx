import { useEffect, useState } from 'react'
import { ChevronRight, ClipboardList, ListChecks, Users, Zap } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { api } from '../lib/api'
import Drawer from '../components/ui/Drawer'
import AttendancePicker from '../components/AttendancePicker'
import HowItWorks from '../components/HowItWorks'
import { useToast } from '../components/ui/ToastProvider'

/**
 * STEP 1 for a logged-in user: launch a session, either ad-hoc or from a
 * saved list. List *management* (create/rename/delete/roster editing) is a
 * separate concern kept behind "Gérer mes listes", which now navigates to
 * its own dedicated page (see App.jsx's isManagingLists) — same split
 * already used for the step-2 "Depuis mes listes" panel
 * (ImportSavedListPanel).
 */
const Home = ({ onStartNewSession, onResumeList, onManageLists }) => {
  const theme = useTheme()
  const { showToast } = useToast()
  const [lists, setLists] = useState(null)
  const [openingId, setOpeningId] = useState(null)
  const [pendingList, setPendingList] = useState(null)

  const fetchLists = () => {
    api
      .getLists()
      .then((data) => setLists(data.lists))
      .catch(() => showToast('Impossible de charger tes listes.', 'error'))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fetchLists, [])

  const handleOpen = async (list) => {
    setOpeningId(list.id)
    try {
      const detail = await api.getList(list.id)
      setPendingList(detail)
    } catch {
      showToast('Impossible d’ouvrir cette liste.', 'error')
    } finally {
      setOpeningId(null)
    }
  }

  const handleConfirmAttendance = (presentPlayers) => {
    onResumeList(pendingList, presentPlayers)
    setPendingList(null)
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Lancer une session
      </Typography>

      <Button
        variant="contained"
        fullWidth
        size="large"
        startIcon={<Zap size={18} />}
        onClick={onStartNewSession}
      >
        Nouvelle session ponctuelle
      </Button>

      <Typography variant="h5" sx={{ mt: 4, mb: 0.5 }}>
        Importer une liste
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Lance une nouvelle génération à partir d'une liste de joueur·euse·s enregistrée.
      </Typography>

      {lists === null ? (
        <Typography color="text.disabled" sx={{ py: 6, textAlign: 'center' }}>
          Chargement…
        </Typography>
      ) : lists.length === 0 ? (
        <Card
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 5,
            textAlign: 'center',
          }}
        >
          <ClipboardList size={36} color={theme.palette.primary.main} style={{ marginBottom: 4 }} />
          <Typography color="text.secondary">Aucune liste sauvegardée pour l'instant.</Typography>
          <Typography variant="body2" color="text.disabled">
            Crée-en une depuis « Gérer mes listes » pour gagner du temps la prochaine fois.
          </Typography>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 1.5,
          }}
        >
          {lists.map((list) => (
            <Card
              key={list.id}
              variant="outlined"
              sx={{
                transition: 'border-color 0.15s, box-shadow 0.15s',
                '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
              }}
            >
              <CardActionArea
                onClick={() => handleOpen(list)}
                disabled={openingId !== null}
                sx={{ p: 2 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={600} noWrap>
                      {list.name}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ alignItems: 'center', color: 'text.secondary' }}
                    >
                      <Users size={14} />
                      <Typography variant="body2" component="span">
                        {list.memberCount}
                      </Typography>
                    </Stack>
                  </Box>
                  <ChevronRight
                    size={20}
                    color={theme.palette.primary.main}
                    style={{ flexShrink: 0 }}
                  />
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      <Button
        variant="outlined"
        fullWidth
        size="large"
        startIcon={<ListChecks size={18} />}
        onClick={onManageLists}
        sx={{ mt: 3 }}
      >
        Gérer mes listes
      </Button>

      <HowItWorks />

      <Drawer
        open={pendingList !== null}
        title="Qui est là ce soir ?"
        onClose={() => setPendingList(null)}
      >
        {pendingList && (
          <AttendancePicker
            roster={pendingList.players}
            onConfirm={handleConfirmAttendance}
            confirmLabel="Continuer"
          />
        )}
      </Drawer>
    </Box>
  )
}

export default Home
