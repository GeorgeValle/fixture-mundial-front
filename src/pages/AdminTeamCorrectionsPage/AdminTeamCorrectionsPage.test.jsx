import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { BrowserRouter } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import uiReducer from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import AdminTeamCorrectionsPage from './AdminTeamCorrectionsPage'

function createTeam(name, group, overrides = {}) {
  return {
    _id: `${group}-${name}`,
    name,
    group,
    shieldUrl: `https://example.com/${group}-${name}.svg`,
    position: null,
    qualifiedTo: null,
    confederation: 'CONMEBOL',
    ...overrides,
  }
}

function renderAdminTeamCorrectionsPage() {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AdminTeamCorrectionsPage />
      </BrowserRouter>
    </Provider>,
  )
}

function mockTeams(teams = []) {
  server.use(http.get('*/api/teams', () => HttpResponse.json({ status: 'success', data: teams })))
}

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe('AdminTeamCorrectionsPage', () => {
  it('renders the correction page, loaded teams and no creation controls', async () => {
    mockTeams([
      createTeam('Argentina', 'A', { position: 1, qualifiedTo: 'ROUND_OF_32' }),
      createTeam('Canadá', 'A'),
    ])

    renderAdminTeamCorrectionsPage()

    expect(await screen.findByRole('heading', { name: /correcciones de equipos/i })).toBeInTheDocument()
    expect(screen.getByText(/herramienta no crea/i)).toBeInTheDocument()
    expect(screen.getByText(/guardado con put \/api\/teams\/:id/i)).toBeInTheDocument()
    expect(screen.getByText(/reprocesá el grupo desde/i)).toBeInTheDocument()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
    expect(screen.getByText('Canadá')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /guardar corrección/i })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /crear equipo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /eliminar equipo/i })).not.toBeInTheDocument()
  })

  it('renders the loading state', () => {
    server.use(
      http.get('*/api/teams', async () => {
        await delay(200)
        return HttpResponse.json([])
      }),
    )

    renderAdminTeamCorrectionsPage()

    expect(screen.getByRole('heading', { name: /estamos preparando la lista de correcciones/i })).toBeInTheDocument()
  })

  it('renders an empty state for filters without results', async () => {
    const user = userEvent.setup()
    mockTeams([createTeam('Argentina', 'A')])

    renderAdminTeamCorrectionsPage()

    expect(await screen.findByText('Argentina')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/grupo/i), 'B')

    expect(screen.getByRole('heading', { name: /no hay equipos para los filtros seleccionados/i })).toBeInTheDocument()
  })

  it('renders a controlled error state and can retry', async () => {
    const user = userEvent.setup()
    let teamCalls = 0

    server.use(
      http.get('*/api/teams', () => {
        teamCalls += 1

        if (teamCalls === 1) {
          return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
        }

        return HttpResponse.json([createTeam('Argentina', 'A')])
      }),
    )

    renderAdminTeamCorrectionsPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/equipos no disponibles/i)

    await user.click(within(alert).getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByText('Argentina')).toBeInTheDocument()
    expect(teamCalls).toBe(2)
  })

  it('filters teams by group and search text', async () => {
    const user = userEvent.setup()
    mockTeams([
      createTeam('Argentina', 'A'),
      createTeam('Canadá', 'A'),
      createTeam('España', 'B'),
    ])

    renderAdminTeamCorrectionsPage()

    expect(await screen.findByText('Argentina')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/grupo/i), 'B')
    expect(screen.queryByText('Argentina')).not.toBeInTheDocument()
    expect(screen.getByText('España')).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/buscar/i))
    await user.type(screen.getByLabelText(/buscar/i), 'espana')
    expect(screen.getByText('España')).toBeInTheDocument()
  })

  it('edits position, qualifiedTo and shieldUrl after a strong confirmation', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    let updateRequest = null
    let teams = [createTeam('Argentina', 'A', { position: 1, qualifiedTo: 'ROUND_OF_32' })]

    server.use(
      http.get('*/api/teams', () => HttpResponse.json(teams)),
      http.put('*/api/teams/:id', async ({ params, request }) => {
        updateRequest = {
          id: params.id,
          body: await request.json(),
        }
        teams = [{ ...teams[0], ...updateRequest.body }]
        return HttpResponse.json({ status: 'success', data: teams[0] })
      }),
      http.put('*/api/admin/teams/:id', () => {
        throw new Error('No debe usarse /api/admin/teams/:id')
      }),
      http.post('*/api/teams', () => {
        throw new Error('No debe usarse POST /api/teams')
      }),
    )

    renderAdminTeamCorrectionsPage()

    const card = await screen.findByRole('article')
    await user.clear(within(card).getByLabelText(/posición/i))
    await user.type(within(card).getByLabelText(/posición/i), '2')
    await user.selectOptions(within(card).getByLabelText(/clasificación/i), 'ROUND_OF_16')
    await user.clear(within(card).getByLabelText(/shieldurl/i))
    await user.type(within(card).getByLabelText(/shieldurl/i), 'https://example.com/argentina-new.svg')
    await user.click(within(card).getByRole('button', { name: /guardar corrección/i }))

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('¿Confirmás corregir Argentina del Grupo A?'))
    expect(confirmSpy.mock.calls[0][0]).toContain('Cambios: Posición: 1 → 2')
    expect(confirmSpy.mock.calls[0][0]).toContain('Clasificación: 16avos → Octavos')
    expect(confirmSpy.mock.calls[0][0]).toContain('/admin/transition')
    expect(await screen.findByText(/corrección guardada/i)).toBeInTheDocument()
    expect(screen.getByText(/reprocesá el grupo a en \/admin\/transition/i)).toBeInTheDocument()
    expect(updateRequest).toEqual({
      id: 'A-Argentina',
      body: {
        position: 2,
        qualifiedTo: 'ROUND_OF_16',
        shieldUrl: 'https://example.com/argentina-new.svg',
      },
    })
    expect(updateRequest.body).not.toHaveProperty('name')
    expect(updateRequest.body).not.toHaveProperty('group')
    expect(updateRequest.body).not.toHaveProperty('confederation')
    expect(updateRequest.body).not.toHaveProperty('_id')
  })

  it('does not mutate if the admin cancels confirmation', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    let updateCalls = 0

    mockTeams([createTeam('Argentina', 'A', { position: 1 })])
    server.use(
      http.put('*/api/teams/:id', () => {
        updateCalls += 1
        return HttpResponse.json({ status: 'success' })
      }),
    )

    renderAdminTeamCorrectionsPage()

    const card = await screen.findByRole('article')
    await user.clear(within(card).getByLabelText(/posición/i))
    await user.type(within(card).getByLabelText(/posición/i), '2')
    await user.click(within(card).getByRole('button', { name: /guardar corrección/i }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(updateCalls).toBe(0)
  })

  it('shows validation and backend errors in Spanish', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockTeams([createTeam('Argentina', 'A')])

    renderAdminTeamCorrectionsPage()

    const card = await screen.findByRole('article')
    await user.type(within(card).getByLabelText(/posición/i), '-1')
    await user.click(within(card).getByRole('button', { name: /guardar corrección/i }))
    expect(await within(card).findByRole('alert')).toHaveTextContent(/número entero positivo/i)

    await user.clear(within(card).getByLabelText(/posición/i))
    await user.selectOptions(within(card).getByLabelText(/clasificación/i), 'ELIMINATED')

    server.use(
      http.put('*/api/teams/:id', () => HttpResponse.json({ message: 'No autorizado' }, { status: 403 })),
    )

    await user.click(within(card).getByRole('button', { name: /guardar corrección/i }))

    expect(await within(card).findByRole('alert')).toHaveTextContent(/no autorizado/i)
  })

  it('does not store admin tokens in browser storage', async () => {
    mockTeams([createTeam('Argentina', 'A')])

    renderAdminTeamCorrectionsPage()

    await screen.findByText('Argentina')

    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })
})
