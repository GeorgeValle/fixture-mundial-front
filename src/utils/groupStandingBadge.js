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

function getTeamKeys(team) {
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

function addTeamKeys(knockoutTeamKeys, team) {
  for (const key of getTeamKeys(team)) {
    knockoutTeamKeys.add(key)
  }
}

function isRealKnockoutMatch(match) {
  const matchNumber = Number(match?.matchNumber)

  return Number.isInteger(matchNumber) && matchNumber >= ROUND_OF_32_MATCH_NUMBER_START
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

  if (!Number.isInteger(position)) {
    return null
  }

  if (position === 1 || position === 2) {
    return createBadge(GROUP_STANDING_BADGE_VARIANTS.qualified)
  }

  if (position === 3) {
    if (isTeamInKnockoutContext(row?.team, context.knockoutTeamKeys)) {
      return createBadge(GROUP_STANDING_BADGE_VARIANTS.qualified)
    }

    if (context.hasKnockoutContext) {
      return createBadge(GROUP_STANDING_BADGE_VARIANTS.eliminated)
    }

    return createBadge(GROUP_STANDING_BADGE_VARIANTS.pending)
  }

  if (position === 4) {
    return createBadge(GROUP_STANDING_BADGE_VARIANTS.eliminated)
  }

  return null
}
