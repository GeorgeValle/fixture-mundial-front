import { describe, expect, it } from 'vitest'
import { Provider } from 'react-redux'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { store } from '../../app/store'
import { closeFeedbackModal, openFeedbackModal } from '../../features/ui/uiSlice'
import FeedbackModal from './FeedbackModal'

function renderOpenFeedbackModal() {
  store.dispatch(closeFeedbackModal())
  store.dispatch(
    openFeedbackModal({
      title: 'Servidor lento',
      message: 'Estamos esperando la respuesta del servidor.',
      variant: 'info',
    }),
  )

  return render(
    <Provider store={store}>
      <FeedbackModal />
    </Provider>,
  )
}

describe('FeedbackModal', () => {
  it('renders data from Redux and closes when the user confirms', async () => {
    const user = userEvent.setup()

    renderOpenFeedbackModal()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Servidor lento')).toBeInTheDocument()
    expect(screen.getByText('Estamos esperando la respuesta del servidor.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Entendido' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('focuses the close button and closes with Escape', async () => {
    const user = userEvent.setup()

    renderOpenFeedbackModal()

    expect(screen.getByRole('button', { name: 'Entendido' })).toHaveFocus()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
