import { useEffect, useState } from 'react'
import { Dices, Pencil } from 'lucide-react'
import PlayerDistributionSummary from '../components/PlayerDistributionSummary'
import TeamSummary from '../components/TeamSummary'
import { STEPS_LIST } from '../App'
import { generateTeams as generateTeamsFromPlayers } from '../lib/teamGenerator'
import Button from '../components/ui/Button'
import BottomActionBar from '../components/ui/BottomActionBar'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const GenerateTeams = ({ handleStepChange, players, config, teams, setTeams }) => {
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
    }
  }

  return (
    <div className="pb-48 md:pb-0">
      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">Génération</h2>

      {selectedPlayer && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-center text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Sélectionnez un·e second·e joueur·euse pour échanger les deux.
        </div>
      )}

      <div className="mb-4">
        <PlayerDistributionSummary
          players={players}
          balanceScore={balanceScore}
          genderParityScore={genderParityScore}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team, i) => (
          <TeamSummary
            team={team}
            maxPlayerByTeam={maxPlayerByTeam}
            selectedPlayer={selectedPlayer}
            handlePlayerSwap={handlePlayerSwap}
            index={i}
            key={i}
          />
        ))}
      </div>

      <BottomActionBar className="md:mt-4">
        <div className="md:flex md:gap-3">
          <div className="mb-2 grid grid-cols-2 gap-2 md:mb-0 md:contents">
            <Button
              variant="outline"
              className="md:flex-1"
              onClick={() => handleStepChange(STEPS_LIST.PLAYERS_LIST)}
            >
              <Pencil className="size-4" />
              <span className="md:hidden">Éditer</span>
              <span className="hidden md:inline">Éditer les joueur·euse·s</span>
            </Button>
            <Button
              variant="outline"
              className="md:flex-1"
              onClick={() => setIsRegenerateConfirmOpen(true)}
            >
              <Dices className="size-4" />
              <span className="md:hidden">Relancer</span>
              <span className="hidden md:inline">Relancer la génération</span>
            </Button>
          </div>
          <Button
            className="w-full md:w-auto md:flex-[2]"
            onClick={() => handleStepChange(STEPS_LIST.EXPORT_TEAMS)}
          >
            Valider les équipes
          </Button>
        </div>
      </BottomActionBar>

      <ConfirmDialog
        open={isRegenerateConfirmOpen}
        title="Relancer la génération ?"
        message="Les équipes actuelles seront remplacées par une nouvelle répartition."
        confirmLabel="Relancer"
        onConfirm={confirmRegenerate}
        onCancel={() => setIsRegenerateConfirmOpen(false)}
      />
    </div>
  )
}

export default GenerateTeams
