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
    ...overrides,
  }
}

const invalidScoreMessage = PREDICTION_VALIDATION_MESSAGES.invalidScores
const missingPenaltyMessage = PREDICTION_VALIDATION_MESSAGES.missingPenaltyScores

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

  it('requires penalties when a knockout prediction is a regular draw', () => {
    const result = validatePrediction(
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: null,
        predictedAwayPenaltyScore: null,
      }),
      { isKnockout: true },
    )

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(missingPenaltyMessage)
  })

  it.each([0, 1, 20, '0', '1', '20'])(
    'accepts valid penalty score %s from 0 to 20',
    (penaltyScore) => {
      const result = validatePrediction(
        createPrediction({
          predictedHomeScore: 1,
          predictedAwayScore: 1,
          predictedHomePenaltyScore: penaltyScore,
          predictedAwayPenaltyScore: 2,
        }),
        { isKnockout: true },
      )

      expect(result.isValid).toBe(true)
    },
  )

  it('rejects penalty scores greater than 20', () => {
    const result = validatePrediction(
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: 21,
        predictedAwayPenaltyScore: 2,
      }),
      { isKnockout: true },
    )

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(invalidScoreMessage)
  })

  it('rejects tied penalties in knockout predictions', () => {
    const result = validatePrediction(
      createPrediction({
        predictedHomeScore: 1,
        predictedAwayScore: 1,
        predictedHomePenaltyScore: 4,
        predictedAwayPenaltyScore: 4,
      }),
      { isKnockout: true },
    )

    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Los penales no pueden terminar empatados.')
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
