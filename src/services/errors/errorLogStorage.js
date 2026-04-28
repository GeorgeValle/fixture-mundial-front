import { STORAGE_KEYS } from '../../constants/storageKeys'

export function readErrorLogs() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEYS.errorLog)
    return rawValue ? JSON.parse(rawValue) : []
  } catch {
    return []
  }
}

export function appendErrorLog(entry) {
  if (typeof window === 'undefined') {
    return
  }

  const nextEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: entry?.source ?? 'unknown',
    message: entry?.message ?? 'Ocurrió un error inesperado.',
    status: entry?.status ?? null,
    details: entry?.details ?? null,
  }

  const logs = readErrorLogs()
  window.localStorage.setItem(
    STORAGE_KEYS.errorLog,
    JSON.stringify([nextEntry, ...logs].slice(0, 20)),
  )
}
