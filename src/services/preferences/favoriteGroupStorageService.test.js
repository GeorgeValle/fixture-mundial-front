import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import {
  clearFavoriteGroup,
  loadFavoriteGroup,
  saveFavoriteGroup,
} from './favoriteGroupStorageService'

beforeEach(() => {
  window.localStorage.clear()
})

describe('favoriteGroupStorageService', () => {
  it('returns empty state when no favorite group exists', () => {
    expect(loadFavoriteGroup()).toMatchObject({
      group: null,
      status: 'empty',
      hasFavorite: false,
    })
  })

  it('saves and loads a valid favorite group', () => {
    const savedResult = saveFavoriteGroup('c')

    expect(savedResult).toMatchObject({ group: 'C', status: 'saved', hasFavorite: true })
    expect(loadFavoriteGroup()).toMatchObject({ group: 'C', status: 'loaded' })
  })

  it('clears a saved favorite group', () => {
    saveFavoriteGroup('B')

    expect(clearFavoriteGroup()).toMatchObject({ group: null, status: 'cleared' })
    expect(loadFavoriteGroup()).toMatchObject({ group: null, status: 'empty' })
  })

  it('removes corrupt favorite group values safely', () => {
    window.localStorage.setItem(STORAGE_KEYS.favoriteGroup, 'Z')

    expect(loadFavoriteGroup()).toMatchObject({ group: null, status: 'corrupt' })
    expect(window.localStorage.getItem(STORAGE_KEYS.favoriteGroup)).toBeNull()
  })

  it('returns unavailable when localStorage throws', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(loadFavoriteGroup()).toMatchObject({ group: null, status: 'corrupt' })

    getItemSpy.mockRestore()
  })
})
