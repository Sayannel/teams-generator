import Box from '@mui/material/Box'

const StepProgress = ({ current, total }) => (
  <Box
    role="progressbar"
    aria-valuenow={current}
    aria-valuemin={1}
    aria-valuemax={total}
    aria-label={`Étape ${current} sur ${total}`}
    sx={{ display: 'flex', gap: 0.5 }}
  >
    {Array.from({ length: total }, (_, i) => (
      <Box
        key={i}
        sx={{
          height: 4,
          flex: 1,
          borderRadius: 999,
          bgcolor: i < current ? 'common.white' : 'rgba(255,255,255,0.25)',
        }}
      />
    ))}
  </Box>
)

export default StepProgress
