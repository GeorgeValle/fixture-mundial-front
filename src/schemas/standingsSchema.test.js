import { describe, expect, it } from 'vitest'
import { parseStandingsResponse } from './standingsSchema'

function createStandingPayload(overrides = {}) {
  return {
    status: 'success',
    data: [
      {
        group: 'A',
        teams: [
          {
            team: {
              _id: 'team-mexico',
              name: 'México',
              shieldUrl: 'https://example.com/mexico.svg',
              group: 'A',
              confederation: 'CONCACAF',
              position: null,
              qualifiedTo: null,
            },
            pj: 0,
            pg: 0,
            pe: 0,
            pp: 0,
            gf: 0,
            gc: 0,
            dif: 0,
            pts: 0,
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('standingsSchema', () => {
  it('parses the confirmed standings response wrapper', () => {
    const standings = parseStandingsResponse(createStandingPayload())

    expect(standings).toHaveLength(1)
    expect(standings[0].group).toBe('A')
    expect(standings[0].teams[0].team.name).toBe('México')
    expect(standings[0].teams[0]).toMatchObject({
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dif: 0,
      pts: 0,
    })
  })

  it('accepts null position and qualifiedTo values', () => {
    const standings = parseStandingsResponse(createStandingPayload())

    expect(standings[0].teams[0].team.position).toBeNull()
    expect(standings[0].teams[0].team.qualifiedTo).toBeNull()
  })

  it('throws a controlled parser error for invalid payloads', () => {
    expect(() => parseStandingsResponse({ status: 'success', items: [] })).toThrow(
      'Invalid standings response shape',
    )
    expect(() =>
      parseStandingsResponse({ status: 'success', data: [{ group: 'A', teams: [{}] }] }),
    ).toThrow('Invalid standings response shape')
  })
})
