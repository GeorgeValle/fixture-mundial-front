import { z } from 'zod'
import { QUALIFIED_TO_VALUES, isCanonicalQualifiedTo } from '../constants/qualifiedTo'

export const ADMIN_TEAM_CORRECTION_MESSAGES = {
  missingTeamId: 'No pudimos identificar el equipo para guardar la corrección.',
  emptyPayload: 'No hay cambios válidos para guardar.',
  blockedField: 'La corrección solo permite position, qualifiedTo y shieldUrl.',
  invalidPosition: 'La posición debe ser un número entero positivo.',
  invalidQualifiedTo: 'Seleccioná una clasificación válida.',
  invalidShieldUrl: 'El escudo debe ser una URL válida.',
}

const BLOCKED_FIELDS = new Set([
  'name',
  'group',
  'confederation',
  '_id',
  'standings',
  'slots',
  'matches',
])

const ALLOWED_FIELDS = new Set(['position', 'qualifiedTo', 'shieldUrl'])

const teamCorrectionPayloadSchema = z
  .object({
    position: z.number().int().positive().optional(),
    qualifiedTo: z.union([z.enum(QUALIFIED_TO_VALUES), z.null()]).optional(),
    shieldUrl: z.url().optional(),
  })
  .strict()

function hasTeamId(team) {
  return typeof team?._id === 'string' && team._id.trim().length > 0
}

function isBlank(value) {
  return value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')
}

function parsePosition(value) {
  if (isBlank(value)) {
    return { status: 'empty', value: undefined }
  }

  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) {
    return { status: 'invalid', value: undefined }
  }

  const numericValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return { status: 'invalid', value: undefined }
  }

  return { status: 'valid', value: numericValue }
}

function parseShieldUrl(value) {
  if (isBlank(value)) {
    return { status: 'empty', value: undefined }
  }

  const trimmedValue = String(value).trim()
  const result = z.url().safeParse(trimmedValue)

  if (!result.success) {
    return { status: 'invalid', value: undefined }
  }

  return { status: 'valid', value: result.data }
}

function parseQualifiedTo(value) {
  if (value === undefined) {
    return { status: 'empty', value: undefined }
  }

  if (value === null || isCanonicalQualifiedTo(value)) {
    return { status: 'valid', value }
  }

  return { status: 'invalid', value: undefined }
}

export function buildAdminTeamCorrectionPayload(team, draft) {
  const errors = []

  if (!hasTeamId(team)) {
    errors.push(ADMIN_TEAM_CORRECTION_MESSAGES.missingTeamId)
  }

  const draftEntries = Object.entries(draft ?? {})
  const hasBlockedField = draftEntries.some(([field]) => BLOCKED_FIELDS.has(field) || !ALLOWED_FIELDS.has(field))

  if (hasBlockedField) {
    errors.push(ADMIN_TEAM_CORRECTION_MESSAGES.blockedField)
  }

  const payload = {}

  if (Object.prototype.hasOwnProperty.call(draft ?? {}, 'position')) {
    const parsedPosition = parsePosition(draft.position)

    if (parsedPosition.status === 'invalid') {
      errors.push(ADMIN_TEAM_CORRECTION_MESSAGES.invalidPosition)
    } else if (parsedPosition.status === 'valid' && parsedPosition.value !== team?.position) {
      payload.position = parsedPosition.value
    }
  }

  if (Object.prototype.hasOwnProperty.call(draft ?? {}, 'qualifiedTo')) {
    const parsedQualifiedTo = parseQualifiedTo(draft.qualifiedTo)

    if (parsedQualifiedTo.status === 'invalid') {
      errors.push(ADMIN_TEAM_CORRECTION_MESSAGES.invalidQualifiedTo)
    } else if (parsedQualifiedTo.status === 'valid' && parsedQualifiedTo.value !== (team?.qualifiedTo ?? null)) {
      payload.qualifiedTo = parsedQualifiedTo.value
    }
  }

  if (Object.prototype.hasOwnProperty.call(draft ?? {}, 'shieldUrl')) {
    const parsedShieldUrl = parseShieldUrl(draft.shieldUrl)

    if (parsedShieldUrl.status === 'invalid') {
      errors.push(ADMIN_TEAM_CORRECTION_MESSAGES.invalidShieldUrl)
    } else if (parsedShieldUrl.status === 'valid' && parsedShieldUrl.value !== (team?.shieldUrl ?? '')) {
      payload.shieldUrl = parsedShieldUrl.value
    }
  }

  const schemaResult = teamCorrectionPayloadSchema.safeParse(payload)

  if (!schemaResult.success && errors.length === 0) {
    errors.push(ADMIN_TEAM_CORRECTION_MESSAGES.emptyPayload)
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors: [...new Set(errors)],
      payload: null,
    }
  }

  if (Object.keys(payload).length === 0) {
    return {
      isValid: false,
      errors: [ADMIN_TEAM_CORRECTION_MESSAGES.emptyPayload],
      payload: null,
    }
  }

  return {
    isValid: true,
    errors: [],
    payload: schemaResult.data,
  }
}
