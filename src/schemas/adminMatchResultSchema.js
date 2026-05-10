import { z } from 'zod'
import { LEGACY_MATCH_STATUS, MATCH_STATUS, MATCH_STATUS_VALUES, normalizeMatchStatus } from '../constants/matchStatus'

export const ADMIN_MATCH_RESULT_MESSAGES = {
  missingMatchId: 'No pudimos identificar el partido para guardar el resultado.',
  invalidStatus: 'Seleccioná un estado válido para el partido.',
  invalidScore: 'Los goles deben ser números enteros iguales o mayores a 0.',
  pairedRegularScores: 'Completá ambos goles o dejá ambos campos vacíos.',
  missingFinishedScores: 'Para finalizar un partido, completá los goles de ambos equipos.',
  missingPenaltyScores: 'Si una eliminatoria finaliza empatada, completá los penales.',
  tiedPenaltyScores: 'Los penales no pueden terminar empatados.',
}

const adminScoreSchema = z.number().int().nonnegative()

function hasMatchId(match) {
  return typeof match?._id === 'string' && match._id.trim().length > 0
}

export function isKnockoutMatch(match) {
  if (typeof match?.matchNumber === 'number' && match.matchNumber >= 73) {
    return true
  }

  const normalizedStage = String(match?.stage ?? '').trim().toUpperCase()
  return Boolean(normalizedStage && !normalizedStage.startsWith('GRUPO '))
}

export function parseAdminScoreInput(value) {
  if (value === undefined || value === null || value === '') {
    return { status: 'empty', value: undefined }
  }

  if (typeof value === 'string' && value.trim() === '') {
    return { status: 'empty', value: undefined }
  }

  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) {
    return { status: 'invalid', value: undefined }
  }

  const numericValue = typeof value === 'number' ? value : Number(value)
  const result = adminScoreSchema.safeParse(numericValue)

  if (!result.success) {
    return { status: 'invalid', value: undefined }
  }

  return { status: 'valid', value: result.data }
}

function hasInvalidScore(...scores) {
  return scores.some((score) => score.status === 'invalid')
}


function hasValidScorePair(homeScore, awayScore) {
  return homeScore.status === 'valid' && awayScore.status === 'valid'
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  )
}

export function shouldRequestPenaltyScores(match, draft) {
  const status = normalizeMatchStatus(draft?.status)
  const homeScore = parseAdminScoreInput(draft?.homeScore)
  const awayScore = parseAdminScoreInput(draft?.awayScore)

  return (
    status === MATCH_STATUS.finished &&
    isKnockoutMatch(match) &&
    hasValidScorePair(homeScore, awayScore) &&
    homeScore.value === awayScore.value
  )
}

export function buildAdminMatchUpdatePayload(match, draft) {
  const errors = []

  if (!hasMatchId(match)) {
    errors.push(ADMIN_MATCH_RESULT_MESSAGES.missingMatchId)
  }

  const statusCandidate = draft?.status === LEGACY_MATCH_STATUS.inProgress
    ? MATCH_STATUS.playing
    : draft?.status
  const status = normalizeMatchStatus(statusCandidate)
  if (!MATCH_STATUS_VALUES.includes(statusCandidate)) {
    errors.push(ADMIN_MATCH_RESULT_MESSAGES.invalidStatus)
  }

  const homeScore = parseAdminScoreInput(draft?.homeScore)
  const awayScore = parseAdminScoreInput(draft?.awayScore)
  const homePenaltyScore = parseAdminScoreInput(draft?.homePenaltyScore)
  const awayPenaltyScore = parseAdminScoreInput(draft?.awayPenaltyScore)

  if (hasInvalidScore(homeScore, awayScore, homePenaltyScore, awayPenaltyScore)) {
    errors.push(ADMIN_MATCH_RESULT_MESSAGES.invalidScore)
  }

  const hasOneRegularScore =
    (homeScore.status === 'valid' && awayScore.status === 'empty') ||
    (homeScore.status === 'empty' && awayScore.status === 'valid')
  if (hasOneRegularScore) {
    errors.push(ADMIN_MATCH_RESULT_MESSAGES.pairedRegularScores)
  }

  if (status === MATCH_STATUS.finished && !hasValidScorePair(homeScore, awayScore)) {
    errors.push(ADMIN_MATCH_RESULT_MESSAGES.missingFinishedScores)
  }

  const needsPenalties =
    status === MATCH_STATUS.finished &&
    isKnockoutMatch(match) &&
    hasValidScorePair(homeScore, awayScore) &&
    homeScore.value === awayScore.value

  if (needsPenalties) {
    if (!hasValidScorePair(homePenaltyScore, awayPenaltyScore)) {
      errors.push(ADMIN_MATCH_RESULT_MESSAGES.missingPenaltyScores)
    } else if (homePenaltyScore.value === awayPenaltyScore.value) {
      errors.push(ADMIN_MATCH_RESULT_MESSAGES.tiedPenaltyScores)
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors: [...new Set(errors)],
      payload: null,
    }
  }

  const payload = cleanPayload({
    status,
    homeScore: homeScore.value,
    awayScore: awayScore.value,
    homePenaltyScore: needsPenalties ? homePenaltyScore.value : undefined,
    awayPenaltyScore: needsPenalties ? awayPenaltyScore.value : undefined,
  })

  return {
    isValid: true,
    errors: [],
    payload,
  }
}
