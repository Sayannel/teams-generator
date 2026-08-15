import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { Mars, Venus } from 'lucide-react'

const OPTIONS = [
  { value: 'male', label: 'Masculin', Icon: Mars },
  { value: 'female', label: 'Féminin', Icon: Venus },
]

const GenderToggle = ({ gender, onChange }) => (
  <ToggleButtonGroup
    value={gender}
    exclusive
    onChange={(_, value) => value && onChange(value)}
    aria-label="Genre"
    size="small"
    color="primary"
  >
    {OPTIONS.map(({ value, label, Icon }) => (
      <ToggleButton
        key={value}
        value={value}
        sx={{
          gap: 0.75,
          textTransform: 'none',
          px: 1.5,
          height: 44,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
          },
        }}
      >
        <Icon size={16} />
        {label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
)

export default GenderToggle
