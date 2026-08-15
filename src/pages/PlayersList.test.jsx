import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import PlayersList from './PlayersList'
import { ToastProvider } from '../components/ui/ToastProvider'

function Wrapper({ initialPlayers = [] }) {
  const [players, setPlayers] = useState(initialPlayers)
  return (
    <ToastProvider>
      <PlayersList handleStepChange={() => {}} players={players} setPlayers={setPlayers} />
    </ToastProvider>
  )
}

describe('PlayersList', () => {
  it('adds a player via the add drawer', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)

    await user.click(screen.getByRole('button', { name: /ajouter un·e joueur·euse/i }))
    await user.type(screen.getByPlaceholderText('Nom du joueur·euse'), 'Alice')
    await user.click(screen.getByRole('button', { name: /^ajouter$/i }))

    expect(await screen.findByText('Alice')).toBeInTheDocument()
  })

  it('removes a player via the edit drawer', async () => {
    const user = userEvent.setup()
    render(<Wrapper initialPlayers={[{ id: '1', name: 'Bob', skill: 3, gender: 'male' }]} />)

    expect(screen.getByText('Bob')).toBeInTheDocument()
    await user.click(screen.getByText('Bob'))
    await user.click(screen.getByRole('button', { name: /supprimer/i }))

    expect(screen.queryByText('Bob')).not.toBeInTheDocument()
  })

  it('blocks adding a duplicate name', async () => {
    const user = userEvent.setup()
    render(<Wrapper initialPlayers={[{ id: '1', name: 'Alice', skill: 3, gender: 'male' }]} />)

    await user.click(screen.getByRole('button', { name: /ajouter un·e joueur·euse/i }))
    await user.type(screen.getByPlaceholderText('Nom du joueur·euse'), 'Alice')
    await user.click(screen.getByRole('button', { name: /^ajouter$/i }))

    expect(await screen.findByText(/existe déjà/i)).toBeInTheDocument()
    expect(screen.getAllByText('Alice')).toHaveLength(1)
  })
})
