import { parseStandingsResponse } from '../../schemas/standingsSchema'
import { axiosClient } from '../api/axiosClient'
import { logAppError } from '../errors/errorLogger'

const ADMIN_STANDINGS_ENDPOINT = '/api/standings'

function createAdminStandingsError(message, details = null) {
  return {
    source: 'adminStandingsService',
    message,
    status: null,
    details,
  }
}

export async function getAdminStandings() {
  const response = await axiosClient.get(ADMIN_STANDINGS_ENDPOINT, {
    withCredentials: true,
  })

  try {
    return parseStandingsResponse(response.data)
  } catch (error) {
    const appError = createAdminStandingsError('No pudimos interpretar la respuesta de posiciones.', {
      reason: error?.message ?? 'Invalid admin standings response shape',
    })

    logAppError(appError)
    throw appError
  }
}

export const ADMIN_STANDINGS_RECALCULATION_STATUS = {
  isConfirmed: false,
  message: 'Endpoint de recálculo pendiente de confirmación',
}
