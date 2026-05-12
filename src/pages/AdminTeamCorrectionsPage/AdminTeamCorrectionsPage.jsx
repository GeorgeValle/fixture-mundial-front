import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ADMIN_ROUTES } from '../../constants/adminRoutes'
import { GROUP_OPTIONS } from '../../constants/groups'
import {
  QUALIFIED_TO_OPTIONS,
  fromQualifiedToSelectValue,
  getQualifiedToLabel,
  toQualifiedToSelectValue,
} from '../../constants/qualifiedTo'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { buildAdminTeamCorrectionPayload } from '../../schemas/adminTeamCorrectionSchema'
import { getAdminTeams, updateAdminTeamCorrection } from '../../services/admin/adminTeamsService'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import styles from './AdminTeamCorrectionsPage.module.css'

const ALL_GROUPS_VALUE = 'all'
const FRIENDLY_ERROR_MESSAGE =
  'No pudimos cargar los equipos para correcciones. Si la sesión admin expiró o el servidor estaba dormido, iniciá sesión nuevamente o probá otra vez en unos segundos.'

function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getTeamKey(team, index) {
  return team?._id ?? `${team?.group ?? 'team'}-${team?.name ?? index}`
}

function getTeamName(team) {
  return typeof team?.name === 'string' && team.name.trim() ? team.name.trim() : 'Equipo sin nombre'
}

function getTeamGroup(team) {
  return typeof team?.group === 'string' && team.group.trim() ? team.group.trim().toUpperCase() : 'Sin grupo'
}

function getDraftFromTeam(team) {
  return {
    position: Number.isInteger(team?.position) ? String(team.position) : '',
    qualifiedTo: toQualifiedToSelectValue(team?.qualifiedTo ?? null),
    shieldUrl: team?.shieldUrl ?? '',
  }
}

function getCurrentTeamForDiff(team) {
  return {
    ...team,
    position: Number.isInteger(team?.position) ? team.position : null,
    qualifiedTo: team?.qualifiedTo ?? null,
    shieldUrl: team?.shieldUrl ?? '',
  }
}

function getCorrectionPayloadResult(team, draft) {
  const currentQualifiedToSelectValue = toQualifiedToSelectValue(team?.qualifiedTo ?? null)

  return buildAdminTeamCorrectionPayload(getCurrentTeamForDiff(team), {
    position: draft?.position,
    qualifiedTo:
      draft?.qualifiedTo === currentQualifiedToSelectValue
        ? undefined
        : fromQualifiedToSelectValue(draft?.qualifiedTo),
    shieldUrl: draft?.shieldUrl,
  })
}

function getChangeLabels(team, payload) {
  const labels = []

  if (Object.prototype.hasOwnProperty.call(payload, 'position')) {
    labels.push(`Posición: ${team?.position ?? 'sin posición'} → ${payload.position}`)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'qualifiedTo')) {
    labels.push(`Clasificación: ${getQualifiedToLabel(team?.qualifiedTo)} → ${getQualifiedToLabel(payload.qualifiedTo)}`)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'shieldUrl')) {
    labels.push('Escudo: se actualizará la URL visible')
  }

  return labels
}

function getOrderedFilteredTeams(teams, filters) {
  const search = normalizeSearch(filters.search)

  return [...teams]
    .sort((a, b) => `${getTeamGroup(a)}-${getTeamName(a)}`.localeCompare(`${getTeamGroup(b)}-${getTeamName(b)}`, 'es'))
    .filter((team) => {
      const group = getTeamGroup(team)
      const searchable = normalizeSearch([team?.name, team?.group, team?.qualifiedTo].filter(Boolean).join(' '))

      return (
        (filters.group === ALL_GROUPS_VALUE || group === filters.group) &&
        (!search || searchable.includes(search))
      )
    })
}

