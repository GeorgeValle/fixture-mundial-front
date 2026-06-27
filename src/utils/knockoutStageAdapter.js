import { KNOCKOUT_ROUNDS, knockoutStageSkeleton } from '../data/knockoutStageSkeleton'

const TECHNICAL_STATUS_LABELS = {
  PENDING: 'Resultado pendiente',
  PLAYING: 'En juego',
  FINISHED: 'Finalizado',
}

const STADIUM_DISPLAY_NAMES = new Map([
  ['los angeles', 'Estadio Los Ángeles'],
  ['boston', 'Estadio Boston'],
  ['monterrey', 'Estadio Monterrey'],
  ['houston', 'Estadio Houston'],
  ['new york new jersey', 'Estadio Nueva York Nueva Jersey'],
  ['dallas', 'Estadio Dallas'],
  ['mexico city', 'Estadio Ciudad de México'],
  ['atlanta', 'Estadio Atlanta'],
  ['san francisco bay area', 'Estadio Área de la Bahía de San Francisco'],
  ['seattle', 'Estadio Seattle'],
  ['toronto', 'Estadio Toronto'],
  ['miami', 'Estadio Miami'],
  ['kansas city', 'Estadio Kansas City'],
  ['philadelphia', 'Estadio Filadelfia'],
])

const ROUND_KEY_ALIASES = new Map([
  ['round of 32', 'round-of-32'],
  ['round of thirty two', 'round-of-32'],
  ['dieciseisavos de final', 'round-of-32'],
  ['dieciseisavos', 'round-of-32'],
  ['16avos', 'round-of-32'],
  ['16 avos', 'round-of-32'],
  ['round of 16', 'round-of-16'],
  ['octavos de final', 'round-of-16'],
  ['octavos', 'round-of-16'],
  ['quarter finals', 'quarter-finals'],
  ['quarterfinals', 'quarter-finals'],
  ['cuartos de final', 'quarter-finals'],
  ['cuartos', 'quarter-finals'],
  ['semi finals', 'semi-finals'],
  ['semifinals', 'semi-finals'],
  ['semifinales', 'semi-finals'],
  ['third place', 'third-place'],
  ['third place match', 'third-place'],
  ['partido por el tercer puesto', 'third-place'],
  ['tercer puesto', 'third-place'],
  ['final', 'final'],
])

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function toStringValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

export function normalizeMatchText(value) {
  return toStringValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(stadium|estadio)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizeRoundText(value) {
  return toStringValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-_/]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toDateKey(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return ''
  }

  const dateMatch = value.match(/\d{4}-\d{2}-\d{2}/)

  if (dateMatch) {
    return dateMatch[0]
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toISOString().slice(0, 10)
}

function getBackendRoundKey(match) {
  const directRoundKey = normalizeRoundText(match?.roundKey)
  if (ROUND_KEY_ALIASES.has(directRoundKey)) {
    return ROUND_KEY_ALIASES.get(directRoundKey)
  }

  const directRound = normalizeRoundText(match?.round)
  if (ROUND_KEY_ALIASES.has(directRound)) {
    return ROUND_KEY_ALIASES.get(directRound)
  }

  const stage = normalizeRoundText(match?.stage)
  if (ROUND_KEY_ALIASES.has(stage)) {
    return ROUND_KEY_ALIASES.get(stage)
  }

  return ''
}

function getBackendMatchNumber(match) {
  const candidates = [match?.matchNumber, match?.number, match?.matchNo]

  for (const candidate of candidates) {
    const numericValue = Number(candidate)

    if (Number.isInteger(numericValue)) {
      return numericValue
    }
  }

  const templateCodeMatch = toStringValue(match?.templateCode ?? match?.code).match(/KO[-_ ]?(\d+)/i)
  if (templateCodeMatch) {
    return Number(templateCodeMatch[1])
  }

  return null
}

function getExplicitBackendMatchNumber(match) {
  const candidates = [match?.matchNumber, match?.number, match?.matchNo]

  for (const candidate of candidates) {
    const numericValue = Number(candidate)

    if (Number.isInteger(numericValue)) {
      return numericValue
    }
  }

  return null
}

function getBackendTemplateCode(match) {
  const templateCode = toStringValue(match?.templateCode ?? match?.code).trim()

  if (templateCode) {
    return templateCode.toUpperCase().replace(/\s+/g, '-')
  }

  const matchNumber = getBackendMatchNumber(match)
  return matchNumber ? `KO-${matchNumber}` : ''
}

function hasExplicitBackendIdentity(match) {
  return Boolean(getExplicitBackendMatchNumber(match) || toStringValue(match?.templateCode ?? match?.code).trim())
}

function getBackendStadiumName(match) {
  if (typeof match?.stadium === 'string') {
    return match.stadium
  }

  return match?.stadium?.name ?? ''
}

function getBackendDate(match) {
  return match?.date ?? match?.matchDate ?? ''
}

function translateStadiumName(value) {
  const normalized = normalizeMatchText(value)

  if (!normalized) {
    return ''
  }

  return STADIUM_DISPLAY_NAMES.get(normalized) ?? value
}

function getBackendStatusLabel(status) {
  return TECHNICAL_STATUS_LABELS[status] ?? ''
}

function buildCompoundKey({ roundKey, date, stadium }) {
  const dateKey = toDateKey(date)
  const stadiumKey = normalizeMatchText(stadium)

  if (!roundKey || !dateKey || !stadiumKey) {
    return ''
  }

  return `${roundKey}|${dateKey}|${stadiumKey}`
}

function indexByUniqueKey(items, getKey) {
  const keyCounts = new Map()
  const indexedItems = new Map()

  for (const item of items) {
    const key = getKey(item)

    if (!key) {
      continue
    }

    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1)
    indexedItems.set(key, item)
  }

  for (const [key, count] of keyCounts.entries()) {
    if (count > 1) {
      indexedItems.delete(key)
    }
  }

  return indexedItems
}

