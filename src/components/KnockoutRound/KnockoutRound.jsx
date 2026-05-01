import KnockoutMatchCard from '../KnockoutMatchCard/KnockoutMatchCard'
import styles from './KnockoutRound.module.css'

function KnockoutRound({ matches, roundLabel }) {
  return (
    <section className={styles.round} aria-labelledby={`round-${roundLabel.replaceAll(' ', '-').toLowerCase()}`}>
      <div className={styles.roundHeader}>
        <p className={styles.kicker}>Ronda</p>
        <h3 className={styles.roundTitle} id={`round-${roundLabel.replaceAll(' ', '-').toLowerCase()}`}>
          {roundLabel}
        </h3>
        <span className={styles.countBadge}>{matches.length} partidos</span>
      </div>

      <div className={styles.matchList}>
        {matches.map((match) => (
          <KnockoutMatchCard key={match.templateCode} match={match} />
        ))}
      </div>
    </section>
  )
}

export default KnockoutRound
