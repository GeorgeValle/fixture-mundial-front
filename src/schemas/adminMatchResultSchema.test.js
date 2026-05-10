import { describe, expect, it } from 'vitest'
import { MATCH_STATUS } from '../constants/matchStatus'
import {
  buildAdminMatchUpdatePayload,
  shouldRequestPenaltyScores,
} from './adminMatchResultSchema'

const groupMatch = {
  _id: 'match-1',
  stage: 'GRUPO A',
}

const knockoutMatch = {
  _id: 'match-73',
  matchNumber: 73,
  stage: 'ROUND_OF_32',
}

describe('adminMatchResultSchema', () => {
  it('builds a clean partial payload with converted regular scores', () => {
    const result = buildAdminMatchUpdatePayload(groupMatch, {
      status: MATCH_STATUS.finished,
      homeScore: '2',
      awayScore: '1',
      homePenaltyScore: '',
      awayPenaltyScore: '',
    })

    expect(result).toEqual({
      isValid: true,
      errors: [],
      payload: {
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
      },
    })
  })

  it('requires regular scores before marking a match as finished', () => {
    const result = buildAdminMatchUpdatePayload(groupMatch, {
      status: MATCH_STATUS.finished,
      homeScore: '',
      awayScore: '',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Para finalizar un partido, completá los goles de ambos equipos.')
  })

  it('rejects negative scores and incomplete score pairs', () => {
    const negativeResult = buildAdminMatchUpdatePayload(groupMatch, {
      status: MATCH_STATUS.playing,
      homeScore: '-1',
      awayScore: '',
    })

    expect(negativeResult.isValid).toBe(false)
    expect(negativeResult.errors).toContain('Los goles deben ser números enteros iguales o mayores a 0.')

    const partialResult = buildAdminMatchUpdatePayload(groupMatch, {
      status: MATCH_STATUS.playing,
      homeScore: '1',
      awayScore: '',
    })

    expect(partialResult.isValid).toBe(false)
    expect(partialResult.errors).toContain('Completá ambos goles o dejá ambos campos vacíos.')
  })

  it('normalizes legacy IN_PROGRESS status to PLAYING in payloads', () => {
    const result = buildAdminMatchUpdatePayload(groupMatch, {
      status: 'IN_PROGRESS',
      homeScore: '0',
      awayScore: '0',
    })

    expect(result.isValid).toBe(true)
    expect(result.payload.status).toBe('PLAYING')
  })

  it('requires non-tied penalty scores for finished tied knockout matches', () => {
    const tiedPenalties = buildAdminMatchUpdatePayload(knockoutMatch, {
      status: MATCH_STATUS.finished,
      homeScore: '1',
      awayScore: '1',
      homePenaltyScore: '4',
      awayPenaltyScore: '4',
    })

    expect(tiedPenalties.isValid).toBe(false)
    expect(tiedPenalties.errors).toContain('Los penales no pueden terminar empatados.')

    const validPenalties = buildAdminMatchUpdatePayload(knockoutMatch, {
      status: MATCH_STATUS.finished,
      homeScore: '1',
      awayScore: '1',
      homePenaltyScore: '4',
      awayPenaltyScore: '3',
    })

    expect(validPenalties.isValid).toBe(true)
    expect(validPenalties.payload).toEqual({
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 1,
      homePenaltyScore: 4,
      awayPenaltyScore: 3,
    })
  })

  it('shows penalty inputs only for tied finished knockout drafts', () => {
    expect(shouldRequestPenaltyScores(knockoutMatch, {
      status: MATCH_STATUS.finished,
      homeScore: '2',
      awayScore: '2',
    })).toBe(true)

    expect(shouldRequestPenaltyScores(knockoutMatch, {
      status: MATCH_STATUS.playing,
      homeScore: '2',
      awayScore: '2',
    })).toBe(false)
  })
})
