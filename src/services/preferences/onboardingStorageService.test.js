import { afterEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import {
  clearHomeTutorialSeen,
  hasSeenHomeTutorial,
  markHomeTutorialSeen,
} from './onboardingStorageService'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('onboardingStorageService', () => {
  it('stores and reads the Home tutorial seen flag', () => {
    expect(hasSeenHomeTutorial()).toBe(false)

    expect(markHomeTutorialSeen()).toBe(true)

    expect(window.localStorage.getItem(STORAGE_KEYS.homeTutorialSeen)).toBe('true')
    expect(hasSeenHomeTutorial()).toBe(true)
  })

  it('clears the Home tutorial seen flag', () => {
    markHomeTutorialSeen()

    expect(clearHomeTutorialSeen()).toBe(true)

    expect(hasSeenHomeTutorial()).toBe(false)
  })

  it('uses a safe fallback when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    expect(hasSeenHomeTutorial()).toBe(false)
    expect(markHomeTutorialSeen()).toBe(false)
    expect(clearHomeTutorialSeen()).toBe(false)
  })
})
