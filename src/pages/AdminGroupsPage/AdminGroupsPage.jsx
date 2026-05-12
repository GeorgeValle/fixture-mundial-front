import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import StandingsTable from '../../components/StandingsTable/StandingsTable'
import { GROUP_OPTIONS } from '../../constants/groups'
import { MATCH_STATUS, getMatchStatusLabel, normalizeMatchStatus } from '../../constants/matchStatus'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { getAdminMatches } from '../../services/admin/adminMatchesService'
import {
  getAdminStandings,
  recalculateAdminGroupStandings,
} from '../../services/admin/adminStandingsService'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import styles from './AdminGroupsPage.module.css'

const EXPECTED_GROUP_MATCHES = 6
const FRIENDLY_ERROR_MESSAGE =
  'No pudimos cargar grupos y standings para administración. Si la sesión admin expiró o el servidor estaba dormido, iniciá sesión nuevamente o probá otra vez en unos segundos.'
const RECALCULATION_READY_LABEL = 'Actualizar standings del grupo'
const RECALCULATION_DISABLED_LABEL = 'Disponible cuando el grupo tenga sus 6 partidos finalizados.'
const RECALCULATION_LOADING_LABEL = 'Recalculando standings del grupo…'
const RECALCULATION_SUCCESS_MESSAGE = 'Standings del grupo actualizados correctamente.'
const RECALCULATION_ERROR_MESSAGE = 'No se pudieron actualizar los standings del grupo seleccionado.'

function getGroupFromStage(stage) {
  const normalized = String(stage ?? '')
    .trim()
    .toUpperCase()
    .replace(/[_-]/g, ' ')

  const match = normalized.match(/^(?:GROUP|GRUPO)\s*([A-L])$/i)
  return match?.[1]?.toUpperCase() ?? ''
}

function getMatchGroup(match) {
  return getGroupFromStage(match?.stage) || match?.homeTeam?.group || match?.awayTeam?.group || ''
}

function getGroupMatches(matches, selectedGroup) {
  return matches.filter((match) => getMatchGroup(match) === selectedGroup)
}

function getStatusCounts(matches) {
  return matches.reduce(
    (counts, match) => {
      const status = normalizeMatchStatus(match?.status)

      return {
        ...counts,
        [status]: counts[status] + 1,
      }
    },
    {
      [MATCH_STATUS.pending]: 0,
      [MATCH_STATUS.playing]: 0,
      [MATCH_STATUS.finished]: 0,
    },
  )
}

function getCompletionPercent(finishedMatches, totalMatches) {
  if (totalMatches <= 0) {
    return 0
  }

  return Math.round((finishedMatches / totalMatches) * 100)
}

