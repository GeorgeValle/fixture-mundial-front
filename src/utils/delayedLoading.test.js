import { describe, expect, it } from 'vitest'
import { DELAYED_LOADING_THRESHOLD_MS, shouldShowDelayedLoading } from './delayedLoading'

describe('delayedLoading', () => {
  it('only activates after the configured threshold', () => {
    const startedAt = new Date('2026-06-11T21:00:00Z')

    expect(
      shouldShowDelayedLoading(
        startedAt,
        new Date(startedAt.getTime() + DELAYED_LOADING_THRESHOLD_MS - 1),
      ),
    ).toBe(false)
    expect(
      shouldShowDelayedLoading(
        startedAt,
        new Date(startedAt.getTime() + DELAYED_LOADING_THRESHOLD_MS),
      ),
    ).toBe(true)
  })

  it('supports timestamps and ISO strings', () => {
    expect(shouldShowDelayedLoading(0, DELAYED_LOADING_THRESHOLD_MS)).toBe(true)
    expect(
      shouldShowDelayedLoading('2026-06-11T21:00:00Z', '2026-06-11T21:00:07Z'),
    ).toBe(true)
  })
})
