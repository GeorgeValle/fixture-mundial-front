import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import uiReducer, { uiInitialState } from '../../features/ui/uiSlice'
import HomeOnboardingTour from './HomeOnboardingTour'

function renderOpenTour() {
  const store = configureStore({
    preloadedState: {
      ui: {
        ...uiInitialState,
        isHomeTutorialOpen: true,
        homeTutorialOpenSource: 'manual',
      },
    },
    reducer: { ui: uiReducer },
  })

  return render(
    <Provider store={store}>
      <HomeOnboardingTour />
    </Provider>,
  )
}

function setViewportSize({ height = 768, width = 1024 } = {}) {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

function appendTourTarget(target, rect) {
  const element = document.createElement('div')
  element.dataset.tour = target
  element.scrollIntoView = vi.fn()
  element.getBoundingClientRect = vi.fn(() => rect)
  document.body.appendChild(element)

  return element
}

afterEach(() => {
  document.querySelectorAll('[data-tour]').forEach((element) => {
    element.remove()
  })
  vi.restoreAllMocks()
})

describe('HomeOnboardingTour', () => {
  it('renders safely and advances when tour targets are missing', async () => {
    const user = userEvent.setup()

    renderOpenTour()

    expect(screen.getByRole('dialog', { name: /bienvenido al fixture/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(screen.getByRole('dialog', { name: /abrí el menú desde la pelota/i })).toBeInTheDocument()
  })

  it('does not call scrollIntoView for visible home sections and keeps tutorial navigation working', async () => {
    const user = userEvent.setup()
    setViewportSize()
    appendTourTarget('home-hero', {
      bottom: 420,
      height: 320,
      left: 80,
      right: 944,
      top: 100,
      width: 864,
    })
    appendTourTarget('navbar-menu', {
      bottom: 80,
      height: 56,
      left: 24,
      right: 88,
      top: 24,
      width: 64,
    })
    const sectionsTarget = appendTourTarget('home-sections', {
      bottom: 360,
      height: 52,
      left: 180,
      right: 560,
      top: 308,
      width: 380,
    })

    renderOpenTour()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByRole('dialog', { name: /abrí el menú desde la pelota/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(screen.getByRole('dialog', { name: /explorá por secciones/i })).toBeInTheDocument()
    expect(sectionsTarget.scrollIntoView).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(screen.getByRole('dialog', { name: /seguí la actividad del día/i })).toBeInTheDocument()
  })

  it('uses conservative nearest scroll only when home sections are outside the viewport', async () => {
    const user = userEvent.setup()
    setViewportSize()
    appendTourTarget('home-hero', {
      bottom: 420,
      height: 320,
      left: 80,
      right: 944,
      top: 100,
      width: 864,
    })
    appendTourTarget('navbar-menu', {
      bottom: 80,
      height: 56,
      left: 24,
      right: 88,
      top: 24,
      width: 64,
    })
    const sectionsTarget = appendTourTarget('home-sections', {
      bottom: 1060,
      height: 52,
      left: 180,
      right: 560,
      top: 1008,
      width: 380,
    })

    renderOpenTour()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByRole('dialog', { name: /abrí el menú desde la pelota/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(screen.getByRole('dialog', { name: /explorá por secciones/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(sectionsTarget.scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        behavior: 'auto',
        inline: 'nearest',
      })
    })
  })

  it('restores the initial scroll position when the tutorial closes', async () => {
    const user = userEvent.setup()
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(240)

    renderOpenTour()

    expect(screen.getByRole('dialog', { name: /bienvenido al fixture/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Omitir' }))

    await waitFor(() => {
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 240, behavior: 'auto' })
    })
  })
})
