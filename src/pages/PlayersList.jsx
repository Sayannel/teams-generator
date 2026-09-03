import { useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  ClipboardPaste,
  Download,
  Mars,
  Plus,
  Trash2,
  UserPlus,
  Venus,
} from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableFooter from '@mui/material/TableFooter'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { STEPS_LIST } from '../App'
import { api } from '../lib/api'
import { computeListDiff, isDiffEmpty, applyListDiff } from '../lib/listSync'
import BottomActionBar from '../components/ui/BottomActionBar'
import NumberStepper from '../components/ui/NumberStepper'
import GenderToggle from '../components/ui/GenderToggle'
import Drawer from '../components/ui/Drawer'
import Fab from '../components/ui/Fab'
import ImportPanel from '../components/ImportPanel'
import ImportSavedListPanel from '../components/ImportSavedListPanel'
import { useToast } from '../components/ui/ToastProvider'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { APP_HEADER_HEIGHT_CSS } from '../lib/layout'
import { useIsDesktop } from '../lib/useIsDesktop'

const emptyNewPlayer = { name: '', skill: 1, gender: 'male' }

// A player's `id` is a number when it came from the server (a loaded
// roster row) — mirrors the same discriminator in lib/listSync.js.
const hasServerId = (player) => typeof player.id === 'number'

const GuestChip = () => (
  <Chip
    label="invité·e"
    size="small"
    color="warning"
    sx={{
      height: 18,
      fontSize: '0.625rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      flexShrink: 0,
    }}
  />
)

