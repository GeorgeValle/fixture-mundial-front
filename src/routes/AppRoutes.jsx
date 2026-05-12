import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminProtectedRoute from '../components/AdminProtectedRoute/AdminProtectedRoute'
import { ADMIN_ROUTES } from '../constants/adminRoutes'
import { ROUTES } from '../constants/routes'
import { restoreAdminSession, selectAdminAuth } from '../features/adminAuth/adminAuthSlice'
import AdminLayout from '../layouts/AdminLayout/AdminLayout'
import MainLayout from '../layouts/MainLayout/MainLayout'
import AdminDashboardPage from '../pages/AdminDashboardPage/AdminDashboardPage'
import AdminLoginPage from '../pages/AdminLoginPage/AdminLoginPage'
import AdminMatchesPage from '../pages/AdminMatchesPage/AdminMatchesPage'
import AdminGroupsPage from '../pages/AdminGroupsPage/AdminGroupsPage'
import AdminTeamCorrectionsPage from '../pages/AdminTeamCorrectionsPage/AdminTeamCorrectionsPage'
import AdminTransitionPage from '../pages/AdminTransitionPage/AdminTransitionPage'
import GroupFixtures from '../pages/GroupFixtures/GroupFixtures'
import GroupStandings from '../pages/GroupStandings/GroupStandings'
import Home from '../pages/Home/Home'
import KnockoutStage from '../pages/KnockoutStage/KnockoutStage'
import NotFound from '../pages/NotFound/NotFound'
import PlaceholderPage from '../pages/PlaceholderPage/PlaceholderPage'
import PredictionFixture from '../pages/PredictionFixture/PredictionFixture'

function PublicRoute({ children }) {
  return <MainLayout>{children}</MainLayout>
}

function AdminIndexRoute() {
  const dispatch = useDispatch()
  const { isAuthenticated, isRestoringSession, hasTriedRestore } = useSelector(selectAdminAuth)

  useEffect(() => {
    if (!isAuthenticated && !hasTriedRestore && !isRestoringSession) {
      dispatch(restoreAdminSession())
    }
  }, [dispatch, hasTriedRestore, isAuthenticated, isRestoringSession])

  if (isAuthenticated) {
    return <Navigate replace to={ADMIN_ROUTES.dashboard} />
  }

  if (isRestoringSession || !hasTriedRestore) {
    return (
      <main aria-busy="true">
        <p>Verificando sesión administrativa…</p>
      </main>
    )
  }

  return <Navigate replace to={ADMIN_ROUTES.login} />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminIndexRoute />} path={ADMIN_ROUTES.root} />
      <Route element={<AdminLoginPage />} path={ADMIN_ROUTES.login} />
      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
        path={ADMIN_ROUTES.dashboard}
      />

      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminMatchesPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
        path={ADMIN_ROUTES.matches}
      />

      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminGroupsPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
        path={ADMIN_ROUTES.groups}
      />

      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminTransitionPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
        path={ADMIN_ROUTES.transition}
      />

      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout>
              <AdminTeamCorrectionsPage />
            </AdminLayout>
          </AdminProtectedRoute>
        }
        path={ADMIN_ROUTES.teamCorrections}
      />

      <Route element={<PublicRoute><Home /></PublicRoute>} path={ROUTES.home} />
      <Route element={<PublicRoute><GroupFixtures /></PublicRoute>} path={ROUTES.fixture} />
      <Route element={<PublicRoute><GroupStandings /></PublicRoute>} path={ROUTES.standings} />
      <Route element={<PublicRoute><KnockoutStage /></PublicRoute>} path={ROUTES.knockout} />
      <Route element={<PublicRoute><PredictionFixture /></PublicRoute>} path={ROUTES.predictions} />

      <Route
        element={
          <PublicRoute>
            <PlaceholderPage
              description="Sección futura opcional para centralizar todos los partidos del torneo en una sola vista."
              title="Partidos (futuro/opcional)"
            />
          </PublicRoute>
        }
        path={ROUTES.matches}
      />
      <Route
        element={
          <PublicRoute>
            <PlaceholderPage
              description="Sección futura opcional para explorar equipos, planteles y fichas relacionadas."
              title="Equipos (futuro/opcional)"
            />
          </PublicRoute>
        }
        path={ROUTES.teams}
      />
      <Route
        element={
          <PublicRoute>
            <PlaceholderPage
              description="Sección futura opcional para ver sedes, ciudades y contexto de estadios del torneo."
              title="Estadios (futuro/opcional)"
            />
          </PublicRoute>
        }
        path={ROUTES.stadiums}
      />

      <Route element={<PublicRoute><NotFound /></PublicRoute>} path="*" />
    </Routes>
  )
}

export default AppRoutes
