import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StandingsTable from './StandingsTable'
import styles from './StandingsTable.module.css'

function createStandingRow(qualifiedTo) {
  return {
    team: {
      _id: `team-${qualifiedTo ?? 'none'}`,
      name: 'México',
      position: 1,
      qualifiedTo,
      shieldUrl: null,
    },
    pj: 3,
    pg: 2,
    pe: 1,
    pp: 0,
    gf: 5,
    gc: 2,
    dif: 3,
    pts: 7,
  }
}

function renderStandingsTable(qualifiedTo) {
  render(<StandingsTable teams={[createStandingRow(qualifiedTo)]} />)
}

describe('StandingsTable', () => {
  it('shows the round of 32 qualification badge', () => {
    renderStandingsTable('ROUND_OF_32')

    expect(screen.getByText('Clasificado a 16avos')).toBeInTheDocument()
  })

  it('shows the eliminated qualification badge', () => {
    renderStandingsTable('ELIMINATED')

    const badge = screen.getByText('Eliminado')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(styles.eliminatedBadge)
  })

  it('does not fall back to Clasificado for unknown qualification values', () => {
    renderStandingsTable('UNKNOWN_STATUS')

    expect(screen.queryByText(/clasificado/i)).not.toBeInTheDocument()
  })

  it('does not invent a qualification badge when qualifiedTo is null', () => {
    renderStandingsTable(null)

    expect(screen.queryByText(/clasificado/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Eliminado')).not.toBeInTheDocument()
  })
})
