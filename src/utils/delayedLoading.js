export const DELAYED_LOADING_THRESHOLD_MS = 7000

function toTimestamp(value) {
  if (value instanceof Date) {
    return value.getTime()
  }

  if (typeof value === 'string') {
    return new Date(value).getTime()
  }

  return Number(value)
}

export function shouldShowDelayedLoading(startedAt, currentDate = new Date()) {
  const startTime = toTimestamp(startedAt)
  const currentTime = toTimestamp(currentDate)

  if (!Number.isFinite(startTime) || !Number.isFinite(currentTime)) {
    return false
  }

  return currentTime - startTime >= DELAYED_LOADING_THRESHOLD_MS
}
