import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import FavoriteGroupToggle from '../../components/FavoriteGroupToggle/FavoriteGroupToggle'
import FixtureMatchCard from '../../components/FixtureMatchCard/FixtureMatchCard'
import GroupSelector from '../../components/GroupSelector/GroupSelector'
import SkeletonList from '../../components/SkeletonList/SkeletonList'
import { getGroupStageName } from '../../constants/groups'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { getMatches } from '../../services/matches/matchesService'
import { loadFavoriteGroup } from '../../services/preferences/favoriteGroupStorageService'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import { sortMatchesByDate } from '../../utils/dateAdapter'
import styles from './GroupFixtures.module.css'

const FRIENDLY_ERROR_MESSAGE =
  'No pudimos cargar el fixture de grupos. Si el servidor estaba dormido, esperá unos segundos y probá de nuevo.'

function getInitialSelectedGroup() {
  return loadFavoriteGroup().group ?? 'A'
}

function getMatchKey(match, index) {
  return match?._id ?? `${match?.stage ?? 'match'}-${match?.date ?? index}`
}

function getMatchesForGroup(matches, selectedGroup) {
  const selectedStage = getGroupStageName(selectedGroup)
  return sortMatchesByDate(matches.filter((match) => match.stage === selectedStage))
}

function GroupFixtures() {
  const dispatch = useDispatch()
  const [selectedGroup, setSelectedGroup] = useState(getInitialSelectedGroup)
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isActive = true
    let didShowDelayedFeedback = false

    dispatch(setGlobalLoading(true))
    dispatch(setDelayedLoading(false))

    const delayedLoadingTimer = window.setTimeout(() => {
      if (!isActive) {
        return
      }

      didShowDelayedFeedback = true
      dispatch(setDelayedLoading(true))
      dispatch(
        openFeedbackModal({
          title: 'El servidor está despertando',
          message:
            'Puede tardar hasta 30 segundos en responder. Tocá en reintentar para volver a cargar la información.',
          variant: 'info',
        }),
      )
    }, DELAYED_LOADING_THRESHOLD_MS)

    getMatches()
      .then((nextMatches) => {
        if (!isActive) {
          return
        }

        setMatches(nextMatches)
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setHasError(true)
      })
      .finally(() => {
        if (!isActive) {
          return
        }

        window.clearTimeout(delayedLoadingTimer)
        setIsLoading(false)
        dispatch(setGlobalLoading(false))

        if (didShowDelayedFeedback) {
          dispatch(setDelayedLoading(false))
        }
      })

    return () => {
      isActive = false
      window.clearTimeout(delayedLoadingTimer)
      dispatch(setGlobalLoading(false))
      dispatch(setDelayedLoading(false))
    }
  }, [dispatch, retryCount])

  const selectedMatches = getMatchesForGroup(matches, selectedGroup)

  function handleRetryMatches() {
    setIsLoading(true)
    setHasError(false)
    setRetryCount((currentCount) => currentCount + 1)
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Fixture por grupo</p>
          <h2 className={styles.title}>Partidos del grupo {selectedGroup}</h2>
          <p className={styles.description}>
            Elegí un grupo y consultá sus seis partidos con escudos, sedes, fechas y
            marcadores cuando estén disponibles.
          </p>
          <FavoriteGroupToggle group={selectedGroup} />
        </div>

        <GroupSelector value={selectedGroup} onChange={setSelectedGroup} />
      </header>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite">
          <div className={styles.stateHeader}>
            <p className={styles.kicker}>Preparando el fixture…</p>
            <h3 className={styles.stateTitle}>Estamos buscando los partidos del grupo</h3>
          </div>
          <SkeletonList count={6} label="Cargando partidos del grupo" variant="match" />
        </section>
      )}

      {!isLoading && hasError && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h3 className={styles.stateTitle}>Fixture no disponible</h3>
          <p className={styles.stateText}>{FRIENDLY_ERROR_MESSAGE}</p>
          <button
            className={styles.retryButton}
            onClick={handleRetryMatches}
            type="button"
          >
            Reintentar
          </button>
        </section>
      )}

      {!isLoading && !hasError && selectedMatches.length === 0 && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Sin partidos</p>
          <h3 className={styles.stateTitle}>No hay partidos para el grupo {selectedGroup}</h3>
          <p className={styles.stateText}>
            Cuando haya información disponible para estos encuentros, van a aparecer en esta
            sección.
          </p>
        </section>
      )}

      {!isLoading && !hasError && selectedMatches.length > 0 && (
        <section className={styles.fixtures} aria-label={`Partidos del grupo ${selectedGroup}`}>
          <div className={styles.summaryCard}>
            <p className={styles.kicker}>Grupo {selectedGroup}</p>
            <h3 className={styles.stateTitle}>{selectedMatches.length} partidos</h3>
            <p className={styles.stateText}>Ordenados por fecha y hora del encuentro.</p>
          </div>

          <div className={styles.matchList}>
            {selectedMatches.map((match, index) => (
              <FixtureMatchCard key={getMatchKey(match, index)} match={match} />
            ))}
          </div>
        </section>
      )}
    </section>
  )
}

export default GroupFixtures
