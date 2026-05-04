import { formatScheduleCalendarDate } from '../../utils/dateAdapter'
import {
  getDisplayTeamName,
  getDisplayTeamShield,
  getPenaltyLabel,
  getScoreLabel,
  isPlaceholderTeam,
} from '../../utils/knockoutStageAdapter'
import styles from './KnockoutMatchCard.module.css'

function TeamSlot({ align = 'left', match, side }) {
  const teamName = getDisplayTeamName(match, side)
  const shieldUrl = getDisplayTeamShield(match, side)
  const isPlaceholder = isPlaceholderTeam(match, side)

  return (
    <div className={`${styles.teamSlot} ${styles[align]}`}>
      <div className={isPlaceholder ? styles.placeholderBadge : styles.teamBadge}>
        {shieldUrl ? (
          <img className={styles.shield} src={shieldUrl} alt={`Escudo de ${teamName}`} />
        ) : (
          <span aria-hidden="true" className={styles.slotInitial}>
            {teamName.charAt(0)}
          </span>
        )}
      </div>
      <div className={styles.teamTextGroup}>
        <span className={styles.teamName}>{teamName}</span>
        {isPlaceholder && <span className={styles.placeholderText}>Equipo por definir</span>}
      </div>
    </div>
  )
}

function KnockoutMatchCard({ match }) {
  const dateLabel = formatScheduleCalendarDate(match.date) || 'Fecha por confirmar'
  const scoreLabel = getScoreLabel(match)
  const penaltyLabel = getPenaltyLabel(match)
  const sourceLabel =
    match.dataSourceLabel === 'Información recibida pendiente'
      ? 'Sin información recibida'
      : match.dataSourceLabel

  return (
    <article
      className={match.source === 'backend' ? styles.realCard : styles.card}
      aria-label={`Partido ${match.matchNumber}: ${getDisplayTeamName(match, 'home')} contra ${getDisplayTeamName(match, 'away')}`}
    >
      <div className={styles.headerRow}>
        <span className={styles.matchNumber}>Partido {match.matchNumber}</span>
        <span className={styles.statusBadge}>{match.statusLabel}</span>
      </div>

      <div className={styles.metaRow}>
        <span>{dateLabel}</span>
        <span>{match.stadium || 'Estadio por confirmar'}</span>
      </div>

      <div className={styles.matchGrid}>
        <TeamSlot match={match} side="home" />
        <div className={styles.scoreBox} aria-label={match.hasRegularScore ? 'Marcador registrado' : 'Resultado pendiente'}>
          <span className={match.hasRegularScore ? styles.score : styles.pendingScore}>{scoreLabel}</span>
          {penaltyLabel && <span className={styles.penalties}>{penaltyLabel}</span>}
        </div>
        <TeamSlot align="right" match={match} side="away" />
      </div>

      <div className={styles.footerRow}>
        <span className={styles.sourceLabel}>{sourceLabel}</span>
        {match.winnerLabel && <span className={styles.winnerLabel}>{match.winnerLabel}</span>}
      </div>
    </article>
  )
}

export default KnockoutMatchCard
