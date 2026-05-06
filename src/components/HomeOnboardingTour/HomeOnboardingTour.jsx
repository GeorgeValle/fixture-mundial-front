import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  closeHomeTutorial,
  selectFeedbackModal,
  selectHomeTutorial,
  selectLoadingState,
} from '../../features/ui/uiSlice'
import { markHomeTutorialSeen } from '../../services/preferences/onboardingStorageService'
import styles from './HomeOnboardingTour.module.css'

const SPOTLIGHT_PADDING = 14
const PANEL_GAP = 20
const VIEWPORT_MARGIN = 16
const MOBILE_BREAKPOINT = 640
const FALLBACK_PANEL_WIDTH = 520
const FALLBACK_PANEL_HEIGHT = 320
const HOME_SECTIONS_DESKTOP_BOTTOM_MARGIN = 8

const steps = [
  {
    title: 'Bienvenido al fixture',
    body: 'Acá podés seguir partidos, tablas, eliminatorias y tus predicciones del Mundial 2026.',
    hint: 'Vista general',
    target: 'home-hero',
  },
  {
    title: 'Abrí el menú desde la pelota',
    body: 'Tocá la pelota para desplegar las secciones principales de la app.',
    hint: 'Menú principal',
    target: 'navbar-menu',
  },
  {
    title: 'Explorá por secciones',
    body: 'Estos bloques te presentan cada sector de la experiencia: fixture, tablas, eliminatorias y predicciones.',
    hint: 'Secciones del Home',
    target: 'home-sections',
  },
  {
    title: 'Seguí la actividad del día',
    body: 'En el Home vas a ver los partidos de hoy o la próxima fecha disponible.',
    hint: 'Fixture diario',
    target: 'home-daily-schedule',
  },
  {
    title: 'Todo listo',
    body: 'Ya podés recorrer la app y volver a abrir esta ayuda cuando quieras.',
    hint: 'Inicio rápido',
    target: null,
  },
]

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}


function isElementInViewport(element) {
  if (!element) {
    return false
  }

  const rect = element.getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  )
}

function doBoxesOverlap(firstBox, secondBox) {
  return !(
    firstBox.left + firstBox.width <= secondBox.left ||
    secondBox.left + secondBox.width <= firstBox.left ||
    firstBox.top + firstBox.height <= secondBox.top ||
    secondBox.top + secondBox.height <= firstBox.top
  )
}

function getSafeCenteredPanelBox(panelSize, { desktopBottomMargin = VIEWPORT_MARGIN * 2 } = {}) {
  const preferredTop = window.innerWidth <= MOBILE_BREAKPOINT
    ? window.innerHeight - panelSize.height - VIEWPORT_MARGIN
    : window.innerHeight - panelSize.height - desktopBottomMargin

  return {
    top: clamp(
      preferredTop,
      VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, window.innerHeight - panelSize.height - VIEWPORT_MARGIN),
    ),
    left: clamp(
      (window.innerWidth - panelSize.width) / 2,
      VIEWPORT_MARGIN,
      Math.max(VIEWPORT_MARGIN, window.innerWidth - panelSize.width - VIEWPORT_MARGIN),
    ),
    width: panelSize.width,
    height: panelSize.height,
  }
}

function getElementSize(element, fallbackWidth, fallbackHeight) {
  if (!element) {
    return { width: fallbackWidth, height: fallbackHeight }
  }

  const rect = element.getBoundingClientRect()

  return {
    width: rect.width || element.offsetWidth || fallbackWidth,
    height: rect.height || element.offsetHeight || fallbackHeight,
  }
}

function setFixedBox(element, box) {
  element.style.setProperty('--box-top', `${Math.round(box.top)}px`)
  element.style.setProperty('--box-left', `${Math.round(box.left)}px`)
  element.style.setProperty('--box-width', `${Math.round(box.width)}px`)
  element.style.setProperty('--box-height', `${Math.round(box.height)}px`)
}

