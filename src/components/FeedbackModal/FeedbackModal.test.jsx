import { describe, expect, it } from 'vitest'
import { Provider } from 'react-redux'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { store } from '../../app/store'
import { openFeedbackModal } from '../../features/ui/uiSlice'
import FeedbackModal from './FeedbackModal'

describe('FeedbackModal', () => {
  it('renders data from Redux and closes when the user confirms', async () => {
    const user = userEvent.setup()

    store.dispatch(
      openFeedbackModal({
        title: 'Servidor lento',
        message: 'Estamos esperando la respuesta del backend.',
        variant: 'info',
      }),
    )

    render(
      <Provider store={store}>
        <FeedbackModal />
      </Provider>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Servidor lento')).toBeInTheDocument()
    expect(
      screen.getByText('Estamos esperando la respuesta del backend.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Entendido' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
