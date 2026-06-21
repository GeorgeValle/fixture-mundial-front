import { axiosClient } from '../api/axiosClient'
import { logAppError } from '../errors/errorLogger'
import { parseDailyScheduleResponse, parseMatchesResponse } from '../../schemas/matchSchema'
import { getBrowserDayUtcRange } from '../../utils/dateAdapter'

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

export async function getDailySchedule(currentDate) {
  const { start, end } = getBrowserDayUtcRange(currentDate)
  const response = await axiosClient.get('/api/matches/schedule/daily', {
    params: { start, end },
  })

  try {
    return parseDailyScheduleResponse(response.data)
  } catch (error) {
    const appError = {
      source: 'matchesService',
      message: 'No pudimos interpretar la respuesta del calendario diario.',
      status: null,
      details: {
        reason: error?.message ?? 'Invalid daily schedule response shape',
      },
    }

    logAppError(appError)
    throw appError
  }
}
