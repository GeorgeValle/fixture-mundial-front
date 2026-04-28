import { appendErrorLog } from './errorLogStorage'

export function logAppError(errorRecord) {
  if (!errorRecord) {
    return
  }

  if (import.meta.env.DEV) {
    console.error('[fixture-mundial-front]', errorRecord)
  }

  appendErrorLog(errorRecord)
}
