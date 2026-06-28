import { z } from 'zod'

export const PREDICTION_STORAGE_VERSION = 1

const predictionScore = z.number().int().min(0).max(20)
const optionalPenaltyScore = predictionScore.nullable().optional()
const optionalAdvancingTeamId = z.string().min(1).nullable().optional()

export const predictionSchema = z
  .object({
    matchId: z.string().min(1),
    predictedHomeScore: predictionScore,
    predictedAwayScore: predictionScore,
    predictedHomePenaltyScore: optionalPenaltyScore,
    predictedAwayPenaltyScore: optionalPenaltyScore,
    predictedAdvancingTeamId: optionalAdvancingTeamId,
    updatedAt: z.string().min(1),
  })
  .strip()

export const predictionsRecordSchema = z.record(z.string(), predictionSchema)

export const predictionsStorageSchema = z
  .object({
    version: z.literal(PREDICTION_STORAGE_VERSION),
    userName: z.string().default(''),
    predictions: predictionsRecordSchema.default({}),
  })
  .strip()

export function createEmptyPredictionsStorage() {
  return {
    version: PREDICTION_STORAGE_VERSION,
    userName: '',
    predictions: {},
  }
}

export function parsePredictionsStorage(payload) {
  const result = predictionsStorageSchema.safeParse(payload)

  if (!result.success) {
    throw new Error('Invalid predictions storage shape')
  }

  return result.data
}
