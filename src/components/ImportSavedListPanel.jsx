import { useEffect, useState } from 'react'
import { ChevronLeft, ClipboardList, Settings, Users } from 'lucide-react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { api } from '../lib/api'
import ListsHome from '../pages/ListsHome'
import Drawer from './ui/Drawer'
import AttendancePicker from './AttendancePicker'

/**
 * Third way to add people to the working session: pick one of your
 * persisted lists, then choose who's actually present tonight — same idea
 * as pasting a text block (ImportPanel), just sourced from the backend.
 * Attendance only makes sense here, at the moment of pulling a saved
 * roster in — not as a standing feature on the working list itself.
 */
const ImportSavedListPanel = ({ onImport, excludeListId = null }) => {
  const [lists, setLists] = useState(null)
  const [error, setError] = useState(false)
  const [selectedList, setSelectedList] = useState(null)
  const [roster, setRoster] = useState(null)
  const [isLoadingRoster, setIsLoadingRoster] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)

  const fetchLists = () => {
    setError(false)
    api
      .getLists()
      .then((data) => setLists(data.lists))
      .catch(() => setError(true))
  }

  useEffect(fetchLists, [])

  const pickList = async (list) => {
    setError(false)
    setSelectedList(list)
    setIsLoadingRoster(true)
    try {
      const detail = await api.getList(list.id)
      setRoster(detail.players)
    } catch {
      setError(true)
    } finally {
      setIsLoadingRoster(false)
    }
  }

  const closeManage = () => {
    setIsManageOpen(false)
    fetchLists()
  }

  const goBack = () => {
    setError(false)
    setSelectedList(null)
    setRoster(null)
  }

  if (error) {
    return (
      <Box>
        <Typography color="text.secondary">
          {selectedList
            ? 'Impossible de charger cette liste.'
            : 'Impossible de charger tes listes sauvegardées.'}
        </Typography>
        <Link
          component="button"
          type="button"
          onClick={selectedList ? goBack : fetchLists}
          variant="body2"
          sx={{ mt: 1 }}
        >
          Réessayer
        </Link>
      </Box>
    )
  }

  if (selectedList) {
    return (
      <Box>
        <Link
          component="button"
          type="button"
          onClick={goBack}
          variant="body2"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5, fontWeight: 500 }}
        >
          <ChevronLeft size={16} />
          Retour
        </Link>

        {isLoadingRoster ? (
          <Typography color="text.disabled" sx={{ py: 3, textAlign: 'center' }}>
            Chargement…
          </Typography>
        ) : (
          <AttendancePicker
            roster={roster}
            onConfirm={onImport}
            confirmLabel="Importer"
            disableWhenEmpty
          />
        )}
      </Box>
    )
  }

  const selectableLists = lists?.filter((list) => list.id !== excludeListId) ?? null

  return (
    <Box>
      {lists !== null && (
        <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            component="button"
            type="button"
            onClick={() => setIsManageOpen(true)}
            variant="body2"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}
          >
            <Settings size={16} />
            Gérer mes listes
          </Link>
        </Box>
      )}

      {selectableLists === null ? (
        <Typography color="text.disabled" sx={{ py: 3, textAlign: 'center' }}>
          Chargement…
        </Typography>
      ) : selectableLists.length === 0 ? (
        <Typography color="text.secondary">
          {lists.length === 0
            ? "Aucune liste sauvegardée pour l'instant."
            : "Aucune autre liste sauvegardée pour l'instant."}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {selectableLists.map((list) => (
            <Card key={list.id} variant="outlined">
              <CardActionArea onClick={() => pickList(list)} sx={{ p: 2 }}>
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
                      <Typography variant="body2" color="text.secondary">
                        {list.memberCount}
                      </Typography>
                    </Stack>
                  </Box>
                  <ClipboardList size={16} style={{ flexShrink: 0, opacity: 0.5 }} />
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      <Drawer open={isManageOpen} title="Gérer mes listes" onClose={closeManage}>
        <ListsHome onBack={closeManage} />
      </Drawer>
    </Box>
  )
}

export default ImportSavedListPanel
