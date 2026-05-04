import { useEffect, useRef } from 'react'
import styles from './PredictionDialog.module.css'

function PredictionDialog({
  cancelLabel = 'Cerrar',
  children,
  confirmLabel,
  onCancel,
  onConfirm,
  title,
  variant = 'info',
}) {
  const cancelButtonRef = useRef(null)
  const titleId = 'prediction-dialog-title'
  const contentId = 'prediction-dialog-content'

  useEffect(() => {
    cancelButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel])

  return (
    <div className={styles.overlay} role="presentation">
      <section
        aria-describedby={contentId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
      >
        <div className={styles.header}>
          <span className={`${styles.badge} ${styles[variant]}`} aria-hidden="true">
            {variant === 'danger' ? '!' : '?'}
          </span>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
        </div>

        <div className={styles.content} id={contentId}>
          {children}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          {confirmLabel && onConfirm && (
            <button className={styles.dangerButton} type="button" onClick={onConfirm}>
              {confirmLabel}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

export default PredictionDialog
