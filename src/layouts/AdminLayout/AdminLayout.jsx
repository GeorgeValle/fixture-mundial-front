import AdminSidebar from '../../components/AdminSidebar/AdminSidebar'
import AdminTopbar from '../../components/AdminTopbar/AdminTopbar'
import styles from './AdminLayout.module.css'

function AdminLayout({ children }) {
  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.main}>
        <AdminTopbar />
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  )
}

export default AdminLayout
