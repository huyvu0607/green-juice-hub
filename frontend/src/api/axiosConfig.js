import axios from 'axios'

let isRefreshing = false
let queue = []

const BASE_URL = import.meta.env.VITE_API_URL 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Tự động gắn accessToken vào mỗi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Tự động refresh token khi hết hận
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const requestUrl = original?.url || ''
    const isAuthRequest =
      requestUrl.startsWith('/auth/') || requestUrl.includes('/api/auth/')

    if (isAuthRequest) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      isRefreshing = true
      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('role')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post('${BASE_URL}/api/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })

        const newAccess = res.data.accessToken
        const newRefresh = res.data.refreshToken

        localStorage.setItem('accessToken', newAccess)
        localStorage.setItem('refreshToken', newRefresh)

        // Cập nhật Zustand store
        const { default: useAuthStore } = await import('../store/authStore')
        useAuthStore.setState({
          accessToken: newAccess,
          refreshToken: newRefresh, // ← thêm dòng này
          isLoggedIn: true
        })
        queue.forEach((p) => p.resolve(newAccess))
        queue = []

        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      }
      catch {
        queue.forEach((p) => p.reject())
        queue = []
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('role')

        // Reset cart trước khi redirect
        const { default: useCartStore } = await import('../store/useCartStore')
        useCartStore.getState().resetCart()

        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api