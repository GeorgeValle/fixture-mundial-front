import styles from './ThirdPlaceRankingTable.module.css'

const columns = ['#', 'Equipo', 'Grupo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DIF', 'PTS']

function getTeamName(row) {
  return row?.team?.name || 'Equipo por confirmar'
}

function getQualificationLabel(row) {
  return row?.isQualifiedThirdPlace ? 'Clasifica a 16avos' : 'No clasifica'
}

function ThirdPlaceRankingTable({ ranking = [] }) {
  return (
    <section className={styles.card} aria-labelledby="third-place-ranking-title">
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <p className={styles.kicker}>Mejores terceros</p>
          <h3 className={styles.title} id="third-place-ranking-title">
            Ranking de mejores terceros
          </h3>
          <p className={styles.description}>
            Las mejores 8 selecciones ubicadas terceras en sus grupos clasifican a 16avos.
          </p>
        </div>
        <span className={styles.summaryBadge}>{ranking.length} terceros</span>
      </header>

      {ranking.length > 0 ? (
        <div className={styles.tableScroll}>
          <table className={styles.table} aria-label="Ranking de mejores terceros">
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
              {ranking.map((row) => {
                const teamName = getTeamName(row)
                const badgeClassName = row.isQualifiedThirdPlace
                  ? styles.qualifiedBadge
                  : styles.notQualifiedBadge

                return (
                  <tr key={row?.team?._id ?? `${row.group}-${teamName}-${row.rank}`}>
                    <td className={styles.rankCell}>{row.rank}</td>
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
                          <span className={`${styles.statusBadge} ${badgeClassName}`}>
                            {getQualificationLabel(row)}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className={styles.groupCell}>Grupo {row.group}</td>
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
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Todavía no hay terceros suficientes</p>
          <p className={styles.emptyText}>
            Cuando las tablas tengan al menos tres selecciones por grupo, este ranking se va a
            completar automáticamente.
          </p>
        </div>
      )}
    </section>
  )
}

export default ThirdPlaceRankingTable