function AdminTeamCorrectionsPage() {
  const dispatch = useDispatch()
  const [teams, setTeams] = useState([])
  const [drafts, setDrafts] = useState({})
  const [filters, setFilters] = useState({ group: ALL_GROUPS_VALUE, search: '' })
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
          title: 'Cargando correcciones de equipos',
          message:
            'Puede tardar unos segundos si el servidor está despertando. La lista se va a actualizar automáticamente.',
          variant: 'info',
        }),
      )
    }, DELAYED_LOADING_THRESHOLD_MS)

    getAdminTeams()
      .then((nextTeams) => {
        if (!isActive) {
          return
        }

        setTeams(nextTeams)
        setDrafts(Object.fromEntries(nextTeams.map((team, index) => [getTeamKey(team, index), getDraftFromTeam(team)])))
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

  const filteredTeams = getOrderedFilteredTeams(teams, filters)
  const groupsWithTeams = new Set(teams.map((team) => getTeamGroup(team)).filter((group) => group !== 'Sin grupo')).size
  const teamsWithClassification = teams.filter((team) => Boolean(team?.qualifiedTo)).length

  function handleRetry() {
    setIsLoading(true)
    setHasError(false)
    setRetryCount((currentCount) => currentCount + 1)
  }

  function handleFilterChange(field, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [field]: value }))
  }

  function handleDraftChange(teamKey, field, value) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [teamKey]: {
        ...currentDrafts[teamKey],
        [field]: value,
      },
    }))
    setSaveStates((currentStates) => ({
      ...currentStates,
      [teamKey]: { isSaving: false, error: '', success: '' },
    }))
  }

  async function refreshTeamsAfterSave() {
    const nextTeams = await getAdminTeams()
    setTeams(nextTeams)
    setDrafts(Object.fromEntries(nextTeams.map((team, index) => [getTeamKey(team, index), getDraftFromTeam(team)])))
  }

  async function handleSaveTeam(event, team, teamKey) {
    event.preventDefault()
    const draft = drafts[teamKey] ?? getDraftFromTeam(team)
    const result = getCorrectionPayloadResult(team, draft)

    if (!result.isValid) {
      setSaveStates((currentStates) => ({
        ...currentStates,
        [teamKey]: { isSaving: false, error: result.errors[0], success: '' },
      }))
      return
    }

    const changeLabels = getChangeLabels(team, result.payload)
    const didConfirm = window.confirm(
      [
        `¿Confirmás corregir ${getTeamName(team)} del Grupo ${getTeamGroup(team)}?`,
        `Cambios: ${changeLabels.join('; ')}`,
        'Esta corrección puede afectar transición o bracket.',
        `Después puede ser necesario reprocesar el grupo en ${ADMIN_ROUTES.transition}.`,
      ].join('\n'),
    )

    if (!didConfirm) {
      return
    }

    setSaveStates((currentStates) => ({
      ...currentStates,
      [teamKey]: { isSaving: true, error: '', success: '' },
    }))

    try {
      await updateAdminTeamCorrection(team._id, result.payload)
      await refreshTeamsAfterSave()
      const shouldSuggestTransition =
        Object.prototype.hasOwnProperty.call(result.payload, 'position') ||
        Object.prototype.hasOwnProperty.call(result.payload, 'qualifiedTo')
      setSaveStates((currentStates) => ({
        ...currentStates,
        [teamKey]: {
          isSaving: false,
          error: '',
          success: shouldSuggestTransition
            ? `Corrección guardada. Si afecta clasificación, reprocesá el Grupo ${getTeamGroup(team)} en ${ADMIN_ROUTES.transition}.`
            : 'Corrección guardada.',
        },
      }))
    } catch (error) {
      setSaveStates((currentStates) => ({
        ...currentStates,
        [teamKey]: {
          isSaving: false,
          error: error?.message ?? 'No pudimos guardar la corrección. Intentá nuevamente.',
          success: '',
        },
      }))
    }
  }

  return (
    <section className={styles.page} aria-labelledby="admin-team-corrections-title">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Correcciones excepcionales</p>
          <h1 id="admin-team-corrections-title">Correcciones de equipos</h1>
          <p>
            Ajustá solo datos puntuales que puedan afectar la transición a eliminatorias. Esta herramienta no crea,
            elimina ni edita equipos completos.
          </p>
        </div>

        <div className={styles.contractCard}>
          <strong>Endpoint privado confirmado</strong>
          <span>Guardado con PUT /api/teams/:id</span>
          <span>Protegido por verifyAdmin y cookie HttpOnly</span>
        </div>
      </header>

      <section className={styles.warningCard} aria-labelledby="team-corrections-warning-title">
        <div>
          <p className={styles.kicker}>Impacto operativo</p>
          <h2 id="team-corrections-warning-title">Revisá antes de guardar</h2>
          <p>
            Cambiar posición o clasificación puede afectar qué equipos toma el Transition Engine. Después de corregir
            datos de clasificación, reprocesá el grupo desde <Link to={ADMIN_ROUTES.transition}>/admin/transition</Link>.
          </p>
        </div>
      </section>

      <section className={styles.filters} aria-label="Filtros de correcciones de equipos">
        <label>
          <span>Grupo</span>
          <select value={filters.group} onChange={(event) => handleFilterChange('group', event.target.value)}>
            <option value={ALL_GROUPS_VALUE}>Todos los grupos</option>
            {GROUP_OPTIONS.map((group) => (
              <option key={group.value} value={group.value}>{group.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.searchField}>
          <span>Buscar</span>
          <input
            placeholder="Nombre de equipo"
            type="search"
            value={filters.search}
            onChange={(event) => handleFilterChange('search', event.target.value)}
          />
        </label>
      </section>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite" aria-busy="true">
          <p className={styles.kicker}>Cargando equipos…</p>
          <h2>Estamos preparando la lista de correcciones</h2>
          <p>En unos segundos vas a poder revisar position, qualifiedTo y shieldUrl.</p>
        </section>
      )}

      {!isLoading && hasError && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h2>Equipos no disponibles</h2>
          <p>{FRIENDLY_ERROR_MESSAGE}</p>
          <button className={styles.primaryButton} type="button" onClick={handleRetry}>
            Reintentar
          </button>
        </section>
      )}

      {!isLoading && !hasError && (
        <>
          <dl className={styles.stats} aria-label="Resumen de equipos para correcciones">
            <div>
              <dt>Equipos</dt>
              <dd>{teams.length}</dd>
            </div>
            <div>
              <dt>Grupos detectados</dt>
              <dd>{groupsWithTeams}</dd>
            </div>
            <div>
              <dt>Con clasificación</dt>
              <dd>{teamsWithClassification}</dd>
            </div>
          </dl>

          {filteredTeams.length === 0 ? (
            <section className={styles.stateCard}>
              <p className={styles.kicker}>Sin resultados</p>
              <h2>No hay equipos para los filtros seleccionados</h2>
              <p>Probá ajustar el grupo o limpiar la búsqueda.</p>
            </section>
          ) : (
            <section className={styles.teamsList} aria-label="Equipos administrables para correcciones">
              {filteredTeams.map((team, index) => {
                const teamKey = getTeamKey(team, index)
                const draft = drafts[teamKey] ?? getDraftFromTeam(team)
                const saveState = saveStates[teamKey] ?? { isSaving: false, error: '', success: '' }
                const hasTeamId = Boolean(team?._id)
                const hasKnownQualifiedToOption = QUALIFIED_TO_OPTIONS.some((option) => option.value === draft.qualifiedTo)

                return (
                  <article className={styles.teamCard} key={teamKey}>
                    <div className={styles.teamSummary}>
                      <div>
                        <p className={styles.teamMeta}>Grupo {getTeamGroup(team)}</p>
                        <h2>{getTeamName(team)}</h2>
                      </div>
                      <span className={styles.qualifiedBadge}>{getQualifiedToLabel(team?.qualifiedTo)}</span>
                    </div>

                    <dl className={styles.teamDetails}>
                      <div>
                        <dt>Posición actual</dt>
                        <dd>{team?.position ?? 'Sin posición'}</dd>
                      </div>
                      <div>
                        <dt>Escudo</dt>
                        <dd>{team?.shieldUrl ? 'URL registrada' : 'Sin URL'}</dd>
                      </div>
                      <div>
                        <dt>Campos bloqueados</dt>
                        <dd>Nombre, grupo, confederación e ID</dd>
                      </div>
                    </dl>

                    <form className={styles.correctionForm} onSubmit={(event) => handleSaveTeam(event, team, teamKey)} noValidate>
                      <label className={styles.formField}>
                        <span>Posición</span>
                        <input
                          inputMode="numeric"
                          min="1"
                          pattern="[0-9]*"
                          placeholder="Sin enviar si queda vacío"
                          type="text"
                          value={draft.position}
                          onChange={(event) => handleDraftChange(teamKey, 'position', event.target.value)}
                        />
                      </label>

                      <label className={styles.formField}>
                        <span>Clasificación</span>
                        <select
                          value={draft.qualifiedTo}
                          onChange={(event) => handleDraftChange(teamKey, 'qualifiedTo', event.target.value)}
                        >
                          {!hasKnownQualifiedToOption && (
                            <option disabled value={draft.qualifiedTo}>
                              {getQualifiedToLabel(draft.qualifiedTo)}
                            </option>
                          )}
                          {QUALIFIED_TO_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className={styles.formField}>
                        <span>shieldUrl</span>
                        <input
                          placeholder="https://ejemplo.com/escudo.svg"
                          type="url"
                          value={draft.shieldUrl}
                          onChange={(event) => handleDraftChange(teamKey, 'shieldUrl', event.target.value)}
                        />
                      </label>

                      <p className={styles.helperText}>
                        Solo se enviarán campos modificados. No se envían valores legacy ni datos completos del equipo.
                      </p>

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

                      <button className={styles.saveButton} disabled={saveState.isSaving || !hasTeamId} type="submit">
                        {saveState.isSaving ? 'Guardando…' : 'Guardar corrección'}
                      </button>
                    </form>
                  </article>
                )
              })}
            </section>
          )}
        </>
      )}
    </section>
  )
}

export default AdminTeamCorrectionsPage
