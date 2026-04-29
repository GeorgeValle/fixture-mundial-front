import { Route, Routes } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import MainLayout from '../layouts/MainLayout/MainLayout'
import Home from '../pages/Home/Home'
import GroupFixtures from '../pages/GroupFixtures/GroupFixtures'
import PlaceholderPage from '../pages/PlaceholderPage/PlaceholderPage'

function AppRoutes() {
  return (
    <MainLayout>
      <Routes>
        <Route element={<Home />} path={ROUTES.home} />
        <Route element={<GroupFixtures />} path={ROUTES.fixture} />
        <Route
          element={
            <PlaceholderPage
              description="Seguí las posiciones de cada grupo según los resultados oficiales."
              title="Tablas de posiciones"
            />
          }
          path={ROUTES.standings}
        />
        <Route
          element={
            <PlaceholderPage
              description="Visualizá el camino hacia la final con cruces y placeholders actualizables."
              title="Eliminatorias"
            />
          }
          path={ROUTES.knockout}
        />
        <Route
          element={
            <PlaceholderPage
              description="Armá tus pronósticos, guardalos localmente y comparalos con los resultados."
              title="Predicciones"
            />
          }
          path={ROUTES.predictions}
        />

        <Route
          element={
            <PlaceholderPage
              description="Sección futura opcional para centralizar todos los partidos del torneo en una sola vista."
              title="Partidos (futuro/opcional)"
            />
          }
          path={ROUTES.matches}
        />
        <Route
          element={
            <PlaceholderPage
              description="Sección futura opcional para explorar equipos, planteles y fichas relacionadas."
              title="Equipos (futuro/opcional)"
            />
          }
          path={ROUTES.teams}
        />
        <Route
          element={
            <PlaceholderPage
              description="Sección futura opcional para ver sedes, ciudades y contexto de estadios del torneo."
              title="Estadios (futuro/opcional)"
            />
          }
          path={ROUTES.stadiums}
        />

        <Route
          element={
            <PlaceholderPage
              description="La sección que buscás todavía no está implementada en esta fase."
              title="Página no encontrada"
            />
          }
          path="*"
        />
      </Routes>
    </MainLayout>
  )
}

export default AppRoutes
