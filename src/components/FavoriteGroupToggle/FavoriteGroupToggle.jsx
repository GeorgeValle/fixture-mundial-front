import { useState } from 'react'
import {
  clearFavoriteGroup,
  loadFavoriteGroup,
  saveFavoriteGroup,
} from '../../services/preferences/favoriteGroupStorageService'
import styles from './FavoriteGroupToggle.module.css'

function getStatusMessage(result, group, isFavorite) {
  if (result.warning) {
    return result.warning
  }

  if (isFavorite) {
    return `Grupo ${group} guardado como favorito.`
  }

  return 'Grupo favorito desmarcado.'
}

function FavoriteGroupToggle({ group }) {
  const [favoriteGroup, setFavoriteGroup] = useState(() => loadFavoriteGroup().group)
  const [statusMessage, setStatusMessage] = useState('')
  const isFavorite = favoriteGroup === group

  function handleToggleFavorite() {
    const result = isFavorite ? clearFavoriteGroup() : saveFavoriteGroup(group)

    setFavoriteGroup(result.group)
    setStatusMessage(getStatusMessage(result, group, !isFavorite && result.hasFavorite))
  }

  return (
    <div className={styles.wrapper}>
      <button
        aria-label={
          isFavorite
            ? `Desmarcar grupo ${group} como favorito`
            : `Marcar grupo ${group} como favorito`
        }
        aria-pressed={isFavorite}
        className={`${styles.button} ${isFavorite ? styles.active : ''}`}
        onClick={handleToggleFavorite}
        type="button"
      >
        <span className={styles.icon} aria-hidden="true">
          ★
        </span>
        <span>{isFavorite ? `Grupo ${group} favorito` : `Marcar grupo ${group}`}</span>
      </button>
      {statusMessage && (
        <p className={styles.status} role="status">
          {statusMessage}
        </p>
      )}
    </div>
  )
}

export default FavoriteGroupToggle
