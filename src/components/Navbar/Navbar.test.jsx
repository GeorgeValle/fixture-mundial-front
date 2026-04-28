import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from './Navbar'

function renderNavbar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  it('opens and closes the football menu from the ball button', async () => {
    const user = userEvent.setup()
    renderNavbar()

    const openButton = screen.getByRole('button', { name: 'Abrir menú principal' })
    expect(openButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(openButton)

    const closeButton = screen.getByRole('button', { name: 'Cerrar menú principal' })
    expect(closeButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Fixture' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tablas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Eliminatorias' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Predicciones' })).toBeInTheDocument()

    await user.click(closeButton)

    expect(screen.getByRole('button', { name: 'Abrir menú principal' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('closes the football menu with Escape and outside click', async () => {
    const user = userEvent.setup()
    renderNavbar('/grupos')

    await user.click(screen.getByRole('button', { name: 'Abrir menú principal' }))
    expect(screen.getByRole('button', { name: 'Cerrar menú principal' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Abrir menú principal' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    await user.click(screen.getByRole('button', { name: 'Abrir menú principal' }))
    await user.click(document.body)

    expect(screen.getByRole('button', { name: 'Abrir menú principal' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
