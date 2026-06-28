import PredictionIndicatorList from '../PredictionIndicatorList/PredictionIndicatorList'
import { getOfficialKnockoutWinner } from '../../utils/predictionScoring'
import { getTeamIdentifier } from '../../utils/predictionMatchEligibility'
import styles from './PredictionResultComparison.module.css'

function getTeamName(team) {
  return team?.name ?? 'Equipo por definir'
}

function getTeamNameById(match, teamId) {
  const normalizedTeamId = String(teamId ?? '').trim()

  if (!normalizedTeamId) {
    return ''
  }

  if (getTeamIdentifier(match?.homeTeam) === normalizedTeamId) {
    return getTeamName(match.homeTeam)
  }

  if (getTeamIdentifier(match?.awayTeam) === normalizedTeamId) {
    return getTeamName(match.awayTeam)
  }

  return ''
}

function getOfficialAdvancingTeamName(match) {
  if (match?.homeScore !== match?.awayScore) {
    return ''
  }

  const explicitWinner =
    match?.winnerTeam ?? match?.qualifiedTeam ?? match?.advancingTeam ?? match?.classifiedTeam

  if (explicitWinner?.name) {
    return explicitWinner.name
  }

  const officialWinner = getOfficialKnockoutWinner(match)

  if (!officialWinner.canScore || !officialWinner.winnerSide) {
    return ''
  }

  return getTeamName(officialWinner.winnerSide === 'home' ? match.homeTeam : match.awayTeam)
}

function formatPredictionScore(match, prediction, isKnockout) {
  if (!prediction) {
    return 'Sin predicción guardada'
  }

  const scoreLabel = `${prediction.predictedHomeScore} - ${prediction.predictedAwayScore}`
  const advancingTeamName = isKnockout
    ? getTeamNameById(match, prediction.predictedAdvancingTeamId)
    : ''

  return advancingTeamName ? `${scoreLabel} · Clasifica ${advancingTeamName}` : scoreLabel
}

function formatOfficialScore(match, isKnockout) {
  if (match?.homeScore === null || match?.homeScore === undefined) {
    return 'Resultado registrado pendiente'
  }

  if (match?.awayScore === null || match?.awayScore === undefined) {
    return 'Resultado registrado pendiente'
  }

  const scoreLabel = `${match.homeScore} - ${match.awayScore}`
  const advancingTeamName = isKnockout ? getOfficialAdvancingTeamName(match) : ''

  return advancingTeamName ? `${scoreLabel} · Clasificó ${advancingTeamName}` : scoreLabel
}

function PredictionResultComparison({ isKnockout = false, match, prediction, scoreResult }) {
  const hasPrediction = Boolean(prediction)

  if (!hasPrediction) {
    return (
      <div className={styles.box}>
        <p className={styles.title}>Comparación</p>
        <p className={styles.text}>
          Guardá tu predicción para compararla cuando haya resultado registrado.
        </p>
      </div>
    )
  }

  if (!scoreResult?.canScore) {
    return (
      <div className={styles.box}>
        <p className={styles.title}>Comparación</p>
        <div className={styles.scoreGrid}>
          <span>Tu predicción</span>
          <strong>{formatPredictionScore(match, prediction, isKnockout)}</strong>
          <span>Resultado registrado</span>
          <strong>{formatOfficialScore(match, isKnockout)}</strong>
        </div>
        <p className={styles.text}>{scoreResult?.reason ?? 'Resultado registrado pendiente'}</p>
      </div>
    )
  }

  return (
    <div className={styles.box}>
      <p className={styles.title}>Comparación</p>
      <div className={styles.scoreGrid}>
        <span>Tu predicción</span>
        <strong>{formatPredictionScore(match, prediction, isKnockout)}</strong>
        <span>Resultado registrado</span>
        <strong>{formatOfficialScore(match, isKnockout)}</strong>
      </div>
      <p className={styles.points}>Puntos obtenidos: {scoreResult.points}</p>
      <PredictionIndicatorList indicators={scoreResult.indicators} />
    </div>
  )
}

export default PredictionResultComparison
