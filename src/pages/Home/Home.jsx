import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import DailyScheduleCard from '../../components/DailyScheduleCard/DailyScheduleCard'
import HomeOnboardingTour from '../../components/HomeOnboardingTour/HomeOnboardingTour'
import {
  openHomeTutorial,
  openFeedbackModal,
  selectFeedbackModal,
  selectLoadingState,
  setDelayedLoading,
  setGlobalLoading,
} from '../../features/ui/uiSlice'
import { getDailySchedule } from '../../services/matches/matchesService'
import { hasSeenHomeTutorial } from '../../services/preferences/onboardingStorageService'
import { getTodayISODate } from '../../utils/dateAdapter'
import { ROUTES } from '../../constants/routes'
import { DELAYED_LOADING_THRESHOLD_MS } from '../../utils/delayedLoading'
import stadiumHero from '../../assets/illustrations/stadium-hero.png'
import styles from './Home.module.css'


const quickLinks = [
  {
    label: 'Ir al fixture',
    description: 'Grupos',
    path: ROUTES.fixture,
  },
  {
    label: 'Ver tablas',
    description: 'Posiciones',
    path: ROUTES.standings,
  },
  {
    label: 'Ver eliminatorias',
    description: 'Cruces',
    path: ROUTES.knockout,
  },
  {
    label: 'Hacer predicciones',
    description: 'Pronóstico',
    path: ROUTES.predictions,
  },
]

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
  const didRequestHomeTutorialRef = useRef(false)
  const { isOpen: isFeedbackModalOpen } = useSelector(selectFeedbackModal)
  const { isGlobalLoading, hasDelayedLoading } = useSelector(selectLoadingState)

  useEffect(() => {
    const canAutoOpenTutorial =
      !didRequestHomeTutorialRef.current &&
      !hasSeenHomeTutorial() &&
      !isDailyScheduleLoading &&
      !isGlobalLoading &&
      !hasDelayedLoading &&
      !isFeedbackModalOpen &&
      document.querySelector('[data-tour="home-hero"]') &&
      document.querySelector('[data-tour="home-sections"]') &&
      document.querySelector('[data-tour="home-daily-schedule"]') &&
      document.querySelector('[data-tour="navbar-menu"]')

    if (!canAutoOpenTutorial) {
      return undefined
    }

    const tutorialTimer = window.setTimeout(() => {
      if (
        didRequestHomeTutorialRef.current ||
        hasSeenHomeTutorial() ||
        isFeedbackModalOpen ||
        hasDelayedLoading ||
        isGlobalLoading
      ) {
        return
      }

      didRequestHomeTutorialRef.current = true
      dispatch(openHomeTutorial({ source: 'auto' }))
    }, 180)

    return () => {
      window.clearTimeout(tutorialTimer)
    }
  }, [
    dispatch,
    hasDelayedLoading,
    isDailyScheduleLoading,
    isFeedbackModalOpen,
    isGlobalLoading,
  ])

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
      <div className={styles.hero} data-tour="home-hero">
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

          <nav
            className={styles.actionRow}
            aria-label="Accesos rápidos del Home"
            data-tour="home-sections"
          >
            {quickLinks.map((link) => (
              <Link aria-label={link.label} className={styles.actionChip} key={link.path} to={link.path}>
                <span>{link.label}</span>
                <small>{link.description}</small>
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.visualPanel} aria-hidden="true">
          <div className={styles.stadiumHeroStage}>
            <img
              alt=""
              aria-hidden="true"
              className={styles.stadiumHeroImage}
              src={stadiumHero}
            />
            <span className={`${styles.firework} ${styles.fireworkCyan}`} aria-hidden="true" />
            <span className={`${styles.firework} ${styles.fireworkGold}`} aria-hidden="true" />
            <span className={`${styles.firework} ${styles.fireworkMagenta}`} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div data-tour="home-daily-schedule">
        <DailyScheduleCard
          hasError={hasDailyScheduleError}
          isLoading={isDailyScheduleLoading}
          schedule={dailySchedule}
          onRetry={handleRetryDailySchedule}
        />
      </div>

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

      <HomeOnboardingTour />
    </section>
  )
}

export default Home
