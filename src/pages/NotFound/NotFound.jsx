import { NavLink } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import styles from './NotFound.module.css'

function NotFound() {
  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <div className={styles.card}>
        <span className={styles.watermark} aria-hidden="true" />
        <div className={styles.icon} aria-hidden="true">
          <span />
        </div>
        <p className={styles.kicker}>404 · Fuera de juego</p>
        <h2 className={styles.title} id="not-found-title">
          Te fuiste fuera de la cancha
        </h2>
        <p className={styles.description}>
          La página que buscás no está en el fixture. Volvé al inicio para seguir
          explorando partidos, tablas y predicciones.
        </p>
        <NavLink className={styles.cta} to={ROUTES.home}>
          Volver al inicio
        </NavLink>
      </div>
    </section>
  )
}

export default NotFound
