import { describe, expect, it } from 'vitest'
import {
  areAllGroupsClosed,
  buildThirdPlaceRanking,
  getRoundOf32TeamIds,
  THIRD_PLACE_RANKING_STATUS,
} from './thirdPlaceRanking'

function createStandingRow(name, group, stats = {}, teamOverrides = {}) {
  return {
    team: {
      _id: `${group}-${name}`,
      name,
      shieldUrl: `https://example.com/${group}-${name}.svg`,
      group,
      position: null,
      ...teamOverrides,
    },
    pj: 3,
    pg: 1,
    pe: 1,
    pp: 1,
    gf: 3,
    gc: 3,
    dif: 0,
    pts: 4,
    ...stats,
  }
}

function createStanding(group, thirdStats = {}, thirdTeamOverrides = {}) {
  return {
    group,
    teams: [
      createStandingRow(`${group} primero`, group, { pts: 7 }, { position: 1 }),
      createStandingRow(`${group} segundo`, group, { pts: 5 }, { position: 2 }),
      createStandingRow(`${group} tercero`, group, thirdStats, thirdTeamOverrides),
      createStandingRow(`${group} cuarto`, group, { pts: 0 }, { position: 4 }),
    ],
  }
}

function createRoundOf32Match(homeTeam, awayTeam = null, overrides = {}) {
  return {
    _id: `match-${homeTeam?._id ?? 'pending'}`,
    matchNumber: 73,
    roundKey: 'round-of-32',
    stage: 'ROUND_OF_32',
    homeTeam,
    awayTeam,
    status: 'PENDING',
    ...overrides,
  }
}

function createCutoffTieStandings() {
  const thirdPlacePoints = [12, 11, 10, 9, 8, 7, 6, 4, 4, 3, 2, 1]

  return thirdPlacePoints.map((points, index) =>
    createStanding(String.fromCharCode(65 + index), { pts: points, dif: 0, gf: 4 }),
  )
}

