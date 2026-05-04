import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import AppRoutes from './AppRoutes'

describe('AppRoutes', () => {
  it('renders the custom 404 fallback for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/ruta-inexistente']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /te fuiste fuera de la cancha/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('404 · Fuera de juego')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })
})
