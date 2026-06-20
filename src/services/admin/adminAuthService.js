import { axiosClient } from '../api/axiosClient'

const ADMIN_AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
}

function normalizeAdminUser(payload) {
  const candidate = payload?.data?.user ?? payload?.data ?? payload?.user ?? payload

  if (!candidate?.email || !candidate?.role) {
    throw {
      source: 'adminAuthService',
      message: 'No pudimos interpretar la sesión administrativa.',
      status: null,
      details: { reason: 'Missing admin email or role' },
    }
  }

  return {
    email: candidate.email,
    role: candidate.role,
  }
}

export async function loginAdmin(credentials) {
  const response = await axiosClient.post(ADMIN_AUTH_ENDPOINTS.login, credentials)

  return normalizeAdminUser(response.data)
}

export async function logoutAdmin() {
  const response = await axiosClient.post(ADMIN_AUTH_ENDPOINTS.logout, {})

  return response.data
}

export async function getCurrentAdmin() {
  const response = await axiosClient.get(ADMIN_AUTH_ENDPOINTS.me)

  return normalizeAdminUser(response.data)
}
