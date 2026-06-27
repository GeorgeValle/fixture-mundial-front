const THIRD_PLACE_POSITION = 3
const QUALIFIED_THIRD_PLACES = 8
const GROUP_STAGE_GROUPS = 12
const GROUP_STAGE_TEAMS_PER_GROUP = 4
const GROUP_STAGE_MATCHES_PER_TEAM = 3
const ROUND_OF_32_MATCH_NUMBER_START = 73
const ROUND_OF_32_MATCH_NUMBER_END = 88
const ROUND_OF_32_ALIASES = new Set([
  'round of 32',
  'round of thirty two',
  'dieciseisavos de final',
  'dieciseisavos',
  '16avos',
  '16 avos',
])

export const THIRD_PLACE_RANKING_STATUS = {
  qualified: 'qualified',
  provisional: 'provisional',
  notQualified: 'not-qualified',
  outsideZone: 'outside-zone',
  pendingTiebreak: 'pending-tiebreak',
}

export function areAllGroupsClosed(standings = []) {
  const safeStandings = Array.isArray(standings) ? standings : []

  return (
    safeStandings.length === GROUP_STAGE_GROUPS &&
    safeStandings.every((standing) => {
      const teams = Array.isArray(standing?.teams) ? standing.teams : []

      return (
        teams.length === GROUP_STAGE_TEAMS_PER_GROUP &&
        teams.every((row) => Number(row?.pj) === GROUP_STAGE_MATCHES_PER_TEAM)
      )
    })
  )
}

function getThirdPlaceRankingStatus({ isInTopEight, isFinalThirdPlaceRanking }) {
  if (isFinalThirdPlaceRanking) {
    return isInTopEight ? THIRD_PLACE_RANKING_STATUS.qualified : THIRD_PLACE_RANKING_STATUS.notQualified
  }

  return isInTopEight ? THIRD_PLACE_RANKING_STATUS.provisional : THIRD_PLACE_RANKING_STATUS.outsideZone
}

function toStringValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
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

function getMatchNumber(match) {
  const candidates = [match?.matchNumber, match?.number, match?.matchNo]

  for (const candidate of candidates) {
    const numericValue = Number(candidate)

    if (Number.isInteger(numericValue)) {
      return numericValue
    }
  }

  const templateCodeMatch = toStringValue(match?.templateCode ?? match?.code).match(/KO[-_ ]?(\d+)/i)

  return templateCodeMatch ? Number(templateCodeMatch[1]) : null
}

function isRoundOf32Match(match) {
  const roundCandidates = [match?.roundKey, match?.round, match?.stage].map(normalizeRoundText)
  const matchNumber = getMatchNumber(match)

  return (
    roundCandidates.some((candidate) => ROUND_OF_32_ALIASES.has(candidate)) ||
    (Number.isInteger(matchNumber) &&
      matchNumber >= ROUND_OF_32_MATCH_NUMBER_START &&
      matchNumber <= ROUND_OF_32_MATCH_NUMBER_END)
  )
}

function getTeamId(team) {
  const teamId = toStringValue(team?._id ?? team?.id).trim()

  return teamId || ''
}

function getRowTeamId(row) {
  return getTeamId(row?.team)
}

export function getRoundOf32TeamIds(matches = []) {
  const safeMatches = Array.isArray(matches) ? matches : []
  const teamIds = new Set()

  for (const match of safeMatches) {
    if (!isRoundOf32Match(match)) {
      continue
    }

    for (const team of [match?.homeTeam, match?.awayTeam]) {
      const teamId = getTeamId(team)

      if (teamId) {
        teamIds.add(teamId)
      }
    }
  }

  return teamIds
}

function getTeamName(row) {
  return row?.team?.name ?? ''
}

function getTeamGroup(row, standingGroup) {
  return row?.team?.group ?? standingGroup ?? ''
}

function getTeamKey(row, standingGroup, fallbackIndex) {
  const teamName = getTeamName(row)
  const teamGroup = getTeamGroup(row, standingGroup)

  return row?.team?._id ?? (teamName || teamGroup ? `${teamName}|${teamGroup}` : `third-place-${fallbackIndex}`)
}

function compareText(firstValue, secondValue) {
  return String(firstValue ?? '').localeCompare(String(secondValue ?? ''), 'es', {
    sensitivity: 'base',
  })
}

function getThirdPlaceRow(standing) {
  const teams = Array.isArray(standing?.teams) ? standing.teams : []

  if (teams.length < THIRD_PLACE_POSITION) {
    return null
  }

  return (
    teams.find((row) => Number(row?.team?.position) === THIRD_PLACE_POSITION) ??
    teams[THIRD_PLACE_POSITION - 1] ??
    null
  )
}

function getRankingStat(row, key) {
  return Number(row?.[key] ?? 0)
}

function haveSameRankingStats(firstRow, secondRow) {
  return (
    getRankingStat(firstRow, 'pts') === getRankingStat(secondRow, 'pts') &&
    getRankingStat(firstRow, 'dif') === getRankingStat(secondRow, 'dif') &&
    getRankingStat(firstRow, 'gf') === getRankingStat(secondRow, 'gf')
  )
}

