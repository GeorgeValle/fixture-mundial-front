import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../api/axiosClient'
import { getDailySchedule } from './matchesService'

describe('matchesService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads the daily schedule with browser local day UTC range params', async () => {
    const currentDate = new Date(2026, 5, 11, 21, 30)
    const expectedStart = new Date(currentDate.getTime())
    const expectedEnd = new Date(currentDate.getTime())

    expectedStart.setHours(0, 0, 0, 0)
    expectedEnd.setHours(23, 59, 59, 999)

    const getSpy = vi.spyOn(axiosClient, 'get').mockResolvedValue({
      data: {
        status: 'success',
        data: {
          today: [],
          next: [],
          nextDate: null,
        },
      },
    })

    await expect(getDailySchedule(currentDate)).resolves.toEqual({
      today: [],
      next: [],
      nextDate: null,
    })

    expect(getSpy).toHaveBeenCalledWith('/api/matches/schedule/daily', {
      params: {
        start: expectedStart.toISOString(),
        end: expectedEnd.toISOString(),
      },
    })
    expect(getSpy.mock.calls[0][1].params).not.toHaveProperty('date')
  })
})
