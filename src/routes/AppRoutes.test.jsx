import { describe, expect, it } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import adminAuthReducer from '../features/adminAuth/adminAuthSlice'
import uiReducer from '../features/ui/uiSlice'
import AppRoutes from './AppRoutes'

describe('AppRoutes', () => {
  it('renders the custom 404 fallback for unknown routes', () => {
    const store = configureStore({ reducer: { adminAuth: adminAuthReducer, ui: uiReducer } })

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/ruta-inexistente']}>
          <AppRoutes />
        </MemoryRouter>
      </Provider>,
    )

    expect(
      screen.getByRole('heading', { name: /te fuiste fuera de la cancha/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('404 · Fuera de juego')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })
})
