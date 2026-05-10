import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { ADMIN_ROUTES } from '../../constants/adminRoutes'
import { restoreAdminSession, selectAdminAuth } from '../../features/adminAuth/adminAuthSlice'
import styles from './AdminProtectedRoute.module.css'

function AdminProtectedRoute({ children }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const { isAuthenticated, isRestoringSession, hasTriedRestore } = useSelector(selectAdminAuth)

  useEffect(() => {
    if (!isAuthenticated && !hasTriedRestore && !isRestoringSession) {
      dispatch(restoreAdminSession())
    }
  }, [dispatch, hasTriedRestore, isAuthenticated, isRestoringSession])

  if (isAuthenticated) {
    return children
  }

  if (isRestoringSession || !hasTriedRestore) {
    return (
      <main className={styles.statusPage} aria-busy="true">
        <section className={styles.statusCard} aria-live="polite">
          <p className={styles.kicker}>Admin Zone</p>
          <h1>Verificando sesión</h1>
          <p>Estamos comprobando si existe una sesión administrativa activa.</p>
        </section>
      </main>
    )
  }

  return <Navigate replace state={{ from: location }} to={ADMIN_ROUTES.login} />
}

export default AdminProtectedRoute
