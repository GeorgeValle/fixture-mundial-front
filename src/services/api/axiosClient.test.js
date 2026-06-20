import { describe, expect, it } from 'vitest'
import { axiosClient } from './axiosClient'

describe('axiosClient', () => {
  it('uses the configured API base URL', () => {
    expect(axiosClient.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL ?? '')
  })

  it('sends credentials by default for HttpOnly admin cookies', () => {
    expect(axiosClient.defaults.withCredentials).toBe(true)
  })
})
