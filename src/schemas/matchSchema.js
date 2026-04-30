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

export const dailyScheduleSchema = z
  .object({
    today: matchesSchema,
    next: matchesSchema,
    nextDate: z.string().nullable().optional(),
  })
  .passthrough()

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

export function parseDailyScheduleResponse(payload) {
  const candidateSchedule = payload?.data ?? payload
  const result = dailyScheduleSchema.safeParse(candidateSchedule)

  if (!result.success) {
    throw new Error('Invalid daily schedule response shape')
  }

  return {
    today: result.data.today,
    next: result.data.next,
    nextDate: result.data.nextDate ?? null,
  }
}
