import { STORAGE_KEYS } from '../../constants/storageKeys'
import {
  createEmptyPredictionsStorage,
  parsePredictionsStorage,
  predictionSchema,
} from '../../schemas/predictionSchema'

const STORAGE_WARNING_MESSAGES = {
  corrupt: 'No pudimos leer tus predicciones guardadas.',
  unavailable: 'El almacenamiento local no está disponible.',
  saveFailed: 'No pudimos guardar tus predicciones.',
}

function hasLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function createStorageResult(data, status = 'loaded', warning = null) {
  return {
    data,
    status,
    warning,
    isCorrupt: status === 'corrupt',
  }
}

function getCurrentTimestamp() {
  return new Date().toISOString()
}

function normalizeUserName(userName) {
  return typeof userName === 'string' ? userName.trim() : ''
}

function sanitizePrediction(matchId, prediction) {
  const candidate = {
    matchId,
    predictedHomeScore: prediction?.predictedHomeScore,
    predictedAwayScore: prediction?.predictedAwayScore,
    predictedHomePenaltyScore: prediction?.predictedHomePenaltyScore ?? null,
    predictedAwayPenaltyScore: prediction?.predictedAwayPenaltyScore ?? null,
    updatedAt: prediction?.updatedAt ?? getCurrentTimestamp(),
  }

  return predictionSchema.parse(candidate)
}

function normalizeStorageData(data) {
  const emptyStorage = createEmptyPredictionsStorage()
  const predictionsEntries = Object.entries(data?.predictions ?? {})
  const predictions = {}

  for (const [matchId, prediction] of predictionsEntries) {
    const normalizedMatchId = prediction?.matchId ?? matchId
    predictions[normalizedMatchId] = sanitizePrediction(normalizedMatchId, prediction)
  }

  return parsePredictionsStorage({
    ...emptyStorage,
    ...data,
    userName: normalizeUserName(data?.userName),
    predictions,
  })
}

export function loadPredictionsStorage() {
  const emptyStorage = createEmptyPredictionsStorage()

  if (!hasLocalStorage()) {
    return createStorageResult(emptyStorage, 'unavailable', STORAGE_WARNING_MESSAGES.unavailable)
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEYS.predictions)

    if (!rawValue) {
      return createStorageResult(emptyStorage, 'empty')
    }

    return createStorageResult(parsePredictionsStorage(JSON.parse(rawValue)), 'loaded')
  } catch {
    return createStorageResult(emptyStorage, 'corrupt', STORAGE_WARNING_MESSAGES.corrupt)
  }
}

export function savePredictionsStorage(data) {
  if (!hasLocalStorage()) {
    return createStorageResult(
      createEmptyPredictionsStorage(),
      'unavailable',
      STORAGE_WARNING_MESSAGES.unavailable,
    )
  }

  try {
    const normalizedData = normalizeStorageData(data)
    window.localStorage.setItem(STORAGE_KEYS.predictions, JSON.stringify(normalizedData))

    return createStorageResult(normalizedData, 'saved')
  } catch {
    return createStorageResult(
      createEmptyPredictionsStorage(),
      'error',
      STORAGE_WARNING_MESSAGES.saveFailed,
    )
  }
}

export function saveUserName(userName) {
  const currentStorage = loadPredictionsStorage().data

  return savePredictionsStorage({
    ...currentStorage,
    userName,
  })
}

export function savePrediction(matchId, prediction) {
  const currentStorage = loadPredictionsStorage().data
  const normalizedMatchId = String(matchId ?? '').trim()

  return savePredictionsStorage({
    ...currentStorage,
    predictions: {
      ...currentStorage.predictions,
      [normalizedMatchId]: {
        ...prediction,
        matchId: normalizedMatchId,
        updatedAt: prediction?.updatedAt ?? getCurrentTimestamp(),
      },
    },
  })
}

export function removePrediction(matchId) {
  const currentStorage = loadPredictionsStorage().data
  const nextPredictions = { ...currentStorage.predictions }

  delete nextPredictions[matchId]

  return savePredictionsStorage({
    ...currentStorage,
    predictions: nextPredictions,
  })
}

export function resetPredictionsStorage() {
  const emptyStorage = createEmptyPredictionsStorage()

  if (!hasLocalStorage()) {
    return createStorageResult(emptyStorage, 'unavailable', STORAGE_WARNING_MESSAGES.unavailable)
  }

  try {
    window.localStorage.setItem(STORAGE_KEYS.predictions, JSON.stringify(emptyStorage))
    return createStorageResult(emptyStorage, 'reset')
  } catch {
    return createStorageResult(emptyStorage, 'error', STORAGE_WARNING_MESSAGES.saveFailed)
  }
}
