import { parseStandingsResponse } from '../../schemas/standingsSchema'
import { axiosClient } from '../api/axiosClient'
import { logAppError } from '../errors/errorLogger'

const ADMIN_STANDINGS_ENDPOINT = '/api/standings'
const ALLOWED_GROUPS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])

function normalizeGroup(group) {
  return String(group ?? '').trim().toUpperCase()
}

function isValidGroup(group) {
  return ALLOWED_GROUPS.has(normalizeGroup(group))
}

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

export async function recalculateAdminGroupStandings(group) {
  const normalizedGroup = normalizeGroup(group)

  if (!isValidGroup(normalizedGroup)) {
    const appError = createAdminStandingsError(
      'Es necesario especificar un grupo entre A y L para recalcular standings.',
      { reason: `Invalid group: ${String(group ?? '')}` },
    )

    logAppError(appError)
    throw appError
  }

  try {
    const response = await axiosClient.post(
      `${ADMIN_STANDINGS_ENDPOINT}/${normalizedGroup}`,
      null,
      {
        withCredentials: true,
      },
    )

    return response.data
  } catch (error) {
    const appError = createAdminStandingsError('No pudimos recalcular los standings del grupo.', {
      reason: error?.message ?? 'Error while recalculating standings for group',
    })

    logAppError(appError)
    throw appError
  }
}
