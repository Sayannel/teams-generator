import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/ToastProvider'
import { getTeamColor } from '../lib/teamColors'

const ExportTeams = ({ teams, reset }) => {
  const theme = useTheme()
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const { showToast } = useToast()

  // Trie les prénoms par ordre alphabétique dans chaque équipe (affichage stable)
  const sortedTeams = teams.map((team) => [...team].sort((a, b) => a.name.localeCompare(b.name)))

  const copyToClipboard = () => {
    const text = sortedTeams
      .map((team, i) => `Équipe #${i + 1} : ${team.map((p) => p.name).join(', ')}`)
      .join('\n')

    navigator.clipboard.writeText(text).then(() => {
      showToast('Liste des équipes copiée dans le presse-papiers.', 'success')
    })
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Export des équipes
      </Typography>

      <Grid container spacing={1.5}>
        {sortedTeams.map((team, i) => {
          const main = getTeamColor(i)
          const tint = alpha(main, theme.palette.mode === 'dark' ? 0.16 : 0.08)
          return (
            <Grid key={i} size={{ xs: 6, md: 6, lg: 6 }}>
              <Card variant="outlined" sx={{ borderColor: alpha(main, 0.35) }}>
                <Typography
                  fontWeight={700}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: alpha(main, 0.35),
                    bgcolor: tint,
                  }}
                >
                  Équipe #{i + 1}
                </Typography>
                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {team.map((p) => (
                    <Box
                      component="li"
                      key={p.id}
                      sx={{
                        px: 2,
                        py: 1,
                        color: 'text.secondary',
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:last-of-type': { borderBottom: 0 },
                      }}
                    >
                      {p.name}
                    </Box>
                  ))}
                </Box>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ mt: 3, justifyContent: 'flex-end' }}
      >
        <Button variant="outlined" onClick={copyToClipboard}>
          Copier les équipes
        </Button>
        <Button variant="contained" onClick={() => setIsResetConfirmOpen(true)}>
          Faire de nouvelles équipes
        </Button>
      </Stack>

      <ConfirmDialog
        open={isResetConfirmOpen}
        title="Nouvelles équipes ?"
        message="Cela efface la liste actuelle de joueur·euse·s et d'équipes."
        confirmLabel="Recommencer"
        onConfirm={() => {
          setIsResetConfirmOpen(false)
          reset()
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </Box>
  )
}

export default ExportTeams
