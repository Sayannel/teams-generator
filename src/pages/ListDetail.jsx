import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ClipboardPaste,
  History,
  Mars,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Venus,
} from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { api, ApiError } from '../lib/api'
import Drawer from '../components/ui/Drawer'
import ImportPanel from '../components/ImportPanel'
import AttendanceHistory from '../components/AttendanceHistory'
import NumberStepper from '../components/ui/NumberStepper'
import GenderToggle from '../components/ui/GenderToggle'
import { useToast } from '../components/ui/ToastProvider'

const emptyNewPlayer = { name: '', skill: 1, gender: 'male' }

/**
 * Dedicated editor for a single saved list: rename it and manage its roster
 * in place (unlike the step-2 players table, every change here persists
 * immediately — there's no downstream "Valider" to batch a diff into).
 *
 * `canManageList` gates renaming/deleting/toggling visibility (owner-only).
 * `canManageMembers` gates roster mutations — true for the owner and for an
 * admin viewing someone else's public list.
 */
const ListDetail = ({
  listId,
  onBack,
  canManageList = true,
  canManageVisibility = true,
  canManageMembers = true,
}) => {
  const theme = useTheme()
  const { showToast } = useToast()
  const nameInputRef = useRef(null)
  const [list, setList] = useState(null) // { id, name, players, isPublic, isOwner }
  const [name, setName] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [pendingPublic, setPendingPublic] = useState(null) // null = closed, else the target value
  const [newPlayer, setNewPlayer] = useState(emptyNewPlayer)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    api
      .getList(listId)
      .then((detail) => {
        setList(detail)
        setName(detail.name)
      })
      .catch(() => showToast('Impossible de charger cette liste.', 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId])

  // Same debounced typeahead as the step-2 roster editor, scoped to this list.
  useEffect(() => {
    const query = newPlayer.name.trim()
    if (selectedMatch || query.length < 2 || !list) {
      setSearchResults([])
      return undefined
    }
    const handle = setTimeout(() => {
      api
        .searchPlayers(query)
        .then(({ players: found }) => {
          setSearchResults(
            found.filter((p) => !list.players.some((existing) => existing.id === p.id))
          )
        })
        .catch(() => {})
    }, 250)
    return () => clearTimeout(handle)
  }, [newPlayer.name, selectedMatch, list])

  const goBack = () => {
    if (list)
      onBack({
        id: list.id,
        name: list.name,
        memberCount: list.players.length,
        isPublic: list.isPublic,
        isOwner: list.isOwner,
      })
    else onBack(null)
  }

  const commitName = async () => {
    const trimmed = name.trim()
    if (trimmed === '' || trimmed === list.name) {
      setName(list.name)
      return
    }
    try {
      const updated = await api.updateList(list.id, { name: trimmed })
      setList((prev) => ({ ...prev, name: updated.name }))
      setName(updated.name)
    } catch (error) {
      const isTaken = error instanceof ApiError && error.data?.error === 'list_name_taken'
      showToast(isTaken ? 'Ce nom de liste existe déjà.' : 'Une erreur est survenue.', 'error')
      setName(list.name)
    }
  }

  const closeVisibilityConfirm = () => setPendingPublic(null)

  const confirmVisibilityChange = async () => {
    const next = pendingPublic
    setPendingPublic(null)
    try {
      const updated = await api.updateList(list.id, { isPublic: next })
      setList((prev) => ({ ...prev, isPublic: updated.isPublic }))
      showToast(next ? 'Liste rendue publique.' : 'Liste rendue privée.', 'success')
    } catch {
      showToast('Impossible de mettre à jour la visibilité.', 'error')
    }
  }

  const selectSearchResult = (match) => {
    setSelectedMatch(match)
    setNewPlayer({ name: match.name, skill: match.skill, gender: match.gender })
    setSearchResults([])
  }

  const closeAddDrawer = () => {
    setIsAddOpen(false)
    setNewPlayer((prev) => ({ ...emptyNewPlayer, skill: prev.skill, gender: prev.gender }))
    setSelectedMatch(null)
    setSearchResults([])
  }

  const submitAddPlayer = async () => {
    const trimmed = newPlayer.name.trim()
    if (!trimmed) return
    if (list.players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Ce nom existe déjà dans la liste.', 'error')
      return
    }
    try {
      const player = await api.attachPlayer(list.id, {
        name: trimmed,
        skill: newPlayer.skill,
        gender: newPlayer.gender,
      })
      setList((prev) => ({ ...prev, players: [...prev.players, player] }))
      setNewPlayer({ name: '', skill: player.skill, gender: player.gender })
      setSelectedMatch(null)
      setSearchResults([])
      nameInputRef.current?.focus()
    } catch {
      showToast("Impossible d'ajouter ce joueur·euse.", 'error')
    }
  }

  const handleBulkImport = async (importedPlayers) => {
    setIsImportOpen(false)
    const existingNames = new Set(list.players.map((p) => p.name.toLowerCase()))
    const newPlayers = importedPlayers.filter((p) => !existingNames.has(p.name.toLowerCase()))
    const skipped = importedPlayers.length - newPlayers.length

    const results = await Promise.allSettled(
      newPlayers.map((p) =>
        api.attachPlayer(list.id, { name: p.name, skill: p.skill, gender: p.gender })
      )
    )
    const attached = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    const failed = results.length - attached.length

    if (attached.length > 0) {
      setList((prev) => ({ ...prev, players: [...prev.players, ...attached] }))
    }
    if (skipped > 0) {
      showToast(
        `${skipped} nom${skipped > 1 ? 's' : ''} déjà présent${skipped > 1 ? 's' : ''} dans la liste, ignoré${skipped > 1 ? 's' : ''}.`,
        'error'
      )
    }
    if (failed > 0) {
      showToast(`${failed} joueur·euse${failed > 1 ? 's' : ''} n'a pas pu être ajouté·e.`, 'error')
    }
  }

  const removePlayer = async (player) => {
    setList((prev) => ({ ...prev, players: prev.players.filter((p) => p.id !== player.id) }))
    try {
      await api.detachPlayer(list.id, player.id)
      showToast(`${player.name} retiré·e.`, 'success')
    } catch {
      showToast('Impossible de retirer ce joueur·euse.', 'error')
      setList((prev) => ({ ...prev, players: [...prev.players, player] }))
    }
  }

  const updatePlayerField = async (player, patch) => {
    setList((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === player.id ? { ...p, ...patch } : p)),
    }))
    try {
      await api.updatePlayer(player.id, {
        name: player.name,
        skill: player.skill,
        gender: player.gender,
        ...patch,
      })
    } catch {
      showToast('Impossible de mettre à jour ce joueur·euse.', 'error')
      // Revert only the fields this call patched, against whatever the list
      // currently holds — not the whole `player` snapshot from before this
      // call, which would also wipe out a different, already-succeeded
      // concurrent edit (e.g. skill and gender changed back to back).
      const revert = Object.fromEntries(Object.keys(patch).map((key) => [key, player[key]]))
      setList((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.id === player.id ? { ...p, ...revert } : p)),
      }))
    }
  }

  const commitPlayerName = (player, rawName) => {
    const trimmed = rawName.trim()
    if (trimmed === '' || trimmed === player.name) return
    updatePlayerField(player, { name: trimmed })
  }

  if (list === null) {
    return (
      <Typography color="text.disabled" sx={{ py: 6, textAlign: 'center' }}>
        Chargement…
      </Typography>
    )
  }

  const sortedPlayers = [...list.players].sort((a, b) => a.skill - b.skill)

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
        <IconButton onClick={goBack} aria-label="Retour à mes listes">
          <ArrowLeft size={20} />
        </IconButton>
        {canManageList ? (
          <TextField
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Pencil size={16} color={theme.palette.text.disabled} />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  '&:before': { borderBottomColor: 'divider' },
                },
              },
            }}
            aria-label="Nom de la liste"
          />
        ) : (
          <Typography variant="h5" fontWeight={600} sx={{ flex: 1 }}>
            {name}
          </Typography>
        )}
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        {canManageVisibility ? (
          // The switch already carries the current state (position + label) —
          // a separate status badge next to it would just repeat it. That
          // badge only earns its place below, for someone who has no switch
          // to read the state off of.
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Switch
              checked={!!list.isPublic}
              onChange={(e) => setPendingPublic(e.target.checked)}
              inputProps={{
                'aria-label': list.isPublic
                  ? 'Rendre cette liste privée'
                  : 'Rendre cette liste publique',
              }}
            />
            <Typography
              variant="body2"
              fontWeight={600}
              color={list.isPublic ? 'success.main' : 'text.secondary'}
            >
              Liste {list.isPublic ? 'publique' : 'privée'}
            </Typography>
          </Stack>
        ) : list.isOwner ? null : (
          <Chip
            size="small"
            variant="outlined"
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: list.isPublic ? 'success.main' : 'text.disabled',
                }}
              />
            }
            label={list.isPublic ? 'Publique' : 'Privée'}
            sx={{
              height: 26,
              borderColor: 'divider',
              color: list.isPublic ? 'success.main' : 'text.secondary',
              '& .MuiChip-icon': { ml: '8px' },
              '& .MuiChip-label': { px: '8px' },
            }}
          />
        )}
        <Chip
          variant="outlined"
          icon={<Users size={14} />}
          label={sortedPlayers.length}
          sx={{
            flexShrink: 0,
            height: 32,
            px: 1,
            borderColor: 'divider',
            color: 'text.secondary',
            '& .MuiChip-icon': { color: 'text.secondary' },
          }}
        />
      </Stack>

      <Stack
        direction="row"
        useFlexGap
        spacing={1}
        sx={{ mb: 2, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}
      >
        <Button
          variant="outlined"
          startIcon={<History size={16} />}
          onClick={() => setIsHistoryOpen(true)}
        >
          Historique
        </Button>
        {canManageMembers && (
          <>
            <Button
              variant="outlined"
              startIcon={<ClipboardPaste size={16} />}
              onClick={() => setIsImportOpen(true)}
            >
              Coller une liste
            </Button>
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setIsAddOpen(true)}
            >
              Ajouter
            </Button>
          </>
        )}
      </Stack>

      {sortedPlayers.length === 0 ? (
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
          <UserPlus size={40} color={theme.palette.primary.main} style={{ marginBottom: 4 }} />
          <Typography variant="h6" fontWeight={500} color="text.secondary">
            Aucun·e joueur·euse pour l'instant
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Utilise « Ajouter » pour commencer le roster de cette liste.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1}>
          {sortedPlayers.map((player) =>
            canManageMembers ? (
              <Card key={player.id} variant="outlined" sx={{ p: 1.25 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    key={`${player.id}-${player.name}`}
                    variant="standard"
                    defaultValue={player.name}
                    onBlur={(e) => commitPlayerName(player, e.target.value)}
                    aria-label={`Nom de ${player.name}`}
                    sx={{ flex: 1, minWidth: 120 }}
                    slotProps={{ input: { disableUnderline: true, sx: { fontWeight: 500 } } }}
                  />
                  <NumberStepper
                    value={player.skill}
                    onChange={(v) => updatePlayerField(player, { skill: v })}
                    label={`Niveau de ${player.name}`}
                  />
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => updatePlayerField(player, { gender: 'male' })}
                      aria-pressed={player.gender === 'male'}
                      aria-label={`${player.name} masculin`}
                      color={player.gender === 'male' ? 'info' : 'default'}
                      sx={{
                        bgcolor: player.gender === 'male' ? 'action.selected' : 'transparent',
                      }}
                    >
                      <Mars size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => updatePlayerField(player, { gender: 'female' })}
                      aria-pressed={player.gender === 'female'}
                      aria-label={`${player.name} féminin`}
                      color={player.gender === 'female' ? 'primary' : 'default'}
                      sx={{
                        bgcolor: player.gender === 'female' ? 'action.selected' : 'transparent',
                      }}
                    >
                      <Venus size={16} />
                    </IconButton>
                  </Stack>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removePlayer(player)}
                    aria-label={`Retirer ${player.name}`}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Stack>
              </Card>
            ) : (
              <Card key={player.id} variant="outlined" sx={{ p: 1.25 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography fontWeight={500} sx={{ flex: 1, minWidth: 120 }}>
                    {player.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    niveau {player.skill}
                  </Typography>
                  {player.gender === 'male' ? <Mars size={16} /> : <Venus size={16} />}
                </Stack>
              </Card>
            )
          )}
        </Stack>
      )}

      <Drawer open={isAddOpen} title="Ajouter un·e joueur·euse" onClose={closeAddDrawer}>
        <Stack spacing={2}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              inputRef={nameInputRef}
              autoFocus
              fullWidth
              placeholder="Nom du joueur·euse"
              value={newPlayer.name}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitAddPlayer()
              }}
              onChange={(e) => {
                setSelectedMatch(null)
                setNewPlayer({ ...newPlayer, name: e.target.value })
              }}
            />
            {searchResults.length > 0 && (
              <Paper
                elevation={4}
                sx={{
                  position: 'absolute',
                  insetInline: 0,
                  top: '100%',
                  mt: 0.5,
                  zIndex: 1,
                  overflow: 'hidden',
                }}
              >
                <List disablePadding>
                  {searchResults.map((match) => (
                    <ListItemButton
                      key={match.id}
                      onClick={() => selectSearchResult(match)}
                      sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
                    >
                      <Typography fontWeight={500}>{match.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        niveau {match.skill}
                      </Typography>
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {selectedMatch && (
            <Typography variant="body2" color="text.secondary">
              Niveau et genre repris de <strong>{selectedMatch.name}</strong>.
            </Typography>
          )}

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              Niveau
            </Typography>
            <NumberStepper
              value={newPlayer.skill}
              onChange={(v) => setNewPlayer({ ...newPlayer, skill: v })}
              label="Niveau du nouveau joueur·euse"
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              Genre
            </Typography>
            <GenderToggle
              gender={newPlayer.gender}
              onChange={(g) => setNewPlayer({ ...newPlayer, gender: g })}
            />
          </Stack>

          <Button
            variant="contained"
            fullWidth
            startIcon={<Plus size={16} />}
            onClick={submitAddPlayer}
            disabled={newPlayer.name.trim() === ''}
          >
            Ajouter
          </Button>
        </Stack>
      </Drawer>

      <Drawer open={isImportOpen} title="Coller une liste" onClose={() => setIsImportOpen(false)}>
        <ImportPanel onImport={handleBulkImport} onClose={() => setIsImportOpen(false)} />
      </Drawer>

      <Drawer
        open={isHistoryOpen}
        title="Historique de présence"
        onClose={() => setIsHistoryOpen(false)}
        maxWidth="sm"
      >
        <AttendanceHistory listId={list.id} />
      </Drawer>

      <Drawer
        open={pendingPublic !== null}
        title={pendingPublic ? 'Rendre cette liste publique ?' : 'Rendre cette liste privée ?'}
        onClose={closeVisibilityConfirm}
      >
        <Stack spacing={2}>
          {pendingPublic ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Les comptes <strong>admin</strong> de l'app pourront voir « {list.name} » et gérer
                son roster (ajouter, retirer, modifier des joueur·euses).
              </Typography>
              <Box
                component="ul"
                sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}
              >
                <Typography component="li" variant="body2" color="text.secondary">
                  Tu restes seul·e à pouvoir la renommer, la supprimer ou la repasser en privé.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Les joueur·euses ajouté·es par un admin restent dans ton répertoire personnel, pas
                  le sien.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  Aucun lien public n'est créé&nbsp;: il faut être connecté avec un compte admin
                  pour la voir.
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                Les comptes admin qui géraient « {list.name} » perdront immédiatement l'accès à son
                roster.
              </Typography>
              <Box
                component="ul"
                sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}
              >
                <Typography component="li" variant="body2" color="text.secondary">
                  Toi seul·e continueras à la voir et à la modifier.
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  L'historique de présence déjà enregistré est conservé.
                </Typography>
              </Box>
            </>
          )}
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" fullWidth onClick={closeVisibilityConfirm}>
              Annuler
            </Button>
            <Button variant="contained" fullWidth onClick={confirmVisibilityChange}>
              {pendingPublic ? 'Rendre publique' : 'Rendre privée'}
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </Box>
  )
}

export default ListDetail
