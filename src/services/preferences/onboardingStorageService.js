import { STORAGE_KEYS } from '../../constants/storageKeys'

const SEEN_VALUE = 'true'

function getStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function hasSeenHomeTutorial() {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    return storage.getItem(STORAGE_KEYS.homeTutorialSeen) === SEEN_VALUE
  } catch {
    return false
  }
}

export function markHomeTutorialSeen() {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.setItem(STORAGE_KEYS.homeTutorialSeen, SEEN_VALUE)
    return true
  } catch {
    return false
  }
}

export function clearHomeTutorialSeen() {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  try {
    storage.removeItem(STORAGE_KEYS.homeTutorialSeen)
    return true
  } catch {
    return false
  }
}
