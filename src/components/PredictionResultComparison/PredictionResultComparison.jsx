import PredictionIndicatorList from '../PredictionIndicatorList/PredictionIndicatorList'
import styles from './PredictionResultComparison.module.css'

function formatPredictionScore(prediction) {
  if (!prediction) {
    return 'Sin predicción guardada'
  }

  return `${prediction.predictedHomeScore} - ${prediction.predictedAwayScore}`
}

function formatOfficialScore(match) {
  if (match?.homeScore === null || match?.homeScore === undefined) {
    return 'Resultado oficial pendiente'
  }

  if (match?.awayScore === null || match?.awayScore === undefined) {
    return 'Resultado oficial pendiente'
  }

  return `${match.homeScore} - ${match.awayScore}`
}

function PredictionResultComparison({ match, prediction, scoreResult }) {
  const hasPrediction = Boolean(prediction)

  if (!hasPrediction) {
    return (
      <div className={styles.box}>
        <p className={styles.title}>Comparación</p>
        <p className={styles.text}>
          Guardá tu predicción para compararla cuando haya resultado oficial.
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
          <strong>{formatPredictionScore(prediction)}</strong>
          <span>Resultado oficial</span>
          <strong>{formatOfficialScore(match)}</strong>
        </div>
        <p className={styles.text}>{scoreResult?.reason ?? 'Resultado oficial pendiente'}</p>
      </div>
    )
  }

  return (
    <div className={styles.box}>
      <p className={styles.title}>Comparación</p>
      <div className={styles.scoreGrid}>
        <span>Tu predicción</span>
        <strong>{formatPredictionScore(prediction)}</strong>
        <span>Resultado oficial</span>
        <strong>{formatOfficialScore(match)}</strong>
      </div>
      <p className={styles.points}>Puntos obtenidos: {scoreResult.points}</p>
      <PredictionIndicatorList indicators={scoreResult.indicators} />
    </div>
  )
}

export default PredictionResultComparison
