import styles from './PredictionUserForm.module.css'

function PredictionUserForm({ error, statusMessage, userName, onChange, onSubmit }) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="prediction-user-name">
          Tu nombre
        </label>
        <input
          aria-label="Tu nombre"
          autoComplete="name"
          className={styles.input}
          id="prediction-user-name"
          maxLength="40"
          type="text"
          value={userName}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ingresá tu nombre"
        />
      </div>

      <button className={styles.button} type="submit">
        Guardar nombre
      </button>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {statusMessage && !error && <p className={styles.success}>{statusMessage}</p>}
    </form>
  )
}

export default PredictionUserForm
