import { beforeEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import {
  loadPredictionsStorage,
  removePrediction,
  resetPredictionsStorage,
  savePrediction,
  savePredictionsStorage,
  saveUserName,
} from './predictionStorageService'

const basePrediction = {
  predictedHomeScore: 2,
  predictedAwayScore: 1,
  predictedHomePenaltyScore: null,
  predictedAwayPenaltyScore: null,
  updatedAt: '2026-06-11T12:00:00.000Z',
}

describe('predictionStorageService', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('loads an empty safe state when localStorage has no predictions', () => {
    const result = loadPredictionsStorage()

    expect(result).toMatchObject({
      status: 'empty',
      warning: null,
      isCorrupt: false,
      data: {
        version: 1,
        userName: '',
        predictions: {},
      },
    })
  })

  it('saves and recovers a trimmed userName', () => {
    saveUserName('  Yorch  ')

    const result = loadPredictionsStorage()

    expect(result.status).toBe('loaded')
    expect(result.data.userName).toBe('Yorch')
  })

  it('saves and recovers a prediction indexed by matchId', () => {
    savePrediction('match-1', basePrediction)

    const result = loadPredictionsStorage()

    expect(result.data.predictions['match-1']).toEqual({
      matchId: 'match-1',
      ...basePrediction,
    })
  })

  it('does not store official results or derived scoring data', () => {
    savePrediction('match-1', {
      ...basePrediction,
      officialHomeScore: 5,
      officialAwayScore: 0,
      points: 99,
      indicators: [{ key: 'winner' }],
    })

    const result = loadPredictionsStorage()
    const savedPrediction = result.data.predictions['match-1']

    expect(savedPrediction).not.toHaveProperty('officialHomeScore')
    expect(savedPrediction).not.toHaveProperty('officialAwayScore')
    expect(savedPrediction).not.toHaveProperty('points')
    expect(savedPrediction).not.toHaveProperty('indicators')
  })

  it('handles corrupt localStorage without crashing', () => {
    window.localStorage.setItem(STORAGE_KEYS.predictions, '{bad-json')

    const result = loadPredictionsStorage()

    expect(result.status).toBe('corrupt')
    expect(result.isCorrupt).toBe(true)
    expect(result.warning).toBe('No pudimos leer tus predicciones guardadas.')
    expect(result.data.predictions).toEqual({})
  })

  it('allows guided reset of storage', () => {
    savePrediction('match-1', basePrediction)

    const result = resetPredictionsStorage()

    expect(result.status).toBe('reset')
    expect(loadPredictionsStorage().data.predictions).toEqual({})
  })

  it('validates the storage version', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.predictions,
      JSON.stringify({ version: 99, userName: 'Yorch', predictions: {} }),
    )

    const result = loadPredictionsStorage()

    expect(result.status).toBe('corrupt')
    expect(result.data.version).toBe(1)
  })

  it('removes a prediction by matchId', () => {
    savePrediction('match-1', basePrediction)
    savePrediction('match-2', { ...basePrediction, predictedHomeScore: 0 })

    removePrediction('match-1')

    const result = loadPredictionsStorage()
    expect(result.data.predictions).not.toHaveProperty('match-1')
    expect(result.data.predictions).toHaveProperty('match-2')
  })

  it('returns an error state instead of throwing when saving invalid data', () => {
    const result = savePredictionsStorage({
      version: 1,
      userName: 'Yorch',
      predictions: {
        'match-1': {
          matchId: 'match-1',
          predictedHomeScore: -1,
          predictedAwayScore: 0,
          updatedAt: '2026-06-11T12:00:00.000Z',
        },
      },
    })

    expect(result.status).toBe('error')
    expect(result.warning).toBe('No pudimos guardar tus predicciones.')
  })
})
