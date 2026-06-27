import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import KnockoutBracket from '../../components/KnockoutBracket/KnockoutBracket'
import KnockoutBracketView from '../../components/KnockoutBracketView/KnockoutBracketView'
import SkeletonList from '../../components/SkeletonList/SkeletonList'
import { ROUND_FILTER_ALL, ROUND_FILTER_OPTIONS } from '../../data/knockoutStageSkeleton'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { getMatches } from '../../services/matches/matchesService'
import {
  buildKnockoutBracketViewRounds,
  buildKnockoutStageMatches,
  getKnockoutSummary,
  groupKnockoutMatchesByRound,
} from '../../utils/knockoutStageAdapter'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import styles from './KnockoutStage.module.css'

const FRIENDLY_ERROR_MESSAGE =
  'No pudimos cargar la información de eliminatorias. Te mostramos el cuadro base documentado mientras tanto.'
const VIEW_MODE_MATCHES = 'matches'
const VIEW_MODE_BRACKET = 'bracket'
const VIEW_MODE_OPTIONS = [
  { value: VIEW_MODE_MATCHES, label: 'Vista de partidos' },
  { value: VIEW_MODE_BRACKET, label: 'Vista de llaves' },
]

function KnockoutStage() {
  const dispatch = useDispatch()
  const [matches, setMatches] = useState(() => buildKnockoutStageMatches([]))
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [selectedRound, setSelectedRound] = useState(ROUND_FILTER_ALL)
  const [viewMode, setViewMode] = useState(VIEW_MODE_MATCHES)
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
      .then((backendMatches) => {
        if (!isActive) {
          return
        }

        setMatches(buildKnockoutStageMatches(backendMatches))
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setHasError(true)
        setMatches(buildKnockoutStageMatches([]))
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

  const summary = getKnockoutSummary(matches)
  const visibleMatches =
    selectedRound === ROUND_FILTER_ALL
      ? matches
      : matches.filter((match) => match.roundKey === selectedRound)
  const visibleRounds = groupKnockoutMatchesByRound(visibleMatches)
  const bracketViewRounds = buildKnockoutBracketViewRounds(matches)
  const selectedRoundLabel =
    ROUND_FILTER_OPTIONS.find((option) => option.roundKey === selectedRound)?.roundLabel ??
    'Ronda seleccionada'
  const pendingVisibleMatchesCount = visibleMatches.filter((match) => match.source !== 'backend').length

  function handleRetryKnockoutMatches() {
    setIsLoading(true)
    setHasError(false)
    setRetryCount((currentCount) => currentCount + 1)
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Eliminatorias</p>
          <h2 className={styles.title}>Camino a la final</h2>
          <p className={styles.description}>
            Seguí cada ronda eliminatoria cuando los clasificados estén definidos. Los cruces
            se completarán con la información recibida.
          </p>
        </div>
        <div className={styles.heroBadges} aria-label="Estado de datos del cuadro">
          <span className={styles.badge}>Cuadro base</span>
          <span className={styles.badge}>Información pendiente</span>
          {summary.hasBackendData && <span className={styles.badge}>Información recibida</span>}
        </div>
      </header>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite">
          <p className={styles.kicker}>Armando el cuadro…</p>
          <h3 className={styles.stateTitle}>Buscando información de eliminatorias</h3>
          <SkeletonList count={4} label="Cargando cuadro de eliminatorias" variant="match" />
        </section>
      )}

      {!isLoading && hasError && (
        <section className={`${styles.stateCard} ${styles.warningState}`} role="alert">
          <p className={styles.kicker}>Información no disponible</p>
          <h3 className={styles.stateTitle}>Mostramos el cuadro base documentado</h3>
          <p className={styles.stateText}>{FRIENDLY_ERROR_MESSAGE}</p>
          <button
            className={styles.retryButton}
            onClick={handleRetryKnockoutMatches}
            type="button"
          >
            Reintentar
          </button>
        </section>
      )}

      {!isLoading && !hasError && !summary.hasBackendData && (
        <section className={`${styles.stateCard} ${styles.pendingPanel}`}>
          <span className={styles.stateIcon} aria-hidden="true">⌛</span>
          <div>
            <p className={styles.kicker}>Información pendiente</p>
            <h3 className={styles.stateTitle}>Equipos por definir</h3>
            <p className={styles.stateText}>
              Todavía no hay cruces reales de eliminatorias disponibles. Mostramos el cuadro
              base con equipos por definir sin inventar clasificados ni resultados.
            </p>
          </div>
        </section>
      )}

      {!isLoading && !hasError && summary.hasPartialBackendData && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Datos parciales</p>
          <h3 className={styles.stateTitle}>Combinamos información recibida y cuadro base</h3>
          <p className={styles.stateText}>
            Hay {summary.backendCount} partidos con información recibida y {summary.skeletonCount} partidos
            pendientes que conservan equipos por definir.
          </p>
        </section>
      )}

      {!isLoading && (
        <>
          <section className={styles.viewControls} aria-label="Vista de eliminatorias">
            <div className={styles.controlsIntro}>
              <p className={styles.kicker}>Modo de visualización</p>
              <h3 className={styles.controlTitle}>Alterná entre partidos y cuadro de llaves.</h3>
              <p className={styles.controlText}>
                La vista de partidos mantiene los filtros actuales. La vista de llaves muestra
                el cuadro completo sin simular avances pendientes.
              </p>
            </div>

            <div className={styles.viewToggle} role="group" aria-label="Cambiar vista de eliminatorias">
              {VIEW_MODE_OPTIONS.map((option) => (
                <button
                  aria-pressed={viewMode === option.value}
                  className={`${styles.viewToggleButton} ${
                    viewMode === option.value ? styles.viewToggleButtonActive : ''
                  }`}
                  key={option.value}
                  onClick={() => setViewMode(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {viewMode === VIEW_MODE_MATCHES && (
            <>
              <section className={styles.controls} aria-label="Rondas eliminatorias">
                <div className={styles.controlsIntro}>
                  <p className={styles.kicker}>Rondas eliminatorias</p>
                  <h3 className={styles.controlTitle}>Elegí una ronda para revisar sus partidos.</h3>
                  <p className={styles.controlText}>
                    {selectedRound === ROUND_FILTER_ALL
                      ? `${visibleMatches.length} partidos en el cuadro completo.`
                      : `${selectedRoundLabel}: ${visibleMatches.length} partidos.`}{' '}
                    {pendingVisibleMatchesCount > 0 && `${pendingVisibleMatchesCount} con información pendiente.`}
                  </p>
                </div>

                <div className={styles.roundChips} role="group" aria-label="Seleccionar ronda">
                  {ROUND_FILTER_OPTIONS.map((option) => (
                    <button
                      aria-pressed={selectedRound === option.roundKey}
                      className={`${styles.roundChip} ${
                        selectedRound === option.roundKey ? styles.roundChipActive : ''
                      }`}
                      key={option.roundKey}
                      onClick={() => setSelectedRound(option.roundKey)}
                      type="button"
                    >
                      {option.roundLabel}
                    </button>
                  ))}
                </div>

                <label className={styles.selectLabel} htmlFor="knockout-round-selector">
                  Filtrar por ronda
                </label>
                <select
                  className={styles.roundSelect}
                  id="knockout-round-selector"
                  onChange={(event) => setSelectedRound(event.target.value)}
                  value={selectedRound}
                >
                  {ROUND_FILTER_OPTIONS.map((option) => (
                    <option key={option.roundKey} value={option.roundKey}>
                      {option.roundLabel}
                    </option>
                  ))}
                </select>
              </section>

              {visibleRounds.length > 0 ? (
                <KnockoutBracket rounds={visibleRounds} />
              ) : (
                <section className={styles.stateCard}>
                  <p className={styles.kicker}>Sin partidos</p>
                  <h3 className={styles.stateTitle}>No hay partidos para esta ronda</h3>
                  <p className={styles.stateText}>
                    Elegí otra ronda o volvé a todas las rondas para ver el cuadro completo.
                  </p>
                </section>
              )}
            </>
          )}

          {viewMode === VIEW_MODE_BRACKET && (
            <KnockoutBracketView rounds={bracketViewRounds} />
          )}
        </>
      )}
    </section>
  )
}

export default KnockoutStage
