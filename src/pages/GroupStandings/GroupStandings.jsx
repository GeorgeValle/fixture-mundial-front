import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import StandingsGroupCard from '../../components/StandingsGroupCard/StandingsGroupCard'
import SkeletonList from '../../components/SkeletonList/SkeletonList'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { getStandings } from '../../services/standings/standingsService'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import styles from './GroupStandings.module.css'

const FRIENDLY_API_ERROR_MESSAGE =
  'No pudimos cargar las posiciones. Intentá nuevamente en unos segundos.'
const FRIENDLY_INVALID_PAYLOAD_MESSAGE =
  'No pudimos interpretar las posiciones recibidas. Intentá nuevamente más tarde.'
const VIEW_MODE_OVERVIEW = 'overview'
const VIEW_MODE_FOCUS = 'focus'

function hasRenderableStandings(standings) {
  return standings.some((standing) => (standing?.teams ?? []).length > 0)
}

function GroupStandings() {
  const dispatch = useDispatch()
  const [standings, setStandings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorKind, setErrorKind] = useState(null)
  const [viewMode, setViewMode] = useState(VIEW_MODE_OVERVIEW)
  const [selectedGroup, setSelectedGroup] = useState('')

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
          title: 'Las posiciones están tardando un poco',
          message:
            'El backend puede demorar unos segundos en responder. Seguimos intentando cargar las tablas de grupos.',
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
  }, [dispatch])

  const hasStandings = hasRenderableStandings(standings)
  const errorMessage =
    errorKind === 'invalid' ? FRIENDLY_INVALID_PAYLOAD_MESSAGE : FRIENDLY_API_ERROR_MESSAGE
  const isFocusMode = viewMode === VIEW_MODE_FOCUS
  const selectedStanding =
    standings.find((standing) => standing?.group === selectedGroup) ?? standings[0]
  const activeSelectedGroup = selectedStanding?.group ?? ''
  const visibleStandings = isFocusMode && selectedStanding ? [selectedStanding] : standings

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Posiciones</p>
          <h2 className={styles.title}>Tablas de posiciones</h2>
          <p className={styles.description}>
            Consultá las posiciones oficiales de los grupos A-L calculadas por el backend.
            La tabla conserva el orden recibido desde la API.
          </p>
        </div>
      </header>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite">
          <div className={styles.stateHeader}>
            <p className={styles.kicker}>Cargando posiciones</p>
            <h3 className={styles.stateTitle}>Estamos buscando las tablas de grupos</h3>
          </div>
          <SkeletonList count={4} label="Cargando posiciones de grupos" variant="match" />
        </section>
      )}

      {!isLoading && errorKind && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h3 className={styles.stateTitle}>Posiciones no disponibles</h3>
          <p className={styles.stateText}>{errorMessage}</p>
        </section>
      )}

      {!isLoading && !errorKind && !hasStandings && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Sin posiciones</p>
          <h3 className={styles.stateTitle}>Todavía no hay tablas disponibles</h3>
          <p className={styles.stateText}>
            Cuando el backend publique las posiciones, van a aparecer en esta sección.
          </p>
        </section>
      )}

      {!isLoading && !errorKind && hasStandings && (
        <>
          <section className={styles.viewControls} aria-label="Opciones de visualización">
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
          </section>

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
        </>
      )}
    </section>
  )
}

export default GroupStandings
