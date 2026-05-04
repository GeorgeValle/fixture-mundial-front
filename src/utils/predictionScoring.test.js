import { describe, expect, it } from 'vitest'
import {
  getOfficialKnockoutWinner,
  getOfficialResult,
  getPredictedKnockoutWinner,
  hasSufficientOfficialResult,
  scoreGroupPrediction,
  scoreKnockoutPrediction,
  scorePrediction,
} from './predictionScoring'

function createMatch(overrides = {}) {
  return {
    _id: 'match-1',
    stage: 'Grupo A',
    status: 'FINISHED',
    homeScore: 2,
    awayScore: 1,
    homePenaltyScore: null,
    awayPenaltyScore: null,
    ...overrides,
  }
}

function createPrediction(overrides = {}) {
  return {
    matchId: 'match-1',
    predictedHomeScore: 2,
    predictedAwayScore: 1,
    predictedHomePenaltyScore: null,
    predictedAwayPenaltyScore: null,
    updatedAt: '2026-06-11T12:00:00.000Z',
    ...overrides,
  }
}

function indicatorLabels(result) {
  return result.indicators.map((indicator) => indicator.label)
}

describe('predictionScoring - official results', () => {
  it('detects sufficient official regular results', () => {
    expect(hasSufficientOfficialResult(createMatch())).toBe(true)
    expect(hasSufficientOfficialResult(createMatch({ homeScore: null }))).toBe(false)
  })

  it('returns the official regular result breakdown', () => {
    expect(getOfficialResult(createMatch())).toMatchObject({
      canScore: true,
      homeScore: 2,
      awayScore: 1,
      isDraw: false,
      regularWinnerSide: 'home',
    })
  })

  it('detects official knockout winners by regular score', () => {
    expect(getOfficialKnockoutWinner(createMatch({ stage: 'Final' }))).toMatchObject({
      canScore: true,
      winnerSide: 'home',
      loserSide: 'away',
      method: 'regular',
    })
    expect(
      getOfficialKnockoutWinner(createMatch({ stage: 'Final', homeScore: 1, awayScore: 2 })),
    ).toMatchObject({
      canScore: true,
      winnerSide: 'away',
      loserSide: 'home',
      method: 'regular',
    })
  })

  it('detects official knockout winners by penalties', () => {
    expect(
      getOfficialKnockoutWinner(
        createMatch({
          stage: 'Final',
          homeScore: 1,
          awayScore: 1,
          homePenaltyScore: 5,
          awayPenaltyScore: 4,
        }),
      ),
    ).toMatchObject({
      canScore: true,
      winnerSide: 'home',
      loserSide: 'away',
      method: 'penalties',
    })
    expect(
      getOfficialKnockoutWinner(
        createMatch({
          stage: 'Final',
          homeScore: 2,
          awayScore: 2,
          homePenaltyScore: 3,
          awayPenaltyScore: 4,
        }),
      ),
    ).toMatchObject({
      canScore: true,
      winnerSide: 'away',
      loserSide: 'home',
      method: 'penalties',
    })
  })
})

describe('predictionScoring - group stage', () => {
  it('scores winner, winner goals and loser goals for a regular winner', () => {
    const result = scoreGroupPrediction(createMatch(), createPrediction())

    expect(result).toMatchObject({ canScore: true, points: 4, reason: null })
    expect(indicatorLabels(result)).toEqual([
      'Ganador acertado',
      'Goles del ganador acertados',
      'Goles del perdedor acertados',
    ])
  })

  it('scores only the matched regular winner conditions', () => {
    const result = scoreGroupPrediction(
      createMatch({ homeScore: 2, awayScore: 0 }),
      createPrediction({ predictedHomeScore: 2, predictedAwayScore: 1 }),
    )

    expect(result.points).toBe(3)
    expect(indicatorLabels(result)).toEqual([
      'Ganador acertado',
      'Goles del ganador acertados',
    ])
  })

  it('scores draw and exact draw goals', () => {
    const result = scoreGroupPrediction(
      createMatch({ homeScore: 1, awayScore: 1 }),
      createPrediction({ predictedHomeScore: 1, predictedAwayScore: 1 }),
    )

    expect(result.points).toBe(2)
    expect(indicatorLabels(result)).toEqual(['Empate acertado', 'Goles del empate acertados'])
  })

  it('does not score matches that are not finished', () => {
    const result = scoreGroupPrediction(createMatch({ status: 'PLAYING' }), createPrediction())

    expect(result).toMatchObject({
      canScore: false,
      points: 0,
      indicators: [],
      reason: 'Partido no finalizado',
    })
  })

  it('does not score incomplete official results', () => {
    const result = scoreGroupPrediction(createMatch({ awayScore: null }), createPrediction())

    expect(result).toMatchObject({
      canScore: false,
      points: 0,
      indicators: [],
      reason: 'Resultado registrado incompleto',
    })
  })
})

