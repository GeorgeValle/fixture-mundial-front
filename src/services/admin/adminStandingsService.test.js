import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../api/axiosClient'
import { getAdminStandings, recalculateAdminGroupStandings } from './adminStandingsService'

describe('adminStandingsService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads standings through GET /api/standings with credentials', async () => {
    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValue({
      data: {
        status: 'success',
        data: [
          {
            group: 'A',
            teams: [],
          },
        ],
      },
    })

    await expect(getAdminStandings()).resolves.toEqual([{ group: 'A', teams: [] }])

    expect(getSpy).toHaveBeenCalledWith('/api/standings', { withCredentials: true })
  })

  it('recalculates a group through POST /api/standings/A with credentials', async () => {
    const postSpy = vi
      .spyOn(axiosClient, 'post')
      .mockResolvedValue({ data: { status: 'success', message: 'Standings actualizados' } })

    await expect(recalculateAdminGroupStandings('a')).resolves.toEqual({
      status: 'success',
      message: 'Standings actualizados',
    })

    expect(postSpy).toHaveBeenCalledWith('/api/standings/A', null, { withCredentials: true })
  })

  it('rejects an empty group before calling the backend', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post')

    await expect(recalculateAdminGroupStandings('')).rejects.toMatchObject({
      source: 'adminStandingsService',
    })

    expect(postSpy).not.toHaveBeenCalled()
  })

  it('rejects an invalid group before calling the backend', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post')

    await expect(recalculateAdminGroupStandings('Z')).rejects.toMatchObject({
      source: 'adminStandingsService',
    })

    expect(postSpy).not.toHaveBeenCalled()
  })

  it('normalizes lowercase group input to uppercase when recalculating', async () => {
    const postSpy = vi
      .spyOn(axiosClient, 'post')
      .mockResolvedValue({ data: { status: 'success', message: 'OK' } })

    await recalculateAdminGroupStandings('a')

    expect(postSpy).toHaveBeenCalledWith('/api/standings/A', null, { withCredentials: true })
  })

  it('does not use /api/admin/standings/:group', async () => {
    const postSpy = vi.spyOn(axiosClient, 'post').mockResolvedValue({ data: { status: 'success' } })

    await recalculateAdminGroupStandings('b')

    expect(postSpy).toHaveBeenCalledTimes(1)
    const [calledPath] = postSpy.mock.calls[0]
    expect(calledPath).toBe('/api/standings/B')
  })

  it('handles backend errors as service errors', async () => {
    vi.spyOn(axiosClient, 'post').mockRejectedValue(new Error('Backend unavailable'))

    await expect(recalculateAdminGroupStandings('c')).rejects.toMatchObject({
      source: 'adminStandingsService',
      message: 'No pudimos recalcular los standings del grupo.',
    })
  })
})
