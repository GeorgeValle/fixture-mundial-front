import { describe, expect, it } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import adminAuthReducer, { adminAuthInitialState } from '../features/adminAuth/adminAuthSlice'
import uiReducer from '../features/ui/uiSlice'
import { server } from '../test/msw/server'
import AppRoutes from './AppRoutes'

function renderAdminRoute(initialRoute, preloadedAdminAuthState = {}) {
  const store = configureStore({
    preloadedState: {
      adminAuth: {
        ...adminAuthInitialState,
        ...preloadedAdminAuthState,
      },
    },
    reducer: {
      adminAuth: adminAuthReducer,
      ui: uiReducer,
    },
  })

  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  )

  return { store, ...view }
}

describe('Admin routes', () => {
  it('renders the admin login form', () => {
    renderAdminRoute('/admin/login', { hasTriedRestore: true })

    expect(screen.getByRole('heading', { name: /ingreso administrativo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('redirects to dashboard after a successful mocked login', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json({
          status: 'success',
          data: { email: 'admin@example.com', role: 'ADMIN' },
        }),
      ),
    )

    renderAdminRoute('/admin/login', { hasTriedRestore: true })

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'clave-segura')
    await user.click(screen.getByRole('button', { name: /ingresar/i }))

    expect(
      await screen.findByRole('heading', { name: /dashboard del admin zone/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
  })

  it('redirects a protected admin route to login when there is no valid session', async () => {
    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ message: 'No hay sesión activa' }, { status: 401 }),
      ),
    )

    renderAdminRoute('/admin/dashboard')

    expect(await screen.findByRole('heading', { name: /ingreso administrativo/i })).toBeInTheDocument()
  })

  it('redirects the admin transition route to login without a valid session', async () => {
    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ message: 'No hay sesión activa' }, { status: 401 }),
      ),
    )

    renderAdminRoute('/admin/transition')

    expect(await screen.findByRole('heading', { name: /ingreso administrativo/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /transición a 16avos/i })).not.toBeInTheDocument()
  })

  it('redirects the admin team corrections route to login without a valid session', async () => {
    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ message: 'No hay sesión activa' }, { status: 401 }),
      ),
    )

    renderAdminRoute('/admin/teams-corrections')

    expect(await screen.findByRole('heading', { name: /ingreso administrativo/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /correcciones de equipos/i })).not.toBeInTheDocument()
  })

  it('redirects the admin knockouts route to login without a valid session', async () => {
    server.use(
      http.get('*/api/auth/me', () =>
        HttpResponse.json({ message: 'No hay sesión activa' }, { status: 401 }),
      ),
    )

    renderAdminRoute('/admin/knockouts')

    expect(await screen.findByRole('heading', { name: /ingreso administrativo/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /eliminatorias admin/i })).not.toBeInTheDocument()
  })

  it('clears the admin session after logout', async () => {
    const user = userEvent.setup()
    let logoutBody = ''

    server.use(
      http.post('*/api/auth/logout', async ({ request }) => {
        logoutBody = await request.text()
        return HttpResponse.json({ status: 'success' })
      }),
    )

    const { store } = renderAdminRoute('/admin/dashboard', {
      user: { email: 'admin@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      hasTriedRestore: true,
    })

    expect(screen.getByRole('heading', { name: /dashboard del admin zone/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))

    expect(await screen.findByRole('heading', { name: /ingreso administrativo/i })).toBeInTheDocument()
    expect(logoutBody).toBe('{}')
    expect(store.getState().adminAuth).toEqual(
      expect.objectContaining({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }),
    )
  })

  it('keeps the dashboard protected after logout state is cleared', async () => {
    renderAdminRoute('/admin/dashboard', {
      user: null,
      isAuthenticated: false,
      hasTriedRestore: true,
    })

    expect(await screen.findByRole('heading', { name: /ingreso administrativo/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /dashboard del admin zone/i })).not.toBeInTheDocument()
  })



  it('renders the protected admin matches route for an authenticated admin', async () => {
    server.use(
      http.get('*/api/matches', () =>
        HttpResponse.json([
          {
            _id: 'match-1',
            homeTeam: { _id: 'team-1', name: 'Argentina', group: 'A' },
            awayTeam: { _id: 'team-2', name: 'Canadá', group: 'A' },
            stadium: { name: 'MetLife Stadium' },
            date: '2026-06-11T21:00:00.000Z',
            stage: 'GRUPO A',
            status: 'PENDING',
            homeScore: null,
            awayScore: null,
            homePenaltyScore: null,
            awayPenaltyScore: null,
          },
        ]),
      ),
    )

    renderAdminRoute('/admin/matches', {
      user: { email: 'admin@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      hasTriedRestore: true,
    })

    expect(await screen.findByRole('heading', { name: /partidos del mundial 2026/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /partidos/i })).toBeInTheDocument()
    expect(screen.getByText('Argentina vs Canadá')).toBeInTheDocument()
  })


  it('renders the protected admin groups route for an authenticated admin', async () => {
    server.use(
      http.get('*/api/matches', () =>
        HttpResponse.json([
          {
            _id: 'match-1',
            homeTeam: { _id: 'team-1', name: 'Argentina', group: 'A' },
            awayTeam: { _id: 'team-2', name: 'Canadá', group: 'A' },
            stadium: { name: 'MetLife Stadium' },
            date: '2026-06-11T21:00:00.000Z',
            stage: 'GRUPO A',
            status: 'PENDING',
            homeScore: null,
            awayScore: null,
            homePenaltyScore: null,
            awayPenaltyScore: null,
          },
        ]),
      ),
      http.get('*/api/standings', () =>
        HttpResponse.json({
          status: 'success',
          data: [
            {
              group: 'A',
              teams: [],
            },
          ],
        }),
      ),
    )

    renderAdminRoute('/admin/groups', {
      user: { email: 'admin@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      hasTriedRestore: true,
    })

    expect(await screen.findByRole('heading', { name: /grupos y standings oficiales/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /grupos/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /disponible cuando el grupo tenga sus 6 partidos finalizados/i })).toBeInTheDocument()
  })

  it('renders the protected admin transition route for an authenticated admin', async () => {
    server.use(
      http.get('*/api/matches', () => HttpResponse.json([])),
      http.get('*/api/standings', () =>
        HttpResponse.json({
          status: 'success',
          data: [
            {
              group: 'A',
              teams: [],
            },
          ],
        }),
      ),
    )

    renderAdminRoute('/admin/transition', {
      user: { email: 'admin@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      hasTriedRestore: true,
    })

    expect(await screen.findByRole('heading', { name: /transición a 16avos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /transición/i })).toHaveAttribute('href', '/admin/transition')
    expect(screen.getByRole('button', { name: /ejecutar transición a 16avos/i })).toBeDisabled()
  })

  it('renders the protected admin team corrections route for an authenticated admin', async () => {
    server.use(
      http.get('*/api/teams', () =>
        HttpResponse.json([
          {
            _id: 'team-1',
            name: 'Argentina',
            group: 'A',
            shieldUrl: 'https://example.com/argentina.svg',
            position: 1,
            qualifiedTo: 'ROUND_OF_32',
          },
        ]),
      ),
    )

    renderAdminRoute('/admin/teams-corrections', {
      user: { email: 'admin@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      hasTriedRestore: true,
    })

    expect(await screen.findByRole('heading', { name: /correcciones de equipos/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /correcciones/i })).toHaveAttribute('href', '/admin/teams-corrections')
    expect(screen.getByText('Argentina')).toBeInTheDocument()
  })

  it('renders the protected admin knockouts route for an authenticated admin', async () => {
    server.use(
      http.get('*/api/matches', () =>
        HttpResponse.json([
          {
            _id: 'match-73',
            homeTeam: { _id: 'team-1', name: 'México' },
            awayTeam: { _id: 'team-2', name: 'Francia' },
            placeholderHome: '1st Group A',
            placeholderAway: '2nd Group B',
            date: '2026-07-04T21:00:00.000Z',
            stage: 'ROUND_OF_32',
            status: 'PENDING',
            homeScore: null,
            awayScore: null,
            homePenaltyScore: null,
            awayPenaltyScore: null,
            matchNumber: 73,
            nextMatchWinner: 89,
            nextMatchLoser: null,
          },
          {
            _id: 'group-match-1',
            homeTeam: { _id: 'team-3', name: 'Argentina', group: 'A' },
            awayTeam: { _id: 'team-4', name: 'Canadá', group: 'A' },
            date: '2026-06-11T21:00:00.000Z',
            stage: 'GRUPO A',
            status: 'PENDING',
            matchNumber: 1,
          },
        ]),
      ),
    )

    renderAdminRoute('/admin/knockouts', {
      user: { email: 'admin@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      hasTriedRestore: true,
    })

    expect(await screen.findByRole('heading', { name: /eliminatorias admin/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /eliminatorias/i })).toHaveAttribute('href', '/admin/knockouts')
    expect(screen.getByText('México vs Francia')).toBeInTheDocument()
    expect(screen.queryByText('Argentina vs Canadá')).not.toBeInTheDocument()
  })

  it('does not expose admin correction or knockout controls on public knockout or standings routes', async () => {
    server.use(
      http.get('*/api/matches', () => HttpResponse.json([])),
      http.get('*/api/standings', () => HttpResponse.json({ status: 'success', data: [] })),
    )

    renderAdminRoute('/eliminatorias', { hasTriedRestore: true })

    expect(await screen.findByRole('heading', { name: /camino a la final/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /guardar corrección/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /guardar eliminatoria/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /eliminatorias admin/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/correcciones de equipos/i)).not.toBeInTheDocument()
  })

  it('shows a controlled error state when logout fails', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('*/api/auth/logout', () =>
        HttpResponse.json({ message: 'No se pudo cerrar sesión' }, { status: 500 }),
      ),
    )

    renderAdminRoute('/admin/dashboard', {
      user: { email: 'admin@example.com', role: 'ADMIN' },
      isAuthenticated: true,
      hasTriedRestore: true,
    })

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/cerrar sesión/i)
    expect(screen.getByRole('heading', { name: /dashboard del admin zone/i })).toBeInTheDocument()
  })
})