describe('predictionScoring - knockout stage', () => {
  it('scores a home qualifier by regular score', () => {
    const result = scoreKnockoutPrediction(
      createMatch({ stage: 'Final', homeScore: 3, awayScore: 1 }),
      createPrediction({ predictedHomeScore: 3, predictedAwayScore: 0 }),
    )

    expect(result.points).toBe(3)
    expect(indicatorLabels(result)).toEqual([
      'Clasificado acertado',
      'Goles del ganador acertados',
    ])
  })

  it('scores an away qualifier by regular score', () => {
    const result = scoreKnockoutPrediction(
      createMatch({ stage: 'Final', homeScore: 1, awayScore: 2 }),
      createPrediction({ predictedHomeScore: 0, predictedAwayScore: 2 }),
    )

    expect(result.points).toBe(3)
    expect(indicatorLabels(result)).toEqual([
      'Clasificado acertado',
      'Goles del ganador acertados',
    ])
  })

  it('scores a home qualifier by penalties', () => {
    const result = scoreKnockoutPrediction(
      createMatch({
        stage: 'Final',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 5,
        awayPenaltyScore: 4,
      }),
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: 5,
        predictedAwayPenaltyScore: 3,
      }),
    )

    expect(result.points).toBe(5)
    expect(indicatorLabels(result)).toEqual([
      'Clasificado acertado',
      'Empate acertado',
      'Goles del empate acertados',
      'Penales del ganador acertados',
    ])
  })

  it('scores an away qualifier by penalties', () => {
    const result = scoreKnockoutPrediction(
      createMatch({
        stage: 'Final',
        homeScore: 2,
        awayScore: 2,
        homePenaltyScore: 3,
        awayPenaltyScore: 4,
      }),
      createPrediction({
        predictedHomeScore: 2,
        predictedAwayScore: 2,
        predictedHomePenaltyScore: 2,
        predictedAwayPenaltyScore: 4,
      }),
    )

    expect(result.points).toBe(5)
    expect(indicatorLabels(result)).toEqual([
      'Clasificado acertado',
      'Empate acertado',
      'Goles del empate acertados',
      'Penales del ganador acertados',
    ])
  })

  it('can score penalty goals for the official loser', () => {
    const result = scoreKnockoutPrediction(
      createMatch({
        stage: 'Final',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 5,
        awayPenaltyScore: 4,
      }),
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: 3,
        predictedAwayPenaltyScore: 4,
      }),
    )

    expect(result.points).toBe(3)
    expect(indicatorLabels(result)).toContain('Penales del perdedor acertados')
  })

  it('does not score knockout ties when official penalties are missing', () => {
    const result = scoreKnockoutPrediction(
      createMatch({ stage: 'Final', homeScore: 1, awayScore: 1 }),
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: 5,
        predictedAwayPenaltyScore: 4,
      }),
    )

    expect(result).toMatchObject({
      canScore: false,
      points: 0,
      reason: 'Resultado registrado incompleto',
    })
  })

  it('does not score tied official penalties', () => {
    const result = scoreKnockoutPrediction(
      createMatch({
        stage: 'Final',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 4,
      }),
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: 5,
        predictedAwayPenaltyScore: 4,
      }),
    )

    expect(result).toMatchObject({
      canScore: false,
      points: 0,
      reason: 'Resultado registrado inconsistente',
    })
  })

  it('rejects a regular draw prediction without penalties', () => {
    const result = scoreKnockoutPrediction(
      createMatch({
        stage: 'Final',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 5,
        awayPenaltyScore: 4,
      }),
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: null,
        predictedAwayPenaltyScore: null,
      }),
    )

    expect(result).toMatchObject({
      canScore: false,
      points: 0,
      reason: 'Predicción inválida',
    })
  })

  it('rejects a regular draw prediction with tied penalties', () => {
    const result = getPredictedKnockoutWinner(
      createMatch({ stage: 'Final' }),
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: 4,
        predictedAwayPenaltyScore: 4,
      }),
    )

    expect(result).toMatchObject({
      canScore: false,
      reason: 'Predicción inválida',
    })
  })

  it('routes scorePrediction to knockout scoring for knockout stages', () => {
    const result = scorePrediction(
      createMatch({ stage: 'Final', homeScore: 3, awayScore: 1 }),
      createPrediction({ predictedHomeScore: 3, predictedAwayScore: 1 }),
    )

    expect(result.points).toBe(4)
    expect(indicatorLabels(result)[0]).toBe('Clasificado acertado')
  })
})
