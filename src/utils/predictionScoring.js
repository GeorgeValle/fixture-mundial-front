import {
  hasPenaltyPredictionScores,
  hasRegularPredictionScores,
  isNonNegativeInteger,
  isRegularPredictionDraw,
  validatePrediction,
} from './predictionValidation'

const SCORE_REASONS = {
  missingOfficialResult: 'Resultado oficial incompleto',
  matchNotFinished: 'Partido no finalizado',
  invalidOfficialResult: 'Resultado oficial inconsistente',
  invalidPrediction: 'Predicción inválida',
}

const INDICATORS = {
  winner: { key: 'winner', label: 'Ganador acertado' },
  qualifier: { key: 'qualifier', label: 'Clasificado acertado' },
  draw: { key: 'draw', label: 'Empate acertado' },
  winnerGoals: { key: 'winnerGoals', label: 'Goles del ganador acertados' },
  loserGoals: { key: 'loserGoals', label: 'Goles del perdedor acertados' },
  drawGoals: { key: 'drawGoals', label: 'Goles del empate acertados' },
  winnerPenalties: { key: 'winnerPenalties', label: 'Penales del ganador acertados' },
  loserPenalties: { key: 'loserPenalties', label: 'Penales del perdedor acertados' },
}

const KNOCKOUT_STAGE_ALIASES = new Set([
  'round of 32',
  'round of 16',
  'dieciseisavos de final',
  'octavos de final',
  'quarter finals',
  'quarterfinals',
  'cuartos de final',
  'semi finals',
  'semifinals',
  'semifinales',
  'third place',
  'third place match',
  'partido por el tercer puesto',
  'final',
])

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function createScoreResult({ points = 0, indicators = [], canScore = true, reason = null } = {}) {
  return {
    points,
    indicators,
    canScore,
    reason,
  }
}

function createIndicator(indicator) {
  return {
    ...indicator,
    matched: true,
  }
}

function addMatchedIndicator(score, indicator, points) {
  score.points += points
  score.indicators.push(createIndicator(indicator))
}

function getSideScore(match, side) {
  return side === 'home' ? match.homeScore : match.awayScore
}

function getSidePenaltyScore(match, side) {
  return side === 'home' ? match.homePenaltyScore : match.awayPenaltyScore
}

function getPredictedSideScore(prediction, side) {
  return side === 'home' ? prediction.predictedHomeScore : prediction.predictedAwayScore
}

function getPredictedSidePenaltyScore(prediction, side) {
  return side === 'home'
    ? prediction.predictedHomePenaltyScore
    : prediction.predictedAwayPenaltyScore
}

function getOppositeSide(side) {
  return side === 'home' ? 'away' : 'home'
}

function hasOfficialRegularScores(match) {
  return isNonNegativeInteger(match?.homeScore) && isNonNegativeInteger(match?.awayScore)
}

function hasOfficialPenaltyScores(match) {
  return isNonNegativeInteger(match?.homePenaltyScore) && isNonNegativeInteger(match?.awayPenaltyScore)
}

function getRegularWinnerSide(homeScore, awayScore) {
  if (homeScore > awayScore) {
    return 'home'
  }

  if (awayScore > homeScore) {
    return 'away'
  }

  return null
}

export function getPredictionStageType(match) {
  const normalizedStage = normalizeText(match?.stage ?? match?.round ?? match?.roundKey)

  if (KNOCKOUT_STAGE_ALIASES.has(normalizedStage)) {
    return 'knockout'
  }

  return 'group'
}

export function hasSufficientOfficialResult(match) {
  return match?.status === 'FINISHED' && hasOfficialRegularScores(match)
}

export function getOfficialResult(match) {
  if (match?.status !== 'FINISHED') {
    return {
      canScore: false,
      reason: SCORE_REASONS.matchNotFinished,
    }
  }

  if (!hasOfficialRegularScores(match)) {
    return {
      canScore: false,
      reason: SCORE_REASONS.missingOfficialResult,
    }
  }

  const regularWinnerSide = getRegularWinnerSide(match.homeScore, match.awayScore)

  return {
    canScore: true,
    reason: null,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homePenaltyScore: isNonNegativeInteger(match.homePenaltyScore) ? match.homePenaltyScore : null,
    awayPenaltyScore: isNonNegativeInteger(match.awayPenaltyScore) ? match.awayPenaltyScore : null,
    isDraw: regularWinnerSide === null,
    regularWinnerSide,
  }
}

export function getOfficialKnockoutWinner(match) {
  const officialResult = getOfficialResult(match)

  if (!officialResult.canScore) {
    return officialResult
  }

  if (officialResult.regularWinnerSide) {
    return {
      canScore: true,
      reason: null,
      winnerSide: officialResult.regularWinnerSide,
      loserSide: getOppositeSide(officialResult.regularWinnerSide),
      method: 'regular',
    }
  }

  if (!hasOfficialPenaltyScores(match)) {
    return {
      canScore: false,
      reason: SCORE_REASONS.missingOfficialResult,
    }
  }

  if (match.homePenaltyScore === match.awayPenaltyScore) {
    return {
      canScore: false,
      reason: SCORE_REASONS.invalidOfficialResult,
    }
  }

  const winnerSide = match.homePenaltyScore > match.awayPenaltyScore ? 'home' : 'away'

  return {
    canScore: true,
    reason: null,
    winnerSide,
    loserSide: getOppositeSide(winnerSide),
    method: 'penalties',
  }
}

