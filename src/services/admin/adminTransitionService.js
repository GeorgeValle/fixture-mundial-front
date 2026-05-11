import { parseMatchesResponse } from '../../schemas/matchSchema'
import { parseStandingsResponse } from '../../schemas/standingsSchema'
import { axiosClient } from '../api/axiosClient'
import { logAppError } from '../errors/errorLogger'

const ADMIN_TRANSITION_MATCHES_ENDPOINT = '/api/matches'
const ADMIN_TRANSITION_STANDINGS_ENDPOINT = '/api/standings'
const ADMIN_TRANSITION_PROCESS_ENDPOINT = '/api/admin/classify-group'
const ROUND_OF_32_MATCH_NUMBER_START = 73
const ROUND_OF_32_MATCH_NUMBER_END = 88

function createAdminTransitionError(message, details = null) {
  return {
    source: 'adminTransitionService',
    message,
    status: null,
    details,
  }
}

function isRealTeam(team) {
  return Boolean(team?.name)
}

function hasRegisteredPosition(position) {
  return position !== null && position !== undefined && Number.isInteger(Number(position))
}

function isRoundOf32Match(match) {
  const matchNumber = Number(match?.matchNumber)
  const stage = String(match?.stage ?? '').trim().toUpperCase()
  const roundKey = String(match?.roundKey ?? '').trim().toLowerCase()

  return (
    (Number.isInteger(matchNumber) &&
      matchNumber >= ROUND_OF_32_MATCH_NUMBER_START &&
      matchNumber <= ROUND_OF_32_MATCH_NUMBER_END) ||
    stage === 'ROUND_OF_32' ||
    stage.includes('DIECISEISAVOS') ||
    roundKey === 'round-of-32'
  )
}

function getGroupTeamsCount(standing) {
  return Array.isArray(standing?.teams) ? standing.teams.length : 0
}

function normalizeGroup(group) {
  return String(group ?? '').trim().toUpperCase()
}

export async function getAdminTransitionStandings() {
  const response = await axiosClient.get(ADMIN_TRANSITION_STANDINGS_ENDPOINT, {
    withCredentials: true,
  })

  try {
    return parseStandingsResponse(response.data)
  } catch (error) {
    const appError = createAdminTransitionError('No pudimos interpretar la respuesta de posiciones.', {
      reason: error?.message ?? 'Invalid admin transition standings response shape',
    })

    logAppError(appError)
    throw appError
  }
}

export async function getAdminTransitionMatches() {
  const response = await axiosClient.get(ADMIN_TRANSITION_MATCHES_ENDPOINT, {
    withCredentials: true,
  })

  try {
    return parseMatchesResponse(response.data)
  } catch (error) {
    const appError = createAdminTransitionError('No pudimos interpretar la respuesta de partidos.', {
      reason: error?.message ?? 'Invalid admin transition matches response shape',
    })

    logAppError(appError)
    throw appError
  }
}

export async function processGroupTransition(group) {
  const normalizedGroup = normalizeGroup(group)

  if (!normalizedGroup) {
    const appError = createAdminTransitionError(
      'Es necesario especificar el grupo para procesar la transición.',
      { reason: 'Missing group' },
    )

    logAppError(appError)
    throw appError
  }

  const response = await axiosClient.post(
    ADMIN_TRANSITION_PROCESS_ENDPOINT,
    { group: normalizedGroup },
    { withCredentials: true },
  )

  return response.data
}

export function getTransitionReadiness({ standings = [], matches = [] } = {}) {
  const safeStandings = Array.isArray(standings) ? standings : []
  const safeMatches = Array.isArray(matches) ? matches : []
  const roundOf32Matches = safeMatches.filter(isRoundOf32Match)
  const totalStandingTeams = safeStandings.reduce(
    (total, standing) => total + getGroupTeamsCount(standing),
    0,
  )
  const teamsWithPosition = safeStandings.reduce(
    (total, standing) =>
      total +
      (standing?.teams ?? []).filter((row) => hasRegisteredPosition(row?.team?.position)).length,
    0,
  )
  const teamsMarkedRoundOf32 = safeStandings.reduce(
    (total, standing) =>
      total +
      (standing?.teams ?? []).filter((row) => row?.team?.qualifiedTo === 'ROUND_OF_32').length,
    0,
  )
  const populatedRoundOf32Slots = roundOf32Matches.reduce(
    (total, match) => total + (isRealTeam(match?.homeTeam) ? 1 : 0) + (isRealTeam(match?.awayTeam) ? 1 : 0),
    0,
  )

  return {
    groupsFound: safeStandings.length,
    groupsWithTeams: safeStandings.filter((standing) => getGroupTeamsCount(standing) > 0).length,
    totalStandingTeams,
    teamsWithPosition,
    teamsMarkedRoundOf32,
    matchesFound: safeMatches.length,
    knockoutMatchesFound: safeMatches.filter((match) => Number(match?.matchNumber) >= ROUND_OF_32_MATCH_NUMBER_START).length,
    roundOf32MatchesFound: roundOf32Matches.length,
    populatedRoundOf32Slots,
    pendingRoundOf32Slots: Math.max(roundOf32Matches.length * 2 - populatedRoundOf32Slots, 0),
    hasAnyData: safeStandings.length > 0 || safeMatches.length > 0,
    hasStandingsData: safeStandings.length > 0,
    hasRoundOf32Data: roundOf32Matches.length > 0,
  }
}
