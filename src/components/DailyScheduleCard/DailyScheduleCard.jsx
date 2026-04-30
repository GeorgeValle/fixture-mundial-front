import FixtureMatchCard from '../FixtureMatchCard/FixtureMatchCard'
import SkeletonList from '../SkeletonList/SkeletonList'
import { formatScheduleCalendarDate } from '../../utils/dateAdapter'
import styles from './DailyScheduleCard.module.css'

function getVisibleSchedule(schedule) {
  const todayMatches = schedule?.today ?? []
  const nextMatches = schedule?.next ?? []

  if (todayMatches.length > 0) {
    return {
      title: 'Partidos de hoy',
      description: 'Estos son los partidos programados para la fecha consultada.',
      matches: todayMatches.slice(0, 8),
      variant: 'today',
    }
  }

  if (nextMatches.length > 0) {
    const nextDateLabel = formatScheduleCalendarDate(schedule?.nextDate)

    return {
      title: 'Próxima fecha disponible',
      description: nextDateLabel
        ? `No hay partidos para hoy. Te mostramos la próxima jornada disponible: ${nextDateLabel}.`
        : 'No hay partidos para hoy. Te mostramos la próxima jornada disponible.',
      matches: nextMatches.slice(0, 8),
      variant: 'next',
    }
  }

  return {
    title: 'Sin partidos disponibles',
    description:
      'No encontramos partidos para la fecha consultada ni una próxima jornada disponible.',
    matches: [],
    variant: 'empty',
  }
}

function DailyScheduleCard({ schedule, isLoading = false, hasError = false }) {
  const visibleSchedule = getVisibleSchedule(schedule)

  return (
    <section className={styles.card} aria-labelledby="daily-schedule-title">
      <div className={styles.header}>
        <div className={styles.headingGroup}>
          <p className={styles.kicker}>Agenda del torneo</p>
          <h3 className={styles.title} id="daily-schedule-title">
            {isLoading ? 'Cargando partidos del día' : visibleSchedule.title}
          </h3>
          {!isLoading && !hasError && (
            <p className={styles.description}>{visibleSchedule.description}</p>
          )}
        </div>

        {!isLoading && !hasError && visibleSchedule.variant !== 'empty' && (
          <span className={`${styles.badge} ${styles[visibleSchedule.variant]}`}>
            {visibleSchedule.matches.length} partidos
          </span>
        )}
      </div>

      {isLoading && (
        <div aria-live="polite" className={styles.stateBlock}>
          <p className={styles.stateText}>Estamos consultando el calendario diario.</p>
          <SkeletonList count={3} label="Cargando partidos del día" variant="match" />
        </div>
      )}

      {!isLoading && hasError && (
        <div className={`${styles.stateBlock} ${styles.errorState}`} role="alert">
          <p className={styles.stateTitle}>No pudimos cargar los partidos del día</p>
          <p className={styles.stateText}>Intentá nuevamente en unos segundos.</p>
        </div>
      )}

      {!isLoading && !hasError && visibleSchedule.variant === 'empty' && (
        <div className={styles.stateBlock}>
          <p className={styles.stateTitle}>Calendario sin actividad</p>
          <p className={styles.stateText}>{visibleSchedule.description}</p>
        </div>
      )}

      {!isLoading && !hasError && visibleSchedule.matches.length > 0 && (
        <div className={styles.matchList}>
          {visibleSchedule.matches.map((match, index) => (
            <FixtureMatchCard
              key={match?._id ?? `${match?.date ?? 'daily-match'}-${index}`}
              match={match}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default DailyScheduleCard
