import { afterEach, describe, expect, it, vi } from 'vitest'
import { axiosClient } from '../api/axiosClient'
import { logoutAdmin } from './adminAuthService'

describe('adminAuthService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs out the admin through axiosClient defaults and without sending null as body', async () => {
    const postSpy = vi
      .spyOn(axiosClient, 'post')
      .mockResolvedValue({ data: { status: 'success' } })

    await expect(logoutAdmin()).resolves.toEqual({ status: 'success' })

    expect(postSpy).toHaveBeenCalledWith('/api/auth/logout', {})
    expect(postSpy.mock.calls[0][1]).not.toBeNull()
  })
})
