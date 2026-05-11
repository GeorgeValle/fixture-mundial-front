import { ADMIN_NAV_ITEMS } from '../../constants/adminRoutes'
import styles from './AdminDashboardPage.module.css'

const summaryCards = [
  {
    title: 'Partidos',
    description: 'Carga de resultados, estados y penales oficiales disponible en /admin/matches.',
    status: 'Disponible',
  },
  {
    title: 'Grupos',
    description: 'Revisión operativa de grupos y standings oficiales disponible en /admin/groups.',
    status: 'Disponible',
  },
  {
    title: 'Transición',
    description: 'Transición manual por grupo hacia 16avos disponible en /admin/transition. React solo envía el grupo y el backend calcula los clasificados.',
    status: 'Disponible',
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
          Partidos y grupos ya tienen controles operativos; los standings se revisan sin recalcular lógica deportiva en React.
        </p>
      </div>

      <div className={styles.grid}>
        {summaryCards.map((card) => (
          <article className={styles.card} key={card.title}>
            <span className={styles.cardIcon} aria-hidden="true">●</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <span className={card.status === 'Disponible' ? `${styles.badge} ${styles.availableBadge}` : styles.badge}>
              {card.status ?? 'Pendiente'}
            </span>
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
