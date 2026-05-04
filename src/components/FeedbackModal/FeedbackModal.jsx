import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeFeedbackModal, selectFeedbackModal } from '../../features/ui/uiSlice'
import styles from './FeedbackModal.module.css'

function FeedbackModal() {
  const dispatch = useDispatch()
  const closeButtonRef = useRef(null)
  const { isOpen, title, message, variant } = useSelector(selectFeedbackModal)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    closeButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        dispatch(closeFeedbackModal())
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dispatch, isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div className={styles.overlay} role="presentation">
      <section
        aria-describedby="feedback-modal-message"
        aria-labelledby="feedback-modal-title"
        aria-modal="true"
        className={styles.modal}
        role="dialog"
      >
        <span className={`${styles.badge} ${styles[variant]}`}>{variant}</span>
        <h2 className={styles.title} id="feedback-modal-title">
          {title}
        </h2>
        <p className={styles.message} id="feedback-modal-message">
          {message}
        </p>
        <button
          className={styles.button}
          onClick={() => dispatch(closeFeedbackModal())}
          ref={closeButtonRef}
          type="button"
        >
          Entendido
        </button>
      </section>
    </div>
  )
}

export default FeedbackModal
