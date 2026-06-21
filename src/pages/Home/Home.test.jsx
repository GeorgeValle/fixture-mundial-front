import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { MemoryRouter } from 'react-router-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import uiReducer, { uiInitialState } from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import Home from './Home'

function createTeam(name, group = 'A') {
  return {
    _id: `${group}-${name}`,
    name,
    shieldUrl: `https://res.cloudinary.com/demo/${name}.svg`,
    group,
  }
}

function createDailyMatch({ id, home, away, date, homeScore = null, awayScore = null }) {
  return {
    _id: id,
    homeTeam: createTeam(home),
    awayTeam: createTeam(away),
    stadium: {
      _id: `stadium-${id}`,
      name: `Estadio ${id}`,
      city: 'Ciudad sede',
      country: 'País sede',
    },
    date,
    stage: 'GRUPO A',
    status: homeScore === null ? 'PENDING' : 'FINISHED',
    homeScore,
    awayScore,
    homePenaltyScore: null,
    awayPenaltyScore: null,
  }
}

const todayMatch = createDailyMatch({
  id: 'today-1',
  home: 'México',
  away: 'Brasil',
  date: '2026-06-11T19:00:00.000Z',
  homeScore: 2,
  awayScore: 1,
})

const nextMatch = createDailyMatch({
  id: 'next-1',
  home: 'Argentina',
  away: 'Canadá',
  date: '2026-06-12T21:00:00.000Z',
})

function renderHome({ includeModal = false, preloadedUiState, tutorialSeen = true } = {}) {
  if (tutorialSeen) {
    window.localStorage.setItem(STORAGE_KEYS.homeTutorialSeen, 'true')
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.homeTutorialSeen)
  }

  const store = configureStore({
    preloadedState: preloadedUiState ? { ui: preloadedUiState } : undefined,
    reducer: { ui: uiReducer },
  })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <span data-tour="navbar-menu" />
        <Home />
        {includeModal && <FeedbackModal />}
      </MemoryRouter>
    </Provider>,
  )
}

function mockDailyScheduleResponse(schedule) {
  server.use(
    http.get('*/api/matches/schedule/daily', () =>
      HttpResponse.json({
        status: 'success',
        data: schedule,
      }),
    ),
  )
}

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
})

