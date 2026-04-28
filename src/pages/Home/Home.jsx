import styles from './Home.module.css'

const featureCards = [
  {
    eyebrow: 'Fixture',
    title: 'Calendario por grupos',
    description: 'Explorá fechas, sedes y marcadores en una vista clara para seguir cada grupo.',
    accent: 'cyan',
  },
  {
    eyebrow: 'Tablas y cruces',
    title: 'Posiciones + eliminatorias',
    description: 'Visualizá posiciones por grupo y el camino hacia la final en un mismo flujo.',
    accent: 'magenta',
  },
  {
    eyebrow: 'Predicciones',
    title: 'Tu pronóstico',
    description: 'Creá tus pronósticos y compará tu desempeño con los resultados oficiales.',
    accent: 'gold',
  },
]

function Home() {
  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Portfolio project</span>
            <span className={styles.badge}>React + Vite</span>
          </div>

          <p className={styles.kicker}>International football experience</p>
          <h2 className={styles.title}>
            Fixture, tablas, eliminatorias y predicciones en una sola experiencia
          </h2>
          <p className={styles.description}>
            Seguí el torneo 2026 con una experiencia visual moderna: fixture por grupos,
            tablas de posiciones, eliminatorias y predicciones en una única plataforma.
          </p>

          <div className={styles.actionRow} aria-label="Resumen de secciones disponibles">
            <span className={styles.actionChip}>Fixture</span>
            <span className={styles.actionChip}>Tablas</span>
            <span className={styles.actionChip}>Eliminatorias</span>
            <span className={styles.actionChip}>Predicciones</span>
          </div>
        </div>

        <div className={styles.visualPanel} aria-hidden="true">
          <div className={styles.fieldCard}>
            <span className={styles.fieldLine}></span>
            <span className={styles.centerCircle}></span>
            <span className={styles.ball}></span>
          </div>
          <div className={styles.scoreCard}>
            <span>2026</span>
            <strong>Kickoff ready</strong>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {featureCards.map((card) => (
          <article className={`${styles.card} ${styles[card.accent]}`} key={card.title}>
            <p className={styles.cardEyebrow}>{card.eyebrow}</p>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDescription}>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Home
