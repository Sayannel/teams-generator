import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { STEPS_LIST } from '../App'
import HowItWorks from '../components/HowItWorks'
import NumberStepper from '../components/ui/NumberStepper'

const Setup = ({ handleStepChange, setConfig, user }) => {
  const [playersPerTeam, setPlayersPerTeam] = useState(4)

  const handleSubmit = (e) => {
    e.preventDefault()
    setConfig({ playersPerTeam })
    handleStepChange(STEPS_LIST.PLAYERS_LIST)
  }

  return (
    <Box sx={{ mx: 'auto', maxWidth: { md: 480 } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Configurer les équipes
      </Typography>

      <Card
        component="form"
        variant="outlined"
        onSubmit={handleSubmit}
        sx={{ p: 3, textAlign: 'center' }}
      >
        <Typography
          component="label"
          fontWeight={500}
          color="text.secondary"
          sx={{ display: 'block', mb: 3 }}
        >
          Nombre de joueur·euse·s par équipe
        </Typography>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <NumberStepper
            value={playersPerTeam}
            onChange={setPlayersPerTeam}
            min={1}
            label="Nombre de joueur·euse·s par équipe"
          />
        </Box>

        <Button type="submit" variant="contained" sx={{ width: { xs: '100%', md: 'auto' } }}>
          Valider
        </Button>
      </Card>

      {!user && <HowItWorks />}
    </Box>
  )
}

export default Setup
