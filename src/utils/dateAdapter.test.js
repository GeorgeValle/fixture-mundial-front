import { describe, expect, it } from 'vitest'
import {
  formatDisplayDate,
  formatDisplayTime,
  getTodayISODate,
  isMatchStarted,
  isPastMatch,
  sortMatchesByDate,
} from './dateAdapter'

describe('dateAdapter', () => {
  it('formats display date and time with native Intl helpers', () => {
    const value = '2026-06-11T21:00:00Z'

    expect(formatDisplayDate(value)).toContain('2026')
    expect(formatDisplayTime(value)).toMatch(/\d{2}:\d{2}/)
  })

  it('returns safe labels for invalid dates', () => {
    expect(formatDisplayDate(null)).toBe('Fecha por confirmar')
    expect(formatDisplayTime('not-a-date')).toBe('Hora por confirmar')
  })

  it('returns the current local ISO date without time', () => {
    expect(getTodayISODate(new Date(2026, 5, 11, 21, 30))).toBe('2026-06-11')
  })

  it('sorts matches by date and keeps undated matches at the end', () => {
    const matches = [
      { _id: 'future', date: '2026-06-12T18:00:00Z' },
      { _id: 'unknown', date: null },
      { _id: 'first', date: '2026-06-11T18:00:00Z' },
    ]

    expect(sortMatchesByDate(matches).map((match) => match._id)).toEqual([
      'first',
      'future',
      'unknown',
    ])
    expect(matches[0]._id).toBe('future')
  })

  it('detects past and started matches', () => {
    const now = '2026-06-11T21:00:00Z'

    expect(isPastMatch({ date: '2026-06-11T20:59:59Z' }, now)).toBe(true)
    expect(isPastMatch({ date: '2026-06-11T21:00:00Z' }, now)).toBe(false)
    expect(isMatchStarted({ date: '2026-06-11T21:00:00Z' }, now)).toBe(true)
    expect(isMatchStarted({ date: '2026-06-11T21:00:01Z' }, now)).toBe(false)
  })
})
