import { describe, expect, it } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import uiReducer, { selectHomeTutorial, uiInitialState } from '../../features/ui/uiSlice'
import Navbar from './Navbar'

function renderNavbar(initialPath = '/', preloadedUiState) {
  const store = configureStore({
    preloadedState: preloadedUiState ? { ui: preloadedUiState } : undefined,
    reducer: { ui: uiReducer },
  })

  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Navbar />
      </MemoryRouter>
    </Provider>,
  )

  return { store, ...view }
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

  it('opens the Home tutorial from the help button', async () => {
    const user = userEvent.setup()
    const { store } = renderNavbar()

    await user.click(screen.getByRole('button', { name: /ver tutorial de la app/i }))

    expect(selectHomeTutorial(store.getState())).toEqual({
      isOpen: true,
      source: 'manual',
    })
  })

  it('does not open the Home tutorial while feedback or loading UI is active', async () => {
    const user = userEvent.setup()
    const { store } = renderNavbar('/', {
      ...uiInitialState,
      isFeedbackModalOpen: true,
      feedbackTitle: 'Carga activa',
      feedbackMessage: 'Esperá a que termine la carga.',
      feedbackVariant: 'info',
    })

    const helpButton = screen.getByRole('button', { name: /ver tutorial de la app/i })
    expect(helpButton).toBeDisabled()

    await user.click(helpButton)

    expect(selectHomeTutorial(store.getState())).toEqual({
      isOpen: false,
      source: null,
    })
  })
})