const PlayersList = ({
  handleStepChange,
  players,
  setPlayers,
  currentList = null,
  savedRoster = [],
  setSavedRoster,
  user = null,
}) => {
  const theme = useTheme()
  const nameInputRef = useRef(null)
  const [newPlayer, setNewPlayer] = useState(emptyNewPlayer)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isImportListOpen, setIsImportListOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState(null)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  const [pendingDiff, setPendingDiff] = useState(null)
  // Roster players explicitly removed from the working list this session
  // (trash icon, or "Effacer la liste") — the only ones computeListDiff
  // should delete server-side; simply being absent doesn't count.
  const [removedRosterIds, setRemovedRosterIds] = useState(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()
  const isDesktop = useIsDesktop()

  // Debounced typeahead against the personal player directory, for pulling
  // in someone who isn't already part of this session (the "Jane Doe" case).
  useEffect(() => {
    const query = newPlayer.name.trim()
    if (selectedMatch || query.length < 2) {
      setSearchResults([])
      return undefined
    }
    const handle = setTimeout(() => {
      api
        .searchPlayers(query)
        .then(({ players: found }) => {
          setSearchResults(found.filter((p) => !players.some((existing) => existing.id === p.id)))
        })
        .catch(() => {})
    }, 250)
    return () => clearTimeout(handle)
  }, [newPlayer.name, selectedMatch, players])

  // Shared by both bulk-import paths (pasted text, or a whole saved list —
  // already filtered to who's actually present, in the latter's own
  // picker): merge in whoever isn't already here by name.
  const mergeImportedPlayers = (importedPlayers) => {
    const existingNames = new Set(players.map((p) => p.name.toLowerCase()))
    const newPlayers = importedPlayers.filter((p) => !existingNames.has(p.name.toLowerCase()))
    const skipped = importedPlayers.length - newPlayers.length

    setPlayers((prev) => [...prev, ...newPlayers])

    if (skipped > 0) {
      showToast(
        `${skipped} nom${skipped > 1 ? 's' : ''} déjà présent${skipped > 1 ? 's' : ''} dans la liste, ignoré${skipped > 1 ? 's' : ''}.`,
        'error'
      )
    }
  }

  const handleBulkImport = (importedPlayers) => {
    mergeImportedPlayers(importedPlayers)
    setIsImportOpen(false)
  }

  const handleImportFromList = (importedPlayers) => {
    mergeImportedPlayers(importedPlayers)
    setIsImportListOpen(false)
  }

  const removePlayer = (id) => {
    const removed = players.find((p) => p.id === id)
    setPlayers(players.filter((p) => p.id !== id))
    if (removed && !removed.isAdHoc && hasServerId(removed)) {
      setRemovedRosterIds((prev) => new Set(prev).add(removed.id))
    }
    if (removed) showToast(`${removed.name || 'Joueur·euse'} supprimé·e.`, 'success')
  }

  const confirmClearPlayers = () => {
    setRemovedRosterIds((prev) => {
      const next = new Set(prev)
      players.forEach((p) => {
        if (!p.isAdHoc && hasServerId(p)) next.add(p.id)
      })
      return next
    })
    setPlayers([])
    setIsClearConfirmOpen(false)
    showToast('Liste vidée.', 'success')
  }

  const closeAddDrawer = () => {
    setIsAddOpen(false)
    setNewPlayer((prev) => ({ ...emptyNewPlayer, skill: prev.skill, gender: prev.gender }))
    setSelectedMatch(null)
    setSearchResults([])
  }

  const handleAddNewPlayer = () => {
    const name = newPlayer.name.trim()
    if (!name) return

    const nameExists = players.some((p) => p.name.toLowerCase() === name.toLowerCase())
    if (nameExists) {
      showToast('Ce nom existe déjà dans la liste.', 'error')
      return
    }

    let playerToAdd
    if (selectedMatch && selectedMatch.name === name) {
      const isUsual = savedRoster.some((p) => p.id === selectedMatch.id)
      playerToAdd = {
        id: selectedMatch.id,
        name: selectedMatch.name,
        skill: selectedMatch.skill,
        gender: selectedMatch.gender,
        ...(!isUsual && { isAdHoc: true }),
      }
    } else {
      playerToAdd = {
        id: crypto.randomUUID(),
        name,
        skill: newPlayer.skill,
        gender: newPlayer.gender,
      }
    }

    setPlayers((prev) => [...prev, playerToAdd])
    // On garde le niveau/genre du dernier ajout : pratique pour saisir un groupe d'un coup.
    setNewPlayer({ name: '', skill: playerToAdd.skill, gender: playerToAdd.gender })
    setSelectedMatch(null)
    setSearchResults([])
    nameInputRef.current?.focus()
  }

  const selectSearchResult = (match) => {
    setSelectedMatch(match)
    setNewPlayer({ name: match.name, skill: match.skill, gender: match.gender })
    setSearchResults([])
  }

  const handleNameChange = (id, newName) => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, name: newName } : p)))
  }

  const handleSkillChange = (id, newSkill) => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, skill: newSkill } : p)))
  }

  const handleGenderChange = (id, newGender) => {
    setPlayers(players.map((p) => (p.id === id ? { ...p, gender: newGender } : p)))
  }

  const sortedPlayers = [...players].sort((a, b) => a.skill - b.skill)
  const isValid = sortedPlayers.every((p) => p.name.trim() !== '')
  const canContinue = isValid && players.length > 0
  const editingPlayer = players.find((p) => p.id === editingPlayerId) ?? null

  const goToGenerateTeams = () => handleStepChange(STEPS_LIST.GENERATE_TEAMS)

  const handleValider = () => {
    if (!currentList) {
      goToGenerateTeams()
      return
    }
    const diff = computeListDiff(savedRoster, players, removedRosterIds)
    if (isDiffEmpty(diff)) {
      goToGenerateTeams()
      return
    }
    setPendingDiff(diff)
  }

  // Folds a diff-apply's results back into local state: newly-created
  // players get their server id (so a later sync recognizes them as already
  // persisted instead of re-creating them), and `savedRoster` — the
  // baseline the next computeListDiff compares against — is brought back in
  // sync with what the server now actually holds.
  const reconcileAppliedDiff = (progress) => {
    setPlayers((prev) =>
      prev.map((p) => {
        const created = progress.created.get(p.id)
        return created ? { ...p, id: created.id } : p
      })
    )
    setSavedRoster((prev) => {
      const updatedById = new Map(progress.updated.map((p) => [p.id, p]))
      const kept = prev
        .filter((p) => !progress.deletedIds.includes(p.id))
        .map((p) => updatedById.get(p.id) ?? p)
      return [...kept, ...progress.created.values()]
    })
    setRemovedRosterIds((prev) => {
      const next = new Set(prev)
      progress.deletedIds.forEach((id) => next.delete(id))
      return next
    })
  }

  const saveAndContinue = async () => {
    setIsSaving(true)
    try {
      const progress = await applyListDiff(api, currentList.id, pendingDiff)
      reconcileAppliedDiff(progress)
      setPendingDiff(null)
      goToGenerateTeams()
    } catch (error) {
      if (error.partialProgress) reconcileAppliedDiff(error.partialProgress)
      showToast("Certaines modifications n'ont pas pu être enregistrées.", 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const continueWithoutSaving = () => {
    setPendingDiff(null)
    goToGenerateTeams()
  }

  const tableRadius = theme.shape.borderRadius / 2

  const rowBorderSx = (index, isNewGroup) =>
    index === 0
      ? {}
      : isNewGroup
        ? { borderTop: '2px solid', borderTopColor: 'primary.main' }
        : { borderTop: 1, borderTopColor: 'divider' }

  return (
    <Box sx={{ pb: { xs: 20, md: 12 } }}>
      <Stack
        direction="column"
        spacing={1.5}
        sx={{ mb: 2, alignItems: 'stretch', justifyContent: 'space-between' }}
      >
        <Typography variant="h5">Liste des joueur·euse·s</Typography>

        <Stack
          direction="row"
          spacing={1}
          sx={{ minWidth: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
          {players.length > 0 && (
            <Button
              variant="contained"
              color="error"
              size={isDesktop ? 'medium' : 'small'}
              startIcon={<Trash2 size={16} />}
              onClick={() => setIsClearConfirmOpen(true)}
              aria-label="Effacer la liste"
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
                minWidth: { xs: 44 },
                '& .MuiButton-startIcon': { ml: { xs: 0, sm: -0.5 }, mr: { xs: 0, sm: 1 } },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Effacer
              </Box>
            </Button>
          )}
          <Button
            variant="outlined"
            size={isDesktop ? 'medium' : 'small'}
            startIcon={<ClipboardPaste size={16} />}
            onClick={() => setIsImportOpen(true)}
            aria-label="Import manuel"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
          >
            Import manuel
          </Button>
          {user && (
            <Button
              variant="outlined"
              size={isDesktop ? 'medium' : 'small'}
              startIcon={<Download size={16} />}
              onClick={() => setIsImportListOpen(true)}
              aria-label="Importer une liste"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
            >
              Importer une liste
            </Button>
          )}
          {isDesktop && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => setIsAddOpen(true)}
              sx={{ fontWeight: 700 }}
            >
              Ajouter
            </Button>
          )}
        </Stack>
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
            Utilisez le bouton + ou « Coller des joueur·euse·s » pour commencer.
          </Typography>
        </Card>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: `${tableRadius}px` }}>
          <Table size="small" sx={{ borderCollapse: 'separate' }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: APP_HEADER_HEIGHT_CSS,
                    zIndex: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderTopLeftRadius: tableRadius,
                  }}
                >
                  Nom
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    position: 'sticky',
                    top: APP_HEADER_HEIGHT_CSS,
                    zIndex: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Niveau
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    position: 'sticky',
                    top: APP_HEADER_HEIGHT_CSS,
                    zIndex: 1,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Genre
                </TableCell>
                <TableCell
                  sx={{
                    position: 'sticky',
                    top: APP_HEADER_HEIGHT_CSS,
                    zIndex: 1,
                    bgcolor: 'primary.main',
                    borderTopRightRadius: tableRadius,
                  }}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPlayers.map((player, index) => {
                const previous = sortedPlayers[index - 1]
                const isNewGroup = index > 0 && previous.skill !== player.skill
                const border = rowBorderSx(index, isNewGroup)

                if (isDesktop) {
                  return (
                    <TableRow key={player.id} hover>
                      <TableCell sx={{ minWidth: 0, ...border }}>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <TextField
                            variant="standard"
                            value={player.name}
                            onChange={(e) => handleNameChange(player.id, e.target.value)}
                            aria-label="Nom"
                            fullWidth
                            slotProps={{
                              input: { disableUnderline: true, sx: { fontWeight: 500 } },
                            }}
                          />
                          {player.isAdHoc && <GuestChip />}
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={border}>
                        <TextField
                          type="number"
                          inputMode="numeric"
                          variant="outlined"
                          size="small"
                          value={player.skill}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10)
                            if (!isNaN(n)) handleSkillChange(player.id, Math.max(1, n))
                          }}
                          aria-label={`Niveau de ${player.name || 'ce joueur·euse'}`}
                          sx={{ width: 64 }}
                          slotProps={{ htmlInput: { min: 1, style: { textAlign: 'center' } } }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={border}>
                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => handleGenderChange(player.id, 'male')}
                            aria-pressed={player.gender === 'male'}
                            aria-label="Masculin"
                            color={player.gender === 'male' ? 'info' : 'default'}
                            sx={{
                              bgcolor: player.gender === 'male' ? 'action.selected' : 'transparent',
                            }}
                          >
                            <Mars size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleGenderChange(player.id, 'female')}
                            aria-pressed={player.gender === 'female'}
                            aria-label="Féminin"
                            color={player.gender === 'female' ? 'primary' : 'default'}
                            sx={{
                              bgcolor:
                                player.gender === 'female' ? 'action.selected' : 'transparent',
                            }}
                          >
                            <Venus size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell align="right" sx={border}>
                        <IconButton
                          size="small"
                          onClick={() => removePlayer(player.id)}
                          aria-label={`Supprimer ${player.name || 'ce joueur·euse'}`}
                          sx={(t) => ({
                            color: 'text.disabled',
                            '&:hover': {
                              color: 'error.main',
                              bgcolor: alpha(t.palette.error.main, 0.1),
                            },
                          })}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                }

                return (
                  <TableRow
                    key={player.id}
                    hover
                    role="button"
                    tabIndex={0}
                    aria-label={`Modifier ${player.name || 'ce joueur·euse'}`}
                    onClick={() => setEditingPlayerId(player.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setEditingPlayerId(player.id)
                      }
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ minWidth: 0, fontWeight: 500, py: 1.5, ...border }}>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ minWidth: 0, alignItems: 'center' }}
                      >
                        <Typography noWrap component="span" fontWeight={500}>
                          {player.name}
                        </Typography>
                        {player.isAdHoc && <GuestChip />}
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, py: 1.5, ...border }}>
                      {player.skill}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.5, ...border }}>
                      {player.gender === 'female' ? (
                        <Venus size={16} color={theme.palette.primary.main} />
                      ) : (
                        <Mars size={16} color="#3b82f6" />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5, ...border }}>
                      <ChevronRight
                        size={16}
                        color={theme.palette.text.disabled}
                        style={{ marginLeft: 'auto' }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="right"
                  sx={{
                    borderTop: 2,
                    borderTopColor: 'divider',
                    borderBottomLeftRadius: tableRadius,
                    borderBottomRightRadius: tableRadius,
                    bgcolor: 'action.hover',
                    fontSize: '1rem',
                    color: 'text.primary',
                    py: 1.5,
                  }}
                >
                  Nombre de joueur·euse·s&nbsp;:{' '}
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {sortedPlayers.length}
                  </Box>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Paper>
      )}

      {!isDesktop && (
        <Fab
          onClick={() => setIsAddOpen(true)}
          aria-label="Ajouter un·e joueur·euse"
          sx={{ fontWeight: 700 }}
        >
          <Plus size={20} />
          Ajouter
        </Fab>
      )}

      <BottomActionBar sx={{ mt: { md: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}>
          <Button
            variant="contained"
            sx={{ width: { xs: '100%', md: 'auto' } }}
            onClick={handleValider}
            disabled={!canContinue}
            title={
              !isValid
                ? 'Certains noms sont vides'
                : players.length === 0
                  ? 'Ajoutez au moins un·e joueur·euse'
                  : ''
            }
          >
            Valider &gt;
          </Button>
        </Box>
      </BottomActionBar>

      <Drawer open={isAddOpen} title="Ajouter un·e joueur·euse" onClose={closeAddDrawer}>
        <Stack spacing={2}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              inputRef={nameInputRef}
              autoFocus
              fullWidth
              placeholder="Nom du joueur·euse"
              value={newPlayer.name}
              // On mobile this puts an explicit "OK"/"Envoyer" action on the
              // virtual keyboard instead of a generic return key, so someone
              // can submit straight from the keyboard without ever having to
              // reach the controls it may be covering (Android's overlay
              // keyboards don't reliably resize the viewport to reveal them).
              slotProps={{ htmlInput: { enterKeyHint: 'done' } }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNewPlayer()
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
                  {searchResults.map((match) => {
                    const isUsual = savedRoster.some((p) => p.id === match.id)
                    return (
                      <ListItemButton
                        key={match.id}
                        onClick={() => selectSearchResult(match)}
                        sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
                      >
                        <Typography fontWeight={500}>{match.name}</Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: 'center', color: 'text.secondary' }}
                        >
                          <Typography variant="caption">niveau {match.skill}</Typography>
                          {!isUsual && (
                            <Chip
                              label="pas habituel·le ici"
                              size="small"
                              color="warning"
                              sx={{
                                height: 18,
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            />
                          )}
                        </Stack>
                      </ListItemButton>
                    )
                  })}
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

          {/* Sticky rather than just the last item in the stack: on a
              mobile keyboard that overlays instead of resizing the
              viewport (Android Firefox), the primary action stays
              reachable with a short scroll instead of being hidden below
              the fold behind Niveau/Genre. */}
          <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', pt: 1.5 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Plus size={16} />}
              onClick={handleAddNewPlayer}
              disabled={newPlayer.name.trim() === ''}
            >
              Ajouter
            </Button>
          </Box>
        </Stack>
      </Drawer>

      <Drawer
        open={editingPlayer !== null}
        title="Modifier le joueur·euse"
        onClose={() => setEditingPlayerId(null)}
      >
        {editingPlayer && (
          <Stack spacing={2}>
            <TextField
              autoFocus
              fullWidth
              value={editingPlayer.name}
              onChange={(e) => handleNameChange(editingPlayer.id, e.target.value)}
            />

            {editingPlayer.isAdHoc && (
              <Typography variant="body2" color="warning.main">
                Invité·e ponctuel·le&nbsp;: ne sera pas enregistré·e dans cette liste.
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
                value={editingPlayer.skill}
                onChange={(v) => handleSkillChange(editingPlayer.id, v)}
                label={`Niveau de ${editingPlayer.name}`}
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
                gender={editingPlayer.gender}
                onChange={(g) => handleGenderChange(editingPlayer.id, g)}
              />
            </Stack>

            <Button variant="contained" fullWidth onClick={() => setEditingPlayerId(null)}>
              Terminé
            </Button>

            <Button
              variant="outlined"
              color="error"
              fullWidth
              startIcon={<Trash2 size={16} />}
              onClick={() => {
                removePlayer(editingPlayer.id)
                setEditingPlayerId(null)
              }}
            >
              Supprimer
            </Button>
          </Stack>
        )}
      </Drawer>

      <Drawer
        open={isImportOpen}
        title="Coller des joueur·euse·s"
        onClose={() => setIsImportOpen(false)}
      >
        <ImportPanel onImport={handleBulkImport} onClose={() => setIsImportOpen(false)} />
      </Drawer>

      <Drawer
        open={isImportListOpen}
        title="Importer depuis mes listes"
        onClose={() => setIsImportListOpen(false)}
      >
        <ImportSavedListPanel onImport={handleImportFromList} excludeListId={currentList?.id} />
      </Drawer>

      <Drawer
        open={pendingDiff !== null}
        title="Enregistrer les modifications ?"
        onClose={() => !isSaving && setPendingDiff(null)}
      >
        {pendingDiff && (
          <Stack spacing={2}>
            <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary' }}>
              {pendingDiff.toCreate.length > 0 && (
                <li>
                  {pendingDiff.toCreate.length} ajout{pendingDiff.toCreate.length > 1 ? 's' : ''}{' '}
                  sur « {currentList.name} »
                </li>
              )}
              {pendingDiff.toUpdate.length > 0 && (
                <li>
                  {pendingDiff.toUpdate.length} modifié{pendingDiff.toUpdate.length > 1 ? 's' : ''}
                </li>
              )}
              {pendingDiff.toDelete.length > 0 && (
                <li>
                  {pendingDiff.toDelete.length} retiré{pendingDiff.toDelete.length > 1 ? 's' : ''}{' '}
                  de la liste
                </li>
              )}
            </Box>

            <Button variant="contained" fullWidth onClick={saveAndContinue} disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : 'Enregistrer et continuer'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={continueWithoutSaving}
              disabled={isSaving}
            >
              Continuer sans enregistrer
            </Button>
          </Stack>
        )}
      </Drawer>

      <ConfirmDialog
        open={isClearConfirmOpen}
        title="Effacer la liste ?"
        message="Tou·te·s les joueur·euse·s seront retiré·e·s de la liste."
        confirmLabel="Effacer"
        onConfirm={confirmClearPlayers}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </Box>
  )
}

export default PlayersList
