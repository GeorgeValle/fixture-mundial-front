import { describe, expect, it } from 'vitest'
import {
  getPredictionLockReason,
  getPredictionLockState,
  isPredictionLocked,
} from './predictionLocking'

function createMatch(overrides = {}) {
  return {
    status: 'PENDING',
    date: '2026-06-11T21:00:00.000Z',
    ...overrides,
  }
}

describe('predictionLocking', () => {
  it('keeps PENDING matches editable before kickoff', () => {
    const match = createMatch()
    const now = '2026-06-11T20:59:59.000Z'

    expect(isPredictionLocked(match, now)).toBe(false)
    expect(getPredictionLockReason(match, now)).toBeNull()
  })

  it('locks PENDING matches when now is equal or after match date', () => {
    const match = createMatch()

    expect(isPredictionLocked(match, '2026-06-11T21:00:00.000Z')).toBe(true)
    expect(getPredictionLockReason(match, '2026-06-11T21:00:00.000Z')).toBe(
      'Predicción cerrada',
    )
    expect(isPredictionLocked(match, '2026-06-11T21:00:01.000Z')).toBe(true)
  })

  it('locks PLAYING matches', () => {
    const match = createMatch({ status: 'PLAYING' })

    expect(isPredictionLocked(match, '2026-06-11T20:00:00.000Z')).toBe(true)
    expect(getPredictionLockReason(match, '2026-06-11T20:00:00.000Z')).toBe(
      'Partido iniciado',
    )
  })

  it('locks FINISHED matches', () => {
    const match = createMatch({ status: 'FINISHED' })

    expect(isPredictionLocked(match, '2026-06-11T20:00:00.000Z')).toBe(true)
    expect(getPredictionLockReason(match, '2026-06-11T20:00:00.000Z')).toBe(
      'Partido finalizado',
    )
  })

  it('does not crash with invalid dates and falls back to status', () => {
    const state = getPredictionLockState(createMatch({ date: 'not-a-date' }), 'invalid-now')

    expect(state.locked).toBe(false)
    expect(state.reason).toBe('Fecha inválida')
  })
})
