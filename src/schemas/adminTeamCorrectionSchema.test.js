import { describe, expect, it } from 'vitest'
import { getQualifiedToLabel } from '../constants/qualifiedTo'
import {
  ADMIN_TEAM_CORRECTION_MESSAGES,
  buildAdminTeamCorrectionPayload,
} from './adminTeamCorrectionSchema'

const team = {
  _id: 'team-1',
  name: 'Argentina',
  group: 'A',
  shieldUrl: 'https://example.com/argentina.svg',
  position: 1,
  qualifiedTo: 'ROUND_OF_32',
}

describe('adminTeamCorrectionSchema', () => {
  it('builds a partial payload only with changed allowed fields', () => {
    const result = buildAdminTeamCorrectionPayload(team, {
      position: '2',
      qualifiedTo: 'ROUND_OF_16',
      shieldUrl: 'https://example.com/argentina-new.svg',
    })

    expect(result).toEqual({
      isValid: true,
      errors: [],
      payload: {
        position: 2,
        qualifiedTo: 'ROUND_OF_16',
        shieldUrl: 'https://example.com/argentina-new.svg',
      },
    })
  })

  it('omits unchanged and blank values', () => {
    const result = buildAdminTeamCorrectionPayload(team, {
      position: '1',
      qualifiedTo: 'ELIMINATED',
      shieldUrl: '',
    })

    expect(result).toEqual({
      isValid: true,
      errors: [],
      payload: {
        qualifiedTo: 'ELIMINATED',
      },
    })
  })

  it('accepts null as canonical qualifiedTo value', () => {
    const result = buildAdminTeamCorrectionPayload(team, {
      qualifiedTo: null,
    })

    expect(result.isValid).toBe(true)
    expect(result.payload).toEqual({ qualifiedTo: null })
  })

  it('rejects invalid position, shieldUrl and legacy qualifiedTo payloads', () => {
    const result = buildAdminTeamCorrectionPayload(team, {
      position: '-1',
      qualifiedTo: '16AVOS',
      shieldUrl: 'no-es-url',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([
      ADMIN_TEAM_CORRECTION_MESSAGES.invalidPosition,
      ADMIN_TEAM_CORRECTION_MESSAGES.invalidQualifiedTo,
      ADMIN_TEAM_CORRECTION_MESSAGES.invalidShieldUrl,
    ]))
  })

  it('rejects blocked fields', () => {
    const result = buildAdminTeamCorrectionPayload(team, {
      name: 'Otro nombre',
      group: 'B',
      confederation: 'CONCACAF',
      _id: 'otro-id',
      slots: [],
    })

    expect(result).toEqual({
      isValid: false,
      errors: [ADMIN_TEAM_CORRECTION_MESSAGES.blockedField],
      payload: null,
    })
  })

  it('shows labels for canonical, null and legacy values without making legacy payload-valid', () => {
    expect(getQualifiedToLabel('ROUND_OF_32')).toBe('16avos')
    expect(getQualifiedToLabel(null)).toBe('Sin clasificación asignada')
    expect(getQualifiedToLabel('16AVOS')).toBe('16avos (legacy)')
  })
})
