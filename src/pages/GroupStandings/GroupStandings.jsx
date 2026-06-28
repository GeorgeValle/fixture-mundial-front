import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import StandingsGroupCard from '../../components/StandingsGroupCard/StandingsGroupCard'
import ThirdPlaceRankingTable from '../../components/ThirdPlaceRankingTable/ThirdPlaceRankingTable'
import SkeletonList from '../../components/SkeletonList/SkeletonList'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { getStandings } from '../../services/standings/standingsService'
import { getMatches } from '../../services/matches/matchesService'
import { loadFavoriteGroup } from '../../services/preferences/favoriteGroupStorageService'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import { buildThirdPlaceRanking } from '../../utils/thirdPlaceRanking'
import styles from './GroupStandings.module.css'

const FRIENDLY_API_ERROR_MESSAGE =
  'No pudimos cargar las posiciones. Si el servidor estaba dormido, esperá unos segundos y probá de nuevo.'
const FRIENDLY_INVALID_PAYLOAD_MESSAGE =
  'No pudimos interpretar las posiciones recibidas. Intentá nuevamente más tarde.'
const VIEW_MODE_OVERVIEW = 'overview'
const VIEW_MODE_FOCUS = 'focus'
const VIEW_MODE_THIRD_PLACES = 'third-places'

function hasRenderableStandings(standings) {
  return standings.some((standing) => (standing?.teams ?? []).length > 0)
}

function getInitialFavoriteGroup() {
  return loadFavoriteGroup().group ?? ''
}

function getInitialViewMode(initialFavoriteGroup) {
  return initialFavoriteGroup ? VIEW_MODE_FOCUS : VIEW_MODE_OVERVIEW
}

