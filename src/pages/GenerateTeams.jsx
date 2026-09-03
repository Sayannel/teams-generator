import { useEffect, useState } from 'react'
import { Dices, Pencil } from 'lucide-react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PlayerDistributionSummary from '../components/PlayerDistributionSummary'
import TeamSummary from '../components/TeamSummary'
import { STEPS_LIST } from '../App'
import { generateTeams as generateTeamsFromPlayers } from '../lib/teamGenerator'
import { getPersistedPlayerIds } from '../lib/listSync'
import { api } from '../lib/api'
import BottomActionBar from '../components/ui/BottomActionBar'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/ToastProvider'

const GenerateTeams = ({ handleStepChange, players, config, teams, setTeams, currentList }) => {
  const { showToast } = useToast()
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [balanceScore, setBalanceScore] = useState(null)
  const [genderParityScore, setGenderParityScore] = useState(null)
  const [maxPlayerByTeam, setMaxPlayerByTeam] = useState(0)
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false)

  const generateBestTeams = () => {
    const best = generateTeamsFromPlayers(players, config.playersPerTeam)
    setTeams(best.teams)
    setBalanceScore(best.score)
    setGenderParityScore(best.parity)
    setMaxPlayerByTeam(best.maxSize)
  }

  useEffect(() => {
    generateBestTeams()
  }, [])

  const confirmRegenerate = () => {
    setIsRegenerateConfirmOpen(false)
    generateBestTeams()
    showToast('Nouvelle répartition générée.', 'success')
  }

  const handleValidateTeams = () => {
    if (currentList) {
      const playerIds = getPersistedPlayerIds(teams)
      api
        .recordAttendance(currentList.id, playerIds)
        .catch(() => showToast("Impossible d'enregistrer la présence pour l'historique.", 'error'))
    }
    handleStepChange(STEPS_LIST.EXPORT_TEAMS)
  }

  const handlePlayerSwap = (teamIndex, playerIndex) => {
    if (!selectedPlayer) {
      setSelectedPlayer({ teamIndex, playerIndex })
    } else {
      const newTeams = [...teams]
      const temp = newTeams[selectedPlayer.teamIndex][selectedPlayer.playerIndex]
      newTeams[selectedPlayer.teamIndex][selectedPlayer.playerIndex] =
        newTeams[teamIndex][playerIndex]
      newTeams[teamIndex][playerIndex] = temp

      setTeams(newTeams)
      setSelectedPlayer(null)
      showToast('Joueur·euse·s échangé·es.', 'success')
    }
  }

  return (
    <Box sx={{ pb: { xs: 24, md: 0 } }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        Création des équipes
      </Typography>

      {selectedPlayer && (
        <Alert severity="warning" sx={{ mb: 2, justifyContent: 'center', textAlign: 'center' }}>
          Sélectionnez un·e second·e joueur·euse pour échanger les deux.
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <PlayerDistributionSummary
          players={players}
          balanceScore={balanceScore}
          genderParityScore={genderParityScore}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
          gap: 3,
          py: 4,
        }}
      >
        {teams.map((team, i) => (
          <TeamSummary
            key={i}
            team={team}
            maxPlayerByTeam={maxPlayerByTeam}
            selectedPlayer={selectedPlayer}
            handlePlayerSwap={handlePlayerSwap}
            index={i}
          />
        ))}
      </Box>

      <BottomActionBar sx={{ mt: { md: 2 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1, md: 1.5 }}>
          <Stack direction="row" spacing={1} sx={{ display: { md: 'contents' } }}>
            <Button
              variant="outlined"
              startIcon={<Pencil size={16} />}
              onClick={() => handleStepChange(STEPS_LIST.PLAYERS_LIST)}
              sx={{ flex: { xs: 1, md: '0 0 auto' } }}
            >
              <Box component="span" sx={{ display: { md: 'none' } }}>
                Éditer
              </Box>
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                Éditer les joueur·euse·s
              </Box>
            </Button>
            <Button
              variant="outlined"
              startIcon={<Dices size={16} />}
              onClick={() => setIsRegenerateConfirmOpen(true)}
              sx={{ flex: { xs: 1, md: '0 0 auto' } }}
            >
              <Box component="span" sx={{ display: { md: 'none' } }}>
                Relancer
              </Box>
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                Relancer la génération
              </Box>
            </Button>
          </Stack>
          <Button
            variant="contained"
            onClick={handleValidateTeams}
            sx={{ width: { xs: '100%', md: 'auto' }, flex: { md: 2 } }}
          >
            Valider les équipes
          </Button>
        </Stack>
      </BottomActionBar>

      <ConfirmDialog
        open={isRegenerateConfirmOpen}
        title="Relancer la génération ?"
        message="Les équipes actuelles seront remplacées par une nouvelle répartition."
        confirmLabel="Relancer"
        onConfirm={confirmRegenerate}
        onCancel={() => setIsRegenerateConfirmOpen(false)}
      />
    </Box>
  )
}

export default GenerateTeams
