import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import uiReducer from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import GroupFixtures from './GroupFixtures'

function createTeam(name, group) {
  return {
    _id: `${group}-${name}`,
    name,
    shieldUrl: `https://res.cloudinary.com/demo/${name}.svg`,
    group,
  }
}

function createMatch({ id, stage, home, away, date, homeScore = null, awayScore = null }) {
  return {
    _id: id,
    homeTeam: createTeam(home, stage.at(-1)),
    awayTeam: createTeam(away, stage.at(-1)),
    stadium: {
      _id: `stadium-${id}`,
      name: `Estadio ${id}`,
      city: 'Ciudad sede',
      country: 'País sede',
    },
    date,
    stage,
    status: homeScore === null ? 'PENDING' : 'FINISHED',
    homeScore,
    awayScore,
    homePenaltyScore: null,
    awayPenaltyScore: null,
  }
}

const groupAMatches = [
  createMatch({
    id: 'a-3',
    stage: 'GRUPO A',
    home: 'Argentina',
    away: 'Canadá',
    date: '2026-06-15T21:00:00.000Z',
  }),
  createMatch({
    id: 'a-1',
    stage: 'GRUPO A',
    home: 'México',
    away: 'Brasil',
    date: '2026-06-11T19:00:00.000Z',
    homeScore: 2,
    awayScore: 1,
  }),
  createMatch({
    id: 'a-2',
    stage: 'GRUPO A',
    home: 'Chile',
    away: 'Japón',
    date: '2026-06-13T18:00:00.000Z',
  }),
  createMatch({
    id: 'a-4',
    stage: 'GRUPO A',
    home: 'Uruguay',
    away: 'Corea',
    date: '2026-06-18T20:00:00.000Z',
  }),
  createMatch({
    id: 'a-5',
    stage: 'GRUPO A',
    home: 'Ecuador',
    away: 'Marruecos',
    date: '2026-06-20T22:00:00.000Z',
  }),
  createMatch({
    id: 'a-6',
    stage: 'GRUPO A',
    home: 'Perú',
    away: 'Francia',
    date: '2026-06-22T17:00:00.000Z',
  }),
]

const groupBMatches = [
  createMatch({
    id: 'b-1',
    stage: 'GRUPO B',
    home: 'España',
    away: 'Italia',
    date: '2026-06-12T18:00:00.000Z',
    homeScore: 1,
    awayScore: 1,
  }),
  createMatch({
    id: 'b-2',
    stage: 'GRUPO B',
    home: 'Alemania',
    away: 'Portugal',
    date: '2026-06-14T18:00:00.000Z',
  }),
  createMatch({
    id: 'b-3',
    stage: 'GRUPO B',
    home: 'Colombia',
    away: 'Senegal',
    date: '2026-06-16T18:00:00.000Z',
  }),
  createMatch({
    id: 'b-4',
    stage: 'GRUPO B',
    home: 'Estados Unidos',
    away: 'Ghana',
    date: '2026-06-18T18:00:00.000Z',
  }),
  createMatch({
    id: 'b-5',
    stage: 'GRUPO B',
    home: 'Inglaterra',
    away: 'Noruega',
    date: '2026-06-20T18:00:00.000Z',
  }),
  createMatch({
    id: 'b-6',
    stage: 'GRUPO B',
    home: 'Croacia',
    away: 'Suiza',
    date: '2026-06-22T18:00:00.000Z',
  }),
]

function renderGroupFixtures({ includeModal = false } = {}) {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <GroupFixtures />
      {includeModal && <FeedbackModal />}
    </Provider>,
  )
}

