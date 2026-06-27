import { describe, expect, it } from 'vitest'
import { buildThirdPlaceRanking } from './thirdPlaceRanking'

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

describe('thirdPlaceRanking', () => {
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

  it('marks the top 8 third-place teams as qualified', () => {
    const standings = Array.from({ length: 12 }, (_, index) => createStanding(String.fromCharCode(65 + index), { pts: 12 - index }))

    const ranking = buildThirdPlaceRanking(standings)

    expect(ranking).toHaveLength(12)
    expect(ranking.filter((row) => row.isQualifiedThirdPlace)).toHaveLength(8)
    expect(ranking[0]).toMatchObject({ rank: 1, isQualifiedThirdPlace: true })
    expect(ranking[7]).toMatchObject({ rank: 8, isQualifiedThirdPlace: true })
    expect(ranking[8]).toMatchObject({ rank: 9, isQualifiedThirdPlace: false })
  })
})
