import { useEffect, useRef, useState } from 'react'
import { ChevronRight, ClipboardPaste, Mars, Plus, Trash2, UserPlus, Venus } from 'lucide-react'
import { STEPS_LIST } from '../App'
import Button from '../components/ui/Button'
import BottomActionBar from '../components/ui/BottomActionBar'
import NumberStepper from '../components/ui/NumberStepper'
import GenderToggle from '../components/ui/GenderToggle'
import Drawer from '../components/ui/Drawer'
import Fab from '../components/ui/Fab'
import ImportPanel from '../components/ImportPanel'
import { Toast } from '../components/ui/Toast'
import { useToast } from '../components/ui/useToast'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { APP_HEADER_HEIGHT } from '../lib/layout'

const DESKTOP_MEDIA_QUERY = '(min-width: 768px)'

// Reads the `md` breakpoint once and keeps it in sync via matchMedia.
// jsdom (used by tests) has no matchMedia implementation, so this safely
// falls back to "mobile" there, matching the app's mobile-first behavior.
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const mql = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const handleChange = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}

const PlayersList = ({ handleStepChange, players, setPlayers }) => {
  const nameInputRef = useRef(null)
  const [newPlayer, setNewPlayer] = useState({ name: '', skill: 1, gender: 'male' })
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingPlayerId, setEditingPlayerId] = useState(null)
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  const { toast, showToast, hideToast } = useToast()
  const isDesktop = useIsDesktop()

  const handleBulkImport = (importedPlayers) => {
    const existingNames = new Set(players.map((p) => p.name.toLowerCase()))
    const newPlayers = importedPlayers.filter((p) => !existingNames.has(p.name.toLowerCase()))
    const skipped = importedPlayers.length - newPlayers.length

    setPlayers((prev) => [...prev, ...newPlayers])
    setIsImportOpen(false)

    if (skipped > 0) {
      showToast(
        `${skipped} nom${skipped > 1 ? 's' : ''} déjà présent${skipped > 1 ? 's' : ''} dans la liste, ignoré${skipped > 1 ? 's' : ''}.`,
        'error'
      )
    }
  }

  const removePlayer = (id) => {
    setPlayers(players.filter((p) => p.id !== id))
  }

  const confirmClearPlayers = () => {
    setPlayers([])
    setIsClearConfirmOpen(false)
  }

  const handleAddNewPlayer = () => {
    const name = newPlayer.name.trim()
    if (!name) return

    const nameExists = players.some((p) => p.name.toLowerCase() === name.toLowerCase())
    if (nameExists) {
      showToast('Ce nom existe déjà dans la liste.', 'error')
      return
    }

    const newId = crypto.randomUUID()
    const playerToAdd = { id: newId, name, skill: newPlayer.skill, gender: newPlayer.gender }
    setPlayers((prev) => [...prev, playerToAdd])
    // On garde le niveau/genre du dernier ajout : pratique pour saisir un groupe d'un coup.
    setNewPlayer({ name: '', skill: newPlayer.skill, gender: newPlayer.gender })
    nameInputRef.current?.focus()
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

  return (
    <div className="pb-40 md:pb-24">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Liste des joueur·euse·s
        </h2>

        <div className="flex items-center gap-2">
          {players.length > 0 && (
            <Button
              variant="danger"
              onClick={() => setIsClearConfirmOpen(true)}
              aria-label="Effacer la liste"
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">Effacer</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            aria-label="Coller une liste"
          >
            <ClipboardPaste className="size-4" />
            <span className="hidden sm:inline">Coller une liste</span>
          </Button>
          {isDesktop && (
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="size-4" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {sortedPlayers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <UserPlus className="mb-1 size-10 text-brand-600" />
          <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
            Aucun·e joueur·euse pour l'instant
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Utilisez le bouton + ou « Coller une liste » pour commencer.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr
                className={`sticky top-[${APP_HEADER_HEIGHT}] z-10 bg-brand-600 text-xs font-semibold uppercase tracking-wide text-white`}
              >
                <th className="rounded-tl-lg px-3 py-2">Nom</th>
                <th className="px-3 py-2 text-center">Niveau</th>
                <th className="px-3 py-2 text-center">Genre</th>
                <th className="rounded-tr-lg px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => {
                const previous = sortedPlayers[index - 1]
                const isNewGroup = index > 0 && previous.skill !== player.skill
                const isLast = index === sortedPlayers.length - 1
                const rowBorder =
                  index === 0
                    ? ''
                    : isNewGroup
                      ? 'border-t-2 border-t-brand-600'
                      : 'border-t border-t-slate-100 dark:border-t-slate-800'

                if (isDesktop) {
                  return (
                    <tr key={player.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/70">
                      <td
                        className={`min-w-0 px-2 py-1.5 ${rowBorder} ${isLast ? 'rounded-bl-lg' : ''}`}
                      >
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleNameChange(player.id, e.target.value)}
                          aria-label="Nom"
                          className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-medium text-slate-900 hover:border-slate-200 focus:border-brand-600 focus:bg-white focus:outline-none dark:text-slate-100 dark:hover:border-slate-700 dark:focus:bg-slate-800"
                        />
                      </td>
                      <td className={`px-2 py-1.5 text-center ${rowBorder}`}>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={player.skill}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10)
                            if (!isNaN(n)) handleSkillChange(player.id, Math.max(1, n))
                          }}
                          aria-label={`Niveau de ${player.name || 'ce joueur·euse'}`}
                          className="w-14 rounded-lg border border-slate-200 bg-white px-1 py-1.5 text-center font-semibold text-slate-700 focus:border-brand-600 focus:outline-none [appearance:textfield] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </td>
                      <td className={`px-2 py-1.5 ${rowBorder}`}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleGenderChange(player.id, 'male')}
                            aria-pressed={player.gender === 'male'}
                            aria-label="Masculin"
                            className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                              player.gender === 'male'
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300'
                                : 'text-slate-300 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Mars className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenderChange(player.id, 'female')}
                            aria-pressed={player.gender === 'female'}
                            aria-label="Féminin"
                            className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                              player.gender === 'female'
                                ? 'bg-brand-100 text-brand-600 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'text-slate-300 hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-700'
                            }`}
                          >
                            <Venus className="size-4" />
                          </button>
                        </div>
                      </td>
                      <td
                        className={`px-2 py-1.5 text-right ${rowBorder} ${isLast ? 'rounded-br-lg' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => removePlayer(player.id)}
                          aria-label={`Supprimer ${player.name || 'ce joueur·euse'}`}
                          className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600 dark:text-slate-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr
                    key={player.id}
                    tabIndex={0}
                    onClick={() => setEditingPlayerId(player.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingPlayerId(player.id)
                    }}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70"
                  >
                    <td
                      className={`min-w-0 truncate px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100 ${rowBorder} ${
                        isLast ? 'rounded-bl-lg' : ''
                      }`}
                    >
                      {player.name}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 ${rowBorder}`}
                    >
                      {player.skill}
                    </td>
                    <td className={`px-3 py-2.5 text-center ${rowBorder}`}>
                      <span className="inline-flex items-center justify-center">
                        {player.gender === 'female' ? (
                          <Venus className="size-4 text-brand-600" />
                        ) : (
                          <Mars className="size-4 text-blue-500 dark:text-blue-400" />
                        )}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right ${rowBorder} ${isLast ? 'rounded-br-lg' : ''}`}
                    >
                      <ChevronRight className="ml-auto size-4 text-slate-300 dark:text-slate-600" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isDesktop && (
        <Fab onClick={() => setIsAddOpen(true)} aria-label="Ajouter un·e joueur·euse">
          <Plus className="size-6" />
        </Fab>
      )}

      <BottomActionBar className="md:mt-4">
        <div className="flex md:justify-end">
          <Button
            className="w-full md:w-auto"
            onClick={() => handleStepChange(STEPS_LIST.GENERATE_TEAMS)}
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
        </div>
      </BottomActionBar>

      <Drawer open={isAddOpen} title="Ajouter un·e joueur·euse" onClose={() => setIsAddOpen(false)}>
        <div className="space-y-4">
          <input
            ref={nameInputRef}
            type="text"
            autoFocus
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 focus:border-brand-600 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Nom du joueur·euse"
            value={newPlayer.name}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNewPlayer()
            }}
            onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Niveau</span>
            <NumberStepper
              value={newPlayer.skill}
              onChange={(v) => setNewPlayer({ ...newPlayer, skill: v })}
              label="Niveau du nouveau joueur·euse"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Genre</span>
            <GenderToggle
              gender={newPlayer.gender}
              onChange={(g) => setNewPlayer({ ...newPlayer, gender: g })}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleAddNewPlayer}
            disabled={newPlayer.name.trim() === ''}
          >
            <Plus className="size-4" /> Ajouter
          </Button>
        </div>
      </Drawer>

      <Drawer
        open={editingPlayer !== null}
        title="Modifier le joueur·euse"
        onClose={() => setEditingPlayerId(null)}
      >
        {editingPlayer && (
          <div className="space-y-4">
            <input
              type="text"
              autoFocus
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 focus:border-brand-600 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={editingPlayer.name}
              onChange={(e) => handleNameChange(editingPlayer.id, e.target.value)}
            />

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Niveau</span>
              <NumberStepper
                value={editingPlayer.skill}
                onChange={(v) => handleSkillChange(editingPlayer.id, v)}
                label={`Niveau de ${editingPlayer.name}`}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Genre</span>
              <GenderToggle
                gender={editingPlayer.gender}
                onChange={(g) => handleGenderChange(editingPlayer.id, g)}
              />
            </div>

            <Button className="w-full" onClick={() => setEditingPlayerId(null)}>
              Terminé
            </Button>

            <Button
              variant="danger"
              className="w-full"
              onClick={() => {
                removePlayer(editingPlayer.id)
                setEditingPlayerId(null)
              }}
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          </div>
        )}
      </Drawer>

      <Drawer open={isImportOpen} title="Coller une liste" onClose={() => setIsImportOpen(false)}>
        <ImportPanel onImport={handleBulkImport} onClose={() => setIsImportOpen(false)} />
      </Drawer>

      <Toast toast={toast} onDismiss={hideToast} />

      <ConfirmDialog
        open={isClearConfirmOpen}
        title="Effacer la liste ?"
        message="Tou·te·s les joueur·euse·s seront retiré·e·s de la liste."
        confirmLabel="Effacer"
        onConfirm={confirmClearPlayers}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </div>
  )
}

export default PlayersList
