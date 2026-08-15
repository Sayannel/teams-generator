import Box from '@mui/material/Box'

const STATUS_COLOR = {
  success: 'success.main',
  good: 'good.main',
  warning: 'warning.main',
  danger: 'error.main',
}

const RatingDots = ({ status, filled, total = 4, label }) => {
  // Always show at least 1 filled dot — a bare "0/4" reads as broken rather
  // than "very poor", and there's always at least some score to represent.
  const clampedFilled = Math.max(1, filled ?? 0)

  return (
    <Box role="img" aria-label={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {Array.from({ length: total }, (_, i) => (
        <Box
          key={i}
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: i < clampedFilled ? STATUS_COLOR[status] : 'action.disabledBackground',
          }}
        />
      ))}
    </Box>
  )
}

export default RatingDots
