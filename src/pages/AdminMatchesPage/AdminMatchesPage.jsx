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
  isKnockoutMatch,
  shouldRequestPenaltyScores,
} from '../../schemas/adminMatchResultSchema'
import { getAdminMatches, updateAdminMatch } from '../../services/admin/adminMatchesService'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import { formatDisplayDate, formatDisplayTime, sortMatchesByDate } from '../../utils/dateAdapter'
import styles from './AdminMatchesPage.module.css'

const ALL_FILTER_VALUE = 'all'
const FRIENDLY_ERROR_MESSAGE =
  'No pudimos cargar los partidos para administración. Si el servidor estaba dormido, esperá unos segundos y probá de nuevo.'

function getMatchKey(match, index) {
  return match?._id ?? `${match?.stage ?? 'match'}-${match?.date ?? index}`
}

function getTeamName(team) {
  return typeof team?.name === 'string' && team.name.trim() ? team.name.trim() : 'Equipo por definir'
}

function getTeamSearchText(team) {
  return typeof team?.name === 'string' ? team.name : ''
}

function getNormalizedStageForGroupLookup(stage) {
  const normalized = String(stage ?? '')
    .trim()
    .toUpperCase()
    .replace(/[_-]/g, ' ')

  const match = normalized.match(/^(?:GROUP|GRUPO)\s*([A-L])$/i)
  return match?.[1]?.toUpperCase() ?? ''
}

function getStadiumLabel(stadium) {
  if (typeof stadium === 'string' && stadium.trim()) {
    return stadium.trim()
  }

  if (!stadium?.name) {
    return 'Sede por confirmar'
  }

  const location = [stadium.city, stadium.country].filter(Boolean).join(', ')
  return location ? `${stadium.name} · ${location}` : stadium.name
}

function getStadiumSearchText(stadium) {
  if (typeof stadium === 'string') {
    return stadium
  }

  return [stadium?.name, stadium?.city, stadium?.country].filter(Boolean).join(' ')
}

function getGroupFromStage(stage) {
  return getNormalizedStageForGroupLookup(stage)
}

function getGroupValue(match) {
  return getGroupFromStage(match?.stage) || match?.homeTeam?.group || match?.awayTeam?.group || ''
}

function toDateFilterValue(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString().slice(0, 10)
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

function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getUniqueSortedValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
}

function getFilterOptions(matches) {
  return {
    groups: getUniqueSortedValues(matches.map(getGroupValue)),
    stages: getUniqueSortedValues(matches.map((match) => match?.stage)),
    dates: getUniqueSortedValues(matches.map((match) => toDateFilterValue(match?.date))),
  }
}

function getOrderedFilteredMatches(matches, filters) {
  const search = normalizeSearch(filters.search)
  const sorted = sortMatchesByDate(matches)

  const filtered = sorted.filter((match) => {
    const status = normalizeMatchStatus(match?.status)
    const group = getGroupValue(match)
    const date = toDateFilterValue(match?.date)
    const searchable = normalizeSearch([
      getTeamSearchText(match?.homeTeam),
      getTeamSearchText(match?.awayTeam),
      getStadiumSearchText(match?.stadium),
      match?.stage,
      match?.matchNumber,
    ].filter(Boolean).join(' '))

    return (
      (filters.group === ALL_FILTER_VALUE || group === filters.group) &&
      (filters.stage === ALL_FILTER_VALUE || match?.stage === filters.stage) &&
      (filters.status === ALL_FILTER_VALUE || status === filters.status) &&
      (filters.date === ALL_FILTER_VALUE || date === filters.date) &&
      (!search || searchable.includes(search))
    )
  })

  const playingMatches = []
  const pendingMatches = []
  const finishedMatches = []

  for (const match of filtered) {
    const status = normalizeMatchStatus(match?.status)

    if (status === MATCH_STATUS.playing) {
      playingMatches.push(match)
    } else if (status === MATCH_STATUS.pending) {
      pendingMatches.push(match)
    } else if (status === MATCH_STATUS.finished) {
      finishedMatches.push(match)
    }
  }

  return [...playingMatches, ...pendingMatches, ...finishedMatches]
}

