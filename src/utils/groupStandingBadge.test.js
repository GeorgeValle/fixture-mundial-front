import { describe, expect, it } from 'vitest'
import {
  buildKnockoutTeamKeys,
  getGroupStandingBadge,
  GROUP_STANDING_BADGE_VARIANTS,
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

describe('groupStandingBadge', () => {
  it('keeps first place classified to round of 32 even after tournament elimination', () => {
    expectBadge(
      createRow(1, { qualifiedTo: 'ELIMINATED' }),
      { knockoutTeamKeys: new Set(), hasKnockoutContext: true },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('keeps second place classified to round of 32 even after tournament elimination', () => {
    expectBadge(
      createRow(2, { qualifiedTo: 'ELIMINATED' }),
      { knockoutTeamKeys: new Set(), hasKnockoutContext: true },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('marks a third-place team as classified when it appears in real knockout matches', () => {
    const knockoutTeamKeys = buildKnockoutTeamKeys([
      {
        matchNumber: 73,
        homeTeam: { _id: 'team-south-africa', name: 'Sudáfrica', group: 'A' },
        awayTeam: { _id: 'team-mexico', name: 'México', group: 'A' },
      },
    ])

    expectBadge(
      createRow(3),
      { knockoutTeamKeys, hasKnockoutContext: true },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('marks a third-place team as eliminated in groups when knockout context loaded without that team', () => {
    const knockoutTeamKeys = buildKnockoutTeamKeys([
      {
        matchNumber: 73,
        homeTeam: { _id: 'team-mexico', name: 'México', group: 'A' },
        awayTeam: { _id: 'team-canada', name: 'Canadá', group: 'B' },
      },
    ])

    expectBadge(
      createRow(3),
      { knockoutTeamKeys, hasKnockoutContext: true },
      {
        label: 'Eliminado en grupos',
        variant: GROUP_STANDING_BADGE_VARIANTS.eliminated,
      },
    )
  })

  it('uses a pending fallback for a third-place team when knockout context is missing', () => {
    expectBadge(
      createRow(3),
      { knockoutTeamKeys: new Set(), hasKnockoutContext: false },
      {
        label: 'Pendiente',
        variant: GROUP_STANDING_BADGE_VARIANTS.pending,
      },
    )
  })

  it('marks fourth place as eliminated in groups', () => {
    expectBadge(
      createRow(4),
      { knockoutTeamKeys: new Set(), hasKnockoutContext: false },
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
        hasKnockoutContext: true,
      }),
    ).toBeNull()
  })

  it('does not let advanced qualifiedTo values change the historical group badge', () => {
    expectBadge(
      createRow(2, { qualifiedTo: 'ROUND_OF_16' }),
      { knockoutTeamKeys: new Set(), hasKnockoutContext: true },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })

  it('can match knockout teams by normalized name and group fallback when ids differ', () => {
    const knockoutTeamKeys = buildKnockoutTeamKeys([
      {
        matchNumber: '73',
        homeTeam: { name: 'Sudafrica', group: 'A' },
        awayTeam: null,
      },
    ])

    expect(getTeamKey({ name: 'Sudáfrica', group: 'A' })).toBe(
      'team-name-group:sudafrica|a',
    )
    expectBadge(
      createRow(3, { _id: undefined }),
      { knockoutTeamKeys, hasKnockoutContext: true },
      {
        label: 'Clasificado a 16avos',
        variant: GROUP_STANDING_BADGE_VARIANTS.qualified,
      },
    )
  })
})
