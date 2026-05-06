import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import soccerBallIcon from '../../assets/icons/soccerballnoshadow.svg'
import whistleIcon from '../../assets/icons/silbato-web.svg'
import { NAV_ITEMS } from '../../constants/routes'
import {
  openHomeTutorial,
  selectFeedbackModal,
  selectLoadingState,
} from '../../features/ui/uiSlice'
import styles from './Navbar.module.css'

const MENU_ID = 'main-football-menu'

function Navbar() {
  const dispatch = useDispatch()
  const { isOpen: isFeedbackModalOpen } = useSelector(selectFeedbackModal)
  const { isGlobalLoading, hasDelayedLoading } = useSelector(selectLoadingState)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navRef = useRef(null)
  const isTutorialBlocked = isGlobalLoading || hasDelayedLoading || isFeedbackModalOpen

  useEffect(() => {
    function handlePointerDown(event) {
      if (!navRef.current?.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleOpenTutorial() {
    if (isTutorialBlocked) {
      return
    }

    setIsMenuOpen(false)
    dispatch(openHomeTutorial({ source: 'manual' }))
  }

  return (
    <header className={styles.header}>
      <div
        className={`${styles.menuOverlay} ${
          isMenuOpen ? styles.menuOverlayOpen : ''
        }`}
        aria-hidden="true"
      />

      <div className={styles.brandPanel} ref={navRef}>
        <div className={styles.menuDock}>
          <button
            aria-controls={MENU_ID}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
            className={`${styles.ballButton} ${isMenuOpen ? styles.ballButtonOpen : ''}`}
            data-tour="navbar-menu"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            type="button"
          >
            <img
              alt=""
              aria-hidden="true"
              className={styles.ballIcon}
              src={soccerBallIcon}
            />
          </button>

          <nav
            aria-hidden={!isMenuOpen}
            aria-label="Secciones principales"
            className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}
            id={MENU_ID}
          >
            <span className={styles.menuKicker}>Menú principal</span>
            {NAV_ITEMS.map((item, index) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
                end={item.path === '/'}
                key={item.path}
                onClick={() => setIsMenuOpen(false)}
                style={{ '--item-index': index }}
                tabIndex={isMenuOpen ? 0 : -1}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.brandCopy}>
          <p className={styles.eyebrow}>Seguimiento del Mundial</p>
          <h1 className={styles.title}>Fixture Mundial 2026</h1>
          <p className={styles.subtitle}>Fixture, tablas, eliminatorias y predicciones</p>
        </div>

        <button
          aria-label="Ver tutorial de la app"
          className={styles.helpButton}
          disabled={isTutorialBlocked}
          onClick={handleOpenTutorial}
          type="button"
        >
          <img
            alt=""
            aria-hidden="true"
            className={styles.helpIcon}
            src={whistleIcon}
          />
          <span>Ver tutorial</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
