import { createSelector, createSlice } from '@reduxjs/toolkit'

export const uiInitialState = {
  isFeedbackModalOpen: false,
  feedbackTitle: '',
  feedbackMessage: '',
  feedbackVariant: 'info',
  isGlobalLoading: false,
  hasDelayedLoading: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: uiInitialState,
  reducers: {
    openFeedbackModal(state, action) {
      state.isFeedbackModalOpen = true
      state.feedbackTitle = action.payload?.title ?? 'Aviso'
      state.feedbackMessage =
        action.payload?.message ?? 'Necesitamos que esperes unos segundos más.'
      state.feedbackVariant = action.payload?.variant ?? 'info'
    },
    closeFeedbackModal(state) {
      state.isFeedbackModalOpen = false
      state.feedbackTitle = ''
      state.feedbackMessage = ''
      state.feedbackVariant = 'info'
    },
    setGlobalLoading(state, action) {
      state.isGlobalLoading = Boolean(action.payload)
    },
    setDelayedLoading(state, action) {
      state.hasDelayedLoading = Boolean(action.payload)
    },
  },
})

export const {
  openFeedbackModal,
  closeFeedbackModal,
  setGlobalLoading,
  setDelayedLoading,
} = uiSlice.actions

export const selectUiState = (state) => state.ui

export const selectGlobalLoading = createSelector(
  [selectUiState],
  (uiState) => uiState.isGlobalLoading,
)

export const selectDelayedLoading = createSelector(
  [selectUiState],
  (uiState) => uiState.hasDelayedLoading,
)

export const selectLoadingState = createSelector([selectUiState], (uiState) => ({
  isGlobalLoading: uiState.isGlobalLoading,
  hasDelayedLoading: uiState.hasDelayedLoading,
}))

export const selectFeedbackModal = createSelector([selectUiState], (uiState) => ({
  isOpen: uiState.isFeedbackModalOpen,
  title: uiState.feedbackTitle,
  message: uiState.feedbackMessage,
  variant: uiState.feedbackVariant,
}))

export default uiSlice.reducer
