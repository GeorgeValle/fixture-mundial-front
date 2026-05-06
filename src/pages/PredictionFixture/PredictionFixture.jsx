import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import KnockoutPredictionsClosedPanel from '../../components/KnockoutPredictionsClosedPanel/KnockoutPredictionsClosedPanel'
import PredictionDialog from '../../components/PredictionDialog/PredictionDialog'
import PredictionGroupFilter, {
  ALL_GROUPS_VALUE,
} from '../../components/PredictionGroupFilter/PredictionGroupFilter'
import PredictionKnockoutPhaseFilter from '../../components/PredictionKnockoutPhaseFilter/PredictionKnockoutPhaseFilter'
import {
  ALL_KNOCKOUT_PHASES_VALUE,
  KNOCKOUT_PHASE_OPTIONS,
} from '../../constants/knockoutPhases'
import PredictionMatchList from '../../components/PredictionMatchList/PredictionMatchList'
import PredictionStorageResetNotice from '../../components/PredictionStorageResetNotice/PredictionStorageResetNotice'
import PredictionSummary from '../../components/PredictionSummary/PredictionSummary'
import PredictionUserForm from '../../components/PredictionUserForm/PredictionUserForm'
import SkeletonList from '../../components/SkeletonList/SkeletonList'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { getMatches } from '../../services/matches/matchesService'
import {
  loadPredictionsStorage,
  resetPredictionsStorage,
  savePredictionsStorage,
  savePrediction,
  saveUserName,
} from '../../services/predictions/predictionStorageService'
import { sortMatchesByDate } from '../../utils/dateAdapter'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import { getPredictionLockState } from '../../utils/predictionLocking'
import {
  getPredictionStageType,
  scoreGroupPrediction,
  scoreKnockoutPrediction,
} from '../../utils/predictionScoring'
import {
  normalizePredictionScores,
  validateParticipantName,
  validatePrediction,
} from '../../utils/predictionValidation'
import styles from './PredictionFixture.module.css'

const FRIENDLY_ERROR_MESSAGE =
  'No pudimos cargar los partidos para predicciones. Si el servidor estaba dormido, esperá unos segundos y probá de nuevo.'

const PLACEHOLDER_TEAM_NAMES = new Set([
  'tbd',
  'equipo por definir',
  'equipo por confirmar',
  'pending official data',
])

const HELP_MODAL_CONTENT = {
  group: {
    title: 'Cómo se calculan los puntos de grupo',
    body: (
      <ul>
        <li>1 punto por acertar ganador.</li>
        <li>2 puntos por acertar goles del ganador.</li>
        <li>1 punto por acertar goles del perdedor.</li>
        <li>1 punto por acertar empate.</li>
        <li>1 punto por acertar cantidad exacta de goles del empate.</li>
      </ul>
    ),
  },
  knockout: {
    title: 'Cómo se calculan los puntos de eliminatorias',
    body: (
      <>
        <p>Partido definido en marcador regular:</p>
        <ul>
          <li>2 puntos por acertar ganador o clasificado.</li>
          <li>1 punto por acertar goles del ganador.</li>
          <li>1 punto por acertar goles del perdedor.</li>
        </ul>
        <p>Partido empatado en goles y definido por penales:</p>
        <ul>
          <li>2 puntos por acertar ganador o clasificado.</li>
          <li>1 punto por acertar que el partido terminó empatado en goles.</li>
          <li>1 punto por acertar la cantidad exacta de goles del empate.</li>
          <li>1 punto por acertar goles de penales del ganador.</li>
          <li>1 punto por acertar goles de penales del perdedor.</li>
        </ul>
      </>
    ),
  },
  total: {
    title: 'Cómo se calculan los puntos totales',
    body: (
      <>
        <p>
          Los puntos totales son la suma de los puntos obtenidos en fase de grupos y
          eliminatorias.
        </p>
        <ul>
          <li>En grupos se premian ganador, empate y goles exactos según corresponda.</li>
          <li>
            En eliminatorias se premian el clasificado, los goles regulares y, si hay
            penales, los aciertos del desempate.
          </li>
          <li>Solo se calculan puntos cuando hay resultado registrado suficiente.</li>
        </ul>
      </>
    ),
  },
}