function GroupStandings() {
  const dispatch = useDispatch()
  const hasRequestedKnockoutMatchesRef = useRef(false)
  const isRequestingKnockoutMatchesRef = useRef(false)
  const [initialFavoriteGroup] = useState(getInitialFavoriteGroup)
  const [standings, setStandings] = useState([])
  const [knockoutMatches, setKnockoutMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorKind, setErrorKind] = useState(null)
  const [viewMode, setViewMode] = useState(() => getInitialViewMode(initialFavoriteGroup))
  const [selectedGroup, setSelectedGroup] = useState(initialFavoriteGroup)
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

    getStandings()
      .then((nextStandings) => {
        if (!isActive) {
          return
        }

        setStandings(nextStandings)
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        setErrorKind(error?.source === 'standingsService' ? 'invalid' : 'api')
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

  useEffect(() => {
    if (
      viewMode !== VIEW_MODE_THIRD_PLACES ||
      hasRequestedKnockoutMatchesRef.current ||
      isRequestingKnockoutMatchesRef.current ||
      isLoading ||
      errorKind
    ) {
      return undefined
    }

    let isActive = true
    isRequestingKnockoutMatchesRef.current = true

    getMatches()
      .then((nextMatches) => {
        if (!isActive) {
          return
        }

        setKnockoutMatches(nextMatches)
        hasRequestedKnockoutMatchesRef.current = true
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setKnockoutMatches([])
        hasRequestedKnockoutMatchesRef.current = false
      })
      .finally(() => {
        if (!isActive) {
          return
        }

        isRequestingKnockoutMatchesRef.current = false
      })

    return () => {
      isActive = false
      isRequestingKnockoutMatchesRef.current = false
    }
  }, [errorKind, isLoading, viewMode])

  const hasStandings = hasRenderableStandings(standings)
  const errorMessage =
    errorKind === 'invalid' ? FRIENDLY_INVALID_PAYLOAD_MESSAGE : FRIENDLY_API_ERROR_MESSAGE
  const isFocusMode = viewMode === VIEW_MODE_FOCUS
  const isThirdPlaceMode = viewMode === VIEW_MODE_THIRD_PLACES
  const selectedStanding =
    standings.find((standing) => standing?.group === selectedGroup) ?? standings[0]
  const activeSelectedGroup = selectedStanding?.group ?? ''
  const visibleStandings = isFocusMode && selectedStanding ? [selectedStanding] : standings
  const thirdPlaceRanking = buildThirdPlaceRanking(standings, knockoutMatches)
  const totalGroups = standings.length
  const totalTeams = standings.reduce(
    (count, standing) => count + (standing?.teams?.length ?? 0),
    0,
  )

  function handleRetryStandings() {
    hasRequestedKnockoutMatchesRef.current = false
    isRequestingKnockoutMatchesRef.current = false
    setIsLoading(true)
    setErrorKind(null)
    setKnockoutMatches([])
    setRetryCount((currentCount) => currentCount + 1)
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Posiciones</p>
          <h2 className={styles.title}>Tablas de posiciones</h2>
          <p className={styles.description}>
            Compará todos los grupos o revisá uno en detalle con una lectura clara de ranking,
            puntos y diferencia de gol.
          </p>
        </div>
        <div className={styles.heroMarks} aria-hidden="true">
          <span>PTS</span>
          <span>GF</span>
          <span>DIF</span>
        </div>
      </header>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite">
          <div className={styles.stateHeader}>
            <p className={styles.kicker}>Buscando posiciones…</p>
            <h3 className={styles.stateTitle}>Estamos preparando las tablas de grupos</h3>
          </div>
          <SkeletonList count={4} label="Cargando posiciones de grupos" variant="match" />
        </section>
      )}

      {!isLoading && errorKind && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h3 className={styles.stateTitle}>Posiciones no disponibles</h3>
          <p className={styles.stateText}>{errorMessage}</p>
          <button
            className={styles.retryButton}
            onClick={handleRetryStandings}
            type="button"
          >
            Reintentar
          </button>
        </section>
      )}

      {!isLoading && !errorKind && !hasStandings && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Sin posiciones</p>
          <h3 className={styles.stateTitle}>Todavía no hay tablas disponibles</h3>
          <p className={styles.stateText}>
            Cuando haya posiciones disponibles, van a aparecer en esta sección.
          </p>
        </section>
      )}

      {!isLoading && !errorKind && hasStandings && (
        <>
          <section className={styles.viewControls} aria-label="Opciones de visualización">
            <div className={styles.controlIntro}>
              <p className={styles.kicker}>Panel de control</p>
              <h3 className={styles.controlTitle}>Compará todos los grupos o revisá uno en detalle.</h3>
              <p className={styles.controlHelp}>
                Vista general muestra todos los grupos. Vista foco permite revisar un grupo en detalle.
                Mejores terceros compara las selecciones que marchan terceras.
              </p>
              <div className={styles.controlMeta} aria-label="Resumen de posiciones disponibles">
                <span>{totalGroups} grupos</span>
                <span>{totalTeams} selecciones</span>
                {isFocusMode && activeSelectedGroup && <span>Grupo {activeSelectedGroup} seleccionado</span>}
                {isThirdPlaceMode && <span>{thirdPlaceRanking.length} terceros en ranking</span>}
              </div>
            </div>

            <div className={styles.controlActions}>
              <div className={styles.segmentedControl} role="group" aria-label="Modo de vista">
                <button
                  aria-pressed={viewMode === VIEW_MODE_OVERVIEW}
                  className={`${styles.viewButton} ${
                    viewMode === VIEW_MODE_OVERVIEW ? styles.viewButtonActive : ''
                  }`}
                  onClick={() => setViewMode(VIEW_MODE_OVERVIEW)}
                  type="button"
                >
                  <span className={`${styles.viewIcon} ${styles.overviewIcon}`} aria-hidden="true" />
                  Vista general
                </button>
                <button
                  aria-pressed={isFocusMode}
                  className={`${styles.viewButton} ${isFocusMode ? styles.viewButtonActive : ''}`}
                  onClick={() => setViewMode(VIEW_MODE_FOCUS)}
                  type="button"
                >
                  <span className={`${styles.viewIcon} ${styles.focusIcon}`} aria-hidden="true" />
                  Vista foco
                </button>
                <button
                  aria-pressed={isThirdPlaceMode}
                  className={`${styles.viewButton} ${isThirdPlaceMode ? styles.viewButtonActive : ''}`}
                  onClick={() => setViewMode(VIEW_MODE_THIRD_PLACES)}
                  type="button"
                >
                  <span className={`${styles.viewIcon} ${styles.thirdPlacesIcon}`} aria-hidden="true" />
                  Mejores terceros
                </button>
              </div>

              {isFocusMode && (
                <div className={styles.groupSelector}>
                  <label className={styles.groupSelectorLabel} htmlFor="standings-group-selector">
                    Elegir grupo
                  </label>
                  <select
                    className={styles.groupSelect}
                    id="standings-group-selector"
                    onChange={(event) => setSelectedGroup(event.target.value)}
                    value={activeSelectedGroup}
                  >
                    {standings.map((standing, index) => (
                      <option
                        key={standing?.group ?? `standings-option-${index}`}
                        value={standing?.group ?? ''}
                      >
                        Grupo {standing?.group ?? index + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {isThirdPlaceMode ? (
            <ThirdPlaceRankingTable ranking={thirdPlaceRanking} />
          ) : (
            <section
              className={isFocusMode ? styles.focusGrid : styles.overviewGrid}
              aria-label={
                isFocusMode ? 'Tabla de posiciones del grupo seleccionado' : 'Tablas de posiciones por grupo'
              }
            >
              {visibleStandings.map((standing, index) => {
                const originalIndex = standings.indexOf(standing)

                return (
                  <StandingsGroupCard
                    key={standing?.group ?? `standings-group-${index}`}
                    standing={standing}
                    variant={isFocusMode ? 'featured' : 'compact'}
                    variantIndex={originalIndex >= 0 ? originalIndex % 4 : index % 4}
                  />
                )
              })}
            </section>
          )}
        </>
      )}
    </section>
  )
}

export default GroupStandings
