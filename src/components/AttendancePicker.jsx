import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Search } from 'lucide-react'

/**
 * Checkbox roster picker used after selecting a saved list: decide who's
 * actually present before pulling the list into the working session.
 */
const AttendancePicker = ({
  roster = [],
  onConfirm,
  confirmLabel = 'Importer',
  disableWhenEmpty = false,
}) => {
  const [checkedIds, setCheckedIds] = useState(() => new Set(roster.map((p) => p.id)))
  const [search, setSearch] = useState('')

  const toggle = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filteredRoster = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return roster
    return roster.filter((p) => p.name.toLowerCase().includes(query))
  }, [roster, search])

  const allFilteredChecked =
    filteredRoster.length > 0 && filteredRoster.every((p) => checkedIds.has(p.id))
  const someFilteredChecked = filteredRoster.some((p) => checkedIds.has(p.id))

  const toggleAll = () => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredChecked) {
        filteredRoster.forEach((p) => next.delete(p.id))
      } else {
        filteredRoster.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  if (roster.length === 0) {
    return (
      <Box>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Cette liste est vide pour l'instant.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={() => onConfirm([])}
          disabled={disableWhenEmpty}
        >
          {confirmLabel}
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Décoche qui n'est pas là ce soir.
      </Typography>
      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher un joueur…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 1 }}
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
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <FormControlLabel
          sx={{ mx: 0 }}
          control={
            <Checkbox
              checked={allFilteredChecked}
              indeterminate={!allFilteredChecked && someFilteredChecked}
              onChange={toggleAll}
              disabled={filteredRoster.length === 0}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Tout {allFilteredChecked ? 'décocher' : 'cocher'}
            </Typography>
          }
        />
      </Stack>
      <Box sx={{ mb: 2, maxHeight: 288, overflowY: 'auto' }}>
        {filteredRoster.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            Aucun joueur ne correspond à « {search} ».
          </Typography>
        ) : (
          filteredRoster.map((p) => (
            <FormControlLabel
              key={p.id}
              sx={{
                display: 'flex',
                width: '100%',
                mx: 0,
                borderRadius: 2,
                '&:hover': { bgcolor: 'action.hover' },
              }}
              control={<Checkbox checked={checkedIds.has(p.id)} onChange={() => toggle(p.id)} />}
              label={<Typography fontWeight={600}>{p.name}</Typography>}
            />
          ))
        )}
      </Box>
      <Button
        variant="contained"
        fullWidth
        onClick={() => onConfirm(roster.filter((p) => checkedIds.has(p.id)))}
        disabled={checkedIds.size === 0}
      >
        {confirmLabel}
        {checkedIds.size > 0 && ` (${checkedIds.size})`}
      </Button>
    </Box>
  )
}

export default AttendancePicker
