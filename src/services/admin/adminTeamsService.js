import { z } from 'zod'
import { buildAdminTeamCorrectionPayload } from '../../schemas/adminTeamCorrectionSchema'
import { axiosClient } from '../api/axiosClient'
import { logAppError } from '../errors/errorLogger'

const ADMIN_TEAMS_ENDPOINT = '/api/teams'

const nullableString = z.string().nullable().optional()
const nullableNumber = z.number().nullable().optional()

export const adminTeamSchema = z
  .object({
    _id: z.string().optional(),
    name: z.string().optional(),
    shieldUrl: nullableString,
    flagUrl: nullableString,
    group: nullableString,
    confederation: nullableString,
    position: nullableNumber,
    qualifiedTo: nullableString,
  })
  .passthrough()

export const adminTeamsSchema = z.array(adminTeamSchema)

function createAdminTeamsError(message, details = null) {
  return {
    source: 'adminTeamsService',
    message,
    status: null,
    details,
  }
}

function getTeamsCandidate(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.teams)) {
    return payload.teams
  }

  return payload?.data?.teams
}

function normalizeTeam(team) {
  return {
    ...team,
    shieldUrl: team?.shieldUrl ?? team?.flagUrl ?? null,
    position: team?.position ?? null,
    qualifiedTo: team?.qualifiedTo ?? null,
  }
}

export function parseAdminTeamsResponse(payload) {
  const candidateTeams = getTeamsCandidate(payload)
  const result = adminTeamsSchema.safeParse(candidateTeams)

  if (!result.success) {
    throw new Error('Invalid admin teams response shape')
  }

  return result.data.map(normalizeTeam)
}

export async function getAdminTeams() {
  const response = await axiosClient.get(ADMIN_TEAMS_ENDPOINT)

  try {
    return parseAdminTeamsResponse(response.data)
  } catch (error) {
    const appError = createAdminTeamsError('No pudimos interpretar la respuesta de equipos.', {
      reason: error?.message ?? 'Invalid admin teams response shape',
    })

    logAppError(appError)
    throw appError
  }
}

export async function updateAdminTeamCorrection(teamId, payload) {
  const team = { _id: teamId }
  const result = buildAdminTeamCorrectionPayload(team, payload)

  if (!result.isValid) {
    const appError = createAdminTeamsError(result.errors[0], {
      reason: 'Invalid admin team correction payload',
      errors: result.errors,
    })

    logAppError(appError)
    throw appError
  }

  const response = await axiosClient.put(`${ADMIN_TEAMS_ENDPOINT}/${teamId}`, result.payload)

  return response.data
}
