import { create } from 'zustand'
import authApi from '../api/authApi'
import userApi from '../api/userApi'
import useCartStore from './useCartStore'

const isNetworkError = (err) =>
  !err.response &&
  (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !err.code)

const useAuthStore = create((set) => ({
  user: localStorage.getItem('role') ? { role: localStorage.getItem('role') } : null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoggedIn: !!localStorage.getItem('accessToken'),

  setAuth: async (accessToken, refreshToken, role) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('role', role)
    set({ accessToken, refreshToken, user: { role }, isLoggedIn: true })

    try {
      const res = await userApi.getMe()
      set({ user: res.data })
    } catch {
      // giữ nguyên { role } nếu lỗi
    }
  },

  setUser: (user) => set({ user }),

  fetchMe: async () => {
    try {
      const res = await userApi.getMe()
      set({ user: res.data })
    } catch (err) {
      const status = err.response?.status

      // Network error hoặc cold start → server chưa boot xong, giữ nguyên state
      if (isNetworkError(err)) return

      // Còn refreshToken → axiosConfig đang tự xử lý refresh, không cần logout
      const hasRefreshToken = !!localStorage.getItem('refreshToken')
      if (hasRefreshToken) return

      // Không còn refreshToken + 401/403 → thực sự hết phiên → logout
      if (status === 401 || status === 403) {
        useAuthStore.getState().logout()
      }
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // BE lỗi vẫn logout FE bình thường
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('role')
      set({ accessToken: null, refreshToken: null, user: null, isLoggedIn: false })
      useCartStore.getState().resetCart()
    }
  },
}))

export default useAuthStore