import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../api/axiosClient'
import { ADMIN_STANDINGS_RECALCULATION_STATUS, getAdminStandings } from './adminStandingsService'

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

  it('keeps standings recalculation disabled until the backend endpoint is confirmed', () => {
    expect(ADMIN_STANDINGS_RECALCULATION_STATUS).toEqual({
      isConfirmed: false,
      message: 'Endpoint de recálculo pendiente de confirmación',
    })
  })
})
