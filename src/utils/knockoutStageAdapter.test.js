import { describe, expect, it } from 'vitest'
import { knockoutStageSkeleton } from '../data/knockoutStageSkeleton'
import {
  buildKnockoutStageMatches,
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
    expect(match101.winnerLabel).toBe('Ganador oficial: México')
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
})
