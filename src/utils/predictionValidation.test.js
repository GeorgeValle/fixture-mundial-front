import { describe, expect, it } from 'vitest'
import {
  PREDICTION_VALIDATION_MESSAGES,
  validateParticipantName,
  validatePrediction,
} from './predictionValidation'

function createPrediction(overrides = {}) {
  return {
    predictedHomeScore: 1,
    predictedAwayScore: 0,
    predictedHomePenaltyScore: null,
    predictedAwayPenaltyScore: null,
    predictedAdvancingTeamId: null,
    ...overrides,
  }
}

const invalidScoreMessage = PREDICTION_VALIDATION_MESSAGES.invalidScores
const missingAdvancingTeamMessage = PREDICTION_VALIDATION_MESSAGES.missingAdvancingTeam
const invalidAdvancingTeamMessage = PREDICTION_VALIDATION_MESSAGES.invalidAdvancingTeam
const knockoutMatch = {
  homeTeam: { _id: 'team-home', name: 'Argentina' },
  awayTeam: { _id: 'team-away', name: 'Francia' },
}

describe('predictionValidation', () => {
  it.each([0, 1, 2, 20, '0', '1', '2', '20'])(
    'accepts valid integer score %s from 0 to 20',
    (score) => {
      const result = validatePrediction(
        createPrediction({ predictedHomeScore: score, predictedAwayScore: 0 }),
      )

      expect(result.isValid).toBe(true)
    },
  )

  it.each([-1, 21, 1.5, '21', '-1', '1.5', 'e', 'E', '1e2', '+2', '--1', 'abc', ' 2'])(
    'marks invalid score %s as invalid',
    (score) => {
      const result = validatePrediction(createPrediction({ predictedHomeScore: score }))

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(invalidScoreMessage)
    },
  )

  it('requires both regular scores before saving a prediction', () => {
    const result = validatePrediction(createPrediction({ predictedAwayScore: '' }))

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      PREDICTION_VALIDATION_MESSAGES.missingRegularScores,
    )
  })

  it('keeps penalties optional when a knockout prediction is not a regular draw', () => {
    const result = validatePrediction(createPrediction({ predictedHomeScore: 2 }), {
      isKnockout: true,
    })

    expect(result.isValid).toBe(true)
  })

  it('requires an advancing team when a knockout prediction is a regular draw', () => {
    const result = validatePrediction(
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
      }),
      { isKnockout: true, match: knockoutMatch },
    )

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(missingAdvancingTeamMessage)
  })

  it('accepts a valid advancing team for a knockout regular draw', () => {
    const result = validatePrediction(
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedAdvancingTeamId: 'team-away',
      }),
      { isKnockout: true, match: knockoutMatch },
    )

    expect(result.isValid).toBe(true)
  })

  it('rejects an advancing team that is not home or away', () => {
    const result = validatePrediction(
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedAdvancingTeamId: 'team-other',
      }),
      { isKnockout: true, match: knockoutMatch },
    )

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(invalidAdvancingTeamMessage)
  })

  it('does not require an advancing team for group-stage draws', () => {
    const result = validatePrediction(
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
      }),
    )

    expect(result.isValid).toBe(true)
  })

  it.each(['Jorge', 'María José', 'Ana-Luz', 'Juan_Pablo', 'Guillermo Valle', 'José Núñez'])(
    'accepts valid participant name %s',
    (name) => {
      const result = validateParticipantName(`  ${name}  `)

      expect(result.isValid).toBe(true)
      expect(result.normalizedName).toBe(name)
    },
  )

  it.each(['', '   '])('rejects empty participant name %s', (name) => {
    const result = validateParticipantName(name)

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Ingresá tu nombre para guardar tus predicciones')
  })

  it.each(['A', 'Jorge123', 'Jorge!', 'Jorge.', '@Jorge', 'Jorge/Valle', '😀Jorge', 'A'.repeat(41)])(
    'rejects invalid participant name %s',
    (name) => {
      const result = validateParticipantName(name)

      expect(result.isValid).toBe(false)
      expect(result.error).toBe(
        'El nombre debe tener entre 2 y 40 caracteres y solo puede incluir letras, espacios, guion medio o guion bajo.',
      )
    },
  )
})
