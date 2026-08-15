import { useState } from 'react'
import { ChevronDown, Mars, Users, Venus } from 'lucide-react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import DonutChart from './ui/DonutChart'
import RatingDots from './ui/RatingDots'
import { getLevelColor } from '../lib/colorRamp'

const HISTOGRAM_HEIGHT = 128

const GENDER_COLORS = { female: '#f43f5e', male: '#6366f1' }

const PlayerDistributionSummary = ({ players, balanceScore, genderParityScore }) => {
  const [isOpen, setIsOpen] = useState(true)
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const total = players.length

  if (total === 0) return null

  const femaleCount = players.filter((player) => player.gender === 'female').length
  const maleCount = total - femaleCount
  const femalePct = Math.round((femaleCount / total) * 100)
  const malePct = Math.round((maleCount / total) * 100)

  const genderSegments = [
    { label: 'Féminin', value: femalePct, color: GENDER_COLORS.female },
    { label: 'Masculin', value: malePct, color: GENDER_COLORS.male },
  ]

  const groupedBySkill = Object.entries(
    players.reduce((acc, player) => {
      acc[player.skill] = (acc[player.skill] || 0) + 1
      return acc
    }, {})
  ).sort(([a], [b]) => Number(a) - Number(b))
  const maxSkillCount = Math.max(...groupedBySkill.map(([, count]) => count))

  return (
    <Card variant="outlined">
      <Box
        component="button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        sx={{
          display: 'flex',
          width: '100%',
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 0,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
          px: 2,
          py: 1.5,
          textAlign: 'left',
          font: 'inherit',
          fontWeight: 700,
          color: 'text.primary',
          cursor: 'pointer',
        }}
      >
        Répartition des joueur·euses
        <ChevronDown
          size={20}
          style={{
            color: 'inherit',
            opacity: 0.5,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        />
      </Box>

      {isOpen && (
        <Box sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2.5 }}>
            <Users size={20} style={{ flexShrink: 0 }} />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              {total}
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              joueur·euse·s
            </Typography>
          </Stack>

          {(balanceScore || genderParityScore) && (
            <Grid
              container
              spacing={2}
              sx={{ mb: 2.5, pb: 2.5, borderBottom: 1, borderColor: 'divider' }}
            >
              {balanceScore && (
                <Grid size={6}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      display: 'block',
                      mb: 0.5,
                    }}
                    color="text.secondary"
                  >
                    Équilibre
                  </Typography>
                  <Box
                    sx={{ width: 20, height: 3, bgcolor: 'primary.main', borderRadius: 1, mb: 1 }}
                  />
                  <RatingDots
                    status={balanceScore.status}
                    filled={balanceScore.level}
                    label={balanceScore.label}
                  />
                  <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                    {balanceScore.label}
                  </Typography>
                </Grid>
              )}
              {genderParityScore && (
                <Grid size={6}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      display: 'block',
                      mb: 0.5,
                    }}
                    color="text.secondary"
                  >
                    Parité
                  </Typography>
                  <Box
                    sx={{ width: 20, height: 3, bgcolor: 'primary.main', borderRadius: 1, mb: 1 }}
                  />
                  <RatingDots
                    status={genderParityScore.status}
                    filled={genderParityScore.level}
                    label={genderParityScore.label}
                  />
                  <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                    {genderParityScore.label}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    Genre
                  </Typography>
                  <Box
                    sx={{ width: 20, height: 3, bgcolor: 'primary.main', borderRadius: 1, mt: 0.5 }}
                  />
                </Box>
                <DonutChart
                  segments={genderSegments}
                  size={174}
                  strokeWidth={4}
                  centerLabel={total}
                  centerSublabel="joueur·euse·s"
                />
                <Stack spacing={0.75} sx={{ width: '100%' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Venus size={16} style={{ flexShrink: 0, color: GENDER_COLORS.female }} />
                    <Typography variant="body2">Féminin</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                      {femalePct}%
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ width: 24, textAlign: 'right' }}
                    >
                      {femaleCount}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Mars size={16} style={{ flexShrink: 0, color: GENDER_COLORS.male }} />
                    <Typography variant="body2">Masculin</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                      {malePct}%
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ width: 24, textAlign: 'right' }}
                    >
                      {maleCount}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1.5}>
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    Niveaux
                  </Typography>
                  <Box
                    sx={{ width: 20, height: 3, bgcolor: 'primary.main', borderRadius: 1, mt: 0.5 }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 1,
                    height: HISTOGRAM_HEIGHT,
                    px: 0.5,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  {groupedBySkill.map(([skill, count], index) => (
                    <Box
                      key={skill}
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%',
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {count}
                      </Typography>
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 28,
                          height: `${(count / maxSkillCount) * 100}%`,
                          borderRadius: '4px 4px 0 0',
                          bgcolor: getLevelColor(index, groupedBySkill.length, isDark),
                        }}
                      />
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, px: 0.5 }}>
                  {groupedBySkill.map(([skill]) => (
                    <Typography
                      key={skill}
                      variant="caption"
                      color="text.disabled"
                      sx={{ flex: 1, textAlign: 'center' }}
                    >
                      {skill}
                    </Typography>
                  ))}
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      )}
    </Card>
  )
}

export default PlayerDistributionSummary
