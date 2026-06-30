export const GROUP_STANDING_BADGE_VARIANTS = {
  qualified: 'qualified',
  eliminated: 'eliminated',
  pending: 'pending',
}

export const GROUP_STANDING_BADGE_LABELS = {
  qualified: 'Clasificado a 16avos',
  eliminated: 'Eliminado en grupos',
  pending: 'Pendiente',
}

const ROUND_OF_32_MATCH_NUMBER_START = 73
const ROUND_OF_32_MATCH_NUMBER_END = 88
const ROUND_OF_32_MATCH_COUNT = 16
const ROUND_OF_32_TEAM_SLOT_COUNT = ROUND_OF_32_MATCH_COUNT * 2
const ROUND_OF_32_STAGE_ALIASES = new Set(['ROUND_OF_32', 'DIECISEISAVOS', '16AVOS'])
const ROUND_OF_32_ROUND_KEY_ALIASES = new Set(['round-of-32', 'dieciseisavos', '16avos'])
const PLACEHOLDER_TEAM_NAMES = new Set([
  'tbd',
  'por definir',
  'equipo por definir',
  'equipo por confirmar',
  'pendiente',
  'placeholder',
])

function toNormalizedText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getTeamFallbackKey(team) {
  const name = toNormalizedText(team?.name)
  const group = toNormalizedText(team?.group)

  if (!name && !group) {
    return ''
  }

  return `team-name-group:${name}|${group}`
}

export function getTeamKeys(team) {
  const keys = []

  if (team?._id) {
    keys.push(`team-id:${team._id}`)
  }

  const fallbackKey = getTeamFallbackKey(team)
  if (fallbackKey) {
    keys.push(fallbackKey)
  }

  return keys
}

export function getTeamKey(team) {
  return getTeamKeys(team)[0] ?? ''
}

function hasRealTeamIdentity(team) {
  if (!team || typeof team !== 'object') {
    return false
  }

  const normalizedName = toNormalizedText(team?.name)

  if (PLACEHOLDER_TEAM_NAMES.has(normalizedName)) {
    return false
  }

  return Boolean(team?._id || (normalizedName && toNormalizedText(team?.group)))
}

function addTeamKeys(knockoutTeamKeys, team) {
  if (!hasRealTeamIdentity(team)) {
    return
  }

  for (const key of getTeamKeys(team)) {
    knockoutTeamKeys.add(key)
  }
}

function isRealKnockoutMatch(match) {
  const matchNumber = Number(match?.matchNumber)
  const stage = String(match?.stage ?? '').trim().toUpperCase()
  const roundKey = String(match?.roundKey ?? '').trim().toLowerCase()

  return (
    (Number.isInteger(matchNumber) && matchNumber >= ROUND_OF_32_MATCH_NUMBER_START) ||
    ROUND_OF_32_STAGE_ALIASES.has(stage) ||
    stage.includes('DIECISEISAVOS') ||
    ROUND_OF_32_ROUND_KEY_ALIASES.has(roundKey)
  )
}

function isRoundOf32Match(match) {
  const matchNumber = Number(match?.matchNumber)
  const stage = String(match?.stage ?? '').trim().toUpperCase()
  const roundKey = String(match?.roundKey ?? '').trim().toLowerCase()

  return (
    (Number.isInteger(matchNumber) &&
      matchNumber >= ROUND_OF_32_MATCH_NUMBER_START &&
      matchNumber <= ROUND_OF_32_MATCH_NUMBER_END) ||
    ROUND_OF_32_STAGE_ALIASES.has(stage) ||
    stage.includes('DIECISEISAVOS') ||
    ROUND_OF_32_ROUND_KEY_ALIASES.has(roundKey)
  )
}

export function buildKnockoutTeamKeys(matches = []) {
  const knockoutTeamKeys = new Set()
  const safeMatches = Array.isArray(matches) ? matches : []

  for (const match of safeMatches) {
    if (!isRealKnockoutMatch(match)) {
      continue
    }

    addTeamKeys(knockoutTeamKeys, match?.homeTeam)
    addTeamKeys(knockoutTeamKeys, match?.awayTeam)
  }

  return knockoutTeamKeys
}

export function hasReliableRoundOf32Context(matches = []) {
  const safeMatches = Array.isArray(matches) ? matches : []
  const seededRoundOf32Slots = new Set()

  for (const [matchIndex, match] of safeMatches.entries()) {
    if (!isRoundOf32Match(match)) {
      continue
    }

    const matchNumber = Number(match?.matchNumber)
    const matchKey = Number.isInteger(matchNumber)
      ? matchNumber
      : (match?._id ?? `round-of-32-${matchIndex}`)

    if (hasRealTeamIdentity(match?.homeTeam)) {
      seededRoundOf32Slots.add(`${matchKey}:home`)
    }

    if (hasRealTeamIdentity(match?.awayTeam)) {
      seededRoundOf32Slots.add(`${matchKey}:away`)
    }
  }

  return seededRoundOf32Slots.size === ROUND_OF_32_TEAM_SLOT_COUNT
}

export function buildQualifiedThirdPlaceTeamKeys(thirdPlaceRanking = []) {
  const qualifiedThirdPlaceTeamKeys = new Set()
  const safeRanking = Array.isArray(thirdPlaceRanking) ? thirdPlaceRanking : []

  for (const row of safeRanking) {
    if (!row?.isQualifiedThirdPlace) {
      continue
    }

    for (const key of getTeamKeys(row?.team)) {
      qualifiedThirdPlaceTeamKeys.add(key)
    }
  }

  return qualifiedThirdPlaceTeamKeys
}

function isTeamInKnockoutContext(team, knockoutTeamKeys) {
  if (!(knockoutTeamKeys instanceof Set)) {
    return false
  }

  return getTeamKeys(team).some((key) => knockoutTeamKeys.has(key))
}

function createBadge(variant) {
  return {
    label: GROUP_STANDING_BADGE_LABELS[variant],
    variant,
  }
}

export function getGroupStandingBadge(row, context = {}) {
  const position = Number(row?.team?.position)
  const isGroupComplete = context.isGroupComplete === true
  const hasReliableThirdPlaceRanking = context.hasReliableThirdPlaceRanking === true

  if (!Number.isInteger(position)) {
    return null
  }

  if (position === 1 || position === 2) {
    return isGroupComplete ? createBadge(GROUP_STANDING_BADGE_VARIANTS.qualified) : null
  }

  if (position === 3) {
    if (!isGroupComplete || !hasReliableThirdPlaceRanking) {
      return createBadge(GROUP_STANDING_BADGE_VARIANTS.pending)
    }

    if (isTeamInKnockoutContext(row?.team, context.qualifiedThirdPlaceTeamKeys)) {
      return createBadge(GROUP_STANDING_BADGE_VARIANTS.qualified)
    }

    if (context.qualifiedThirdPlaceTeamKeys instanceof Set) {
      return createBadge(GROUP_STANDING_BADGE_VARIANTS.eliminated)
    }

    return createBadge(GROUP_STANDING_BADGE_VARIANTS.pending)
  }

  if (position === 4) {
    return isGroupComplete ? createBadge(GROUP_STANDING_BADGE_VARIANTS.eliminated) : null
  }

  return null
}
