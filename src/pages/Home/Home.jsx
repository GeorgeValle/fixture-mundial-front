import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import DailyScheduleCard from '../../components/DailyScheduleCard/DailyScheduleCard'
import {
  openFeedbackModal,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { getDailySchedule } from '../../services/matches/matchesService'
import { getTodayISODate } from '../../utils/dateAdapter'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import styles from './Home.module.css'

const featureCards = [
  {
    eyebrow: 'Fixture',
    title: 'Calendario por grupos',
    description: 'Explorá fechas, sedes y marcadores en una vista clara para seguir cada grupo.',
    accent: 'cyan',
  },
  {
    eyebrow: 'Tablas y cruces',
    title: 'Posiciones + eliminatorias',
    description: 'Visualizá posiciones por grupo y el camino hacia la final en un mismo flujo.',
    accent: 'magenta',
  },
  {
    eyebrow: 'Predicciones',
    title: 'Tu pronóstico',
    description: 'Creá tus pronósticos y compará tu desempeño con los resultados registrados.',
    accent: 'gold',
  },
]

function Home() {
  const dispatch = useDispatch()
  const [dailySchedule, setDailySchedule] = useState(null)
  const [isDailyScheduleLoading, setIsDailyScheduleLoading] = useState(true)
  const [hasDailyScheduleError, setHasDailyScheduleError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isActive = true
    let didShowDelayedFeedback = false

    dispatch(setGlobalLoading(true))
    dispatch(setDelayedLoading(false))

    const delayedLoadingTimer = window.setTimeout(() => {
      if (!isActive) {
        return
      }

      didShowDelayedFeedback = true
      dispatch(setDelayedLoading(true))
      dispatch(
        openFeedbackModal({
          title: 'El servidor está despertando',
          message:
            'Puede tardar hasta 30 segundos en responder. Tocá en reintentar para volver a cargar la información.',
          variant: 'info',
        }),
      )
    }, DELAYED_LOADING_THRESHOLD_MS)

    getDailySchedule(getTodayISODate())
      .then((schedule) => {
        if (!isActive) {
          return
        }

        setDailySchedule(schedule)
      })
      .catch(() => {
        if (!isActive) {
          return
        }

        setHasDailyScheduleError(true)
      })
      .finally(() => {
        if (!isActive) {
          return
        }

        window.clearTimeout(delayedLoadingTimer)
        setIsDailyScheduleLoading(false)
        dispatch(setGlobalLoading(false))

        if (didShowDelayedFeedback) {
          dispatch(setDelayedLoading(false))
        }
      })

    return () => {
      isActive = false
      window.clearTimeout(delayedLoadingTimer)
      dispatch(setGlobalLoading(false))
      dispatch(setDelayedLoading(false))
    }
  }, [dispatch, retryCount])

  function handleRetryDailySchedule() {
    setIsDailyScheduleLoading(true)
    setHasDailyScheduleError(false)
    setRetryCount((currentCount) => currentCount + 1)
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.heroWatermark} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Proyecto de portfolio</span>
            <span className={styles.badge}>React + Vite</span>
          </div>

          <p className={styles.kicker}>Experiencia de fútbol internacional</p>
          <h2 className={styles.title}>
            Fixture, tablas, eliminatorias y predicciones en una sola experiencia
          </h2>
          <p className={styles.description}>
            Seguí el torneo 2026 con una experiencia visual moderna: fixture por grupos,
            tablas de posiciones, eliminatorias y predicciones en una única plataforma.
          </p>

          <div className={styles.actionRow} aria-label="Resumen de secciones disponibles">
            <span className={styles.actionChip}>Fixture</span>
            <span className={styles.actionChip}>Tablas</span>
            <span className={styles.actionChip}>Eliminatorias</span>
            <span className={styles.actionChip}>Predicciones</span>
          </div>
        </div>

        <div className={styles.visualPanel} aria-hidden="true">
          <div className={styles.fieldCard}>
            <span className={styles.fieldLine}></span>
            <span className={styles.centerCircle}></span>
            <span className={styles.ball}></span>
          </div>
          <div className={styles.scoreCard}>
            <span>2026</span>
            <strong>Listo para el inicio</strong>
          </div>
        </div>
      </div>

      <DailyScheduleCard
        hasError={hasDailyScheduleError}
        isLoading={isDailyScheduleLoading}
        schedule={dailySchedule}
        onRetry={handleRetryDailySchedule}
      />

      <div className={styles.grid}>
        {featureCards.map((card) => (
          <article className={`${styles.card} ${styles[card.accent]}`} key={card.title}>
            <span className={styles.cardWatermark} aria-hidden="true" />
            <p className={styles.cardEyebrow}>{card.eyebrow}</p>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardDescription}>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Home
