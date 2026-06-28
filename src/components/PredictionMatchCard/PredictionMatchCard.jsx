import { formatDisplayDate, formatDisplayTime } from '../../utils/dateAdapter'
import {
  hasRegularPredictionScores,
  isRegularPredictionDraw,
} from '../../utils/predictionValidation'
import { getTeamIdentifier } from '../../utils/predictionMatchEligibility'
import PredictionResultComparison from '../PredictionResultComparison/PredictionResultComparison'
import styles from './PredictionMatchCard.module.css'

function getTeamName(team) {
  return team?.name ?? 'Equipo por definir'
}

function getStadiumLabel(stadium) {
  if (!stadium?.name) {
    return 'Sede por confirmar'
  }

  const location = [stadium.city, stadium.country].filter(Boolean).join(', ')
  return location ? `${stadium.name} · ${location}` : stadium.name
}

function getStatusLabel(status) {
  const labels = {
    PENDING: 'Pendiente',
    PLAYING: 'En juego',
    FINISHED: 'Finalizado',
  }

  return labels[status] ?? 'Estado por confirmar'
}

function TeamBlock({ align = 'left', team }) {
  const teamName = getTeamName(team)

  return (
    <div className={`${styles.team} ${styles[align]}`}>
      <div className={styles.logoFrame}>
        {team?.shieldUrl ? (
          <img className={styles.logo} src={team.shieldUrl} alt={`Escudo de ${teamName}`} />
        ) : (
          <span className={styles.logoPlaceholder} aria-hidden="true">
            {teamName.charAt(0)}
          </span>
        )}
      </div>
      <span className={styles.teamName}>{teamName}</span>
    </div>
  )
}

function PredictionMatchCard({
  draft,
  isKnockout = false,
  lockReason,
  match,
  onAdvancingTeamChange,
  onScoreChange,
  onSave,
  prediction,
  saveMessage,
  scoreResult,
  stageLabel,
  validationError,
}) {
  const isLocked = Boolean(lockReason && lockReason !== 'Fecha inválida')
  const matchId = match._id
  const showAdvancingSelector =
    isKnockout && hasRegularPredictionScores(draft) && isRegularPredictionDraw(draft)
  const selectedAdvancingTeamId = String(draft?.predictedAdvancingTeamId ?? '').trim()

  return (
    <article
      className={`${styles.card} ${isLocked ? styles.locked : ''}`}
      aria-label={`Predicción: ${getTeamName(match.homeTeam)} contra ${getTeamName(match.awayTeam)}`}
    >
      <div className={styles.metaRow}>
        <span className={styles.stage}>{stageLabel ?? match.stage ?? 'Grupo'}</span>
        <span className={styles.status}>{getStatusLabel(match.status)}</span>
      </div>

      <div className={styles.matchRow}>
        <TeamBlock team={match.homeTeam} />
        <span className={styles.versus}>VS</span>
        <TeamBlock align="right" team={match.awayTeam} />
      </div>

      <dl className={styles.details}>
        <div>
          <dt>Fecha</dt>
          <dd>
            {formatDisplayDate(match.date)} · {formatDisplayTime(match.date)}
          </dd>
        </div>
        <div>
          <dt>Estadio</dt>
          <dd>{getStadiumLabel(match.stadium)}</dd>
        </div>
      </dl>

      <form
        className={styles.predictionForm}
        noValidate
        onSubmit={(event) => onSave(event, match)}
      >
        <p className={styles.formTitle}>Tu predicción</p>
        <div className={styles.inputGrid}>
          <label>
            <span>{getTeamName(match.homeTeam)}</span>
            <input
              aria-label={`Goles de ${getTeamName(match.homeTeam)}`}
              disabled={isLocked}
              inputMode="numeric"
              maxLength="2"
              pattern="[0-9]*"
              type="text"
              value={draft?.predictedHomeScore ?? ''}
              onChange={(event) =>
                onScoreChange(matchId, 'predictedHomeScore', event.target.value, match)
              }
            />
          </label>
          <label>
            <span>{getTeamName(match.awayTeam)}</span>
            <input
              aria-label={`Goles de ${getTeamName(match.awayTeam)}`}
              disabled={isLocked}
              inputMode="numeric"
              maxLength="2"
              pattern="[0-9]*"
              type="text"
              value={draft?.predictedAwayScore ?? ''}
              onChange={(event) =>
                onScoreChange(matchId, 'predictedAwayScore', event.target.value, match)
              }
            />
          </label>
        </div>

        {showAdvancingSelector && (
          <fieldset className={styles.advancingFieldset}>
            <legend>Si empatan, ¿quién clasifica?</legend>
            <div className={styles.advancingOptions}>
              {[match.homeTeam, match.awayTeam].map((team) => {
                const teamName = getTeamName(team)
                const teamId = getTeamIdentifier(team)
                const isSelected = selectedAdvancingTeamId === teamId

                return (
                  <button
                    aria-pressed={isSelected}
                    className={`${styles.advancingOption} ${
                      isSelected ? styles.advancingOptionSelected : ''
                    }`}
                    disabled={isLocked}
                    key={teamId}
                    type="button"
                    onClick={() => onAdvancingTeamChange(matchId, teamId)}
                  >
                    {isSelected ? `✓ ${teamName}` : teamName}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {lockReason && (
          <p className={isLocked ? styles.lockReason : styles.helper}>
            {isLocked ? lockReason : 'Fecha inválida'}
          </p>
        )}

        {isLocked && !prediction && lockReason !== 'Predicción cerrada' && (
          <p className={styles.lockReason}>Predicción cerrada</p>
        )}

        {validationError && (
          <p className={styles.error} role="alert">
            {validationError}
          </p>
        )}

        {saveMessage && !validationError && <p className={styles.success}>{saveMessage}</p>}

        <button className={styles.button} disabled={isLocked} type="submit">
          Guardar predicción
        </button>
      </form>

      <PredictionResultComparison
        isKnockout={isKnockout}
        match={match}
        prediction={prediction}
        scoreResult={scoreResult}
      />
    </article>
  )
}

export default PredictionMatchCard