function getCutoffTieRange(sortedRows) {
  if (sortedRows.length <= QUALIFIED_THIRD_PLACES) {
    return null
  }

  const cutoffInsideRow = sortedRows[QUALIFIED_THIRD_PLACES - 1]
  const cutoffOutsideRow = sortedRows[QUALIFIED_THIRD_PLACES]

  if (!haveSameRankingStats(cutoffInsideRow, cutoffOutsideRow)) {
    return null
  }

  let startIndex = QUALIFIED_THIRD_PLACES - 1
  let endIndex = QUALIFIED_THIRD_PLACES

  while (startIndex > 0 && haveSameRankingStats(sortedRows[startIndex - 1], cutoffInsideRow)) {
    startIndex -= 1
  }

  while (
    endIndex < sortedRows.length - 1 &&
    haveSameRankingStats(sortedRows[endIndex + 1], cutoffInsideRow)
  ) {
    endIndex += 1
  }

  return {
    endIndex,
    qualifiedSlots: QUALIFIED_THIRD_PLACES - startIndex,
    startIndex,
  }
}

function buildCutoffTieContext(sortedRows, matches) {
  const cutoffTieRange = getCutoffTieRange(sortedRows)
  const roundOf32TeamIds = getRoundOf32TeamIds(matches)

  if (!cutoffTieRange) {
    return {
      cutoffTieRange,
      hasSufficientBracketTiebreakData: false,
      roundOf32TeamIds,
    }
  }

  const tiedRows = sortedRows.slice(cutoffTieRange.startIndex, cutoffTieRange.endIndex + 1)
  const placedTiedRowsCount = tiedRows.filter((row) => roundOf32TeamIds.has(getRowTeamId(row))).length

  return {
    cutoffTieRange,
    hasSufficientBracketTiebreakData:
      roundOf32TeamIds.size > 0 && placedTiedRowsCount >= cutoffTieRange.qualifiedSlots,
    roundOf32TeamIds,
  }
}

function getCutoffTieStatus({ cutoffTieContext, index, row }) {
  const { cutoffTieRange, hasSufficientBracketTiebreakData, roundOf32TeamIds } = cutoffTieContext

  if (!cutoffTieRange || index < cutoffTieRange.startIndex || index > cutoffTieRange.endIndex) {
    return null
  }

  if (roundOf32TeamIds.has(getRowTeamId(row))) {
    return THIRD_PLACE_RANKING_STATUS.qualified
  }

  return hasSufficientBracketTiebreakData
    ? THIRD_PLACE_RANKING_STATUS.notQualified
    : THIRD_PLACE_RANKING_STATUS.pendingTiebreak
}

export function buildThirdPlaceRanking(standings = [], matches = []) {
  const safeStandings = Array.isArray(standings) ? standings : []
  const isFinalThirdPlaceRanking = areAllGroupsClosed(safeStandings)
  const seenTeamKeys = new Set()
  const thirdPlaceRows = []

  for (const [standingIndex, standing] of safeStandings.entries()) {
    const thirdPlaceRow = getThirdPlaceRow(standing)

    if (!thirdPlaceRow) {
      continue
    }

    const group = getTeamGroup(thirdPlaceRow, standing?.group)
    const teamKey = getTeamKey(thirdPlaceRow, group, standingIndex)

    if (seenTeamKeys.has(teamKey)) {
      continue
    }

    seenTeamKeys.add(teamKey)
    thirdPlaceRows.push({
      ...thirdPlaceRow,
      group,
      originalGroupIndex: standingIndex,
    })
  }

  const sortedRows = thirdPlaceRows.sort(
    (firstRow, secondRow) =>
      (secondRow.pts ?? 0) - (firstRow.pts ?? 0) ||
      (secondRow.dif ?? 0) - (firstRow.dif ?? 0) ||
      (secondRow.gf ?? 0) - (firstRow.gf ?? 0) ||
      compareText(getTeamName(firstRow), getTeamName(secondRow)) ||
      compareText(firstRow.group, secondRow.group) ||
      firstRow.originalGroupIndex - secondRow.originalGroupIndex,
  )
  const cutoffTieContext = buildCutoffTieContext(sortedRows, matches)

  return sortedRows
    .map((row, index) => {
      const isInTopEight = index < QUALIFIED_THIRD_PLACES
      const cutoffTieStatus = getCutoffTieStatus({ cutoffTieContext, index, row })
      const qualificationStatus =
        cutoffTieStatus ??
        getThirdPlaceRankingStatus({
          isInTopEight,
          isFinalThirdPlaceRanking,
        })
      const isInCutoffTie = Boolean(cutoffTieStatus)
      const cutoffTiebreakStatus = isInCutoffTie
        ? qualificationStatus === THIRD_PLACE_RANKING_STATUS.pendingTiebreak
          ? 'pending'
          : 'resolved-by-bracket'
        : 'none'

      return {
        ...row,
        rank: index + 1,
        isInTopEight,
        isInCutoffTie,
        isFinalThirdPlaceRanking,
        qualificationStatus,
        cutoffTiebreakStatus,
        isQualifiedThirdPlace: qualificationStatus === THIRD_PLACE_RANKING_STATUS.qualified,
      }
    })
}
