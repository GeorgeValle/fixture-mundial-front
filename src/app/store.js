import { configureStore } from '@reduxjs/toolkit'
import adminAuthReducer from '../features/adminAuth/adminAuthSlice'
import uiReducer from '../features/ui/uiSlice'

export const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    ui: uiReducer,
  },
})
