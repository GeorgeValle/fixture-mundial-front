import { describe, expect, it } from 'vitest'
import uiReducer, {
  closeFeedbackModal,
  closeHomeTutorial,
  openHomeTutorial,
  openFeedbackModal,
  selectDelayedLoading,
  selectHomeTutorial,
  setDelayedLoading,
  setGlobalLoading,
  selectFeedbackModal,
  selectGlobalLoading,
  selectLoadingState,
  uiInitialState,
} from './uiSlice'

describe('uiSlice', () => {
  it('opens the feedback modal with payload values', () => {
    const nextState = uiReducer(
      uiInitialState,
      openFeedbackModal({
        title: 'Backend demorando',
        message: 'Esperá unos segundos más.',
        variant: 'info',
      }),
    )

    expect(nextState.isFeedbackModalOpen).toBe(true)
    expect(nextState.feedbackTitle).toBe('Backend demorando')
    expect(nextState.feedbackMessage).toBe('Esperá unos segundos más.')
    expect(nextState.feedbackVariant).toBe('info')
  })

  it('updates loading flags and closes the modal', () => {
    const openState = uiReducer(uiInitialState, openFeedbackModal())
    const loadingState = uiReducer(openState, setGlobalLoading(true))
    const delayedState = uiReducer(loadingState, setDelayedLoading(true))
    const closedState = uiReducer(delayedState, closeFeedbackModal())

    expect(delayedState.isGlobalLoading).toBe(true)
    expect(delayedState.hasDelayedLoading).toBe(true)
    expect(closedState.isFeedbackModalOpen).toBe(false)
    expect(closedState.feedbackTitle).toBe('')
  })

  it('selects feedback and loading state', () => {
    const state = {
      ui: {
        ...uiInitialState,
        isFeedbackModalOpen: true,
        feedbackTitle: 'Carga demorada',
        feedbackMessage: 'El servidor está despertando.',
        feedbackVariant: 'warning',
        isGlobalLoading: true,
        hasDelayedLoading: true,
      },
    }

    expect(selectFeedbackModal(state)).toEqual({
      isOpen: true,
      title: 'Carga demorada',
      message: 'El servidor está despertando.',
      variant: 'warning',
    })
    expect(selectGlobalLoading(state)).toBe(true)
    expect(selectDelayedLoading(state)).toBe(true)
    expect(selectLoadingState(state)).toEqual({
      isGlobalLoading: true,
      hasDelayedLoading: true,
    })
  })

  it('opens and closes the Home tutorial with a serializable source', () => {
    const openState = uiReducer(uiInitialState, openHomeTutorial({ source: 'manual' }))
    const closedState = uiReducer(openState, closeHomeTutorial())

    expect(openState.isHomeTutorialOpen).toBe(true)
    expect(openState.homeTutorialOpenSource).toBe('manual')
    expect(selectHomeTutorial({ ui: openState })).toEqual({
      isOpen: true,
      source: 'manual',
    })
    expect(closedState.isHomeTutorialOpen).toBe(false)
    expect(closedState.homeTutorialOpenSource).toBeNull()
  })
})
