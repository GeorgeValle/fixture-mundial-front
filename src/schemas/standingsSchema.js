import { z } from 'zod'

const nullableString = z.string().nullable().optional()
const nullableNumber = z.number().nullable().optional()

export const standingTeamSchema = z
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

export const standingRowSchema = z
  .object({
    team: standingTeamSchema,
    pj: z.number(),
    pg: z.number(),
    pe: z.number(),
    pp: z.number(),
    gf: z.number(),
    gc: z.number(),
    dif: z.number(),
    pts: z.number(),
  })
  .passthrough()

export const standingGroupSchema = z
  .object({
    group: z.string(),
    teams: z.array(standingRowSchema),
  })
  .passthrough()

export const standingsResponseSchema = z
  .object({
    status: z.literal('success'),
    data: z.array(standingGroupSchema),
  })
  .passthrough()

export function parseStandingsResponse(payload) {
  const result = standingsResponseSchema.safeParse(payload)

  if (!result.success) {
    throw new Error('Invalid standings response shape')
  }

  return result.data.data
}
