import { axiosClient } from '../api/axiosClient'
import { logAppError } from '../errors/errorLogger'
import { parseMatchesResponse } from '../../schemas/matchSchema'

export async function getMatches() {
  const response = await axiosClient.get('/api/matches')

  try {
    return parseMatchesResponse(response.data)
  } catch (error) {
    const appError = {
      source: 'matchesService',
      message: 'No pudimos interpretar la respuesta de partidos.',
      status: null,
      details: {
        reason: error?.message ?? 'Invalid matches response shape',
      },
    }

    logAppError(appError)
    throw appError
  }
}
