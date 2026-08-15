import Chip from '@mui/material/Chip'

const STATUS_COLOR = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  neutral: 'default',
}

const Badge = ({ status = 'neutral', className = '', children }) => (
  <Chip
    label={children}
    color={STATUS_COLOR[status]}
    size="small"
    className={className}
    sx={{ fontWeight: 600 }}
  />
)

export default Badge
