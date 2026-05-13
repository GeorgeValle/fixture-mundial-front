import { afterEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import uiReducer from '../../features/ui/uiSlice'
import { server } from '../../test/msw/server'
import AdminKnockoutsPage from './AdminKnockoutsPage'

function createTeam(name) {
  return {
    _id: `team-${name}`,
    name,
    shieldUrl: `https://example.com/${name}.svg`,
  }
}

function createMatch(overrides = {}) {
  return {
    _id: overrides._id ?? 'match-73',
    homeTeam: Object.hasOwn(overrides, 'homeTeam') ? overrides.homeTeam : createTeam('México'),
    awayTeam: Object.hasOwn(overrides, 'awayTeam') ? overrides.awayTeam : createTeam('Francia'),
    placeholderHome: overrides.placeholderHome,
    placeholderAway: overrides.placeholderAway,
    stadium: overrides.stadium ?? { name: 'MetLife Stadium' },
    date: overrides.date ?? '2026-07-04T21:00:00.000Z',
    stage: overrides.stage ?? 'ROUND_OF_32',
    status: overrides.status ?? 'PENDING',
    homeScore: overrides.homeScore ?? null,
    awayScore: overrides.awayScore ?? null,
    homePenaltyScore: overrides.homePenaltyScore ?? null,
    awayPenaltyScore: overrides.awayPenaltyScore ?? null,
    matchNumber: overrides.matchNumber ?? 73,
    nextMatchWinner: overrides.nextMatchWinner ?? 89,
    nextMatchLoser: overrides.nextMatchLoser ?? null,
  }
}

const groupMatch = createMatch({
  _id: 'group-match-1',
  homeTeam: createTeam('Argentina'),
  awayTeam: createTeam('Canadá'),
  stage: 'GRUPO A',
  matchNumber: 1,
})

const placeholderKnockout = createMatch({
  _id: 'match-74',
  homeTeam: null,
  awayTeam: null,
  placeholderHome: 'Winner Match 73',
  placeholderAway: '2nd Group A',
  stage: 'ROUND_OF_16',
  matchNumber: 74,
  nextMatchWinner: 90,
})

function renderAdminKnockoutsPage() {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <AdminKnockoutsPage />
    </Provider>,
  )
}

