export const MATCH_STATUS = {
  pending: 'PENDING',
  playing: 'PLAYING',
  finished: 'FINISHED',
}

export const LEGACY_MATCH_STATUS = {
  inProgress: 'IN_PROGRESS',
}

export const MATCH_STATUS_VALUES = [
  MATCH_STATUS.pending,
  MATCH_STATUS.playing,
  MATCH_STATUS.finished,
]

export const MATCH_STATUS_LABELS = {
  [MATCH_STATUS.pending]: 'Pendiente',
  [MATCH_STATUS.playing]: 'En juego',
  [MATCH_STATUS.finished]: 'Finalizado',
}

export function normalizeMatchStatus(status) {
  if (status === LEGACY_MATCH_STATUS.inProgress) {
    return MATCH_STATUS.playing
  }

  return MATCH_STATUS_VALUES.includes(status) ? status : MATCH_STATUS.pending
}

export function getMatchStatusLabel(status) {
  return MATCH_STATUS_LABELS[normalizeMatchStatus(status)] ?? 'Estado por confirmar'
}
