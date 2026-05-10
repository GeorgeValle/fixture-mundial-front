import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import {
  getCurrentAdmin,
  loginAdmin as loginAdminRequest,
  logoutAdmin as logoutAdminRequest,
} from '../../services/admin/adminAuthService'

const GENERIC_AUTH_ERROR = 'No pudimos iniciar sesión. Revisá tus datos e intentá nuevamente.'
const RESTORE_UNAVAILABLE_STATUSES = new Set([401, 404])

function getFriendlyAuthError(error, fallback = GENERIC_AUTH_ERROR) {
  if (error?.status === 403) {
    return 'Tu usuario no tiene permisos para acceder al Admin Zone.'
  }

  if (error?.status === 401) {
    return 'La sesión no es válida o expiró. Iniciá sesión nuevamente.'
  }

  return error?.message ?? fallback
}

export const adminAuthInitialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoringSession: false,
  hasTriedRestore: false,
  error: '',
}

export const loginAdmin = createAsyncThunk('adminAuth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await loginAdminRequest(credentials)
  } catch (error) {
    return rejectWithValue(getFriendlyAuthError(error))
  }
})

export const logoutAdmin = createAsyncThunk('adminAuth/logout', async (_, { rejectWithValue }) => {
  try {
    await logoutAdminRequest()
    return true
  } catch (error) {
    if (RESTORE_UNAVAILABLE_STATUSES.has(error?.status)) {
      return true
    }

    return rejectWithValue(getFriendlyAuthError(error, 'No pudimos cerrar sesión en el servidor.'))
  }
})

export const restoreAdminSession = createAsyncThunk(
  'adminAuth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentAdmin()
    } catch (error) {
      if (RESTORE_UNAVAILABLE_STATUSES.has(error?.status)) {
        return rejectWithValue({ isRestoreUnavailable: true })
      }

      return rejectWithValue({ message: getFriendlyAuthError(error) })
    }
  },
  {
    condition: (_, { getState }) => {
      const adminAuth = getState().adminAuth
      return !adminAuth?.isAuthenticated && !adminAuth?.isRestoringSession && !adminAuth?.hasTriedRestore
    },
  },
)

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState: adminAuthInitialState,
  reducers: {
    clearAdminAuthError(state) {
      state.error = ''
    },
    clearAdminSession(state) {
      state.user = null
      state.isAuthenticated = false
      state.isLoading = false
      state.isRestoringSession = false
      state.error = ''
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.isLoading = true
        state.error = ''
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isLoading = false
        state.hasTriedRestore = true
        state.error = ''
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = action.payload ?? GENERIC_AUTH_ERROR
      })
      .addCase(logoutAdmin.pending, (state) => {
        state.isLoading = true
        state.error = ''
      })
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.hasTriedRestore = true
        state.error = ''
      })
      .addCase(logoutAdmin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload ?? 'No pudimos cerrar sesión. Intentá nuevamente.'
      })
      .addCase(restoreAdminSession.pending, (state) => {
        state.isRestoringSession = true
        state.error = ''
      })
      .addCase(restoreAdminSession.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.isRestoringSession = false
        state.hasTriedRestore = true
        state.error = ''
      })
      .addCase(restoreAdminSession.rejected, (state, action) => {
        state.user = null
        state.isAuthenticated = false
        state.isRestoringSession = false
        state.hasTriedRestore = true
        state.error = action.payload?.isRestoreUnavailable ? '' : action.payload?.message ?? ''
      })
  },
})

export const { clearAdminAuthError, clearAdminSession } = adminAuthSlice.actions

export const selectAdminAuthState = (state) => state.adminAuth

export const selectAdminAuth = createSelector([selectAdminAuthState], (adminAuth) => ({
  user: adminAuth.user,
  isAuthenticated: adminAuth.isAuthenticated,
  isLoading: adminAuth.isLoading,
  isRestoringSession: adminAuth.isRestoringSession,
  hasTriedRestore: adminAuth.hasTriedRestore,
  error: adminAuth.error,
}))

export default adminAuthSlice.reducer
