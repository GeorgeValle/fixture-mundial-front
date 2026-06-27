import {
  getDisplayTeamName,
  getDisplayTeamShield,
  getKnockoutSlotState,
  getKnockoutSlotStateLabel,
  isPlaceholderTeam,
} from '../../utils/knockoutStageAdapter'
import styles from './KnockoutBracketView.module.css'

const MAIN_ROUND_LABELS = {
  'round-of-32': '16avos',
  'round-of-16': 'Octavos',
  'quarter-finals': 'Cuartos',
  'semi-finals': 'Semifinal',
}

function getShortPlaceholderLabel(label) {
  const winnerMatch = label.match(/^Ganador Partido (\d+)$/i)
  if (winnerMatch) {
    return `Ganador P${winnerMatch[1]}`
  }

  const loserMatch = label.match(/^Perdedor Partido (\d+)$/i)
  if (loserMatch) {
    return `Perdedor P${loserMatch[1]}`
  }

  return 'Por definir'
}

function getBracketTeamLabel(match, side) {
  if (isPlaceholderTeam(match, side)) {
    return getShortPlaceholderLabel(getDisplayTeamName(match, side))
  }

  return getDisplayTeamName(match, side)
}

function getTeamScore(match, side) {
  if (!match?.hasRegularScore) {
    return '-'
  }

  const regularScore = side === 'home' ? match.homeScore : match.awayScore

  if (match.hasPenaltyScore && match.homeScore === match.awayScore) {
    const penaltyScore = side === 'home' ? match.homePenaltyScore : match.awayPenaltyScore
    return `${regularScore} (${penaltyScore})`
  }

  return String(regularScore)
}

function getGridRow(roundKey, matchIndex) {
  const spans = {
    'round-of-32': 1,
    'round-of-16': 2,
    'quarter-finals': 4,
    'semi-finals': 8,
  }
  const span = spans[roundKey] ?? 1
  const start = matchIndex * span + 1

  return `${start} / span ${span}`
}

function BracketTeamRow({ match, side }) {
  const teamName = getBracketTeamLabel(match, side)
  const shieldUrl = getDisplayTeamShield(match, side)
  const slotState = getKnockoutSlotState(match, side)
  const slotStateLabel = getKnockoutSlotStateLabel(slotState)
  const isPlaceholder = isPlaceholderTeam(match, side)
  const rowClassName = `${styles.teamRow} ${styles[slotState]}`

  return (
    <div className={rowClassName} aria-label={`${teamName}: ${slotStateLabel}`}>
      <span className={isPlaceholder ? styles.placeholderIcon : styles.teamBadge} aria-hidden={isPlaceholder ? 'true' : undefined}>
        {shieldUrl ? <img className={styles.shield} src={shieldUrl} alt="" /> : '–'}
      </span>
      <span className={styles.teamName} title={teamName}>
        {teamName}
      </span>
      <span className={styles.score}>{getTeamScore(match, side)}</span>
    </div>
  )
}

function BracketMatchNode({ match, matchIndex, variant = '' }) {
  const nodeClassName = `${styles.matchNode} ${variant ? styles[variant] : ''}`
  const nodeStyle = Number.isInteger(matchIndex) ? { gridRow: getGridRow(match.roundKey, matchIndex) } : undefined

  return (
    <article
      className={nodeClassName}
      aria-label={`Llave: ${getBracketTeamLabel(match, 'home')} contra ${getBracketTeamLabel(match, 'away')}`}
      style={nodeStyle}
    >
      <BracketTeamRow match={match} side="home" />
      <BracketTeamRow match={match} side="away" />
    </article>
  )
}

function BracketRoundColumn({ round }) {
  const roundLabel = MAIN_ROUND_LABELS[round.roundKey] ?? round.roundLabel

  return (
    <section className={styles.roundColumn} aria-labelledby={`bracket-${round.roundKey}`}>
      <h3 className={styles.roundTitle} id={`bracket-${round.roundKey}`}>
        {roundLabel}
      </h3>
      <div className={styles.roundMatches}>
        {round.matches.map((match, index) => (
          <BracketMatchNode key={match.templateCode} match={match} matchIndex={index} />
        ))}
      </div>
    </section>
  )
}

function FinalStage({ round }) {
  const finalMatch = round?.matches[0]

  if (!finalMatch) {
    return null
  }

  return (
    <section className={styles.finalStage} aria-labelledby="final-bracket-title" aria-label="Nodo central de la final">
      <h3 className={styles.roundTitle} id="final-bracket-title">
        Final
      </h3>
      <div className={styles.finalConvergence}>
        <BracketMatchNode match={finalMatch} variant="finalMatchNode" />
      </div>
    </section>
  )
}

function KnockoutBracketView({ rounds }) {
  const mainRounds = rounds.filter((round) => !['third-place', 'final'].includes(round.roundKey))
  const finalRound = rounds.find((round) => round.roundKey === 'final')
  const thirdPlaceRound = rounds.find((round) => round.roundKey === 'third-place')

  return (
    <section className={styles.bracketPanel} aria-labelledby="knockout-bracket-view-title">
      <header className={styles.panelHeader}>
        <p className={styles.kicker}>Vista de llaves</p>
        <h3 className={styles.panelTitle} id="knockout-bracket-view-title">
          Cuadro compacto
        </h3>
      </header>

      <div className={styles.scrollArea} aria-label="Cuadro horizontal de eliminatorias">
        <div className={styles.bracketCanvas}>
          <div className={styles.bracketGrid} role="group" aria-label="Columnas principales del bracket">
            {mainRounds.map((round) => (
              <BracketRoundColumn key={round.roundKey} round={round} />
            ))}
            <FinalStage round={finalRound} />
          </div>

          {thirdPlaceRound?.matches.length > 0 && (
            <aside className={styles.thirdPlacePanel} aria-labelledby="third-place-bracket-title">
              <h3 className={styles.thirdPlaceTitle} id="third-place-bracket-title">
                Tercer puesto
              </h3>
              <div className={styles.thirdPlaceMatch}>
                {thirdPlaceRound.matches.map((match) => (
                  <BracketMatchNode key={match.templateCode} match={match} />
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}

export default KnockoutBracketView
