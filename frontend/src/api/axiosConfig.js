import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
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

// Tự động refresh token khi hết hạn
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

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('role')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post('http://localhost:8081/api/auth/refresh', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })

        localStorage.setItem('accessToken', res.data.accessToken)
        localStorage.setItem('refreshToken', res.data.refreshToken)

        original.headers.Authorization = `Bearer ${res.data.accessToken}`
        return api(original)
      } catch {

        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('role')
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
