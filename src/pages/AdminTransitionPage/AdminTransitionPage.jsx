import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { GROUP_OPTIONS } from '../../constants/groups'
import {
  getAdminTransitionMatches,
  getAdminTransitionStandings,
  getTransitionReadiness,
  processGroupTransition,
} from '../../services/admin/adminTransitionService'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import styles from './AdminTransitionPage.module.css'

const FRIENDLY_ERROR_MESSAGE =
  'No pudimos cargar los datos de transición. Si la sesión admin expiró o el servidor estaba dormido, iniciá sesión nuevamente o probá otra vez en unos segundos.'
const TRANSITION_FALLBACK_ERROR_MESSAGE = 'No se pudo ejecutar la transición del grupo seleccionado.'

function getTeamName(row) {
  return row?.team?.name ?? 'Equipo por confirmar'
}

function getTeamPositionLabel(row, index) {
  const position = row?.team?.position

  if (position !== null && position !== undefined && Number.isInteger(Number(position))) {
    return `${row.team.position}º`
  }

  return `Orden ${index + 1}`
}

function getQualifiedLabel(qualifiedTo) {
  if (qualifiedTo === 'ROUND_OF_32') {
    return 'Marcado para 16avos'
  }

  if (qualifiedTo === 'ELIMINATED') {
    return 'Eliminado'
  }

  if (qualifiedTo) {
    return qualifiedTo
  }

  return 'Sin clasificación registrada'
}

function isRoundOf32Match(match) {
  const matchNumber = Number(match?.matchNumber)
  const stage = String(match?.stage ?? '').trim().toUpperCase()
  const roundKey = String(match?.roundKey ?? '').trim().toLowerCase()

  return (
    (Number.isInteger(matchNumber) && matchNumber >= 73 && matchNumber <= 88) ||
    stage === 'ROUND_OF_32' ||
    stage.includes('DIECISEISAVOS') ||
    roundKey === 'round-of-32'
  )
}

function getTeamSlotName(team, placeholder) {
  return team?.name ?? placeholder ?? 'Equipo por definir'
}

function getMatchLabel(match, index) {
  return match?.matchNumber ? `Partido ${match.matchNumber}` : `Cruce ${index + 1}`
}

