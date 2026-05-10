import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../api/axiosClient'
import { getAdminMatches, updateAdminMatch } from './adminMatchesService'

describe('adminMatchesService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads admin matches through the shared matches endpoint with credentials', async () => {
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValue({
      data: [{ _id: 'match-1', stage: 'GRUPO A', status: 'PENDING' }],
    })

    await expect(getAdminMatches()).resolves.toEqual([
      { _id: 'match-1', stage: 'GRUPO A', status: 'PENDING' },
    ])

    expect(getSpy).toHaveBeenCalledWith('/api/matches', { withCredentials: true })
  })

  it('updates matches with PUT /api/matches/:id and does not use admin-prefixed match routes', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put').mockResolvedValue({ data: { status: 'success' } })

    await expect(updateAdminMatch('match-1', {
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 1,
      homePenaltyScore: undefined,
    })).resolves.toEqual({ status: 'success' })

    expect(putSpy).toHaveBeenCalledWith(
      '/api/matches/match-1',
      { status: 'FINISHED', homeScore: 2, awayScore: 1 },
      { withCredentials: true },
    )
    expect(putSpy.mock.calls[0][0]).not.toContain('/api/admin/matches')
  })

  it('rejects updates without a match id before calling the backend', async () => {
    const putSpy = vi.spyOn(axiosClient, 'put')

    await expect(updateAdminMatch('', { status: 'PENDING' })).rejects.toMatchObject({
      source: 'adminMatchesService',
    })
    expect(putSpy).not.toHaveBeenCalled()
  })
})
