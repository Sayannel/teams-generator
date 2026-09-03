import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { parsePlayersFromText } from '../lib/playerImport'

const ImportPanel = ({ onImport, onClose }) => {
  const [inputText, setInputText] = useState('')

  const { players: parsedPlayers, errors } = useMemo(
    () => (inputText.trim() ? parsePlayersFromText(inputText) : { players: [], errors: [] }),
    [inputText]
  )

  const handleImport = () => {
    if (parsedPlayers.length === 0) return
    onImport(parsedPlayers)
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        <i>Le niveau 1 correspond aux débutant·e·s, il n'y a pas de niveau maximum.</i>
        <br />
        Une ligne par joueur·euse&nbsp;:{' '}
        <Box component="code" sx={{ borderRadius: 0.5, bgcolor: 'action.hover', px: 0.5 }}>
          Nom
        </Box>
        ,{' '}
        <Box component="code" sx={{ borderRadius: 0.5, bgcolor: 'action.hover', px: 0.5 }}>
          genre (m/f)
        </Box>
        ,{' '}
        <Box component="code" sx={{ borderRadius: 0.5, bgcolor: 'action.hover', px: 0.5 }}>
          niveau
        </Box>
      </Typography>

      <TextField
        multiline
        rows={6}
        autoFocus
        placeholder={'Axel G, 4, m\nAxel G, 4\nAxel G, m'}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        fullWidth
        sx={{ mb: 1.5 }}
      />

      {errors.length > 0 && (
        <Box
          sx={{
            mb: 1.5,
            borderRadius: 2,
            bgcolor: 'error.main',
            color: 'error.contrastText',
            p: 1.5,
            opacity: 0.9,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            Lignes ignorées :
          </Typography>
          <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </Box>
        </Box>
      )}

      <Stack direction="row" spacing={1}>
        <Button variant="outlined" fullWidth onClick={onClose}>
          Annuler
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={handleImport}
          disabled={parsedPlayers.length === 0}
        >
          Importer {parsedPlayers.length > 0 && `(${parsedPlayers.length})`}
        </Button>
      </Stack>
    </Box>
  )
}

export default ImportPanel
