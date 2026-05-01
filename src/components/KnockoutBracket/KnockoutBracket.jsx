import KnockoutRound from '../KnockoutRound/KnockoutRound'
import styles from './KnockoutBracket.module.css'

function KnockoutBracket({ rounds }) {
  return (
    <div className={styles.bracket} aria-label="Cuadro de eliminatorias">
      {rounds.map((round) => (
        <KnockoutRound key={round.roundKey} roundLabel={round.roundLabel} matches={round.matches} />
      ))}
    </div>
  )
}

export default KnockoutBracket