function getStatusCounts(matches) {
  return matches.reduce(
    (counts, match) => ({
      ...counts,
      [normalizeMatchStatus(match?.status)]: counts[normalizeMatchStatus(match?.status)] + 1,
    }),
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

function ScoreInput({ label, value, onChange, disabled = false }) {
  return (
    <label className={styles.scoreField}>
      <span>{label}</span>
      <input
        disabled={disabled}
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

function AdminMatchesPage() {
  const dispatch = useDispatch()
  const [matches, setMatches] = useState([])
  const [drafts, setDrafts] = useState({})
  const [filters, setFilters] = useState({
    group: ALL_FILTER_VALUE,
    stage: ALL_FILTER_VALUE,
    status: ALL_FILTER_VALUE,
    date: ALL_FILTER_VALUE,
    search: '',
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
          title: 'Cargando partidos administrativos',
          message:
            'Puede tardar unos segundos si el servidor está despertando. La lista se va a actualizar automáticamente.',
          variant: 'info',
        }),
      )
    }, DELAYED_LOADING_THRESHOLD_MS)

    getAdminMatches()
      .then((nextMatches) => {
        if (!isActive) {
          return
        }

        setMatches(nextMatches)
        setDrafts(Object.fromEntries(nextMatches.map((match) => [match._id, getDraftFromMatch(match)])))
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

  const filterOptions = getFilterOptions(matches)
  const filteredMatches = getOrderedFilteredMatches(matches, filters)
  const statusCounts = getStatusCounts(matches)

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
    setMatches(nextMatches)
    setDrafts(Object.fromEntries(nextMatches.map((match) => [match._id, getDraftFromMatch(match)])))
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
      !window.confirm('¿Confirmás guardar este partido como finalizado?')
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
        [matchId]: { isSaving: false, error: '', success: 'Resultado guardado' },
      }))
    } catch (error) {
      setSaveStates((currentStates) => ({
        ...currentStates,
        [matchId]: {
          isSaving: false,
          error: error?.message ?? 'No pudimos guardar el resultado. Intentá nuevamente.',
          success: '',
        },
      }))
    }
  }

  return (
    <section className={styles.page} aria-labelledby="admin-matches-title">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Gestión de resultados</p>
          <h1 id="admin-matches-title">Partidos del Mundial 2026</h1>
          <p>
            Cargá estados, goles y penales oficiales. El frontend no recalcula standings ni
            mueve equipos en eliminatorias: esas reglas quedan en el backend.
          </p>
        </div>

        <dl className={styles.stats} aria-label="Resumen de estados de partidos">
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
        </dl>
      </header>

      <section className={styles.filters} aria-label="Filtros de partidos administrativos">
        <label>
          <span>Grupo</span>
          <select value={filters.group} onChange={(event) => handleFilterChange('group', event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todos los grupos</option>
            {filterOptions.groups.map((group) => (
              <option key={group} value={group}>Grupo {group}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Fase</span>
              <select value={filters.stage} onChange={(event) => handleFilterChange('stage', event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todas las fases</option>
            {filterOptions.stages.map((stage) => (
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

        <label>
          <span>Fecha</span>
          <select value={filters.date} onChange={(event) => handleFilterChange('date', event.target.value)}>
            <option value={ALL_FILTER_VALUE}>Todas las fechas</option>
            {filterOptions.dates.map((date) => (
              <option key={date} value={date}>{formatDisplayDate(date)}</option>
            ))}
          </select>
        </label>

        <label className={styles.searchField}>
          <span>Buscar</span>
          <input
            placeholder="Equipo, sede o partido"
            type="search"
            value={filters.search}
            onChange={(event) => handleFilterChange('search', event.target.value)}
          />
        </label>
      </section>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite" aria-busy="true">
          <p className={styles.kicker}>Cargando partidos…</p>
          <h2>Estamos preparando la lista administrativa</h2>
          <p>En unos segundos vas a poder editar resultados oficiales.</p>
        </section>
      )}

      {!isLoading && hasError && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h2>Partidos no disponibles</h2>
          <p>{FRIENDLY_ERROR_MESSAGE}</p>
          <button className={styles.retryButton} type="button" onClick={handleRetryMatches}>
            Reintentar
          </button>
        </section>
      )}

      {!isLoading && !hasError && filteredMatches.length === 0 && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Sin resultados</p>
          <h2>No hay partidos para los filtros seleccionados</h2>
          <p>Probá ajustar los filtros o limpiar la búsqueda.</p>
        </section>
      )}

      {!isLoading && !hasError && filteredMatches.length > 0 && (
        <section className={styles.matchesList} aria-label="Partidos administrables">
          {filteredMatches.map((match, index) => {
            const isMatchFinished = normalizeMatchStatus(match?.status) === MATCH_STATUS.finished
            const matchId = match._id
            const draft = drafts[matchId] ?? getDraftFromMatch(match)
            const saveState = saveStates[matchId] ?? { isSaving: false, error: '', success: '' }
            const showPenalties = shouldRequestPenaltyScores(match, draft)
            const homeTeamName = getTeamName(match.homeTeam)
            const awayTeamName = getTeamName(match.awayTeam)

            return (
              <article className={`${styles.matchCard} ${isMatchFinished ? styles.matchCardFinished : ''}`} key={getMatchKey(match, index)}>
                <div className={styles.matchHeader}>
                  <div>
                    <p className={styles.matchMeta}>{getMatchStageLabel(match?.stage)}</p>
                    <h2>{homeTeamName} vs {awayTeamName}</h2>
                  </div>
                  <StatusBadge status={draft.status} />
                </div>

                <dl className={styles.matchDetails}>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{formatDisplayDate(match.date)} · {formatDisplayTime(match.date)}</dd>
                  </div>
                  <div>
                    <dt>Estadio</dt>
                    <dd>{getStadiumLabel(match.stadium)}</dd>
                  </div>
                  {match.matchNumber && (
                    <div>
                      <dt>Partido</dt>
                      <dd>#{match.matchNumber}</dd>
                    </div>
                  )}
                </dl>

                <form className={styles.resultForm} onSubmit={(event) => handleSaveMatch(event, match)} noValidate>
                  <label className={styles.statusField}>
                    <span>Estado del partido</span>
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

                  {showPenalties && (
                    <div className={styles.penaltyPanel}>
                      <p>Definición por penales</p>
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
                  )}

                  {isKnockoutMatch(match) && !showPenalties && (
                    <p className={styles.helperText}>
                      Los penales se habilitan solo si una eliminatoria finalizada queda empatada.
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
                    {saveState.isSaving ? 'Guardando…' : 'Guardar resultado'}
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

export default AdminMatchesPage
