import { KNOCKOUT_PHASE_OPTIONS } from '../../constants/knockoutPhases'
import styles from './PredictionKnockoutPhaseFilter.module.css'

function PredictionKnockoutPhaseFilter({ disabled = false, value, onChange }) {
  return (
    <section className={styles.filter} aria-label="Filtro de partidos por fase eliminatoria">
      <label className={styles.label} htmlFor="prediction-knockout-phase-filter">
        Fase eliminatoria
      </label>
      <select
        className={styles.select}
        disabled={disabled}
        id="prediction-knockout-phase-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {KNOCKOUT_PHASE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {disabled && (
        <p className={styles.helper}>Se habilitará cuando estén definidos los cruces oficiales.</p>
      )}
    </section>
  )
}

export default PredictionKnockoutPhaseFilter