function AdminGroupsPage() {
  const dispatch = useDispatch()
  const [selectedGroup, setSelectedGroup] = useState('A')
  const [matches, setMatches] = useState([])
  const [standings, setStandings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [recalculationSuccess, setRecalculationSuccess] = useState('')
  const [recalculationError, setRecalculationError] = useState('')

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
          title: 'Cargando control de grupos',
          message:
            'Puede tardar unos segundos si el servidor está despertando. La vista se va a actualizar automáticamente.',
          variant: 'info',
        }),
      )
    }, DELAYED_LOADING_THRESHOLD_MS)

    Promise.all([getAdminMatches(), getAdminStandings()])
      .then(([nextMatches, nextStandings]) => {
        if (!isActive) {
          return
        }

        setMatches(nextMatches)
        setStandings(nextStandings)
        setHasError(false)
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

  const selectedMatches = getGroupMatches(matches, selectedGroup)
  const selectedStanding = standings.find((standing) => standing?.group === selectedGroup)
  const statusCounts = getStatusCounts(selectedMatches)
  const totalMatches = selectedMatches.length
  const hasAllExpectedMatchesFinished =
    totalMatches >= EXPECTED_GROUP_MATCHES && statusCounts[MATCH_STATUS.finished] >= EXPECTED_GROUP_MATCHES

  const completionTotal = Math.max(totalMatches, EXPECTED_GROUP_MATCHES)
  const completionPercent = getCompletionPercent(statusCounts[MATCH_STATUS.finished], completionTotal)
  const hasPendingMatches =
    statusCounts[MATCH_STATUS.pending] > 0 || statusCounts[MATCH_STATUS.playing] > 0
  const selectedTeams = selectedStanding?.teams ?? []

  const isRecalculateReady =
    hasAllExpectedMatchesFinished && selectedGroup && !isLoading && !isRecalculating

  const selectedGroupName = selectedGroup ? `Grupo ${selectedGroup}` : 'un grupo'

  function handleRetry() {
    setIsLoading(true)
    setHasError(false)
    setRecalculationError('')
    setRecalculationSuccess('')
    setRetryCount((currentCount) => currentCount + 1)
  }

  async function refreshAdminData() {
    const [nextMatches, nextStandings] = await Promise.all([getAdminMatches(), getAdminStandings()])

    setMatches(nextMatches)
    setStandings(nextStandings)
    setHasError(false)
  }

  async function handleRecalculateGroupStandings() {
    if (!isRecalculateReady) {
      return
    }

    const didConfirm = window.confirm(`¿Querés actualizar los standings del ${selectedGroupName}?`)

    if (!didConfirm) {
      return
    }

    setIsRecalculating(true)
    setRecalculationError('')
    setRecalculationSuccess('')

    try {
      await recalculateAdminGroupStandings(selectedGroup)
      try {
        await refreshAdminData()
      } catch {
        setRecalculationError('La acción se ejecutó, pero no pudimos refrescar standings y partidos automáticamente.')
      }
      setRecalculationSuccess(RECALCULATION_SUCCESS_MESSAGE)
    } catch (error) {
      if (error?.message === RECALCULATION_ERROR_MESSAGE) {
        setRecalculationError(RECALCULATION_ERROR_MESSAGE)
      } else {
        setRecalculationError(
          error?.message && error.message !== 'No pudimos recalcular los standings del grupo.'
            ? error.message
            : RECALCULATION_ERROR_MESSAGE,
        )
      }
    } finally {
      setIsRecalculating(false)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="admin-groups-title">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Control de grupos</p>
          <h1 id="admin-groups-title">Grupos y standings oficiales</h1>
          <p>
            Revisá señales operativas por grupo y las posiciones oficiales recibidas del backend.
            React no calcula puntos, clasificados ni criterios de desempate.
          </p>
        </div>

        <div className={styles.contractCard}>
          <strong>Datos recibidos del servidor</strong>
          <span>Standings desde GET /api/standings</span>
          <span>Partidos desde GET /api/matches</span>
        </div>
      </header>

      <section className={styles.groupSelectorPanel} aria-label="Selector de grupo administrativo">
        <label className={styles.groupSelector} htmlFor="admin-group-selector">
          <span>Elegir grupo</span>
          <select
            id="admin-group-selector"
            value={selectedGroup}
            onChange={(event) => setSelectedGroup(event.target.value)}
          >
            {GROUP_OPTIONS.map((group) => (
              <option key={group.value} value={group.value}>{group.label}</option>
            ))}
          </select>
        </label>
        <p>Estás revisando el {selectedGroupName}. Esta pantalla solo muestra señales operativas y datos oficiales.</p>
      </section>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite" aria-busy="true">
          <p className={styles.kicker}>Cargando grupos…</p>
          <h2>Estamos preparando standings y partidos administrativos</h2>
          <p>En unos segundos vas a poder revisar el estado operativo del grupo.</p>
        </section>
      )}

      {!isLoading && hasError && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h2>Grupos no disponibles</h2>
          <p>{FRIENDLY_ERROR_MESSAGE}</p>
          <button className={styles.primaryButton} type="button" onClick={handleRetry}>
            Reintentar
          </button>
        </section>
      )}

      {!isLoading && !hasError && (
        <>
          <section className={styles.summaryGrid} aria-label={`Resumen operativo del ${selectedGroupName}`}>
            <article className={styles.summaryCard}>
              <p className={styles.kicker}>{selectedGroupName}</p>
              <h2>Resumen operativo</h2>
              <dl className={styles.stats}>
                <div>
                  <dt>Pendientes</dt>
                  <dd>{statusCounts[MATCH_STATUS.pending]}</dd>
                </div>
                <div>
                  <dt>En juego</dt>
                  <dd>{statusCounts[MATCH_STATUS.playing]}</dd>
                </div>
                <div>
                  <dt>Finalizados</dt>
                  <dd>{statusCounts[MATCH_STATUS.finished]}</dd>
                </div>
                <div>
                  <dt>Total esperado</dt>
                  <dd>{EXPECTED_GROUP_MATCHES}</dd>
                </div>
              </dl>
              <div className={styles.progressWrap} aria-label={`${completionPercent}% de partidos finalizados`}>
                <span style={{ width: `${completionPercent}%` }} />
              </div>
              <p className={styles.helperText}>
                {statusCounts[MATCH_STATUS.finished]} de {completionTotal} partidos detectados como finalizados.
              </p>
            </article>

            <article className={`${styles.summaryCard} ${hasAllExpectedMatchesFinished ? styles.readyCard : styles.pendingCard}`}>
              <p className={styles.kicker}>Aviso operativo</p>
              <h2>{hasAllExpectedMatchesFinished ? 'Grupo listo para revisar' : 'Grupo con actividad pendiente'}</h2>
              {hasAllExpectedMatchesFinished ? (
                <p>
                  Los {EXPECTED_GROUP_MATCHES} partidos esperados figuran como finalizados. Si tocó, podés actualizar
                  standings del grupo desde el control de acción.
                </p>
              ) : hasPendingMatches ? (
                <p>
                  Este grupo todavía tiene partidos pendientes o en juego. No fuerces clasificaciones desde esta pantalla.
                </p>
              ) : (
                <p>
                  No se encontraron los {EXPECTED_GROUP_MATCHES} partidos esperados para este grupo. Revisá la carga de partidos.
                </p>
              )}
            </article>
          </section>

          <section className={styles.recalculateCard} aria-labelledby="admin-recalculate-title">
            <div>
              <p className={styles.kicker}>Recalcular standings</p>
              <h2 id="admin-recalculate-title">Recalcular standings del grupo</h2>
              <p>
                El frontend solo dispara el proceso del servidor. Los puntos, posiciones y desempates los calcula el backend.
              </p>
            </div>
            <button
              className={isRecalculateReady ? styles.primaryButton : styles.disabledButton}
              disabled={!isRecalculateReady}
              type="button"
              onClick={handleRecalculateGroupStandings}
            >
              {isRecalculating
                ? RECALCULATION_LOADING_LABEL
                : isRecalculateReady
                  ? RECALCULATION_READY_LABEL
                  : RECALCULATION_DISABLED_LABEL}
            </button>
            {recalculationSuccess && (
              <p className={styles.successText} role="status">
                {recalculationSuccess}
              </p>
            )}
            {recalculationError && (
              <p className={styles.errorText} role="alert">
                {recalculationError}
              </p>
            )}
            {!isRecalculateReady && <p className={styles.helperText}>{RECALCULATION_DISABLED_LABEL}</p>}
            {!recalculationSuccess && !recalculationError && (
              <p className={styles.helperText}>Disponible cuando el grupo tenga sus 6 partidos finalizados.</p>
            )}
          </section>

          <section className={styles.standingsPanel} aria-labelledby="admin-standings-title">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Standings oficiales</p>
              <h2 id="admin-standings-title">Posiciones del {selectedGroupName}</h2>
              <p>
                Estos valores se muestran tal como llegan desde el backend. No hay edición manual de puntos, goles,
                diferencia de gol, posición ni qualifiedTo.
              </p>
            </div>

            {selectedTeams.length > 0 ? (
              <StandingsTable teams={selectedTeams} />
            ) : (
              <div className={styles.emptyState}>
                <h3>No se encontraron standings para este grupo</h3>
                <p>Cuando el backend devuelva posiciones para {selectedGroupName}, van a aparecer acá.</p>
              </div>
            )}
          </section>

          {totalMatches > 0 && (
            <section className={styles.matchesStatusPanel} aria-labelledby="admin-group-matches-title">
              <div className={styles.sectionHeader}>
                <p className={styles.kicker}>Partidos del grupo</p>
                <h2 id="admin-group-matches-title">Señales por status</h2>
                <p>Conteo operativo para orientar la revisión. No se usa para calcular la tabla.</p>
              </div>
              <ul className={styles.matchStatusList}>
                {selectedMatches.map((match) => {
                  const status = normalizeMatchStatus(match?.status)
                  const homeName = match?.homeTeam?.name ?? 'Equipo local'
                  const awayName = match?.awayTeam?.name ?? 'Equipo visitante'

                  return (
                    <li key={match?._id ?? `${homeName}-${awayName}`}>
                      <span>{homeName} vs {awayName}</span>
                      <strong className={`${styles.statusBadge} ${styles[`status${status}`]}`}>
                        {getMatchStatusLabel(status)}
                      </strong>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  )
}

export default AdminGroupsPage
