import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { MATCH_STATUS, MATCH_STATUS_VALUES, getMatchStatusLabel, normalizeMatchStatus } from '../../constants/matchStatus'
import { getMatchStageLabel } from '../../constants/matchStages'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import {
  buildAdminMatchUpdatePayload,
  shouldRequestPenaltyScores,
} from '../../schemas/adminMatchResultSchema'
import { getAdminMatches, updateAdminMatch } from '../../services/admin/adminMatchesService'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateAdapter'
import styles from './AdminKnockoutsPage.module.css'

const ALL_FILTER_VALUE = 'all'
const FRIENDLY_ERROR_MESSAGE =
  'No pudimos cargar las eliminatorias para administración. Si el servidor estaba despertando, esperá unos segundos y probá de nuevo.'

const KNOCKOUT_STAGE_VALUES = [
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINALS',
  'SEMI_FINALS',
  'THIRD_PLACE_MATCH',
  'FINAL',
]

function normalizeStage(stage) {
  return String(stage ?? '').trim().toUpperCase()
}

function isKnockoutStage(stage) {
  return KNOCKOUT_STAGE_VALUES.includes(normalizeStage(stage))
}

function isKnockoutMatch(match) {
  return (typeof match?.matchNumber === 'number' && match.matchNumber >= 73) || isKnockoutStage(match?.stage)
}

function getMatchKey(match, index) {
  return match?._id ?? `knockout-${match?.matchNumber ?? index}`
}

function getDraftFromMatch(match) {
  return {
    status: normalizeMatchStatus(match?.status),
    homeScore: Number.isInteger(match?.homeScore) ? String(match.homeScore) : '',
    awayScore: Number.isInteger(match?.awayScore) ? String(match.awayScore) : '',
    homePenaltyScore: Number.isInteger(match?.homePenaltyScore) ? String(match.homePenaltyScore) : '',
    awayPenaltyScore: Number.isInteger(match?.awayPenaltyScore) ? String(match.awayPenaltyScore) : '',
  }
}

function getTeamName(team, placeholder) {
  if (typeof team?.name === 'string' && team.name.trim()) {
    return team.name.trim()
  }

  if (typeof placeholder === 'string' && placeholder.trim()) {
    return placeholder.trim()
  }

  return 'Equipo por definir'
}

function getSlotState(team, placeholder) {
  if (typeof team?.name === 'string' && team.name.trim()) {
    return 'Equipo confirmado'
  }

  if (typeof placeholder === 'string' && placeholder.trim()) {
    return 'Placeholder del bracket'
  }

  return 'Slot pendiente'
}

function getPointerLabel(pointer) {
  return Number.isInteger(pointer) ? `Partido #${pointer}` : 'No aplica'
}

function getStageOptions(matches) {
  return [...new Set(matches.map((match) => normalizeStage(match?.stage)).filter(Boolean))]
    .sort((firstStage, secondStage) => {
      const firstIndex = KNOCKOUT_STAGE_VALUES.indexOf(firstStage)
      const secondIndex = KNOCKOUT_STAGE_VALUES.indexOf(secondStage)

      if (firstIndex === -1 && secondIndex === -1) {
        return firstStage.localeCompare(secondStage, 'es')
      }

      if (firstIndex === -1) {
        return 1
      }

      if (secondIndex === -1) {
        return -1
      }

      return firstIndex - secondIndex
    })
}

function getOrderedKnockoutMatches(matches) {
  return [...matches].sort((firstMatch, secondMatch) => {
    const firstNumber = Number.isInteger(firstMatch?.matchNumber) ? firstMatch.matchNumber : Number.POSITIVE_INFINITY
    const secondNumber = Number.isInteger(secondMatch?.matchNumber) ? secondMatch.matchNumber : Number.POSITIVE_INFINITY

    if (firstNumber !== secondNumber) {
      return firstNumber - secondNumber
    }

    return String(firstMatch?.date ?? '').localeCompare(String(secondMatch?.date ?? ''))
  })
}