describe('Home', () => {
  it('renders the existing hero content', async () => {
    mockDailyScheduleResponse({ today: [], next: [], nextDate: null })

    renderHome()

    expect(
      screen.getByRole('heading', {
        name: /fixture, tablas, eliminatorias y predicciones/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Experiencia de fútbol internacional')).toBeInTheDocument()
    expect(screen.queryByText('Proyecto de portfolio')).not.toBeInTheDocument()
    expect(screen.queryByText('React + Vite')).not.toBeInTheDocument()
    expect(await screen.findByText('Calendario sin actividad')).toBeInTheDocument()
  })

  it('requests the daily schedule with start and end query params instead of date', async () => {
    let requestUrl

    server.use(
      http.get('*/api/matches/schedule/daily', ({ request }) => {
        requestUrl = new URL(request.url)

        return HttpResponse.json({
          status: 'success',
          data: { today: [], next: [], nextDate: null },
        })
      }),
    )

    renderHome()

    expect(await screen.findByText('Calendario sin actividad')).toBeInTheDocument()
    expect(requestUrl.searchParams.has('start')).toBe(true)
    expect(requestUrl.searchParams.has('end')).toBe(true)
    expect(requestUrl.searchParams.has('date')).toBe(false)
    expect(new Date(requestUrl.searchParams.get('start')).toISOString()).toBe(
      requestUrl.searchParams.get('start'),
    )
    expect(new Date(requestUrl.searchParams.get('end')).toISOString()).toBe(
      requestUrl.searchParams.get('end'),
    )
  })


  it('renders accessible quick links with the expected routes and keeps the tour target', async () => {
    mockDailyScheduleResponse({ today: [], next: [], nextDate: null })

    const { container } = renderHome()

    expect(await screen.findByText('Calendario sin actividad')).toBeInTheDocument()
    expect(container.querySelector('[data-tour="home-sections"]')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Ir al fixture' })).toHaveAttribute('href', '/grupos')
    expect(screen.getByRole('link', { name: 'Ver tablas' })).toHaveAttribute('href', '/posiciones')
    expect(screen.getByRole('link', { name: 'Ver eliminatorias' })).toHaveAttribute(
      'href',
      '/eliminatorias',
    )
    expect(screen.getByRole('link', { name: 'Hacer predicciones' })).toHaveAttribute(
      'href',
      '/predicciones',
    )
  })

  it('shows a loading state while the daily schedule is loading', () => {
    server.use(
      http.get('*/api/matches/schedule/daily', async () => {
        await delay(200)
        return HttpResponse.json({ status: 'success', data: { today: [], next: [], nextDate: null } })
      }),
    )

    renderHome()

    expect(screen.getByRole('heading', { name: /cargando partidos/i })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /cargando partidos del día/i })).toBeInTheDocument()
  })

  it('renders today matches when the daily schedule has today activity', async () => {
    mockDailyScheduleResponse({ today: [todayMatch], next: [nextMatch], nextDate: '2026-06-12' })

    renderHome()

    expect(await screen.findByRole('heading', { name: /partidos de hoy/i })).toBeInTheDocument()
    expect(screen.getByText('México')).toBeInTheDocument()
    expect(screen.getByText('Brasil')).toBeInTheDocument()
    expect(screen.queryByText('Argentina')).not.toBeInTheDocument()
  })

  it('renders next matches with a friendly formatted date when today is empty', async () => {
    mockDailyScheduleResponse({
      today: [],
      next: [nextMatch],
      nextDate: '2026-06-11T00:00:00.000Z',
    })

    renderHome()

    expect(
      await screen.findByRole('heading', { name: /próxima fecha disponible/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/no hay partidos para hoy/i)).toBeInTheDocument()
    expect(screen.getByText(/jueves, 11 de junio de 2026/i)).toBeInTheDocument()
    expect(screen.queryByText(/2026-06-11T00:00:00.000Z/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
    expect(screen.getByText('Argentina')).toBeInTheDocument()
    expect(screen.getByText('Canadá')).toBeInTheDocument()
  })

  it.each([null, 'not-a-date'])('uses a safe fallback when the next date is %s', async (nextDate) => {
    mockDailyScheduleResponse({ today: [], next: [nextMatch], nextDate })

    renderHome()

    expect(
      await screen.findByRole('heading', { name: /próxima fecha disponible/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('No hay partidos para hoy. Te mostramos la próxima jornada disponible.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/not-a-date/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
  })

  it('renders an empty state when today and next are empty', async () => {
    mockDailyScheduleResponse({ today: [], next: [], nextDate: null })

    renderHome()

    expect(await screen.findByText('Calendario sin actividad')).toBeInTheDocument()
    expect(screen.getAllByText(/no encontramos partidos/i)).toHaveLength(2)
  })

  it('shows a friendly error state when the daily schedule API fails', async () => {
    server.use(
      http.get('*/api/matches/schedule/daily', () =>
        HttpResponse.json({ message: 'DB down' }, { status: 500 }),
      ),
    )

    renderHome()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los partidos del día',
    )
    expect(screen.queryByText('DB down')).not.toBeInTheDocument()
  })

  it('shows a friendly error state when the daily schedule payload is invalid', async () => {
    server.use(
      http.get('*/api/matches/schedule/daily', () =>
        HttpResponse.json({ status: 'success', data: { items: [] } }),
      ),
    )

    renderHome()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los partidos del día',
    )
  })


  it('retries loading the daily schedule from the error state', async () => {
    const user = userEvent.setup()
    let callCount = 0

    server.use(
      http.get('*/api/matches/schedule/daily', () => {
        callCount += 1

        if (callCount === 1) {
          return HttpResponse.json({ message: 'DB down' }, { status: 500 })
        }

        return HttpResponse.json({ status: 'success', data: { today: [todayMatch], next: [], nextDate: null } })
      }),
    )

    renderHome()

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los partidos del día')

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByRole('heading', { name: /partidos de hoy/i })).toBeInTheDocument()
    expect(callCount).toBe(2)
  })

  it('opens the feedback modal when daily schedule loading takes more than seven seconds', async () => {
    vi.useFakeTimers()
    server.use(
      http.get('*/api/matches/schedule/daily', async () => {
        await delay(8000)
        return HttpResponse.json({ status: 'success', data: { today: [], next: [], nextDate: null } })
      }),
    )

    renderHome({ includeModal: true })

    await act(async () => {
      vi.advanceTimersByTime(7000)
    })

    expect(screen.getByRole('dialog')).toHaveTextContent('El servidor está despertando')
  })

  it('opens the Home tutorial on first visit and persists it when finished', async () => {
    const user = userEvent.setup()
    mockDailyScheduleResponse({ today: [], next: [], nextDate: null })

    renderHome({ tutorialSeen: false })

    expect(await screen.findByRole('dialog', { name: /bienvenido al fixture/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByRole('dialog', { name: /abrí el menú desde la pelota/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByRole('dialog', { name: /bienvenido al fixture/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Finalizar' }))

    expect(screen.queryByRole('dialog', { name: /todo listo/i })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEYS.homeTutorialSeen)).toBe('true')
  })

  it('closes and persists the Home tutorial with Escape', async () => {
    const user = userEvent.setup()
    mockDailyScheduleResponse({ today: [], next: [], nextDate: null })

    renderHome({ tutorialSeen: false })

    expect(await screen.findByRole('dialog', { name: /bienvenido al fixture/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog', { name: /bienvenido al fixture/i })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEYS.homeTutorialSeen)).toBe('true')
  })

  it('closes and persists the Home tutorial when omitted', async () => {
    const user = userEvent.setup()
    mockDailyScheduleResponse({ today: [], next: [], nextDate: null })

    renderHome({ tutorialSeen: false })

    expect(await screen.findByRole('dialog', { name: /bienvenido al fixture/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Omitir' }))

    expect(screen.queryByRole('dialog', { name: /bienvenido al fixture/i })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEYS.homeTutorialSeen)).toBe('true')
  })

  it('does not auto-open the Home tutorial while the daily schedule is loading', () => {
    server.use(
      http.get('*/api/matches/schedule/daily', async () => {
        await delay(200)
        return HttpResponse.json({ status: 'success', data: { today: [], next: [], nextDate: null } })
      }),
    )

    renderHome({ tutorialSeen: false })

    expect(screen.getByRole('heading', { name: /cargando partidos/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /bienvenido al fixture/i })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEYS.homeTutorialSeen)).toBeNull()
  })

  it('does not auto-open the Home tutorial while a feedback modal is open', async () => {
    mockDailyScheduleResponse({ today: [], next: [], nextDate: null })

    renderHome({
      includeModal: true,
      preloadedUiState: {
        ...uiInitialState,
        isFeedbackModalOpen: true,
        feedbackTitle: 'Carga activa',
        feedbackMessage: 'Esperá a que termine la carga.',
        feedbackVariant: 'info',
      },
      tutorialSeen: false,
    })

    expect(await screen.findByText('Calendario sin actividad')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /carga activa/i })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: /bienvenido al fixture/i })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEYS.homeTutorialSeen)).toBeNull()
  })
})