describe('thirdPlaceRanking', () => {
  it('detects group-stage closure only when 12 groups have 4 teams with 3 matches played', () => {
    const closedStandings = Array.from({ length: 12 }, (_, index) => createStanding(String.fromCharCode(65 + index)))
    const incompleteStandings = Array.from({ length: 12 }, (_, index) =>
      createStanding(String.fromCharCode(65 + index), { pj: index === 0 ? 2 : 3 }),
    )

    expect(areAllGroupsClosed(closedStandings)).toBe(true)
    expect(areAllGroupsClosed(closedStandings.slice(0, 11))).toBe(false)
    expect(areAllGroupsClosed([{ group: 'A', teams: closedStandings[0].teams.slice(0, 3) }])).toBe(false)
    expect(areAllGroupsClosed(incompleteStandings)).toBe(false)
  })

  it('extracts third-place teams from each group', () => {
    const ranking = buildThirdPlaceRanking([createStanding('A'), createStanding('B')])

    expect(ranking.map((row) => row.team.name)).toEqual(['A tercero', 'B tercero'])
    expect(ranking.map((row) => row.group)).toEqual(['A', 'B'])
  })

  it('prioritizes team.position === 3 over the visual third array item', () => {
    const ranking = buildThirdPlaceRanking([
      {
        group: 'A',
        teams: [
          createStandingRow('Primero', 'A', { pts: 9 }, { position: 1 }),
          createStandingRow('Tercero por posición', 'A', { pts: 4 }, { position: 3 }),
          createStandingRow('Tercero visual', 'A', { pts: 6 }, { position: 2 }),
          createStandingRow('Cuarto', 'A', { pts: 1 }, { position: 4 }),
        ],
      },
    ])

    expect(ranking).toHaveLength(1)
    expect(ranking[0].team.name).toBe('Tercero por posición')
  })

  it('falls back to the visual third array item when position is unavailable', () => {
    const ranking = buildThirdPlaceRanking([
      {
        group: 'A',
        teams: [
          createStandingRow('Primero', 'A'),
          createStandingRow('Segundo', 'A'),
          createStandingRow('Tercero visual', 'A'),
        ],
      },
    ])

    expect(ranking).toHaveLength(1)
    expect(ranking[0].team.name).toBe('Tercero visual')
  })

  it('does not duplicate teams when position and visual fallback disagree', () => {
    const ranking = buildThirdPlaceRanking([
      {
        group: 'A',
        teams: [
          createStandingRow('Primero', 'A', {}, { position: 1 }),
          createStandingRow('Tercero por posición', 'A', {}, { position: 3 }),
          createStandingRow('Tercero visual', 'A', {}, { position: null }),
          createStandingRow('Cuarto', 'A', {}, { position: 4 }),
        ],
      },
    ])

    expect(ranking).toHaveLength(1)
    expect(ranking.map((row) => row.team.name)).toEqual(['Tercero por posición'])
  })

  it('ignores groups with fewer than three teams', () => {
    const ranking = buildThirdPlaceRanking([
      {
        group: 'A',
        teams: [createStandingRow('Primero', 'A'), createStandingRow('Segundo', 'A')],
      },
      createStanding('B'),
    ])

    expect(ranking.map((row) => row.group)).toEqual(['B'])
  })

  it('orders by PTS, then DIF, then GF', () => {
    const ranking = buildThirdPlaceRanking([
      createStanding('A', { pts: 4, dif: 1, gf: 5 }),
      createStanding('B', { pts: 6, dif: -1, gf: 2 }),
      createStanding('C', { pts: 4, dif: 3, gf: 1 }),
      createStanding('D', { pts: 4, dif: 1, gf: 7 }),
    ])

    expect(ranking.map((row) => row.group)).toEqual(['B', 'C', 'D', 'A'])
  })

  it('uses team name and group as stable tie-breakers', () => {
    const ranking = buildThirdPlaceRanking([
      {
        group: 'B',
        teams: [
          createStandingRow('Primero B', 'B'),
          createStandingRow('Segundo B', 'B'),
          createStandingRow('Uruguay', 'B', { pts: 4, dif: 0, gf: 2 }),
        ],
      },
      {
        group: 'A',
        teams: [
          createStandingRow('Primero A', 'A'),
          createStandingRow('Segundo A', 'A'),
          createStandingRow('Argentina', 'A', { pts: 4, dif: 0, gf: 2 }),
        ],
      },
      {
        group: 'C',
        teams: [
          createStandingRow('Primero C', 'C'),
          createStandingRow('Segundo C', 'C'),
          createStandingRow('Argentina', 'C', { pts: 4, dif: 0, gf: 2 }, { _id: 'C-Argentina' }),
        ],
      },
    ])

    expect(ranking.map((row) => `${row.team.name}-${row.group}`)).toEqual([
      'Argentina-A',
      'Argentina-C',
      'Uruguay-B',
    ])
  })

  it('extracts team ids from round-of-32 matches using round keys, stages or match numbers', () => {
    const ids = getRoundOf32TeamIds([
      createRoundOf32Match({ _id: 'team-home' }, { _id: 'team-away' }),
      createRoundOf32Match(
        { _id: 'team-stage' },
        null,
        { matchNumber: 200, roundKey: '', stage: 'ROUND_OF_32' },
      ),
      createRoundOf32Match(
        null,
        { _id: 'team-number' },
        { matchNumber: 88, roundKey: '', stage: '' },
      ),
      createRoundOf32Match(
        { _id: 'team-octavos' },
        null,
        { matchNumber: 89, roundKey: 'round-of-16', stage: 'ROUND_OF_16' },
      ),
    ])

    expect([...ids].sort()).toEqual(['team-away', 'team-home', 'team-number', 'team-stage'])
  })

  it('marks top 8 as provisional and ranks 9 to 12 as outside zone while groups are open', () => {
    const standings = Array.from({ length: 12 }, (_, index) =>
      createStanding(String.fromCharCode(65 + index), { pj: 2, pts: 12 - index }),
    )

    const ranking = buildThirdPlaceRanking(standings)

    expect(ranking).toHaveLength(12)
    expect(ranking.filter((row) => row.isInTopEight)).toHaveLength(8)
    expect(ranking.filter((row) => row.isQualifiedThirdPlace)).toHaveLength(0)
    expect(ranking[0]).toMatchObject({
      rank: 1,
      isInTopEight: true,
      isFinalThirdPlaceRanking: false,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.provisional,
      isQualifiedThirdPlace: false,
    })
    expect(ranking[7]).toMatchObject({
      rank: 8,
      isInTopEight: true,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.provisional,
    })
    expect(ranking[8]).toMatchObject({
      rank: 9,
      isInTopEight: false,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.outsideZone,
      isQualifiedThirdPlace: false,
    })
  })

  it('marks top 8 as qualified and ranks 9 to 12 as not qualified when all groups are closed', () => {
    const standings = Array.from({ length: 12 }, (_, index) => createStanding(String.fromCharCode(65 + index), { pts: 12 - index }))

    const ranking = buildThirdPlaceRanking(standings)

    expect(ranking[0]).toMatchObject({
      group: 'A',
      isInTopEight: true,
      isFinalThirdPlaceRanking: true,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.qualified,
      isQualifiedThirdPlace: true,
    })
    expect(ranking[7]).toMatchObject({
      rank: 8,
      isInTopEight: true,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.qualified,
      isQualifiedThirdPlace: true,
    })
    expect(ranking[8]).toMatchObject({
      rank: 9,
      isInTopEight: false,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.notQualified,
      isQualifiedThirdPlace: false,
    })
  })

  it('does not use team.qualifiedTo to determine third-place ranking badge status', () => {
    const standings = Array.from({ length: 12 }, (_, index) => createStanding(String.fromCharCode(65 + index), { pts: 12 - index }))
    standings[0].teams[2].team.qualifiedTo = 'ELIMINATED'
    standings[1].teams[2].team.qualifiedTo = 'ROUND_OF_16'
    standings[8].teams[2].team.qualifiedTo = 'ROUND_OF_32'

    const ranking = buildThirdPlaceRanking(standings)

    expect(ranking[0]).toMatchObject({
      group: 'A',
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.qualified,
      isQualifiedThirdPlace: true,
    })
    expect(ranking[1]).toMatchObject({
      group: 'B',
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.qualified,
      isQualifiedThirdPlace: true,
    })
    expect(ranking[8]).toMatchObject({
      group: 'I',
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.notQualified,
      isQualifiedThirdPlace: false,
    })

    const openStandings = Array.from({ length: 12 }, (_, index) =>
      createStanding(String.fromCharCode(65 + index), { pj: 2, pts: 12 - index }),
    )
    openStandings[0].teams[2].team.qualifiedTo = 'ROUND_OF_32'
    openStandings[8].teams[2].team.qualifiedTo = 'ELIMINATED'

    const openRanking = buildThirdPlaceRanking(openStandings)

    expect(openRanking[0]).toMatchObject({
      group: 'A',
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.provisional,
      isQualifiedThirdPlace: false,
    })
    expect(openRanking[8]).toMatchObject({
      group: 'I',
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.outsideZone,
      isQualifiedThirdPlace: false,
    })
  })

  it('marks the cutoff tie as pending when round-of-32 data is unavailable', () => {
    const standings = createCutoffTieStandings()

    const ranking = buildThirdPlaceRanking(standings)
    const groupH = ranking.find((row) => row.group === 'H')
    const groupI = ranking.find((row) => row.group === 'I')

    expect(groupH).toMatchObject({
      rank: 8,
      isInCutoffTie: true,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.pendingTiebreak,
      cutoffTiebreakStatus: 'pending',
      isQualifiedThirdPlace: false,
    })
    expect(groupI).toMatchObject({
      rank: 9,
      isInCutoffTie: true,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.pendingTiebreak,
      cutoffTiebreakStatus: 'pending',
      isQualifiedThirdPlace: false,
    })
  })

  it('uses round-of-32 placement to resolve a complete cutoff tie without alphabetical badges', () => {
    const standings = createCutoffTieStandings()
    const groupITeam = standings[8].teams[2].team

    const ranking = buildThirdPlaceRanking(standings, [createRoundOf32Match(groupITeam)])
    const groupH = ranking.find((row) => row.group === 'H')
    const groupI = ranking.find((row) => row.group === 'I')

    expect(groupH).toMatchObject({
      rank: 8,
      isInTopEight: true,
      isInCutoffTie: true,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.notQualified,
      cutoffTiebreakStatus: 'resolved-by-bracket',
      isQualifiedThirdPlace: false,
    })
    expect(groupI).toMatchObject({
      rank: 9,
      isInTopEight: false,
      isInCutoffTie: true,
      qualificationStatus: THIRD_PLACE_RANKING_STATUS.qualified,
      cutoffTiebreakStatus: 'resolved-by-bracket',
      isQualifiedThirdPlace: true,
    })
  })
})
