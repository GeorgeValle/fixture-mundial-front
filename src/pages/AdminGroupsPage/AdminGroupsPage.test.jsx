import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import uiReducer from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import AdminGroupsPage from './AdminGroupsPage'

function createTeam(name, group, overrides = {}) {
  return {
    _id: `${group}-${name}`,
    name,
    group,
    shieldUrl: `https://example.com/${group}-${name}.svg`,
    position: null,
    qualifiedTo: null,
    ...overrides,
  }
}

function createMatch(overrides = {}) {
  return {
    _id: overrides._id ?? 'match-1',
    homeTeam: overrides.homeTeam ?? createTeam('Argentina', 'A'),
    awayTeam: overrides.awayTeam ?? createTeam('Canadá', 'A'),
    stadium: { name: 'MetLife Stadium' },
    date: '2026-06-11T21:00:00.000Z',
    stage: overrides.stage ?? 'GRUPO A',
    status: overrides.status ?? 'PENDING',
    homeScore: null,
    awayScore: null,
    homePenaltyScore: null,
    awayPenaltyScore: null,
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

function renderAdminGroupsPage() {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <AdminGroupsPage />
    </Provider>,
  )
}

function mockAdminGroupsData({ matches = [], standings = [] } = {}) {
  server.use(
    http.get('*/api/matches', () => HttpResponse.json(matches)),
    http.get('*/api/standings', () => HttpResponse.json({ status: 'success', data: standings })),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe('AdminGroupsPage', () => {
  it('loads groups, standings and operational match counts without calculating standings in React', async () => {
    mockAdminGroupsData({
      matches: [
        createMatch({ _id: 'a-1', status: 'PENDING' }),
        createMatch({ _id: 'a-2', status: 'IN_PROGRESS' }),
        createMatch({ _id: 'a-3', status: 'FINISHED' }),
        createMatch({
          _id: 'b-1',
          stage: 'GRUPO B',
          status: 'FINISHED',
          homeTeam: createTeam('España', 'B'),
          awayTeam: createTeam('Italia', 'B'),
        }),
      ],
      standings: [
        {
          group: 'A',
          teams: [
            createStandingRow('Argentina', 'A', { pj: 1, pg: 1, pe: 0, pp: 0, gf: 2, gc: 0, dif: 2, pts: 3 }),
          ],
        },
      ],
    })

    renderAdminGroupsPage()

    expect(await screen.findByRole('heading', { name: /grupos y standings oficiales/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/elegir grupo/i)).toHaveValue('A')

    const summary = screen.getByLabelText(/resumen operativo del grupo a/i)
    expect(within(summary).getByText('Pendientes')).toBeInTheDocument()
    expect(within(summary).getByText('En juego')).toBeInTheDocument()
    expect(within(summary).getByText('Finalizados')).toBeInTheDocument()
    expect(within(summary).getAllByText('1')).toHaveLength(3)
    expect(screen.getByText(/react no calcula puntos/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /posiciones del grupo a/i })).toBeInTheDocument()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
  })

  it('changes the selected group and shows an empty standings state for missing backend data', async () => {
    const user = userEvent.setup()
    mockAdminGroupsData({
      matches: [
        createMatch({ _id: 'a-1', status: 'FINISHED' }),
        createMatch({
          _id: 'b-1',
          stage: 'GRUPO B',
          status: 'PENDING',
          homeTeam: createTeam('España', 'B'),
          awayTeam: createTeam('Italia', 'B'),
        }),
      ],
      standings: [
        {
          group: 'A',
          teams: [createStandingRow('Argentina', 'A')],
        },
      ],
    })

    renderAdminGroupsPage()

    await screen.findByText('Argentina')
    await user.selectOptions(screen.getByLabelText(/elegir grupo/i), 'B')

    expect(screen.getByText(/estás revisando el grupo b/i)).toBeInTheDocument()
    expect(screen.getByText(/no se encontraron standings para este grupo/i)).toBeInTheDocument()
    expect(screen.getByText('España vs Italia')).toBeInTheDocument()
  })

  it('shows a ready notice when all six expected group matches are finished', async () => {
    mockAdminGroupsData({
      matches: Array.from({ length: 6 }, (_, index) =>
        createMatch({ _id: `a-${index + 1}`, status: 'FINISHED' }),
      ),
      standings: [{ group: 'A', teams: [] }],
    })

    renderAdminGroupsPage()

    expect(await screen.findByRole('heading', { name: /grupo listo para revisar/i })).toBeInTheDocument()
    expect(screen.getByText(/los 6 partidos esperados figuran como finalizados/i)).toBeInTheDocument()
  })

  it('keeps recalculation disabled while the backend endpoint is ambiguous', async () => {
    mockAdminGroupsData({ matches: [], standings: [] })

    renderAdminGroupsPage()

    const button = await screen.findByRole('button', { name: /endpoint de recálculo pendiente de confirmación/i })

    expect(button).toBeDisabled()
    expect(screen.getByText(/ambigua entre dos rutas privadas/i)).toBeInTheDocument()
  })

  it('retries after a controlled error state', async () => {
    const user = userEvent.setup()
    let standingsCalls = 0

    server.use(
      http.get('*/api/matches', () => HttpResponse.json([])),
      http.get('*/api/standings', () => {
        standingsCalls += 1

        if (standingsCalls === 1) {
          return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
        }

        return HttpResponse.json({ status: 'success', data: [{ group: 'A', teams: [] }] })
      }),
    )

    renderAdminGroupsPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/la sesión admin expiró/i)

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByText(/no se encontraron standings para este grupo/i)).toBeInTheDocument()
    expect(standingsCalls).toBe(2)
  })

  it('does not store admin tokens in browser storage', async () => {
    mockAdminGroupsData({ matches: [], standings: [] })

    renderAdminGroupsPage()

    await screen.findByText(/no se encontraron standings para este grupo/i)

    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })
})
