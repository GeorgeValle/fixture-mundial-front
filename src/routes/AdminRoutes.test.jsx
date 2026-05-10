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
