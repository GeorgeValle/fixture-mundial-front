import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import uiReducer from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import AdminMatchesPage from './AdminMatchesPage'
import styles from './AdminMatchesPage.module.css'

function createTeam(name, group = 'A') {
  return {
    _id: `${group}-${name}`,
    name,
    group,
    shieldUrl: `https://example.com/${name}.svg`,
  }
}

function createMatch(overrides = {}) {
  return {
    _id: overrides._id ?? 'match-1',
    homeTeam: overrides.homeTeam ?? createTeam('Argentina'),
    awayTeam: overrides.awayTeam ?? createTeam('Canadá'),
    stadium: overrides.stadium ?? { name: 'MetLife Stadium', city: 'Nueva York', country: 'Estados Unidos' },
    date: overrides.date ?? '2026-06-11T21:00:00.000Z',
    stage: overrides.stage ?? 'GRUPO A',
    status: overrides.status ?? 'PENDING',
    homeScore: overrides.homeScore ?? null,
    awayScore: overrides.awayScore ?? null,
    homePenaltyScore: overrides.homePenaltyScore ?? null,
    awayPenaltyScore: overrides.awayPenaltyScore ?? null,
    matchNumber: overrides.matchNumber,
  }
}

const groupMatch = createMatch()
const legacyPlayingMatch = createMatch({
  _id: 'match-2',
  homeTeam: createTeam('España', 'B'),
  awayTeam: createTeam('Italia', 'B'),
  stage: 'GRUPO B',
  status: 'IN_PROGRESS',
})
  const knockoutMatch = createMatch({
    _id: 'match-73',
    homeTeam: createTeam('México', 'C'),
    awayTeam: createTeam('Francia', 'D'),
    stage: 'ROUND_OF_32',
  matchNumber: 73,
})

function renderAdminMatchesPage() {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <AdminMatchesPage />
    </Provider>,
  )
}

