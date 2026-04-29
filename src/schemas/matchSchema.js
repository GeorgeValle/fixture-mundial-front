import { z } from 'zod'

const nullableString = z.string().nullable().optional()
const nullableNumber = z.number().nullable().optional()

export const teamSchema = z
  .object({
    _id: z.string().optional(),
    name: z.string().optional(),
    shieldUrl: nullableString,
    group: nullableString,
    confederation: nullableString,
    position: nullableNumber,
    qualifiedTo: nullableString,
  })
  .passthrough()
  .nullable()
  .optional()

export const stadiumSchema = z
  .object({
    _id: z.string().optional(),
    name: z.string().optional(),
    country: nullableString,
    city: nullableString,
    address: nullableString,
    capacity: nullableNumber,
  })
  .passthrough()
  .nullable()
  .optional()

export const matchSchema = z
  .object({
    _id: z.string().optional(),
    homeTeam: teamSchema,
    awayTeam: teamSchema,
    stadium: stadiumSchema,
    date: z.string().nullable().optional(),
    stage: z.string().optional(),
    status: z.string().optional(),
    homeScore: nullableNumber,
    awayScore: nullableNumber,
    homePenaltyScore: nullableNumber,
    awayPenaltyScore: nullableNumber,
  })
  .passthrough()

export const matchesSchema = z.array(matchSchema)

export function parseMatchesResponse(payload) {
  const candidateMatches = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : payload?.matches
  const result = matchesSchema.safeParse(candidateMatches)

  if (!result.success) {
    throw new Error('Invalid matches response shape')
  }

  return result.data
}
