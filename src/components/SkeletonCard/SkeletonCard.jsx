import styles from './SkeletonCard.module.css'

function SkeletonCard({ variant = 'match', lines = 3 }) {
  const visibleLines = Math.max(1, Number(lines) || 1)
  const lineItems = Array.from({ length: visibleLines }, (_, index) => `line-${index}`)

  return (
    <article
      aria-busy="true"
      aria-label="Cargando contenido"
      className={`${styles.card} ${styles[variant] ?? styles.match}`}
    >
      <span className={styles.header}></span>
      <span className={styles.title}></span>
      <div className={styles.lines}>
        {lineItems.map((line) => (
          <span className={styles.line} key={line}></span>
        ))}
      </div>
    </article>
  )
}

export default SkeletonCard
