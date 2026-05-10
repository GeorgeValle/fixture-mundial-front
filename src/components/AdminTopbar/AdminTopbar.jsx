import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { ADMIN_ROUTES } from '../../constants/adminRoutes'
import { ROUTES } from '../../constants/routes'
import { logoutAdmin, selectAdminAuth } from '../../features/adminAuth/adminAuthSlice'
import styles from './AdminTopbar.module.css'

function AdminTopbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, isLoading, error } = useSelector(selectAdminAuth)

  const handleLogout = async () => {
    const result = await dispatch(logoutAdmin())

    if (logoutAdmin.fulfilled.match(result)) {
      navigate(ADMIN_ROUTES.login, { replace: true })
    }
  }

  return (
    <header className={styles.topbar}>
      <div>
        <p className={styles.kicker}>Sesión administrativa</p>
        <strong>{user?.email ?? 'Admin'}</strong>
        {user?.role && <span>{user.role}</span>}
      </div>

      <div className={styles.actions}>
        <Link className={styles.publicLink} to={ROUTES.home}>
          Ver app pública
        </Link>
        <button className={styles.logoutButton} disabled={isLoading} onClick={handleLogout} type="button">
          {isLoading ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </header>
  )
}

export default AdminTopbar
