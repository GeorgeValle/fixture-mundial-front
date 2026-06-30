import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

function createCompleteGroupRows(row) {
  const rowsByPosition = new Map([[row?.team?.position, row]])

  return [1, 2, 3, 4].map((position) => {
    const existingRow = rowsByPosition.get(position)

    if (existingRow) {
      return {
        ...existingRow,
        pj: 3,
      }
    }

    return createStandingRow(position, {
      _id: `team-filler-${position}`,
      name: `Equipo ${position}`,
    })
  })
}

function renderStandingsTable(row, groupStandingBadgeContext = {}, { isGroupComplete = true } = {}) {
  const teams = isGroupComplete ? createCompleteGroupRows(row) : [row]

  render(<StandingsTable teams={teams} groupStandingBadgeContext={groupStandingBadgeContext} />)
}

function getTeamRow(teamName = 'México') {
  return screen.getByText(teamName).closest('tr')
}

describe('StandingsTable', () => {
  it('shows the historical group qualification badge for first place', () => {
    renderStandingsTable(createStandingRow(1, { qualifiedTo: 'ELIMINATED' }))

    expect(within(getTeamRow()).getByText('Clasificado a 16avos')).toBeInTheDocument()
  })

  it('shows the historical group qualification badge for second place', () => {
    renderStandingsTable(createStandingRow(2, { qualifiedTo: 'ROUND_OF_16' }))

    expect(within(getTeamRow()).getByText('Clasificado a 16avos')).toBeInTheDocument()
    expect(within(getTeamRow()).queryByText('Clasificado a octavos')).not.toBeInTheDocument()
  })

  it('shows the eliminated in groups badge when a third-place team is missing from loaded knockout context', () => {
    renderStandingsTable(createStandingRow(3), {
      knockoutTeamKeys: new Set(),
      hasReliableKnockoutContext: true,
    })

    const badge = within(getTeamRow()).getByText('Eliminado en grupos')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(styles.eliminatedBadge)
  })

  it('shows a pending badge for a third-place team when knockout context is not available', () => {
    renderStandingsTable(createStandingRow(3), {
      knockoutTeamKeys: new Set(),
      hasReliableKnockoutContext: false,
    })

    const badge = within(getTeamRow()).getByText('Pendiente')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(styles.pendingBadge)
    expect(within(getTeamRow()).queryByText('Eliminado en grupos')).not.toBeInTheDocument()
  })

  it('shows the eliminated in groups badge for fourth place', () => {
    renderStandingsTable(createStandingRow(4))

    const badge = within(getTeamRow()).getByText('Eliminado en grupos')

    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass(styles.eliminatedBadge)
  })

  it('does not use team.qualifiedTo directly for unknown qualification values', () => {
    renderStandingsTable(createStandingRow(1, { qualifiedTo: 'UNKNOWN_STATUS' }))

    expect(within(getTeamRow()).getByText('Clasificado a 16avos')).toBeInTheDocument()
    expect(within(getTeamRow()).queryByText('UNKNOWN_STATUS')).not.toBeInTheDocument()
  })

  it('does not invent a qualification badge when team.position is null', () => {
    renderStandingsTable(
      createStandingRow(null, { qualifiedTo: 'ROUND_OF_32' }),
      {},
      { isGroupComplete: false },
    )

    expect(screen.queryByText(/clasificado/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Eliminado en grupos')).not.toBeInTheDocument()
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument()
  })

  it('does not show confirmed qualification badges when the group is incomplete', () => {
    renderStandingsTable(createStandingRow(1, { qualifiedTo: 'ELIMINATED' }), {}, {
      isGroupComplete: false,
    })

    expect(screen.queryByText('Clasificado a 16avos')).not.toBeInTheDocument()
    expect(screen.queryByText('Eliminado en grupos')).not.toBeInTheDocument()
  })
})
