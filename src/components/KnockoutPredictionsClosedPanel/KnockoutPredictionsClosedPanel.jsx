import { formatDisplayDate } from '../../utils/dateAdapter'
import styles from './KnockoutPredictionsClosedPanel.module.css'

function getTeamName(team) {
  return team?.name ?? 'Equipo por definir'
}

function KnockoutPredictionsClosedPanel({
  filteredKnockoutMatches = [],
  hasRealKnockoutMatches = false,
  selectedPhaseLabel = 'Todas las fases',
}) {
  return (
    <section className={styles.panel} aria-label="Estado de predicciones de eliminatorias">
      <p className={styles.kicker}>Eliminatorias</p>
      <h3 className={styles.title}>Eliminatorias aún no disponibles</h3>
      <p className={styles.text}>
        {hasRealKnockoutMatches
          ? 'Hay cruces definidos detectados, pero la carga de predicciones de eliminatorias se habilitará en una próxima etapa.'
          : 'Las predicciones de eliminatorias se habilitarán cuando estén definidos los cruces.'}
      </p>
      <p className={styles.note}>
        No se permiten predicciones sobre cruces base, TBD ni equipos por definir.
      </p>

      {hasRealKnockoutMatches && (
        <div className={styles.detectedMatches}>
          <p className={styles.detectedTitle}>Cruces reales detectados · {selectedPhaseLabel}</p>
          {filteredKnockoutMatches.length === 0 ? (
            <p className={styles.detectedText}>
              No hay cruces reales para la fase eliminatoria seleccionada.
            </p>
          ) : (
            <ul className={styles.matchList}>
              {filteredKnockoutMatches.map((match) => (
                <li key={match._id}>
                  <span>{match.stage ?? 'Eliminatoria'}</span>
                  <strong>
                    {getTeamName(match.homeTeam)} vs {getTeamName(match.awayTeam)}
                  </strong>
                  <span>{formatDisplayDate(match.date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

export default KnockoutPredictionsClosedPanel