function mockMatches(matches = [groupMatch, legacyPlayingMatch, knockoutMatch]) {
  server.use(http.get('*/api/matches', () => HttpResponse.json(matches)))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminMatchesPage', () => {
  it('renders loaded matches and normalizes legacy IN_PROGRESS as En juego', async () => {
    mockMatches()

    renderAdminMatchesPage()

    expect(await screen.findByRole('heading', { name: /partidos del mundial 2026/i })).toBeInTheDocument()
    expect(screen.getByText('Argentina vs Canadá')).toBeInTheDocument()
    expect(screen.getByText('España vs Italia')).toBeInTheDocument()
    expect(screen.getAllByText('En juego')).not.toHaveLength(0)
  })

  it('filters matches by group, status and search text', async () => {
    const user = userEvent.setup()
    mockMatches()

    renderAdminMatchesPage()

    expect(await screen.findByText('Argentina vs Canadá')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Grupo'), 'B')
    expect(screen.queryByText('Argentina vs Canadá')).not.toBeInTheDocument()
    expect(screen.getByText('España vs Italia')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Estado'), 'PENDING')
    expect(screen.getByText(/no hay partidos para los filtros/i)).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Estado'), 'PLAYING')
    expect(screen.getByText('España vs Italia')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Buscar'))
    await user.type(screen.getByLabelText('Buscar'), 'italia')
    expect(screen.getByText('España vs Italia')).toBeInTheDocument()
  })

  it('show stage labels in Spanish and keeps internal stage values only for filters', async () => {
    const user = userEvent.setup()
    const stageMatches = [
      createMatch({
        _id: 'match-round-32',
        homeTeam: createTeam('Brasil', 'A'),
        awayTeam: createTeam('España', 'B'),
        stage: 'ROUND_OF_32',
      }),
      createMatch({
        _id: 'match-round-16',
        homeTeam: createTeam('Alemania', 'C'),
        awayTeam: createTeam('Italia', 'D'),
        stage: 'ROUND_OF_16',
      }),
      createMatch({
        _id: 'match-quarter',
        homeTeam: createTeam('Croacia', 'E'),
        awayTeam: createTeam('Japón', 'F'),
        stage: 'QUARTER_FINALS',
      }),
      createMatch({
        _id: 'match-semi',
        homeTeam: createTeam('Holanda', 'G'),
        awayTeam: createTeam('Suecia', 'H'),
        stage: 'SEMI_FINALS',
      }),
      createMatch({
        _id: 'match-third',
        homeTeam: createTeam('Colombia', 'I'),
        awayTeam: createTeam('Uruguay', 'J'),
        stage: 'THIRD_PLACE_MATCH',
      }),
      createMatch({
        _id: 'match-final',
        homeTeam: createTeam('México', 'K'),
        awayTeam: createTeam('Francia', 'L'),
        stage: 'FINAL',
      }),
      createMatch({
        _id: 'match-group-a',
        homeTeam: createTeam('Argentina', 'A'),
        awayTeam: createTeam('Canadá', 'B'),
        stage: 'GROUP_A',
      }),
    ]

    mockMatches(stageMatches)

    renderAdminMatchesPage()

    const cards = await screen.findAllByRole('article')
    const cardsText = cards.map((card) => card.textContent ?? '')

    expect(cardsText.some((text) => text.includes('16avos'))).toBe(true)
    expect(cardsText.some((text) => text.includes('Octavos'))).toBe(true)
    expect(cardsText.some((text) => text.includes('Cuartos'))).toBe(true)
    expect(cardsText.some((text) => text.includes('Semifinales'))).toBe(true)
    expect(cardsText.some((text) => text.includes('Tercer puesto'))).toBe(true)
    expect(cardsText.some((text) => text.includes('Final'))).toBe(true)
    expect(cardsText.some((text) => text.includes('Grupo A'))).toBe(true)

    expect(screen.queryByText('ROUND_OF_32')).not.toBeInTheDocument()
    expect(screen.queryByText('ROUND_OF_16')).not.toBeInTheDocument()
    expect(screen.queryByText('QUARTER_FINALS')).not.toBeInTheDocument()
    expect(screen.queryByText('SEMI_FINALS')).not.toBeInTheDocument()
    expect(screen.queryByText('THIRD_PLACE_MATCH')).not.toBeInTheDocument()
    expect(screen.queryByText('GROUP_A')).not.toBeInTheDocument()

    const stageSelect = screen.getByLabelText('Fase')
    await user.click(stageSelect)
    expect(within(stageSelect).getByRole('option', { name: '16avos' })).toBeInTheDocument()
    expect(within(stageSelect).getByRole('option', { name: 'Octavos' })).toBeInTheDocument()
    expect(within(stageSelect).getByRole('option', { name: 'Grupo A' })).toBeInTheDocument()
    expect(within(stageSelect).queryByRole('option', { name: 'ROUND_OF_32' })).not.toBeInTheDocument()
  })

  it('renders finished matches after pending and playing matches in the visible list', async () => {
    const sortedMatches = [
      createMatch({
        _id: 'match-pending',
        homeTeam: createTeam('Países Bajos', 'A'),
        awayTeam: createTeam('Noruega', 'B'),
        stage: 'GRUPO A',
        status: 'PENDING',
      }),
      createMatch({
        _id: 'match-playing',
        homeTeam: createTeam('Dinamarca', 'C'),
        awayTeam: createTeam('Chile', 'D'),
        stage: 'GRUPO B',
        status: 'PLAYING',
      }),
      createMatch({
        _id: 'match-finished',
        homeTeam: createTeam('Argentina', 'E'),
        awayTeam: createTeam('Italia', 'F'),
        stage: 'GRUPO C',
        status: 'FINISHED',
      }),
    ]

    mockMatches(sortedMatches)

    renderAdminMatchesPage()

    const cards = await screen.findAllByRole('article')
    const texts = cards.map((card) => card.textContent ?? '')

    expect(texts[0]).toContain('Dinamarca vs Chile')
    expect(texts[1]).toContain('Países Bajos vs Noruega')
    expect(texts[2]).toContain('Argentina vs Italia')

    const savedCard = cards.find((card) => card.textContent?.includes('Argentina vs Italia'))
    expect(savedCard).toHaveClass(styles.matchCardFinished)
    expect(savedCard).toHaveClass(styles.matchCard)
  })

  it('validates invalid score inputs without losing the full list', async () => {
    const user = userEvent.setup()
    mockMatches([groupMatch])

    renderAdminMatchesPage()

    const card = await screen.findByRole('article')
    await user.type(within(card).getByLabelText(/goles de argentina/i), '-1')
    await user.click(within(card).getByRole('button', { name: /guardar resultado/i }))

    expect(await within(card).findByRole('alert')).toHaveTextContent(/números enteros/i)
    expect(screen.getByText('Argentina vs Canadá')).toBeInTheDocument()
  })

  it('shows penalty inputs for tied finished knockout matches and saves through PUT /api/matches/:id', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    let updateRequest = null
    let currentMatches = [knockoutMatch]

    server.use(
      http.get('*/api/matches', () => HttpResponse.json(currentMatches)),
      http.put('*/api/matches/:id', async ({ params, request }) => {
        updateRequest = {
          id: params.id,
          body: await request.json(),
        }
        currentMatches = [{
          ...knockoutMatch,
          status: updateRequest.body.status,
          homeScore: updateRequest.body.homeScore,
          awayScore: updateRequest.body.awayScore,
          homePenaltyScore: updateRequest.body.homePenaltyScore,
          awayPenaltyScore: updateRequest.body.awayPenaltyScore,
        }]
        return HttpResponse.json({ status: 'success', data: currentMatches[0] })
      }),
    )

    renderAdminMatchesPage()

    const card = await screen.findByRole('article')
    await user.selectOptions(within(card).getByLabelText(/estado del partido/i), 'FINISHED')
    await user.type(within(card).getByLabelText(/goles de méxico/i), '1')
    await user.type(within(card).getByLabelText(/goles de francia/i), '1')

    expect(await within(card).findByText(/definición por penales/i)).toBeInTheDocument()

    await user.type(within(card).getByLabelText(/penales de méxico/i), '4')
    await user.type(within(card).getByLabelText(/penales de francia/i), '3')
    await user.click(within(card).getByRole('button', { name: /guardar resultado/i }))

    expect(confirmSpy).toHaveBeenCalledWith('¿Confirmás guardar este partido como finalizado?')
    expect(await within(card).findByRole('status')).toHaveTextContent('Resultado guardado')
    expect(updateRequest).toEqual({
      id: 'match-73',
      body: {
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 3,
      },
    })
  })
})