export function getPredictedKnockoutWinner(match, prediction) {
  const validation = validatePrediction(prediction, { isKnockout: true })

  if (!validation.isValid) {
    return {
      canScore: false,
      reason: SCORE_REASONS.invalidPrediction,
      errors: validation.errors,
    }
  }

  if (prediction.predictedHomeScore > prediction.predictedAwayScore) {
    return {
      canScore: true,
      reason: null,
      winnerSide: 'home',
      loserSide: 'away',
      method: 'regular',
    }
  }

  if (prediction.predictedAwayScore > prediction.predictedHomeScore) {
    return {
      canScore: true,
      reason: null,
      winnerSide: 'away',
      loserSide: 'home',
      method: 'regular',
    }
  }

  const winnerSide =
    prediction.predictedHomePenaltyScore > prediction.predictedAwayPenaltyScore ? 'home' : 'away'

  return {
    canScore: true,
    reason: null,
    winnerSide,
    loserSide: getOppositeSide(winnerSide),
    method: 'penalties',
  }
}

export function scoreGroupPrediction(match, prediction) {
  const officialResult = getOfficialResult(match)

  if (!officialResult.canScore) {
    return createScoreResult({ canScore: false, reason: officialResult.reason })
  }

  if (!hasRegularPredictionScores(prediction)) {
    return createScoreResult({ canScore: false, reason: SCORE_REASONS.invalidPrediction })
  }

  const score = createScoreResult()
  const predictedWinnerSide = getRegularWinnerSide(
    prediction.predictedHomeScore,
    prediction.predictedAwayScore,
  )

  if (officialResult.isDraw) {
    if (predictedWinnerSide === null) {
      addMatchedIndicator(score, INDICATORS.draw, 1)
    }

    if (
      predictedWinnerSide === null &&
      prediction.predictedHomeScore === officialResult.homeScore &&
      prediction.predictedAwayScore === officialResult.awayScore
    ) {
      addMatchedIndicator(score, INDICATORS.drawGoals, 1)
    }

    return score
  }

  const officialWinnerSide = officialResult.regularWinnerSide
  const officialLoserSide = getOppositeSide(officialWinnerSide)

  if (predictedWinnerSide === officialWinnerSide) {
    addMatchedIndicator(score, INDICATORS.winner, 1)
  }

  if (getPredictedSideScore(prediction, officialWinnerSide) === getSideScore(match, officialWinnerSide)) {
    addMatchedIndicator(score, INDICATORS.winnerGoals, 2)
  }

  if (getPredictedSideScore(prediction, officialLoserSide) === getSideScore(match, officialLoserSide)) {
    addMatchedIndicator(score, INDICATORS.loserGoals, 1)
  }

  return score
}

export function scoreKnockoutPrediction(match, prediction) {
  const officialWinner = getOfficialKnockoutWinner(match)

  if (!officialWinner.canScore) {
    return createScoreResult({ canScore: false, reason: officialWinner.reason })
  }

  const predictedWinner = getPredictedKnockoutWinner(match, prediction)

  if (!predictedWinner.canScore) {
    return createScoreResult({
      canScore: false,
      reason: predictedWinner.reason,
      indicators: [],
    })
  }

  const score = createScoreResult()

  if (predictedWinner.winnerSide === officialWinner.winnerSide) {
    addMatchedIndicator(score, INDICATORS.qualifier, 2)
  }

  if (officialWinner.method === 'regular') {
    if (
      getPredictedSideScore(prediction, officialWinner.winnerSide) ===
      getSideScore(match, officialWinner.winnerSide)
    ) {
      addMatchedIndicator(score, INDICATORS.winnerGoals, 1)
    }

    if (
      getPredictedSideScore(prediction, officialWinner.loserSide) ===
      getSideScore(match, officialWinner.loserSide)
    ) {
      addMatchedIndicator(score, INDICATORS.loserGoals, 1)
    }

    return score
  }

  if (isRegularPredictionDraw(prediction)) {
    addMatchedIndicator(score, INDICATORS.draw, 1)

    if (
      prediction.predictedHomeScore === match.homeScore &&
      prediction.predictedAwayScore === match.awayScore
    ) {
      addMatchedIndicator(score, INDICATORS.drawGoals, 1)
    }
  }

  if (
    hasPenaltyPredictionScores(prediction) &&
    getPredictedSidePenaltyScore(prediction, officialWinner.winnerSide) ===
      getSidePenaltyScore(match, officialWinner.winnerSide)
  ) {
    addMatchedIndicator(score, INDICATORS.winnerPenalties, 1)
  }

  if (
    hasPenaltyPredictionScores(prediction) &&
    getPredictedSidePenaltyScore(prediction, officialWinner.loserSide) ===
      getSidePenaltyScore(match, officialWinner.loserSide)
  ) {
    addMatchedIndicator(score, INDICATORS.loserPenalties, 1)
  }

  return score
}

export function scorePrediction(match, prediction) {
  if (getPredictionStageType(match) === 'knockout') {
    return scoreKnockoutPrediction(match, prediction)
  }

  return scoreGroupPrediction(match, prediction)
}
