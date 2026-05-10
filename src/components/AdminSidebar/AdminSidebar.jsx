import { NavLink } from 'react-router-dom'
import { ADMIN_NAV_ITEMS } from '../../constants/adminRoutes'
import styles from './AdminSidebar.module.css'

function AdminSidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Navegación del Admin Zone">
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">⚽</span>
        <div>
          <p>Fixture Mundial</p>
          <strong>Admin Zone</strong>
        </div>
      </div>

      <nav className={styles.nav}>
        {ADMIN_NAV_ITEMS.map((item) =>
          item.isEnabled ? (
            <NavLink
              className={({ isActive }) =>
                isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
              }
              key={item.path}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ) : (
            <button className={styles.navItem} disabled key={item.path} type="button">
              <span>{item.label}</span>
              <small>Próximo bloque</small>
            </button>
          ),
        )}
      </nav>
    </aside>
  )
}

export default AdminSidebar
