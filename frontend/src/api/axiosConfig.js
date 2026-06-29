import axios from 'axios'

let isRefreshing = false
let queue = []

const BASE_URL = import.meta.env.VITE_API_URL
const COLD_START_RETRY_DELAY_MS = 12000  // Railway cold start thường mất 10-15s

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isNetworkError = (error) =>
  !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.code)

// ── Request interceptor ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token && !config.headers?.Authorization) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
  }
  return config
})

// ── Response interceptor ───────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const requestUrl = original?.url || ''

    const isAuthRequest =
      requestUrl.startsWith('/auth/') || requestUrl.includes('/api/auth/')

    // ── Cold start: network error trên mọi request ─────────────────
    // Server chưa boot xong → đợi rồi retry 1 lần, KHÔNG đụng đến token
    if (isNetworkError(error) && !original._coldRetry) {
      original._coldRetry = true
      await sleep(COLD_START_RETRY_DELAY_MS)
      return api(original)
    }

    // Auth request lỗi → trả về luôn, không retry
    if (isAuthRequest) return Promise.reject(error)

    // ── 401: access token hết hạn → thử refresh ───────────────────
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true

      const refreshToken = localStorage.getItem('refreshToken')

      // Không có refreshToken → logout luôn
      if (!refreshToken) {
        forceLogout()
        return Promise.reject(error)
      }

      // Đang refresh rồi → xếp hàng chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      isRefreshing = true

      try {
        const res = await api.post('/api/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
          timeout: 15000, // tăng lên 15s để chờ cold start
        })

        const newAccess = res.data.accessToken
        const newRefresh = res.data.refreshToken

        localStorage.setItem('accessToken', newAccess)
        localStorage.setItem('refreshToken', newRefresh)

        const { default: useAuthStore } = await import('../store/authStore')
        useAuthStore.setState({ accessToken: newAccess, refreshToken: newRefresh, isLoggedIn: true })

        // Giải phóng queue với token mới
        queue.forEach((p) => p.resolve(newAccess))
        queue = []

        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)

      } catch (refreshError) {
        const status = refreshError.response?.status

        if (status === 401 || status === 403) {
          // Refresh token thực sự hết hạn / invalid → logout
          queue.forEach((p) => p.reject(refreshError))
          queue = []
          forceLogout()
        } else {
          // Network error hoặc server vẫn đang boot → KHÔNG logout
          // Reset _retry để request có thể thử lại khi user reload
          original._retry = false
          queue.forEach((p) => p.reject(refreshError))
          queue = []
        }

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

async function forceLogout() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('role')

  try {
    const { default: useCartStore } = await import('../store/useCartStore')
    useCartStore.getState().resetCart()
  } catch (_) {}

  window.location.href = '/login'
}

export default api