import { describe, expect, it } from 'vitest'
import { knockoutStageSkeleton } from '../data/knockoutStageSkeleton'
import {
  buildKnockoutBracketViewRounds,
  buildKnockoutStageMatches,
  getKnockoutSlotState,
  getKnockoutSlotStateLabel,
  getKnockoutSummary,
  getPenaltyLabel,
  getScoreLabel,
  normalizeMatchText,
} from './knockoutStageAdapter'

function createTeam(name) {
  return {
    _id: `team-${name}`,
    name,
    shieldUrl: `https://example.com/${name}.svg`,
  }
}

function createBackendMatch(overrides = {}) {
  return {
    _id: 'backend-match',
    matchNumber: 73,
    templateCode: 'KO-73',
    roundKey: 'round-of-32',
    date: '2026-06-28T20:00:00.000Z',
    stadium: { name: 'Los Angeles Stadium' },
    stage: 'Dieciseisavos de final',
    status: 'PENDING',
    homeTeam: createTeam('México'),
    awayTeam: createTeam('Canadá'),
    homeScore: null,
    awayScore: null,
    homePenaltyScore: null,
    awayPenaltyScore: null,
    ...overrides,
  }
}

describe('knockoutStageAdapter', () => {
  it('renders the documented skeleton when backend data is empty', () => {
    const matches = buildKnockoutStageMatches([])

    expect(matches).toHaveLength(32)
    expect(matches[0]).toMatchObject({
      matchNumber: 73,
      roundLabel: 'Dieciseisavos de final',
      homePlaceholder: '2º Grupo A',
      awayPlaceholder: '2º Grupo B',
      statusLabel: 'Pendiente de clasificación',
      source: 'skeleton',
    })
    expect(matches.at(-1)).toMatchObject({
      matchNumber: 104,
      roundLabel: 'Final',
      homePlaceholder: 'Ganador Partido 101',
      awayPlaceholder: 'Ganador Partido 102',
    })
  })

  it('merges backend data by matchNumber', () => {
    const matches = buildKnockoutStageMatches([createBackendMatch({ matchNumber: 73 })])
    const match73 = matches.find((match) => match.matchNumber === 73)

    expect(match73.source).toBe('backend')
    expect(match73.homeTeam.name).toBe('México')
    expect(match73.awayTeam.name).toBe('Canadá')
    expect(match73.stadium).toBe('Estadio Los Ángeles')
  })

  it('merges backend data by templateCode when matchNumber is unavailable', () => {
    const backendMatch = createBackendMatch({ matchNumber: undefined, templateCode: 'KO-74' })
    const matches = buildKnockoutStageMatches([backendMatch])
    const match74 = matches.find((match) => match.matchNumber === 74)

    expect(match74.source).toBe('backend')
    expect(match74.homeTeam.name).toBe('México')
  })

  it('uses a normalized compound fallback key when matchNumber and templateCode are unavailable', () => {
    const backendMatch = createBackendMatch({
      matchNumber: undefined,
      templateCode: undefined,
      roundKey: undefined,
      round: 'Dieciseisavos de final',
      date: '2026-06-28T22:00:00.000Z',
      stadium: { name: 'Los Angeles Stadium' },
    })
    const matches = buildKnockoutStageMatches([backendMatch])
    const match73 = matches.find((match) => match.matchNumber === 73)

    expect(match73.source).toBe('backend')
    expect(match73.homeTeam.name).toBe('México')
  })

  it('does not replace a placeholder when the compound match is insecure', () => {
    const backendMatch = createBackendMatch({
      matchNumber: undefined,
      templateCode: undefined,
      round: 'Dieciseisavos de final',
      date: '2026-06-28T22:00:00.000Z',
      stadium: { name: 'Unknown Stadium' },
    })
    const matches = buildKnockoutStageMatches([backendMatch])
    const match73 = matches.find((match) => match.matchNumber === 73)

    expect(match73.source).toBe('skeleton')
    expect(match73.homeTeam).toBeNull()
  })

  it('keeps skeleton fallback for missing backend matches and reports partial data', () => {
    const matches = buildKnockoutStageMatches([createBackendMatch({ matchNumber: 73 })])
    const match74 = matches.find((match) => match.matchNumber === 74)
    const summary = getKnockoutSummary(matches)

    expect(match74.source).toBe('skeleton')
    expect(summary).toEqual({
      backendCount: 1,
      skeletonCount: 31,
      totalCount: 32,
      hasBackendData: true,
      hasPartialBackendData: true,
    })
  })

  it('uses scores and penalties only when backend provides them', () => {
    const matches = buildKnockoutStageMatches([
      createBackendMatch({
        matchNumber: 101,
        templateCode: 'KO-101',
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: 4,
        awayPenaltyScore: 3,
      }),
    ])
    const match101 = matches.find((match) => match.matchNumber === 101)

    expect(getScoreLabel(match101)).toBe('1 - 1')
    expect(getPenaltyLabel(match101)).toBe('Penales: 4 - 3')
    expect(match101.winnerLabel).toBe('Ganador registrado: México')
    expect(getKnockoutSlotState(match101, 'home')).toBe('winner')
    expect(getKnockoutSlotState(match101, 'away')).toBe('loser')
  })

  it('does not derive a winner when real data is incomplete', () => {
    const matches = buildKnockoutStageMatches([
      createBackendMatch({
        matchNumber: 101,
        templateCode: 'KO-101',
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 1,
        homePenaltyScore: null,
        awayPenaltyScore: null,
      }),
    ])
    const match101 = matches.find((match) => match.matchNumber === 101)

    expect(match101.winnerSide).toBeNull()
    expect(match101.winnerLabel).toBe('')
  })

  it('normalizes strings across casing, accents and stadium language differences', () => {
    expect(normalizeMatchText('  Estadio Los Ángeles  ')).toBe('los angeles')
    expect(normalizeMatchText('LOS ANGELES STADIUM')).toBe('los angeles')
  })

  it('preserves English internal keys without forcing them into display labels', () => {
    const skeletonMatch = knockoutStageSkeleton[0]

    expect(skeletonMatch.roundKey).toBe('round-of-32')
    expect(skeletonMatch.status).toBe('pending-qualified-teams')
    expect(skeletonMatch.roundLabel).toBe('Dieciseisavos de final')
    expect(skeletonMatch.statusLabel).toBe('Pendiente de clasificación')
  })

  it('builds all rounds for the visual bracket view without filtering the full cuadro', () => {
    const matches = buildKnockoutStageMatches([])
    const rounds = buildKnockoutBracketViewRounds(matches)

    expect(rounds.map((round) => round.roundLabel)).toEqual([
      'Dieciseisavos de final',
      'Octavos de final',
      'Cuartos de final',
      'Semifinales',
      'Partido por el tercer puesto',
      'Final',
    ])
    expect(rounds.map((round) => round.matches.length)).toEqual([16, 8, 4, 2, 1, 1])
  })

  it('orders visual bracket rounds by upstream sources instead of chronological quarter-final order', () => {
    const matches = buildKnockoutStageMatches([])
    const chronologicalQuarterFinals = [97, 98, 99, 100].map((matchNumber) =>
      matches.find((match) => match.matchNumber === matchNumber),
    )
    const matchesWithChronologicalQuarterFinals = [
      ...matches.filter((match) => match.roundKey !== 'quarter-finals'),
      ...chronologicalQuarterFinals,
    ]

    const rounds = buildKnockoutBracketViewRounds(matchesWithChronologicalQuarterFinals)
    const quarterFinals = rounds.find((round) => round.roundKey === 'quarter-finals')

    expect(chronologicalQuarterFinals.map((match) => match.matchNumber)).toEqual([97, 98, 99, 100])
    expect(quarterFinals.matches.map((match) => match.matchNumber)).toEqual([97, 99, 98, 100])
    expect(quarterFinals.matches.find((match) => match.matchNumber === 98)).toMatchObject({
      homePlaceholder: 'Ganador Partido 93',
      awayPlaceholder: 'Ganador Partido 94',
    })
    expect(quarterFinals.matches.find((match) => match.matchNumber === 99)).toMatchObject({
      homePlaceholder: 'Ganador Partido 91',
      awayPlaceholder: 'Ganador Partido 92',
    })

    const shuffledQuarterFinals = [98, 100, 97, 99].map((matchNumber) =>
      matches.find((match) => match.matchNumber === matchNumber),
    )
    const roundsFromShuffledQuarterFinals = buildKnockoutBracketViewRounds([
      ...matches.filter((match) => match.roundKey !== 'quarter-finals'),
      ...shuffledQuarterFinals,
    ])

    expect(
      roundsFromShuffledQuarterFinals
        .find((round) => round.roundKey === 'quarter-finals')
        .matches.map((match) => match.matchNumber),
    ).toEqual([97, 99, 98, 100])
  })

  it('labels visual bracket slot states in Spanish', () => {
    const matches = buildKnockoutStageMatches([])
    const pendingPlaceholderMatch = matches.find((match) => match.matchNumber === 73)
    const pendingRealMatch = buildKnockoutStageMatches([createBackendMatch()]).find(
      (match) => match.matchNumber === 73,
    )

    expect(getKnockoutSlotState(pendingPlaceholderMatch, 'home')).toBe('placeholder')
    expect(getKnockoutSlotStateLabel('placeholder')).toBe('Por definir')
    expect(getKnockoutSlotState(pendingRealMatch, 'home')).toBe('pending')
    expect(getKnockoutSlotStateLabel('pending')).toBe('Pendiente')
    expect(getKnockoutSlotStateLabel('winner')).toBe('Ganador')
    expect(getKnockoutSlotStateLabel('loser')).toBe('Eliminado')
  })
})
