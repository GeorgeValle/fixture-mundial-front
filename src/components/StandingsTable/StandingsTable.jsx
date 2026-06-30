import { getGroupStandingBadge } from '../../utils/groupStandingBadge'
import styles from './StandingsTable.module.css'

const columns = ['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DIF', 'PTS']

function getVisualPosition(row, index) {
  return row?.team?.position ?? index + 1
}

function getTeamName(row) {
  return row?.team?.name || 'Equipo por confirmar'
}

function getQualificationBadgeClassName(badge) {
  if (badge?.variant === 'eliminated') {
    return `${styles.qualificationBadge} ${styles.eliminatedBadge}`
  }

  if (badge?.variant === 'pending') {
    return `${styles.qualificationBadge} ${styles.pendingBadge}`
  }

  return styles.qualificationBadge
}

function StandingsTable({ teams = [], groupStandingBadgeContext = {} }) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((row, index) => {
            const teamName = getTeamName(row)
            const qualificationBadge = getGroupStandingBadge(row, groupStandingBadgeContext)

            return (
              <tr key={row?.team?._id ?? `${teamName}-${index}`}>
                <td className={styles.positionCell}>{getVisualPosition(row, index)}</td>
                <td className={styles.teamCell}>
                  <span className={styles.teamIdentity}>
                    {row?.team?.shieldUrl ? (
                      <img
                        alt={`Escudo de ${teamName}`}
                        className={styles.shield}
                        src={row.team.shieldUrl}
                      />
                    ) : (
                      <span aria-hidden="true" className={styles.shieldFallback}>
                        {teamName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className={styles.teamText}>
                      <span className={styles.teamName}>{teamName}</span>
                      {qualificationBadge && (
                        <span className={getQualificationBadgeClassName(qualificationBadge)}>
                          {qualificationBadge.label}
                        </span>
                      )}
                    </span>
                  </span>
                </td>
                <td>{row.pj}</td>
                <td>{row.pg}</td>
                <td>{row.pe}</td>
                <td>{row.pp}</td>
                <td>{row.gf}</td>
                <td>{row.gc}</td>
                <td>{row.dif}</td>
                <td className={styles.pointsCell}>{row.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default StandingsTable
