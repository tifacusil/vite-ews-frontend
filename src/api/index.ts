import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

/** Limpia sesión y redirige a login; evita múltiples redirecciones simultáneas. */
let _redirecting = false
function clearSessionAndRedirect() {
  if (_redirecting) return
  _redirecting = true
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('jwt_user')
  localStorage.removeItem('jwt_expires_at')
  window.location.href = '/login'
}

/** Interceptor de request:
 *  1. Comprueba si el token está expirado antes de enviar la petición.
 *  2. Si no ha expirado, adjunta el Bearer token.
 */
api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt_token')
  if (!token) return config

  // Verificar expiración proactivamente
  const expiresAt = localStorage.getItem('jwt_expires_at')
  if (expiresAt) {
    const expMs = new Date(expiresAt).getTime()
    // Margen de 30 s para evitar race conditions de red
    if (Date.now() >= expMs - 30_000) {
      clearSessionAndRedirect()
      // Cancela la petición en curso
      return Promise.reject(new axios.Cancel('Token expirado'))
    }
  }

  config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Interceptor de response:
 *  401 → limpiar sesión y redirigir (una sola vez aunque lleguen varios 401 en paralelo).
 */
api.interceptors.response.use(
  res => res,
  err => {
    if (!axios.isCancel(err) && err.response?.status === 401) {
      clearSessionAndRedirect()
    }
    return Promise.reject(err)
  }
)

export default api
