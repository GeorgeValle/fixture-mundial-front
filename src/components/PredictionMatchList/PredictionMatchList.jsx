import PredictionMatchCard from '../PredictionMatchCard/PredictionMatchCard'
import styles from './PredictionMatchList.module.css'

function PredictionMatchList({
  drafts,
  lockStates,
  matches,
  onSavePrediction,
  onScoreChange,
  predictions,
  saveMessages,
  scoreResults,
  validationErrors,
}) {
  return (
    <section className={styles.section} aria-label="Partidos de fase de grupos para predecir">
      <div className={styles.header}>
        <p className={styles.kicker}>Fase de grupos</p>
        <h3 className={styles.title}>Partidos de fase de grupos</h3>
        <p className={styles.description}>
          Completá tus pronósticos antes del inicio de cada partido. Cuando haya
          resultados registrados, calcularemos tus puntos automáticamente.
        </p>
      </div>

      <div className={styles.list}>
        {matches.map((match) => (
          <PredictionMatchCard
            draft={drafts[match._id]}
            key={match._id}
            lockReason={lockStates[match._id]?.reason}
            match={match}
            prediction={predictions[match._id]}
            saveMessage={saveMessages[match._id]}
            scoreResult={scoreResults[match._id]}
            validationError={validationErrors[match._id]}
            onSave={onSavePrediction}
            onScoreChange={onScoreChange}
          />
        ))}
      </div>
    </section>
  )
}

export default PredictionMatchList
