import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../constants/routes'
import styles from './Navbar.module.css'

const MENU_ID = 'main-football-menu'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navRef = useRef(null)

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
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            type="button"
          >
            <span className={styles.ball} aria-hidden="true">
              <span className={styles.ballCore}></span>
            </span>
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

        <div>
          <p className={styles.eyebrow}>Seguimiento del Mundial</p>
          <h1 className={styles.title}>Fixture Mundial 2026</h1>
          <p className={styles.subtitle}>Fixture, tablas, eliminatorias y predicciones</p>
        </div>
      </div>
    </header>
  )
}

export default Navbar
