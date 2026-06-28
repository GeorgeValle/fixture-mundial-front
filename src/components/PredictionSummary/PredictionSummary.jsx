import styles from './PredictionSummary.module.css'

function SummaryCard({ helpLabel, label, maxValue, onHelpClick, progressValue, value }) {
  const progressPercent = maxValue ? Math.min(Math.max((progressValue / maxValue) * 100, 0), 100) : null

  return (
    <div>
      <span className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {onHelpClick && (
          <button className={styles.helpButton} type="button" aria-label={helpLabel} onClick={onHelpClick}>
            ?
          </button>
        )}
      </span>
      <strong>{value}</strong>
      {progressPercent !== null && (
        <span className={styles.progressTrack} aria-hidden="true">
          <span className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
        </span>
      )}
    </div>
  )
}

function PredictionSummary({
  groupPoints,
  groupPredictionsCount,
  knockoutPoints,
  knockoutPredictionsCount,
  knockoutPredictionsTotal = 32,
  onOpenGroupPointsHelp,
  onOpenKnockoutPointsHelp,
  onOpenTotalPointsHelp,
  totalPoints,
  userName,
}) {
  return (
    <section className={styles.summary} aria-label="Resumen de predicciones">
      <SummaryCard label="Participante" value={userName || 'Participante pendiente'} />
      <SummaryCard
        label="Progreso de grupos"
        maxValue={72}
        progressValue={groupPredictionsCount}
        value={`${groupPredictionsCount} /72`}
      />
      <SummaryCard
        helpLabel="Ver explicación de puntos de grupo"
        label="Puntos de grupo obtenidos"
        value={groupPoints}
        onHelpClick={onOpenGroupPointsHelp}
      />
      <SummaryCard
        label="Progreso de eliminatorias"
        maxValue={knockoutPredictionsTotal}
        progressValue={knockoutPredictionsCount}
        value={`${knockoutPredictionsCount} /${knockoutPredictionsTotal}`}
      />
      <SummaryCard
        helpLabel="Ver explicación de puntos de eliminatorias"
        label="Puntos de eliminatorias obtenidos"
        value={knockoutPoints}
        onHelpClick={onOpenKnockoutPointsHelp}
      />
      <SummaryCard
        helpLabel="Ver explicación de puntos totales"
        label="Puntos totales"
        value={totalPoints}
        onHelpClick={onOpenTotalPointsHelp}
      />
    </section>
  )
}

export default PredictionSummary
