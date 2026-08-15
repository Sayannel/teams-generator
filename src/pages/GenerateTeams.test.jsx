import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import GenerateTeams from './GenerateTeams'
import { ToastProvider } from '../components/ui/ToastProvider'

function Wrapper({ players, config }) {
  const [teams, setTeams] = useState([])
  return (
    <ToastProvider>
      <GenerateTeams
        handleStepChange={() => {}}
        players={players}
        config={config}
        teams={teams}
        setTeams={setTeams}
      />
    </ToastProvider>
  )
}

function makePlayers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    skill: (i % 5) + 1,
    gender: i % 2 === 0 ? 'male' : 'female',
  }))
}

describe('GenerateTeams', () => {
  it('renders generated teams on mount', async () => {
    render(<Wrapper players={makePlayers(12)} config={{ playersPerTeam: 4 }} />)

    expect(await screen.findByText('Équipe #1')).toBeInTheDocument()
    expect(screen.getByText('Équipe #3')).toBeInTheDocument()
    expect(screen.getAllByText(/^Player \d+$/)).toHaveLength(12)
  })

  it('swaps two players between teams once both are selected', async () => {
    const user = userEvent.setup()
    render(<Wrapper players={makePlayers(8)} config={{ playersPerTeam: 4 }} />)

    await screen.findByText('Équipe #1')

    const swapButtons = screen.getAllByRole('button', { name: /Échanger/i })
    const firstRowContentBefore = swapButtons[0].closest('div').textContent

    await user.click(swapButtons[0])
    await user.click(swapButtons[swapButtons.length - 1])

    const updatedButtons = screen.getAllByRole('button', { name: /Échanger/i })
    expect(updatedButtons[0].closest('div').textContent).not.toBe(firstRowContentBefore)
  })
})
