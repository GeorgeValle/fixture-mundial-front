import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import uiReducer from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import AdminTransitionPage from './AdminTransitionPage'

function createStandingRow(name, group, overrides = {}) {
  return {
    team: {
      _id: `${group}-${name}`,
      name,
      group,
      shieldUrl: `https://example.com/${group}-${name}.svg`,
      position: null,
      qualifiedTo: null,
      ...overrides,
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

function createRoundOf32Match(overrides = {}) {
  return {
    _id: 'match-73',
    matchNumber: 73,
    stage: 'ROUND_OF_32',
    status: 'PENDING',
    homeTeam: overrides.homeTeam ?? null,
    awayTeam: overrides.awayTeam ?? null,
    placeholderHome: '2nd Group A',
    placeholderAway: '2nd Group B',
    homeScore: null,
    awayScore: null,
    homePenaltyScore: null,
    awayPenaltyScore: null,
    ...overrides,
  }
}

function renderAdminTransitionPage() {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <AdminTransitionPage />
    </Provider>,
  )
}

function mockTransitionData({ standings = [], matches = [] } = {}) {
  server.use(
    http.get('*/api/standings', () => HttpResponse.json({ status: 'success', data: standings })),
    http.get('*/api/matches', () => HttpResponse.json(matches)),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminTransitionPage', () => {
  it('renders the transition console with group selector and manual action', async () => {
    mockTransitionData({
      standings: [
        {
          group: 'A',
          teams: [
            createStandingRow('Argentina', 'A', { position: 1, qualifiedTo: 'ROUND_OF_32' }),
            createStandingRow('Canadá', 'A', { position: 2 }),
          ],
        },
      ],
      matches: [createRoundOf32Match({ homeTeam: { name: 'Argentina' } })],
    })

    renderAdminTransitionPage()

    expect(await screen.findByRole('heading', { name: /transición a 16avos/i })).toBeInTheDocument()
    expect(screen.getAllByText(/la transición se ejecuta por grupo/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/el frontend solo envía el grupo seleccionado/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/grupo a procesar/i)).toHaveValue('')
    expect(within(screen.getByLabelText(/grupo a procesar/i)).getByRole('option', { name: /seleccioná un grupo/i })).toBeInTheDocument()
    for (const group of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']) {
      expect(within(screen.getByLabelText(/grupo a procesar/i)).getByRole('option', { name: `Grupo ${group}` })).toBeInTheDocument()
    }
    expect(screen.getByText(/vista previa basada en standings actuales/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refrescar datos/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ejecutar transición a 16avos/i })).toBeDisabled()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
    expect(screen.getByText(/marcado para 16avos/i)).toBeInTheDocument()
    expect(screen.getByText(/partido 73/i)).toBeInTheDocument()
  })

  it('enables the transition action after selecting a group', async () => {
    const user = userEvent.setup()
    mockTransitionData({
      standings: [{ group: 'A', teams: [createStandingRow('Argentina', 'A')] }],
      matches: [createRoundOf32Match()],
    })

    renderAdminTransitionPage()

    const executeButton = await screen.findByRole('button', { name: /ejecutar transición a 16avos/i })
    expect(executeButton).toBeDisabled()

    await user.selectOptions(screen.getByLabelText(/grupo a procesar/i), 'A')

    expect(executeButton).toBeEnabled()
  })

  it('renders the initial loading state', () => {
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

    renderAdminTransitionPage()

    expect(screen.getByRole('heading', { name: /estamos preparando datos de transición a 16avos/i })).toBeInTheDocument()
  })

  it('renders an empty state when standings and matches are empty', async () => {
    mockTransitionData({ standings: [], matches: [] })

    renderAdminTransitionPage()

    expect(await screen.findByRole('heading', { name: /no hay standings ni partidos disponibles/i })).toBeInTheDocument()
    expect(screen.getByText(/sin calcular clasificados en react/i)).toBeInTheDocument()
  })

  it('renders a controlled error state and can refresh data', async () => {
    const user = userEvent.setup()
    let standingsCalls = 0

    server.use(
      http.get('*/api/standings', () => {
        standingsCalls += 1

        if (standingsCalls === 1) {
          return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
        }

        return HttpResponse.json({ status: 'success', data: [] })
      }),
      http.get('*/api/matches', () => HttpResponse.json([])),
    )

    renderAdminTransitionPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/transición no disponible/i)

    await user.click(within(alert).getByRole('button', { name: /refrescar datos/i }))

    expect(await screen.findByRole('heading', { name: /no hay standings ni partidos disponibles/i })).toBeInTheDocument()
    expect(standingsCalls).toBe(2)
  })

  it('does not execute a transition POST if the admin cancels confirmation', async () => {
    const user = userEvent.setup()
    let transitionCalls = 0
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    mockTransitionData({
      standings: [{ group: 'A', teams: [createStandingRow('Argentina', 'A')] }],
      matches: [createRoundOf32Match()],
    })
    server.use(
      http.post('*/api/admin/classify-group', () => {
        transitionCalls += 1
        return HttpResponse.json({ status: 'success' })
      }),
    )

    renderAdminTransitionPage()

    const transitionButton = await screen.findByRole('button', { name: /ejecutar transición a 16avos/i })
    await user.selectOptions(screen.getByLabelText(/grupo a procesar/i), 'A')
    await user.click(transitionButton)

    expect(confirmSpy).toHaveBeenCalledWith('¿Querés procesar el Grupo A e inyectar sus clasificados en 16avos?')
    expect(transitionCalls).toBe(0)
  })

  it('processes the selected group, shows success and refreshes data', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    let transitionBody = null
    let standingsCalls = 0
    let matchesCalls = 0

    server.use(
      http.get('*/api/standings', () => {
        standingsCalls += 1
        return HttpResponse.json({
          status: 'success',
          data: [
            {
              group: 'A',
              teams: [createStandingRow('Argentina', 'A', { position: 1, qualifiedTo: 'ROUND_OF_32' })],
            },
          ],
        })
      }),
      http.get('*/api/matches', () => {
        matchesCalls += 1
        return HttpResponse.json([
          createRoundOf32Match({ homeTeam: matchesCalls > 1 ? { name: 'Argentina' } : null }),
        ])
      }),
      http.post('*/api/admin/classify-group', async ({ request }) => {
        transitionBody = await request.json()
        return HttpResponse.json({
          status: 'success',
          message: 'Los clasificados del Grupo A han sido inyectados en el cuadro de dieciseisavos.',
        })
      }),
    )

    renderAdminTransitionPage()

    await screen.findByRole('heading', { name: /transición a 16avos/i })
    await user.selectOptions(screen.getByLabelText(/grupo a procesar/i), 'A')
    await user.click(screen.getByRole('button', { name: /ejecutar transición a 16avos/i }))

    expect(confirmSpy).toHaveBeenCalledWith('¿Querés procesar el Grupo A e inyectar sus clasificados en 16avos?')
    expect(await screen.findByText(/los clasificados del grupo a han sido inyectados/i)).toBeInTheDocument()
    expect(transitionBody).toEqual({ group: 'A' })
    expect(transitionBody).not.toHaveProperty('teams')
    expect(transitionBody).not.toHaveProperty('standings')
    expect(transitionBody).not.toHaveProperty('positions')
    expect(transitionBody).not.toHaveProperty('slots')
    await waitFor(() => expect(standingsCalls).toBeGreaterThanOrEqual(2))
    expect(matchesCalls).toBeGreaterThanOrEqual(2)
    expect(screen.getByLabelText(/grupo a procesar/i)).toHaveValue('A')
  })

  it('shows a processing state while the backend transition is running', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockTransitionData({
      standings: [{ group: 'A', teams: [createStandingRow('Argentina', 'A')] }],
      matches: [createRoundOf32Match()],
    })
    server.use(
      http.post('*/api/admin/classify-group', async () => {
        await delay(200)
        return HttpResponse.json({ status: 'success', message: 'Grupo A procesado' })
      }),
    )

    renderAdminTransitionPage()

    await screen.findByRole('heading', { name: /transición a 16avos/i })
    await user.selectOptions(screen.getByLabelText(/grupo a procesar/i), 'A')
    await user.click(screen.getByRole('button', { name: /ejecutar transición a 16avos/i }))

    expect(screen.getByRole('button', { name: /procesando transición/i })).toBeDisabled()
    expect(await screen.findByText(/grupo a procesado/i)).toBeInTheDocument()
  })

  it('shows the backend error when transition processing fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockTransitionData({
      standings: [{ group: 'A', teams: [createStandingRow('Argentina', 'A')] }],
      matches: [createRoundOf32Match()],
    })
    server.use(
      http.post('*/api/admin/classify-group', () =>
        HttpResponse.json({
          status: 'error',
          message: 'Es necesario especificar el grupo para procesar la transición.',
        }, { status: 400 }),
      ),
    )

    renderAdminTransitionPage()

    await screen.findByRole('heading', { name: /transición a 16avos/i })
    await user.selectOptions(screen.getByLabelText(/grupo a procesar/i), 'A')
    await user.click(screen.getByRole('button', { name: /ejecutar transición a 16avos/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/es necesario especificar el grupo/i)
  })
})
