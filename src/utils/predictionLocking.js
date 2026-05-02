export const PREDICTION_LOCK_REASONS = {
  playing: 'Partido iniciado',
  finished: 'Partido finalizado',
  closed: 'Predicción cerrada',
  invalidDate: 'Fecha inválida',
}

function toValidTime(value) {
  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()

  return Number.isNaN(time) ? null : time
}

export function getPredictionLockState(match, now = new Date()) {
  if (match?.status === 'PLAYING') {
    return {
      locked: true,
      reason: PREDICTION_LOCK_REASONS.playing,
    }
  }

  if (match?.status === 'FINISHED') {
    return {
      locked: true,
      reason: PREDICTION_LOCK_REASONS.finished,
    }
  }

  const matchTime = toValidTime(match?.date)
  const nowTime = toValidTime(now)

  if (matchTime === null || nowTime === null) {
    return {
      locked: false,
      reason: PREDICTION_LOCK_REASONS.invalidDate,
    }
  }

  if (nowTime >= matchTime) {
    return {
      locked: true,
      reason: PREDICTION_LOCK_REASONS.closed,
    }
  }

  return {
    locked: false,
    reason: null,
  }
}

export function isPredictionLocked(match, now = new Date()) {
  return getPredictionLockState(match, now).locked
}

export function getPredictionLockReason(match, now = new Date()) {
  return getPredictionLockState(match, now).reason
}
