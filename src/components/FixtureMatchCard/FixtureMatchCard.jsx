import { formatDisplayDate, formatDisplayTime } from '../../utils/dateAdapter'
import styles from './FixtureMatchCard.module.css'

function getTeamName(team) {
  return team?.name ?? 'Equipo por confirmar'
}

function hasScore(match) {
  return (
    match?.homeScore !== null &&
    match?.homeScore !== undefined &&
    match?.awayScore !== null &&
    match?.awayScore !== undefined
  )
}


const statusLabels = {
  PENDING: 'Pendiente',
  PLAYING: 'En juego',
  FINISHED: 'Finalizado',
  SCHEDULED: 'Programado',
}

function getStatusLabel(status) {
  return statusLabels[status] ?? status ?? 'Pendiente'
}

function getStadiumLabel(stadium) {
  if (!stadium?.name) {
    return 'Sede por confirmar'
  }

  const location = [stadium.city, stadium.country].filter(Boolean).join(', ')
  return location ? `${stadium.name} · ${location}` : stadium.name
}

function TeamBlock({ align = 'left', team }) {
  const teamName = getTeamName(team)

  return (
    <div className={`${styles.team} ${styles[align]}`}>
      <div className={styles.logoFrame}>
        {team?.shieldUrl ? (
          <img className={styles.logo} src={team.shieldUrl} alt={`Escudo de ${teamName}`} />
        ) : (
          <span aria-hidden="true" className={styles.logoPlaceholder}>
            {teamName.charAt(0)}
          </span>
        )}
      </div>
      <span className={styles.teamName}>{teamName}</span>
    </div>
  )
}

function FixtureMatchCard({ match }) {
  const scoreIsAvailable = hasScore(match)

  return (
    <article
      aria-label={`${getTeamName(match.homeTeam)} contra ${getTeamName(match.awayTeam)}`}
      className={styles.card}
    >
      <div className={styles.metaRow}>
        <span className={styles.stage}>{match.stage ?? 'Grupo'}</span>
        <span className={styles.status}>{getStatusLabel(match.status)}</span>
      </div>

      <div className={styles.matchRow}>
        <TeamBlock team={match.homeTeam} />

        <div
          aria-label={scoreIsAvailable ? 'Marcador del partido' : 'Marcador pendiente'}
          className={styles.scoreBox}
        >
          {scoreIsAvailable ? (
            <span className={styles.score}>
              {match.homeScore} <span aria-hidden="true">-</span> {match.awayScore}
            </span>
          ) : (
            <span className={styles.pendingScore}>Por jugarse</span>
          )}
        </div>

        <TeamBlock align="right" team={match.awayTeam} />
      </div>

      {match.homePenaltyScore !== null &&
        match.homePenaltyScore !== undefined &&
        match.awayPenaltyScore !== null &&
        match.awayPenaltyScore !== undefined && (
          <p className={styles.penalties}>
            Penales: {match.homePenaltyScore} - {match.awayPenaltyScore}
          </p>
        )}

      <dl className={styles.details}>
        <div>
          <dt>Fecha</dt>
          <dd>
            {formatDisplayDate(match.date)} · {formatDisplayTime(match.date)}
          </dd>
        </div>
        <div>
          <dt>Estadio</dt>
          <dd>{getStadiumLabel(match.stadium)}</dd>
        </div>
      </dl>
    </article>
  )
}

export default FixtureMatchCard