const RESET_DIALOG_CONTENT = {
  group: {
    title: 'Borrar predicciones del grupo',
    message:
      '¿Querés borrar las predicciones editables del grupo seleccionado? Las predicciones bloqueadas se conservarán.',
  },
  knockout: {
    title: 'Borrar predicciones de eliminatorias',
    message:
      '¿Querés borrar las predicciones editables de eliminatorias? Las predicciones bloqueadas se conservarán.',
  },
  all: {
    title: 'Borrar todas las predicciones',
    message:
      '¿Querés borrar todas tus predicciones editables? Las predicciones bloqueadas se conservarán.',
  },
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function isRealTeam(team) {
  const teamName = normalizeText(team?.name)

  return (
    Boolean(teamName) &&
    !PLACEHOLDER_TEAM_NAMES.has(teamName) &&
    !teamName.includes('ganador partido')
  )
}

function isGroupStageMatch(match) {
  return /^grupo\s+[a-l]$/i.test(normalizeText(match?.stage))
}

function getKnockoutStageText(match) {
  return normalizeText(match?.stage ?? match?.round ?? match?.roundKey)
}

function getKnockoutPhaseValue(match) {
  const stage = getKnockoutStageText(match)

  if (
    stage.includes('round of 32') ||
    stage.includes('dieciseisavos') ||
    stage.includes('ronda de 32')
  ) {
    return 'round-of-32'
  }

  if (
    stage.includes('round of 16') ||
    stage.includes('octavos') ||
    stage.includes('ronda de 16')
  ) {
    return 'round-of-16'
  }

  if (stage.includes('quarter') || stage.includes('cuartos')) {
    return 'quarter-finals'
  }

  if (stage.includes('semi') || stage.includes('semifinal')) {
    return 'semi-finals'
  }

  if (stage.includes('third place') || stage.includes('tercer puesto')) {
    return 'third-place'
  }

  if (stage === 'final') {
    return 'final'
  }

  return ''
}

function getKnockoutPhaseLabel(value) {
  return (
    KNOCKOUT_PHASE_OPTIONS.find((option) => option.value === value)?.label ??
    'Todas las fases'
  )
}

function getGroupLetterFromStage(stage) {
  const match = normalizeText(stage).match(/^grupo\s+([a-l])$/i)
  return match ? match[1].toUpperCase() : ''
}

function isEligibleGroupMatch(match) {
  return (
    Boolean(match?._id) &&
    isGroupStageMatch(match) &&
    isRealTeam(match.homeTeam) &&
    isRealTeam(match.awayTeam)
  )
}

function hasRealKnockoutTeams(match) {
  return (
    getPredictionStageType(match) === 'knockout' &&
    Boolean(match?._id) &&
    isRealTeam(match.homeTeam) &&
    isRealTeam(match.awayTeam)
  )
}

function toDraftPrediction(prediction) {
  return {
    predictedHomeScore:
      prediction?.predictedHomeScore === undefined ? '' : String(prediction.predictedHomeScore),
    predictedAwayScore:
      prediction?.predictedAwayScore === undefined ? '' : String(prediction.predictedAwayScore),
  }
}

function createDraftsFromPredictions(predictions) {
  return Object.fromEntries(
    Object.entries(predictions).map(([matchId, prediction]) => [
      matchId,
      toDraftPrediction(prediction),
    ]),
  )
}

function createPredictionCandidate(matchId, draft) {
  return {
    matchId,
    predictedHomeScore: draft?.predictedHomeScore ?? '',
    predictedAwayScore: draft?.predictedAwayScore ?? '',
    predictedHomePenaltyScore: null,
    predictedAwayPenaltyScore: null,
  }
}

function getSavedPredictionsCount(matches, predictions) {
  const matchIds = new Set(matches.map((match) => match._id))

  return Object.values(predictions).filter((prediction) => matchIds.has(prediction.matchId)).length
}

function getScoreResults(matches, predictions, scorer) {
  return Object.fromEntries(
    matches.map((match) => {
      const prediction = predictions[match._id]
      return [match._id, prediction ? scorer(match, prediction) : null]
    }),
  )
}

function getTotalPoints(scoreResults) {
  return Object.values(scoreResults).reduce((total, scoreResult) => {
    if (!scoreResult?.canScore) {
      return total
    }

    return total + scoreResult.points
  }, 0)
}

function getGroupFilterOptions(matches) {
  const groupLetters = new Set()

  for (const match of matches) {
    const groupLetter = getGroupLetterFromStage(match.stage)

    if (groupLetter) {
      groupLetters.add(groupLetter)
    }
  }

  return [...groupLetters].sort().map((groupLetter) => ({
    value: groupLetter,
    label: `Grupo ${groupLetter}`,
  }))
}

function PredictionFixture() {
  const dispatch = useDispatch()
  const [initialStorageResult] = useState(() => loadPredictionsStorage())
  const [storageData, setStorageData] = useState(initialStorageResult.data)
  const [hasCorruptStorage, setHasCorruptStorage] = useState(initialStorageResult.isCorrupt)
  const [userNameInput, setUserNameInput] = useState(initialStorageResult.data.userName)
  const [userNameError, setUserNameError] = useState('')
  const [userNameStatus, setUserNameStatus] = useState('')
  const [drafts, setDrafts] = useState(() =>
    createDraftsFromPredictions(initialStorageResult.data.predictions),
  )
  const [validationErrors, setValidationErrors] = useState({})
  const [saveMessages, setSaveMessages] = useState({})
  const [resetMessage, setResetMessage] = useState('')
  const [matches, setMatches] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(ALL_GROUPS_VALUE)
  const [selectedKnockoutPhase, setSelectedKnockoutPhase] = useState(
    ALL_KNOCKOUT_PHASES_VALUE,
  )
  const [activeHelpModal, setActiveHelpModal] = useState(null)
  const [pendingResetAction, setPendingResetAction] = useState(null)
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

  const groupMatches = sortMatchesByDate(matches.filter(isEligibleGroupMatch))
  const knockoutMatches = sortMatchesByDate(matches.filter(hasRealKnockoutTeams))
  const filteredGroupMatches =
    selectedGroup === ALL_GROUPS_VALUE
      ? groupMatches
      : groupMatches.filter((match) => getGroupLetterFromStage(match.stage) === selectedGroup)
  const filteredKnockoutMatches =
    selectedKnockoutPhase === ALL_KNOCKOUT_PHASES_VALUE
      ? knockoutMatches
      : knockoutMatches.filter((match) => getKnockoutPhaseValue(match) === selectedKnockoutPhase)
  const groupFilterOptions = getGroupFilterOptions(groupMatches)
  const groupScoreResults = getScoreResults(
    groupMatches,
    storageData.predictions,
    scoreGroupPrediction,
  )
  const knockoutScoreResults = getScoreResults(
    knockoutMatches,
    storageData.predictions,
    scoreKnockoutPrediction,
  )
  const lockStates = Object.fromEntries(
    groupMatches.map((match) => [match._id, getPredictionLockState(match)]),
  )
  const resetLockStates = Object.fromEntries(
    [...groupMatches, ...knockoutMatches].map((match) => [
      match._id,
      getPredictionLockState(match),
    ]),
  )
  const hasRealKnockoutMatches = knockoutMatches.length > 0
  const selectedKnockoutPhaseLabel = getKnockoutPhaseLabel(selectedKnockoutPhase)
  const groupPredictionsCount = getSavedPredictionsCount(groupMatches, storageData.predictions)
  const knockoutPredictionsCount = getSavedPredictionsCount(
    knockoutMatches,
    storageData.predictions,
  )
  const groupPoints = getTotalPoints(groupScoreResults)
  const knockoutPoints = getTotalPoints(knockoutScoreResults)
  const totalPoints = groupPoints + knockoutPoints

  function handleRetryMatches() {
    setIsLoading(true)
    setHasError(false)
    setRetryCount((currentCount) => currentCount + 1)
  }

  function handleUserNameSubmit(event) {
    event.preventDefault()
    const userNameValidation = validateParticipantName(userNameInput)

    if (!userNameValidation.isValid) {
      setUserNameError(userNameValidation.error)
      setUserNameStatus('')
      return
    }

    const result = saveUserName(userNameValidation.normalizedName)

    setStorageData(result.data)
    setHasCorruptStorage(false)
    setUserNameInput(result.data.userName)
    setUserNameError('')
    setUserNameStatus('Nombre guardado')
  }

  function handleScoreChange(matchId, field, value) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [matchId]: {
        ...currentDrafts[matchId],
        [field]: value,
      },
    }))
    setValidationErrors((currentErrors) => ({ ...currentErrors, [matchId]: '' }))
    setSaveMessages((currentMessages) => ({ ...currentMessages, [matchId]: '' }))
    setResetMessage('')
  }

  function handleSavePrediction(event, match) {
    event.preventDefault()

    const lockState = getPredictionLockState(match)
    if (lockState.locked) {
      setValidationErrors((currentErrors) => ({
        ...currentErrors,
        [match._id]: 'Predicción cerrada',
      }))
      return
    }

    const candidate = createPredictionCandidate(match._id, drafts[match._id])
    const validation = validatePrediction(candidate)

    if (!validation.isValid) {
      setValidationErrors((currentErrors) => ({
        ...currentErrors,
        [match._id]: validation.errors[0],
      }))
      return
    }

    const normalizedCandidate = normalizePredictionScores(candidate)
    const result = savePrediction(match._id, normalizedCandidate)

    if (result.status === 'error') {
      setValidationErrors((currentErrors) => ({
        ...currentErrors,
        [match._id]: result.warning,
      }))
      return
    }

    setStorageData(result.data)
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [match._id]: toDraftPrediction(result.data.predictions[match._id]),
    }))
    setValidationErrors((currentErrors) => ({ ...currentErrors, [match._id]: '' }))
    setSaveMessages((currentMessages) => ({
      ...currentMessages,
      [match._id]: 'Predicción guardada',
    }))
    setResetMessage('')
  }

  function handleResetStorage() {
    const result = resetPredictionsStorage()
    setStorageData(result.data)
    setDrafts({})
    setValidationErrors({})
    setSaveMessages({})
    setUserNameInput('')
    setUserNameError('')
    setUserNameStatus('')
    setHasCorruptStorage(false)
  }

  function handlePrintPredictions() {
    window.print()
  }

  function clearEditablePredictions(targetMatches, successMessage) {
    const nextPredictions = { ...storageData.predictions }
    const deletedMatchIds = []
    let lockedPredictionsCount = 0

    for (const match of targetMatches) {
      if (!nextPredictions[match._id]) {
        continue
      }

      if (resetLockStates[match._id]?.locked) {
        lockedPredictionsCount += 1
        continue
      }

      delete nextPredictions[match._id]
      deletedMatchIds.push(match._id)
    }

    if (deletedMatchIds.length === 0) {
      setResetMessage(
        lockedPredictionsCount > 0
          ? 'No hay predicciones editables para borrar. Las predicciones bloqueadas se conservaron.'
          : 'No hay predicciones editables para borrar.',
      )
      return
    }

    const result = savePredictionsStorage({
      ...storageData,
      predictions: nextPredictions,
    })

    if (result.status === 'error') {
      setResetMessage(result.warning)
      return
    }

    const deletedMatchIdsSet = new Set(deletedMatchIds)
    setStorageData(result.data)
    setDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts }

      for (const matchId of deletedMatchIdsSet) {
        delete nextDrafts[matchId]
      }

      return nextDrafts
    })
    setValidationErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }

      for (const matchId of deletedMatchIdsSet) {
        delete nextErrors[matchId]
      }

      return nextErrors
    })
    setSaveMessages((currentMessages) => {
      const nextMessages = { ...currentMessages }

      for (const matchId of deletedMatchIdsSet) {
        delete nextMessages[matchId]
      }

      return nextMessages
    })
    setHasCorruptStorage(false)
    setResetMessage(
      lockedPredictionsCount > 0
        ? `${successMessage} Las predicciones bloqueadas se conservaron.`
        : successMessage,
    )
  }

  function handleClearSelectedGroupPredictions() {
    if (selectedGroup === ALL_GROUPS_VALUE) {
      setResetMessage('Elegí un grupo para borrar sus predicciones editables.')
      return
    }

    setPendingResetAction('group')
  }

  function handleClearAllPredictions() {
    setPendingResetAction('all')
  }

  function handleClearKnockoutPredictions() {
    if (knockoutMatches.length === 0) {
      setResetMessage('No hay cruces reales de eliminatorias con predicciones para borrar.')
      return
    }

    setPendingResetAction('knockout')
  }

  function handleConfirmReset() {
    const resetActions = {
      group: {
        matches: filteredGroupMatches,
        successMessage: 'Se borraron las predicciones editables del grupo seleccionado.',
      },
      knockout: {
        matches: knockoutMatches,
        successMessage: 'Se borraron las predicciones editables de eliminatorias.',
      },
      all: {
        matches: [...groupMatches, ...knockoutMatches],
        successMessage: 'Se borraron tus predicciones editables.',
      },
    }
    const resetAction = resetActions[pendingResetAction]

    setPendingResetAction(null)

    if (!resetAction) {
      return
    }

    clearEditablePredictions(resetAction.matches, resetAction.successMessage)
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Predicciones</p>
          <h2 className={styles.title}>Tu tablero de predicciones</h2>
          <p className={styles.description}>
            Completá tus pronósticos y comparalos cuando los resultados estén registrados.
          </p>
        </div>
        <div className={styles.heroStats} aria-label="Resumen rápido de predicciones">
          <span>Progreso de grupos · {groupPredictionsCount} /72</span>
          <span>Progreso de eliminatorias · {knockoutPredictionsCount} /32</span>
          <strong>Puntos acumulados · {totalPoints}</strong>
        </div>
      </header>

      {hasCorruptStorage && <PredictionStorageResetNotice onReset={handleResetStorage} />}

      <PredictionUserForm
        error={userNameError}
        statusMessage={userNameStatus}
        userName={userNameInput}
        onChange={setUserNameInput}
        onSubmit={handleUserNameSubmit}
      />

      <PredictionSummary
        groupPoints={groupPoints}
        groupPredictionsCount={groupPredictionsCount}
        knockoutPoints={knockoutPoints}
        knockoutPredictionsCount={knockoutPredictionsCount}
        totalPoints={totalPoints}
        userName={storageData.userName}
        onOpenGroupPointsHelp={() => setActiveHelpModal('group')}
        onOpenKnockoutPointsHelp={() => setActiveHelpModal('knockout')}
        onOpenTotalPointsHelp={() => setActiveHelpModal('total')}
      />

      <section className={styles.printActions} aria-label="Acciones de impresión">
        <div>
          <h3 className={styles.printTitle}>Resumen imprimible</h3>
          <p className={styles.printText}>
            Imprimí tus pronósticos visibles con el resumen y los resultados disponibles.
          </p>
        </div>
        <button className={styles.printButton} type="button" onClick={handlePrintPredictions}>
          Imprimir predicciones
        </button>
      </section>

      {isLoading && (
        <section className={styles.stateCard} aria-live="polite">
          <p className={styles.kicker}>Cargando tus predicciones…</p>
          <h3 className={styles.stateTitle}>Estamos buscando partidos para predecir</h3>
          <SkeletonList count={6} label="Cargando partidos para predicciones" variant="match" />
        </section>
      )}

      {!isLoading && hasError && (
        <section className={`${styles.stateCard} ${styles.errorState}`} role="alert">
          <p className={styles.kicker}>No se pudo cargar</p>
          <h3 className={styles.stateTitle}>Predicciones no disponibles</h3>
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

      {!isLoading && !hasError && groupMatches.length === 0 && (
        <section className={styles.stateCard}>
          <p className={styles.kicker}>Sin partidos</p>
          <h3 className={styles.stateTitle}>No hay partidos de fase de grupos para predecir</h3>
          <p className={styles.stateText}>
            Cuando se publiquen partidos reales con equipos definidos, van a aparecer acá.
          </p>
        </section>
      )}

      {!isLoading && !hasError && (groupMatches.length > 0 || hasRealKnockoutMatches) && (
        <>
          <div className={styles.filterGrid}>
            <PredictionGroupFilter
              options={groupFilterOptions}
              value={selectedGroup}
              onChange={setSelectedGroup}
            />
            <PredictionKnockoutPhaseFilter
              disabled={!hasRealKnockoutMatches}
              value={selectedKnockoutPhase}
              onChange={setSelectedKnockoutPhase}
            />
          </div>

          <section className={styles.resetActions} aria-label="Controles para borrar predicciones">
            <div>
              <h3 className={styles.resetTitle}>Zona de borrado</h3>
              <p className={styles.resetText}>
                Estas acciones solo eliminan predicciones editables guardadas en este navegador.
                Las predicciones de partidos iniciados o finalizados se conservan.
              </p>
            </div>
            <div className={styles.resetButtonGroup}>
              <button
                className={styles.secondaryButton}
                disabled={selectedGroup === ALL_GROUPS_VALUE}
                type="button"
                onClick={handleClearSelectedGroupPredictions}
              >
                Borrar predicciones del grupo
              </button>
              <button
                className={styles.dangerButton}
                type="button"
                onClick={handleClearAllPredictions}
              >
                Borrar todas las predicciones
              </button>
              <button
                className={styles.secondaryButton}
                disabled={!hasRealKnockoutMatches}
                type="button"
                onClick={handleClearKnockoutPredictions}
              >
                Borrar predicciones de eliminatorias
              </button>
            </div>
            {resetMessage && (
              <p className={styles.resetMessage} role="status">
                {resetMessage}
              </p>
            )}
          </section>
        </>
      )}

      {!isLoading && !hasError && groupMatches.length > 0 && (
        <>
          {filteredGroupMatches.length === 0 ? (
            <section className={styles.stateCard}>
              <p className={styles.kicker}>Sin partidos</p>
              <h3 className={styles.stateTitle}>
                No hay partidos para el grupo seleccionado
              </h3>
              <p className={styles.stateText}>
                Volvé a elegir Todos los grupos para ver todos los partidos disponibles.
              </p>
            </section>
          ) : (
            <PredictionMatchList
              drafts={drafts}
              lockStates={lockStates}
              matches={filteredGroupMatches}
              predictions={storageData.predictions}
              saveMessages={saveMessages}
              scoreResults={groupScoreResults}
              validationErrors={validationErrors}
              onSavePrediction={handleSavePrediction}
              onScoreChange={handleScoreChange}
            />
          )}
        </>
      )}

      {!isLoading && !hasError && (
        <KnockoutPredictionsClosedPanel
          filteredKnockoutMatches={filteredKnockoutMatches}
          hasRealKnockoutMatches={hasRealKnockoutMatches}
          selectedPhaseLabel={selectedKnockoutPhaseLabel}
        />
      )}

      {activeHelpModal && (
        <PredictionDialog
          title={HELP_MODAL_CONTENT[activeHelpModal].title}
          onCancel={() => setActiveHelpModal(null)}
        >
          {HELP_MODAL_CONTENT[activeHelpModal].body}
        </PredictionDialog>
      )}

      {pendingResetAction && (
        <PredictionDialog
          cancelLabel="Cancelar"
          confirmLabel="Borrar predicciones"
          title={RESET_DIALOG_CONTENT[pendingResetAction].title}
          variant="danger"
          onCancel={() => setPendingResetAction(null)}
          onConfirm={handleConfirmReset}
        >
          <p>{RESET_DIALOG_CONTENT[pendingResetAction].message}</p>
        </PredictionDialog>
      )}
    </section>
  )
}

export default PredictionFixture
