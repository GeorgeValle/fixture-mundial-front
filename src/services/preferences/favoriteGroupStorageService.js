import { GROUP_LETTERS } from '../../constants/groups'
import { STORAGE_KEYS } from '../../constants/storageKeys'

const FAVORITE_GROUP_MESSAGES = {
  unavailable: 'El almacenamiento local no está disponible.',
  invalid: 'El grupo favorito guardado no es válido.',
  saveFailed: 'No pudimos guardar tu grupo favorito.',
  clearFailed: 'No pudimos borrar tu grupo favorito.',
}

function hasLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function isValidFavoriteGroup(group) {
  return GROUP_LETTERS.includes(String(group ?? '').trim().toUpperCase())
}

function normalizeGroup(group) {
  return String(group ?? '').trim().toUpperCase()
}

function createFavoriteGroupResult(group = null, status = 'empty', warning = null) {
  return {
    group,
    status,
    warning,
    hasFavorite: Boolean(group),
  }
}

export function loadFavoriteGroup() {
  if (!hasLocalStorage()) {
    return createFavoriteGroupResult(null, 'unavailable', FAVORITE_GROUP_MESSAGES.unavailable)
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEYS.favoriteGroup)

    if (!rawValue) {
      return createFavoriteGroupResult()
    }

    const favoriteGroup = normalizeGroup(rawValue)

    if (!isValidFavoriteGroup(favoriteGroup)) {
      window.localStorage.removeItem(STORAGE_KEYS.favoriteGroup)
      return createFavoriteGroupResult(null, 'corrupt', FAVORITE_GROUP_MESSAGES.invalid)
    }

    return createFavoriteGroupResult(favoriteGroup, 'loaded')
  } catch {
    return createFavoriteGroupResult(null, 'corrupt', FAVORITE_GROUP_MESSAGES.invalid)
  }
}

export function saveFavoriteGroup(group) {
  if (!hasLocalStorage()) {
    return createFavoriteGroupResult(null, 'unavailable', FAVORITE_GROUP_MESSAGES.unavailable)
  }

  const favoriteGroup = normalizeGroup(group)

  if (!isValidFavoriteGroup(favoriteGroup)) {
    return createFavoriteGroupResult(null, 'invalid', FAVORITE_GROUP_MESSAGES.invalid)
  }

  try {
    window.localStorage.setItem(STORAGE_KEYS.favoriteGroup, favoriteGroup)
    return createFavoriteGroupResult(favoriteGroup, 'saved')
  } catch {
    return createFavoriteGroupResult(null, 'error', FAVORITE_GROUP_MESSAGES.saveFailed)
  }
}

export function clearFavoriteGroup() {
  if (!hasLocalStorage()) {
    return createFavoriteGroupResult(null, 'unavailable', FAVORITE_GROUP_MESSAGES.unavailable)
  }

  try {
    window.localStorage.removeItem(STORAGE_KEYS.favoriteGroup)
    return createFavoriteGroupResult(null, 'cleared')
  } catch {
    return createFavoriteGroupResult(null, 'error', FAVORITE_GROUP_MESSAGES.clearFailed)
  }
}
