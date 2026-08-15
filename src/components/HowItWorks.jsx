import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

const STEPS = [
  'Choisissez la taille de vos équipes (ou piochez dans une liste déjà enregistrée).',
  'Ajoutez vos joueur·euse·s — à la main ou en un copier-coller — avec leur niveau et leur genre.',
  "Un clic, et l'algorithme compose des équipes équilibrées.",
  'Récupérez la liste finale, prête à partager.',
]

const RULES = [
  "Des équipes de taille équivalente (1 joueur d'écart maximum)",
  'Une répartition équilibrée des genres',
  'Un mélange malin des niveaux (les meilleur·e·s dispersé·e·s avec les autres)',
  'Un coup de pouce aux équipes en sous-effectif, pour rester compétitives',
]

const HowItWorks = ({ sx }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Accordion
      variant="outlined"
      expanded={isOpen}
      onChange={(_, expanded) => setIsOpen(expanded)}
      sx={{ mt: 3, overflow: 'hidden', borderRadius: '12px', ...sx }}
    >
      <AccordionSummary
        expandIcon={<ChevronDown size={20} />}
        sx={{
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.07),
        }}
      >
        <Typography fontWeight={700}>💡 Comment ça marche ?</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2.5 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          🏐 Bienvenue dans le générateur d'équipes de volley !
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          Fini les équipes bricolées à la main : donnez-nous votre liste de joueur·euse·s, on
          s'occupe du reste. En quatre étapes, vous obtenez des équipes équilibrées, prêtes à jouer.
        </Typography>

        <Stack spacing={1.25} sx={{ mb: 2.5 }}>
          {STEPS.map((step, i) => (
            <Stack key={step} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  flexShrink: 0,
                  mt: '2px',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </Box>
              <Typography color="text.secondary">{step}</Typography>
            </Stack>
          ))}
        </Stack>

        <Typography fontWeight={600} sx={{ mb: 1 }}>
          ✨ Sous le capot, l'algorithme veille à :
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.secondary' }}>
          {RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </Box>

        <Box sx={{ mt: 2.5, textAlign: 'center' }}>
          <Link
            href="https://github.com/Sayannel"
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            color="text.secondary"
            underline="hover"
          >
            &copy; Axel Gaillard
          </Link>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default HowItWorks