function getVisibleKnockoutMatches(matches, filters) {
  return getOrderedKnockoutMatches(matches).filter((match) => {
    const status = normalizeMatchStatus(match?.status)
    const stage = normalizeStage(match?.stage)

    return (
      (filters.stage === ALL_FILTER_VALUE || stage === filters.stage) &&
      (filters.status === ALL_FILTER_VALUE || status === filters.status)
    )
  })
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

function StatusBadge({ status }) {
  const normalizedStatus = normalizeMatchStatus(status)

  return (
    <span className={`${styles.statusBadge} ${styles[`status${normalizedStatus}`]}`}>
      {getMatchStatusLabel(normalizedStatus)}
    </span>
  )
}

function ScoreInput({ label, value, onChange }) {
  return (
    <label className={styles.scoreField}>
      <span>{label}</span>
      <input
        inputMode="numeric"
        min="0"
        pattern="[0-9]*"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function SlotSummary({ label, team, placeholder }) {
  return (
    <div className={styles.slotCard}>
      <span>{label}</span>
      <strong>{getTeamName(team, placeholder)}</strong>
      <small>{getSlotState(team, placeholder)}</small>
    </div>
  )
}

function AdminKnockoutsPage() {
  const dispatch = useDispatch()
  const [matches, setMatches] = useState([])
  const [drafts, setDrafts] = useState({})
  const [filters, setFilters] = useState({
    stage: ALL_FILTER_VALUE,
    status: ALL_FILTER_VALUE,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [saveStates, setSaveStates] = useState({})

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
          title: 'Cargando eliminatorias administrativas',
          message:
            'Puede tardar unos segundos si el servidor está despertando. El monitor se va a actualizar automáticamente.',
          variant: 'info',
        }),
      )
    }, DELAYED_LOADING_THRESHOLD_MS)

    getAdminMatches()
      .then((nextMatches) => {
        if (!isActive) {
          return
        }

        const knockoutMatches = getOrderedKnockoutMatches(nextMatches.filter(isKnockoutMatch))
        setMatches(knockoutMatches)
        setDrafts(Object.fromEntries(knockoutMatches.map((match) => [match._id, getDraftFromMatch(match)])))
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

  const statusCounts = getStatusCounts(matches)
  const stageOptions = getStageOptions(matches)
  const visibleMatches = getVisibleKnockoutMatches(matches, filters)

  function handleFilterChange(field, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [field]: value }))
  }

  function handleRetryMatches() {
    setIsLoading(true)
    setHasError(false)
    setRetryCount((currentCount) => currentCount + 1)
  }

  function handleDraftChange(matchId, field, value) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [matchId]: {
        ...currentDrafts[matchId],
        [field]: field === 'status' ? normalizeMatchStatus(value) : value,
      },
    }))
    setSaveStates((currentStates) => ({
      ...currentStates,
      [matchId]: { isSaving: false, error: '', success: '' },
    }))
  }

  async function refreshMatchesAfterSave() {
    const nextMatches = await getAdminMatches()
    const knockoutMatches = getOrderedKnockoutMatches(nextMatches.filter(isKnockoutMatch))
    setMatches(knockoutMatches)
    setDrafts(Object.fromEntries(knockoutMatches.map((match) => [match._id, getDraftFromMatch(match)])))
  }

  async function handleSaveMatch(event, match) {
    event.preventDefault()
    const matchId = match?._id
    const draft = drafts[matchId]
    const result = buildAdminMatchUpdatePayload(match, draft)

    if (!result.isValid) {
      setSaveStates((currentStates) => ({
        ...currentStates,
        [matchId]: { isSaving: false, error: result.errors[0], success: '' },
      }))
      return
    }

    if (
      result.payload.status === MATCH_STATUS.finished &&
      !window.confirm('¿Confirmás guardar esta eliminatoria como finalizada? El Bracket Engine del backend definirá la progresión.')
    ) {
      return
    }

    setSaveStates((currentStates) => ({
      ...currentStates,
      [matchId]: { isSaving: true, error: '', success: '' },
    }))

    try {
      await updateAdminMatch(matchId, result.payload)
      await refreshMatchesAfterSave()
      setSaveStates((currentStates) => ({
        ...currentStates,
        [matchId]: { isSaving: false, error: '', success: 'Resultado de eliminatoria guardado' },
      }))
    } catch {
      setSaveStates((currentStates) => ({
        ...currentStates,
        [matchId]: {
          isSaving: false,
          error: 'No pudimos guardar la eliminatoria. Revisá la sesión admin y volvé a intentar.',
          success: '',
        },
      }))
    }
  }

  return (
    <section className={styles.page} aria-labelledby="admin-knockouts-title">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Bracket Engine</p>
          <h1 id="admin-knockouts-title">Eliminatorias admin</h1>
          <p>
            Cargá resultados oficiales de eliminatorias. React solo envía scores y status;
            el Bracket Engine del backend define ganadores, perdedores y próximos cruces.
          </p>
        </div>

        <dl className={styles.stats} aria-label="Resumen de estados de eliminatorias">
          <div>
            <dt>Pendientes</dt>
            <dd>{statusCounts[MATCH_STATUS.pending]}</dd>
          </div>
          <div>
            <dt>En juego</dt>
            <dd>{statusCounts[MATCH_STATUS.playing]}</dd>
          </div>
          <div>
            <dt>Finalizadas</dt>
            <dd>{statusCounts[MATCH_STATUS.finished]}</dd>
          </div>
        </dl>
      </header>

      <section className={styles.safetyCard} aria-labelledby="admin-knockouts-safety-title">
        <h2 id="admin-knockouts-safety-title">Regla de seguridad</h2>
        <p>
          Esta consola no edita equipos, placeholders, `nextMatchWinner` ni `nextMatchLoser`.
          Después de guardar, se refresca `GET /api/matches` para mostrar la progresión persistida por backend.
        </p>
      </section>

      <section className={styles.filters} aria-label="Filtros de eliminatorias administrativas">
        <label>
          <span>Fase</span>
          <select value={filters.stage} onChange={(event) => handleFilterChange('stage', event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todas las fases</option>
            {stageOptions.map((stage) => (
              <option key={stage} value={stage}>{getMatchStageLabel(stage)}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Estado</span>
          <select value={filters.status} onChange={(event) => handleFilterChange('status', event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los estados</option>
            {MATCH_STATUS_VALUES.map((status) => (
              <option key={status} value={status}>{getMatchStatusLabel(status)}</option>
            ))}
          </select>
        </label>
      </section>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite" aria-busy="true">
          <p className={styles.kicker}>Cargando eliminatorias…</p>
          <h2>Estamos preparando el monitor del bracket</h2>
          <p>En unos segundos vas a poder cargar resultados oficiales de eliminatorias.</p>
        </section>
      )}

      {!isLoading && hasError && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h2>Eliminatorias no disponibles</h2>
          <p>{FRIENDLY_ERROR_MESSAGE}</p>
          <button className={styles.retryButton} type="button" onClick={handleRetryMatches}>
            Reintentar
          </button>
        </section>
      )}

      {!isLoading && !hasError && matches.length === 0 && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Sin eliminatorias</p>
          <h2>No hay partidos knockout administrables</h2>
          <p>Cuando el backend entregue partidos con `matchNumber` desde 73 o stages knockout, aparecerán en esta consola.</p>
        </section>
      )}

      {!isLoading && !hasError && matches.length > 0 && visibleMatches.length === 0 && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Sin resultados</p>
          <h2>No hay eliminatorias para los filtros seleccionados</h2>
          <p>Probá cambiar fase o estado para ver otros partidos del bracket.</p>
        </section>
      )}

      {!isLoading && !hasError && visibleMatches.length > 0 && (
        <section className={styles.matchesList} aria-label="Eliminatorias administrables">
          {visibleMatches.map((match, index) => {
            const matchId = match._id
            const draft = drafts[matchId] ?? getDraftFromMatch(match)
            const saveState = saveStates[matchId] ?? { isSaving: false, error: '', success: '' }
            const showPenalties = shouldRequestPenaltyScores(match, draft)
            const homeTeamName = getTeamName(match.homeTeam, match.placeholderHome)
            const awayTeamName = getTeamName(match.awayTeam, match.placeholderAway)

            return (
              <article className={styles.matchCard} key={getMatchKey(match, index)}>
                <div className={styles.matchSummary}>
                  <div className={styles.matchHeader}>
                    <div>
                      <p className={styles.matchMeta}>{getMatchStageLabel(match?.stage)}</p>
                      <h2>{homeTeamName} vs {awayTeamName}</h2>
                    </div>
                    <StatusBadge status={draft.status} />
                  </div>

                  <div className={styles.slots} aria-label="Equipos y placeholders del partido">
                    <SlotSummary label="Local" team={match.homeTeam} placeholder={match.placeholderHome} />
                    <SlotSummary label="Visitante" team={match.awayTeam} placeholder={match.placeholderAway} />
                  </div>

                  <dl className={styles.matchDetails}>
                    <div>
                      <dt>Partido</dt>
                      <dd>{Number.isInteger(match.matchNumber) ? `#${match.matchNumber}` : 'Por confirmar'}</dd>
                    </div>
                    <div>
                      <dt>Fecha</dt>
                      <dd>{formatDisplayDate(match.date)} · {formatDisplayTime(match.date)}</dd>
                    </div>
                    <div>
                      <dt>Ganador avanza a</dt>
                      <dd>{getPointerLabel(match.nextMatchWinner)}</dd>
                    </div>
                    <div>
                      <dt>Perdedor avanza a</dt>
                      <dd>{getPointerLabel(match.nextMatchLoser)}</dd>
                    </div>
                    <div>
                      <dt>Marcador actual</dt>
                      <dd>
                        {Number.isInteger(match.homeScore) && Number.isInteger(match.awayScore)
                          ? `${match.homeScore} - ${match.awayScore}`
                          : 'Sin goles cargados'}
                      </dd>
                    </div>
                    <div>
                      <dt>Penales actuales</dt>
                      <dd>
                        {Number.isInteger(match.homePenaltyScore) && Number.isInteger(match.awayPenaltyScore)
                          ? `${match.homePenaltyScore} - ${match.awayPenaltyScore}`
                          : 'Sin penales cargados'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <form className={styles.resultForm} onSubmit={(event) => handleSaveMatch(event, match)} noValidate>
                  <label className={styles.statusField}>
                    <span>Estado de la eliminatoria</span>
                    <select
                      value={draft.status}
                      onChange={(event) => handleDraftChange(matchId, 'status', event.target.value)}
                    >
                      {MATCH_STATUS_VALUES.map((status) => (
                        <option key={status} value={status}>{getMatchStatusLabel(status)}</option>
                      ))}
                    </select>
                  </label>

                  <div className={styles.scoreGrid} aria-label="Goles regulares">
                    <ScoreInput
                      label={`Goles de ${homeTeamName}`}
                      value={draft.homeScore}
                      onChange={(value) => handleDraftChange(matchId, 'homeScore', value)}
                    />
                    <ScoreInput
                      label={`Goles de ${awayTeamName}`}
                      value={draft.awayScore}
                      onChange={(value) => handleDraftChange(matchId, 'awayScore', value)}
                    />
                  </div>

                  {showPenalties ? (
                    <div className={styles.penaltyPanel}>
                      <p>Definición por penales obligatoria</p>
                      <div className={styles.scoreGrid} aria-label="Penales">
                        <ScoreInput
                          label={`Penales de ${homeTeamName}`}
                          value={draft.homePenaltyScore}
                          onChange={(value) => handleDraftChange(matchId, 'homePenaltyScore', value)}
                        />
                        <ScoreInput
                          label={`Penales de ${awayTeamName}`}
                          value={draft.awayPenaltyScore}
                          onChange={(value) => handleDraftChange(matchId, 'awayPenaltyScore', value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className={styles.helperText}>
                      Los penales se habilitan solo si la eliminatoria finalizada queda empatada.
                    </p>
                  )}

                  {saveState.error && (
                    <p className={styles.formError} role="alert">
                      {saveState.error}
                    </p>
                  )}
                  {saveState.success && !saveState.error && (
                    <p className={styles.formSuccess} role="status">
                      {saveState.success}
                    </p>
                  )}

                  <button className={styles.saveButton} disabled={saveState.isSaving} type="submit">
                    {saveState.isSaving ? 'Guardando…' : 'Guardar eliminatoria'}
                  </button>
                </form>
              </article>
            )
          })}
        </section>
      )}
    </section>
  )
}

export default AdminKnockoutsPage
