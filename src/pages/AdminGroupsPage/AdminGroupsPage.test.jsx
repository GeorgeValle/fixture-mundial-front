import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
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
  it('loads groups and standings with operational counts without calculating standings in React', async () => {
    mockAdminGroupsData({
      matches: [
        createMatch({ _id: 'a-1', status: 'PENDING' }),
        createMatch({ _id: 'a-2', status: 'IN_PROGRESS' }),
        createMatch({ _id: 'a-3', status: 'FINISHED' }),
      ],
      standings: [
        {
          group: 'A',
          teams: [createStandingRow('Argentina', 'A', { pj: 1, pg: 1, pe: 0, pp: 0, gf: 2, gc: 0, dif: 2, pts: 3 })],
        },
      ],
    })

    renderAdminGroupsPage()

    expect(await screen.findByRole('heading', { name: /grupos y standings oficiales/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/elegir grupo/i)).toHaveValue('A')
    expect(screen.getByRole('button', { name: /disponible cuando el grupo tenga sus 6 partidos finalizados/i })).toBeDisabled()

    const summary = screen.getByLabelText(/resumen operativo del grupo a/i)
    expect(within(summary).getByText('Pendientes')).toBeInTheDocument()
    expect(within(summary).getByText('En juego')).toBeInTheDocument()
    expect(within(summary).getByText('Finalizados')).toBeInTheDocument()
    expect(screen.getByText(/React no calcula puntos, clasificados ni criterios de desempate/i)).toBeInTheDocument()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
  })

  it('shows a disabled recálculo button when group does not yet have six finished matches', async () => {
    mockAdminGroupsData({
      matches: [createMatch({ _id: 'a-1', status: 'FINISHED' }), createMatch({ _id: 'a-2', status: 'FINISHED' })],
      standings: [],
    })

    renderAdminGroupsPage()

    const recalcButton = await screen.findByRole('button', { name: /disponible cuando el grupo tenga sus 6 partidos finalizados/i })

    expect(recalcButton).toBeDisabled()
  })

  it('enables recálculo when the selected group has 6 finished matches', async () => {
    mockAdminGroupsData({
      matches: Array.from({ length: 6 }, (_, index) => createMatch({ _id: `a-${index + 1}`, status: 'FINISHED' })),
      standings: [{ group: 'A', teams: [] }],
    })

    renderAdminGroupsPage()

    const recalcButton = await screen.findByRole('button', { name: /actualizar standings del grupo/i })
    expect(recalcButton).toBeEnabled()
  })

  it('requires manual confirmation before recalculating standings', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    let recalculationCalls = 0

    mockAdminGroupsData({
      matches: Array.from({ length: 6 }, (_, index) => createMatch({ _id: `a-${index + 1}`, status: 'FINISHED' })),
      standings: [{ group: 'A', teams: [] }],
    })
    server.use(http.post('*/api/standings/A', () => {
      recalculationCalls += 1
      return HttpResponse.json({ status: 'success', message: 'OK' })
    }))

    renderAdminGroupsPage()

    const recalcButton = await screen.findByRole('button', { name: /actualizar standings del grupo/i })
    await user.click(recalcButton)

    expect(confirmSpy).toHaveBeenCalledWith('¿Querés actualizar los standings del Grupo A?')
    expect(recalculationCalls).toBe(0)
  })

  it('recalculates standings after confirmation, shows loading state and refreshes data while keeping selected group', async () => {
    const user = userEvent.setup()
    let recalculationGroup = null
    let standingsCalls = 0
    let matchesCalls = 0

    const selected = 'B'

    const aMatches = Array.from({ length: 6 }, (_, index) => createMatch({
      _id: `a-${index + 1}`,
      status: 'FINISHED',
    }))
    const bMatches = Array.from({ length: 6 }, (_, index) => createMatch({
      _id: `b-${index + 1}`,
      status: 'FINISHED',
      stage: 'GRUPO B',
      homeTeam: createTeam(`Local ${index + 1}`, 'B'),
      awayTeam: createTeam(`Visit ${index + 1}`, 'B'),
    }))

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    server.use(
      http.get('*/api/matches', () => {
        matchesCalls += 1
        return HttpResponse.json([...aMatches, ...bMatches])
      }),
      http.get('*/api/standings', () => {
        standingsCalls += 1
        return HttpResponse.json({
          status: 'success',
          data: [
            {
              group: 'A',
              teams: [createStandingRow('Argentina', 'A')],
            },
            {
              group: 'B',
              teams: [
                createStandingRow(`Local ${standingsCalls > 1 ? '2' : '1'}`, 'B', { position: standingsCalls }),
              ],
            },
          ],
        })
      }),
      http.post('*/api/standings/B', async () => {
        recalculationGroup = 'B'
        await delay(80)
        return HttpResponse.json({ status: 'success', message: 'Actualizado' })
      }),
    )

    renderAdminGroupsPage()

    const selector = await screen.findByLabelText(/elegir grupo/i)
    await user.selectOptions(selector, selected)

    const recalcButton = await screen.findByRole('button', { name: /actualizar standings del grupo/i })
    await user.click(recalcButton)

    expect(await screen.findByRole('button', { name: /recalculando standings del grupo/i })).toBeInTheDocument()

    expect(await screen.findByRole('status')).toHaveTextContent('Standings del grupo actualizados correctamente.')

    await waitFor(() => {
      expect(recalculationGroup).toBe('B')
      expect(matchesCalls).toBeGreaterThanOrEqual(2)
      expect(standingsCalls).toBeGreaterThanOrEqual(2)
    })

    expect(selector).toHaveValue(selected)
  })

  it('shows backend error feedback when recalculation fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    mockAdminGroupsData({
      matches: Array.from({ length: 6 }, (_, index) => createMatch({ _id: `a-${index + 1}`, status: 'FINISHED' })),
      standings: [{ group: 'A', teams: [] }],
    })
    server.use(http.post('*/api/standings/A', () => HttpResponse.json({ status: 'error', message: 'No permitido' }, { status: 403 })))

    renderAdminGroupsPage()

    const recalcButton = await screen.findByRole('button', { name: /actualizar standings del grupo/i })
    await user.click(recalcButton)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron actualizar los standings del grupo seleccionado.',
    )
  })

  it('shows loading state while requests to fetch groups or standings are delayed', async () => {
    mockAdminGroupsData()
    server.use(
      http.get('*/api/standings', async () => {
        await delay(200)
        return HttpResponse.json({ status: 'success', data: [] })
      }),
      http.get('*/api/matches', async () => {
        await delay(200)
        return HttpResponse.json([])
      }),
    )

    renderAdminGroupsPage()

    expect(
      screen.getByRole('heading', { name: /Estamos preparando standings y partidos administrativos/i }),
    ).toBeInTheDocument()
  })

  it('displays controlled error state and can retry after backend failure', async () => {
    const user = userEvent.setup()
    let standingsCalls = 0

    server.use(
      http.get('*/api/matches', () => HttpResponse.json([])),
      http.get('*/api/standings', () => {
        standingsCalls += 1

        if (standingsCalls === 1) {
          return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
        }

        return HttpResponse.json({ status: 'success', data: [] })
      }),
    )

    renderAdminGroupsPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/grupos no disponibles/i)

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
