export const SCORE_MIN_VALUE = 0
export const SCORE_MAX_VALUE = 20
export const PARTICIPANT_NAME_MIN_LENGTH = 2
export const PARTICIPANT_NAME_MAX_LENGTH = 40

export const PREDICTION_VALIDATION_MESSAGES = {
  invalidScores: 'Ingresá un número entero entre 0 y 20.',
  missingRegularScores: 'Completá ambos goles antes de guardar la predicción.',
  missingAdvancingTeam:
    'Si pronosticás empate en eliminatorias, elegí qué equipo clasifica.',
  invalidAdvancingTeam: 'El equipo clasificado debe ser local o visitante.',
  missingPenaltyScores: 'Si pronosticás empate en eliminatorias, completá los penales.',
  tiedPenaltyScores: 'Los penales no pueden terminar empatados.',
}

export const PARTICIPANT_NAME_VALIDATION_MESSAGES = {
  empty: 'Ingresá tu nombre para guardar tus predicciones',
  invalid:
    'El nombre debe tener entre 2 y 40 caracteres y solo puede incluir letras, espacios, guion medio o guion bajo.',
}

const SCORE_INPUT_PATTERN = /^(?:[0-9]|1[0-9]|20)$/
const PARTICIPANT_NAME_PATTERN = /^[\p{L} _-]+$/u
const PARTICIPANT_NAME_HAS_LETTER_PATTERN = /\p{L}/u

export function isNonNegativeInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export function parsePredictionScoreInput(value) {
  if (value === undefined || value === null || value === '') {
    return {
      status: 'empty',
      value: undefined,
    }
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= SCORE_MIN_VALUE && value <= SCORE_MAX_VALUE) {
      return {
        status: 'valid',
        value,
      }
    }

    return {
      status: 'invalid',
      value: undefined,
    }
  }

  if (typeof value !== 'string' || !SCORE_INPUT_PATTERN.test(value)) {
    return {
      status: 'invalid',
      value: undefined,
    }
  }

  return {
    status: 'valid',
    value: Number(value),
  }
}

export function isValidPredictionScore(value) {
  return parsePredictionScoreInput(value).status === 'valid'
}

export function hasRegularPredictionScores(prediction) {
  return (
    isValidPredictionScore(prediction?.predictedHomeScore) &&
    isValidPredictionScore(prediction?.predictedAwayScore)
  )
}

export function hasPenaltyPredictionScores(prediction) {
  return (
    isValidPredictionScore(prediction?.predictedHomePenaltyScore) &&
    isValidPredictionScore(prediction?.predictedAwayPenaltyScore)
  )
}

export function isRegularPredictionDraw(prediction) {
  if (!hasRegularPredictionScores(prediction)) {
    return false
  }

  return (
    parsePredictionScoreInput(prediction.predictedHomeScore).value ===
    parsePredictionScoreInput(prediction.predictedAwayScore).value
  )
}

function getScoreStatus(value) {
  return parsePredictionScoreInput(value).status
}

function hasMissingScore(...values) {
  return values.some((value) => getScoreStatus(value) === 'empty')
}

function hasInvalidScore(...values) {
  return values.some((value) => getScoreStatus(value) === 'invalid')
}

function getTeamIdentifier(team) {
  return String(team?._id ?? team?.id ?? team?.teamId ?? '').trim()
}

function getValidAdvancingTeamIds(match) {
  return [
    getTeamIdentifier(match?.homeTeam),
    getTeamIdentifier(match?.awayTeam),
  ].filter(Boolean)
}

export function normalizePredictionScores(prediction) {
  return {
    ...prediction,
    predictedHomeScore: parsePredictionScoreInput(prediction?.predictedHomeScore).value,
    predictedAwayScore: parsePredictionScoreInput(prediction?.predictedAwayScore).value,
    predictedHomePenaltyScore:
      parsePredictionScoreInput(prediction?.predictedHomePenaltyScore).status === 'valid'
        ? parsePredictionScoreInput(prediction?.predictedHomePenaltyScore).value
        : null,
    predictedAwayPenaltyScore:
      parsePredictionScoreInput(prediction?.predictedAwayPenaltyScore).status === 'valid'
        ? parsePredictionScoreInput(prediction?.predictedAwayPenaltyScore).value
        : null,
    predictedAdvancingTeamId: prediction?.predictedAdvancingTeamId ?? null,
  }
}

export function validatePrediction(prediction, options = {}) {
  const errors = []
  const isKnockout = Boolean(options.isKnockout)

  if (hasMissingScore(prediction?.predictedHomeScore, prediction?.predictedAwayScore)) {
    errors.push(PREDICTION_VALIDATION_MESSAGES.missingRegularScores)
  }

  if (hasInvalidScore(prediction?.predictedHomeScore, prediction?.predictedAwayScore)) {
    errors.push(PREDICTION_VALIDATION_MESSAGES.invalidScores)
  }

  const hasAnyPenaltyScore =
    prediction?.predictedHomePenaltyScore !== undefined ||
    prediction?.predictedAwayPenaltyScore !== undefined
  const hasNonNullPenaltyScore =
    prediction?.predictedHomePenaltyScore !== null || prediction?.predictedAwayPenaltyScore !== null

  if (
    hasAnyPenaltyScore &&
    hasNonNullPenaltyScore &&
    hasInvalidScore(prediction?.predictedHomePenaltyScore, prediction?.predictedAwayPenaltyScore)
  ) {
    errors.push(PREDICTION_VALIDATION_MESSAGES.invalidScores)
  }

  if (isKnockout && isRegularPredictionDraw(prediction)) {
    const validAdvancingTeamIds = getValidAdvancingTeamIds(options.match)
    const predictedAdvancingTeamId = String(prediction?.predictedAdvancingTeamId ?? '').trim()

    if (!predictedAdvancingTeamId) {
      errors.push(PREDICTION_VALIDATION_MESSAGES.missingAdvancingTeam)
    } else if (
      validAdvancingTeamIds.length > 0 &&
      !validAdvancingTeamIds.includes(predictedAdvancingTeamId)
    ) {
      errors.push(PREDICTION_VALIDATION_MESSAGES.invalidAdvancingTeam)
    }
  }

  return {
    isValid: errors.length === 0,
    errors: [...new Set(errors)],
  }
}

export function validateParticipantName(name) {
  const normalizedName = typeof name === 'string' ? name.trim() : ''

  if (!normalizedName) {
    return {
      isValid: false,
      normalizedName,
      error: PARTICIPANT_NAME_VALIDATION_MESSAGES.empty,
    }
  }

  const isValid =
    normalizedName.length >= PARTICIPANT_NAME_MIN_LENGTH &&
    normalizedName.length <= PARTICIPANT_NAME_MAX_LENGTH &&
    PARTICIPANT_NAME_PATTERN.test(normalizedName) &&
    PARTICIPANT_NAME_HAS_LETTER_PATTERN.test(normalizedName)

  return {
    isValid,
    normalizedName,
    error: isValid ? '' : PARTICIPANT_NAME_VALIDATION_MESSAGES.invalid,
  }
}
