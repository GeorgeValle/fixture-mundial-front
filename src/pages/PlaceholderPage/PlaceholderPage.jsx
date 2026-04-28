import styles from './PlaceholderPage.module.css'

function PlaceholderPage({ title, description }) {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <span></span>
        </div>
        <p className={styles.kicker}>Vista del torneo</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
    </section>
  )
}

export default PlaceholderPage
