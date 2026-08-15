import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { api, ApiError } from '../lib/api'
import { useToast } from './ui/ToastProvider'

const ERROR_MESSAGES = {
  invalid_email: 'Adresse e-mail invalide.',
  too_many_requests: 'Trop de tentatives, réessaie dans une minute.',
  invalid_code: 'Code invalide ou expiré.',
}

const errorMessage = (error) =>
  (error instanceof ApiError && ERROR_MESSAGES[error.data?.error]) || 'Une erreur est survenue.'

/** Embeddable in a Drawer: login/logout for the optional list-persistence feature. */
const AuthPanel = ({ user, onLogin, onLogout }) => {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.requestOtp(email.trim())
      setCode('')
      setStep('otp')
    } catch (error) {
      showToast(errorMessage(error), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { user: loggedInUser } = await api.verifyOtp(email.trim(), code.trim())
      onLogin(loggedInUser)
      showToast('Connexion réussie.', 'success')
    } catch (error) {
      showToast(errorMessage(error), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setIsSubmitting(true)
    try {
      await api.logout()
    } catch {
      // rien à faire : on déconnecte localement dans tous les cas
    } finally {
      setIsSubmitting(false)
      onLogout()
      showToast('Déconnexion réussie.', 'success')
    }
  }

  if (user) {
    return (
      <Stack spacing={2} sx={{ textAlign: 'center' }}>
        <Typography color="text.secondary">
          Connecté·e en tant que <strong>{user.email}</strong>
        </Typography>
        <Button variant="contained" fullWidth onClick={handleLogout} disabled={isSubmitting}>
          Se déconnecter
        </Button>
      </Stack>
    )
  }

  return (
    <Box>
      {step === 'email' ? (
        <Box component="form" onSubmit={handleRequestOtp}>
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Connecte-toi pour sauvegarder et retrouver tes listes de joueur·euse·s — pas
              nécessaire pour générer des équipes.
            </Typography>
            <TextField
              type="email"
              required
              autoFocus
              placeholder="ton@email.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              slotProps={{ input: { sx: { fontSize: '1.125rem' } } }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting || !email.trim()}
            >
              Recevoir mon code
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleVerifyOtp}>
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Un code a été envoyé à <strong>{email}</strong>.
            </Typography>
            <TextField
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              autoFocus
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              fullWidth
              slotProps={{
                input: { sx: { fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.2em' } },
                htmlInput: { style: { textAlign: 'center' } },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting || code.length !== 6}
            >
              Se connecter
            </Button>
            <Link
              component="button"
              type="button"
              onClick={() => setStep('email')}
              variant="body2"
              sx={{ textAlign: 'center' }}
            >
              Modifier l'adresse e-mail
            </Link>
          </Stack>
        </Box>
      )}
    </Box>
  )
}

export default AuthPanel
