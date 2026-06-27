import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal'
import uiReducer from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import KnockoutStage from './KnockoutStage'

function createTeam(name) {
  return {
    _id: `team-${name}`,
    name,
    shieldUrl: `https://example.com/${name}.svg`,
    group: 'A',
    confederation: 'CONMEBOL',
    position: null,
    qualifiedTo: null,
  }
}

function createBackendMatch(overrides = {}) {
  return {
    _id: 'backend-73',
    matchNumber: 73,
    templateCode: 'KO-73',
    roundKey: 'round-of-32',
    stage: 'Dieciseisavos de final',
    date: '2026-06-28T20:00:00.000Z',
    stadium: {
      _id: 'stadium-la',
      name: 'Los Angeles Stadium',
      city: 'Los Ángeles',
      country: 'Estados Unidos',
    },
    status: 'PENDING',
    homeTeam: createTeam('México'),
    awayTeam: createTeam('Canadá'),
    homeScore: null,
    awayScore: null,
    homePenaltyScore: null,
    awayPenaltyScore: null,
    ...overrides,
  }
}

function renderKnockoutStage({ includeModal = false } = {}) {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <KnockoutStage />
      {includeModal && <FeedbackModal />}
    </Provider>,
  )
}

function mockMatchesResponse(matches) {
  server.use(
    http.get('*/api/matches', () =>
      HttpResponse.json({
        status: 'success',
        data: matches,
      }),
    ),
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('KnockoutStage', () => {
  it('renders the knockout page and the documented skeleton when backend returns empty data', async () => {
    mockMatchesResponse([])

    renderKnockoutStage()

    expect(await screen.findByRole('heading', { name: /camino a la final/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dieciseisavos de final' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Octavos de final' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cuartos de final' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Semifinales' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Partido por el tercer puesto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Final' })).toBeInTheDocument()
    expect(screen.getByText('2º Grupo A')).toBeInTheDocument()
    expect(screen.getByText('Ganador Partido 74')).toBeInTheDocument()
    expect(screen.getByText('Perdedor Partido 101')).toBeInTheDocument()
    expect(screen.getAllByText('Pendiente de clasificación').length).toBeGreaterThan(0)
  })

  it('does not render technical keys from the internal skeleton model', async () => {
    mockMatchesResponse([])

    renderKnockoutStage()

    await screen.findByRole('heading', { name: 'Dieciseisavos de final' })

    expect(document.body).not.toHaveTextContent('round-of-32')
    expect(document.body).not.toHaveTextContent('pending-qualified-teams')
    expect(document.body).not.toHaveTextContent('pending-previous-round-results')
    expect(document.body).not.toHaveTextContent('templateCode')
    expect(document.body).not.toHaveTextContent('roundKey')
  })

  it('renders real backend teams and preserves skeleton fallback for the rest', async () => {
    mockMatchesResponse([createBackendMatch()])

    renderKnockoutStage()

    expect(await screen.findByText('México')).toBeInTheDocument()
    expect(screen.getByText('Canadá')).toBeInTheDocument()
    expect(screen.getByText('Datos parciales')).toBeInTheDocument()
    expect(screen.getByText('Ganador Partido 74')).toBeInTheDocument()
    expect(screen.getAllByText('Información recibida').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sin información recibida').length).toBeGreaterThan(0)
  })

  it('renders regular scores and penalties only from backend data', async () => {
    mockMatchesResponse([
      createBackendMatch({
        matchNumber: 101,
        templateCode: 'KO-101',
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 3,
      }),
    ])

    renderKnockoutStage()

    expect(await screen.findByText('1 - 1')).toBeInTheDocument()
    expect(screen.getByText('Penales: 4 - 3')).toBeInTheDocument()
    expect(screen.getByText('Ganador registrado: México')).toBeInTheDocument()
  })

  it('does not derive a winner when backend data is incomplete', async () => {
    mockMatchesResponse([
      createBackendMatch({
        matchNumber: 101,
        templateCode: 'KO-101',
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: null,
        awayPenaltyScore: null,
      }),
    ])

    renderKnockoutStage()

    expect(await screen.findByText('1 - 1')).toBeInTheDocument()
    expect(screen.queryByText(/Ganador registrado/i)).not.toBeInTheDocument()
  })

  it('does not advance teams to later rounds without confirmed backend data for that later match', async () => {
    mockMatchesResponse([
      createBackendMatch({
        matchNumber: 74,
        templateCode: 'KO-74',
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 0,
        homeTeam: createTeam('Argentina'),
        awayTeam: createTeam('Chile'),
      }),
    ])

    renderKnockoutStage()

    expect((await screen.findAllByText('Argentina')).length).toBeGreaterThan(0)
    const roundOf16 = screen.getByRole('heading', { name: 'Octavos de final' }).closest('section')

    expect(within(roundOf16).getByText('Ganador Partido 74')).toBeInTheDocument()
    expect(within(roundOf16).queryByText('Argentina')).not.toBeInTheDocument()
  })

  it('renders an accessible round selector with Spanish options', async () => {
    mockMatchesResponse([])

    renderKnockoutStage()

    const selector = await screen.findByLabelText('Filtrar por ronda')

    for (const option of [
      'Todas las rondas',
      'Dieciseisavos de final',
      'Octavos de final',
      'Cuartos de final',
      'Semifinales',
      'Partido por el tercer puesto',
      'Final',
    ]) {
      expect(within(selector).getByRole('option', { name: option })).toBeInTheDocument()
    }
  })


  it('syncs accessible round chips with the select filter', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([])

    renderKnockoutStage()

    const roundOf16Chip = await screen.findByRole('button', { name: 'Octavos de final' })
    expect(roundOf16Chip).toHaveAttribute('aria-pressed', 'false')

    await user.click(roundOf16Chip)

    expect(roundOf16Chip).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Filtrar por ronda')).toHaveValue('round-of-16')
    expect(screen.getByRole('heading', { name: 'Octavos de final' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dieciseisavos de final' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filtrar por ronda'), 'final')

    expect(screen.getByRole('button', { name: 'Final' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Final' })).toBeInTheDocument()
  })

  it('filters by Octavos de final and then returns to all rounds', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([])

    renderKnockoutStage()

    const selector = await screen.findByLabelText('Filtrar por ronda')

    await user.selectOptions(selector, 'round-of-16')

    expect(screen.getByRole('heading', { name: 'Octavos de final' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Partido 89:/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dieciseisavos de final' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Partido 73:/i)).not.toBeInTheDocument()

    await user.selectOptions(selector, 'all')

    expect(screen.getByRole('heading', { name: 'Dieciseisavos de final' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Octavos de final' })).toBeInTheDocument()
  })

  it('filters by Final and shows only the final match', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([])

    renderKnockoutStage()

    const selector = await screen.findByLabelText('Filtrar por ronda')

    await user.selectOptions(selector, 'final')

    expect(screen.getByRole('heading', { name: 'Final' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Partido 104:/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Partido 103:/i)).not.toBeInTheDocument()
  })

  it('switches from the current matches view to the llaves view', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([])

    renderKnockoutStage()

    const bracketViewButton = await screen.findByRole('button', { name: 'Vista de llaves' })
    const matchesViewButton = screen.getByRole('button', { name: 'Vista de partidos' })

    expect(matchesViewButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Filtrar por ronda')).toBeInTheDocument()

    await user.click(bracketViewButton)

    expect(bracketViewButton).toHaveAttribute('aria-pressed', 'true')
    expect(matchesViewButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('heading', { name: 'Cuadro compacto' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Filtrar por ronda')).not.toBeInTheDocument()
  })

  it('renders compact bracket columns with short round labels', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([])

    renderKnockoutStage()

    await user.click(await screen.findByRole('button', { name: 'Vista de llaves' }))

    const bracketPanel = screen.getByRole('region', { name: 'Cuadro compacto' })

    for (const roundLabel of ['16avos', 'Octavos', 'Cuartos', 'Semifinal']) {
      expect(within(bracketPanel).getByRole('heading', { name: roundLabel })).toBeInTheDocument()
    }
  })

  it('renders the final as a central node and keeps third place separated', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([])

    renderKnockoutStage()

    await user.click(await screen.findByRole('button', { name: 'Vista de llaves' }))

    const bracketPanel = screen.getByRole('region', { name: 'Cuadro compacto' })

    expect(within(bracketPanel).getByRole('heading', { name: 'Final' })).toBeInTheDocument()
    expect(within(bracketPanel).getByLabelText('Llave: Ganador P101 contra Ganador P102')).toBeInTheDocument()
    expect(within(bracketPanel).getByRole('complementary', { name: 'Tercer puesto' })).toBeInTheDocument()
  })

  it('renders short placeholders in the compact llaves view', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([])

    renderKnockoutStage()

    await user.click(await screen.findByRole('button', { name: 'Vista de llaves' }))

    const bracketPanel = screen.getByRole('region', { name: 'Cuadro compacto' })

    expect(within(bracketPanel).getAllByText('Por definir').length).toBeGreaterThan(0)
    expect(within(bracketPanel).getByText('Ganador P74')).toBeInTheDocument()
    expect(within(bracketPanel).getByText('Perdedor P101')).toBeInTheDocument()
    expect(within(bracketPanel).queryByText('Ganador Partido 74')).not.toBeInTheDocument()
    expect(within(bracketPanel).queryByText('2º Grupo A')).not.toBeInTheDocument()
  })

  it('marks winner and loser in the llaves view for finished regular-time results', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([
      createBackendMatch({
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 0,
      }),
    ])

    renderKnockoutStage()

    await user.click(await screen.findByRole('button', { name: 'Vista de llaves' }))

    const winnerRow = await screen.findByLabelText('México: Ganador')
    const loserRow = screen.getByLabelText('Canadá: Eliminado')

    expect(winnerRow).toBeInTheDocument()
    expect(loserRow).toBeInTheDocument()
    expect(within(winnerRow).getByText('2')).toBeInTheDocument()
    expect(within(loserRow).getByText('0')).toBeInTheDocument()
    expect(winnerRow.className).not.toBe(loserRow.className)
  })

  it('marks penalty winners and losers in the llaves view', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([
      createBackendMatch({
        matchNumber: 101,
        templateCode: 'KO-101',
        roundKey: 'semi-finals',
        stage: 'Semifinales',
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 5,
      }),
    ])

    renderKnockoutStage()

    await user.click(await screen.findByRole('button', { name: 'Vista de llaves' }))

    const loserRow = await screen.findByLabelText('México: Eliminado')
    const winnerRow = screen.getByLabelText('Canadá: Ganador')

    expect(loserRow).toBeInTheDocument()
    expect(winnerRow).toBeInTheDocument()
    expect(within(loserRow).getByText('1 (4)')).toBeInTheDocument()
    expect(within(winnerRow).getByText('1 (5)')).toBeInTheDocument()
  })

  it('keeps compact llaves nodes free of secondary match details', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([])

    renderKnockoutStage()

    await user.click(await screen.findByRole('button', { name: 'Vista de llaves' }))

    expect(screen.getByRole('heading', { name: 'Cuadro compacto' })).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('Resultado pendiente')
    expect(document.body).not.toHaveTextContent(/partido 73/i)
    expect(document.body).not.toHaveTextContent('2026-06-28')
    expect(document.body).not.toHaveTextContent('Estadio Los Ángeles')
    expect(document.body).not.toHaveTextContent(/canchallena/i)
    expect(document.body).not.toHaveTextContent('round-of-32')
    expect(document.body).not.toHaveTextContent('templateCode')
    expect(document.body).not.toHaveTextContent('roundKey')
  })

  it('renders long team names in a truncation-ready compact row', async () => {
    const user = userEvent.setup()
    const longTeamName = 'República Federal Deportiva de Nombre Extra Largo'
    mockMatchesResponse([
      createBackendMatch({
        homeTeam: createTeam(longTeamName),
        awayTeam: createTeam('Canadá'),
      }),
    ])

    renderKnockoutStage()

    await user.click(await screen.findByRole('button', { name: 'Vista de llaves' }))

    const teamName = await screen.findByText(longTeamName)

    expect(teamName).toHaveAttribute('title', longTeamName)
    expect(teamName.className).toMatch(/teamName/)
  })

  it('shows a loading state while backend matches are loading', () => {
    server.use(
      http.get('*/api/matches', async () => {
        await delay(200)
        return HttpResponse.json({ status: 'success', data: [] })
      }),
    )

    renderKnockoutStage()

    expect(screen.getByRole('heading', { name: /buscando información de eliminatorias/i })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: /cargando cuadro de eliminatorias/i })).toBeInTheDocument()
  })

  it('opens the feedback modal when loading takes more than seven seconds', async () => {
    vi.useFakeTimers()
    server.use(
      http.get('*/api/matches', async () => {
        await delay(8000)
        return HttpResponse.json({ status: 'success', data: [] })
      }),
    )

    renderKnockoutStage({ includeModal: true })

    await act(async () => {
      vi.advanceTimersByTime(7000)
    })

    expect(screen.getByRole('dialog')).toHaveTextContent('El servidor está despertando')
  })

  it('shows a friendly error state and falls back to skeleton when the API fails', async () => {
    server.use(
      http.get('*/api/matches', () => HttpResponse.json({ message: 'Database down' }, { status: 500 })),
    )

    renderKnockoutStage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Mostramos el cuadro base documentado')
    expect(screen.getByText('2º Grupo A')).toBeInTheDocument()
    expect(screen.queryByText('Database down')).not.toBeInTheDocument()
  })

  it('does not expose admin transition controls in the public knockout page', async () => {
    mockMatchesResponse([])

    renderKnockoutStage()

    expect(await screen.findByRole('heading', { name: /camino a la final/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ejecutar transición a 16avos/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /guardar eliminatoria/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /eliminatorias admin/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/contrato backend pendiente/i)).not.toBeInTheDocument()
  })
})
