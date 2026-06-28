import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import FeedbackModal from '../../components/FeedbackModal/FeedbackModal'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import uiReducer from '../../features/ui/uiSlice'
import AppRoutes from '../../routes/AppRoutes'
import { savePredictionsStorage } from '../../services/predictions/predictionStorageService'
import { server } from '../../test/msw/server'
import PredictionFixture from './PredictionFixture'

let originalScrollIntoView

function createTeam(name, group = 'A') {
  return {
    _id: `${group}-${name}`,
    name,
    shieldUrl: `https://res.cloudinary.com/demo/${name}.svg`,
    group,
  }
}

function createMatch(overrides = {}) {
  const id = overrides.id ?? 'match-1'
  const stage = overrides.stage ?? 'GRUPO A'

  return {
    _id: id,
    homeTeam: createTeam(overrides.home ?? 'México', stage.at(-1)),
    awayTeam: createTeam(overrides.away ?? 'Brasil', stage.at(-1)),
    stadium: {
      _id: `stadium-${id}`,
      name: `Estadio ${id}`,
      city: 'Ciudad sede',
      country: 'País sede',
    },
    date: overrides.date ?? '2026-06-11T19:00:00.000Z',
    stage,
    status: overrides.status ?? 'PENDING',
    homeScore: overrides.homeScore ?? null,
    awayScore: overrides.awayScore ?? null,
    homePenaltyScore: null,
    awayPenaltyScore: null,
  }
}

function createKnockoutMatch(overrides = {}) {
  const match = createMatch({
    id: overrides.id ?? 'knockout-final-1',
    stage: overrides.stage ?? 'Final',
    home: overrides.home ?? 'Francia',
    away: overrides.away ?? 'Inglaterra',
    status: overrides.status ?? 'PENDING',
    homeScore: overrides.homeScore ?? null,
    awayScore: overrides.awayScore ?? null,
    date: overrides.date ?? '2026-07-19T19:00:00.000Z',
  })

  return {
    ...match,
    homePenaltyScore: overrides.homePenaltyScore ?? match.homePenaltyScore,
    awayPenaltyScore: overrides.awayPenaltyScore ?? match.awayPenaltyScore,
  }
}

const pendingMatch = createMatch()
const groupBMatch = createMatch({
  id: 'match-b-1',
  stage: 'GRUPO B',
  home: 'Argentina',
  away: 'Canadá',
})
const groupCMatch = createMatch({
  id: 'match-c-1',
  stage: 'GRUPO C',
  home: 'Uruguay',
  away: 'Japón',
})
const playingMatch = createMatch({
  id: 'playing-1',
  status: 'PLAYING',
  home: 'Argentina',
  away: 'Canadá',
})
const finishedMatch = createMatch({
  id: 'finished-1',
  home: 'España',
  away: 'Italia',
  status: 'FINISHED',
  homeScore: 2,
  awayScore: 1,
})
const closedByDateMatch = createMatch({
  id: 'closed-date-1',
  home: 'Chile',
  away: 'Japón',
  date: '2000-01-01T12:00:00.000Z',
})
const finishedKnockoutMatch = createKnockoutMatch({
  id: 'knockout-finished-1',
  status: 'FINISHED',
  homeScore: 3,
  awayScore: 1,
})

function createSavedPrediction(matchId, homeScore = 1, awayScore = 0, overrides = {}) {
  return {
    matchId,
    predictedHomeScore: homeScore,
    predictedAwayScore: awayScore,
    predictedHomePenaltyScore: null,
    predictedAwayPenaltyScore: null,
    predictedAdvancingTeamId: null,
    updatedAt: '2026-06-11T12:00:00.000Z',
    ...overrides,
  }
}

function mockMatchesResponse(matches = [pendingMatch]) {
  server.use(http.get('*/api/matches', () => HttpResponse.json(matches)))
}

function renderPredictionFixture({ includeModal = false } = {}) {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <PredictionFixture />
      {includeModal && <FeedbackModal />}
    </Provider>,
  )
}

function renderPredictionsRoute() {
  const store = configureStore({ reducer: { ui: uiReducer } })

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/predicciones']}>
        <AppRoutes />
      </MemoryRouter>
    </Provider>,
  )
}

beforeEach(() => {
  originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-06-10T12:00:00.000Z'))
})

