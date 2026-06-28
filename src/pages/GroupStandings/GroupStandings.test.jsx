import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import uiReducer from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import GroupStandings from './GroupStandings'

const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

function createTeam(name, group, overrides = {}) {
  return {
    _id: `${group}-${name}`,
    name,
    shieldUrl: `https://example.com/${group}-${name}.svg`,
    group,
    confederation: 'CONMEBOL',
    position: null,
    qualifiedTo: null,
    ...overrides,
  }
}

function createStandingRow(name, group, stats = {}, teamOverrides = {}) {
  return {
    team: createTeam(name, group, teamOverrides),
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    gf: 0,
    gc: 0,
    dif: 0,
    pts: 0,
    ...stats,
  }
}

function createStandingsGroups() {
  return groupLetters.map((group) => ({
    group,
    teams: [
      createStandingRow(`Equipo ${group}1`, group, {
        pj: 1,
        pg: 1,
        pe: 0,
        pp: 0,
        gf: 3,
        gc: 1,
        dif: 2,
        pts: 3,
      }),
      createStandingRow(`Equipo ${group}2`, group, {
        pj: 1,
        pg: 0,
        pe: 1,
        pp: 0,
        gf: 1,
        gc: 1,
        dif: 0,
        pts: 1,
      }),
    ],
  }))
}

function createThirdPlaceStandingsGroups({ isClosed = false } = {}) {
  const matchesPlayed = isClosed ? 3 : 2

  return groupLetters.map((group, index) => ({
    group,
    teams: [
      createStandingRow(
        `Equipo ${group}1`,
        group,
        { pj: matchesPlayed, pg: 2, pe: 1, pp: 0, gf: 7, gc: 2, dif: 5, pts: 7 },
        { position: 1 },
      ),
      createStandingRow(
        `Equipo ${group}2`,
        group,
        { pj: matchesPlayed, pg: 1, pe: 2, pp: 0, gf: 5, gc: 3, dif: 2, pts: 5 },
        { position: 2 },
      ),
      createStandingRow(
        `Tercero ${group}`,
        group,
        { pj: matchesPlayed, pg: 1, pe: 0, pp: 2, gf: 4, gc: 4, dif: 0, pts: 12 - index },
        { position: 3 },
      ),
      createStandingRow(
        `Equipo ${group}4`,
        group,
        { pj: matchesPlayed, pg: 0, pe: 1, pp: 2, gf: 2, gc: 6, dif: -4, pts: 1 },
        { position: 4 },
      ),
    ],
  }))
}

function createCutoffTieStandingsGroups({ isClosed = true } = {}) {
  const pointsByGroup = [12, 11, 10, 9, 8, 7, 6, 4, 4, 3, 2, 1]

  return createThirdPlaceStandingsGroups({ isClosed }).map((standing, index) => ({
    ...standing,
    teams: standing.teams.map((row, rowIndex) =>
      rowIndex === 2
        ? {
            ...row,
            pts: pointsByGroup[index],
            dif: 0,
            gf: 4,
          }
        : row,
    ),
  }))
}

function renderGroupStandings({ includeModal = false } = {}) {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/posiciones']}>
        <GroupStandings />
        {includeModal && <FeedbackModal />}
      </MemoryRouter>
    </Provider>,
  )
}