function findMatchingBackendMatch(skeletonMatch, indexes) {
  const byMatchNumber = indexes.byMatchNumber.get(skeletonMatch.matchNumber)
  if (byMatchNumber) {
    return byMatchNumber
  }

  const byTemplateCode = indexes.byTemplateCode.get(skeletonMatch.templateCode)
  if (byTemplateCode) {
    return byTemplateCode
  }

  const compoundKey = buildCompoundKey(skeletonMatch)
  if (!compoundKey) {
    return null
  }

  return indexes.byCompoundKey.get(compoundKey) ?? null
}

function hasRealTeam(team) {
  return Boolean(team?.name)
}

function hasRegularScore(match) {
  return isNumber(match?.homeScore) && isNumber(match?.awayScore)
}

function hasPenaltyScore(match) {
  return isNumber(match?.homePenaltyScore) && isNumber(match?.awayPenaltyScore)
}

function getWinningSide(match) {
  if (match?.status !== 'FINISHED' || !hasRegularScore(match)) {
    return null
  }

  if (match.homeScore > match.awayScore) {
    return 'home'
  }

  if (match.awayScore > match.homeScore) {
    return 'away'
  }

  if (!hasPenaltyScore(match)) {
    return null
  }

  if (match.homePenaltyScore > match.awayPenaltyScore) {
    return 'home'
  }

  if (match.awayPenaltyScore > match.homePenaltyScore) {
    return 'away'
  }

  return null
}

function getTeamName(team) {
  return team?.name ?? ''
}

function mergeMatch(skeletonMatch, backendMatch) {
  if (!backendMatch) {
    return {
      ...skeletonMatch,
      source: 'skeleton',
      dataSourceLabel: 'Información recibida pendiente',
      homeTeam: null,
      awayTeam: null,
      homeScore: null,
      awayScore: null,
      homePenaltyScore: null,
      awayPenaltyScore: null,
      hasRegularScore: false,
      hasPenaltyScore: false,
      winnerSide: null,
      winnerLabel: '',
    }
  }

  const date = getBackendDate(backendMatch) || skeletonMatch.date
  const stadium = translateStadiumName(getBackendStadiumName(backendMatch)) || skeletonMatch.stadium
  const statusLabel = getBackendStatusLabel(backendMatch.status) || skeletonMatch.statusLabel
  const winnerSide = getWinningSide(backendMatch)
  const winnerTeam = winnerSide === 'home' ? backendMatch.homeTeam : backendMatch.awayTeam

  return {
    ...skeletonMatch,
    source: 'backend',
    dataSourceLabel: 'Información recibida',
    backendId: backendMatch._id ?? null,
    date,
    stadium,
    status: backendMatch.status ?? skeletonMatch.status,
    statusLabel,
    homeTeam: hasRealTeam(backendMatch.homeTeam) ? backendMatch.homeTeam : null,
    awayTeam: hasRealTeam(backendMatch.awayTeam) ? backendMatch.awayTeam : null,
    homeScore: isNumber(backendMatch.homeScore) ? backendMatch.homeScore : null,
    awayScore: isNumber(backendMatch.awayScore) ? backendMatch.awayScore : null,
    homePenaltyScore: isNumber(backendMatch.homePenaltyScore) ? backendMatch.homePenaltyScore : null,
    awayPenaltyScore: isNumber(backendMatch.awayPenaltyScore) ? backendMatch.awayPenaltyScore : null,
    hasRegularScore: hasRegularScore(backendMatch),
    hasPenaltyScore: hasPenaltyScore(backendMatch),
    winnerSide,
    winnerLabel: winnerSide ? `Ganador registrado: ${getTeamName(winnerTeam)}` : '',
  }
}