afterEach(() => {
  if (originalScrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView
  } else {
    delete window.HTMLElement.prototype.scrollIntoView
  }

  vi.useRealTimers()
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('PredictionFixture', () => {
  it('renders the /predicciones route with the page title', async () => {
    mockMatchesResponse([pendingMatch])

    renderPredictionsRoute()

    expect(await screen.findByRole('heading', { name: 'Tu tablero de predicciones' })).toBeInTheDocument()
    expect(screen.getAllByText('Predicciones').length).toBeGreaterThan(0)
    expect(screen.queryByText('PREDICTION FIXTURE')).not.toBeInTheDocument()
    expect(await screen.findAllByText('México')).not.toHaveLength(0)
  })


  it('renders the prediction dashboard copy, printable CTA and danger zone', async () => {
    mockMatchesResponse([pendingMatch, groupBMatch])

    renderPredictionFixture()

    expect(screen.getByRole('heading', { name: 'Tu tablero de predicciones' })).toBeInTheDocument()
    expect(screen.getByText('Configurá tu perfil')).toBeInTheDocument()
    expect(await screen.findByText('Resumen imprimible')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imprimir predicciones' })).toBeInTheDocument()
    expect(screen.getByText('Zona de borrado')).toBeInTheDocument()
    expect(
      screen.getByText(/Estas acciones solo eliminan predicciones editables guardadas en este navegador/i),
    ).toBeInTheDocument()
  })

  it('renders the group selector with Spanish options and initial all-groups value', async () => {
    mockMatchesResponse([pendingMatch, groupBMatch, groupCMatch])

    renderPredictionFixture()

    const selector = await screen.findByLabelText('Filtrar por grupo')
    const knockoutSelector = screen.getByLabelText('Fase eliminatoria')

    expect(selector).toHaveValue('all')
    expect(screen.getByRole('option', { name: 'Todos los grupos' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Grupo A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Grupo B' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Grupo C' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Grupo D' })).not.toBeInTheDocument()
    expect(knockoutSelector).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Todas las fases' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Dieciseisavos de final' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Octavos de final' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cuartos de final' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Semifinales' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Partido por el tercer puesto' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Final' })).toBeInTheDocument()
    expect(
      screen.getByText('Se habilitará cuando estén definidos los cruces.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/backend/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Borrar predicciones del grupo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Borrar todas las predicciones' })).toBeInTheDocument()
  })

  it('filters prediction cards by group and restores all groups without losing saved data', async () => {
    const user = userEvent.setup()
    savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'match-1': {
          matchId: 'match-1',
          predictedHomeScore: 2,
          predictedAwayScore: 1,
          predictedHomePenaltyScore: null,
          predictedAwayPenaltyScore: null,
          updatedAt: '2026-06-11T12:00:00.000Z',
        },
      },
    })
    mockMatchesResponse([pendingMatch, groupBMatch])

    renderPredictionFixture()

    expect(await screen.findByLabelText('Goles de México')).toHaveValue('2')
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('Yorch')
    expect(screen.getByLabelText('Goles de Argentina')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Filtrar por grupo'), 'A')

    expect(screen.getByLabelText('Goles de México')).toHaveValue('2')
    expect(screen.queryByLabelText('Goles de Argentina')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('Yorch')

    await user.selectOptions(screen.getByLabelText('Filtrar por grupo'), 'B')

    expect(screen.queryByLabelText('Goles de México')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Goles de Argentina')).toBeInTheDocument()
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('Yorch')

    await user.selectOptions(screen.getByLabelText('Filtrar por grupo'), 'all')

    expect(screen.getByLabelText('Goles de México')).toHaveValue('2')
    expect(screen.getByLabelText('Goles de Argentina')).toBeInTheDocument()
  })

  it('clears editable predictions from the selected group without deleting other groups or the user name', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')
    savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'match-1': createSavedPrediction('match-1', 2, 1),
        'match-b-1': createSavedPrediction('match-b-1', 3, 0),
      },
    })
    mockMatchesResponse([pendingMatch, groupBMatch])

    renderPredictionFixture()

    const groupSelector = await screen.findByLabelText('Filtrar por grupo')
    await user.selectOptions(groupSelector, 'B')
    await user.click(screen.getByRole('button', { name: 'Borrar predicciones del grupo' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toHaveTextContent('Borrar predicciones del grupo')
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '¿Querés borrar las predicciones editables del grupo seleccionado? Las predicciones bloqueadas se conservarán.',
    )

    await user.click(screen.getByRole('button', { name: 'Borrar predicciones' }))

    expect(groupSelector).toHaveValue('B')
    expect(screen.getByText('Se borraron las predicciones editables del grupo seleccionado.')).toBeInTheDocument()
    expect(screen.getByLabelText('Goles de Argentina')).toHaveValue('')
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('Yorch')
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('1')

    const savedStorage = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))
    expect(savedStorage.userName).toBe('Yorch')
    expect(savedStorage.predictions).toHaveProperty('match-1')
    expect(savedStorage.predictions).not.toHaveProperty('match-b-1')
  })

  it('does not clear predictions when reset confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')
    const savedData = {
      version: 1,
      userName: 'Yorch',
      predictions: {
        'match-1': createSavedPrediction('match-1', 2, 1),
        'match-b-1': createSavedPrediction('match-b-1', 3, 0),
      },
    }
    savePredictionsStorage(savedData)
    mockMatchesResponse([pendingMatch, groupBMatch])

    renderPredictionFixture()

    await screen.findByLabelText('Filtrar por grupo')
    await user.click(screen.getByRole('button', { name: 'Borrar todas las predicciones' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Borrar todas las predicciones')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))).toMatchObject(
      savedData,
    )
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('2')
  })

  it('clears all editable predictions while preserving PLAYING, FINISHED and date-locked predictions', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm')
    savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'match-1': createSavedPrediction('match-1', 2, 1),
        'match-b-1': createSavedPrediction('match-b-1', 3, 0),
        'playing-1': createSavedPrediction('playing-1', 1, 0),
        'finished-1': createSavedPrediction('finished-1', 2, 1),
        'closed-date-1': createSavedPrediction('closed-date-1', 0, 0),
      },
    })
    mockMatchesResponse([
      pendingMatch,
      groupBMatch,
      playingMatch,
      finishedMatch,
      closedByDateMatch,
    ])

    renderPredictionFixture()

    const groupSelector = await screen.findByLabelText('Filtrar por grupo')
    await user.selectOptions(groupSelector, 'B')
    await user.click(screen.getByRole('button', { name: 'Borrar todas las predicciones' }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toHaveTextContent('Borrar todas las predicciones')
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '¿Querés borrar todas tus predicciones editables? Las predicciones bloqueadas se conservarán.',
    )

    await user.click(screen.getByRole('button', { name: 'Borrar predicciones' }))

    expect(groupSelector).toHaveValue('B')
    expect(screen.getByText('Se borraron tus predicciones editables. Las predicciones bloqueadas se conservaron.')).toBeInTheDocument()
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('Yorch')
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('3')

    const savedStorage = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))
    expect(savedStorage.userName).toBe('Yorch')
    expect(savedStorage.predictions).not.toHaveProperty('match-1')
    expect(savedStorage.predictions).not.toHaveProperty('match-b-1')
    expect(savedStorage.predictions).toHaveProperty('playing-1')
    expect(savedStorage.predictions).toHaveProperty('finished-1')
    expect(savedStorage.predictions).toHaveProperty('closed-date-1')
  })

  it('clears only editable knockout predictions without affecting groups or locked knockout matches', async () => {
    const user = userEvent.setup()
    const editableKnockoutMatch = createKnockoutMatch({
      id: 'knockout-editable-reset-1',
      stage: 'ROUND_OF_32',
      home: 'Argentina',
      away: 'Francia',
    })
    const lockedKnockoutMatch = createKnockoutMatch({
      id: 'knockout-locked-reset-1',
      stage: 'FINAL',
      home: 'España',
      away: 'Italia',
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 1,
    })
    savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'match-1': createSavedPrediction('match-1', 2, 1),
        'knockout-editable-reset-1': createSavedPrediction('knockout-editable-reset-1', 1, 0),
        'knockout-locked-reset-1': createSavedPrediction('knockout-locked-reset-1', 2, 1),
      },
    })
    mockMatchesResponse([pendingMatch, editableKnockoutMatch, lockedKnockoutMatch])

    renderPredictionFixture()

    await screen.findByLabelText('Goles de Argentina')
    await user.click(screen.getByRole('button', { name: 'Borrar predicciones de eliminatorias' }))
    await user.click(screen.getByRole('button', { name: 'Borrar predicciones' }))

    expect(
      screen.getByText(
        'Se borraron las predicciones editables de eliminatorias. Las predicciones bloqueadas se conservaron.',
      ),
    ).toBeInTheDocument()

    const savedStorage = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))
    expect(savedStorage.predictions).toHaveProperty('match-1')
    expect(savedStorage.predictions).not.toHaveProperty('knockout-editable-reset-1')
    expect(savedStorage.predictions).toHaveProperty('knockout-locked-reset-1')
  })

  it('prints visible predictions without mutating saved data or the selected group filter', async () => {
    const user = userEvent.setup()
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const savedData = {
      version: 1,
      userName: 'Yorch',
      predictions: {
        'match-1': {
          matchId: 'match-1',
          predictedHomeScore: 2,
          predictedAwayScore: 1,
          predictedHomePenaltyScore: null,
          predictedAwayPenaltyScore: null,
          updatedAt: '2026-06-11T12:00:00.000Z',
        },
      },
    }
    savePredictionsStorage(savedData)
    mockMatchesResponse([pendingMatch, groupBMatch])

    renderPredictionFixture()

    const groupSelector = await screen.findByLabelText('Filtrar por grupo')
    expect(printSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Imprimir predicciones' })).toBeInTheDocument()
    expect(screen.getByText('Resumen imprimible')).toBeInTheDocument()

    await user.selectOptions(groupSelector, 'B')
    await user.click(screen.getByRole('button', { name: 'Imprimir predicciones' }))

    expect(printSpy).toHaveBeenCalledTimes(1)
    expect(groupSelector).toHaveValue('B')
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('Yorch')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))).toMatchObject(
      savedData,
    )
  })

  it('captures and saves the user name in localStorage', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([pendingMatch])

    renderPredictionFixture()

    const nameInput = screen.getByLabelText('Tu nombre')
    expect(nameInput).toHaveAttribute('maxlength', '40')
    expect(nameInput).toHaveAttribute('autocomplete', 'name')

    await user.type(nameInput, '  Yorch  ')
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

    expect(screen.getByText('Nombre guardado')).toBeInTheDocument()
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('Yorch')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions)).userName).toBe('Yorch')
  })

  it.each(['María José', 'Ana-Luz', 'Juan_Pablo', 'Guillermo Valle', 'José Núñez'])(
    'saves a valid participant name with accepted characters: %s',
    async (name) => {
      const user = userEvent.setup()
      mockMatchesResponse([pendingMatch])

      renderPredictionFixture()

      await user.type(screen.getByLabelText('Tu nombre'), `  ${name}  `)
      await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

      expect(screen.getByText('Nombre guardado')).toBeInTheDocument()
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions)).userName).toBe(
        name,
      )
    },
  )

  it('does not save an empty user name', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([pendingMatch])

    renderPredictionFixture()

    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ingresá tu nombre para guardar tus predicciones',
    )
    expect(window.localStorage.getItem(STORAGE_KEYS.predictions)).toBeNull()
  })

  it.each(['   ', 'A', 'Jorge123', 'Jorge!', 'Jorge.', '@Jorge', 'Jorge/Valle', '😀Jorge'])(
    'does not save invalid participant name %s',
    async (name) => {
      const user = userEvent.setup()
      mockMatchesResponse([pendingMatch])

      renderPredictionFixture()

      await user.type(screen.getByLabelText('Tu nombre'), name)
      await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

      expect(screen.getByRole('alert')).toHaveTextContent(
        name.trim()
          ? 'El nombre debe tener entre 2 y 40 caracteres y solo puede incluir letras, espacios, guion medio o guion bajo.'
          : 'Ingresá tu nombre para guardar tus predicciones',
      )
      expect(window.localStorage.getItem(STORAGE_KEYS.predictions)).toBeNull()
      expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent(
        'Participante pendiente',
      )
    },
  )

  it('does not save a participant name longer than 40 characters', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([pendingMatch])

    renderPredictionFixture()

    fireEvent.change(screen.getByLabelText('Tu nombre'), {
      target: { value: 'Guillermo Valle con un texto de más de cuarenta caracteres' },
    })
    await user.click(screen.getByRole('button', { name: 'Guardar nombre' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El nombre debe tener entre 2 y 40 caracteres y solo puede incluir letras, espacios, guion medio o guion bajo.',
    )
    expect(window.localStorage.getItem(STORAGE_KEYS.predictions)).toBeNull()
  })

  it('renders group-stage prediction cards and saves predictions', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([pendingMatch])

    renderPredictionFixture()

    const homeScoreInput = await screen.findByLabelText('Goles de México')
    expect(homeScoreInput).toBeInTheDocument()
    expect(homeScoreInput).toHaveAttribute('type', 'text')
    expect(homeScoreInput).toHaveAttribute('inputmode', 'numeric')
    expect(homeScoreInput).toHaveAttribute('pattern', '[0-9]*')
    expect(homeScoreInput).toHaveAttribute('maxlength', '2')
    expect(screen.getByRole('heading', { name: 'Partidos de fase de grupos' })).toBeInTheDocument()

    await user.type(homeScoreInput, '2')
    await user.type(screen.getByLabelText('Goles de Brasil'), '1')
    await user.click(screen.getByRole('button', { name: 'Guardar predicción' }))

    expect(screen.getByText('Predicción guardada')).toBeInTheDocument()

    const savedStorage = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))
    expect(savedStorage.predictions['match-1']).toMatchObject({
      matchId: 'match-1',
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    })
  })

  it.each(['abc', 'e', 'E', '1e2', '+2', '-1', '1.5', '21'])(
    'does not save invalid score input %s',
    async (scoreInput) => {
      const user = userEvent.setup()
      mockMatchesResponse([pendingMatch])

      renderPredictionFixture()

      await user.type(await screen.findByLabelText('Goles de México'), scoreInput)
      await user.type(screen.getByLabelText('Goles de Brasil'), '1')
      await user.click(screen.getByRole('button', { name: 'Guardar predicción' }))

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ingresá un número entero entre 0 y 20.',
      )
      expect(window.localStorage.getItem(STORAGE_KEYS.predictions)).toBeNull()
      expect(screen.queryByText('Predicción guardada')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('0 /72')
    },
  )

  it('saves score boundary values 0 and 20', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([pendingMatch])

    renderPredictionFixture()

    await user.type(await screen.findByLabelText('Goles de México'), '0')
    await user.type(screen.getByLabelText('Goles de Brasil'), '20')
    await user.click(screen.getByRole('button', { name: 'Guardar predicción' }))

    expect(screen.getByText('Predicción guardada')).toBeInTheDocument()

    const savedStorage = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))
    expect(savedStorage.predictions['match-1']).toMatchObject({
      matchId: 'match-1',
      predictedHomeScore: 0,
      predictedAwayScore: 20,
    })
  })

  it('loads saved predictions from localStorage', async () => {
    savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'match-1': {
          matchId: 'match-1',
          predictedHomeScore: 3,
          predictedAwayScore: 0,
          predictedHomePenaltyScore: null,
          predictedAwayPenaltyScore: null,
          updatedAt: '2026-06-11T12:00:00.000Z',
        },
      },
    })
    mockMatchesResponse([pendingMatch])

    renderPredictionFixture()

    expect(await screen.findByLabelText('Goles de México')).toHaveValue('3')
    expect(screen.getByLabelText('Goles de Brasil')).toHaveValue('0')
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('Yorch')
  })

  it('visually and functionally locks PLAYING matches', async () => {
    mockMatchesResponse([playingMatch])

    renderPredictionFixture()

    expect(await screen.findByText('Partido iniciado')).toBeInTheDocument()
    expect(screen.getByLabelText('Goles de Argentina')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Guardar predicción' })).toBeDisabled()
  })

  it('visually and functionally locks FINISHED matches', async () => {
    mockMatchesResponse([finishedMatch])

    renderPredictionFixture()

    expect(await screen.findByText('Partido finalizado')).toBeInTheDocument()
    expect(screen.getByLabelText('Goles de España')).toBeDisabled()
  })

  it('locks PENDING matches when now is after match date', async () => {
    mockMatchesResponse([closedByDateMatch])

    renderPredictionFixture()

    expect(await screen.findByText('Predicción cerrada')).toBeInTheDocument()
    expect(screen.getByLabelText('Goles de Chile')).toBeDisabled()
  })

  it('compares saved predictions against official results and totals points', async () => {
    savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'finished-1': {
          matchId: 'finished-1',
          predictedHomeScore: 2,
          predictedAwayScore: 1,
          predictedHomePenaltyScore: null,
          predictedAwayPenaltyScore: null,
          updatedAt: '2026-06-11T12:00:00.000Z',
        },
      },
    })
    mockMatchesResponse([finishedMatch])

    renderPredictionFixture()

    expect(await screen.findByText('Puntos obtenidos: 4')).toBeInTheDocument()
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('4')
    expect(screen.getByText('Ganador acertado')).toBeInTheDocument()
    expect(screen.getByText('Goles del ganador acertados')).toBeInTheDocument()
    expect(screen.getByText('Goles del perdedor acertados')).toBeInTheDocument()
  })

  it('renders prediction summary counts and points separated by phase', async () => {
    savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'finished-1': createSavedPrediction('finished-1', 2, 1),
        'knockout-finished-1': createSavedPrediction('knockout-finished-1', 3, 1),
      },
    })
    mockMatchesResponse([finishedMatch, finishedKnockoutMatch])

    renderPredictionFixture()

    const summary = await screen.findByLabelText('Resumen de predicciones')

    expect(within(summary).getByText('Progreso de grupos')).toBeInTheDocument()
    expect(within(summary).getByText('1 /72')).toBeInTheDocument()
    expect(within(summary).getByText('Puntos de grupo obtenidos')).toBeInTheDocument()
    expect(within(summary).getByText('Progreso de eliminatorias')).toBeInTheDocument()
    expect(within(summary).getByText('1 /1')).toBeInTheDocument()
    expect(within(summary).getByText('Puntos de eliminatorias obtenidos')).toBeInTheDocument()
    expect(within(summary).getByText('Puntos totales')).toBeInTheDocument()
    expect(within(summary).getAllByText('4')).toHaveLength(2)
    expect(within(summary).getByText('8')).toBeInTheDocument()
  })

  it('opens and closes scoring help modals from summary buttons', async () => {
    const user = userEvent.setup()
    mockMatchesResponse([pendingMatch])

    renderPredictionFixture()

    await screen.findByLabelText('Resumen de predicciones')

    await user.click(
      screen.getByRole('button', { name: 'Ver explicación de puntos de grupo' }),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Cómo se calculan los puntos de grupo',
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('1 punto por acertar ganador.')
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Ver explicación de puntos de eliminatorias' }),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Cómo se calculan los puntos de eliminatorias',
    )
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '2 puntos por acertar ganador.',
    )
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    await user.click(
      screen.getByRole('button', { name: 'Ver explicación de puntos totales' }),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Cómo se calculan los puntos totales',
    )
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Solo se calculan puntos cuando hay resultado registrado suficiente.',
    )
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not render placeholder knockout prediction cards', async () => {
    const placeholderKnockoutMatch = createMatch({
      id: 'ko-placeholder',
      stage: 'Final',
      home: 'Ganador Partido 101',
      away: 'TBD',
    })
    mockMatchesResponse([placeholderKnockoutMatch])

    renderPredictionFixture()

    expect(
      await screen.findByText(
        'Las eliminatorias estarán disponibles cuando los cruces estén definidos',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Goles de Ganador Partido 101')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        /No se muestran cruces base, TBD ni equipos por definir/i,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('No hay partidos de fase de grupos para predecir')).toBeInTheDocument()
  })

  it('renders and filters real knockout prediction cards by canonical stage', async () => {
    const user = userEvent.setup()
    const roundOf16Match = createKnockoutMatch({
      id: 'knockout-round-16-1',
      stage: 'ROUND_OF_16',
      home: 'Argentina',
      away: 'Alemania',
    })
    const finalMatch = createKnockoutMatch({
      id: 'knockout-final-2',
      stage: 'FINAL',
      home: 'Francia',
      away: 'Inglaterra',
    })
    mockMatchesResponse([roundOf16Match, finalMatch])

    renderPredictionFixture()

    const knockoutSelector = await screen.findByLabelText('Fase eliminatoria')
    expect(knockoutSelector).toBeEnabled()
    expect(screen.getByRole('heading', { name: 'Partidos de eliminatorias' })).toBeInTheDocument()
    expect(screen.getByLabelText('Goles de Argentina')).toBeInTheDocument()
    expect(screen.getByLabelText('Goles de Francia')).toBeInTheDocument()
    expect(screen.getByText('Octavos')).toBeInTheDocument()
    expect(screen.getAllByText('Final').length).toBeGreaterThan(0)
    expect(screen.queryByText('ROUND_OF_16')).not.toBeInTheDocument()
    expect(screen.queryByText('FINAL')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Penales de Argentina')).not.toBeInTheDocument()

    await user.selectOptions(knockoutSelector, 'final')

    expect(screen.queryByLabelText('Goles de Argentina')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Goles de Francia')).toBeInTheDocument()

    await user.selectOptions(knockoutSelector, 'round-of-16')

    expect(screen.getByLabelText('Goles de Argentina')).toBeInTheDocument()
    expect(screen.queryByLabelText('Goles de Francia')).not.toBeInTheDocument()
  })

  it('scrolls to the knockout section only after the user changes the knockout phase filter', async () => {
    const user = userEvent.setup()
    const scrollIntoView = vi.fn()
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback()
        return 1
      })
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView
    const roundOf16Match = createKnockoutMatch({
      id: 'knockout-round-16-scroll-1',
      stage: 'ROUND_OF_16',
      home: 'Argentina',
      away: 'Alemania',
    })
    const finalMatch = createKnockoutMatch({
      id: 'knockout-final-scroll-1',
      stage: 'FINAL',
      home: 'Francia',
      away: 'Inglaterra',
    })
    mockMatchesResponse([roundOf16Match, finalMatch])

    renderPredictionFixture()

    const knockoutSelector = await screen.findByLabelText('Fase eliminatoria')
    expect(screen.getByRole('heading', { name: 'Partidos de eliminatorias' })).toBeInTheDocument()
    expect(scrollIntoView).not.toHaveBeenCalled()

    await user.selectOptions(knockoutSelector, 'final')

    expect(requestAnimationFrameSpy).toHaveBeenCalled()
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(screen.getByLabelText('Goles de Francia')).toBeInTheDocument()
    expect(screen.queryByLabelText('Goles de Argentina')).not.toBeInTheDocument()
  })

  it('saves a knockout prediction with a regular home winner without penalty inputs', async () => {
    const user = userEvent.setup()
    const knockoutMatch = createKnockoutMatch({
      id: 'knockout-round-32-1',
      stage: 'ROUND_OF_32',
      home: 'Argentina',
      away: 'Francia',
    })
    mockMatchesResponse([knockoutMatch])

    renderPredictionFixture()

    expect(await screen.findByLabelText('Goles de Argentina')).toBeInTheDocument()
    expect(screen.getByText('16avos')).toBeInTheDocument()
    expect(screen.queryByLabelText('Penales de Argentina')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Goles de Argentina'), '2')
    await user.type(screen.getByLabelText('Goles de Francia'), '1')
    await user.click(screen.getByRole('button', { name: 'Guardar predicción' }))

    expect(screen.getByText('Predicción guardada')).toBeInTheDocument()

    const savedStorage = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))
    expect(savedStorage.predictions['knockout-round-32-1']).toMatchObject({
      matchId: 'knockout-round-32-1',
      predictedHomeScore: 2,
      predictedAwayScore: 1,
      predictedHomePenaltyScore: null,
      predictedAwayPenaltyScore: null,
      predictedAdvancingTeamId: null,
    })
    expect(screen.getByLabelText('Resumen de predicciones')).toHaveTextContent('1 /1')
  })

  it('requires and saves an exclusive advancing team selection for knockout draws', async () => {
    const user = userEvent.setup()
    const knockoutMatch = createKnockoutMatch({
      id: 'knockout-draw-1',
      stage: 'FINAL',
      home: 'Argentina',
      away: 'Francia',
    })
    mockMatchesResponse([knockoutMatch])

    renderPredictionFixture()

    await user.type(await screen.findByLabelText('Goles de Argentina'), '1')
    await user.type(screen.getByLabelText('Goles de Francia'), '1')

    expect(screen.getByText('Si empatan, ¿quién clasifica?')).toBeInTheDocument()
    expect(screen.queryByLabelText('Penales de Argentina')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar predicción' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Si pronosticás empate en eliminatorias, elegí qué equipo clasifica.',
    )

    const argentinaButton = screen.getByRole('button', { name: 'Argentina' })
    const franceButton = screen.getByRole('button', { name: 'Francia' })

    await user.click(argentinaButton)
    expect(argentinaButton).toHaveAttribute('aria-pressed', 'true')
    expect(franceButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(franceButton)
    expect(screen.getByRole('button', { name: 'Argentina' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: '✓ Francia' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(screen.getByRole('button', { name: 'Guardar predicción' }))

    const savedStorage = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))
    expect(savedStorage.predictions['knockout-draw-1']).toMatchObject({
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      predictedAdvancingTeamId: knockoutMatch.awayTeam._id,
    })
  })

  it('clears the advancing team selection when a knockout prediction stops being a draw', async () => {
    const user = userEvent.setup()
    const knockoutMatch = createKnockoutMatch({
      id: 'knockout-clear-advancing-1',
      stage: 'FINAL',
      home: 'Argentina',
      away: 'Francia',
    })
    mockMatchesResponse([knockoutMatch])

    renderPredictionFixture()

    await user.type(await screen.findByLabelText('Goles de Argentina'), '1')
    await user.type(screen.getByLabelText('Goles de Francia'), '1')
    await user.click(screen.getByRole('button', { name: 'Argentina' }))
    await user.clear(screen.getByLabelText('Goles de Francia'))
    await user.type(screen.getByLabelText('Goles de Francia'), '0')

    expect(screen.queryByText('Si empatan, ¿quién clasifica?')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Guardar predicción' }))

    const savedStorage = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))
    expect(savedStorage.predictions['knockout-clear-advancing-1']).toMatchObject({
      predictedHomeScore: 1,
      predictedAwayScore: 0,
      predictedAdvancingTeamId: null,
    })
  })

  it('shows visual advancing comparison without adding points for the selected qualifier', async () => {
    const finishedTieKnockoutMatch = createKnockoutMatch({
      id: 'knockout-finished-tie-1',
      stage: 'FINAL',
      home: 'Argentina',
      away: 'Francia',
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 1,
      homePenaltyScore: 3,
      awayPenaltyScore: 4,
    })
    savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'knockout-finished-tie-1': createSavedPrediction('knockout-finished-tie-1', 1, 1, {
          predictedAdvancingTeamId: finishedTieKnockoutMatch.homeTeam._id,
        }),
      },
    })
    mockMatchesResponse([finishedTieKnockoutMatch])

    renderPredictionFixture()

    expect(await screen.findByText('Puntos obtenidos: 2')).toBeInTheDocument()
    expect(screen.getByText('1 - 1 · Clasifica Argentina')).toBeInTheDocument()
    expect(screen.getByText('1 - 1 · Clasificó Francia')).toBeInTheDocument()
    expect(screen.queryByText('Clasificado acertado')).not.toBeInTheDocument()
    expect(screen.queryByText(/Penales/)).not.toBeInTheDocument()
  })

  it('shows a corrupt localStorage notice and allows guided reset', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(STORAGE_KEYS.predictions, '{bad-json')
    mockMatchesResponse([pendingMatch])

    renderPredictionFixture()

    expect(
      screen.getByText('Detectamos datos guardados inválidos. Podés reiniciar tus predicciones para continuar.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reiniciar predicciones' }))

    expect(screen.queryByText('Reinicio recomendado')).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.predictions))).toMatchObject({
      version: 1,
      userName: '',
      predictions: {},
    })
  })

  it('shows loading and delayed loading states', async () => {
    server.use(
      http.get('*/api/matches', async () => {
        await delay(8000)
        return HttpResponse.json([])
      }),
    )
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-10T12:00:00.000Z'))
    renderPredictionFixture({ includeModal: true })

    expect(screen.getByText('Estamos buscando partidos para predecir')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(7000)
    })

    expect(screen.getByRole('dialog')).toHaveTextContent('El servidor está despertando')
  })

  it('shows an empty state when there are no eligible group matches', async () => {
    mockMatchesResponse([])

    renderPredictionFixture()

    expect(await screen.findByText('No hay partidos de fase de grupos para predecir')).toBeInTheDocument()
  })



  it('retries loading prediction matches from the error state', async () => {
    const user = userEvent.setup()
    let callCount = 0

    server.use(
      http.get('*/api/matches', () => {
        callCount += 1

        if (callCount === 1) {
          return HttpResponse.json({ message: 'DB down' }, { status: 500 })
        }

        return HttpResponse.json([pendingMatch])
      }),
    )

    renderPredictionFixture()

    expect(await screen.findByRole('alert')).toHaveTextContent('Predicciones no disponibles')

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect((await screen.findAllByText('México')).length).toBeGreaterThan(0)
    expect(callCount).toBe(2)
  })

  it('shows a friendly error state without exposing technical messages', async () => {
    server.use(http.get('*/api/matches', () => HttpResponse.json({ message: 'DB down' }, { status: 500 })))

    renderPredictionFixture()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los partidos para predicciones. Si el servidor estaba dormido, esperá unos segundos y probá de nuevo.',
    )
    expect(screen.queryByText('DB down')).not.toBeInTheDocument()
  })
})
