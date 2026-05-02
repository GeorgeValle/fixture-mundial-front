import styles from './PredictionSummary.module.css'

function SummaryCard({ helpLabel, label, onHelpClick, value }) {
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
    </div>
  )
}

function PredictionSummary({
  groupPoints,
  groupPredictionsCount,
  knockoutPoints,
  knockoutPredictionsCount,
  onOpenGroupPointsHelp,
  onOpenKnockoutPointsHelp,
  onOpenTotalPointsHelp,
  totalPoints,
  userName,
}) {
  return (
    <section className={styles.summary} aria-label="Resumen de predicciones">
      <SummaryCard label="PARTICIPANTE" value={userName || 'Participante pendiente'} />
      <SummaryCard label="PREDICCIONES DE GRUPO" value={`${groupPredictionsCount} /72`} />
      <SummaryCard
        helpLabel="Ver explicación de puntos de grupo"
        label="PUNTOS DE GRUPO OBTENIDOS"
        value={groupPoints}
        onHelpClick={onOpenGroupPointsHelp}
      />
      <SummaryCard
        label="PREDICCIONES DE ELIMINATORIAS"
        value={`${knockoutPredictionsCount} /32`}
      />
      <SummaryCard
        helpLabel="Ver explicación de puntos de eliminatorias"
        label="PUNTOS DE ELIMINATORIAS OBTENIDOS"
        value={knockoutPoints}
        onHelpClick={onOpenKnockoutPointsHelp}
      />
      <SummaryCard
        helpLabel="Ver explicación de puntos totales"
        label="PUNTOS TOTALES"
        value={totalPoints}
        onHelpClick={onOpenTotalPointsHelp}
      />
    </section>
  )
}

export default PredictionSummary
