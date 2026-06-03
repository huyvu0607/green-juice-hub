import { create } from 'zustand'
import authApi from '../api/authApi'
import userApi from '../api/userApi'

const useAuthStore = create((set) => ({
  user: localStorage.getItem('role') ? { role: localStorage.getItem('role') } : null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoggedIn: !!localStorage.getItem('accessToken'),

  setAuth: (accessToken, refreshToken, role) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('role', role)
    set({ accessToken, refreshToken, user: { role }, isLoggedIn: true })
  },

  
  setUser: (user) => set({ user }),

  fetchMe: async () => {
    try {
      const res = await userApi.getMe()
      set({ user: res.data })
    } catch {
      // token hết hạn hoặc lỗi — bỏ qua
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
    }
  },
}))

export default useAuthStore