function mockMatches(matches) {
  server.use(http.get('*/api/matches', () => HttpResponse.json(matches)))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminKnockoutsPage', () => {
  it('loads only knockout matches and shows operational bracket metadata', async () => {
    mockMatches([groupMatch, createMatch(), placeholderKnockout])

    renderAdminKnockoutsPage()

    expect(await screen.findByRole('heading', { name: /eliminatorias admin/i })).toBeInTheDocument()
    expect(screen.getByText('México vs Francia')).toBeInTheDocument()
    expect(screen.getByText('Winner Match 73 vs 2nd Group A')).toBeInTheDocument()
    expect(screen.queryByText('Argentina vs Canadá')).not.toBeInTheDocument()

    const cards = screen.getAllByRole('article')
    const firstCard = cards.find((card) => card.textContent?.includes('México vs Francia'))
    const placeholderCard = cards.find((card) => card.textContent?.includes('Winner Match 73'))

    expect(firstCard).toHaveTextContent('#73')
    expect(firstCard).toHaveTextContent('16avos')
    expect(firstCard).toHaveTextContent('Ganador avanza a')
    expect(firstCard).toHaveTextContent('Partido #89')
    expect(firstCard).toHaveTextContent('Perdedor avanza a')
    expect(firstCard).toHaveTextContent('No aplica')
    expect(firstCard).toHaveTextContent('Sin goles cargados')
    expect(firstCard).toHaveTextContent('Sin penales cargados')
    expect(placeholderCard).toHaveTextContent('Placeholder del bracket')
  })

  it('filters knockout matches by phase and status', async () => {
    const user = userEvent.setup()
    mockMatches([
      createMatch({ _id: 'match-73', stage: 'ROUND_OF_32', status: 'PENDING', matchNumber: 73 }),
      createMatch({
        _id: 'match-90',
        homeTeam: createTeam('Brasil'),
        awayTeam: createTeam('Croacia'),
        stage: 'QUARTER_FINALS',
        status: 'FINISHED',
        matchNumber: 90,
      }),
    ])

    renderAdminKnockoutsPage()

    expect(await screen.findAllByText('16avos')).not.toHaveLength(0)
    expect(screen.getAllByText('Cuartos')).not.toHaveLength(0)

    await user.selectOptions(screen.getByLabelText('Fase'), 'QUARTER_FINALS')
    expect(screen.queryByRole('heading', { name: /méxico vs francia/i })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /brasil vs croacia/i })).toBeInTheDocument()
    expect(screen.getAllByText('Cuartos')).not.toHaveLength(0)

    await user.selectOptions(screen.getByLabelText('Estado'), 'PENDING')
    expect(screen.getByText(/no hay eliminatorias para los filtros/i)).toBeInTheDocument()
  })

  it('saves a clean partial payload and refreshes matches after success', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const initialMatch = createMatch()
    let updateRequest = null
    let currentMatches = [initialMatch]
    let getCount = 0

    server.use(
      http.get('*/api/matches', () => {
        getCount += 1
        return HttpResponse.json(currentMatches)
      }),
      http.put('*/api/matches/:id', async ({ params, request }) => {
        updateRequest = {
          id: params.id,
          body: await request.json(),
        }
        currentMatches = [{
          ...initialMatch,
          status: updateRequest.body.status,
          homeScore: updateRequest.body.homeScore,
          awayScore: updateRequest.body.awayScore,
        }]
        return HttpResponse.json({ status: 'success', data: currentMatches[0] })
      }),
    )

    renderAdminKnockoutsPage()

    const card = await screen.findByRole('article')
    await user.selectOptions(within(card).getByLabelText(/estado de la eliminatoria/i), 'FINISHED')
    await user.type(within(card).getByLabelText(/goles de méxico/i), '2')
    await user.type(within(card).getByLabelText(/goles de francia/i), '1')
    await user.click(within(card).getByRole('button', { name: /guardar eliminatoria/i }))

    expect(confirmSpy).toHaveBeenCalledWith(
      '¿Confirmás guardar esta eliminatoria como finalizada? El Bracket Engine del backend definirá la progresión.',
    )
    expect(await screen.findByText('Resultado de eliminatoria guardado')).toBeInTheDocument()
    expect(getCount).toBeGreaterThanOrEqual(2)
    expect(updateRequest).toEqual({
      id: 'match-73',
      body: {
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
      },
    })
    expect(updateRequest.body).not.toHaveProperty('homeTeam')
    expect(updateRequest.body).not.toHaveProperty('awayTeam')
    expect(updateRequest.body).not.toHaveProperty('placeholderHome')
    expect(updateRequest.body).not.toHaveProperty('placeholderAway')
    expect(updateRequest.body).not.toHaveProperty('nextMatchWinner')
    expect(updateRequest.body).not.toHaveProperty('nextMatchLoser')
  })

  it('requires penalties before saving a tied finished knockout match', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    let putCalled = false

    server.use(
      http.get('*/api/matches', () => HttpResponse.json([createMatch()])),
      http.put('*/api/matches/:id', () => {
        putCalled = true
        return HttpResponse.json({ status: 'success' })
      }),
    )

    renderAdminKnockoutsPage()

    const card = await screen.findByRole('article')
    await user.selectOptions(within(card).getByLabelText(/estado de la eliminatoria/i), 'FINISHED')
    await user.type(within(card).getByLabelText(/goles de méxico/i), '1')
    await user.type(within(card).getByLabelText(/goles de francia/i), '1')

    expect(await within(card).findByText(/definición por penales obligatoria/i)).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: /guardar eliminatoria/i }))

    expect(await within(card).findByRole('alert')).toHaveTextContent(/completá los penales/i)
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(putCalled).toBe(false)
  })

  it('saves tied finished knockout matches with valid penalties', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    let updateRequest = null
    const initialMatch = createMatch()

    server.use(
      http.get('*/api/matches', () => HttpResponse.json([initialMatch])),
      http.put('*/api/matches/:id', async ({ request }) => {
        updateRequest = await request.json()
        return HttpResponse.json({ status: 'success' })
      }),
    )

    renderAdminKnockoutsPage()

    const card = await screen.findByRole('article')
    await user.selectOptions(within(card).getByLabelText(/estado de la eliminatoria/i), 'FINISHED')
    await user.type(within(card).getByLabelText(/goles de méxico/i), '1')
    await user.type(within(card).getByLabelText(/goles de francia/i), '1')
    await user.type(await within(card).findByLabelText(/penales de méxico/i), '4')
    await user.type(within(card).getByLabelText(/penales de francia/i), '3')
    await user.click(within(card).getByRole('button', { name: /guardar eliminatoria/i }))

    expect(await screen.findByText('Resultado de eliminatoria guardado')).toBeInTheDocument()
    expect(updateRequest).toEqual({
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 1,
      homePenaltyScore: 4,
      awayPenaltyScore: 3,
    })
  })

  it('does not save when the final confirmation is cancelled', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    let putCalled = false

    server.use(
      http.get('*/api/matches', () => HttpResponse.json([createMatch()])),
      http.put('*/api/matches/:id', () => {
        putCalled = true
        return HttpResponse.json({ status: 'success' })
      }),
    )

    renderAdminKnockoutsPage()

    const card = await screen.findByRole('article')
    await user.selectOptions(within(card).getByLabelText(/estado de la eliminatoria/i), 'FINISHED')
    await user.type(within(card).getByLabelText(/goles de méxico/i), '2')
    await user.type(within(card).getByLabelText(/goles de francia/i), '1')
    await user.click(within(card).getByRole('button', { name: /guardar eliminatoria/i }))

    expect(putCalled).toBe(false)
    expect(screen.queryByText('Resultado de eliminatoria guardado')).not.toBeInTheDocument()
  })

  it('handles empty, error and retry states', async () => {
    const user = userEvent.setup()
    let shouldFail = true

    server.use(
      http.get('*/api/matches', () => {
        if (shouldFail) {
          return HttpResponse.json({ message: 'Server down' }, { status: 500 })
        }

        return HttpResponse.json([groupMatch])
      }),
    )

    renderAdminKnockoutsPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/eliminatorias no disponibles/i)
    expect(screen.queryByText('Server down')).not.toBeInTheDocument()

    shouldFail = false
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByText(/no hay partidos knockout administrables/i)).toBeInTheDocument()
  })
})
