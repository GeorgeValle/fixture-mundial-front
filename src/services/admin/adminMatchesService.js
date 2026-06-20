import { parseMatchesResponse } from '../../schemas/matchSchema'
import { axiosClient } from '../api/axiosClient'
import { logAppError } from '../errors/errorLogger'

const ADMIN_MATCHES_ENDPOINT = '/api/matches'

function createAdminMatchesError(message, details = null) {
  return {
    source: 'adminMatchesService',
    message,
    status: null,
    details,
  }
}

export async function getAdminMatches() {
  const response = await axiosClient.get(ADMIN_MATCHES_ENDPOINT)

  try {
    return parseMatchesResponse(response.data)
  } catch (error) {
    const appError = createAdminMatchesError('No pudimos interpretar la respuesta de partidos.', {
      reason: error?.message ?? 'Invalid admin matches response shape',
    })

    logAppError(appError)
    throw appError
  }
}

export async function updateAdminMatch(matchId, payload) {
  if (!matchId) {
    const appError = createAdminMatchesError('No pudimos identificar el partido para guardar el resultado.', {
      reason: 'Missing match id',
    })

    logAppError(appError)
    throw appError
  }

  const cleanPayload = Object.fromEntries(
    Object.entries(payload ?? {}).filter(([, value]) => value !== undefined && value !== ''),
  )

  const response = await axiosClient.put(`${ADMIN_MATCHES_ENDPOINT}/${matchId}`, cleanPayload)

  return response.data
}
