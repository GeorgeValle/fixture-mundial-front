import { axiosClient } from '../api/axiosClient'
import { logAppError } from '../errors/errorLogger'
import { parseStandingsResponse } from '../../schemas/standingsSchema'

export async function getStandings() {
  const response = await axiosClient.get('/api/standings')

  try {
    return parseStandingsResponse(response.data)
  } catch (error) {
    const appError = {
      source: 'standingsService',
      message: 'No pudimos interpretar la respuesta de posiciones.',
      status: null,
      details: {
        reason: error?.message ?? 'Invalid standings response shape',
      },
    }

    logAppError(appError)
    throw appError
  }
}