function createBackendIndexes(backendMatches) {
  return {
    byMatchNumber: indexByUniqueKey(backendMatches, getBackendMatchNumber),
    byTemplateCode: indexByUniqueKey(backendMatches, getBackendTemplateCode),
    byCompoundKey: indexByUniqueKey(backendMatches.filter((match) => !hasExplicitBackendIdentity(match)), (match) =>
      buildCompoundKey({
        roundKey: getBackendRoundKey(match),
        date: getBackendDate(match),
        stadium: translateStadiumName(getBackendStadiumName(match)) || getBackendStadiumName(match),
      }),
    ),
  }
}

export function buildKnockoutStageMatches(backendMatches = [], skeletonMatches = knockoutStageSkeleton) {
  const safeBackendMatches = Array.isArray(backendMatches) ? backendMatches : []
  const indexes = createBackendIndexes(safeBackendMatches)

  return skeletonMatches.map((skeletonMatch) =>
    mergeMatch(skeletonMatch, findMatchingBackendMatch(skeletonMatch, indexes)),
  )
}

export function groupKnockoutMatchesByRound(matches = []) {
  return KNOCKOUT_ROUNDS.map((round) => ({
    ...round,
    matches: matches.filter((match) => match.roundKey === round.roundKey),
  })).filter((round) => round.matches.length > 0)
}

export function buildKnockoutBracketViewRounds(matches = []) {
  return KNOCKOUT_ROUNDS.map((round) => ({
    ...round,
    matches: matches.filter((match) => match.roundKey === round.roundKey),
  }))
}

export function getKnockoutSummary(matches = []) {
  const backendCount = matches.filter((match) => match.source === 'backend').length

  return {
    backendCount,
    skeletonCount: matches.length - backendCount,
    totalCount: matches.length,
    hasBackendData: backendCount > 0,
    hasPartialBackendData: backendCount > 0 && backendCount < matches.length,
  }
}

export function getDisplayTeamName(match, side) {
  const team = side === 'home' ? match?.homeTeam : match?.awayTeam
  const placeholder = side === 'home' ? match?.homePlaceholder : match?.awayPlaceholder

  return team?.name ?? placeholder ?? 'Equipo por definir'
}

export function getDisplayTeamShield(match, side) {
  const team = side === 'home' ? match?.homeTeam : match?.awayTeam
  return team?.shieldUrl ?? ''
}

export function isPlaceholderTeam(match, side) {
  const team = side === 'home' ? match?.homeTeam : match?.awayTeam
  return !team?.name
}

export function getKnockoutSlotState(match, side) {
  const isPlaceholder = isPlaceholderTeam(match, side)

  if (match?.winnerSide === side) {
    return 'winner'
  }

  if (match?.winnerSide && !isPlaceholder) {
    return 'loser'
  }

  if (isPlaceholder) {
    return 'placeholder'
  }

  return 'pending'
}

export function getKnockoutSlotStateLabel(slotState) {
  const labels = {
    winner: 'Ganador',
    loser: 'Eliminado',
    pending: 'Pendiente',
    placeholder: 'Por definir',
  }

  return labels[slotState] ?? labels.pending
}

export function getScoreLabel(match) {
  if (!match?.hasRegularScore) {
    return 'Resultado pendiente'
  }

  return `${match.homeScore} - ${match.awayScore}`
}

export function getPenaltyLabel(match) {
  if (!match?.hasPenaltyScore) {
    return ''
  }

  return `Penales: ${match.homePenaltyScore} - ${match.awayPenaltyScore}`
}
