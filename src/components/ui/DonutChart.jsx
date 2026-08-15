import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

const RADIUS = 15.9155 // makes the circle's circumference ~100, so segment values map directly to percentages

const DonutChart = ({ segments, size = 128, strokeWidth = 5, centerLabel, centerSublabel }) => {
  const theme = useTheme()
  let cumulative = 0

  return (
    <Box sx={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <svg viewBox="0 0 42 42" width="100%" height="100%">
        <circle
          cx="21"
          cy="21"
          r={RADIUS}
          fill="none"
          stroke={theme.palette.divider}
          strokeWidth={strokeWidth}
        />
        {segments.map((segment) => {
          if (segment.value <= 0) return null
          const dashoffset = 25 - cumulative
          cumulative += segment.value
          return (
            <circle
              key={segment.label}
              cx="21"
              cy="21"
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.value} ${100 - segment.value}`}
              strokeDashoffset={dashoffset}
            />
          )
        })}
      </svg>
      {(centerLabel || centerSublabel) && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {centerLabel && (
            <Typography variant="h6" fontWeight={800} color="text.primary">
              {centerLabel}
            </Typography>
          )}
          {centerSublabel && (
            <Typography variant="caption" color="text.disabled">
              {centerSublabel}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default DonutChart
