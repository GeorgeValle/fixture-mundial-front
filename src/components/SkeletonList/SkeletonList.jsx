import SkeletonCard from '../SkeletonCard/SkeletonCard'
import styles from './SkeletonList.module.css'

function SkeletonList({ count = 3, variant = 'match', label = 'Cargando listado' }) {
  const visibleCount = Math.max(1, Number(count) || 1)
  const skeletonItems = Array.from(
    { length: visibleCount },
    (_, index) => `skeleton-${index}`,
  )

  return (
    <div aria-label={label} className={styles.list} role="status">
      {skeletonItems.map((item) => (
        <SkeletonCard key={item} variant={variant} />
      ))}
    </div>
  )
}

export default SkeletonList