function restoreScrollPosition(initialScrollYRef) {
  const initialScrollY = initialScrollYRef.current

  window.requestAnimationFrame(() => {
    if (typeof initialScrollY === 'number') {
      window.scrollTo({ top: initialScrollY, behavior: 'auto' })
      initialScrollYRef.current = null
      return
    }

    const heroTarget = document.querySelector('[data-tour="home-hero"]')
    heroTarget?.scrollIntoView?.({ block: 'start', inline: 'nearest', behavior: 'auto' })
  })
}

function HomeOnboardingTour() {
  const dispatch = useDispatch()
  const { isOpen, source } = useSelector(selectHomeTutorial)
  const { isOpen: isFeedbackModalOpen } = useSelector(selectFeedbackModal)
  const { isGlobalLoading, hasDelayedLoading } = useSelector(selectLoadingState)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const primaryButtonRef = useRef(null)
  const spotlightRef = useRef(null)
  const initialScrollYRef = useRef(null)
  const previousActiveElementRef = useRef(null)
  const didScrollHomeSectionsRef = useRef(false)

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1
  const shouldYieldToOtherOverlay = isFeedbackModalOpen || hasDelayedLoading || isGlobalLoading

  function closeTutorial({ markAsSeen = false } = {}) {
    if (markAsSeen) {
      markHomeTutorialSeen()
    }

    setCurrentStepIndex(0)
    dispatch(closeHomeTutorial())
    restoreScrollPosition(initialScrollYRef)
  }

  useEffect(() => {
    if (!isOpen || !shouldYieldToOtherOverlay) {
      return
    }

    dispatch(closeHomeTutorial())
    restoreScrollPosition(initialScrollYRef)
    window.setTimeout(() => {
      setCurrentStepIndex(0)
    }, 0)
  }, [dispatch, isOpen, shouldYieldToOtherOverlay])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    previousActiveElementRef.current = document.activeElement
    initialScrollYRef.current = window.scrollY

    window.setTimeout(() => {
      primaryButtonRef.current?.focus()
    }, 0)

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        markHomeTutorialSeen()
        setCurrentStepIndex(0)
        dispatch(closeHomeTutorial())
        restoreScrollPosition(initialScrollYRef)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dispatch, isOpen])

  useEffect(() => {
    if (!isOpen) {
      previousActiveElementRef.current?.focus?.()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    let animationFrameId = 0
    let scrollTimerId = 0

    function positionPanelWithoutTarget() {
      const panelSize = getElementSize(panelRef.current, FALLBACK_PANEL_WIDTH, FALLBACK_PANEL_HEIGHT)
      const panelTop = clamp(
        (window.innerHeight - panelSize.height) / 2,
        VIEWPORT_MARGIN,
        Math.max(VIEWPORT_MARGIN, window.innerHeight - panelSize.height - VIEWPORT_MARGIN),
      )
      const panelLeft = clamp(
        (window.innerWidth - panelSize.width) / 2,
        VIEWPORT_MARGIN,
        Math.max(VIEWPORT_MARGIN, window.innerWidth - panelSize.width - VIEWPORT_MARGIN),
      )

      overlayRef.current?.setAttribute('data-has-target', 'false')
      spotlightRef.current?.setAttribute('data-visible', 'false')

      if (panelRef.current) {
        setFixedBox(panelRef.current, {
          top: panelTop,
          left: panelLeft,
          width: panelSize.width,
          height: panelSize.height,
        })
      }
    }

    function calculatePosition() {
      const panel = panelRef.current
      const spotlight = spotlightRef.current
      const overlay = overlayRef.current

      if (!panel || !spotlight || !overlay) {
        return
      }

      const target = currentStep.target
        ? document.querySelector(`[data-tour="${currentStep.target}"]`)
        : null

      if (!target) {
        positionPanelWithoutTarget()
        return
      }

      const targetRect = target.getBoundingClientRect()

      if (!targetRect.width || !targetRect.height) {
        positionPanelWithoutTarget()
        return
      }

      const panelSize = getElementSize(panel, FALLBACK_PANEL_WIDTH, FALLBACK_PANEL_HEIGHT)
      const spotlightBox = {
        top: clamp(targetRect.top - SPOTLIGHT_PADDING, VIEWPORT_MARGIN, window.innerHeight - VIEWPORT_MARGIN),
        left: clamp(targetRect.left - SPOTLIGHT_PADDING, VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN),
        width: Math.min(targetRect.width + SPOTLIGHT_PADDING * 2, window.innerWidth - VIEWPORT_MARGIN * 2),
        height: Math.min(targetRect.height + SPOTLIGHT_PADDING * 2, window.innerHeight - VIEWPORT_MARGIN * 2),
      }

      if (currentStep.target === 'home-sections') {
        const panelBox = getSafeCenteredPanelBox(panelSize, {
          desktopBottomMargin: HOME_SECTIONS_DESKTOP_BOTTOM_MARGIN,
        })

        if (window.innerWidth > MOBILE_BREAKPOINT) {
          panelBox.top = clamp(
            Math.round(window.innerHeight * 0.24),
            VIEWPORT_MARGIN,
            Math.max(0, window.innerHeight - panelBox.height - VIEWPORT_MARGIN),
          )

          panelBox.left = clamp(
            Math.round(window.innerWidth * 0.52),
            VIEWPORT_MARGIN,
            Math.max(0, window.innerWidth - panelBox.width - VIEWPORT_MARGIN),
          )
        }

        const shouldShowSpotlight =
          isElementInViewport(target) && !doBoxesOverlap(spotlightBox, panelBox)

        overlay.setAttribute('data-has-target', shouldShowSpotlight ? 'true' : 'false')
        spotlight.setAttribute('data-visible', shouldShowSpotlight ? 'true' : 'false')

        if (shouldShowSpotlight) {
          setFixedBox(spotlight, spotlightBox)
        }

        setFixedBox(panel, panelBox)
        return
      }

      let panelTop
      let panelLeft

      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        panelTop = window.innerHeight - panelSize.height - VIEWPORT_MARGIN
        panelLeft = VIEWPORT_MARGIN
      } else if (window.innerHeight - targetRect.bottom >= panelSize.height + PANEL_GAP + VIEWPORT_MARGIN) {
        panelTop = targetRect.bottom + PANEL_GAP
        panelLeft = targetRect.left + targetRect.width / 2 - panelSize.width / 2
      } else if (targetRect.top >= panelSize.height + PANEL_GAP + VIEWPORT_MARGIN) {
        panelTop = targetRect.top - panelSize.height - PANEL_GAP
        panelLeft = targetRect.left + targetRect.width / 2 - panelSize.width / 2
      } else if (window.innerWidth - targetRect.right >= panelSize.width + PANEL_GAP + VIEWPORT_MARGIN) {
        panelTop = targetRect.top + targetRect.height / 2 - panelSize.height / 2
        panelLeft = targetRect.right + PANEL_GAP
      } else if (targetRect.left >= panelSize.width + PANEL_GAP + VIEWPORT_MARGIN) {
        panelTop = targetRect.top + targetRect.height / 2 - panelSize.height / 2
        panelLeft = targetRect.left - panelSize.width - PANEL_GAP
      } else {
        panelTop = (window.innerHeight - panelSize.height) / 2
        panelLeft = (window.innerWidth - panelSize.width) / 2
      }

      panelTop = clamp(
        panelTop,
        VIEWPORT_MARGIN,
        Math.max(VIEWPORT_MARGIN, window.innerHeight - panelSize.height - VIEWPORT_MARGIN),
      )
      panelLeft = clamp(
        panelLeft,
        VIEWPORT_MARGIN,
        Math.max(VIEWPORT_MARGIN, window.innerWidth - panelSize.width - VIEWPORT_MARGIN),
      )

      overlay.setAttribute('data-has-target', 'true')
      spotlight.setAttribute('data-visible', 'true')
      setFixedBox(spotlight, spotlightBox)
      setFixedBox(panel, {
        top: panelTop,
        left: panelLeft,
        width: panelSize.width,
        height: panelSize.height,
      })
    }

    function schedulePosition() {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = window.requestAnimationFrame(calculatePosition)
    }

    const target = currentStep.target
      ? document.querySelector(`[data-tour="${currentStep.target}"]`)
      : null

    if (target && currentStep.target === 'home-sections') {
      if (!isElementInViewport(target)) {
        didScrollHomeSectionsRef.current = true
        target.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
      }
    } else {
      target?.scrollIntoView?.({ block: 'center', inline: 'center', behavior: 'auto' })
    }

    scrollTimerId = window.setTimeout(schedulePosition, 80)
    schedulePosition()

    window.addEventListener('resize', schedulePosition)
    window.addEventListener('scroll', schedulePosition, true)

    return () => {
      window.clearTimeout(scrollTimerId)
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', schedulePosition)
      window.removeEventListener('scroll', schedulePosition, true)

      if (currentStep.target === 'home-sections' && didScrollHomeSectionsRef.current) {
        restoreScrollPosition(initialScrollYRef)
        didScrollHomeSectionsRef.current = false
      }
    }
  }, [currentStep, isOpen])

  if (!isOpen || shouldYieldToOtherOverlay) {
    return null
  }

  function handleBack() {
    setCurrentStepIndex((stepIndex) => Math.max(stepIndex - 1, 0))
  }

  function handleNext() {
    if (isLastStep) {
      closeTutorial({ markAsSeen: true })
      return
    }

    setCurrentStepIndex((stepIndex) => Math.min(stepIndex + 1, steps.length - 1))
  }

  function handleSkip() {
    closeTutorial({ markAsSeen: true })
  }

  const tutorial = (
    <div className={styles.overlay} ref={overlayRef} role="presentation">
      <span aria-hidden="true" className={styles.spotlight} ref={spotlightRef} />
      <section
        aria-describedby="home-onboarding-description"
        aria-labelledby="home-onboarding-title"
        aria-modal="true"
        className={styles.panel}
        ref={panelRef}
        role="dialog"
      >
        <div className={styles.headerRow}>
          <span className={styles.kicker}>Tutorial · Paso {currentStepIndex + 1} de {steps.length}</span>
          <span className={styles.hint}>{currentStep.hint}</span>
        </div>

        <h2 className={styles.title} id="home-onboarding-title">
          {currentStep.title}
        </h2>
        <p className={styles.description} id="home-onboarding-description">
          {currentStep.body}
        </p>

        <div className={styles.progress} aria-hidden="true">
          {steps.map((step, index) => (
            <span
              className={`${styles.progressDot} ${index <= currentStepIndex ? styles.progressDotActive : ''}`}
              key={step.title}
            />
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.secondaryButton} onClick={handleSkip} type="button">
            Omitir
          </button>
          <div className={styles.stepActions}>
            <button
              className={styles.secondaryButton}
              disabled={isFirstStep}
              onClick={handleBack}
              type="button"
            >
              Atrás
            </button>
            <button
              className={styles.primaryButton}
              onClick={handleNext}
              ref={primaryButtonRef}
              type="button"
            >
              {isLastStep ? 'Finalizar' : 'Siguiente'}
            </button>
          </div>
        </div>

        {source === 'manual' && (
          <p className={styles.manualHint}>Podés volver a abrir esta ayuda desde el botón del silbato.</p>
        )}
      </section>
    </div>
  )

  return createPortal(tutorial, document.body)
}

export default HomeOnboardingTour
