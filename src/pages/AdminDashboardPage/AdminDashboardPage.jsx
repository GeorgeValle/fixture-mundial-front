import { ADMIN_NAV_ITEMS } from '../../constants/adminRoutes'
import styles from './AdminDashboardPage.module.css'

const summaryCards = [
  {
    title: 'Partidos',
    description: 'Carga de resultados, estados y penales en el Bloque 13.',
  },
  {
    title: 'Grupos',
    description: 'Control de standings y recálculo por grupo en el Bloque 14.',
  },
  {
    title: 'Transición',
    description: 'Siembra de clasificados hacia eliminatorias en el Bloque 15.',
  },
  {
    title: 'Correcciones',
    description: 'Ajustes excepcionales de equipos en el Bloque 16.',
  },
  {
    title: 'Eliminatorias',
    description: 'Monitor y carga de resultados knockout en el Bloque 17.',
  },
]

function AdminDashboardPage() {
  return (
    <section className={styles.page} aria-labelledby="admin-dashboard-title">
      <div className={styles.hero}>
        <p className={styles.kicker}>Base administrativa</p>
        <h1 id="admin-dashboard-title">Dashboard del Admin Zone</h1>
        <p>
          Esta pantalla confirma la sesión administrativa y deja preparada la navegación interna.
          Los controles operativos se implementarán en los próximos bloques.
        </p>
      </div>

      <div className={styles.grid}>
        {summaryCards.map((card) => (
          <article className={styles.card} key={card.title}>
            <span className={styles.cardIcon} aria-hidden="true">●</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <span className={styles.badge}>Pendiente</span>
          </article>
        ))}
      </div>

      <section className={styles.routesPanel} aria-labelledby="admin-routes-title">
        <h2 id="admin-routes-title">Sectores del Admin Zone</h2>
        <ul>
          {ADMIN_NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <strong>{item.label}</strong>
              <span>{item.isEnabled ? 'Disponible' : 'Planificado para bloques futuros'}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default AdminDashboardPage
