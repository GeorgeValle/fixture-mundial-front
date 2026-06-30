import { describe, expect, it } from 'vitest'
import {
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
        knockoutTeamKeys: new Set(),
        hasReliableKnockoutContext: false,
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
        knockoutTeamKeys: new Set(),
        hasReliableKnockoutContext: false,
        isGroupComplete: true,
      },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('marks a third-place team as classified when it appears in real knockout matches', () => {
    const matches = createRoundOf32Matches({
      73: {
        matchNumber: 73,
        homeTeam: { _id: 'team-south-africa', name: 'Sudáfrica', group: 'A' },
        awayTeam: { _id: 'team-mexico', name: 'México', group: 'A' },
      },
    })
    const knockoutTeamKeys = buildKnockoutTeamKeys(matches)

    expectBadge(
      createRow(3),
      {
        knockoutTeamKeys,
        hasReliableKnockoutContext: hasReliableRoundOf32Context(matches),
        isGroupComplete: true,
      },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('marks a third-place team as eliminated in groups when knockout context loaded without that team', () => {
    const matches = createRoundOf32Matches()
    const knockoutTeamKeys = buildKnockoutTeamKeys(matches)

    expectBadge(
      createRow(3),
      {
        knockoutTeamKeys,
        hasReliableKnockoutContext: hasReliableRoundOf32Context(matches),
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
        knockoutTeamKeys: new Set(),
        hasReliableKnockoutContext: false,
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
        knockoutTeamKeys: new Set(),
        hasReliableKnockoutContext: false,
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
        knockoutTeamKeys: new Set(),
        hasReliableKnockoutContext: true,
        isGroupComplete: true,
      }),
    ).toBeNull()
  })

  it('does not let advanced qualifiedTo values change the historical group badge', () => {
    expectBadge(
      createRow(2, { qualifiedTo: 'ROUND_OF_16' }),
      {
        knockoutTeamKeys: new Set(),
        hasReliableKnockoutContext: true,
        isGroupComplete: true,
      },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('can match knockout teams by normalized name and group fallback when ids differ', () => {
    const matches = createRoundOf32Matches({
      73: {
        matchNumber: '73',
        homeTeam: { name: 'Sudafrica', group: 'A' },
        awayTeam: { _id: 'team-mexico', name: 'México', group: 'A' },
      },
    })
    const knockoutTeamKeys = buildKnockoutTeamKeys(matches)

    expect(getTeamKey({ name: 'Sudáfrica', group: 'A' })).toBe(
      'team-name-group:sudafrica|a',
    )
    expectBadge(
      createRow(3, { _id: undefined }),
      {
        knockoutTeamKeys,
        hasReliableKnockoutContext: hasReliableRoundOf32Context(matches),
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
        hasReliableKnockoutContext: hasReliableRoundOf32Context(matches),
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
        hasReliableKnockoutContext: hasReliableRoundOf32Context(matches),
        isGroupComplete: true,
      },
      {
        label: 'Pendiente',
        variant: GROUP_STANDING_BADGE_VARIANTS.pending,
      },
    )
  })
})
