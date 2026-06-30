import { describe, expect, it } from 'vitest'
import {
  buildQualifiedThirdPlaceTeamKeys,
  buildKnockoutTeamKeys,
  getGroupStandingBadge,
  GROUP_STANDING_BADGE_VARIANTS,
  hasReliableRoundOf32Context,
  getTeamKey,
} from './groupStandingBadge'

function createRow(position, teamOverrides = {}) {
  return {
    team: {
      _id: 'team-south-africa',
      name: 'Sudáfrica',
      group: 'A',
      position,
      qualifiedTo: null,
      ...teamOverrides,
    },
  }
}

function expectBadge(row, context, expectedBadge) {
  expect(getGroupStandingBadge(row, context)).toMatchObject(expectedBadge)
}

function createRoundOf32Matches(seedOverrides = {}) {
  return Array.from({ length: 16 }, (_, index) => {
    const matchNumber = 73 + index
    const override = seedOverrides[matchNumber] ?? {}

    return {
      matchNumber,
      homeTeam: {
        _id: `team-${matchNumber}-home`,
        name: `Equipo ${matchNumber} Local`,
        group: 'Z',
      },
      awayTeam: {
        _id: `team-${matchNumber}-away`,
        name: `Equipo ${matchNumber} Visitante`,
        group: 'Z',
      },
      ...override,
    }
  })
}

function createStageOnlyRoundOf32Matches(seedOverrides = {}) {
  return Array.from({ length: 16 }, (_, index) => {
    const matchKey = `match-${index + 1}`
    const override = seedOverrides[matchKey] ?? {}

    return {
      _id: matchKey,
      stage: 'ROUND_OF_32',
      homeTeam: {
        _id: `stage-team-${index + 1}-home`,
        name: `Stage Equipo ${index + 1} Local`,
        group: 'Z',
      },
      awayTeam: {
        _id: `stage-team-${index + 1}-away`,
        name: `Stage Equipo ${index + 1} Visitante`,
        group: 'Z',
      },
      ...override,
    }
  })
}

