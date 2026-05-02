import styles from './PredictionIndicatorList.module.css'

function PredictionIndicatorList({ indicators = [] }) {
  if (indicators.length === 0) {
    return null
  }

  return (
    <ul className={styles.list} aria-label="Indicadores de acierto">
      {indicators.map((indicator) => (
        <li className={styles.item} key={indicator.key}>
          <span className={styles.check} aria-hidden="true">
            ✓
          </span>
          <span>{indicator.label}</span>
        </li>
      ))}
    </ul>
  )
}

export default PredictionIndicatorList