function mockStandingsResponse(data) {
  server.use(
    http.get('*/api/standings', () => HttpResponse.json({ status: 'success', data })),
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GroupStandings', () => {
  it('renders the real standings page', async () => {
    mockStandingsResponse([])

    renderGroupStandings()

    expect(
      screen.getByRole('heading', { name: /tablas de posiciones/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText(/todavía no hay tablas disponibles/i)).toBeInTheDocument()
  })

  it('shows a loading state while standings are loading', () => {
    server.use(
      http.get('*/api/standings', async () => {
        await delay(200)
        return HttpResponse.json({ status: 'success', data: [] })
      }),
    )

    renderGroupStandings()

    expect(
      screen.getByRole('heading', { name: /estamos preparando las tablas de grupos/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /cargando posiciones de grupos/i })).toBeInTheDocument()
  })

  it('opens the feedback modal when standings loading takes more than seven seconds', async () => {
    vi.useFakeTimers()
    server.use(
      http.get('*/api/standings', async () => {
        await delay(8000)
        return HttpResponse.json({ status: 'success', data: [] })
      }),
    )

    renderGroupStandings({ includeModal: true })

    await act(async () => {
      vi.advanceTimersByTime(7000)
    })

    expect(screen.getByRole('dialog')).toHaveTextContent('El servidor está despertando')
  })

  it('renders all groups returned by the backend', async () => {
    mockStandingsResponse(createStandingsGroups())

    renderGroupStandings()

    expect(await screen.findByRole('heading', { name: /posiciones del grupo a/i })).toBeInTheDocument()

    for (const group of groupLetters) {
      expect(screen.getByRole('heading', { name: `Posiciones del grupo ${group}` })).toBeInTheDocument()
    }
  })

  it('starts in Vista general mode with several groups visible', async () => {
    mockStandingsResponse(createStandingsGroups())

    renderGroupStandings()

    const overviewButton = await screen.findByRole('button', { name: /vista general/i })
    const focusButton = screen.getByRole('button', { name: /vista foco/i })
    const thirdPlacesButton = screen.getByRole('button', { name: /mejores terceros/i })

    expect(overviewButton).toHaveAttribute('aria-pressed', 'true')
    expect(focusButton).toHaveAttribute('aria-pressed', 'false')
    expect(thirdPlacesButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('heading', { name: 'Posiciones del grupo A' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Posiciones del grupo B' })).toBeInTheDocument()
    expect(screen.queryByLabelText(/elegir grupo/i)).not.toBeInTheDocument()
    expect(screen.getByText(/vista general muestra todos los grupos/i)).toBeInTheDocument()
    expect(screen.getByText(/vista foco permite revisar un grupo en detalle/i)).toBeInTheDocument()
    expect(screen.getByText(/mejores terceros compara/i)).toBeInTheDocument()
  })

  it('switches to Vista foco and changes the selected group', async () => {
    const user = userEvent.setup()

    mockStandingsResponse(createStandingsGroups())

    renderGroupStandings()

    const focusButton = await screen.findByRole('button', { name: /vista foco/i })

    await user.click(focusButton)

    expect(focusButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /vista general/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    const groupSelector = screen.getByLabelText(/elegir grupo/i)

    expect(groupSelector).toHaveValue('A')
    expect(screen.getByRole('heading', { name: 'Posiciones del grupo A' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Posiciones del grupo B' }),
    ).not.toBeInTheDocument()

    await user.selectOptions(groupSelector, 'B')

    expect(screen.getByText('Grupo B seleccionado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Posiciones del grupo B' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Posiciones del grupo A' }),
    ).not.toBeInTheDocument()
  })

  it('switches to Mejores terceros and renders a single third-place ranking', async () => {
    const user = userEvent.setup()

    mockStandingsResponse(createThirdPlaceStandingsGroups())

    renderGroupStandings()

    const thirdPlacesButton = await screen.findByRole('button', { name: /mejores terceros/i })

    await user.click(thirdPlacesButton)

    expect(thirdPlacesButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /vista general/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: /vista foco/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('heading', { name: /ranking de mejores terceros/i })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /ranking de mejores terceros/i })).toBeInTheDocument()
    expect(screen.getByText(/el ranking es provisional hasta que finalicen todos los grupos/i)).toBeInTheDocument()
    expect(screen.getByText('Tercero A')).toBeInTheDocument()
    expect(screen.getByText('Grupo A')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Posiciones del grupo A' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/elegir grupo/i)).not.toBeInTheDocument()
  })

  it('marks top 8 third-place teams as provisional while group stage is still open', async () => {
    const user = userEvent.setup()

    mockStandingsResponse(createThirdPlaceStandingsGroups())

    renderGroupStandings()

    await user.click(await screen.findByRole('button', { name: /mejores terceros/i }))

    expect(screen.queryByText('Clasifica a 16avos')).not.toBeInTheDocument()
    expect(screen.queryByText('No clasifica')).not.toBeInTheDocument()
    expect(screen.getAllByText('Zona provisional')).toHaveLength(8)
    expect(screen.getAllByText('Fuera de zona')).toHaveLength(4)
  })

  it('marks top 8 as qualified and ranks 9 to 12 as not qualified after every group is closed', async () => {
    const user = userEvent.setup()

    mockStandingsResponse(createThirdPlaceStandingsGroups({ isClosed: true }))

    renderGroupStandings()

    await user.click(await screen.findByRole('button', { name: /mejores terceros/i }))

    expect(screen.getByText(/ranking final según puntos, diferencia de gol/i)).toBeInTheDocument()
    expect(screen.queryByText('Zona provisional')).not.toBeInTheDocument()
    expect(screen.queryByText('Fuera de zona')).not.toBeInTheDocument()
    expect(screen.getAllByText('Clasifica a 16avos')).toHaveLength(8)
    expect(screen.getAllByText('No clasifica')).toHaveLength(4)
  })

  it('does not let team.qualifiedTo change badges when group closure and rank stay the same', async () => {
    const user = userEvent.setup()
    const standings = createThirdPlaceStandingsGroups({ isClosed: true })
    standings[0].teams[2].team.qualifiedTo = 'ELIMINATED'
    standings[1].teams[2].team.qualifiedTo = 'ROUND_OF_16'
    standings[8].teams[2].team.qualifiedTo = 'ROUND_OF_32'

    mockStandingsResponse(standings)

    renderGroupStandings()

    await user.click(await screen.findByRole('button', { name: /mejores terceros/i }))

    const table = screen.getByRole('table', { name: /ranking de mejores terceros/i })
    const rows = within(table).getAllByRole('row')
    const getTeamRow = (teamName) => rows.find((row) => within(row).queryByText(teamName))

    expect(within(getTeamRow('Tercero A')).getByText('Clasifica a 16avos')).toBeInTheDocument()
    expect(within(getTeamRow('Tercero B')).getByText('Clasifica a 16avos')).toBeInTheDocument()
    expect(within(getTeamRow('Tercero I')).getByText('No clasifica')).toBeInTheDocument()
  })

  it('does not call matches API from Mejores terceros', async () => {
    const user = userEvent.setup()
    let matchesCallCount = 0

    mockStandingsResponse(createCutoffTieStandingsGroups({ isClosed: true }))
    server.use(
      http.get('*/api/matches', () => {
        matchesCallCount += 1

        return HttpResponse.json({ status: 'success', data: [] })
      }),
    )

    renderGroupStandings()

    await user.click(await screen.findByRole('button', { name: /mejores terceros/i }))

    expect(matchesCallCount).toBe(0)
    expect(screen.getByText(/ranking final según puntos, diferencia de gol/i)).toBeInTheDocument()
    expect(screen.queryByText('Desempate pendiente')).not.toBeInTheDocument()
  })

  it('shows a friendly empty state when there are not enough teams to rank third places', async () => {
    const user = userEvent.setup()

    mockStandingsResponse(createStandingsGroups())

    renderGroupStandings()

    await user.click(await screen.findByRole('button', { name: /mejores terceros/i }))

    expect(screen.getByText(/todavía no hay terceros suficientes/i)).toBeInTheDocument()
    expect(screen.getByText(/se va a completar automáticamente/i)).toBeInTheDocument()
  })


  it('uses the favorite group as the initial focused standings group when available', async () => {
    window.localStorage.setItem(STORAGE_KEYS.favoriteGroup, 'C')
    mockStandingsResponse(createStandingsGroups())

    renderGroupStandings()

    const focusButton = await screen.findByRole('button', { name: /vista foco/i })
    expect(focusButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText(/elegir grupo/i)).toHaveValue('C')
    expect(screen.getByRole('heading', { name: 'Posiciones del grupo C' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Posiciones del grupo A' })).not.toBeInTheDocument()
  })

  it('retries loading standings from the error state', async () => {
    const user = userEvent.setup()
    let callCount = 0

    server.use(
      http.get('*/api/standings', () => {
        callCount += 1

        if (callCount === 1) {
          return HttpResponse.json({ message: 'Database unavailable' }, { status: 500 })
        }

        return HttpResponse.json({ status: 'success', data: createStandingsGroups() })
      }),
    )

    renderGroupStandings()

    expect(await screen.findByRole('alert')).toHaveTextContent('Posiciones no disponibles')

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByRole('heading', { name: 'Posiciones del grupo A' })).toBeInTheDocument()
    expect(callCount).toBe(2)
  })

  it('renders a group table with team shields, columns and stats', async () => {
    mockStandingsResponse([
      {
        group: 'A',
        teams: [
          createStandingRow('México', 'A', {
            pj: 2,
            pg: 1,
            pe: 1,
            pp: 0,
            gf: 4,
            gc: 2,
            dif: 2,
            pts: 4,
          }),
        ],
      },
    ])

    renderGroupStandings()

    const table = await screen.findByRole('table')
    const tableScope = within(table)

    for (const column of ['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DIF', 'PTS']) {
      expect(tableScope.getByRole('columnheader', { name: column })).toBeInTheDocument()
    }

    expect(tableScope.getByText('México')).toBeInTheDocument()
    expect(tableScope.getByRole('img', { name: /escudo de méxico/i })).toBeInTheDocument()
    for (const value of ['2', '1', '0', '4']) {
      expect(tableScope.getAllByText(value).length).toBeGreaterThan(0)
    }
  })

  it('uses visual row position when team.position is null and does not invent qualification badges', async () => {
    mockStandingsResponse([
      {
        group: 'A',
        teams: [
          createStandingRow('México', 'A'),
          createStandingRow('Canadá', 'A'),
        ],
      },
    ])

    renderGroupStandings()

    const table = await screen.findByRole('table')
    const rows = within(table).getAllByRole('row')

    expect(within(rows[1]).getByText('1')).toBeInTheDocument()
    expect(within(rows[2]).getByText('2')).toBeInTheDocument()
    expect(screen.queryByText(/clasificado/i)).not.toBeInTheDocument()
  })

  it('renders a fallback when a shield URL is missing', async () => {
    mockStandingsResponse([
      {
        group: 'A',
        teams: [createStandingRow('México', 'A', {}, { shieldUrl: null })],
      },
    ])

    renderGroupStandings()

    expect(await screen.findByText('México')).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /escudo de méxico/i })).not.toBeInTheDocument()
  })

  it('shows a friendly empty state when standings are empty', async () => {
    mockStandingsResponse([])

    renderGroupStandings()

    expect(await screen.findByText(/todavía no hay tablas disponibles/i)).toBeInTheDocument()
  })

  it('shows a friendly error state when the standings API fails', async () => {
    server.use(
      http.get('*/api/standings', () =>
        HttpResponse.json({ message: 'Database unavailable' }, { status: 500 }),
      ),
    )

    renderGroupStandings()

    expect(await screen.findByRole('alert')).toHaveTextContent('Posiciones no disponibles')
    expect(screen.queryByText('Database unavailable')).not.toBeInTheDocument()
  })

  it('shows a friendly error state when standings payload is invalid', async () => {
    server.use(
      http.get('*/api/standings', () => HttpResponse.json({ status: 'success', items: [] })),
    )

    renderGroupStandings()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos interpretar las posiciones recibidas',
    )
  })

  it('does not call the maintenance POST endpoint from the public flow', async () => {
    const user = userEvent.setup()
    let postCallCount = 0

    server.use(
      http.get('*/api/standings', () =>
        HttpResponse.json({ status: 'success', data: createStandingsGroups() }),
      ),
      http.post('*/api/standings/:group', () => {
        postCallCount += 1
        return HttpResponse.json({ status: 'success', data: [] })
      }),
    )

    renderGroupStandings()

    const focusButton = await screen.findByRole('button', { name: /vista foco/i })

    await user.click(focusButton)
    await user.selectOptions(screen.getByLabelText(/elegir grupo/i), 'B')

    expect(postCallCount).toBe(0)
  })
})
