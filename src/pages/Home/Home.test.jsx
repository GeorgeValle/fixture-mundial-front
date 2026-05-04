import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal'
import uiReducer from '../../features/ui/uiSlice'
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

function renderHome({ includeModal = false } = {}) {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <Home />
      {includeModal && <FeedbackModal />}
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
    expect(screen.getByText('Proyecto de portfolio')).toBeInTheDocument()
    expect(await screen.findByText('Calendario sin actividad')).toBeInTheDocument()
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
})
