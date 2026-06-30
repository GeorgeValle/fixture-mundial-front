import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StandingsTable from './StandingsTable'
import styles from './StandingsTable.module.css'

function createStandingRow(position, teamOverrides = {}) {
  return {
    team: {
      _id: `team-${position ?? 'none'}`,
      name: 'México',
      position,
      qualifiedTo: null,
      shieldUrl: null,
      group: 'A',
      ...teamOverrides,
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

function renderStandingsTable(row, groupStandingBadgeContext = {}) {
  render(<StandingsTable teams={[row]} groupStandingBadgeContext={groupStandingBadgeContext} />)
}

describe('StandingsTable', () => {
  it('shows the historical group qualification badge for first place', () => {
    renderStandingsTable(createStandingRow(1, { qualifiedTo: 'ELIMINATED' }))

    expect(screen.getByText('Clasificado a 16avos')).toBeInTheDocument()
  })

  it('shows the historical group qualification badge for second place', () => {
    renderStandingsTable(createStandingRow(2, { qualifiedTo: 'ROUND_OF_16' }))

    expect(screen.getByText('Clasificado a 16avos')).toBeInTheDocument()
    expect(screen.queryByText('Clasificado a octavos')).not.toBeInTheDocument()
  })

  it('shows the eliminated in groups badge when a third-place team is missing from loaded knockout context', () => {
    renderStandingsTable(createStandingRow(3), {
      knockoutTeamKeys: new Set(),
      hasKnockoutContext: true,
    })

    const badge = screen.getByText('Eliminado en grupos')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(styles.eliminatedBadge)
  })

  it('shows a pending badge for a third-place team when knockout context is not available', () => {
    renderStandingsTable(createStandingRow(3), {
      knockoutTeamKeys: new Set(),
      hasKnockoutContext: false,
    })

    const badge = screen.getByText('Pendiente')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(styles.pendingBadge)
    expect(screen.queryByText('Eliminado en grupos')).not.toBeInTheDocument()
  })

  it('shows the eliminated in groups badge for fourth place', () => {
    renderStandingsTable(createStandingRow(4))

    const badge = screen.getByText('Eliminado en grupos')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(styles.eliminatedBadge)
  })

  it('does not use team.qualifiedTo directly for unknown qualification values', () => {
    renderStandingsTable(createStandingRow(1, { qualifiedTo: 'UNKNOWN_STATUS' }))

    expect(screen.getByText('Clasificado a 16avos')).toBeInTheDocument()
    expect(screen.queryByText('UNKNOWN_STATUS')).not.toBeInTheDocument()
  })

  it('does not invent a qualification badge when team.position is null', () => {
    renderStandingsTable(createStandingRow(null, { qualifiedTo: 'ROUND_OF_32' }))

    expect(screen.queryByText(/clasificado/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Eliminado en grupos')).not.toBeInTheDocument()
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument()
  })
})
