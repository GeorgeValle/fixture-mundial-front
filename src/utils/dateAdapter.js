const DEFAULT_LOCALE = 'es-AR'

function toDate(value) {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)

    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  return null
}

function getMatchDate(match) {
  return toDate(match?.date)
}

export function formatDisplayDate(value, locale = DEFAULT_LOCALE) {
  const date = toDate(value)

  if (!date) {
    return 'Fecha por confirmar'
  }

  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDisplayTime(value, locale = DEFAULT_LOCALE) {
  const date = toDate(value)

  if (!date) {
    return 'Hora por confirmar'
  }

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getTodayISODate(currentDate = new Date()) {
  const date = toDate(currentDate) ?? new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function sortMatchesByDate(matches = []) {
  return [...matches].sort((firstMatch, secondMatch) => {
    const firstDate = getMatchDate(firstMatch)
    const secondDate = getMatchDate(secondMatch)

    if (!firstDate && !secondDate) {
      return 0
    }

    if (!firstDate) {
      return 1
    }

    if (!secondDate) {
      return -1
    }

    return firstDate.getTime() - secondDate.getTime()
  })
}

export function isPastMatch(match, currentDate = new Date()) {
  const matchDate = getMatchDate(match)
  const now = toDate(currentDate)

  if (!matchDate || !now) {
    return false
  }

  return matchDate.getTime() < now.getTime()
}

export function isMatchStarted(match, currentDate = new Date()) {
  const matchDate = getMatchDate(match)
  const now = toDate(currentDate)

  if (!matchDate || !now) {
    return false
  }

  return matchDate.getTime() <= now.getTime()
}
