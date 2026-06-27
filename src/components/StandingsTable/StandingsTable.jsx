import styles from './StandingsTable.module.css'

const columns = ['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DIF', 'PTS']

const qualificationLabels = {
  ROUND_OF_32: 'Clasificado a 16avos',
  ROUND_OF_16: 'Clasificado a octavos',
  QUARTER_FINALS: 'Clasificado a cuartos',
  SEMI_FINALS: 'Clasificado a semifinales',
  THIRD_PLACE_MATCH: 'Tercer puesto',
  FINAL: 'Clasificado a la final',
  KNOCKOUT: 'Clasificado a eliminatorias',
  ELIMINATED: 'Eliminado',
}

function getVisualPosition(row, index) {
  return row?.team?.position ?? index + 1
}

function getTeamName(row) {
  return row?.team?.name || 'Equipo por confirmar'
}

function getQualificationLabel(row) {
  if (row?.team?.position != null && row?.team?.qualifiedTo) {
    return qualificationLabels[row.team.qualifiedTo] ?? null
  }

  return null
}

function getQualificationBadgeClassName(row) {
  if (row?.team?.qualifiedTo === 'ELIMINATED') {
    return `${styles.qualificationBadge} ${styles.eliminatedBadge}`
  }

  return styles.qualificationBadge
}

function StandingsTable({ teams = [] }) {
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
            const qualificationLabel = getQualificationLabel(row)

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
                      {qualificationLabel && (
                        <span className={getQualificationBadgeClassName(row)}>
                          {qualificationLabel}
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
