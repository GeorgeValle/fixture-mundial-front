export const ADMIN_ROUTES = {
  root: '/admin',
  login: '/admin/login',
  dashboard: '/admin/dashboard',
  matches: '/admin/matches',
  groups: '/admin/groups',
  transition: '/admin/transition',
  teamCorrections: '/admin/teams-corrections',
  knockouts: '/admin/knockouts',
}

export const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: ADMIN_ROUTES.dashboard, isEnabled: true },
  { label: 'Partidos', path: ADMIN_ROUTES.matches, isEnabled: true },
  { label: 'Grupos', path: ADMIN_ROUTES.groups, isEnabled: false },
  { label: 'Transición', path: ADMIN_ROUTES.transition, isEnabled: false },
  { label: 'Correcciones', path: ADMIN_ROUTES.teamCorrections, isEnabled: false },
  { label: 'Eliminatorias', path: ADMIN_ROUTES.knockouts, isEnabled: false },
]