function mockMatchesResponse(matches = [...groupAMatches, ...groupBMatches]) {
  server.use(http.get('*/api/matches', () => HttpResponse.json(matches)))
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GroupFixtures', () => {
  it('renders the page title, selector and default group A', async () => {
    mockMatchesResponse()

    renderGroupFixtures()

    expect(screen.getByRole('heading', { name: /partidos del grupo a/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/seleccioná un grupo/i)).toHaveValue('A')
    expect(await screen.findByText('México')).toBeInTheDocument()
  })

  it('shows a loading state while matches are loading', () => {
    server.use(
      http.get('*/api/matches', async () => {
        await delay(200)
        return HttpResponse.json([...groupAMatches, ...groupBMatches])
      }),
    )

    renderGroupFixtures()

    expect(screen.getByText(/estamos buscando los partidos del grupo/i)).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /cargando partidos del grupo/i })).toBeInTheDocument()
  })

  it('renders six selected-group matches ordered by date and hides other groups', async () => {
    mockMatchesResponse()

    renderGroupFixtures()

    const fixtures = await screen.findByLabelText('Partidos del grupo A')
    const articles = within(fixtures).getAllByRole('article')

    expect(articles).toHaveLength(6)
    expect(within(articles[0]).getByText('México')).toBeInTheDocument()
    expect(within(articles[1]).getByText('Chile')).toBeInTheDocument()
    expect(screen.queryByText('España')).not.toBeInTheDocument()
  })

  it('updates the fixture cards when the selected group changes', async () => {
    const user = userEvent.setup()
    mockMatchesResponse()

    renderGroupFixtures()

    expect(await screen.findByText('México')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/seleccioná un grupo/i), 'B')

    const fixtures = screen.getByLabelText('Partidos del grupo B')
    expect(within(fixtures).getAllByRole('article')).toHaveLength(6)
    expect(screen.getByText('España')).toBeInTheDocument()
    expect(screen.queryByText('México')).not.toBeInTheDocument()
  })

  it('shows a friendly placeholder when scores are null', async () => {
    mockMatchesResponse()

    renderGroupFixtures()

    const pendingScores = await screen.findAllByText('Por jugarse')

    expect(pendingScores.length).toBeGreaterThan(0)
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  it('shows a friendly error state when the API fails', async () => {
    server.use(
      http.get('*/api/matches', () =>
        HttpResponse.json({ message: 'DB down' }, { status: 500 }),
      ),
    )

    renderGroupFixtures()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar el fixture de grupos. Si el servidor estaba dormido, esperá unos segundos y probá de nuevo.',
    )
    expect(screen.queryByText('DB down')).not.toBeInTheDocument()
  })

  it('shows a friendly error state when the API payload is not valid', async () => {
    server.use(http.get('*/api/matches', () => HttpResponse.json({ items: [] })))

    renderGroupFixtures()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar el fixture de grupos. Si el servidor estaba dormido, esperá unos segundos y probá de nuevo.',
    )
  })


  it('uses the favorite group as initial selection and exposes an accessible toggle', async () => {
    window.localStorage.setItem(STORAGE_KEYS.favoriteGroup, 'B')
    mockMatchesResponse()

    renderGroupFixtures()

    expect(screen.getByRole('heading', { name: /partidos del grupo b/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/seleccioná un grupo/i)).toHaveValue('B')
    expect(await screen.findByText('España')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /desmarcar grupo b como favorito/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('saves and clears the selected group as favorite', async () => {
    const user = userEvent.setup()
    mockMatchesResponse()

    renderGroupFixtures()

    const favoriteButton = screen.getByRole('button', { name: /marcar grupo a como favorito/i })
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(favoriteButton)

    expect(window.localStorage.getItem(STORAGE_KEYS.favoriteGroup)).toBe('A')
    expect(screen.getByRole('button', { name: /desmarcar grupo a como favorito/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: /desmarcar grupo a como favorito/i }))

    expect(window.localStorage.getItem(STORAGE_KEYS.favoriteGroup)).toBeNull()
  })

  it('retries loading matches from the error state', async () => {
    const user = userEvent.setup()
    let callCount = 0

    server.use(
      http.get('*/api/matches', () => {
        callCount += 1

        if (callCount === 1) {
          return HttpResponse.json({ message: 'DB down' }, { status: 500 })
        }

        return HttpResponse.json([...groupAMatches, ...groupBMatches])
      }),
    )

    renderGroupFixtures()

    expect(await screen.findByRole('alert')).toHaveTextContent('Fixture no disponible')

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByText('México')).toBeInTheDocument()
    expect(callCount).toBe(2)
  })

  it('opens the feedback modal when loading takes more than seven seconds', async () => {
    vi.useFakeTimers()
    server.use(
      http.get('*/api/matches', async () => {
        await delay(8000)
        return HttpResponse.json([...groupAMatches, ...groupBMatches])
      }),
    )

    renderGroupFixtures({ includeModal: true })

    await act(async () => {
      vi.advanceTimersByTime(7000)
    })

    expect(screen.getByRole('dialog')).toHaveTextContent('El servidor está despertando')
  })
})