function AdminTransitionPage() {
  const dispatch = useDispatch()
  const [standings, setStandings] = useState([])
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [isProcessingTransition, setIsProcessingTransition] = useState(false)
  const [transitionSuccess, setTransitionSuccess] = useState('')
  const [transitionError, setTransitionError] = useState('')

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
          title: 'Cargando transición a 16avos',
          message:
            'Puede tardar unos segundos si el servidor está despertando. La consola se va a actualizar automáticamente.',
          variant: 'info',
        }),
      )
    }, DELAYED_LOADING_THRESHOLD_MS)

    Promise.all([getAdminTransitionStandings(), getAdminTransitionMatches()])
      .then(([nextStandings, nextMatches]) => {
        if (!isActive) {
          return
        }

        setStandings(nextStandings)
        setMatches(nextMatches)
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

  const readiness = getTransitionReadiness({ standings, matches })
  const roundOf32Matches = matches.filter(isRoundOf32Match)
  const visibleRoundOf32Matches = roundOf32Matches.slice(0, 8)

  function handleRefresh() {
    setIsLoading(true)
    setHasError(false)
    setTransitionError('')
    setRetryCount((currentCount) => currentCount + 1)
  }

  async function refreshTransitionDataAfterSuccess() {
    const [nextStandings, nextMatches] = await Promise.all([
      getAdminTransitionStandings(),
      getAdminTransitionMatches(),
    ])

    setStandings(nextStandings)
    setMatches(nextMatches)
    setHasError(false)
  }

  async function handleProcessTransition() {
    if (!selectedGroup || isLoading || isProcessingTransition) {
      return
    }

    const didConfirm = window.confirm(
      `¿Querés procesar el Grupo ${selectedGroup} e inyectar sus clasificados en 16avos?`,
    )

    if (!didConfirm) {
      return
    }

    setIsProcessingTransition(true)
    setTransitionSuccess('')
    setTransitionError('')

    try {
      const result = await processGroupTransition(selectedGroup)
      try {
        await refreshTransitionDataAfterSuccess()
      } catch {
        setTransitionError('La transición se ejecutó, pero no pudimos refrescar standings y partidos automáticamente.')
      }
      setTransitionSuccess(result?.message ?? `Grupo ${selectedGroup} procesado correctamente.`)
    } catch (error) {
      setTransitionError(error?.message ?? TRANSITION_FALLBACK_ERROR_MESSAGE)
    } finally {
      setIsProcessingTransition(false)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="admin-transition-title">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Control de eliminatorias</p>
          <h1 id="admin-transition-title">Transición a 16avos</h1>
          <p>
            Revisá el estado de clasificación antes de actualizar el primer bracket eliminatorio.
            Esta consola no calcula clasificados definitivos ni mueve equipos desde React.
          </p>
        </div>

        <div className={styles.contractCard}>
          <strong>Transition Engine backend</strong>
          <span>La transición se ejecuta por grupo y el frontend solo envía la letra seleccionada.</span>
        </div>
      </header>

      <section className={styles.actionsPanel} aria-labelledby="transition-actions-title">
        <div>
          <p className={styles.kicker}>Acciones seguras</p>
          <h2 id="transition-actions-title">Procesar grupo en backend</h2>
          <p>
            La transición se ejecuta por grupo. El frontend solo envía el grupo seleccionado; el backend revisa
            standings, clasificados y slots de 16avos.
          </p>
          <p>
            Si más adelante corregís una clasificación desde el área admin correspondiente, podés volver a procesar el
            grupo para actualizar sus inyecciones en el bracket.
          </p>
        </div>
        <form className={styles.transitionForm} onSubmit={(event) => event.preventDefault()}>
          <label className={styles.groupSelector} htmlFor="transition-group-selector">
            <span>Grupo a procesar</span>
            <select
              id="transition-group-selector"
              value={selectedGroup}
              onChange={(event) => {
                setSelectedGroup(event.target.value)
                setTransitionError('')
                setTransitionSuccess('')
              }}
            >
              <option value="">Seleccioná un grupo</option>
              {GROUP_OPTIONS.map((group) => (
                <option key={group.value} value={group.value}>{group.label}</option>
              ))}
            </select>
          </label>
          <div className={styles.actionButtons}>
            <button className={styles.secondaryButton} disabled={isLoading || isProcessingTransition} type="button" onClick={handleRefresh}>
              {isLoading ? 'Refrescando…' : 'Refrescar datos'}
            </button>
            <button
              className={styles.primaryButton}
              disabled={!selectedGroup || isLoading || isProcessingTransition}
              type="button"
              onClick={handleProcessTransition}
            >
              {isProcessingTransition ? 'Procesando transición…' : 'Ejecutar transición a 16avos'}
            </button>
          </div>
          {transitionSuccess && (
            <p className={styles.formSuccess} role="status">
              {transitionSuccess}
            </p>
          )}
          {transitionError && (
            <p className={styles.formError} role="alert">
              {transitionError}
            </p>
          )}
        </form>
        <p className={styles.blockedCopy}>
          React no envía equipos, standings, posiciones ni slots: solo <code>{'{ group }'}</code> para que el backend procese la transición.
        </p>
      </section>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite" aria-busy="true">
          <p className={styles.kicker}>Cargando transición…</p>
          <h2>Estamos preparando datos de transición a 16avos</h2>
          <p>En unos segundos vas a poder revisar standings oficiales y cruces de eliminatorias.</p>
        </section>
      )}

      {!isLoading && hasError && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h2>Transición no disponible</h2>
          <p>{FRIENDLY_ERROR_MESSAGE}</p>
          <button className={styles.primaryButton} type="button" onClick={handleRefresh}>
            Refrescar datos
          </button>
        </section>
      )}

      {!isLoading && !hasError && !readiness.hasAnyData && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Sin datos para revisar</p>
          <h2>No hay standings ni partidos disponibles</h2>
          <p>
            Cuando el backend devuelva posiciones y cruces de eliminatorias, esta pantalla mostrará una preview
            operativa sin calcular clasificados en React.
          </p>
        </section>
      )}

      {!isLoading && !hasError && readiness.hasAnyData && (
        <>
          <section className={styles.summaryGrid} aria-label="Resumen operativo de transición">
            <article className={styles.summaryCard}>
              <p className={styles.kicker}>Standings</p>
              <h2>Grupos detectados</h2>
              <dl className={styles.stats}>
                <div>
                  <dt>Grupos</dt>
                  <dd>{readiness.groupsFound}</dd>
                </div>
                <div>
                  <dt>Con equipos</dt>
                  <dd>{readiness.groupsWithTeams}</dd>
                </div>
                <div>
                  <dt>Equipos</dt>
                  <dd>{readiness.totalStandingTeams}</dd>
                </div>
                <div>
                  <dt>Con posición</dt>
                  <dd>{readiness.teamsWithPosition}</dd>
                </div>
              </dl>
            </article>

            <article className={styles.summaryCard}>
              <p className={styles.kicker}>Bracket</p>
              <h2>16avos recibidos</h2>
              <dl className={styles.stats}>
                <div>
                  <dt>Partidos</dt>
                  <dd>{readiness.roundOf32MatchesFound}</dd>
                </div>
                <div>
                  <dt>Slots reales</dt>
                  <dd>{readiness.populatedRoundOf32Slots}</dd>
                </div>
                <div>
                  <dt>Slots pendientes</dt>
                  <dd>{readiness.pendingRoundOf32Slots}</dd>
                </div>
                <div>
                  <dt>Marcados 16avos</dt>
                  <dd>{readiness.teamsMarkedRoundOf32}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className={styles.previewPanel} aria-labelledby="transition-preview-title">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Preview read-only</p>
              <h2 id="transition-preview-title">Vista previa basada en standings actuales</h2>
              <p>
                La clasificación definitiva debe ser resuelta por el backend. Esta vista solo muestra datos ya recibidos:
                grupos, posiciones registradas y clasificación técnica cuando existe.
              </p>
            </div>

            {standings.length > 0 ? (
              <div className={styles.groupPreviewGrid}>
                {standings.map((standing) => (
                  <article className={styles.groupCard} key={standing.group}>
                    <h3>Grupo {standing.group}</h3>
                    {standing.teams.length > 0 ? (
                      <ul className={styles.teamList}>
                        {standing.teams.map((row, index) => (
                          <li key={row?.team?._id ?? `${standing.group}-${getTeamName(row)}-${index}`}>
                            <span className={styles.positionBadge}>{getTeamPositionLabel(row, index)}</span>
                            <strong>{getTeamName(row)}</strong>
                            <small>{getQualifiedLabel(row?.team?.qualifiedTo)}</small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.emptyText}>Sin equipos recibidos para este grupo.</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3>Standings no disponibles</h3>
                <p>No hay grupos para previsualizar. Refrescá datos o revisá el backend de standings.</p>
              </div>
            )}
          </section>

          <section className={styles.bracketPanel} aria-labelledby="transition-bracket-title">
            <div className={styles.sectionHeader}>
              <p className={styles.kicker}>Cruces de 16avos</p>
              <h2 id="transition-bracket-title">Estado del primer bracket eliminatorio</h2>
              <p>
                Se listan partidos de 16avos que ya vienen en los datos de partidos. Los equipos por definir no se
                completan desde frontend.
              </p>
            </div>

            {visibleRoundOf32Matches.length > 0 ? (
              <ul className={styles.matchPreviewList}>
                {visibleRoundOf32Matches.map((match, index) => (
                  <li key={match?._id ?? match?.matchNumber ?? index}>
                    <span>{getMatchLabel(match, index)}</span>
                    <strong>
                      {getTeamSlotName(match?.homeTeam, match?.placeholderHome)} vs{' '}
                      {getTeamSlotName(match?.awayTeam, match?.placeholderAway)}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <h3>No hay partidos de 16avos recibidos</h3>
                <p>Cuando el backend devuelva partidos `ROUND_OF_32`, se van a listar acá para revisión.</p>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}

export default AdminTransitionPage
