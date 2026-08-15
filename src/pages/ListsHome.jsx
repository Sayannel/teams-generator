import { useEffect, useState } from 'react'
import { ArrowLeft, ClipboardList, Pencil, Plus, Trash2, Users } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { api, ApiError } from '../lib/api'
import Drawer from '../components/ui/Drawer'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/ToastProvider'
import ListDetail from './ListDetail'

/**
 * Full "Gérer mes listes" page: a grid of saved lists (create/delete), with
 * each card opening ListDetail in place to rename it and edit its roster —
 * this used to be a Drawer's content, now it's App's whole main area while
 * open (see App.jsx's isManagingLists).
 */
const ListsHome = ({ onBack }) => {
  const theme = useTheme()
  const [lists, setLists] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    api
      .getLists()
      .then((data) => setLists(data.lists))
      .catch(() => showToast('Impossible de charger tes listes.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeCreateDrawer = () => {
    setIsCreateOpen(false)
    setNewListName('')
  }

  const submitCreate = async () => {
    const name = newListName.trim()
    if (!name) return

    try {
      const created = await api.createList(name)
      setLists((prev) => [...prev, { ...created, memberCount: 0 }])
      closeCreateDrawer()
      setEditingId(created.id)
    } catch (error) {
      const isTaken = error instanceof ApiError && error.data?.error === 'list_name_taken'
      showToast(isTaken ? 'Ce nom de liste existe déjà.' : 'Une erreur est survenue.', 'error')
    }
  }

  const confirmDelete = async () => {
    const target = deleteTarget
    setDeleteTarget(null)
    try {
      await api.deleteList(target.id)
      setLists((prev) => prev.filter((l) => l.id !== target.id))
    } catch {
      showToast('Impossible de supprimer cette liste.', 'error')
    }
  }

  const handleDetailBack = (summary) => {
    if (summary) {
      setLists((prev) => prev.map((l) => (l.id === summary.id ? { ...l, ...summary } : l)))
    }
    setEditingId(null)
  }

  if (editingId !== null) {
    return <ListDetail listId={editingId} onBack={handleDetailBack} />
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <IconButton onClick={onBack} aria-label="Retour à l'accueil">
          <ArrowLeft size={20} />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1 }}>
          Mes listes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => setIsCreateOpen(true)}
        >
          Nouvelle liste
        </Button>
      </Stack>

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
            py: 6,
            textAlign: 'center',
          }}
        >
          <ClipboardList size={40} color={theme.palette.primary.main} style={{ marginBottom: 4 }} />
          <Typography variant="h6" fontWeight={500} color="text.secondary">
            Aucune liste pour l'instant
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Crée une liste pour commencer, ex. « Mardi » ou « Jeudi ».
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                p: 2,
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => setEditingId(list.id)}
                sx={{
                  minWidth: 0,
                  flex: 1,
                  textAlign: 'left',
                  border: 0,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  font: 'inherit',
                  p: 0,
                }}
              >
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

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => setEditingId(list.id)}
                  aria-label={`Modifier ${list.name}`}
                >
                  <Pencil size={16} />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDeleteTarget(list)}
                  aria-label={`Supprimer ${list.name}`}
                >
                  <Trash2 size={16} />
                </IconButton>
              </Stack>
            </Card>
          ))}
        </Box>
      )}

      <Drawer open={isCreateOpen} title="Nouvelle liste" onClose={closeCreateDrawer}>
        <Stack spacing={2}>
          <TextField
            autoFocus
            placeholder="Nom de la liste (ex. Mardi)"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCreate()
            }}
            fullWidth
          />

          <Button
            variant="contained"
            fullWidth
            onClick={submitCreate}
            disabled={newListName.trim() === ''}
          >
            Créer
          </Button>
        </Stack>
      </Drawer>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Supprimer cette liste ?"
        message={`« ${deleteTarget?.name} » et son roster seront définitivement supprimés.`}
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  )
}

export default ListsHome