describe('groupStandingBadge', () => {
  it('does not show a confirmed classification badge for first place when the group is incomplete', () => {
    expect(getGroupStandingBadge(createRow(1), { isGroupComplete: false })).toBeNull()
  })

  it('does not show a confirmed classification badge for second place when the group is incomplete', () => {
    expect(getGroupStandingBadge(createRow(2), { isGroupComplete: false })).toBeNull()
  })

  it('keeps first place classified to round of 32 even after tournament elimination', () => {
    expectBadge(
      createRow(1, { qualifiedTo: 'ELIMINATED' }),
      {
        isGroupComplete: true,
      },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('keeps second place classified to round of 32 even after tournament elimination', () => {
    expectBadge(
      createRow(2, { qualifiedTo: 'ELIMINATED' }),
      {
        isGroupComplete: true,
      },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('marks a third-place team as classified when it is inside qualified third places', () => {
    const qualifiedThirdPlaceTeamKeys = buildQualifiedThirdPlaceTeamKeys([
      {
        team: { _id: 'team-south-africa', name: 'Sudáfrica', group: 'A' },
        isQualifiedThirdPlace: true,
      },
    ])

    expectBadge(
      createRow(3),
      {
        qualifiedThirdPlaceTeamKeys,
        hasReliableThirdPlaceRanking: true,
        isGroupComplete: true,
      },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('marks a third-place team as eliminated in groups when reliable third-place ranking excludes it', () => {
    expectBadge(
      createRow(3),
      {
        qualifiedThirdPlaceTeamKeys: new Set(['team-id:other-team']),
        hasReliableThirdPlaceRanking: true,
        isGroupComplete: true,
      },
      {
        label: 'Eliminado en grupos',
        variant: GROUP_STANDING_BADGE_VARIANTS.eliminated,
      },
    )
  })

  it('uses a pending fallback for a third-place team when knockout context is missing', () => {
    expectBadge(
      createRow(3),
      {
        qualifiedThirdPlaceTeamKeys: new Set(),
        hasReliableThirdPlaceRanking: false,
        isGroupComplete: true,
      },
      {
        label: 'Pendiente',
        variant: GROUP_STANDING_BADGE_VARIANTS.pending,
      },
    )
  })

  it('marks fourth place as eliminated in groups', () => {
    expectBadge(
      createRow(4),
      {
        isGroupComplete: true,
      },
      {
        label: 'Eliminado en grupos',
        variant: GROUP_STANDING_BADGE_VARIANTS.eliminated,
      },
    )
  })

  it('does not invent a confirmed badge when team position is null', () => {
    expect(
      getGroupStandingBadge(createRow(null), {
        qualifiedThirdPlaceTeamKeys: new Set(),
        hasReliableThirdPlaceRanking: true,
        isGroupComplete: true,
      }),
    ).toBeNull()
  })

  it('does not let advanced qualifiedTo values change the historical group badge', () => {
    expectBadge(
      createRow(2, { qualifiedTo: 'ROUND_OF_16' }),
      {
        isGroupComplete: true,
      },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('can match qualified third-place teams by normalized name and group fallback when ids differ', () => {
    const qualifiedThirdPlaceTeamKeys = buildQualifiedThirdPlaceTeamKeys([
      {
        team: { name: 'Sudafrica', group: 'A' },
        isQualifiedThirdPlace: true,
      },
    ])

    expect(getTeamKey({ name: 'Sudáfrica', group: 'A' })).toBe(
      'team-name-group:sudafrica|a',
    )
    expectBadge(
      createRow(3, { _id: undefined }),
      {
        qualifiedThirdPlaceTeamKeys,
        hasReliableThirdPlaceRanking: true,
        isGroupComplete: true,
      },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('keeps third place pending when matches only include group-stage fixtures', () => {
    const matches = [
      {
        matchNumber: 1,
        homeTeam: { _id: 'team-south-africa', name: 'Sudáfrica', group: 'A' },
        awayTeam: { _id: 'team-mexico', name: 'México', group: 'A' },
      },
    ]

    expect(hasReliableRoundOf32Context(matches)).toBe(false)
    expectBadge(
      createRow(3),
      {
        knockoutTeamKeys: buildKnockoutTeamKeys(matches),
        hasReliableThirdPlaceRanking: false,
        isGroupComplete: true,
      },
      {
        label: 'Pendiente',
        variant: GROUP_STANDING_BADGE_VARIANTS.pending,
      },
    )
  })

  it('keeps third place pending when round of 32 slots are not fully seeded with real teams', () => {
    const matches = createRoundOf32Matches({
      73: {
        matchNumber: 73,
        homeTeam: { name: 'TBD', group: 'A' },
        awayTeam: { _id: 'team-mexico', name: 'México', group: 'A' },
      },
    })

    expect(hasReliableRoundOf32Context(matches)).toBe(false)
    expectBadge(
      createRow(3),
      {
        knockoutTeamKeys: buildKnockoutTeamKeys(matches),
        hasReliableThirdPlaceRanking: false,
        isGroupComplete: true,
      },
      {
        label: 'Pendiente',
        variant: GROUP_STANDING_BADGE_VARIANTS.pending,
      },
    )
  })

  it('includes stage-only round-of-32 teams in optional knockout key fallback helpers', () => {
    const knockoutTeamKeys = buildKnockoutTeamKeys([
      {
        stage: 'ROUND_OF_32',
        homeTeam: { _id: 'team-south-africa', name: 'Sudáfrica', group: 'A' },
        awayTeam: { _id: 'team-mexico', name: 'México', group: 'A' },
      },
    ])

    expect(knockoutTeamKeys.has('team-id:team-south-africa')).toBe(true)
    expect(knockoutTeamKeys.has('team-id:team-mexico')).toBe(true)
  })

  it('includes roundKey-only round-of-32 teams in optional knockout key fallback helpers', () => {
    const knockoutTeamKeys = buildKnockoutTeamKeys([
      {
        roundKey: 'round-of-32',
        homeTeam: { _id: 'team-south-africa', name: 'Sudáfrica', group: 'A' },
        awayTeam: { _id: 'team-mexico', name: 'México', group: 'A' },
      },
    ])

    expect(knockoutTeamKeys.has('team-id:team-south-africa')).toBe(true)
    expect(knockoutTeamKeys.has('team-id:team-mexico')).toBe(true)
  })

  it('treats fully seeded stage-only round-of-32 matches as reliable optional context', () => {
    expect(hasReliableRoundOf32Context(createStageOnlyRoundOf32Matches())).toBe(true)
  })
})
