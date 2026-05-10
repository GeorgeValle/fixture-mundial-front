import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_ROUTES } from '../../constants/adminRoutes'
import {
  clearAdminAuthError,
  loginAdmin,
  restoreAdminSession,
  selectAdminAuth,
} from '../../features/adminAuth/adminAuthSlice'
import styles from './AdminLoginPage.module.css'

function AdminLoginPage() {
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, isRestoringSession, hasTriedRestore, error } =
    useSelector(selectAdminAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!isAuthenticated && !hasTriedRestore && !isRestoringSession) {
      dispatch(restoreAdminSession())
    }
  }, [dispatch, hasTriedRestore, isAuthenticated, isRestoringSession])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')
    dispatch(clearAdminAuthError())

    if (!email.trim() || !password) {
      setFormError('Completá email y contraseña para ingresar.')
      return
    }

    const result = await dispatch(loginAdmin({ email: email.trim(), password }))

    if (loginAdmin.fulfilled.match(result)) {
      const redirectTo = location.state?.from?.pathname ?? ADMIN_ROUTES.dashboard
      navigate(redirectTo, { replace: true })
    }
  }

  if (isAuthenticated) {
    return <Navigate replace to={ADMIN_ROUTES.dashboard} />
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="admin-login-title">
        <div className={styles.header}>
          <p className={styles.kicker}>Admin Zone</p>
          <h1 id="admin-login-title">Ingreso administrativo</h1>
          <p>Accedé con una cuenta autorizada para gestionar el fixture oficial.</p>
        </div>

        {isRestoringSession && (
          <p className={styles.status} aria-live="polite">
            Verificando sesión existente…
          </p>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          <label className={styles.field}>
            <span>Contraseña</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {(formError || error) && (
            <p className={styles.error} role="alert">
              {formError || error}
            </p>
          )}

          <button className={styles.submitButton} disabled={isLoading} type="submit">
            {isLoading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className={styles.note}>El token viaja por cookie HttpOnly y no se guarda en el navegador.</p>
      </section>
    </main>
  )
}

export default AdminLoginPage
