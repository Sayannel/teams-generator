import { ArrowRightLeft } from 'lucide-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import Badge from './ui/Badge'
import { getTeamColor } from '../lib/teamColors'

const TeamSummary = ({ team, maxPlayerByTeam, selectedPlayer, handlePlayerSwap, index }) => {
  const theme = useTheme()
  const teamSkill = team.reduce((sum, p) => sum + p.skill, 0)
  const isIncomplete = team.length < maxPlayerByTeam
  const main = getTeamColor(index)
  const tint = alpha(main, theme.palette.mode === 'dark' ? 0.16 : 0.08)

  return (
    <Card variant="outlined" sx={{ borderColor: alpha(main, 0.35) }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: alpha(main, 0.35),
          bgcolor: tint,
        }}
      >
        <Typography fontWeight={700}>Équipe #{index + 1}</Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            label={`Total : ${teamSkill}`}
            size="small"
            sx={{ bgcolor: main, color: 'common.white', fontWeight: 600 }}
          />
          {isIncomplete && <Badge status="warning">incomplète</Badge>}
        </Stack>
      </Box>
      <Box>
        {team.map((p, j) => {
          const isSelected =
            selectedPlayer?.teamIndex === index && selectedPlayer?.playerIndex === j
          return (
            <Box
              key={p.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1,
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-of-type': { borderBottom: 0 },
                ...(isSelected && { boxShadow: `inset 0 0 0 1px ${main}`, bgcolor: tint }),
              }}
            >
              <Typography
                sx={{
                  width: 32,
                  flexShrink: 0,
                  textAlign: 'center',
                  fontWeight: 600,
                  borderRight: 1,
                  borderColor: 'divider',
                }}
              >
                {p.skill}
              </Typography>
              <Typography noWrap sx={{ minWidth: 0, flex: 1 }}>
                {p.name}
              </Typography>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                startIcon={<ArrowRightLeft size={16} />}
                onClick={() => handlePlayerSwap(index, j)}
                aria-label={`Échanger ${p.name}`}
                sx={{ flexShrink: 0, minHeight: 40 }}
              >
                Échanger
              </Button>
            </Box>
          )
        })}
      </Box>
    </Card>
  )
}

export default TeamSummary
