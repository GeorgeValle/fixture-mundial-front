import styles from './PredictionGroupFilter.module.css'

export const ALL_GROUPS_VALUE = 'all'

function PredictionGroupFilter({ options, value, onChange }) {
  return (
    <section className={styles.filter} aria-label="Filtro de partidos por grupo">
      <label className={styles.label} htmlFor="prediction-group-filter">
        Filtrar por grupo
      </label>
      <select
        className={styles.select}
        id="prediction-group-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value={ALL_GROUPS_VALUE}>Todos los grupos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </section>
  )
}

export default PredictionGroupFilter
