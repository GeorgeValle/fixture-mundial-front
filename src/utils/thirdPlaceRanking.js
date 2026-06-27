const THIRD_PLACE_POSITION = 3
const QUALIFIED_THIRD_PLACES = 8

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

export function buildThirdPlaceRanking(standings = []) {
  const safeStandings = Array.isArray(standings) ? standings : []
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

  return thirdPlaceRows
    .sort(
      (firstRow, secondRow) =>
        (secondRow.pts ?? 0) - (firstRow.pts ?? 0) ||
        (secondRow.dif ?? 0) - (firstRow.dif ?? 0) ||
        (secondRow.gf ?? 0) - (firstRow.gf ?? 0) ||
        compareText(getTeamName(firstRow), getTeamName(secondRow)) ||
        compareText(firstRow.group, secondRow.group) ||
        firstRow.originalGroupIndex - secondRow.originalGroupIndex,
    )
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      isInTopEight: index < QUALIFIED_THIRD_PLACES,
      isQualifiedThirdPlace: row?.team?.qualifiedTo === 'ROUND_OF_32',
    }))
}
