import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import { Minus, Plus } from 'lucide-react'

const NumberStepper = ({ value, onChange, min = 1, max = Infinity, step = 1, label }) => {
  const decrement = () => onChange(Math.max(min, value - step))
  const increment = () => onChange(Math.min(max, value + step))

  const handleInputChange = (e) => {
    const n = parseInt(e.target.value, 10)
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
  }

  return (
    <Box
      role="group"
      aria-label={label}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: 1,
        borderColor: 'divider',
        borderRadius: '12px',
        bgcolor: 'background.paper',
      }}
    >
      <IconButton
        onClick={decrement}
        disabled={value <= min}
        aria-label="Diminuer"
        color="primary"
        sx={{ borderRadius: '11px 0 0 11px' }}
      >
        <Minus size={20} />
      </IconButton>
      <InputBase
        type="number"
        inputMode="numeric"
        value={value}
        onChange={handleInputChange}
        inputProps={{ 'aria-label': label, style: { textAlign: 'center' } }}
        sx={{
          width: 56,
          borderLeft: 1,
          borderRight: 1,
          borderColor: 'divider',
          px: 1,
          fontWeight: 600,
          fontSize: '1.125rem',
          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
            {
              WebkitAppearance: 'none',
              margin: 0,
            },
        }}
      />
      <IconButton
        onClick={increment}
        disabled={value >= max}
        aria-label="Augmenter"
        color="primary"
        sx={{ borderRadius: '0 11px 11px 0' }}
      >
        <Plus size={20} />
      </IconButton>
    </Box>
  )
}

export default NumberStepper
