import axios from 'axios'
import { normalizeAppError } from '../errors/errorAdapter'
import { logAppError } from '../errors/errorLogger'

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export const axiosClient = axios.create({
  baseURL: defaultBaseUrl,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = normalizeAppError(error, 'axiosClient')
    logAppError(normalizedError)
    return Promise.reject(normalizedError)
  },
)
