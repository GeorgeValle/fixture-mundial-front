import PredictionMatchCard from '../PredictionMatchCard/PredictionMatchCard'
import styles from './PredictionMatchList.module.css'

function PredictionMatchList({
  description = 'Completá tus pronósticos antes del inicio de cada partido. Cuando haya resultados registrados, calcularemos tus puntos automáticamente.',
  drafts,
  getStageLabel,
  isKnockout = false,
  kicker = 'Fase de grupos',
  lockStates,
  matches,
  onAdvancingTeamChange,
  onSavePrediction,
  onScoreChange,
  predictions,
  saveMessages,
  scoreResults,
  title = 'Partidos de fase de grupos',
  validationErrors,
}) {
  return (
    <section
      className={styles.section}
      aria-label={isKnockout ? 'Partidos de eliminatorias para predecir' : 'Partidos de fase de grupos para predecir'}
    >
      <div className={styles.header}>
        <p className={styles.kicker}>{kicker}</p>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>

      <div className={styles.list}>
        {matches.map((match) => (
          <PredictionMatchCard
            draft={drafts[match._id]}
            isKnockout={isKnockout}
            key={match._id}
            lockReason={lockStates[match._id]?.reason}
            match={match}
            prediction={predictions[match._id]}
            saveMessage={saveMessages[match._id]}
            scoreResult={scoreResults[match._id]}
            stageLabel={getStageLabel?.(match)}
            validationError={validationErrors[match._id]}
            onAdvancingTeamChange={onAdvancingTeamChange}
            onSave={onSavePrediction}
            onScoreChange={onScoreChange}
          />
        ))}
      </div>
    </section>
  )
}

export default PredictionMatchList
