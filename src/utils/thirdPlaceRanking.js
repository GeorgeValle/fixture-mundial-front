const THIRD_PLACE_POSITION = 3
const QUALIFIED_THIRD_PLACES = 8
const GROUP_STAGE_GROUPS = 12
const GROUP_STAGE_TEAMS_PER_GROUP = 4
const GROUP_STAGE_MATCHES_PER_TEAM = 3

export const THIRD_PLACE_RANKING_STATUS = {
  qualified: 'qualified',
  provisional: 'provisional',
  notQualified: 'not-qualified',
  outsideZone: 'outside-zone',
}

export function getNumberOrNull(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'string' && value.trim() === '') {
    return null
  }

  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue : null
}

export function getGroupFairPlayPoints(row) {
  return getNumberOrNull(row?.groupFairPlayPoints ?? row?.team?.groupFairPlayPoints)
}

export function getFifaRanking(row) {
  return getNumberOrNull(row?.fifaRanking ?? row?.team?.fifaRanking)
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

function compareOptionalFairPlay(firstRow, secondRow) {
  const firstFairPlay = getGroupFairPlayPoints(firstRow)
  const secondFairPlay = getGroupFairPlayPoints(secondRow)

  if (firstFairPlay === null || secondFairPlay === null) {
    return 0
  }

  return secondFairPlay - firstFairPlay
}

function compareOptionalFifaRanking(firstRow, secondRow) {
  const firstRanking = getFifaRanking(firstRow)
  const secondRanking = getFifaRanking(secondRow)

  if (firstRanking !== null && secondRanking !== null) {
    return firstRanking - secondRanking
  }

  if (firstRanking !== null) {
    return -1
  }

  if (secondRanking !== null) {
    return 1
  }

  return 0
}

function compareThirdPlaceRows(firstRow, secondRow) {
  return (
    (secondRow.pts ?? 0) - (firstRow.pts ?? 0) ||
    (secondRow.dif ?? 0) - (firstRow.dif ?? 0) ||
    (secondRow.gf ?? 0) - (firstRow.gf ?? 0) ||
    compareOptionalFairPlay(firstRow, secondRow) ||
    compareOptionalFifaRanking(firstRow, secondRow) ||
    compareText(getTeamName(firstRow), getTeamName(secondRow)) ||
    compareText(firstRow.group, secondRow.group) ||
    firstRow.originalGroupIndex - secondRow.originalGroupIndex
  )
}

export function buildThirdPlaceRanking(standings = []) {
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

  return thirdPlaceRows.sort(compareThirdPlaceRows).map((row, index) => {
    const isInTopEight = index < QUALIFIED_THIRD_PLACES
    const qualificationStatus = getThirdPlaceRankingStatus({
      isInTopEight,
      isFinalThirdPlaceRanking,
    })

    return {
      ...row,
      rank: index + 1,
      isInTopEight,
      isFinalThirdPlaceRanking,
      qualificationStatus,
      isQualifiedThirdPlace: qualificationStatus === THIRD_PLACE_RANKING_STATUS.qualified,
    }
  })
}
