import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../api/axiosClient'
import {
  getAdminTransitionMatches,
  getAdminTransitionStandings,
  getTransitionReadiness,
  processGroupTransition,
} from './adminTransitionService'

describe('adminTransitionService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads transition standings through GET /api/standings with credentials', async () => {
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValue({
      data: {
        status: 'success',
        data: [{ group: 'A', teams: [] }],
      },
    })

    await expect(getAdminTransitionStandings()).resolves.toEqual([{ group: 'A', teams: [] }])

    expect(getSpy).toHaveBeenCalledWith('/api/standings', { withCredentials: true })
  })

  it('loads transition matches through GET /api/matches with credentials', async () => {
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValue({
      data: [{ _id: 'match-73', matchNumber: 73, stage: 'ROUND_OF_32', status: 'PENDING' }],
    })

    await expect(getAdminTransitionMatches()).resolves.toEqual([
      { _id: 'match-73', matchNumber: 73, stage: 'ROUND_OF_32', status: 'PENDING' },
    ])

    expect(getSpy).toHaveBeenCalledWith('/api/matches', { withCredentials: true })
  })

  it('processes a group transition with the confirmed endpoint, body and credentials', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValue({
      data: {
        status: 'success',
        message: 'Los clasificados del Grupo A han sido inyectados en el cuadro de dieciseisavos.',
      },
    })

    await expect(processGroupTransition('A')).resolves.toEqual({
      status: 'success',
      message: 'Los clasificados del Grupo A han sido inyectados en el cuadro de dieciseisavos.',
    })

    expect(postSpy).toHaveBeenCalledWith(
      '/api/admin/classify-group',
      { group: 'A' },
      { withCredentials: true },
    )
    expect(postSpy.mock.calls[0][1]).toEqual({ group: 'A' })
    expect(postSpy.mock.calls[0][1]).not.toHaveProperty('teams')
    expect(postSpy.mock.calls[0][1]).not.toHaveProperty('standings')
    expect(postSpy.mock.calls[0][1]).not.toHaveProperty('positions')
    expect(postSpy.mock.calls[0][1]).not.toHaveProperty('slots')
  })

  it('normalizes the selected group before sending it to the backend', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValue({
      data: { status: 'success', message: 'Grupo A procesado' },
    })

    await processGroupTransition(' a ')

    expect(postSpy).toHaveBeenCalledWith(
      '/api/admin/classify-group',
      { group: 'A' },
      { withCredentials: true },
    )
  })

  it('rejects an empty group before calling the backend', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post')

    await expect(processGroupTransition('')).rejects.toMatchObject({
      source: 'adminTransitionService',
      message: 'Es necesario especificar el grupo para procesar la transición.',
    })
    expect(postSpy).not.toHaveBeenCalled()
  })

  it('surfaces backend transition errors', async () => {
    vi.spyOn(axiosClient, 'post').mockRejectedValue({
      source: 'axiosClient',
      message: 'Es necesario especificar el grupo para procesar la transición.',
      status: 400,
    })

    await expect(processGroupTransition('A')).rejects.toMatchObject({
      message: 'Es necesario especificar el grupo para procesar la transición.',
      status: 400,
    })
  })

  it('builds read-only readiness signals without calculating authoritative qualifiers', () => {
    const readiness = getTransitionReadiness({
      standings: [
        {
          group: 'A',
          teams: [
            { team: { name: 'Argentina', position: 1, qualifiedTo: 'ROUND_OF_32' } },
            { team: { name: 'Canadá', position: 2, qualifiedTo: null } },
          ],
        },
      ],
      matches: [
        {
          matchNumber: 73,
          stage: 'ROUND_OF_32',
          homeTeam: { name: 'Argentina' },
          awayTeam: null,
        },
      ],
    })

    expect(readiness).toEqual(
      expect.objectContaining({
        groupsFound: 1,
        groupsWithTeams: 1,
        totalStandingTeams: 2,
        teamsWithPosition: 2,
        teamsMarkedRoundOf32: 1,
        roundOf32MatchesFound: 1,
        populatedRoundOf32Slots: 1,
        pendingRoundOf32Slots: 1,
      }),
    )
  })
})
