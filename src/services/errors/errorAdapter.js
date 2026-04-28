export function normalizeAppError(error, source = 'unknown') {
  if (!error) {
    return {
      source,
      message: 'Ocurrió un error inesperado.',
      status: null,
      details: null,
    }
  }

  const axiosResponse = error.response
  const backendPayload = axiosResponse?.data
  const backendMessage =
    backendPayload?.message ??
    backendPayload?.error ??
    backendPayload?.details?.message ??
    null

  return {
    source,
    message:
      backendMessage ??
      error.message ??
      'Ocurrió un error inesperado. Intentá nuevamente en unos segundos.',
    status: axiosResponse?.status ?? error.status ?? null,
    details: backendPayload?.details ?? backendPayload ?? null,
  }
}
