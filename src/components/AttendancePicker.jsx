import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

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
      <Box sx={{ mb: 2, maxHeight: 288, overflowY: 'auto' }}>
        {roster.map((p) => (
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
        ))}
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
