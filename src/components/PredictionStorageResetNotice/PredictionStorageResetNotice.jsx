import styles from './PredictionStorageResetNotice.module.css'

function PredictionStorageResetNotice({ onReset }) {
  return (
    <section className={styles.notice} role="alert">
      <div>
        <p className={styles.kicker}>Datos guardados inválidos</p>
        <h3 className={styles.title}>Reinicio recomendado</h3>
        <p className={styles.text}>
          Detectamos datos guardados inválidos. Podés reiniciar tus predicciones para continuar.
        </p>
      </div>
      <button className={styles.button} type="button" onClick={onReset}>
        Reiniciar predicciones
      </button>
    </section>
  )
}

export default PredictionStorageResetNotice
