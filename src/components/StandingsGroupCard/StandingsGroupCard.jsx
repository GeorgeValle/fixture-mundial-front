import StandingsTable from '../StandingsTable/StandingsTable'
import styles from './StandingsGroupCard.module.css'

const watermarkVariants = [
  'variantCrowdOne',
  'variantCrowdTwo',
  'variantCrowdThree',
  'variantCrowdFour',
]

function StandingsGroupCard({
  standing,
  variant = 'featured',
  variantIndex = 0,
  groupStandingBadgeContext = {},
}) {
  const groupName = standing?.group ?? 'Grupo'
  const teams = standing?.teams ?? []

  const variantName = watermarkVariants[variantIndex % watermarkVariants.length]
  const variantClass = styles[variantName] ?? styles.variantCrowdOne
  const cardVariantClass = variant === 'compact' ? styles.compact : styles.featured

  return (
    <article
      className={`${styles.card} ${cardVariantClass}`}
      aria-labelledby={`standings-group-${groupName}`}
    >
      <div className={`${styles.header} ${variantClass}`}>
        <div className={styles.headingGroup}>
          <p className={styles.kicker}>GRUPO {groupName}</p>
          <h3 className={styles.title} id={`standings-group-${groupName}`}>
            Posiciones del grupo {groupName}
          </h3>
          <span className={styles.accentMark} aria-hidden="true"></span>
        </div>
        <span className={styles.badge}>{teams.length} equipos</span>
      </div>

      {teams.length > 0 ? (
        <StandingsTable teams={teams} groupStandingBadgeContext={groupStandingBadgeContext} />
      ) : (
        <p className={styles.emptyText}>Este grupo todavía no tiene posiciones disponibles.</p>
      )}
    </article>
  )
}

export default StandingsGroupCard
